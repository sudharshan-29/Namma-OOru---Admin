import type {
  Complaint,
  ComplaintCategory,
  ComplaintPriority,
  ComplaintStatus,
  DepartmentName,
  DepartmentSummary,
  NotificationRecord,
  ReporterType,
  SystemSettings,
} from '../types/civic';

export interface ComplaintsQueryParams {
  search?: string;
  category?: ComplaintCategory | 'All';
  priority?: ComplaintPriority | 'All';
  status?: ComplaintStatus | 'All';
  department?: DepartmentName | 'All';
  reporterType?: ReporterType | 'All';
  sortBy?: 'submissionTimestamp' | 'priority';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
  demoFilter?: 'all' | 'real' | 'demo';
}

export interface ComplaintsResponse {
  complaints: Complaint[];
  total: number;
  page: number;
  totalPages: number;
  limit: number;
}

export interface StatsResponse {
  total: number;
  inProgress: number;
  awaitingVerification: number;
  resolved: number;
  critical: number;
  overdue: number;
  resolutionRate: number;
}

export interface HealthResponse {
  status: string;
  storageMode: 'firestore' | 'local-json';
  activePersistence?: string;
  firestoreAvailable: boolean;
  requireDurableFirestore: boolean;
  localFallbackEnabled: boolean;
  activeComplaintsCount?: number;
  jsonStorage?: {
    complaints: string;
    settings: string;
    auditLogs: string;
    departments: string;
  };
  timestamp?: string;
}

import { auth } from '../lib/firebase';

export async function getClientAuthToken(forceRefresh: boolean = false): Promise<string | null> {
  // Use verified Firebase Authentication ID token when signed in
  if (auth.currentUser) {
    try {
      return await auth.currentUser.getIdToken(forceRefresh);
    } catch {
      return null;
    }
  }

  // Development & Local Session Authentication
  const storedToken =
    typeof window !== 'undefined'
      ? window.sessionStorage?.getItem('adminToken') || window.localStorage?.getItem('adminToken')
      : null;
  if (storedToken) {
    return storedToken;
  }

  return 'NAMMA_OORU_TEST_ADMIN_AUTH_TOKEN_2026';
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  try {
    const token = await getClientAuthToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  } catch {
    // Continue
  }

  let res = await fetch(endpoint, {
    ...options,
    headers,
  });

  // If 401 Unauthorized, attempt one token refresh retry
  if (res.status === 401) {
    try {
      const refreshedToken = await getClientAuthToken(true);
      if (refreshedToken) {
        headers['Authorization'] = `Bearer ${refreshedToken}`;
        res = await fetch(endpoint, {
          ...options,
          headers,
        });
      }
    } catch {
      // Continue to error parsing
    }
  }

  if (!res.ok) {
    let errorMsg = `Server responded with HTTP ${res.status}`;
    try {
      const errorData = await res.json();
      if (errorData.error) errorMsg = errorData.error;
    } catch {
      // ignore
    }

    if (res.status === 401) {
      errorMsg = `Authentication Required (401): ${errorMsg}`;
    } else if (res.status === 403) {
      errorMsg = `Access Forbidden (403): ${errorMsg}`;
    }

    throw new Error(errorMsg);
  }

  return res.json();
}

export const api = {
  getComplaints(params: ComplaintsQueryParams = {}): Promise<ComplaintsResponse> {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        searchParams.set(key, String(val));
      }
    });
    return request<ComplaintsResponse>(`/api/complaints?${searchParams.toString()}`);
  },

  createComplaint(data: {
    category: ComplaintCategory;
    description: string;
    address: string;
    zone?: string;
    ward?: string;
    coordinates?: { lat: number; lng: number };
    geoJsonCoordinates?: [number, number];
    photoUrl?: string;
    photoPath?: string;
    reporterType?: ReporterType;
    reporterInfo?: {
      citizenId?: string;
      name?: string;
      maskedContact?: string;
      isVerifiedUser?: boolean;
    };
  }): Promise<{ message: string; complaint: Complaint; persistence?: 'firestore' | 'local-json' | 'local-durable'; storageMode?: 'firestore' | 'local-json' }> {
    return request<{ message: string; complaint: Complaint }>('/api/complaints', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  getComplaintById(id: string): Promise<Complaint> {
    return request<Complaint>(`/api/complaints/${encodeURIComponent(id)}`);
  },

  updateComplaint(
    id: string,
    updates: {
      status?: ComplaintStatus;
      priority?: ComplaintPriority;
      priorityReason?: string;
      assignedDepartment?: DepartmentName;
      reassignmentReason?: string;
      verificationAction?: 'approve' | 'reject';
      rejectionReason?: string;
      statusReason?: string;
    }
  ): Promise<{ message: string; complaint: Complaint; notification?: NotificationRecord }> {
    return request(`/api/complaints/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  },

  getDepartments(): Promise<{ departments: DepartmentSummary[] }> {
    return request<{ departments: DepartmentSummary[] }>('/api/departments');
  },

  getNotifications(): Promise<{ notifications: NotificationRecord[] }> {
    return request<{ notifications: NotificationRecord[] }>('/api/notifications');
  },

  getStats(): Promise<StatsResponse> {
    return request<StatsResponse>('/api/stats');
  },

  getSettings(): Promise<SystemSettings> {
    return request<SystemSettings>('/api/settings');
  },

  updateSettings(settings: Partial<SystemSettings>): Promise<{ message: string; settings: SystemSettings }> {
    return request('/api/settings', {
      method: 'PATCH',
      body: JSON.stringify(settings),
    });
  },

  resetDemoData(): Promise<{ message: string }> {
    return request('/api/reset-demo', { method: 'POST' });
  },

  runTestSuite(): Promise<{
    allPassed: boolean;
    summary: string;
    results: { test: string; passed: boolean; message: string }[];
  }> {
    return request('/api/test/run-suite');
  },
  getHealth(): Promise<HealthResponse> {
    return request<HealthResponse>('/api/health');
  },
};
