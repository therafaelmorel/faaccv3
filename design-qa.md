# Tasks across roles design QA

- Source visual truth: `/workspace/scratch/7da795c3cf26/generated_images/exec-2b70bb09-6a59-4df8-88e3-a7033c12c5c2.png`
- Implementation screenshot: unavailable; Cloud Browser access to `terminal.local:4173` was denied by the workspace browser security policy.
- Intended viewport: 1584 × 992 desktop reference, light theme.
- Source pixels: 1584 × 992.
- Implementation pixels: unavailable.
- CSS size and density normalization: unavailable because the rendered implementation could not be captured.
- State: Admin Tasks, PM Tasks, and Leadership Tasks using the all-projects/all-status filter state.

## Full-view comparison evidence

The source render was available and used as the implementation target. A browser-rendered implementation image could not be obtained, so a valid side-by-side full-view comparison was not possible.

## Focused region comparison evidence

Blocked for the same reason. Code-level checks confirm the expected summary strip, project/status filter rail, task table columns, role-specific actions, and responsive rules are present, but code inspection is not a substitute for visual comparison.

## Findings

- [P1] Browser-rendered visual evidence is unavailable.
  Location: Admin, PM, and Leadership Tasks screens.
  Evidence: the cloud browser denied access to the local preview before any viewport capture or interaction test could run.
  Impact: layout fidelity, wrapping, and responsive behavior cannot be certified visually.
  Fix: open the local preview in an allowed Cloud Browser session and compare all three role states against the source render.

## Required fidelity surfaces

- Fonts and typography: implemented with the existing FACT Inter typography system; visual confirmation blocked.
- Spacing and layout rhythm: the approved full-width layout, four-part summary, filter rail, table columns, and responsive breakpoints are implemented; visual confirmation blocked.
- Colors and visual tokens: FACT red `#C8102E`, white/cool-gray surfaces, pale-red borders, and semantic state colors are implemented; visual confirmation blocked.
- Image quality and asset fidelity: no raster or decorative image assets are required by this screen. Existing product icons are retained.
- Copy and content: Admin, PM, and Leadership task labels, counts, filters, assignees, due dates, priorities, and statuses are wired to the existing task data.

## Interaction verification

- Static checks passed: Leadership Tasks navigation and screen exist.
- Static checks passed: exactly one New task button exists, inside the Admin screen.
- Static checks passed: the create-task handler rejects non-Admin roles.
- Static checks passed: Leadership uses read-only status labels; PM retains status updates and notes; Admin retains create/edit/delete.
- Template build and JavaScript parse checks passed.
- Browser interaction and console checks: blocked by browser security policy.

## Comparison history

1. Implemented the selected Admin Tasks render across all three roles.
2. Added role-specific permissions and data scopes.
3. Attempted Cloud Browser verification; local preview access was denied before capture.

final result: blocked
