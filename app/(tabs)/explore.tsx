// app/(tabs)/explore.tsx
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { get, onValue, ref, set } from "firebase/database";
import React, { useCallback, useEffect, useState } from "react";
import {
    Alert,
    FlatList,
    Image,
    RefreshControl,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import UMKM_IMAGES from "../../assets/umkm/UMKM_IMAGES";
import { rtdb } from "../../src/firebase";
import { Colors } from "../theme/colors";

/* =========================================
   USER ID (ganti jika memakai Firebase Auth)
========================================= */
const USER_ID = "demo_user";

/* =========================================
   KATEGORI KERAJINAN
========================================= */
const categories = [
  "all",
  "batik",
  "gerabah",
  "perak",
  "kayu",
  "kulit",
  "anyaman",
];

/* =========================================
  PARSE KOORDINAT
========================================= */
function parseCoords(coordStr: string) {
  const cleaned = coordStr.replace(/\s+/g, "");
  const [lat, lng] = cleaned.split(",").map(Number);
  if (isNaN(lat) || isNaN(lng)) return null;
  return { lat, lng };
}

/* =========================================
  HITUNG JARAK
========================================= */
function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371e3;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/* =========================================
  MAIN SCREEN
========================================= */
export default function ExploreScreen() {
  const [allData, setAllData] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState("all");
  const [userLoc, setUserLoc] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);

  /* manual fetch */
  const fetchData = useCallback(async () => {
    setRefreshing(true);
    try {
      const snap = await get(ref(rtdb, "points/"));
      const raw = snap.val();

      if (!raw) setAllData([]);
      else {
        const parsed = Object.keys(raw).map((id) => ({
          id,
          ...raw[id],
        }));
        setAllData(parsed);
      }
    } finally {
      setRefreshing(false);
    }
  }, []);

  /* lokasi user + realtime listener */
  useEffect(() => {
    Location.requestForegroundPermissionsAsync().then(async ({ status }) => {
      if (status === "granted") {
        const loc = await Location.getCurrentPositionAsync({});
        setUserLoc(loc.coords);
      }
    });

    const pointsRef = ref(rtdb, "points/");
    const unsub = onValue(pointsRef, (snap) => {
      const raw = snap.val();
      if (!raw) return setAllData([]);

      const parsed = Object.keys(raw).map((id) => ({
        id,
        ...raw[id],
      }));

      setAllData(parsed);
    });

    return () => unsub();
  }, []);

  /* filtering otomatis */
  useEffect(() => {
    if (!userLoc) return;

    let temp = allData;

    // kategori
    if (selected !== "all") {
      temp = temp.filter((item) => item.category === selected);
    }

    // search
    if (search.trim()) {
      temp = temp.filter((item) =>
        item.name.toLowerCase().includes(search.toLowerCase())
      );
    }

    // koordinat valid
    temp = temp.filter((item) => {
      const coords = parseCoords(item.coordinates ?? "");
      return coords !== null;
    });

    setFiltered(temp);
  }, [search, selected, allData, userLoc]);

  /* =========================================
    ADD TO CART
  ========================================= */
  const addToCart = async (pointId: string) => {
    try {
      await set(ref(rtdb, `cart/${USER_ID}/${pointId}`), true);
      Alert.alert("Ditambahkan", "UMKM telah ditambahkan ke keranjangmu ✨");
    } catch (err: any) {
      Alert.alert("Gagal menambahkan", String(err));
    }
  };

  /* =========================================
    RENDER IMAGE (local → url → placeholder)
  ========================================= */
  const renderImage = (item: any) => {
    if (item.imageLocal && UMKM_IMAGES[item.imageLocal]) {
      return UMKM_IMAGES[item.imageLocal];
    }
    if (item.imageUri) {
      return { uri: item.imageUri };
    }
    return UMKM_IMAGES["placeholder.jpg"];
  };

  /* =========================================
    UI
  ========================================= */
  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.headerWrap}>
        <Text style={styles.h1}>Explore UMKM Kerajinan ✨</Text>

        <TouchableOpacity onPress={fetchData} style={styles.refreshBtn}>
          <Ionicons name="refresh" size={22} color={Colors.text} />
        </TouchableOpacity>
      </View>

      {/* SEARCH */}
      <View style={styles.searchBox}>
        <Ionicons name="search" size={20} color={Colors.textSoft} />
        <TextInput
          placeholder="Cari UMKM kerajinan..."
          placeholderTextColor={Colors.textSoft}
          value={search}
          onChangeText={setSearch}
          style={styles.searchInput}
        />
      </View>

      {/* CATEGORY */}
      <View style={styles.chips}>
        {categories.map((c) => (
          <TouchableOpacity
            key={c}
            onPress={() => setSelected(c)}
            style={[
              styles.chip,
              selected === c && { backgroundColor: Colors.accent },
            ]}
          >
            <Text
              style={{
                color: selected === c ? Colors.text : Colors.textSoft,
                fontWeight: "700",
              }}
            >
              {c.toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* LIST */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={fetchData} />
        }
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => {
          const coords = parseCoords(item.coordinates);
          let dist = 0;
          if (coords && userLoc) {
            dist = getDistance(
              userLoc.latitude,
              userLoc.longitude,
              coords.lat,
              coords.lng
            );
          }

          return (
            <View style={styles.card}>
              <Image source={renderImage(item)} style={styles.image} />

              <View style={styles.cardContent}>
                <Text style={styles.title}>{item.name}</Text>

                <Text style={styles.desc}>
                  {item.description
                    ? item.description.slice(0, 120)
                    : "Tidak ada deskripsi."}
                </Text>

                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginTop: 12,
                  }}
                >
                  <Text style={styles.distance}>
                    {dist ? `${(dist / 1000).toFixed(2)} km dari kamu` : ""}
                  </Text>

                  <TouchableOpacity
                    onPress={() => addToCart(item.id)}
                    style={styles.cartBtn}
                  >
                    <Ionicons name="cart" size={18} color={Colors.text} />
                    <Text style={styles.cartBtnText}>Tambah</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          );
        }}
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
    backgroundColor: Colors.bg,
    paddingHorizontal: 16,
    paddingTop: 16,
  },

  h1: {
    fontSize: 28,
    fontWeight: "900",
    color: Colors.text,
    letterSpacing: 0.5,
  },

  headerWrap: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },

  refreshBtn: {
    padding: 10,
    backgroundColor: Colors.card,
    borderRadius: 12,
  },

  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.bgSoft,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.card,
  },

  searchInput: {
    marginLeft: 10,
    color: Colors.text,
    flex: 1,
    fontSize: 16,
  },

  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 16,
  },

  chip: {
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 20,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.accent + "33",
  },

  card: {
    backgroundColor: Colors.bgSoft,
    marginBottom: 20,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: Colors.accent,
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
  },

  image: {
    width: "100%",
    height: 180,
  },

  cardContent: {
    padding: 14,
  },

  title: {
    fontSize: 20,
    fontWeight: "800",
    color: Colors.text,
  },

  desc: {
    color: Colors.textSoft,
    marginTop: 8,
  },

  distance: {
    color: Colors.accent2,
    fontWeight: "700",
  },

  cartBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.accent,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    gap: 8,
    shadowColor: Colors.accent,
    shadowOpacity: 0.5,
    shadowRadius: 10,
  },

  cartBtnText: {
    color: Colors.text,
    fontWeight: "700",
    marginLeft: 6,
  },
});

