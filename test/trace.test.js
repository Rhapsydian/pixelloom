import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildSegments, linkAcrossPixels, traceLoops, mergeLoop } from '../src/trace.js';

test('buildSegments emits one segment per exposed side of an isolated pixel', () => {
  assert.equal(buildSegments([true], 1, 1).length, 4);
});

test('buildSegments omits the shared side between two adjacent on-pixels', () => {
  // 2 pixels * 4 sides, minus the 2 sides that face each other and are on
  assert.equal(buildSegments([true, true], 2, 1).length, 6);
});

test('linkAcrossPixels closes every gap left open by buildSegments', () => {
  const segments = buildSegments([true, true], 2, 1);
  linkAcrossPixels(segments);
  assert.ok(segments.every((s) => s.next !== null && s.prior !== null));
});

test('traceLoops finds one loop per disjoint on-region', () => {
  const segments = buildSegments([true, false, true], 3, 1);
  linkAcrossPixels(segments);
  assert.equal(traceLoops(segments).length, 2);
});

test('mergeLoop reduces a rectangle to its 4 corners regardless of pixel count', () => {
  const segments = buildSegments([true, true], 2, 1);
  linkAcrossPixels(segments);
  const [loop] = traceLoops(segments);
  assert.equal(mergeLoop(loop).length, 4);
});

test('mergeLoop merges across the wraparound seam when the loop starts mid-run', () => {
  // A 2x1 rectangle's boundary, but rotated so the traversal starts halfway
  // through the top edge instead of at a corner - the loop's first and last
  // segments end up sharing a direction, which only the wraparound fix catches.
  const loop = [
    { start: { x: 1, y: 0 }, end: { x: 2, y: 0 }, dir: 'right' },
    { start: { x: 2, y: 0 }, end: { x: 2, y: 1 }, dir: 'down' },
    { start: { x: 2, y: 1 }, end: { x: 1, y: 1 }, dir: 'left' },
    { start: { x: 1, y: 1 }, end: { x: 0, y: 1 }, dir: 'left' },
    { start: { x: 0, y: 1 }, end: { x: 0, y: 0 }, dir: 'up' },
    { start: { x: 0, y: 0 }, end: { x: 1, y: 0 }, dir: 'right' },
  ];
  const merged = mergeLoop(loop);
  assert.equal(merged.length, 4);
  assert.equal(merged[0].start.x, 0);
  assert.equal(merged[0].start.y, 0);
});
