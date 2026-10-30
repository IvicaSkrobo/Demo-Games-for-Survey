# Money Machine: animation and developer handoff

Current prototype behavior, 30 October 2026. This document supersedes older numerical and animation notes in docs/project-notes for the Money Machine entry point. Legacy concept behavior is preserved separately.

## Run and test

Install Node.js 22 LTS or newer. From the repository root run npm ci, then npm run dev -- --host 127.0.0.1. Open Vite's Local URL. No environment variables are required. Use npm test, npm run typecheck and npm run build for validation; npm run preview serves the built dist directory. Serve through HTTP, not file://, because Spine and SVG assets are fetched at runtime.

Normal playback is 1×. The page selector switches to Fast 6× (?speed=6). Use Spin or Space to play. Reset to First Contact clears browser-local saved progress and replenishes spins. Refill spins restores the current cap without clearing collector progress. Test controls offer extra spins, a forced matching result, all authored animations in order and the warning-window preview. These are development controls.

## Current rules

- Three reels, three visible rows, exactly one evaluated middle payline. Only its symbols score or charge the lightning counter.
- Onboarding is Cycle 0 and does not score collector points. It ends on the first collection, then normal progression starts at Cycle 1.
- Total collector capacity is 1,000. Cycle 2 starts at100; Cycle 3 at200; Cycle 4 at450. Cycle 4 continues until1,000, when Final Reward plays once and the session stops with a reset prompt.
- Normal contribution is the sum of the three regular symbol values. No pair/triple multiplier is applied. Green Apple10, Red Apple15, Pear20, Plum25, Orange30, Blueberries35, Dragonfruit40, Gold Coin45, Horseshoe50, Golden Key55, Lucky7 60, Crown75. Values are multiples of5; higher values have lower inverse-value weights.
- Lightning has0 ordinary symbol points. Each payline lightning fills one top-panel slot; collecting3 across spins awards 3 free spins without refilling energy, flashes the completed counter and resets it, carrying partial-spin overflow. Free spins are used before regular energy and persist in the local checkpoint. A full three-lightning payline fills/completes the panel once, refills energy and grants100 collector points during normal progression. The full line also completes the counter once, awarding its 3 free spins, matching the original prototype. The initial energy cap is5; inherited streak/recharge settings remain prototype behavior.
- Marker boxes start white. Once a second identical revealed symbol lands, both matching boxes become green. Nonadjacent pairs count (apple/pear/apple gives green/white/green). Three identical symbols upgrade all three boxes to gold on the third reel reveal. Matches are exact symbol identity; lightning does not substitute for another type for marker coloring.

### Explicit demo aids

The mock service injects a single payline lightning after3 ordinary spins without one, unless the showcase triple has priority on that spin. Natural lightning remains weighted/random. One regular-symbol triple is scheduled randomly between demo spins2–5 per reset. It scores normal symbol values and shows the gold result; natural triples can still occur. Forced test grids and no-cost previews bypass these schedules. These aids, symbol weights, progress thresholds, cap growth and rewards must be reviewed with product/backend before production.

## Spine collector sequence

Exports are Spine4.3.26; the runtime package is @esotericsoftware/spine-pixi-v8 ~4.3.0 with declared Pixi ^8.6.6 and GSAP ^3.12.5 ranges. npm ci resolves Spine4.3.13, Pixi8.20.0 and GSAP3.15.0; the pnpm lock currently resolves Pixi8.22.0. Both lockfile installations were validated. Use the committed lockfiles. Keep the export/runtime minor version compatible and revalidate upgrades. Animation names, including spaces, are read from the actual JSON and sorted by numbered prefix within Cycle N; do not silently rename clips.

Cycle0 contains5 clips:

| Clip | Current use |
| --- | --- |
| Cycle 0/1. First Contact | Initial unpressed/session idle |
| Cycle 0/2. First Contact > First Rdy to Fill | First button press intro, once |
| Cycle 0/3. First Rdy to Fill > Fill | Loop immediately after the intro as Cycle0 active state |
| Cycle 0/4. First Fill | Deliberately skipped in gameplay for now |
| Cycle 0/5. First Fill > 1 | First collection at first lightning impact, once, then Ready1 |

Cycles1–4 each contain6 numbered roles:

| Role | Behavior |
| --- | --- |
| 1. Rdy to Fill N | Native active loop while playing |
| 2. Rdy to Fill N > Starting Filled N | Bridge to inactive/resting state when spins run out |
| 3. Starting Filled N | Resting loop after reload or depletion, until next spin press |
| 4. Starting Filled N > Rdy to Fill N | Bridge on first spin after resting/refill |
| 5. Fill N | Contribution reaction; starts when the first incoming lightning finishes |
| 6. Fill N > N+1 | Milestone bridge after Fill; next cycle then loops Ready |

Cycle4's final clip is Cycle 4/6. Fill 4 > Final Reward. At1,000 points it plays once; its final pose is held and a message suggests Reset. A contribution crossing multiple thresholds plays intermediate bridges in order. Regular fills return to the current Ready loop; depletion transitions to Starting Filled after the fill. Exact exported clip names are also shown in the page status and available through Play all animations.

## Presentation timing and layers

Reels stop sequentially with downward braking offset and eased return. Each middle symbol pulses from1.0 to1.5625 and back on its reel settle (0.11s rise,0.16s return at1×). Matching boxes pulse1.08 once when first marked; neutral boxes stay fixed. A triple gets an additional complete left/middle/right symbol pulse after all ordinary stop pulses finish. This replay is awaited before collection lightning launches. Markers remain visible until launch, then fade0.3s.

Flying lightning uses the authored Lightning 1 clip once, sped up1.3× (about0.359s at normal playback), with staggered reel launches. It is a fixed-angle contact between symbol and generator rather than a moving curved path. Left reel targets left generator; right targets right; middle selects either. Visible endpoints are measured per native frame so transparent margins do not create a gap. A short radial impact follows. The first lightning completion starts the collector fill, while the remaining effects finish under the presentation barrier.

Collector artwork is behind the slot cabinet; the collector is globally1.03 scale and lowered to the approved reference placement. Incoming lightning is in front of the cabinet, collector and top lightning panel, with actual controls/messages above it. On the reels: symbols < supplied gradient < glass at69% opacity < partitions/markers as composed; preserve the approved viewport alignment. The two upper cyan Figma fixtures, bases and local glow are deliberately excluded. Do not reintroduce them from source Figma.

## Assets and updates

Runtime collector: public/assets/collector/money-ee89b0ab/Money Machine.json, Money Machine.atlas and Money Machine.png. public/assets/collector/money contains the equivalent export used by the export-contract test; update both together if replacing it. Incoming lightning: public/assets/collector/lightning-0facd211a7 with skeleton.json, Lightning Effect 1.atlas and its PNG. src/lightning-visible-ends.json stores the per-frame endpoint calibration and must be rechecked if lightning attachment art changes.

Import complete Spine exports (JSON, atlas and every referenced texture page). Confirm all29 collector clips remain present and the runtime version is compatible. Update changed paths in src/money-main.ts if using a new versioned directory; verify every clip in Play all animations, then test onboarding, fills, each milestone, depletion/refill, reload and Final Reward at1×. Preserve the original PNG canvas/white space when updating symbols.

design/UI/Active Gameplay.svg is the approved vector master and its PNG preview is included. Runtime SVG lives at public/assets/money-ui.svg. Figma synchronization concerns only Active gameplay frame3916:7593 and excludes the upper fixtures; it does not approve gameplay label values.

spine-projects contains only a historical recovered .spine file dated27October21:01. It is not the editable source for the latest runtime export. The latest editable Spine source/images need to be supplied by the animator before a complete editable-art handoff; included runtime exports are sufficient to play. Independent recovery backups are kept outside this repository and are untouched.

## Frontend/backend boundary

MockServer resolves outcomes, spins, collector units and lightning counts; Game mirrors its SpinResponse and emits presentation events. Money Machine orchestration reacts to those events and awaits authored animation completion through a presentation barrier. Do not let the frontend invent production outcomes or settle prizes.

Replace the mock with an authenticated authoritative service implementing openSession, resync and spin. Agree request IDs/idempotency, session/version identifiers, outcome/payline format, collector delta/cap, strike counts and refill flags, wallet state, prize definition, reward settlement and retry/error handling. Persist authoritative progress server-side; current localStorage key money-machine-session-v2 is only a local prototype checkpoint. Math.random schedules, client-clock recharge/streak behavior, grants and debug controls are not production security boundaries.

Framework, deployment target, reward amount, prize reveal UI and final APIs are undecided. The current stack demonstrates behavior and is not a final production framework decision. Do not infer prize amounts from art labels. No live Deposit action or real-money transaction is wired.

## Remaining creative work

Priority1 is finishing collector filler clips, VFX inside existing clips, and a strong reward sequence: overfill, build pressure, break and explode, then reward. The included final clip is the present placeholder/iteration, not approval that this creative work is finished. Polish the remaining prototype afterward, then review this guide and the API boundary with frontend/backend programmers. Prize reveal placement is still open.

## Combined working version — 30 October 2026

The working Money Machine now reuses Blender's Matea streak/energy rail and animated Daily Spin button. Ante's collector, reel animation and cabinet composition are retained. Energy capacity grows once per 3 consecutive days: day 1 = 5, day 4 = 6, day 7 = 7, day 22 = 12. Test controls can preview those days and depletion/countdown. The exact animation-only published snapshot and PATRIK_ANIMATION_HANDOFF remain pinned to the earlier reference. Working regeneration is now +1 energy per 60 minutes per the functional spec. Ivica confirmed decay: subtract one streak day for each missed calendar day, floor 1; capacity follows the same three-day ladder downward, clamping regular energy to the new cap.

Both historical main entry URLs (version=ours / version=ante) now resolve to the combined main game. Archived Blender/Chest use ?view=prototypes; the animation handoff remains a separate public snapshot.

## Direct-win track — working game

Ivica selected 777 as the configurable direct paying symbol. `moneyConfig.directWin` defaults to enabled, symbol `seven`, probability `1/60`, payout `50` test coins. A scheduled outcome is chosen in MockServer before composing the paying line; cosmetic/showcase rolls do not create unscheduled direct payouts. Forced 777 is available through Test spin for review. Collector contribution remains separate (777 still contributes 180 test units outside onboarding); a crown is still a regular 75-unit symbol.

Test controls provide a Direct 777 coin win checkbox, also selectable by `?directwin=off`. OFF keeps symbols and collector contribution while disabling scheduled direct rewards, coin awards and direct-win celebration. The server returns directWin/directWinCoins plus the cumulative demo coin total; Game emits a direct-win event after reel/collector presentation. The test total survives local checkpoint reload. This is demo accounting, not a real Superbet coin-wallet settlement. VIP amounts, production configuration and economy remain separate work.

## Paying symbol artwork: Ante's Seven

The 777 direct win uses Ante's existing Seven artwork, not a replacement symbol. Runtime asset: `public/assets/symbols/original-pngs-20261029/Seven.png`; design source copy: `design/Symbols/Original PNGs 2026-10-29/Seven.png`. Both are already present in Ante's original handoff commit `2673698` and have identical content. The catalog maps symbol id `seven` / label `Lucky 7` to file `Seven`; the main slot loads that PNG. Three instances form 777. Preserve its original canvas/whitespace and the slot's symbol treatment. No new Seven asset is needed in this repository. If Ante's separate working/export project lacks it, import his Seven asset from this pack and map it to `seven`; use his artwork consistently in the reel and any direct-win presentation. Do not substitute the Blender's older seven or use crown as the paying symbol.

## Repeatable collector — working game decision

Ivica confirmed that after the collector reward the next collector starts slightly filled. The working config uses `refillFloor: 0.05` (50/1000, still Cycle 1), with a placeholder `rewardCoins: 100`. This is a tunable demo coin amount, not a validated unit-to-coin rate. The renderer finishes Final Reward before Game asks the mock service to claim the reward. The service checks fullness, credits once, resets progress to the configured floor and returns authoritative state via resync. The game reveals the test reward, resumes the appropriate Ready/resting loop and can keep playing without Reset. Same-day streak, energy, lightning and free spins are retained. Reload at a full unsettled collector resumes settlement; reload after settlement retains coins and 50-point progress without another payout. Reset to First Contact remains a test tool. The frozen animation-only demo deliberately still stops at the end.
