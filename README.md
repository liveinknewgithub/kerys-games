# Kery's Games

Home of **Kery's Awesome Obby**, a browser-based HTML5 Canvas platformer (obby = obstacle course) built for Kevin's daughter Kery.

Play it live: https://kerys-games.pages.dev

## The game

Run, jump, and climb through 4 hand-built levels. Checkpoints save your spot so you never restart a whole level, coins scattered through each level spend in the shop on hats, colors, faces, and pets to dress up your runner, and finishing a level earns a stage bonus that grows as you progress. Progress saves automatically in your browser.

## Controls

- Arrow keys or A/D: move
- Space or Up: jump
- F: fullscreen
- Touch controls on phones and tablets

## Run locally

No build step or dependencies. From the repository root:

```sh
python3 -m http.server 8000
```

Then open `http://localhost:8000/`.

## Repository layout

```text
index.html                                   The shipped game, kept in sync with the live deploy
docs/kery-obby-architecture-and-roadmap.md  Architecture assessment and recommended next steps
```
