const { size } = require("./geometry");

function furnitureTransform(room, piece) {
  const [width, length] = size(piece);
  return {
    position: [
      piece.position_x + width / 2 - room.width / 2,
      0,
      piece.position_y + length / 2 - room.length / 2,
    ],
    rotation: -piece.rotation * Math.PI / 180,
    scale: [piece.custom_width ?? piece.width, piece.height, piece.custom_length ?? piece.length],
  };
}

// Existing windows have no sill field. Use a 0.9 m sill when space permits.
function openingBounds(room, opening) {
  const span = ["North", "South"].includes(opening.wall) ? room.width : room.length;
  const left = Math.max(0, opening.position);
  const right = Math.min(span, opening.position + opening.width);
  const height = Math.min(room.height, opening.height);
  const bottom = opening.opening_type === "Door" ? 0 : Math.min(0.9, room.height - height);
  return { left, right, bottom, top: bottom + height };
}

function wallBox(room, wall, left, right, bottom, top) {
  const horizontal = ["North", "South"].includes(wall);
  const center = (left + right) / 2;
  return {
    position: horizontal
      ? [center - room.width / 2, (bottom + top) / 2, (wall === "North" ? -1 : 1) * (room.length / 2 + 0.05)]
      : [(wall === "West" ? -1 : 1) * (room.width / 2 + 0.05), (bottom + top) / 2, center - room.length / 2],
    size: horizontal ? [right - left, top - bottom, 0.1] : [0.1, top - bottom, right - left],
  };
}

function wallPanels(room, openings, wall) {
  const span = ["North", "South"].includes(wall) ? room.width : room.length;
  const holes = openings.filter(o => o.wall === wall).map(o => openingBounds(room, o))
    .filter(o => o.right > o.left && o.top > o.bottom);
  const edges = [...new Set([0, span, ...holes.flatMap(h => [h.left, h.right])])].sort((a, b) => a - b);
  const panels = [];
  for (let i = 1; i < edges.length; i++) {
    const left = edges[i - 1], right = edges[i];
    const intervals = holes.filter(h => h.left < right && h.right > left).sort((a, b) => a.bottom - b.bottom);
    let bottom = 0;
    for (const hole of intervals) {
      if (hole.bottom > bottom) panels.push(wallBox(room, wall, left, right, bottom, hole.bottom));
      bottom = Math.max(bottom, hole.top);
    }
    if (bottom < room.height) panels.push(wallBox(room, wall, left, right, bottom, room.height));
  }
  return panels;
}

module.exports = { furnitureTransform, openingBounds, wallBox, wallPanels };
