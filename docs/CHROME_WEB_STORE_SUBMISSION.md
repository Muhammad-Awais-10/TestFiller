# Chrome Web Store Submission Notes

## Single Purpose

TestFiller generates clearly fake test identities and autofills website forms for testing, QA, and development workflows.

## Permission Justifications

### `storage`
Stores settings, department counters, generated test history, and submission URLs locally with `chrome.storage.local`.

### `clipboardWrite`
Allows the extension to copy generated test email addresses to the clipboard when the user clicks Copy.

### `activeTab`
Allows temporary access to the current tab after a user-initiated action so the extension can generate context-aware test data, fill the page, and save the submission URL after a successful fill.

### `scripting`
Allows the extension to inject the content script into the current tab when the content script is not already available.

### `contextMenus`
Creates the editable-field context menu and the settings menu used by the extension.

### `http://*/*` and `https://*/*`
Required so the content script can run on normal web pages where forms need to be detected and filled.

### `all_frames`
Allows the content script to run in all frames so forms inside same-site frames can be detected and filled.

## Data Disclosure Guidance

Declare the following data types as used by the extension:

- Website content: form labels, placeholders, field names, field types, and current page URL are processed locally to detect and fill fields
- Form data: generated test identities are written into form fields on the page when the user invokes fill actions
- Web browsing activity or submission URLs: the extension records the page URL as a submission URL after a successful fill action
- Locally stored settings and generated test identities: stored in `chrome.storage.local`

Clarification:

- The extension does not automatically transmit this data to WebPlover or third parties
- No remote API, analytics, advertising, or tracking is used
- Data stays local unless the user explicitly uses the support form, which opens their email app via `mailto:`

## Remote Code

TestFiller does not use remote code, external scripts, remote APIs, analytics, tracking, or advertising.

## Privacy Policy URL

Enter the publicly hosted privacy policy URL here:

`https://YOUR-DOMAIN-HERE/path/to/privacy-policy.html`
