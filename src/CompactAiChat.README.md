# Compact AI views

Focused, controlled Twig surfaces for pocket guides and previews. The approved designs are on the Learn-platform Figma file’s **Pocket guide figures** and compact Twig pages.

Use `CompactAiChat` for trip-planner conversations. Use the real `SupportAgent` with `compact` for support conversations, preserving the support composer and layout. Pass messages and an optional prepared composer; handle `onSend` in the host. Use catalog `Stay` records and supply their image through `renderImage`. `onViewStay` is optional and never supplies routing by default.

Use `CompactRecommendedStay` for a local opened/saved listing. Its `saved` value and `onSavedChange` callback are controlled by the host. It reuses `CompactTwig`, `StayCardContent`, and `SavedStay`.

Load package catalog and compact CSS in the host’s established Twig boundary. No PostHog inspector, lesson prose, synthetic requests, telemetry, or storage belongs here. See the Twig views workbench for interactive examples.

A message may supply `recommendationDescription` to preserve the catalog-backed reason returned by Twig, including requested amenities. Without it, the existing location/capacity summary is unchanged. Hosts decide which conversation turn owns the current recommendation.

The composer grows with its draft and remeasures text wrapping when resized. It keeps the existing minimum height, typography, padding, and Send button; no internal textarea scrollbar is needed.

Set `pending` while preparing a reply to show the existing “Twig is typing…” status after the latest message. The host owns when the pending state ends.
