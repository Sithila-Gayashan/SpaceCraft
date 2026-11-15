const test = require("node:test");
const assert = require("node:assert/strict");
const { openingPreview, wallPoint } = require("../src/services/openingPreview");
const room = { width: "4", length: "5", height: "3" };
const door = { wall: "North", opening_type: "Door", position: "1", width: "1", height: "2" };

test("preview handles partial input and invalid opening dimensions", () => {
  assert.equal(openingPreview({ ...room, width: "" }, [], "m").roomValid, false);
  for (const patch of [{ position: "" }, { width: "0" }, { position: "-1" },
    { position: "3.1" }, { height: "4" }]) {
    assert.ok(openingPreview(room, [{ ...door, ...patch }], "m").entries[0].error);
  }
  assert.equal(openingPreview(room, [{ ...door, position: "3" }], "m").entries[0].error, "");
});

test("wall offsets use left origins for north/south and top origins for east/west", () => {
  assert.deepEqual(wallPoint("North", 1, 4, 5), [1, 0]);
  assert.deepEqual(wallPoint("South", 1, 4, 5), [1, 5]);
  assert.deepEqual(wallPoint("East", 1, 4, 5), [4, 1]);
  assert.deepEqual(wallPoint("West", 1, 4, 5), [0, 1]);
  assert.equal(openingPreview(room, [{ ...door, wall: "East", position: "4" }], "m").entries[0].error, "");
});

test("feet inputs produce metre geometry and ceiling validation", () => {
  const model = openingPreview({ width: "10", length: "12", height: "8" },
    [{ ...door, position: "2", width: "3", height: "7" }], "ft");
  assert.equal(model.room.width, 3.048);
  assert.equal(model.entries[0].position, 0.6096);
  assert.equal(model.entries[0].error, "");
});
