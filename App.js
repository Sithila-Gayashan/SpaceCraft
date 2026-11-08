import { GestureHandlerRootView } from "react-native-gesture-handler";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, StatusBar, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { openDatabaseAsync } from "expo-sqlite";
import { repository } from "./src/database/repository";
import { Store } from "./src/database/context";
import StudioNavigation from "./src/navigation/StudioNavigation";
import { T, Button, colors } from "./src/components/ui";
export default function App() {
  const [db, setDatabase] = useState(null),
    [error, setError] = useState(""),
    [attempt, setAttempt] = useState(0),
    [version, setVersion] = useState(0);
  useEffect(() => {
    let connection;
    let active = true;
    openDatabaseAsync("spacecraft.db").then((opened) => {
      if (!active) {
        opened.closeSync();
        return;
      }
      connection = opened;
      const repo = repository(connection);
      repo.init();
      setDatabase(repo);
      setError("");
    }).catch((e) => {
      if (active) setError(e.message);
    });
    return () => {
      active = false;
      connection?.closeSync();
    };
  }, [attempt]);
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar barStyle="dark-content" />
        {db ? (
          <Store.Provider
            value={{ db, version, refresh: () => setVersion((v) => v + 1) }}
          >
            <StudioNavigation />
          </Store.Provider>
        ) : (
          <View
            style={{
              flex: 1,
              justifyContent: "center",
              padding: 24,
              gap: 12,
              backgroundColor: colors.paper,
            }}
          >
            <T kind="title">SpaceCraft</T>
            {error ? (
              <>
                <T>Unable to open the local studio. {error}</T>
                <Button onPress={() => setAttempt(attempt + 1)}>Retry</Button>
              </>
            ) : (
              <ActivityIndicator color={colors.green} />
            )}
          </View>
        )}
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
