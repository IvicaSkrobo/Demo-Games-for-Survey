import { simulateAppliedPool } from './appliedSimulation'

self.onmessage = ({ data }) => {
  try {
    self.postMessage({ result: simulateAppliedPool(data.report, 100000, 42, progress => self.postMessage({ progress })) })
  } catch (error) {
    self.postMessage({ error: String(error) })
  }
}
