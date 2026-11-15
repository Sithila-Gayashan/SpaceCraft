/* React Three Fiber uses Three.js properties on its native scene elements. */
/* eslint-disable react/no-unknown-property */
import React, { useEffect, useMemo } from "react";
import { useThree } from "@react-three/fiber/native";
import { furnitureTransform, openingBounds, wallBox, wallPanels } from "../services/sceneGeometry";
import { stats } from "../services/geometry";

function Box({ position, size, color }) {
  return (
    <mesh position={position}>
      <boxGeometry args={size} />
      <meshStandardMaterial color={color} roughness={0.85} />
    </mesh>
  );
}

function Furniture({ piece, room, warning }) {
  const transform = furnitureTransform(room, piece);
  const color = warning ? "#D37464" : "#A6BEAA";
  const wood = warning ? "#D37464" : "#B69A76";
  let parts;
  switch (piece.category) {
    case "Beds":
      parts = <>
        <Box position={[0, 0.17, 0]} size={[1, 0.34, 1]} color={wood} />
        <Box position={[0, 0.45, 0.04]} size={[0.95, 0.22, 0.9]} color="#E4DCCA" />
        <Box position={[0, 0.5, -0.46]} size={[1, 1, 0.08]} color={wood} />
        <Box position={[0, 0.59, -0.27]} size={[0.7, 0.06, 0.18]} color="#FAF5EB" />
      </>;
      break;
    case "Sofas":
    case "Chairs":
      parts = <>
        <Box position={[0, 0.32, 0]} size={[0.96, 0.35, 0.94]} color={color} />
        <Box position={[0, 0.65, -0.4]} size={[1, 0.7, 0.2]} color={color} />
        <Box position={[-0.44, 0.48, 0]} size={[0.12, 0.5, 1]} color={color} />
        <Box position={[0.44, 0.48, 0]} size={[0.12, 0.5, 1]} color={color} />
      </>;
      break;
    case "Tables":
    case "Desks":
      parts = <>
        <Box position={[0, 0.95, 0]} size={[1, 0.1, 1]} color={wood} />
        {[-0.4, 0.4].flatMap(x => [-0.4, 0.4].map(z =>
          <Box key={x + ":" + z} position={[x, 0.45, z]} size={[0.08, 0.9, 0.08]} color={wood} />,
        ))}
      </>;
      break;
    case "Shelves":
      parts = <>
        {[-0.46, 0.46].map(x => <Box key={x} position={[x, 0.5, 0]} size={[0.08, 1, 1]} color={wood} />)}
        {[0.04, 0.34, 0.66, 0.96].map(y => <Box key={y} position={[0, y, 0]} size={[1, 0.08, 1]} color={wood} />)}
      </>;
      break;
    default:
      parts = <Box position={[0, 0.5, 0]} size={[1, 1, 1]} color={wood} />;
  }
  return <group position={transform.position} rotation={[0, transform.rotation, 0]} scale={transform.scale}>{parts}</group>;
}

function CameraRig({ room, orbit, aspect }) {
  const { camera, invalidate } = useThree();
  useEffect(() => {
    const radius = Math.hypot(room.width / 2, room.length / 2, room.height * 2 / 3) + 0.2;
    const vertical = camera.fov * Math.PI / 360;
    const horizontal = Math.atan(Math.tan(vertical) * aspect);
    const distance = radius / Math.sin(Math.min(vertical, horizontal)) * orbit.zoom;
    const targetY = room.height / 3;
    camera.position.set(
      distance * Math.cos(orbit.pitch) * Math.sin(orbit.yaw),
      targetY + distance * Math.sin(orbit.pitch),
      distance * Math.cos(orbit.pitch) * Math.cos(orbit.yaw),
    );
    // The renderer owns an imperative Three.js camera, updated inside this effect.
    // eslint-disable-next-line react-hooks/immutability
    camera.near = Math.max(0.005, radius / 1000);
    camera.far = distance + radius * 10;
    camera.lookAt(0, targetY, 0);
    camera.updateProjectionMatrix();
    invalidate();
  }, [camera, invalidate, room, orbit, aspect]);
  return null;
}

export default function RoomScene({ room, items, openings, walls, orbit, aspect }) {
  const conflicts = useMemo(() => stats(room, items).conflicts, [room, items]);
  const wallNames = walls === "All" ? ["North", "East", "South", "West"]
    : walls === "Cutaway" ? ["North", "West"] : [];
  return <>
    <CameraRig {...{ room, orbit, aspect }} />
    <ambientLight intensity={1.3} />
    <directionalLight position={[4, 10, 6]} intensity={2} />
    <Box position={[0, -0.05, 0]} size={[room.width, 0.1, room.length]} color={room.background_color} />
    {wallNames.flatMap(wall => wallPanels(room, openings, wall).map((panel, index) =>
      <Box key={wall + index} {...panel} color="#D6D1C4" />,
    ))}
    {openings.filter(o => wallNames.includes(o.wall)).map((opening, index) => {
      const bounds = openingBounds(room, opening);
      const box = wallBox(room, opening.wall, bounds.left, bounds.right, bounds.bottom, bounds.top);
      return <mesh key={"opening" + index} position={box.position}>
        <boxGeometry args={box.size} />
        <meshStandardMaterial color={opening.opening_type === "Door" ? "#BE915C" : "#86C4D8"}
          transparent opacity={opening.opening_type === "Door" ? 0.3 : 0.45} depthWrite={false} />
      </mesh>;
    })}
    {items.map(piece => <Furniture key={piece.id} {...{ piece, room }} warning={conflicts.has(piece.id)} />)}
  </>;
}
