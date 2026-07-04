import { writeFileSync } from 'node:fs';
import { gridToSvg } from '../src/index.js';

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

writeFileSync(new URL('nested-holes.svg', import.meta.url), gridToSvg(pixels, 5, 5));
console.log('wrote examples/nested-holes.svg');
