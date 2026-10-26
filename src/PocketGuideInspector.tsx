import type {ReactNode} from 'react';

/** Portable rendering of posthog.com/PocketGuides/PostHogInspector (2026-10-26).
 * Semantic classes in compact.css preserve the website's styles without requiring Tailwind in hosts.
 */
export default function PocketGuideInspector({children,title='Inspector',live='polite'}:{children:ReactNode;title?:string;live?:'off'|'polite'|'assertive'}) {
 return <section aria-label={title} className="ph-pocket-guide-inspector"><div className="ph-pocket-inspector-heading"><span>{title}</span></div><div aria-live={live} className="ph-pocket-inspector-content">{children}</div></section>;
}
export function InspectorCode({label,value,meta}:{label:string;value:string;meta?:string}) {
 const isElement=label==='Clicked element';
 return <div className="ph-pocket-inspector-panel"><div className="ph-pocket-inspector-tabs"><span className="ph-pocket-inspector-tab">{isElement?'Elements':'Event data'}</span><span className={meta?'ph-pocket-inspector-count':'ph-pocket-inspector-meta'}>{meta??(isElement?'selected node':'selected properties')}</span></div>{isElement?<ElementTree value={value}/>:<EventTree value={value}/>}</div>;
}
function ElementTree({value}:{value:string}) {
 const match=value.match(/^<(\w+)\s+([^=]+)="([^"]+)">([^<]+)<\/(\w+)>$/);
 return <div className="ph-pocket-inspector-tree"><div className="ph-pocket-inspector-element"><span aria-hidden="true" className="ph-pocket-inspector-line">1</span><samp>{match?<>&lt;<span className="ph-pocket-inspector-tag">{match[1]}</span>{' '}<span className="ph-pocket-inspector-key">{match[2]}</span>=<span className="ph-pocket-inspector-value">"{match[3]}"</span>&gt;{match[4]}&lt;/<span className="ph-pocket-inspector-tag">{match[5]}</span>&gt;</>:value}</samp></div></div>;
}
function EventTree({value}:{value:string}) {
 const payload=JSON.parse(value) as {event:string;timestamp?:string;properties:Record<string,string|number|boolean|null>};
 const properties=Object.entries(payload.properties);
 return <div className="ph-pocket-inspector-tree"><details open className="ph-pocket-inspector-payload"><summary>capture payload</summary><div className="ph-pocket-inspector-branch"><div className="ph-pocket-inspector-row"><span className="ph-pocket-inspector-key">event</span>:{' '}<span className="ph-pocket-inspector-value">"{payload.event}"</span></div>{payload.timestamp&&<div className="ph-pocket-inspector-row"><span className="ph-pocket-inspector-key">timestamp</span>:{' '}<span className="ph-pocket-inspector-value">"{payload.timestamp}"</span></div>}<details open><summary className="ph-pocket-inspector-key">properties <span className="ph-pocket-inspector-muted">{'{'+properties.length+'}'}</span></summary><div className="ph-pocket-inspector-branch">{properties.length?properties.map(([key,propertyValue])=><div key={key} className="ph-pocket-inspector-row"><span className="ph-pocket-inspector-key">{key}</span>:{' '}<span className="ph-pocket-inspector-value">{JSON.stringify(propertyValue)}</span></div>):<div className="ph-pocket-inspector-muted">No properties</div>}</div></details></div></details></div>;
}
export function InspectorStatus({children}:{children:ReactNode}) {
 return <div className="ph-pocket-inspector-status"><span aria-hidden="true"/><span>{children}</span></div>;
}
