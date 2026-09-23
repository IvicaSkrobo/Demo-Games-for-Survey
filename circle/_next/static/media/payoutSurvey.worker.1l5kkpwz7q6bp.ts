import { runPayoutSurvey } from './payoutSurvey'
self.onmessage = ({data}) => {
  try { self.postMessage({report:runPayoutSurvey(data.zones,data.samples,n=>self.postMessage({progress:n}),Boolean(data.rebounceEnabled),data.start??0,data.rebounceStrength??1.8,data.rebounceDuration??300,data.rebounceSpread??35)}) }
  catch(error) { self.postMessage({error:String(error)}) }
}
