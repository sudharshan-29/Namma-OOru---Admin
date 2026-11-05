export type ComplaintCategory =
  | 'Road Damage'
  | 'Improper Waste Disposal'
  | 'Water Leakage';

export type DepartmentName =
  | 'Roads and Infrastructure Department'
  | 'Solid Waste Management Department'
  | 'Water Supply and Sewerage Department';

export type ComplaintPriority = 'Critical' | 'High' | 'Medium' | 'Low';

export type ComplaintStatus =
  | 'Received'
  | 'Prioritized'
  | 'Assigned'
  | 'In Progress'
  | 'Evidence Submitted'
  | 'Awaiting Admin Verification'
  | 'Resolved';

export type ReporterType = 'Registered Citizen' | 'Anonymous Reporter';

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  action: string;
  actor: string;
  actorId?: string;
  complaintId?: string;
  previousValue?: string;
  newValue?: string;
  reason?: string;
}

export interface VerificationRecord {
  submittedAt: string;
  submittedByDepartment: DepartmentName;
  afterRepairPhotoUrl: string;
  repairNotes: string;
  verifiedAt?: string;
  verifiedBy?: string;
  decision?: 'Approved' | 'Rejected';
  rejectionReason?: string;
  resubmissionCount: number;
}

export interface Complaint {
  id: string; // e.g. CP-CHN-2026-1042
  category: ComplaintCategory;
  description: string;
  location: {
    address: string;
    zone: string;
    ward: string;
    coordinates: {
      lat: number;
      lng: number;
    };
    geoJsonCoordinates?: [number, number];
    landmark?: string;
  };
  originalPhotoUrl: string;
  originalPhotoPath?: string;
  originalPhotoThumbnailUrl?: string;
  submissionTimestamp: string;
  priority: ComplaintPriority;
  priorityReason?: string;
  priorityScore?: number; // 0-100 derived from risk model
  assignedDepartmentId?: string;
  assignedDepartment: DepartmentName;
  assignmentTimestamp: string;
  currentStatus: ComplaintStatus;
  status?: ComplaintStatus;
  reporterType: ReporterType;
  reporterId?: string;
  reporterInfo?: {
    citizenId?: string;
    name?: string;
    maskedContact?: string;
    isVerifiedUser: boolean;
  };
  createdAt?: string;
  updatedAt?: string;
  slaDeadline: string;
  isOverdue: boolean;
  isDemo: boolean;
  resolutionNotes?: string;
  verification?: VerificationRecord;
  history: AuditLogEntry[];
  roadName?: string;
  roadGeometry?: any;
  photo?: any;
}

export interface ResolutionEvidenceDoc {
  id: string;
  complaintId: string;
  submittingDepartmentId: string;
  submittingDepartment: DepartmentName;
  afterRepairPhotoPath?: string;
  afterRepairPhotoUrl: string;
  repairNotes: string;
  submittedAt: string;
  verificationStatus: 'pending' | 'approved' | 'rejected';
  decision?: 'Approved' | 'Rejected';
  adminReviewerId?: string;
  adminReviewerEmail?: string;
  reviewTimestamp?: string;
  rejectionReason?: string;
  resubmissionCount: number;
}

export interface AdminUserDoc {
  uid: string;
  email: string;
  name?: string;
  role: 'superadmin' | 'admin';
  createdAt: string;
}

export interface DepartmentSummary {
  name: DepartmentName;
  code: string;
  category: ComplaintCategory;
  totalAssigned: number;
  inProgress: number;
  awaitingVerification: number;
  resolved: number;
  overdueCount: number;
  avgResolutionHours: number;
  slaTargetHours: number;
  headOfficer: string;
  contactNumber: string;
}

export interface NotificationRecord {
  id: string;
  complaintId: string;
  category: ComplaintCategory;
  recipientEligibility: 'Eligible (Registered)' | 'Ineligible (Anonymous - Restricted)';
  recipientName?: string;
  recipientContact?: string;
  notificationType: 'Evidence Approved & Resolved' | 'Status Update' | 'Complaint Registered';
  creationTimestamp: string;
  deliveryStatus: 'Delivered' | 'Pending' | 'Blocked (Anonymous Safety Policy)' | 'Failed';
  failureReason?: string;
  hasSignedPhotoUrl: boolean;
  signedUrlExpiry?: string;
  deliveredChannel: 'SMS' | 'Email' | 'In-App Portal' | 'None';
}

export interface PriorityRule {
  id: string;
  name: string;
  category: ComplaintCategory | 'All';
  keywords: string[];
  assignedPriority: ComplaintPriority;
  scoreBonus: number;
  description: string;
  enabled: boolean;
}

export interface SystemSettings {
  adminName: string;
  adminDesignation: string;
  slaHours: {
    Critical: number;
    High: number;
    Medium: number;
    Low: number;
  };
  autoAssignmentEnabled: boolean;
  strictPhotoVerification: boolean;
  notifyOnlyRegisteredCitizens: boolean;
  priorityRules: PriorityRule[];
}
