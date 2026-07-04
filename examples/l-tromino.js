import { writeFileSync } from 'node:fs';
import { gridToSvg } from '../src/index.js';

// prettier-ignore
const pixels = [
  true, true,
  true, false,
];

writeFileSync(new URL('l-tromino.svg', import.meta.url), gridToSvg(pixels, 2, 2));
console.log('wrote examples/l-tromino.svg');
