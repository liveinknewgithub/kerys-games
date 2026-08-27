# Kery Obby: architecture assessment and roadmap

Assessment date: 2026-08-27

Source reviewed: deployed `index.html`, 1,414 lines / 61,215 bytes

Deployment: Cloudflare Pages at `https://master.kery-obby.pages.dev/`

## Executive assessment

Kery Obby is a complete, charming prototype with an unusually small operational footprint: one static file, no dependencies, no backend, no external assets, and no build step. It already contains the core game loop, desktop and touch input, synthesized sound effects, authored and procedural levels, checkpoints, coins, a 42-item cosmetic shop, and local persistence.

That simplicity is currently an advantage. The next move should not be an engine rewrite or a backend. First make the simulation correct across devices, fix two progression-blocking UI/state bugs, introduce repeatable browser tests, and split the monolith along its existing boundaries. Keep Canvas 2D and Cloudflare Pages while the game is still proving its core loop.

## System map

```text
Keyboard / touch / pointer
           |
           v
  input flags and mode-specific click handlers
           |
           v
 requestAnimationFrame -> update() -> mutable game state -> render() -> 800x600 Canvas
                              |                          |
                              |                          +-> Web Audio oscillators
                              +-> localStorage save data

Static HTML/CSS/JS ----------------------------------------------> Cloudflare Pages
```

Everything executes in a single browser tab. There are no API calls, third-party libraries, cookies, accounts, server-side authority, asset requests, or runtime network dependencies.

## Current architecture

| Concern | Current implementation | Notes |
|---|---|---|
| Delivery | Static `index.html` on Cloudflare Pages | Response is public, unminified source; `x-robots-tag: noindex`; no build metadata is present. |
| Display | Fixed logical 800×600 Canvas, CSS-scaled to the viewport | Maintains 4:3 aspect ratio and supports fullscreen. All UI is also drawn into the Canvas. |
| Loop | `requestAnimationFrame`, `update()`, then `render()` | The measured frame delta is discarded and a fixed update is performed once per rendered frame. |
| State | One mutable `state` object plus module-level shop/input variables | Modes are `MENU`, `PLAY`, `DEAD`, `WIN`, and `SHOP`. |
| Physics | Hand-written velocity, gravity, friction, AABB platform collision, sampled spinner collision | Compact and understandable, but tied to render rate and not yet covered by tests. |
| Content | Three authored levels, then deterministic procedural generation | Eight visual themes cycle indefinitely; difficulty caps after 15 increments. |
| Economy | Coins from pickups, stage completion, and five-stage milestones | All balances and purchases are client-authoritative and editable via browser tools. This is fine until competition or real-money value exists. |
| Cosmetics | 10 hats, 14 colors, 11 faces, and 7 pets | Rendering behavior and catalog data are mixed together in object literals. “VIP” is a visual label; every item is purchased with earned coins. |
| Persistence | One `localStorage` record: `kery_obby_save` | Saves coins, equipped/owned items, and touched checkpoint identifiers; there is no schema version or migration. |
| Audio | Web Audio oscillators generated at runtime | Zero asset weight and resumes audio after interaction. |
| Testing hooks | `window.render_game_to_text()` and `window.advanceTime(ms)` | Useful beginnings, but there is no automated test runner or CI. |

## What is working well

- The deployed game is self-contained and can be archived or served almost anywhere.
- The code already has clear conceptual seams: audio, shop, state, level generation, physics/update, drawing, and input.
- Procedural levels are deterministic by stage index, which is valuable for reproducing bugs and comparing scores.
- The text-state and time-advance hooks make browser automation much easier than starting from scratch.
- No remote data collection or third-party runtime code means a small privacy and supply-chain surface.
- Desktop, touch, orientation changes, fullscreen, synthesized feedback, checkpoints, cosmetics, and save data create a surprisingly complete prototype loop.

## Findings and risks

### P1 — stabilize before adding content

1. **Gameplay speed depends on display refresh rate.** `gameLoop()` computes `dt` but calls `update(1/60)` exactly once per animation frame. On a 120 Hz display the simulation can run about twice as fast as on 60 Hz; throttled 30 Hz rendering can run about half as fast. Input feel, timers, moving platforms, hazards, and score comparisons therefore vary by device. Use a capped accumulator with fixed 60 Hz simulation steps, or consistently scale all movement by elapsed seconds.

2. **The purchase popup can become invisible while still blocking the shop.** Rendering decrements `vipPopupTimer` only while it is positive. At zero the overlay disappears, but `showVIPPopup` remains true and the click handler continues intercepting every click. Remove the timer, or close the modal state when the timer expires.

3. **Opening the shop at a milestone can discard the run.** The milestone screen can enter `SHOP`, but the shop's Back action always goes to `MENU`. The player then loses the “keep going” path and must restart at stage one. Track and restore the previous mode, or make the shop an overlay.

4. **Checkpoint persistence is internally contradictory.** Touched checkpoint IDs are loaded from storage, but `startGame()` immediately replaces them with an empty set. The actual checkpoint position and current stage are not saved. Decide whether checkpoints are session-only; if so, stop persisting them. If continuation is intended, save a versioned run state and expose Continue/New Game choices.

### P2 — address as the prototype becomes a maintained product

- **The single file is past its comfortable scaling point.** Gameplay, content, persistence, UI, rendering, and audio share mutable globals. Small edits can affect distant behavior, and merge conflicts will grow.
- **There is no regression safety net.** The JavaScript parses successfully and exposes test hooks, but there are no unit, simulation, browser, or mobile viewport tests and no continuous integration.
- **Canvas-only controls are inaccessible.** Buttons have no DOM semantics, focus states, screen-reader labels, or keyboard navigation. Global `touch-action: none`, disabled text selection, and disabled zoom also make the page harder to use. There are no reduced-motion, volume, or high-contrast settings.
- **Physics and content mutate the same level objects.** Moving positions and spinner rotations live directly on cached level data. Restart/reset behavior is implicit, and future replay or deterministic simulation features will be fragile.
- **Mobile control semantics cause auto-jumping.** Touching most of the upper playfield sets jump and may also set movement, so a held movement touch can repeatedly jump whenever grounded.
- **Save data is not validated or versioned.** Corrupt values are silently ignored as a whole, unknown item IDs can be equipped, and future catalog changes have no migration path.
- **Client-only currency is not trustworthy.** Players can edit coins and unlocks in local storage. Keep this model for an offline toy; move authority server-side only if leaderboards, shared identity, purchases, or competitive rewards are introduced.
- **Several implementation remnants should be removed or completed.** `previewEquipped`, `coinsCollected`, and `levelWidth` are unused. This is minor today but signals missing static analysis.
- **Release metadata is absent.** There is no source-controlled Pages configuration, deployment workflow, changelog/version display, error monitoring, analytics, content security policy, or documented rollback process.

## Recommended target architecture

Preserve the current delivery model while separating pure game logic from browser adapters:

```text
src/
  main.js             Browser bootstrap and animation loop
  game/state.js       State creation, modes, transitions, reset/continue
  game/simulation.js  Fixed-step movement, collision, hazards, progression
  game/levels.js      Authored levels, generator, validation
  game/economy.js     Rewards, catalog ownership, purchase rules
  input/controls.js   Keyboard, pointer, and touch actions
  render/canvas.js    World and UI drawing
  audio/sfx.js        Web Audio lifecycle and sound effects
  storage/save.js     Versioned serialization, validation, migrations
tests/
  unit/               Generator, economy, save, and collision tests
  browser/            Menu, play, death, milestone, shop, persistence, mobile
```

Use ES modules and a small Vite/Vitest/Playwright toolchain when refactoring begins. Vite is useful here for module development, cache-busted production output, and static deployment—not because the game needs a UI framework. Avoid React for the game surface. Keep Canvas 2D unless the roadmap requires sprite sheets, complex animation state, tile maps/editors, many simultaneous entities, or richer physics; those are the signals to evaluate Phaser rather than preemptively adopting it.

Similarly, do not add a backend yet. Add one only when a product requirement needs trusted or shared state: cross-device saves, accounts, leaderboards, parental controls, moderation, paid entitlements, multiplayer, or live content operations.

## Roadmap

### Now: preserve and stabilize (1–3 days)

- Keep this exact snapshot as the recovery baseline and tag it (for example, `obby-snapshot-2026-08-27`).
- Fix the frame-rate-dependent loop, invisible purchase modal, and milestone-to-shop return path.
- Make an explicit product decision on Continue vs New Game and align saved fields with it.
- Add a smoke test that loads the page, starts a run, advances deterministic time, reaches death/restart, opens/closes the shop, and reloads saved cosmetics.
- Test at 30, 60, and 120 Hz plus representative phone/tablet viewports.

**Exit criteria:** identical simulation results across refresh rates; no modal or navigation traps; the critical loop is covered by repeatable tests.

### Next: establish a maintainable foundation (3–7 days)

- Introduce modules along the boundaries above without changing gameplay.
- Separate immutable level definitions from per-run runtime state.
- Add a versioned save schema with validation, targeted recovery, and migrations.
- Add unit tests for deterministic level generation, collision edge cases, rewards, purchases, and serialization.
- Add GitHub-based Cloudflare Pages deployment with preview builds, a production branch, and rollback instructions.
- Add formatting/linting and CI for syntax, tests, and a browser smoke run.

**Exit criteria:** features can be changed in focused files, saves survive catalog evolution, and every production deploy is reproducible from GitHub.

### Then: improve the game, guided by play data (1–3 weeks)

- Curate the first 10–15 stages instead of relying on procedural generation immediately after stage three; use generated layouts as authoring seeds.
- Add a lightweight start flow with Continue/New Game, settings, volume/mute, control help, and reduced-motion options.
- Improve mobile controls with separate movement/jump pointers, remapping, safe-area support, and device testing.
- Add stage goals and feedback: best time, deaths, coin completion, replay, and a clear end-of-run summary.
- Balance the coin economy against real playtime and clarify or rename “VIP” unless it represents an actual entitlement.
- Add semantic DOM overlays for menus and shop controls so keyboard and assistive technology users can navigate them.

**Exit criteria:** the first-session experience is intentionally paced, mobile play is reliable, progression has clear goals, and accessibility basics exist.

### Later: add product infrastructure only when justified

- Privacy-conscious analytics for start, stage completion, death location, session length, shop preview/purchase, and retention—only with an explicit data policy and consent approach appropriate for the audience.
- Error monitoring and performance telemetry.
- Cloud save/accounts or trusted leaderboards if users demonstrably need cross-device or competitive features.
- A content pipeline or Phaser evaluation if hand-authored assets, animation, entity count, and level tooling outgrow the focused Canvas renderer.
- PWA/offline packaging if installation and offline replay are valuable.

## Immediate implementation order

The highest-leverage next pull request should be a narrow stabilization change: fixed-step loop, modal state fix, shop return-state fix, and browser regression tests. Do that before adding more cosmetics or procedural themes. It protects the existing fun, removes device-dependent behavior, and creates the safety net needed for the modular refactor that follows.

## Backup provenance

The checked-in `index.html` was retrieved directly from the live deployment and left byte-for-byte unchanged. At capture time, both remote and local files produced SHA-256 `f77863c8f37259cd2b0387d4247a9c9e39702e18dd4bf0d8daab2d0b2677b93f`. The deployment returned HTTP 200 with `content-type: text/html; charset=utf-8`, `cache-control: public, max-age=0, must-revalidate`, `x-content-type-options: nosniff`, `referrer-policy: strict-origin-when-cross-origin`, and `x-robots-tag: noindex`.
