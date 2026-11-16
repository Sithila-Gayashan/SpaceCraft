import React, { useState } from "react";
import { View, Pressable, Image } from "react-native";
import { useIsFocused } from "@react-navigation/native";
import Svg, { Path, Rect, Defs, Pattern } from "react-native-svg";
import { furnitureImages } from "../assets/furnitureImages";
import {
  Page,
  T,
  Row,
  Card,
  Button,
  Stat,
  Empty,
  Icon,
  SearchBar,
  Choices,
  act,
  confirm,
  colors,
} from "../components/ui";
import { useStudio } from "../database/context";
import { display } from "../services/geometry";
import { Illustration } from "../components/Plan";
export const dimensions = (r) =>
  [r.width, r.length].map((v) => display(v, r.unit)).join(" × ") + " " + r.unit;
function RoomCard({ r, nav }) {
  return (
    <Pressable onPress={() => nav.navigate("Room", { id: r.id })}>
      <Card>
        <Row>
          <Icon name="home" />
          <T kind="label">{r.room_type}</T>
        </Row>
        <T kind="section">{r.name}</T>
        <T kind="small">{dimensions(r)}</T>
      </Card>
    </Pressable>
  );
}
function Blueprint() {
  return (
    <Svg width="100%" height={104} viewBox="0 0 300 104">
      <Defs>
        <Pattern
          id="lines"
          width="12"
          height="12"
          patternUnits="userSpaceOnUse"
        >
          <Path d="M12 0H0V12" fill="none" stroke="#557768" strokeWidth=".6" />
        </Pattern>
      </Defs>
      <Rect width="300" height="104" fill="url(#lines)" />
      <Path
        d="M22 17H278V87H22Z M120 17V58 M120 78V87 M195 17V47H278"
        fill="none"
        stroke="#DFE8D8"
        strokeWidth="2.5"
      />
      <Rect x="32" y="26" width="43" height="53" fill="#A0B5A0" />
      <Path
        d="M34 37H72 M132 26H180V40H132Z M234 60H269V77H234Z"
        fill="none"
        stroke="#C7D9C4"
        strokeWidth="2"
      />
    </Svg>
  );
}
export function Home({ navigation: n }) {
  useIsFocused();
  const { db } = useStudio(),
    rooms = db.rooms(),
    layouts = db.layouts();
  return (
    <Page title="SpaceCraft" kicker="Interior planning studio">
      <Card style={{ backgroundColor: colors.ink, borderColor: colors.ink }}>
        <Row>
          <Icon name="layers" color="#CCE0C9" />
          <T style={{ color: "#DCE8D7" }}>Welcome to your studio</T>
        </Row>
        <Blueprint />
        <Button icon="plus" onPress={() => n.navigate("RoomForm")}>
          Create new room
        </Button>
      </Card>
      <Row>
        <Stat label="Rooms" value={rooms.length} />
        <Stat label="Layouts" value={layouts.length} />
        <Stat label="Pieces" value={db.furniture().length} />
      </Row>
      <T kind="section">Recent rooms</T>
      {rooms.slice(0, 3).map((r) => (
        <RoomCard key={r.id} r={r} nav={n} />
      ))}
      {!rooms.length && (
        <Empty title="Your first floor plan">
          Create a room with its dimensions to start arranging furniture.
        </Empty>
      )}
      <Row>
        <Button icon="grid" onPress={() => n.navigate("Furniture")}>
          Catalogue
        </Button>
        <Button icon="folder" onPress={() => n.navigate("Saved Layouts")}>
          Saved layouts
        </Button>
      </Row>
    </Page>
  );
}
export function Rooms({ navigation: n }) {
  useIsFocused();
  const rooms = useStudio().db.rooms();
  return (
    <Page title="Your rooms">
      <Button primary icon="plus" onPress={() => n.navigate("RoomForm")}>
        Create new room
      </Button>
      {rooms.map((r) => (
        <RoomCard key={r.id} r={r} nav={n} />
      ))}
      {!rooms.length && (
        <Empty title="No rooms yet">
          Add the dimensions of your first room.
        </Empty>
      )}
    </Page>
  );
}
export function Room({ navigation: n, route }) {
  useIsFocused();
  const { db, refresh } = useStudio(),
    r = db.room(route.params.id);
  if (!r) return null;
  const ls = db.layouts().filter((l) => l.room_id === r.id);
  return (
    <Page title={r.name} kicker={r.room_type} nav={n}>
      <Card>
        <T kind="section">{dimensions(r)}</T>
        <T>
          Ceiling height · {display(r.height, r.unit)} {r.unit}
        </T>
        {db.openings(r.id).map((o) => (
          <T kind="small" key={o.id}>
            {o.wall} {o.opening_type.toLowerCase()} · {display(o.width, r.unit)}{" "}
            × {display(o.height, r.unit)} {r.unit}
          </T>
        ))}
      </Card>
      <Button
        primary
        icon="edit-3"
        onPress={() => n.navigate("Designer", { roomId: r.id })}
      >
        Design a new layout
      </Button>
      <T kind="section">Room layouts</T>
      {!ls.length && (
        <Empty title="Ready to design">
          Save a plan in the designer to see it here.
        </Empty>
      )}
      {ls.map((l) => (
        <Button key={l.id} onPress={() => n.navigate("Layout", { id: l.id })}>
          {l.layout_name}
        </Button>
      ))}
      <Row>
        <Button onPress={() => n.navigate("RoomForm", { id: r.id })}>
          Edit room
        </Button>
        <Button
          danger
          onPress={() =>
            confirm(
              "Delete room?",
              "This removes the room and every layout inside it.",
              () => {
                db.removeRoom(r.id);
                n.goBack();
                refresh();
              },
            )
          }
        >
          Delete room
        </Button>
      </Row>
    </Page>
  );
}
export function Browser({ onPick }) {
  const { db } = useStudio();
  const [q, setQuery] = useState(""),
    [cat, setCategory] = useState("All"),
    [desc, setDescending] = useState(false);
  const rows = db.furniture(q, cat === "All" ? "" : cat, desc);
  return (
    <>
      <SearchBar value={q} onChangeText={setQuery} />
      <Choices options={["All", ...db.categories()]} value={cat} onChange={setCategory} />
      <Row>
        <T kind="small">{rows.length} pieces</T>
        <Button icon="list" onPress={() => setDescending(!desc)}>
          {desc ? "Z–A" : "A–Z"}
        </Button>
      </Row>
      {rows.map((f) => (
        <Pressable key={f.id} onPress={() => onPick(f)}>
          <Card>
            <Row>
              {furnitureImages[f.name] ? (
  <Image
    source={furnitureImages[f.name]}
    accessibilityLabel={f.name}
    resizeMode="contain"
    style={{ width: 80, height: 80, borderRadius: 10 }}
  />
) : (
  <Illustration category={f.category} />
)}
              <View style={{ flex: 1 }}>
                <T kind="label">{f.category}</T>
                <T kind="section">{f.name}</T>
                <T kind="small">
                  {f.width} × {f.length} m · ${f.estimated_price}
                </T>
              </View>
              <Icon name="chevron-right" />
            </Row>
          </Card>
        </Pressable>
      ))}
      {!rows.length && (
        <Empty title="No matching pieces">
          Try another category or search term.
        </Empty>
      )}
    </>
  );
}
export function Furniture({ navigation: n }) {
  return (
    <Page title="Furniture library">
      <Browser onPick={(f) => n.navigate("FurnitureDetails", { id: f.id })} />
    </Page>
  );
}
export function FurnitureDetails({ navigation: n, route }) {
  useIsFocused();
  const { db } = useStudio(),
    f = db.furniture().find((f) => f.id === route.params.id),
    rooms = db.rooms();
  const [roomId, setRoomId] = useState(null);
  return (
    <Page title={f.name} kicker={f.category} nav={n}>
      <Card>
        {furnitureImages[f.name] ? (
  <Image
    source={furnitureImages[f.name]}
    accessibilityLabel={f.name}
    resizeMode="contain"
    style={{ width: 80, height: 80, borderRadius: 10 }}
  />
) : (
  <Illustration category={f.category} />
)}
        <T>{f.description}</T>
        <T>
          {f.width} × {f.length} × {f.height} m
        </T>
        <T kind="section">USD {f.estimated_price}</T>
      </Card>
      <T kind="section">Add to a room</T>
      {rooms.map((r) => (
        <Button key={r.id} primary={roomId === r.id} onPress={() => setRoomId(r.id)}>
          {r.name}
        </Button>
      ))}
      {!rooms.length && (
        <Button onPress={() => n.navigate("RoomForm")}>Create a room</Button>
      )}
      {roomId && (
        <Card>
          <T kind="small">Choose a layout for this piece</T>
          {[
            ...db.layouts().filter((l) => l.room_id === roomId),
            { id: null, layout_name: "New layout" },
          ].map((l) => (
            <Button
              key={l.id ?? "new"}
              onPress={() =>
                n.navigate("Designer", { roomId, layoutId: l.id, addId: f.id })
              }
            >
              {l.layout_name}
            </Button>
          ))}
        </Card>
      )}
    </Page>
  );
}
export function Saved({ navigation: n }) {
  useIsFocused();
  const { db, refresh } = useStudio(),
    [q, setQuery] = useState("");
  const ls = db
    .layouts()
    .filter((l) =>
      (l.layout_name + " " + l.name).toLowerCase().includes(q.toLowerCase()),
    );
  return (
    <Page title="Saved layouts">
      <SearchBar value={q} onChangeText={setQuery} />
      {ls.map((l) => (
        <Card key={l.id}>
          <T kind="label">{l.room_type}</T>
          <T kind="section">{l.layout_name}</T>
          <T>
            {l.name} · {dimensions(l)}
          </T>
          <T kind="small">
            {l.count} pieces · Updated {l.updated_at.slice(0, 10)}
          </T>
          <Row>
            <Button primary onPress={() => n.navigate("Layout", { id: l.id })}>
              Open
            </Button>
            <Button
              onPress={() =>
                n.navigate("Designer", { roomId: l.room_id, layoutId: l.id })
              }
            >
              Edit
            </Button>
            <Button
              onPress={act(() => {
                db.duplicate(l);
                refresh();
              })}
            >
              Duplicate
            </Button>
            <Button
              danger
              onPress={() =>
                confirm("Delete layout?", l.layout_name, () => {
                  db.removeLayout(l.id);
                  refresh();
                })
              }
            >
              Delete
            </Button>
          </Row>
        </Card>
      ))}
      {!ls.length && (
        <Empty title={q ? "No matching layouts" : "No saved layouts"}>
          Save a design from the room editor to keep it here.
        </Empty>
      )}
    </Page>
  );
}
export function Settings() {
  const { db, refresh } = useStudio();
  return (
    <Page title="Studio settings">
      <Card>
        <T kind="section">Default measurement unit</T>
        <T kind="small">Used when creating a room.</T>
        <Choices
          options={["m", "ft"]}
          value={db.unit()}
          onChange={(u) =>
            act(() => {
              db.setUnit(u);
              refresh();
            })()
          }
        />
      </Card>
      <Card>
        <Icon name="database" />
        <T kind="section">Local storage</T>
        <T>
          Your rooms, furniture library and layouts are stored on this device.
        </T>
      </Card>
    </Page>
  );
}
