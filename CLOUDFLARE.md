# FACT on Cloudflare Pages

FACT is a zero-framework static frontend with Cloudflare Pages Functions for configuration, sign-in, invitations and shared page feedback.

## Required bindings

Create a D1 database named `fact-prototype`, then add it to the Pages project with the binding name `DB`.

Apply the database migration:

```bash
npx wrangler d1 migrations apply fact-prototype --remote
```

The earlier KV-based comment store remains an optional fallback. If it is retained, bind it as `FACT_COMMENTS`.

## Development variables

Configure these variables in the Cloudflare Pages project:

| Variable | Development value | Purpose |
|---|---|---|
| `BUILD_MODE` | `true` | Shows the temporary Build Dashboard and invitation tools |
| `FEEDBACK_ENABLED` | `true` | Enables shared page comments |
| `ADMIN_ROLE_PREVIEW_ENABLED` | `true` | Lets an authorized Admin preview other roles |
| `BOOTSTRAP_ADMIN_EMAIL` | Client Admin email | Creates or restores the first Admin at sign-in |
| `BOOTSTRAP_ADMIN_NAME` | Client Admin name | Display name for the first Admin |
| `BOOTSTRAP_ADMIN_CODE` | Secret access code | Initial Admin sign-in code; store as a secret |

After the Admin signs in, the Team page can generate tester access codes and assign Admin, Project Team or Leadership roles.

## Production cutoff

After client approval, set the following variables and redeploy:

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

`index.html` is the Cloudflare deployment artifact. The source is retained separately so the client IT team does not need to edit a serialized one-line bundle.
