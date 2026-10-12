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

import { Extension } from 'resource:///org/gnome/shell/extensions/extension.js';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';

import { NlsSystemIndicator } from './src/models/nlsSystemIndicator.js';
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
    /** @type {InstanceType<typeof NlsSystemIndicator>|null} */
    this._indicator = null;
    /** @type {number[]} */
    this._settingsHandlers = [];
  }

  /**
   * Enable the extension and register Quick Settings external indicator.
   */
  enable() {
    this._settings = this.getSettings();

    // Set initial logging state
    logger.setEnabled(this._settings.get_boolean('enable-logging'));

    // Keep logging synced in real-time
    this._settingsHandlers.push(
      this._settings.connect('changed::enable-logging', () => {
        logger.setEnabled(
          this._settings?.get_boolean('enable-logging') || false
        );
      })
    );

    // Refresh status indicator when template preferences change
    const templateKeys = [
      'status-automatic-active',
      'status-automatic-inactive',
      'status-custom-active',
      'status-custom-inactive',
    ];

    for (const key of templateKeys) {
      this._settingsHandlers.push(
        this._settings.connect(`changed::${key}`, () => {
          if (
            this._indicator &&
            typeof this._indicator.updateStatus === 'function'
          ) {
            this._indicator.updateStatus();
          }
        })
      );
    }

    logger.debug('Extension enabled');
    if (!this._indicator && Main.panel.statusArea.quickSettings) {
      this._indicator = new NlsSystemIndicator(this);
      Main.panel.statusArea.quickSettings.addExternalIndicator(this._indicator);
    }
  }

  /**
   * Disable the extension and clean up UI indicator references.
   */
  disable() {
    logger.debug('Extension disabled');

    if (this._settings && this._settingsHandlers.length > 0) {
      for (const handlerId of this._settingsHandlers) {
        this._settings.disconnect(handlerId);
      }
      this._settingsHandlers = [];
    }
    this._settings = null;

    if (this._indicator) {
      this._indicator.destroy();
      this._indicator = null;
    }
  }
}
