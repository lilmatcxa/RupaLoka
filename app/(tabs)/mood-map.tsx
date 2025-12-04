// app/(tabs)/mood-map.tsx
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { router } from "expo-router";
import { get, onValue, ref, update } from "firebase/database";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Animated,
    Dimensions,
    Image,
    Linking,
    Platform,
    Pressable,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import MapView, { Circle, Marker } from "react-native-maps";
import { rtdb } from "../../src/firebase";
import { Colors } from "../theme/colors";

const { width, height } = Dimensions.get("window");

/* ============================
   TYPE
============================ */
type Point = {
    id: string;
    name?: string;
    description?: string;
    imageUri?: string | null;
    category?: string;
    coordinates?: string;
    latitude?: number;
    longitude?: number;
    mood?: string;
    createdAt?: number;
};

/* ============================
   MOOD BARU — ARTISAN CREATIVE
============================ */
const MOODS = [
    { key: "all", label: "All", color: Colors.card, emoji: "✨" },
    { key: "inspirational", label: "Inspirational", color: "#FFE45E", emoji: "💡" },
    { key: "handmade", label: "Handmade", color: "#ECA869", emoji: "✋" },
    { key: "aesthetic", label: "Aesthetic", color: "#C7EFCF", emoji: "✨" },
    { key: "heritage", label: "Heritage", color: "#D4A373", emoji: "🏺" },
    { key: "modern", label: "Modern", color: "#6FB7FF", emoji: "🎧" },
];

/* ============================
   PARSE COORDINATE
============================ */
function parseCoords(coordStr?: string | null) {
    if (!coordStr) return null;
    let cleaned = coordStr.replace(/[^\d.,\-]/g, "").replace(/\s+/g, "").trim();
    cleaned = cleaned.replace(";", ",");
    const parts = cleaned.split(",");
    if (parts.length !== 2) return null;
    const lat = Number(parts[0]);
    const lng = Number(parts[1]);
    if (Number.isNaN(lat) || Number.isNaN(lng)) return null;
    return { latitude: lat, longitude: lng };
}

/* ============================
   MAIN SCREEN
============================ */
export default function MoodMapScreen() {
    const [points, setPoints] = useState<Point[]>([]);
    const [loading, setLoading] = useState(true);
    const [userLoc, setUserLoc] = useState<{ latitude: number; longitude: number; accuracy: number } | null>(null);

    const [filterMood, setFilterMood] = useState<string>("all");

    const [selectedPoint, setSelectedPoint] = useState<Point | null>(null);
    const sheetY = useRef(new Animated.Value(height)).current;
    const sheetVisible = useRef(false);

    const confettiScale = useRef(new Animated.Value(0)).current;

    const mapRef = useRef<MapView | null>(null);
    const [refreshing, setRefreshing] = useState(false);

    /* ============================
       GET LOCATION
    ============================= */
    useEffect(() => {
        (async () => {
            try {
                const { status } = await Location.requestForegroundPermissionsAsync();
                if (status !== "granted") {
                    Alert.alert("Izin lokasi dibutuhkan", "Aktifkan izin lokasi agar fitur peta bekerja.");
                    setLoading(false);
                    return;
                }

                let loc;
                try {
                    loc = await Location.getCurrentPositionAsync({});
                } catch {
                    loc = null;
                }

                if (loc) {
                    setUserLoc({
                        latitude: loc.coords.latitude,
                        longitude: loc.coords.longitude,
                        accuracy: loc.coords.accuracy ?? 40,
                    });
                } else {
                    setUserLoc({ latitude: -7.797068, longitude: 110.370529, accuracy: 60 });
                }
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    /* ============================
       REALTIME LISTENER
    ============================= */
    useEffect(() => {
        const pointsRef = ref(rtdb, "points/");
        const unsub = onValue(pointsRef, (snap) => {
            const raw = snap.val();
            if (!raw) return setPoints([]);

            const parsed: Point[] = Object.keys(raw)
                .map((id) => {
                    const p = raw[id];
                    const coords = parseCoords(p.coordinates);
                    if (!coords) return null;
                    return {
                        id,
                        ...p,
                        latitude: coords.latitude,
                        longitude: coords.longitude,
                    } as Point;
                })
                .filter(Boolean) as Point[];

            setPoints(parsed);
        });

        return () => unsub();
    }, []);

    /* ============================
       MANUAL REFRESH
    ============================= */
    const fetchOnce = useCallback(async () => {
        try {
            setRefreshing(true);
            const snap = await get(ref(rtdb, "points/"));
            const raw = snap.val();
            if (!raw) return setPoints([]);

            const parsed: Point[] = Object.keys(raw)
                .map((id) => {
                    const p = raw[id];
                    const coords = parseCoords(p.coordinates);
                    if (!coords) return null;
                    return {
                        id,
                        ...p,
                        latitude: coords.latitude,
                        longitude: coords.longitude,
                    } as Point;
                })
                .filter(Boolean) as Point[];

            setPoints(parsed);
        } finally {
            setRefreshing(false);
        }
    }, []);

    /* ============================
       FILTER BY MOOD
    ============================= */
    const visiblePoints = useMemo(() => {
        if (filterMood === "all") return points;
        return points.filter((p) => (p.mood ?? "").toLowerCase() === filterMood);
    }, [points, filterMood]);

    /* ============================
       ANALYTICS
    ============================= */
    const analytics = useMemo(() => {
        const tally: Record<string, number> = {
            inspirational: 0,
            handmade: 0,
            aesthetic: 0,
            heritage: 0,
            modern: 0,
        };

        points.forEach((p) => {
            const mood = (p.mood ?? "").toLowerCase();
            if (tally[mood] !== undefined) tally[mood] += 1;
        });

        const entries = Object.entries(tally).sort((a, b) => b[1] - a[1]);
        const top = entries.find((e) => e[1] > 0);

        return {
            mostCommon: top ? top[0] : "none",
            mostCount: top ? top[1] : 0,
            tally,
        };
    }, [points]);

    /* ============================
       SHEET CONTROL
    ============================= */
    const openSheet = (p: Point) => {
        setSelectedPoint(p);
        sheetVisible.current = true;
        Animated.spring(sheetY, { toValue: height * 0.28, useNativeDriver: true }).start();
    };

    const closeSheet = () => {
        Animated.timing(sheetY, { toValue: height, duration: 260, useNativeDriver: true }).start(() => {
            sheetVisible.current = false;
            setSelectedPoint(null);
        });
    };

    /* ============================
       SAVE MOOD TO FIREBASE
    ============================= */
    const setMood = async (pointId: string, moodKey: string) => {
        try {
            await update(ref(rtdb, `points/${pointId}`), { mood: moodKey });

            Animated.sequence([
                Animated.timing(confettiScale, { toValue: 1.2, duration: 220, useNativeDriver: true }),
                Animated.timing(confettiScale, { toValue: 0, duration: 220, useNativeDriver: true }),
            ]).start();
        } catch (err) {
            Alert.alert("Gagal menyimpan mood", String(err));
        }
    };

    /* ============================
       LOADING SCREEN
    ============================= */
    if (loading || !userLoc) {
        return (
            <View style={[styles.center, { backgroundColor: Colors.bg }]}>
                <ActivityIndicator size="large" color={Colors.accent} />
                <Text style={{ color: Colors.textSoft, marginTop: 12 }}>Memuat MoodCraft…</Text>
            </View>
        );
    }

    /* ============================
       MAIN RENDER
    ============================= */
    return (
        <View style={styles.wrap}>

            {/* === TOOLBAR === */}
            <View style={styles.toolbarWrapper}>
                <View style={styles.toolbar}>
                    <View style={styles.toolbarRow}>

                        {/* Mood Buttons */}
                        <View style={{ flexDirection: "row", gap: 6 }}>
                            {MOODS.map((m) => (
                                <TouchableOpacity
                                    key={m.key}
                                    onPress={() => setFilterMood(m.key)}
                                    style={[
                                        styles.moodBtn,
                                        filterMood === m.key && { backgroundColor: m.color },
                                    ]}
                                >
                                    <Text
                                        style={[
                                            styles.moodBtnText,
                                            filterMood === m.key && { color: "#000" },
                                        ]}
                                    >
                                        {m.emoji}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <View style={{ width: 6 }} />

                        <TouchableOpacity onPress={fetchOnce} style={styles.iconBtn}>
                            <Ionicons name="refresh" size={18} color={Colors.text} />
                        </TouchableOpacity>

                        <TouchableOpacity onPress={() => {
                            if (!mapRef.current) return;
                            mapRef.current.animateToRegion({
                                latitude: userLoc.latitude,
                                longitude: userLoc.longitude,
                                latitudeDelta: 0.05,
                                longitudeDelta: 0.05,
                            }, 500);
                        }} style={styles.iconBtn}>
                            <Ionicons name="locate" size={18} color={Colors.text} />
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => router.push("/forminputlocation")}
                            style={styles.iconBtn}
                        >
                            <Ionicons name="add" size={18} color={Colors.text} />
                        </TouchableOpacity>
                    </View>
                </View>
            </View>

            {/* === MAP === */}
            <MapView
                ref={mapRef}
                style={styles.map}
                initialRegion={{
                    latitude: -7.8995,
                    longitude: 110.3310,
                    latitudeDelta: 0.008,
                    longitudeDelta: 0.008,
                }}
                customMapStyle={[]}
            >
                {/* user accuracy */}
                <Circle
                    center={{ latitude: userLoc.latitude, longitude: userLoc.longitude }}
                    radius={userLoc.accuracy || 40}
                    strokeColor={Colors.accent + "55"}
                    fillColor={Colors.accent2 + "22"}
                />

                {/* 200m radius */}
                <Circle
                    center={{ latitude: userLoc.latitude, longitude: userLoc.longitude }}
                    radius={200}
                    strokeColor={Colors.accent + "55"}
                    fillColor={Colors.accent2 + "18"}
                />

                {/* markers */}
                {visiblePoints.map((p) => {
                    const moodKey = (p.mood ?? "none").toLowerCase();
                    const moodDef = MOODS.find((m) => m.key === moodKey) ?? MOODS[0];

                    return (
                        <Marker
                            key={p.id}
                            coordinate={{ latitude: p.latitude!, longitude: p.longitude! }}
                            anchor={{ x: 0.5, y: 1 }}
                            onPress={() => openSheet(p)}
                        >
                            <View style={{ alignItems: "center" }}>
                                <View
                                    style={{
                                        width: 28,
                                        height: 28,
                                        backgroundColor: moodDef.color,
                                        borderRadius: 14,
                                        borderWidth: 2,
                                        borderColor: "white",
                                    }}
                                />
                                <Text style={{ fontSize: 12 }}>{moodDef.emoji}</Text>
                            </View>
                        </Marker>
                    );
                })}
            </MapView>

            {/* === ANALYTICS WIDGET === */}
            <TouchableOpacity
                style={styles.analyticsWrap}
                onPress={() => router.push("/umkm-list")}
            >
                <Text style={styles.analyticsText}>
                    {analytics.mostCommon === "none"
                        ? "Belum ada mood ditetapkan"
                        : `Top Mood: ${analytics.mostCommon.toUpperCase()} (${analytics.mostCount})`}
                </Text>
            </TouchableOpacity>

            {/* === SLIDE SHEET === */}
            <Animated.View
                style={[styles.sheet, { transform: [{ translateY: sheetY }] }]}
                pointerEvents={sheetVisible.current ? "auto" : "none"}
            >
                <View style={styles.sheetHandle} />

                {selectedPoint ? (
                    <View style={styles.sheetInner}>
                        <Image source={{ uri: selectedPoint.imageUri ?? undefined }} style={styles.sheetImage} />

                        <View style={{ paddingHorizontal: 14, paddingTop: 10 }}>
                            <Text style={styles.sheetTitle}>{selectedPoint.name}</Text>
                            <Text style={styles.sheetSmall}>{selectedPoint.description}</Text>

                            <View style={{ height: 12 }} />

                            <Text style={styles.sheetLabel}>Set Mood Kerajinan</Text>
                            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12, marginTop: 10 }}>
                                {MOODS.slice(1).map((m) => (
                                    <Pressable
                                        key={m.key}
                                        onPress={() => setMood(selectedPoint.id, m.key)}
                                        style={[styles.moodPickerBtn, { backgroundColor: m.color }]}
                                    >
                                        <Text style={styles.moodPickerEmoji}>{m.emoji}</Text>
                                        <Text style={styles.moodPickerLabel}>{m.label}</Text>
                                    </Pressable>
                                ))}
                            </View>

                            <View style={styles.sheetBtnRow}>
                                <TouchableOpacity
                                    onPress={closeSheet}
                                    style={[styles.sheetBtn, { backgroundColor: Colors.card }]}
                                >
                                    <Text style={{ color: Colors.text }}>Tutup</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    onPress={() => {
                                        const lat = selectedPoint.latitude;
                                        const lng = selectedPoint.longitude;
                                        const url =
                                            Platform.OS === "android"
                                                ? `geo:${lat},${lng}?q=${lat},${lng}`
                                                : `maps://?q=${lat},${lng}`;
                                        Linking.openURL(url).catch(() =>
                                            Alert.alert("Peta", `Koordinat: ${lat}, ${lng}`)
                                        );
                                    }}
                                    style={[styles.sheetBtn, { backgroundColor: Colors.accent }]}
                                >
                                    <Text style={{ color: Colors.text, fontWeight: "700" }}>Petunjuk</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                ) : null}
            </Animated.View>

            {/* CONFETTI */}
            <Animated.View
                pointerEvents="none"
                style={[
                    styles.confetti,
                    {
                        transform: [{ scale: confettiScale }],
                        opacity: confettiScale.interpolate({
                            inputRange: [0, 1.2],
                            outputRange: [0, 1],
                        }),
                    },
                ]}
            >
                <Text style={{ fontSize: 28 }}>🎉</Text>
            </Animated.View>

        </View>
    );
}

/* ============================
   STYLES
============================ */
const TOOLBAR_TOP = (StatusBar.currentHeight ?? 24) + 8;

const styles = StyleSheet.create({
    wrap: { flex: 1, backgroundColor: Colors.bg },

    center: { flex: 1, justifyContent: "center", alignItems: "center" },

    toolbarWrapper: {
        position: "absolute",
        top: TOOLBAR_TOP,
        left: 0,
        right: 0,
        zIndex: 999,
        paddingHorizontal: 14,
        alignItems: "center",
    },
    toolbar: {
        width: "100%",
        backgroundColor: Colors.bgSoft + "EE",
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: Colors.card,
        shadowColor: Colors.accent,
        shadowOpacity: 0.15,
        shadowRadius: 8,
    },
    toolbarRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 8,
    },

    moodBtn: {
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderRadius: 10,
        backgroundColor: Colors.card,
        borderWidth: 1,
        borderColor: Colors.accent2 + "55",
        minWidth: 40,
        alignItems: "center",
    },
    moodBtnText: { color: Colors.text, fontWeight: "700", fontSize: 16 },

    iconBtn: {
        backgroundColor: Colors.card,
        padding: 8,
        borderRadius: 10,
    },

    map: { flex: 1 },

    /* ANALYTICS */
    analyticsWrap: {
        position: "absolute",
        bottom: 26,
        left: 20,
        right: 20,
        alignItems: "center",
        zIndex: 900,
    },
    analyticsText: {
        backgroundColor: Colors.bgSoft + "DD",
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 14,
        color: Colors.textSoft,
        fontWeight: "700",
    },

    /* SHEET */
    sheet: {
        position: "absolute",
        left: 0,
        right: 0,
        height: height * 0.72,
        backgroundColor: Colors.bg,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        zIndex: 999,
        shadowColor: "#000",
        shadowOpacity: 0.2,
        shadowRadius: 18,
    },

    sheetHandle: {
        width: 60,
        height: 6,
        backgroundColor: Colors.card,
        borderRadius: 4,
        alignSelf: "center",
        marginTop: 10,
    },

    sheetInner: {
        flex: 1,
    },

    sheetImage: {
        width: "100%",
        height: 180,
        backgroundColor: Colors.card,
    },

    sheetTitle: {
        color: Colors.text,
        fontSize: 20,
        fontWeight: "800",
        marginTop: 10,
    },

    sheetSmall: {
        color: Colors.textSoft,
        marginTop: 4,
    },

    sheetLabel: {
        color: Colors.textSoft,
        fontWeight: "700",
    },

    moodPickerBtn: {
        width: 90,
        height: 90,
        borderRadius: 12,
        justifyContent: "center",
        alignItems: "center",
    },

    moodPickerEmoji: {
        fontSize: 26,
        color: "#000",
    },

    moodPickerLabel: {
        fontSize: 12,
        color: "#000",
        marginTop: 4,
        fontWeight: "700",
    },

    sheetBtnRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginTop: 20,
        marginBottom: 30,
    },

    sheetBtn: {
        paddingVertical: 12,
        paddingHorizontal: 18,
        borderRadius: 12,
        minWidth: 120,
        alignItems: "center",
    },

    confetti: {
        position: "absolute",
        bottom: 180,
        left: width / 2 - 18,
        width: 36,
        height: 36,
        alignItems: "center",
        justifyContent: "center",
        zIndex: 2000,
    },
});
