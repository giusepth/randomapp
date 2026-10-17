# RandomSelector

Draw N random winners from a list of participants. A single-page React app with
no backend and no persistence — everything lives in memory for the length of the
session.

## What it does

- Paste a list, one participant per line; a line-number gutter and a live count
  update as you type
- Quick utility actions: load a sample list, shuffle the input, remove
  duplicates or clear it
- Toggle duplicate weighting (a repeated name gets a repeated chance) and the
  celebration effects
- Choose how many winners to draw with a stepper or the 1 / 2 / 3 / 5 presets,
  and watch the live **individual probability** and **winner / total ratio**
- Fisher-Yates shuffle for an unbiased draw, with a short suspense animation
  that cycles candidate names on the CTA
- Winners appear in a native `<dialog>` modal with a podium (1° / 2° / 3°),
  confetti, and actions to copy the result, **redraw**, or **exclude the winners
  and draw again**
- A **session history** panel records every draw, newest first

The draw is validated before it runs: at least 2 participants, a whole number of
winners greater than 0, and never more winners than there are available names.
Errors surface as a toast plus an inline message.

## Getting started

```bash
npm install
npm run dev
```

The dev server is pinned to `http://127.0.0.1:5180` in `vite.config.js` with
`strictPort: true`, so it can run alongside another Vite project without
fighting over port 5173.

## Scripts

| Command             | Description                                 |
| ------------------- | ------------------------------------------- |
| `npm run dev`       | Dev server with HMR on `127.0.0.1:5180`     |
| `npm run build`     | Production build into `dist/`               |
| `npm run preview`   | Serve the production build locally          |
| `npm run lint`      | Lint with oxlint                            |

## Design system

The interface follows the **"Kinetic Clarity"** system: an indigo/emerald/amber
accent palette over a cool slate neutral ramp, with Plus Jakarta Sans for
headlines and labels and Inter for body and data.

Every colour, type step, spacing value, radius and shadow is a custom property
defined in `src/index.css` — split into a primitive layer (raw palette and
scales) and a semantic layer (`--canvas`, `--card`, `--brand` …). `src/App.css`
only consumes the semantic tokens and never hardcodes a value, so rebranding is
a single block edit. Icons use the Material Symbols Outlined font; the interface
copy is in Spanish.

The header shows a four-section navigation (Nombres / Ruleta / Equipos /
Historial). Only **Nombres** is implemented today; the other sections are
visible but disabled while they are built out.

## Deliberately not included

No backend, no database, no accounts and no persistence — reloading the page
discards the participant list, the session history and any result already drawn.
That is intentional for an MVP that runs entirely in the browser.
