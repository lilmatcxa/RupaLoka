import React from "react";
import { View } from "react-native";

const Colors = {
    accent2: "#7C4DFF",
};

export function Glow({ size = 200, color = Colors.accent2 }) {
    return (
        <View
            style={{
                position: "absolute",
                width: size,
                height: size,
                borderRadius: size / 2,
                backgroundColor: color,
                opacity: 0.25,
                top: -40,
                right: -40,
            }}
        />
    );
}
