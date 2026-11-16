import React, { useState } from "react";
import { View } from "react-native";
import { useIsFocused } from "@react-navigation/native";
import {
  Page,
  T,
  Stat,
  Row,
  Card,
  Button,
  Field,
  colors,
  act,
} from "../components/ui";
import { stats, display, size } from "../services/geometry";
import { useStudio } from "../database/context";
import Plan from "../components/Plan";
import { dimensions } from "./Library";
export function Metrics({ room, items }) {
  const s = stats(room, items),
    area = (v) => display(v, room.unit, true) + " " + room.unit + "²";
  return (
    <>
      <Card>
        <T kind="label">Floor utilization</T>
        <T kind="title">{s.percent.toFixed(1)}%</T>
        <View
          style={{ height: 9, backgroundColor: colors.light, borderRadius: 5 }}
        >
          <View
            style={{
              height: 9,
              borderRadius: 5,
              width: Math.min(100, s.percent) + "%",
              backgroundColor: colors.green,
            }}
          />
        </View>
      </Card>
      <Row>
        <Stat label="Total floor" value={area(s.total)} />
        <Stat label="Occupied" value={area(s.occupied)} />
        <Stat label="Free floor" value={area(s.free)} />
      </Row>
      <Row>
        <Stat label="Furniture pieces" value={s.count} />
        <Stat label="Pieces overlapping" value={s.conflicts.size} />
      </Row>
    </>
  );
}
export function Calculator({ route, navigation: n }) {
  const { room, items } = route.params;
  return (
    <Page title="Space calculator" kicker={room.name} nav={n}>
      <Metrics {...{ room, items }} />
      <T kind="small">
        Occupied area counts shared floor space once. Pieces that touch at an
        edge can sit side by side.
      </T>
    </Page>
  );
}
export function Layout({ route, navigation: n }) {
  useIsFocused();
  const { db, refresh } = useStudio(),
    l = db.layouts().find((l) => l.id === route.params.id),
    [name, setName] = useState(l?.layout_name ?? "");
  if (!l) return null;
  const room = db.room(l.room_id),
    items = db.pieces(l.id);
  return (
    <Page title={l.layout_name} kicker={room.room_type} nav={n}>
      <T>
        {room.name} · {dimensions(room)} · {display(room.height, room.unit)}{" "}
        {room.unit} high
      </T>
      <Plan {...{ room, items }} openings={db.openings(room.id)} />
      <Button
        primary
        icon="edit-3"
        onPress={() =>
          n.navigate("Designer", { roomId: room.id, layoutId: l.id })
        }
      >
        Edit in designer
      </Button>
      <Metrics {...{ room, items }} />
      <T kind="section">Furniture schedule</T>
      {!items.length && <T kind="small">Empty layout</T>}
      {items.map((p) => (
        <Card key={p.id}>
          <T kind="section">{p.name}</T>
          <T>
            {size(p)
              .map((v) => display(v, room.unit))
              .join(" × ")}{" "}
            × {display(p.height, room.unit)} {room.unit}
          </T>
          <T kind="small">
            X {display(p.position_x, room.unit)} · Y{" "}
            {display(p.position_y, room.unit)} {room.unit} · {p.rotation}°
          </T>
        </Card>
      ))}
      <Field label="Layout name" value={name} onChangeText={setName} />
      <Button
        onPress={act(() => {
          db.saveLayout(room.id, l.id, name, items);
          refresh();
        })}
      >
        Save layout name
      </Button>
    </Page>
  );
}
