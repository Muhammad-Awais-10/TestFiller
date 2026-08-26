# TestFiller

TestFiller is a local-only Manifest V3 Chrome extension that generates clearly fake test emails and contact profiles, then fills safe empty form fields on the active page.

It does not use an API, server, account, or token.

## What it does

- Generates unique test emails per department
- Fills common contact fields on the active tab
- Supports popup, keyboard shortcuts, and editable-field context menu filling
- Keeps email history and settings in local Chrome storage
- Lets you export history as CSV

## Generated data

A generated profile can include:

- First name, last name, full name
- Email
- Phone
- Company
- Address line 1 and 2
- City, state/region, postal code, country
- Website
- Job title
- Generic filler text for safe freeform fields

## What it does not fill

It avoids passwords, usernames, OTP and verification fields, captchas, payment or bank fields, government ID fields, hidden/file inputs, disabled or readonly fields, and ambiguous or protected fields. Existing user input is not overwritten.

## How email generation works

Emails are built from the selected department and mode:

- `Sequential` — `qa-000001@example.com`
- `Random` — `qa-abc123@example.com`
- `Date` — `qa-20260806-001@example.com`
- `Website Name` — `example-qa-001@example.com`
- `Mixed` — combines website, date, and random token when available

The domain, alias prefix, department, mode, and country are configurable in Settings.

## Install

1. Open `chrome://extensions`.
2. Enable **Developer mode**.
3. Click **Load unpacked**.
4. Select this project folder.
5. Pin **TestFiller** if desired.

## Usage

### Toolbar popup

- Click the extension icon to generate an email and fill the active page.
- Use **Generate new email** to create and copy a new email without filling.
- Use **Generate + Fill** to generate a new profile and fill the current page.
- Use **Copy** to copy the current email.
- Use **Fill** to fill the current page with the current profile.

### Keyboard shortcuts

- `Ctrl+Shift+E` — generate and copy a test email
- `Ctrl+Shift+F` — generate, copy, and fill the active page

### Context menus

- Right-click an editable field for **Generate and fill TestFiller profile**
- Right-click the extension icon for **Settings**

## Settings

Settings are stored locally per Chrome profile and include:

- Name prefix and suffix
- Alias prefix
- Domain
- Department
- Email mode
- Company
- Other-text prefix and suffix
- Default country
- Theme
- History limit
- Auto-copy

## History

The History page lets you:

- Search generated emails
- Copy a generated email
- Delete one entry
- Clear all history
- Reset local department counters
- Export history to CSV

## Limitations

TestFiller works on normal web pages and common form controls. It cannot reliably fill browser-internal pages, closed shadow roots, cross-origin frames, or forms that block scripted input.

## Smoke checks

Run:

```powershell
node tests\node-smoke.js
```

You can also open `tests/smoke.html` in a browser for generation checks.

## Package

Run this from the project root to generate the release ZIP:

```powershell
.\scripts\package-extension.ps1
```

Upload only `package\TestFiller-v1.0.0.zip` to the Chrome Web Store.
Do not upload the complete project ZIP or a ZIP that contains the `TestFiller/` folder.

For local testing, extract the release ZIP and use Chrome’s **Load unpacked** option on the extracted folder.
For Chrome Web Store submission, upload the release ZIP directly.
