import React, { useState } from 'react';
import {
  X,
  MapPin,
  Calendar,
  Building2,
  AlertTriangle,
  Clock,
  History,
  Shield,
  Send,
  Eye,
  CheckCircle2,
  XCircle,
  FileCheck,
} from 'lucide-react';
import type { Complaint, ComplaintPriority, DepartmentName, ComplaintStatus } from '../../types/civic';
import { CategoryBadge, PriorityBadge, StatusBadge, ReporterBadge } from '../common/Badge';

interface ComplaintDetailModalProps {
  complaint: Complaint | null;
  isOpen: boolean;
  onClose: () => void;
  onOverridePriority: (id: string, priority: ComplaintPriority, reason: string) => Promise<void>;
  onReassignDepartment: (id: string, department: DepartmentName, reason: string) => Promise<void>;
  onVerify: (id: string, action: 'approve' | 'reject', reason?: string) => Promise<void>;
  onOpenPhoto: (url: string, title: string, subtitle?: string) => void;
  onUpdateStatus?: (id: string, status: ComplaintStatus, reason?: string) => Promise<void>;
}

export const ComplaintDetailModal: React.FC<ComplaintDetailModalProps> = ({
  complaint,
  isOpen,
  onClose,
  onOverridePriority,
  onReassignDepartment,
  onVerify,
  onOpenPhoto,
  onUpdateStatus,
}) => {
  const [activeTab, setActiveTab] = useState<'details' | 'timeline' | 'evidence'>('details');
  const [priorityModalOpen, setPriorityModalOpen] = useState(false);
  const [newPriority, setNewPriority] = useState<ComplaintPriority>('High');
  const [priorityReason, setPriorityReason] = useState('');

  const [reassignModalOpen, setReassignModalOpen] = useState(false);
  const [newDept, setNewDept] = useState<DepartmentName>('Roads and Infrastructure Department');
  const [reassignReason, setReassignReason] = useState('');

  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Glacier Blue Liquid Glass modal card style matching the top navigation bar (#B9D8E1 / rgb(185, 219, 225)):
  const modalGlassCardStyle: React.CSSProperties = {
    background:
      /* 1. Top Specular Lens Meniscus Arc */
      'linear-gradient(180deg, rgba(255, 255, 255, 0.75) 0%, rgba(255, 255, 255, 0.25) 25%, rgba(255, 255, 255, 0.05) 55%, transparent 100%), ' +
      /* 2. Prismatic Caustic Dispersion Streak */
      'linear-gradient(125deg, rgba(255, 255, 255, 0.40) 0%, rgba(185, 219, 225, 0.15) 25%, rgba(255, 255, 255, 0.20) 50%, rgba(160, 205, 220, 0.25) 75%, rgba(255, 255, 255, 0.35) 100%), ' +
      /* 3. Pure Glacier Blue Liquid Tint (#B9D8E1 / rgb(185, 219, 225) - translucent liquid volume) */
      'linear-gradient(180deg, rgba(220, 240, 246, 0.95) 0%, rgba(185, 219, 225, 0.93) 50%, rgba(165, 206, 216, 0.96) 100%)',
    backdropFilter: 'blur(36px) saturate(210%) contrast(106%)',
    WebkitBackdropFilter: 'blur(36px) saturate(210%) contrast(106%)',
    border: '1.5px solid rgba(255, 255, 255, 0.85)',
    borderRadius: '26px',
    boxShadow:
      '0 28px 65px -8px rgba(10, 38, 64, 0.30), ' +
      '0 10px 24px -4px rgba(10, 38, 64, 0.18), ' +
      '0 0 1px 1.5px rgba(255, 255, 255, 0.85), ' +
      'inset 0 1.5px 2px 0 rgba(255, 255, 255, 0.95), ' +
      'inset 0 -1.5px 2.5px 0 rgba(110, 168, 185, 0.50), ' +
      'inset 1.5px 0 2px 0 rgba(255, 255, 255, 0.50), ' +
      'inset -1.5px 0 2px 0 rgba(255, 255, 255, 0.35), ' +
      'inset 0 0 24px 2px rgba(185, 219, 225, 0.40)',
  };

  const subModalGlassStyle: React.CSSProperties = {
    background:
      'linear-gradient(180deg, rgba(255, 255, 255, 0.80) 0%, rgba(255, 255, 255, 0.20) 30%, transparent 60%), ' +
      'linear-gradient(135deg, rgba(230, 246, 250, 0.96) 0%, rgba(185, 219, 225, 0.96) 100%)',
    backdropFilter: 'blur(36px) saturate(210%)',
    WebkitBackdropFilter: 'blur(36px) saturate(210%)',
    border: '1.5px solid rgba(255, 255, 255, 0.90)',
    borderRadius: '24px',
    boxShadow:
      '0 28px 65px rgba(10, 38, 64, 0.35), ' +
      '0 0 1px 1.5px rgba(255, 255, 255, 0.85), ' +
      'inset 0 1.5px 2px rgba(255, 255, 255, 0.95), ' +
      'inset 0 -1.5px 2px rgba(125, 178, 192, 0.55), ' +
      'inset 0 0 16px rgba(185, 219, 225, 0.40)',
  };

  if (!isOpen || !complaint) return null;

  const handlePrioritySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!priorityReason.trim()) return;
    setIsSubmitting(true);
    try {
      await onOverridePriority(complaint.id, newPriority, priorityReason.trim());
      setPriorityModalOpen(false);
      setPriorityReason('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReassignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reassignReason.trim()) return;
    setIsSubmitting(true);
    try {
      await onReassignDepartment(complaint.id, newDept, reassignReason.trim());
      setReassignModalOpen(false);
      setReassignReason('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectionReason.trim()) return;
    setIsSubmitting(true);
    try {
      await onVerify(complaint.id, 'reject', rejectionReason.trim());
      setRejectModalOpen(false);
      setRejectionReason('');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[64px] sm:pt-[68px] pb-8 px-3 sm:px-4 bg-[#0a1c2e]/55 backdrop-blur-sm overflow-y-auto"
      onClick={onClose}
    >
      <div
        style={modalGlassCardStyle}
        className="relative max-w-3xl w-full my-0 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 bg-white/40 border-b border-white/60 flex items-start justify-between gap-4 backdrop-blur-md">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <span className="font-mono text-xs font-bold text-[#0A2540] bg-white/80 px-2.5 py-0.5 rounded-full border border-white shadow-2xs">
                #{complaint.id.match(/(\d{4})$/)?.[1] || complaint.id}
              </span>
              <CategoryBadge category={complaint.category} />
              <PriorityBadge priority={complaint.priority} />
              <StatusBadge status={complaint.currentStatus} />
              {complaint.isDemo && (
                <span className="text-[10px] font-bold text-[#486581] bg-white/70 px-2 py-0.5 rounded-full border border-white font-mono">
                  DEMO SCENARIO
                </span>
              )}
            </div>
            <h2 className="text-base sm:text-lg font-bold text-[#0A2540]">
              {complaint.location.address}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-[#486581] hover:text-[#0A2540] hover:bg-white/50 rounded-xl transition cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs inside modal */}
        <div className="flex border-b border-white/60 bg-white/25 px-6 text-xs gap-1 pt-1">
          <button
            onClick={() => setActiveTab('details')}
            className={`py-2.5 px-4 font-bold border-b-2 transition cursor-pointer text-xs ${
              activeTab === 'details'
                ? 'border-[#0284C7] text-[#0A2540]'
                : 'border-transparent text-[#486581] hover:text-[#0A2540]'
            }`}
          >
            Details & Visual Evidence
          </button>
          <button
            onClick={() => setActiveTab('timeline')}
            className={`py-2.5 px-4 font-bold border-b-2 transition flex items-center gap-1.5 cursor-pointer text-xs ${
              activeTab === 'timeline'
                ? 'border-[#0284C7] text-[#0A2540]'
                : 'border-transparent text-[#486581] hover:text-[#0A2540]'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            Audit Log ({complaint.history.length})
          </button>
          {complaint.verification && (
            <button
              onClick={() => setActiveTab('evidence')}
              className={`py-2.5 px-4 font-bold border-b-2 transition flex items-center gap-1.5 cursor-pointer text-xs ${
                activeTab === 'evidence'
                  ? 'border-[#0284C7] text-[#0A2540]'
                  : 'border-transparent text-[#486581] hover:text-[#0A2540]'
              }`}
            >
              <FileCheck className="w-3.5 h-3.5 text-[#0284C7]" />
              Side-by-Side Proof
            </button>
          )}
        </div>

        {/* Modal Body */}
        <div className="p-6 max-h-[68vh] overflow-y-auto space-y-5">
          {/* TAB 1: DETAILS */}
          {activeTab === 'details' && (
            <div className="space-y-5">
              {/* Description */}
              <div>
                <h3 className="text-[10.5px] font-bold text-[#1e3a5f] uppercase tracking-wider mb-1.5">
                  Citizen Issue Report
                </h3>
                <div className="p-3.5 rounded-2xl bg-white/80 border border-white/90 text-sm font-medium text-[#0A2540] shadow-2xs leading-relaxed backdrop-blur-sm">
                  {complaint.description}
                </div>
              </div>

              {/* Photos Grid */}
              <div>
                <h3 className="text-[10.5px] font-bold text-[#1e3a5f] uppercase tracking-wider mb-2">
                  Photo Evidence Vault
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Original Photo */}
                  <div className="border border-white/90 rounded-2xl overflow-hidden bg-white/80 shadow-2xs group">
                    <div className="px-3.5 py-2 bg-white/90 border-b border-white/80 text-xs font-bold text-[#0A2540] flex items-center justify-between">
                      <span>Original Damage (Citizen)</span>
                      <button
                        onClick={() =>
                          onOpenPhoto(
                            complaint.originalPhotoUrl,
                            `Original Evidence - ${complaint.id}`,
                            complaint.location.address
                          )
                        }
                        className="text-[#0284C7] hover:text-[#0369A1] text-[11px] font-semibold inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Eye className="w-3 h-3" /> Full View
                      </button>
                    </div>
                    <div
                      className="relative aspect-video bg-slate-100 cursor-pointer overflow-hidden"
                      onClick={() => onOpenPhoto(complaint.originalPhotoUrl, `Original Evidence - ${complaint.id}`, complaint.location.address)}
                    >
                      <img
                        src={complaint.originalPhotoUrl}
                        alt="Original complaint issue"
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        loading="lazy"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/thumb_pothole_1.jpg';
                        }}
                      />
                    </div>
                  </div>

                  {/* Resolution Photo if available */}
                  {complaint.verification?.afterRepairPhotoUrl ? (
                    <div className="border border-[#B9D8E1] rounded-2xl overflow-hidden bg-white/80 shadow-2xs group">
                      <div className="px-3.5 py-2 bg-white/90 border-b border-[#B9D8E1] text-xs font-bold text-[#0A2540] flex items-center justify-between">
                        <span>Department After-Repair Proof</span>
                        <button
                          onClick={() =>
                            onOpenPhoto(
                              complaint.verification!.afterRepairPhotoUrl,
                              `Resolution Evidence - ${complaint.id}`,
                              complaint.verification!.repairNotes
                            )
                          }
                          className="text-[#0284C7] hover:text-[#0369A1] text-[11px] font-semibold inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Eye className="w-3 h-3" /> Full View
                        </button>
                      </div>
                      <div
                        className="relative aspect-video bg-slate-100 cursor-pointer overflow-hidden"
                        onClick={() => onOpenPhoto(complaint.verification!.afterRepairPhotoUrl, `Resolution Evidence - ${complaint.id}`, complaint.verification!.repairNotes)}
                      >
                        <img
                          src={complaint.verification.afterRepairPhotoUrl}
                          alt="After repair evidence"
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                          loading="lazy"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/thumb_pothole_2.jpg';
                          }}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="border border-dashed border-[#B9D8E1] rounded-2xl p-6 flex flex-col items-center justify-center text-center text-[#486581] bg-white/50 backdrop-blur-sm">
                      <Clock className="w-8 h-8 text-[#0284C7] mb-2 opacity-70" />
                      <p className="text-xs font-bold text-[#0A2540]">No repair proof uploaded yet</p>
                      <p className="text-[11px] text-[#486581] mt-0.5">
                        Responsible department submits post-repair evidence upon field completion.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Location & Ward Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl border border-white/90 bg-white/80 shadow-2xs space-y-2 backdrop-blur-sm">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[#0A2540]">
                    <MapPin className="w-3.5 h-3.5 text-[#0284C7]" />
                    <span>Location & Coordinates</span>
                  </div>
                  <div className="text-xs text-[#1e3a5f] space-y-1">
                    <p><span className="text-[#64748B] font-semibold">Zone:</span> {complaint.location.zone}</p>
                    <p><span className="text-[#64748B] font-semibold">Ward:</span> {complaint.location.ward}</p>
                    {complaint.location.landmark && (
                      <p><span className="text-[#64748B] font-semibold">Landmark:</span> {complaint.location.landmark}</p>
                    )}
                    <p className="text-[11px] text-[#0284C7] font-mono font-medium">
                      GPS: {complaint.location.coordinates.lat.toFixed(4)}°N, {complaint.location.coordinates.lng.toFixed(4)}°E
                    </p>
                  </div>
                </div>

                {/* Reporter Information (Privacy Enforced) */}
                <div className="p-4 rounded-2xl border border-white/90 bg-white/80 shadow-2xs space-y-2 backdrop-blur-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-[#0A2540]">
                      <Shield className="w-3.5 h-3.5 text-[#0284C7]" />
                      <span>Reporter Verification</span>
                    </div>
                    <ReporterBadge reporterType={complaint.reporterType} />
                  </div>
                  <div className="text-xs text-[#1e3a5f] space-y-1">
                    {complaint.reporterType === 'Registered Citizen' ? (
                      <>
                        <p><span className="text-[#64748B] font-semibold">Citizen:</span> {complaint.reporterInfo?.name}</p>
                        <p className="font-mono"><span className="text-[#64748B] font-semibold">Contact:</span> {complaint.reporterInfo?.maskedContact}</p>
                        <p className="text-[11px] text-emerald-700 font-medium">
                          ✓ Eligible for approved resolution photo notifications
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="text-[#64748B] font-mono">Unauthenticated Anonymous Submission</p>
                        <p className="text-[11px] text-rose-700 bg-rose-50 p-2 rounded-xl border border-rose-200">
                          Policy: Resolution photos are NEVER dispatched to anonymous reporters.
                        </p>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Department & Assignment */}
              <div className="p-4 rounded-2xl border border-white/90 bg-white/80 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 backdrop-blur-sm">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[#0A2540]">
                    <Building2 className="w-3.5 h-3.5 text-[#0284C7]" />
                    <span>Assigned Department</span>
                  </div>
                  <p className="text-sm font-bold text-[#0A2540]">{complaint.assignedDepartment}</p>
                  <p className="text-xs text-[#64748B]">
                    Assigned: {new Date(complaint.assignmentTimestamp).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setNewDept(complaint.assignedDepartment);
                    setReassignModalOpen(true);
                  }}
                  className="px-3.5 py-1.5 text-xs font-bold text-[#0A2540] bg-white hover:bg-slate-50 border border-slate-200 shadow-2xs rounded-xl transition cursor-pointer"
                >
                  Reassign Department
                </button>
              </div>

              {/* Priority & SLA */}
              <div className="p-4 rounded-2xl border border-white/90 bg-white/80 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 backdrop-blur-sm">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[#0A2540]">
                    <AlertTriangle className="w-3.5 h-3.5 text-[#0284C7]" />
                    <span>Priority & Triage Scoring</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <PriorityBadge priority={complaint.priority} />
                    {complaint.priorityScore && (
                      <span className="text-xs text-[#1e3a5f]">
                        Risk Score: <strong className="text-[#0284C7] font-bold">{complaint.priorityScore}/100</strong>
                      </span>
                    )}
                  </div>
                  {complaint.priorityReason && (
                    <p className="text-xs text-[#64748B] italic">"{complaint.priorityReason}"</p>
                  )}
                </div>
                <button
                  onClick={() => {
                    setNewPriority(complaint.priority);
                    setPriorityModalOpen(true);
                  }}
                  className="px-3.5 py-1.5 text-xs font-bold text-[#0A2540] bg-white hover:bg-slate-50 border border-slate-200 shadow-2xs rounded-xl transition cursor-pointer"
                >
                  Override Priority
                </button>
              </div>

              {/* Status & Lifecycle Actions */}
              <div className="p-4 rounded-2xl border border-white/90 bg-white/80 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 backdrop-blur-sm">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[#0A2540]">
                    <Clock className="w-3.5 h-3.5 text-[#0284C7]" />
                    <span>Current Lifecycle Status</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={complaint.currentStatus} />
                  </div>
                </div>
                {onUpdateStatus && (complaint.currentStatus === 'Received' || complaint.currentStatus === 'Prioritized') && (
                  <button
                    onClick={() => onUpdateStatus(complaint.id, 'In Progress', 'Field crew mobilized and dispatched to location')}
                    className="px-3.5 py-1.5 text-xs font-bold text-white bg-[#0284C7] hover:bg-[#0369A1] rounded-xl transition cursor-pointer shadow-sm"
                  >
                    Mark In Progress
                  </button>
                )}
                {onUpdateStatus && complaint.currentStatus === 'In Progress' && (
                  <button
                    onClick={() => onUpdateStatus(complaint.id, 'Awaiting Admin Verification', 'Field repair completed; awaiting administrative verification')}
                    className="px-3.5 py-1.5 text-xs font-bold text-[#0A2540] bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition cursor-pointer shadow-sm"
                  >
                    Send for Verification
                  </button>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: LIFECYCLE AUDIT HISTORY */}
          {activeTab === 'timeline' && (
            <div className="space-y-4">
              <div className="text-xs text-[#486581] font-semibold mb-2">
                Immutable audit trail of all status transitions, triage events, and administrative decisions.
              </div>
              <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#B9D8E1]">
                {complaint.history.map((log) => (
                  <div key={log.id} className="relative group">
                    <div className="absolute -left-6 top-1 w-4 h-4 rounded-full bg-white border-2 border-[#0284C7] shadow-sm transition" />
                    <div className="bg-white/85 border border-white/90 rounded-2xl p-3.5 text-xs space-y-1 shadow-2xs backdrop-blur-sm">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[#0A2540]">{log.action}</span>
                        <span className="text-[#64748B] text-[11px]">
                          {new Date(log.timestamp).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
                        </span>
                      </div>
                      <div className="text-[#1e3a5f] text-[11px]">
                        <span className="text-[#64748B] font-semibold">Actor:</span>{' '}
                        <span className="font-bold text-[#0284C7]">{log.actor}</span>
                      </div>
                      {(log.previousValue || log.newValue) && (
                        <div className="text-[#1e3a5f] flex items-center gap-1.5 text-[11px] pt-1">
                          {log.previousValue && (
                            <span className="bg-slate-100 text-[#486581] px-2 py-0.5 rounded-full font-medium">
                              {log.previousValue}
                            </span>
                          )}
                          {log.previousValue && <span>→</span>}
                          {log.newValue && (
                            <span className="bg-[#0284C7]/10 text-[#0284C7] px-2 py-0.5 rounded-full border border-[#0284C7]/30 font-bold">
                              {log.newValue}
                            </span>
                          )}
                        </div>
                      )}
                      {log.reason && (
                        <p className="text-[#1e3a5f] bg-[#F0F8FA] p-2.5 rounded-xl border border-[#D0E7F9] mt-1 italic">
                          "{log.reason}"
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: SIDE-BY-SIDE EVIDENCE */}
          {activeTab === 'evidence' && complaint.verification && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Original Photo */}
                <div className="border border-white/90 rounded-2xl overflow-hidden bg-white/85 shadow-2xs">
                  <div className="px-4 py-2.5 bg-white/90 border-b border-white/80 text-xs font-bold text-[#0A2540]">
                    Before Repair (Citizen Report)
                  </div>
                  <div className="aspect-video bg-slate-100">
                    <img
                      src={complaint.originalPhotoUrl}
                      alt="Before repair"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-3 text-[11px] text-[#486581]">
                    Captured: {new Date(complaint.submissionTimestamp).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
                  </div>
                </div>

                {/* After Repair Photo */}
                <div className="border border-white/90 rounded-2xl overflow-hidden bg-white/85 shadow-2xs">
                  <div className="px-4 py-2.5 bg-white/90 border-b border-white/80 text-xs font-bold text-[#0A2540]">
                    After Repair (Department Proof)
                  </div>
                  <div className="aspect-video bg-slate-100">
                    <img
                      src={complaint.verification.afterRepairPhotoUrl}
                      alt="After repair"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-3 text-xs text-[#1e3a5f] space-y-1">
                    <p className="font-semibold text-[#0A2540]">Department Remarks:</p>
                    <p className="italic text-[#1e3a5f] bg-[#F0F8FA] p-2 rounded-xl border border-[#D0E7F9]">
                      "{complaint.verification.repairNotes}"
                    </p>
                    <p className="text-[10px] text-[#64748B] pt-1">
                      Submitted: {new Date(complaint.verification.submittedAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} by {complaint.verification.submittedByDepartment}
                    </p>
                  </div>
                </div>
              </div>

              {/* Verification Decision Status */}
              <div className="p-4 rounded-2xl border border-white/90 bg-white/85 shadow-2xs text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#0A2540]">Verification Status:</span>
                  {complaint.verification.decision ? (
                    <span
                      className={`px-2.5 py-0.5 rounded-full font-bold ${
                        complaint.verification.decision === 'Approved'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : 'bg-rose-100 text-rose-800 border border-rose-300'
                      }`}
                    >
                      {complaint.verification.decision}
                    </span>
                  ) : (
                    <span className="bg-amber-100 text-amber-800 border border-amber-300 px-2.5 py-0.5 rounded-full font-bold">
                      Awaiting Admin Decision
                    </span>
                  )}
                </div>
                {complaint.verification.verifiedBy && (
                  <p className="text-[#64748B]">
                    Audited By: <span className="text-[#0A2540] font-bold">{complaint.verification.verifiedBy}</span> at{' '}
                    {new Date(complaint.verification.verifiedAt!).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
                  </p>
                )}
                {complaint.verification.rejectionReason && (
                  <p className="text-rose-700 bg-rose-50 p-2.5 rounded-xl border border-rose-200">
                    Rejection Reason: {complaint.verification.rejectionReason}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer / Verification Action Bar if Awaiting Verification */}
        {complaint.currentStatus === 'Awaiting Admin Verification' && (
          <div className="px-6 py-4 bg-white/50 border-t border-white/70 flex flex-wrap items-center justify-between gap-3 backdrop-blur-md">
            <div className="text-xs text-[#0A2540]">
              <span className="font-bold">Admin Audit Required:</span> Inspect before & after repair photos.
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setRejectModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 rounded-xl hover:bg-rose-100 transition cursor-pointer shadow-2xs"
              >
                <XCircle className="w-3.5 h-3.5" />
                Reject Evidence
              </button>
              <button
                onClick={() => onVerify(complaint.id, 'approve')}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-[#0284C7] hover:bg-[#0369A1] rounded-xl transition shadow-md cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Approve Resolution
              </button>
            </div>
          </div>
        )}

        {/* OVERRIDE PRIORITY SUB-MODAL */}
        {priorityModalOpen && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-[#0a1c2e]/60 backdrop-blur-sm">
            <div style={subModalGlassStyle} className="max-w-md w-full p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-white/60 pb-3">
                <h3 className="font-bold text-[#0A2540] text-base">Override Complaint Priority</h3>
                <button onClick={() => setPriorityModalOpen(false)}>
                  <X className="w-4 h-4 text-[#486581] hover:text-[#0A2540]" />
                </button>
              </div>
              <form onSubmit={handlePrioritySubmit} className="space-y-4 text-xs">
                <div>
                  <label className="block text-[#0A2540] font-semibold mb-1">New Priority</label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as ComplaintPriority)}
                    className="w-full px-3 py-2 rounded-xl border border-white/90 bg-white/90 text-[#0A2540] font-semibold focus:border-[#0284C7] focus:outline-hidden"
                  >
                    <option value="Critical">Critical</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[#0A2540] font-semibold mb-1">
                    Documented Administrative Reason (Mandatory)
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={priorityReason}
                    onChange={(e) => setPriorityReason(e.target.value)}
                    placeholder="e.g., Hospital emergency entrance corridor, elevated to Critical as per District Collector inspection."
                    className="w-full px-3 py-2 rounded-xl border border-white/90 bg-white/90 text-[#0A2540] placeholder-slate-400 focus:border-[#0284C7] focus:outline-hidden"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setPriorityModalOpen(false)}
                    className="px-3 py-1.5 rounded-xl border border-white/90 bg-white/60 text-[#486581] hover:bg-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || !priorityReason.trim()}
                    className="px-4 py-2 rounded-xl bg-[#0284C7] text-white font-bold hover:bg-[#0369A1] disabled:opacity-50 shadow-sm"
                  >
                    {isSubmitting ? 'Recording...' : 'Save Override'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* REASSIGN DEPARTMENT SUB-MODAL */}
        {reassignModalOpen && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-[#0a1c2e]/60 backdrop-blur-sm">
            <div style={subModalGlassStyle} className="max-w-md w-full p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-white/60 pb-3">
                <h3 className="font-bold text-[#0A2540] text-base">Reassign Department</h3>
                <button onClick={() => setReassignModalOpen(false)}>
                  <X className="w-4 h-4 text-[#486581] hover:text-[#0A2540]" />
                </button>
              </div>
              <form onSubmit={handleReassignSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="block text-[#0A2540] font-semibold mb-1">Target Department</label>
                  <select
                    value={newDept}
                    onChange={(e) => setNewDept(e.target.value as DepartmentName)}
                    className="w-full px-3 py-2 rounded-xl border border-white/90 bg-white/90 text-[#0A2540] font-semibold focus:border-[#0284C7] focus:outline-hidden"
                  >
                    <option value="Roads and Infrastructure Department">Roads and Infrastructure Department</option>
                    <option value="Solid Waste Management Department">Solid Waste Management Department</option>
                    <option value="Water Supply and Sewerage Department">Water Supply and Sewerage Department</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[#0A2540] font-semibold mb-1">
                    Reassignment Justification (Mandatory)
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={reassignReason}
                    onChange={(e) => setReassignReason(e.target.value)}
                    placeholder="e.g., Road subsidence was caused by underlying water pipe burst; transferring primary repair to CMWSSB."
                    className="w-full px-3 py-2 rounded-xl border border-white/90 bg-white/90 text-[#0A2540] placeholder-slate-400 focus:border-[#0284C7] focus:outline-hidden"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setReassignModalOpen(false)}
                    className="px-3 py-1.5 rounded-xl border border-white/90 bg-white/60 text-[#486581] hover:bg-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || !reassignReason.trim()}
                    className="px-4 py-2 rounded-xl bg-[#0284C7] text-white font-bold hover:bg-[#0369A1] disabled:opacity-50 shadow-sm"
                  >
                    {isSubmitting ? 'Reassigning...' : 'Confirm Reassignment'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* REJECT EVIDENCE SUB-MODAL */}
        {rejectModalOpen && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-[#0a1c2e]/60 backdrop-blur-sm">
            <div style={subModalGlassStyle} className="max-w-md w-full p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-white/60 pb-3">
                <h3 className="font-bold text-rose-800 text-base">Reject Repair Evidence</h3>
                <button onClick={() => setRejectModalOpen(false)}>
                  <X className="w-4 h-4 text-[#486581] hover:text-[#0A2540]" />
                </button>
              </div>
              <p className="text-xs text-[#1e3a5f]">
                Rejecting returns complaint to <span className="font-bold text-amber-800 font-mono">In Progress</span>.
              </p>
              <form onSubmit={handleRejectSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="block text-[#0A2540] font-semibold mb-1">
                    Rejection Reason (Required)
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="e.g., Tarmac compaction uneven; loose gravel remains across pedestrian crossing. Re-roller required."
                    className="w-full px-3 py-2 rounded-xl border border-white/90 bg-white/90 text-[#0A2540] placeholder-slate-400 focus:border-rose-400 focus:outline-hidden"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setRejectModalOpen(false)}
                    className="px-3 py-1.5 rounded-xl border border-white/90 bg-white/60 text-[#486581] hover:bg-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || !rejectionReason.trim()}
                    className="px-4 py-2 rounded-xl bg-rose-600 text-white font-bold hover:bg-rose-500 disabled:opacity-50 shadow-sm"
                  >
                    {isSubmitting ? 'Submitting...' : 'Reject Evidence'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
