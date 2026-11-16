import React, { useRef, useState } from "react";
import { View } from "react-native";
import Svg, { Rect, Line, G, Pattern, Defs, Path } from "react-native-svg";
import { usePanGesture, GestureDetector } from "react-native-gesture-handler";
import { size, stats } from "../services/geometry";
const palettes = {
  Beds: "#D7BFA4",
  Sofas: "#A5BFAD",
  Chairs: "#C8B9A2",
  Tables: "#DFBD91",
  Desks: "#D1B18C",
  Other: "#C7C7A5",
};
export function Glyph({ category, w, h, selected, warning }) {
  const stroke = warning ? "#B43B2F" : selected ? "#006B51" : "#56645B",
    fill = palettes[category] || "#C4C7B4";
  return (
    <G>
      <Rect
        x={1}
        y={1}
        width={Math.max(0.01, w - 2)}
        height={Math.max(0.01, h - 2)}
        rx={Math.min(6, w / 7, h / 7)}
        fill={fill}
        stroke={stroke}
        strokeWidth={selected || warning ? 3 : 1.4}
      />
      {category === "Beds" ? (
        <>
          <Rect
            x={w * 0.14}
            y={h * 0.07}
            width={w * 0.72}
            height={h * 0.18}
            rx={3}
            fill="#F9F0DF"
            stroke={stroke}
          />
          <Line x1={2} x2={w - 2} y1={h * 0.38} y2={h * 0.38} stroke={stroke} />
        </>
      ) : ["Sofas", "Chairs"].includes(category) ? (
        <Rect
          x={w * 0.12}
          y={h * 0.22}
          width={w * 0.76}
          height={h * 0.65}
          rx={3}
          fill="none"
          stroke={stroke}
        />
      ) : (
        <Line
          x1={w * 0.12}
          x2={w * 0.88}
          y1={h * 0.2}
          y2={h * 0.2}
          stroke={stroke}
        />
      )}
    </G>
  );
}
export function Illustration({ category }) {
  return (
    <Svg width={70} height={56} viewBox="0 0 70 56">
      <G transform="translate(6 6)">
        <Glyph category={category} w={58} h={44} />
      </G>
    </Svg>
  );
}
export default function Plan({
  room,
  items,
  openings = [],
  selected,
  onStart,
  onMove,
  onEnd,
  maxHeight = 330,
}) {
  const [available, setAvailable] = useState(300);
  const scale = Math.min(
    (available - 16) / room.width,
    (maxHeight - 16) / room.length,
  );
  const w = room.width * scale,
    h = room.length * scale,
    pad = 8;
  const conflicts = stats(room, items).conflicts;
  // Paint and hit-test the selected piece above its neighbours.
  const layers = selected == null ? items : [
    ...items.filter((p) => p.id !== selected),
    ...items.filter((p) => p.id === selected),
  ];
  const hit = useRef(null);
  const gesture = usePanGesture({
    minDistance: 0,
    runOnJS: true,
    enabled: !!onStart,
    onBegin: (e) => {
      const x = (e.x - pad) / scale,
        y = (e.y - pad) / scale;
      hit.current = [...layers].reverse().find((p) => {
        const [a, b] = size(p);
        return (
          x >= p.position_x &&
          y >= p.position_y &&
          x <= p.position_x + a &&
          y <= p.position_y + b
        );
      });
      onStart?.(hit.current);
    },
    onUpdate: (e) => {
      const p = hit.current;
      if (p)
        onMove?.(
          p,
          p.position_x + e.translationX / scale,
          p.position_y + e.translationY / scale,
        );
    },
    onFinalize: () => {
      onEnd?.();
      hit.current = null;
    },
  });
  return (
    <View
      onLayout={(e) => setAvailable(e.nativeEvent.layout.width)}
      style={{
        alignItems: "center",
        backgroundColor: "#E9EDE3",
        paddingVertical: 12,
        borderRadius: 14,
      }}
    >
      <GestureDetector gesture={gesture}>
        <View collapsable={false} style={{ width: w + 16, height: h + 16 }}>
          <Svg width={w + 16} height={h + 16}>
            <Defs>
              <Pattern
                id="grid"
                width={scale * 0.5}
                height={scale * 0.5}
                patternUnits="userSpaceOnUse"
              >
                <Path
                  d={"M 0 " + scale * 0.5 + " V 0 H " + scale * 0.5}
                  fill="none"
                  stroke="#ACBBAE"
                  strokeWidth={0.7}
                />
              </Pattern>
            </Defs>
            <G transform={"translate(" + pad + " " + pad + ")"}>
              <Rect width={w} height={h} fill={room.background_color} />
              <Rect
                width={w}
                height={h}
                fill="url(#grid)"
                stroke="#354F44"
                strokeWidth={4}
              />
              {openings.map((o, i) => {
                const horizontal = ["North", "South"].includes(o.wall),
                  x = horizontal
                    ? o.position * scale
                    : o.wall === "West"
                      ? 0
                      : w,
                  y = horizontal
                    ? o.wall === "North"
                      ? 0
                      : h
                    : o.position * scale;
                return (
                  <G key={i}>
                    <Line
                      x1={x}
                      y1={y}
                      x2={x + (horizontal ? o.width * scale : 0)}
                      y2={y + (horizontal ? 0 : o.width * scale)}
                      stroke={o.opening_type === "Door" ? "#BC864F" : "#4A9DA4"}
                      strokeWidth={6}
                    />
                  </G>
                );
              })}
              {layers.map((p) => {
                const [a, b] = size(p);
                const sw = (p.custom_width ?? p.width) * scale,
                  sh = (p.custom_length ?? p.length) * scale;
                return (
                  <G
                    key={p.id}
                    transform={
                      "translate(" +
                      (p.position_x + a / 2) * scale +
                      " " +
                      (p.position_y + b / 2) * scale +
                      ") rotate(" +
                      p.rotation +
                      ") translate(" +
                      -sw / 2 +
                      " " +
                      -sh / 2 +
                      ")"
                    }
                  >
                    <Glyph
                      w={sw}
                      h={sh}
                      category={p.category}
                      selected={selected === p.id}
                      warning={conflicts.has(p.id)}
                    />
                  </G>
                );
              })}
            </G>
          </Svg>
        </View>
      </GestureDetector>
    </View>
  );
}
