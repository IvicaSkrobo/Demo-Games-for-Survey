# Matea streak — Version 3

Exact SVG exports from [Version 3, node 3639:5464](https://www.figma.com/design/HDZ8ARwH6UN21mGXdVJTL1/Superbet-Originals---Working-file?node-id=3639-5464), retrieved 16 September 2026.

| File | Source node |
| --- | --- |
| calendar-complete.svg | 3639:6333 |
| calendar-upcoming.svg | 3639:6340 |
| calendar-lock.svg | 3649:7223 |
| bulb-magenta.svg | 3639:6760 |
| bulb-yellow.svg | 3639:6860 |
| bulb-shine.svg | 3639:6761 |

The default renderer uses the fixed container from 3648:6932, shrinking to the five-dot width from 3639:6532 before bonus capacity is earned. `?streak-layout=hug` selects the expanding container from 3639:6757 / 3639:6604. The gold badge follows 3639:6869. Its label remains live text.

Calendar appears during daily claim entry, on depletion, and when the player taps the rail. Tap it again to return during play. Depletion is driven by game phase, so spending the last spin does not reveal the calendar before the result. The calendar replaces the overlapping legacy large bolt while shown. The calendar timer follows the prototype's local midnight; the button retains the separate recharge countdown. No calendar interaction claims rewards.

Capacity and bonus count follow concept config. Days continue past the first week in a moving seven-day window; the next unclaimed day stays visible. This is presentation of the existing uncapped streak, not a weekly reset. The implementation lives in `src/render/mateaStreak.ts`; the older HUD remains available via `?streak=daily-bulbs`.
