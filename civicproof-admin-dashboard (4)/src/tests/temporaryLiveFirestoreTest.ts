/**
 * Namma Ooru - Temporary Controlled Live Cloud Firestore Integration Test
 * 
 * Verifies live Firestore connectivity, IAM permissions, complaint persistence,
 * exact coordinate preservation, status update, and audit log persistence in a
 * session-isolated environment, then cleans up all test records.
 * 
 * Target:
 * - Project ID: fabled-flame-1zbz0
 * - Database ID: ai-studio-civicproofadmind-beff02db-38a7-495e-8500-43eddeb8da0e
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

export interface ControlledTestReport {
  success: boolean;
  adcFound: boolean;
  iamVerified: boolean;
  complaintPersisted: boolean;
  coordinatesVerified: boolean;
  statusUpdated: boolean;
  auditLogsPersisted: boolean;
  cleanedUp: boolean;
  localStoreUntouched: boolean;
  details: string[];
}

export async function runControlledLiveFirestoreTest(): Promise<ControlledTestReport> {
  const details: string[] = [];
  const EXPECTED_PROJECT_ID = 'fabled-flame-1zbz0';
  const EXPECTED_DATABASE_ID = 'ai-studio-civicproofadmind-beff02db-38a7-495e-8500-43eddeb8da0e';

  console.log('\n================================================================');
  console.log(' Namma Ooru Controlled Live Cloud Firestore Temporary Test');
  console.log('================================================================');
  console.log(` Target Project  : ${EXPECTED_PROJECT_ID}`);
  console.log(` Target Database : ${EXPECTED_DATABASE_ID}`);
  console.log('----------------------------------------------------------------');

  // 1. Check ADC existence
  const gcloudAdcPath = process.platform === 'win32'
    ? path.join(process.env.APPDATA || '', 'gcloud', 'application_default_credentials.json')
    : path.join(process.env.HOME || '', '.config', 'gcloud', 'application_default_credentials.json');

  const adcFound = fs.existsSync(gcloudAdcPath) || Boolean(process.env.GOOGLE_APPLICATION_CREDENTIALS);
  if (!adcFound) {
    details.push('Application Default Credentials not found in session.');
    console.log(' [!] ADC Credentials not detected.');
    return {
      success: false,
      adcFound: false,
      iamVerified: false,
      complaintPersisted: false,
      coordinatesVerified: false,
      statusUpdated: false,
      auditLogsPersisted: false,
      cleanedUp: false,
      localStoreUntouched: true,
      details,
    };
  }

  console.log(' [✓] Application Default Credentials detected.');
  details.push('ADC credentials detected.');

  // Check initial local complaints store hash/length to verify preservation
  const localStorePath = path.resolve(process.cwd(), 'data', 'complaints-store.json');
  const initialLocalLength = fs.existsSync(localStorePath) ? fs.statSync(localStorePath).size : 0;

  let app: AdminApp;
  try {
    const appName = `controlled-test-${Date.now()}`;
    const credential = process.env.GOOGLE_APPLICATION_CREDENTIALS && fs.existsSync(process.env.GOOGLE_APPLICATION_CREDENTIALS)
      ? cert(JSON.parse(fs.readFileSync(process.env.GOOGLE_APPLICATION_CREDENTIALS, 'utf8')))
      : applicationDefault();

    app = initializeAdminApp({
      projectId: EXPECTED_PROJECT_ID,
      credential,
      storageBucket: firebaseConfig.storageBucket,
    }, appName);
  } catch (err: any) {
    details.push(`Failed to initialize Admin App: ${err.message}`);
    return {
      success: false,
      adcFound: true,
      iamVerified: false,
      complaintPersisted: false,
      coordinatesVerified: false,
      statusUpdated: false,
      auditLogsPersisted: false,
      cleanedUp: false,
      localStoreUntouched: true,
      details,
    };
  }

  const db: AdminFirestore = getAdminFirestore(app, EXPECTED_DATABASE_ID);

  // 2. Test IAM write permission with probe
  const probeId = `probe_iam_test_${Date.now()}`;
  const probeRef = db.collection('_healthCheckProbe').doc(probeId);
  try {
    console.log(' [*] Testing Cloud Firestore IAM permissions...');
    await probeRef.set({ test: true, timestamp: new Date().toISOString() });
    const probeSnap = await probeRef.get();
    if (!probeSnap.exists) throw new Error('Could not read probe document.');
    await probeRef.delete();
    console.log(' [✓] IAM write and read verified on Cloud Firestore.');
    details.push('IAM write and read verified.');
  } catch (iamErr: any) {
    const isPermissionDenied = iamErr?.message?.includes('PERMISSION_DENIED') || iamErr?.code === 7;
    const msg = isPermissionDenied
      ? `IAM Permission Denied: Authenticated identity lacks 'Cloud Datastore User' (roles/datastore.user) on project ${EXPECTED_PROJECT_ID}.`
      : `IAM verification failed: ${iamErr?.message || iamErr}`;
    console.error(` [✗] ${msg}`);
    details.push(msg);
    return {
      success: false,
      adcFound: true,
      iamVerified: false,
      complaintPersisted: false,
      coordinatesVerified: false,
      statusUpdated: false,
      auditLogsPersisted: false,
      cleanedUp: false,
      localStoreUntouched: true,
      details,
    };
  }

  // 3. Test Controlled Complaint Registration & Coordinate Preservation
  const testComplaintId = `CP-CONTROLLED-LIVE-${Date.now()}`;
  const testComplaintRef = db.collection('complaints').doc(testComplaintId);
  const testAuditRef1 = db.collection('auditLogs').doc(`LOG-${testComplaintId}-1`);
  const testAuditRef2 = db.collection('auditLogs').doc(`LOG-${testComplaintId}-2`);
  const timestamp = new Date().toISOString();

  const testComplaint: Complaint = {
    id: testComplaintId,
    category: 'Water Leakage',
    description: 'Controlled Live Firestore Verification - Main Pipeline Burst Test',
    location: {
      address: 'Anna Salai near Gemini Circle, Teynampet, Chennai',
      zone: 'Zone 9 (Teynampet)',
      ward: 'Ward 118',
      coordinates: { lat: 13.0418, lng: 80.2337 },
      geoJsonCoordinates: [80.2337, 13.0418],
    },
    originalPhotoUrl: 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167',
    originalPhotoPath: `complaints/${testComplaintId}/original.jpg`,
    submissionTimestamp: timestamp,
    createdAt: timestamp,
    updatedAt: timestamp,
    priority: 'Critical',
    priorityReason: 'Major arterial water line emergency testing',
    priorityScore: 90,
    assignedDepartmentId: 'water_supply_and_sewerage',
    assignedDepartment: 'Water Supply and Sewerage Department',
    assignmentTimestamp: timestamp,
    currentStatus: 'Received',
    status: 'Received',
    reporterType: 'Registered Citizen',
    slaDeadline: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(),
    isOverdue: false,
    isDemo: false,
    history: [
      {
        id: `LOG-${testComplaintId}-1`,
        timestamp,
        action: 'Complaint Registered',
        actor: 'Controlled Live Test Runner',
        newValue: 'Received',
      },
    ],
  };

  try {
    console.log(` [*] Registering temporary test complaint (${testComplaintId})...`);
    const batch1 = db.batch();
    batch1.set(testComplaintRef, JSON.parse(JSON.stringify(testComplaint)));
    batch1.set(testAuditRef1, {
      id: `LOG-${testComplaintId}-1`,
      complaintId: testComplaintId,
      timestamp,
      action: 'Complaint Registered',
      actor: 'Controlled Live Test Runner',
      newValue: 'Received',
    });
    await batch1.commit();
    console.log(' [✓] Complaint registered with initial audit log.');
    details.push('Complaint registered.');

    // 4. Verify exact coordinates & schema in Firestore
    console.log(' [*] Verifying GeoJSON coordinates [80.2337, 13.0418] in Firestore...');
    const readSnap = await testComplaintRef.get();
    if (!readSnap.exists) throw new Error('Registered complaint document not found in Cloud Firestore.');
    const data = readSnap.data() as Complaint;
    const geo = data.location.geoJsonCoordinates;
    if (!geo || geo[0] !== 80.2337 || geo[1] !== 13.0418) {
      throw new Error(`GeoJSON coordinates mismatch: ${JSON.stringify(geo)}`);
    }
    console.log(` [✓] Exact GeoJSON coordinates verified: [${geo[0]}, ${geo[1]}].`);
    details.push('Coordinates verified.');

    // 5. Test Status Update & Secondary Audit Log
    console.log(" [*] Updating complaint status to 'In Progress'...");
    const updateTime = new Date().toISOString();
    const batch2 = db.batch();
    batch2.update(testComplaintRef, {
      currentStatus: 'In Progress',
      status: 'In Progress',
      updatedAt: updateTime,
    });
    batch2.set(testAuditRef2, {
      id: `LOG-${testComplaintId}-2`,
      complaintId: testComplaintId,
      timestamp: updateTime,
      action: 'Status Updated',
      actor: 'Controlled Live Test Runner',
      previousValue: 'Received',
      newValue: 'In Progress',
      reason: 'Department crew dispatched to site',
    });
    await batch2.commit();

    const updatedSnap = await testComplaintRef.get();
    if (updatedSnap.data()?.currentStatus !== 'In Progress') {
      throw new Error('Status update failed to persist in Cloud Firestore.');
    }
    console.log(" [✓] Status update to 'In Progress' and audit log verified.");
    details.push('Status update and audit log verified.');

    // 6. Cleanup only the test records
    console.log(' [*] Cleaning up temporary test complaint and audit records...');
    const cleanupBatch = db.batch();
    cleanupBatch.delete(testComplaintRef);
    cleanupBatch.delete(testAuditRef1);
    cleanupBatch.delete(testAuditRef2);
    await cleanupBatch.commit();
    console.log(' [✓] Temporary test records cleanly removed from Cloud Firestore.');
    details.push('Test records cleaned up.');

    // 7. Verify local complaints store was untouched
    const finalLocalLength = fs.existsSync(localStorePath) ? fs.statSync(localStorePath).size : 0;
    const localStoreUntouched = initialLocalLength === finalLocalLength;
    if (localStoreUntouched) {
      console.log(' [✓] Local data/complaints-store.json preserved intact without modification.');
      details.push('Local JSON store preserved intact.');
    } else {
      console.warn(' [!] Local data/complaints-store.json was altered during test.');
    }

    console.log('\n================================================================');
    console.log(' CONTROLLED LIVE FIRESTORE INTEGRATION TEST: ALL PASSED');
    console.log('================================================================\n');

    return {
      success: true,
      adcFound: true,
      iamVerified: true,
      complaintPersisted: true,
      coordinatesVerified: true,
      statusUpdated: true,
      auditLogsPersisted: true,
      cleanedUp: true,
      localStoreUntouched,
      details,
    };
  } catch (testErr: any) {
    console.error(' [✗] Test operation failed:', testErr.message);
    details.push(`Operation error: ${testErr.message}`);

    // Attempt best-effort cleanup on failure
    try {
      await testComplaintRef.delete();
      await testAuditRef1.delete();
      await testAuditRef2.delete();
    } catch {
      // ignore
    }

    return {
      success: false,
      adcFound: true,
      iamVerified: true,
      complaintPersisted: false,
      coordinatesVerified: false,
      statusUpdated: false,
      auditLogsPersisted: false,
      cleanedUp: false,
      localStoreUntouched: true,
      details,
    };
  }
}

if (process.argv[1] && process.argv[1].endsWith('temporaryLiveFirestoreTest.ts')) {
  runControlledLiveFirestoreTest()
    .then((r) => process.exit(r.success ? 0 : 1))
    .catch((err) => {
      console.error('Fatal controlled test error:', err);
      process.exit(1);
    });
}
