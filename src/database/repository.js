const catalogue = require("./catalogue");
const { valid } = require("../services/geometry");
const types = [
  "Bedroom",
  "Living Room",
  "Kitchen",
  "Office",
  "Bathroom",
  "Other",
];
const walls = ["North", "East", "South", "West"];
const schema = `
CREATE TABLE categories(id INTEGER PRIMARY KEY,name TEXT UNIQUE NOT NULL);
CREATE TABLE furniture(id INTEGER PRIMARY KEY,name TEXT NOT NULL,category_id INTEGER NOT NULL REFERENCES categories,width REAL NOT NULL CHECK(width>0),length REAL NOT NULL CHECK(length>0),height REAL NOT NULL CHECK(height>0),description TEXT NOT NULL,estimated_price REAL NOT NULL,image_path TEXT);
CREATE TABLE rooms(id INTEGER PRIMARY KEY,name TEXT NOT NULL,room_type TEXT NOT NULL,width REAL NOT NULL CHECK(width>0),length REAL NOT NULL CHECK(length>0),height REAL NOT NULL CHECK(height>0),unit TEXT NOT NULL CHECK(unit IN ('ft','m')),background_color TEXT NOT NULL,created_at TEXT DEFAULT CURRENT_TIMESTAMP,updated_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE room_layouts(id INTEGER PRIMARY KEY,room_id INTEGER NOT NULL REFERENCES rooms ON DELETE CASCADE,layout_name TEXT NOT NULL,created_at TEXT DEFAULT CURRENT_TIMESTAMP,updated_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE placed_furniture(id INTEGER PRIMARY KEY,layout_id INTEGER NOT NULL REFERENCES room_layouts ON DELETE CASCADE,furniture_id INTEGER NOT NULL REFERENCES furniture,position_x REAL NOT NULL CHECK(position_x>=0),position_y REAL NOT NULL CHECK(position_y>=0),rotation INTEGER NOT NULL CHECK(rotation IN (0,90,180,270)),custom_width REAL,custom_length REAL);
CREATE TABLE room_openings(id INTEGER PRIMARY KEY,room_id INTEGER NOT NULL REFERENCES rooms ON DELETE CASCADE,opening_type TEXT NOT NULL,wall TEXT NOT NULL,position REAL NOT NULL,width REAL NOT NULL,height REAL NOT NULL);
CREATE TABLE preferences(key TEXT PRIMARY KEY,value TEXT NOT NULL);
`;
function repository(db) {
  const run = (q, ...args) => db.runSync(q, ...args),
    all = (q, ...args) => db.getAllSync(q, ...args),
    one = (q, ...args) => all(q, ...args)[0];
  function transaction(fn) {
    let result;
    db.withTransactionSync(() => {
      result = fn();
    });
    return result;
  }
  function init() {
    db.execSync("PRAGMA foreign_keys=ON; PRAGMA journal_mode=WAL;");
    if (one("PRAGMA user_version").user_version) return;
    transaction(() => {
      db.execSync(schema);
      for (const p of catalogue) {
        run("INSERT OR IGNORE INTO categories(name) VALUES(?)", p.category);
        run(
          "INSERT INTO furniture(name,category_id,width,length,height,description,estimated_price) VALUES(?,(SELECT id FROM categories WHERE name=?),?,?,?,?,?)",
          p.name,
          p.category,
          p.width,
          p.length,
          p.height,
          p.description,
          p.price,
        );
      }
      db.execSync("PRAGMA user_version=1");
    });
  }
  const room = (id) => one("SELECT * FROM rooms WHERE id=?", id);
  const layouts = () =>
    all(
      "SELECT l.*,r.name,r.width,r.length,r.unit,r.room_type,(SELECT count(*) FROM placed_furniture p WHERE p.layout_id=l.id) AS count FROM room_layouts l JOIN rooms r ON r.id=l.room_id ORDER BY l.updated_at DESC,l.id DESC",
    );
  const pieces = (id) =>
    all(
      "SELECT p.*,f.name,f.width,f.length,f.height,c.name AS category FROM placed_furniture p JOIN furniture f ON f.id=p.furniture_id JOIN categories c ON c.id=f.category_id WHERE layout_id=? ORDER BY p.id",
      id,
    );
  function saveRoom(r, openings) {
    if (
      !r.name.trim() ||
      !types.includes(r.room_type) ||
      !["m", "ft"].includes(r.unit) ||
      ![r.width, r.length, r.height].every(
        (v) => Number.isFinite(v) && v >= 0.1 && v <= 100,
      )
    )
      throw Error("Enter a name and dimensions between 0.1 and 100 metres.");
    for (const o of openings) {
      const span = ["North", "South"].includes(o.wall) ? r.width : r.length;
      if (
        !walls.includes(o.wall) ||
        !["Door", "Window"].includes(o.opening_type) ||
        ![o.width, o.height, o.position].every(Number.isFinite) ||
        o.width <= 0 ||
        o.height <= 0 ||
        o.position < 0 ||
        o.width + o.position > span + 1e-9 ||
        o.height > r.height + 1e-9
      )
        throw Error("An opening exceeds its wall or has invalid dimensions.");
    }
    return transaction(() => {
      let id = r.id;
      const fields = [
        r.name.trim(),
        r.room_type,
        r.width,
        r.length,
        r.height,
        r.unit,
        r.background_color,
      ];
      if (id) {
        for (const l of layouts().filter((l) => l.room_id === id))
          if (pieces(l.id).some((p) => !valid(r, p)))
            throw Error(
              "Move furniture inside the proposed dimensions in each layout first.",
            );
        run(
          "UPDATE rooms SET name=?,room_type=?,width=?,length=?,height=?,unit=?,background_color=?,updated_at=CURRENT_TIMESTAMP WHERE id=?",
          ...fields,
          id,
        );
        run("DELETE FROM room_openings WHERE room_id=?", id);
      } else
        id = run(
          "INSERT INTO rooms(name,room_type,width,length,height,unit,background_color) VALUES(?,?,?,?,?,?,?)",
          ...fields,
        ).lastInsertRowId;
      for (const o of openings)
        run(
          "INSERT INTO room_openings(room_id,opening_type,wall,position,width,height) VALUES(?,?,?,?,?,?)",
          id,
          o.opening_type,
          o.wall,
          o.position,
          o.width,
          o.height,
        );
      return id;
    });
  }
  function saveLayout(roomId, id, name, items) {
    if (!name.trim()) throw Error("Give the layout a name.");
    return transaction(() => {
      const r = room(roomId);
      if (!r) throw Error("This room is unavailable.");
      if (id) {
        if (
          !run(
            "UPDATE room_layouts SET layout_name=?,updated_at=CURRENT_TIMESTAMP WHERE id=? AND room_id=?",
            name.trim(),
            id,
            roomId,
          ).changes
        )
          throw Error("This layout is unavailable.");
        run("DELETE FROM placed_furniture WHERE layout_id=?", id);
      } else
        id = run(
          "INSERT INTO room_layouts(room_id,layout_name) VALUES(?,?)",
          roomId,
          name.trim(),
        ).lastInsertRowId;
      for (const p of items) {
        const f = one(
          "SELECT width,length FROM furniture WHERE id=?",
          p.furniture_id,
        );
        if (!f || !valid(r, { ...p, ...f }))
          throw Error("A piece falls outside the room.");
        run(
          "INSERT INTO placed_furniture(layout_id,furniture_id,position_x,position_y,rotation,custom_width,custom_length) VALUES(?,?,?,?,?,?,?)",
          id,
          p.furniture_id,
          p.position_x,
          p.position_y,
          p.rotation,
          p.custom_width ?? null,
          p.custom_length ?? null,
        );
      }
      run("UPDATE rooms SET updated_at=CURRENT_TIMESTAMP WHERE id=?", roomId);
      return id;
    });
  }
  return {
    init,
    room,
    layouts,
    pieces,
    saveRoom,
    saveLayout,
    rooms: () => all("SELECT * FROM rooms ORDER BY updated_at DESC,id DESC"),
    openings: (id) =>
      all("SELECT * FROM room_openings WHERE room_id=? ORDER BY id", id),
    furniture: (query = "", category = "", desc = false) =>
      all(
        "SELECT f.*,c.name AS category FROM furniture f JOIN categories c ON f.category_id=c.id WHERE instr(lower(f.name),lower(?))>0 AND (?='' OR c.name=?) ORDER BY f.name COLLATE NOCASE " +
          (desc ? "DESC" : "ASC"),
        query,
        category,
        category,
      ),
    categories: () =>
      all("SELECT name FROM categories ORDER BY id").map((c) => c.name),
    removeRoom: (id) => run("DELETE FROM rooms WHERE id=?", id),
    removeLayout: (id) => run("DELETE FROM room_layouts WHERE id=?", id),
    duplicate: (l) =>
      saveLayout(l.room_id, null, l.layout_name + " copy", pieces(l.id)),
    unit: () =>
      one("SELECT value FROM preferences WHERE key='unit'")?.value ?? "m",
    setUnit: (u) =>
      run("INSERT OR REPLACE INTO preferences VALUES('unit',?)", u),
  };
}
module.exports = { repository, types, walls };
