import { writeFileSync } from 'node:fs';
import { gridToSvg } from '../src/index.js';

// prettier-ignore
const pixels = [
  true, true, true,
  true, false, true,
  true, true, true,
];

writeFileSync(new URL('donut.svg', import.meta.url), gridToSvg(pixels, 3, 3));
console.log('wrote examples/donut.svg');
