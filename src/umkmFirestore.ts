// app/umkmFirestore.ts
// Firestore helper for Umkm model (client-side)

import {
    addDoc,
    collection,
    doc,
    DocumentData,
    DocumentSnapshot,
    getDoc,
    getDocs,
    query,
    serverTimestamp,
    Timestamp,
    updateDoc,
    where,
    writeBatch
} from "firebase/firestore";
import { db } from "./firebase";

export enum TimeCategory {
  Pagi = "pagi",
  Siang = "siang",
  Malam = "malam",
  AllDay = "all_day",
}

export const TIME_CATEGORY_VALUES = Object.values(TimeCategory) as string[];

export interface Umkm {
  id?: string;
  name: string;
  description?: string;
  timeCategory: TimeCategory;
  createdAt?: Date;
  updatedAt?: Date;
  // add other fields you use in your app
}

function isValidTimeCategory(v: any): v is TimeCategory {
  return typeof v === "string" && TIME_CATEGORY_VALUES.includes(v);
}

function normalizeTimeCategory(v?: string | TimeCategory): TimeCategory {
  if (!v) return TimeCategory.AllDay;
  if (isValidTimeCategory(v)) return v as TimeCategory;
  return TimeCategory.AllDay;
}

function snapshotToUmkm(snap: DocumentSnapshot<DocumentData>): Umkm | null {
  if (!snap.exists()) return null;
  const data = snap.data() as any;
  const createdAt = data.createdAt instanceof Timestamp ? data.createdAt.toDate() : data.createdAt;
  const updatedAt = data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : data.updatedAt;

  return {
    id: snap.id,
    name: data.name,
    description: data.description,
    timeCategory: isValidTimeCategory(data.timeCategory)
      ? (data.timeCategory as TimeCategory)
      : TimeCategory.AllDay,
    createdAt,
    updatedAt,
  };
}

export async function createUmkm(payload: {
  name: string;
  description?: string;
  timeCategory?: string | TimeCategory;
}): Promise<string> {
  const col = collection(db, "umkms");
  const data = {
    name: payload.name,
    description: payload.description ?? null,
    timeCategory: normalizeTimeCategory(payload.timeCategory),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  } as any;

  const ref = await addDoc(col, data);
  return ref.id;
}

export async function getUmkm(id: string): Promise<Umkm | null> {
  const ref = doc(db, "umkms", id);
  const snap = await getDoc(ref);
  return snapshotToUmkm(snap);
}

export async function updateUmkm(
  id: string,
  payload: Partial<{
    name: string;
    description?: string | null;
    timeCategory?: string | TimeCategory;
  }>
): Promise<void> {
  const ref = doc(db, "umkms", id);
  const data: any = {
    updatedAt: serverTimestamp(),
  };
  if (payload.name !== undefined) data.name = payload.name;
  if (payload.description !== undefined) data.description = payload.description;
  if (payload.timeCategory !== undefined)
    data.timeCategory = normalizeTimeCategory(payload.timeCategory as any);

  await updateDoc(ref, data);
}

export async function backfillMissingTimeCategoryClient(): Promise<number> {
  // Query documents where timeCategory is null or missing
  const col = collection(db, "umkms");
  const q = query(col, where("timeCategory", "==", null));
  const snap = await getDocs(q);
  if (snap.empty) return 0;

  const batch = writeBatch(db);
  snap.docs.forEach((d) => {
    batch.update(d.ref, { timeCategory: TimeCategory.AllDay, updatedAt: serverTimestamp() });
  });

  await batch.commit();
  return snap.size;
}

export async function ensureAllHaveTimeCategory(): Promise<number> {
  // Fallback that scans all docs and updates those without field.
  // Use with caution (reads all documents).
  const col = collection(db, "umkms");
  const snap = await getDocs(col);
  if (snap.empty) return 0;

  const batch = writeBatch(db);
  let count = 0;
  snap.docs.forEach((d) => {
    const data = d.data() as any;
    if (!isValidTimeCategory(data.timeCategory)) {
      batch.update(d.ref, { timeCategory: TimeCategory.AllDay, updatedAt: serverTimestamp() });
      count++;
    }
  });
  if (count === 0) return 0;
  await batch.commit();
  return count;
}
