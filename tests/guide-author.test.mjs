import test from 'node:test';
import assert from 'node:assert/strict';
import {emptyGuide,parseGuide,guideMdx} from '../dist/guide-author.js';
test('guide exports approved embeds and escaped author text as MDX',()=>{
 const draft={...emptyGuide(),title:'My guide',blocks:[{id:'1',type:'text',text:'<script>{bad}</script>',richText:[{tag:'p',children:[{tag:'strong',children:[{text:'Hello'}]}]}]},{id:'2',type:'TwigFilterFigure'},{id:'3',type:'code',language:'js',code:'const x = 1;'}]};
 assert.deepEqual(parseGuide(JSON.parse(JSON.stringify(draft))),draft);
 const mdx=guideMdx(draft);assert.match(mdx,/\*\*Hello\*\*/);assert.match(mdx,/<TwigFilterFigure \/>/);assert.match(mdx,/```js/);
 assert.doesNotMatch(guideMdx({...draft,title:'{bad}<script>'}),/# \{bad\}<script>/);
 assert.throws(()=>parseGuide({...draft,blocks:[{id:'1',type:'ArbitraryCode'}]}));
 assert.throws(()=>parseGuide({...draft,product:'../../x'}));
 assert.throws(()=>parseGuide({...draft,blocks:[draft.blocks[0],draft.blocks[0]]}));
});

test('figure captions persist and export as escaped text beside approved embed',()=>{
 const draft={...emptyGuide(),blocks:[{id:'figure',type:'TwigFilterFigure',caption:'Try <script>{this}</script>'}]};
 assert.deepEqual(parseGuide(JSON.parse(JSON.stringify(draft))),draft);
 const output=guideMdx(draft);assert.match(output,/<TwigFilterFigure \/>/);assert.doesNotMatch(output,/<script>/);assert.match(output,/Try/);
});

test('figure choices survive storage and unsupported exports fail explicitly',()=>{
 const draft={...emptyGuide(),blocks:[{id:'figure',type:'TwigFilterFigure',components:['stay-card'],inspector:false}]};
 assert.deepEqual(parseGuide(JSON.parse(JSON.stringify(draft))),draft);
 assert.throws(()=>guideMdx(draft),/Custom figures/);
 assert.throws(()=>parseGuide({...draft,blocks:[{...draft.blocks[0],components:['arbitrary']}]}),/Invalid figure/);
 assert.throws(()=>parseGuide({...draft,blocks:[{...draft.blocks[0],inspector:'false'}]}),/Invalid figure/);
 assert.match(guideMdx({...draft,blocks:[{...draft.blocks[0],components:['filters','stay-card'],inspector:true}]}),/<TwigFilterFigure \/>/);
});

test('all compact figure selections round-trip without changing legacy drafts',()=>{
 const components=['filters','stay-card','save','login','profile','saved-stays','booking'];
 const draft={...emptyGuide(),blocks:[{id:'figure',type:'TwigFilterFigure',components}]};
 assert.deepEqual(parseGuide(JSON.parse(JSON.stringify(draft))),draft);
 assert.throws(()=>guideMdx(draft),/Custom figures/);
 assert.throws(()=>guideMdx({...draft,blocks:[{...draft.blocks[0],components:['login','profile']}]}),/Custom figures/);
 const legacy={...emptyGuide(),blocks:[{id:'old',type:'TwigFilterFigure'}]};
 assert.deepEqual(parseGuide(legacy),legacy);
});
