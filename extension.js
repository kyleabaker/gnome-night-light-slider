import { Extension } from 'resource:///org/gnome/shell/extensions/extension.js';

import { Indicator } from './src/models/indicator.js';
import { debug } from './src/utils/log.js';

export default class GnomeNightLightSliderExtension extends Extension {
  constructor(metadata) {
    super(metadata);
    this._indicator = null;
  }

  // Enable the extension
  enable() {
    debug('Extension enabled');
    if (!this._indicator) {
      this._indicator = new Indicator();
    }
  }

  // Disable the extension
  disable() {
    debug('Extension disabled');
    if (this._indicator) {
      this._indicator.destroy();
      this._indicator = null;
    }
  }
}
