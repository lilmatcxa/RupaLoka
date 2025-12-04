// =============================================================
//  GMapScreen – FINAL FIXED VERSION (Hidden Gem + Popup + Image Fix)
// =============================================================

import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Location from "expo-location";
import { router, useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Animated,
    Image,
    Platform,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

import { Colors } from "../theme/colors";

// Firebase
import { get, onValue, ref } from "firebase/database";
import { rtdb } from "../../src/firebase";

// Maps component loader
let MapView: any = null;
let Marker: any = null;
let Circle: any = null;

if (Platform.OS !== "web") {
    const RNMaps = require("react-native-maps");
    MapView = RNMaps.default;
    Marker = RNMaps.Marker;
    Circle = RNMaps.Circle;
}

// =============================================================
// Helper Functions
// =============================================================

function parseCoords(coord: string) {
    if (!coord) return null;
    const [lat, lng] = coord.replace(/\s+/g, "").split(",");
    return {
        latitude: Number(lat),
        longitude: Number(lng),
    };
}

function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371e3;
    const p1 = (lat1 * Math.PI) / 180;
    const p2 = (lat2 * Math.PI) / 180;
    const dp = ((lat2 - lat1) * Math.PI) / 180;
    const dl = ((lon2 - lon1) * Math.PI) / 180;

    const a =
        Math.sin(dp / 2) ** 2 +
        Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) ** 2;

    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function systemMapTheme() {
    const hour = new Date().getHours();
    return hour >= 5 && hour <= 17 ? "default" : "dark";
}

// =============================================================
// MAIN SCREEN
// =============================================================
export default function GMapScreen() {
    const params = useLocalSearchParams();

    const [markers, setMarkers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [userLoc, setUserLoc] = useState<any>(null);

    const [filterCat, setFilterCat] = useState("all");
    const [theme, setTheme] = useState("auto");

    // Hidden gem banner
    const bannerY = useRef(new Animated.Value(-160)).current;
    const [bannerText, setBannerText] = useState("");

    // popup
    const [selectedMarker, setSelectedMarker] = useState<any>(null);

    const mapRef = useRef<any>(null);
    const [refreshing, setRefreshing] = useState(false);

    // =============================================================
    // Get user location
    // =============================================================
    useEffect(() => {
        (async () => {
            const { status } =
                await Location.requestForegroundPermissionsAsync();
            if (status !== "granted") {
                Alert.alert("Izin lokasi ditolak", "Aktifkan GPS.");
                setLoading(false);
                return;
            }

            const loc = await Location.getCurrentPositionAsync({});
            setUserLoc({
                latitude: loc.coords.latitude,
                longitude: loc.coords.longitude,
                accuracy: loc.coords.accuracy ?? 40,
            });

            setLoading(false);
        })();
    }, []);

    // =============================================================
    // Fetch markers realtime
    // =============================================================
    useEffect(() => {
        const pointsRef = ref(rtdb, "points/");
        const unsub = onValue(pointsRef, (snap) => {
            const raw = snap.val();
            if (!raw) return setMarkers([]);

            const parsed = Object.keys(raw)
                .map((id) => {
                    const p = raw[id];
                    const coords = parseCoords(p.coordinates);
                    if (!coords) return null;

                    return {
                        ...p,
                        id,
                        latitude: coords.latitude,
                        longitude: coords.longitude,
                        image:
                            p.imageUri?.startsWith("http")
                                ? p.imageUri
                                : p.imageLocal?.startsWith("http")
                                    ? p.imageLocal
                                    : "https://placehold.co/600x400?text=No+Image",
                    };
                })
                .filter(Boolean);

            setMarkers(parsed);
        });

        return () => unsub();
    }, []);

    // =============================================================
    // Manual refresh
    // =============================================================
    const fetchPointsOnce = useCallback(async () => {
        try {
            setRefreshing(true);
            const snap = await get(ref(rtdb, "points/"));
            const raw = snap.val();
            if (!raw) return setMarkers([]);

            const parsed = Object.keys(raw)
                .map((id) => {
                    const p = raw[id];
                    const coords = parseCoords(p.coordinates);
                    if (!coords) return null;

                    return {
                        ...p,
                        id,
                        latitude: coords.latitude,
                        longitude: coords.longitude,
                        image:
                            p.imageUri?.startsWith("http")
                                ? p.imageUri
                                : p.imageLocal?.startsWith("http")
                                    ? p.imageLocal
                                    : "https://placehold.co/600x400?text=No+Image",
                    };
                })
                .filter(Boolean);

            setMarkers(parsed);
        } finally {
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        if (params.refresh === "1") fetchPointsOnce();
    }, [params.refresh]);

    // =============================================================
    // Hidden gem detection (150 METER)
    // =============================================================
    useEffect(() => {
        if (!userLoc || !markers.length) return;

        const nearby = markers.filter(
            (m) =>
                getDistance(
                    userLoc.latitude,
                    userLoc.longitude,
                    m.latitude,
                    m.longitude
                ) < 150
        );

        if (nearby.length > 0) {
            const spot = nearby[0];

            const msg = `✨ Hidden Gem dekat kamu: ${spot.name}`;

            setBannerText(msg);
            setSelectedMarker(spot); // buka popup otomatis

            Alert.alert("Hidden Gem Terdeteksi!", msg);

            Animated.spring(bannerY, {
                toValue: 0,
                useNativeDriver: true,
            }).start();

            setTimeout(() => {
                Animated.timing(bannerY, {
                    toValue: -80,
                    duration: 450,
                    useNativeDriver: true,
                }).start();
            }, 5000);
        }
    }, [userLoc, markers]);

    // =============================================================
    // Loading screen
    // =============================================================
    if (loading || !userLoc) {
        return (
            <LinearGradient
                colors={[Colors.gradientStart, Colors.gradientEnd]}
                style={styles.center}
            >
                <ActivityIndicator size="large" color="#fff" />
                <Text style={{ color: "#fff", marginTop: 10 }}>
                    Memuat CraftMap…
                </Text>
            </LinearGradient>
        );
    }

    // =============================================================
    // RENDER UI
    // =============================================================
    return (
        <View style={{ flex: 1 }}>

            {/* =================== TOOLBAR =================== */}
            <View style={styles.toolbarWrapper}>
                <LinearGradient
                    colors={[Colors.bgSoft + "EE", Colors.bg + "EE"]}
                    style={styles.toolbar}
                >
                    <View style={styles.toolbarRow}>
                        {["auto", "default", "dark"].map((t) => (
                            <TouchableOpacity
                                key={t}
                                onPress={() => setTheme(t)}
                                style={[
                                    styles.toolBtn,
                                    theme === t && styles.toolBtnActive,
                                ]}
                            >
                                <Text
                                    style={[
                                        styles.toolText,
                                        theme === t && styles.toolTextActive,
                                    ]}
                                >
                                    {t.toUpperCase()}
                                </Text>
                            </TouchableOpacity>
                        ))}

                        <View style={styles.sep} />

                        {[
                            "all",
                            "batik",
                            "gerabah",
                            "perak",
                            "kayu",
                            "kulit",
                            "anyaman",
                        ].map((c) => (
                            <TouchableOpacity
                                key={c}
                                onPress={() => setFilterCat(c)}
                                style={[
                                    styles.catBtn,
                                    filterCat === c && styles.catBtnActive,
                                ]}
                            >
                                <Text
                                    style={[
                                        styles.catText,
                                        filterCat === c &&
                                        styles.catTextActive,
                                    ]}
                                >
                                    {c.toUpperCase()}
                                </Text>
                            </TouchableOpacity>
                        ))}

                        <View style={styles.sep} />

                        {/* Refresh */}
                        <TouchableOpacity onPress={fetchPointsOnce} style={styles.iconBtn}>
                            {refreshing ? (
                                <ActivityIndicator size="small" color={Colors.text} />
                            ) : (
                                <Ionicons name="refresh" size={20} color={Colors.text} />
                            )}
                        </TouchableOpacity>

                        {/* Center */}
                        <TouchableOpacity onPress={() => {
                            mapRef.current?.animateToRegion({
                                latitude: userLoc.latitude,
                                longitude: userLoc.longitude,
                                latitudeDelta: 0.008,
                                longitudeDelta: 0.008,
                            }, 400)
                        }} style={styles.iconBtn}>
                            <Ionicons name="locate" size={20} color={Colors.text} />
                        </TouchableOpacity>
                    </View>
                </LinearGradient>
            </View>

            {/* =================== BANNER =================== */}
            <Animated.View
                style={[
                    styles.banner,
                    { transform: [{ translateY: bannerY }] },
                ]}
            >
                <Text style={styles.bannerText}>{bannerText}</Text>
            </Animated.View>

            {/* =================== MAP =================== */}
            <MapView
                ref={mapRef}
                style={styles.map}
                initialRegion={{
                    latitude: -7.8995,
                    longitude: 110.331,
                    latitudeDelta: 0.008,
                    longitudeDelta: 0.008,
                }}
            >
                {/* User accuracy */}
                <Circle
                    center={userLoc}
                    radius={userLoc.accuracy}
                    strokeColor={Colors.accent + "55"}
                    fillColor={Colors.accent2 + "22"}
                />

                {/* User marker */}
                <Marker coordinate={userLoc}>
                    <View style={styles.userMarkerOuter}>
                        <View style={styles.userMarkerInner} />
                    </View>
                </Marker>

                {/* Visual radius */}
                <Circle
                    center={userLoc}
                    radius={150}
                    strokeColor={Colors.accent}
                    fillColor={Colors.accent + "11"}
                />

                {/* ALL MARKERS */}
                {markers
                    .filter((m) =>
                        filterCat === "all"
                            ? true
                            : m.category?.toLowerCase() === filterCat
                    )
                    .map((m) => (
                        <Marker
                            key={m.id}
                            coordinate={{
                                latitude: m.latitude,
                                longitude: m.longitude,
                            }}
                            onPress={() => setSelectedMarker(m)}
                        />
                    ))}
            </MapView>

            {/* =================== CUSTOM POPUP =================== */}
            {selectedMarker && (
                <View style={styles.popupOverlay}>
                    <View style={styles.popupCard}>
                        <Image
                            source={{ uri: selectedMarker.image }}
                            style={styles.popupImage}
                        />

                        <View style={{ padding: 14 }}>
                            <Text style={styles.popupTitle}>
                                {selectedMarker.name}
                            </Text>

                            <Text style={styles.popupCategory}>
                                #{selectedMarker.category}
                            </Text>

                            <Text style={styles.popupDesc}>
                                {selectedMarker.description ??
                                    "Tidak ada deskripsi."}
                            </Text>

                            <TouchableOpacity
                                onPress={() => setSelectedMarker(null)}
                                style={styles.popupCloseBtn}
                            >
                                <Text style={{ color: "#fff" }}>Tutup</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            )}

            {/* =================== FAB =================== */}
            <TouchableOpacity
                onPress={() => router.push("/forminputlocation")}
                style={styles.fab}
            >
                <Ionicons name="add" size={28} color={Colors.text} />
            </TouchableOpacity>
        </View>
    );
}

// =============================================================
// STYLES
// =============================================================
const TOOLBAR_TOP = (StatusBar.currentHeight ?? 24) + 12;

const styles = StyleSheet.create({
    center: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },

    map: {
        flex: 1,
        width: "100%",
        height: "100%",
    },

    toolbarWrapper: {
        position: "absolute",
        top: TOOLBAR_TOP,
        left: 0,
        right: 0,
        zIndex: 999,
        paddingHorizontal: 16,
    },

    toolbar: {
        width: "100%",
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 16,
        backgroundColor: Colors.bgSoft + "EE",
        borderWidth: 1,
        borderColor: Colors.accent2 + "55",
    },

    toolbarRow: {
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "center",
        gap: 8,
    },

    toolBtn: {
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 10,
        backgroundColor: Colors.card,
    },
    toolBtnActive: { backgroundColor: Colors.accent },
    toolText: { fontSize: 12, color: Colors.textSoft },
    toolTextActive: { color: Colors.text },

    catBtn: {
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 10,
        backgroundColor: Colors.bg,
    },
    catBtnActive: { backgroundColor: Colors.accent },
    catText: { fontSize: 12, color: Colors.textSoft },
    catTextActive: { color: Colors.text },

    sep: {
        width: 1,
        height: 22,
        backgroundColor: Colors.accent2 + "44",
    },
    iconBtn: {
    padding: 8,
    borderRadius: 10,
    backgroundColor: Colors.card,
    justifyContent: "center",
    alignItems: "center",
},


    banner: {
        position: "absolute",
        top: TOOLBAR_TOP + 200, // SAFE OFFSET
        left: 20,
        right: 20,
        paddingVertical: 12,
        backgroundColor: Colors.accent2,
        borderRadius: 12,
        zIndex: 998,
    },

    bannerText: {
        textAlign: "center",
        fontWeight: "700",
        color: Colors.text,
    },

    userMarkerOuter: {
        width: 34,
        height: 34,
        backgroundColor: Colors.accent2 + "77",
        borderRadius: 17,
        justifyContent: "center",
        alignItems: "center",
    },

    userMarkerInner: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: "#2F9DF7",
    },

    fab: {
        position: "absolute",
        bottom: 30,
        left: 24,
        backgroundColor: Colors.accent,
        padding: 16,
        borderRadius: 100,
        elevation: 4,
    },

    // ================= POPUP =================
    popupOverlay: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "#0008",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 9999,
    },

    popupCard: {
        width: 290,
        backgroundColor: Colors.bgSoft,
        borderRadius: 16,
        overflow: "hidden",
        borderWidth: 1,
        borderColor: Colors.accent2,
    },

    popupImage: {
        width: "100%",
        height: 160,
        backgroundColor: "#ddd",
    },

    popupTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: Colors.text,
    },

    popupCategory: {
        marginTop: 6,
        paddingVertical: 3,
        paddingHorizontal: 8,
        backgroundColor: Colors.accent,
        borderRadius: 6,
        alignSelf: "flex-start",
        color: Colors.text,
        fontSize: 12,
    },

    popupDesc: {
        marginTop: 6,
        color: Colors.textSoft,
        fontSize: 13,
        lineHeight: 18,
    },

    popupCloseBtn: {
        marginTop: 14,
        backgroundColor: Colors.accent,
        paddingVertical: 10,
        borderRadius: 8,
        alignItems: "center",
    },
});
