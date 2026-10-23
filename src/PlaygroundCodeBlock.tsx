"use client";

import { Children, Fragment, isValidElement, type ReactNode } from "react";
import { CopyControl } from "./PlaygroundTooltip.js";

/** Source locations belong in captions, never in language labels. */
export function codeLanguage(path: string) {
  const extension = path.split(".").at(-1)?.toLowerCase();
  return extension === "ts" || extension === "tsx" ? "TypeScript" : extension === "json" ? "JSON" : extension === "sql" ? "SQL" : extension === "py" ? "Python" : extension === "css" ? "CSS" : extension === "html" ? "HTML" : extension === "sh" ? "Shell" : "JavaScript";
}

/** Existing marked snippets and explicit line numbers share the same emphasis. */
export function codeSegments(children: ReactNode, highlighted = false): { text: string; highlighted: boolean }[] {
  return Children.toArray(children).flatMap(child => {
    if (typeof child === "string" || typeof child === "number") return [{ text: String(child), highlighted }];
    if (!isValidElement<{ children?: ReactNode; className?: string }>(child)) return [];
    return codeSegments(child.props.children, highlighted || (child.type === "mark" && child.props.className !== "vac-ai-code-context"));
  });
}

export function PlaygroundCodeBlock({ children, code, label = "JavaScript", highlightLines = [], lineNumbers = highlightLines.length > 0, className = "", "aria-label": ariaLabel }: {
  children?: ReactNode; code?: string; label?: string; highlightLines?: readonly number[]; lineNumbers?: boolean; className?: string; "aria-label"?: string;
}) {
  const segments = codeSegments(code ?? children);
  const value = segments.map(segment => segment.text).join("");
  const marked = new Set(highlightLines);
  let line = 1;
  for (const segment of segments) {
    const pieces = segment.text.split("\n");
    pieces.forEach((piece, i) => { if (segment.highlighted && piece) marked.add(line + i); });
    line += pieces.length - 1;
  }
  const lines = value.split("\n");
  return <div className={`vac-code-block ${className}`.trim()}>
    <div className="vac-code-header"><span>{label}</span><CopyControl text={value} /></div>
    <pre aria-label={ariaLabel}><code>{lines.map((text, i) => {
      const indent = text.match(/^\s*/)?.[0] ?? "";
      return <Fragment key={i}><span className="vac-code-line" data-highlighted={marked.has(i + 1) ? "true" : undefined}>{lineNumbers && <span className="vac-code-number" aria-hidden="true" data-line={i + 1} />}<span className="vac-code-indent">{indent}</span><span className="vac-code-text">{text.slice(indent.length).split(/([_./])/).map((part,j) => <Fragment key={j}>{part}{/^[_./]$/.test(part) && <wbr />}</Fragment>)}</span></span>{i < lines.length - 1 ? "\n" : null}</Fragment>;
    })}</code></pre>
  </div>;
}
