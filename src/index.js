// Public API: serializes trace.js's loops into SVG path/markup strings
// (command formatting, validation, escaping) - the geometry lives there.

import { buildSegments, linkAcrossPixels, traceLoops, mergeLoop } from './trace.js';

function axisCommand(prev, curr, dir) {
  const horizontal = dir === 'left' || dir === 'right';
  const absValue = horizontal ? curr.x : curr.y;
  const prevValue = horizontal ? prev.x : prev.y;
  const absStr = String(absValue);
  const deltaStr = String(absValue - prevValue);
  // Every merged edge is axis-aligned, so H/V always beats a generic L x y;
  // between the two, whichever numeric string is shorter wins (ties favor
  // the absolute form for readability).
  return deltaStr.length < absStr.length
    ? (horizontal ? 'h' : 'v') + deltaStr
    : (horizontal ? 'H' : 'V') + absStr;
}

function loopToPathString(loop) {
  let d = `M${loop[0].start.x} ${loop[0].start.y}`;
  let prev = loop[0].start;
  for (let i = 1; i < loop.length; i++) {
    d += axisCommand(prev, loop[i].start, loop[i - 1].dir);
    prev = loop[i].start;
  }
  return d + 'Z';
}

function escapeAttr(value) {
  return String(value).replace(/&/g, '&amp;').replace(/"/g, '&quot;');
}

/**
 * Traces the boundary of the "on" pixels in a grid into an optimized SVG
 * path `d` string. Outer contours wind clockwise, hole contours counter-
 * clockwise; render with `fill-rule="evenodd"` (see gridToSvg).
 *
 * @param {ArrayLike<unknown>} pixels flat, row-major; truthy = on
 * @param {number} width
 * @param {number} height
 * @returns {string} an SVG path `d` attribute value, or `''` if no pixels are on
 */
export function gridToPath(pixels, width, height) {
  if (pixels.length !== width * height) {
    // The precondition that guarantees every traced loop closes.
    throw new RangeError(`pixels.length (${pixels.length}) must equal width * height (${width * height})`);
  }

  const segments = buildSegments(pixels, width, height);
  if (segments.length === 0) return '';

  linkAcrossPixels(segments);
  return traceLoops(segments).map(mergeLoop).map(loopToPathString).join('');
}

/**
 * Wraps gridToPath's output in a standalone `<svg>` string.
 *
 * @param {ArrayLike<unknown>} pixels flat, row-major; truthy = on
 * @param {number} width
 * @param {number} height
 * @param {{ fill?: string }} [options]
 * @returns {string}
 */
export function gridToSvg(pixels, width, height, { fill = '#000' } = {}) {
  const d = gridToPath(pixels, width, height);
  // evenodd is parity-based rather than winding-direction-based, which
  // stays correct even where a shape's traced boundary touches itself at a
  // single vertex (a valid, if unusual-looking, output of the tracing).
  const path = d ? `<path d="${d}" fill="${escapeAttr(fill)}" fill-rule="evenodd"/>` : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}">${path}</svg>`;
}
