# Pixelloom

[![test](https://github.com/Rhapsydian/pixelloom/actions/workflows/test.yml/badge.svg)](https://github.com/Rhapsydian/pixelloom/actions/workflows/test.yml)
[![license](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)

Converts a pixel grid (think a bitmap mask or pixel art) into one optimized SVG `<path>` by tracing the boundary between filled and empty cells, rather than drawing a `<rect>` for every pixel.

**Live demo:** [rhapsydian.github.io/pixelloom-playground](https://rhapsydian.github.io/pixelloom-playground/) — paint a grid and watch the traced path update live, including a size comparison against the naive `<rect>`-per-pixel approach.

## How it works

Given a grid, the naive approach draws one `<rect>` per on-pixel. Pixelloom instead walks the boundary between on- and off-pixels, merges every straight run of edge into a single line, and then serializes each edge as whichever SVG command is shortest:

- every merged edge is axis-aligned, so it's always emitted as `H`/`V` instead of a generic `L x y`
- each `H`/`V` command picks whichever is shorter: the absolute coordinate (`H13`) or the delta from the last point (`h3`)

A single on-pixel goes from `M0 0L1 0L1 1L0 1Z` (18 characters) to `M0 0H1V1H0Z` (11 characters) — and the savings compound with pixel count, since a whole run of pixels along one edge collapses to a single command regardless of how many pixels make it up.

## Install

```sh
npm install pixelloom
```

## Usage

```js
import { gridToPath, gridToSvg } from 'pixelloom';

// flat, row-major, truthy = on
const pixels = [
  true, true, true,
  true, false, true,
  true, true, true,
];

gridToPath(pixels, 3, 3);
// 'M0 0H3V3H0ZM2 1H1V2H2Z'

gridToSvg(pixels, 3, 3, { fill: '#222' });
// '<svg xmlns="..." viewBox="0 0 3 3"><path d="..." fill="#222" fill-rule="evenodd"/></svg>'
```

`gridToPath` returns just the path's `d` string, for callers assembling their own markup (e.g. one `<path>` per color, built from separate grids). `gridToSvg` is a thin convenience wrapper that returns a full, standalone `<svg>`.

Pixel values only need to be truthy/falsy — plain `0`/`1` arrays work fine, not just strict `true`/`false`.

## Fill rule

Outer contours wind clockwise and hole contours wind counter-clockwise, so nested holes render correctly. `gridToSvg` sets `fill-rule="evenodd"` for you; if you're building your own `<path>` from `gridToPath`'s output, set `fill-rule="evenodd"` yourself rather than relying on the SVG default (`nonzero`) — see "Self-touching shapes" below for why evenodd is the safer choice here.

## Diagonally-touching and self-touching shapes

Two pixels that touch only diagonally (no shared edge) always trace as two separate loops meeting at a single point — this is intentional, not a bug.

A shape can also trace as a *single* loop that touches itself at one point: this happens when two parts of one connected region touch diagonally while also being joined by a longer path elsewhere. The result is a valid path — it still encloses the correct area — but it can look like a "pinch" at that vertex. `evenodd` renders both of these cases correctly since it doesn't depend on winding direction lining up perfectly at a shared point.

## Running tests

This project uses Node's built-in test runner — no external framework, no config file:

```sh
npm test
```

That's `node --test` under the hood: it finds every `test/*.test.js` file, runs the `test(...)` blocks inside, and reports pass/fail. See `test/trace.test.js` and `test/index.test.js` for what's covered.

## Examples

`examples/` has a few runnable scripts that write `.svg` files you can open directly in a browser:

```sh
node examples/donut.js
node examples/l-tromino.js
node examples/nested-holes.js
node examples/self-touching-pinch.js
```
