"use client";

import { useEffect, useRef, useState, type DragEvent } from "react";

export function LabAuthorPageRow({ name, index, selected, onSelect, onRename, onRemove, canRemove, onMove, onDragStart, onDragEnd, onDrop }: {
  name: string; index: number; selected: boolean; onSelect: () => void; onRename: (name: string) => void; onRemove: () => void; canRemove: boolean; onMove: (direction: number) => void; onDragStart: (event: DragEvent<HTMLButtonElement>) => void; onDragEnd: () => void; onDrop: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(name);
  const active = useRef(false);
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => { if (editing) { input.current?.focus(); input.current?.select(); } }, [editing]);
  const pencil = useRef<HTMLButtonElement>(null);
  const label = name || (index === 0 ? "Title page" : "Untitled page");
  function finish(save: boolean, restoreFocus: boolean) {
    if (!active.current) return;
    active.current = false;
    setEditing(false);
    if (save && value.trim() !== name) onRename(value.trim());
    if (restoreFocus) requestAnimationFrame(() => pencil.current?.focus());
  }
  return <div className="ph-author-page-row" data-selected={selected} onDragOver={event => { if (event.dataTransfer.types.includes("application/x-learn-studio-page")) { event.preventDefault(); event.dataTransfer.dropEffect = "move"; } }} onDrop={event => { if (event.dataTransfer.types.includes("application/x-learn-studio-page")) { event.preventDefault(); onDrop(); } }}>
    <button className="ph-author-page-drag" type="button" draggable={canRemove} disabled={!canRemove} aria-label={`Reorder page ${index + 1}: ${label}`} title="Drag to reorder. Use Up or Down arrow keys." onDragStart={onDragStart} onDragEnd={onDragEnd} onKeyDown={event => { if (event.key === "ArrowUp" || event.key === "ArrowDown") { event.preventDefault(); onMove(event.key === "ArrowUp" ? -1 : 1); } }}><svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">{[4,8,12].flatMap(y => [5,11].map(x => <circle key={`${x}-${y}`} cx={x} cy={y} r="1" />))}</svg></button>
    {editing ? <div className="ph-author-field ph-author-page-name"><input ref={input} aria-label={`Name for page ${index + 1}`} value={value} maxLength={20000} placeholder={index === 0 ? "Title page" : "Untitled page"} onChange={event => setValue(event.target.value)} onBlur={() => finish(true, false)} onKeyDown={event => { if (event.key === "Enter" || event.key === "Escape") { event.preventDefault(); finish(event.key === "Enter", true); } }} /></div> : <button className="ph-author-page-select" type="button" aria-current={selected ? "page" : undefined} onClick={onSelect}><span>{String(index + 1).padStart(2, "0")}</span><span>{label}</span></button>}
    <button ref={pencil} className="ph-author-page-rename" type="button" aria-label={`Rename page ${index + 1}`} title="Rename page" onClick={() => { setValue(name); active.current = true; setEditing(true); }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="m16 3 5 5L8 21H3v-5L16 3Z M13 6l5 5" /></svg></button>
    <button className="ph-author-page-rename" type="button" aria-label={`Remove page ${index + 1}: ${label}`} title={canRemove ? "Remove page" : "Keep at least one page"} disabled={!canRemove} onClick={onRemove}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" /></svg></button>
  </div>;
}
