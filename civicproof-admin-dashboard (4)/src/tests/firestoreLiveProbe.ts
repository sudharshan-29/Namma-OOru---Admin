/**
 * Namma Ooru - Production Cloud Firestore Live Probe & Diagnostics
 * 
 * Performs a controlled write, read, status update, and cleanup verification against the target Firestore database:
 * - Project ID: fabled-flame-1zbz0
 * - Database ID: ai-studio-civicproofadmind-beff02db-38a7-495e-8500-43eddeb8da0e
 * 
 * If valid credentials are present:
 * 1. Writes a temporary test probe document to collection `_healthCheckProbe`.
 * 2. Reads the document back from Firestore and verifies contents.
 * 3. Tests complaint creation with exact GeoJSON coordinates [lng, lat] and initial audit log in Cloud Firestore.
 * 4. Tests complaint status update and audit log appending.
 * 5. Cleans up all temporary test documents from Cloud Firestore.
 * 
 * If credentials are not present:
 * - Accurately reports missing credentials and CLI status without fabricating success.
 * - Outlines the exact IAM role, Service Account Key, or gcloud CLI setup needed.
 */

import fs from 'node:fs';
import path from 'node:path';
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

export interface LiveProbeResult {
  verified: boolean;
  gcloudInstalled: boolean;
  authType: 'service-account' | 'adc' | 'emulator' | 'none';
  projectId: string;
  databaseId: string;
  probeDocId?: string;
  details: string;
  remedy?: string[];
}

export function checkGcloudInstalled(): boolean {
  const commonPaths = [
    'C:\\Program Files (x86)\\Google\\Cloud SDK\\google-cloud-sdk\\bin\\gcloud.cmd',
    'C:\\Program Files\\Google\\Cloud SDK\\google-cloud-sdk\\bin\\gcloud.cmd',
    path.join(process.env.LOCALAPPDATA || '', 'Google', 'Cloud SDK', 'google-cloud-sdk', 'bin', 'gcloud.cmd'),
    path.join(process.env.USERPROFILE || '', 'google-cloud-sdk', 'bin', 'gcloud.cmd'),
  ];
  return commonPaths.some((p) => fs.existsSync(p));
}

export async function runFirestoreLiveProbe(): Promise<LiveProbeResult> {
  const EXPECTED_PROJECT_ID = process.env.FIREBASE_PROJECT_ID || firebaseConfig.projectId;
  const EXPECTED_DATABASE_ID =
    process.env.FIRESTORE_DATABASE_ID ||
    process.env.FIREBASE_FIRESTORE_DATABASE_ID ||
    firebaseConfig.firestoreDatabaseId;

  console.log('\n================================================================');
  console.log(' Namma Ooru Cloud Firestore Live Persistence Verification Probe');
  console.log('================================================================');
  console.log(` Target Project ID  : ${EXPECTED_PROJECT_ID}`);
  console.log(` Target Database ID : ${EXPECTED_DATABASE_ID}`);
  console.log('----------------------------------------------------------------');

  const gcloudInstalled = checkGcloudInstalled();
  console.log(` Google Cloud CLI   : ${gcloudInstalled ? 'INSTALLED' : 'NOT INSTALLED'}`);

  const isEmulator = Boolean(process.env.FIRESTORE_EMULATOR_HOST);
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;

  let credentialOption: any = undefined;
  let authType: 'service-account' | 'adc' | 'emulator' | 'none' = 'none';

  if (serviceAccountJson) {
    try {
      const parsed = JSON.parse(serviceAccountJson);
      credentialOption = cert(parsed);
      authType = 'service-account';
      console.log(' [✓] Detected FIREBASE_SERVICE_ACCOUNT_KEY in environment.');
    } catch {
      console.warn(' [!] FIREBASE_SERVICE_ACCOUNT_KEY found but failed JSON parsing.');
    }
  } else if (serviceAccountPath && fs.existsSync(serviceAccountPath)) {
    try {
      const raw = fs.readFileSync(serviceAccountPath, 'utf8');
      const parsed = JSON.parse(raw);
      credentialOption = cert(parsed);
      authType = 'service-account';
      console.log(' [✓] Detected valid key file via GOOGLE_APPLICATION_CREDENTIALS.');
    } catch {
      console.warn(` [!] Failed to parse key file at: ${serviceAccountPath}`);
    }
  } else if (isEmulator) {
    authType = 'emulator';
    console.log(` [i] Detected FIRESTORE_EMULATOR_HOST (${process.env.FIRESTORE_EMULATOR_HOST}).`);
  } else {
    const gcloudAdcPath = process.platform === 'win32'
      ? path.join(process.env.APPDATA || '', 'gcloud', 'application_default_credentials.json')
      : path.join(process.env.HOME || '', '.config', 'gcloud', 'application_default_credentials.json');
    const inGcpEnv = Boolean(
      process.env.K_SERVICE || process.env.FUNCTION_NAME || process.env.GAE_SERVICE || process.env.METADATA_SERVER_HOST
    );

    if (inGcpEnv || fs.existsSync(gcloudAdcPath)) {
      try {
        credentialOption = applicationDefault();
        authType = 'adc';
        console.log(` [✓] Detected Application Default Credentials (${inGcpEnv ? 'GCP Environment' : gcloudAdcPath}).`);
      } catch {
        authType = 'none';
      }
    }
  }

  if (!credentialOption && !isEmulator) {
    const remedy = [
      '----------------------------------------------------------------',
      'Option 1: Service Account Key (Fastest — No Google Cloud CLI Required)',
      '----------------------------------------------------------------',
      '1. Open Google Cloud IAM or Firebase Console for project fabled-flame-1zbz0:',
      '   https://console.cloud.google.com/iam-admin/serviceaccounts?project=fabled-flame-1zbz0',
      '2. Select or create a service account and grant role "Cloud Datastore User" (roles/datastore.user).',
      '3. Under the "Keys" tab, click "Add Key" -> "Create new key" -> JSON.',
      '4. Save the key file OUTSIDE the workspace repository (e.g. C:\\Users\\dhivy\\fabled-flame-1zbz0-sa.json).',
      '5. In PowerShell, set:',
      '   $env:GOOGLE_APPLICATION_CREDENTIALS = "C:\\Users\\dhivy\\fabled-flame-1zbz0-sa.json"',
      '6. Re-run: npm run test:firestore:probe',
      '',
      '----------------------------------------------------------------',
      'Option 2: Install Google Cloud CLI & Use Application Default Credentials',
      '----------------------------------------------------------------',
      '1. Install Google Cloud SDK in PowerShell:',
      '   winget install Google.CloudSDK',
      '   (Or download installer: https://cloud.google.com/sdk/docs/install#windows)',
      '2. Open a new terminal and log in:',
      '   gcloud auth application-default login',
      '3. Set project:',
      '   gcloud config set project fabled-flame-1zbz0',
      '4. Re-run: npm run test:firestore:probe',
      '',
      '----------------------------------------------------------------',
      'Required IAM Permissions:',
      '----------------------------------------------------------------',
      '• Cloud Datastore User (roles/datastore.user) — Read/Write access to Cloud Firestore.',
      '• Service Account Token Creator (if deploying to Cloud Run).',
    ];

    console.log('\n [!] CLOUD FIRESTORE CREDENTIALS ABSENT:');
    console.log(`     Google Cloud CLI is ${gcloudInstalled ? 'installed' : 'not installed'}.`);
    console.log('     No verified Google Cloud credentials or ADC found in this execution environment.');
    console.log('     Storage mode in local environment: local durable JSON disk store (data/complaints-store.json).');
    console.log('\n Exact configuration steps required for live Cloud Firestore access:');
    remedy.forEach((line) => console.log(`   ${line}`));
    console.log('================================================================\n');

    return {
      verified: false,
      gcloudInstalled,
      authType: 'none',
      projectId: EXPECTED_PROJECT_ID,
      databaseId: EXPECTED_DATABASE_ID,
      details: 'Cloud Firestore live verification skipped: No Google Cloud service account or ADC credentials detected in current environment.',
      remedy,
    };
  }

  // Credentials or Emulator are available; perform live read/write/update/delete verification
  try {
    let app: AdminApp;
    const existingApps = getAdminApps();
    const appName = `live-probe-${Date.now()}`;
    const appOptions: any = {
      projectId: EXPECTED_PROJECT_ID,
      storageBucket: firebaseConfig.storageBucket,
    };
    if (credentialOption) {
      appOptions.credential = credentialOption;
    }
    app = initializeAdminApp(appOptions, appName);

    const db: AdminFirestore = getAdminFirestore(app, EXPECTED_DATABASE_ID);
    const timestamp = new Date().toISOString();

    // 1. Health check probe document verification
    const probeDocId = `probe_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const probeRef = db.collection('_healthCheckProbe').doc(probeDocId);
    const probePayload = {
      probeId: probeDocId,
      purpose: 'Production Cloud Firestore Connectivity and Authorization Verification',
      projectId: EXPECTED_PROJECT_ID,
      databaseId: EXPECTED_DATABASE_ID,
      authType,
      verifiedAt: timestamp,
      testMarker: 'namma-ooru-admin-verification-pass',
    };

    console.log(`\n [*] Executing write probe to collection '_healthCheckProbe/${probeDocId}'...`);
    await probeRef.set(probePayload);
    console.log(' [✓] Live write confirmed.');

    console.log(` [*] Executing read verification from collection '_healthCheckProbe/${probeDocId}'...`);
    const readSnap = await probeRef.get();
    if (!readSnap.exists) {
      throw new Error(`Probe document ${probeDocId} was written but could not be read back.`);
    }
    const readData = readSnap.data();
    if (readData?.testMarker !== 'namma-ooru-admin-verification-pass') {
      throw new Error(`Probe document returned mismatched data: ${JSON.stringify(readData)}`);
    }
    console.log(` [✓] Live read confirmed with valid testMarker and database ID (${EXPECTED_DATABASE_ID}).`);

    // 2. Complaint record write, coordinates verification, status update, and audit log verification
    const testComplaintId = `CP-TEST-LIVE-PROBE-${Date.now()}`;
    const testComplaintRef = db.collection('complaints').doc(testComplaintId);
    const testAuditRef1 = db.collection('auditLogs').doc(`LOG-${testComplaintId}-1`);
    const testAuditRef2 = db.collection('auditLogs').doc(`LOG-${testComplaintId}-2`);

    const testComplaintPayload: Complaint = {
      id: testComplaintId,
      category: 'Road Damage',
      description: 'Automated Cloud Firestore Live Persistence Verification Test',
      location: {
        address: 'Mount Road / Anna Salai Test Corridor, Chennai',
        zone: 'Zone 9 (Teynampet)',
        ward: 'Ward 118',
        coordinates: { lat: 13.0418, lng: 80.2337 },
        geoJsonCoordinates: [80.2337, 13.0418],
      },
      originalPhotoUrl: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7',
      originalPhotoPath: `complaints/${testComplaintId}/original.jpg`,
      submissionTimestamp: timestamp,
      createdAt: timestamp,
      updatedAt: timestamp,
      priority: 'High',
      priorityReason: 'Automated live probe test record',
      priorityScore: 75,
      assignedDepartmentId: 'roads_and_infrastructure',
      assignedDepartment: 'Roads and Infrastructure Department',
      assignmentTimestamp: timestamp,
      currentStatus: 'Received',
      status: 'Received',
      reporterType: 'Registered Citizen',
      slaDeadline: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
      isOverdue: false,
      isDemo: false,
      history: [
        {
          id: `LOG-${testComplaintId}-1`,
          timestamp,
          action: 'Complaint Registered',
          actor: 'Live Cloud Probe',
          newValue: 'Received',
        },
      ],
    };

    console.log(` [*] Executing complaint registration to Cloud Firestore (${testComplaintId})...`);
    const batch = db.batch();
    batch.set(testComplaintRef, JSON.parse(JSON.stringify(testComplaintPayload)));
    batch.set(testAuditRef1, {
      id: `LOG-${testComplaintId}-1`,
      complaintId: testComplaintId,
      timestamp,
      action: 'Complaint Registered',
      actor: 'Live Cloud Probe',
      newValue: 'Received',
    });
    await batch.commit();
    console.log(' [✓] Live complaint and initial audit log committed atomically.');

    console.log(` [*] Verifying complaint document and GeoJSON coordinates [80.2337, 13.0418]...`);
    const complaintSnap = await testComplaintRef.get();
    if (!complaintSnap.exists) {
      throw new Error(`Test complaint ${testComplaintId} could not be retrieved from Cloud Firestore.`);
    }
    const cData = complaintSnap.data() as Complaint;
    if (cData.location.geoJsonCoordinates?.[0] !== 80.2337 || cData.location.geoJsonCoordinates?.[1] !== 13.0418) {
      throw new Error(`GeoJSON coordinates mismatch: ${JSON.stringify(cData.location.geoJsonCoordinates)}`);
    }
    console.log(' [✓] Exact GeoJSON coordinates [longitude, latitude] confirmed in Cloud Firestore.');

    console.log(` [*] Executing status update transition to 'In Progress'...`);
    const updateBatch = db.batch();
    updateBatch.update(testComplaintRef, {
      currentStatus: 'In Progress',
      status: 'In Progress',
      updatedAt: new Date().toISOString(),
    });
    updateBatch.set(testAuditRef2, {
      id: `LOG-${testComplaintId}-2`,
      complaintId: testComplaintId,
      timestamp: new Date().toISOString(),
      action: 'Status Updated',
      actor: 'Live Cloud Probe',
      previousValue: 'Received',
      newValue: 'In Progress',
      reason: 'Live cloud update verification',
    });
    await updateBatch.commit();

    const updatedSnap = await testComplaintRef.get();
    if (updatedSnap.data()?.currentStatus !== 'In Progress') {
      throw new Error(`Complaint status update failed to persist in Cloud Firestore.`);
    }
    console.log(' [✓] Status update and secondary audit log confirmed in Cloud Firestore.');

    // 3. Clean-up deletion of temporary test documents
    console.log(` [*] Cleaning up temporary probe documents...`);
    const cleanupBatch = db.batch();
    cleanupBatch.delete(probeRef);
    cleanupBatch.delete(testComplaintRef);
    cleanupBatch.delete(testAuditRef1);
    cleanupBatch.delete(testAuditRef2);
    await cleanupBatch.commit();
    console.log(' [✓] All test probe records cleaned up cleanly from Cloud Firestore.');

    console.log('\n================================================================');
    console.log(' LIVE CLOUD FIRESTORE PERSISTENCE VERIFICATION: SUCCESS');
    console.log(` Verified Project  : ${EXPECTED_PROJECT_ID}`);
    console.log(` Verified Database : ${EXPECTED_DATABASE_ID}`);
    console.log(` Verified Auth     : ${authType}`);
    console.log(' Full Lifecycle   : Write, Coordinates, Status Update, Audit Logs, Cleanup (PASSED)');
    console.log('================================================================\n');

    return {
      verified: true,
      gcloudInstalled,
      authType,
      projectId: EXPECTED_PROJECT_ID,
      databaseId: EXPECTED_DATABASE_ID,
      probeDocId,
      details: 'Live Cloud Firestore write, read, status update, and cleanup cycle verified successfully.',
    };
  } catch (err: any) {
    console.error('\n [✗] Live Firestore probe execution failed:', err?.message || err);
    console.log('================================================================\n');
    return {
      verified: false,
      gcloudInstalled,
      authType,
      projectId: EXPECTED_PROJECT_ID,
      databaseId: EXPECTED_DATABASE_ID,
      details: `Live Firestore probe failed: ${err?.message || err}`,
    };
  }
}

if (process.argv[1] && process.argv[1].endsWith('firestoreLiveProbe.ts')) {
  runFirestoreLiveProbe()
    .then((result) => {
      if (!result.verified && result.authType !== 'none') {
        process.exit(1);
      }
      process.exit(0);
    })
    .catch((err) => {
      console.error('Fatal probe execution error:', err);
      process.exit(1);
    });
}
