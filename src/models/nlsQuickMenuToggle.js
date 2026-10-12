/*
 * GNOME Night Light Slider for GNOME Shell
 *
 * Copyright (C) 2026
 *     Kyle Baker <https://github.com/kyleabaker/gnome-night-light-slider>
 *
 * This file is part of the gnome-shell extension gnome-night-light-slider.
 *
 * gnome-shell extension gnome-night-light-slider is free software: you can
 * redistribute it and/or modify it under the terms of the GNU
 * General Public License as published by the Free Software
 * Foundation, either version 3 of the License, or (at your option)
 * any later version.
 *
 * gnome-shell extension gnome-night-light-slider is distributed in the hope that it
 * will be useful, but WITHOUT ANY WARRANTY; without even the
 * implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR
 * PURPOSE. See the GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with gnome-shell extension gnome-night-light-slider. If not, see
 * <http://www.gnu.org/licenses/>.
 */
'use strict';

import Clutter from 'gi://Clutter';
import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import GObject from 'gi://GObject';
import St from 'gi://St';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as QuickSettings from 'resource:///org/gnome/shell/ui/quickSettings.js';
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';

import { ColorSettings } from '../utils/colorSettings.js';
import { logger } from '../utils/logger.js';
import { NlsQuickSettingsItem } from './nlsQuickSettingsItem.js';

const COLOR_SCHEMA = 'org.gnome.settings-daemon.plugins.color';
const ENABLE_KEY = 'night-light-enabled';
const ICON_NAME = 'night-light-symbolic';

/**
 * @class NlsQuickMenuToggle
 * @brief Quick settings menu split-toggle button with arrow expansion, temperature slider,
 *        gradient bar, schedule status, quick temporary pause buttons, and Display settings action.
 */
export const NlsQuickMenuToggle = GObject.registerClass(
  class NlsQuickMenuToggle extends QuickSettings.QuickMenuToggle {
    /**
     * Initialize the split menu toggle item and construct the submenu container,
     * status message, pause section, temperature slider/gradient, separator, and settings action.
     *
     * @param {import('@girs/gnome-shell/extensions/extension').Extension | any} extension Reference to main extension instance.
     */
    _init(extension) {
      const _ =
        extension && typeof extension.gettext === 'function'
          ? extension.gettext.bind(extension)
          : /** @param {string} s */ (s) => s;

      super._init({
        title: _('Night Light'),
        iconName: ICON_NAME,
        toggleMode: true,
      });

      this._extension = extension;
      /** @type {any} */
      this._binding = null;
      /** @type {any} */
      this._settingsConnections = [];
      /** @type {any} */
      this._extensionSettingsConnections = [];
      /** @type {number|null} */
      this._timeoutId = null;
      /** @type {number|null} */
      this._pauseTimeoutId = null;
      /** @type {number} */
      this._pauseSecondsRemaining = 0;
      /** @type {boolean} */
      this._originalStateBeforePause = false;
      /** @type {St.Button|null} */
      this._activePauseButton = null;

      /** @type {Gio.Settings | null} */
      this._settings = new Gio.Settings({ schema_id: COLOR_SCHEMA });
      /** @type {Gio.Settings | null} */
      this._extensionSettings =
        extension && typeof extension.getSettings === 'function'
          ? extension.getSettings()
          : null;

      this._binding = this._settings.bind(
        ENABLE_KEY,
        this,
        'checked',
        Gio.SettingsBindFlags.DEFAULT
      );

      this.menu.setHeader(ICON_NAME, _('Night Light'));

      if (this.menu._headerIcon) {
        this.menu._headerIcon.reactive = true;
        this.menu._headerIcon.set_track_hover(true);
        this.menu._headerIcon.connect('button-release-event', () => {
          if (!this._settings) return Clutter.EVENT_PROPAGATE;

          const current = this._settings.get_boolean(ENABLE_KEY);
          this._settings.set_boolean(ENABLE_KEY, !current);
          return Clutter.EVENT_STOP;
        });
      }

      this._sliderSection = new PopupMenu.PopupMenuSection();

      // Init color settings GeoClue Location cache with startup retries if GeoClue isn't ready yet on clean login
      const tryInitLocation = async (retries = 3, delaySec = 5) => {
        const success = await ColorSettings.updateLocationCache(() => {
          if (this._statusLabel && this._settings && !this._pauseTimeoutId) {
            this._statusLabel.text = ColorSettings.getNightLightScheduleStatus(
              this._settings,
              this._extensionSettings
            );
          }
        });

        if (!success && retries > 0) {
          GLib.timeout_add_seconds(GLib.PRIORITY_DEFAULT, delaySec, () => {
            void tryInitLocation(retries - 1, delaySec * 2);
            return GLib.SOURCE_REMOVE;
          });
        }
      };
      void tryInitLocation();

      this._statusLabel = new St.Label({
        text: ColorSettings.getNightLightScheduleStatus(
          this._settings,
          this._extensionSettings
        ),
        style_class: 'popup-menu-item-subtitle nls-status-lbl',
        x_align: Clutter.ActorAlign.START,
      });

      this._nightLightSlider = new NlsQuickSettingsItem({ extension });

      this._pauseHeaderLabel = new St.Label({
        text: _('Temporarily Pause'),
        style_class: 'popup-menu-item-subtitle nls-pause-header-lbl',
        x_align: Clutter.ActorAlign.START,
      });

      this._pauseBox = new St.BoxLayout({
        style_class: 'night-light-pause-box',
        x_align: Clutter.ActorAlign.CENTER,
        style: 'spacing: 6px; padding: 0px 16px 4px 16px;',
      });

      /** @type {any} */
      this._pauseButtons = [];
      const pauseOptions = [
        { label: '5m', seconds: 300 },
        { label: '15m', seconds: 900 },
        { label: '30m', seconds: 1800 },
        { label: '1h', seconds: 3600 },
      ];

      for (const opt of pauseOptions) {
        const btn = new St.Button({
          label: opt.label,
          style_class: 'button nls-pause-btn',
          can_focus: true,
          toggle_mode: true,
          x_align: Clutter.ActorAlign.CENTER,
          y_align: Clutter.ActorAlign.CENTER,
        });

        btn.connect('clicked', () => {
          if (this._activePauseButton === btn) {
            this._cancelPause();
          } else {
            this._startPause(opt.seconds, btn);
          }
        });

        // Ensure button has no prior parent
        const btnParent = btn.get_parent();
        if (btnParent) {
          btnParent.remove_child(btn);
        }

        this._pauseBox.add_child(btn);
        this._pauseButtons.push({ btn, seconds: opt.seconds });
      }

      this._pauseCountdownLabel = new St.Label({
        text: '',
        style_class: 'popup-menu-item-subtitle nls-pause-countdown-lbl',
        x_align: Clutter.ActorAlign.START,
      });
      this._pauseCountdownLabel.hide();

      [
        'night-light-schedule-automatic',
        'night-light-schedule-from',
        'night-light-schedule-to',
        ENABLE_KEY,
      ].forEach((key) => {
        this._settingsConnections.push(
          this._settings?.connect(`changed::${key}`, () => {
            if (
              key === ENABLE_KEY &&
              this._settings?.get_boolean(ENABLE_KEY) &&
              this._pauseTimeoutId
            ) {
              this._cancelPause();
              return;
            }
            if (this._statusLabel && !this._pauseTimeoutId && this._settings) {
              this._statusLabel.text =
                ColorSettings.getNightLightScheduleStatus(
                  this._settings,
                  this._extensionSettings
                );
            }
          })
        );
      });

      // Listen for custom template preference updates
      if (this._extensionSettings) {
        [
          'status-automatic-active',
          'status-automatic-inactive',
          'status-custom-active',
          'status-custom-inactive',
        ].forEach((key) => {
          this._extensionSettingsConnections.push(
            this._extensionSettings?.connect(`changed::${key}`, () => {
              if (
                this._statusLabel &&
                !this._pauseTimeoutId &&
                this._settings
              ) {
                this._statusLabel.text =
                  ColorSettings.getNightLightScheduleStatus(
                    this._settings,
                    this._extensionSettings
                  );
              }
            })
          );
        });
      }

      this._timeoutId = GLib.timeout_add_seconds(
        GLib.PRIORITY_DEFAULT,
        30,
        () => {
          if (this._statusLabel && this._settings && !this._pauseTimeoutId) {
            this._statusLabel.text = ColorSettings.getNightLightScheduleStatus(
              this._settings,
              this._extensionSettings
            );
            return GLib.SOURCE_CONTINUE;
          }
          return GLib.SOURCE_REMOVE;
        }
      );

      // Helper to safely add children to container with parent detachment
      /**
       * @param {Clutter.Actor} container
       * @param {Clutter.Actor} actor
       */
      const addSafely = (container, actor) => {
        const parent = actor.get_parent();
        if (parent) {
          parent.remove_child(actor);
        }
        container.add_child(actor);
      };

      addSafely(this._sliderSection.actor, this._statusLabel);
      addSafely(this._sliderSection.actor, this._nightLightSlider);
      addSafely(this._sliderSection.actor, this._pauseHeaderLabel);
      addSafely(this._sliderSection.actor, this._pauseBox);
      addSafely(this._sliderSection.actor, this._pauseCountdownLabel);

      // Ensure _sliderSection actor has no old parent before adding to menu
      if (this._sliderSection.actor.get_parent()) {
        this._sliderSection.actor
          .get_parent()
          ?.remove_child(this._sliderSection.actor);
      }
      this.menu.addMenuItem(this._sliderSection);

      const separator = new PopupMenu.PopupSeparatorMenuItem();
      if (separator.actor.get_parent()) {
        separator.actor.get_parent()?.remove_child(separator.actor);
      }
      this.menu.addMenuItem(separator);

      this._settingsAction = this.menu.addAction(_('Display Settings'), () => {
        Main.panel.statusArea.quickSettings?.menu.close();
        Main.overview.hide();

        try {
          Gio.AppInfo.launch_default_for_uri_async(
            'gnome-control-center://display',
            null,
            null,
            (_source, result) => {
              try {
                Gio.AppInfo.launch_default_for_uri_finish(result);
              } catch {
                let appInfo = Gio.AppInfo.create_from_commandline(
                  'gnome-control-center display',
                  'Display Settings',
                  Gio.AppInfoCreateFlags.NONE
                );
                let context = global.create_app_launch_context(0, -1);
                appInfo.launch([], context);
              }
            }
          );
        } catch (/** @type {any} */ e) {
          logger.error(`Failed to launch settings panel: ${e.message}`);
        }
      });
    }

    /**
     * External trigger called by system indicator when preferences change.
     */
    updateStatus() {
      if (this._statusLabel && this._settings && !this._pauseTimeoutId) {
        this._statusLabel.text = ColorSettings.getNightLightScheduleStatus(
          this._settings,
          this._extensionSettings
        );
      }
    }

    /**
     * Start temporary pause countdown.
     *
     * @param {number} totalSeconds
     * @param {St.Button} selectedBtn
     */
    _startPause(totalSeconds, selectedBtn) {
      if (this._pauseTimeoutId) {
        GLib.Source.remove(this._pauseTimeoutId);
        this._pauseTimeoutId = null;
      }

      this._originalStateBeforePause =
        this._settings?.get_boolean(ENABLE_KEY) || false;
      this._settings?.set_boolean(ENABLE_KEY, false);

      for (const item of this._pauseButtons) {
        if (item.btn === selectedBtn) {
          item.btn.checked = true;
        } else {
          item.btn.checked = false;
        }
      }
      this._activePauseButton = selectedBtn;
      this._pauseSecondsRemaining = totalSeconds;

      this._updatePauseCountdownText();
      this._pauseCountdownLabel?.show();

      this._pauseTimeoutId = GLib.timeout_add_seconds(
        GLib.PRIORITY_DEFAULT,
        1,
        () => {
          this._pauseSecondsRemaining = (this._pauseSecondsRemaining ?? 0) - 1;
          if (this._pauseSecondsRemaining <= 0) {
            this._cancelPause();
            return GLib.SOURCE_REMOVE;
          }
          this._updatePauseCountdownText();
          return GLib.SOURCE_CONTINUE;
        }
      );
    }

    /**
     * Update pause countdown text display with clean professional wording.
     */
    _updatePauseCountdownText() {
      const remaining = this._pauseSecondsRemaining ?? 0;
      const mins = Math.floor(remaining / 60);
      const secs = remaining % 60;
      const timeStr = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;

      if (this._pauseCountdownLabel) {
        this._pauseCountdownLabel.text = `Paused • Resuming normal state in ${timeStr}`;
      }
    }

    /**
     * Cancel pause and restore original state.
     */
    _cancelPause() {
      if (this._pauseTimeoutId) {
        GLib.Source.remove(this._pauseTimeoutId);
        this._pauseTimeoutId = null;
      }

      this._settings?.set_boolean(
        ENABLE_KEY,
        this._originalStateBeforePause || false
      );

      for (const item of this._pauseButtons) {
        item.btn.checked = false;
      }
      this._activePauseButton = null;
      this._pauseCountdownLabel?.hide();

      if (this._statusLabel && this._settings) {
        this._statusLabel.text = ColorSettings.getNightLightScheduleStatus(
          this._settings,
          this._extensionSettings
        );
      }
    }

    /**
     * Clean up bindings, popup menus, sections, timers, and GSettings references.
     */
    destroy() {
      if (this._pauseTimeoutId) {
        GLib.Source.remove(this._pauseTimeoutId);
        this._pauseTimeoutId = null;
      }

      if (this._timeoutId) {
        GLib.Source.remove(this._timeoutId);
        this._timeoutId = null;
      }

      if (this.menu) {
        this.menu.close();
      }

      if (this._binding) {
        this._binding.unbind();
        this._binding = null;
      }

      this._settingsConnections.forEach((/** @type {any} */ id) => {
        if (this._settings) {
          this._settings.disconnect(id);
        }
      });
      this._settingsConnections = [];

      this._extensionSettingsConnections.forEach((/** @type {any} */ id) => {
        if (this._extensionSettings) {
          this._extensionSettings.disconnect(id);
        }
      });
      this._extensionSettingsConnections = [];

      if (this._statusLabel) {
        this._statusLabel.destroy();
        this._statusLabel = null;
      }

      if (this._pauseHeaderLabel) {
        this._pauseHeaderLabel.destroy();
        this._pauseHeaderLabel = null;
      }

      if (this._pauseBox) {
        this._pauseBox.destroy();
        this._pauseBox = null;
      }

      if (this._pauseCountdownLabel) {
        this._pauseCountdownLabel.destroy();
        this._pauseCountdownLabel = null;
      }

      if (this._nightLightSlider) {
        this._nightLightSlider.destroy();
        this._nightLightSlider = null;
      }

      if (this._sliderSection) {
        this._sliderSection.destroy();
        this._sliderSection = null;
      }

      this._settings = null;
      this._extensionSettings = null;

      super.destroy();
    }
  }
);
