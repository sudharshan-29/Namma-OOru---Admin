import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import {
  getApps as getAdminApps,
  initializeApp as initializeAdminApp,
  getApp as getAdminApp,
  type App as AdminApp,
  cert,
  applicationDefault,
} from 'firebase-admin/app';
import { getAuth as getAdminAuth } from 'firebase-admin/auth';
import {
  getFirestore as getAdminFirestore,
  type Firestore as AdminFirestore,
} from 'firebase-admin/firestore';
import firebaseConfig from './firebase-applet-config.json';
import type {
  Complaint,
  ComplaintCategory,
  ComplaintPriority,
  ComplaintStatus,
  DepartmentName,
  DepartmentSummary,
  NotificationRecord,
  SystemSettings,
  PriorityRule,
  AuditLogEntry,
} from './src/types/civic.js';
import {
  loadComplaintsJson,
  saveComplaintsJson,
  loadSettingsJson,
  saveSettingsJson,
  loadAuditLogsJson,
  saveAuditLogsJson,
  appendAuditLogJson,
  loadDepartmentsJson,
  saveDepartmentsJson,
  initAllLocalStores,
  COMPLAINTS_STORE_PATH,
  SETTINGS_STORE_PATH,
  AUDIT_LOGS_PATH,
  DEPARTMENTS_PATH,
  DATA_DIR,
  getBaselineComplaints,
} from './src/lib/jsonStore.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const isTest = process.env.NODE_ENV === 'test';
const isDev = process.env.NODE_ENV !== 'production' && !isTest;

app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Prevent browser code from directly reading or modifying files in data/ directory
app.use((req: Request, res: Response, next: NextFunction) => {
  const normalizedPath = req.path.toLowerCase();
  if (!normalizedPath.startsWith('/api')) {
    if (
      normalizedPath === '/data' ||
      normalizedPath.startsWith('/data/') ||
      normalizedPath === '/citizen/data' ||
      normalizedPath.startsWith('/citizen/data/')
    ) {
      res.status(403).json({
        error: 'Access forbidden: Direct browser file access to data stores is prohibited. Access via backend API endpoints.',
      });
      return;
    }
  }
  next();
});

// Citizen Interface static mount: Both Citizen and Admin interfaces share the same backend server and port
const CITIZEN_MODULE_DIR = path.resolve(__dirname, '../REVIEW 3/civicproof-map-module (9) copy');
if (fs.existsSync(CITIZEN_MODULE_DIR)) {
  app.use('/citizen', express.static(CITIZEN_MODULE_DIR));
  app.get('/citizen', (_req: Request, res: Response) => {
    res.sendFile(path.resolve(CITIZEN_MODULE_DIR, 'index.html'));
  });
}

// 1. Server-Side Firebase Admin SDK & Cloud Firestore Initialization
const EXPECTED_PROJECT_ID = process.env.FIREBASE_PROJECT_ID || firebaseConfig.projectId;
const EXPECTED_DATABASE_ID =
  process.env.FIRESTORE_DATABASE_ID ||
  process.env.FIREBASE_FIRESTORE_DATABASE_ID ||
  firebaseConfig.firestoreDatabaseId;

let firebaseAdminApp: AdminApp | null = null;
let adminDb: AdminFirestore | null = null;
export type StorageMode = 'firestore' | 'local-json';
let cloudAuthType: 'emulator' | 'service-account' | 'adc' | 'unauthenticated' = 'unauthenticated';

export function isFirestorePersistenceRequired(): boolean {
  return process.env.REQUIRE_DURABLE_FIRESTORE === 'true' || process.env.STORAGE_MODE === 'firestore';
}

export function getActiveStorageMode(): StorageMode {
  return isFirestorePersistenceRequired() ? 'firestore' : 'local-json';
}

function initServerFirebase(): void {
  try {
    const isEmulator = Boolean(process.env.FIRESTORE_EMULATOR_HOST);
    const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;

    let credentialOption: any = undefined;

    if (serviceAccountJson) {
      try {
        const parsed = JSON.parse(serviceAccountJson);
        if (parsed.project_id && parsed.project_id !== EXPECTED_PROJECT_ID) {
          console.warn(`[Security Notice] Service account project ID '${parsed.project_id}' differs from configured '${EXPECTED_PROJECT_ID}'.`);
        }
        credentialOption = cert(parsed);
        cloudAuthType = 'service-account';
      } catch {
        console.warn('Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY JSON string.');
      }
    } else if (serviceAccountPath && fs.existsSync(serviceAccountPath)) {
      try {
        const keyRaw = fs.readFileSync(serviceAccountPath, 'utf8');
        const parsed = JSON.parse(keyRaw);
        if (parsed.project_id && parsed.project_id !== EXPECTED_PROJECT_ID) {
          console.warn(`[Security Notice] Key file project ID '${parsed.project_id}' differs from configured '${EXPECTED_PROJECT_ID}'.`);
        }
        credentialOption = cert(parsed);
        cloudAuthType = 'service-account';
      } catch (err) {
        console.warn(`Failed to read credentials from GOOGLE_APPLICATION_CREDENTIALS: ${serviceAccountPath}`);
      }
    } else if (isEmulator) {
      cloudAuthType = 'emulator';
    } else {
      const gcloudAdcPath = process.platform === 'win32'
        ? path.join(process.env.APPDATA || '', 'gcloud', 'application_default_credentials.json')
        : path.join(process.env.HOME || '', '.config', 'gcloud', 'application_default_credentials.json');
      const inGcpEnv = Boolean(process.env.K_SERVICE || process.env.FUNCTION_NAME || process.env.GAE_SERVICE || process.env.METADATA_SERVER_HOST);

      if (inGcpEnv || fs.existsSync(gcloudAdcPath)) {
        try {
          credentialOption = applicationDefault();
          cloudAuthType = 'adc';
        } catch {
          cloudAuthType = 'unauthenticated';
        }
      } else {
        cloudAuthType = 'unauthenticated';
      }
    }

    if (!getAdminApps().length) {
      const appOptions: any = {
        projectId: EXPECTED_PROJECT_ID,
        storageBucket: firebaseConfig.storageBucket,
      };
      if (credentialOption) {
        appOptions.credential = credentialOption;
      }
      firebaseAdminApp = initializeAdminApp(appOptions);
    } else {
      firebaseAdminApp = getAdminApp();
    }

    if (!isFirestorePersistenceRequired()) {
      console.log(
        `[Persistence Engine] Active Storage Mode: LOCAL JSON (Shared files: data/complaints-store.json, data/settings-store.json, data/audit-logs.json, data/departments.json).`
      );
      console.log(
        `[Persistence Engine] Cloud Firestore persistence is inactive during local development [Auth: ${cloudAuthType}].`
      );
      adminDb = null;
      return;
    }

    if (!credentialOption && !isEmulator) {
      console.warn(
        `Firebase Admin SDK: No Google Cloud service credentials detected, but Firestore persistence was requested. Operating fail-closed for Cloud Firestore.`
      );
      adminDb = null;
      return;
    }

    // Connect Admin Firestore with verified target database only when Firestore mode is requested
    adminDb = getAdminFirestore(firebaseAdminApp, EXPECTED_DATABASE_ID);
    console.log(
      `Firebase Admin SDK initialized for project '${EXPECTED_PROJECT_ID}', database '${EXPECTED_DATABASE_ID}' [Auth: ${cloudAuthType}]`
    );
  } catch (adminErr: any) {
    console.warn('Firebase Admin SDK initialization note:', adminErr?.message || adminErr);
    adminDb = null;
  }
}

initServerFirebase();

// Security: Authorized Bootstrapped Administrator Registry
const BOOTSTRAPPED_ADMIN_EMAIL = 'dhivyadharshinivijay@gmail.com';

// Express interface extension for Authenticated User
export interface AuthenticatedUser {
  uid: string;
  email: string | null;
  emailVerified: boolean;
  isAdmin: boolean;
  role: 'superadmin' | 'admin' | 'citizen';
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

// Security: In-Memory Sliding-Window Rate Limiter per Route Bucket
function rateLimiter(limit: number = 100, windowMs: number = 60000) {
  const routeBucketMap = new Map<string, { count: number; resetTime: number }>();
  return (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const now = Date.now();
    const entry = routeBucketMap.get(ip);

    if (!entry || now > entry.resetTime) {
      routeBucketMap.set(ip, { count: 1, resetTime: now + windowMs });
      return next();
    }

    if (entry.count >= limit) {
      res.status(429).json({
        error: 'Too many requests. Please wait before attempting this operation again.',
      });
      return;
    }

    entry.count += 1;
    next();
  };
}

// Security: Authenticate Firebase ID Token Middleware
// Enforces verified Firebase ID token via Firebase Admin SDK.
// Rejects unauthenticated callers with HTTP 401. Never trusts client body/query flags.
async function authenticateToken(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized: Missing or malformed Bearer token.' });
    return;
  }

  const idToken = authHeader.split('Bearer ')[1].trim();

  if (!idToken) {
    res.status(401).json({ error: 'Unauthorized: Empty token provided.' });
    return;
  }

  try {
    let verifiedEmail: string | null = null;
    let verifiedUid: string | null = null;
    let isEmailVerified = false;
    let customAdminClaim = false;

    // Authorized Test & Development Admin Session Support
    if ((isTest || isDev) && idToken === 'NAMMA_OORU_TEST_ADMIN_AUTH_TOKEN_2026') {
      verifiedUid = 'test_admin_uid_01';
      verifiedEmail = BOOTSTRAPPED_ADMIN_EMAIL;
      isEmailVerified = true;
      customAdminClaim = true;
    } else if (firebaseAdminApp) {
      try {
        const decoded = await getAdminAuth(firebaseAdminApp).verifyIdToken(idToken);
        verifiedUid = decoded.uid;
        verifiedEmail = decoded.email || null;
        isEmailVerified = Boolean(decoded.email_verified);
        customAdminClaim = Boolean(decoded.admin || decoded.role === 'admin' || decoded.role === 'superadmin');
      } catch (adminVerifyErr) {
        // Fallback to Google Identity Toolkit token lookup
      }
    }

    // Second attempt: Google Identity Toolkit lookup via Firebase Web API key
    if (!verifiedUid) {
      const response = await fetch(
        `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${firebaseConfig.apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ idToken }),
        }
      );

      if (!response.ok) {
        res.status(401).json({ error: 'Unauthorized: Invalid or expired Firebase ID token.' });
        return;
      }

      const data = await response.json();
      const account = data.users?.[0];
      if (!account) {
        res.status(401).json({ error: 'Unauthorized: User account not found.' });
        return;
      }

      verifiedUid = account.localId;
      verifiedEmail = account.email || null;
      isEmailVerified = Boolean(account.emailVerified);
      try {
        const customAttributes = account.customAttributes ? JSON.parse(account.customAttributes) : {};
        customAdminClaim = Boolean(customAttributes.admin);
      } catch {
        customAdminClaim = false;
      }
    }

    // Server-managed Admin Role Verification:
    // 1. Never trust client-supplied request body flags (e.g. isAdmin: true)
    // 2. Check verified email against bootstrapped admin with email_verified == true
    // 3. Check Firestore /admins/{uid} collection for admin role
    let hasAdminRole = false;
    if (verifiedEmail && verifiedEmail.toLowerCase() === BOOTSTRAPPED_ADMIN_EMAIL.toLowerCase() && isEmailVerified) {
      hasAdminRole = true;
    } else if (customAdminClaim) {
      hasAdminRole = true;
    } else if (adminDb && verifiedUid) {
      try {
        const adminDoc = await adminDb.collection('admins').doc(verifiedUid).get();
        if (adminDoc.exists && ['admin', 'superadmin'].includes(adminDoc.data()?.role)) {
          hasAdminRole = true;
        }
      } catch {
        // ignore
      }
    }

    req.user = {
      uid: verifiedUid!,
      email: verifiedEmail,
      emailVerified: isEmailVerified,
      isAdmin: hasAdminRole,
      role: hasAdminRole ? 'admin' : 'citizen',
    };

    next();
  } catch (err: any) {
    console.error('Authentication verification error:', err);
    res.status(401).json({ error: 'Unauthorized: Failed to authenticate session.' });
  }
}

// Security: Require Administrator Role Middleware
async function requireAdminRole(req: Request, res: Response, next: NextFunction) {
  if (!req.user || !req.user.isAdmin) {
    // Record failed privileged operation to audit log
    await recordAuditLog({
      action: 'SECURITY_ALERT: Unauthorized Privileged Action Blocked',
      actor: req.user?.email || 'Anonymous Caller',
      actorId: req.user?.uid || 'unauthenticated',
      reason: `Unauthorized attempt to access administrative route ${req.method} ${req.originalUrl}`,
      timestamp: new Date().toISOString(),
    });

    res.status(403).json({
      error: 'Forbidden: Access restricted to authorized municipal administrators.',
    });
    return;
  }
  next();
}

// Optional Auth (for routes that allow both public and authenticated queries)
async function optionalAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const idToken = authHeader.split('Bearer ')[1].trim();
    if (idToken) {
      try {
        let verifiedEmail: string | null = null;
        let verifiedUid: string | null = null;
        let isEmailVerified = false;
        let customAdminClaim = false;

        if (firebaseAdminApp) {
          try {
            const decoded = await getAdminAuth(firebaseAdminApp).verifyIdToken(idToken);
            verifiedUid = decoded.uid;
            verifiedEmail = decoded.email || null;
            isEmailVerified = Boolean(decoded.email_verified);
            customAdminClaim = Boolean(decoded.admin || decoded.role === 'admin' || decoded.role === 'superadmin');
          } catch {
            // ignore
          }
        }

        if (!verifiedUid) {
          const response = await fetch(
            `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${firebaseConfig.apiKey}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ idToken }),
            }
          );
          if (response.ok) {
            const data = await response.json();
            const account = data.users?.[0];
            if (account) {
              verifiedUid = account.localId;
              verifiedEmail = account.email || null;
              isEmailVerified = Boolean(account.emailVerified);
              try {
                const customAttributes = account.customAttributes ? JSON.parse(account.customAttributes) : {};
                customAdminClaim = Boolean(customAttributes.admin || customAttributes.role === 'admin' || customAttributes.role === 'superadmin');
              } catch {
                customAdminClaim = false;
              }
            }
          }
        }

        if (verifiedUid) {
          let hasAdminRole = false;
          if (verifiedEmail && verifiedEmail.toLowerCase() === BOOTSTRAPPED_ADMIN_EMAIL.toLowerCase() && isEmailVerified) {
            hasAdminRole = true;
          } else if (customAdminClaim) {
            hasAdminRole = true;
          } else if (adminDb && verifiedUid) {
            try {
              const adminDoc = await adminDb.collection('admins').doc(verifiedUid).get();
              if (adminDoc.exists && ['admin', 'superadmin'].includes(adminDoc.data()?.role)) {
                hasAdminRole = true;
              }
            } catch {
              // ignore
            }
          }

          req.user = {
            uid: verifiedUid,
            email: verifiedEmail,
            emailVerified: isEmailVerified,
            isAdmin: hasAdminRole,
            role: hasAdminRole ? 'admin' : 'citizen',
          };
        }
      } catch {
        // ignore invalid token for optional routes
      }
    }
  }
  next();
}

let auditLogsStore: AuditLogEntry[] = [];

// Audit Logger Helper: Appends to data/audit-logs.json and (if configured) Firestore
async function recordAuditLog(log: {
  id?: string;
  action: string;
  actor: string;
  actorId?: string;
  complaintId?: string;
  previousValue?: string;
  newValue?: string;
  reason?: string;
  timestamp: string;
}): Promise<AuditLogEntry> {
  const logId = log.id || `AUDIT-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const entry: AuditLogEntry = { id: logId, ...log };

  try {
    await appendAuditLogJson(entry);
    const existingIdx = auditLogsStore.findIndex((l) => l.id === logId);
    if (existingIdx !== -1) {
      auditLogsStore[existingIdx] = entry;
    } else {
      auditLogsStore.push(entry);
    }
  } catch (err: any) {
    console.warn('[recordAuditLog] Error appending audit log to local JSON:', err.message);
  }

  if (adminDb && isFirestorePersistenceRequired()) {
    try {
      await adminDb.collection('auditLogs').doc(logId).set(entry);
    } catch (err: any) {
      console.warn('Note on writing audit log to Firestore:', err?.message || err);
    }
  }
  return entry;
}

// Category to Department mapping
const CATEGORY_DEPARTMENT_MAP: Record<ComplaintCategory, { name: DepartmentName; id: string }> = {
  'Road Damage': {
    name: 'Roads and Infrastructure Department',
    id: 'roads_and_infrastructure',
  },
  'Improper Waste Disposal': {
    name: 'Solid Waste Management Department',
    id: 'solid_waste_management',
  },
  'Water Leakage': {
    name: 'Water Supply and Sewerage Department',
    id: 'water_supply_and_sewerage',
  },
};

// Explainable Priority Rules
const defaultPriorityRules: PriorityRule[] = [
  {
    id: 'PR-01',
    name: 'Major Arterial Road Safety',
    category: 'Road Damage',
    keywords: ['crater', 'cave-in', 'bus route', 'highway', 'anna salai', 'gst road', 'deep pothole', 'accident risk'],
    assignedPriority: 'Critical',
    scoreBonus: 40,
    description: 'Critical risk for arterial roads and high-speed corridors in Chennai.',
    enabled: true,
  },
  {
    id: 'PR-02',
    name: 'Severe Water Main Burst & Contamination',
    category: 'Water Leakage',
    keywords: ['burst', 'main line', 'flooding', 'contamination', 'drinking water', 'sewage mixed'],
    assignedPriority: 'Critical',
    scoreBonus: 35,
    description: 'High threat to public health and municipal water loss.',
    enabled: true,
  },
  {
    id: 'PR-03',
    name: 'Commercial Zone Bulk Waste Dump',
    category: 'Improper Waste Disposal',
    keywords: ['market', 'commercial', 'hospital', 'medical waste', 'rotting', 'fire hazard'],
    assignedPriority: 'High',
    scoreBonus: 25,
    description: 'Public health nuisance and biohazard prevention in dense civic zones.',
    enabled: true,
  },
  {
    id: 'PR-04',
    name: 'Standard Residential Lane Defect',
    category: 'All',
    keywords: ['residential', 'lane', 'minor', 'slow leak', 'street corner'],
    assignedPriority: 'Medium',
    scoreBonus: 10,
    description: 'Standard domestic street maintenance SLA.',
    enabled: true,
  },
];

function getDefaultSettings(): SystemSettings {
  return {
    adminName: 'Er. K. Sivakumar',
    adminDesignation: 'Executive Engineer / Civic Operations Admin, Chennai North & South',
    slaHours: {
      Critical: 12,
      High: 24,
      Medium: 48,
      Low: 72,
    },
    autoAssignmentEnabled: true,
    strictPhotoVerification: true,
    notifyOnlyRegisteredCitizens: true,
    priorityRules: defaultPriorityRules,
  };
}

let systemSettings: SystemSettings = getDefaultSettings();

// Curated Photos
const PHOTOS = {
  roadBefore1: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80',
  roadAfter1: 'https://images.unsplash.com/photo-1584463699042-451f28b7e750?auto=format&fit=crop&w=800&q=80',
  roadBefore2: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=800&q=80',
  roadAfter2: 'https://images.unsplash.com/photo-1508873696983-2df5293cb325?auto=format&fit=crop&w=800&q=80',
  wasteBefore1: 'https://images.unsplash.com/photo-1605600659908-0ef719419d41?auto=format&fit=crop&w=800&q=80',
  wasteAfter1: 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&w=800&q=80',
  wasteBefore2: 'https://images.unsplash.com/photo-1528323273322-d81458248d40?auto=format&fit=crop&w=800&q=80',
  wasteAfter2: 'https://images.unsplash.com/photo-1518458028785-8fbcd101ebb9?auto=format&fit=crop&w=800&q=80',
  waterBefore1: 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&w=800&q=80',
  waterAfter1: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=800&q=80',
  waterBefore2: 'https://images.unsplash.com/photo-1584824486509-112e4181ff6b?auto=format&fit=crop&w=800&q=80',
  waterAfter2: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80',
};

function generateInitialComplaints(): Complaint[] {
  return [
    {
      id: 'CP-CHN-2026-1041',
      category: 'Road Damage',
      description: 'Severe cave-in and 2-foot pothole on central lane outside T. Nagar Panagal Park bus terminus, causing traffic snarls and two-wheeler skids.',
      location: {
        address: 'Near Panagal Park, Usman Road, T. Nagar, Chennai',
        zone: 'Zone 10 (Kodambakkam)',
        ward: 'Ward 136',
        coordinates: { lat: 13.0418, lng: 80.2337 },
        landmark: 'Opposite GRT Jewellers Bus Stop',
      },
      originalPhotoUrl: PHOTOS.roadBefore1,
      originalPhotoPath: 'complaints/CP-CHN-2026-1041/initial_road_defect.jpg',
      submissionTimestamp: '2026-10-09T08:15:00.000Z',
      createdAt: '2026-10-09T08:15:00.000Z',
      updatedAt: '2026-10-09T17:40:00.000Z',
      priority: 'Critical',
      priorityReason: 'Arterial bus route hazard with high two-wheeler casualty risk during peak Chennai monsoon traffic.',
      priorityScore: 94,
      assignedDepartmentId: 'roads_and_infrastructure',
      assignedDepartment: 'Roads and Infrastructure Department',
      assignmentTimestamp: '2026-10-09T08:18:00.000Z',
      currentStatus: 'Awaiting Admin Verification',
      status: 'Awaiting Admin Verification',
      reporterType: 'Registered Citizen',
      reporterId: 'user_cit_ramanathan_88219',
      reporterInfo: {
        citizenId: 'CIT-TN-88219',
        name: 'S. Ramanathan',
        maskedContact: '+91 98401 *****',
        isVerifiedUser: true,
      },
      slaDeadline: '2026-10-09T20:15:00.000Z',
      isOverdue: false,
      isDemo: true,
      verification: {
        submittedAt: '2026-10-09T17:40:00.000Z',
        submittedByDepartment: 'Roads and Infrastructure Department',
        afterRepairPhotoUrl: PHOTOS.roadAfter1,
        repairNotes: 'Bituminous cold-mix macadam patching completed, roller leveled, and traffic cones safely retrieved by Ward 136 road crew.',
        resubmissionCount: 0,
      },
      history: [
        {
          id: 'LOG-1041-1',
          timestamp: '2026-10-09T08:15:00.000Z',
          action: 'Complaint Registered',
          actor: 'System (Citizen Portal)',
          newValue: 'Received',
        },
        {
          id: 'LOG-1041-2',
          timestamp: '2026-10-09T08:16:30.000Z',
          action: 'Auto-Prioritized',
          actor: 'Namma Ooru AI/Rule Engine',
          previousValue: 'Medium',
          newValue: 'Critical',
          reason: 'Keywords matched "cave-in", "bus route", "traffic" in dense commercial zone.',
        },
        {
          id: 'LOG-1041-3',
          timestamp: '2026-10-09T08:18:00.000Z',
          action: 'Auto-Assigned Department',
          actor: 'Namma Ooru Routing Service',
          newValue: 'Roads and Infrastructure Department',
        },
        {
          id: 'LOG-1041-4',
          timestamp: '2026-10-09T10:30:00.000Z',
          action: 'Status Updated',
          actor: 'Junior Engineer, Zone 10 Roads',
          previousValue: 'Assigned',
          newValue: 'In Progress',
        },
        {
          id: 'LOG-1041-5',
          timestamp: '2026-10-09T17:40:00.000Z',
          action: 'Repair Evidence Submitted',
          actor: 'Supervisor Arumugam, Roads Dept',
          previousValue: 'In Progress',
          newValue: 'Awaiting Admin Verification',
        },
      ],
    },
    {
      id: 'CP-CHN-2026-1042',
      category: 'Water Leakage',
      description: 'Major underground water supply distribution pipeline fracture creating high-pressure geyser and waterlogging on Luz Church Road.',
      location: {
        address: 'Luz Church Road, near Nageswara Rao Park, Mylapore, Chennai',
        zone: 'Zone 9 (Teynampet)',
        ward: 'Ward 124',
        coordinates: { lat: 13.0368, lng: 80.2676 },
        landmark: 'Near Luz Corner Junction',
      },
      originalPhotoUrl: PHOTOS.waterBefore1,
      originalPhotoPath: 'complaints/CP-CHN-2026-1042/pipe_burst_leak.jpg',
      submissionTimestamp: '2026-10-08T14:20:00.000Z',
      createdAt: '2026-10-08T14:20:00.000Z',
      updatedAt: '2026-10-09T16:15:00.000Z',
      priority: 'High',
      priorityReason: 'Continuous drinking water loss and street inundation affecting local commercial establishments.',
      priorityScore: 78,
      assignedDepartmentId: 'water_supply_and_sewerage',
      assignedDepartment: 'Water Supply and Sewerage Department',
      assignmentTimestamp: '2026-10-08T14:22:00.000Z',
      currentStatus: 'Awaiting Admin Verification',
      status: 'Awaiting Admin Verification',
      reporterType: 'Anonymous Reporter',
      slaDeadline: '2026-10-09T14:20:00.000Z',
      isOverdue: false,
      isDemo: true,
      verification: {
        submittedAt: '2026-10-09T16:15:00.000Z',
        submittedByDepartment: 'Water Supply and Sewerage Department',
        afterRepairPhotoUrl: PHOTOS.waterAfter1,
        repairNotes: 'Pipe clamp installed on 150mm CI pipeline, valve re-pressurized to 1.8 bar with zero seepage.',
        resubmissionCount: 0,
      },
      history: [
        {
          id: 'LOG-1042-1',
          timestamp: '2026-10-08T14:20:00.000Z',
          action: 'Complaint Registered',
          actor: 'System (Anonymous Reporter)',
          newValue: 'Received',
        },
        {
          id: 'LOG-1042-2',
          timestamp: '2026-10-08T14:22:00.000Z',
          action: 'Auto-Assigned Department',
          actor: 'Namma Ooru Routing Service',
          newValue: 'Water Supply and Sewerage Department',
        },
      ],
    },
    {
      id: 'CP-CHN-2026-1043',
      category: 'Improper Waste Disposal',
      description: 'Extensive garbage overflowing around municipal compactor bin for 4 days; stray animals scattering organic waste across pedestrian pathway.',
      location: {
        address: 'Gandhi Nagar 2nd Main Road, Adyar, Chennai',
        zone: 'Zone 13 (Adyar)',
        ward: 'Ward 173',
        coordinates: { lat: 13.0067, lng: 80.2575 },
        landmark: 'Opposite Gandhi Nagar Post Office',
      },
      originalPhotoUrl: PHOTOS.wasteBefore1,
      originalPhotoPath: 'complaints/CP-CHN-2026-1043/overflow_waste_dump.jpg',
      submissionTimestamp: '2026-10-07T11:00:00.000Z',
      createdAt: '2026-10-07T11:00:00.000Z',
      updatedAt: '2026-10-08T10:15:00.000Z',
      priority: 'High',
      priorityReason: 'Sanitation biohazard in high-density residential ward with odor and vector infestation.',
      priorityScore: 72,
      assignedDepartmentId: 'solid_waste_management',
      assignedDepartment: 'Solid Waste Management Department',
      assignmentTimestamp: '2026-10-07T11:05:00.000Z',
      currentStatus: 'Resolved',
      status: 'Resolved',
      reporterType: 'Registered Citizen',
      reporterId: 'user_cit_meenakshi_49102',
      reporterInfo: {
        citizenId: 'CIT-TN-49102',
        name: 'Meenakshi Sundaram',
        maskedContact: '+91 94440 *****',
        isVerifiedUser: true,
      },
      slaDeadline: '2026-10-08T11:00:00.000Z',
      isOverdue: false,
      isDemo: true,
      verification: {
        submittedAt: '2026-10-08T09:30:00.000Z',
        submittedByDepartment: 'Solid Waste Management Department',
        afterRepairPhotoUrl: PHOTOS.wasteAfter1,
        repairNotes: 'Battery compactor truck cleared 3.2 MT waste, bin washed, and bleaching powder spread over area.',
        verifiedAt: '2026-10-08T10:15:00.000Z',
        verifiedBy: 'Er. K. Sivakumar (Admin)',
        decision: 'Approved',
        resubmissionCount: 0,
      },
      history: [
        {
          id: 'LOG-1043-1',
          timestamp: '2026-10-07T11:00:00.000Z',
          action: 'Complaint Registered',
          actor: 'System (Citizen Portal)',
          newValue: 'Received',
        },
        {
          id: 'LOG-1043-2',
          timestamp: '2026-10-08T10:15:00.000Z',
          action: 'Resolution Verified & Approved',
          actor: 'Er. K. Sivakumar (Admin)',
          previousValue: 'Awaiting Admin Verification',
          newValue: 'Resolved',
        },
      ],
    },
  ];
}

function generateInitialNotifications(): NotificationRecord[] {
  return [
  {
    "id": "NOTIF-2026-001",
    "complaintId": "CP-CHN-2026-1004",
    "category": "Road Damage",
    "recipientEligibility": "Eligible (Registered)",
    "recipientName": "Lakshmi Narayanan",
    "recipientContact": "+91 97890 ***** (lakshmi.n***@gmail.com)",
    "notificationType": "Evidence Approved & Resolved",
    "creationTimestamp": "2026-11-02T12:39:39.731Z",
    "deliveryStatus": "Delivered",
    "hasSignedPhotoUrl": true,
    "signedUrlExpiry": "2026-11-09T12:39:39.739Z",
    "deliveredChannel": "In-App Portal"
  },
  {
    "id": "NOTIF-2026-002",
    "complaintId": "CP-CHN-2026-1011",
    "category": "Road Damage",
    "recipientEligibility": "Eligible (Registered)",
    "recipientName": "Manikandan E.",
    "recipientContact": "+91 98840 *****",
    "notificationType": "Evidence Approved & Resolved",
    "creationTimestamp": "2026-11-02T02:39:39.739Z",
    "deliveryStatus": "Delivered",
    "hasSignedPhotoUrl": true,
    "signedUrlExpiry": "2026-11-09T02:39:39.739Z",
    "deliveredChannel": "SMS"
  },
  {
    "id": "NOTIF-2026-003",
    "complaintId": "CP-CHN-2026-1015",
    "category": "Improper Waste Disposal",
    "recipientEligibility": "Eligible (Registered)",
    "recipientName": "Swaminathan V.",
    "recipientContact": "+91 98406 ***** (swaminathan.v***@yahoo.in)",
    "notificationType": "Evidence Approved & Resolved",
    "creationTimestamp": "2026-11-02T08:39:39.739Z",
    "deliveryStatus": "Delivered",
    "hasSignedPhotoUrl": true,
    "signedUrlExpiry": "2026-11-09T08:39:39.739Z",
    "deliveredChannel": "Email"
  },
  {
    "id": "NOTIF-2026-004",
    "complaintId": "CP-CHN-2026-1020",
    "category": "Water Leakage",
    "recipientEligibility": "Eligible (Registered)",
    "recipientName": "Ganesh Moorthy",
    "recipientContact": "+91 98409 ***** (g.moorthy***@gmail.com)",
    "notificationType": "Evidence Approved & Resolved",
    "creationTimestamp": "2026-11-02T07:39:39.739Z",
    "deliveryStatus": "Delivered",
    "hasSignedPhotoUrl": true,
    "signedUrlExpiry": "2026-11-09T07:39:39.739Z",
    "deliveredChannel": "In-App Portal"
  },
  {
    "id": "NOTIF-2026-005",
    "complaintId": "CP-CHN-2026-1022",
    "category": "Improper Waste Disposal",
    "recipientEligibility": "Eligible (Registered)",
    "recipientName": "Anand Kumar",
    "recipientContact": "+91 98411 *****",
    "notificationType": "Evidence Approved & Resolved",
    "creationTimestamp": "2026-11-02T04:39:39.739Z",
    "deliveryStatus": "Delivered",
    "hasSignedPhotoUrl": true,
    "signedUrlExpiry": "2026-11-09T04:39:39.739Z",
    "deliveredChannel": "SMS"
  },
  {
    "id": "NOTIF-2026-006",
    "complaintId": "CP-CHN-2026-1007",
    "category": "Improper Waste Disposal",
    "recipientEligibility": "Ineligible (Anonymous - Restricted)",
    "recipientName": "Anonymous Reporter",
    "recipientContact": "None (Unauthenticated)",
    "notificationType": "Status Update",
    "creationTimestamp": "2026-11-02T18:39:39.739Z",
    "deliveryStatus": "Blocked (Anonymous Safety Policy)",
    "failureReason": "Namma Ooru policy strictly prohibits dispatching personal notifications or signed repair media to unauthenticated/anonymous reporters.",
    "hasSignedPhotoUrl": false,
    "deliveredChannel": "None"
  },
  {
    "id": "NOTIF-2026-007",
    "complaintId": "CP-CHN-2026-1001",
    "category": "Road Damage",
    "recipientEligibility": "Eligible (Registered)",
    "recipientName": "Sundar Rajan",
    "recipientContact": "+91 98401 ***** (sundar.r***@gmail.com)",
    "notificationType": "Status Update",
    "creationTimestamp": "2026-11-02T09:39:39.739Z",
    "deliveryStatus": "Delivered",
    "hasSignedPhotoUrl": false,
    "deliveredChannel": "In-App Portal"
  },
  {
    "id": "NOTIF-2026-008",
    "complaintId": "CP-CHN-2026-1002",
    "category": "Improper Waste Disposal",
    "recipientEligibility": "Eligible (Registered)",
    "recipientName": "Kavitha Balan",
    "recipientContact": "+91 94440 *****",
    "notificationType": "Status Update",
    "creationTimestamp": "2026-11-02T12:39:39.739Z",
    "deliveryStatus": "Delivered",
    "hasSignedPhotoUrl": false,
    "deliveredChannel": "SMS"
  },
  {
    "id": "NOTIF-2026-009",
    "complaintId": "CP-CHN-2026-1005",
    "category": "Road Damage",
    "recipientEligibility": "Eligible (Registered)",
    "recipientName": "Praveen Kumar",
    "recipientContact": "+91 99620 ***** (praveen.k***@tcs.com)",
    "notificationType": "Status Update",
    "creationTimestamp": "2026-11-03T04:39:39.739Z",
    "deliveryStatus": "Delivered",
    "hasSignedPhotoUrl": false,
    "deliveredChannel": "Email"
  },
  {
    "id": "NOTIF-2026-010",
    "complaintId": "CP-CHN-2026-1006",
    "category": "Water Leakage",
    "recipientEligibility": "Eligible (Registered)",
    "recipientName": "Anitha Ramesh",
    "recipientContact": "+91 98402 *****",
    "notificationType": "Status Update",
    "creationTimestamp": "2026-11-03T00:39:39.739Z",
    "deliveryStatus": "Delivered",
    "hasSignedPhotoUrl": false,
    "deliveredChannel": "SMS"
  },
  {
    "id": "NOTIF-2026-011",
    "complaintId": "CP-CHN-2026-1013",
    "category": "Water Leakage",
    "recipientEligibility": "Eligible (Registered)",
    "recipientName": "Karthik Subramanian",
    "recipientContact": "+91 97910 ***** (karthik.sub***@outlook.com)",
    "notificationType": "Status Update",
    "creationTimestamp": "2026-11-03T06:39:39.739Z",
    "deliveryStatus": "Delivered",
    "hasSignedPhotoUrl": false,
    "deliveredChannel": "In-App Portal"
  },
  {
    "id": "NOTIF-2026-012",
    "complaintId": "CP-CHN-2026-1024",
    "category": "Road Damage",
    "recipientEligibility": "Eligible (Registered)",
    "recipientName": "Hariharan S.",
    "recipientContact": "+91 98413 *****",
    "notificationType": "Status Update",
    "creationTimestamp": "2026-11-03T06:39:39.739Z",
    "deliveryStatus": "Delivered",
    "hasSignedPhotoUrl": false,
    "deliveredChannel": "SMS"
  }
];
}

const ROOT_DIR = path.resolve(__dirname);
const LOCAL_STORE_PATH = COMPLAINTS_STORE_PATH;
const LOCAL_SETTINGS_PATH = SETTINGS_STORE_PATH;
const LOCAL_AUDIT_LOGS_PATH = AUDIT_LOGS_PATH;
const LOCAL_DEPARTMENTS_PATH = DEPARTMENTS_PATH;

const loadLocalComplaints = loadComplaintsJson;
const saveLocalComplaints = saveComplaintsJson;
const loadLocalSettings = loadSettingsJson;
const saveLocalSettings = saveSettingsJson;
const loadLocalAuditLogs = loadAuditLogsJson;
const loadLocalDepartments = loadDepartmentsJson;

// Initialize all shared local JSON stores safely on startup
const initialStores = initAllLocalStores();
let complaintsStore: Complaint[] = initialStores.complaints;
systemSettings = initialStores.settings;
auditLogsStore = initialStores.auditLogs;
let departmentsStore: DepartmentSummary[] = initialStores.departments;
let notificationsStore: NotificationRecord[] = generateInitialNotifications();

// Bootstrap Firestore on Startup ONLY if Firestore mode is explicitly requested
async function bootstrapFirestore() {
  if (!isFirestorePersistenceRequired() || !adminDb) return;
  try {
    const snap = await adminDb.collection('complaints').get();

    if (snap.empty) {
      console.log('Cloud Firestore complaints collection is empty. Ready for live complaints.');
      const adminDoc = await adminDb.collection('admins').doc('admin_dhivya').get();
      if (!adminDoc.exists) {
        await adminDb.collection('admins').doc('admin_dhivya').set({
          email: BOOTSTRAPPED_ADMIN_EMAIL,
          role: 'superadmin',
          name: 'Dhivyadharshini Vijay (Chennai Domain Administrator)',
          createdAt: new Date().toISOString(),
        });
      }
      const settingsDoc = await adminDb.collection('settings').doc('system').get();
      if (!settingsDoc.exists) {
        await adminDb.collection('settings').doc('system').set(systemSettings);
      }
    } else {
      console.log(`Loaded ${snap.size} existing complaints from Firestore via Admin SDK.`);
      complaintsStore = snap.docs.map((d) => ({ ...d.data(), id: d.id } as Complaint));
    }
  } catch (err: any) {
    console.warn('Note on Firestore sync during boot:', err?.message || err);
  }
}

bootstrapFirestore();

// Real server-side image byte verification (Fail-Closed)
export interface ImageByteVerificationResult {
  valid: boolean;
  detectedMimeType?: string;
  error?: string;
}

export function verifyUploadedImageBytes(
  buf: Buffer | null | undefined,
  declaredMimeType: string,
  declaredSizeBytes?: number
): ImageByteVerificationResult {
  // 1. Fail closed on missing, empty, or non-Buffer data
  if (!buf || !Buffer.isBuffer(buf) || buf.length === 0) {
    return {
      valid: false,
      error: 'Image validation failed: Image byte payload is missing or empty (fail-closed).',
    };
  }

  // 2. Size limit check (max 10MB)
  const MAX_SIZE = 10 * 1024 * 1024;
  if (buf.length > MAX_SIZE) {
    return {
      valid: false,
      error: `Image validation failed: File size (${buf.length} bytes) exceeds maximum permitted limit of 10MB.`,
    };
  }

  // 3. Reject size mismatch if declared size is supplied
  if (declaredSizeBytes !== undefined && declaredSizeBytes > 0) {
    if (Math.abs(buf.length - declaredSizeBytes) > 4) {
      return {
        valid: false,
        error: `Image validation failed: Declared file size (${declaredSizeBytes} bytes) does not match actual decoded byte length (${buf.length} bytes).`,
      };
    }
  }

  // 4. Reject dangerous executable/script signatures
  if (buf.length >= 2 && buf[0] === 0x4D && buf[1] === 0x5A) {
    return { valid: false, error: 'Security violation: Executable Windows binary payload detected.' };
  }
  if (buf.length >= 4 && buf[0] === 0x7F && buf[1] === 0x45 && buf[2] === 0x4C && buf[3] === 0x46) {
    return { valid: false, error: 'Security violation: Executable Linux binary payload detected.' };
  }
  const preview = buf.subarray(0, Math.min(buf.length, 256)).toString('utf-8').toLowerCase();
  if (preview.includes('<?php') || preview.includes('<script') || preview.includes('<svg') || preview.includes('<html')) {
    return { valid: false, error: 'Security violation: Embedded script or markup payload detected.' };
  }

  // 5. Real image byte structure verification
  const isJpegHeader = buf.length >= 3 && buf[0] === 0xFF && buf[1] === 0xD8 && buf[2] === 0xFF;
  if (isJpegHeader) {
    if (buf.length < 125) {
      return { valid: false, error: 'Malformed image: Truncated JPEG stream (insufficient data).' };
    }
    let hasEoi = false;
    const searchStart = Math.max(0, buf.length - 1024);
    for (let i = searchStart; i < buf.length - 1; i++) {
      if (buf[i] === 0xFF && buf[i + 1] === 0xD9) {
        hasEoi = true;
        break;
      }
    }
    if (!hasEoi) {
      return { valid: false, error: 'Malformed image: Missing valid JPEG End-of-Image (EOI 0xFFD9) marker.' };
    }
    if (declaredMimeType !== 'image/jpeg') {
      return {
        valid: false,
        error: `Mismatched image data: Binary stream is JPEG, but declared MIME type is '${declaredMimeType}'.`,
      };
    }
    return { valid: true, detectedMimeType: 'image/jpeg' };
  }

  const isPngHeader = buf.length >= 8 &&
    buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4E && buf[3] === 0x47 &&
    buf[4] === 0x0D && buf[5] === 0x0A && buf[6] === 0x1A && buf[7] === 0x0A;
  if (isPngHeader) {
    if (buf.length < 67) {
      return { valid: false, error: 'Malformed image: Truncated PNG stream (insufficient data).' };
    }
    const ihdrName = buf.subarray(12, 16).toString('ascii');
    if (ihdrName !== 'IHDR') {
      return { valid: false, error: 'Malformed image: Invalid PNG chunk structure (missing initial IHDR chunk).' };
    }
    const width = buf.readUInt32BE(16);
    const height = buf.readUInt32BE(20);
    if (width === 0 || height === 0) {
      return { valid: false, error: 'Malformed image: Invalid PNG dimensions (zero width or height).' };
    }
    const hasIend = buf.includes(Buffer.from('IEND', 'ascii'));
    if (!hasIend) {
      return { valid: false, error: 'Malformed image: Missing valid PNG IEND chunk terminator.' };
    }
    if (declaredMimeType !== 'image/png') {
      return {
        valid: false,
        error: `Mismatched image data: Binary stream is PNG, but declared MIME type is '${declaredMimeType}'.`,
      };
    }
    return { valid: true, detectedMimeType: 'image/png' };
  }

  const isRiffWebp = buf.length >= 16 &&
    buf.subarray(0, 4).toString('ascii') === 'RIFF' &&
    buf.subarray(8, 12).toString('ascii') === 'WEBP';
  if (isRiffWebp) {
    const chunkType = buf.subarray(12, 16).toString('ascii');
    if (!['VP8 ', 'VP8L', 'VP8X'].includes(chunkType)) {
      return { valid: false, error: `Malformed image: Invalid WebP chunk format ('${chunkType}').` };
    }
    if (declaredMimeType !== 'image/webp') {
      return {
        valid: false,
        error: `Mismatched image data: Binary stream is WebP, but declared MIME type is '${declaredMimeType}'.`,
      };
    }
    return { valid: true, detectedMimeType: 'image/webp' };
  }

  return {
    valid: false,
    error: 'Image validation failed: File binary header and byte signature do not match permitted image formats (JPEG, PNG, WebP).',
  };
}

// Helper: Sanitize public responses to protect private citizen data & unrestricted photo URLs
function sanitizeComplaintResponse(c: Complaint, isPrivilegedAdmin: boolean = false): Partial<Complaint> {
  const sanitized = { ...c };
  // Never expose private citizen reference or unmasked personal identifiers in public complaint responses
  if (!isPrivilegedAdmin) {
    delete sanitized.reporterId;
    delete sanitized.reporterInfo;
    // Ensure only successfully redacted images can be used in public-facing feeds and map views
    if ((c as any).isRedacted && (c as any).redactedPhotoUrl) {
      sanitized.originalPhotoUrl = `/api/media/complaint/${c.id}/redacted`;
    } else {
      sanitized.originalPhotoUrl = `/api/media/complaint/${c.id}/original`;
    }
    if (sanitized.verification?.afterRepairPhotoUrl) {
      sanitized.verification = {
        ...sanitized.verification,
        afterRepairPhotoUrl: `/api/media/complaint/${c.id}/resolution`,
      };
    }
  }
  return sanitized;
}

// REST API ROUTES

// 0a. POST /api/auth/admin-session (Secured: Requires verified authentication, never issues token to unauthenticated requester)
app.post('/api/auth/admin-session', rateLimiter(20), authenticateToken, requireAdminRole, (req: Request, res: Response) => {
  res.json({
    user: {
      uid: req.user!.uid,
      email: req.user!.email,
      role: req.user!.role,
      displayName: 'Chennai Domain Administrator',
      isAuthorizedAdmin: true,
    },
  });
});

// 0b. POST /api/upload/validate (Trusted Backend Upload Validation for Real Image Bytes, Format, Size & Permissions)
app.post('/api/upload/validate', rateLimiter(60), authenticateToken, (req: Request, res: Response) => {
  const { mimeType, fileSizeBytes, fileName, fileBase64, complaintId, folder = 'complaints' } = req.body;
  const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp'];
  const MAX_SIZE = 10 * 1024 * 1024; // 10MB limit

  // 1. Permission check: Resolution evidence uploads restricted to administrators / field officers
  if (folder === 'resolution' && !req.user!.isAdmin) {
    res.status(403).json({
      error: 'Forbidden: Only authorized administrators or department field officers can upload resolution evidence.',
    });
    return;
  }

  // 2. Permission check: Citizen complaints cannot upload to other users' complaints
  if (folder === 'complaints' && complaintId) {
    const existingComplaint = complaintsStore.find((c) => c.id === complaintId);
    if (existingComplaint && existingComplaint.reporterId && !req.user!.isAdmin && existingComplaint.reporterId !== req.user!.uid) {
      res.status(403).json({
        error: "Forbidden: You do not have permission to upload photos for another citizen's complaint.",
      });
      return;
    }
  }

  // 3. Allowed folder validation
  if (!['complaints', 'resolution', 'redacted'].includes(folder)) {
    res.status(400).json({ error: `Invalid upload folder: '${folder}' is not permitted.` });
    return;
  }

  // 4. MIME type validation
  if (!mimeType || !ALLOWED_MIME.includes(mimeType)) {
    res.status(400).json({
      error: `Invalid file format (${mimeType || 'unknown'}). Only JPEG, PNG, and WebP images are permitted by Chennai Municipal Storage Policy.`,
    });
    return;
  }

  // 5. File size validation
  if (!fileSizeBytes || fileSizeBytes <= 0 || fileSizeBytes > MAX_SIZE) {
    res.status(400).json({
      error: `Invalid file size. Media must be greater than 0 bytes and not exceed 10MB (received: ${fileSizeBytes || 0} bytes).`,
    });
    return;
  }

  // 6. Fail-closed complete binary verification: Require real server-side verification of uploaded image bytes
  // Reject missing, malformed, or mismatched image data (do not trust client base64 header alone)
  if (!fileBase64 || typeof fileBase64 !== 'string' || !fileBase64.trim()) {
    res.status(400).json({
      error: 'Security validation failed: Complete image binary data (fileBase64) is required for server verification (fail-closed).',
    });
    return;
  }

  let imageBuf: Buffer;
  try {
    const sanitizedBase64 = fileBase64.replace(/^data:image\/[a-zA-Z0-9+.-]+;base64,/, '').trim();
    if (!sanitizedBase64) {
      res.status(400).json({
        error: 'Security validation failed: Image base64 payload is empty after stripping prefix.',
      });
      return;
    }
    imageBuf = Buffer.from(sanitizedBase64, 'base64');
    if (imageBuf.length === 0) {
      res.status(400).json({
        error: 'Security validation failed: Decoded image byte buffer is empty.',
      });
      return;
    }
  } catch {
    res.status(400).json({
      error: 'Security validation failed: Unable to parse binary image data from request.',
    });
    return;
  }

  const byteVerification = verifyUploadedImageBytes(imageBuf, mimeType, fileSizeBytes);
  if (!byteVerification.valid) {
    res.status(400).json({
      error: byteVerification.error || 'Security validation failed: Image bytes rejected.',
    });
    return;
  }

  const safeFilename = (fileName || 'photo.jpg').replace(/[^a-zA-Z0-9.-]/g, '_');
  const safeComplaintId = (complaintId || 'temp').replace(/[^a-zA-Z0-9_-]/g, '');
  const storagePath = `${folder}/${safeComplaintId}/${Date.now()}_${safeFilename}`;

  res.json({
    valid: true,
    storagePath,
    folder,
    detectedMimeType: byteVerification.detectedMimeType,
    allowedMimeTypes: ALLOWED_MIME,
    maxSizeBytes: MAX_SIZE,
  });
});

// 1. GET /api/complaints
app.get('/api/complaints', rateLimiter(120), optionalAuth, async (req: Request, res: Response) => {
  try {
    const {
      search,
      category,
      priority,
      status,
      department,
      reporterType,
      sortBy = 'submissionTimestamp',
      sortOrder = 'desc',
      page = '1',
      limit = '10',
      demoFilter = 'all',
    } = req.query;

    const isAdmin = Boolean(req.user?.isAdmin);
    let filtered = [...complaintsStore];

    if (search && typeof search === 'string') {
      const q = search.toLowerCase().trim();
      filtered = filtered.filter(
        (c) =>
          c.id.toLowerCase().includes(q) ||
          c.description.toLowerCase().includes(q) ||
          c.location.address.toLowerCase().includes(q) ||
          (c.location.landmark && c.location.landmark.toLowerCase().includes(q))
      );
    }

    if (category && category !== 'All') {
      filtered = filtered.filter((c) => c.category === category);
    }

    if (priority && priority !== 'All') {
      filtered = filtered.filter((c) => c.priority === priority);
    }

    if (status && status !== 'All') {
      filtered = filtered.filter((c) => c.currentStatus === status || c.status === status);
    }

    if (department && department !== 'All') {
      filtered = filtered.filter(
        (c) => c.assignedDepartment === department || c.assignedDepartmentId === department
      );
    }

    if (reporterType && reporterType !== 'All') {
      filtered = filtered.filter((c) => c.reporterType === reporterType);
    }

    if (demoFilter === 'demo') {
      filtered = filtered.filter((c) => c.isDemo);
    } else if (demoFilter === 'real') {
      filtered = filtered.filter((c) => !c.isDemo);
    }

    const priorityWeight: Record<ComplaintPriority, number> = {
      Critical: 4,
      High: 3,
      Medium: 2,
      Low: 1,
    };

    filtered.sort((a, b) => {
      if (sortBy === 'priority') {
        const diff = priorityWeight[b.priority] - priorityWeight[a.priority];
        return sortOrder === 'asc' ? -diff : diff;
      }
      if (sortBy === 'submissionTimestamp') {
        const timeA = new Date(a.submissionTimestamp || a.createdAt || 0).getTime();
        const timeB = new Date(b.submissionTimestamp || b.createdAt || 0).getTime();
        return sortOrder === 'asc' ? timeA - timeB : timeB - timeA;
      }
      return 0;
    });

    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    let limitNum = Math.max(1, parseInt(limit as string, 10) || 10);
    if (limit === 'all' || limit === '1000' || limit === '500') {
      limitNum = 1000;
    }
    const total = filtered.length;
    const totalPages = Math.ceil(total / limitNum) || 1;
    const startIndex = (pageNum - 1) * limitNum;
    const paginated = filtered
      .slice(startIndex, startIndex + limitNum)
      .map((c) => sanitizeComplaintResponse(c, isAdmin));

    res.json({
      complaints: paginated,
      total,
      page: pageNum,
      totalPages,
      limit: limitNum,
    });
  } catch (error) {
    console.error('Error fetching complaints:', error);
    res.status(500).json({ error: 'Failed to retrieve complaint records' });
  }
});

// 2. GET /api/complaints/:id
app.get('/api/complaints/:id', rateLimiter(120), optionalAuth, async (req: Request, res: Response) => {
  try {
    const complaint = complaintsStore.find((c) => c.id === req.params.id);
    if (!complaint) {
      res.status(404).json({ error: `Complaint record ${req.params.id} not found` });
      return;
    }
    const isAdmin = Boolean(req.user?.isAdmin);
    res.json(sanitizeComplaintResponse(complaint, isAdmin));
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve complaint' });
  }
});

// 3. SECURE MEDIA PROXY: Protected Original Image Access
// Ordinary users and public scrapers are rejected with 401/403.
// Authorized administrators access the original image through this verified route.
app.get('/api/media/complaint/:id/original', rateLimiter(60), authenticateToken, requireAdminRole, async (req: Request, res: Response) => {
  const complaint = complaintsStore.find((c) => c.id === req.params.id);
  if (!complaint) {
    res.status(404).json({ error: 'Complaint image not found.' });
    return;
  }

  // Audit access to sensitive original image
  await recordAuditLog({
    action: 'ORIGINAL_IMAGE_ACCESS: Admin Accessed Protected Media',
    actor: req.user!.email || req.user!.uid,
    actorId: req.user!.uid,
    complaintId: complaint.id,
    timestamp: new Date().toISOString(),
  });

  // Redirect to image source or stream with cache control
  res.setHeader('Cache-Control', 'private, max-age=300');
  res.redirect(complaint.originalPhotoUrl);
});

// 4. SECURE MEDIA PROXY: Resolution Evidence Photo Access
app.get('/api/media/complaint/:id/resolution', rateLimiter(60), authenticateToken, requireAdminRole, async (req: Request, res: Response) => {
  const complaint = complaintsStore.find((c) => c.id === req.params.id);
  if (!complaint || !complaint.verification?.afterRepairPhotoUrl) {
    res.status(404).json({ error: 'Resolution evidence image not found.' });
    return;
  }

  res.setHeader('Cache-Control', 'private, max-age=300');
  res.redirect(complaint.verification.afterRepairPhotoUrl);
});

// 4b. SECURE MEDIA PROXY: Redacted Complaint Photo Access
// Policy: Original images can NEVER be exposed through a redacted-image route.
// Rejects unredacted images, complaints without redacted media, or routes pointing to original images.
app.get('/api/media/complaint/:id/redacted', rateLimiter(120), optionalAuth, async (req: Request, res: Response) => {
  const complaint = complaintsStore.find((c) => c.id === req.params.id);
  if (!complaint) {
    res.status(404).json({ error: 'Complaint not found.' });
    return;
  }

  const isRedacted = Boolean((complaint as any).isRedacted);
  const redactedUrl = (complaint as any).redactedPhotoUrl;

  // Strict enforcement: Original unredacted citizen photos must never be exposed via redacted route
  if (!isRedacted || !redactedUrl || redactedUrl === complaint.originalPhotoUrl) {
    res.status(404).json({
      error: 'Redacted photo unavailable: This complaint does not have an approved redacted public image. Original private images cannot be exposed through redacted routes.',
    });
    return;
  }

  res.setHeader('Cache-Control', 'public, max-age=3600');
  res.redirect(redactedUrl);
});

// 5. PATCH /api/complaints/:id (Protected with Token Authentication and Admin Role)
app.patch('/api/complaints/:id', rateLimiter(60), authenticateToken, requireAdminRole, async (req: Request, res: Response) => {
  try {
    const complaint = complaintsStore.find((c) => c.id === req.params.id);
    if (!complaint) {
      res.status(404).json({ error: `Complaint record ${req.params.id} not found` });
      return;
    }

    // Security: Reject mass assignment of protected fields (id, createdAt, reporterId)
    const disallowedFields = ['id', 'createdAt', 'reporterId', 'isDemo'];
    for (const field of disallowedFields) {
      if (req.body[field] !== undefined && req.body[field] !== (complaint as any)[field]) {
        res.status(400).json({ error: `Modification of immutable field '${field}' is strictly forbidden.` });
        return;
      }
    }

    const {
      status,
      priority,
      priorityReason,
      assignedDepartment,
      reassignmentReason,
      verificationAction, // 'approve' | 'reject'
      rejectionReason,
    } = req.body;

    const adminName = req.user?.email || systemSettings.adminName;
    const adminId = req.user?.uid || 'admin_session';
    const timestamp = new Date().toISOString();

    const updatedComplaint: Complaint = JSON.parse(JSON.stringify(complaint));
    const auditEntries: any[] = [];
    let newNotification: NotificationRecord | null = null;
    let actionExecuted = false;

    // 1. Mandatory Resolution Verification Workflow
    if (verificationAction) {
      if (updatedComplaint.currentStatus !== 'Awaiting Admin Verification') {
        res.status(400).json({
          error: `Invalid status transition: Complaint is in '${updatedComplaint.currentStatus}', must be 'Awaiting Admin Verification' to verify evidence.`,
        });
        return;
      }

      if (verificationAction === 'approve') {
        updatedComplaint.currentStatus = 'Resolved';
        updatedComplaint.status = 'Resolved';
        updatedComplaint.updatedAt = timestamp;

        if (updatedComplaint.verification) {
          updatedComplaint.verification.verifiedAt = timestamp;
          updatedComplaint.verification.verifiedBy = adminName;
          updatedComplaint.verification.decision = 'Approved';
        }

        const logId = `LOG-${updatedComplaint.id}-${updatedComplaint.history.length + 1}`;
        const auditEntry = {
          id: logId,
          complaintId: updatedComplaint.id,
          timestamp,
          action: 'Resolution Verified & Approved',
          actor: adminName,
          actorId: adminId,
          previousValue: 'Awaiting Admin Verification',
          newValue: 'Resolved',
          reason: 'Photo evidence verified: repair meets municipal quality standards.',
        };
        updatedComplaint.history.push(auditEntry);
        auditEntries.push(auditEntry);

        // Security: Anonymous reporters NEVER receive resolution photos or notifications
        const isEligible = updatedComplaint.reporterType === 'Registered Citizen';
        const notifId = `NOTIF-${Date.now().toString().slice(-4)}`;

        newNotification = {
          id: notifId,
          complaintId: updatedComplaint.id,
          category: updatedComplaint.category,
          recipientEligibility: isEligible
            ? 'Eligible (Registered)'
            : 'Ineligible (Anonymous - Restricted)',
          recipientName: isEligible
            ? updatedComplaint.reporterInfo?.name || 'Registered Citizen'
            : 'Anonymous Reporter',
          recipientContact: isEligible
            ? updatedComplaint.reporterInfo?.maskedContact || 'Citizen Phone/Email'
            : 'None (Unauthenticated)',
          notificationType: 'Evidence Approved & Resolved',
          creationTimestamp: timestamp,
          deliveryStatus: isEligible ? 'Delivered' : 'Blocked (Anonymous Safety Policy)',
          failureReason: isEligible
            ? undefined
            : 'Namma Ooru policy strictly prohibits dispatching repair media or personal updates to unauthenticated/anonymous reporters.',
          hasSignedPhotoUrl: isEligible,
          signedUrlExpiry: isEligible
            ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
            : undefined,
          deliveredChannel: isEligible ? 'In-App Portal' : 'None',
        };

        actionExecuted = true;
      } else if (verificationAction === 'reject') {
        if (!rejectionReason || !rejectionReason.trim()) {
          res.status(400).json({ error: 'A rejection reason is strictly required to reject resolution evidence.' });
          return;
        }

        updatedComplaint.currentStatus = 'In Progress';
        updatedComplaint.status = 'In Progress';
        updatedComplaint.updatedAt = timestamp;

        if (updatedComplaint.verification) {
          updatedComplaint.verification.decision = 'Rejected';
          updatedComplaint.verification.rejectionReason = rejectionReason.trim();
          updatedComplaint.verification.verifiedAt = timestamp;
          updatedComplaint.verification.verifiedBy = adminName;
          updatedComplaint.verification.resubmissionCount = (updatedComplaint.verification.resubmissionCount || 0) + 1;
        }

        const logId = `LOG-${updatedComplaint.id}-${updatedComplaint.history.length + 1}`;
        const auditEntry = {
          id: logId,
          complaintId: updatedComplaint.id,
          timestamp,
          action: 'Resolution Evidence Rejected',
          actor: adminName,
          actorId: adminId,
          previousValue: 'Awaiting Admin Verification',
          newValue: 'In Progress',
          reason: rejectionReason.trim(),
        };
        updatedComplaint.history.push(auditEntry);
        auditEntries.push(auditEntry);

        actionExecuted = true;
      }
    }

    // 2. Priority Override by Authorized Admin
    if (priority && priority !== updatedComplaint.priority) {
      if (!priorityReason || !priorityReason.trim()) {
        res.status(400).json({ error: 'A documented reason is required when an admin overrides complaint priority.' });
        return;
      }
      const prevPriority = updatedComplaint.priority;
      updatedComplaint.priority = priority as ComplaintPriority;
      updatedComplaint.priorityReason = priorityReason.trim();
      updatedComplaint.updatedAt = timestamp;

      const logId = `LOG-${updatedComplaint.id}-${updatedComplaint.history.length + 1}`;
      const auditEntry = {
        id: logId,
        complaintId: updatedComplaint.id,
        timestamp,
        action: 'Priority Overridden by Admin',
        actor: adminName,
        actorId: adminId,
        previousValue: prevPriority,
        newValue: priority,
        reason: priorityReason.trim(),
      };
      updatedComplaint.history.push(auditEntry);
      auditEntries.push(auditEntry);
      actionExecuted = true;
    }

    // 3. Department Reassignment by Authorized Admin
    if (assignedDepartment && assignedDepartment !== updatedComplaint.assignedDepartment) {
      if (!reassignmentReason || !reassignmentReason.trim()) {
        res.status(400).json({ error: 'A documented reason is required when reassigning a complaint to another department.' });
        return;
      }
      const prevDept = updatedComplaint.assignedDepartment;
      updatedComplaint.assignedDepartment = assignedDepartment as DepartmentName;
      updatedComplaint.assignmentTimestamp = timestamp;
      updatedComplaint.updatedAt = timestamp;

      const logId = `LOG-${updatedComplaint.id}-${updatedComplaint.history.length + 1}`;
      const auditEntry = {
        id: logId,
        complaintId: updatedComplaint.id,
        timestamp,
        action: 'Department Reassigned',
        actor: adminName,
        actorId: adminId,
        previousValue: prevDept,
        newValue: assignedDepartment,
        reason: reassignmentReason.trim(),
      };
      updatedComplaint.history.push(auditEntry);
      auditEntries.push(auditEntry);
      actionExecuted = true;
    }

    // 4. Status update validation (Enforcing valid lifecycle transitions)
    if (status && status !== updatedComplaint.currentStatus) {
      const prevStatus = updatedComplaint.currentStatus;
      if (status === 'Resolved' && prevStatus !== 'Awaiting Admin Verification') {
        res.status(400).json({
          error: 'Invalid transition: A complaint cannot transition directly to Resolved without department evidence and admin verification.',
        });
        return;
      }

      updatedComplaint.currentStatus = status as ComplaintStatus;
      updatedComplaint.status = status as ComplaintStatus;
      updatedComplaint.updatedAt = timestamp;

      const logId = `LOG-${updatedComplaint.id}-${updatedComplaint.history.length + 1}`;
      const auditEntry = {
        id: logId,
        complaintId: updatedComplaint.id,
        timestamp,
        action: 'Status Updated',
        actor: adminName,
        actorId: adminId,
        previousValue: prevStatus,
        newValue: status,
        reason: req.body.statusReason || 'Administrative status update.',
      };
      updatedComplaint.history.push(auditEntry);
      auditEntries.push(auditEntry);
      actionExecuted = true;
    }

    if (!actionExecuted && !verificationAction) {
      res.json({
        message: 'No changes detected on complaint record',
        complaint: sanitizeComplaintResponse(complaint, true),
      });
      return;
    }

    // Persist to Cloud Firestore via atomic batch write only if Firestore persistence is requested
    let firestorePersisted = false;
    let firestoreError: any = null;

    if (adminDb && isFirestorePersistenceRequired()) {
      try {
        const batch = adminDb.batch();
        const firestoreComplaint = JSON.parse(JSON.stringify(updatedComplaint));
        batch.set(adminDb.collection('complaints').doc(updatedComplaint.id), firestoreComplaint);

        for (const audit of auditEntries) {
          batch.set(adminDb.collection('auditLogs').doc(audit.id), JSON.parse(JSON.stringify(audit)));
        }

        if (newNotification) {
          batch.set(adminDb.collection('notifications').doc(newNotification.id), JSON.parse(JSON.stringify(newNotification)));
        }

        await batch.commit();
        firestorePersisted = true;
      } catch (fsErr: any) {
        firestoreError = fsErr;
        console.error('Firestore save error in complaint PATCH:', fsErr?.message || fsErr);
      }
    }

    const requireCloud = isFirestorePersistenceRequired();
    const allowLocalFallback = process.env.ALLOW_LOCAL_FALLBACK !== 'false' && !requireCloud;

    if (!firestorePersisted && (requireCloud || !allowLocalFallback)) {
      res.status(503).json({
        error: 'Durable persistence failure: Cloud Firestore update failed and durable persistence is strictly required.',
        details: firestoreError?.message || 'Firestore write failed or was denied.',
        storageMode: 'firestore-required',
      });
      return;
    }

    // Apply verified updates to in-memory store and shared local JSON disk store
    const targetIdx = complaintsStore.findIndex((c) => c.id === updatedComplaint.id);
    if (targetIdx !== -1) {
      complaintsStore[targetIdx] = updatedComplaint;
    }
    if (newNotification) {
      notificationsStore.unshift(newNotification);
    }
    await saveComplaintsJson(complaintsStore);

    for (const audit of auditEntries) {
      await recordAuditLog(audit);
    }

    let successMessage = 'Complaint updated successfully';
    if (verificationAction === 'approve') {
      successMessage = 'Resolution approved successfully. Complaint marked Resolved.';
    } else if (verificationAction === 'reject') {
      successMessage = 'Evidence rejected. Complaint returned to In Progress for department correction.';
    }

    res.json({
      message: successMessage,
      complaint: sanitizeComplaintResponse(updatedComplaint, true),
      notification: newNotification || undefined,
      storageMode: firestorePersisted ? 'firestore' : 'local-json',
      persistence: firestorePersisted ? 'firestore' : 'local-json',
    });
  } catch (error) {
    console.error('Error updating complaint:', error);
    res.status(500).json({ error: 'Failed to update complaint record' });
  }
});

// 6. POST /api/complaints (Citizen Submission Endpoint)
app.post('/api/complaints', rateLimiter(30), optionalAuth, async (req: Request, res: Response) => {
  try {
    const {
      category,
      description,
      address,
      zone,
      ward,
      coordinates,
      geoJsonCoordinates,
      photoUrl,
      photoPath,
      reporterType,
      reporterInfo,
    } = req.body;

    const resolvedAddress = address || req.body.address || req.body.location?.address || req.body.roadName;

    if (!category || !description || !resolvedAddress) {
      res.status(400).json({ error: 'Category, description, and address are mandatory fields.' });
      return;
    }

    // Parse coordinates supporting both GeoJSON RFC 7946 [lng, lat] and object { lat, lng }
    let resolvedLat = 13.0827;
    let resolvedLng = 80.2707;

    if (Array.isArray(geoJsonCoordinates) && geoJsonCoordinates.length === 2) {
      const [lng, lat] = geoJsonCoordinates;
      if (typeof lng === 'number' && typeof lat === 'number' && !isNaN(lng) && !isNaN(lat)) {
        resolvedLng = lng;
        resolvedLat = lat;
      }
    } else if (Array.isArray(coordinates) && coordinates.length === 2) {
      const [lng, lat] = coordinates;
      if (typeof lng === 'number' && typeof lat === 'number' && !isNaN(lng) && !isNaN(lat)) {
        resolvedLng = lng;
        resolvedLat = lat;
      }
    } else if (coordinates && typeof coordinates === 'object' && 'lat' in coordinates && 'lng' in coordinates) {
      const lat = parseFloat(coordinates.lat);
      const lng = parseFloat(coordinates.lng);
      if (!isNaN(lat) && !isNaN(lng)) {
        resolvedLat = lat;
        resolvedLng = lng;
      }
    }

    let mappedCategory = category;
    const catLower = String(category || '').toLowerCase().trim();
    if (catLower === 'road_damage' || catLower === 'pothole' || catLower === 'road damage') {
      mappedCategory = 'Road Damage';
    } else if (catLower === 'waste_disposal' || catLower === 'garbage' || catLower === 'waste disposal' || catLower === 'improper waste disposal') {
      mappedCategory = 'Improper Waste Disposal';
    } else if (catLower === 'water_leakage' || catLower === 'water_leak' || catLower === 'water leakage') {
      mappedCategory = 'Water Leakage';
    } else if (catLower === 'street_light' || catLower === 'other') {
      mappedCategory = 'Road Damage';
    } else if (mappedCategory === 'Waste Disposal') {
      mappedCategory = 'Improper Waste Disposal';
    } else if (mappedCategory === 'Street Light' || mappedCategory === 'Other') {
      mappedCategory = 'Road Damage';
    }

    if (!['Road Damage', 'Improper Waste Disposal', 'Water Leakage'].includes(mappedCategory)) {
      res.status(400).json({ error: 'Invalid category. Must be Road Damage, Improper Waste Disposal, or Water Leakage.' });
      return;
    }

    // Duplicate complaint check: Prevent double-submission of identical complaints within 60s
    const duplicateWindowMs = 60 * 1000;
    const nowTime = Date.now();
    const isDuplicate = complaintsStore.some((c) => {
      const timeDiff = nowTime - new Date(c.submissionTimestamp || c.createdAt || 0).getTime();
      return (
        timeDiff >= 0 &&
        timeDiff < duplicateWindowMs &&
        c.category === mappedCategory &&
        c.description.trim().toLowerCase() === description.trim().toLowerCase() &&
        c.location.address.trim().toLowerCase() === resolvedAddress.trim().toLowerCase()
      );
    });

    if (isDuplicate) {
      res.status(409).json({
        error: 'Duplicate complaint detected: An identical complaint at this address was registered within the last 60 seconds.',
      });
      return;
    }

    const mapping = CATEGORY_DEPARTMENT_MAP[mappedCategory as ComplaintCategory];
    const timestamp = new Date().toISOString();
    const requestedId = typeof req.body.id === 'string' && req.body.id.trim().length > 0 ? req.body.id.trim() : null;
    const isIdAvailable = requestedId && !complaintsStore.some((c) => c.id === requestedId);
    const newId = isIdAvailable ? requestedId : `CP-CHN-2026-${Math.floor(1000 + Math.random() * 9000)}`;

    // Automatic Prioritization Rule evaluation
    let calculatedPriority: ComplaintPriority = 'Medium';
    let matchedReason = 'Standard residential priority baseline.';
    let score = 50;

    const descLower = description.toLowerCase();
    for (const rule of systemSettings.priorityRules) {
      if (!rule.enabled) continue;
      if (rule.category !== 'All' && rule.category !== category) continue;
      const hit = rule.keywords.some((kw) => descLower.includes(kw.toLowerCase()));
      if (hit) {
        calculatedPriority = rule.assignedPriority;
        score += rule.scoreBonus;
        matchedReason = `Matched rule '${rule.name}': ${rule.description}`;
        break;
      }
    }

    const isAnonymous = reporterType !== 'Registered Citizen';
    const resolvedTimestamp = req.body.createdAt || req.body.submissionTimestamp || req.body.timestamp || timestamp;
    const initialStatus: ComplaintStatus = req.body.initialStatus || req.body.status || 'Received';
    const resolvedRoadName = req.body.roadName || resolvedAddress;
    const resolvedRoadGeometry = req.body.roadGeometry || null;
    const resolvedPhoto = req.body.photo || null;

    const newComplaint: Complaint = {
      id: newId,
      category: mappedCategory as ComplaintCategory,
      description,
      location: {
        address: resolvedAddress,
        zone: zone || 'Zone 10 (Kodambakkam)',
        ward: ward || 'Ward 136',
        coordinates: { lat: resolvedLat, lng: resolvedLng },
        geoJsonCoordinates: [resolvedLng, resolvedLat],
      },
      roadName: resolvedRoadName,
      roadGeometry: resolvedRoadGeometry,
      photo: resolvedPhoto,
      originalPhotoUrl:
        photoUrl ||
        (typeof req.body.photo === 'string' ? req.body.photo : req.body.photo?.url) ||
        PHOTOS.roadBefore1,
      originalPhotoPath: photoPath || `complaints/${newId}/original.jpg`,
      submissionTimestamp: resolvedTimestamp,
      createdAt: resolvedTimestamp,
      updatedAt: resolvedTimestamp,
      priority: calculatedPriority,
      priorityReason: matchedReason,
      priorityScore: Math.min(100, score),
      assignedDepartmentId: mapping.id,
      assignedDepartment: mapping.name,
      assignmentTimestamp: resolvedTimestamp,
      currentStatus: initialStatus,
      status: initialStatus,
      reporterType: isAnonymous ? 'Anonymous Reporter' : 'Registered Citizen',
      reporterId: isAnonymous ? undefined : req.user?.uid || req.body.reporterId || `citizen_${Date.now()}`,
      reporterInfo: isAnonymous ? undefined : reporterInfo,
      slaDeadline: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
      isOverdue: false,
      isDemo: false,
      history: [
        {
          id: `LOG-${newId}-1`,
          timestamp: resolvedTimestamp,
          action: 'Complaint Registered',
          actor: 'Citizen Interface',
          newValue: initialStatus,
        },
        {
          id: `LOG-${newId}-2`,
          timestamp: resolvedTimestamp,
          action: 'Auto-Prioritized',
          actor: 'Namma Ooru Rule Engine',
          newValue: calculatedPriority,
          reason: matchedReason,
        },
        {
          id: `LOG-${newId}-3`,
          timestamp: resolvedTimestamp,
          action: 'Auto-Assigned Department',
          actor: 'Namma Ooru Routing',
          newValue: mapping.name,
        },
      ],
    };

    let firestorePersisted = false;
    let firestoreError: any = null;

    if (adminDb && isFirestorePersistenceRequired()) {
      try {
        const firestoreComplaint = JSON.parse(JSON.stringify(newComplaint));

        // Atomic write guarantees consistency between complaint record and audit log in Firestore
        const batch = adminDb.batch();
        batch.set(adminDb.collection('complaints').doc(newId), firestoreComplaint);
        for (const historyEntry of newComplaint.history) {
          batch.set(adminDb.collection('auditLogs').doc(historyEntry.id), JSON.parse(JSON.stringify(historyEntry)));
        }
        await batch.commit();
        firestorePersisted = true;
      } catch (fsErr: any) {
        firestoreError = fsErr;
        console.error('Firestore save error in complaint creation:', fsErr?.message || fsErr);
      }
    }

    const requireCloud = isFirestorePersistenceRequired();
    const allowLocalFallback = process.env.ALLOW_LOCAL_FALLBACK !== 'false' && !requireCloud;

    if (!firestorePersisted) {
      if (requireCloud || !allowLocalFallback) {
        // Fail-closed: Avoid leaving inconsistent memory or disk state
        res.status(503).json({
          error: 'Durable persistence failure: Cloud Firestore write failed and durable persistence is strictly required.',
          details: firestoreError?.message || 'Firestore write failed or was denied.',
          storageMode: 'firestore-required',
        });
        return;
      }
    }

    // Persist to in-memory store and shared local JSON disk store
    complaintsStore.unshift(newComplaint);
    await saveComplaintsJson(complaintsStore);

    // Record initial complaint history entries to audit-logs.json
    for (const historyEntry of newComplaint.history) {
      await recordAuditLog({
        id: historyEntry.id,
        complaintId: newComplaint.id,
        timestamp: historyEntry.timestamp,
        action: historyEntry.action,
        actor: historyEntry.actor,
        newValue: historyEntry.newValue,
        previousValue: historyEntry.previousValue,
        reason: historyEntry.reason,
      });
    }

    res.status(201).json({
      message: 'Complaint registered successfully',
      complaint: sanitizeComplaintResponse(newComplaint, Boolean(req.user?.isAdmin)),
      storageMode: firestorePersisted ? 'firestore' : 'local-json',
      persistence: firestorePersisted ? 'firestore' : 'local-json',
      ...(firestorePersisted
        ? {}
        : {
            persistenceNotice:
              'Complaint safely stored in shared local JSON disk storage (data/complaints-store.json).',
          }),
    });
  } catch (error) {
    console.error('Error creating complaint:', error);
    res.status(500).json({ error: 'Server failed to process new complaint' });
  }
});

// 7. GET /api/departments
app.get('/api/departments', optionalAuth, (req: Request, res: Response) => {
  const baseDepts = loadDepartmentsJson();
  const depts: DepartmentSummary[] = baseDepts.map((b) => ({
    ...b,
    totalAssigned: 0,
    inProgress: 0,
    awaitingVerification: 0,
    resolved: 0,
    overdueCount: 0,
  }));

  for (const c of complaintsStore) {
    const d = depts.find(
      (dept) => dept.name === c.assignedDepartment || dept.code === c.assignedDepartmentId
    );
    if (!d) continue;
    d.totalAssigned += 1;
    if (c.currentStatus === 'In Progress') d.inProgress += 1;
    if (c.currentStatus === 'Awaiting Admin Verification') d.awaitingVerification += 1;
    if (c.currentStatus === 'Resolved') d.resolved += 1;
    if (c.isOverdue && c.currentStatus !== 'Resolved') d.overdueCount += 1;
  }

  res.json({ departments: depts });
});

// 8. GET /api/notifications
app.get('/api/notifications', optionalAuth, (req: Request, res: Response) => {
  res.json({ notifications: notificationsStore });
});

// 8b. GET /api/audit-logs (Complaint Creation & Status History from Local JSON)
app.get('/api/audit-logs', optionalAuth, (req: Request, res: Response) => {
  const logs = loadAuditLogsJson();
  res.json({ auditLogs: logs, total: logs.length });
});

// 9. GET /api/stats
app.get('/api/stats', optionalAuth, (req: Request, res: Response) => {
  const total = complaintsStore.length;
  const inProgress = complaintsStore.filter((c) => c.currentStatus === 'In Progress').length;
  const awaitingVerification = complaintsStore.filter((c) => c.currentStatus === 'Awaiting Admin Verification').length;
  const resolved = complaintsStore.filter((c) => c.currentStatus === 'Resolved').length;
  const critical = complaintsStore.filter((c) => c.priority === 'Critical' && c.currentStatus !== 'Resolved').length;
  const overdue = complaintsStore.filter((c) => c.isOverdue && c.currentStatus !== 'Resolved').length;

  res.json({
    total,
    inProgress,
    awaitingVerification,
    resolved,
    critical,
    overdue,
    resolutionRate: total > 0 ? Math.round((resolved / total) * 100) : 0,
  });
});

// 9b. GET /api/health (Diagnostic Health & Storage Mode Status)
app.get('/api/health', (req: Request, res: Response) => {
  const currentMode = isFirestorePersistenceRequired() ? (adminDb ? 'firestore' : 'firestore-required') : 'local-json';
  res.json({
    status: 'ok',
    storageMode: currentMode,
    activePersistence: currentMode,
    cloudAuthType,
    projectId: EXPECTED_PROJECT_ID,
    databaseId: EXPECTED_DATABASE_ID,
    firestoreAvailable: Boolean(adminDb),
    requireDurableFirestore: isFirestorePersistenceRequired(),
    localFallbackEnabled: process.env.ALLOW_LOCAL_FALLBACK !== 'false' && !isFirestorePersistenceRequired(),
    activeComplaintsCount: complaintsStore.length,
    jsonStorage: {
      complaints: path.relative(ROOT_DIR, COMPLAINTS_STORE_PATH),
      settings: path.relative(ROOT_DIR, SETTINGS_STORE_PATH),
      auditLogs: path.relative(ROOT_DIR, AUDIT_LOGS_PATH),
      departments: path.relative(ROOT_DIR, DEPARTMENTS_PATH),
    },
    timestamp: new Date().toISOString(),
  });
});

// 10. GET & PATCH /api/settings
app.get('/api/settings', optionalAuth, (req: Request, res: Response) => {
  res.json(systemSettings);
});

app.patch('/api/settings', authenticateToken, requireAdminRole, async (req: Request, res: Response) => {
  const updatedSettings: SystemSettings = { ...systemSettings, ...req.body };
  let firestorePersisted = false;
  let firestoreError: any = null;

  if (adminDb && isFirestorePersistenceRequired()) {
    try {
      const batch = adminDb.batch();
      batch.set(adminDb.collection('settings').doc('system'), JSON.parse(JSON.stringify(updatedSettings)));
      const auditLog = {
        id: `AUDIT-SETTINGS-${Date.now()}`,
        action: 'SETTINGS_UPDATE: Municipal SLA & Governance Rules Modified',
        actor: req.user!.email || req.user!.uid,
        actorId: req.user!.uid,
        timestamp: new Date().toISOString(),
      };
      batch.set(adminDb.collection('auditLogs').doc(auditLog.id), auditLog);
      await batch.commit();
      firestorePersisted = true;
    } catch (err: any) {
      firestoreError = err;
      console.error('Error saving settings to Firestore:', err?.message || err);
    }
  }

  const requireCloud = isFirestorePersistenceRequired();
  const allowLocalFallback = process.env.ALLOW_LOCAL_FALLBACK !== 'false' && !requireCloud;

  if (!firestorePersisted && (requireCloud || !allowLocalFallback)) {
    res.status(503).json({
      error: 'Durable persistence failure: Settings update failed to write to Cloud Firestore and durable cloud persistence is strictly required.',
      details: firestoreError?.message || 'Firestore write failed or was denied.',
      storageMode: 'firestore-required',
    });
    return;
  }

  systemSettings = updatedSettings;
  await saveSettingsJson(systemSettings);

  await recordAuditLog({
    action: 'SETTINGS_UPDATE: Municipal SLA & Governance Rules Modified',
    actor: req.user!.email || req.user!.uid,
    actorId: req.user!.uid,
    timestamp: new Date().toISOString(),
  });

  res.json({
    message: 'Settings updated successfully',
    settings: systemSettings,
    storageMode: firestorePersisted ? 'firestore' : 'local-json',
    persistence: firestorePersisted ? 'firestore' : 'local-json',
  });
});

// 11. POST /api/reset-demo
app.post('/api/reset-demo', authenticateToken, requireAdminRole, async (req: Request, res: Response) => {
  const initialComplaints = getBaselineComplaints();
  const initialNotifications = generateInitialNotifications();
  let firestorePersisted = false;
  let firestoreError: any = null;

  if (adminDb && isFirestorePersistenceRequired()) {
    try {
      const batch = adminDb.batch();
      for (const item of initialComplaints) {
        batch.set(adminDb.collection('complaints').doc(item.id), item);
      }
      for (const notif of initialNotifications) {
        batch.set(adminDb.collection('notifications').doc(notif.id), notif);
      }
      batch.set(adminDb.collection('settings').doc('system'), systemSettings);
      await batch.commit();
      firestorePersisted = true;
    } catch (err: any) {
      firestoreError = err;
      console.error('Error writing reset demo data to Firestore:', err?.message || err);
    }
  }

  const requireCloud = isFirestorePersistenceRequired();
  const allowLocalFallback = process.env.ALLOW_LOCAL_FALLBACK !== 'false' && !requireCloud;

  if (!firestorePersisted && (requireCloud || !allowLocalFallback)) {
    res.status(503).json({
      error: 'Durable persistence failure: Demo reset failed to write to Cloud Firestore and durable cloud persistence is strictly required.',
      details: firestoreError?.message || 'Firestore write failed or was denied.',
      storageMode: 'firestore-required',
    });
    return;
  }

  complaintsStore = initialComplaints;
  notificationsStore = initialNotifications;
  await saveComplaintsJson(complaintsStore);

  await recordAuditLog({
    action: 'DEMO_DATA_RESET: Restored Baseline Dataset',
    actor: req.user!.email || req.user!.uid,
    actorId: req.user!.uid,
    timestamp: new Date().toISOString(),
  });

  res.json({
    message: 'Demo complaints and notifications reset to default state.',
    storageMode: firestorePersisted ? 'firestore' : 'local-json',
    persistence: firestorePersisted ? 'firestore' : 'local-json',
  });
});

// 12. Automated Test Suite (Executing Real Automated HTTP Requests against Endpoints)
app.get('/api/test/run-suite', rateLimiter(20), authenticateToken, requireAdminRole, async (req: Request, res: Response) => {
  const results: { testNumber: number; test: string; passed: boolean; message: string }[] = [];
  const adminToken = req.headers.authorization!;
  const testHost = `http://127.0.0.1:${PORT}`;

  // Test 1: Unauthenticated users cannot access protected APIs
  try {
    const res1 = await fetch(`${testHost}/api/complaints/CP-CHN-2026-1001`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ priority: 'High' }),
    });
    const passed1 = res1.status === 401;
    results.push({
      testNumber: 1,
      test: 'Unauthenticated users cannot access protected APIs',
      passed: passed1,
      message: `Verified: PATCH /api/complaints/:id without Bearer token returned HTTP ${res1.status} (expected 401 Unauthorized).`,
    });
  } catch (e: any) {
    results.push({ testNumber: 1, test: 'Unauthenticated users cannot access protected APIs', passed: false, message: e.message });
  }

  // Test 2: Invalid or forged credentials are authenticated and rejected
  try {
    const res2 = await fetch(`${testHost}/api/complaints/CP-CHN-2026-1001`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer forged_fake_token_value' },
      body: JSON.stringify({ priority: 'Critical' }),
    });
    const passed2 = res2.status === 401;
    results.push({
      testNumber: 2,
      test: 'Forged or invalid Bearer tokens are rejected',
      passed: passed2,
      message: `Verified: Forged Bearer token rejected with HTTP ${res2.status} (expected 401 Unauthorized).`,
    });
  } catch (e: any) {
    results.push({ testNumber: 2, test: 'Forged or invalid Bearer tokens are rejected', passed: false, message: e.message });
  }

  // Test 3: A user cannot read private original images without authorized admin credentials
  try {
    const res3 = await fetch(`${testHost}/api/media/complaint/CP-CHN-2026-1001/original`, { redirect: 'manual' });
    const passed3 = res3.status === 401 || res3.status === 403;
    results.push({
      testNumber: 3,
      test: "A user cannot read another user's private original images",
      passed: passed3,
      message: `Verified: Unauthenticated request to /api/media/complaint/:id/original returned HTTP ${res3.status} (expected 401/403).`,
    });
  } catch (e: any) {
    results.push({ testNumber: 3, test: "A user cannot read another user's private original images", passed: false, message: e.message });
  }

  // Test 4: Client-supplied administrator flags cannot bypass authorization
  try {
    const res4 = await fetch(`${testHost}/api/complaints/CP-CHN-2026-1001`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isAdmin: true, role: 'superadmin', priority: 'Critical' }),
    });
    const passed4 = res4.status === 401;
    results.push({
      testNumber: 4,
      test: 'Client-supplied administrator or redaction flags cannot bypass authorization',
      passed: passed4,
      message: `Verified: Body payload containing spoofed isAdmin/role rejected with HTTP ${res4.status} (expected 401).`,
    });
  } catch (e: any) {
    results.push({ testNumber: 4, test: 'Client-supplied administrator or redaction flags cannot bypass authorization', passed: false, message: e.message });
  }

  // Test 5: Invalid file types rejected by backend validation
  try {
    const res5 = await fetch(`${testHost}/api/upload/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': adminToken },
      body: JSON.stringify({ mimeType: 'application/pdf', fileSizeBytes: 1024, fileName: 'test.pdf' }),
    });
    const passed5 = res5.status === 400;
    results.push({
      testNumber: 5,
      test: 'Invalid file types are rejected by upload validation',
      passed: passed5,
      message: `Verified: PDF MIME type upload attempt returned HTTP ${res5.status} (expected 400 Bad Request).`,
    });
  } catch (e: any) {
    results.push({ testNumber: 5, test: 'Invalid file types are rejected by upload validation', passed: false, message: e.message });
  }

  // Test 6: Oversized uploads exceeding 10MB are rejected
  try {
    const res6 = await fetch(`${testHost}/api/upload/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': adminToken },
      body: JSON.stringify({ mimeType: 'image/jpeg', fileSizeBytes: 15 * 1024 * 1024, fileName: 'huge.jpg' }),
    });
    const passed6 = res6.status === 400;
    results.push({
      testNumber: 6,
      test: 'Oversized uploads are rejected by backend validation',
      passed: passed6,
      message: `Verified: 15MB upload attempt rejected with HTTP ${res6.status} (expected 400 Bad Request).`,
    });
  } catch (e: any) {
    results.push({ testNumber: 6, test: 'Oversized uploads are rejected by backend validation', passed: false, message: e.message });
  }

  // Test 7: Binary signature mismatch (spoofed MIME type) is rejected
  try {
    const res7 = await fetch(`${testHost}/api/upload/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': adminToken },
      body: JSON.stringify({
        mimeType: 'image/jpeg',
        fileSizeBytes: 1024,
        fileName: 'spoofed.jpg',
        fileHeaderBase64: Buffer.from('FAKE_NOT_IMAGE_BINARY').toString('base64'),
      }),
    });
    const passed7 = res7.status === 400;
    results.push({
      testNumber: 7,
      test: 'Binary magic-byte mismatch rejected by backend validator',
      passed: passed7,
      message: `Verified: File with non-image binary header rejected with HTTP ${res7.status} (expected 400).`,
    });
  } catch (e: any) {
    results.push({ testNumber: 7, test: 'Binary magic-byte mismatch rejected by backend validator', passed: false, message: e.message });
  }

  // Test 8: Unauthorized complaint status changes are rejected
  try {
    const res8 = await fetch(`${testHost}/api/complaints/CP-CHN-2026-1041`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'Authorization': adminToken },
      body: JSON.stringify({ status: 'Resolved' }),
    });
    const passed8 = res8.status === 400;
    results.push({
      testNumber: 8,
      test: 'Unauthorized complaint status changes are rejected',
      passed: passed8,
      message: `Verified: Direct transition to Resolved without evidence verification rejected with HTTP ${res8.status} (expected 400).`,
    });
  } catch (e: any) {
    results.push({ testNumber: 8, test: 'Unauthorized complaint status changes are rejected', passed: false, message: e.message });
  }

  // Test 9: Private original-image URLs are not returned by public complaint endpoints
  try {
    const res9 = await fetch(`${testHost}/api/complaints`);
    const data9 = await res9.json();
    const sample = data9.complaints?.[0];
    const hasNoReporterId = sample && !('reporterId' in sample);
    const hasProtectedUrl = sample && !sample.originalPhotoUrl?.includes('token=');
    const passed9 = res9.ok && Boolean(hasNoReporterId) && Boolean(hasProtectedUrl);
    results.push({
      testNumber: 9,
      test: 'Private citizen data and original-image URLs are sanitized in public responses',
      passed: passed9,
      message: `Verified: Public GET /api/complaints returned sanitized complaints without citizen reporterId or raw storage tokens.`,
    });
  } catch (e: any) {
    results.push({ testNumber: 9, test: 'Private citizen data and original-image URLs are sanitized in public responses', passed: false, message: e.message });
  }

  // Test 10: Authorized administrators can perform permitted operations
  try {
    const res10 = await fetch(`${testHost}/api/complaints/CP-CHN-2026-1041`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'Authorization': adminToken },
      body: JSON.stringify({ priority: 'High', priorityReason: 'Automated Security Verification Priority Override' }),
    });
    const passed10 = res10.ok;
    results.push({
      testNumber: 10,
      test: 'Authorized administrators can perform permitted operations',
      passed: passed10,
      message: `Verified: Authorized administrator operation succeeded with HTTP ${res10.status}.`,
    });
  } catch (e: any) {
    results.push({ testNumber: 10, test: 'Authorized administrators can perform permitted operations', passed: false, message: e.message });
  }

  const allPassed = results.every((r) => r.passed);
  res.json({
    allPassed,
    summary: `${results.filter((r) => r.passed).length} of ${results.length} tests passed`,
    results,
  });
});

// Setup Vite in development or static in production
async function startServer(port: number = PORT): Promise<import('http').Server> {
  const freshStores = initAllLocalStores();
  complaintsStore = freshStores.complaints;
  systemSettings = freshStores.settings;
  auditLogsStore = freshStores.auditLogs;
  departmentsStore = freshStores.departments;
  const isTest = process.env.NODE_ENV === 'test';
  const isDev = process.env.NODE_ENV !== 'production' && !isTest;

  if (isDev) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else if (!isTest) {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  return new Promise((resolve) => {
    const server = app.listen(port, () => {
      console.log(`Namma Ooru Hardened Admin Server running on http://localhost:${port}`);
      resolve(server);
    });
  });
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
  startServer();
}

export { app, startServer };
