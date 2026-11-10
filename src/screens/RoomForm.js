import React, { useState } from "react";
import { Pressable } from "react-native";
import {
  Page,
  Card,
  T,
  Row,
  Choices,
  Field,
  Button,
  act,
  Icon,
} from "../components/ui";
import { types, walls } from "../database/repository";
import { useStudio } from "../database/context";
import { fromDisplay } from "../services/geometry";
const palette = ["#F4EEDD", "#E0EADC", "#E7E3EF", "#E5ECEF", "#F4E1D3"];
const dims = ["width", "length", "height"];
const asUnit = (n, u) =>
  String(Number((n / (u === "ft" ? 0.3048 : 1)).toFixed(9)));
export default function RoomForm({ navigation: n, route }) {
  const { db, refresh } = useStudio(),
    old = route.params?.id ? db.room(route.params.id) : null;
  const [unit, setUnit] = useState(old?.unit ?? db.unit());
  const [name, setName] = useState(old?.name ?? ""),
    [type, setType] = useState(old?.room_type ?? "Bedroom"),
    [color, setColor] = useState(old?.background_color ?? palette[0]);
  const [values, setDimensions] = useState(() =>
    Object.fromEntries(
      dims.map((d, i) => [d, asUnit(old?.[d] ?? [4, 5, 2.7][i], unit)]),
    ),
  );
  const [openings, setOpenings] = useState(() =>
    old
      ? db
          .openings(old.id)
          .map((o) => ({
            ...o,
            ...Object.fromEntries(
              ["width", "height", "position"].map((d) => [
                d,
                asUnit(o[d], unit),
              ]),
            ),
          }))
      : [],
  );
  function changeUnit(u) {
    const convert = (v) =>
      v.trim() && Number.isFinite(Number(v))
        ? asUnit(fromDisplay(v, unit), u)
        : v;
    setDimensions(Object.fromEntries(dims.map((d) => [d, convert(values[d])])));
    setOpenings(
      openings.map((o) => ({
        ...o,
        ...Object.fromEntries(
          ["width", "height", "position"].map((d) => [d, convert(o[d])]),
        ),
      })),
    );
    setUnit(u);
  }
  function save() {
    const numeric = (v) => (String(v).trim() ? fromDisplay(v, unit) : NaN);
    const id = db.saveRoom(
      {
        id: old?.id,
        name,
        room_type: type,
        unit,
        background_color: color,
        ...Object.fromEntries(dims.map((d) => [d, numeric(values[d])])),
      },
      openings.map((o) => ({
        ...o,
        ...Object.fromEntries(
          ["position", "width", "height"].map((d) => [d, numeric(o[d])]),
        ),
      })),
    );
    refresh();
    if (old) n.goBack();
    else n.replace("Room", { id });
  }
  function update(i, key, v) {
    setOpenings(openings.map((o, j) => (i === j ? { ...o, [key]: v } : o)));
  }
  return (
    <Page title={old ? "Edit room" : "New room"} nav={n}>
      <Field
        label="Room name"
        value={name}
        onChangeText={setName}
        maxLength={80}
        placeholder="e.g. Garden studio"
      />
      <T kind="label">Room type</T>
      <Choices options={types} value={type} onChange={setType} />
      <Card>
        <T kind="section">Room dimensions</T>
        <Choices options={["m", "ft"]} value={unit} onChange={changeUnit} />
        {dims.map((d) => (
          <Field
            key={d}
            numeric
            label={d.toUpperCase() + " · " + unit}
            value={values[d]}
            onChangeText={(v) => setDimensions({ ...values, [d]: v })}
          />
        ))}
      </Card>
      <T kind="label">Floor colour</T>
      <Row>
        {palette.map((c) => (
          <Pressable
            key={c}
            accessibilityLabel={"Floor colour " + c}
            onPress={() => setColor(c)}
            style={{
              backgroundColor: c,
              width: 42,
              height: 42,
              borderRadius: 21,
              alignItems: "center",
              justifyContent: "center",
              borderWidth: c === color ? 2 : 1,
              borderColor: "#698173",
            }}
          >
            {color === c && <Icon name="check" />}
          </Pressable>
        ))}
      </Row>
      <T kind="section">Doors & windows</T>
      <T kind="small">
        Measure offsets from the left on north/south walls and from the top on
        east/west walls.
      </T>
      {openings.map((o, i) => (
        <Card key={i}>
          <Choices
            options={["Door", "Window"]}
            value={o.opening_type}
            onChange={(v) => update(i, "opening_type", v)}
          />
          <Choices
            options={walls}
            value={o.wall}
            onChange={(v) => update(i, "wall", v)}
          />
          {["position", "width", "height"].map((d) => (
            <Field
              key={d}
              numeric
              label={(d === "position" ? "Wall offset" : d) + " · " + unit}
              value={o[d]}
              onChangeText={(v) => update(i, d, v)}
            />
          ))}
          <Button danger onPress={() => setOpenings(openings.filter((_, j) => i !== j))}>
            Remove opening
          </Button>
        </Card>
      ))}
      <Button
        icon="plus"
        onPress={() =>
          setOpenings([
            ...openings,
            {
              opening_type: "Door",
              wall: "North",
              position: "0",
              width: asUnit(0.85, unit),
              height: asUnit(2, unit),
            },
          ])
        }
      >
        Add opening
      </Button>
      <Button primary icon="check" onPress={act(save)}>
        Save room
      </Button>
    </Page>
  );
}
