const test = require("node:test"),
  assert = require("node:assert/strict");
const { DatabaseSync } = require("node:sqlite");
const fs = require("node:fs"),
  os = require("node:os"),
  path = require("node:path");
const { repository } = require("../src/database/repository");
const {
  move,
  valid,
  size,
  stats,
  fromDisplay,
  display,
} = require("../src/services/geometry");
function connect(file) {
  const conn = new DatabaseSync(file);
  const db = repository({
    execSync: (q) => conn.exec(q),
    runSync: (q, ...args) => {
      const r = conn.prepare(q).run(...args);
      return { changes: r.changes, lastInsertRowId: r.lastInsertRowid };
    },
    getAllSync: (q, ...args) => conn.prepare(q).all(...args),
    withTransactionSync: (fn) => {
      conn.exec("BEGIN");
      try {
        fn();
        conn.exec("COMMIT");
      } catch (e) {
        conn.exec("ROLLBACK");
        throw e;
      }
    },
  });
  db.init();
  return { db, close: () => conn.close() };
}
const room = {
  name: "Library",
  room_type: "Office",
  width: 5,
  length: 4,
  height: 3,
  unit: "m",
  background_color: "#E0EADC",
};
const piece = (id, x, y, w, h, rotation = 0) => ({
  id,
  position_x: x,
  position_y: y,
  width: w,
  length: h,
  rotation,
});
test("union handles triple intersections, containment, shared edges and rotation", () => {
  const items = [
    piece(1, 0, 0, 2, 2),
    piece(2, 1, 0, 2, 2),
    piece(3, 1, 1, 1, 1),
    piece(4, 3, 0, 1, 2, 90),
  ];
  const s = stats(room, items);
  assert.equal(s.occupied, 8);
  assert.equal(s.free, 12);
  assert.equal(s.percent, 40);
  assert.deepEqual([...s.conflicts].sort(), [1, 2, 3]);
  assert.equal(s.count, 4);
  assert.equal(stats(room, []).occupied, 0);
});
test("movement clamps rotated extents, snaps and rejects oversize pieces", () => {
  const p = piece(1, 0, 0, 1, 2, 90);
  assert.deepEqual(size(p), [2, 1]);
  assert.equal(move(room, p, 20, -5).position_x, 3);
  assert.equal(move(room, p, 20, -5).position_y, 0);
  assert.equal(move(room, p, 0.08, 0).position_x, 0.1);
  assert.throws(() => move(room, { ...p, width: 6 }, 0, 0));
  assert(!valid(room, { ...p, position_x: 4 }));
  assert.equal(fromDisplay(10, "ft"), 3.048);
  assert.equal(display(0.3048 ** 2, "ft", true), 1);
});
test("offline SQLite workflow survives close and reopen, preserves valid state on failed writes", (t) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "spacecraft-"));
  const file = path.join(dir, "room.db");
  let session = connect(file),
    db = session.db;
  t.after(() => {
    session.close();
    fs.rmSync(dir, { recursive: true, force: true });
  });
  assert(db.furniture().length >= 30);
  assert.equal(db.categories().length, 9);
  const f = db.furniture("OAK", "Beds")[0];
  assert.equal(f.name, "Oak queen");
  assert.equal(db.furniture("oak", "Desks").length, 0);
  assert.deepEqual(
    db.furniture("", "", true).map((f) => f.name),
    db
      .furniture()
      .map((f) => f.name)
      .reverse(),
  );
  assert.throws(() => db.saveRoom({ ...room, width: NaN }, []));
  assert.throws(() =>
    db.saveRoom(room, [
      { wall: "North", opening_type: "Door", width: 1, height: 2, position: 5 },
    ]),
  );
  const roomId = db.saveRoom(room, [
    { wall: "East", opening_type: "Window", width: 1, height: 1, position: 2 },
  ]);
  assert.equal(db.openings(roomId).length, 1);
  db.saveRoom({ ...room, id: roomId, name: "Reading room" }, []);
  assert.equal(db.room(roomId).name, "Reading room");
  const p = move(room, { ...f, furniture_id: f.id, rotation: 90 }, 2, 1);
  const id = db.saveLayout(roomId, null, "Scheme A", [p]);
  assert.equal(db.layouts()[0].count, 1);
  assert.throws(() =>
    db.saveLayout(roomId, id, "Bad edit", [{ ...p, position_y: 100 }]),
  );
  assert.equal(db.layouts()[0].layout_name, "Scheme A");
  assert.equal(db.pieces(id)[0].rotation, 90);
  assert.throws(() => db.saveRoom({ ...room, id: roomId, width: 1 }, []));
  assert.equal(db.room(roomId).width, 5);
  db.setUnit("ft");
  session.close();
  session = connect(file);
  db = session.db;
  assert.equal(db.unit(), "ft");
  assert.equal(db.pieces(id)[0].position_x, 2);
  assert.equal(db.openings(roomId).length, 0);
  const copy = db.duplicate(db.layouts()[0]);
  db.removeLayout(id);
  assert.equal(db.pieces(copy).length, 1);
  assert.equal(db.pieces(id).length, 0);
  db.removeRoom(roomId);
  assert.equal(db.layouts().length, 0);
  assert.equal(db.rooms().length, 0);
  assert.equal(db.pieces(copy).length, 0);
});

test("sweep area agrees with occupied grid cells over 100 generated plans", () => {
  let seed = 42;
  const integer = (n) => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed % n;
  };
  for (let trial = 0; trial < 100; trial++) {
    const items = [],
      cells = new Set();
    for (let i = 0; i < 10; i++) {
      const w = 1 + integer(4),
        h = 1 + integer(4),
        rotation = integer(4) * 90;
      const p = piece(i, 0, 0, w, h, rotation),
        [a, b] = size(p);
      p.position_x = integer(11 - a);
      p.position_y = integer(11 - b);
      items.push(p);
      for (let x = p.position_x; x < p.position_x + a; x++)
        for (let y = p.position_y; y < p.position_y + b; y++)
          cells.add(x + "," + y);
    }
    assert.equal(stats({ width: 10, length: 10 }, items).occupied, cells.size);
  }
});

test('insertion finds open floor, rotates to fit, and rejects unplaceable pieces',()=>{
 const {place}=require('../src/services/geometry');
 const placed=place(room,[piece(1,0,0,2,2)],piece(2,0,0,2,2));
 assert.equal(placed.position_x,2);assert.equal(placed.position_y,0);
 assert.equal(place({width:1,length:2},[],piece(1,0,0,2,1)).rotation,90);
 assert.throws(()=>place(room,[],piece(1,0,0,6,6)));
});
