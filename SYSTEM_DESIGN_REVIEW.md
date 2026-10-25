# Hidden Leaf Studio: brutal system-design review

This is a decision and test document for taking Hidden Leaf from its current browser prototype toward a production collaboration platform. It is intentionally skeptical: an unanswered question is a design risk, not permission to choose the most convenient behavior.

## Current system snapshot

Observed in this repository:

- The product is primarily a single `index.html` page with inline application code.
- Lyrics, language selection, vocabulary exploration, rhyme/material previews, beat editing, vocal pitch guidance, and the Circle collaboration preview live in the browser.
- Drafts and personal preferences use browser storage. Circle rooms, role examples, messages, and beat snapshots are in-memory demonstration data.
- `appwrite-auth.js` provides a browser-side Auth slice. `appwrite-config.js` contains the configured Appwrite project ID (`6adceb48003388223012`), but the Web SDK API endpoint is still blank.
- Appwrite Tables/Databases, membership records, invite delivery, durable chat, beat persistence, Realtime subscriptions, audio uploads, server functions, migrations, and production deployment automation are not configured here.
- A Playwright system-test harness now covers local UI behavior and mocked Appwrite Auth requests. Live Appwrite integration remains skipped until the API endpoint and isolated test environment are configured.
- An account session, once configured, must not be mistaken for membership in any room. The UI labels collaboration content as demo/local.

**Current production-readiness assessment:** not ready for multi-user data or public collaboration. The MVP product boundary is now defined; the critical implementation gaps are real service configuration, enforceable authorization, persistence/concurrency design, and repeatable live-service tests.

## How to use this review

For each question, record:

1. **Decision** — one unambiguous answer.
2. **Owner** — product, design, engineering, security, legal, or operations.
3. **Evidence** — prototype, user research, policy, threat model, or test.
4. **Release gate** — what must be true before implementation or launch.
5. **Revisit trigger** — what change would invalidate the decision.

Do not convert unresolved questions into hidden defaults. Mark them `OPEN`, name the decision-maker, and keep the affected capability behind a demo label or feature flag.

## 1. Product purpose and success

- [ ] Who is the primary user at launch: solo lyricist, rapper, beatmaker, producer, writing group, or all of these?
- [ ] What is the one painful task Hidden Leaf must make measurably better than a notes app, DAW, or existing writing tool?
- [ ] Is the product first a writing studio with optional collaboration, or a collaboration network with writing tools?
- [ ] What is the smallest complete user outcome: finish a verse, rehearse a flow, make a beat sketch, get feedback, or publish/share a track?
- [ ] What does “deep meaning” mean operationally without judging an artist’s identity, politics, or artistic worth?
- [ ] Which behaviors show value: weekly retained writers, completed drafts, useful revisions accepted, sessions with collaborators, or tracks exported?
- [ ] Which metric could increase while the product gets worse (for example, time spent due to distracting animations)?
- [ ] What is the target cohort and how will its language, device, connectivity, and accessibility needs be researched?
- [ ] Is the target audience adult-only? If not, what age gates, parental controls, and child-data obligations apply?
- [ ] Which product capabilities are MVP, experimental, explicitly deferred, or never intended?
- [ ] Is there a business model? If so, what is free, paid, rate-limited, or subject to usage caps?
- [ ] What is the product’s promise when the network is down or Appwrite is unavailable?
- [ ] Which use cases must remain possible without creating an account?
- [ ] Is the app a private instrument, a social network, a marketplace, a publishing tool, or some carefully bounded combination?
- [ ] What are the explicit non-goals (public discovery feed, unsolicited DMs, AI-generated lyrics, audio hosting, monetization, etc.)?

## 2. Audience, language, and cultural fit

- [ ] Which scripts are supported at launch: Latin-script Hindi/Urdu, Devanagari, Urdu script, English, or code-switching across scripts?
- [ ] Does “Roman Hindi/Urdu” mean transliteration input only, or should the product convert scripts?
- [ ] How are Hindi, Urdu, Hinglish, regional vocabulary, borrowed words, and dialects classified without forcing one identity label?
- [ ] Can a single line mix scripts and languages while syllable estimates and vocabulary guidance remain useful?
- [ ] Does the global language filter change only suggestions, or also labels, meter guidance, pronunciation, search, and rhyme material?
- [ ] What happens when the detected language conflicts with the selected language?
- [ ] Is language choice persisted per user, per draft, per line, or per session? Which source wins on conflict?
- [ ] How are transliteration variants, spelling variants, aspirated consonants, long vowels, and nasalization handled?
- [ ] How are pronunciation differences across regions and individual performance represented?
- [ ] What evidence qualifies a rhyme as exact, near, assonant, multisyllabic, or only a loose creative association?
- [ ] Who reviews definitions, transliterations, pronunciation notes, and culturally sensitive examples?
- [ ] How will the product avoid presenting one dialect or region’s judgment as universal?
- [ ] Can artists flag a bad or harmful suggestion, and what is the review/appeal process?
- [ ] Are slurs, reclaimed language, political speech, religious references, and code-switching treated consistently and transparently?
- [ ] How are vocabulary sources licensed, attributed, updated, and removed on request?
- [ ] Is every suggestion allowed to remain optional, with a clear explanation of its relationship to the draft?
- [ ] How does the interface preserve author voice and avoid nudging all writers toward the same generic metaphors?
- [ ] Which types of “depth” prompts are helpful, and which are judgmental, culturally biased, or emotionally intrusive?

## 3. Creative workflow and interaction logic

- [ ] What is the canonical writing object: a line, verse, song, project, or document with sections?
- [ ] What structure can an artist create (bars, hooks, verses, bridge, ad-libs, notes, alternate takes)?
- [ ] Can artists freely reorder, duplicate, split, merge, and delete sections without losing history?
- [ ] How is autosave communicated, and what does “Saved” mean: queued locally, written to server, or synced everywhere?
- [ ] How does the app recover from a tab crash, browser storage quota, private mode, or device loss?
- [ ] Is undo/redo supported across text edits, beat changes, metadata edits, and collaborative operations?
- [ ] Can the artist compare revisions and selectively restore text, beat patterns, or both?
- [ ] Are beat edits and lyric edits separate versions or one atomic creative revision?
- [ ] Can a prompt be dismissed, personalized, or disabled entirely?
- [ ] Can a user inspect why a word, rhyme, flow note, or motif suggestion appeared?
- [ ] Is the floating vocabulary field functional discovery or visual decoration? What usability evidence justifies its motion and density?
- [ ] Can motion be reduced or disabled independently of all other animations?
- [ ] Do word suggestions ever replace text automatically? If yes, what confirmation and undo are required?
- [ ] Are syllable counts estimates or claims of linguistic accuracy? How are uncertainty and accent variation shown?
- [ ] What is the algorithm for detecting syllables, stress, cadence, and flow across mixed scripts?
- [ ] Does the artist control tempo, meter, swing, subdivision, key, scale, and count-in?
- [ ] What does “play” play: synthesized demo, uploaded beat, microphone monitor, or exported audio?
- [ ] Is a bass drone a tuning/reference tone or a loop? Can it be stopped globally, and does it respect mute and device changes?
- [ ] Are settings and controls consistent across WRITE, VOCAL, BEAT, EXPLORE, and CIRCLE?
- [ ] What keyboard-only path completes common writing and editing tasks?
- [ ] What happens when the user navigates away with unsaved or failed-to-sync changes?
- [ ] Are destructive actions confirmed, and can they be recovered?

## 4. Accounts, identity, and sessions

- [ ] Which sign-in methods are supported: email/password, magic link, OAuth, passkeys, or social login?
- [ ] Is email verification required before creating or joining shared rooms?
- [ ] What are account recovery, password reset, account deletion, and session revocation flows?
- [ ] Can a user change email or display name without orphaning membership or attribution?
- [ ] How are usernames reserved, normalized, and protected against impersonation?
- [ ] Is a public profile necessary for private friend collaboration?
- [ ] What profile information is visible to collaborators by default?
- [ ] How are multi-device sessions listed, terminated, and protected?
- [ ] What happens to drafts and memberships after an account is suspended or deleted?
- [ ] Are authentication errors specific enough to help but not reveal whether an email is registered?
- [ ] What is the policy for duplicate accounts and account merge?
- [ ] How are session expiry, token refresh, stale tabs, and clock skew handled?
- [ ] What happens if a user signs out while a save or upload is pending?
- [ ] Which endpoints or flows require step-up authentication?

## 5. Collaboration model and authorization

- [ ] What is the exact resource hierarchy: user → circle → project/room → beat/version → message/attachment?
- [ ] Is a “friend” relationship mutual, one-way, invitation-based, or simply project membership?
- [ ] Can a project exist outside a circle? Can a collaborator belong to several circles?
- [ ] Who owns a room, and can ownership transfer?
- [ ] Which roles exist: owner, editor, commenter, listener, admin? What exact actions does each role allow?
- [ ] Is role permission evaluated server-side on every read/write, or merely hidden/disabled in the interface?
- [ ] Can listeners chat, download, copy, or screenshot beats? Is that distinction intentional?
- [ ] Can editors edit lyrics, beat patterns, metadata, or only selected components?
- [ ] Can collaborators invite others? Can an owner disable onward invitations?
- [ ] Are invitations sent by email, username, share link, or an in-app inbox?
- [ ] How are invitation links protected against guessing, replay, forwarding, and use after revocation?
- [ ] Do invitations expire? Can they be revoked or reissued? What can the invitee see before accepting?
- [ ] How are pending, accepted, declined, expired, and revoked invitations represented?
- [ ] What does revocation do to existing sessions, cached data, subscriptions, downloads, and open tabs?
- [ ] Can a member remove themselves? Can the last owner leave?
- [ ] How does an owner remove a member, and is the member notified?
- [ ] Is there a role-change audit trail?
- [ ] Are cross-project copy/import actions allowed?
- [ ] Can someone discover rooms through search, IDs, public URLs, or Realtime channels without membership?
- [ ] What prevents insecure direct-object references (changing a room ID to read another user’s room)?
- [ ] How are deleted accounts and unavailable users displayed in historical attribution?

## 6. Data model, persistence, and version history

- [ ] What entities and stable IDs are required for users, circles, projects, memberships, invitations, messages, beat revisions, and audio?
- [ ] Which data is canonical in Appwrite and which is local cache?
- [ ] Are drafts saved locally, remotely, or both? How does the user select or understand this?
- [ ] What is the schema migration and rollback strategy?
- [ ] Which fields are indexed, unique, required, validated, size-limited, or encrypted?
- [ ] What limits apply to titles, lyric text, message length, project size, and history depth?
- [ ] Are lyrics and messages versioned independently?
- [ ] What does “restore” mean: create a new revision or overwrite current state?
- [ ] Are revisions immutable and attributable? Can users compare and branch from an older revision?
- [ ] How are timestamps normalized, displayed, and ordered across time zones?
- [ ] What happens if the same revision is submitted twice due to retry?
- [ ] What is the idempotency key or deduplication rule for create/update/message operations?
- [ ] What is the conflict policy when two editors save the same beat or lyric concurrently?
- [ ] Is last-write-wins acceptable? If not, is operation-based merge, optimistic concurrency, or explicit conflict resolution required?
- [ ] Can a stale tab overwrite newer content? How is its base revision detected?
- [ ] How are partial failures handled when a project, revision, and activity item must be written together?
- [ ] What is the retention period for deleted projects, revisions, messages, and backups?
- [ ] Does “delete” mean hide, soft delete, hard delete, or eventual purge?
- [ ] Can a user export all their content in a usable format before deleting an account?
- [ ] How are references handled when a room is deleted but its messages or attachments remain?
- [ ] Is content encryption at rest sufficient, or are there end-to-end confidentiality requirements?

## 7. Realtime, offline use, and synchronization

- [ ] Which events must be live: messages, beat steps, online presence, role changes, invites, version updates?
- [ ] What is the authoritative source after reconnect: server state, local state, or a conflict-resolution screen?
- [ ] How are offline edits queued, ordered, retried, deduplicated, and surfaced?
- [ ] How long can an offline queue retain sensitive lyrics or messages?
- [ ] What happens when access is revoked while a client is offline?
- [ ] Are Realtime subscriptions filtered and authorized per room and member?
- [ ] How are subscriptions cleaned up on navigation, sign-out, account switch, and tab closure?
- [ ] How do clients recover from missed events, duplicate events, out-of-order delivery, or a dropped WebSocket?
- [ ] Is presence necessary for MVP? How are stale “online” indicators corrected?
- [ ] Can multiple tabs for one user create duplicate subscriptions or competing edits?
- [ ] What heartbeat, reconnect backoff, and rate limits are acceptable?
- [ ] How is the user informed that a visible beat or chat is stale?
- [ ] Is collaboration useful on weak or intermittent mobile networks?

## 8. Audio, microphone, and media rights

- [ ] Is audio in MVP? If so, is it a generated loop, user-uploaded beat, recorded voice, or all three?
- [ ] Does microphone use require an explicit user gesture and a clear permission explanation?
- [ ] Is any microphone signal ever recorded, uploaded, cached, or analyzed by a third party?
- [ ] How can a user verify the microphone is off and stop every media track?
- [ ] What happens if permission is denied, revoked mid-session, or the device has no microphone?
- [ ] Is pitch analysis local, server-side, or delegated to a vendor?
- [ ] What latency and accuracy are acceptable for tuning feedback?
- [ ] Which browsers, sample rates, audio devices, Bluetooth routes, and mobile power states are supported?
- [ ] Does playback stop on navigation, page hide, call interruption, or output-device change?
- [ ] What file types, codecs, size limits, durations, and metadata are accepted for uploads?
- [ ] How are malicious media files scanned, transcoded, and served safely?
- [ ] Who owns uploaded beats, vocals, samples, and derivative works?
- [ ] What licenses are required for sample packs and generated sound assets?
- [ ] Can an uploader revoke, replace, or delete media already referenced by versions?
- [ ] Are audio URLs private, short-lived, and permission-checked?
- [ ] What are storage, bandwidth, transcoding, and egress cost ceilings per user/project?

## 9. Security and abuse resistance

- [ ] What is the threat model for private lyrics, unreleased audio, account credentials, and collaboration invitations?
- [ ] Are all membership and role checks enforced by Appwrite permissions or trusted server functions?
- [ ] Can a client grant itself owner/editor permissions by changing a request payload?
- [ ] Are Appwrite project/database identifiers the only client-side configuration? Are server API keys excluded from the build?
- [ ] Are allowed Web platforms, CORS, redirect URLs, and OAuth callbacks restricted to owned domains?
- [ ] How are script injection, HTML injection, Markdown links, unsafe URLs, and rich-text rendering prevented?
- [ ] Are search terms, file names, and invite handles validated and encoded at every boundary?
- [ ] Are API calls rate-limited for sign-up, login, password reset, invitation, message sending, and uploads?
- [ ] How are credential stuffing, enumeration, spam, harassment, and repeated invite abuse detected?
- [ ] Can users block, mute, report, and leave abusive rooms?
- [ ] Who reviews abuse reports, within what response time, and with what appeal mechanism?
- [ ] What audit events are recorded, and can a malicious owner erase them?
- [ ] Are logs free of passwords, tokens, private lyrics, message contents, and signed media URLs?
- [ ] What CSP, dependency pinning, integrity, update cadence, and supply-chain checks protect the CDN-delivered SDK?
- [ ] Are secrets ever present in Git history, build output, browser storage, or error telemetry?
- [ ] What is the incident response plan for a leaked project, compromised account, or incorrect permission rule?
- [ ] Has cross-user and cross-room authorization been tested with hostile IDs, not just normal UI navigation?
- [ ] What data is exposed by error messages, timing, search, notifications, and analytics?
- [ ] Are backups and exports protected to the same standard as the live database?

## 10. Privacy, consent, and governance

- [ ] Which personal data is collected, for what purpose, and for how long?
- [ ] Are lyrics, voice samples, analytics events, and crash reports treated as potentially sensitive?
- [ ] Does telemetry collect typed content, keystrokes, word selections, microphone state, or only coarse events?
- [ ] Can users opt out of nonessential analytics without losing core functionality?
- [ ] Which vendors process account, audio, analytics, email, or support data?
- [ ] Where are Appwrite and backups hosted, and which data residency promises are made?
- [ ] What legal basis, privacy notice, terms, community rules, and copyright policy are required?
- [ ] How are data-access, correction, export, deletion, and consent-withdrawal requests fulfilled?
- [ ] How long do backups retain deleted data, and how is that explained?
- [ ] Are collaborators told when their edits, presence, or messages are visible to project members?
- [ ] Can a creator remove a collaborator’s messages or only their access?
- [ ] What happens to shared content after one collaborator requests account deletion?
- [ ] Is voice analysis or uploaded audio used to train models? If not, is that prohibition documented and enforced?
- [ ] Is any AI feature planned? What data would it send, to whom, and under which consent?
- [ ] How are content moderation decisions communicated and appealed?

## 11. Accessibility, usability, and device support

- [ ] What WCAG target is the release gate, and who performs manual assistive-technology review?
- [ ] Are all controls keyboard reachable with visible focus and logical order?
- [ ] Are dialogs labeled, focus-contained, dismissible, and focus-restoring?
- [ ] Are dynamic saves, errors, chat messages, and pitch updates announced accessibly without overwhelming screen readers?
- [ ] Are colors, active states, disabled states, and chart-like beat patterns understandable without color alone?
- [ ] Does the motion honor `prefers-reduced-motion` across every animated word and VFX element?
- [ ] Can users increase text size without clipping or horizontal scrolling?
- [ ] Are touch targets large enough at realistic phone widths and with one-handed reach?
- [ ] Does the sticky navigation or virtual keyboard obscure the active line, dialog, or chat input?
- [ ] Are screen-reader labels meaningful for beat steps, pitch values, and floating word candidates?
- [ ] Does the interface work at 320px width, landscape phone, tablet, and desktop?
- [ ] Is browser zoom to 200% usable?
- [ ] Which browsers, operating systems, and assistive technologies are explicitly supported?
- [ ] Does the design avoid relying on hover, precise timing, or color perception?
- [ ] Is the visual density of floating words tested for distraction and cognitive load?

## 12. Reliability, performance, and operations

- [ ] What availability, latency, recovery-time, and recovery-point objectives apply?
- [ ] What does the app do when the CDN, Appwrite, Realtime, Storage, or email provider fails?
- [ ] Are CDN or SDK outages a complete app failure? Can essential writing still work offline?
- [ ] What are page-load, interaction, and memory budgets on a low-end phone?
- [ ] How large can the vocabulary, project list, chat history, and version history grow before pagination/virtualization is required?
- [ ] What are per-user and per-project read/write quotas?
- [ ] What cost alerts and hard limits prevent runaway audio or Realtime usage?
- [ ] Are error messages actionable and are errors logged without leaking content?
- [ ] What health checks, synthetic checks, dashboards, and alert ownership exist?
- [ ] What is the on-call/escalation plan for a privacy or collaboration incident?
- [ ] Are schema changes, SDK upgrades, and permission changes deployable and reversible?
- [ ] What is the rollback plan if a release corrupts drafts or makes rooms inaccessible?
- [ ] Are dependency vulnerabilities monitored and addressed on a defined service level?
- [ ] Does the system expose data freshness and sync state instead of implying success?

## 13. Test strategy and release evidence

- [ ] Which critical user journeys must pass in CI before merge?
- [ ] Which behaviors get unit tests, service integration tests, browser E2E, accessibility tests, and manual review?
- [ ] Is there an isolated Appwrite test project with disposable data and safe test accounts?
- [ ] How are test users, invitations, uploaded files, and test rooms cleaned up?
- [ ] Are permission tests performed as owner, editor, listener, non-member, unauthenticated user, and revoked member?
- [ ] Do tests assert that forbidden requests fail at the service boundary, not merely that buttons look disabled?
- [ ] Are network failure, timeout, rate-limit, duplicate-submit, stale-session, and partial-write cases covered?
- [ ] Are concurrent edits tested with two real browser contexts and deterministic conflict expectations?
- [ ] Are cross-browser, mobile viewport, reduced-motion, keyboard, screen-reader, and zoom checks in the release matrix?
- [ ] Are language tests based on reviewed fixtures for each script, dialect, mixed line, punctuation, and loan-word case?
- [ ] Who owns the gold set for rhyme relevance and syllable estimates, and how is regression measured?
- [ ] What threshold defines a passing test suite, and which failures block deployment?
- [ ] Are flaky tests tracked rather than repeatedly rerun until green?
- [ ] Can a release be traced to a commit, build, schema version, and permission policy?
- [ ] What evidence is needed before saying “works end to end”?

## 14. Brutal launch-gate questions

Do not release real collaboration until each answer is **yes with evidence**:

- [ ] Can an unauthenticated person read a private room by guessing or replaying an ID?
- [ ] Can a listener call the API directly to edit a beat despite disabled UI controls?
- [ ] Can a former member continue to read via an already-open tab, cached payload, or Realtime subscription?
- [ ] Can one collaborator overwrite another’s latest work without a detectable conflict?
- [ ] Can a failed save be mistaken for a successful save?
- [ ] Can an invite be accepted by the wrong account, after expiry, or after revocation?
- [ ] Can a user delete or export all their content without contacting support?
- [ ] Can an uploaded audio file execute script, expose a public URL, or exceed resource limits?
- [ ] Can the product recover from Appwrite/CDN/network failure without losing typed work?
- [ ] Can a screen-reader user complete the core writing and collaboration flow?
- [ ] Does every visual suggestion have a credible relationship to the draft, and can the writer reject it?
- [ ] Are cultural/language quality claims supported by reviewed examples rather than invented confidence?
- [ ] Is there a clear path to report abuse and a staffed response process?
- [ ] Can the team explain exactly what is local, synced, public, private, retained, and deleted?
- [ ] Can a production build be deployed and rolled back without exposing a secret or breaking the current live site?

## System-test specification

### Test environments

1. **Static UI checks** — no Appwrite project; verify the demo works with empty config and labels all mock behavior honestly.
2. **Appwrite integration** — isolated project, explicit Web platform, disposable database/tables, test mail strategy, and no production credentials.
3. **Production-like E2E** — HTTPS hostname, production-like permissions and quotas, synthetic accounts, and cleanup after each run.

Do not run destructive tests against production data. Do not use real artists’ private lyrics or audio as test fixtures.

### Minimum automated layers

| Layer | Purpose | Examples |
|---|---|---|
| Unit | Pure logic and validation | Language selection; role-to-action policy; beat serialization; ID and input validation; sync-state transitions |
| Component | Accessible interaction state | Signup/login modes; save/error status; invite dialog; disabled and pending controls |
| Service integration | Real Appwrite behavior | Session creation; collection/table permissions; membership queries; revision writes; message limits; Realtime authorization |
| Browser E2E | End-to-end user outcomes | Two users create and join a room, edit as permitted, chat, reload, and recover state |
| Adversarial authorization | Prove forbidden actions fail | Non-member reads, listener writes, revoked-member reads, forged owner IDs, cross-room object IDs |
| Resilience | Failure and recovery | Offline save, reconnect, duplicate requests, timeouts, 401/403/429/5xx, stale sessions, partial writes |
| Accessibility | Operability | Keyboard-only, screen reader, reduced motion, zoom, focus management, contrast, touch targets |
| Creative-quality evaluation | Relevance and agency | Reviewed bilingual fixtures, relevance ratings, uncertainty calibration, suggestion rejection/undo |

### Current executable local suite

Run `npm ci`, then `npm run test:e2e`. Playwright serves the app on `127.0.0.1:4173`; the suite uses the pinned Appwrite Web SDK with mocked Appwrite API responses and no real user data.

Current coverage includes:

- Missing Appwrite config and clear blocked-auth state.
- Corrupt local draft recovery.
- English/Roman Hindi vocabulary switching and draft persistence across reload.
- Local beat-room create/edit/restore, listener restrictions, and safe text rendering.
- 390px mobile room/dialog bounds and minimum touch target checks.
- Appwrite SDK signup/sign-out success and invalid-credentials feedback using mocked API responses.

**Latest run:** 7 passed, 1 skipped (live Appwrite project integration). This is a local browser regression suite, not evidence of real authorization, multi-user persistence, Realtime behavior, or offline conflict safety. Add those tests against an isolated Appwrite project before marking the related release gates complete.

### Core end-to-end scenarios

| ID | Scenario | Required assertions |
|---|---|---|
| E2E-01 | First visit with empty Appwrite config | Writing works; Circle is labeled demo; no network write; setup state is accurate |
| E2E-02 | Sign up, verify account, sign out, sign back in | Correct account state, validation, error recovery, and session persistence |
| E2E-03 | Create private room as owner | Server persists room and initial version; owner membership is created atomically or operation is rolled back |
| E2E-04 | Invite an existing account as listener | Invite is scoped, expiring, one-use or explicitly reusable; listener can only perform allowed actions |
| E2E-05 | Invite an existing account as editor | Editor can change permitted content; each change is attributable and versioned |
| E2E-06 | Reject invite, expire invite, revoke invite | Each state transition is enforced server-side and visible to invitee/inviter |
| E2E-07 | Non-member probes room ID | Read, list, subscribe, update, delete, and download are denied without leaking room metadata |
| E2E-08 | Listener attempts direct API write | Server denies beat, lyrics, role, invite, and version mutations regardless of client UI |
| E2E-09 | Revoke active collaborator | Existing sessions and Realtime subscriptions lose access; reload does not restore access |
| E2E-10 | Two editors change same pattern concurrently | Defined conflict policy is applied; no silent lost update; both authors’ changes are recoverable |
| E2E-11 | Send chat with markup, long text, emoji, mixed scripts, and blank input | Text is safely rendered, limits enforced, blank sends blocked, ordering and attribution correct |
| E2E-12 | Network drops during save/send and returns | Pending/error state is visible; retry is safe and idempotent; no duplicate message/version |
| E2E-13 | Reload and open on a second device | Only authorized project state is restored; ordering, role, and latest version are consistent |
| E2E-14 | Delete project/account and request export | Defined retention and purge behavior is honored; export is complete and protected |
| E2E-15 | Upload or access audio (if in scope) | MIME/size/authorization/scanning rules enforced; unauthorized and expired URLs fail |
| E2E-16 | Mic denied, removed, or interrupted | UI explains the state, stops tracks, and never records/uploads without consent |
| E2E-17 | Language changes during an active draft | Vocabulary, rhyme cues, syllable guidance, labels, and subsequent suggestions use selected language; lyrics remain unchanged |
| E2E-18 | Keyboard, screen reader, reduced motion, 200% zoom | Complete primary flow with visible focus, announced status, no inaccessible control or clipped content |

### Adversarial role/action matrix

For every resource, test **owner**, **editor**, **listener**, **non-member**, **unauthenticated**, and **revoked member**:

| Action | Owner | Editor | Listener | Non-member | Unauthenticated | Revoked |
|---|---:|---:|---:|---:|---:|---:|
| Read room metadata | Decide | Decide | Decide | Deny | Deny | Deny |
| Read lyrics/beat | Decide | Decide | Decide | Deny | Deny | Deny |
| Change lyrics | Decide | Decide | Deny by default | Deny | Deny | Deny |
| Change beat pattern | Decide | Decide | Deny by default | Deny | Deny | Deny |
| Send message | Decide | Decide | Decide | Deny | Deny | Deny |
| Invite member | Decide | Deny by default | Deny | Deny | Deny | Deny |
| Change role/remove member | Decide | Deny by default | Deny | Deny | Deny | Deny |
| Read version history | Decide | Decide | Decide | Deny | Deny | Deny |
| Restore version | Decide | Decide | Deny by default | Deny | Deny | Deny |
| Subscribe to Realtime | Decide | Decide | Decide | Deny | Deny | Deny |
| Download audio | Decide | Decide | Decide | Deny | Deny | Deny |

“Decide” is not a permissive default: product/security must specify the intended policy, and tests must encode it before launch.

### Failure-injection checklist

- [ ] Appwrite SDK/CDN unavailable or incompatible SDK loaded.
- [ ] Invalid endpoint, wrong project ID, missing Web platform, CORS rejection.
- [ ] Session expired during navigation, save, chat, and Realtime reconnect.
- [ ] 401, 403, 404, 409, 413, 429, and 5xx responses.
- [ ] DNS failure, offline transition, high latency, dropped response after server commit.
- [ ] Duplicate click, double submit, browser back/forward, repeated webhook/event delivery.
- [ ] Storage full, corrupted local draft, malformed persisted JSON, private-browsing restrictions.
- [ ] Realtime reconnect with event replay, missing event, duplicate event, and stale permission.
- [ ] Account switch in another tab; sign-out in one tab while another is editing.
- [ ] Concurrent role change and data write.
- [ ] Clock skew, daylight-saving boundary, and locale/time-zone change.
- [ ] Mobile app background/resume, viewport resize, virtual keyboard, device sleep.

### Release gates

- **Gate A — prototype integrity:** no claims of server persistence; local writing remains usable; all demo-only behavior is explicit.
- **Gate B — auth:** live account lifecycle and recovery pass against an isolated Appwrite project; no secrets in client or repository.
- **Gate C — private collaboration:** permission matrix passes as real users; unauthorized API requests and subscriptions are denied.
- **Gate D — data safety:** versions, retries, concurrency, export/deletion, backups, and recovery behavior are verified.
- **Gate E — usability and quality:** accessibility, mobile, bilingual quality, and moderated creative evaluation meet agreed thresholds.
- **Gate F — launch readiness:** monitoring, abuse response, privacy/legal review, cost controls, incident plan, deployment/rollback, and support ownership exist.

No gate should be marked complete from screenshots alone. Attach reproducible test runs, environment details, and known limitations.

## Milestone 0 — MVP scope lock

**Status: product boundary defined; implementation and launch gates remain open.** The choices below are intentionally small-data and local-first so the writing studio remains useful without turning into a media host or social network.

### Included in the collaboration MVP

| Area | Boundary |
|---|---|
| Shared room data | Room title, membership/role, beat-step pattern, and immutable revisions of beat-pattern changes. Store only what the room needs; do not copy a user’s whole draft into a room. |
| Roles | Owner provisions members manually for the first controlled pilot. Editors can change beat steps and restore a version. Listeners can read but cannot change or restore. |
| Membership | Private rooms only; no public directory, open invitations, or stranger DMs. Console-managed membership is an initial pilot process, not the long-term onboarding design. Verify the exact Appwrite permission mechanism before implementation. |
| Lyrics and personal drafts | Remain local to the artist’s browser by default, whether or not the artist has an account. Do not sync them to an account or room in this MVP. |
| Revisions | Keep beat revisions for the lifetime of the room; no automatic pruning in MVP. Revisions contain beat state and minimal attribution/time metadata, not audio or lyrics. |
| Stale writes | Reject a save based on an outdated revision. Preserve the editor’s local version and the current server version for explicit reconciliation; never silently overwrite. |
| Offline edits | Keep pending changes local and visibly unsynced. On reconnect, do not auto-apply if the server revision changed or membership was revoked; preserve a private conflict copy. |
| Deletion | Room owner only, with confirmation. Deletion removes room data and revisions subject to the provider’s documented backup-retention behavior; do not promise instant backup erasure. |
| Audio and creator links | No audio upload, recording, proxying, or rehosting. A YouTube channel/video link is a possible separate, opt-in creator-profile link-out, not room content; it must open YouTube and never imply that Hidden Leaf hosts the work. Keep this separate from the room MVP until visibility controls are designed. |

### Excluded from MVP (prototype screens may remain visual-only)

- Persistent chat, direct messages, public feeds/directories, social graphs, presence, and in-product invitations.
- Shared lyric editing, account-synced drafts, and public creator profiles.
- Audio upload, recording, storage, downloads, publishing, or licensing workflows.
- YouTube API access or OAuth, channel scraping, media downloading, proxying, or rehosting.

The Circle screen’s people, chat, invite preview, room edits, and history remain local demonstration data until shared persistence is explicitly implemented. An Appwrite Auth session is not proof of room membership. Preserve the current writing studio and draft behavior; scope messaging should clarify—not imply that these demo controls are connected.

### Cost and privacy posture

Target minimal operational cost, not a promise of literal zero cost: provider free tiers have quotas and terms that may change, and a domain, monitoring, support, or growth may incur expense. Use static delivery where practical and store only the small collaboration records above. Add quota monitoring/limits and a clear failure mode before a public pilot; never silently lose edits or create success-shaped saves when storage is unavailable.

### Remaining implementation and launch gates

1. Configure the Appwrite Web SDK endpoint and add the local hostname as a Web platform.
2. Design and test server-enforced owner/editor/listener permissions using an isolated project and multiple test users.
3. Implement beat persistence, revision creation/restore, stale-write rejection, offline conflict preservation, and confirmed owner deletion.
4. Confirm provider backup-retention behavior and publish accurate privacy/deletion wording.
5. Define account recovery/email verification, export/account deletion, production hosting, monitoring, incident response, abuse handling, and support ownership before public launch.
6. If creator link-outs are later added, define whether each is private or public, let users remove it, validate that it points to YouTube, and open it externally without fetching or storing channel data.

### Appwrite setup status

The configured project ID is `6adceb48003388223012`. The Appwrite **Web SDK API endpoint** (usually a region-specific `https://<region>.cloud.appwrite.io/v1`) is still missing. Add `127.0.0.1` as a Web platform in Appwrite Console. `https://mcp.appwrite.io` is a separate assistant MCP endpoint, not the app endpoint. Project ID and endpoint are public client configuration; **never add an API key or secret**. Until the Web endpoint and isolated test environment exist, only mocked/local tests are possible.
