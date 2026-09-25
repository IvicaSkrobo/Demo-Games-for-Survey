import { mergePayoutReports, runPayoutSurvey, type PayoutReport } from './payoutSurvey'
import { DEFAULT_PARAMS } from './engine'

// A worker's share can be hundreds of millions of directions (the panel offers up to 1B),
// far past the 10M a single survey call accepts. Survey it in chunks and fold each one in;
// merging keeps one variant per launch sector, so the running report stays bounded.
const CHUNK = 1_000_000
// One variant per sector still allows 360 per degree on every payout. Keep 96, evenly
// spaced through the list, as build-rebounce-pool.ts does before it caches a survey.
const VARIANTS = 96
function trimVariants(report: PayoutReport): PayoutReport {
  return { ...report, rows: report.rows.map(row => !row.trajectoryVariants ? row : {
    ...row,
    trajectoryVariants: row.trajectoryVariants.map(ids => ids.length <= VARIANTS ? ids : Array.from({ length: VARIANTS }, (_, i) => ids[Math.floor(i * ids.length / VARIANTS)])),
  }) }
}

self.onmessage = ({data}) => {
  try {
    const start = data.start ?? 0
    const strength = data.rebounceStrength ?? DEFAULT_PARAMS.rebounce!.speedMultiplier
    const duration = data.rebounceDuration ?? DEFAULT_PARAMS.rebounce!.durationMs
    const spread = data.rebounceSpread ?? DEFAULT_PARAMS.rebounce!.randomTurnDeg
    let merged: PayoutReport | null = null
    for (let done = 0; done < data.samples; done += CHUNK) {
      const count = Math.min(CHUNK, data.samples - done)
      const report = runPayoutSurvey(data.zones, count, n => self.postMessage({progress: done + n}), Boolean(data.rebounceEnabled), start + done, strength, duration, spread)
      merged = trimVariants(merged ? mergePayoutReports([merged, report]) : report)
    }
    self.postMessage({report: merged})
  }
  catch(error) { self.postMessage({error: String(error)}) }
}
