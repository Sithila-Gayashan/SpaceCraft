import React from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { FadeIn } from "react-native-reanimated";
import Feather from "@expo/vector-icons/Feather";
export const colors = {
  paper: "#F6F4ED",
  ink: "#203B34",
  muted: "#596B63",
  green: "#165949",
  light: "#DFEAE0",
  line: "#D7DDD1",
  white: "#FFFDF8",
  danger: "#A44132",
};
export const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.paper },
  body: {
    padding: 20,
    gap: 16,
    paddingBottom: 42,
    width: "100%",
    maxWidth: 750,
    alignSelf: "center",
  },
  title: {
    fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
    fontSize: 34,
    color: colors.ink,
  },
  section: { fontSize: 19, fontWeight: "600", color: colors.ink },
  text: { fontSize: 15, color: colors.ink, lineHeight: 22 },
  small: { fontSize: 13, color: colors.muted, lineHeight: 19 },
  label: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.4,
    color: colors.green,
    textTransform: "uppercase",
  },
  row: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 8 },
  card: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 16,
    padding: 16,
    gap: 8,
  },
  input: {
    minHeight: 46,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 10,
    paddingHorizontal: 13,
    backgroundColor: colors.white,
    color: colors.ink,
    fontSize: 16,
  },
});
export const T = ({ children, kind = "text", style }) => (
  <Text style={[styles[kind], style]}>{children}</Text>
);
export const Icon = ({ name, size = 18, color = colors.green }) => (
  <Feather name={name} size={size} color={color} />
);
export function CustomHeader({ title, kicker, back }) {
  return (
    <Animated.View entering={FadeIn.duration(220)} style={{ gap: 6 }}>
      {back && (
        <Pressable
          accessibilityLabel="Go back"
          onPress={back}
          style={{ paddingVertical: 5 }}
        >
          <Icon name="arrow-left" />
        </Pressable>
      )}
      <T kind="label">{kicker}</T>
      <T kind="title">{title}</T>
    </Animated.View>
  );
}
export function Page({
  title,
  kicker = "SpaceCraft Studio",
  nav,
  children,
  scroll = true,
}) {
  return (
    <SafeAreaView edges={["left", "right", "top"]} style={styles.page}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          scrollEnabled={scroll}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.body}
        >
          <CustomHeader
            title={title}
            kicker={kicker}
            back={nav ? () => nav.goBack() : null}
          />
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
export function Button({
  children,
  onPress,
  icon,
  primary = false,
  danger = false,
  disabled = false,
}) {
  const ink = primary ? "white" : danger ? colors.danger : colors.green;
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => ({
        backgroundColor: primary ? colors.green : colors.white,
        opacity: disabled ? 0.4 : pressed ? 0.75 : 1,
        borderWidth: 1,
        borderColor: primary ? colors.green : colors.line,
        borderRadius: 11,
        minHeight: 44,
        paddingHorizontal: 14,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 7,
      })}
    >
      {icon && <Icon name={icon} color={ink} />}
      <Text style={{ color: ink, fontWeight: "600" }}>{children}</Text>
    </Pressable>
  );
}
export const Row = ({ children }) => <View style={styles.row}>{children}</View>;
export const Card = ({ children, style }) => (
  <View style={[styles.card, style]}>{children}</View>
);
export function Field({
  label,
  value,
  onChangeText,
  numeric = false,
  ...rest
}) {
  return (
    <View style={{ gap: 5 }}>
      <T kind="small">{label}</T>
      <TextInput
        accessibilityLabel={label}
        style={styles.input}
        value={String(value ?? "")}
        onChangeText={onChangeText}
        placeholderTextColor={colors.muted}
        keyboardType={numeric ? "decimal-pad" : "default"}
        {...rest}
      />
    </View>
  );
}
export const SearchBar = ({ value, onChangeText }) => (
  <Field
    label="Search"
    placeholder="Search by name…"
    {...{ value, onChangeText }}
  />
);
export function Choices({ options, value, onChange }) {
  return (
    <Row>
      {options.map((s) => (
        <Pressable
          key={s}
          accessibilityRole="button"
          accessibilityState={{ selected: s === value }}
          onPress={() => onChange(s)}
          style={{
            backgroundColor: s === value ? colors.green : colors.white,
            paddingHorizontal: 12,
            paddingVertical: 10,
            borderRadius: 20,
            borderWidth: 1,
            borderColor: colors.line,
          }}
        >
          <Text style={{ color: s === value ? "white" : colors.ink }}>{s}</Text>
        </Pressable>
      ))}
    </Row>
  );
}
export const Empty = ({ title, children }) => (
  <Card>
    <Icon name="layers" />
    <T kind="section">{title}</T>
    <T kind="small">{children}</T>
  </Card>
);
export const Stat = ({ label, value }) => (
  <Card style={{ flexGrow: 1, minWidth: 90 }}>
    <T kind="section">{value}</T>
    <T kind="small">{label}</T>
  </Card>
);
export const alertError = (e) =>
  Alert.alert("Unable to finish", e.message || String(e));
export const act = (fn) => () => {
  try {
    fn();
  } catch (e) {
    alertError(e);
  }
};
export const confirm = (title, message, fn) =>
  Alert.alert(title, message, [
    { text: "Cancel", style: "cancel" },
    { text: "Continue", style: "destructive", onPress: act(fn) },
  ]);
