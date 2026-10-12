/*
 * GNOME Night Light Slider for GNOME Shell
 *
 * Copyright (C) 2026
 *   Kyle Baker <https://github.com/kyleabaker/gnome-night-light-slider>
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

import Gio from 'gi://Gio';
import St from 'gi://St';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';

const ACCENT_COLOR_MAP = {
  blue: [53 / 255, 132 / 255, 228 / 255, 1.0], // #3584e4 (GNOME default)
  teal: [48 / 255, 130 / 255, 128 / 255, 1.0], // #308280
  green: [75 / 255, 133 / 255, 1 / 255, 1.0], // #4b8501
  yellow: [159 / 255, 108 / 255, 0 / 255, 1.0], // #9f6c00
  orange: [211 / 255, 70 / 255, 21 / 255, 1.0], // #d34615
  red: [218 / 255, 52 / 255, 80 / 255, 1.0], // #da3450
  pink: [179 / 255, 76 / 255, 179 / 255, 1.0], // #b34cb3
  purple: [119 / 255, 100 / 255, 216 / 255, 1.0], // #7764d8
  slate: [101 / 255, 123 / 255, 105 / 255, 1.0], // #657b69
  brown: [146 / 255, 113 / 255, 74 / 255, 1.0], // #92714a
};

const ACCENT_ENUM_MAP = {
  0: ACCENT_COLOR_MAP.blue,
  1: ACCENT_COLOR_MAP.teal,
  2: ACCENT_COLOR_MAP.green,
  3: ACCENT_COLOR_MAP.yellow,
  4: ACCENT_COLOR_MAP.orange,
  5: ACCENT_COLOR_MAP.red,
  6: ACCENT_COLOR_MAP.pink,
  7: ACCENT_COLOR_MAP.purple,
  8: ACCENT_COLOR_MAP.slate,
  108: ACCENT_COLOR_MAP.brown,
};

export class Theme {
  /** @type {St.Widget | null} */
  static _accentProvider = null;

  /**
   * Dynamically extracts the active theme accent color from the stylesheet.
   * @param {St.Widget} [contextWidget] - Any widget currently on the stage
   * @returns {number[]} [r, g, b, a] normalized to 0.0 - 1.0
   */
  static getThemeAccentColor(contextWidget) {
    try {
      // Lazily create a hidden dummy widget on first call
      if (!Theme._accentProvider) {
        Theme._accentProvider = new St.Widget({
          style_class: 'night-light-accent-provider',
          visible: false, // Hidden from view, but still processed by shell
        });

        // CRITICAL: The widget MUST be attached to the stage hierarchy
        // so GNOME Shell's CSS engine computes its theme node.
        const stage = contextWidget?.get_stage?.() || global.stage;
        if (stage) {
          stage.add_child(Theme._accentProvider);
        }
      }

      // Force/pull the computed theme node
      const themeNode = Theme._accentProvider?.get_theme_node();
      if (themeNode) {
        const col = themeNode.get_background_color();
        // If a valid color was resolved by the stylesheet
        if (col && col.alpha > 0) {
          return [
            col.red / 255,
            col.green / 255,
            col.blue / 255,
            col.alpha / 255,
          ];
        }
      }
    } catch {
      // Fallback if stage isn't ready or initialization fails
    }

    // Ultimate fallback if CSS isn't loaded yet (GNOME Blue)
    return this.getThemeAccentColorFallbacks(contextWidget);
  }

  /**
   * Dynamically extracts the active theme accent color from the system theme.
   * Evaluates St.ThemeContext, active live stage elements, and system settings.
   * @param {any} contextWidget
   * @returns {number[]} [r, g, b, a] normalized to 0.0 - 1.0
   */
  static getThemeAccentColorFallbacks(contextWidget) {
    // 1. Primary: Extract directly from active St.ThemeContext (GNOME Shell native accent color)
    try {
      let stage = null;
      if (typeof global !== 'undefined') {
        stage = global.stage;
      } else if (typeof contextWidget?.get_stage === 'function') {
        stage = contextWidget.get_stage();
      }

      let themeContext = null;
      if (stage && typeof St.ThemeContext?.get_for_stage === 'function') {
        themeContext = St.ThemeContext.get_for_stage(stage);
      } else if (typeof St.ThemeContext === 'function') {
        themeContext = new St.ThemeContext();
      }

      if (themeContext && typeof themeContext.get_accent_color === 'function') {
        const [accentColor] = themeContext.get_accent_color();
        if (
          accentColor &&
          !(
            accentColor.red === 0 &&
            accentColor.green === 0 &&
            accentColor.blue === 0 &&
            accentColor.alpha === 0
          )
        ) {
          return [
            accentColor.red / 255,
            accentColor.green / 255,
            accentColor.blue / 255,
            accentColor.alpha !== undefined ? accentColor.alpha / 255 : 1.0,
          ];
        }
      }
    } catch {
      // Continue to fallback strategies
    }

    // 2. Secondary: Inspect current theme node for outline or box-shadow color
    try {
      if (typeof contextWidget.get_theme_node === 'function') {
        const themeNode = contextWidget.get_theme_node();
        if (themeNode) {
          const shadow =
            typeof themeNode.get_box_shadow === 'function'
              ? themeNode.get_box_shadow()
              : null;
          if (shadow?.color && shadow.color.alpha > 0) {
            const col = shadow.color;
            return [
              col.red / 255,
              col.green / 255,
              col.blue / 255,
              col.alpha / 255,
            ];
          }
          const outline =
            typeof themeNode.get_outline_color === 'function'
              ? themeNode.get_outline_color()
              : null;
          if (outline && outline.alpha > 0) {
            return [
              outline.red / 255,
              outline.green / 255,
              outline.blue / 255,
              outline.alpha / 255,
            ];
          }
        }
      }
    } catch {
      // Continue to fallback strategies
    }

    // 3. Tertiary: Try to find any active quick settings toggle on the stage holding the live accent background
    try {
      /** @type {any} */
      const quickSettings = Main?.panel?.statusArea?.quickSettings;
      if (quickSettings?._grid) {
        const children = quickSettings._grid.get_children();
        for (const child of children) {
          if (child.checked && typeof child.get_theme_node === 'function') {
            const node = child.get_theme_node();
            if (node) {
              const col = node.get_background_color();
              if (
                col &&
                !(
                  col.red === 0 &&
                  col.green === 0 &&
                  col.blue === 0 &&
                  col.alpha === 0
                ) &&
                !(col.red === col.green && col.green === col.blue)
              ) {
                return [
                  col.red / 255,
                  col.green / 255,
                  col.blue / 255,
                  col.alpha / 255,
                ];
              }
            }
          }
        }
      }
    } catch {
      // Continue to fallback strategies
    }

    // 4. Quaternary: Check St.Settings accent_color property
    try {
      if (typeof St?.Settings?.get === 'function') {
        const stSettings = St.Settings.get();
        const accentEnum = stSettings.accent_color;
        if (accentEnum !== undefined && ACCENT_ENUM_MAP[accentEnum]) {
          return ACCENT_ENUM_MAP[accentEnum];
        }
      }
    } catch {
      // Continue to fallback strategies
    }

    // 5. Quinary: Check desktop interface GSettings key
    try {
      const interfaceSettings = new Gio.Settings({
        schema_id: 'org.gnome.desktop.interface',
      });
      const themeAccentColor = interfaceSettings.get_string('accent-color');
      // Assert that this string is a valid key of ACCENT_COLOR_MAP
      const colorKey = /** @type {keyof typeof ACCENT_COLOR_MAP} */ (
        themeAccentColor
      );
      if (colorKey && ACCENT_COLOR_MAP[colorKey]) {
        return ACCENT_COLOR_MAP[colorKey];
      }
    } catch {
      // Continue to final fallback
    }

    // Standard GNOME default accent color (Blue)
    return ACCENT_COLOR_MAP.blue;
  }
}
