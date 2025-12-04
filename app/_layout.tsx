// app/_layout.tsx
import React from "react";
import { Slot } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { View, StatusBar } from "react-native";
import { Colors } from "./theme/colors";

export default function RootLayout() {
    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <SafeAreaProvider>

                {/* Status bar dengan tema artisan */}
                <StatusBar
                    barStyle="light-content"
                    backgroundColor={Colors.bg}
                />

                {/* Semua screen di bawah folder /app akan dirender di sini */}
                <View style={{ flex: 1, backgroundColor: Colors.bg }}>
                    <Slot />
                </View>

            </SafeAreaProvider>
        </GestureHandlerRootView>
    );
}
