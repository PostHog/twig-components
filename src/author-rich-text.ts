export const richTags = ['p','h2','h3','h4','ul','ol','li','strong','em','u','s','code','pre','blockquote','br','hr','a'] as const;
type RichTag = typeof richTags[number];
export type AuthorRichNode = { text: string } | { tag: RichTag; children: AuthorRichNode[]; href?: string; start?: number };
export type AuthorRichText = AuthorRichNode[];
export function safeRichLink(value: string): boolean { return /^(https?:\/\/|mailto:)/i.test(value) && !/[\u0000-\u0020]/.test(value); }
export function parseAuthorRichText(value: unknown): AuthorRichText {
  let count = 0, length = 0;
  function parse(nodes: unknown, depth: number): AuthorRichText {
    if (!Array.isArray(nodes) || depth > 12) throw new Error('Invalid formatted text.');
    return nodes.map(node => {
      if (++count > 2000 || !node || typeof node !== 'object') throw new Error('Invalid formatted text.');
      if (typeof node.text === 'string') { length += node.text.length; if (length > 20000) throw new Error('Formatted text is too long.'); return {text:node.text}; }
      if (!richTags.includes(node.tag)) throw new Error('Unsupported text formatting.');
      const result: AuthorRichNode = {tag:node.tag, children:parse(node.children,depth+1)};
      if (node.tag === 'a') { if (typeof node.href !== 'string' || !safeRichLink(node.href)) throw new Error('Invalid link.'); result.href=node.href; }
      if (node.tag === 'ol' && Number.isSafeInteger(node.start) && node.start > 0) result.start=node.start;
      return result;
    });
  }
  return parse(value,0);
}
export function richTextPlain(nodes: AuthorRichText): string {
  return nodes.map(node => 'text' in node ? node.text : node.tag === 'br' || node.tag === 'hr' ? '\n' : richTextPlain(node.children) + (['p','li','h2','h3','h4','pre','blockquote'].includes(node.tag) ? '\n' : '')).join('').trimEnd();
}
