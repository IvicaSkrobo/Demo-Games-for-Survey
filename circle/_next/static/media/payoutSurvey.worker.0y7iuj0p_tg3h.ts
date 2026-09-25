import { runPayoutSurvey } from './payoutSurvey'
import { DEFAULT_PARAMS } from './engine'
self.onmessage = ({data}) => {
  try { self.postMessage({report:runPayoutSurvey(data.zones,data.samples,n=>self.postMessage({progress:n}),Boolean(data.rebounceEnabled),data.start??0,data.rebounceStrength??DEFAULT_PARAMS.rebounce!.speedMultiplier,data.rebounceDuration??DEFAULT_PARAMS.rebounce!.durationMs,data.rebounceSpread??DEFAULT_PARAMS.rebounce!.randomTurnDeg)}) }
  catch(error) { self.postMessage({error:String(error)}) }
}
