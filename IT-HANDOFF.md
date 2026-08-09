# FACT IT handoff checklist

## Source and ownership

- Transfer the GitHub repository to the client organization or mirror the complete commit history into an IT-owned repository.
- Recreate the Cloudflare Pages project in the client account from the transferred repository.
- Copy `wrangler.example.jsonc` to `wrangler.jsonc` and replace the D1 database identifier.
- Give IT ownership of the production domain and DNS records.

## Data

- Export the development D1 database before handoff.
- Import the SQL export into the client-owned D1 database.
- Apply every migration in `migrations/`.
- Confirm whether development comments should be retained, archived separately or deleted.

## Security

- Set all three development controls to `false`.
- Remove the bootstrap Admin code after IT creates permanent administrators.
- Rotate every secret and access credential in the client account.
- Disable LATCH/Builder accounts after acceptance.
- Replace prototype access codes with the client identity provider or SSO when required.

## Acceptance checks

- Admin, Project Team and Leadership accounts can only access their authorized workspace.
- The Build Dashboard and feedback endpoints return unavailable in Production Mode.
- The client Admin cannot preview another role after role-preview permission is disabled.
- D1 backups, deployment instructions and rollback procedures have been tested by IT.
