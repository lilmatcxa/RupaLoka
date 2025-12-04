// app/(tabs)/_layout.tsx

import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import React from "react";
import { Colors } from "../theme/colors";

function icon(name: string) {
    return (props: any) => <Ionicons name={name as any} {...props} />;
}

export default function TabsLayout() {
    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarStyle: {
                    backgroundColor: Colors.bgSoft,
                    borderTopColor: Colors.card,
                },
                tabBarActiveTintColor: Colors.accent,
                tabBarInactiveTintColor: Colors.textSoft,
            }}
        >
            {/* DISCOVER HOME */}
            <Tabs.Screen
                name="index"
                options={{
                    title: "Discover",
                    tabBarIcon: icon("sparkles"),
                }}
            />

            {/* CRAFT MAP */}
            <Tabs.Screen
                name="gmap"
                options={{
                    title: "CraftMap",
                    tabBarIcon: icon("map"),
                }}
            />

            {/* EXPLORE UMKM */}
            <Tabs.Screen
                name="explore"
                options={{
                    title: "Explore",
                    tabBarIcon: icon("search"),
                }}
            />

            {/* UMKM LIST */}
            <Tabs.Screen
                name="umkm-list"
                options={{
                    title: "UMKM",
                    tabBarIcon: icon("storefront"),
                }}
            />

            {/* MOOD MAP */}
            <Tabs.Screen
                name="mood-map"
                options={{
                    title: "MoodCraft",
                    tabBarIcon: icon("color-palette"),
                }}
            />
        </Tabs>
    );
}
