

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

<img width="495" height="876" alt="image" src="https://github.com/user-attachments/assets/d639af11-2d9d-4608-a46a-b7940e48ed98" />

<img width="458" height="867" alt="image" src="https://github.com/user-attachments/assets/466ee019-fa64-4aa3-b67b-d3f2800c7a99" />


### **2. CraftMap + Marker**

<img width="482" height="870" alt="image" src="https://github.com/user-attachments/assets/c3e8e3ec-3d02-460e-9daf-43ff38edfa62" />

<img width="339" height="383" alt="image" src="https://github.com/user-attachments/assets/103a2a15-8da4-4a39-b7e9-54bbda652c35" />
<img width="444" height="875" alt="image" src="https://github.com/user-attachments/assets/7f8d0bcd-f521-4307-9446-6791f868b6e4" />
<img width="464" height="879" alt="image" src="https://github.com/user-attachments/assets/a6fe0eba-726f-4c57-8039-829cd59496bd" />

<img width="445" height="872" alt="image" src="https://github.com/user-attachments/assets/ec771054-535f-4fb4-8d63-9ab85285286d" />

<img width="465" height="864" alt="image" src="https://github.com/user-attachments/assets/cf489c03-ba2c-4b7d-8228-9326d35c02bd" />

<img width="453" height="864" alt="image" src="https://github.com/user-attachments/assets/65b1acfb-e2cd-44ab-9154-aebf300d5eb5" />


### **3. Popup Hidden Gem**

<img width="390" height="626" alt="image" src="https://github.com/user-attachments/assets/c2a6464d-d24a-4b23-ad84-097a2a239d95" />

![Gambar WhatsApp 2025-12-05 pukul 07 18 44_3f14d8bb](https://github.com/user-attachments/assets/02f8de8e-84d3-48f5-8298-dce243486351)

### **4. Mood Map**

![Gambar WhatsApp 2025-12-05 pukul 07 18 43_a18a4d4c](https://github.com/user-attachments/assets/51823041-629e-44d8-9bbd-dbb1fe39c58c)
![Gambar WhatsApp 2025-12-05 pukul 07 18 43_ae2537eb](https://github.com/user-attachments/assets/d8c7b6db-b3d6-47cf-9c25-bd0fa27cff6b)


### **5. Explore List**

![Uploading image.png…]()

### **6. Keranjang UMKM**

![Gambar WhatsApp 2025-12-05 pukul 07 18 42_1b138a45](https://github.com/user-attachments/assets/e36b3abe-1a57-45bf-ad87-3f546374b9c8)

### **7. Form Input Lokasi**

![Gambar WhatsApp 2025-12-05 pukul 07 18 44_5a7655ff](https://github.com/user-attachments/assets/2fcce923-0380-4ee0-a50e-6c617179d09c)


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

