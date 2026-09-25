import { simulateAppliedPool } from './appliedSimulation'

const SAMPLES = 2_000_000
// simulateAppliedPool reports every 1,000 rounds. Forwarding all 2,000 of those flooded the
// panel with status updates, each of which re-published its snapshot to the parent, and
// React stopped it as an update loop ("Maximum update depth exceeded"). 40 is plenty.
const PROGRESS_EVERY = 50_000

self.onmessage = ({ data }) => {
  try {
    self.postMessage({ result: simulateAppliedPool(data.report, SAMPLES, 42, progress => { if (progress % PROGRESS_EVERY === 0) self.postMessage({ progress, total: SAMPLES }) }) })
  } catch (error) {
    self.postMessage({ error: String(error) })
  }
}
