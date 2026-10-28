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

import Adw from 'gi://Adw';
import Gtk from 'gi://Gtk';
import Gio from 'gi://Gio'; // eslint-disable-line no-unused-vars

import { ExtensionPreferences } from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';

import { createSettingsData } from './src/settings/data.js';

/** @typedef {import('gi://Adw')} Adw */
/** @typedef {import('gi://Gtk')} Gtk */
/** @typedef {import('gi://GObject')} GObject */
/** @typedef {import('gi://Gio')} Gio */
/** @typedef {import('./src/settings/data.js').SettingsData} SettingsData */
/** @typedef {import('./src/settings/data.js').SettingItem} SettingItem */

/**
 * Preferences window for GNOME Night Light Slider
 */
export default class Prefs extends ExtensionPreferences {
  /** @type {Gtk.Switch | null} */
  enableLoggingSwitch = null;

  /** @type {Gtk.Switch | null} */
  invertSliderSwitch = null;

  /** @type {Adw.EntryRow | null} */
  autoActiveEntry = null;

  /** @type {Adw.EntryRow | null} */
  autoInactiveEntry = null;

  /** @type {Adw.EntryRow | null} */
  customActiveEntry = null;

  /** @type {Adw.EntryRow | null} */
  customInactiveEntry = null;

  /**
   * Fill preferences window
   *
   * @param {Adw.PreferencesWindow} window
   */
  async fillPreferencesWindow(window) {
    const settings = this.getSettings();
    const settingsData = createSettingsData(settings);

    const width = 750;
    const height = 620;
    window.set_default_size(width, height);

    const page = Adw.PreferencesPage.new();
    page.set_title('GNOME Night Light Slider');

    // Settings group 1: General (Logging & Slider Inversion)
    const group1 = Adw.PreferencesGroup.new();
    group1.set_title('General');
    group1.set_description(
      'Configure extension behavior and slider orientation.'
    );

    this.enableLoggingSwitch = this.addBooleanSwitch(
      group1,
      'Enable Logging',
      settingsData.ENABLE_LOGGING
    );

    this.invertSliderSwitch = this.addBooleanSwitch(
      group1,
      'Invert Slider Direction',
      settingsData.INVERT_SLIDER
    );

    page.add(group1);

    // Settings group 2: Status Message Templates
    const group2 = Adw.PreferencesGroup.new();
    group2.set_title('Status Templates');
    group2.set_description(
      'Customize status bar text. You can use {time} as a dynamic placeholder.'
    );

    this.autoActiveEntry = this.addEntryRow(
      group2,
      'Automatic: Active (Sunrise)',
      settingsData.STATUS_AUTOMATIC_ACTIVE
    );

    this.autoInactiveEntry = this.addEntryRow(
      group2,
      'Automatic: Inactive (Sunset)',
      settingsData.STATUS_AUTOMATIC_INACTIVE
    );

    this.customActiveEntry = this.addEntryRow(
      group2,
      'Custom Schedule: Active',
      settingsData.STATUS_CUSTOM_ACTIVE
    );

    this.customInactiveEntry = this.addEntryRow(
      group2,
      'Custom Schedule: Inactive',
      settingsData.STATUS_CUSTOM_INACTIVE
    );

    page.add(group2);

    // Reset button
    this.addResetButton(window, settings, settingsData);

    window.add(page);
  }

  /**
   * Add reset button
   *
   * @param {Adw.PreferencesWindow} window
   * @param {Gio.Settings} settings
   * @param {SettingsData} settingsData
   */
  addResetButton(window, settings, settingsData) {
    const button = new Gtk.Button({ vexpand: true, valign: Gtk.Align.END });
    button.set_icon_name('edit-clear');

    button.connect('clicked', () => {
      settingsData.ENABLE_LOGGING.set(false);
      settingsData.INVERT_SLIDER.set(false);

      settings.reset('status-automatic-active');
      settings.reset('status-automatic-inactive');
      settings.reset('status-custom-active');
      settings.reset('status-custom-inactive');

      if (this.enableLoggingSwitch) {
        this.enableLoggingSwitch.set_active(settingsData.ENABLE_LOGGING.get());
      }
      if (this.invertSliderSwitch) {
        this.invertSliderSwitch.set_active(settingsData.INVERT_SLIDER.get());
      }
      if (this.autoActiveEntry) {
        this.autoActiveEntry.set_text(
          settingsData.STATUS_AUTOMATIC_ACTIVE.get()
        );
      }
      if (this.autoInactiveEntry) {
        this.autoInactiveEntry.set_text(
          settingsData.STATUS_AUTOMATIC_INACTIVE.get()
        );
      }
      if (this.customActiveEntry) {
        this.customActiveEntry.set_text(
          settingsData.STATUS_CUSTOM_ACTIVE.get()
        );
      }
      if (this.customInactiveEntry) {
        this.customInactiveEntry.set_text(
          settingsData.STATUS_CUSTOM_INACTIVE.get()
        );
      }
    });

    const content = window.get_content();
    const header = content
      ? /** @type {Adw.HeaderBar | null} */ (
          this.findWidgetByType(content, Adw.HeaderBar)
        )
      : null;
    if (header) header.pack_start(button);

    return button;
  }

  /**
   * Add boolean switch
   *
   * @param {Adw.PreferencesGroup} group
   * @param {string} labelText
   * @param {SettingItem} settingItem
   * @returns {Gtk.Switch}
   */
  addBooleanSwitch(group, labelText, settingItem) {
    const gtkSwitch = new Gtk.Switch({ hexpand: true, halign: Gtk.Align.END });
    gtkSwitch.set_active(settingItem.get());
    gtkSwitch.set_valign(Gtk.Align.CENTER);

    gtkSwitch.connect('state-set', (sw) => {
      const newval = sw.get_active();
      if (newval != settingItem.get()) {
        settingItem.set(newval);
      }
    });

    const row = Adw.ActionRow.new();
    row.set_title(labelText);
    row.add_suffix(gtkSwitch);
    group.add(row);

    return gtkSwitch;
  }

  /**
   * Add entry row
   *
   * @param {Adw.PreferencesGroup} group
   * @param {string} title
   * @param {SettingItem} settingItem
   * @returns {Adw.EntryRow}
   */
  addEntryRow(group, title, settingItem) {
    const row = new Adw.EntryRow();
    row.set_title(title);
    row.set_text(settingItem.get());

    row.connect('changed', (entry) => {
      const val = entry.get_text();
      if (val !== settingItem.get()) {
        settingItem.set(val);
      }
    });

    group.add(row);
    return row;
  }

  /**
   * Find widget by type
   *
   * @param {Gtk.Widget} parent
   * @param {any} type
   * @returns {Gtk.Widget | null}
   */
  findWidgetByType(parent, type) {
    for (const child of parent) {
      if (child instanceof type) return child;

      /** @type {Gtk.Widget | null} */
      const match = this.findWidgetByType(child, type);
      if (match) return match;
    }
    return null;
  }
}
