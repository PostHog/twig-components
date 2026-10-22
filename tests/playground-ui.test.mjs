import test from "node:test";
import assert from "node:assert/strict";
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { labsOnOtherPages, playgroundPage, touchpointDefinitions } from "@posthog/twig-components/playground";
import { characters, stays } from "@posthog/twig-components/catalog";
import { AiLabProvider, AiLab, AiIntroduction } from "@posthog/twig-components/ai-lab-ui";
import { BookingLabProvider, BookingLab } from "@posthog/twig-components/booking-lab-ui";
import { StayLabProvider, StayLab } from "@posthog/twig-components/stay-lab-ui";
import { ReplayLab } from "@posthog/twig-components/replay-lab-ui";
import { FilterLabIntroduction } from "@posthog/twig-components/filter-lab-exercise";
import { TripPlannerLabProvider, TripPlannerWalkthrough } from "@posthog/twig-components/trip-planner-lab";
import { ReplayProvider } from "@posthog/twig-components/replay-recorder";
import { LabNavigationView } from "@posthog/twig-components/lab-navigation";
import {
  LabDirectory,
  ProductLabLanding,
  PlaygroundHome,
  PlaygroundOnboarding,
  PlaygroundToolRail,
  PlaygroundDock,
  PlaygroundMarker,
  PlaygroundInspectionView,
  inspectionProduct,
  replayInspectionGuide,
  PlaygroundInvitation,
} from "@posthog/twig-components/playground-panels";

const render = (node) => renderToStaticMarkup(node);
const noop = () => {};

test("Woody's shared host profile uses his chosen name", () => {
  assert.equal(characters.find(({ id }) => id === "woodrow-sparks")?.name, "Woody");
});

test("the playground invitation matches the dock's PostHog name and branding", () => {
  const props = { onDismiss: noop, onOpen: noop, toggleRef: { current: null } };
  const invitation = render(h(PlaygroundInvitation, { ...props, dismissed: false }));
  assert.match(invitation, /vac-playground-invite vac-developer-theme/);
  assert.match(invitation, /posthog-logomark\.svg/);
  assert.match(invitation, /PostHog Playground/);
  assert.doesNotMatch(invitation, /Interactive playground/);
  assert.match(invitation, /Open playground/);

  const compact = render(h(PlaygroundInvitation, { ...props, dismissed: true }));
  assert.match(compact, /Explore PostHog/);
  assert.doesNotMatch(compact, /Want to explore/);

  const resume = render(h(PlaygroundInvitation, { ...props, dismissed: true, resumeLab: "Trip details" }));
  assert.match(resume, /Resume Trip details lab →/);
  assert.doesNotMatch(resume, /Explore PostHog/);
});

test("lab navigation keeps actions visible and identifies the reset icon", () => {
  const props = { selected: "errors", stage: 2, embedded: false, resetScope: "twig", onAllLabs: noop, onPrevious: noop, onReset: noop };
  const away = render(h(LabNavigationView, { ...props, returnTo: { label: "Booked stays", onClick: noop } }));
  assert.match(away, /aria-label="Return to lab on Booked stays"[^>]*>Return to lab<\/button>/);
  assert.doesNotMatch(away, /<summary>More<\/summary>/);
  assert.match(away, /All labs/);
  assert.match(away, /aria-label="Reset lab" title="Reset lab"/);
  assert.match(away, /<svg[^>]*aria-hidden="true"/);
  assert.match(away, /class="vac-lab-navigation-links"[^>]*>[^]*?All labs[^]*?Previous step[^]*?<\/div>/);
  assert.match(away, /class="vac-lab-navigation-actions"[^>]*>[^]*?Return to lab[^]*?aria-label="Reset lab"/);
  assert.ok(away.indexOf("All labs") < away.indexOf("Previous step"));
  assert.ok(away.indexOf("Previous step") < away.indexOf("Return to lab"));
  assert.doesNotMatch(away, /Continue the Trip details lab/);

  const atLab = render(h(LabNavigationView, props));
  assert.doesNotMatch(atLab, /Return to lab/);
  assert.match(atLab, /All labs/);
  assert.match(atLab, /Previous step/);
  assert.match(atLab, /aria-label="Reset lab" title="Reset lab"/);
});

test("all portable lab entry screens render without a site router", () => {
  const ai = render(h(AiLabProvider, { active: true }, h(AiLab, { stage: 1, onStage: noop, onFocusPlanner: noop })));
  const booking = render(h(BookingLabProvider, { active: true }, h(BookingLab, { stage: 0, onStage: noop, onFocusBooking: noop })));
  const stay = render(h(StayLabProvider, null, h(StayLab, { stage: 0, onStage: noop, pathname: "/stays/stay-01", renderStayLink: () => null })));
  const replay = render(h(ReplayProvider, { open: false, pathname: "/" }, h(ReplayLab, {
    stage: 0,
    onStage: noop,
    pathname: "/",
    replay: {
      exercise: "ghost", recording: [], starting: false, frames: [], mode: null,
      masked: true, capturedMasked: true, message: "", setMasked: noop,
      start: noop, stop: noop, clear: noop, setExercise: noop,
    },
    returnHome: null,
    sessionPlayer: null,
  })));
  assert.doesNotMatch(ai, /<h3/);
  assert.match(ai, /aria-label="Next AI action"/);
  assert.match(booking, /booking/i);
  assert.match(stay, /Breakdowns by property/);
  assert.match(replay, /Session playback and masking/);
});

test("every lab opening page names its product and explains the simulation", () => {
  const openings = [
    [render(h(FilterLabIntroduction, { onContinue: noop })), "Events and properties"],
    [render(h(BookingLabProvider, { active: true }, h(BookingLab, { stage: 0, onStage: noop, onFocusBooking: noop }))), "Funnels and conversion events"],
    [render(h(StayLabProvider, null, h(StayLab, { stage: 0, onStage: noop, pathname: "/stays/stay-01", renderStayLink: () => null }))), "Breakdowns by property"],
    [render(h(ReplayProvider, { open: false, pathname: "/" }, h(ReplayLab, {
      stage: 0, onStage: noop, pathname: "/",
      replay: {
        exercise: "ghost", recording: [], starting: false, frames: [], mode: null,
        masked: true, capturedMasked: true, message: "", setMasked: noop,
        start: noop, stop: noop, clear: noop, setExercise: noop,
      },
      returnHome: null, sessionPlayer: null,
    }))), "Session playback and masking"],
    [render(h(TripPlannerLabProvider, null, h(TripPlannerWalkthrough, { stays, onAllLabs: noop }))), "Traces, generations, and evaluations"],
    [render(h(AiIntroduction, { onContinue: noop })), "AI inputs and outputs"],
  ];
  for (const [html, title] of openings) {
    assert.match(html, new RegExp(`<h3>${title}<\\/h3>`));
    assert.match(html, /class="vac-inspector-disclosure-label">How this simulation works<\/span>/);
  }
});

test("playground directory and dock preserve accessible navigation", () => {
  const page = playgroundPage("/", stays);
  assert.deepEqual(page.touchpoints.map(({ id }) => id), ["discovery", "catalog", "replay"]);
  assert.equal(page.touchpoints[0].color, "purple");
  assert.equal(labsOnOtherPages(page).find(({ id }) => id === "booking")?.color, "blue");
  assert.equal(labsOnOtherPages(page).find(({ id }) => id === "errors")?.color, "yellow");
  assert.deepEqual(labsOnOtherPages(page).map(({ id, page }) => [id, page]), [
    ["stay", "stay"], ["booking", "stay"], ["errors", "stay"],
  ]);
  const directory = render(h(LabDirectory, { page, choose: noop, showMarker: noop, onVisitLab: noop }));
  assert.equal((directory.match(/>Show me where<\/button>/g) ?? []).length, page.touchpoints.length);
  assert.equal((directory.match(/aria-label="Go to [^"]+ lab"/g) ?? []).length, 3);
  assert.match(directory, /Explore other PostHog products on Twig/);
  assert.match(directory, /<details class="vac-lab-other-pages">/);
  assert.match(directory, /<nav class="vac-lab-other-pages-menu"/);
  assert.match(directory, /data-product="product-analytics"/);
  assert.match(directory, /data-product="error-tracking"/);
  assert.equal((directory.match(/>On this page</g) ?? []).length, 0);
  assert.ok(directory.indexOf("Labs on this page") < directory.indexOf("Explore other PostHog products on Twig"));
  assert.match(directory, /A stay page, then Booked stays/);
  assert.match(directory, /Choose a lab/);
  assert.match(directory, /Traces, generations, and evaluations/);
  assert.doesNotMatch(directory, /Continue lab/);

  const marker = render(h(PlaygroundMarker, {
    touchpoint: page.touchpoints[0], highlighted: false, onHighlight: noop, onChoose: noop,
  }));
  assert.match(marker, /aria-controls="twig-playground-detail"/);

  const dock = render(h(PlaygroundDock, {
    embedded: false, onClose: noop, headingRef: { current: null }, logo: null,
    navigation: h("span", null, "Navigation"), recordingBar: null,
    pageKey: page.key, guide: h("span", null, "Guide"),
  }));
  assert.match(dock, /aria-label="Twig playground"/);
  assert.match(dock, /PostHog Playground/);
  assert.match(dock, /aria-label="Instrumentation touchpoints and details"/);
});

test("the other-products menu shows the matching PostHog icon on every Twig page", () => {
  const icons = {
    "Product Analytics": "posthog-product-analytics.svg",
    "AI Observability": "posthog-ai-observability.svg",
    "Error Tracking": "posthog-error-tracking.svg",
    "Session Replay": "posthog-session-replay.svg",
  };
  for (const pathname of ["/", "/about", "/stays/stay-01", "/profile/bookings"]) {
    const page = playgroundPage(pathname, stays);
    const directory = render(h(LabDirectory, { page, choose: noop, showMarker: noop, onVisitLab: noop }));
    const products = new Set(labsOnOtherPages(page).map(({ tool }) => tool));
    for (const [product, icon] of Object.entries(icons)) {
      if (products.has(product)) {
        const slug = product.toLowerCase().replaceAll(" ", "-");
        assert.match(directory, new RegExp(`data-product="${slug}"><h4><img src="[^"]*${icon}"[^>]*alt=""\\/>${product}<\\/h4>`));
      } else {
        assert.doesNotMatch(directory, new RegExp(icon));
      }
    }
  }
});


test("inspection is focused on evidence without a lab CTA", () => {
  const empty = render(h(PlaygroundInspectionView, {activity: [], onSelect: noop, choose: noop}));
  assert.match(empty, /<h3[^>]*>Inspector<\/h3>/);
  assert.doesNotMatch(empty, /Features to inspect|Start lab|Try .* lab/);
  const active = render(h(PlaygroundInspectionView, {activity: [{id: 1, kind: "catalog", label: "Setting selected", event: "twig_stay_filter_selected", detail: "setting: Forest"}], selectedId: "catalog", onSelect: noop, choose: noop}));
  assert.match(active, /twig_stay_filter_selected/);
  assert.doesNotMatch(active, /No element associated|No element captured/);
  assert.doesNotMatch(active, /Event data|More event data/);
  assert.doesNotMatch(active, /Listening|Local preview|selected node|selected properties/);
  assert.doesNotMatch(active, /Explore the .* lab|Want to learn more/);
  assert.doesNotMatch(active, /An interactive learning experience on Twig/);
  assert.doesNotMatch(active, /vac-guide-example|vac-os-button-face|See instrumentation|Live activity/);
  assert.doesNotMatch(active, /Features to inspect|Show me where|Resume lab|All labs/);
});

test("the selected event stays connected to its payload when product context changes", () => {
  const html = render(h(PlaygroundInspectionView, {
    activity: [{id: 1, kind: "catalog", label: "Setting selected", event: "twig_stay_filter_selected", detail: "setting: Forest", properties: {setting: "Forest"}}],
    selectedId: "discovery", onSelect: noop, choose: noop,
  }));
  assert.match(html, /twig_stay_filter_selected/);
  assert.doesNotMatch(html, /Explore the AI Observability lab/);
  assert.match(html, /Forest/);
});

test("a closed controlled dock does not mount lesson content before opening", () => {
  let lessonRenders = 0;
  function Lesson() { lessonRenders += 1; return h("p", null, "Lesson content"); }
  const props = { embedded: false, placement: "edge", open: false, onClose: noop,
    headingRef: { current: null }, logo: null, navigation: null, recordingBar: null,
    pageKey: "discover", guide: h(Lesson) };
  assert.equal(render(h(PlaygroundDock, props)), "");
  assert.equal(lessonRenders, 0);
  const opened = render(h(PlaygroundDock, { ...props, open: true }));
  assert.match(opened, /Lesson content/);
  assert.equal(lessonRenders, 1);
  assert.doesNotMatch(opened, /aria-hidden="true"/);
});

test("AI feature usage is Product Analytics; generations and exceptions use their actual products", () => {
  assert.equal(inspectionProduct({event:"twig_ai_search_answered",kind:"discovery"}),"Product Analytics");
  assert.equal(inspectionProduct({event:"$ai_generation",kind:"discovery"}),"AI Observability");
  assert.equal(inspectionProduct({event:"$exception",kind:"errors"}),"Error Tracking");
  assert.equal(inspectionProduct({kind:"replay"}),"Session Replay");
});

test("teaching evidence connects an interaction to its real call without irrelevant element placeholders", () => {
  const html=render(h(PlaygroundInspectionView,{activity:[{id:1,kind:"discovery",label:"AI response ready",event:"twig_ai_search_answered",detail:""}],selectedId:"discovery",onSelect:noop,choose:noop,
    describe:()=>({method:"capture",description:"Records the planner outcome with Product Analytics.",question:"Did it find a stay?",sources:[{path:"Discover.tsx",line:89,code:'trackTwigEvent("twig_ai_search_answered", { outcome: reply.kind })'}],aiExample:true})}));
  assert.match(html,/Product Analytics/);assert.match(html,/trackTwigEvent/);assert.match(html,/Discover.tsx:89/);
  assert.match(html,/Inspect a model-call example/);assert.doesNotMatch(html,/Explore the Product Analytics lab/);
  assert.doesNotMatch(html,/No element|Example generation|local-trip-1/);
});

test("replay inspection shows the real masking configuration instead of an invented event", async () => {
  const {readFileSync}=await import("node:fs");const guide=replayInspectionGuide(true,false);
  assert.ok(readFileSync(new URL('../src/ReplayRecorder.tsx',import.meta.url),'utf8').includes(guide.sources[0].code));
  const html=render(h(PlaygroundInspectionView,{activity:[],selectedId:"replay",onSelect:noop,choose:noop,contexts:{replay:guide}}));
  assert.match(html,/maskAllInputs/);assert.match(html,/Recording configuration/);assert.match(html,/search_input_masked/);
  assert.doesNotMatch(html,/No element|capture payload/);
});

test("each product landing lists all of its labs once, independent of the current Twig route", () => {
  const analytics=render(h(ProductLabLanding,{selectedId:"catalog",choose:noop}));
  const stay=render(h(ProductLabLanding,{selectedId:"stay",choose:noop}));
  for(const title of ["Events and properties","Breakdowns by property","Funnels and conversion events"]) assert.ok(analytics.includes(`Start lab: ${title}`));
  assert.equal((analytics.match(/Start lab:/g)||[]).length,3);
  assert.equal(analytics,stay);
  assert.match(analytics, /<h3>Product Analytics labs<\/h3>/);
  assert.doesNotMatch(analytics,/Show me where|Activity on Twig|Local preview|Labs on other pages/);
  for(const [id,title] of [["discovery","Traces, generations, and evaluations"],["replay","Session playback and masking"],["errors","Exceptions and issue resolution"]]) {
    const html=render(h(ProductLabLanding,{selectedId:id,choose:noop}));
    assert.ok(html.includes(`Start lab: ${title}`));assert.equal((html.match(/Start lab:/g)||[]).length,1);
  }
});

test("the logo opens Home without a separate help control or selected product", () => {
  const rail = render(h(PlaygroundToolRail, { page: playgroundPage("/", stays), open: true, homeOpen: true, picking: false, selectedId: "catalog", onHomeOpened: noop, onOpen: noop, onCollapse: noop, onPick: noop, onSelect: noop, toggleRef: { current: null } }));
  assert.match(rail, /aria-label="Playground Home"[^>]*aria-pressed="true"[^>]*aria-controls="twig-playground"/);
  assert.doesNotMatch(rail, /About the PostHog toolbar|vac-tool-help/);
  assert.doesNotMatch(rail, /aria-label="Open Product Analytics labs"[^>]*aria-pressed="true"/);
});

test("joined edge branding keeps the logo out of the expanded title", () => {
  const props = { embedded: false, onClose: noop, headingRef: { current: null }, logo: h("img", { src: "/brand.svg", alt: "" }), navigation: null, recordingBar: null, pageKey: "home", guide: null, open: true, joinedBranding: true };
  assert.doesNotMatch(render(h(PlaygroundDock, { ...props, placement: "edge" })), /brand.svg/);
  assert.match(render(h(PlaygroundDock, { ...props, placement: "inline" })), /brand.svg/);
});


test("connected AI evidence keeps product outcomes and generation details in one Inspector", () => {
  const activity = [
    {id:1,kind:"discovery",label:"AI response ready",event:"twig_ai_search_answered",operationId:"request-1",properties:{outcome:"recommendation",result_count:1}},
    {id:2,kind:"discovery",label:"Simulated AI generation",event:"$ai_generation",operationId:"request-1",properties:{$ai_model:"teaching-model",$ai_latency:1.2,$ai_input_tokens:30,$ai_output_tokens:12,$ai_total_cost_usd:0.00009,$ai_trace_id:"request-1",$ai_span_id:"generation-1"}},
    {id:3,kind:"discovery",label:"Unrelated",event:"$ai_generation",operationId:"request-2"},
  ];
  const props = {activity,onSelect:noop,describe:item=>({method:item.event==="$ai_generation"?"generation":"capture",description:"Connected local evidence.",question:"",sources:[]})};
  const generation = render(h(PlaygroundInspectionView,{...props,session:{consoleAfterId:0,followLatest:false,selectionId:2}}));
  for(const text of ["teaching-model","1.2s","30 in / 12 out","$0.000090"]) assert.ok(generation.includes(text),text);
  assert.doesNotMatch(generation,/No element|Inspect a model-call example/);
  assert.doesNotMatch(generation,/vac-inspector-console-label/);
  assert.match(generation,/aria-label="Console controls"/);
  assert.match(generation,/aria-label="Clear console"/);
  assert.doesNotMatch(generation,/Inspect product event/);
  const product = render(h(PlaygroundInspectionView,{...props,session:{consoleAfterId:0,followLatest:false,selectionId:1}}));
  assert.doesNotMatch(product,/Inspect AI generation/);
});


test("selected-event drill-down simplifies the first view while preserving source and expandable data", async () => {
  const {InstrumentationInspector}=await import('../dist/InstrumentationInspector.js');
  const props={event:'twig_destination_suggestion_selected',label:'Destination selected',properties:{stay_id:'stay-01'},guide:{method:'capture',description:'Records the selected stay.',question:'',sources:[{path:'src/components/Discover.tsx',line:111,code:'trackTwigEvent("twig_destination_suggestion_selected", { stay_id: stay.id })'},{path:'src/components/Discover.tsx',line:108,label:'Handler',code:'function chooseStay(stay) { return stay.id; }'}]}};
  const html=render(h(InstrumentationInspector,{...props,drilldown:true}));
  assert.match(html,/aria-label="Selected event details"/);
  const interaction=html.match(/<section aria-label="Interaction">([^]*?)<\/section>/)[1];
  assert.match(interaction,/Destination selected/);
  assert.doesNotMatch(interaction,/twig_destination_suggestion_selected/);
  assert.match(html,/How it’s tracked/);
  const {JSDOM}=await import('jsdom');
  const document=new JSDOM(html).window.document;
  const capture=document.querySelector('section[aria-label="Instrumentation code"] > details');
  const implementation=document.querySelector('section[aria-label="Twig source code"] > details');
  assert.equal(capture.parentElement.parentElement,implementation.parentElement.parentElement);
  assert.equal(capture.className,implementation.className);
  assert.equal(implementation.querySelector(':scope > summary').textContent,'Twig source code');
  assert.equal(capture.querySelectorAll('details').length,0);
  implementation.open=true;
  capture.open=false;
  assert.equal(implementation.open,true);
  assert.equal(implementation.querySelectorAll(':scope > details.vac-inspector-source-extra').length,1);
  assert.doesNotMatch(html,/Handler &amp; setup/);

  assert.match(html,/title="src\/components\/Discover.tsx">Discover.tsx:111/);
  assert.ok(html.indexOf('trackTwigEvent')<html.indexOf('>Discover.tsx:111'));
  assert.match(html,/<details class="vac-inspector-source-extra"><summary/);
  assert.match(html,/<details><summary[^]*?Event data/);
  assert.match(html,/stay-01/);
  assert.match(html,/function/);
  const standalone=render(h(InstrumentationInspector,props));
  assert.doesNotMatch(standalone,/vac-inspector-drilldown/);
  assert.match(standalone,/vac-inspector-selected-name/);
  assert.match(standalone,/Instrumentation/);
});


test("an AI interaction highlights its product event and generation while selecting one record", () => {
 const activity=[
  {id:1,kind:"discovery",label:"AI response",event:"twig_ai_search_answered",operationId:"request-1"},
  {id:2,kind:"discovery",label:"Generation",event:"$ai_generation",operationId:"request-1"},
  {id:3,kind:"discovery",label:"AI response",event:"twig_ai_search_answered",operationId:"request-2"},
  {id:4,kind:"discovery",label:"Generation",event:"$ai_generation",operationId:"request-2"},
 ];
 function rows(records,session) {
  const html=render(h(PlaygroundInspectionView,{activity:records,session,onSelect:noop}));
  const stream=html.match(/<ol[^>]*aria-label="Console events"[^>]*>([^]*?)<\/ol>/)[1];
  return [...stream.matchAll(/<button([^>]+)>/g)].map(([,attributes])=>({highlighted:attributes.includes('data-highlighted="true"'),selected:attributes.includes('aria-pressed="true"')}));
 }
 assert.deepEqual(rows(activity),[
  {highlighted:false,selected:false},{highlighted:false,selected:false},
  {highlighted:true,selected:false},{highlighted:true,selected:true},
 ]);
 assert.deepEqual(rows(activity,{consoleAfterId:0,followLatest:false,selectionId:1}),[
  {highlighted:true,selected:true},{highlighted:true,selected:false},
  {highlighted:false,selected:false},{highlighted:false,selected:false},
 ]);
 const single=rows([...activity,{id:5,kind:"catalog",label:"Setting selected",event:"twig_stay_filter_selected"}]);
 assert.equal(single.filter(row=>row.highlighted).length,1);
 assert.deepEqual(single.at(-1),{highlighted:true,selected:true});
});


test("source wrapping preserves exact code text and indentation without inserting characters", async () => {
 const {Source}=await import('../dist/InstrumentationInspector.js');
 const {JSDOM}=await import('jsdom');
 const value='trackTwigEvent(\n  "twig_destination_suggestion_selected",\n  {\n    stay_id: stay.id\n  }\n)';
 const dom=new JSDOM(render(h(Source,{compact:true,source:{path:'Discover.tsx',line:138,code:value,highlightLines:[2,4]}})));
 assert.deepEqual([...dom.window.document.querySelectorAll('[data-highlighted="true"]')].map(line=>line.textContent),['  \"twig_destination_suggestion_selected\",','    stay_id: stay.id']);
 const pre=dom.window.document.querySelector('pre');
 assert.equal(pre.textContent,value);
 assert.ok(pre.querySelectorAll('wbr').length>0);
 assert.deepEqual([...pre.querySelectorAll('.vac-inspector-code-indent')].map(node=>node.textContent),['','  ','  ','    ','  ','']);
 assert.equal(pre.hasAttribute('tabindex'),false);
 dom.window.close();
});


test("SDK capture examples can omit the caption without claiming a literal file location", async () => {
 const {Source}=await import('../dist/InstrumentationInspector.js');
 const html=render(h(Source,{compact:true,source:{path:'src/components/Discover.tsx',line:169,code:'posthog.capture("twig_trip_search_submitted", { result_count: count })',caption:''}}));
 assert.doesNotMatch(html,/Equivalent PostHog capture|<small/);
 assert.match(html,/posthog/);
 assert.doesNotMatch(html,/Discover.tsx|:169/);
});


test("console-linked details show only omitted or truncated properties", async () => {
 const {JSDOM}=await import('jsdom');
 function inspect(properties,event='twig_trip_search_submitted'){
  const dom=new JSDOM(render(h(PlaygroundInspectionView,{activity:[{id:1,kind:event==='$ai_generation'?'discovery':'catalog',event,label:'Interaction',timestamp:'2026-10-21T16:48:12.251Z',properties}],onSelect:noop,describe:()=>({method:'capture',description:'Records this interaction.',question:'',sources:[{path:'app.ts',line:1,code:'posthog.capture(event, properties)'}]})})));
  const details=dom.window.document.querySelector('[aria-label="Selected event details"]');
  const data=details.querySelector('[aria-label="More event data"]');
  const keys=data?[...data.querySelectorAll('.vac-inspector-key')].map(node=>node.textContent):[];
  const result={html:details.innerHTML,data:data?.textContent,keys,open:data?.querySelector('details').open,nestedOpen:data?[...data.querySelectorAll('.vac-inspector-tree-object')].map(node=>node.open):[],preview:dom.window.document.querySelector('.vac-inspector-record-preview').textContent};
  dom.window.close();return result;
 }
 const simple=inspect({stay_id:'stay-02'},'twig_destination_suggestion_selected');
 assert.equal(simple.data,undefined);
 assert.doesNotMatch(simple.html,/Event data|event:|timestamp:/);
 assert.match(simple.preview,/stay-02/);
 assert.match(simple.html,/How it’s tracked/);
 assert.equal(inspect({outcome:'results',result_count:1}).data,undefined);
 const extra=inspect({outcome:'results',result_count:1,setting:'Coast'});
 assert.deepEqual(extra.keys,['setting']);
 assert.match(extra.data,/Coast/);
 assert.equal(extra.open,false);
 const long='word'.repeat(30);
 const truncated=inspect({message:long,stay_id:'stay-01'});
 assert.match(truncated.preview,/…/);
 assert.ok(truncated.data.includes(long));
 assert.deepEqual(truncated.keys,['message']);
 const ai=inspect({$ai_input:[{role:'user',content:'A fixture request'}],$ai_model:'teaching-model',$ai_latency:1.2,$ai_output_choices:[{content:'A fixture response'}]},'$ai_generation');
 assert.ok(ai.nestedOpen.length>0);
 assert.ok(ai.nestedOpen.every(open=>open===false));
 assert.ok(ai.keys.includes('$ai_input'));
 assert.ok(ai.keys.includes('$ai_output_choices'));
 for(const key of ['event','timestamp','$ai_model','$ai_latency'])assert.equal(ai.keys.includes(key),false,key);
 assert.match(ai.preview,/model: "teaching-model", latency: 1.2s/);
});

test("recording configuration remains available independently of the console property preview", () => {
 const html=render(h(PlaygroundInspectionView,{activity:[{id:1,kind:'replay',label:'Recording stopped',properties:{recording:false,search_input_masked:true,captured_events:12}}],onSelect:noop,describe:()=>replayInspectionGuide(true,false)}));
 assert.match(html,/Recording configuration/);
 assert.match(html,/maskAllInputs/);
 assert.doesNotMatch(html,/More event data/);
});


test("AI drill-down teaches capture before expandable generation details without repeating metrics", async () => {
 const {InstrumentationInspector}=await import('../dist/InstrumentationInspector.js');
 const {JSDOM}=await import('jsdom');
 const properties={$ai_model:'example-model',$ai_latency:1.2,$ai_input_tokens:14,$ai_output_tokens:20,$ai_total_cost_usd:0.000114,$ai_trace_id:'trace-1',$ai_span_id:'span-1',$ai_input:[{role:'user',content:'Fixture'}]};
 const guide={method:'generation',description:'Simulated locally.',instrumentationDescription:'Manual capture example.',sources:[{path:'Docs example',line:1,caption:'Manual capture example',code:'posthog.capture({ event: "$ai_generation" })'},{path:'src/planner.ts',line:12,label:'Twig call',code:'publishPlannerGeneration(record)'}]};
 const document=new JSDOM(render(h(InstrumentationInspector,{drilldown:true,event:'$ai_generation',properties,additionalProperties:properties,guide}))).window.document;
 const sections=[...document.querySelectorAll('[aria-label="Selected event details"] > section')];
 assert.deepEqual(sections.map(section=>section.getAttribute('aria-label')),['Interaction','Instrumentation code','Generation details','Twig source code']);
 const generation=document.querySelector('[aria-label="Generation details"] > details');
 assert.equal(generation.open,false);
 const table=generation.querySelector('table.vac-lab-table-key-value');
 assert.ok(table);
 assert.deepEqual([...table.querySelectorAll('th[scope="row"]')].map(th=>th.textContent),['Model','Duration','Tokens','Cost','Trace ID','Generation ID','Input']);
 assert.equal(table.querySelectorAll('tr').length,7);

 for(const value of ['example-model','1.2s','14 in / 20 out','$0.000114','trace-1','span-1'])assert.ok(generation.textContent.includes(value));
 assert.equal(document.querySelector('[aria-label="More event data"]'),null);
 assert.ok(generation.textContent.includes('Fixture'));
 assert.equal(table.querySelector('td > details').open,false);
 const partial=new JSDOM(render(h(InstrumentationInspector,{drilldown:true,event:'$ai_generation',properties:{$ai_input_tokens:14},additionalProperties:{$ai_input_tokens:14},guide}))).window.document;
 assert.equal(partial.querySelector('[aria-label="More event data"]'),null);
 assert.ok(partial.querySelector('[aria-label="Generation details"]').textContent.includes('Input tokens'));
});

test("edge dock owns the full-height scroll region while inline headers stay outside it", async () => {
 const {JSDOM}=await import('jsdom');
 const props={open:true,onClose:noop,logo:h('img',{src:'brand.svg',alt:''}),navigation:h('button',{},'Navigation'),recordingBar:h('div',{},'Recording'),guide:h('div',{},'Lesson content')};
 for(const placement of ['edge','inline']){
  const document=new JSDOM(render(h(PlaygroundDock,{...props,placement}))).window.document;
  const dock=document.querySelector('#twig-playground'),scroll=dock.querySelector('.vac-dock-scroll'),header=dock.querySelector('.vac-dock-header');
  assert.equal(dock.querySelectorAll('.vac-dock-header').length,1);
  assert.equal(header.parentElement,placement==='edge'?scroll:dock);
  assert.equal(scroll.getAttribute('tabindex'),'0');
  assert.equal(Boolean(scroll.querySelector('.vac-dock-content')),placement==='edge');
  assert.ok(scroll.textContent.includes('Lesson content'));
  assert.ok(header.textContent.includes('Navigation'));
  assert.ok(header.textContent.includes('Recording'));
 }
});

test("live-event control stays visible and is available only while history is pinned", async () => {
 const {JSDOM}=await import('jsdom');
 const activity=[{id:1,kind:'catalog',event:'first',label:'First'},{id:2,kind:'catalog',event:'second',label:'Second'}];
 for(const [records,followLatest,disabled] of [[activity,true,true],[activity,false,false],[[],false,true]]){
  const document=new JSDOM(render(h(PlaygroundInspectionView,{activity:records,onSelect:noop,session:{consoleAfterId:0,followLatest,selectionId:1}}))).window.document;
  const control=document.querySelector('button[aria-label="Track live events"]');
  assert.ok(control);
  assert.equal(control.disabled,disabled);
  assert.ok(control.querySelector('svg'));
  assert.equal(control.textContent,'');
  assert.doesNotMatch(document.body.textContent,/Follow latest/);
 }
});


test("every Product Analytics drill-down uses Event while console records retain their event names", async () => {
 const {JSDOM}=await import('jsdom');
 for(const [kind,event,label] of [['catalog','twig_trip_search_submitted','Stay search submitted'],['discovery','twig_ai_search_answered','AI response ready'],['stay','twig_stay_viewed','Stay viewed'],['booking','twig_demo_booking_saved','Booking confirmed']]){
  const document=new JSDOM(render(h(PlaygroundInspectionView,{activity:[{id:1,kind,event,label}],onSelect:noop,describe:()=>({method:'capture',description:'What the interaction records.',question:'',sources:[{path:'app.ts',line:1,code:'posthog.capture(event, properties)'}]})}))).window.document;
  assert.equal(document.querySelector('.vac-inspector-section-title').textContent,'Event');
  assert.equal(document.querySelector('.vac-inspector-record-heading code').textContent,event);
  assert.ok(document.querySelector('.vac-inspector-context').textContent.includes('What the interaction records.'));
 }
});


test("Home introduces Twig, offers a stay interaction and groups every lab by product", () => {
  const html = render(h(PlaygroundHome, { onInspect: noop, onStart: noop, onVisitLab: noop }));
  for (const text of ["Meet Twig", "demo vacation rental site", "The PostHog Playground reveals", "Take a tour", "Explore on your own", "Learn with labs", "Go deeper with guided, hands-on lessons for each PostHog product."]) assert.ok(html.includes(text));
  assert.equal((html.match(/<details /g) ?? []).length, 4);
  assert.equal((html.match(/aria-label="Start lab:/g) ?? []).length, 6);
  for (const id of ["catalog", "discovery", "replay", "errors"]) assert.ok(html.includes(`${touchpointDefinitions[id].tool} labs`));
  assert.doesNotMatch(html, /<small|<caption/);
});

test("tour guidance stays inside the normal Inspector with an exit in every phase", () => {
  for (const phase of ["stay", "filter", "another-stay", "history", "compare", "compare-again", "follow", "reset", "complete"]) {
    const guidance = h(PlaygroundOnboarding, { phase });
    const prompt = render(guidance);
    assert.doesNotMatch(prompt, /End tour|Exit tour/);
    assert.doesNotMatch(prompt, /<h[1-6]|Try the AI trip planner|stay view event/);
    assert.match(prompt, /vac-booking-checklist/);
    const html = render(h(PlaygroundInspectionView, { activity: [], onSelect: noop, guidance, onExitTour: noop }));
    assert.match(html, /vac-inspector-title[^>]*>Tour/);
    assert.match(html, /Guided tour/);
    assert.match(html, /aria-label="Exit tour"/);
    assert.match(html, /data-surface="true"/);
    assert.match(html, /Event console/);
    assert.doesNotMatch(html, /Interact with Twig to see/);
    assert.ok(html.indexOf('aria-label="Tour"') < html.indexOf('aria-label="Guided tour"'));
  }
});
