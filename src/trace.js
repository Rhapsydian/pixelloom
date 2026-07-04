// Boundary-tracing geometry: turns a pixel grid into linked, merged loops.
// Nothing here knows about SVG - that's index.js's job.

function isOn(pixels, width, height, x, y) {
  return x >= 0 && x < width && y >= 0 && y < height && Boolean(pixels[y * width + x]);
}

function makeSegment(sx, sy, ex, ey) {
  let dir;
  if (ex > sx) dir = 'right';
  else if (ex < sx) dir = 'left';
  else if (ey > sy) dir = 'down';
  else dir = 'up';
  return { start: { x: sx, y: sy }, end: { x: ex, y: ey }, dir, next: null, prior: null };
}

function link(a, b) {
  a.next = b;
  b.prior = a;
}

export function buildSegments(pixels, width, height) {
  const on = (x, y) => isOn(pixels, width, height, x, y);
  const segments = [];

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (!on(x, y)) continue;

      const top = !on(x, y - 1) ? makeSegment(x, y, x + 1, y) : null;
      const right = !on(x + 1, y) ? makeSegment(x + 1, y, x + 1, y + 1) : null;
      const bottom = !on(x, y + 1) ? makeSegment(x + 1, y + 1, x, y + 1) : null;
      const left = !on(x - 1, y) ? makeSegment(x, y + 1, x, y) : null;

      if (top && right) link(top, right);
      if (right && bottom) link(right, bottom);
      if (bottom && left) link(bottom, left);
      if (left && top) link(left, top);

      if (top) segments.push(top);
      if (right) segments.push(right);
      if (bottom) segments.push(bottom);
      if (left) segments.push(left);
    }
  }

  return segments;
}

export function linkAcrossPixels(segments) {
  // At most one open segment can ever share a given point as its start point
  // (the on/off pattern around any grid vertex admits only one such segment),
  // so a plain Map resolves every gap in a single pass with no ambiguity.
  const openStarts = new Map();
  const key = (p) => `${p.x},${p.y}`;

  for (const seg of segments) {
    if (seg.prior === null) openStarts.set(key(seg.start), seg);
  }

  for (const seg of segments) {
    if (seg.next === null) link(seg, openStarts.get(key(seg.end)));
  }
}

export function traceLoops(segments) {
  const visited = new Set();
  const loops = [];

  for (const seg of segments) {
    if (visited.has(seg)) continue;
    const loop = [];
    let current = seg;
    do {
      visited.add(current);
      loop.push(current);
      current = current.next;
    } while (current !== seg);
    loops.push(loop);
  }

  return loops;
}

export function mergeLoop(loop) {
  const merged = [];
  for (const seg of loop) {
    const last = merged[merged.length - 1];
    if (last && last.dir === seg.dir) last.end = seg.end;
    else merged.push({ start: seg.start, end: seg.end, dir: seg.dir });
  }
  // The scan above only merges adjacent entries in array order; the edge
  // that closes the loop (last segment back to the first) never appears as
  // an adjacent pair there, so it needs this separate wraparound check.
  while (merged.length > 1 && merged[0].dir === merged[merged.length - 1].dir) {
    merged[0].start = merged.pop().start;
  }
  return merged;
}
