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

import { Extension } from 'resource:///org/gnome/shell/extensions/extension.js';

import { Indicator } from './src/models/indicator.js';
import { logger } from './src/utils/logger.js';

/** @typedef {import('gi://St')} St */
/** @typedef {import('gi://Gio')} Gio */
/** @typedef {import('gi://Shell')} Shell */

/**
 * The metadata object for the extension, from metadata.json.
 * @typedef {object} ExtensionMetadata
 * @property {string} uuid
 * @property {string} path
 * @property {string} name
 * @property {string} description
 * @property {string} [url]
 * @property {string} [gettext-domain]
 * @property {string[]} shell-version
 * @property {number} [version]
 */

export default class NightLightSliderGnomeExtension extends Extension {
  /**
   * @param {ExtensionMetadata} metadata
   */
  constructor(metadata) {
    super(metadata);
    /** @type {InstanceType<typeof Indicator>|null} */
    this._indicator = null;
    /** @type {boolean} */
    this.ENABLE_LOGGING = true; //TODO pull from settings instead of static
  }

  /**
   * Enable the extension
   */
  enable() {
    logger.debug(this.ENABLE_LOGGING, 'Extension enabled');
    if (!this._indicator) {
      this._indicator = new Indicator();
    }
  }

  /**
   * Disable the extension
   */
  disable() {
    logger.debug(this.ENABLE_LOGGING, 'Extension disabled');
    if (this._indicator) {
      this._indicator.destroy();
      this._indicator = null;
    }
  }
}
