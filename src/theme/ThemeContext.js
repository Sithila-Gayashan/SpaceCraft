import React, { createContext, useContext } from "react";
import { useColorScheme, StatusBar } from "react-native";

const light = {
  paper: "#F6F4ED", ink: "#203B34", muted: "#596B63",
  green: "#165949", light: "#DFEAE0", line: "#D7DDD1",
  white: "#FFFDF8", danger: "#A44132", onAccent: "#FFFFFF",
};
const dark = {
  paper: "#121C19", ink: "#E6EEE7", muted: "#AFBFB4",
  green: "#91D6B9", light: "#294438", line: "#3B5146",
  white: "#1D2A24", danger: "#FFA798", onAccent: "#10291E",
};
const ThemeContext = createContext({ colors: light, isDark: false });
export const useTheme = () => useContext(ThemeContext);

export function ThemeProvider({ mode, children }) {
  const system = useColorScheme();
  const isDark = mode === "Dark" || (mode === "System" && system === "dark");
  return (
    <ThemeContext.Provider value={{ colors: isDark ? dark : light, isDark }}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      {children}
    </ThemeContext.Provider>
  );
}
