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

import GObject from 'gi://GObject';
// eslint-disable-next-line no-unused-vars
import Clutter from 'gi://Clutter';
// eslint-disable-next-line no-unused-vars
import St from 'gi://St';
// eslint-disable-next-line no-unused-vars
import Gio from 'gi://Gio';

import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import { SystemIndicator } from 'resource:///org/gnome/shell/ui/quickSettings.js';

import { NightLightItem } from './night-light-item.js';
import { logger } from '../utils/logger.js';

/** @typedef {import('gi://St')} St */
/** @typedef {import('gi://Gio')} Gio */
/** @typedef {import('gi://Clutter')} Clutter */

/**
 * @typedef {object} QuickSettings
 * @property {{ box: St.BoxLayout, _grid?: St.Widget }} menu
 * @property {{ container: Clutter.Actor }} [_volume]
 * @property {function(SystemIndicator, number): void} addExternalIndicator
 */

/**
 * Class representing the system indicator for Night Light
 */
export const Indicator = GObject.registerClass(
  class Indicator extends SystemIndicator {
    /**
     * Initialize the indicator
     */
    _init() {
      super._init();

      /** @type {boolean} */
      this.ENABLE_LOGGING = true;

      /** @type {InstanceType<typeof NightLightItem>} */
      const item = new NightLightItem();
      this.quickSettingsItems.push(item);

      /** @type {St.Widget|null} */
      let menuContainer = null;

      /** @type {number} */
      let volumeIndex = -1;

      /** @type {QuickSettings} */
      const quickSettings = /** @type {any} */ (
        Main.panel.statusArea.quickSettings
      );

      // Try getting index from Quick Settings menu box
      if (quickSettings.menu.box) {
        logger.debug(
          this.ENABLE_LOGGING,
          'Inserting Night Light Slider into main menu box'
        );
        menuContainer = quickSettings.menu.box;
        // Find volume again within the correct menuBox if the first attempt failed
        /** @type {Clutter.Actor[]} */
        let children = menuContainer.get_children();
        volumeIndex = children.indexOf(quickSettings._volume?.container);
      }

      // Try getting index from Quick Settings menu grid
      if (volumeIndex === -1 && quickSettings.menu._grid) {
        logger.debug(
          this.ENABLE_LOGGING,
          'Inserting Night Light Slider into main menu grid'
        );
        menuContainer = quickSettings.menu._grid;
        /** @type {Clutter.Actor[]} */
        let children = menuContainer.get_children();
        // Try locating Volume index in another way
        volumeIndex = children.findIndex((c) =>
          c.constructor.name.includes('OutputStreamSlider')
        );
      }

      // Try adding to Quick Settings menu by index or fallback
      // to standard addExternal.
      if (volumeIndex === -1) {
        logger.debug(
          this.ENABLE_LOGGING,
          'Menu box not found, adding Night Light Slider via external control.'
        );
        // addExternalControl is the standard for sliders,
        // quickSettings.addExternalControl(item);

        // addExternalIndicator is for top-bar icons.
        /** @type {number} */
        const colSpan = 2;
        quickSettings.addExternalIndicator(this, colSpan);
      } else {
        // Insert after volume, or at index 1 (usually after brightness) as a fallback
        menuContainer.insert_child_at_index(item, volumeIndex + 1);
        menuContainer.layout_manager.child_set_property(
          menuContainer,
          menuContainer.get_children()[volumeIndex + 1],
          'column-span',
          2
        );
      }
    }

    /**
     * Destroy all quick settings items and the indicator
     */
    destroy() {
      this.quickSettingsItems?.forEach((item) => item.destroy());
      this.quickSettingsItems = [];
      super.destroy();
    }
  }
);
