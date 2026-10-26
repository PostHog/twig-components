import assert from 'node:assert/strict';
import test from 'node:test';
import { createLabDraft, parseLabDraft, validateLabDraft, advanceAuthorProgress, authorStepComplete, authorHandoff } from '../dist/lab-author.js';

test('draft exports round-trip without losing content or component order', () => {
  const draft = createLabDraft();
  assert.deepEqual(parseLabDraft(JSON.parse(JSON.stringify(draft))), draft);
  assert.deepEqual(validateLabDraft(draft), []);
  assert.match(authorHandoff(draft), /original template, not a published version/);
});
test('untrusted imports reject unknown components, versions, duplicate ids and rules', () => {
  for (const mutate of [d => d.version = 2, d => d.steps[0].blocks[0].type = 'script', d => d.steps[0].blocks[0].id = d.steps[0].id, d => d.steps[0].blocks[1].items[0].action = 'execute_code']) {
    const draft = createLabDraft(); mutate(draft);
    assert.throws(() => parseLabDraft(draft), /valid guided activity/);
  }
});
test('ordered gates ignore future actions and need a fresh interaction for repeated rules', () => {
  const step = createLabDraft().steps[0];
  step.blocks[1].items = [{ text:'Choose Forest',action:'filter_forest' }, { text:'Choose Forest again',action:'filter_forest' }, { text:'Select the event',action:'event_selected' }];
  let done = advanceAuthorProgress(step, [], 'event_selected');
  assert.deepEqual(done, []);
  done = advanceAuthorProgress(step, done, 'filter_forest');
  assert.equal(done.length, 1);
  assert.equal(authorStepComplete(step, done), false);
  done = advanceAuthorProgress(step, done, 'filter_forest');
  done = advanceAuthorProgress(step, done, 'event_selected');
  assert.equal(authorStepComplete(step, done), true);
  assert.equal(authorStepComplete({ ...step, id:'different-step', blocks:[{...step.blocks[1], id:'different-checklist'}] }, done), false);
});
test('select-event rules require a usable evidence component', () => {
  const draft = createLabDraft();
  draft.steps[0].blocks = [{ id:'check', type:'checklist', items:[{text:'Select event',action:'event_selected'}] }];
  assert.match(validateLabDraft(draft)[0], /add Event inspector/);
});

test('new browser drafts and added pages are empty and round-trip', async () => {
  const { createEmptyLabDraft, createEmptyAuthorPage, createEmptyAuthorBlock } = await import('../dist/lab-author.js');
  const draft = createEmptyLabDraft();
  assert.equal(draft.title, '');
  assert.deepEqual(draft.steps[0].blocks, []);
  assert.equal(draft.steps[0].name, '');
  assert.deepEqual(parseLabDraft(JSON.parse(JSON.stringify(draft))), draft);
  assert.deepEqual(createEmptyAuthorPage('p2'), { id:'p2',name:'',blocks:[] });
  assert.equal(createEmptyAuthorBlock('context','b').text, '');
  assert.equal(createEmptyAuthorBlock('checklist','b').items[0].text, '');
  draft.title = 'My lab';
  draft.product = 'Session Replay';
  assert.deepEqual(validateLabDraft(draft), []);
});


test('product placement round-trips while legacy drafts keep their existing shape', () => {
  const draft = { ...createLabDraft(), product: 'Session Replay' };
  assert.deepEqual(parseLabDraft(draft), draft);
  assert.match(authorHandoff(draft), /Product placement: Session Replay/);
  assert.throws(() => parseLabDraft({ ...draft, product:'Unknown' }));
  assert.equal(parseLabDraft(createLabDraft()).product, undefined);
});

test('planner context survives export and accepts only matching completion rules', () => {
  const draft = { ...createLabDraft(), context:'ai-trip-planner', product:'AI Observability' };
  assert.ok(validateLabDraft(draft).some(issue=>issue.includes('Twig context')));
  draft.steps[0].blocks[1].items = [{text:'Send a trip request',action:'trip_request_sent'}];
  assert.deepEqual(validateLabDraft(draft), []);
  assert.deepEqual(parseLabDraft(JSON.parse(JSON.stringify(draft))),draft);
  assert.match(authorHandoff(draft), /Twig context: ai-trip-planner/);
  const page=draft.steps[0];
  assert.equal(authorStepComplete(page,advanceAuthorProgress(page,[],'filter_forest')),false);
  assert.equal(authorStepComplete(page,advanceAuthorProgress(page,[],'trip_request_sent')),true);
  assert.throws(()=>parseLabDraft({...draft,context:'arbitrary-site'}));
});

test('saved starting routes survive exports and reject external or nested editor URLs', () => {
  const draft = { ...createLabDraft(), startingPath: '/stays/stay-1' };
  assert.equal(parseLabDraft(draft).startingPath, draft.startingPath);
  assert.match(authorHandoff(draft), /Starting page: \/stays\/stay-1/);
  for (const path of ['https://example.com', '//example.com', '/author', '/api/author/pr', '/?prompt=private', '/stays/../author', '/stays/a#private']) {
    assert.throws(() => parseLabDraft({ ...draft, startingPath:path }));
  }
});
test('full-site drafts allow instructions spanning planner and browsing', () => {
  const draft = { ...createLabDraft(), context:'ai-trip-planner', startingPath:'/' };
  assert.deepEqual(validateLabDraft(draft), []);
});

test('formatted text round-trips and excludes executable markup', () => {
  const draft = createLabDraft();
  draft.steps[0].blocks[0] = { id:'formatted', type:'context', text:'Hello', richText:[{tag:'p',children:[{tag:'strong',children:[{text:'Hello'}]}]}] };
  assert.deepEqual(parseLabDraft(draft), draft);
  assert.match(authorHandoff(draft), /richText/);
  for (const tag of ['script','img','iframe']) {
    draft.steps[0].blocks[0].richText = [{tag,children:[]}];
    assert.throws(() => parseLabDraft(draft));
  }
});

test('rich text retains extended formatting and rejects unsafe links', () => {
  const draft = createLabDraft();
  draft.steps[0].blocks = [{id:'rich',type:'context',text:'',richText:[
    {tag:'h2',children:[{text:'Overview'}]},
    {tag:'ol',start:3,children:[{tag:'li',children:[{tag:'u',children:[{text:'Choose'}]}]}]},
    {tag:'a',href:'https://posthog.com/docs',children:[{text:'Docs'}]},
    {tag:'pre',children:[{tag:'code',children:[{text:'one\ntwo'}]}]}
  ]}];
  assert.deepEqual(parseLabDraft(JSON.parse(JSON.stringify(draft))).steps[0].blocks[0].richText,draft.steps[0].blocks[0].richText);
  for (const href of ['javascript:alert(1)','data:text/html,hi','https://bad\nurl']) {
    draft.steps[0].blocks[0].richText=[{tag:'a',href,children:[{text:'Bad'}]}];
    assert.throws(()=>parseLabDraft(JSON.parse(JSON.stringify(draft))));
  }
});
