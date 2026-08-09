# Cloudflare Pages setup

The site remains a zero-build static deployment. Use `/` as the root directory and leave the build command empty.

The page comment panel includes a Cloudflare Pages Function at `/api/comments`. To share comments between the client and studio:

1. Create a Workers KV namespace in Cloudflare.
2. Open the Pages project, then go to **Settings → Bindings → KV namespace bindings**.
3. Add the namespace with the variable name `FACT_COMMENTS`.
4. Redeploy the project.

If the KV binding is not present, the panel safely falls back to browser-local storage so the interface can still be previewed.
