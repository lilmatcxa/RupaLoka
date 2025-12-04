// app/theme/typography.ts
import { StyleSheet } from "react-native";
import { Colors } from "./colors";

/**
 * Typography as RegisteredStyle via StyleSheet.create
 * -> ini mencegah TypeScript complain karena returning RegisteredStyle<TextStyle>
 */

export const Typography = StyleSheet.create({
  h1: {
    fontSize: 28,
    fontWeight: "900",   // string literal ok di dalam StyleSheet.create
    color: Colors.text,
    letterSpacing: 0.5,
  },
  h2: {
    fontSize: 22,
    fontWeight: "800",
    color: Colors.text,
    letterSpacing: 0.3,
  },
  h3: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.text,
  },

  body: {
    fontSize: 16,
    fontWeight: "400",
    color: Colors.text,
    lineHeight: 22,
  },

  bodySoft: {
    fontSize: 16,
    fontWeight: "400",
    color: Colors.textSoft,
    lineHeight: 22,
  },

  subtle: {
    fontSize: 14,
    fontWeight: "300",
    color: Colors.textSoft,
  },

  label: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.accent2,
  },

  badge: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.text,
  },

  sectionTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: Colors.text,
    letterSpacing: 0.3,
  },
});

export default Typography;
