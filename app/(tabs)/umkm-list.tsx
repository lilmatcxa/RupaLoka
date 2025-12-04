// app/(tabs)/umkm-list.tsx
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { get, onValue, ref, remove } from "firebase/database";
import React, { useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Image,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import UMKM_IMAGES from "../../assets/umkm/UMKM_IMAGES";   // << WAJIB
import { rtdb } from "../../src/firebase";
import { Colors } from "../theme/colors";

/* =========================================
   USER ID
========================================= */
const USER_ID = "demo_user";

/* =========================================
   MOOD LABEL
========================================= */
const MOOD_LABEL: Record<string, string> = {
    inspirational: "Inspirational 💡",
    handmade: "Handmade ✋",
    aesthetic: "Aesthetic ✨",
    heritage: "Heritage 🏺",
    modern: "Modern 🎧",
};

/* =========================================
   IMAGE LOADER
========================================= */
const renderImage = (item: any) => {
    if (item.imageUri) {
        return { uri: item.imageUri };
    }
    if (item.imageLocal && UMKM_IMAGES[item.imageLocal]) {
        return UMKM_IMAGES[item.imageLocal];
    }
    return UMKM_IMAGES["placeholder.jpg"];
};

export default function UMKMList() {
    const router = useRouter();
    const [cartIds, setCartIds] = useState<string[]>([]);
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    /* =========================
       LISTEN CART NODE
    ========================= */
    useEffect(() => {
        const cartRef = ref(rtdb, `cart/${USER_ID}`);
        const unsub = onValue(cartRef, (snap) => {
            const raw = snap.val();
            setCartIds(raw ? Object.keys(raw) : []);
        });
        return () => unsub();
    }, []);

    /* =========================
       FETCH POINT DETAILS
    ========================= */
    useEffect(() => {
        let mounted = true;

        const fetchPoints = async () => {
            setLoading(true);

            if (!cartIds.length) {
                setData([]);
                setLoading(false);
                return;
            }

            const items = await Promise.all(
                cartIds.map(async (id) => {
                    const snap = await get(ref(rtdb, `points/${id}`));
                    return { id, ...(snap.val() ?? {}) };
                })
            );

            if (mounted) {
                setData(items.filter((d) => d.name));
                setLoading(false);
            }
        };

        fetchPoints();
        return () => { mounted = false };
    }, [cartIds]);

    /* =========================
       SEARCH FILTER
    ========================= */
    const filtered = useMemo(() => {
        if (!search.trim()) return data;
        return data.filter((d) =>
            (d.name ?? "").toLowerCase().includes(search.toLowerCase())
        );
    }, [data, search]);

    /* =========================
       REMOVE
    ========================= */
    const removeFromCart = (id: string) => {
        Alert.alert(
            "Hapus dari keranjang",
            "Yakin ingin menghapus item ini?",
            [
                { text: "Batal" },
                {
                    text: "Hapus",
                    style: "destructive",
                    onPress: () => remove(ref(rtdb, `cart/${USER_ID}/${id}`)),
                }
            ]
        );
    };

    /* =========================
       EDIT
    ========================= */
    const goEdit = (editId: string) => {
        router.push({
            pathname: "/forminputlocation",
            params: { editId },
        });
    };

    /* =========================
       UI
    ========================= */
    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={Colors.accent} />
                <Text style={styles.loadingText}>Memuat keranjang…</Text>
            </View>
        );
    }

    if (!filtered.length) {
        return (
            <View style={styles.emptyWrap}>
                <Ionicons name="cart" size={60} color={Colors.textSoft} />
                <Text style={styles.emptyTitle}>Keranjangmu kosong ✨</Text>
                <Text style={styles.emptySub}>Tambahkan UMKM dari Explore</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Text style={[styles.h1, { marginBottom: 8 }]}>
                Keranjangku — UMKM
            </Text>

            <View style={styles.searchBox}>
                <Ionicons name="search" size={20} color={Colors.textSoft} />
                <TextInput
                    placeholder="Cari UMKM..."
                    placeholderTextColor={Colors.textSoft}
                    value={search}
                    onChangeText={setSearch}
                    style={styles.searchInput}
                />
            </View>

            <FlatList
                data={filtered}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 50 }}
                renderItem={({ item }) => (
                    <View style={styles.card}>
                        <Image source={renderImage(item)} style={styles.image} />

                        <View style={styles.cardBody}>
                            <Text style={styles.cardTitle}>{item.name}</Text>

                            {item.description && (
                                <Text style={styles.cardDesc}>
                                    {item.description.length > 120
                                        ? item.description.slice(0, 120) + "..."
                                        : item.description}
                                </Text>
                            )}

                            <View style={styles.row}>
                                {item.category && (
                                    <View style={styles.badgeCat}>
                                        <Text style={styles.badgeCatText}>
                                            #{item.category}
                                        </Text>
                                    </View>
                                )}

                                {item.mood && item.mood !== "none" && (
                                    <View style={styles.badgeMood}>
                                        <Text style={styles.badgeMoodText}>
                                            {MOOD_LABEL[item.mood] ?? "Mood"}
                                        </Text>
                                    </View>
                                )}
                            </View>

                            <View style={{ flexDirection: "row", gap: 12, marginTop: 12 }}>
                                <TouchableOpacity
                                    style={styles.actionBtn}
                                    onPress={() => goEdit(item.id)}
                                >
                                    <Ionicons name="create" size={18} color={Colors.text} />
                                    <Text style={styles.actionText}>Edit</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[styles.actionBtn, { backgroundColor: "#E63946" }]}
                                    onPress={() => removeFromCart(item.id)}
                                >
                                    <Ionicons name="trash" size={18} color="#fff" />
                                    <Text style={[styles.actionText, { color: "#fff" }]}>
                                        Hapus
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                )}
            />
        </View>
    );
}

/* =========================================
   STYLES
========================================= */
const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
        backgroundColor: Colors.bg,
    },

    h1: {
        fontSize: 28,
        fontWeight: "900",
        color: Colors.text,
        letterSpacing: 0.5,
    },

    center: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },

    loadingText: {
        color: Colors.textSoft,
        marginTop: 10,
    },

    searchBox: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: Colors.bgSoft,
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: Colors.card,
        marginBottom: 20,
    },

    searchInput: {
        marginLeft: 10,
        flex: 1,
        color: Colors.text,
        fontSize: 16,
    },

    card: {
        backgroundColor: Colors.bgSoft,
        borderRadius: 16,
        overflow: "hidden",
        marginBottom: 20,
        borderWidth: 1,
        borderColor: Colors.card,
        elevation: 3,
    },

    image: {
        width: "100%",
        height: 160,
    },

    cardBody: {
        padding: 14,
    },

    cardTitle: {
        fontSize: 20,
        fontWeight: "800",
        color: Colors.text,
    },

    cardDesc: {
        marginTop: 6,
        color: Colors.textSoft,
    },

    row: {
        flexDirection: "row",
        gap: 10,
        marginTop: 10,
    },

    badgeCat: {
        backgroundColor: Colors.accent2 + "33",
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },

    badgeCatText: {
        color: Colors.accent2,
        fontWeight: "700",
        fontSize: 12,
    },

    badgeMood: {
        backgroundColor: Colors.accent + "22",
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },

    badgeMoodText: {
        color: Colors.accent,
        fontWeight: "700",
        fontSize: 12,
    },

    actionBtn: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        backgroundColor: Colors.accent,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 12,
    },

    actionText: {
        color: Colors.text,
        fontWeight: "700",
    },

    emptyWrap: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },

    emptyTitle: {
        color: Colors.text,
        fontSize: 22,
        marginTop: 16,
        fontWeight: "700",
        textAlign: "center",
    },

    emptySub: {
        color: Colors.textSoft,
        marginTop: 4,
        marginBottom: 20,
        textAlign: "center",
    },
});
