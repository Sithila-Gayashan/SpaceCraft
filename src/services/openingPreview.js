const { fromDisplay } = require("./geometry");

function previewNumber(value, unit) {
  return String(value).trim() ? fromDisplay(value, unit) : NaN;
}

function openingPreview(values, openings, unit) {
  const room = Object.fromEntries(
    ["width", "length", "height"].map(key => [key, previewNumber(values[key], unit)]),
  );
  const roomValid = Object.values(room).every(value =>
    Number.isFinite(value) && value >= 0.1 && value <= 100,
  );
  const entries = openings.map(opening => {
    const entry = { ...opening };
    for (const key of ["position", "width", "height"]) {
      entry[key] = previewNumber(opening[key], unit);
    }
    const horizontal = ["North", "South"].includes(entry.wall);
    const span = horizontal ? room.width : room.length;
    let error = "";
    if (![entry.position, entry.width, entry.height].every(Number.isFinite) ||
        entry.position < 0 || entry.width <= 0 || entry.height <= 0) {
      error = "Enter an offset of zero or more and positive opening dimensions.";
    } else if (roomValid && entry.position + entry.width > span + 1e-9) {
      error = "Offset plus opening width exceeds this wall. Reduce either value.";
    } else if (roomValid && entry.height > room.height + 1e-9) {
      error = "Opening height exceeds the room height.";
    }
    return { ...entry, horizontal, error };
  });
  return { room, roomValid, entries };
}

function wallPoint(wall, distance, width, length) {
  switch (wall) {
    case "North": return [distance, 0];
    case "South": return [distance, length];
    case "East": return [width, distance];
    case "West": return [0, distance];
    default: throw Error("Unknown wall");
  }
}

module.exports = { openingPreview, wallPoint };
