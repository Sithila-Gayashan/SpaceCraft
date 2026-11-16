import React, { useEffect, useRef, useState } from "react";
import { Alert } from "react-native";
import { usePreventRemove } from "@react-navigation/native";
import {
  Page,
  T,
  Card,
  Row,
  Button,
  Field,
  alertError,
  act,
  confirm,
} from "../components/ui";
import { useStudio } from "../database/context";
import { Browser, dimensions } from "./Library";
import Plan from "../components/Plan";
import { move, size, stats, display, place } from "../services/geometry";
export default function Designer({ route, navigation: n }) {
  const { db, refresh } = useStudio(),
    { roomId, layoutId, addId } = route.params;
  const [room] = useState(() => db.room(roomId)),
    [openings] = useState(() => db.openings(roomId)),
    [id, setLayoutId] = useState(layoutId ?? null),
    [name, setName] = useState(
      () =>
        db.layouts().find((l) => l.id === layoutId)?.layout_name ??
        room.name + " plan",
    );
  const [items, setItems] = useState(() => (layoutId ? db.pieces(layoutId) : [])),
    [selected, selectPiece] = useState(null),
    [picker, showPicker] = useState(false);
  const [past, setPast] = useState([]),
    [future, setFuture] = useState([]),
    start = useRef(null),
    current = useRef(items),
    serial = useRef(0);
  const [baseline, setBaseline] = useState(() => JSON.stringify([name, items]));
  const dirty = baseline !== JSON.stringify([name, items]);
  usePreventRemove(dirty, ({ data }) =>
    Alert.alert(
      "Discard unsaved changes?",
      "Save the layout to keep this arrangement.",
      [
        { text: "Keep editing", style: "cancel" },
        {
          text: "Discard",
          style: "destructive",
          onPress: () => n.dispatch(data.action),
        },
      ],
    ),
  );
  function set(next) {
    current.current = next;
    setItems(next);
  }
  function commit(next) {
    const previous = current.current;
    setPast((prev) => [...prev.slice(-49), previous]);
    setFuture([]);
    set(next);
  }
  function change(p) {
    commit(items.map((i) => (i.id === p.id ? p : i)));
  }
  function add(f) {
    const p = {
      ...f,
      furniture_id: f.id,
      id: "draft-" + ++serial.current,
      rotation: 0,
      position_x: 0,
      position_y: 0,
    };
    const placed = place(room, current.current, p);
    commit([...current.current, placed]);
    selectPiece(p.id);
    showPicker(false);
  }
  const initialAdd = useRef(addId);
  useEffect(() => {
    if (initialAdd.current) {
      const f = db.furniture().find((f) => f.id === initialAdd.current);
      initialAdd.current = null;
      try {
        add(f);
      } catch (e) {
        alertError(e);
      }
    }
  }); // Only add the piece requested when this editor opened.
  const piece = items.find((p) => p.id === selected),
    metrics = stats(room, items);
  function rotateSelected() {
    try {
      const rotated = { ...piece, rotation: (piece.rotation + 90) % 360 };
      change(move(room, rotated, piece.position_x, piece.position_y));
    } catch (error) {
      alertError(error);
    }
  }
  function finishDrag() {
    if (
      start.current &&
      JSON.stringify(start.current) !== JSON.stringify(current.current)
    ) {
      const previous = start.current;
      setPast((h) => [...h.slice(-49), previous]);
      setFuture([]);
    }
    start.current = null;
  }
  function save() {
    const saved = db.saveLayout(roomId, id, name, items);
    setLayoutId(saved);
    setBaseline(JSON.stringify([name, items]));
    refresh();
    Alert.alert("Layout saved", name);
  }
  return (
    <Page
      title={picker ? "Choose furniture" : "Room designer"}
      kicker={room.name}
      nav={n}
    >
      {picker ? (
        <>
          <Button onPress={() => showPicker(false)}>Return to plan</Button>
          <Browser onPick={(f) => act(() => add(f))()} />
        </>
      ) : (
        <>
          <Card>
            <Row>
              <T kind="label">Floor plan</T>
              <T kind="small">{dimensions(room)}</T>
            </Row>
            <Plan
              room={room}
              items={items}
              openings={openings}
              selected={selected}
              onStart={(p) => {
                start.current = current.current;
                selectPiece(p?.id ?? null);
              }}
              onMove={(p, x, y) => {
                const next = move(room, p, x, y);
                set(current.current.map((i) => (i.id === p.id ? next : i)));
              }}
              onEnd={finishDrag}
            />
            <T kind="small">North is up · 0.5 m grid · 0.05 m snap</T>
            <T kind="small">Doors in ochre · Windows in teal</T>
          </Card>
          {metrics.conflicts.size > 0 && (
            <T style={{ color: "#A44132" }}>
              {metrics.conflicts.size} pieces overlap. Move the outlined pieces
              to clear the warning.
            </T>
          )}
          <Button primary icon="plus" onPress={() => showPicker(true)}>
            Add furniture
          </Button>
          <Row>
            <Button
              disabled={!past.length}
              onPress={() => {
                setFuture([...future, items]);
                set(past[past.length - 1]);
                setPast(past.slice(0, -1));
              }}
            >
              Undo
            </Button>
            <Button
              disabled={!future.length}
              onPress={() => {
                setPast([...past, items]);
                set(future[future.length - 1]);
                setFuture(future.slice(0, -1));
              }}
            >
              Redo
            </Button>
            <Button
              disabled={!items.length}
              onPress={() =>
                confirm(
                  "Reset layout?",
                  "Remove all pieces from this draft.",
                  () => {
                    commit([]);
                    selectPiece(null);
                  },
                )
              }
            >
              Reset
            </Button>
          </Row>
          {piece ? (
            <Card>
              <T kind="label">Selected piece</T>
              <T kind="section">{piece.name}</T>
              <T>
                {size(piece)
                  .map((v) => display(v, room.unit))
                  .join(" × ")}{" "}
                {room.unit} · {piece.rotation}°
              </T>
              <T kind="small">
                X {display(piece.position_x, room.unit)} · Y{" "}
                {display(piece.position_y, room.unit)} {room.unit}
              </T>
              <Row>
                <Button
                  icon="rotate-cw"
                  onPress={rotateSelected}
                >
                  Rotate
                </Button>
                <Button
                  danger
                  onPress={() => {
                    commit(items.filter((p) => p.id !== selected));
                    selectPiece(null);
                  }}
                >
                  Remove
                </Button>
              </Row>
            </Card>
          ) : (
            <T kind="small">
              Touch a piece to select it. Drag it across the grid to reposition
              it.
            </T>
          )}
          {items.length > 0 && (
            <Card>
              <T kind="label">Select a piece</T>
              <Row>
                {items.map((p, i) => (
                  <Button
                    key={p.id}
                    primary={selected === p.id}
                    onPress={() => selectPiece(p.id)}
                  >
                    {i + 1} · {p.name}
                  </Button>
                ))}
              </Row>
            </Card>
          )}
          <Button
            icon="pie-chart"
            onPress={() => n.navigate("Calculator", { room, items })}
          >
            Space calculator · {metrics.percent.toFixed(1)}%
          </Button>
          <Field label="Layout name" value={name} onChangeText={setName} />
          <Button primary icon="save" onPress={act(save)}>
            Save layout
          </Button>
          {id && !dirty && (
            <Button onPress={() => n.replace("Layout", { id })}>
              View layout details
            </Button>
          )}
        </>
      )}
    </Page>
  );
}

