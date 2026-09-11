import { runPayoutSurvey } from './payoutSurvey'
self.onmessage = ({data}) => {
  try { self.postMessage({report:runPayoutSurvey(data.zones,data.samples,n=>self.postMessage({progress:n}))}) }
  catch(error) { self.postMessage({error:String(error)}) }
}
