import React from "react";
import Svg, { Rect, Line, Circle, Text as SvgText } from "react-native-svg";
import { T, colors } from "./ui";
import { display } from "../services/geometry";
import { wallPoint } from "../services/openingPreview";

export default function OpeningPreview({ model, selected, unit, color }) {
  if (!model.roomValid) {
    return <T kind="small">Enter room dimensions between 0.1 and 100 metres to see the plan.</T>;
  }
  const { room, entries } = model;
  const scale = Math.min(220 / room.width, 150 / room.length);
  const width = room.width * scale;
  const length = room.length * scale;
  const left = (320 - width) / 2;
  const top = (230 - length) / 2;
  const point = (wall, distance) => {
    const [x, y] = wallPoint(wall, distance, room.width, room.length);
    return [left + x * scale, top + y * scale];
  };
  const active = entries[selected];
  const origin = active ? point(active.wall, 0) : null;
  const offsetEnd = active && !active.error ? point(active.wall, active.position) : null;
  return (
    <>
      <Svg width="100%" height={230} viewBox="0 0 320 230"
        accessibilityLabel="Room top view with labelled walls and opening positions">
        <Rect x={left} y={top} width={width} height={length}
          fill={color} stroke={colors.ink} strokeWidth={3} />
        <SvgText x={160} y={top - 17} textAnchor="middle" fontSize={12} fill={colors.ink}>
          North · {display(room.width, unit)} {unit}
        </SvgText>
        <SvgText x={160} y={top + length + 26} textAnchor="middle" fontSize={12} fill={colors.ink}>South</SvgText>
        <SvgText x={left - 8} y={115} textAnchor="end" fontSize={11} fill={colors.ink}>West</SvgText>
        <SvgText x={left + width + 8} y={115} fontSize={11} fill={colors.ink}>East</SvgText>
        <SvgText x={160} y={top + length / 2 + 20} textAnchor="middle" fontSize={11} fill="#203B34">
          Length {display(room.length, unit)} {unit}
        </SvgText>
        {entries.map((entry, index) => {
          if (entry.error) return null;
          const [x1, y1] = point(entry.wall, entry.position);
          const [x2, y2] = point(entry.wall, entry.position + entry.width);
          const stroke = entry.opening_type === "Door" ? "#B37332" : "#297DAD";
          return (
            <React.Fragment key={index}>
              {index === selected && <Line {...{ x1, y1, x2, y2 }} stroke={colors.green} strokeWidth={12} />}
              <Line {...{ x1, y1, x2, y2 }} stroke={stroke} strokeWidth={6} />
              <SvgText x={(x1 + x2) / 2} y={(y1 + y2) / 2 - 8}
                textAnchor="middle" fontSize={12} fontWeight="bold" fill={colors.ink}>{index + 1}</SvgText>
            </React.Fragment>
          );
        })}
        {offsetEnd && <Line x1={origin[0]} y1={origin[1]} x2={offsetEnd[0]} y2={offsetEnd[1]}
          stroke={colors.green} strokeWidth={3} strokeDasharray="4 3" />}
        {origin && <Circle cx={origin[0]} cy={origin[1]} r={5} fill={colors.green} />}
      </Svg>
      <T kind="small">Top view · Doors in brown · Windows in blue</T>
      {active && <T kind="small">
        Opening {selected + 1} · {active.wall} wall. Start at the green dot and measure
        {" "}{active.horizontal ? "left to right" : "top to bottom"}.
        {!active.error ? " Dashed offset: " + display(active.position, unit) + " " + unit + "." : ""}
      </T>}
      {entries.some(entry => entry.error) && <T kind="small" style={{ color: colors.danger }}>
        Invalid openings are hidden from the plan. Check their values below.
      </T>}
    </>
  );
}
