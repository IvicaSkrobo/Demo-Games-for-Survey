import { simulateAppliedPool } from './appliedSimulation'

const SAMPLES = 2_000_000

self.onmessage = ({ data }) => {
  try {
    self.postMessage({ result: simulateAppliedPool(data.report, SAMPLES, 42, progress => self.postMessage({ progress, total: SAMPLES })) })
  } catch (error) {
    self.postMessage({ error: String(error) })
  }
}
