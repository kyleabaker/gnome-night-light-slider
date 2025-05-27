import GObject from 'gi://GObject';

import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import { SystemIndicator } from 'resource:///org/gnome/shell/ui/quickSettings.js';

import { NightLightItem } from './night-light-item.js';
import { debug, error } from '../utils/log.js';

/**
 * Class representing the system indicator for Night Light
 */
export const Indicator = GObject.registerClass(
  class Indicator extends SystemIndicator {
    _init() {
      super._init();

      const quickSettings = Main.panel.statusArea.quickSettings;
      const colSpan = 2;

      // Create the Night Light slider item
      const item = new NightLightItem();
      this.quickSettingsItems.push(item);

      // Retrieve all current items in the Quick Settings grid
      const items = quickSettings.menu._grid.get_children();

      // Attempt to find the Brightness slider
      const brightnessItem = quickSettings._brightness?.quickSettingsItems?.[0];
      const brightnessIndex = items.indexOf(brightnessItem);

      // Attempt to find the Volume slider
      const volumeItem = quickSettings._volume?.quickSettingsItems?.[0];
      const volumeIndex = items.indexOf(volumeItem);

      let insertAfterIndex = -1;

      // Determine the appropriate insertion point
      if (brightnessIndex >= 0) {
        insertAfterIndex = brightnessIndex;
        debug('Inserting after Brightness slider.');
      } else if (volumeIndex >= 0) {
        insertAfterIndex = volumeIndex;
        debug('Brightness slider not found. Inserting after Volume slider.');
      } else {
        debug(
          'Neither Brightness nor Volume slider found. Adding at bottom of Quick Settings.'
        );
      }

      // Insert the Night Light slider at the determined position
      if (insertAfterIndex >= 0) {
        const nextItem = items[insertAfterIndex + 1] || null;
        if (nextItem) {
          quickSettings.menu.insertItemBefore(item, nextItem, colSpan);
        } else {
          quickSettings.menu._grid.add(item, {
            column: 0,
            row: items.length,
            colSpan,
          });
        }
      } else {
        quickSettings.addExternalIndicator(this, colSpan);
      }
    }

    // Destroy all quick settings items and the indicator
    destroy() {
      this.quickSettingsItems.forEach((item) => item.destroy());
      this.quickSettingsItems = [];
      super.destroy();
    }
  }
);
