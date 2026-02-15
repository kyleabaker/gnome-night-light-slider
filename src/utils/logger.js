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

/** @typedef {import('gi://St')} St */
/** @typedef {import('gi://Gio')} Gio */
/** @typedef {import('gi://Shell')} Shell */

/** @type {string} */
const PREFIX = '[GnomeNightLightSlider]';

/**
 * Logger utility object
 */
export const logger = {
  /**
   * @param {boolean} isEnabled
   * @param {string} message
   */
  log: (isEnabled, message) => {
    if (!isEnabled) return;
    console.log(`${PREFIX} ${message}`);
  },

  /**
   * @param {boolean} isEnabled
   * @param {string} message
   */
  debug: (isEnabled, message) => {
    if (!isEnabled) return;
    console.debug(`${PREFIX} ${message}`);
  },

  /**
   * @param {boolean} isEnabled
   * @param {string} message
   */
  info: (isEnabled, message) => {
    if (!isEnabled) return;
    console.info(`${PREFIX} ${message}`);
  },

  /**
   * @param {boolean} isEnabled
   * @param {string} message
   */
  warn: (isEnabled, message) => {
    if (!isEnabled) return;
    console.warn(`${PREFIX} ${message}`);
  },

  /**
   * @param {boolean} isEnabled
   * @param {string} message
   * @param {unknown} [exception]
   */
  error: (isEnabled, message, exception = null) => {
    if (!isEnabled) return;
    console.error(`${PREFIX} ${message}:\n${exception}`);
  },
};
