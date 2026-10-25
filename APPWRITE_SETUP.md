# Appwrite account setup

This first integration slice connects **Appwrite Auth only**. It does not sync rooms, beats, invitations, or chat; the Circle content remains a local demo until the shared-data layer and its permissions are implemented.

## MVP data boundary

The planned collaboration MVP is local-first and deliberately small:

- Lyrics and personal drafts stay in the artist's browser by default, even when signed in.
- Shared rooms will contain only a room title, members/roles, beat-step patterns, and revisions of those beat patterns.
- Room membership is private and manually provisioned for the first controlled pilot. No public directory, open invites, or stranger DMs.
- Audio is not uploaded, recorded, stored, proxied, or rehosted.
- Optional YouTube channel/video links are a separate creator-profile link-out idea, not room data. They are not implemented by this Auth scaffold; any later implementation must be opt-in, removable, externally opened, and must not fetch or host media.
- Circle people, messages, invite previews, and edits are prototype data. They are not shared or saved to a server.

These boundaries reduce stored data and media costs, but do not guarantee zero operating cost. Free-tier quotas and terms may change; monitor usage and communicate limits before a public pilot.

## Configure the browser client

1. Create or select an Appwrite project.
2. In the Appwrite Console, add a **Web** platform for the hostname serving the app. For local development, use the hostname in the browser URL (for example `127.0.0.1` or `localhost`). Add the production hostname separately.
3. Enable email/password authentication for the project.
4. Set the public values in [`appwrite-config.js`](./appwrite-config.js):

   ```js
   window.HIDDEN_LEAF_APPWRITE_CONFIG = Object.freeze({
       endpoint: 'https://<your-appwrite-endpoint>/v1',
       projectId: '6adceb48003388223012'
   });
   ```

   For Appwrite Cloud, the endpoint is usually `https://<REGION>.cloud.appwrite.io/v1`. Use the endpoint shown in your Console for a self-hosted instance.

5. Serve the app over HTTP(S), reload it, open **CIRCLE → Account**, and create an account or sign in.

The browser SDK is pinned to Appwrite Web SDK `29.1.0` in `index.html`. The SDK sends requests directly to Appwrite; this static app does not need or accept an API key. The endpoint and project ID are public client configuration, not credentials. Never put an Appwrite server API key or other secret in this repository or browser code.

## Run local system tests

Install dependencies with `npm ci`, then run `npm run test:e2e`. The Playwright suite runs against a local static server and mocks Appwrite API requests. It verifies browser flows, not live Appwrite permissions or multi-user persistence. The live-project test remains skipped until an isolated test project and API endpoint are configured.

## Optional Appwrite MCP for VS Code

The workspace configuration in [`.vscode/mcp.json`](./.vscode/mcp.json) connects VS Code to Appwrite's remote MCP server at `https://mcp.appwrite.io`. This is for the coding assistant to inspect and manage Appwrite resources; it is **not** the app's Web SDK endpoint and does not replace `appwrite-config.js`.

After opening the workspace, use VS Code's MCP server controls to start **appwrite**, review the requested access, and complete Appwrite's OAuth sign-in/authorization in the browser. Do not approve access unless you recognize the Appwrite account and intended project. The server requires an Appwrite Cloud account/project. This MCP configuration contains no API key or other secret.

## Current boundary

The account dialog and status badge confirm only whether the browser has an Appwrite Auth session. Existing rooms, chat messages, beat edits, and invitation previews remain local and reset on reload. Do not treat a signed-in user as a project member.

The next shared-data slice needs a room/beat/revision data design and verified server-enforced permissions for owners, editors, and listeners before any collaboration data is sent. Sign-in is not room membership. Stale writes must be rejected and preserved for explicit reconciliation; offline changes must not silently overwrite newer server data. Persistent chat and audio storage are outside the current MVP.
