// app/assets/umkm/images.ts
/**
 * UMKM_IMAGES
 * - Tambahkan file gambar ke folder: app/assets/umkm/
 * - Lalu daftarkan nama file di object di bawah.
 *
 * Contoh: 'batik_sabdo1.jpg': require('./batik_sabdo1.jpg')
 *
 * Jangan gunakan require dinamis di runtime (Metro membutuhkan mapping statis).
 */

export const UMKM_IMAGES: Record<string, any> = {
    // --- Batik ---
    "batik_sabdo1.jpg": require("./batik_sabdo1.jpg"),
    "batik_sabdo2.jpg": require("./batik_sabdo2.jpg"),

    // --- Gerabah ---
    "gerabah_sabdo1.jpg": require("./gerabah_sabdo1.jpg"),
    "gerabah_sabdo2.jpg": require("./gerabah_sabdo2.jpg"),

    // --- Perak ---
    "perak_sabdo1.jpg": require("./perak_sabdo1.jpg"),
    "perak_sabdo2.jpg": require("./perak_sabdo2.jpg"),

    // --- Kayu ---
    "kayu_sabdo1.jpg": require("./kayu_sabdo1.jpg"),
    "kayu_sabdo2.jpg": require("./kayu_sabdo2.jpg"),

    // --- Kulit (Manding) ---
    "manding_leather1.jpg": require("./manding_leather1.jpg"),
    "manding_leather2.jpg": require("./manding_leather2.jpg"),

    // --- Anyaman ---
    "anyaman_sabdo1.jpg": require("./anyaman_sabdo1.jpg"),
    "anyaman_sabdo2.jpg": require("./anyaman_sabdo2.jpg"),

    // --- Misc / placeholder ---
    "studio_modern1.jpg": require("./studio_modern1.jpg"),
    "studio_modern2.jpg": require("./studio_modern2.jpg"),

    // placeholder (pastikan ada file placeholder.jpg)
    "placeholder.jpg": require("./placeholder.jpg"),
};

export default UMKM_IMAGES;
