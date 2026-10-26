export type TwigPageKind = 'about'|'discover'|'stay'|'unknown';
export function twigPageKind(kind:string|null):TwigPageKind {return kind==='about'||kind==='discover'||kind==='stay'?kind:'unknown';}
