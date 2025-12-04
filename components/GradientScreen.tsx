import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { StyleSheet } from "react-native";
import { Colors } from "../app/theme/colors"; // sesuaikan path jika beda

export default function GradientScreen({ children }: React.PropsWithChildren<{}>) {
    return (
        <LinearGradient
            colors={[Colors.gradientStart, Colors.gradientEnd]}
            style={styles.container}
        >
            {children}
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20 },
});
