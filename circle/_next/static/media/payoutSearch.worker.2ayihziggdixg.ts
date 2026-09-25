import { contactBufferFor, simulateBall } from './engine'
import { surveyParams, testArcs } from './payoutSurvey'

// Targeted search for one payout that is short of 360/360. A full survey simulates every
// direction at all 360 ring positions; this simulates only the positions the payout still
// misses, and drops each one the moment any worker finds it, so it speeds up as it goes.
// Workers interleave directions (start, start + stride, ...) so none repeats another's.
let missing = new Set<number>()

self.onmessage = ({ data }) => {
  if (data.type === 'found') { missing.delete(data.phase); return }
  if (data.type !== 'start') return
  const { zones, payout, phases, start, stride, rebounce } = data
  missing = new Set<number>(phases)
  const params = surveyParams(rebounce.enabled, rebounce.strength, rebounce.duration, rebounce.spread)
  const arcs = testArcs(zones), buffer = contactBufferFor(params)
  let k = start, searched = 0
  // Work in short slices and yield, so a 'found' from another worker is applied promptly.
  const slice = () => {
    const until = Date.now() + 200
    while (missing.size && Date.now() < until) {
      for (const phase of missing) {
        const result = simulateBall(arcs, k, phase, params, buffer)
        if (result.outcome === 'cashout' && result.payout === payout) {
          missing.delete(phase)
          self.postMessage({ found: { phase, direction: k } })
        }
      }
      k += stride
      searched++
    }
    self.postMessage({ progress: searched, next: k })
    if (missing.size) setTimeout(slice, 0)
    else self.postMessage({ done: true })
  }
  slice()
}
