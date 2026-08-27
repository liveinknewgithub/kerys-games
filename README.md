# Kery's Games

Source backup and technical notes for **Kery's Awesome Obby**, a browser-based HTML5 Canvas platformer.

## Kery Obby

- Live snapshot source: `https://master.kery-obby.pages.dev/`
- Captured: 2026-08-27
- Snapshot SHA-256: `f77863c8f37259cd2b0387d4247a9c9e39702e18dd4bf0d8daab2d0b2677b93f`
- Architecture and roadmap: [`docs/kery-obby-architecture-and-roadmap.md`](docs/kery-obby-architecture-and-roadmap.md)

The deployed application publishes its complete, unminified source as one HTML response. `index.html` is a byte-for-byte snapshot of that response; it has intentionally not been reformatted or refactored in this backup.

## Run locally

No build step or dependencies are required. From the repository root:

```sh
python3 -m http.server 8000
```

Then open `http://localhost:8000/`.

## Repository layout

```text
index.html                                  Exact deployed game snapshot
docs/kery-obby-architecture-and-roadmap.md Architecture assessment and recommended next steps
```

## Snapshot verification

```sh
curl -sSL https://master.kery-obby.pages.dev/ | shasum -a 256
shasum -a 256 index.html
```

Matching hashes confirm that the checked-in snapshot is identical to the current deployment. A future deployment may naturally produce a different hash.
