/* The Canvas color element uses Three.js attachment properties. */
/* eslint-disable react/no-unknown-property */
import React, { useRef, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Canvas } from "@react-three/fiber";
import { GestureDetector, usePanGesture, usePinchGesture } from "react-native-gesture-handler";
import { useIsFocused } from "@react-navigation/native";
import { Button, Choices, CustomHeader, Row, T } from "../components/ui";
import RoomScene from "../components/RoomScene";
import { useTheme } from "../theme/ThemeContext";

const initialOrbit = { yaw: Math.PI / 4, pitch: 0.65, zoom: 1.15 };
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

class SceneBoundary extends React.Component {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    if (this.state.failed) return <View style={{ padding: 24, gap: 12 }}>
      <T>3D could not start on this device. Return to your plan or retry the preview.</T>
      <Button onPress={this.props.retry}>Retry 3D</Button>
    </View>;
    return this.props.children;
  }
}

export default function Room3D({ route, navigation }) {
  const { room, items, openings } = route.params;
  const { colors } = useTheme();
  const focused = useIsFocused();
  const [orbit, setOrbit] = useState(initialOrbit);
  const [walls, setWalls] = useState("Cutaway");
  const [aspect, setAspect] = useState(1);
  const [ready, setReady] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const panStart = useRef(initialOrbit);
  const zoomStart = useRef(1);
  const pan = usePanGesture({
    runOnJS: true, maxPointers: 1,
    onBegin: () => { panStart.current = orbit; },
    onUpdate: event => setOrbit(current => ({
      ...current,
      yaw: panStart.current.yaw - event.translationX * 0.008,
      pitch: clamp(panStart.current.pitch + event.translationY * 0.006, 0.12, 1.5),
    })),
  });
  const pinch = usePinchGesture({
    runOnJS: true, simultaneousWith: pan,
    onBegin: () => { zoomStart.current = orbit.zoom; },
    onUpdate: event => setOrbit(current => ({
      ...current, zoom: clamp(zoomStart.current / event.scale, 0.5, 3),
    })),
  });
  return <SafeAreaView style={{ flex: 1, backgroundColor: colors.paper }}>
    <View style={{ padding: 16, gap: 8 }}>
      <CustomHeader title="3D room preview" kicker={room.name} back={() => navigation.goBack()} />
      <T kind="small">Drag to orbit · Pinch to zoom</T>
      <T kind="label">Walls</T>
      <Choices options={["Cutaway", "All", "Hidden"]} value={walls} onChange={setWalls} />
    </View>
    <GestureDetector gesture={pan}>
      <View collapsable={false} style={{ flex: 1, minHeight: 150 }}
        onLayout={event => setAspect(event.nativeEvent.layout.width / Math.max(1, event.nativeEvent.layout.height))}>
        <GestureDetector gesture={pinch}>
          <View collapsable={false} style={{ flex: 1 }}>
            <SceneBoundary key={attempt} retry={() => { setReady(false); setAttempt(value => value + 1); }}>
              {focused && <Canvas frameloop="demand" camera={{ fov: 45 }}
                gl={{ antialias: true, alpha: false }} onCreated={() => setReady(true)}>
                <color attach="background" args={[colors.paper]} />
                <RoomScene {...{ room, items, openings, walls, orbit, aspect }} />
              </Canvas>}
              {!ready && <View pointerEvents="none" style={{ position: "absolute", top: "45%", alignSelf: "center" }}>
                <ActivityIndicator color={colors.green} />
              </View>}
            </SceneBoundary>
          </View>
        </GestureDetector>
      </View>
    </GestureDetector>
    <View style={{ padding: 16, gap: 8 }}>
      <Row>
        <Button icon="zoom-in" onPress={() => setOrbit(current => ({ ...current, zoom: clamp(current.zoom / 1.2, 0.5, 3) }))}>Zoom in</Button>
        <Button icon="zoom-out" onPress={() => setOrbit(current => ({ ...current, zoom: clamp(current.zoom * 1.2, 0.5, 3) }))}>Zoom out</Button>
        <Button onPress={() => { setOrbit(initialOrbit); setWalls("Cutaway"); }}>Reset view</Button>
      </Row>
      <T kind="small">Furniture uses simplified shapes at its saved dimensions. Windows use a 0.9 m sill, lowered for taller windows. Edit the arrangement in the 2D designer.</T>
    </View>
  </SafeAreaView>;
}
