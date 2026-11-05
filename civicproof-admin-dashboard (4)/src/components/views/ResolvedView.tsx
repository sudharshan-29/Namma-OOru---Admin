import React from 'react';
import {
  CheckCircle2,
  MapPin,
  Calendar,
  Building2,
  ShieldCheck,
  Eye,
  History,
  FileCheck2,
  ArrowRight,
  Clock,
  Sparkles,
} from 'lucide-react';
import type { Complaint } from '../../types/civic';
import { CategoryBadge, PriorityBadge, StatusBadge, ReporterBadge } from '../common/Badge';

interface ResolvedViewProps {
  complaints: Complaint[];
  isLoading: boolean;
  onSelectComplaint: (complaint: Complaint) => void;
  onOpenPhoto: (url: string, title: string, subtitle?: string) => void;
  onNavigateToAll: () => void;
}

export const ResolvedView: React.FC<ResolvedViewProps> = ({
  complaints,
  isLoading,
  onSelectComplaint,
  onOpenPhoto,
  onNavigateToAll,
}) => {
  // STRICT RULE: Only complaints whose resolution evidence has been approved by an authorized admin
  const resolvedList = complaints.filter(
    (c) => c.currentStatus === 'Resolved' && c.verification?.decision === 'Approved'
  );

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-white tracking-tight">Resolved Civic Complaints</h1>
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 shadow-[0_0_12px_rgba(16,185,129,0.3)] font-mono">
              {resolvedList.length} Verified Resolved
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Official archive of complaints where municipal field repairs have been visually audited and approved by the domain administrator.
          </p>
        </div>

        <button
          onClick={onNavigateToAll}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-200 bg-slate-900 border border-slate-700 rounded-xl hover:bg-slate-800 transition shadow-md cursor-pointer"
        >
          <span>View All Complaints</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Audit Standard Banner */}
      <div className="glass-panel p-4 rounded-3xl border-emerald-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-emerald-200">
        <div className="flex items-center gap-2.5">
          <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>
            <strong>Municipal Quality Assurance Standard:</strong> A photo upload alone never marks a complaint as resolved. Every record below features side-by-side verification reviewed by Chennai Municipal Admin.
          </span>
        </div>
        <span className="text-emerald-300 font-mono font-bold bg-[#091120] px-3 py-1 rounded-full border border-emerald-500/30 text-[11px] shrink-0">
          100% Admin Audited
        </span>
      </div>

      {/* Resolved Items List */}
      {isLoading ? (
        <div className="glass-panel p-14 text-center text-slate-400 rounded-3xl">
          <Clock className="w-8 h-8 text-emerald-400 animate-spin mx-auto mb-2" />
          Loading verified resolved records...
        </div>
      ) : resolvedList.length === 0 ? (
        <div className="glass-panel p-14 text-center text-slate-400 rounded-3xl space-y-2">
          <FileCheck2 className="w-10 h-10 text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-white">No Resolved Records in Feed</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Once departments submit after-repair photos and the admin approves them in Resolution Verification, they appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {resolvedList.map((c) => {
            const v = c.verification!;

            return (
              <div
                key={c.id}
                className="glass-panel rounded-3xl p-5 space-y-4 glass-card-hover border-slate-800 hover:border-emerald-500/40"
              >
                {/* Header bar */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-cyan-300 text-xs bg-cyan-950/70 px-2.5 py-0.5 rounded-full border border-cyan-500/30">
                      #{c.id.match(/(\d{4})$/)?.[1] || c.id}
                    </span>
                    <CategoryBadge category={c.category} />
                    <PriorityBadge priority={c.priority} />
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 shadow-[0_0_12px_rgba(16,185,129,0.3)]">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      Resolution Verified & Approved
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <ReporterBadge reporterType={c.reporterType} />
                    <button
                      onClick={() => onSelectComplaint(c)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-slate-200 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-xl transition cursor-pointer"
                    >
                      <History className="w-3.5 h-3.5" />
                      Full Audit Log
                    </button>
                  </div>
                </div>

                {/* Location & Summary */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-1.5 text-white font-bold text-sm">
                      <MapPin className="w-4 h-4 text-cyan-400 shrink-0" />
                      <span>{c.location.address}</span>
                    </div>
                    <p className="text-xs text-slate-400 pl-5 font-mono">
                      {c.location.zone} · {c.location.ward}
                      {c.location.landmark && ` · Near ${c.location.landmark}`}
                    </p>
                  </div>

                  <div className="text-xs text-slate-300 sm:text-right font-mono">
                    <div>
                      Resolved On:{' '}
                      <strong className="text-emerald-400">
                        {v.verifiedAt
                          ? new Date(v.verifiedAt).toLocaleString('en-IN', {
                              timeZone: 'Asia/Kolkata',
                              dateStyle: 'medium',
                              timeStyle: 'short',
                            })
                          : 'Recorded'}
                      </strong>
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Approved By: {v.verifiedBy || 'Authorized Admin'}
                    </div>
                  </div>
                </div>

                {/* Side-by-Side Photos (Original vs Approved Resolution) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                  {/* Original Complaint Photo */}
                  <div className="border border-slate-800 rounded-2xl overflow-hidden bg-[#091120]/80">
                    <div className="px-4 py-2.5 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between text-xs font-bold text-slate-200">
                      <span>1. Original Citizen Issue (Before Repair)</span>
                      <button
                        onClick={() =>
                          onOpenPhoto(
                            c.originalPhotoUrl,
                            `Original Damage - ${c.id}`,
                            c.location.address
                          )
                        }
                        className="text-cyan-300 hover:text-white text-[11px] font-semibold inline-flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" /> Zoom
                      </button>
                    </div>
                    <div
                      className="aspect-video bg-slate-950 cursor-pointer overflow-hidden group"
                      onClick={() =>
                        onOpenPhoto(
                          c.originalPhotoUrl,
                          `Original Damage - ${c.id}`,
                          c.location.address
                        )
                      }
                    >
                      <img
                        src={c.originalPhotoUrl}
                        alt="Original complaint issue"
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        loading="lazy"
                      />
                    </div>
                    <div className="p-3 text-[11px] text-slate-400 font-mono">
                      Reported: {new Date(c.submissionTimestamp).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
                    </div>
                  </div>

                  {/* Approved Resolution Photo */}
                  <div className="border border-emerald-500/30 rounded-2xl overflow-hidden bg-emerald-950/20">
                    <div className="px-4 py-2.5 bg-emerald-950/60 border-b border-emerald-500/30 flex items-center justify-between text-xs font-bold text-emerald-200">
                      <span className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        2. Approved Resolution Proof (After Repair)
                      </span>
                      <button
                        onClick={() =>
                          onOpenPhoto(
                            v.afterRepairPhotoUrl,
                            `Approved Resolution - ${c.id}`,
                            v.repairNotes
                          )
                        }
                        className="text-emerald-300 hover:text-white text-[11px] font-semibold inline-flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" /> Zoom
                      </button>
                    </div>
                    <div
                      className="aspect-video bg-slate-950 cursor-pointer overflow-hidden group"
                      onClick={() =>
                        onOpenPhoto(
                          v.afterRepairPhotoUrl,
                          `Approved Resolution - ${c.id}`,
                          v.repairNotes
                        )
                      }
                    >
                      <img
                        src={v.afterRepairPhotoUrl}
                        alt="Approved after repair"
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        loading="lazy"
                      />
                    </div>
                    <div className="p-3 text-xs text-slate-200 space-y-1">
                      <p className="font-semibold text-white">Repair Notes:</p>
                      <p className="italic text-slate-300 bg-[#060c18]/80 p-2.5 rounded-xl border border-slate-800">
                        "{v.repairNotes}"
                      </p>
                      <div className="text-[11px] text-slate-400 pt-1 flex items-center justify-between font-mono">
                        <span>Submitted by {v.submittedByDepartment}</span>
                        <span className="text-emerald-400 font-bold">STATE: RESOLVED</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
