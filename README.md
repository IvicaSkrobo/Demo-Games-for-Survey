# Demo Games for Survey

This repository hosts static WebGL game builds used by survey and study tools.

Current builds:

- `superbet-penalty/index.html`
- `circle/index.html`
- `manager-spin/index.html`
- `free2play-daily-spin/index.html`
- `ski-v4/index.html`
- `wheel/index.html`

Recommended iframe paths:

- `/superbet-penalty/index.html`
- `/circle/index.html`
- `/manager-spin/index.html`
- `/free2play-daily-spin/index.html`
- `/ski-v4/index.html`
- `/wheel/index.html`

Notes:

- Each game should live in its own top-level folder.
- These files are static and can be hosted with GitHub Pages or another simple static host.

## Collector 21

Playable custom-card prototype at `collector-21/`. Each draw settles an instant return, then winning cards build matching collectors toward 21. Recalibrated against automatic and greedy placement: seeded returns 91.32% and 91.99%. Virtual credits only.

Survey build: `collector-21/study/`; two manifest slots (Collector 21 / Suit Society), ten resolved bets per slot. Import `collector-21/study-blueprint.json` into a new draft in SurveyTool. See `collector-21/docs/SURVEY-INTEGRATION.md` and the dated game reference for rules and limitations.
