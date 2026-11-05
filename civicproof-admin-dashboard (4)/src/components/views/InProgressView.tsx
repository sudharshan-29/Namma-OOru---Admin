import React from 'react';
import {
  Clock,
  MapPin,
  Building2,
  Calendar,
  AlertTriangle,
  History,
  Eye,
  CheckCircle2,
  ArrowRight,
  TrendingUp,
  Activity,
} from 'lucide-react';
import type { Complaint } from '../../types/civic';
import { CategoryBadge, PriorityBadge, StatusBadge, ReporterBadge } from '../common/Badge';

interface InProgressViewProps {
  complaints: Complaint[];
  isLoading: boolean;
  onSelectComplaint: (complaint: Complaint) => void;
  onOpenPhoto: (url: string, title: string, subtitle?: string) => void;
  onNavigateToVerification: () => void;
}

export const InProgressView: React.FC<InProgressViewProps> = ({
  complaints,
  isLoading,
  onSelectComplaint,
  onOpenPhoto,
  onNavigateToVerification,
}) => {
  const inProgressList = complaints.filter(
    (c) => c.currentStatus === 'In Progress'
  );

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-white tracking-tight">Active Work In Progress</h1>
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-950/80 text-amber-300 border border-amber-500/40 shadow-[0_0_12px_rgba(245,158,11,0.25)] font-mono">
              {inProgressList.length} Active Field Works
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Complaints where municipal road repair trucks, conservancy crews, or water supply engineers are actively engaged in remediation.
          </p>
        </div>

        <button
          onClick={onNavigateToVerification}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-cyan-300 bg-cyan-950/60 border border-cyan-500/30 rounded-xl hover:bg-cyan-900/80 transition shadow-[0_0_12px_rgba(6,182,212,0.25)] cursor-pointer"
        >
          <span>View Submitted Evidence</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* SLA Banner in Cyber Theme */}
      <div className="glass-panel p-4 rounded-3xl border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-amber-200">
        <div className="flex items-center gap-2.5">
          <Clock className="w-4 h-4 text-amber-400 shrink-0" />
          <span>
            <strong>Field SLA Monitoring Active:</strong> Departments must finish field repairs and upload tamper-proof photographic proof within designated municipal response windows.
          </span>
        </div>
        <span className="text-amber-300 font-mono font-bold bg-[#091120] px-3 py-1 rounded-full border border-amber-500/30 text-[11px] shrink-0">
          Target SLA: 12h - 48h
        </span>
      </div>

      {/* In Progress Complaints Cards */}
      {isLoading ? (
        <div className="glass-panel p-14 text-center text-slate-400 rounded-3xl">
          <Clock className="w-8 h-8 text-amber-400 animate-spin mx-auto mb-2" />
          Querying field crew telemetries...
        </div>
      ) : inProgressList.length === 0 ? (
        <div className="glass-panel p-14 text-center text-slate-400 rounded-3xl space-y-2">
          <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
          <h3 className="text-base font-bold text-white">No Active Field Operations</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            All assigned complaints have either completed remediation or are awaiting triage.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {inProgressList.map((c) => {
            const latestHistory = c.history[c.history.length - 1];

            return (
              <div
                key={c.id}
                className="glass-panel rounded-3xl p-5 space-y-4 glass-card-hover border-slate-800 hover:border-amber-400/40"
              >
                {/* Top Row: IDs, Priority, Category, Status */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-cyan-300 text-xs bg-cyan-950/70 px-2 py-0.5 rounded-full border border-cyan-500/30">
                      #{c.id.match(/(\d{4})$/)?.[1] || c.id}
                    </span>
                    <CategoryBadge category={c.category} />
                    <PriorityBadge priority={c.priority} />
                    <StatusBadge status={c.currentStatus} />
                    {c.isOverdue && (
                      <span className="text-[10px] font-bold text-rose-300 bg-rose-950/70 px-2 py-0.5 rounded-full border border-rose-500/40 flex items-center gap-1 font-mono">
                        <AlertTriangle className="w-3 h-3 text-rose-400" />
                        SLA Overdue
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <ReporterBadge reporterType={c.reporterType} />
                    <button
                      onClick={() => onSelectComplaint(c)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-slate-200 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-xl transition cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Inspect Record
                    </button>
                  </div>
                </div>

                {/* Content: Photos & Details */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {/* Photo Thumbnail */}
                  <div className="md:col-span-1">
                    <div
                      onClick={() => onOpenPhoto(c.originalPhotoUrl, `Complaint ${c.id}`, c.location.address)}
                      className="aspect-video sm:aspect-4/3 rounded-2xl overflow-hidden bg-slate-950 border border-slate-700/80 cursor-pointer relative group"
                    >
                      <img
                        src={c.originalPhotoUrl}
                        alt="Initial damage"
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-slate-950/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-cyan-300 text-xs font-bold transition">
                        <Eye className="w-4 h-4 mr-1" /> Initial Photo
                      </div>
                    </div>
                  </div>

                  {/* Main Details */}
                  <div className="md:col-span-3 space-y-3">
                    <div>
                      <div className="flex items-start gap-1 text-white font-bold text-sm">
                        <MapPin className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                        <span>{c.location.address}</span>
                      </div>
                      <p className="text-xs text-slate-400 pl-5 font-mono">
                        {c.location.zone} · {c.location.ward}
                        {c.location.landmark && ` · Near ${c.location.landmark}`}
                      </p>
                    </div>

                    <p className="text-xs text-slate-300 bg-[#091120]/80 p-3 rounded-2xl border border-slate-800 leading-relaxed">
                      {c.description}
                    </p>

                    {/* Department & Progress History */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
                      <div className="p-3 rounded-2xl bg-cyan-950/30 border border-cyan-500/20 space-y-1">
                        <div className="flex items-center gap-1.5 text-slate-400 font-mono text-[11px]">
                          <Building2 className="w-3.5 h-3.5 text-cyan-400" />
                          <span>Assigned Department</span>
                        </div>
                        <p className="font-semibold text-white">{c.assignedDepartment}</p>
                        <p className="text-[10px] text-slate-400 font-mono">
                          Dispatched: {new Date(c.assignmentTimestamp).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                        </p>
                      </div>

                      <div className="p-3 rounded-2xl bg-[#091120]/80 border border-slate-800 space-y-1">
                        <div className="flex items-center gap-1.5 text-slate-400 font-mono text-[11px]">
                          <History className="w-3.5 h-3.5 text-amber-400" />
                          <span>Latest Field Movement</span>
                        </div>
                        <p className="font-medium text-amber-300">
                          {latestHistory?.action || 'In Progress'}
                        </p>
                        <p className="text-[11px] text-slate-400 truncate">
                          {latestHistory?.actor} — {latestHistory?.reason || 'Work actively ongoing'}
                        </p>
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
