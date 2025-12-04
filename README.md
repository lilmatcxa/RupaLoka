

# 🚀 **RupaLoka — Peta Kerajinan & Eksplorasi UMKM Sabdodadi**

RupaLoka adalah aplikasi mobile berbasis **React Native + Expo**, yang dirancang untuk memperkenalkan kerajinan lokal Sabdodadi melalui pengalaman eksplorasi yang interaktif.
Aplikasi ini menggabungkan elemen peta, gacha, penandaan mood, dan manajemen daftar favorit UMKM.

---

# 📘 **Deskripsi Produk**

RupaLoka membantu pengguna menemukan, menjelajahi, dan menyimpan UMKM lokal dengan cara yang menyenangkan dan intuitif.
Pengguna dapat:

* Menemukan UMKM terdekat melalui **CraftMap**
* Mendapatkan rekomendasi acak melalui fitur **Gacha Kerajinan**
* Memberikan “mood” pada setiap UMKM melalui **Mood Map**
* Menambah UMKM favorit ke **Keranjang UMKM**
* Menjelajahi daftar kerajinan lengkap di halaman **Explore**

Produk ini dibuat sebagai aplikasi eksplorasi ekonomi kreatif yang memanfaatkan data geospasial dan foto produk kerajinan.

---

# 🧩 **Komponen Pembangun Produk**

Aplikasi ini dibangun menggunakan teknologi berikut:

### **Frontend**

* **React Native (Expo)**
* **Expo Router** (file-based routing)
* **React Native Maps**
* **Animated API untuk efek transisi & popup**
* **Expo ImagePicker**
* **Expo Location**

### **Backend**

* **Firebase Realtime Database**
  → penyimpanan data UMKM, mood, cart, lokasi
* **Firebase Storage** (opsional jika pakai imageUri)

### **Data Layer**

* Sumber data berasal dari node Firebase:

  ```
  /points        → semua data UMKM (nama, deskripsi, kategori, koordinat, mood)
  /cart/{user}   → daftar UMKM favorit per pengguna
  ```

### **Assets**

* Gambar UMKM disimpan lokal di:

  ```
  /assets/umkm/
  ```

  dan di-map melalui file:

  ```
  /assets/umkm/UMKM_IMAGES.ts
  ```

---

# 📦 **Struktur Folder Utama**

```
app/
 ├─ (tabs)/
 │   ├─ index.tsx          → Discover (Gacha Kerajinan)
 │   ├─ gmap.tsx           → CraftMap + Hidden Gem
 │   ├─ explore.tsx        → Daftar & pencarian UMKM
 │   ├─ mood-map.tsx       → Peta Mood Kerajinan
 │   ├─ umkm-list.tsx      → Keranjang UMKM Favorit
 │
 ├─ forminputlocation.tsx  → Tambah/Edit UMKM
 ├─ _layout.tsx            → Root layout
 │
assets/
 └─ umkm/UMKM_IMAGES.ts    → Mapping gambar lokal

src/
 └─ firebase.ts            → Konfigurasi Firebase
```

---

# 🔍 **Sumber Data**

Aplikasi mengambil data secara **realtime** dari Firebase:

## **1. UMKM / Kerajinan**

Struktur node:

```json
{
  "points": {
    "{id}": {
      "name": "Batik Tulis Sabdodadi",
      "description": "Batik motif klasik dengan sentuhan modern",
      "category": "batik",
      "coordinates": "-7.897510,110.330921",
      "imageLocal": "batik_sabdo1.jpg",
      "mood": "heritage",
      "createdAt": 1700000001
    }
  }
}
```

## **2. Keranjang / Wishlist User**

Digunakan untuk fitur UMKM List.

```json
{
  "cart": {
    "demo_user": {
      "{umkm_id}": true
    }
  }
}
```

---

# 🖼️ **Tangkapan Layar Komponen Penting**

> *(Silakan upload gambar ke GitHub dan ganti linknya di sini)*

### **1. Halaman Discover (Gacha Kerajinan)**

![Discover Screen](https://via.placeholder.com/900x500?text=Discover+Screen)

### **2. CraftMap + Marker**

![CraftMap](https://via.placeholder.com/900x500?text=CraftMap+Screen)

### **3. Popup Hidden Gem**

![Hidden Gem Popup](https://via.placeholder.com/900x500?text=Hidden+Gem)

### **4. Mood Map**

![Mood Map](https://via.placeholder.com/900x500?text=Mood+Map)

### **5. Explore List**

![Explore List](https://via.placeholder.com/900x500?text=Explore+UMKM)

### **6. Keranjang UMKM**

![UMKM List](https://via.placeholder.com/900x500?text=UMKM+List)

### **7. Form Input Lokasi**

![Input Lokasi](https://via.placeholder.com/900x500?text=Form+Input+Location)

---

# ▶️ **Cara Menjalankan Proyek**

### **1. Install dependencies**

```bash
npm install
```

### **2. Jalankan aplikasi**

```bash
npx expo start
```

### Pilihan membuka aplikasi:

* Android Emulator
* iOS Simulator
* Expo Go
* Development Build

---

# 🛠️ **Pengembangan Lebih Lanjut**

Beberapa pengembangan yang dapat ditambahkan:

* Login user + autentikasi Firebase
* Upload gambar ke Firebase Storage
* Rating UMKM
* Sistem rekomendasi UMKM
* Dark mode penuh

