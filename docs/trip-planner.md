# Simulated trip planner

This conversation is a local teaching example. It never calls a model or sends
messages to a server. The visible disclosure is “Simulated AI responses.” The guided AI Observability lab uses records from this conversation.

## Conversation contract

| Visitor asks | Reply uses | State after reply |
| --- | --- | --- |
| Find me a forest getaway for four. | Adiron-shack’s location, capacity, king bedrooms, fire pit, and walking path to the lake | Four guests, forest stay selected |
| Actually, I’d prefer somewhere with beach access. | Flamingo’s Envy’s beach access, balcony, capacity, location, and nightly price | Four guests retained, beach stay selected |
| Does it have a full kitchen? | The selected beach stay’s amenity list | City question prefilled |
| Find me a city stay for four. | Deliberately broken city lookup omitting guest count | Conversation complete |

The change of country is explicit. The planner never implies the Gold Coast
is near the Adirondacks. Missing amenities are not invented. A missing or
incompatible catalog stay produces an unavailable-example response.

The first question is prefilled in a read-only composer. Visitors press Send to
open the floating chat window, where each reply prefills the next question.
Both composers prevent typing and editing. The underlying conversation rules
still handle documented aliases and unsupported requests defensively.
At most 12 turns of 240 characters are retained in memory, until reset or unmount.

## Component boundaries

`TripPlanner` owns temporary conversation state and uses each request record’s duration for its typing indicator (1.1 s forest, 1.4 s beach, 0.8 s kitchen).
Reduced motion skips the delay. Reset cancels a pending reply and restores the first prefilled question. The send button advances the scripted conversation. The host supplies the catalog and renders the
selected stay’s link, so URLs, navigation, and analytics remain host-owned.
The homepage shows only the composer and a short simulation disclosure. After sending, it becomes a button to reopen the conversation. The non-modal window sits at the bottom right on desktop and fills the viewport with a small inset on mobile. History scrolls independently above a pinned composer. Closing (including Escape within the window) restores launcher focus and preserves the conversation. Opening focuses the window title without forcing the mobile keyboard open. The window is portaled to the document body, so it requires React DOM alongside React. Hosts that hide the planner for a lesson must pass `hidden` to hide its portal too. `windowClassName` lets the host position chat alongside its other panels. `windowAction` closes chat and invokes a host callback, leaving panel navigation and focus with the host. `launcherLabel` labels the return action. Twig places chat on the left beside the Playground on desktop and provides Playground/Back to chat switching on mobile. There is no login requirement, local storage, SDK, API key, or model cost.

```tsx
import { TripPlanner } from "@posthog/twig-components/trip-planner";
import { stays, stayLabel } from "@posthog/twig-components/catalog";
import "@posthog/twig-components/catalog.css";

<TripPlanner
  stays={stays}
  renderStayLink={(stay) => <a href={`/stays/${stay.id}`}>View {stayLabel(stay)} →</a>}
/>;
```

## Review and delivery

Use the **Trip planner** workbench example for the conversation, fallback,
reset, and host callback. Check desktop/mobile, keyboard input, long messages,
and reset during typing. The interactive planner replaces the disabled homepage composer. The guided lesson uses the same conversation and its completed request records.

For a local Twig preview, build and pack this checkout with `npm pack
--pack-destination /private/tmp`. In the isolated Twig checkout, run `npm ci`,
then extract that tarball over `node_modules/@posthog/twig-components` using
`tar -xzf <tarball-path> -C node_modules/@posthog/twig-components
--strip-components=1`. This replaces only the local package while keeping all
other dependencies at their locked versions. Clear the generated `.next/cache`
before rebuilding Twig when replacing a local archive with the same version,
otherwise Next may reuse the previous package output. This is a local preview only:
do not commit a temporary file dependency. A reviewed package release and a pinned consumer dependency update
are required before shipping Twig’s new import. Publish the package from main through its release workflow before merging the corresponding Twig.com update.

## Request records

The chat now builds a `$ai_generation` record from the same answer and catalog snapshot it displays. Each submitted question gets its own trace ID and generation ID. A conversation retains one `$ai_session_id` across closing and reopening. Start over creates a new session on the next send. Empty, oversized, and over-limit submissions create no record.

The input contains system instructions, the catalog snapshot and current selection, prior question/answer pairs, and the current question. Supported aliases become the canonical example question. The UI only submits prefilled questions. If a caller supplies unsupported text to the underlying rules, request records replace it with a fixed marker in both current and future inputs. A handled fallback is not a model error.

`onRequestComplete(record)` fires once after an answer completes, even if the chat was closed while waiting. Closing and reopening does not emit it again. Reset or unmount before completion cancels it. It reports completion, not proof that an answer was viewed. The component performs no upload. The host owns any future capture adapter.

The fixture uses `claude-haiku-4-5-20251001` with Anthropic pricing frozen on October 7, 2026: $1 per million input tokens and $5 per million output tokens. [Pricing source](https://platform.claude.com/docs/en/models/haiku-4-5/overview). Token counts are illustrative, deterministically derived from full message length and message overhead. They are not measured provider usage or a billing-grade tokenizer. Costs are calculated from those counts and the frozen rates, with input/output components and their sum included. Internal `demo_data`, `usage_source`, `fixture_version`, and `pricing_date` properties retain provenance without interrupting the lesson.

The normal UI delay follows the record duration. Reduced motion skips waiting. A logical start time keeps subsequent example requests after the prior request’s end even when waiting is skipped. Durations and timestamps describe the teaching scenario, not measured browser performance.

Review at `http://127.0.0.1:5173/?view=planner`: follow the lab and send each question when its lesson step unlocks it. The walkthrough presents input, output, identifiers, the search span, and evaluation results in context. No events are sent to PostHog. The diagrams illustrate the local records.

## Playground integration

`TripPlannerLabProvider` retains up to 24 completed requests while the lab is hidden or another lab is selected. Both the workbench and Twig use `TripPlannerWalkthrough` from `/trip-planner-lab` inside the PostHog lab theme. The walkthrough ends with a recap and a button to choose another lab. The host passes `onRequestComplete={lab.record}` to chat and `key={lab.revision}` so Reset lab clears the evidence and cancels any pending reply by remounting chat. Starting over in chat begins another session without deleting older evidence. The host owns opening chat, selecting the AI lab, and moving focus between panels. Records are local and are not uploaded to PostHog.

## Guided walkthrough

The lab introduces itself once on its landing page with a simple numbered overview of its two parts: understanding the successful chat data, then investigating a failure. The AIO host omits the repeated product/lab header, and the lesson omits progress eyebrows. Only the landing, review milestone, and completion pages use titles. Instructional and investigation pages start directly with their prose or evidence, without page titles or code-section headings.

The lab has one entry and three stages: follow a successful conversation, encounter a wrong recommendation, then investigate and fix it. Refer to the example as Twig, not the learner’s app. Keep instructions short, with bold labels for actual website controls. Lab CTAs navigate the lesson or apply the guided fix; they never open or click Twig controls.

The successful conversation introduces input/output once, using the forest request. Both tabs show the same capture call and highlight the selected property, followed by its simplified trace preview. After both tabs have been viewed, a short prompt asks for the beach question. Its completion opens a simple session view: one explicitly labelled `$ai_session_id` containing two request rows, each with its own labelled `$ai_trace_id`, a small capture example, and a Continue button. The session has a visible outer border and its two traces are indented beneath it. The review is a separate milestone page reusing the completion checkmark, recap card, and button styling. Three short learning outcomes summarize capture, trace inspection, and session grouping, followed by a standard-sized Follow a failure button. Previous step returns from the failure to the review and then to the session view. There are no request selectors or repeated input/output tabs in that view. The diagram uses explicit example IDs (`example-7f3a9c2e8b14`, `example-a6d2f809c31e`, and `example-4b8e1a7d05c9`) to illustrate grouping. Underlying local records retain their generated IDs. The view starts with prose, with no additional title. If both requests were recorded early, learners inspect the forest input/output first, then choose Connect the requests to see the session. Early events never count as viewed.

The failure stage uses the city recommendation recorded by the website. Separate investigation screens introduce the trace, inspect the search, apply the filter fix, compare the retry, and evaluate the answer. Applying the fix remounts chat with the corrected request. The capture overview up front introduces input, output, trace ID, and session ID. Completion recaps both parts and returns to all labs.

Evidence persists when panels close or labs change. The normal forest/beach pair is anchored to one session and retained separately from failure evidence and the bounded 24-record history. Previous step preserves inspected views and evidence. Reset lab clears them all. The host highlights the chat while either successful request, the failure, or the corrected request is needed, and handles panel focus. All data remains local.

## Capacity failure in the continuous lab

After the forest, beach, and kitchen turns, Twig's normal read-only chat prefills “Find me a city stay for four.” Its deliberately broken lookup omits the guest count and recommends the two-person city stay. This happens without opening or starting a lab. The same chat retains the conversation history and session ID, while each request has a new trace. Local records and failure evidence are retained even before the learner reaches that part of the lab.

The lab has one entry and a continuous sequence: follow the successful conversation and its captured data, then encounter and investigate the website's capacity failure. Going back preserves the normal request and failure evidence separately. Only applying the guided fix remounts the chat with the corrected city request. The correction is a real change to the local catalog filter. Reset restores the original conversation.

The lookup is recorded as a local `$ai_span`, using `$ai_input_state` and `$ai_output_state` and the generation's trace ID. The independent capacity evaluation targets the generation ID and returns pass, fail, or N/A. No recommendation passes this narrow check without claiming a matching stay was found. `capacityEvidence` is local teaching data, not an uploaded evaluation. No inference or event upload takes place.

Chat-action prompts reuse `LabChecklist`, matching the numbered rows and current-step highlight in the other labs.

The failure prompt uses two numbered checklist items: send the kitchen question, then the city request. Completing the kitchen response marks the first item done and highlights the second. The Playground return hint appears only at the mobile breakpoint.

The wrong recommendation is followed by a read-only homepage stay card. Twig.com supplies its actual `StayCard` through `renderStayCard`; the workbench fallback uses shared `StayCardContent`, `SavedStay`, and the bundled city photo. The preview preserves Twig typography, colors, 3:2 photo, guest and bathroom counts, and price. Its controls are inert, and an accessible image label describes the listing. Learners can compare the request for four with the listing’s capacity without leaving the lab.

Guided chat uses `canSendMessage` with `canSendTripLessonMessage` to gate the queued prompt by lesson stage. Forest unlocks at the first instruction, beach after both first-request tabs have been viewed, kitchen/city at the failure prompt, and the corrected retry after Apply fix. The guard runs in both the Send button and submit handler. Closing the playground or switching labs does not unlock a lesson already in progress. `onReset={lab.reset}` keeps Start over synchronized with the lesson. Standalone chat remains ungated until the AIO lab is selected or started.

The failure evidence reuses the session diagram's plain tree: one `$ai_generation` with its latest user input and assistant output beneath it. A separate capture-code excerpt shows `$ai_is_error: false`, explicitly supplied by Twig in this example (the local fixture sets it in `trip-planner-records.ts`). It records the absence of a model-call error, not a correctness assessment. The lab does not send these simulated events to PostHog.

Failure investigation has consecutive screens: the city request’s two-operation trace, the search capture and recorded filters/results, then the filter fix. A span is introduced before its properties. The fix uses a separate screen, not a tab. Previous navigates these screens without dropping evidence or undoing the applied fix; only the retry screen unlocks the corrected chat prompt. Host focus and scroll reset follow the investigation screen.

The opening capture page introduces input, output, trace ID, and session ID in a small code block. It omits usage, pricing, custom metadata, and simulation details. Chat stays locked until the learner chooses Follow the chat; Previous step returns to the capture overview.

The final teaching screen covers evaluations separately from the retry results. Evaluate the answer opens the capacity rule, its code call, and the recorded before/after results. Finish the lab then opens the completion recap. Previous returns through evaluation and retry without clearing either result. Chat stays locked on the evaluation screen. The lab runs this local check; it is not an automatically configured PostHog evaluation.
