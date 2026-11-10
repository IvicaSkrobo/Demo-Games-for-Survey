# Collector 21 — survey integration

Updated 10 November 2026 (Europe/Zagreb).

## Import and rehearse

1. Import `dist/study-blueprint.json` using the existing SurveyTool admin **Import study → Create a new draft** screen. No live study has been created by this code change.
2. Slot 1 is Collector 21; slot 2 is Suit Society. Both use `https://ivicaskrobo.github.io/Demo-Games-for-Survey/collector-21/study/`. The manifest is served at `study/StreamingAssets/variants.json` (also at the game root).
3. Use event-count unlock: `round_completed`, minimum **10** for each variant. One resolved paid bet counts once, after placement/bust settles. Free examples are hidden in study mode and never count.
4. Review the draft questions and copy, then rehearse a participant attempt through both variants before activating a study.
5. For a developer-only smoke check, open `survey-preview.html`. This mock parent starts the iframe, counts resolved bets, switches variants and sends optional event acknowledgements. It does not collect real responses.

## Wire contract

Channel: `superbet.study.v1`. Game requests `host_handshake_request`; host responds `host_handshake_ack` with participantToken, attemptId, studyId, sessionId, currentRoundIndex, variantSlotIndex, variantId, variantLabel and variantPlan. Slot controls which game is shown; events echo the host's variant ID and label. The game remains input-blocked until `host_control` action `start_game` or `set_gameplay`.

`advance_round` selects the next slot and resets game state, then waits for start. `set_muted` controls sound. The host owns participant progression, survey screens and unlock. `study_framing` intro/gameplay/completion cues describe the game state.

Messages must originate from the parent window and its pinned origin, read from the iframe document referrer. For a referrer-free host, explicitly include `?hostOrigin=https://YOUR-SURVEY-HOST` in the build URL. No wildcard postMessage target is used. Host controls with a conflicting session ID are ignored.

## Events and delivery

See `dist/study-event-catalog.json`. Events include stable eventId, sequenceNumber, occurredAt, buildId, host IDs, version ID/label and metadata (bet, returns, collector result, balance where relevant). A durable local outbox retries with capped backoff; retransmissions preserve event IDs so the survey server can deduplicate them. The current SurveyTool host relays events but does not acknowledge them; repeat deliveries are expected and must remain idempotent. An optional `study_event_ack` with matching sessionId and payload.eventId removes acknowledged entries, supported by the rehearsal host.

The outbox is scoped by attempt, round and slot. Restoring its completion count does not restore the game wallet or collector contents. After ten paid bets, version completion is emitted once; subsequent practice bets carry `countsTowardStudyCompletion:false`. The configured host still counts matching event names, so these flags are descriptive, not an alternative unlock mechanism. The final variant emits overall game completion; questionnaire completion remains the survey platform's responsibility.

## Included questions

Each variant has three 1–7 ratings: payout clarity, enjoyment and desire to replay; an optional free-text improvement question follows. The post-study question asks which game the participant prefers and why. The blueprint contains setup only, no participants, tokens or responses.

## Verification

`node --test engine.test.mjs collector21.test.mjs study-bridge.test.mjs` checks payout/routing rules and the bridge's origin/source/session guards, slot switching, completion, stable retry IDs and acknowledgements. Run `python3 -m http.server 4174 --directory dist` for the browser rehearsal. Production participant flow still requires a draft rehearsal in the target survey environment.
