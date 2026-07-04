import { test } from 'node:test';
import assert from 'node:assert/strict';
import { gridToPath, gridToSvg } from '../src/index.js';

function parsePath(d) {
  const tokens = d.match(/[A-Za-z][^A-Za-z]*/g) || [];
  const loops = [];
  let current = null;
  let pos = { x: 0, y: 0 };
  for (const token of tokens) {
    const cmd = token[0];
    const nums = token.slice(1).trim().split(/\s+/).filter(Boolean).map(Number);
    if (cmd === 'M') {
      pos = { x: nums[0], y: nums[1] };
      current = [{ ...pos }];
      loops.push(current);
    } else if (cmd === 'H') {
      pos = { x: nums[0], y: pos.y };
      current.push({ ...pos });
    } else if (cmd === 'h') {
      pos = { x: pos.x + nums[0], y: pos.y };
      current.push({ ...pos });
    } else if (cmd === 'V') {
      pos = { x: pos.x, y: nums[0] };
      current.push({ ...pos });
    } else if (cmd === 'v') {
      pos = { x: pos.x, y: pos.y + nums[0] };
      current.push({ ...pos });
    }
  }
  return loops;
}

function signedArea(points) {
  let sum = 0;
  for (let i = 0; i < points.length; i++) {
    const a = points[i];
    const b = points[(i + 1) % points.length];
    sum += a.x * b.y - b.x * a.y;
  }
  return sum / 2;
}

function totalSignedArea(d) {
  return parsePath(d).reduce((sum, loop) => sum + signedArea(loop), 0);
}

function loopCount(d) {
  return (d.match(/M/g) || []).length;
}

test('an all-off grid produces no path', () => {
  assert.equal(gridToPath([false, false, false, false], 2, 2), '');
});

test('a zero-dimension grid produces no path', () => {
  assert.equal(gridToPath([], 0, 0), '');
});

test('a mismatched pixels length throws', () => {
  assert.throws(() => gridToPath([true, true], 2, 2), RangeError);
});

test('a single on pixel traces a unit square', () => {
  assert.equal(gridToPath([true], 1, 1), 'M0 0H1V1H0Z');
});

test('two horizontally adjacent pixels merge into one rectangle', () => {
  assert.equal(gridToPath([true, true], 2, 1), 'M0 0H2V1H0Z');
});

test('a fully-on rectangle merges both axes down to its outer boundary', () => {
  const pixels = new Array(6).fill(true);
  assert.equal(gridToPath(pixels, 3, 2), 'M0 0H3V2H0Z');
});

test('a fully-on square traces only the outer boundary', () => {
  assert.equal(gridToPath([true, true, true, true], 2, 2), 'M0 0H2V2H0Z');
});

test('disjoint on pixels produce independent loops', () => {
  assert.equal(gridToPath([true, false, true], 3, 1), 'M0 0H1V1H0ZM2 0H3V1H2Z');
});

test('a hole in the middle of a shape is a second, oppositely-wound loop', () => {
  // prettier-ignore
  const pixels = [
    true, true, true,
    true, false, true,
    true, true, true,
  ];
  assert.equal(gridToPath(pixels, 3, 3), 'M0 0H3V3H0ZM2 1H1V2H2Z');
});

test('two independent holes produce three loops whose signed areas net out to the on-pixel count', () => {
  // prettier-ignore
  const pixels = [
    true, true, true, true, true,
    true, false, true, false, true,
    true, true, true, true, true,
  ];
  const d = gridToPath(pixels, 5, 3);
  assert.equal(loopCount(d), 3);
  assert.equal(totalSignedArea(d), pixels.filter(Boolean).length);
});

test('an island inside a hole inside the outer shape nests three loops correctly', () => {
  // 5x5 grid: outer ring on, a 3x3 hole in the middle, and a 1x1 on-pixel
  // island sitting in the center of that hole.
  // prettier-ignore
  const pixels = [
    true, true,  true,  true,  true,
    true, false, false, false, true,
    true, false, true,  false, true,
    true, false, false, false, true,
    true, true,  true,  true,  true,
  ];
  const d = gridToPath(pixels, 5, 5);
  assert.equal(loopCount(d), 3);
  assert.equal(totalSignedArea(d), pixels.filter(Boolean).length);
});

test('diagonally-touching pixels produce two separate loops meeting at a point', () => {
  assert.equal(gridToPath([true, false, false, true], 2, 2), 'M0 0H1V1H0ZM1 1H2V2H1Z');
});

test('a concave (L-shaped) region merges runs without breaking at the reflex corner', () => {
  // prettier-ignore
  const pixels = [
    true, true,
    true, false,
  ];
  assert.equal(gridToPath(pixels, 2, 2), 'M0 0H2V1H1V2H0Z');
});

test('two pixels that touch diagonally and are also joined by a bridge trace as one self-touching loop', () => {
  // prettier-ignore
  const pixels = [
    false, true,  true,  true,
    false, true,  false, true,
    false, false, true,  true,
    false, false, false, false,
  ];
  const d = gridToPath(pixels, 4, 4);
  assert.doesNotThrow(() => d);
  assert.equal(loopCount(d), 1);
  assert.equal(totalSignedArea(d), pixels.filter(Boolean).length);
});

test('a strip offset from the origin picks relative commands where they are shorter', () => {
  const pixels = new Array(14).fill(false);
  pixels[10] = pixels[11] = pixels[12] = true;
  assert.equal(gridToPath(pixels, 14, 1), 'M10 0h3V1H10Z');
});

test('gridToSvg wraps the path with a matching viewBox, default fill, and evenodd fill-rule', () => {
  assert.equal(
    gridToSvg([true], 1, 1),
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"><path d="M0 0H1V1H0Z" fill="#000" fill-rule="evenodd"/></svg>',
  );
});

test('gridToSvg accepts a custom fill', () => {
  assert.match(gridToSvg([true], 1, 1, { fill: 'red' }), /fill="red"/);
});

test('gridToSvg escapes double quotes and ampersands in fill', () => {
  const svg = gridToSvg([true], 1, 1, { fill: '" fill="red' });
  assert.match(svg, /fill="&quot; fill=&quot;red"/);
});

test('gridToSvg emits no <path> for an all-off grid', () => {
  const svg = gridToSvg([false], 1, 1);
  assert.ok(!svg.includes('<path'));
  assert.equal(svg, '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"></svg>');
});
