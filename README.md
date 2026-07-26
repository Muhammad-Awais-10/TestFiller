# Plover Filler

A fully offline Manifest V3 Chrome extension for internal form testing. Clicking the toolbar icon creates a local test email and fictional profile, then fills safe empty contact fields on the active page without opening the extension. It makes no API calls and needs no account, token, or server setup.

## What it fills

Plover Filler creates a fictional profile with:

- First name, last name, or full name
- Email and phone
- Company
- Address lines, city, state/region, postal code, and country

It deliberately does **not** fill passwords, usernames/login fields, OTP/verification/captcha fields, payment/bank/government-ID fields, hidden/file controls, checkboxes/radios, disabled/readonly fields, generic notes/messages, or ambiguous fields. Existing user-entered values are never overwritten.

## Local uniqueness

Each Chrome profile maintains separate department counters in local extension storage. Plover Filler serializes generation requests, so addresses remain unique per department in that profile while its storage is retained.

Because this extension is offline, it **cannot** guarantee uniqueness across different teammates, computers, browser profiles, or after clearing/resetting extension storage. Use a shared server-side allocator only if that cross-team guarantee becomes necessary.

## Install

1. Open `chrome://extensions`.
2. Enable **Developer mode**.
3. Click **Load unpacked**.
4. Select this project folder (the one containing [manifest.json](manifest.json)).
5. Pin **Plover Filler**.

No API, WordPress plugin, URL, or token is required.

## Daily workflow

- Click the toolbar icon to generate a local test email and fill safe empty contact fields.
- Use **Generate new email** for an address without filling.
- Use **Generate + Fill** to make a new profile and fill the current page.
- Right-click the extension icon for **Settings** or **History**.
- Right-click an editable page field for **Generate and fill Plover Filler profile**.

## Permissions

- `storage` — local settings, counters, and history
- `clipboardWrite` — copy generated email addresses
- `activeTab` and `scripting` — interact with the active tab after a user action
- `contextMenus` — editable-field generation plus action-icon Settings/History shortcuts
- `http://*/*` and `https://*/*` content-script matches — fill ordinary website forms

## Limitations

The extension cannot fill browser-internal pages, closed shadow roots, cross-origin frames, or forms that reject scripted input. It uses the native value setter and bubbling `input`/`change` events for common React, Vue, Angular, WordPress, WooCommerce, Elementor, Shopify, HubSpot, Gravity Forms, Fluent Forms, Contact Form 7, and WPForms fields.

All email history and settings remain in the local Chrome profile. Plover Filler never sends generated data to a remote service.

## Smoke checks

Run:

```powershell
node tests\node-smoke.js
```

Or open [tests/smoke.html](tests/smoke.html) in a browser for pure generation/profile checks.

## ZIP package

The ready-to-load package is [package/plover-filler.zip](package/plover-filler.zip). It contains `manifest.json` at its root.
