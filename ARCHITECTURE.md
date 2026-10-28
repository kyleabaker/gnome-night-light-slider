# ARCHITECTURE.md - System Design & Architecture

This document outlines the internal architecture, data flow, and subsystem design of the **GNOME Night Light Slider** extension.

---

## 1. High-Level Architecture

The extension integrates directly into GNOME Shell's **Quick Settings** status area, introducing an interactive temperature slider, dynamic scheduling status labels, and temporary pause controls.

### Core Architectural Layers

1. **Lifecycle Management (`extension.js`):** Extends GNOME Shell's base `Extension` class. Manages settings bindings, logging states, template change listeners, and registers/destroys the external Quick Settings indicator.
2. **UI Container Hierarchy (`src/models/`):**
   - `NlsSystemIndicator`: Bridges the extension with `Main.panel.statusArea.quickSettings`.
   - `NlsQuickMenuToggle`: Manages the primary quick toggle menu slot and state toggling.
   - `NlsQuickSettingsItem`: Handles the Cairo-rendered temperature slider track, gradient mapping, and temporary pause pill buttons (`5m`, `15m`, `30m`, `1h`).
3. **Settings Abstraction Layer (`src/settings/data.js` & `prefs.js`):** Provides a unified settings data object mapping boolean and string GSettings keys for both runtime observation and the Libadwaita preferences window.
4. **Theme & Utility Services (`src/utils/` & `Theme`):** Handles dynamic Cairo color computations, theme accent color extraction via hidden staging widgets and multi-tier fallbacks, and conditional logging.

---

## 2. Subsystem Details

### A. Temperature Normalization (`temperature.js`)

- Maps color temperature values between `1,700K` (warm night light) and `4,700K` (cool daylight).
- Supports bidirectional normalization ($0.0$ to $1.0$) and denormalization with configurable slider inversion (`invert-slider` GSettings key).

### B. Dynamic Theme Accent Extraction (`theme.js`)

- Implements a 5-tier fallback strategy to extract active system accent colors for the slider focus ring and active UI elements:
  1. Dynamically mounted hidden dummy widget (`.night-light-accent-provider`) attached to `global.stage` for CSS node computation.
  2. Native `St.ThemeContext` accent color evaluation.
  3. Quick Settings active toggle background inspection.
  4. `St.Settings` enum mapping.
  5. `org.gnome.desktop.interface` string lookup, falling back to standard GNOME Blue (`#3584e4`).

### C. Preferences & Schema Pipeline (`prefs.js` & `gschema.xml`)

- Built on **Adw.PreferencesWindow** (`libadwaita`).
- Exposes General preferences (logging, slider inversion) and Status Template strings (`status-automatic-active`, `status-automatic-inactive`, `status-custom-active`, `status-custom-inactive`) supporting dynamic `{time}` placeholders.
- Schema files must be compiled locally using `glib-compile-schemas schemas/`.
