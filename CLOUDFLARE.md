# FACT on Cloudflare Workers

FACT is a zero-framework static frontend with a Cloudflare Worker API for configuration, sign-in, invitations and shared page feedback. Static files are served from `public/`; only `/api/*` requests run through the Worker.

## Version-controlled bindings

The production `wrangler.jsonc` declares the existing `faaccv3` Worker, the `DB` binding and the `fact-prototype` database ID. Do not add the D1 binding manually in the dashboard; every Git deployment recreates it from this file.

Apply the database migration:

```bash
npx wrangler d1 migrations apply fact-prototype --remote
```

The earlier KV-based comment store remains an optional fallback, but D1 is the primary shared store.

## Development variables

The first three variables are committed in `wrangler.jsonc` while the platform is in development. Configure the bootstrap Admin values in **Worker → Settings → Variables and Secrets**:

| Variable | Development value | Purpose |
|---|---|---|
| `BUILD_MODE` | `true` | Already configured; shows the temporary Build Dashboard and invitation tools |
| `FEEDBACK_ENABLED` | `true` | Already configured; enables shared page comments |
| `ADMIN_ROLE_PREVIEW_ENABLED` | `true` | Already configured; lets an authorized Admin preview other roles |
| `BOOTSTRAP_ADMIN_EMAIL` | Client Admin email | Creates or restores the first Admin at sign-in |
| `BOOTSTRAP_ADMIN_NAME` | Client Admin name | Display name for the first Admin |
| `BOOTSTRAP_ADMIN_CODE` | Secret access code | Initial Admin sign-in code; store as a secret |

After the Admin signs in, the Team page can generate tester access codes and assign Admin, Project Team or Leadership roles.

`keep_vars` is enabled in `wrangler.jsonc` so Git-connected deployments preserve the bootstrap values managed in the Cloudflare dashboard.

## Production cutoff

After client approval, change the following values in `wrangler.jsonc` and redeploy:

```text
BUILD_MODE=false
FEEDBACK_ENABLED=false
ADMIN_ROLE_PREVIEW_ENABLED=false
```

The Build Dashboard, page-feedback panel, tester invitations and Admin role preview are then removed from the interface and rejected by the backend. Existing development comments remain archived in D1 until IT chooses to export or delete them.

## Build workflow

Edit `src/fact-app.html`, then run:

```bash
npm run build
npm run check
```

`public/index.html` is the Worker static-asset artifact. `index.html` is kept for direct static preview, and the editable source remains in `src/fact-app.html` so client IT does not need to edit a serialized one-line bundle.

Validate the complete Worker package before publishing:

```bash
npm run deploy:check
```
