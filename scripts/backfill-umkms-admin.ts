// scripts/backfill-umkms-admin.ts
// Admin script to backfill 'timeCategory' for documents in 'umkms' collection
// Usage:
//   1) Install dependencies: npm install firebase-admin
//   2) Run with ts-node or node (compiled)
//      TS: npx ts-node scripts/backfill-umkms-admin.ts /path/to/serviceAccountKey.json
//      or set env: SERVICE_ACCOUNT_PATH=/path/to/key.json
//      Node: node scripts/backfill-umkms-admin.js /path/to/serviceAccountKey.json

import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';

const serviceAccountPath = process.env.SERVICE_ACCOUNT_PATH || process.argv[2];
if (!serviceAccountPath) {
  console.error('Please provide path to service account JSON as env SERVICE_ACCOUNT_PATH or as CLI arg');
  console.error('Usage: npx ts-node scripts/backfill-umkms-admin.ts /path/to/serviceAccountKey.json');
  process.exit(1);
}

// load JSON (allow relative)
const resolved = path.resolve(process.cwd(), serviceAccountPath);
if (!fs.existsSync(resolved)) {
  console.error(`Service account file not found: ${resolved}`);
  process.exit(1);
}

const serviceAccount = JSON.parse(fs.readFileSync(resolved, 'utf-8'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function main() {
  console.log('Starting backfill: searching for docs where timeCategory == null...');
  const col = db.collection('umkms');
  const q = col.where('timeCategory', '==', null);
  const snap = await q.get();
  console.log(`Found ${snap.size} document(s) to update.`);
  if (snap.empty) {
    console.log('Nothing to update. Exiting.');
    return;
  }

  // Use batches of 500 (Firestore limit)
  const docs = snap.docs;
  let processed = 0;
  while (processed < docs.length) {
    const batch = db.batch();
    const chunk = docs.slice(processed, processed + 500);
    for (const d of chunk) {
      batch.update(d.ref, { timeCategory: 'all_day', updatedAt: admin.firestore.FieldValue.serverTimestamp() });
    }
    await batch.commit();
    processed += chunk.length;
    console.log(`Committed ${processed}/${docs.length}`);
  }

  console.log('Backfill completed.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
