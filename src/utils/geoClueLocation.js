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
import GLib from 'gi://GLib';

import { logger } from './logger.js';

const GeoClueManagerInterface = `
<node>
  <interface name="org.freedesktop.GeoClue2.Manager">
    <method name="GetClient">
      <arg type="o" name="client" direction="out"/>
    </method>
  </interface>
</node>`;

const GeoClueClientInterface = `
<node>
  <interface name="org.freedesktop.GeoClue2.Client">
    <method name="Start"/>
    <property name="Location" type="o" access="read"/>
  </interface>
</node>`;

const GeoClueLocationInterface = `
<node>
  <interface name="org.freedesktop.GeoClue2.Location">
    <property name="Latitude" type="d" access="read"/>
    <property name="Longitude" type="d" access="read"/>
  </interface>
</node>`;

const ManagerProxy = Gio.DBusProxy.makeProxyWrapper(GeoClueManagerInterface);
const ClientProxy = Gio.DBusProxy.makeProxyWrapper(GeoClueClientInterface);
const LocationProxy = Gio.DBusProxy.makeProxyWrapper(GeoClueLocationInterface);

export async function getGeoclueLocation() {
  try {
    // @ts-ignore
    const manager = new ManagerProxy(
      Gio.DBus.system,
      'org.freedesktop.GeoClue2',
      '/org/freedesktop/GeoClue2/Manager'
    );

    const [clientPath] = await manager.GetClientAsync();

    // Use call_sync to synchronously and reliably set DesktopId
    // BEFORE starting the client.
    Gio.DBus.system.call_sync(
      'org.freedesktop.GeoClue2',
      clientPath,
      'org.freedesktop.DBus.Properties',
      'Set',
      new GLib.Variant('(ssv)', [
        'org.freedesktop.GeoClue2.Client',
        'DesktopId',
        new GLib.Variant('s', 'org.gnome.Shell'),
      ]),
      null,
      Gio.DBusCallFlags.NONE,
      -1,
      null
    );

    // @ts-ignore
    const client = new ClientProxy(
      Gio.DBus.system,
      'org.freedesktop.GeoClue2',
      clientPath
    );

    // Start location updates safely now that DesktopId is set
    await client.StartAsync();

    const locationPath = client.Location;
    if (!locationPath || locationPath === '/') {
      return null;
    }

    // Read Latitude and Longitude from the Location object
    // @ts-ignore
    const location = new LocationProxy(
      Gio.DBus.system,
      'org.freedesktop.GeoClue2',
      locationPath
    );

    return {
      lat: location.Latitude,
      lon: location.Longitude,
    };
  } catch (e) {
    logger.error('GeoClue lookup failed:', e);
    return null;
  }
}
