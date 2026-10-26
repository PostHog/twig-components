import { type Stay, stayLabel } from './catalog.js';

export type GetawayPreferences = {
  destination: string; guests: string; checkIn: string; checkOut: string;
  unverified?: boolean; setting?: Stay['setting']; excludedSetting?: Stay['setting'];
  amenities?: string[]; budget?: number; budgetBasis?: 'night' | 'trip';
};
export type GetawayReply = {
  kind: 'question' | 'recommendation' | 'no-match' | 'unknown';
  text: string; preferences: GetawayPreferences;
  recommendations: { stayId: string; reason: string; caveat?: string; price: string }[];
};
const numbers: Record<string, number> = { one:1, two:2, three:3, four:4, five:5, six:6, seven:7, eight:8, ten:10 };
export function tripNights(p: GetawayPreferences): number {
  const n=(Date.parse(p.checkOut)-Date.parse(p.checkIn))/86400000;
  return Number.isInteger(n) && n>0 ? n : 0;
}
/** Bounded catalog search, not a language model. Unknown requirements are never presented as verified. */
export function findGetaway(input: string, previous: GetawayPreferences, stays: readonly Stay[]): GetawayReply {
  const q=input.toLowerCase().replace(/[’']/g,'');
  const p: GetawayPreferences={...previous, amenities:[...(previous.amenities??[])]};
  const respond=(kind:GetawayReply['kind'],text:string):GetawayReply=>({kind,text,preferences:p,recommendations:[]});
  if(/clear unverified requirement|continue without that requirement/.test(q))p.unverified=false;
  if(!input.trim() || input.length>500) return respond('unknown','Try a short description of your getaway.');
  if(/anywhere|any destination|no destination/.test(q)) p.destination='';
  const place=stays.find(s=>s.location?.split(',').some(part=>part.trim().length>3 && q.includes(part.trim().toLowerCase())) || !!s.title && q.includes(s.title.toLowerCase()));
  if(place) p.destination=place.location??'';
  const group=q.match(/(?:for|party of|group of)\s+(\d+|one|two|three|four|five|six|seven|eight|ten)\b|\b(\d+)\s+(?:guests|people|adults)/);
  if(group) p.guests=String(numbers[group[1]]??Number(group[1]??group[2]));
  if(/just me|solo/.test(q))p.guests='1';
  if(/couple|two of us/.test(q))p.guests='2';
  for(const [pattern,setting] of [[/forest|cabin|woods|quiet|rest|recharge/,'Forest'],[/beach|coast|ocean/,'Coast'],[/city/,'City']] as const){
    if(pattern.test(q)) {
      if(new RegExp(`(?:no|not|avoid|dont want)(?: a| the)? (?:${pattern.source})`).test(q)){p.excludedSetting=setting;if(p.setting===setting)p.setting=undefined;}
      else p.setting=setting;
    }
  }
  if(/any setting|any type/.test(q)){p.setting=undefined;p.excludedSetting=undefined;}
  for(const [pattern,amenity] of [[/fire ?pit|fireplace/,'Fireplace / fire pit'],[/lake access/,'Lake access via a walking path'],[/beach access/,'Beach access'],[/kitchen/,'Full kitchen']] as const){
    if(pattern.test(q)){
      if(new RegExp(`(?:without|no|dont need)(?: a)? (?:${pattern.source})`).test(q))p.amenities=p.amenities?.filter(a=>a!==amenity);
      else if(!p.amenities?.includes(amenity))p.amenities?.push(amenity);
    }
  }
  if(/no budget|any budget|remove.*budget/.test(q)){p.budget=undefined;p.budgetBasis=undefined;}
  const amount=q.match(/(?:under|below|up to|budget(?: is| of)?|maximum|max)\s*\$?([\d,]+)|\$([\d,]+)/);
  if(amount){p.budget=Number((amount[1]??amount[2]).replaceAll(',',''));p.budgetBasis=/night|nightly/.test(q)?'night':/total|whole trip|in total|trip budget/.test(q)?'trip':undefined;}
  if(p.budget && /per night|nightly|a night/.test(q))p.budgetBasis='night';
  if(p.budget && /whole trip|total|trip budget/.test(q))p.budgetBasis='trip';
  if(p.budget && !p.budgetBasis)return respond('question','Is that budget per night or for the whole stay? All prices are in USD.');
  const dates=q.match(/\b(\d{4}-\d{2}-\d{2})\b/g);
  if(dates?.length===2){
    if(dates.some(d=>!Number.isFinite(Date.parse(d)) || new Date(d).toISOString().slice(0,10)!==d) || dates[1]<=dates[0] || dates[0]<new Date().toISOString().slice(0,10))return respond('question','Those dates don’t look right. What are your future check-in and check-out dates? Use YYYY-MM-DD for this simulation.');
    [p.checkIn,p.checkOut]=dates;
  }
  if(p.budgetBasis==='trip'&&!tripNights(p))return respond('question','What are your check-in and check-out dates? Use YYYY-MM-DD for this simulation, and I’ll check the total against your budget.');
  // Unknown requirements must be clarified, rather than discarded by a keyword match.
  if(/wheelchair|accessible|step.free|pet|dog|cat|pool|hot tub|sauna|breakfast|vegan|allerg|wifi|wi-fi|parking|restaurant|walkable|lakefront|secluded|private|snow|ski/.test(q))p.unverified=true;
  if(p.unverified)return respond('unknown','I can’t verify that requirement from our current listing details. I won’t assume a stay meets it. You can check the details, or say “continue without that requirement.”');
  if(/\bin\s+[a-z]/.test(q)&&!place&&!/in (?:the |a )?(woods|forest|city|budget|total)/.test(q))return respond('no-match','I couldn’t match that destination to our collection. We have stays in the Adirondacks, Gold Coast, and Paris. Would any of those work?');
  if(/\bwhen|next weekend|tomorrow|next month|\b(?:january|february|march|april|may|june|july|august|september|october|november|december)\b/.test(q))return respond('question','What exact check-in and check-out dates did you have in mind? Use YYYY-MM-DD for this simulation. I can calculate the stay total, but can’t check live availability.');
  const recognized=!!dates?.length||!!place||!!group||/help|choose|quiet|rest|recharge|forest|cabin|woods|beach|coast|ocean|city|kitchen|fire|lake|budget|night|total|anywhere|any setting|couple|solo|just me|two of us|show matches|try again|clear unverified requirement|continue without that requirement/.test(q);
  if(!recognized)return respond('unknown','I can help with our destinations, group sizes, budgets, and listed amenities. What kind of break sounds good: forest, beach, or city?');
  if(!p.destination&&!p.setting&&!p.amenities?.length&&!p.budget)return respond('question','What sounds best: a forest retreat, beach time, or a city break?');
  const matches=stays.filter(s=>(!p.destination||s.location?.toLowerCase().includes(p.destination.toLowerCase()))&&(!p.setting||s.setting===p.setting)&&s.setting!==p.excludedSetting&&(s.capacity??0)>=Number(p.guests||1)&&(p.amenities??[]).every(a=>s.amenities.includes(a))&&(!p.budget||s.nightlyRate*(p.budgetBasis==='trip'?tripNights(p):1)<=p.budget));
  if(!matches.length)return respond('no-match',`Nothing fits all of those preferences${p.budget ? ` within $${p.budget} ${p.budgetBasis==='trip'?'for the stay':'per night'}` : ''}${Number(p.guests)>5 ? `. Our largest stay sleeps five` : ''}. I’ve kept your requirements. Would you like to try another destination, setting, or budget?`);
  const recommendations=matches.slice(0,2).map(s=>({stayId:s.id,reason:`${s.location}. Room for ${s.capacity}${p.amenities?.length?`. Includes ${p.amenities.map(a=>a.toLowerCase()).join(' and ')}`:''}.`,caveat:s.id==='stay-01'&&p.amenities?.includes('Lake access via a walking path')?'A walking path leads to the lake. The cabin isn’t lakefront.':undefined,price:tripNights(p)?`$${s.nightlyRate*tripNights(p)} USD for ${tripNights(p)} nights`:`$${s.nightlyRate} USD / night`}));
  return {kind:'recommendation',text:matches.length===1?`${stayLabel(matches[0])} looks like a fit.`:'These are the closest fits in our collection.',preferences:p,recommendations};
}
