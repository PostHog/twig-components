"use client";
import { createElement, useEffect, useId, useRef, useState } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { PlaygroundTooltip } from './PlaygroundTooltip.js';
import { parseAuthorRichText, richTags, richTextPlain, safeRichLink, type AuthorRichText, type AuthorRichNode } from './author-rich-text.js';

export function RichTextView({text,richText}:{text:string;richText?:AuthorRichText}) {
  function render(node:AuthorRichNode,key:number):React.ReactNode {
    return 'text' in node ? node.text : createElement(node.tag,{key,...(node.tag === 'a' ? {href:node.href,target:'_blank',rel:'noopener noreferrer'} : {}),...(node.start ? {start:node.start}: {})},['br','hr'].includes(node.tag) ? undefined : node.children.map(render));
  }
  return <div className="ph-author-rich-copy">{richText ? richText.map(render) : <p className="ph-author-preserve">{text}</p>}</div>;
}
const escape = (text:string) => text.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
function html(nodes:AuthorRichText):string {
  return nodes.map(node => 'text' in node ? escape(node.text) : ['br','hr'].includes(node.tag) ? `<${node.tag}>` : `<${node.tag}${node.href ? ` href="${escape(node.href)}"` : ''}${node.start ? ` start="${node.start}"` : ''}>${html(node.children)}</${node.tag}>`).join('');
}
function read(source:string):AuthorRichText {
  const root = new DOMParser().parseFromString(source,'text/html').body;
  function visit(node:Node):AuthorRichText {
    if (node.nodeType === Node.TEXT_NODE) return [{text:node.textContent ?? ''}];
    if (!(node instanceof HTMLElement)) return [];
    const children=Array.from(node.childNodes).flatMap(visit);
    const tag=node.tagName.toLowerCase() as typeof richTags[number];
    return richTags.includes(tag) ? [{tag,children,...(tag === 'a' ? {href:node.getAttribute('href') ?? ''}:{}),...(tag === 'ol' ? {start:Number(node.getAttribute('start') ?? 1)}:{})}] : children;
  }
  return parseAuthorRichText(Array.from(root.childNodes).flatMap(visit));
}
function FormatIcon({name,fallback}:{name:string;fallback:string}) {
  const paths:Record<string,string> = {
    'Bulleted list':'M9 6h12M9 12h12M9 18h12M3 6h1M3 12h1M3 18h1',
    'Numbered list':'M10 6h11M10 12h11M10 18h11M3 4h1v5M3 9h2M2 14c0-3 4-3 4 0 0 1-4 4-4 5h4',
    'Quote':'M4 5h6v7H4zM14 5h6v7h-6zM10 12c0 5-3 7-6 7M20 12c0 5-3 7-6 7',
    'Code block':'M3 3h18v18H3zM9 9l-3 3 3 3M15 9l3 3-3 3',
    'Link':'M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-2 2M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l2-2',
  };
  return paths[name] ? <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d={paths[name]} /></svg> : <span aria-hidden="true">{fallback}</span>;
}
export function AuthorRichTextEditor({label,text,richText,onChange,headings=false}:{label:string;text:string;richText?:AuthorRichText;headings?:boolean;onChange:(text:string,richText:AuthorRichText)=>void}) {
  const id=useId();
  const value=html(richText ?? [{tag:'p',children:[{text}]}]);
  const last=useRef(value);
  const [error,setError]=useState('');
  const [link,setLink]=useState<string|null>(null);
  const editor=useEditor({
    extensions:[StarterKit.configure({trailingNode:false,heading:{levels:[2,3,4]},link:{openOnClick:false,protocols:['http','https','mailto'],isAllowedUri:url=>safeRichLink(url)}})],
    // Retain legacy nodes for saved drafts, but only offer supported authoring actions.
    enableInputRules:['bold','italic','strike','code','bulletList','orderedList','blockquote','horizontalRule',...(headings ? ['heading'] : [])],
    content:value,immediatelyRender:false,shouldRerenderOnTransaction:true,
    editorProps:{
      handleKeyDown:(_view,event)=>{
        const modifier=event.metaKey||event.ctrlKey;
        return modifier&&event.altKey&&(event.code==='KeyC'||(!headings&&/^Digit[1-6]$/.test(event.code)));
      },
      transformPastedHTML:source=>{
        const body=new DOMParser().parseFromString(source,'text/html').body;
        body.querySelectorAll(headings ? 'pre' : 'pre,h1,h2,h3,h4,h5,h6').forEach(node=>{
          const paragraph=document.createElement('p');
          paragraph.append(...Array.from(node.childNodes));
          node.replaceWith(paragraph);
        });
        return body.innerHTML;
      },
      attributes:{class:'ph-author-rich-input ph-author-rich-copy',role:'textbox','aria-multiline':'true','aria-labelledby':`${id}-label`}},
    onUpdate:({editor})=>{try {const next=read(editor.getHTML()); last.current=html(next); onChange(richTextPlain(next),next);setError('');} catch {editor.commands.setContent(last.current,{emitUpdate:false});setError('Keep text under 20,000 characters.');}}
  });
  useEffect(()=>{if(editor && value !== last.current){editor.commands.setContent(value,{emitUpdate:false});last.current=value;}},[editor,value]);
  if(!editor) return <div className="ph-author-field"><label>{label}</label></div>;
  const buttons:[string,string,()=>void,boolean?,boolean?][]=[
    ['Paragraph','¶',()=>editor.chain().focus().setParagraph().run(),editor.isActive('paragraph')],
    ['Heading 2','H2',()=>editor.chain().focus().setHeading({level:2}).run(),editor.isActive('heading',{level:2})],
    ['Heading 3','H3',()=>editor.chain().focus().setHeading({level:3}).run(),editor.isActive('heading',{level:3})],
    ['Heading 4','H4',()=>editor.chain().focus().setHeading({level:4}).run(),editor.isActive('heading',{level:4})],
    ['Bold','B',()=>editor.chain().focus().toggleBold().run(),editor.isActive('bold')],
    ['Italic','I',()=>editor.chain().focus().toggleItalic().run(),editor.isActive('italic')],
    ['Strikethrough','S',()=>editor.chain().focus().toggleStrike().run(),editor.isActive('strike')],
    ['Inline code','</>',()=>editor.chain().focus().toggleCode().run(),editor.isActive('code')],
    ['Bulleted list','• List',()=>editor.chain().focus().toggleBulletList().run(),editor.isActive('bulletList')],
    ['Numbered list','1. List',()=>editor.chain().focus().toggleOrderedList().run(),editor.isActive('orderedList')],
    ['Quote','Quote',()=>editor.chain().focus().toggleBlockquote().run(),editor.isActive('blockquote')],
    ['Link','Link',()=>{setLink(editor.getAttributes('link').href ?? '');},editor.isActive('link')],
    ['Divider','—',()=>editor.chain().focus().setHorizontalRule().run()],
  ];
  return <div className="ph-author-field"><label id={`${id}-label`}>{label}</label><div className="ph-author-rich-editor">
    <div className="ph-author-rich-toolbar" role="group" aria-label={`${label} formatting`}>

      {buttons.filter(([name])=>headings||!name.startsWith('Heading ')).map(([name,icon,action,active,disabled])=><button key={name} type="button" title={name} aria-label={name} aria-pressed={active} disabled={disabled} onMouseDown={event=>event.preventDefault()} onClick={action}><FormatIcon name={name} fallback={icon}/></button>)}
      <span className="ph-author-format-hint"><PlaygroundTooltip label={headings ? <>Use the <strong>Title field</strong> for the guide title, <strong>H2–H4</strong> for section headings, and <strong>components</strong> for code blocks to keep guide styling consistent.</> : <>Use <strong>Title fields</strong> for headings and <strong>components</strong> for code blocks to keep lab styling consistent.</>}><button type="button" aria-label={headings ? "About guide formatting" : "About lab formatting"}><svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7v.1"/></svg></button></PlaygroundTooltip></span>
    </div>
    {link !== null && <div className="ph-author-rich-link"><label htmlFor={`${id}-url`}>Link URL</label><input id={`${id}-url`} autoFocus value={link} placeholder="https://" onChange={event=>setLink(event.target.value)} onKeyDown={event=>{if(event.key==='Escape'){setLink(null);editor.commands.focus();}}}/><button type="button" className="ph-author-button" onClick={()=>{if(!safeRichLink(link)){setError('Enter an https://, http://, or mailto: link.');return;}editor.chain().focus().extendMarkRange('link').setLink({href:link}).run();setLink(null);setError('');}}>Apply</button><button type="button" className="ph-author-quiet" onClick={()=>{editor.chain().focus().extendMarkRange('link').unsetLink().run();setLink(null);}}>Remove link</button><button type="button" className="ph-author-quiet" onClick={()=>{setLink(null);setError('');editor.commands.focus();}}>Cancel</button></div>}
    <EditorContent editor={editor}/></div>{error && <p role="alert">{error}</p>}</div>;
}
