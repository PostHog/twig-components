import type { InspectionGuide, PlaygroundActivity } from '../../PlaygroundPanels.js';
import excerpts from './twig-instrumentation-source.json' with { type: 'json' };
import { aiGenerationCaptureExample } from './twig-ai-capture-example.js';
import { replayInspectionGuide } from '../../PlaygroundPanels.js';

const explanations: Record<string, [string,string]> = {
 twig_stay_filter_selected: ['Selecting a setting records its value and matching-stay count.','Which settings lead to an empty search?'],
 twig_stay_amenity_toggled: ['Changing an amenity records its selection and the number of matching stays.','Which amenities narrow a search to no results?'],
 twig_trip_search_submitted: ['The search handler validates the form, applies the search, and records its outcome.','How often do searches return no stays?'],
 twig_destination_suggestion_selected: ['Choosing a suggested destination records its catalog stay ID.','Do destination suggestions help people find a stay?'],
 twig_ai_simulation_run: ['The planner records its use with Product Analytics, linked to an AI generation.','How often do people use the planner?'],
 twig_ai_search_answered: ['The planner records its outcome and recommendation count with Product Analytics.','How often does AI search find a stay?'],
 twig_ai_recommendation_opened: ['Opening a recommendation records the stay ID before navigation. This is Product Analytics instrumentation.','Do people open the stays the planner recommends?'],
 twig_stay_viewed: ['The stay page records its catalog ID when it opens.','Which stays do people view?'],
 twig_stay_saved: ['Saving a stay records its catalog ID and where it was saved.','Which stays do people want to return to?'],
 twig_stay_unsaved: ['Removing a saved stay records its catalog ID.','Which stays do people remove from their saved list?'],
 twig_demo_account_logged_in: ['The sign-in handler records a successful demo login.','Do people complete sign-in?'],
 twig_demo_account_logged_out: ['The sign-out handler records a completed logout.','When do people sign out?'],
 twig_demo_account_settings_saved: ['Saving account settings records only which preference fields changed.','Which preferences do people change?'],
 twig_demo_login_prompted: ['A sign-in requirement records the action that prompted it.','Where do people encounter a sign-in requirement?'],
 twig_booking_simulation_submitted: ['Submitting the booking form records success or validation failure.','Where do people have trouble completing a booking?'],
 twig_demo_booking_saved: ['The booking callback records a confirmed demo booking.','Which stays reach a booking confirmation?'],
};

export function describeInstrumentation(activity: Pick<PlaygroundActivity,"kind" | "event" | "properties" | "operationId">): InspectionGuide | undefined {
 if (activity.event === '$ai_generation') return {
  method:'generation',description:'A generation records one model call: its input, output, model, token usage, latency, and cost. Twig simulates this data locally.',
  instrumentationDescription:'PostHog’s provider wrappers capture generations automatically. This manual capture example uses posthog-node after a model call; latency is in seconds.',
  question:'What did the AI request produce?', sources:[{path:'https://posthog.com/docs/ai-observability/installation/manual-capture',line:1,caption:'',code:aiGenerationCaptureExample},{...excerpts.sources.generationCall,label:'Twig call'},{...excerpts.sources.guidedGenerationCall,label:'Guided planner'},{...excerpts.sources.generation,label:'Generation publisher'},{...excerpts.sources.generationFixture,label:'Local generation fixture'}],
 };
 if (activity.kind === 'replay') {
  const properties=activity.properties ?? {};
  const guide=replayInspectionGuide(properties.search_input_masked!==false,properties.recording===true);
  return {...guide,sources:[...guide.sources,{...excerpts.sources.replayObserver,label:"Recording observer"},replayCaptureSource],configuration:{...guide.configuration,captured_events:typeof properties.captured_events==='number'?properties.captured_events:0}};
 }
 if (activity.event === '$exception') return {
  method:'exception',description:activity.properties?.demo_data ? 'The local Error Tracking exercise captured this exception and its page context.' : 'The error handler passes the exception and its page context to posthog.captureException.',
  question:'Which errors interrupt a visit?',sources:activity.properties?.demo_data ? [excerpts.sources.localException] : [excerpts.sources.exception,{...excerpts.sources.exceptionHandler,label:"Event handler"}],
 };
 const explanation=activity.event ? explanations[activity.event] : undefined;
 const all=activity.event ? excerpts.events[activity.event as keyof typeof excerpts.events] : undefined;
 if(!explanation || !all?.length) return;
 // The form has separate validation and result branches. Show the one that ran.
 const call=activity.event==='twig_trip_search_submitted' && activity.properties?.outcome!=='invalid' ? all.at(-1)! : all[0];
 return {
  method:'capture',description:explanation[0],question:explanation[1],
  sources:[...(call.sdkCode ? [{...call,code:call.sdkCode,caption:""},{...call,label:"Twig call"}] : [call]),...(call.handler ? [{...call.handler,label:"Event handler"}] : []),{...excerpts.sources.capture,label:'Tracking helper'},{...excerpts.sources.autocapture,label:'PostHog configuration',description:'Autocapture records interactions as $autocapture without a capture call for each control. This custom event names the action and adds properties chosen by Twig.'}],
  aiExample:false,
 };
}

export const inspectionContexts: Partial<Record<PlaygroundActivity['kind'],InspectionGuide>> = {
 catalog:{method:'capture',description:'Searches, filters, and account actions use named events.',question:'Interact with Twig to see the capture call and its properties.',sources:[]},
 discovery:{method:'capture',description:'The planner records usage with custom product events. Model calls have their own AI Observability evidence.',question:'An AI feature can use both kinds of instrumentation.',sources:[excerpts.events.twig_ai_search_answered[0]],aiExample:true},
 stay:describeInstrumentation({kind:'stay',event:'twig_stay_viewed'}),
 booking:describeInstrumentation({kind:'booking',event:'twig_booking_simulation_submitted'}),
 errors:{method:'exception',description:'The page error handler captures an exception with its surface.',question:'Which errors interrupt a visit?',sources:[excerpts.sources.exception,{...excerpts.sources.exceptionHandler,label:"Event handler"}]},
};

export const replayCaptureSource = {...excerpts.sources.replay,label:"PostHog configuration"};
