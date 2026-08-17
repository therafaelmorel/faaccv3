# Admin Projects design QA

- Source visual truth: `/workspace/scratch/7da795c3cf26/generated_images/exec-2d4e328e-74be-4924-abd6-18fd01351804.png`
- Implementation evidence: Cloud Browser session `-f5e5-452d-b9a9-911771fdd569`, FACT preview, Admin > Projects viewport capture
- Viewport: 1344 × 928 CSS px, desktop, device scale factor 1
- Source pixels: 1568 × 1003
- Implementation pixels: 1344 × 928
- Normalization: compared as full desktop application views with the same light theme and all-projects state; differences caused by the narrower verification viewport were treated as responsive scaling rather than fidelity defects.
- State: Admin role, Projects navigation selected, All 5 filter selected, no search query

## Full-view comparison evidence

The implementation preserves the approved visual hierarchy: left role-aware navigation, Projects header, right-aligned search and Admin-only creation control, five-part status strip, underline filters, and a single restrained project register. The table uses the real FACT project names, locations, task rollups, go-live dates, budgets, and computed statuses. NYP red `#C8102E` is the only accent; neutral gray is used for completed state.

## Focused region comparison evidence

The table and header were readable at the captured viewport, so a separate crop was not required. Focused browser inspection confirmed both Admin row controls fit inside the table surface after the responsive grid correction: edit bounds 1232–1261 px and delete bounds 1262–1291 px, within the surface bounds 270–1314 px.

## Findings

- No actionable P0, P1, or P2 visual differences remain.
- P3: Admin retains explicit edit and delete icons instead of the mockup's ellipsis. This intentional deviation preserves the prototype's existing direct management actions and remains visually restrained.
- P3: The live data currently computes three Active projects and zero Planning projects, while the conceptual render illustrated two Active and one Planning. The implementation correctly uses live task-derived status rather than hard-coded mock values.

## Required fidelity surfaces

- Fonts and typography: Inter is retained across headings, controls, summary values, tabs, and table copy; weights and hierarchy closely match the source.
- Spacing and layout rhythm: full-width content, summary dividers, filter rhythm, 86 px rows, subtle 9 px radii, and table padding match the approved density. Responsive grid clipping was fixed.
- Colors and visual tokens: white/cool-gray surfaces, charcoal text, `#C8102E` accent, subtle gray borders, and red/gray status dots match the requested palette. No orange or coral remains on this screen.
- Image quality and asset fidelity: the screen contains no raster artwork or custom imagery. Existing product icons remain crisp and consistent.
- Copy and content: role-specific subtitles and project scope are accurate. PM shows assigned projects and “My tasks”; Leadership is portfolio-wide and read-only; Admin alone sees budget and management controls.

## Interaction verification

- Admin: New project visible; edit and delete visible; project rows open detail.
- Project Manager: only three assigned projects displayed; New project, budget, edit, and delete absent.
- Leadership: all five projects displayed read-only; New project, budget, edit, and delete absent.
- Search: “Lakewood” reduced the register to one row.
- Status filter: “On hold 1” reduced the register to one row.
- Console: no new Projects-screen runtime errors. The static preview reports a pre-existing embedded-font decode warning and browser-extension metadata noise, neither introduced by this change nor visible in the UI.

## Comparison history

1. Initial pass found a P2 responsive issue: the Admin delete control extended beyond the table surface at 1344 px.
2. Reduced column minimums and gaps while preserving the approved proportions.
3. Post-fix browser evidence confirmed both controls remain fully inside the table surface and PM/Leadership layouts remain unclipped.
4. Replaced inherited green/orange project status dots with approved red/neutral tokens to maintain the current FACT palette.

final result: passed
