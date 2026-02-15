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

import Adw from 'gi://Adw';
import Gtk from 'gi://Gtk';

import { ExtensionPreferences } from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';

import { createSettingsData } from './src/settings/data.js';

/** @typedef {import('gi://Adw')} Adw */
/** @typedef {import('gi://Gtk')} Gtk */
/** @typedef {import('gi://GObject')} GObject */
/** @typedef {import('./src/settings/data.js').SettingsData} SettingsData */
/** @typedef {import('./src/settings/data.js').SettingItem} SettingItem */

/**
 * Preferences window for GNOME Night Light Slider
 */
export default class Prefs extends ExtensionPreferences {
  /**
   * Fill preferences window
   *
   * @param {Adw.PreferencesWindow} window
   */
  async fillPreferencesWindow(window) {
    const settingsData = createSettingsData(this.getSettings());

    const width = 750;
    const height = 320;
    window.set_default_size(width, height);

    const page = Adw.PreferencesPage.new();
    page.set_title('GNOME Night Light Slider');

    // Settings group 1: Enable Logging
    const group1 = Adw.PreferencesGroup.new();
    this.enableLoggingSwitch = this.addBooleanSwitch(
      group1,
      'Enable Logging',
      settingsData.ENABLE_LOGGING
    );
    page.add(group1);

    // Reset button
    this.addResetButton(window, settingsData);

    window.add(page);
  }

  /**
   * Add reset button
   *
   * @param {Adw.PreferencesWindow} window
   * @param {SettingsData} settingsData
   */
  addResetButton(window, settingsData) {
    const button = new Gtk.Button({ vexpand: true, valign: Gtk.Align.END });
    button.set_icon_name('edit-clear');

    button.connect('clicked', () => {
      settingsData.ENABLE_LOGGING.set(false);

      this.enableLoggingSwitch.set_active(settingsData.ENABLE_LOGGING.get());
    });

    const header = this.findWidgetByType(window.get_content(), Adw.HeaderBar);
    if (header) header.pack_start(button);

    return button;
  }

  /**
   * Add slider
   *
   * @param {Adw.PreferencesGroup} group
   * @param {string} labelText
   * @param {SettingItem} settingsData
   * @param {number} lower
   * @param {number} upper
   * @param {number} decimalDigits
   */
  addSlider(group, labelText, settingsData, lower, upper, decimalDigits) {
    const scale = new Gtk.Scale({
      digits: decimalDigits,
      adjustment: new Gtk.Adjustment({ lower, upper }),
      value_pos: Gtk.PositionType.RIGHT,
      hexpand: true,
      halign: Gtk.Align.END,
    });
    scale.set_draw_value(true);
    scale.set_value(settingsData.get());
    scale.set_size_request(400, 15);

    scale.connect('value-changed', (sw) => {
      const newval = sw.get_value();
      if (newval != settingsData.get()) {
        settingsData.set(newval);
      }
    });

    const row = Adw.ActionRow.new();
    row.set_title(labelText);
    row.add_suffix(scale);
    group.add(row);

    return scale;
  }

  /**
   * Add slider
   *
   * @param {Adw.PreferencesGroup} group
   * @param {string} labelText
   * @param {SettingItem} settingsData
   * @param {string[]} values
   */
  addComboBox(group, labelText, settingsData, values) {
    const combo = new Gtk.ComboBoxText({
      hexpand: true,
      halign: Gtk.Align.END,
      valign: Gtk.Align.CENTER,
    });

    values.forEach((val, i) => {
      combo.append_text(val);
      if (settingsData.get() === val) combo.set_active(i);
    });

    combo.connect('changed', () => {
      const selected = combo.get_active_text();
      if (selected) settingsData.set(selected);
    });

    const row = Adw.ActionRow.new();
    row.set_title(labelText);
    row.add_suffix(combo);
    group.add(row);

    return combo;
  }

  /**
   * Add boolean switch
   *
   * @param {Adw.PreferencesGroup} group
   * @param {string} labelText
   * @param {SettingItem} settingsData
   */
  addBooleanSwitch(group, labelText, settingsData) {
    const gtkSwitch = new Gtk.Switch({ hexpand: true, halign: Gtk.Align.END });
    gtkSwitch.set_active(settingsData.get());
    gtkSwitch.set_valign(Gtk.Align.CENTER);

    gtkSwitch.connect('state-set', (sw) => {
      const newval = sw.get_active();
      if (newval != settingsData.get()) {
        settingsData.set(newval);
      }
    });

    const row = Adw.ActionRow.new();
    row.set_title(labelText);
    row.add_suffix(gtkSwitch);
    group.add(row);

    return gtkSwitch;
  }

  /**
   * Find widget by type
   *
   * @param {Gtk.Widget} parent
   * @param {Function} type
   */
  findWidgetByType(parent, type) {
    for (const child of [...parent]) {
      if (child instanceof type) return child;

      const match = this.findWidgetByType(child, type);
      if (match) return match;
    }
    return null;
  }
}
