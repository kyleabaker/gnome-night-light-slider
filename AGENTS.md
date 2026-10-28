# AGENTS.md - Developer & AI Agent Guidelines

This document provides architectural context, coding standards, and operational guidelines for AI agents and human developers working on the **GNOME Night Light Slider** extension.

## Project Overview

- **Extension Name:** GNOME Night Light Slider (`gnome-night-light-slider@kyleabaker.github.com`)
- **Author:** Kyle Baker
- **Target Environment:** GNOME Shell
- **License:** GNU General Public License v3 (GPLv3)

---

## Repository Structure & Modules

```
gnome-night-light-slider/
├── extension.js               # Main extension lifecycle entry point (Extension base class)
├── prefs.js                   # Extension preferences window (Adw.PreferencesWindow implementation)
├── metadata.json              # Extension metadata and supported shell versions
├── schemas/
│   └── org.gnome.shell.extensions.com.github.kyleabaker.gnome-night-light-slider.gschema.xml
├── stylesheet.css             # Quick Settings UI styles and theme accent provider class
├── tools/
│   └── Makefile               # Build automation and local deployment tasks
└── src/
    ├── models/
    │   ├── nlsSystemIndicator.js   # Quick Settings menu container and indicator wrapper
    │   ├── nlsQuickMenuToggle.js   # Main quick menu toggle and interaction handler
    │   └── nlsQuickSettingsItem.js # Individual slider track and control components
    ├── settings/
    │   └── data.js                 # Unified GSettings getter/setter bindings for booleans and strings
    └── utils/
        └── logger.js               # Conditional logging utility synced with debug preferences
```

---

## Coding Standards & Architectural Rules

### 1. JavaScript & GJS Conventions

- **Strict Mode:** Every file must start with `'strict';`.
- **ES Modules:** Use standard ES import/export syntax with URI schemes for GObject Introspection (`gi://Gio`, `gi://St`, etc.) and system resources (`resource:///org/gnome/shell/...`).
- **Type Safety:** Maintain comprehensive JSDoc type annotations across all classes, static methods, and function signatures to support IDE verification and type checking.
- **Linting:** Ensure compliance with project ESLint configurations. Avoid nested ternary operators and unhandled promise rejections.

### 2. Lifecycle & Memory Safety

- **Signal Disconnection:** Always track connection IDs (e.g., settings change listeners, D-Bus proxies) and explicitly disconnect/cleanup during `disable()` or component destruction.
- **Timer Teardown:** Ensure all background timeouts and intervals are cleaned up using `GLib.Source.remove()` to prevent orphan callbacks.
- **DOM Detachment:** Explicitly destroy custom UI widgets and detach custom actors from stage hierarchies when tearing down indicators.

### 3. Asynchronous & D-Bus Resilience

- **Exponential Backoff:** Network or D-Bus calls (such as GeoClue location lookups or proxy initialization) must incorporate exponential backoff retry loops to handle early startup race conditions gracefully.
- **Graceful Degradation:** Wrap fallback mechanisms around dynamic CSS theme extractions, St. Settings lookups, and GSettings queries to guarantee zero crashes in non-standard desktop environments.

---

## Build, Test & Release Commands

### Build Package

```bash
make -f tools/Makefile
```

### Install Locally & Compile Schemas

```bash
make -f tools/Makefile install
```

### Restart GNOME Shell (Xorg)

Press `Alt` + `F2`, type `r`, and press `Enter`.
