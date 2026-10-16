# RandomApp

Draw N random winners from a list of participants. A single-page React app with
no backend and no persistence — everything lives in memory for the length of the
session.

## What it does

- Paste a list, one participant per line; the live count updates as you type
- Choose how many winners to draw
- Optional duplicate weighting: a name listed twice gets two chances
- Fisher-Yates shuffle for an unbiased draw, with a short suspense animation
- Winners appear in a native `<dialog>` modal, with the type scaling to the
  number of winners (1, 2–4, and 5+ each get their own step)
- Copy the result to the clipboard as a numbered list

The draw is validated before it runs: at least 2 participants, a whole number of
winners greater than 0, and never more winners than there are available names.

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

Every colour, type step, spacing value and shadow is a custom property defined
in `src/index.css`. Rebranding is a single block edit there: `src/App.css` only
consumes tokens and never hardcodes a value. The interface copy is in Spanish.

## Deliberately not included

No backend, no database, no accounts and no persistence — reloading the page
discards the participant list and any result already drawn. That is intentional
for an MVP that runs entirely in the browser.
