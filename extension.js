import { Extension } from 'resource:///org/gnome/shell/extensions/extension.js';

import { Indicator } from './src/models/indicator.js';
import { logger } from './src/utils/logger.js';

export default class NightLightSliderGnomeExtension extends Extension {
  constructor(metadata) {
    super(metadata);
    this._indicator = null;
  }

  // Enable the extension
  enable() {
    logger.debug('Extension enabled');
    if (!this._indicator) {
      this._indicator = new Indicator();
    }
  }

  // Disable the extension
  disable() {
    logger.debug('Extension disabled');
    if (this._indicator) {
      this._indicator.destroy();
      this._indicator = null;
    }
  }
}
