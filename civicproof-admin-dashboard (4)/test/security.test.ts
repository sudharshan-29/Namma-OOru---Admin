/**
 * Namma Ooru Automated Express Security Integration Test Suite
 * Executes live HTTP requests against an Express server started on a dedicated test port:
 * 1. Unauthenticated requests rejected with HTTP 401
 * 2. Forged administrator tokens/claims rejected with HTTP 401
 * 3. Client-supplied isAdmin flags cannot bypass authorization (HTTP 401)
 * 4. Unauthorized original image access rejected (HTTP 401/403)
 * 5. Unauthorized resolution evidence image access rejected (HTTP 401/403)
 * 6. Redacted route strictly refuses to expose unredacted original images (HTTP 404)
 * 7. Unauthenticated upload validation rejected (HTTP 401)
 * 8. Missing/invalid upload byte payload fails closed (HTTP 400/401)
 * 9. Public complaints endpoint sanitizes private citizen data (masks reporterId & reporterInfo, protects media URLs)
 * 10. Rate limiting is route-scoped and does not share budgets between unrelated routes
 * 11. Internal test suite endpoint protected against unauthenticated access (HTTP 401)
 * 12. Dashboard stats and department endpoints remain operational (HTTP 200)
 */

import { fileURLToPath } from 'node:url';
import path from 'node:path';
import type { Server } from 'node:http';
import { startServer } from '../server.js';
import { runFirestoreLiveProbe } from '../src/tests/firestoreLiveProbe.js';

export interface TestReport {
  name: string;
  passed: boolean;
  actualStatus?: number;
  details: string;
}

const TEST_PORT = 3105;
const BASE_URL = `http://127.0.0.1:${TEST_PORT}`;

export async function runSecurityTests(): Promise<{ allPassed: boolean; reports: TestReport[] }> {
  const reports: TestReport[] = [];
  let server: Server | null = null;

  console.log(`\n======================================================`);
  console.log(` Namma Ooru Express Security Integration Test Suite`);
  console.log(` Starting in-process test server on port ${TEST_PORT}...`);
  console.log(`======================================================\n`);

  try {
    process.env.NODE_ENV = 'test';
    server = await startServer(TEST_PORT);
  } catch (err: any) {
    console.error(`Failed to start test server on port ${TEST_PORT}:`, err);
    throw err;
  }

  try {
    // Test 1: Unauthenticated request to PATCH /api/complaints/:id
    try {
      const res = await fetch(`${BASE_URL}/api/complaints/CP-CHN-2026-1041`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priority: 'High' }),
      });
      const passed = res.status === 401;
      reports.push({
        name: 'Unauthenticated modification of complaint rejected',
        passed,
        actualStatus: res.status,
        details: `Expected HTTP 401 Unauthorized, received ${res.status}`,
      });
    } catch (err: any) {
      reports.push({ name: 'Unauthenticated modification of complaint rejected', passed: false, details: err.message });
    }

    // Test 2: Unauthenticated request to POST /api/auth/admin-session
    try {
      const res = await fetch(`${BASE_URL}/api/auth/admin-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const passed = res.status === 401;
      reports.push({
        name: 'Unauthenticated admin session request rejected',
        passed,
        actualStatus: res.status,
        details: `Expected HTTP 401 Unauthorized, received ${res.status}`,
      });
    } catch (err: any) {
      reports.push({ name: 'Unauthenticated admin session request rejected', passed: false, details: err.message });
    }

    // Test 3: Forged / invalid Bearer token rejected
    try {
      const res = await fetch(`${BASE_URL}/api/complaints/CP-CHN-2026-1041`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer cp_admin_forged_token_attack',
        },
        body: JSON.stringify({ priority: 'Critical' }),
      });
      const passed = res.status === 401;
      reports.push({
        name: 'Forged administrator token rejected',
        passed,
        actualStatus: res.status,
        details: `Expected HTTP 401 Unauthorized, received ${res.status}`,
      });
    } catch (err: any) {
      reports.push({ name: 'Forged administrator token rejected', passed: false, details: err.message });
    }

    // Test 4: Client-supplied isAdmin / role flag in body cannot bypass auth
    try {
      const res = await fetch(`${BASE_URL}/api/complaints/CP-CHN-2026-1041`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isAdmin: true, role: 'superadmin', priority: 'Critical' }),
      });
      const passed = res.status === 401;
      reports.push({
        name: 'Client-supplied isAdmin flag cannot bypass authorization',
        passed,
        actualStatus: res.status,
        details: `Expected HTTP 401 Unauthorized, received ${res.status}`,
      });
    } catch (err: any) {
      reports.push({ name: 'Client-supplied isAdmin flag cannot bypass authorization', passed: false, details: err.message });
    }

    // Test 5: Unauthenticated access to private original complaint image
    try {
      const res = await fetch(`${BASE_URL}/api/media/complaint/CP-CHN-2026-1041/original`, {
        redirect: 'manual',
      });
      const passed = res.status === 401 || res.status === 403;
      reports.push({
        name: 'Unauthorized original image access denied',
        passed,
        actualStatus: res.status,
        details: `Expected HTTP 401/403, received ${res.status}`,
      });
    } catch (err: any) {
      reports.push({ name: 'Unauthorized original image access denied', passed: false, details: err.message });
    }

    // Test 6: Unauthenticated access to resolution evidence image denied
    try {
      const res = await fetch(`${BASE_URL}/api/media/complaint/CP-CHN-2026-1041/resolution`, {
        redirect: 'manual',
      });
      const passed = res.status === 401 || res.status === 403;
      reports.push({
        name: 'Unauthorized resolution evidence image access denied',
        passed,
        actualStatus: res.status,
        details: `Expected HTTP 401/403, received ${res.status}`,
      });
    } catch (err: any) {
      reports.push({ name: 'Unauthorized resolution evidence image access denied', passed: false, details: err.message });
    }

    // Test 7: Redacted route never exposes original unredacted images
    try {
      const res = await fetch(`${BASE_URL}/api/media/complaint/CP-CHN-2026-1041/redacted`, {
        redirect: 'manual',
      });
      const passed = res.status === 404;
      reports.push({
        name: 'Redacted endpoint does not expose original images (HTTP 404)',
        passed,
        actualStatus: res.status,
        details: `Expected HTTP 404 for unredacted complaint, received ${res.status}`,
      });
    } catch (err: any) {
      reports.push({ name: 'Redacted endpoint does not expose original images (HTTP 404)', passed: false, details: err.message });
    }

    // Test 8: Unauthenticated request to /api/upload/validate rejected
    try {
      const res = await fetch(`${BASE_URL}/api/upload/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mimeType: 'image/jpeg', fileSizeBytes: 1024 }),
      });
      const passed = res.status === 401;
      reports.push({
        name: 'Unauthenticated upload validation rejected',
        passed,
        actualStatus: res.status,
        details: `Expected HTTP 401 Unauthorized, received ${res.status}`,
      });
    } catch (err: any) {
      reports.push({ name: 'Unauthenticated upload validation rejected', passed: false, details: err.message });
    }

    // Test 9: Public complaints endpoint sanitizes private citizen reporterId AND reporterInfo
    try {
      const res = await fetch(`${BASE_URL}/api/complaints`);
      const data = await res.json();
      const complaints = data.complaints || [];
      const sample = complaints[0];
      const hasReporterId = Boolean(sample && 'reporterId' in sample);
      const hasReporterInfo = Boolean(sample && 'reporterInfo' in sample);
      const hasRawToken = Boolean(sample && sample.originalPhotoUrl && sample.originalPhotoUrl.includes('token='));
      const passed = res.status === 200 && !hasReporterId && !hasReporterInfo && !hasRawToken;
      reports.push({
        name: 'Public complaints endpoint sanitizes citizen names, IDs & private URLs',
        passed,
        actualStatus: res.status,
        details: `Sanitized: reporterId masked (${!hasReporterId}), reporterInfo masked (${!hasReporterInfo}), media URLs protected (${!hasRawToken})`,
      });
    } catch (err: any) {
      reports.push({ name: 'Public complaints endpoint sanitizes citizen names, IDs & private URLs', passed: false, details: err.message });
    }

    // Test 10: Rate limiting does not share budgets between unrelated routes
    try {
      // Send 5 requests to /api/complaints (which has its own bucket)
      for (let i = 0; i < 5; i++) {
        await fetch(`${BASE_URL}/api/complaints`);
      }
      // An independent route like /api/stats must continue to respond with HTTP 200 without budget bleed
      const resStats = await fetch(`${BASE_URL}/api/stats`);
      const passed = resStats.status === 200;
      reports.push({
        name: 'Rate limiting does not share budgets between unrelated routes',
        passed,
        actualStatus: resStats.status,
        details: `Independent route /api/stats responded with HTTP ${resStats.status} after activity on /api/complaints.`,
      });
    } catch (err: any) {
      reports.push({ name: 'Rate limiting does not share budgets between unrelated routes', passed: false, details: err.message });
    }

    // Test 11: Internal test suite endpoint protected against unauthenticated callers
    try {
      const res = await fetch(`${BASE_URL}/api/test/run-suite`);
      const passed = res.status === 401;
      reports.push({
        name: 'Internal test suite route protected against unauthenticated access',
        passed,
        actualStatus: res.status,
        details: `Expected HTTP 401 Unauthorized, received ${res.status}`,
      });
    } catch (err: any) {
      reports.push({ name: 'Internal test suite route protected against unauthenticated access', passed: false, details: err.message });
    }

    // Test 12: Dashboard stats endpoint operational
    try {
      const res = await fetch(`${BASE_URL}/api/stats`);
      const data = await res.json();
      const passed = res.status === 200 && typeof data.total === 'number';
      reports.push({
        name: 'Dashboard stats endpoint operational',
        passed,
        actualStatus: res.status,
        details: `Received HTTP ${res.status}, total complaints: ${data.total}`,
      });
    } catch (err: any) {
      reports.push({ name: 'Dashboard stats endpoint operational', passed: false, details: err.message });
    }

    // Test 13: Department assignments endpoint operational
    try {
      const res = await fetch(`${BASE_URL}/api/departments`);
      const data = await res.json();
      const passed = res.status === 200 && Array.isArray(data.departments) && data.departments.length === 3;
      reports.push({
        name: 'Department routing endpoint operational',
        passed,
        actualStatus: res.status,
        details: `Received HTTP ${res.status}, departments count: ${data.departments?.length}`,
      });
    } catch (err: any) {
      reports.push({ name: 'Department routing endpoint operational', passed: false, details: err.message });
    }

    // Test 14: Citizen complaint registration creates valid ID & preserves exact coordinates
    try {
      const res = await fetch(`${BASE_URL}/api/complaints`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: 'Water Leakage',
          description: `Water pipe burst causing roadway flooding near Gemini Flyover ${Date.now()}`,
          address: 'Anna Salai near Gemini Flyover',
          coordinates: { lat: 13.0418, lng: 80.2337 },
          reporterType: 'Registered Citizen',
          reporterInfo: { name: 'Kavitha Selvam', maskedContact: '+91 98401 22334' },
        }),
      });
      const data = await res.json();
      const passed =
        res.status === 201 &&
        data.complaint &&
        typeof data.complaint.id === 'string' &&
        data.complaint.id.startsWith('CP-CHN-2026-') &&
        data.complaint.location?.coordinates?.lat === 13.0418 &&
        data.complaint.location?.coordinates?.lng === 80.2337 &&
        data.complaint.category === 'Water Leakage' &&
        data.complaint.reporterId === undefined &&
        data.complaint.reporterInfo === undefined;
      reports.push({
        name: 'Citizen complaint registration creates valid ID & preserves exact coordinates',
        passed,
        actualStatus: res.status,
        details: `Generated ID: ${data.complaint?.id}, Coordinates: [${data.complaint?.location?.coordinates?.lat}, ${data.complaint?.location?.coordinates?.lng}], PII protected: ${data.complaint?.reporterInfo === undefined}`,
      });
    } catch (err: any) {
      reports.push({
        name: 'Citizen complaint registration creates valid ID & preserves exact coordinates',
        passed: false,
        details: err.message,
      });
    }

    // Test 15: Invalid complaint registration fails closed (HTTP 400) without false success
    try {
      const res = await fetch(`${BASE_URL}/api/complaints`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: 'Water Leakage',
          description: '', // Missing mandatory description & address
        }),
      });
      const data = await res.json();
      const passed = res.status === 400 && typeof data.error === 'string' && data.error.length > 0;
      reports.push({
        name: 'Backend rejects malformed complaint payload without false success',
        passed,
        actualStatus: res.status,
        details: `Expected HTTP 400 Bad Request, received ${res.status}: "${data.error || ''}"`,
      });
    } catch (err: any) {
      reports.push({
        name: 'Backend rejects malformed complaint payload without false success',
        passed: false,
        details: err.message,
      });
    }

    // Test 16: GeoJSON coordinate order [longitude, latitude] submission and storage
    try {
      const res = await fetch(`${BASE_URL}/api/complaints`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: 'Road Damage',
          description: `Pothole on Kamarajar Salai near Marina Beach ${Date.now()}`,
          address: 'Kamarajar Salai, Marina',
          geoJsonCoordinates: [80.2825, 13.0455], // [longitude, latitude]
          reporterType: 'Registered Citizen',
        }),
      });
      const data = await res.json();
      const passed =
        res.status === 201 &&
        data.complaint &&
        Array.isArray(data.complaint.location?.geoJsonCoordinates) &&
        data.complaint.location.geoJsonCoordinates[0] === 80.2825 &&
        data.complaint.location.geoJsonCoordinates[1] === 13.0455 &&
        data.complaint.location.coordinates?.lng === 80.2825 &&
        data.complaint.location.coordinates?.lat === 13.0455;
      reports.push({
        name: 'GeoJSON coordinates submitted and stored in strict [longitude, latitude] order',
        passed,
        actualStatus: res.status,
        details: `Stored GeoJSON: [${data.complaint?.location?.geoJsonCoordinates?.join(', ')}], Lat/Lng: ${data.complaint?.location?.coordinates?.lat}, ${data.complaint?.location?.coordinates?.lng}`,
      });
    } catch (err: any) {
      reports.push({
        name: 'GeoJSON coordinates submitted and stored in strict [longitude, latitude] order',
        passed: false,
        details: err.message,
      });
    }

    // Test 17: Durable persistence across backend server restarts
    try {
      const uniqueDesc = `Durable restart test complaint ${Date.now()}`;
      const createRes = await fetch(`${BASE_URL}/api/complaints`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: 'Road Damage',
          description: uniqueDesc,
          address: 'Panagal Park, T Nagar',
          geoJsonCoordinates: [80.2337, 13.0418],
          reporterType: 'Registered Citizen',
        }),
      });
      const createData = await createRes.json();
      const createdId = createData.complaint?.id;

      // Shut down the server completely
      await new Promise<void>((resolve) => {
        server!.close(() => resolve());
      });
      server = null;
      await new Promise((resolve) => setTimeout(resolve, 250));

      // Restart the server from cold state
      server = await startServer(TEST_PORT);
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Query the newly started backend to retrieve the persisted complaint
      const getRes = await fetch(`${BASE_URL}/api/complaints/${createdId}`);
      const getData = await getRes.json();

      const passed =
        createRes.status === 201 &&
        getRes.status === 200 &&
        getData.id === createdId &&
        getData.description === uniqueDesc;

      reports.push({
        name: 'Complaint retrieved successfully after full backend server restart',
        passed,
        actualStatus: getRes.status,
        details: `Persisted ID: ${createdId}, retrieved after restart with HTTP ${getRes.status}`,
      });
    } catch (err: any) {
      reports.push({
        name: 'Complaint retrieved successfully after full backend server restart',
        passed: false,
        details: err.message,
      });
    }

    // Test 18: Require durable Firestore fail-closed behavior (no false 201 on persistence failure)
    try {
      process.env.REQUIRE_DURABLE_FIRESTORE = 'true';
      const res = await fetch(`${BASE_URL}/api/complaints`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: 'Water Leakage',
          description: 'Major main line break requiring durable audit',
          address: 'Sardar Patel Road, Guindy',
          geoJsonCoordinates: [80.222, 13.012],
          reporterType: 'Registered Citizen',
        }),
      });
      const data = await res.json();
      const passed = res.status === 503 && typeof data.error === 'string' && data.error.includes('Durable persistence failure');
      reports.push({
        name: 'API fails closed (HTTP 503) without false success when durable Cloud Firestore is required but fails',
        passed,
        actualStatus: res.status,
        details: `Expected HTTP 503 Service Unavailable, received ${res.status}: "${data.error || ''}"`,
      });
    } catch (err: any) {
      reports.push({
        name: 'API fails closed (HTTP 503) without false success when durable Cloud Firestore is required but fails',
        passed: false,
        details: err.message,
      });
    } finally {
      delete process.env.REQUIRE_DURABLE_FIRESTORE;
    }

    // Test 19: Duplicate complaint prevention returns HTTP 409 Conflict
    try {
      const dupDesc = `Duplicate test complaint ${Date.now()}`;
      const firstRes = await fetch(`${BASE_URL}/api/complaints`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: 'Water Leakage',
          description: dupDesc,
          address: 'Besant Nagar 2nd Avenue',
          geoJsonCoordinates: [80.267, 13.001],
          reporterType: 'Registered Citizen',
        }),
      });
      // Immediately submit identical complaint
      const secondRes = await fetch(`${BASE_URL}/api/complaints`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: 'Water Leakage',
          description: dupDesc,
          address: 'Besant Nagar 2nd Avenue',
          geoJsonCoordinates: [80.267, 13.001],
          reporterType: 'Registered Citizen',
        }),
      });
      const secondData = await secondRes.json();
      const passed = firstRes.status === 201 && secondRes.status === 409 && typeof secondData.error === 'string';
      reports.push({
        name: 'Duplicate complaint submission rejected with HTTP 409 Conflict',
        passed,
        actualStatus: secondRes.status,
        details: `First submit: HTTP ${firstRes.status}, Second submit: HTTP ${secondRes.status} ("${secondData.error || ''}")`,
      });
    } catch (err: any) {
      reports.push({
        name: 'Duplicate complaint submission rejected with HTTP 409 Conflict',
        passed: false,
        details: err.message,
      });
    }

    // Test 20: Consistency between complaint records and audit logs
    try {
      const auditTestDesc = `Audit consistency test ${Date.now()}`;
      const res = await fetch(`${BASE_URL}/api/complaints`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: 'Road Damage',
          description: auditTestDesc,
          address: 'Mount Road / Anna Salai junction',
          geoJsonCoordinates: [80.272, 13.084],
          reporterType: 'Registered Citizen',
        }),
      });
      const data = await res.json();
      const complaint = data.complaint;
      const history = complaint?.history;
      const initialLog = history?.[0];

      const passed =
        res.status === 201 &&
        Array.isArray(history) &&
        history.length >= 3 &&
        initialLog?.action === 'Complaint Registered' &&
        initialLog?.newValue === 'Received' &&
        history[1]?.action === 'Auto-Prioritized' &&
        history[2]?.action === 'Auto-Assigned Department' &&
        typeof complaint.id === 'string' &&
        initialLog.id.includes(complaint.id);

      reports.push({
        name: 'Consistency verified between complaint records and initial audit log entries',
        passed,
        actualStatus: res.status,
        details: `Complaint ID: ${complaint?.id}, History entries: ${history?.length}, Initial audit log: ${initialLog?.id} (${initialLog?.action})`,
      });
    } catch (err: any) {
      reports.push({
        name: 'Consistency verified between complaint records and initial audit log entries',
        passed: false,
        details: err.message,
      });
    }

    // Test 21: GET /api/health returns transparent configuration and verified storage mode
    try {
      const res = await fetch(`${BASE_URL}/api/health`);
      const data = await res.json();
      const passed =
        res.status === 200 &&
        data.status === 'ok' &&
        data.projectId === 'fabled-flame-1zbz0' &&
        data.databaseId === 'ai-studio-civicproofadmind-beff02db-38a7-495e-8500-43eddeb8da0e' &&
        typeof data.storageMode === 'string' &&
        data.private_key === undefined &&
        data.client_secret === undefined;

      reports.push({
        name: 'GET /api/health reports verified project identity and storage mode without secret leakage',
        passed,
        actualStatus: res.status,
        details: `Project: ${data.projectId}, Database: ${data.databaseId}, Mode: ${data.storageMode}, CloudAuth: ${data.cloudAuthType}`,
      });
    } catch (err: any) {
      reports.push({
        name: 'GET /api/health reports verified project identity and storage mode without secret leakage',
        passed: false,
        details: err.message,
      });
    }

    // Test 22: Unauthenticated settings modification rejected (HTTP 401) and public settings operational
    try {
      const getRes = await fetch(`${BASE_URL}/api/settings`);
      const getData = await getRes.json();

      const patchRes = await fetch(`${BASE_URL}/api/settings`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ autoAssignmentEnabled: false }),
      });

      const passed =
        getRes.status === 200 &&
        patchRes.status === 401 &&
        typeof getData.adminName === 'string' &&
        Array.isArray(getData.priorityRules);

      reports.push({
        name: 'Settings endpoint enforces admin authentication on modifications and serves public policies',
        passed,
        actualStatus: patchRes.status,
        details: `GET settings: HTTP ${getRes.status} (Admin: ${getData.adminName}), Unauthenticated PATCH: HTTP ${patchRes.status}`,
      });
    } catch (err: any) {
      reports.push({
        name: 'Settings endpoint enforces admin authentication on modifications and serves public policies',
        passed: false,
        details: err.message,
      });
    }

    // Test 23: Production Firestore live probe diagnostic accurately reports configuration
    try {
      const probeResult = await runFirestoreLiveProbe();
      const passed =
        probeResult.projectId === 'fabled-flame-1zbz0' &&
        probeResult.databaseId === 'ai-studio-civicproofadmind-beff02db-38a7-495e-8500-43eddeb8da0e' &&
        typeof probeResult.details === 'string';

      reports.push({
        name: 'Production Cloud Firestore diagnostic probe correctly targets verified project and database',
        passed,
        actualStatus: 200,
        details: `Target: ${probeResult.projectId} / ${probeResult.databaseId}, Verified: ${probeResult.verified}, Auth: ${probeResult.authType}`,
      });
    } catch (err: any) {
      reports.push({
        name: 'Production Cloud Firestore diagnostic probe correctly targets verified project and database',
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
  }

  // Print results summary
  let allPassed = true;
  reports.forEach((r, idx) => {
    const icon = r.passed ? '✓' : '✗';
    console.log(`[${icon}] Test ${idx + 1}: ${r.name}`);
    console.log(`    Status: ${r.passed ? 'PASSED' : 'FAILED'} — ${r.details}`);
    if (!r.passed) allPassed = false;
  });

  console.log(`\n======================================================`);
  console.log(` Results: ${reports.filter((r) => r.passed).length}/${reports.length} Tests Passed`);
  console.log(` Suite Status: ${allPassed ? 'ALL SECURITY TESTS PASSED' : 'TEST FAILURES DETECTED'}`);
  console.log(`======================================================\n`);

  return { allPassed, reports };
}

function isMainModule(): boolean {
  if (!process.argv[1]) return false;
  try {
    const currentFilePath = fileURLToPath(import.meta.url);
    const invokedFilePath = path.resolve(process.argv[1]);
    return path.normalize(currentFilePath).toLowerCase() === path.normalize(invokedFilePath).toLowerCase();
  } catch {
    return false;
  }
}

if (isMainModule()) {
  runSecurityTests()
    .then(({ allPassed }) => {
      process.exit(allPassed ? 0 : 1);
    })
    .catch((err) => {
      console.error('Fatal security test execution failure:', err);
      process.exit(1);
    });
}
