"use client";
import {createContext,useContext,useRef,type ReactNode} from 'react';
import {createInspectionBus, inspectionActivityForEvent} from './lib/twig-inspection.js';
import {publishPlannerGeneration as publishGeneration} from './lib/twig-ai-observability.js';
import type {TripPlannerRecord} from '../trip-planner-records.js';
export type TwigExperienceEvent = {event:string;properties:Record<string,unknown>};
export function createExperienceRuntime(onEvent:(event:TwigExperienceEvent)=>void) {
 const bus=createInspectionBus();
 const trackTwigEvent=(event:string,properties:Record<string,unknown>,context?:{operationId?:string;simulated?:boolean})=>{
   bus.publishInspectionActivity(event,properties,context);
   const safe=inspectionActivityForEvent(event,properties);
   if(safe)onEvent({event,properties:safe.properties ?? {}});
 };
 // Teaching lifecycle remains local; consumers receive only allowlisted site actions.
 const localOnly=(..._args:unknown[])=>{};
 return {...bus, trackTwigEvent,
 publishPlannerGeneration:(record:TripPlannerRecord,stayIds?:readonly string[])=>publishGeneration(bus.publishLocalInspectionActivity,record,stayIds),
 initTwigAnalytics:()=>false,initTwigErrorTracking:()=>false,
 trackTwigLabStarted:localOnly,trackTwigLabMilestone:localOnly,trackTwigLabInteraction:localOnly,trackTwigLabReset:localOnly,trackTwigLabCompleted:localOnly,
 capturePlaygroundLabResume:localOnly,capturePlaygroundLabVisit:localOnly,capturePlaygroundReset:localOnly,captureTwigBookingCanceled:localOnly,captureTwigBookingConfirmed:localOnly,captureErrorTrackingLabBooking:localOnly,
 captureTwigException:(error:unknown,context:{surface:string;stayId?:string})=>bus.publishInspectionActivity('$exception',{exception_type:error instanceof TypeError?'TypeError':error instanceof RangeError?'RangeError':error instanceof Error?'Error':'Unknown',surface:context.surface}),
 };
}
const Context=createContext<ReturnType<typeof createExperienceRuntime>|null>(null);
export function ExperienceRuntime({children,onEvent}:{children:ReactNode;onEvent?:(event:TwigExperienceEvent)=>void}) {
 const callback=useRef(onEvent);callback.current=onEvent;
 const runtime=useRef<ReturnType<typeof createExperienceRuntime>|null>(null);
 if(!runtime.current)runtime.current=createExperienceRuntime(event=>callback.current?.(event));
 return <Context.Provider value={runtime.current}>{children}</Context.Provider>;
}
export function useExperienceRuntime(){const value=useContext(Context);if(!value)throw new Error('TwigExperience runtime is required');return value;}
