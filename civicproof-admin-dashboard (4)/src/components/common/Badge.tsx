import React from 'react';
import type { ComplaintCategory, ComplaintPriority, ComplaintStatus, ReporterType } from '../../types/civic';

export const CategoryBadge: React.FC<{ category: ComplaintCategory; className?: string }> = ({ category, className = '' }) => {
  const styles: Record<ComplaintCategory, string> = {
    'Road Damage': 'bg-amber-950/50 text-amber-300 border-amber-500/40 shadow-[0_0_10px_rgba(245,158,11,0.15)]',
    'Improper Waste Disposal': 'bg-emerald-950/50 text-emerald-300 border-emerald-500/40 shadow-[0_0_10px_rgba(16,185,129,0.15)]',
    'Water Leakage': 'bg-cyan-950/50 text-cyan-300 border-cyan-500/40 shadow-[0_0_10px_rgba(6,182,212,0.15)]',
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide border backdrop-blur-md ${styles[category] || 'bg-slate-900/60 text-slate-300 border-slate-700'} ${className}`}>
      {category}
    </span>
  );
};

export const PriorityBadge: React.FC<{ priority: ComplaintPriority; className?: string }> = ({ priority, className = '' }) => {
  const styles: Record<ComplaintPriority, { bg: string; dot: string; glow: string }> = {
    Critical: {
      bg: 'bg-rose-950/60 text-rose-300 border-rose-500/50',
      dot: 'bg-rose-500 shadow-[0_0_8px_#f43f5e]',
      glow: 'shadow-[0_0_12px_rgba(244,63,94,0.25)]',
    },
    High: {
      bg: 'bg-orange-950/60 text-orange-300 border-orange-500/50',
      dot: 'bg-orange-500 shadow-[0_0_8px_#f97316]',
      glow: 'shadow-[0_0_12px_rgba(249,115,22,0.25)]',
    },
    Medium: {
      bg: 'bg-sky-950/60 text-sky-300 border-sky-500/50',
      dot: 'bg-sky-400 shadow-[0_0_8px_#38bdf8]',
      glow: 'shadow-[0_0_12px_rgba(56,189,248,0.25)]',
    },
    Low: {
      bg: 'bg-slate-900/60 text-slate-400 border-slate-700',
      dot: 'bg-slate-400',
      glow: '',
    },
  };

  const style = styles[priority] || styles.Medium;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border backdrop-blur-md ${style.bg} ${style.glow} ${className}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
      {priority}
    </span>
  );
};

export const StatusBadge: React.FC<{ status: ComplaintStatus; className?: string }> = ({ status, className = '' }) => {
  const styles: Record<ComplaintStatus, { bg: string; border: string; text: string; glow: string }> = {
    Received: {
      bg: 'bg-rose-950/60',
      border: 'border-rose-500/40',
      text: 'text-rose-300',
      glow: 'shadow-[0_0_10px_rgba(244,63,94,0.2)]',
    },
    Prioritized: {
      bg: 'bg-indigo-950/60',
      border: 'border-indigo-500/40',
      text: 'text-indigo-300',
      glow: 'shadow-[0_0_10px_rgba(99,102,241,0.2)]',
    },
    Assigned: {
      bg: 'bg-amber-950/60',
      border: 'border-amber-500/40',
      text: 'text-amber-300',
      glow: 'shadow-[0_0_10px_rgba(245,158,11,0.2)]',
    },
    'In Progress': {
      bg: 'bg-indigo-950/70',
      border: 'border-indigo-400/50',
      text: 'text-indigo-200',
      glow: 'shadow-[0_0_12px_rgba(129,140,248,0.25)]',
    },
    'Evidence Submitted': {
      bg: 'bg-purple-950/60',
      border: 'border-purple-500/40',
      text: 'text-purple-300',
      glow: 'shadow-[0_0_10px_rgba(168,85,247,0.2)]',
    },
    'Awaiting Admin Verification': {
      bg: 'bg-cyan-950/80',
      border: 'border-cyan-400/60',
      text: 'text-cyan-200 font-bold',
      glow: 'shadow-[0_0_14px_rgba(6,182,212,0.35)]',
    },
    Resolved: {
      bg: 'bg-emerald-950/80',
      border: 'border-emerald-400/60',
      text: 'text-emerald-200 font-bold',
      glow: 'shadow-[0_0_14px_rgba(16,185,129,0.35)]',
    },
  };

  const s = styles[status] || styles.Received;

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border backdrop-blur-md ${s.bg} ${s.border} ${s.text} ${s.glow} ${className}`}>
      {status}
    </span>
  );
};

export const ReporterBadge: React.FC<{ reporterType: ReporterType; className?: string }> = ({ reporterType, className = '' }) => {
  const isRegistered = reporterType === 'Registered Citizen';
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border backdrop-blur-md ${
        isRegistered
          ? 'bg-cyan-950/50 text-cyan-300 border-cyan-500/30 shadow-[0_0_8px_rgba(6,182,212,0.15)]'
          : 'bg-slate-900/60 text-slate-400 border-slate-700'
      } ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${isRegistered ? 'bg-cyan-400 shadow-[0_0_6px_#22d3ee]' : 'bg-slate-500'}`} />
      {reporterType}
    </span>
  );
};
