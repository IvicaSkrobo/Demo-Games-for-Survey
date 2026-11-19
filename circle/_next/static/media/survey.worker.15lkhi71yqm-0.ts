import { runCoverage, type Ring } from './survey'
import { runRandom } from './randomSurvey'
self.onmessage = (event: MessageEvent<{ ring: Ring; mode: 'coverage' | 'random'; samples: number; seed: number }>) => {
  try {
    const { ring, mode, samples, seed } = event.data
    const progress = (done: number, total: number) => self.postMessage({ type: 'progress', done, total })
    const report = mode === 'coverage' ? runCoverage(ring, samples, progress) : runRandom(ring, samples, seed, progress)
    self.postMessage({ type: 'done', report })
  } catch (error) { self.postMessage({ type: 'error', message: String(error) }) }
}
