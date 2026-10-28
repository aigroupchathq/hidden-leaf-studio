# Hidden Leaf Studio - Audit, MVP Discovery, and Priority Report

## 1. Reliability audit

### Verified findings and fixes

| # | Location | Trigger | Impact | Severity | Status |
|---|---|---|---|---|---|
| 1 | `index.html` splash section and splash CSS | Splash depended on heavy animated markup and could leave users on a blocking dialog if JavaScript failed | Users could be trapped before reaching the studio | High | Fixed: minimal black splash, skip button, 8-second fallback to `enterStudio()` |
| 2 | `index.html` header brand block | Header advertised "Hindi-English rap writing" only | Excluded non-Hindi/English users and mislabeled the product | Medium | Fixed: label changed to "Hidden Leaf Studio" |
| 3 | `index.html` `exportStudioMix()` | Export button or status element missing | Unhandled null access during export | Medium | Fixed: early return when required elements are missing |
| 4 | `index.html` MediaRecorder `stop` handler in `startVocalTake()` | Recording stops after navigation or partial DOM removal | Async handler could throw on null status | Medium | Fixed: status null guard |
| 5 | `index.html` vocal language logic | Language options hardcoded to mixed/Roman Hindi/Urdu/English | Could not represent Spanish or future languages without editing conditionals throughout the app | Medium | Fixed: Spanish mode added and logic generalized |
| 6 | `index.html` vocal recording controls | Reverb and echo toggles could be changed while monitor was off | Misleading audio state and possible silent effects | Medium | Fixed: toggles disabled unless monitor is on |
| 7 | `index.html` recording workflow | No count-in and no shared mic level feedback | Takes could start late or clip without warning | High | Fixed: count-in selector, input meter, clipping warning |
| 8 | `index.html` take rendering | Takes had no volume, rename, or timing nudge controls | Destructive or awkward editing workflow | Medium | Fixed: per-take volume, rename, and nudge controls |

### Suspected risks not yet verified

- Live Appwrite integration remains skipped until endpoint and isolated test data are configured.
- Mobile Safari behavior is not covered by the current Chromium-only Playwright suite.
- Latency calibration is currently a UI/state action; it does not yet perform a measured round-trip calibration.
- Spanish vocabulary data is sparse; Spanish mode currently falls back to English atlas entries when no Spanish entries exist.
- Count-in timing depends on the beat BPM input and assumes a 4/4 bar.

## 2. Minimal splash screen

Implemented a lightweight splash with:
- Pure black background.
- White rhythmic pulse for beats.
- Subtle white waveform movement for vibration.
- Red flowing spectral line for vocals.
- Minimal text: title, short subtitle, start and skip buttons.
- Reduced-motion support.
- No autoplay audio.
- Skip button and 8-second fallback so loading failures cannot trap users.

Simulated visual reactions are decorative only; they do not represent live audio analysis.

## 3. MVP discovery and measurement cycle

### Known
- The app runs as a local-first browser studio.
- Existing automated tests pass: 15 passed, 1 skipped.
- Recording, pitch display, beat editing, export, and local persistence are implemented.
- No user research data or production usage metrics are available in this repository.

### Assumed
- Solo rappers and writers value fast local capture of vocal ideas.
- Pitch guidance and beat alignment improve practice.
- Users prefer local-only storage for early drafts.

### Candidate experiments

| Candidate | Target user/problem | Smallest experiment | Metric | Period | Continue / revise / stop |
|---|---|---|---|---|---|
| Reliable local recording | Solo artist losing or misaligning takes | Add count-in, level meter, clipping warning, and take controls | Successful takes saved per session; clipping warnings resolved | 2 weeks | Continue if saved takes increase; revise if users ignore controls; stop if no usage |
| Pitch tuning | Artist unable to hear target note | Show target note, cents, and keyboard highlighting | Time from key selection to first sung note; repeated tuning interactions | 2 weeks | Continue if interaction increases; revise if confusion; stop if unused |
| Beat editing | Artist needs a simple groove | Keep 16-step editor and beat/take sync | Beat plays during recording; number of beat edits per take | 2 weeks | Continue if beat edits correlate with saved takes |
| Global language support | Non-English/Hindi users excluded | Add Spanish mode and generalize labels | Language mode selections; search success by mode | 3 weeks | Continue if Spanish mode is used; revise if atlas lacks data |
| Cloud sync/accounts | Multi-device or collaboration needs | Keep collaboration preview labeled as demo until backend is configured | Account creation and room usage in a safe test environment | 4 weeks | Stop or revise unless live backend tests pass |

## 4. MVP priority ranking

Weights: U 0.35, F 0.25, E 0.20, C -0.10, R -0.10.

| Candidate | U | F | E | C | R | Score |
|---|---:|---:|---:|---:|---:|---:|
| Reliable local recording | 5 | 5 | 2 | 3 | 3 | 2.80 |
| Pitch tuning | 4 | 4 | 2 | 2 | 2 | 2.40 |
| Beat editing | 4 | 4 | 2 | 2 | 2 | 2.40 |
| Cloud sync/accounts | 4 | 4 | 1 | 5 | 5 | 1.60 |
| Global language support | 3 | 3 | 1 | 3 | 3 | 1.40 |
| Collaboration preview | 3 | 2 | 1 | 4 | 5 | 0.85 |

## Next MVP recommendation

Prioritize **reliable local recording**.

It has the highest score, directly supports the core job of capturing vocal ideas, and can be delivered with browser-native APIs at near-zero marginal cost and no paid dependencies. Production economics favor this over cloud sync or collaboration: local recording avoids backend infrastructure, retries are limited to microphone permission, and latency is determined by the browser audio stack rather than a remote service.

## Validation

- Playwright suite: 15 passed, 1 skipped.
- Changed areas covered by tests: splash entry flow indirectly, vocal recording, pitch keyboard, export, mobile layout.
- No paid dependencies were added.