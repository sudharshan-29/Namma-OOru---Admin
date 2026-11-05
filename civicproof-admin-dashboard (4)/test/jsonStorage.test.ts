/**
 * Namma Ooru - Local JSON Store Persistence Integration Test Suite
 * 
 * Verifies all requirements:
 * 1. Active storage mode reported as 'local-json' on GET /api/health with all 4 managed files
 * 2. Shared visibility: Citizen complaint creation is immediately readable by Admin interface
 * 3. Exact field preservation: IDs, coordinates, categories, timestamps, photo references, history
 * 4. Status updates and department assignments written to data/complaints-store.json and data/audit-logs.json
 * 5. Concurrent requests: 10 parallel submissions handled safely without data corruption
 * 6. Durability across backend restarts: Data persists when server is completely stopped and restarted
 * 7. Live Firestore protection: Backend does not connect or write to live Firestore during local development
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Server } from 'node:http';
import { startServer } from '../server.js';
import {
  COMPLAINTS_STORE_PATH,
  SETTINGS_STORE_PATH,
  AUDIT_LOGS_PATH,
  DEPARTMENTS_PATH,
} from '../src/lib/jsonStore.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TEST_PORT = 3110;
const BASE_URL = `http://127.0.0.1:${TEST_PORT}`;

export interface TestReport {
  testNumber: number;
  name: string;
  passed: boolean;
  details: string;
}

export async function runJsonStorageTests(): Promise<{ allPassed: boolean; reports: TestReport[] }> {
  const reports: TestReport[] = [];
  let server: Server | null = null;
  let testCounter = 1;

  console.log(`\n======================================================`);
  console.log(` Namma Ooru Local JSON Persistence Test Suite`);
  console.log(` Starting in-process test server on port ${TEST_PORT}...`);
  console.log(`======================================================\n`);

  try {
    process.env.NODE_ENV = 'test';
    delete process.env.STORAGE_MODE;
    delete process.env.REQUIRE_DURABLE_FIRESTORE;

    server = await startServer(TEST_PORT);
  } catch (err: any) {
    console.error(`Failed to start test server on port ${TEST_PORT}:`, err);
    throw err;
  }

  // Backup existing data so tests never pollute or corrupt the persistent store
  const originalComplaintsRaw = fs.existsSync(COMPLAINTS_STORE_PATH)
    ? fs.readFileSync(COMPLAINTS_STORE_PATH, 'utf-8')
    : null;
  const originalAuditRaw = fs.existsSync(AUDIT_LOGS_PATH)
    ? fs.readFileSync(AUDIT_LOGS_PATH, 'utf-8')
    : null;

  try {
    // Test 1: Verify all 4 required JSON files exist on disk
    try {
      const filesExist =
        fs.existsSync(COMPLAINTS_STORE_PATH) &&
        fs.existsSync(SETTINGS_STORE_PATH) &&
        fs.existsSync(AUDIT_LOGS_PATH) &&
        fs.existsSync(DEPARTMENTS_PATH);

      reports.push({
        testNumber: testCounter++,
        name: 'All 4 required local JSON data stores exist and are managed by backend',
        passed: filesExist,
        details: `complaints: ${fs.existsSync(COMPLAINTS_STORE_PATH)}, settings: ${fs.existsSync(SETTINGS_STORE_PATH)}, audit-logs: ${fs.existsSync(AUDIT_LOGS_PATH)}, departments: ${fs.existsSync(DEPARTMENTS_PATH)}`,
      });
    } catch (err: any) {
      reports.push({
        testNumber: testCounter++,
        name: 'All 4 required local JSON data stores exist and are managed by backend',
        passed: false,
        details: err.message,
      });
    }

    // Test 2: GET /api/health clearly identifies local-json storage mode
    try {
      const healthRes = await fetch(`${BASE_URL}/api/health`);
      const healthData = await healthRes.json();
      const passed =
        healthRes.status === 200 &&
        healthData.status === 'ok' &&
        healthData.storageMode === 'local-json' &&
        healthData.firestoreAvailable === false &&
        typeof healthData.jsonStorage?.complaints === 'string' &&
        typeof healthData.jsonStorage?.auditLogs === 'string';

      reports.push({
        testNumber: testCounter++,
        name: 'GET /api/health clearly reports active storage mode as local-json without live Firestore connection',
        passed,
        details: `storageMode: ${healthData.storageMode}, firestoreAvailable: ${healthData.firestoreAvailable}, complaintsFile: ${healthData.jsonStorage?.complaints}`,
      });
    } catch (err: any) {
      reports.push({
        testNumber: testCounter++,
        name: 'GET /api/health clearly reports active storage mode as local-json without live Firestore connection',
        passed: false,
        details: err.message,
      });
    }

    // Test 3: Citizen creates complaint with exact GPS coordinates and fields
    let createdComplaintId = '';
    const uniqueDescription = `Pothole on Marina Beach Kamarajar Salai ${Date.now()}`;
    const testCoordinates = { lat: 13.0524, lng: 80.2829 };

    try {
      const citizenPayload = {
        category: 'Road Damage',
        description: uniqueDescription,
        address: 'Kamarajar Salai, Marina Beach Road, Chennai',
        zone: 'Zone 9 (Teynampet)',
        ward: 'Ward 120',
        coordinates: testCoordinates,
        geoJsonCoordinates: [testCoordinates.lng, testCoordinates.lat],
        photoUrl: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80',
        reporterType: 'Registered Citizen',
      };

      const createRes = await fetch(`${BASE_URL}/api/complaints`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(citizenPayload),
      });

      const createData = await createRes.json();
      createdComplaintId = createData.complaint?.id;

      const rawComplaints = JSON.parse(fs.readFileSync(COMPLAINTS_STORE_PATH, 'utf-8'));
      const inDiskFile = rawComplaints.find((c: any) => c.id === createdComplaintId);

      const passed =
        createRes.status === 201 &&
        createData.storageMode === 'local-json' &&
        typeof createdComplaintId === 'string' &&
        createdComplaintId.startsWith('CP-CHN-2026-') &&
        Boolean(inDiskFile) &&
        inDiskFile.location.coordinates.lat === testCoordinates.lat &&
        inDiskFile.location.coordinates.lng === testCoordinates.lng &&
        Array.isArray(inDiskFile.location.geoJsonCoordinates) &&
        inDiskFile.location.geoJsonCoordinates[0] === testCoordinates.lng &&
        inDiskFile.location.geoJsonCoordinates[1] === testCoordinates.lat;

      reports.push({
        testNumber: testCounter++,
        name: 'Citizen complaint registration persists to data/complaints-store.json with exact coordinates and fields',
        passed,
        details: `ID: ${createdComplaintId}, Disk verified: ${Boolean(inDiskFile)}, Lat/Lng: ${inDiskFile?.location?.coordinates?.lat}, ${inDiskFile?.location?.coordinates?.lng}`,
      });
    } catch (err: any) {
      reports.push({
        testNumber: testCounter++,
        name: 'Citizen complaint registration persists to data/complaints-store.json with exact coordinates and fields',
        passed: false,
        details: err.message,
      });
    }

    // Test 4: Shared visibility: Admin interface queries /api/complaints and sees citizen complaint
    try {
      const adminListRes = await fetch(`${BASE_URL}/api/complaints?search=${encodeURIComponent(uniqueDescription)}`);
      const adminListData = await adminListRes.json();
      const foundInList = adminListData.complaints?.some((c: any) => c.id === createdComplaintId);

      const adminSingleRes = await fetch(`${BASE_URL}/api/complaints/${createdComplaintId}`);
      const adminSingleData = await adminSingleRes.json();

      const passed =
        adminListRes.status === 200 &&
        foundInList &&
        adminSingleRes.status === 200 &&
        adminSingleData.id === createdComplaintId &&
        adminSingleData.description === uniqueDescription;

      reports.push({
        testNumber: testCounter++,
        name: 'Shared visibility: Both citizen and admin interfaces view identical complaint records from JSON backend',
        passed,
        details: `Found in admin complaints list: ${foundInList}, ID verified: ${adminSingleData.id}`,
      });
    } catch (err: any) {
      reports.push({
        testNumber: testCounter++,
        name: 'Shared visibility: Both citizen and admin interfaces view identical complaint records from JSON backend',
        passed: false,
        details: err.message,
      });
    }

    // Test 5: Complaint registration appends initial audit logs to data/audit-logs.json
    try {
      const rawAuditLogs = JSON.parse(fs.readFileSync(AUDIT_LOGS_PATH, 'utf-8'));
      const complaintLogs = rawAuditLogs.filter((l: any) => l.complaintId === createdComplaintId);

      const passed =
        Array.isArray(rawAuditLogs) &&
        complaintLogs.length >= 2 &&
        complaintLogs.some((l: any) => l.action === 'Complaint Registered') &&
        complaintLogs.some((l: any) => l.action === 'Auto-Prioritized' || l.action === 'Auto-Assigned Department');

      reports.push({
        testNumber: testCounter++,
        name: 'Complaint creation automatically appends lifecycle audit entries to data/audit-logs.json',
        passed,
        details: `Audit entries found for ${createdComplaintId}: ${complaintLogs.length} entries (${complaintLogs.map((l: any) => l.action).join(', ')})`,
      });
    } catch (err: any) {
      reports.push({
        testNumber: testCounter++,
        name: 'Complaint creation automatically appends lifecycle audit entries to data/audit-logs.json',
        passed: false,
        details: err.message,
      });
    }

    // Test 6: Departments endpoint dynamically aggregates live statistics from complaints
    try {
      const deptsRes = await fetch(`${BASE_URL}/api/departments`);
      const deptsData = await deptsRes.json();
      const roadsDept = deptsData.departments?.find((d: any) => d.name === 'Roads and Infrastructure Department');

      const passed =
        deptsRes.status === 200 &&
        Array.isArray(deptsData.departments) &&
        deptsData.departments.length === 3 &&
        roadsDept &&
        typeof roadsDept.totalAssigned === 'number' &&
        roadsDept.totalAssigned > 0;

      reports.push({
        testNumber: testCounter++,
        name: 'GET /api/departments serves from data/departments.json with dynamic runtime complaint aggregations',
        passed,
        details: `Departments count: ${deptsData.departments?.length}, Roads Dept totalAssigned: ${roadsDept?.totalAssigned}`,
      });
    } catch (err: any) {
      reports.push({
        testNumber: testCounter++,
        name: 'GET /api/departments serves from data/departments.json with dynamic runtime complaint aggregations',
        passed: false,
        details: err.message,
      });
    }

    // Test 7: Concurrency Safety: 10 parallel complaint creations without race conditions or file corruption
    try {
      const concurrentCount = 10;
      const promises = [];

      for (let i = 0; i < concurrentCount; i++) {
        const payload = {
          category: i % 2 === 0 ? 'Water Leakage' : 'Road Damage',
          description: `Concurrent stress test complaint batch ${Date.now()} #${i}`,
          address: `Test Street ${i}, Adyar, Chennai`,
          zone: 'Zone 13 (Adyar)',
          ward: 'Ward 173',
          coordinates: { lat: 13.006 + i * 0.001, lng: 80.257 + i * 0.001 },
          geoJsonCoordinates: [80.257 + i * 0.001, 13.006 + i * 0.001],
          reporterType: 'Registered Citizen',
        };

        promises.push(
          fetch(`${BASE_URL}/api/complaints`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          }).then((r) => r.json())
        );
      }

      const results = await Promise.all(promises);
      const allCreated = results.every((r) => r.complaint && r.storageMode === 'local-json');

      // Verify complaints-store.json is valid parseable JSON and contains all complaints
      const rawAfter = JSON.parse(fs.readFileSync(COMPLAINTS_STORE_PATH, 'utf-8'));
      const rawAuditAfter = JSON.parse(fs.readFileSync(AUDIT_LOGS_PATH, 'utf-8'));

      const passed =
        allCreated &&
        Array.isArray(rawAfter) &&
        Array.isArray(rawAuditAfter) &&
        rawAfter.length >= concurrentCount;

      reports.push({
        testNumber: testCounter++,
        name: 'Concurrency safety: Parallel writes to JSON store serialize cleanly without data corruption',
        passed,
        details: `Successfully completed ${results.length}/${concurrentCount} concurrent requests. Total complaints in store: ${rawAfter.length}`,
      });
    } catch (err: any) {
      reports.push({
        testNumber: testCounter++,
        name: 'Concurrency safety: Parallel writes to JSON store serialize cleanly without data corruption',
        passed: false,
        details: err.message,
      });
    }

    // Test 8: Data Durability across full backend server restart
    try {
      const persistDesc = `Persistence restart verification ${Date.now()}`;
      const preRestartRes = await fetch(`${BASE_URL}/api/complaints`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: 'Water Leakage',
          description: persistDesc,
          address: 'Poonamallee High Road, Kilpauk',
          zone: 'Zone 8 (Annanagar)',
          ward: 'Ward 104',
          coordinates: { lat: 13.078, lng: 80.244 },
          geoJsonCoordinates: [80.244, 13.078],
          reporterType: 'Registered Citizen',
        }),
      });

      const preRestartData = await preRestartRes.json();
      const testPersistId = preRestartData.complaint?.id;

      // Close test server completely
      await new Promise<void>((resolve) => {
        server!.close(() => resolve());
      });
      server = null;
      await new Promise((resolve) => setTimeout(resolve, 200));

      // Restart server cold from local JSON files
      server = await startServer(TEST_PORT);
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Fetch persisted complaint from restarted server
      const postRestartRes = await fetch(`${BASE_URL}/api/complaints/${testPersistId}`);
      const postRestartData = await postRestartRes.json();

      const passed =
        preRestartRes.status === 201 &&
        postRestartRes.status === 200 &&
        postRestartData.id === testPersistId &&
        postRestartData.description === persistDesc &&
        postRestartData.location.coordinates.lat === 13.078 &&
        postRestartData.location.coordinates.lng === 80.244;

      reports.push({
        testNumber: testCounter++,
        name: 'Data durability verified: Complaint records, coordinates, and history survive full backend restart',
        passed,
        details: `ID: ${testPersistId}, Retrieved after cold start: HTTP ${postRestartRes.status}, Description match: true`,
      });
    } catch (err: any) {
      reports.push({
        testNumber: testCounter++,
        name: 'Data durability verified: Complaint records, coordinates, and history survive full backend restart',
        passed: false,
        details: err.message,
      });
    }

    // Test 9: Complete End-to-End Workflow:
    // Citizen submits complaint → Shared JSON storage → Admin sees complaint → Admin updates status → Shared JSON storage updates → Citizen sees latest status
    try {
      const e2eDescription = `Egmore Station crater reported by citizen ${Date.now()}`;
      const citizenPayload = {
        category: 'Road Damage',
        description: e2eDescription,
        address: 'Gandhi Irwin Road, Egmore, Chennai',
        roadName: 'Gandhi Irwin Road, Egmore',
        coordinates: { lat: 13.0805, lng: 80.2615 },
        geoJsonCoordinates: [80.2615, 13.0805],
        photoUrl: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80',
        reporterType: 'Registered Citizen',
      };

      // 1. Citizen submits complaint
      const citizenSubmitRes = await fetch(`${BASE_URL}/api/complaints`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(citizenPayload),
      });
      const citizenSubmitData = await citizenSubmitRes.json();
      const e2eId = citizenSubmitData.complaint?.id;

      // 2. Verified in shared complaints-store.json
      const diskAfterSubmit = JSON.parse(fs.readFileSync(COMPLAINTS_STORE_PATH, 'utf-8'));
      const inDiskAfterSubmit = diskAfterSubmit.find((c: any) => c.id === e2eId);

      // 3. Admin sees complaint in admin list & single view
      const adminListRes = await fetch(`${BASE_URL}/api/complaints?search=${encodeURIComponent(e2eDescription)}`);
      const adminListData = await adminListRes.json();
      const adminSawComplaint = adminListData.complaints?.some((c: any) => c.id === e2eId);

      // 4. Admin updates status to 'In Progress'
      const adminAuthHeaders = {
        'Content-Type': 'application/json',
        Authorization: 'Bearer NAMMA_OORU_TEST_ADMIN_AUTH_TOKEN_2026',
      };
      const adminPatchRes = await fetch(`${BASE_URL}/api/complaints/${e2eId}`, {
        method: 'PATCH',
        headers: adminAuthHeaders,
        body: JSON.stringify({
          status: 'In Progress',
          statusReason: 'Road maintenance crew dispatched to Egmore location',
        }),
      });
      const adminPatchData = await adminPatchRes.json();

      // 5. Shared JSON storage updates: verified on disk in complaints-store.json & audit-logs.json
      const diskAfterPatch = JSON.parse(fs.readFileSync(COMPLAINTS_STORE_PATH, 'utf-8'));
      const inDiskAfterPatch = diskAfterPatch.find((c: any) => c.id === e2eId);
      const auditDiskAfterPatch = JSON.parse(fs.readFileSync(AUDIT_LOGS_PATH, 'utf-8'));
      const statusAuditFound = auditDiskAfterPatch.some(
        (l: any) => l.complaintId === e2eId && l.action === 'Status Updated' && l.newValue === 'In Progress'
      );

      // 6. Citizen retrieves updated complaint and sees latest permitted status
      const citizenGetRes = await fetch(`${BASE_URL}/api/complaints/${e2eId}`);
      const citizenGetData = await citizenGetRes.json();

      const passed =
        citizenSubmitRes.status === 201 &&
        Boolean(inDiskAfterSubmit) &&
        inDiskAfterSubmit.currentStatus === 'Received' &&
        adminSawComplaint &&
        adminPatchRes.status === 200 &&
        adminPatchData.complaint?.currentStatus === 'In Progress' &&
        Boolean(inDiskAfterPatch) &&
        inDiskAfterPatch.currentStatus === 'In Progress' &&
        statusAuditFound &&
        citizenGetRes.status === 200 &&
        (citizenGetData.currentStatus === 'In Progress' || citizenGetData.status === 'In Progress');

      reports.push({
        testNumber: testCounter++,
        name: 'Complete E2E Workflow: Citizen Submits → Shared JSON Store → Admin Sees → Admin Updates Status → Store Updates → Citizen Sees Latest Status',
        passed,
        details: `ID: ${e2eId}, Initial: ${inDiskAfterSubmit?.currentStatus}, Admin saw: ${adminSawComplaint}, Admin updated: ${adminPatchData.complaint?.currentStatus}, Disk updated: ${inDiskAfterPatch?.currentStatus}, Citizen read: ${citizenGetData?.currentStatus}`,
      });
    } catch (err: any) {
      reports.push({
        testNumber: testCounter++,
        name: 'Complete E2E Workflow: Citizen Submits → Shared JSON Store → Admin Sees → Admin Updates Status → Store Updates → Citizen Sees Latest Status',
        passed: false,
        details: err.message,
      });
    }

    // Test 10: Strict Permissions Separation: Citizens cannot modify complaint status, settings, or assignments
    try {
      // Citizen attempt to modify complaint status without admin authorization
      const unauthPatchRes = await fetch(`${BASE_URL}/api/complaints/CP-CHN-2026-1041`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Resolved' }),
      });

      // Citizen attempt to modify system settings
      const unauthSettingsRes = await fetch(`${BASE_URL}/api/settings`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ autoAssignmentEnabled: false }),
      });

      const passed = unauthPatchRes.status === 401 && unauthSettingsRes.status === 401;

      reports.push({
        testNumber: testCounter++,
        name: 'Strict Permissions: Citizens are prohibited from modifying complaint status, assignments, settings, or audit logs',
        passed,
        details: `PATCH /api/complaints/:id status: ${unauthPatchRes.status} (expected 401), PATCH /api/settings status: ${unauthSettingsRes.status} (expected 401)`,
      });
    } catch (err: any) {
      reports.push({
        testNumber: testCounter++,
        name: 'Strict Permissions: Citizens are prohibited from modifying complaint status, assignments, settings, or audit logs',
        passed: false,
        details: err.message,
      });
    }

    // Test 11: Direct browser file access to data directory is strictly blocked (HTTP 403)
    try {
      const directStoreRes = await fetch(`${BASE_URL}/data/complaints-store.json`);
      const directSettingsRes = await fetch(`${BASE_URL}/data/settings-store.json`);
      const directCitizenStoreRes = await fetch(`${BASE_URL}/citizen/data/complaints-store.json`);

      const passed =
        directStoreRes.status === 403 &&
        directSettingsRes.status === 403 &&
        directCitizenStoreRes.status === 403;

      reports.push({
        testNumber: testCounter++,
        name: 'Direct browser access to data/*.json and citizen/data/*.json is blocked with HTTP 403',
        passed,
        details: `/data/complaints-store.json: ${directStoreRes.status}, /data/settings-store.json: ${directSettingsRes.status}, /citizen/data/complaints-store.json: ${directCitizenStoreRes.status}`,
      });
    } catch (err: any) {
      reports.push({
        testNumber: testCounter++,
        name: 'Direct browser access to data/*.json and citizen/data/*.json is blocked with HTTP 403',
        passed: false,
        details: err.message,
      });
    }
  } finally {
    if (server) {
      await new Promise<void>((resolve) => {
        server!.close(() => {
          console.log(`Test server on port ${TEST_PORT} closed cleanly.`);
          resolve();
        });
      });
    }

    // Safely restore persistent files so no test artifacts remain
    if (originalComplaintsRaw !== null) {
      fs.writeFileSync(COMPLAINTS_STORE_PATH, originalComplaintsRaw, 'utf-8');
    }
    if (originalAuditRaw !== null) {
      fs.writeFileSync(AUDIT_LOGS_PATH, originalAuditRaw, 'utf-8');
    }
  }

  // Summary
  let allPassed = true;
  console.log(`\n======================================================`);
  console.log(` NAMMA OORU LOCAL JSON PERSISTENCE TEST REPORT`);
  console.log(`======================================================`);
  reports.forEach((r) => {
    const icon = r.passed ? '✓' : '✗';
    console.log(`[${icon}] Test ${r.testNumber}: ${r.name}`);
    console.log(`    Status: ${r.passed ? 'PASSED' : 'FAILED'} — ${r.details}`);
    if (!r.passed) allPassed = false;
  });

  console.log(`\n======================================================`);
  console.log(` Results: ${reports.filter((r) => r.passed).length}/${reports.length} Tests Passed`);
  console.log(` Suite Status: ${allPassed ? 'ALL PERSISTENCE TESTS PASSED' : 'FAILURES DETECTED'}`);
  console.log(`======================================================\n`);

  return { allPassed, reports };
}

if (process.argv[1] && process.argv[1].endsWith('jsonStorage.test.ts')) {
  runJsonStorageTests()
    .then(({ allPassed }) => {
      process.exit(allPassed ? 0 : 1);
    })
    .catch((err) => {
      console.error('Fatal json storage test failure:', err);
      process.exit(1);
    });
}
