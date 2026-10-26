"use client";
import { AuthorBrand } from "./AuthorBrand.js";
import { AuthorPreviewHeader } from "./AuthorPreviewHeader.js";
import { useRef, useState, type ReactNode } from 'react';
import { AuthorRichTextEditor, RichTextView } from './AuthorRichText.js';
import { PlaygroundCodeBlock } from './PlaygroundCodeBlock.js';
import { PlaygroundSummary } from './PlaygroundDisclosure.js';
import { type GuideDraft, type GuideBlock, guideProducts, figureComponents } from './guide-author.js';
export * from './guide-author.js';
import { GuideTwigFigure } from './GuideTwigFigure.js';
const figureLabels={filters:'Stay filters','stay-card':'Stay card',save:'Save stay',login:'Log in',profile:'Profile menu','saved-stays':'Saved stays',booking:'Booking'};
const labels={text:'Text',code:'Code block',detail:'Expandable detail',TwigFilterFigure:'Figure'};
export function GuideAuthor({draft,onChange,navigation,toolbar,error,previewPhotos,onInteraction}:{draft:GuideDraft;onChange:(value:GuideDraft)=>void;navigation:ReactNode;toolbar:ReactNode;error?:string;previewPhotos?:Partial<Record<import('./settings.js').StaySetting,string>>;onInteraction?:(action:string)=>void}) {
 const [previewing,setPreviewing]=useState(false);
 const [viewport,setViewport]=useState("desktop");
 const guideEditor=useRef<HTMLElement>(null);
 const editorScroll=useRef(0);
 const pageScroll=useRef(0);
 const previewButton=useRef<HTMLButtonElement>(null);
 function togglePreview(){
  if(!previewing){editorScroll.current=guideEditor.current?.scrollTop??0;pageScroll.current=window.scrollY;setPreviewing(true);onInteraction?.('preview_started');window.scrollTo(0,0);}
  else {setPreviewing(false);onInteraction?.('preview_closed');requestAnimationFrame(()=>{if(guideEditor.current)guideEditor.current.scrollTop=editorScroll.current;window.scrollTo(0,pageScroll.current);previewButton.current?.focus({preventScroll:true});});}
 }
 const draggedBlock=useRef<string|null>(null);
 const [dropTarget,setDropTarget]=useState<string|null>(null);
 function drop(id:string) {
  const source=draggedBlock.current;
  draggedBlock.current=null;setDropTarget(null);
  const from=draft.blocks.findIndex(b=>b.id===source);
  const to=draft.blocks.findIndex(b=>b.id===id);
  if(from>=0&&to>=0&&from!==to)move(from,to-from);
 }
 function changeBlock(next:GuideBlock){onChange({...draft,blocks:draft.blocks.map(b=>b.id===next.id?next:b)});}
 function move(index:number,offset:number){const blocks=[...draft.blocks];const [block]=blocks.splice(index,1);blocks.splice(index+offset,0,block);onChange({...draft,blocks});onInteraction?.('component_moved');}
 function add(type:GuideBlock['type']){const id=crypto.randomUUID();const b:GuideBlock=type==='text'?{id,type,text:''}:type==='code'?{id,type,code:'',language:'js'}:type==='detail'?{id,type,title:'',text:''}:{id,type};onChange({...draft,blocks:[...draft.blocks,b]});onInteraction?.('component_added');}
 return <div className="vac-app ph-author-app"><div className="vac-developer-theme ph-author"><header className="ph-author-header"><AuthorBrand/>{navigation}<div className="ph-author-toolbar">{previewing ? <button className="ph-author-quiet" onClick={togglePreview}>← Back to authoring</button> : <>{toolbar}<button ref={previewButton} className="ph-author-button" onClick={togglePreview}>Preview guide</button></>}</div></header>{error&&<p role="alert" className="ph-author-message">{error}</p>}{previewing && <details className="ph-author-test-review" open><PlaygroundSummary>Before opening a PR</PlaygroundSummary><ul>
 <li><label><input type="checkbox" /><span>Read the title, description, and sections in order. Check clarity and heading hierarchy.</span></label></li>
 <li><label><input type="checkbox" /><span>Check links, text formatting, and code examples. Try copying code blocks.</span></label></li>
 <li><label><input type="checkbox" /><span>Open expandable details and check the guide at each preview width.</span></label></li>
 {draft.blocks.some(block=>block.type==='TwigFilterFigure') && <li><label><input type="checkbox" /><span>Try every figure’s controls and Reset. Check captions and event inspector updates where included.</span></label></li>}
 </ul></details>}<div className="ph-guide-workspace" data-full-preview={previewing || undefined}><main ref={guideEditor} hidden={previewing} className="ph-author-editor"><div className="ph-author-section-header"><h2>Choose a product</h2></div><div className="ph-author-settings"><select aria-label="Guide product" value={draft.product} onChange={e=>onChange({...draft,product:e.target.value as GuideDraft['product']})}>{guideProducts.map((p,i)=><option key={p} value={p}>{['Product Analytics','AI Observability','Session Replay','Error Tracking'][i]}</option>)}</select></div><div className="ph-author-section-header"><h2>Write the guide</h2></div><div className="ph-author-settings"><label className="ph-author-field">Title<input value={draft.title} maxLength={180} onChange={e=>onChange({...draft,title:e.target.value})}/></label><label className="ph-author-field">Description<input value={draft.subtitle} maxLength={400} onChange={e=>onChange({...draft,subtitle:e.target.value})}/></label></div><div className="ph-author-blocks">{draft.blocks.map((b,i)=><section className="ph-author-block" key={b.id} data-drop-target={dropTarget===b.id||undefined}
 onDragOver={event=>{if(draggedBlock.current){event.preventDefault();event.dataTransfer.dropEffect='move';setDropTarget(b.id);}}}
 onDragLeave={event=>{if(!event.currentTarget.contains(event.relatedTarget as Node))setDropTarget(null);}}
 onDrop={event=>{if(draggedBlock.current){event.preventDefault();event.stopPropagation();drop(b.id);}}}>
 <div className="ph-author-block-header"><span draggable tabIndex={0}
 aria-label={`Drag ${labels[b.type]}. Use the move buttons to reorder with a keyboard.`}
 onDragStart={event=>{draggedBlock.current=b.id;event.dataTransfer.effectAllowed='move';event.dataTransfer.setData('application/x-learn-studio-guide-block',b.id);}}
 onDragEnd={()=>{draggedBlock.current=null;setDropTarget(null);}}>⠿</span><h3>{labels[b.type]}</h3><div className="ph-author-controls"><button aria-label={`Move ${labels[b.type]} up`} disabled={i===0} onClick={()=>move(i,-1)}>↑</button><button aria-label={`Move ${labels[b.type]} down`} disabled={i===draft.blocks.length-1} onClick={()=>move(i,1)}>↓</button><button aria-label={`Remove ${labels[b.type]}`} onClick={()=>{onChange({...draft,blocks:draft.blocks.filter(block=>block.id!==b.id)});onInteraction?.('component_removed');}}>×</button></div></div><div className="ph-author-block-body">{b.type==='TwigFilterFigure'?<><fieldset className="ph-author-figure-options"><legend>Twig components</legend>{figureComponents.map(component=><label key={component}><input type="checkbox" checked={(b.components??['filters','stay-card']).includes(component)} onChange={e=>{const current=b.components??['filters','stay-card'];changeBlock({...b,components:e.target.checked?[...current,component]:current.filter(c=>c!==component)});onInteraction?.('figure_configured');}}/>{figureLabels[component]}</label>)}</fieldset><label><input type="checkbox" checked={b.inspector!==false} onChange={e=>{changeBlock({...b,inspector:e.target.checked});onInteraction?.('figure_configured');}}/> Show event inspector</label><label className="ph-author-field">Caption<input value={b.caption??''} maxLength={400} onChange={e=>changeBlock({...b,caption:e.target.value})}/></label></>:b.type==='code'?<><label className="ph-author-field">Language<input value={b.language} onChange={e=>changeBlock({...b,language:e.target.value})}/></label><label className="ph-author-field">Code<textarea rows={5} value={b.code} onChange={e=>changeBlock({...b,code:e.target.value})}/></label></>:<>{b.type==='detail'&&<label className="ph-author-field">Title<input value={b.title} onChange={e=>changeBlock({...b,title:e.target.value})}/></label>}<AuthorRichTextEditor headings label={b.type==='text'?'Text':'Detail'} text={b.text} richText={b.richText} onChange={(text,richText)=>changeBlock({...b,text,richText})}/></>}</div></section>)}<select aria-label="Add guide component" value="" disabled={draft.blocks.length>=100} onChange={e=>add(e.target.value as GuideBlock['type'])}><option value="" disabled>Add component</option>{Object.entries(labels).map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></div></main><section className="ph-guide-preview" aria-label="Pocket guide preview">{!previewing && <AuthorPreviewHeader viewport={viewport} onChange={value=>{setViewport(value);onInteraction?.("preview_device_changed");}}/>}<div className="ph-guide-reader" data-viewport={previewing ? "desktop" : viewport}><div className="ph-guide-reader-location">{['Product Analytics','AI Observability','Session Replay','Error Tracking'][guideProducts.indexOf(draft.product)]}<span aria-hidden="true"> / </span>Pocket guide</div><article className="ph-guide-chapter"><div className="ph-guide-chapter-label"><img src={new URL("./assets/guide-book.svg", import.meta.url).href} width={16} height={16} alt=""/>Chapter 01</div><h1>{draft.title||'Untitled guide'}</h1>{draft.subtitle&&<p>{draft.subtitle}</p>}{draft.blocks.map(b=><div key={b.id}>{b.type==='TwigFilterFigure'?<GuideTwigFigure previewPhotos={previewPhotos} key={JSON.stringify([b.components,b.inspector])} caption={b.caption} components={b.components} inspector={b.inspector} onInteraction={onInteraction}/>:b.type==='code'?<PlaygroundCodeBlock label={b.language} code={b.code}/>:b.type==='detail'?<details><PlaygroundSummary>{b.title||'Details'}</PlaygroundSummary><RichTextView text={b.text} richText={b.richText}/></details>:<RichTextView text={b.text} richText={b.richText}/>}</div>)}</article></div></section></div></div></div>;
}
