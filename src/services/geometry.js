const FOOT = 0.3048;
const fromDisplay = (value, unit) => Number(value) * (unit === "ft" ? FOOT : 1);
const display = (value, unit, area = false) =>
  Number((value / (unit === "ft" ? FOOT ** (area ? 2 : 1) : 1)).toFixed(3));
function size(p) {
  const w = p.custom_width ?? p.width,
    h = p.custom_length ?? p.length;
  return p.rotation % 180 ? [h, w] : [w, h];
}
function move(room, p, x, y) {
  const [w, h] = size(p);
  if (w > room.width || h > room.length)
    throw Error("This piece will not fit in that orientation.");
  const snap = (v, max) => Math.min(max, Math.max(0, Math.round(v * 20) / 20));
  return {
    ...p,
    position_x: snap(x, room.width - w),
    position_y: snap(y, room.length - h),
  };
}
function valid(room, p) {
  const [w, h] = size(p);
  return (
    [w, h, p.position_x, p.position_y].every(Number.isFinite) &&
    w > 0 &&
    h > 0 &&
    [0, 90, 180, 270].includes(p.rotation) &&
    p.position_x >= 0 &&
    p.position_y >= 0 &&
    p.position_x + w <= room.width + 1e-9 &&
    p.position_y + h <= room.length + 1e-9
  );
}
function stats(room, items) {
  const boxes = items.map((p) => {
    const [w, h] = size(p);
    return [p.position_x, p.position_y, p.position_x + w, p.position_y + h];
  });
  const conflicts = new Set();
  boxes.forEach(([x, y, r, b], i) =>
    boxes.slice(i + 1).forEach(([u, v, s, t], j) => {
      if (
        Math.min(r, s) - Math.max(x, u) > 1e-9 &&
        Math.min(b, t) - Math.max(y, v) > 1e-9
      ) {
        conflicts.add(items[i].id);
        conflicts.add(items[i + j + 1].id);
      }
    }),
  );
  // Sweep vertical strips; merge the covered y intervals within each strip.
  const edges = [...new Set(boxes.flatMap((b) => [b[0], b[2]]))].sort(
    (a, b) => a - b,
  );
  let occupied = 0;
  for (let i = 1; i < edges.length; i++) {
    let end = -Infinity;
    for (const [, y, , bottom] of boxes
      .filter((b) => b[0] < edges[i] && b[2] > edges[i - 1])
      .sort((a, b) => a[1] - b[1])) {
      occupied +=
        (edges[i] - edges[i - 1]) * Math.max(0, bottom - Math.max(end, y));
      end = Math.max(end, bottom);
    }
  }
  const total = room.width * room.length;
  return {
    total,
    occupied,
    free: Math.max(0, total - occupied),
    percent: (100 * occupied) / total,
    conflicts,
    count: items.length,
  };
}
function place(room, items, piece) {
  const rotations = [0, 90].filter(rotation => {
    const [w,h] = size({...piece,rotation});
    return w <= room.width && h <= room.length;
  });
  if (!rotations.length) throw Error('This piece is too large for this room.');
  const xs = new Set([0]), ys = new Set([0]);
  for (const p of items) {
    const [w,h] = size(p);
    xs.add(Math.ceil((p.position_x+w)*20-1e-9)/20);
    ys.add(Math.ceil((p.position_y+h)*20-1e-9)/20);
  }
  for (const rotation of rotations) {
    for (const y of [...ys].sort((a,b)=>a-b)) {
      for (const x of [...xs].sort((a,b)=>a-b)) {
        const candidate = move(room,{...piece,rotation},x,y);
        const [w,h]=size(candidate);
        if (!items.some(p=>{
          const [a,b]=size(p);
          return candidate.position_x < p.position_x+a-1e-9 && candidate.position_x+w > p.position_x+1e-9 &&
                 candidate.position_y < p.position_y+b-1e-9 && candidate.position_y+h > p.position_y+1e-9;
        })) return candidate;
      }
    }
  }
  // Keep a full room editable: overlaps are visible and can be resolved by dragging.
  return move(room,{...piece,rotation:rotations[0]},0,0);
}
module.exports={size,move,valid,stats,fromDisplay,display,place};
