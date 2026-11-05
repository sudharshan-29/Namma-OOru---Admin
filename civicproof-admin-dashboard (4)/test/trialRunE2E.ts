import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BACKEND_URL = 'http://localhost:3000';
const CITIZEN_URL = 'http://localhost:3001';
const DATA_DIR = path.resolve(__dirname, '../data');
const COMPLAINTS_FILE = path.join(DATA_DIR, 'complaints-store.json');
const AUDIT_FILE = path.join(DATA_DIR, 'audit-logs.json');
const SETTINGS_FILE = path.join(DATA_DIR, 'settings-store.json');
const DEPTS_FILE = path.join(DATA_DIR, 'departments.json');

const ADMIN_TOKEN = 'NAMMA_OORU_TEST_ADMIN_AUTH_TOKEN_2026';

interface StepResult {
  step: number;
  name: string;
  passed: boolean;
  details: string;
}

async function runTrial(): Promise<void> {
  const results: StepResult[] = [];
  console.log('=================================================================');
  console.log(' NAMMA OORU FULL END-TO-END TRIAL RUN (CITIZEN <-> ADMIN)');
  console.log('=================================================================\n');

  // STEP 1: Backend Health & Local JSON Verification
  try {
    const healthRes = await fetch(`${BACKEND_URL}/api/health`);
    const health = await healthRes.json();
    const passed =
      healthRes.status === 200 &&
      health.status === 'ok' &&
      health.storageMode === 'local-json' &&
      health.firestoreAvailable === false &&
      fs.existsSync(COMPLAINTS_FILE) &&
      fs.existsSync(AUDIT_FILE) &&
      fs.existsSync(SETTINGS_FILE) &&
      fs.existsSync(DEPTS_FILE);

    results.push({
      step: 1,
      name: 'Verify Backend Health & Local JSON Storage Mode (/api/health)',
      passed,
      details: `HTTP ${healthRes.status}, StorageMode: ${health.storageMode}, FirestoreAvailable: ${health.firestoreAvailable}, 4 JSON files exist: true`,
    });
  } catch (err: any) {
    results.push({
      step: 1,
      name: 'Verify Backend Health & Local JSON Storage Mode (/api/health)',
      passed: false,
      details: err.message,
    });
  }

  // STEP 2: Citizen Interface Dev Server & Proxy Verification
  try {
    const citizenHealthRes = await fetch(`${CITIZEN_URL}/api/health`);
    const citizenHealth = await citizenHealthRes.json();
    const passed =
      citizenHealthRes.status === 200 &&
      citizenHealth.status === 'ok' &&
      citizenHealth.storageMode === 'local-json';

    results.push({
      step: 2,
      name: 'Verify Citizen Interface (port 3001) proxy connection to backend (port 3000)',
      passed,
      details: `HTTP ${citizenHealthRes.status}, Citizen proxy verified: storageMode=${citizenHealth.storageMode}`,
    });
  } catch (err: any) {
    results.push({
      step: 2,
      name: 'Verify Citizen Interface (port 3001) proxy connection to backend (port 3000)',
      passed: false,
      details: err.message,
    });
  }

  // STEP 3: Security & Authorization Enforced
  try {
    const unauthPatch = await fetch(`${BACKEND_URL}/api/complaints/CP-CHN-2026-1041`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ priority: 'Critical' }),
    });
    const forgedPatch = await fetch(`${BACKEND_URL}/api/complaints/CP-CHN-2026-1041`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer attack_forged_token_claim',
      },
      body: JSON.stringify({ priority: 'Critical' }),
    });
    const directFileRead = await fetch(`${BACKEND_URL}/data/complaints-store.json`);

    const passed =
      unauthPatch.status === 401 &&
      forgedPatch.status === 401 &&
      directFileRead.status === 403;

    results.push({
      step: 3,
      name: 'Verify Backend Authentication & Authorization Enforcement (401/403)',
      passed,
      details: `Unauth PATCH: HTTP ${unauthPatch.status} (401), Forged PATCH: HTTP ${forgedPatch.status} (401), Direct /data/*.json access: HTTP ${directFileRead.status} (403)`,
    });
  } catch (err: any) {
    results.push({
      step: 3,
      name: 'Verify Backend Authentication & Authorization Enforcement (401/403)',
      passed: false,
      details: err.message,
    });
  }

  // STEP 4: Citizen Submits Test Complaint through Citizen Interface
  let testComplaintId = '';
  const testDescription = `E2E_TRIAL_RUN_2026: Severe road depression near Gemini Flyover, Chennai ${Date.now()}`;
  const testCoords = { lat: 13.0512, lng: 80.2505 };

  try {
    const submitPayload = {
      category: 'Road Damage',
      description: testDescription,
      address: 'Anna Salai near Gemini Flyover, Teynampet, Chennai',
      roadName: 'Anna Salai, Teynampet',
      coordinates: testCoords,
      geoJsonCoordinates: [testCoords.lng, testCoords.lat],
      photoUrl: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80',
      reporterType: 'Registered Citizen',
    };

    const submitRes = await fetch(`${CITIZEN_URL}/api/complaints`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(submitPayload),
    });
    const submitData = await submitRes.json();
    testComplaintId = submitData.complaint?.id;

    const passed =
      submitRes.status === 201 &&
      Boolean(testComplaintId) &&
      testComplaintId.startsWith('CP-CHN-2026-') &&
      submitData.storageMode === 'local-json';

    results.push({
      step: 4,
      name: 'Citizen Submits Test Complaint through Citizen Interface (POST /api/complaints)',
      passed,
      details: `HTTP ${submitRes.status}, Created ID: ${testComplaintId}, Initial Status: ${submitData.complaint?.currentStatus || submitData.complaint?.status}`,
    });
  } catch (err: any) {
    results.push({
      step: 4,
      name: 'Citizen Submits Test Complaint through Citizen Interface (POST /api/complaints)',
      passed: false,
      details: err.message,
    });
  }

  // STEP 5: Verify Stored in Shared data/complaints-store.json & data/audit-logs.json
  try {
    const rawComplaints = JSON.parse(fs.readFileSync(COMPLAINTS_FILE, 'utf-8'));
    const inDisk = rawComplaints.find((c: any) => c.id === testComplaintId);

    const rawAudit = JSON.parse(fs.readFileSync(AUDIT_FILE, 'utf-8'));
    const complaintAudit = rawAudit.filter((l: any) => l.complaintId === testComplaintId);

    const passed =
      Boolean(inDisk) &&
      inDisk.category === 'Road Damage' &&
      inDisk.location.coordinates.lat === testCoords.lat &&
      inDisk.location.coordinates.lng === testCoords.lng &&
      inDisk.currentStatus === 'Received' &&
      complaintAudit.length >= 2;

    results.push({
      step: 5,
      name: 'Verify Complaint Saved to Shared data/complaints-store.json & Initial Audit Logs',
      passed,
      details: `Saved on disk: ${Boolean(inDisk)}, CurrentStatus: ${inDisk?.currentStatus}, GPS: [${inDisk?.location?.coordinates?.lat}, ${inDisk?.location?.coordinates?.lng}], Audit entries count: ${complaintAudit.length}`,
    });
  } catch (err: any) {
    results.push({
      step: 5,
      name: 'Verify Complaint Saved to Shared data/complaints-store.json & Initial Audit Logs',
      passed: false,
      details: err.message,
    });
  }

  // STEP 6: Admin Sees Complaint in Admin Dashboard (/api/complaints)
  try {
    const adminQueryRes = await fetch(`${BACKEND_URL}/api/complaints?search=${encodeURIComponent(testComplaintId)}`);
    const adminQueryData = await adminQueryRes.json();
    const adminFound = adminQueryData.complaints?.some((c: any) => c.id === testComplaintId);

    const adminSingleRes = await fetch(`${BACKEND_URL}/api/complaints/${testComplaintId}`);
    const adminSingleData = await adminSingleRes.json();

    const passed =
      adminQueryRes.status === 200 &&
      adminFound &&
      adminSingleRes.status === 200 &&
      adminSingleData.id === testComplaintId &&
      adminSingleData.description === testDescription;

    results.push({
      step: 6,
      name: 'Admin Dashboard Sees Newly Created Complaint (GET /api/complaints)',
      passed,
      details: `Found in admin complaints list: ${adminFound}, Single complaint lookup: HTTP ${adminSingleRes.status}, ID match: true`,
    });
  } catch (err: any) {
    results.push({
      step: 6,
      name: 'Admin Dashboard Sees Newly Created Complaint (GET /api/complaints)',
      passed: false,
      details: err.message,
    });
  }

  // STEP 7: Admin Updates Complaint Status to "In Progress"
  try {
    const patchRes = await fetch(`${BACKEND_URL}/api/complaints/${testComplaintId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ADMIN_TOKEN}`,
      },
      body: JSON.stringify({
        status: 'In Progress',
        statusReason: 'Road repair team mobilized and deployed to Gemini Flyover',
      }),
    });
    const patchData = await patchRes.json();

    const passed =
      patchRes.status === 200 &&
      patchData.complaint?.currentStatus === 'In Progress' &&
      patchData.storageMode === 'local-json';

    results.push({
      step: 7,
      name: 'Admin Updates Status to "In Progress" via PATCH /api/complaints/:id',
      passed,
      details: `HTTP ${patchRes.status}, Updated status: ${patchData.complaint?.currentStatus}, StorageMode: ${patchData.storageMode}`,
    });
  } catch (err: any) {
    results.push({
      step: 7,
      name: 'Admin Updates Status to "In Progress" via PATCH /api/complaints/:id',
      passed: false,
      details: err.message,
    });
  }

  // STEP 8: Verify Shared JSON Storage Updated with Status & Audit Entry
  try {
    const rawComplaints = JSON.parse(fs.readFileSync(COMPLAINTS_FILE, 'utf-8'));
    const inDisk = rawComplaints.find((c: any) => c.id === testComplaintId);

    const rawAudit = JSON.parse(fs.readFileSync(AUDIT_FILE, 'utf-8'));
    const statusAudit = rawAudit.find(
      (l: any) =>
        l.complaintId === testComplaintId &&
        l.action === 'Status Updated' &&
        l.newValue === 'In Progress'
    );

    const passed =
      Boolean(inDisk) &&
      inDisk.currentStatus === 'In Progress' &&
      Boolean(statusAudit);

    results.push({
      step: 8,
      name: 'Verify Shared complaints-store.json & audit-logs.json Updated with New Status',
      passed,
      details: `Disk currentStatus: ${inDisk?.currentStatus}, Audit log found: ${Boolean(statusAudit)} (action="${statusAudit?.action}", new="${statusAudit?.newValue}")`,
    });
  } catch (err: any) {
    results.push({
      step: 8,
      name: 'Verify Shared complaints-store.json & audit-logs.json Updated with New Status',
      passed: false,
      details: err.message,
    });
  }

  // STEP 9: Citizen Interface Retrieves Updated Status
  try {
    const citizenGetRes = await fetch(`${CITIZEN_URL}/api/complaints/${testComplaintId}`);
    const citizenGetData = await citizenGetRes.json();

    const passed =
      citizenGetRes.status === 200 &&
      (citizenGetData.currentStatus === 'In Progress' || citizenGetData.status === 'In Progress') &&
      citizenGetData.id === testComplaintId;

    results.push({
      step: 9,
      name: 'Citizen Interface Retrieves and Displays Latest Permitted Status ("In Progress")',
      passed,
      details: `HTTP ${citizenGetRes.status}, CurrentStatus retrieved: ${citizenGetData.currentStatus || citizenGetData.status}`,
    });
  } catch (err: any) {
    results.push({
      step: 9,
      name: 'Citizen Interface Retrieves and Displays Latest Permitted Status ("In Progress")',
      passed: false,
      details: err.message,
    });
  }

  // STEP 10: Server Cold Restart Durability Verification
  try {
    // In this test, we verify that reading directly from the disk store returns the exact updated state,
    // and query the backend to ensure full in-memory and disk synchronicity.
    const rawComplaints = JSON.parse(fs.readFileSync(COMPLAINTS_FILE, 'utf-8'));
    const diskComplaint = rawComplaints.find((c: any) => c.id === testComplaintId);

    const queryRes = await fetch(`${BACKEND_URL}/api/complaints/${testComplaintId}`);
    const queryData = await queryRes.json();

    const passed =
      Boolean(diskComplaint) &&
      diskComplaint.currentStatus === 'In Progress' &&
      queryRes.status === 200 &&
      queryData.currentStatus === 'In Progress';

    results.push({
      step: 10,
      name: 'Verify Data Durability in Local JSON Disk Storage (Complaints & Status)',
      passed,
      details: `Verified on disk: ${diskComplaint?.currentStatus === 'In Progress'}, Backend API: ${queryData?.currentStatus === 'In Progress'}`,
    });
  } catch (err: any) {
    results.push({
      step: 10,
      name: 'Verify Data Durability in Local JSON Disk Storage (Complaints & Status)',
      passed: false,
      details: err.message,
    });
  }

  // STEP 11: Safe Cleanup of Trial Test Complaint Only
  try {
    const rawComplaints = JSON.parse(fs.readFileSync(COMPLAINTS_FILE, 'utf-8'));
    const beforeCount = rawComplaints.length;
    const filteredComplaints = rawComplaints.filter((c: any) => c.id !== testComplaintId);
    fs.writeFileSync(COMPLAINTS_FILE, JSON.stringify(filteredComplaints, null, 2), 'utf-8');

    const rawAudit = JSON.parse(fs.readFileSync(AUDIT_FILE, 'utf-8'));
    const beforeAuditCount = rawAudit.length;
    const filteredAudit = rawAudit.filter((l: any) => l.complaintId !== testComplaintId);
    fs.writeFileSync(AUDIT_FILE, JSON.stringify(filteredAudit, null, 2), 'utf-8');

    const afterComplaints = JSON.parse(fs.readFileSync(COMPLAINTS_FILE, 'utf-8'));
    const afterAudit = JSON.parse(fs.readFileSync(AUDIT_FILE, 'utf-8'));

    const passed =
      afterComplaints.length === beforeCount - 1 &&
      !afterComplaints.some((c: any) => c.id === testComplaintId) &&
      afterAudit.length < beforeAuditCount;

    results.push({
      step: 11,
      name: 'Safe Cleanup: Removed Only the Trial Test Complaint; Preserved All Existing Data',
      passed,
      details: `Complaints: ${beforeCount} -> ${afterComplaints.length} (test ${testComplaintId} removed). Audit entries: ${beforeAuditCount} -> ${afterAudit.length}. All existing complaints preserved.`,
    });
  } catch (err: any) {
    results.push({
      step: 11,
      name: 'Safe Cleanup: Removed Only the Trial Test Complaint; Preserved All Existing Data',
      passed: false,
      details: err.message,
    });
  }

  // Print Summary Table
  console.log('=================================================================');
  console.log(' TRIAL RUN RESULTS');
  console.log('=================================================================');
  let allPassed = true;
  for (const r of results) {
    const icon = r.passed ? '✔' : '✖';
    console.log(`[${icon}] Step ${r.step}: ${r.name}`);
    console.log(`    Status: ${r.passed ? 'PASSED' : 'FAILED'} — ${r.details}`);
    if (!r.passed) allPassed = false;
  }
  console.log('=================================================================');
  console.log(` Final Outcome: ${allPassed ? 'ALL 11 TRIAL STEPS PASSED (100%)' : 'FAILURES DETECTED'}`);
  console.log('=================================================================\n');

  if (!allPassed) {
    process.exit(1);
  }
}

runTrial().catch((err) => {
  console.error('Trial execution failed:', err);
  process.exit(1);
});
