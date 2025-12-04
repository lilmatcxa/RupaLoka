// app/(tabs)/index.tsx
import { Ionicons } from "@expo/vector-icons";
import { onValue, ref } from "firebase/database";
import React, { useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    Animated,
    Dimensions,
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";
import UMKM_IMAGES from "../../assets/umkm/UMKM_IMAGES";
import { rtdb } from "../../src/firebase";

import { Glow } from "../../components/Glow";
import GradientScreen from "../../components/GradientScreen";
import { Colors } from "../theme/colors";

const { height, width } = Dimensions.get("window");

/* =====================================================
   IMAGE HANDLER — SUPPORT imageLocal & imageUri
===================================================== */
function renderImage(item: any) {
    if (item.imageUri) return { uri: item.imageUri };
    if (item.imageLocal && UMKM_IMAGES[item.imageLocal])
        return UMKM_IMAGES[item.imageLocal];
    return UMKM_IMAGES["placeholder.jpg"];
}

export default function DiscoverCraft() {
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeFilter, setActiveFilter] = useState("all");

    const fadeAnim = useRef(new Animated.Value(0)).current;
    const fadeIn = () => {
        fadeAnim.setValue(0);
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 700,
            useNativeDriver: true,
        }).start();
    };

    /* =====================================================
       FETCH DATA — now accepts seed JSON
===================================================== */
    useEffect(() => {
        const pointsRef = ref(rtdb, "points/");
        const unsub = onValue(pointsRef, (snap) => {
            const val = snap.val();
            if (!val) {
                setItems([]);
                setLoading(false);
                return;
            }

            const parsed = Object.keys(val)
                .map((id) => ({ id, ...val[id] }))
                // FIX: gunakan imageLocal ATAU imageUri
                .filter((x) => x.imageUri || x.imageLocal);

            const shuffled = parsed.sort(() => Math.random() - 0.5);
            setItems(shuffled);
            setLoading(false);
            fadeIn();
        });

        return () => unsub();
    }, []);

    const filteredItems =
        activeFilter === "all"
            ? items
            : items.filter((item) => (item.category ?? "").toLowerCase() === activeFilter);

    /* =====================================================
       POPUP LOGIC
===================================================== */
    const [gachaItem, setGachaItem] = useState<any | null>(null);
    const popupOpacity = useRef(new Animated.Value(0)).current;
    const popupScale = useRef(new Animated.Value(0.7)).current;

    const openPopup = () => {
        popupOpacity.setValue(0);
        popupScale.setValue(0.7);

        Animated.parallel([
            Animated.timing(popupOpacity, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true,
            }),
            Animated.spring(popupScale, {
                toValue: 1,
                friction: 5,
                tension: 80,
                useNativeDriver: true,
            }),
        ]).start();
    };

    const closePopup = () => {
        Animated.timing(popupOpacity, {
            toValue: 0,
            duration: 250,
            useNativeDriver: true,
        }).start(() => setGachaItem(null));
    };

    const gacha = () => {
        if (!filteredItems.length) return;
        const pick = filteredItems[Math.floor(Math.random() * filteredItems.length)];
        setGachaItem(pick);
        openPopup();
    };

    /* =====================================================
       LOADING UI
===================================================== */
    if (loading) {
        return (
            <GradientScreen>
                <View style={styles.center}>
                    <ActivityIndicator size="large" color="#fff" />
                    <Text style={styles.loadingText}>Mengambil kerajinan inspiratif…</Text>
                </View>
            </GradientScreen>
        );
    }

    /* =====================================================
        EMPTY STATE
===================================================== */
    if (!filteredItems.length) {
        return (
            <GradientScreen>
                <Glow size={260} />

                <View style={styles.header}>
                    <Text style={styles.hi}>Hi Zidni 👋</Text>
                    <Text style={styles.question}>Lagi ingin eksplor kerajinan apa?</Text>
                </View>

                <View style={styles.filterRow}>
                    {["all", "batik", "gerabah", "perak", "kayu", "kulit", "anyaman"].map((c) => (
                        <TouchableOpacity
                            key={c}
                            onPress={() => {
                                setActiveFilter(c);
                                fadeIn();
                            }}
                            style={[
                                styles.filterBtn,
                                activeFilter === c && styles.filterActive,
                            ]}
                        >
                            <Text
                                style={[
                                    styles.filterText,
                                    activeFilter === c && styles.filterTextActive,
                                ]}
                            >
                                {c === "all" ? "Semua" : c.toUpperCase()}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <View style={[styles.center, { marginTop: 40 }]}>
                    <Ionicons name="color-palette" size={60} color="#fff" />
                    <Text style={styles.emptyTitle}>Belum ada craft ditemui ✨</Text>
                    <Text style={styles.emptyDesc}>Coba pilih kategori lain</Text>
                </View>
            </GradientScreen>
        );
    }

    /* =====================================================
       MAIN FEED UI (FYP)
===================================================== */
    return (
        <GradientScreen>
            <Glow size={260} />

            <View style={styles.header}>
                <Text style={styles.hi}>Hi Zidni 👋</Text>
                <Text style={styles.question}>Lagi ingin eksplor kerajinan apa?</Text>
            </View>

            <View style={styles.filterRow}>
                {["all", "batik", "gerabah", "perak", "kayu", "kulit", "anyaman"].map((c) => (
                    <TouchableOpacity
                        key={c}
                        onPress={() => {
                            setActiveFilter(c);
                            fadeIn();
                        }}
                        style={[
                            styles.filterBtn,
                            activeFilter === c && styles.filterActive,
                        ]}
                    >
                        <Text
                            style={[
                                styles.filterText,
                                activeFilter === c && styles.filterTextActive,
                            ]}
                        >
                            {c === "all" ? "Semua" : c.toUpperCase()}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            <Animated.FlatList
                data={filteredItems}
                pagingEnabled
                showsVerticalScrollIndicator={false}
                keyExtractor={(item) => item.id}
                style={{ opacity: fadeAnim }}
                renderItem={({ item }) => (
                    <View style={styles.card}>
                        <Image source={renderImage(item)} style={styles.bg} />

                        <View style={styles.overlay}>
                            <Text style={styles.title}>{item.name}</Text>

                            {item.description && (
                                <Text style={styles.desc}>{item.description}</Text>
                            )}

                            <View style={styles.tagBox}>
                                <Text style={styles.tag}>#{item.category}</Text>
                                <Text style={styles.tag}>#craftFYP</Text>
                            </View>
                        </View>
                    </View>
                )}
            />

            {/* POPUP */}
            {gachaItem && (
                <Animated.View style={[styles.modalOverlay, { opacity: popupOpacity }]}>
                    <Animated.View style={[styles.modalCard, { transform: [{ scale: popupScale }] }]}>
                        <Image source={renderImage(gachaItem)} style={styles.modalImage} />

                        <Text style={styles.modalTitle}>{gachaItem.name} ✨</Text>
                        <Text style={styles.modalCategory}>#{gachaItem.category}</Text>

                        {gachaItem.description && (
                            <Text style={styles.modalDesc}>{gachaItem.description}</Text>
                        )}

                        <TouchableOpacity style={styles.closeBtn} onPress={closePopup}>
                            <Text style={styles.closeBtnText}>Tutup</Text>
                        </TouchableOpacity>
                    </Animated.View>
                </Animated.View>
            )}

            <View style={styles.pulseWrapper}>
                <TouchableOpacity style={styles.gachaBtn} onPress={gacha}>
                    <Ionicons name="sparkles" size={28} color="white" />
                </TouchableOpacity>
            </View>
        </GradientScreen>
    );
}

const styles = StyleSheet.create({
    center: { flex: 1, justifyContent: "center", alignItems: "center" },

    header: { marginTop: 40, paddingHorizontal: 15 },

    hi: { color: Colors.text, fontSize: 26, fontWeight: "600" },

    question: { color: Colors.textSoft, fontSize: 18, marginTop: 4 },

    filterRow: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 10,
        marginTop: 20,
        marginBottom: 10,
        paddingHorizontal: 10,
    },

    filterBtn: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
        backgroundColor: "rgba(255,255,255,0.10)",
    },

    filterActive: {
        backgroundColor: Colors.accent,
        shadowColor: Colors.accent,
        shadowOpacity: 0.8,
        shadowRadius: 12,
    },

    filterText: { color: Colors.textSoft, fontSize: 14 },

    filterTextActive: { color: Colors.text, fontWeight: "bold" },

    card: {
        width,
        height: height - 150,
        marginTop: 10,
        borderRadius: 16,
        overflow: "hidden",
        backgroundColor: Colors.card,
    },

    bg: { width: "100%", height: "100%", resizeMode: "cover" },

    overlay: { position: "absolute", bottom: 80, left: 20, right: 20 },

    title: { color: Colors.text, fontSize: 32, fontWeight: "bold" },

    desc: { marginTop: 6, color: Colors.textSoft, fontSize: 16 },

    tagBox: { flexDirection: "row", gap: 10, marginTop: 10 },

    tag: { color: Colors.textSoft, fontSize: 14 },

    loadingText: { color: Colors.text, marginTop: 10 },

    emptyTitle: { color: Colors.text, fontSize: 22, marginTop: 10, fontWeight: "600" },

    emptyDesc: { color: Colors.textSoft, marginTop: 6 },

    modalOverlay: {
        position: "absolute",
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: "rgba(0,0,0,0.55)",
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
    },

    modalCard: {
        width: "85%",
        backgroundColor: Colors.bgSoft + "CC",
        borderRadius: 22,
        overflow: "hidden",
        borderWidth: 1,
        borderColor: Colors.accent2,
    },

    modalImage: { width: "100%", height: 200, resizeMode: "cover" },

    modalTitle: { color: Colors.text, fontSize: 26, fontWeight: "700", alignSelf: "center", marginTop: 15 },

    modalCategory: { alignSelf: "center", color: Colors.accent2, marginTop: 4, fontSize: 14 },

    modalDesc: { color: Colors.textSoft, marginTop: 12, marginHorizontal: 20, fontSize: 15, textAlign: "center" },

    closeBtn: {
        alignSelf: "center",
        marginTop: 20,
        marginBottom: 25,
        backgroundColor: Colors.accent,
        paddingVertical: 12,
        paddingHorizontal: 26,
        borderRadius: 25,
        shadowColor: Colors.accent,
        shadowOpacity: 0.8,
        shadowRadius: 15,
    },

    closeBtnText: { color: Colors.text, fontSize: 16, fontWeight: "bold" },

    pulseWrapper: { position: "absolute", bottom: 40, right: 20 },

    gachaBtn: {
        backgroundColor: Colors.accent,
        padding: 18,
        borderRadius: 50,
        shadowColor: Colors.accent,
        shadowOpacity: 0.9,
        shadowRadius: 16,
    },
});
