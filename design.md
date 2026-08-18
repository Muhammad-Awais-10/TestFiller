# TestFiller — Design Specification

## 1. Product Identity

**Product name:** TestFiller  
**Descriptor:** Form Autofill & Testing Tool  
**Primary purpose:** A browser extension for generating recognizable test identities and autofilling website forms for QA, development, marketing, website operations, CRM, and end-to-end lead-flow testing.

### Brand personality
- Modern
- Precise
- Efficient
- Reliable
- Professional
- Technical, but approachable
- Low cognitive load

### Brand principles
- Clarity over decoration
- Compact, not cramped
- Minimal, not empty
- Strong hierarchy
- Consistent spacing
- Controlled use of color
- Avoid visual noise, excessive gradients, neon, glassmorphism, and AI-style decoration

---

## 2. Logo System

### Selected logo direction
Use the **Abstract Fill Mark**: three horizontal rounded bars paired with circular dots, representing filled fields, structured data, and repeated/sequential generation.

### Primary lockup
- Abstract Fill Mark on the left
- `TestFiller` wordmark on the right
- Descriptor below the wordmark: `Form Autofill & Testing Tool`

### Extension icon
- Rounded-square container
- Indigo background
- White Abstract Fill Mark
- Must remain clear at 16px, 32px, 48px, and 128px

### Logo usage
- Keep logo size identical between Settings and History screens
- Keep header placement identical between tabs
- Do not resize the logo per screen
- Do not place the descriptor inside the extension icon

---

## 3. Color System

### Primary brand color
- **Indigo:** `#4F46E5`

### Supporting colors
- **Deep Indigo:** `#3730A3`
- **Ink / Primary text:** `#111827`
- **Slate / Secondary text:** `#64748B`
- **Border:** `#E2E8F0`
- **White / Card surface:** `#FFFFFF`
- **Soft neutral surface:** `#F8FAFC`
- **Page tint:** use a very subtle indigo/lavender tint, approximately `#F8F7FF` or `#F7F7FF`

### Semantic colors
- **Success:** `#16A34A`
- **Warning:** `#D97706`
- **Error / destructive:** `#DC2626`

### Color usage rule
The UI should remain approximately:
- 80–85% neutral / white
- 10–15% brand indigo
- Small amounts of semantic colors only when required

Do not tint the main cards purple. Use the subtle indigo tint on the page background and keep content surfaces white.

---

## 4. Typography

### Primary font
**Inter**

Bundle the font locally with the extension rather than loading it from an external CDN.

### Type scale
| Purpose | Size | Weight |
|---|---:|---:|
| Page title | 20px | 600 |
| Section title | 16px | 600 |
| Field label | 13px | 500–600 |
| Body / normal UI text | 14px | 400 |
| Button text | 14px | 500–600 |
| Help / secondary text | 12px | 400 |
| Metadata / caption | 11–12px | 400 |

### Typography rules
- Keep the number of font sizes limited
- Avoid oversized headings
- Use strong contrast for labels and primary values
- Use Slate for helper text and metadata

---

## 5. Spacing System

Use a **4px base grid**.

### Core spacing tokens
`4 / 8 / 12 / 16 / 20 / 24 / 32 / 40`

### Recommended use
- Icon to text: 8px
- Label to field: 6–8px
- Fields in same group: 12–16px
- Internal section spacing: 16–20px
- Between major sections: 24px
- Major page spacing: 32px

### Width philosophy
Use a **controlled centered content width**.

Do not stretch fields to full browser width. The wider full-screen experiment felt visually cheap and should not be used.

The approved layout should:
- Use compact field lengths
- Keep balanced whitespace on the left and right
- Preserve the same content width across Settings and History
- Keep the same left edge, right edge, header width, and tab alignment on both screens

Recommended maximum content width: approximately **760–820px** on normal desktop layouts.

---

## 6. Shape & Surface System

### Border radius
- Inputs and selects: 8px
- Buttons: 8px
- Small controls: 6px
- Cards / sections: 12px
- Main container: 12–16px

Avoid overly rounded SaaS-style 20–30px radii.

### Borders
- Use 1px subtle neutral borders
- Default: `#E2E8F0`
- Focus: Indigo `#4F46E5`

### Shadows
- Use very subtle shadows only where needed
- Prefer border + background separation over heavy elevation

---

## 7. Global Page Layout

Both Settings and History must share one common shell.

### Background
- Full page: very light indigo-tinted background
- Main content areas/cards: white

### Header
At the top:
1. Abstract Fill Mark
2. `TestFiller`
3. Descriptor below: `Form Autofill & Testing Tool`

The header dimensions and placement must be identical on both screens.

### Navigation
Tabs directly below the brand header:
- Settings
- History

#### Active tab
- Indigo text
- Slightly stronger weight
- Thin indigo bottom underline

#### Inactive tab
- Slate / muted text

Avoid pill-style tabs.

### Shared alignment
The following must use identical horizontal alignment on Settings and History:
- Logo
- Tabs
- Divider line
- Page title
- Main content width
- Left and right boundaries

---

# 8. Settings Screen

## Page heading
**Settings**  
Supporting text: `Configure the test data TestFiller uses when filling forms.`

## Main container
- White background
- Subtle border
- 12px radius
- Compact centered width
- Sections separated primarily by whitespace and subtle dividers

Do not use multiple heavy boxes inside boxes.

---

## Section 1 — Identity

### Heading
`1. Identity`

Use a small indigo outline icon beside the heading.

### Layout
Two-column row:
- Name prefix
- Name suffix

Full-width row below:
- Company

### Example values
- Name prefix: `Dr.`
- Name suffix: `Jr`
- Company: `Example Company`

---

## Section 2 — Email generation

### Heading
`2. Email generation`

### First row
Two columns:
- Alias prefix
- Domain

Example values:
- Alias prefix: `asdfg`
- Domain: `example.com`

Helper text:
- Alias prefix: `Used before the sequential number.`
- Domain: `Used after @ in generated emails.`

### Second row
Two columns:
- Default department
- Generation style

Example values:
- Default department: `Marketing`
- Generation style: `Sequential`

### Reset action
Secondary outline button:
`Reset counters`

Helper text below:
`Restart sequential numbering from the beginning.`

### Reset confirmation
Title: `Reset counters?`  
Message: `Sequential test-data counters will restart.`

Actions:
- Cancel
- Reset

---

## Section 3 — Additional fields

### Heading
`3. Additional fields`

Keep existing field names exactly:
- Other prefix
- Other suffix

Use a two-column row.

Do not rename these fields at this stage.

---

## Section 4 — Preferences

### Heading
`4. Preferences`

### First row
Two columns:
- Country
- History limit

Example values:
- Country: `Pakistan (+92)`
- History limit: `500`

History helper meaning:
`Maximum number of generated identities kept locally.`

### Auto-copy control
Use a toggle, not a checkbox.

Label:
`Automatically copy generated email`

Helper:
`Copies each newly generated email to your clipboard.`

Default shown state in mockup: ON.

---

## Section 5 — Appearance

### Heading
`5. Appearance`

Field:
- Theme

Example value:
`System`

Options:
- System
- Light
- Dark

---

## Settings Primary Action

Bottom button:
`Save settings`

### Style
- Full width within the main container
- Indigo background
- White icon/text
- 8px radius

### Behavior
- Disabled when no changes exist
- Enabled when settings change
- On successful save, show a small toast:
  `Settings saved`

Do not use a large confirmation modal.

---

# 9. History Screen

## Page heading
**History**  
Supporting text: `Review generated identities and related test activity.`

The History page must use the **same overall content width, logo size, header position, tab position, vertical rhythm, and left/right boundaries as Settings**.

---

## Top Action Row

### Left
Search field with search icon.

Placeholder:
`Search email, department, or URL`

### Right
Two buttons:
- `Export CSV`
- `Clear all`

#### Export CSV
- Secondary / indigo outline button
- Download icon

#### Clear all
- Destructive outline button
- Red text and border
- Trash icon

Desktop: keep search and actions on the same visual row.

---

## Result Summary

Example:
`4 generated identities`

Use secondary/slate text.

---

## History Item Card

Each generated identity appears inside a compact white card.

### Card style
- White surface
- Subtle border
- 12px radius
- No heavy shadow
- Compact vertical spacing

### Top row
Left side:
- Small indigo-tinted circular email icon
- Generated email in semibold dark text

Right side:
- Copy button
- Delete button

### Copy button
- Indigo outline
- Copy icon
- Label: `Copy`

On click:
- Copy email to clipboard
- Temporary state may change to `Copied`
- Toast: `Email copied to clipboard`

### Delete button
- Red outline
- Trash icon
- Label: `Delete`

On click confirmation:
Title: `Delete this history item?`  
Message: `This action cannot be undone.`

Actions:
- Cancel
- Delete

### Metadata row
Example:
`Marketing • Sequential • 13 Aug 2026, 16:36`

Use muted secondary text.

### Source URL
Label:
`Source URL`

If present:
- Show as indigo link
- Limit to one line or maximum two lines
- Truncate long URLs with ellipsis
- Do not allow long raw URLs to create large blocks of text

Example:
`https://www.facebook.com/adsmanager/manage/campaigns?act=1234567...`

If absent:
`No submission URL recorded`

Use muted text.

---

## Clear All Confirmation

Title:
`Clear all history?`

Message:
`This will permanently remove all stored generated identities from this browser.`

Actions:
- Cancel
- Clear history

---

## Export Behavior

`Export CSV` exports the stored history data, including available identity information, metadata, and source URL.

Default behavior: export all history.

---

## Empty State

When no entries exist:

**No history yet**  
`Generated identities will appear here after you use TestFiller on a form.`

Keep the empty state simple; do not use large decorative illustrations.

---

## Search Empty State

When search returns no matches:

**No matching entries found**  
`Try a different email, department, or URL.`

---

# 10. Form Controls

## Input / Select
- Height: approximately 40px
- White background
- 1px border
- 8px radius
- 12px horizontal padding

## Focus state
- Indigo border `#4F46E5`
- Subtle indigo focus ring

## Disabled state
- Muted background
- Muted text
- Reduced contrast

## Helper text
Place directly below the field it explains.

---

# 11. Buttons

## Primary
- Indigo background
- White text
- Used for Save / confirm actions

## Secondary
- White background
- Neutral or indigo border
- Used for Reset, Copy, Export, Cancel

## Destructive
- White or subtle surface
- Red border/text
- Used only for Delete and Clear History

## Button behavior
All controls need:
- Default
- Hover
- Active/pressed
- Focus-visible
- Disabled

---

# 12. Icons

Use one consistent outline icon family.

### Icon style
- 1.5–2px stroke
- Rounded ends
- Simple geometric construction
- No mixed icon styles

### Typical icons
- Search
- Copy
- Trash
- Download/export
- Reset/refresh
- User/identity
- Mail
- Grid/additional fields
- Settings/preferences
- Appearance/theme
- Chevron

Icons should support function, not decorate every label.

---

# 13. Responsive Behavior

## Desktop / normal extension options page
- Use controlled centered width
- Preserve compact field widths
- Use two-column layout where fields belong together

## Narrow viewport
Two-column groups collapse to one column.

Example:
- Name prefix
- Name suffix

becomes vertically stacked.

### History responsive behavior
- Search can become full width
- Export / Clear actions can wrap below
- History card actions can move below identity content
- Long URLs must remain truncated
- No horizontal scrolling

## Zoom behavior
The content should retain the same max width and hierarchy when users zoom out. Do not stretch the interface just because more browser width becomes available.

---

# 14. Consistency Rules Between Settings and History

These rules are mandatory:

1. Same logo dimensions
2. Same descriptor size
3. Same header position
4. Same tab size and spacing
5. Same tab underline behavior
6. Same horizontal content boundaries
7. Same page title scale
8. Same subtitle scale
9. Same background tint
10. Same card border and radius system
11. Same input/button heights
12. Same icon stroke style
13. Same vertical spacing rhythm from top to bottom
14. Do not make History visually wider than Settings
15. Do not make Settings visually narrower than History

The two screens must feel like two states of one product, not separate page designs.

---

# 15. Interaction Feedback

Prefer lightweight feedback:
- Toasts for save/copy/export success
- Confirmation dialogs only for destructive actions
- No unnecessary modal dialogs

Suggested messages:
- `Settings saved`
- `Email copied to clipboard`
- `History exported`
- `Counter has been reset`

Error states should use concise, actionable language.

---

# 16. Dark Mode

Theme selector supports:
- System
- Light
- Dark

Dark mode should preserve the same hierarchy and spacing.

Recommended principles:
- Dark neutral page background
- Slightly lighter dark cards
- Indigo retained as primary accent
- Borders remain subtle
- Avoid pure black across the entire UI

---

# 17. Accessibility & Usability

- Maintain sufficient text/background contrast
- Do not rely on color alone for destructive or active states
- All icon-only controls require accessible labels
- Keyboard navigation must be supported
- Use visible `:focus-visible` styles
- Minimum comfortable interactive target: approximately 36–40px
- Inputs and buttons must remain legible at browser zoom levels

---

# 18. Data & Privacy UI Principle

TestFiller stores settings, generated identities, and history locally in the browser.

Where privacy information is surfaced in the UI or onboarding, use concise wording such as:

`Your TestFiller settings and history stay in this browser.`

Do not imply cloud sync or account storage unless that functionality is added later.

---

# 19. Final Visual Direction Summary

**TestFiller should feel like a focused professional browser utility.**

The final visual formula is:

**Inter + Indigo #4F46E5 + subtle lavender page tint + white surfaces + compact centered layout + restrained borders + clear form hierarchy + consistent outline icons + controlled whitespace.**

The approved Settings and History references are the source of truth for layout character. Maintain their compact width and visual consistency during implementation.
