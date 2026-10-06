/*
 * GNOME Night Light Slider for GNOME Shell
 *
 * Copyright (C) 2025
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

import Gio from 'gi://Gio';
import GObject from 'gi://GObject';

import { QuickSlider } from 'resource:///org/gnome/shell/ui/quickSettings.js';

import { Temperature } from '../utils/temperature.js';

const ICON_NAME = 'night-light-symbolic';
const COLOR_SCHEMA = 'org.gnome.settings-daemon.plugins.color';
const TEMPERATURE_KEY = 'night-light-temperature';
const ENABLE_KEY = 'night-light-enabled';

/** @typedef {import('gi://Gio')} Gio */
/** @typedef {import('gi://St')} St */

/**
 * Class representing the Night Light slider item
 */
export const NightLightItem = GObject.registerClass(
  class NightLightItem extends QuickSlider {
    /**
     * Initialize the slider item
     */
    _init() {
      super._init({ iconName: ICON_NAME });

      // Store signal handler IDs for proper disconnection
      /** @type {number[]} */
      this._settingsConnections = [];
      /** @type {number|null} */
      this._sliderConnection = null;

      /** @type {boolean} */
      this._syncing = false;
      /** @type {number|null} */
      this._lastTemperature = null;

      // Initialize GSettings for color schema
      /** @type {Gio.Settings} */
      this._settings = new Gio.Settings({ schema_id: COLOR_SCHEMA });

      // Update visibility based on current settings
      this._updateVisibility();

      // Connect to changes in the 'night-light-enabled' setting
      this._settingsConnections.push(
        this._settings.connect(`changed::${ENABLE_KEY}`, () =>
          this._updateVisibility()
        )
      );

      // Connect to changes in the 'night-light-temperature' setting
      this._settingsConnections.push(
        this._settings.connect(`changed::${TEMPERATURE_KEY}`, () =>
          this._sync()
        )
      );

      // Connect to slider value changes
      this._sliderConnection = this.slider.connect(
        'notify::value',
        this._onSliderChanged.bind(this)
      );

      // Set accessible name for the slider
      this.slider.accessible_name = _('Night Light');

      // Synchronize slider with current temperature setting
      this._sync();
    }

    /**
     * Update visibility of the slider based on 'night-light-enabled' setting
     */
    _updateVisibility() {
      const enabled = this._settings?.get_boolean(ENABLE_KEY) || false;
      if (this.visible !== enabled) {
        this.visible = enabled;
      }
    }

    /**
     * Handler for slider value changes
     */
    _onSliderChanged() {
      if (this._syncing) return;

      const value = this.slider.value;
      const temperature = Temperature.denormalize(value);

      if (this._lastTemperature === temperature) return;

      this._lastTemperature = temperature;
      this._settings?.set_uint(TEMPERATURE_KEY, temperature);
    }

    /**
     * Synchronize slider position with current temperature setting
     */
    _sync() {
      const temperature = this._settings?.get_uint(TEMPERATURE_KEY);

      if (!temperature || this._lastTemperature === temperature) return;

      this._lastTemperature = temperature;
      const value = Temperature.normalize(temperature);

      if (Math.abs(this.slider.value - value) > 0.0001) {
        this._syncing = true;
        try {
          this.slider.value = value;
        } finally {
          this._syncing = false;
        }
      }
    }

    /**
     * Disconnect all signal handlers and destroy the slider
     */
    destroy() {
      if (this._sliderConnection) {
        this.slider.disconnect(this._sliderConnection);
        this._sliderConnection = null;
      }

      this._settingsConnections?.forEach((id) => {
        if (id) {
          this._settings?.disconnect(id);
        }
      });
      this._settingsConnections = [];
      super.destroy();
    }
  }
);
