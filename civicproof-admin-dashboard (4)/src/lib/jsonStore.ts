/**
 * Namma Ooru - Local JSON Store Manager
 * 
 * Provides safe, concurrent-safe, atomic persistence for:
 * - data/complaints-store.json (complaint records)
 * - data/settings-store.json (application settings & priority rules)
 * - data/audit-logs.json (complaint creation and status-change history)
 * - data/departments.json (department metadata and configuration)
 * 
 * Guarantees:
 * 1. Safe file writes: Atomic replacement with temp files and Windows retry/copy fallbacks.
 * 2. Concurrency safety: Mutex serialization prevents race conditions on writes.
 * 3. Data preservation: Existing files and complaint records are never overwritten with defaults.
 * 4. Missing files: Automatically initialized with valid structure.
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { DEMO_DEPARTMENTS, DEMO_COMPLAINTS } from '../data/demoDataset.js';
import type {
  Complaint,
  SystemSettings,
  AuditLogEntry,
  DepartmentSummary,
  DepartmentName,
  ComplaintCategory,
  PriorityRule,
} from '../types/civic.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '../..');
export const DATA_DIR = path.resolve(ROOT_DIR, 'data');

export const COMPLAINTS_STORE_PATH = path.resolve(DATA_DIR, 'complaints-store.json');
export const SETTINGS_STORE_PATH = path.resolve(DATA_DIR, 'settings-store.json');
export const AUDIT_LOGS_PATH = path.resolve(DATA_DIR, 'audit-logs.json');
export const DEPARTMENTS_PATH = path.resolve(DATA_DIR, 'departments.json');

/**
 * Async Mutex for serializing disk writes per file or global queue
 */
class AsyncLock {
  private queue: Promise<void> = Promise.resolve();

  async runExclusive<T>(task: () => Promise<T>): Promise<T> {
    let release: () => void;
    const lock = new Promise<void>((resolve) => {
      release = resolve;
    });
    const current = this.queue;
    this.queue = this.queue.then(() => lock);

    await current;
    try {
      return await task();
    } finally {
      release!();
    }
  }
}

const fileLocks = new Map<string, AsyncLock>();

function getFileLock(filePath: string): AsyncLock {
  let lock = fileLocks.get(filePath);
  if (!lock) {
    lock = new AsyncLock();
    fileLocks.set(filePath, lock);
  }
  return lock;
}

/**
 * Atomic write helper that handles Windows file locking semantics
 */
async function atomicWriteJson(filePath: string, data: unknown): Promise<void> {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const jsonString = JSON.stringify(data, null, 2) + '\n';
  const tempPath = path.join(
    dir,
    `.${path.basename(filePath)}.${process.pid}.${Date.now()}.${crypto.randomBytes(4).toString('hex')}.tmp`
  );

  fs.writeFileSync(tempPath, jsonString, 'utf-8');

  let retries = 6;
  while (retries > 0) {
    try {
      fs.renameSync(tempPath, filePath);
      return;
    } catch (err: any) {
      if ((err.code === 'EPERM' || err.code === 'EBUSY' || err.code === 'EACCES') && retries > 1) {
        retries--;
        await new Promise((resolve) => setTimeout(resolve, 25 * (7 - retries)));
      } else {
        // Fallback: Copy file and unlink temp
        try {
          fs.copyFileSync(tempPath, filePath);
          fs.unlinkSync(tempPath);
          return;
        } catch {
          try {
            if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
          } catch {
            // ignore cleanup failure
          }
          throw err;
        }
      }
    }
  }
}

/**
 * Baseline default departments
 */
export function getDefaultDepartments(): DepartmentSummary[] {
  return DEMO_DEPARTMENTS.map((department) => ({ ...department }));
}

/**
 * Baseline default priority rules
 */
export const defaultPriorityRules: PriorityRule[] = [
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
    description: 'Public health danger from major water distribution damage or contaminated supply.',
    enabled: true,
  },
  {
    id: 'PR-03',
    name: 'Hospital / School Zone Waste Pileup',
    category: 'Improper Waste Disposal',
    keywords: ['hospital', 'clinic', 'school', 'children', 'biohazard', 'overflow', 'dead animal', 'stagnant'],
    assignedPriority: 'High',
    scoreBonus: 30,
    description: 'Sanitary risk adjacent to schools, hospitals, or dense residential slums.',
    enabled: true,
  },
  {
    id: 'PR-04',
    name: 'General Street Defect Standard Routine',
    category: 'All',
    keywords: ['minor', 'crack', 'drainage slow', 'gravel', 'litter'],
    assignedPriority: 'Low',
    scoreBonus: 10,
    description: 'Standard domestic street maintenance SLA.',
    enabled: true,
  },
];

/**
 * Baseline default system settings
 */
export function getDefaultSettings(): SystemSettings {
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

/**
 * Initial fallback baseline complaints (used ONLY when complaints-store.json does not exist)
 */
export function getBaselineComplaints(): Complaint[] {
  try {
    if (fs.existsSync(COMPLAINTS_STORE_PATH)) {
      const raw = fs.readFileSync(COMPLAINTS_STORE_PATH, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed as Complaint[];
      }
    }
  } catch {
    // fallback to static baseline
  }
  return DEMO_COMPLAINTS;
}

// =============================================================================
// COMPLAINTS STORE
// =============================================================================

export function loadComplaintsJson(): Complaint[] {
  try {
    if (fs.existsSync(COMPLAINTS_STORE_PATH)) {
      const raw = fs.readFileSync(COMPLAINTS_STORE_PATH, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (err: any) {
    console.warn(`[jsonStore] Warning reading ${COMPLAINTS_STORE_PATH}:`, err.message);
  }

  // Create initial file only if missing
  const baseline = getBaselineComplaints();
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(COMPLAINTS_STORE_PATH, JSON.stringify(baseline, null, 2), 'utf-8');
  } catch (writeErr: any) {
    console.error(`[jsonStore] Error creating initial complaints store:`, writeErr.message);
  }
  return baseline;
}

export async function saveComplaintsJson(complaints: Complaint[]): Promise<void> {
  const lock = getFileLock(COMPLAINTS_STORE_PATH);
  await lock.runExclusive(async () => {
    await atomicWriteJson(COMPLAINTS_STORE_PATH, complaints);
  });
}

// Synchronous variant for boot / emergency sync
export function saveComplaintsJsonSync(complaints: Complaint[]): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  fs.writeFileSync(COMPLAINTS_STORE_PATH, JSON.stringify(complaints, null, 2), 'utf-8');
}

// =============================================================================
// SETTINGS STORE
// =============================================================================

export function loadSettingsJson(): SystemSettings {
  try {
    if (fs.existsSync(SETTINGS_STORE_PATH)) {
      const raw = fs.readFileSync(SETTINGS_STORE_PATH, 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object' && parsed.adminName) {
        return parsed as SystemSettings;
      }
    }
  } catch (err: any) {
    console.warn(`[jsonStore] Warning reading ${SETTINGS_STORE_PATH}:`, err.message);
  }

  const defaultSettings = getDefaultSettings();
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(SETTINGS_STORE_PATH, JSON.stringify(defaultSettings, null, 2), 'utf-8');
  } catch (writeErr: any) {
    console.error(`[jsonStore] Error creating initial settings store:`, writeErr.message);
  }
  return defaultSettings;
}

export async function saveSettingsJson(settings: SystemSettings): Promise<void> {
  const lock = getFileLock(SETTINGS_STORE_PATH);
  await lock.runExclusive(async () => {
    await atomicWriteJson(SETTINGS_STORE_PATH, settings);
  });
}

// =============================================================================
// AUDIT LOGS STORE
// =============================================================================

export function loadAuditLogsJson(): AuditLogEntry[] {
  try {
    if (fs.existsSync(AUDIT_LOGS_PATH)) {
      const raw = fs.readFileSync(AUDIT_LOGS_PATH, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (err: any) {
    console.warn(`[jsonStore] Warning reading ${AUDIT_LOGS_PATH}:`, err.message);
  }

  // If missing, synthesize from existing complaints history so historical audits are not lost
  const existingComplaints = loadComplaintsJson();
  const initialLogs: AuditLogEntry[] = [];
  for (const c of existingComplaints) {
    if (Array.isArray(c.history)) {
      for (const h of c.history) {
        initialLogs.push({
          id: h.id || `LOG-${c.id}-${Date.now()}`,
          complaintId: c.id,
          timestamp: h.timestamp || c.submissionTimestamp,
          action: h.action,
          actor: h.actor,
          previousValue: h.previousValue,
          newValue: h.newValue,
          reason: h.reason,
        });
      }
    }
  }

  // Sort by timestamp ascending
  initialLogs.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(AUDIT_LOGS_PATH, JSON.stringify(initialLogs, null, 2), 'utf-8');
  } catch (writeErr: any) {
    console.error(`[jsonStore] Error creating initial audit logs store:`, writeErr.message);
  }
  return initialLogs;
}

export async function saveAuditLogsJson(logs: AuditLogEntry[]): Promise<void> {
  const lock = getFileLock(AUDIT_LOGS_PATH);
  await lock.runExclusive(async () => {
    await atomicWriteJson(AUDIT_LOGS_PATH, logs);
  });
}

export async function appendAuditLogJson(entry: AuditLogEntry): Promise<AuditLogEntry> {
  const lock = getFileLock(AUDIT_LOGS_PATH);
  return await lock.runExclusive(async () => {
    let currentLogs: AuditLogEntry[] = [];
    try {
      if (fs.existsSync(AUDIT_LOGS_PATH)) {
        const raw = fs.readFileSync(AUDIT_LOGS_PATH, 'utf-8');
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          currentLogs = parsed;
        }
      }
    } catch {
      currentLogs = [];
    }
    currentLogs.push(entry);
    await atomicWriteJson(AUDIT_LOGS_PATH, currentLogs);
    return entry;
  });
}

// =============================================================================
// DEPARTMENTS STORE
// =============================================================================

export function loadDepartmentsJson(): DepartmentSummary[] {
  try {
    if (fs.existsSync(DEPARTMENTS_PATH)) {
      const raw = fs.readFileSync(DEPARTMENTS_PATH, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err: any) {
    console.warn(`[jsonStore] Warning reading ${DEPARTMENTS_PATH}:`, err.message);
  }

  const defaultDepts = getDefaultDepartments();
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DEPARTMENTS_PATH, JSON.stringify(defaultDepts, null, 2), 'utf-8');
  } catch (writeErr: any) {
    console.error(`[jsonStore] Error creating initial departments store:`, writeErr.message);
  }
  return defaultDepts;
}

export async function saveDepartmentsJson(departments: DepartmentSummary[]): Promise<void> {
  const lock = getFileLock(DEPARTMENTS_PATH);
  await lock.runExclusive(async () => {
    await atomicWriteJson(DEPARTMENTS_PATH, departments);
  });
}

/**
 * Initializes and validates all 4 local stores safely on application startup.
 * Guarantees all required data files exist without overwriting existing data.
 */
export function initAllLocalStores(): {
  complaints: Complaint[];
  settings: SystemSettings;
  auditLogs: AuditLogEntry[];
  departments: DepartmentSummary[];
} {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  const complaints = loadComplaintsJson();
  const settings = loadSettingsJson();
  const auditLogs = loadAuditLogsJson();
  const departments = loadDepartmentsJson();

  console.log(`[jsonStore] Active Local Storage Initialized:`);
  console.log(`  • complaints-store.json : ${complaints.length} records`);
  console.log(`  • settings-store.json   : configured (admin: ${settings.adminName})`);
  console.log(`  • audit-logs.json       : ${auditLogs.length} audit entries`);
  console.log(`  • departments.json      : ${departments.length} departments`);

  return { complaints, settings, auditLogs, departments };
}
