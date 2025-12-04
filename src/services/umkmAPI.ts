import axios from "axios";

const BASE = "http://192.168.1.9:3000/api"; // pakai IP laptopmu

export async function getUMKM() {
    try {
        const res = await axios.get(`${BASE}/umkm`);
        return res.data;
    } catch (err) {
        console.log("Error fetch UMKM", err);
        return [];
    }
}
