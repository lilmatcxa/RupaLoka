import { UMKM_IMAGES } from "../../assets/umkm/UMKM_IMAGES";
// =============================================================
//  GMapScreen – FINAL (Theme fixed, Popup image fixed, Favorites)
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

import AsyncStorage from "@react-native-async-storage/async-storage";

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

/* -----------------------------
   Map style presets
------------------------------*/
const defaultMapStyle: any[] = []; // keep default (empty)
const darkMapStyle: any[] = [
    { elementType: "geometry", stylers: [{ color: "#0d2030" }] },
    { elementType: "labels.text.fill", stylers: [{ color: Colors.text }] },
    {
        featureType: "road",
        elementType: "geometry",
        stylers: [{ color: "#163244" }],
    },
    {
        featureType: "poi",
        elementType: "geometry",
        stylers: [{ color: "#0f2a36" }],
    },
    {
        featureType: "water",
        elementType: "geometry.fill",
        stylers: [{ color: "#062f36" }],
    },
];

/* -----------------------------
   Helpers
------------------------------*/
function parseCoords(coord: string | null | undefined) {
    if (!coord) return null;
    const cleaned = coord.replace(/\s+/g, "");
    const parts = cleaned.split(",");
    if (parts.length !== 2) return null;
    const lat = Number(parts[0]);
    const lng = Number(parts[1]);
    if (Number.isNaN(lat) || Number.isNaN(lng)) return null;
    return { latitude: lat, longitude: lng };
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
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

function systemMapTheme(): "default" | "dark" {
    const hour = new Date().getHours();
    return hour >= 5 && hour <= 17 ? "default" : "dark";
}

/* -----------------------------
   Image source resolver
   Tries (in order):
   1. imageUri (http or data)
   2. imageLocal if it's a URL
   3. require('../../assets/umkm/<imageLocal>') if filename provided
   4. fallback placeholder URL
------------------------------*/
function resolveImageSource(marker: any) {
     const placeholder = "https://placehold.co/600x400?text=No+Image";

    // 1. If imageUri is valid URL
    if (marker?.imageUri && marker.imageUri.startsWith("http")) {
        return { uri: marker.imageUri };
    }

    // 2. If imageLocal is a URL
    if (marker?.imageLocal && marker.imageLocal.startsWith("http")) {
        return { uri: marker.imageLocal };
    }

    // 3. If imageLocal refers to local asset name
    if (marker?.imageLocal && UMKM_IMAGES[marker.imageLocal]) {
        return UMKM_IMAGES[marker.imageLocal];
    }

    // 4. Fallback
    return { uri: placeholder };
}

/* ===========================================================
   MAIN SCREEN
=========================================================== */
export default function GMapScreen() {
    const params = useLocalSearchParams();

    const [markers, setMarkers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [userLoc, setUserLoc] = useState<any>(null);

    const [filterCat, setFilterCat] = useState<
        "all" | string
    >("all");

    const [theme, setTheme] = useState<"auto" | "default" | "dark">(
        "auto"
    );

    // Banner animation
    const bannerY = useRef(new Animated.Value(-220)).current;
    const bannerOpacity = useRef(new Animated.Value(0)).current;
    const [bannerText, setBannerText] = useState("");

    // popup
    const [selectedMarker, setSelectedMarker] = useState<any>(null);

    // favorites (ids)
    const [favorites, setFavorites] = useState<string[]>([]);

    const mapRef = useRef<any>(null);
    const [refreshing, setRefreshing] = useState(false);

    /* -----------------------------
       Load favorites from AsyncStorage
    ------------------------------*/
    useEffect(() => {
        (async () => {
            try {
                const raw = await AsyncStorage.getItem("rupaloka_favs");
                if (raw) setFavorites(JSON.parse(raw));
            } catch (e) {
                // ignore
            }
        })();
    }, []);

    const saveFavorites = async (next: string[]) => {
        try {
            await AsyncStorage.setItem("rupaloka_favs", JSON.stringify(next));
        } catch (e) {
            // ignore
        }
    };

    const toggleFavorite = (id: string) => {
        const exists = favorites.includes(id);
        const next = exists
            ? favorites.filter((f) => f !== id)
            : [...favorites, id];
        setFavorites(next);
        saveFavorites(next);
    };

    /* -----------------------------
       Get user location
    ------------------------------*/
    useEffect(() => {
        (async () => {
            const { status } =
                await Location.requestForegroundPermissionsAsync();
            if (status !== "granted") {
                Alert.alert(
                    "Izin lokasi ditolak",
                    "Aktifkan izin lokasi untuk CraftMap."
                );
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

    /* -----------------------------
       Real-time fetch markers
    ------------------------------*/
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
                        // keep original fields for resolver
                        imageUri: p.imageUri ?? null,
                        imageLocal: p.imageLocal ?? null,
                    };
                })
                .filter(Boolean) as any[];

            setMarkers(parsed);
        });

        return () => unsub();
    }, []);

    /* -----------------------------
       Manual Refresh
    ------------------------------*/
    const fetchPointsOnce = useCallback(async () => {
        try {
            setRefreshing(true);
            const snap = await get(ref(rtdb, "points/"));
            const raw = snap.val();
            if (!raw) {
                setMarkers([]);
                return;
            }

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
                        imageUri: p.imageUri ?? null,
                        imageLocal: p.imageLocal ?? null,
                    };
                })
                .filter(Boolean) as any[];

            setMarkers(parsed);
        } finally {
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        if (params.refresh === "1") fetchPointsOnce();
    }, [params.refresh]);

    /* -----------------------------
       Hidden gem detection (150 METER)
    ------------------------------*/
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

            // show animated banner (fade + slide)
            Animated.parallel([
                Animated.spring(bannerY, {
                    toValue: 0,
                    friction: 7,
                    tension: 60,
                    useNativeDriver: true,
                }),
                Animated.timing(bannerOpacity, {
                    toValue: 1,
                    duration: 280,
                    useNativeDriver: true,
                }),
            ]).start();

            const hideTimer = setTimeout(() => {
                Animated.parallel([
                    Animated.timing(bannerY, {
                        toValue: -220,
                        duration: 380,
                        useNativeDriver: true,
                    }),
                    Animated.timing(bannerOpacity, {
                        toValue: 0,
                        duration: 280,
                        useNativeDriver: true,
                    }),
                ]).start();
            }, 5000);

            return () => clearTimeout(hideTimer);
        }
    }, [userLoc, markers]);

    /* -----------------------------
       Theme handling: appliedTheme and mapStyle
    ------------------------------*/
    const appliedTheme = theme === "auto" ? systemMapTheme() : theme;
    const mapStyle = appliedTheme === "dark" ? darkMapStyle : defaultMapStyle;

    /* -----------------------------
       Filter markers
    ------------------------------*/
    const filteredMarkers = markers.filter((m) => {
        if (filterCat === "all") return true;
        const cat = (m.category ?? "").toString().trim().toLowerCase();
        return cat === filterCat;
    });

    /* -----------------------------
       Center map to user
    ------------------------------*/
    const centerToMe = () => {
        if (!userLoc || !mapRef.current) return;
        mapRef.current.animateToRegion(
            {
                latitude: userLoc.latitude,
                longitude: userLoc.longitude,
                latitudeDelta: 0.04,
                longitudeDelta: 0.04,
            },
            500
        );
    };

    /* -----------------------------
       Loading screen
    ------------------------------*/
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

    /* ===========================================================
       RENDER UI
    ============================================================ */
    return (
        <View style={{ flex: 1 }}>
            {/* Toolbar */}
            <View style={styles.toolbarWrapper}>
                <LinearGradient
                    colors={[Colors.bgSoft + "EE", Colors.bg + "F2"]}
                    style={styles.toolbar}
                >
                    <View style={styles.toolbarRow}>
                        <TouchableOpacity
                            onPress={() => setTheme("auto")}
                            style={[styles.toolBtn, theme === "auto" && styles.toolBtnActive]}
                        >
                            <Text style={[styles.toolText, theme === "auto" && styles.toolTextActive]}>
                                Auto
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => setTheme("default")}
                            style={[styles.toolBtn, theme === "default" && styles.toolBtnActive]}
                        >
                            <Text style={[styles.toolText, theme === "default" && styles.toolTextActive]}>
                                Default
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => setTheme("dark")}
                            style={[styles.toolBtn, theme === "dark" && styles.toolBtnActive]}
                        >
                            <Text style={[styles.toolText, theme === "dark" && styles.toolTextActive]}>
                                Dark
                            </Text>
                        </TouchableOpacity>

                        <View style={styles.sep} />

                        {/* Craft Categories */}
                        {["all", "batik", "gerabah", "perak", "kayu", "kulit", "anyaman"].map(
                            (c) => (
                                <TouchableOpacity
                                    key={c}
                                    onPress={() => setFilterCat(c as any)}
                                    style={[
                                        styles.catBtn,
                                        filterCat === c && styles.catBtnActive,
                                    ]}
                                >
                                    <Text
                                        style={[
                                            styles.catText,
                                            filterCat === c && styles.catTextActive,
                                        ]}
                                    >
                                        {c.toUpperCase()}
                                    </Text>
                                </TouchableOpacity>
                            )
                        )}

                        <View style={styles.sep} />

                        <TouchableOpacity onPress={fetchPointsOnce} style={styles.iconBtn}>
                            {refreshing ? (
                                <ActivityIndicator size="small" color={Colors.text} />
                            ) : (
                                <Ionicons
                                    name="refresh"
                                    size={20}
                                    color={Colors.text}
                                />
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity onPress={centerToMe} style={styles.iconBtn}>
                            <Ionicons name="locate" size={20} color={Colors.text} />
                        </TouchableOpacity>
                    </View>
                </LinearGradient>
            </View>

            {/* Banner */}
            <Animated.View
                pointerEvents="none"
                style={[
                    styles.banner,
                    { transform: [{ translateY: bannerY }], opacity: bannerOpacity },
                ]}
            >
                <Text style={styles.bannerText}>{bannerText}</Text>
            </Animated.View>

            {/* Map */}
            <MapView
                ref={mapRef}
                style={styles.map}
                customMapStyle={mapStyle}
                initialRegion={{
                    latitude: -7.8995,
                    longitude: 110.3310,
                    latitudeDelta: 0.008,
                    longitudeDelta: 0.008,
                }}
            >
                {/* Accuracy circle */}
                {userLoc && (
                    <Circle
                        center={{
                            latitude: userLoc.latitude,
                            longitude: userLoc.longitude,
                        }}
                        radius={userLoc.accuracy || 40}
                        strokeColor={Colors.accent + "55"}
                        fillColor={Colors.accent2 + "22"}
                    />
                )}

                {/* User marker */}
                <Marker
                    coordinate={{
                        latitude: userLoc.latitude,
                        longitude: userLoc.longitude,
                    }}
                >
                    <View style={styles.userMarkerOuter}>
                        <View style={styles.userMarkerInner} />
                    </View>
                </Marker>

                {/* 150 meter radius */}
                <Circle
                    center={{
                        latitude: userLoc.latitude,
                        longitude: userLoc.longitude,
                    }}
                    radius={150}
                    strokeColor={Colors.accent + "88"}
                    fillColor={Colors.accent2 + "18"}
                />

                {/* All craft markers */}
                {filteredMarkers.map((m) => (
                    <Marker
                        key={m.id}
                        coordinate={{ latitude: m.latitude, longitude: m.longitude }}
                        anchor={{ x: 0.5, y: 1 }}
                        tracksViewChanges={false}
                        onPress={() => setSelectedMarker(m)}
                    />
                ))}
            </MapView>

            {/* Popup */}
            {selectedMarker && (
                <View style={styles.popupOverlay}>
                    <View style={styles.popupCard}>
                        <Image
                            source={resolveImageSource(selectedMarker)}
                            style={styles.popupImage}
                            resizeMode="cover"
                        />

                        <View style={{ padding: 14 }}>
                            <Text style={styles.popupTitle}>
                                {selectedMarker.name}
                            </Text>

                            <Text style={styles.popupCategory}>
                                #{selectedMarker.category}
                            </Text>

                            <Text style={styles.popupDesc}>
                                {selectedMarker.description ?? "Tidak ada deskripsi."}
                            </Text>

                            <View style={{ flexDirection: "row", gap: 10, marginTop: 12 }}>
                                <TouchableOpacity
                                    onPress={() => {
                                        toggleFavorite(selectedMarker.id);
                                    }}
                                    style={[
                                        styles.popupActionBtn,
                                        favorites.includes(selectedMarker.id) && styles.popupActionBtnActive,
                                    ]}
                                >
                                    <Ionicons
                                        name={favorites.includes(selectedMarker.id) ? "heart" : "heart-outline"}
                                        size={18}
                                        color={favorites.includes(selectedMarker.id) ? "#fff" : Colors.text}
                                    />
                                    <Text style={[
                                        styles.popupActionText,
                                        favorites.includes(selectedMarker.id) && { color: "#fff" }
                                    ]}>
                                        {favorites.includes(selectedMarker.id) ? "Favorit" : "Tambahkan"}
                                    </Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    onPress={() => setSelectedMarker(null)}
                                    style={[styles.popupActionBtn, { backgroundColor: Colors.bg }]}
                                >
                                    <Text style={{ color: Colors.text }}>Tutup</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </View>
            )}

            {/* FAB */}
            <TouchableOpacity
                onPress={() => router.push("/forminputlocation")}
                style={styles.fab}
            >
                <Ionicons name="add" size={28} color={Colors.text} />
            </TouchableOpacity>
        </View>
    );
}

/* =====================================================
   Styles
=====================================================*/
const TOOLBAR_TOP = (StatusBar.currentHeight ?? 24) + 12;

const styles = StyleSheet.create({
    center: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: Colors.bg,
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
        alignItems: "center",
    },

    toolbar: {
        width: "100%",
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: Colors.accent2 + "55",
        backgroundColor: Colors.bgSoft + "F0",
        shadowColor: Colors.accent,
        shadowOpacity: 0.2,
        shadowRadius: 10,
    },

    toolbarRow: {
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "center",
        alignItems: "center",
        gap: 8,
    },

    toolBtn: {
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 10,
        backgroundColor: Colors.card,
        borderWidth: 1,
        borderColor: Colors.accent + "33",
    },
    toolBtnActive: {
        backgroundColor: Colors.accent,
    },
    toolText: {
        color: Colors.textSoft,
        fontSize: 12,
        fontWeight: "700",
    },
    toolTextActive: {
        color: Colors.text,
    },

    /* Category Buttons */
    catBtn: {
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 10,
        backgroundColor: Colors.bg,
        borderWidth: 1,
        borderColor: Colors.accent2 + "55",
    },
    catBtnActive: {
        backgroundColor: Colors.accent,
    },
    catText: {
        color: Colors.textSoft,
        fontSize: 12,
        fontWeight: "700",
    },
    catTextActive: {
        color: Colors.text,
    },

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

    /* Banner */
    banner: {
        position: "absolute",
        top: TOOLBAR_TOP + 95,
        left: 20,
        right: 20,
        backgroundColor: Colors.accent2,
        paddingVertical: 12,
        borderRadius: 14,
        zIndex: 1001,
        shadowColor: "#000",
        shadowOpacity: 0.18,
        shadowOffset: { width: 0, height: 6 },
        shadowRadius: 12,
        elevation: 10,
    },

    bannerText: {
        color: Colors.text,
        textAlign: "center",
        fontWeight: "700",
        fontSize: 15,
    },

    /* Popup */
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
        width: 300,
        backgroundColor: Colors.bgSoft + "EE",
        borderRadius: 16,
        overflow: "hidden",
        borderWidth: 1,
        borderColor: Colors.accent2 + "55",
    },
    popupImage: {
        width: "100%",
        height: 160,
        backgroundColor: "#ddd",
    },
    popupTitle: {
        color: Colors.text,
        fontSize: 17,
        fontWeight: "700",
    },
    popupCategory: {
        backgroundColor: Colors.accent,
        color: Colors.text,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        marginTop: 6,
        alignSelf: "flex-start",
        fontSize: 12,
    },
    popupDesc: {
        color: Colors.textSoft,
        marginTop: 6,
        fontSize: 13,
    },

    popupActionBtn: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 8,
        backgroundColor: Colors.card,
    },
    popupActionBtnActive: {
        backgroundColor: Colors.accent,
    },
    popupActionText: {
        color: Colors.text,
        fontWeight: "700",
    },

    /* USER MARKER */
    userMarkerOuter: {
        width: 36,
        height: 36,
        backgroundColor: Colors.accent2 + "77",
        borderRadius: 18,
        justifyContent: "center",
        alignItems: "center",
        borderWidth: 2,
        borderColor: Colors.text,
    },
    userMarkerInner: {
        width: 14,
        height: 14,
        backgroundColor: "#2F9DF7",
        borderRadius: 7,
        borderWidth: 2,
        borderColor: "#fff",
    },

    /* FAB */
    fab: {
        position: "absolute",
        bottom: 30,
        left: 24,
        backgroundColor: Colors.accent,
        padding: 16,
        borderRadius: 999,
        shadowColor: Colors.accent,
        shadowOpacity: 0.4,
        shadowRadius: 14,
    },
});
