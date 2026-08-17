# Design QA — Admin Team & Departments

Result: **passed**

## Reference

- Approved render: `generated_images/exec-dc381fdf-09e7-4194-b4bc-897139ddf3d5.png`
- Verified screen: Admin → Team
- Browser viewport: desktop cloud browser (1364 px wide)

## Visual comparison

- Matched the approved page hierarchy: header and CTA, four-part summary strip, member table, departments panel, and pending invitation list.
- Kept the FACT navigation, typography, neutral surfaces, and existing navigation red (`#c8102e`).
- Replaced render-only sample values with the platform's current users, tasks, roles, departments, invitations, and active projects.
- Corrected generated text-wrapper sizing so summary values visibly render at 36 px.
- Corrected the member table grid so Access and Actions remain visible at the standard desktop viewport.
- Confirmed no overlapping cards, clipped actions, broken padding, or misaligned columns in the final side-by-side comparison.

## Interaction checks

- Member search filters the directory.
- Department filter returns the correct department members.
- New department opens a working creation modal.
- Edit member opens a working role/department modal.
- Remove member opens a confirmation modal.
- Invite member opens the existing invitation flow.
- Pending invitation Resend and Revoke controls update the local screen state.

## Validation

- Template JavaScript parser: passed.
- Generated HTML build: passed.
- `git diff --check`: passed.
- A pre-existing bundled-font decode warning remains in the browser console; it does not block the page or this screen's controls.
