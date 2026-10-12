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
 * PURPOSE.  See the GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with gnome-shell extension gnome-night-light-slider.  If not, see
 * <http://www.gnu.org/licenses/>.
 */
'use strict';

import cairo from 'cairo';
import Clutter from 'gi://Clutter';
import Gio from 'gi://Gio';
import GObject from 'gi://GObject';
import St from 'gi://St';

import { QuickSettingsItem } from 'resource:///org/gnome/shell/ui/quickSettings.js';
import { Temperature } from '../utils/temperature.js';
import { Theme } from '../utils/theme.js';

const COLOR_SCHEMA = 'org.gnome.settings-daemon.plugins.color';
const TEMPERATURE_KEY = 'night-light-temperature';
const EXTENSION_SCHEMA_ID =
  'org.gnome.shell.extensions.com.github.kyleabaker.gnome-night-light-slider';

const VALUE_DEFAULT = 0.5;
const CACHED_WIDTH_DEFAULT = 200;

/** @typedef {import('gi://Gio')} Gio */
/** @typedef {import('gi://St')} St */

/**
 * @class NlsQuickSettingsItem
 * @brief Class representing the Night Light slider item housed within the submenu configuration drawer.
 */
export const NlsQuickSettingsItem = GObject.registerClass(
  class NlsQuickSettingsItem extends QuickSettingsItem {
    /**
     * Initialize interactive Cairo-rendered temperature slider and gradient bar with full accessibility.
     * @param {any} [params] - Configuration parameters including the extension instance.
     */
    _init(params) {
      const { extension, ...restParams } = params || {};
      super._init({ can_focus: true, ...restParams });

      const _ =
        extension && typeof extension.gettext === 'function'
          ? extension.gettext.bind(extension)
          : /** @param {string} s */ (s) => s;

      /** @type {Array<{ emitter: Gio.Settings, id: number }>} */
      this._settingsConnections = [];
      /** @type {boolean} */
      this._syncing = false;
      /** @type {number} */
      this._value = VALUE_DEFAULT;
      /** @type {boolean} */
      this._dragging = false;
      /** @type {number} */
      this._cachedWidth = CACHED_WIDTH_DEFAULT;
      /** @type {boolean} */
      this._clicked = false;

      /** @type {Gio.Settings} */
      this._colorSettings = new Gio.Settings({ schema_id: COLOR_SCHEMA });

      const schemaDir = extension?.dir.get_child('schemas');
      let schemaSource = null;
      if (schemaDir) {
        schemaSource = Gio.SettingsSchemaSource.new_from_directory(
          schemaDir.get_path() || '',
          Gio.SettingsSchemaSource.get_default(),
          false
        );
      }
      const schema = schemaSource?.lookup(EXTENSION_SCHEMA_ID, true);
      if (schema) {
        this._extensionSettings = new Gio.Settings({
          settings_schema: schema,
        });
      } else {
        this._extensionSettings = new Gio.Settings({
          schema_id: EXTENSION_SCHEMA_ID,
        });
      }

      // Create interactive drawing area
      this._drawingArea = new St.DrawingArea({
        height: 28,
        x_expand: true,
        reactive: true,
        can_focus: false,
      });
      this._drawingArea.set_style('margin: 4px 16px 8px 16px;');

      // Mouse/Touch interaction handling (accounting for reversed direction)
      /**
       * @param {Clutter.Actor} actor
       * @param {Clutter.Event} event
       */
      const updateValueFromEvent = (actor, event) => {
        const [success, absX] = actor.transform_stage_point(
          event.get_coords()[0],
          event.get_coords()[1]
        );
        if (!success) return;

        const padding = 12;
        const usableWidth = Math.max(
          1,
          (this._cachedWidth ?? CACHED_WIDTH_DEFAULT) - padding * 2
        );
        let val = (absX - padding) / usableWidth;
        val = Math.max(0, Math.min(1, val));

        // Reverse direction mapping
        val = 1.0 - val;

        if (this._value !== val) {
          this._value = val;
          this._drawingArea?.queue_repaint();
          this._onSliderChanged();
        }
      };

      this._drawingArea.connect('button-press-event', (actor, event) => {
        this._dragging = true;
        this._clicked = true;
        this.grab_key_focus();
        this.remove_style_pseudo_class('focus');
        this._drawingArea?.queue_repaint();
        updateValueFromEvent(actor, event);
        return Clutter.EVENT_STOP;
      });

      this._drawingArea.connect('motion-event', (actor, event) => {
        if (this._dragging) {
          updateValueFromEvent(actor, event);
          return Clutter.EVENT_STOP;
        }
        return Clutter.EVENT_PROPAGATE;
      });

      this._drawingArea.connect('button-release-event', () => {
        this._dragging = false;
        return Clutter.EVENT_STOP;
      });

      // Keyboard accessibility navigation on the parent QuickSettingsItem container
      this.connect('key-press-event', (_actor, event) => {
        this._clicked = false;
        this.add_style_pseudo_class('focus');
        this._drawingArea?.queue_repaint();

        const symbol = event.get_key_symbol();
        const step = 0.05;
        let newVal;

        if (
          this._value !== null &&
          this._value !== undefined &&
          (symbol === Clutter.KEY_Left || symbol === Clutter.KEY_Down)
        ) {
          newVal = Math.min(1, this._value + step);
        } else if (
          this._value !== null &&
          this._value !== undefined &&
          (symbol === Clutter.KEY_Right || symbol === Clutter.KEY_Up)
        ) {
          newVal = Math.max(0, this._value - step);
        } else if (symbol === Clutter.KEY_Home) {
          newVal = 1;
        } else if (symbol === Clutter.KEY_End) {
          newVal = 0;
        } else {
          return Clutter.EVENT_PROPAGATE;
        }

        if (this._value !== newVal) {
          this._value = newVal;
          this._drawingArea?.queue_repaint();
          this._onSliderChanged();
        }
        return Clutter.EVENT_STOP;
      });

      // Manage keyboard focus states and trigger repaints
      this.connect('key-focus-in', () => {
        if (!this._clicked) {
          this.add_style_pseudo_class('focus');
          this._drawingArea?.queue_repaint();
        }
      });

      this.connect('key-focus-out', () => {
        this._clicked = false;
        this.remove_style_pseudo_class('focus');
        this._drawingArea?.queue_repaint();
      });

      // Cairo rendering pass for gradient bar, handle thumb, and dynamic accent focus ring
      this._drawingArea.connect('repaint', (area) => {
        const [width, height] = area.get_surface_size();
        this._cachedWidth = width;
        const cr = area.get_context();
        if (!cr) return;

        const barHeight = 8;
        const barY = (height - barHeight) / 2;
        const padding = 12;
        const usableWidth = Math.max(1, width - padding * 2);

        // 1. Draw Reversed Temperature Gradient Bar
        const inverted = this._isInverted();
        const r1 = inverted ? 0.96 : 0.92;
        const g1 = inverted ? 0.87 : 0.44;
        const b1 = inverted ? 0.68 : 0.01;

        const r2 = inverted ? 0.92 : 0.96;
        const g2 = inverted ? 0.44 : 0.87;
        const b2 = inverted ? 0.01 : 0.68;

        const pat = new cairo.LinearGradient(padding, 0, width - padding, 0);
        pat.addColorStopRGB(0, r1, g1, b1);
        pat.addColorStopRGB(1, r2, g2, b2);

        cr.setSource(pat);
        const radius = 4;
        cr.newPath();
        cr.arc(
          width - padding - radius,
          barY + radius,
          radius,
          -Math.PI / 2,
          0
        );
        cr.arc(
          width - padding - radius,
          barY + barHeight - radius,
          radius,
          0,
          Math.PI / 2
        );
        cr.arc(
          padding + radius,
          barY + barHeight - radius,
          radius,
          Math.PI / 2,
          Math.PI
        );
        cr.arc(
          padding + radius,
          barY + radius,
          radius,
          Math.PI,
          (3 * Math.PI) / 2
        );
        cr.closePath();
        cr.fill();

        // 2. Draw Slider Handle (Thumb) with reversed offset mapping
        const thumbX =
          padding + (1.0 - (this._value ?? VALUE_DEFAULT)) * usableWidth;
        const thumbY = height / 2;
        const thumbRadius = 10;

        // Thumb shadow / outer ring
        cr.setSourceRGBA(0, 0, 0, 0.15);
        cr.arc(thumbX, thumbY + 1, thumbRadius, 0, 2 * Math.PI);
        cr.fill();

        // Thumb fill
        cr.setSourceRGB(0.98, 0.98, 0.98);
        cr.arc(thumbX, thumbY, thumbRadius, 0, 2 * Math.PI);
        cr.fill();

        // Thumb border
        cr.setSourceRGBA(0, 0, 0, 0.2);
        cr.setLineWidth(1);
        cr.arc(thumbX, thumbY, thumbRadius, 0, 2 * Math.PI);
        cr.stroke();

        // 3. Dynamic Theme Accent Focus Outline (Drawn ONLY when focused via keyboard)
        const hasKeyboardFocus =
          !this._clicked &&
          (this.has_style_pseudo_class('focus') || this.has_key_focus?.());
        if (hasKeyboardFocus) {
          const [r, g, b, a] = Theme.getThemeAccentColor(this);
          cr.setSourceRGBA(r, g, b, a);
          cr.setLineWidth(2.0);
          cr.newPath();
          const boxRadius = 6;
          const bx = 1.0;
          const by = 1.0;
          const bw = width - 2;
          const bh = height - 2;
          cr.arc(bw - boxRadius, by + boxRadius, boxRadius, -Math.PI / 2, 0);
          cr.arc(
            bw - boxRadius,
            by + bh - boxRadius,
            boxRadius,
            0,
            Math.PI / 2
          );
          cr.arc(
            bx + boxRadius,
            by + bh - boxRadius,
            boxRadius,
            Math.PI / 2,
            Math.PI
          );
          cr.arc(
            bx + boxRadius,
            by + boxRadius,
            boxRadius,
            Math.PI,
            (3 * Math.PI) / 2
          );
          cr.closePath();
          cr.stroke();
        }

        cr.$dispose();
      });

      // Ensure it has no prior parent before adding
      const currentParent = this._drawingArea.get_parent();
      if (currentParent) {
        currentParent.remove_child(this._drawingArea);
      }
      this.add_child(this._drawingArea);

      // Connect settings changes
      this._settingsConnections.push(
        {
          emitter: this._colorSettings,
          id: this._colorSettings.connect(`changed::${TEMPERATURE_KEY}`, () =>
            this._sync()
          ),
        },
        {
          emitter: this._extensionSettings,
          id: this._extensionSettings.connect('changed::invert-slider', () => {
            this._drawingArea?.queue_repaint();
            this._sync();
          }),
        }
      );

      // Dynamically queue repaint whenever system accent color changes
      try {
        if (typeof St?.Settings?.get === 'function') {
          const stSettings = St.Settings.get();
          this._accentSettingsConnection = stSettings.connect(
            'notify::accent-color',
            () => {
              this._drawingArea?.queue_repaint();
            }
          );
        }
      } catch {
        // Fallback
      }

      try {
        let stage = null;
        if (typeof global !== 'undefined') {
          stage = global.stage;
        } else if (typeof this?.get_stage === 'function') {
          stage = this.get_stage();
        }

        if (stage && typeof St.ThemeContext?.get_for_stage === 'function') {
          const themeContext = St.ThemeContext.get_for_stage(stage);
          this._themeContextConnection = themeContext.connect('changed', () => {
            this._drawingArea?.queue_repaint();
          });
        }
      } catch {
        // Fallback
      }

      this.accessible_name = _('Night Light Temperature');
      this._sync();
    }

    /**
     * Check if slider inversion is enabled.
     * @returns {boolean}
     */
    _isInverted() {
      return this._extensionSettings
        ? !this._extensionSettings?.get_boolean('invert-slider')
        : true;
    }

    /**
     * Handler for slider value changes.
     */
    _onSliderChanged() {
      if (
        this._value === null ||
        this._value === undefined ||
        this._syncing ||
        !this._colorSettings
      )
        return;
      const temperature = Temperature.denormalize(
        this._value,
        this._isInverted()
      );
      this._colorSettings.set_uint(TEMPERATURE_KEY, temperature);
    }

    /**
     * Synchronize slider position with current temperature setting.
     */
    _sync() {
      if (
        this._value === null ||
        this._value === undefined ||
        !this._colorSettings
      )
        return;
      const temperature = this._colorSettings.get_uint(TEMPERATURE_KEY);
      if (!temperature) return;

      const val = Temperature.normalize(temperature, this._isInverted());
      if (Math.abs(this._value - val) > 0.0001) {
        this._syncing = true;
        this._value = val;
        this._drawingArea?.queue_repaint();
        this._syncing = false;
      }
    }

    /**
     * Disconnect all signal handlers and destroy widgets.
     */
    destroy() {
      this._settingsConnections?.forEach(({ emitter, id }) => {
        try {
          emitter?.disconnect(id);
        } catch {
          // ignore if already disconnected or destroyed
        }
      });
      this._settingsConnections = [];

      if (this._accentSettingsConnection) {
        try {
          St.Settings.get().disconnect(this._accentSettingsConnection);
        } catch {
          // ignore
        }
        this._accentSettingsConnection = null;
      }

      if (this._themeContextConnection) {
        try {
          let stage = null;
          if (typeof global !== 'undefined') {
            stage = global.stage;
          } else if (typeof this?.get_stage === 'function') {
            stage = this.get_stage();
          }

          if (stage && typeof St.ThemeContext?.get_for_stage === 'function') {
            St.ThemeContext.get_for_stage(stage).disconnect(
              this._themeContextConnection
            );
          }
        } catch {
          // ignore
        }
        this._themeContextConnection = null;
      }

      if (this._drawingArea) {
        this._drawingArea.destroy();
        this._drawingArea = null;
      }

      this._colorSettings = undefined;
      this._extensionSettings = null;

      super.destroy();
    }
  }
);
