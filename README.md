# Elemental Tiles

A digital board for a 1–4 player elemental-magic tile game. A 4×4 grid holds
16 tiles — 4 each of green, blue, orange, and purple — shuffled at the start
of every game. Players sit around the board; on your turn you push or pull
one of the four lines facing your side, then end your turn. After everyone
has gone, a monster turn opens up every row and column until it's passed
back to the players.

No build step, no dependencies — it's a static site (`index.html`,
`style.css`, `script.js`).

## Running it locally

Just open `index.html` in a browser, or serve the folder with any static
server, e.g.:

```
npx serve .
```

## Hosting on GitHub Pages

1. Create a new GitHub repository and push these files to the `main` branch
   (they can live at the repo root).
2. In the repo, go to **Settings → Pages**.
3. Under **Build and deployment**, set **Source** to "Deploy from a branch".
4. Choose the `main` branch and the `/ (root)` folder, then **Save**.
5. GitHub will publish the site at `https://<your-username>.github.io/<repo-name>/`
   within a minute or two.

## How to play

- **Setup** — choose 1–4 players and begin. Players are seated at the
  bottom, top, left, and right sides of the board in that order as the
  player count grows.
- **Player turn** — the active player chooses one of the four lines facing
  their side and either **pushes** it (away from them) or **pulls** it
  (toward them). A tile pushed off the far edge of the grid reappears as a
  fresh tile of the same color in the space left behind. Only one push,
  pull, or flip may happen per turn — then end your turn.
- **Flip a tile** — some abilities let you flip a tile to its paired
  element instead of pushing or pulling: green ⇄ purple, orange ⇄ blue. Tap
  **Flip a Tile**, then tap the tile on the board.
- **Monster turn** — once every player has gone, the monster turn opens all
  eight lines (every row and column, in both directions) for as many moves
  as needed. Tap **End Monster Turn** when done to return to Player 1.
- **Undo** — reverts the single most recent action (a push, pull, flip, or
  end-of-turn), any number of times.

## Project structure

```
index.html   – page structure and screens
style.css    – visual design (elemental color tokens, layout)
script.js    – game state, turn order, push/pull/flip logic, undo history
```
