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

/** @typedef {import('gi://St')} St */
/** @typedef {import('gi://Gio')} Gio */
/** @typedef {import('gi://Shell')} Shell */

/**
 * Utility class for temperature normalization and denormalization supporting slider inversion.
 */
export class Temperature {
  /** @type {number} */
  static MIN_TEMP = 1700;
  /** @type {number} */
  static MAX_TEMP = 4700;
  /** @type {number} */
  static TEMP_RANGE = this.MAX_TEMP - this.MIN_TEMP;

  /**
   * Normalize temperature to a value between 0 and 1
   *
   * @param {number} temp
   * @param {boolean} [inverted=false]
   * @returns {number}
   */
  static normalize(temp, inverted = false) {
    const ratio = (temp - this.MIN_TEMP) / this.TEMP_RANGE;
    return inverted ? ratio : 1 - ratio;
  }

  /**
   * Denormalize value between 0 and 1 to actual temperature
   *
   * @param {number} value
   * @param {boolean} [inverted=false]
   * @returns {number}
   */
  static denormalize(value, inverted = false) {
    const val = inverted ? value : 1 - value;
    return Math.round(val * this.TEMP_RANGE + this.MIN_TEMP);
  }
}
