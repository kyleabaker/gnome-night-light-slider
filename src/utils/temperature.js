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

/**
 * Utility class for temperature normalization and denormalization
 */
export class Temperature {
  static MIN_TEMP = 1700;
  static MAX_TEMP = 4700;

  // Normalize temperature to a value between 0 and 1
  static normalize(temp) {
    //TODO add settings to invert slider behavior
    // return 1 - (temp - this.MIN_TEMP) / (this.MAX_TEMP - this.MIN_TEMP);
    return (temp - this.MIN_TEMP) / (this.MAX_TEMP - this.MIN_TEMP);
  }

  // Denormalize value between 0 and 1 to actual temperature
  static denormalize(value) {
    //TODO add settings to invert slider behavior
    // return Math.round(
    //   (1 - value) * (this.MAX_TEMP - this.MIN_TEMP) + this.MIN_TEMP
    // );
    return Math.round(value * (this.MAX_TEMP - this.MIN_TEMP) + this.MIN_TEMP);
  }
}
