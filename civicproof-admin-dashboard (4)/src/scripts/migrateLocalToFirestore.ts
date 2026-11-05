/**
 * Namma Ooru - Safe Standalone Local Complaints Migration Script
 * 
 * Safely migrates complaints from local disk store (data/complaints-store.json)
 * to Cloud Firestore WITHOUT deleting, mutating, or overwriting the local file.
 * 
 * Safety guarantees:
 * 1. Creates an immutable timestamped backup of data/complaints-store.json first.
 * 2. Checks Cloud Firestore for each complaint before writing to prevent overwriting existing records.
 * 3. Commits in batches of 50 to respect Firestore transaction limits.
 * 4. Preserves data/complaints-store.json completely intact on disk.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  getApps as getAdminApps,
  initializeApp as initializeAdminApp,
  getApp as getAdminApp,
  type App as AdminApp,
  cert,
  applicationDefault,
} from 'firebase-admin/app';
import { getFirestore as getAdminFirestore, type Firestore as AdminFirestore } from 'firebase-admin/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import type { Complaint } from '../types/civic.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '../..');
const DATA_DIR = path.resolve(ROOT_DIR, 'data');
const LOCAL_STORE_PATH = path.resolve(DATA_DIR, 'complaints-store.json');

export async function runLocalToFirestoreMigration(): Promise<{
  success: boolean;
  totalFound: number;
  migratedCount: number;
  skippedCount: number;
  backupPath?: string;
  error?: string;
}> {
  console.log('\n================================================================');
  console.log(' Namma Ooru Standalone Local Complaints Migration Utility');
  console.log('================================================================');

  if (!fs.existsSync(LOCAL_STORE_PATH)) {
    console.log(' [i] No local complaints-store.json found. Nothing to migrate.');
    return { success: true, totalFound: 0, migratedCount: 0, skippedCount: 0 };
  }

  // 1. Take a safe timestamped backup first
  const timestamp = Date.now();
  const backupPath = path.resolve(DATA_DIR, `complaints-store.backup.${timestamp}.json`);
  fs.copyFileSync(LOCAL_STORE_PATH, backupPath);
  console.log(` [✓] Immutable backup created at: ${backupPath}`);

  // 2. Read local complaints
  const raw = fs.readFileSync(LOCAL_STORE_PATH, 'utf8');
  let complaints: Complaint[] = [];
  try {
    complaints = JSON.parse(raw);
    if (!Array.isArray(complaints)) {
      throw new Error('Local complaints store is not an array.');
    }
  } catch (err: any) {
    console.error(' [✗] Failed to parse local complaints store:', err.message);
    return { success: false, totalFound: 0, migratedCount: 0, skippedCount: 0, backupPath, error: err.message };
  }

  console.log(` [i] Found ${complaints.length} local complaints to inspect.`);

  // 3. Connect to Firestore
  const EXPECTED_PROJECT_ID = process.env.FIREBASE_PROJECT_ID || firebaseConfig.projectId;
  const EXPECTED_DATABASE_ID =
    process.env.FIRESTORE_DATABASE_ID ||
    process.env.FIREBASE_FIRESTORE_DATABASE_ID ||
    firebaseConfig.firestoreDatabaseId;

  let credentialOption: any = undefined;
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  const isEmulator = Boolean(process.env.FIRESTORE_EMULATOR_HOST);

  if (serviceAccountJson) {
    try {
      credentialOption = cert(JSON.parse(serviceAccountJson));
    } catch {
      // ignore
    }
  } else if (serviceAccountPath && fs.existsSync(serviceAccountPath)) {
    try {
      credentialOption = cert(JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8')));
    } catch {
      // ignore
    }
  } else if (!isEmulator) {
    const gcloudAdcPath = process.platform === 'win32'
      ? path.join(process.env.APPDATA || '', 'gcloud', 'application_default_credentials.json')
      : path.join(process.env.HOME || '', '.config', 'gcloud', 'application_default_credentials.json');
    if (fs.existsSync(gcloudAdcPath) || process.env.K_SERVICE) {
      try {
        credentialOption = applicationDefault();
      } catch {
        // ignore
      }
    }
  }

  if (!credentialOption && !isEmulator) {
    console.error('\n [✗] Cannot execute migration: Cloud Firestore credentials are not configured.');
    console.error('     Please set GOOGLE_APPLICATION_CREDENTIALS or log in via gcloud auth application-default login.');
    return {
      success: false,
      totalFound: complaints.length,
      migratedCount: 0,
      skippedCount: 0,
      backupPath,
      error: 'Credentials missing',
    };
  }

  const app = getAdminApps().length === 0
    ? initializeAdminApp({ projectId: EXPECTED_PROJECT_ID, credential: credentialOption, storageBucket: firebaseConfig.storageBucket })
    : getAdminApp();

  const db: AdminFirestore = getAdminFirestore(app, EXPECTED_DATABASE_ID);

  let migratedCount = 0;
  let skippedCount = 0;

  // Process in batches of 50
  const BATCH_SIZE = 50;
  for (let i = 0; i < complaints.length; i += BATCH_SIZE) {
    const slice = complaints.slice(i, i + BATCH_SIZE);
    const batch = db.batch();
    let batchHasOperations = false;

    for (const c of slice) {
      const docRef = db.collection('complaints').doc(c.id);
      const existing = await docRef.get();
      if (existing.exists) {
        skippedCount++;
      } else {
        batch.set(docRef, JSON.parse(JSON.stringify(c)));
        batchHasOperations = true;
        migratedCount++;
      }
    }

    if (batchHasOperations) {
      await batch.commit();
    }
  }

  console.log(`\n [✓] Migration complete:`);
  console.log(`     Total complaints inspected : ${complaints.length}`);
  console.log(`     Newly migrated to Cloud    : ${migratedCount}`);
  console.log(`     Already present in Cloud   : ${skippedCount}`);
  console.log(`     Local file untouched       : ${LOCAL_STORE_PATH}`);
  console.log(`     Backup preserved at        : ${backupPath}`);
  console.log('================================================================\n');

  return {
    success: true,
    totalFound: complaints.length,
    migratedCount,
    skippedCount,
    backupPath,
  };
}

if (process.argv[1] && process.argv[1].endsWith('migrateLocalToFirestore.ts')) {
  runLocalToFirestoreMigration()
    .then((r) => process.exit(r.success ? 0 : 1))
    .catch((err) => {
      console.error('Migration error:', err);
      process.exit(1);
    });
}
