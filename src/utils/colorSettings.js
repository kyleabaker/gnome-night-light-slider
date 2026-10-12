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
 * PURPOSE. See the GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with gnome-shell extension gnome-night-light-slider. If not, see
 * <http://www.gnu.org/licenses/>.
 */
'use strict';

import Gio from 'gi://Gio';

import { calculateSunTimes } from './sunCalculator.js';
import { getGeoclueLocation } from './geoClueLocation.js';
import { logger } from './logger.js';

const ENABLE_KEY = 'night-light-enabled';
const AUTOMATIC_KEY = 'night-light-schedule-automatic';
const START_KEY = 'night-light-schedule-from';
const END_KEY = 'night-light-schedule-to';
const LOCATION_SCHEMA = 'org.gnome.system.location';

/** @type {{ lat: number, lon: number } | null} */
let _cachedGeoclueLocation = null;

/**
 * Default status message templates utilizing {time} placeholders.
 * These can be overridden by user preference strings or wrapped with _() for i18n.
 */
/** @type {Record<string, Record<string, string>>} */
const DEFAULT_TEMPLATES = {
  automatic: {
    active: 'Turns off at sunrise (in {time})',
    inactive: 'Turns on at sunset (in {time})',
  },
  custom: {
    active: 'Turns off in {time}',
    inactive: 'Turns on in {time}',
  },
  manual: {
    active: 'Active (Manual override)',
    inactive: 'Inactive (Manual override)',
  },
  fallback: {
    active: 'Night Light active',
    inactive: 'Night Light inactive',
  },
};

/**
 * Replaces placeholders like {time} in template strings with dynamic values.
 *
 * @param {string} template
 * @param {Record<string, string>} values
 * @returns {string}
 */
function formatTemplate(template, values) {
  return template.replace(/\{(\w+)\}/g, (match, key) => {
    return Object.hasOwn(values, key) ? values[key] : match;
  });
}

export class ColorSettings {
  /**
   * Call this asynchronously during extension startup or periodically
   * to keep the location cache fresh.
   *
   * @param {(() => void)?} [onUpdated] Optional callback triggered upon successful cache update
   * @returns {Promise<boolean>}
   */
  static async updateLocationCache(onUpdated = null) {
    try {
      const loc = await getGeoclueLocation();
      if (loc) {
        _cachedGeoclueLocation = loc;
        logger.log(
          `GeoClue: Location cache successfully updated to (lat: ${loc.lat}, lon: ${loc.lon})`
        );
        if (typeof onUpdated === 'function') {
          onUpdated();
        }
        return true;
      } else {
        logger.log(
          'GeoClue: Location returned null or invalid path, cache left unchanged.'
        );
        return false;
      }
    } catch (e) {
      logger.error('Failed to update location cache:', e);
      return false;
    }
  }

  /**
   * Calculate professional schedule status text based on configured Night Light settings.
   *
   * @param {Gio.Settings} colorSettings System Night Light settings
   * @param {Gio.Settings | null} [extensionSettings] Optional extension settings for custom template overrides
   * @returns {string}
   */
  static getNightLightScheduleStatus(colorSettings, extensionSettings = null) {
    let enabled = false;
    let automatic;

    /**
     * Helper to resolve template string from extension preferences or default fallback.
     *
     * @param {string} category
     * @param {'active' | 'inactive'} state
     * @returns {string}
     */
    const resolveTemplate = (category, state) => {
      const prefKey = `status-${category}-${state}`;
      if (extensionSettings) {
        try {
          if (extensionSettings.settings_schema?.has_key(prefKey)) {
            const customVal = extensionSettings.get_string(prefKey);
            if (customVal && customVal.trim() !== '') {
              return customVal;
            }
          }
        } catch {
          // Fall back to default if preference lookup fails
        }
      }
      return DEFAULT_TEMPLATES[
        /** @type {keyof typeof DEFAULT_TEMPLATES} */ (category)
      ][/** @type {any} */ (state)];
    };

    try {
      // 1. Read core Night Light GSettings states
      enabled = colorSettings.get_boolean(ENABLE_KEY);
      automatic = colorSettings.get_boolean(AUTOMATIC_KEY);

      // Default fallback schedule times (6:00 PM sunset / 6:00 AM sunrise)
      let start = 18.0;
      let end = 6.0;

      if (automatic) {
        // 2. Automatic mode: Resolve schedule dynamically via GeoClue coordinates & Sun calculation
        try {
          const schemaSource = Gio.SettingsSchemaSource.get_default();
          if (schemaSource?.lookup(LOCATION_SCHEMA, true)) {
            const locSettings = new Gio.Settings({ schema: LOCATION_SCHEMA });
            const isLocationEnabled = locSettings.get_boolean('enabled');

            if (isLocationEnabled && _cachedGeoclueLocation) {
              // Valid location service enabled and cached coordinates available
              const sunTimes = calculateSunTimes(
                _cachedGeoclueLocation.lat,
                _cachedGeoclueLocation.lon
              );
              start = sunTimes.sunset;
              end = sunTimes.sunrise;
              logger.log(
                `Using dynamic sun times from coordinates (lat: ${_cachedGeoclueLocation.lat}, lon: ${_cachedGeoclueLocation.lon}) -> Sunset: ${start.toFixed(2)}, Sunrise: ${end.toFixed(2)}`
              );
            } else {
              // Fallback triggered: Location services disabled or coordinates not yet cached
              logger.log(
                `Automatic schedule falling back to default hours (18:00 / 06:00). Reason: isLocationEnabled=${isLocationEnabled}, hasCachedLocation=${!!_cachedGeoclueLocation}`
              );
            }
          } else {
            logger.log(
              `Location schema '${LOCATION_SCHEMA}' not found; using default schedule hours.`
            );
          }
        } catch (/** @type {any} */ e) {
          logger.error(
            'Error evaluating automatic sun times, falling back to default hours:',
            e
          );
          start = 18.0;
          end = 6.0;
        }
      } else {
        // 3. Custom schedule mode: Retrieve user-configured start and end times from GSettings
        try {
          start = colorSettings.get_double(START_KEY);
        } catch {
          // Keep default if key read fails
        }

        try {
          end = colorSettings.get_double(END_KEY);
        } catch {
          // Keep default if key read fails
        }
      }

      // 4. Check if custom schedule is configured as a manual toggle (start and end times are identical)
      const isManual = !automatic && Math.abs(start - end) < 0.001;
      if (isManual) {
        const template = resolveTemplate(
          'manual',
          enabled ? 'active' : 'inactive'
        );
        return formatTemplate(template, {});
      }

      // 5. Calculate active status and remaining time until next state transition (sunset/sunrise or schedule change)
      const now = new Date();
      const currentHours = now.getHours() + now.getMinutes() / 60;

      const active =
        start < end
          ? currentHours >= start && currentHours < end
          : currentHours >= start || currentHours < end;

      let diffHours = (active ? end : start) - currentHours;
      if (diffHours < 0) diffHours += 24;

      const totalMinutes = Math.round(diffHours * 60);
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;

      const timeStr = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;

      // 6. Resolve template and format with dynamic substitution values
      const mode = automatic ? 'automatic' : 'custom';
      const state = active ? 'active' : 'inactive';
      const template = resolveTemplate(mode, state);

      return formatTemplate(template, { time: timeStr });
    } catch (/** @type {any} */ e) {
      logger.error('Failed to calculate schedule status:', e);
      const template = resolveTemplate(
        'fallback',
        enabled ? 'active' : 'inactive'
      );
      return formatTemplate(template, {});
    }
  }
}
