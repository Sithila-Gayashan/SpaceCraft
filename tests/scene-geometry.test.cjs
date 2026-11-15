const test = require("node:test");
const assert = require("node:assert/strict");
const { furnitureTransform, wallPanels, openingBounds } = require("../src/services/sceneGeometry");
const room = { width: 4, length: 5, height: 3 };

test("3D furniture centers use rotated footprint but original local dimensions", () => {
  const p = { width: 2, length: 1, height: 0.8, position_x: 1, position_y: 2, rotation: 90 };
  const transform = furnitureTransform(room, p);
  assert.deepEqual(transform.position, [-0.5, 0, 0.5]);
  assert.deepEqual(transform.scale, [2, 0.8, 1]);
  assert.equal(transform.rotation, -Math.PI / 2);
  assert.deepEqual(furnitureTransform(room, { ...p, custom_width: 3 }).scale, [3, 0.8, 1]);
});

test("wall panels subtract overlapping door footprints only once", () => {
  const doors = [0, 0.5].map(position => ({ wall: "North", position, width: 1, height: 2, opening_type: "Door" }));
  const panels = wallPanels(room, doors, "North");
  const area = panels.reduce((sum, panel) => sum + panel.size[0] * panel.size[1], 0);
  assert.equal(area, 12 - 3);
  assert.equal(wallPanels(room, [], "East")[0].size[2], 5);
});

test("windows fit beneath ceiling using a documented assumed sill", () => {
  assert.equal(openingBounds(room, { wall: "West", position: 1, width: 1, height: 1, opening_type: "Window" }).bottom, 0.9);
  const tall = openingBounds(room, { wall: "South", position: 0, width: 1, height: 2.8, opening_type: "Window" });
  assert.equal(tall.top, 3);
  assert.ok(Math.abs(tall.bottom - 0.2) < 1e-9);
});
