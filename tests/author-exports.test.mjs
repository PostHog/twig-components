import test from 'node:test';
import assert from 'node:assert/strict';

test('published authoring entry points expose the host contract', async () => {
  const lab = await import('@posthog/twig-components/lab-author');
  const state = await import('@posthog/twig-components/lab-author-state');
  const guide = await import('@posthog/twig-components/guide-author');
  const guideState = await import('@posthog/twig-components/guide-author-state');
  for (const value of [lab.LabAuthor, lab.LabPublishing, state.parseLabDraft, state.validateLabDraft, state.authorHandoff, guide.GuideAuthor, guideState.emptyGuide, guideState.parseGuide, guideState.guideMdx]) assert.equal(typeof value, 'function');
  assert.deepEqual(state.parseLabDraft(state.createEmptyLabDraft()).title, '');
});
