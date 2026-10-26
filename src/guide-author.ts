import { parseAuthorRichText, type AuthorRichText, type AuthorRichNode } from './author-rich-text.js';
export const guideProducts = ['product-analytics','ai-observability','session-replay','error-tracking'] as const;
export const figureComponents = ['filters','stay-card','save','login','profile','saved-stays','booking'] as const;
export type FigureComponent = typeof figureComponents[number];
export type GuideBlock = { id:string; type:'text'; text:string; richText?:AuthorRichText } | { id:string; type:'code'; code:string; language:string } | { id:string; type:'detail'; title:string; text:string; richText?:AuthorRichText } | { id:string; type:'TwigFilterFigure'; caption?:string; components?:FigureComponent[]; inspector?:boolean };
export type GuideDraft = { version:1; kind:'pocket-guide'; title:string; subtitle:string; product:typeof guideProducts[number]; blocks:GuideBlock[] };
export function emptyGuide():GuideDraft { return {version:1,kind:'pocket-guide',title:'',subtitle:'',product:'product-analytics',blocks:[]}; }
export function parseGuide(value:unknown):GuideDraft {
 const d=value as GuideDraft;
 const text=(v:unknown)=>{if(typeof v!=='string'||v.length>20000)throw new Error('Invalid guide text.');return v;};
 if(!d||d.version!==1||d.kind!=='pocket-guide'||!guideProducts.includes(d.product)||!Array.isArray(d.blocks)||d.blocks.length>100)throw new Error('Invalid pocket guide draft.');
 const ids=new Set<string>();
 return {version:1,kind:'pocket-guide',title:text(d.title),subtitle:text(d.subtitle),product:d.product,blocks:d.blocks.map(b=>{
 if(!b||!text(b.id)||ids.has(b.id))throw new Error('Invalid guide block.');ids.add(b.id);
 if(b.type==='TwigFilterFigure'){
 if(b.components!==undefined&&(!Array.isArray(b.components)||b.components.some(c=>!figureComponents.includes(c))||new Set(b.components).size!==b.components.length))throw new Error('Invalid figure components.');
 if(b.inspector!==undefined&&typeof b.inspector!=='boolean')throw new Error('Invalid figure inspector.');
 return {id:b.id,type:b.type,...(b.caption!==undefined?{caption:text(b.caption)}:{}),...(b.components!==undefined?{components:[...b.components]}:{}),...(b.inspector!==undefined?{inspector:b.inspector}:{})};
 }
 if(b.type==='code')return {id:b.id,type:b.type,code:text(b.code),language:text(b.language)};
 if(b.type==='text'||b.type==='detail')return {id:b.id,type:b.type,text:text(b.text),...(b.type==='detail'?{title:text(b.title)}:{}),...(b.richText?{richText:parseAuthorRichText(b.richText)}:{})} as GuideBlock;
 throw new Error('Unsupported guide component.');
 })};
}
const escape=(s:string)=>s.replace(/&/g,'&amp;').replace(/[<>{}]/g,c=>`&#${c.charCodeAt(0)};`).replace(/([\\`*_[\]#])/g,'\\$1');
function raw(nodes:AuthorRichText):string{return nodes.map(n=>'text'in n?n.text:raw(n.children)).join('');}
export function guideMarkdown(nodes:AuthorRichText):string {
 function node(n:AuthorRichNode):string {
 if('text'in n)return escape(n.text);
 const body=n.children.map(node).join('');
 if(n.tag==='strong')return `**${body}**`; if(n.tag==='em')return `*${body}*`;if(n.tag==='s')return `~~${body}~~`;
 if(n.tag==='code')return '`'+raw(n.children).replace(/`/g,'&#96;')+'`';
 if(n.tag==='pre'){const code=raw(n.children); const fence='`'.repeat(Math.max(3,...(code.match(/`+/g)||[]).map(s=>s.length+1)));return `\n${fence}\n${code}\n${fence}\n\n`;}
 if(n.tag==='a')return `[${body}](${n.href?.replace(/[()]/g,c=>encodeURIComponent(c))})`;
 if(n.tag==='hr')return '\n---\n\n';if(n.tag==='br')return '  \n';
 if(n.tag==='ul'||n.tag==='ol')return '\n'+n.children.map((c,i)=>`${n.tag==='ul'?'-':`${(n.start??1)+i}.`} ${node(c).trim().replace(/\n/g,'\n  ')}`).join('\n')+'\n\n';
 if(n.tag==='blockquote')return body.trim().split('\n').map(s=>'> '+s).join('\n')+'\n\n';
 if(/^h[234]$/.test(n.tag))return '#'.repeat(Number(n.tag[1]))+' '+body+'\n\n';
 return body+(['p','li'].includes(n.tag)?'\n\n':'');
 }
 return nodes.map(node).join('').trim();
}
export function guideMdx(input:GuideDraft):string {
 const d=parseGuide(input);
 const body=d.blocks.map(b=>{
 if(b.type==='TwigFilterFigure'){
 const components=b.components??['filters','stay-card'];
 if(b.inspector===false||components.length!==2||!components.includes('filters')||!components.includes('stay-card'))throw new Error('Custom figures are saved in this browser. MDX and PR export currently support figures with both stay filters and a stay card, plus the event inspector.');
 return '<TwigFilterFigure />'+(b.caption?'\n\n'+escape(b.caption):'');
 }
 if(b.type==='code'){const fence='`'.repeat(Math.max(3,...(b.code.match(/`+/g)||[]).map(s=>s.length+1)));return `${fence}${b.language.replace(/[^a-zA-Z0-9-]/g,'')}\n${b.code}\n${fence}`;}
 const content=b.richText?guideMarkdown(b.richText):escape(b.text);
 return b.type==='detail'?`<details>\n<summary>${escape(b.title)}</summary>\n\n${content}\n\n</details>`:content;
 }).join('\n\n');
 return `---\ntitle: ${JSON.stringify(d.title)}\nshortTitle: ${JSON.stringify(d.title)}\nsubtitle: ${JSON.stringify(d.subtitle)}\n---\n\n<RightPage>\n\n# ${escape(d.title)}\n\n${body}\n\n</RightPage>\n`;
}
