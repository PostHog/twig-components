"use client";
import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { AiSearchIcon } from './TripPlanner.js';
import { findGetaway, type GetawayPreferences, type GetawayReply } from './getaway-search.js';
import { createPortal } from 'react-dom';
import { type Stay, stayLabel } from './catalog.js';
export type { GetawayPreferences, GetawayReply } from './getaway-search.js';

export function SearchWorkspace({ mode, onModeChange, destination, assistant }: {mode:'destination'|'ai';onModeChange:(mode:'destination'|'ai')=>void;destination:ReactNode;assistant:ReactNode}) {
 return <div className="twig-search-workspace">
   <div className="twig-search-modes" role="group" aria-label="Search method">
     <button type="button" aria-pressed={mode==='destination'} aria-controls="twig-destination-search" onClick={()=>onModeChange('destination')}>Search stays</button>
     <button type="button" aria-pressed={mode==='ai'} aria-controls="twig-ai-search" onClick={()=>onModeChange('ai')}><AiSearchIcon/> AI trip planner</button>
   </div>
   <div id="twig-destination-search" hidden={mode!=='destination'}>{destination}</div>
   <div id="twig-ai-search" hidden={mode!=='ai'}>{assistant}</div>
 </div>;
}
export function GetawaySearch({stays,preferences,onPreferencesChange,onOutcome,onReset,renderStayLink,hidden=false,onChatVisibilityChange,windowClassName,portalRoot}:{stays:readonly Stay[];preferences:GetawayPreferences;onPreferencesChange:(p:GetawayPreferences)=>void;onOutcome?:(reply:GetawayReply)=>void;onReset?:()=>void;renderStayLink:(stay:Stay)=>ReactNode;portalRoot?:Element;windowClassName?:string;hidden?:boolean;onChatVisibilityChange?:(open:boolean)=>void}) {
 const [draft,setDraft]=useState('');
 const [turns,setTurns]=useState<{prompt:string;reply:GetawayReply}[]>([]);
 const [open,setOpen]=useState(false);
 const id=useId();
 const log=useRef<HTMLDivElement>(null);
 const heading=useRef<HTMLHeadingElement>(null);
 const launcher=useRef<HTMLButtonElement>(null);
 useEffect(()=>{if(open&&!hidden)heading.current?.focus({preventScroll:true});},[open,hidden]);
 useEffect(()=>{const el=log.current;if(el)el.scrollTop=el.scrollHeight;},[turns,open,hidden]);
 function expand(){if(!open){setOpen(true);onChatVisibilityChange?.(true);}}
 function collapse(){setOpen(false);onChatVisibilityChange?.(false);requestAnimationFrame(()=>launcher.current?.focus({preventScroll:true}));}
 function send(){
   if(!draft.trim()||draft.length>500)return;
   if(/^(?:start over|reset)(?: please)?[.!]?$/i.test(draft.trim())){setTurns([]);setDraft('');onReset?.();onPreferencesChange({...preferences,destination:'',unverified:false,setting:undefined,excludedSetting:undefined,amenities:[],budget:undefined,budgetBasis:undefined});expand();return;}
   const reply=findGetaway(draft,preferences,stays);
   setTurns(old=>[...old,{prompt:draft,reply}].slice(-12));onPreferencesChange(reply.preferences);onOutcome?.(reply);setDraft('');expand();
 }
 function composer(inWindow:boolean){
   const fieldId=`${id}-${inWindow?'chat':'entry'}`;
   return <><form onSubmit={e=>{e.preventDefault();send();}}>
     <label className="vac-sr-only" htmlFor={fieldId}>{inWindow?'Your message':'Describe your getaway'}</label>
     <div className="twig-trip-planner-compose">
       <textarea id={fieldId} rows={2} value={draft} maxLength={500} placeholder={inWindow?'Message Twig…':'Describe your getaway…'} aria-describedby={`${fieldId}-note`} onChange={e=>setDraft(e.target.value)}
         onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey&&!e.nativeEvent.isComposing){e.preventDefault();send();}}}/>
       <button type="submit" aria-label="Send message" disabled={!draft.trim()}><svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M12 19V5m-6 6 6-6 6 6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg></button>
     </div>
   </form><div className="twig-trip-planner-footer"><p id={`${fieldId}-note`}>Simulated AI responses</p></div></>;
 }
 return <>
   <div className="twig-getaway-search twig-trip-planner">{composer(false)}</div>
   {!hidden&&open&&createPortal(<div className={`twig-trip-planner twig-trip-planner-window twig-getaway-window${windowClassName ? ` ${windowClassName}` : ""}`} role="dialog" aria-labelledby={`${id}-title`} onKeyDown={e=>{if(e.key==='Escape'){e.preventDefault();e.stopPropagation();collapse();}}}>
     <header className="twig-trip-planner-header"><h2 id={`${id}-title`} ref={heading} tabIndex={-1}><AiSearchIcon /> AI trip planner</h2><button type="button" className="twig-trip-planner-close" aria-label="Collapse chat" onClick={collapse}><svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M5 12h14" fill="none" stroke="currentColor" strokeWidth="1.8"/></svg></button></header>
     <div ref={log} className="twig-trip-planner-history">
       <div role="log" aria-label="Getaway conversation" aria-live="polite" aria-relevant="additions" tabIndex={0}>
       {turns.map((turn,index)=><div className="twig-getaway-turn" key={index}>
         <div className="twig-trip-planner-message" data-speaker="visitor"><span className="vac-sr-only">You: </span><p>{turn.prompt}</p></div>
         <div className="twig-trip-planner-message" data-speaker="assistant"><span className="vac-sr-only">Twig: </span><p>{turn.reply.text}</p></div>
           {index===turns.length-1&&(["destination","guests","checkIn","checkOut"] as const).every(key=>turn.reply.preferences[key]===preferences[key])&&turn.reply.recommendations.map(rec=>{const stay=stays.find(s=>s.id===rec.stayId);return stay&&<article className="twig-getaway-result" key={rec.stayId} aria-labelledby={`${id}-result-${index}-${rec.stayId}`}>
             <img src={stay.images[0]?.src} alt={stay.images[0]?.alt??''} width={160} height={100}/><div><h3 id={`${id}-result-${index}-${rec.stayId}`}>{stayLabel(stay)}</h3><p>{rec.reason}</p>{rec.caveat&&<p>{rec.caveat}</p>}<p><strong>{rec.price}</strong></p></div><div className="twig-getaway-result-action">{renderStayLink(stay)}</div>
           </article>;})}
       </div>)}
       </div>
     </div>
     <div className="twig-trip-planner-bottom">{composer(true)}</div>
   </div>,portalRoot ?? document.body)}
   {!hidden&&!open&&turns.length>0&&createPortal(<div className="twig-browser twig-getaway-launcher-wrap"><button ref={launcher} type="button" className="twig-getaway-launcher" aria-haspopup="dialog" aria-expanded="false" onClick={expand}><AiSearchIcon/> Continue your getaway</button></div>,portalRoot ?? document.body)}
 </>;
}
