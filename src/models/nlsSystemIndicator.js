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

import GLib from 'gi://GLib';
import GObject from 'gi://GObject';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as QuickSettings from 'resource:///org/gnome/shell/ui/quickSettings.js';

import { NlsQuickMenuToggle } from './nlsQuickMenuToggle.js';

/**
 * @class NlsSystemIndicator
 * @brief System indicator that mounts the custom split-menu toggle button into the Quick Settings menu
 *        at the exact grid index of the default Night Light button, while suppressing the stock toggle.
 */
export const NlsSystemIndicator = GObject.registerClass(
  class NlsSystemIndicator extends QuickSettings.SystemIndicator {
    /** @type {number} */
    _retryCount = 0;

    /**
     * Initialize indicator, locate the stock night light toggle position, insert custom toggle at that exact position,
     * and hide the stock toggle.
     * @param {import('@girs/gnome-shell/extensions/extension').Extension | any} [extension] - Reference to main extension instance.
     */
    _init(extension) {
      super._init();
      this._extension = extension;

      this.quickToggle = new NlsQuickMenuToggle(extension);
      // FIXME: pushing this.quickToggle generates a warning. Removing it breaks quickSettings toggle. Warning:
      // clutter_actor_insert_child_below: assertion 'child->priv->parent == NULL' failed
      this.quickSettingsItems.push(this.quickToggle);

      this._stockNightLight = null;
      this._stockParent = null;
      this._initId = 0;
      this._retryCount = 0;

      // Attempt immediate replacement, with fallback polling if shell is still starting up
      this._tryReplaceStockToggle();
    }

    /**
     * Refresh status label on the toggle when preference templates change.
     */
    updateStatus() {
      if (
        this.quickToggle &&
        typeof (/** @type {any} */ (this.quickToggle).updateStatus) ===
          'function'
      ) {
        /** @type {any} */ (this.quickToggle).updateStatus();
      }
    }

    /**
     * Try to locate and replace the stock night light toggle.
     * @returns {boolean} true if successful, false if stock toggle is not yet available.
     */
    _tryReplaceStockToggle() {
      const quickSettings = Main.panel.statusArea?.quickSettings;
      this._stockNightLight = quickSettings?._nightLight;

      if (this._stockNightLight) {
        this._stockNightLight.visible = false;

        const stockActor = this._stockNightLight.quickSettingsItems?.[0];
        if (stockActor) {
          stockActor.visible = false;

          this._stockParent = stockActor.get_parent();
          if (this._stockParent) {
            const children = this._stockParent.get_children();
            const stockIndex = children.indexOf(stockActor);

            if (stockIndex !== -1 && this.quickToggle) {
              const currentParent = this.quickToggle.get_parent();
              if (currentParent) {
                currentParent.remove_child(this.quickToggle);
              }

              this._stockParent.insert_child_at_index(
                this.quickToggle,
                stockIndex
              );
              return true;
            }
          }
        }
      }

      // Stop polling after 50 attempts (~50 idle cycles)
      if (this._retryCount >= 50) {
        return false;
      }
      this._retryCount++;

      if (!this._initId) {
        this._initId = GLib.idle_add(GLib.PRIORITY_DEFAULT_IDLE, () => {
          this._initId = 0;

          if (this._tryReplaceStockToggle()) {
            return GLib.SOURCE_REMOVE;
          }

          if (this._retryCount < 50) {
            return GLib.SOURCE_CONTINUE;
          }

          return GLib.SOURCE_REMOVE;
        });
      }

      return false;
    }

    /**
     * Restore stock night light toggle visibility and position upon destruction.
     */
    destroy() {
      if (this._initId) {
        GLib.Source.remove(this._initId);
        this._initId = 0;
      }

      if (this._stockNightLight) {
        const stockActor = this._stockNightLight.quickSettingsItems?.[0];
        if (stockActor) {
          stockActor.visible = true;
        }
        this._stockNightLight.visible = true;
        this._stockNightLight = null;
      }

      if (this._stockParent && this.quickToggle) {
        if (this.quickToggle.get_parent() === this._stockParent) {
          this._stockParent.remove_child(this.quickToggle);
        }
        this._stockParent = null;
      }

      this.quickSettingsItems.forEach((item) => item.destroy());
      super.destroy();
    }
  }
);
