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

/** @type {string} */
const PREFIX = '[GnomeNightLightSlider]';

let _isEnabled = false;

/**
 * Logger utility object
 */
export const logger = {
  /**
   * Set the global logging enabled state.
   *
   * @param {boolean} enabled
   */
  setEnabled(enabled) {
    _isEnabled = enabled;
  },

  /**
   * @param {string} message
   */
  log: (message) => {
    if (!_isEnabled) return;
    console.log(`${PREFIX} ${message}`);
  },

  /**
   * @param {string} message
   */
  debug: (message) => {
    if (!_isEnabled) return;
    console.debug(`${PREFIX} ${message}`);
  },

  /**
   * @param {string} message
   */
  info: (message) => {
    if (!_isEnabled) return;
    console.info(`${PREFIX} ${message}`);
  },

  /**
   * @param {string} message
   */
  warn: (message) => {
    if (!_isEnabled) return;
    console.warn(`${PREFIX} ${message}`);
  },

  /**
   * @param {string} message
   * @param {unknown} [exception]
   */
  error: (message, exception = null) => {
    if (!_isEnabled) return;
    if (exception !== null) {
      console.error(`${PREFIX} ${message}:`, exception);
    } else {
      console.error(`${PREFIX} ${message}`);
    }
  },
};
