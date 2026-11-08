import React from "react";
import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import {
  Home,
  Rooms,
  Room,
  Furniture,
  FurnitureDetails,
  Saved,
  Settings,
} from "../screens/Library";
import RoomForm from "../screens/RoomForm";
import Designer from "../screens/Designer";
import { Calculator, Layout } from "../screens/Analysis";
import { colors, Icon } from "../components/ui";
const Stack = createNativeStackNavigator(),
  Tab = createBottomTabNavigator();
const tabs = [
  ["Home", Home, "home"],
  ["Rooms", Rooms, "box"],
  ["Furniture", Furniture, "grid"],
  ["Saved Layouts", Saved, "folder"],
  ["Settings", Settings, "sliders"],
];
function BottomNavigation() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.green,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: { backgroundColor: colors.white },
        tabBarHideOnKeyboard: true,
      }}
    >
      {tabs.map(([name, component, icon]) => (
        <Tab.Screen
          key={name}
          {...{ name, component }}
          options={{
            tabBarLabel: name === "Saved Layouts" ? "Layouts" : name,
            tabBarIcon: ({ color }) => (
              <Icon name={icon} color={color} size={21} />
            ),
          }}
        />
      ))}
    </Tab.Navigator>
  );
}
export default function StudioNavigation() {
  return (
    <NavigationContainer
      theme={{
        ...DefaultTheme,
        colors: {
          ...DefaultTheme.colors,
          background: colors.paper,
          primary: colors.green,
        },
      }}
    >
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {Object.entries({
          Studio: BottomNavigation,
          RoomForm,
          Room,
          FurnitureDetails,
          Designer,
          Calculator,
          Layout,
        }).map(([name, component]) => (
          <Stack.Screen key={name} {...{ name, component }} />
        ))}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
