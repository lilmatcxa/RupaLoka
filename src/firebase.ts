// src/firebase.ts
import { initializeApp, getApps, getApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";


/**
 * Central Firebase config — gunakan config Moodwalker mu (Realtime DB + Firestore)
 * Pastikan hanya satu initializeApp dipanggil (guard getApps()).
 */

const firebaseConfig = {
  apiKey: "AIzaSyAq0KykdMZMSNRfLfwpvqJNYwUyaSreAk4",
  authDomain: "moodwalker-app.firebaseapp.com",
  databaseURL: "https://moodwalker-app-default-rtdb.firebaseio.com/",
  projectId: "moodwalker-app",
  storageBucket: "moodwalker-app.firebasestorage.app",
  messagingSenderId: "1004972493902",
  appId: "1:1004972493902:web:afb3b49277306a3437471f",
};

// init once
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const rtdb = getDatabase(app);      // Realtime Database (for points/)
export const db = getFirestore(app);       // Firestore (optional)
export const auth = getAuth(app);          // Auth
export const storage = getStorage(app);    // Storage (for images)
export default app;
