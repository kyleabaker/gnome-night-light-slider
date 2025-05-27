import GObject from 'gi://GObject';

import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import { SystemIndicator } from 'resource:///org/gnome/shell/ui/quickSettings.js';

import { NightLightItem } from './night-light-item.js';
import { logger } from '../utils/logger.js';

/**
 * Class representing the system indicator for Night Light
 */
export const Indicator = GObject.registerClass(
  class Indicator extends SystemIndicator {
    _init() {
      super._init();

      const item = new NightLightItem();
      this.quickSettingsItems.push(item);

      const quickSettings = Main.panel.statusArea.quickSettings;
      const colSpan = 2;

      try {
        // Retrieve all current items in the Quick Settings grid
        const items = quickSettings.menu._grid.get_children();

        // Attempt to find the Brightness slider
        const brightnessItem =
          quickSettings._brightness?.quickSettingsItems?.[0];
        const brightnessIndex = items.indexOf(brightnessItem);
        const nextItem =
          brightnessIndex >= 0 ? items[brightnessIndex + 1] : null;

        if (brightnessItem && nextItem) {
          logger.debug('Adding Night Light slider after Brightness slider.');
          quickSettings.menu.insertItemBefore(item, nextItem, colSpan);
        } else {
          // Attempt to find the Volume slider
          const volumeItem = quickSettings._volume?.quickSettingsItems?.[0];
          if (volumeItem) {
            logger.debug('Adding Night Light slider after Volume slider.');
            quickSettings.menu.insertItemAfter(item, volumeItem, colSpan);
          } else {
            logger.debug(
              'Adding Night Light slider at bottom of Quick Settings.'
            );
            quickSettings.addExternalIndicator(this, colSpan);
          }
        }
      } catch (error) {
        logger.error('Failed to insert Night Light slider.', error);
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
