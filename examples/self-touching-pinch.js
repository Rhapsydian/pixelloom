import { writeFileSync } from 'node:fs';
import { gridToSvg } from '../src/index.js';

// Two pixels that touch diagonally and are also joined by a longer
// 4-connected bridge - traces as a single loop that pinches to a point
// where the diagonal touch is, rather than two separate loops.
// prettier-ignore
const pixels = [
  false, true,  true,  true,
  false, true,  false, true,
  false, false, true,  true,
  false, false, false, false,
];

writeFileSync(new URL('self-touching-pinch.svg', import.meta.url), gridToSvg(pixels, 4, 4));
console.log('wrote examples/self-touching-pinch.svg');
