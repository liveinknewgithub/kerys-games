# Kery's Games

Source backup and technical notes for **Kery's Awesome Obby**, a browser-based HTML5 Canvas platformer.

## Kery Obby

- Live snapshot source: `https://master.kery-obby.pages.dev/`
- Captured: 2026-08-27
- Snapshot SHA-256: `f77863c8f37259cd2b0387d4247a9c9e39702e18dd4bf0d8daab2d0b2677b93f`
- Preserved snapshot: [`snapshots/2026-08-27/index.html`](snapshots/2026-08-27/index.html)
- Architecture and roadmap: [`docs/kery-obby-architecture-and-roadmap.md`](docs/kery-obby-architecture-and-roadmap.md)

The deployed application published its complete, unminified source as one HTML response. That byte-for-byte response is preserved under `snapshots/`. The root `index.html` is the actively developed game.

## Run locally

No build step or dependencies are required. From the repository root:

```sh
python3 -m http.server 8000
```

Then open `http://localhost:8000/`.

## Repository layout

```text
index.html                                  Actively developed game
snapshots/2026-08-27/index.html             Exact deployed source backup
tests/level-5.test.mjs                      Authored Level 5 geometry test
docs/kery-obby-architecture-and-roadmap.md Architecture assessment and recommended next steps
```

## Test

```sh
node --test tests/*.test.mjs
```

## Snapshot verification

```sh
curl -sSL https://master.kery-obby.pages.dev/ | shasum -a 256
shasum -a 256 snapshots/2026-08-27/index.html
```

Matching hashes confirm that the preserved snapshot is identical to the captured deployment. A future deployment may naturally produce a different hash.
