# Support agent

`SupportAgent` is the shared Twig website and lab chat. Import it from `@posthog/twig-components/support-agent` and load `catalog.css`. The host supplies the conversation, pending state, send/reset callbacks, and optional lab accessory. No routing or telemetry is owned here.

Use `compact` for a condensed pocket-guide figure. It retains the same header, message bubbles, typography, typing state, and composer, using existing Twig spacing. Supply `draft` for a host-prepared message; it stays read-only while `onSend` delegates to the host. Omit `onSend` to display a read-only transcript with an inactive composer. Omit `onReset` when the host has its standard figure Reset. Default website and guided lab behavior is unchanged.

The guide owns animation, visibility gating, scripted replies, and reduced-motion handling. The Twig views workbench shows compact support alongside the trip-planner figure; the support lab shows the full component.
