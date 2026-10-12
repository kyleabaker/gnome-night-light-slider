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

/**
 * Calculate local sunrise and sunset hours (in decimal format, e.g., 6.5 for 06:30)
 * @param {number} latitude
 * @param {number} longitude
 * @param {Date} [date=new Date()]
 * @returns {{ sunrise: number, sunset: number }}
 */
export function calculateSunTimes(latitude, longitude, date = new Date()) {
  // Input sanitization / fallback guards
  if (typeof latitude !== 'number' || Number.isNaN(latitude)) latitude = 0;
  if (typeof longitude !== 'number' || Number.isNaN(longitude)) longitude = 0;
  if (!(date instanceof Date) || Number.isNaN(date.getTime()))
    date = new Date();

  // Clamp latitudes to prevent extreme math breakdown
  latitude = Math.max(-90, Math.min(90, latitude));
  longitude = Math.max(-180, Math.min(180, longitude));

  const rad = Math.PI / 180;
  const deg = 180 / Math.PI;

  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));

  const zenith = 90.833 * rad; // Accounts for atmospheric refraction & solar radius
  const latRad = latitude * rad;
  const lngHour = longitude / 15;

  /**
   * @param {boolean} isSunrise
   * @returns {number}
   */
  function calcTime(isSunrise) {
    const t = dayOfYear + ((isSunrise ? 6 : 18) - lngHour) / 24;
    const M = 0.9856 * t - 3.289; // Mean anomaly

    let L =
      M + 1.916 * Math.sin(M * rad) + 0.02 * Math.sin(2 * M * rad) + 282.634;
    L = (L + 360) % 360; // True longitude

    let RA = deg * Math.atan(0.91764 * Math.tan(L * rad));
    RA = (RA + 360) % 360;

    const Lquadrant = Math.floor(L / 90) * 90;
    const RAquadrant = Math.floor(RA / 90) * 90;
    RA = (RA + (Lquadrant - RAquadrant)) / 15;

    const sinDec = 0.39782 * Math.sin(L * rad);
    const cosDec = Math.cos(Math.asin(sinDec));

    const denominator = cosDec * Math.cos(latRad);
    // Guard against division by zero at exact poles
    const cosH =
      denominator === 0
        ? Number.NaN
        : (Math.cos(zenith) - sinDec * Math.sin(latRad)) / denominator;

    // Handle Polar night, Midnight sun, or NaN (poles/division by zero)
    if (Number.isNaN(cosH) || cosH > 1) return isSunrise ? 6.0 : 18.0;
    if (cosH < -1) return isSunrise ? 0.0 : 24.0;

    const H = isSunrise
      ? (360 - deg * Math.acos(cosH)) / 15
      : (deg * Math.acos(cosH)) / 15;
    const T = H + RA - 0.06571 * t - 6.622;

    let UT = (T - lngHour + 24) % 24;
    const tzOffsetHours = -date.getTimezoneOffset() / 60;

    return (UT + tzOffsetHours + 24) % 24;
  }

  return {
    sunrise: calcTime(true),
    sunset: calcTime(false),
  };
}
