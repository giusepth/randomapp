# Kinetic Clarity redesign — Screen "Nombres"

Branch: `feat/kinetic-clarity-redesign` · Delivery: `ask-on-risk` (default) · Checks: `npm run build` + `npm run lint` + visual screenshot (no test runner configured)

## Specs

- **S1** — Apply the "Kinetic Clarity" design system from `stitch_random_name_selector_spa/kinetic_clarity/DESIGN.md` and the reference screen `stitch_random_name_selector_spa/randomselector_selector_de_nombres_aleatorios_estilos_restaurados/code.html`. Source of truth for direction is `estilos_restaurados` (the only variant with a valid `screen.png` and functional JS). Indigo primary (`#4F46E5`/`#6366F1`), emerald secondary (`#10B981`), amber tertiary (`#F59E0B`), slate neutral ramp (`#F8FAFC` canvas, `#FFFFFF` cards, `#E2E8F0` borders). Type: Plus Jakarta Sans (headlines/labels), Inter (body/data).
- **S2** — Visible app name becomes **"RandomSelector"** everywhere the wordmark, `<title>`, or footer brand text appears. (Decision: user chose "RandomSelector" over "RandomApp".)
- **S3** — Scope is the **"Nombres" screen only**. The nav shows Nombres / Ruleta / Equipos / Historial; only "Nombres" is functional; the other three remain visible but must not navigate anywhere (no dead routes, no broken errors).
- **S4** — Header: fixed top bar, brand icon + "RandomSelector" wordmark + "Sorteo Rápido" pill, centered nav, keyboard-shortcut hint + avatar on the right.
- **S5** — Participants area: section title with a live indicator dot, a **"N nombres cargados"** badge, textarea with **line-number gutter**, a **live character counter**, and footer text "1 participante por línea".
- **S6** — Toggles: **"Permitir duplicados"** (existing behavior preserved) and **"Efectos & Confeti"** (on by default). Deduplicated count feeds the badge when duplicates are off.
- **S7** — Utility pills: **Cargar muestra** (loads a fixed Spanish sample list), **Mezclar** (shuffles the input lines), **Quitar duplicados** (dedupes the input text in place), **Limpiar** (clears input). Each gives feedback (toast).
- **S8** — "Parámetros del Sorteo" card: `−` / number / `+` stepper for winner count (min 1; clamped to pool size when duplicates are off), plus quick presets **1 / 2 / 3 / 5 Ganadores**.
- **S9** — Probability card: **"Probabilidad individual"** (`winners/pool × 100`, capped at 100, 1 decimal) and **"Relación Ganador / Total"** (`winners / pool`). Updates live; shows `0%` / `0 / 0` on an empty pool.
- **S10** — Primary CTA: "¡Elegir Ganadores! 🎉" with a shuffle-preview animation that cycles random names while drawing, then finalizes.
- **S11** — Draw uses a Fisher-Yates shuffle of the pool (unbiased). Validation is preserved: at least 2 participants, whole number of winners > 0, never more winners than available (unless duplicates allowed). Errors surface as a toast + inline message.
- **S12** — Winner modal: verified badge, trophy halo, headline "¡Felicitaciones a los Ganadores!", subtitle naming the pool size, and winner cards with **podium ranks** (1°/2°/3° then "N° Ganador"), each showing the name. Actions: **Copiar Ganadores** (numbered clipboard list), **Volver a sortear** (redraw same pool), **Excluir y repetir** (remove current winners from the input list, then redraw), **Cerrar ventana**. Close on X, backdrop click, and Escape.
- **S13** — **Historial de la Sesión** panel: records each draw (timestamp + winner list + pool size), newest first, with an empty state and a **Limpiar** action. Lives in memory for the session only.
- **S14** — **Confetti / effects**: canvas particle burst on a successful draw, gated by the "Efectos & Confeti" toggle; respects `prefers-reduced-motion` (no animation when reduced).
- **S15** — Footer: brand + copyright + link items (Atajos, Reglas & Azar, Exportar, Privacidad) as inert placeholders.
- **S16** — `stitch_random_name_selector_spa/` must be added to `.gitignore` so it is never committed or pushed.
- **S17** — Styling stays token-driven: every color/type/spacing value is a custom property in `src/index.css`; `src/App.css` only consumes tokens and hardcodes nothing. No Tailwind/CDN dependency added — plain CSS mapped from the mockup's Tailwind tokens. Icons use the Material Symbols Outlined font (like the mockup).

## Tasks

- **T0** — Add `stitch_random_name_selector_spa/` to `.gitignore`. (S16) — inline
- **T1** — Rewrite `src/index.css` with the Kinetic Clarity token system (color/type/space/radius/elevation) + Google Fonts import for Plus Jakarta Sans, Inter, Material Symbols. (S1, S17) — inline
- **T2** — Rewrite `src/App.css` for the new layout and components. (S1, S4–S15) — inline
- **T3** — Rewrite `src/App.jsx`: header/nav, participants area, toggles, utility pills, params + probability, CTA, history, modal, toast, confetti. (S2–S15) — inline
- **T4** — Update `index.html` `lang`/`title`/font links. (S1, S2) — inline
- **T5** — Update `README.md` to the new design system + name. (S2, S17) — inline
- **T6** — Checks: `npm run build`, `npm run lint`, dev screenshot (desktop + mobile). (all) — inline

## Log

- **L1** — User request (verbatim): "Prende la perra que se vienen cambios, una nueva version para el ramdomizer, checa la carpeta stitch_random_name_selector_spa, y usala para aplicar esos cambios al randomizer Se que un par de sesiones que estan alli aun no estan como tal creadas, sientete libre de preguntarme y generarlas. esa carpeta luego al gitignore ya que no se a commitear ni a pushear"
- **L2** — Exploration: current app is a single-screen "RandomApp" (navy institutional theme, textarea + amount + duplicates + winner modal). Stitch folder holds 3 mockups (`_1` = `_2` modulo 28 lines; `estilos_restaurados` = most complete, only valid `screen.png`) + `kinetic_clarity/DESIGN.md`. `_1` has no code.html-only diff and no valid screenshot; `_2/screen.png` is a broken placeholder ("<FIFE Image failed to fetch>").
- **L3** — Decision (user): scope = redesign the "Nombres" screen only; Ruleta/Equipos/Historial stay visible but unbuilt.
- **L4** — Decision (user): visible app name = "RandomSelector".
- **L5** — Verification constraint: no test runner in `package.json` (only `dev`/`build`/`lint`/`preview`). Verification = build + lint + visual screenshot; documented as an explicit exception to the default test-first policy.
