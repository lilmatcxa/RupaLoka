// app/forminputlocation.tsx
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { router, useLocalSearchParams } from "expo-router";
import { push, ref, get as rtdbGet, set as rtdbSet } from "firebase/database";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { rtdb } from "../src/firebase";
import { Colors } from "./theme/colors";

/* =========================================
   TYPOGRAPHY
========================================= */
const Typography = {
  h1: { fontSize: 28, fontWeight: "900", color: Colors.text },
  body: { fontSize: 16, color: Colors.text },
  subtle: { fontSize: 14, color: Colors.textSoft },
};

export default function FormInputLocation() {
  const params = useLocalSearchParams();
  const editId = (params.editId as string) || null;

  /* ------------------------------------------
     STATE
  -------------------------------------------*/
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [category, setCategory] = useState("batik");
  const [imageUri, setImageUri] = useState<string | null>(null);

  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");

  const [loading, setLoading] = useState(false);

  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (!editId) return;

    // load data for edit
    (async () => {
      setLoading(true);
      try {
        const snap = await rtdbGet(ref(rtdb, `points/${editId}`));
        const val = snap.val();
        if (!val) {
          Alert.alert("Tidak ditemukan", "Data tidak ditemukan untuk diedit.");
          setLoading(false);
          return;
        }

        setName(val.name ?? "");
        setDesc(val.description ?? "");
        setCategory(val.category ?? "batik");
        setImageUri(val.imageUri ?? null);

        if (val.coordinates) {
          const cleaned = val.coordinates.replace(/\s+/g, "");
          const [la, lo] = cleaned.split(",");
          setLat(la ?? "");
          setLng(lo ?? "");
        }
      } catch (err) {
        console.warn("load edit", err);
      } finally {
        setLoading(false);
      }
    })();
  }, [editId]);

  /* ------------------------------------------
     AUTO CLEAN FUNCTION
  -------------------------------------------*/
  const cleanCoord = (val: string) => {
    return val
      .replace(/[^\d.\-]/g, "")
      .replace(/\s+/g, "")
      .trim();
  };

  /* ------------------------------------------
     IMAGE PICKER
  -------------------------------------------*/
  const pickImage = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return alert("Izin galeri ditolak");

    const result = await ImagePicker.launchImageLibraryAsync({
      quality: 0.75,
      allowsEditing: true,
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
    });

    if (!result.canceled) setImageUri(result.assets[0].uri);
  };

  /* ------------------------------------------
     GET LOCATION
  -------------------------------------------*/
  const getLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") return alert("Izin lokasi ditolak");

    const loc = await Location.getCurrentPositionAsync({});
    const latFixed = String(loc.coords.latitude);
    const lngFixed = String(loc.coords.longitude);

    setLat(latFixed);
    setLng(lngFixed);

    Alert.alert("Lokasi Diambil", `Lat: ${latFixed}\nLng: ${lngFixed}`);
  };

  /* ------------------------------------------
     SAVE DATA (CREATE / EDIT)
  -------------------------------------------*/
  const saveData = async () => {
    if (!name || !desc || !lat || !lng)
      return Alert.alert("Lengkapi semua data dulu ya 😄");

    const cleanLat = cleanCoord(lat);
    const cleanLng = cleanCoord(lng);

    if (isNaN(Number(cleanLat)) || isNaN(Number(cleanLng))) {
      return Alert.alert("Format koordinat salah", "Cek kembali ya.");
    }

    try {
      setLoading(true);

      const payload = {
        name: name.trim(),
        description: desc.trim(),
        category,
        tags: ["artisan"],
        coordinates: `${cleanLat},${cleanLng}`,
        imageUri: imageUri ?? null,
        createdAt: Date.now(),
        mood: "none",
      };

      if (editId) {
        // EDIT existing point (overwrite)
        await rtdbSet(ref(rtdb, `points/${editId}`), payload);
        Alert.alert("Berhasil!", "Perubahan disimpan.");
        // After edit, redirect to cart (umkm-list)
        router.replace("/(tabs)/umkm-list");
        return;
      }

      // CREATE new
      const node = push(ref(rtdb, "points/"));
      await rtdbSet(node, payload);
      Alert.alert("Berhasil!", "UMKM Kerajinan berhasil ditambahkan ✨");

      // reset
      setName("");
      setDesc("");
      setCategory("batik");
      setLat("");
      setLng("");
      setImageUri(null);
      scrollRef.current?.scrollTo({ y: 0, animated: true });

      // go back to map with refresh
      router.replace("/(tabs)/gmap?refresh=1");
    } catch (err: any) {
      Alert.alert("Gagal", err.message);
    } finally {
      setLoading(false);
    }
  };

  /* ------------------------------------------
     UI
  -------------------------------------------*/
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: Colors.bg }}>
        <ActivityIndicator size="large" color={Colors.accent} />
        <Text style={{ color: Colors.textSoft, marginTop: 10 }}>Memproses…</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        ref={scrollRef}
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 160 }}
      >
        <Text style={styles.titleMinimal}>
          {editId ? "Edit UMKM Kerajinan" : "Tambah UMKM Kerajinan ✨"}
        </Text>

        <View style={styles.card}>
          {/* NAME */}
          <TextInput
            placeholder="Nama UMKM / Studio / Sentra Kerajinan"
            placeholderTextColor={Colors.textSoft}
            value={name}
            onChangeText={setName}
            style={styles.input}
          />

          {/* DESC */}
          <TextInput
            placeholder="Deskripsi singkat (jenis kerajinan, bahan, ciri khas...)"
            placeholderTextColor={Colors.textSoft}
            value={desc}
            onChangeText={setDesc}
            style={[styles.input, { height: 90, textAlignVertical: "top" }]}
            multiline
          />

          {/* CATEGORY */}
          <Text style={styles.label}>Kategori Kerajinan</Text>
          <View style={styles.chipRow}>
            {["batik", "gerabah", "perak", "kayu", "kulit", "anyaman"].map((c) => (
              <TouchableOpacity
                key={c}
                onPress={() => setCategory(c)}
                style={[styles.chip, category === c && styles.chipActive]}
              >
                <Text style={[styles.chipText, category === c && styles.chipTextActive]}>
                  {c.toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* IMAGE */}
          <TouchableOpacity onPress={pickImage} style={styles.btn}>
            <Text style={styles.btnText}>Upload Foto Produk / Workshop</Text>
          </TouchableOpacity>

          {imageUri && <Image source={{ uri: imageUri }} style={styles.preview} />}

          {/* COORD INPUT */}
          <Text style={styles.label}>Lokasi (Latitude & Longitude)</Text>

          <TextInput
            placeholder="Latitude"
            placeholderTextColor={Colors.textSoft}
            value={lat}
            onChangeText={(t) => setLat(cleanCoord(t))}
            keyboardType="numeric"
            style={styles.input}
          />

          <TextInput
            placeholder="Longitude"
            placeholderTextColor={Colors.textSoft}
            value={lng}
            onChangeText={(t) => setLng(cleanCoord(t))}
            keyboardType="numeric"
            style={styles.input}
          />

          {/* GET LOCATION */}
          <TouchableOpacity onPress={getLocation} style={[styles.btn, { backgroundColor: Colors.accent2 }]}>
            <Text style={styles.btnText}>Ambil Lokasi Sekarang</Text>
          </TouchableOpacity>

          {/* SAVE */}
          <TouchableOpacity onPress={saveData} style={[styles.btn, { backgroundColor: Colors.accent }]}>
            <Text style={styles.btnText}>{editId ? "Simpan Perubahan" : "Simpan UMKM"}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

/* ============================================
   STYLES (sama seperti versi sebelumnya, ditambah typography)
============================================ */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
    padding: 20,
  },

  titleMinimal: {
    fontSize: 30,
    fontWeight: "900",
    color: Colors.accent2,
    textAlign: "center",
    marginBottom: 24,
    letterSpacing: 0.8,
    textShadowColor: Colors.accent + "55",
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 12,
    paddingVertical: 12,
  },

  card: {
    backgroundColor: Colors.bgSoft + "AA",
    padding: 20,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.card,
    shadowColor: Colors.accent,
    shadowOpacity: 0.25,
    shadowRadius: 20,
    marginBottom: 40,
  },

  input: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.accent2 + "55",
    padding: 12,
    borderRadius: 12,
    color: Colors.text,
    marginBottom: 14,
  },

  label: {
    color: Colors.textSoft,
    marginBottom: 6,
    marginTop: 8,
    fontWeight: "600",
  },

  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 20,
  },

  chip: {
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 22,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.accent + "33",
  },

  chipActive: {
    backgroundColor: Colors.accent,
    shadowColor: Colors.accent,
    shadowOpacity: 0.5,
    shadowRadius: 10,
  },

  chipText: {
    color: Colors.textSoft,
    fontWeight: "600",
  },

  chipTextActive: {
    color: Colors.text,
  },

  btn: {
    padding: 15,
    borderRadius: 12,
    marginTop: 12,
    backgroundColor: Colors.accent,
    shadowColor: Colors.accent,
    shadowOpacity: 0.4,
    shadowRadius: 12,
  },

  btnText: {
    textAlign: "center",
    color: Colors.text,
    fontWeight: "bold",
  },

  preview: {
    width: "100%",
    height: 200,
    marginTop: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.accent2,
  },
});
