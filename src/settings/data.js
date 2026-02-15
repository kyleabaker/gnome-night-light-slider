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

import Gio from 'gi://Gio'; // eslint-disable-line no-unused-vars

/**
 * @typedef {Object} SettingItem
 * @property {() => any} get
 * @property {(v: any) => void} set
 */

/** @typedef {Object.<string, SettingItem>} SettingsData */

/**
 * Create the settings data object for the extension preferences window
 *
 * @param {Gio.Settings} settings
 * @returns {SettingsData} settings data object
 */
export function createSettingsData(settings) {
  /** @type {[string, string][]} */
  const booleanKeys = [['ENABLE_LOGGING', 'enable-logging']];

  /** @type {SettingsData} */
  const data = {};

  for (const [prop, key] of booleanKeys) {
    data[prop] = {
      get: () => settings.get_boolean(key),
      set: (v) => settings.set_boolean(key, v),
    };
  }

  return data;
}
