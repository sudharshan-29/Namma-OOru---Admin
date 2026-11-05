import React, { useState } from 'react';
import {
  Bell,
  ShieldCheck,
  ShieldAlert,
  Clock,
  Key,
  ExternalLink,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Eye,
  FileCheck,
  Sparkles,
  Lock,
} from 'lucide-react';
import type { NotificationRecord } from '../../types/civic';

interface NotificationsViewProps {
  notifications: NotificationRecord[];
  isLoading: boolean;
  onRefresh: () => void;
}

export const NotificationsView: React.FC<NotificationsViewProps> = ({
  notifications,
  isLoading,
  onRefresh,
}) => {
  const [selectedNotif, setSelectedNotif] = useState<NotificationRecord | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'delivered' | 'blocked'>('all');

  const filteredNotifications = notifications.filter((n) => {
    if (filterType === 'delivered') return n.deliveryStatus === 'Delivered';
    if (filterType === 'blocked') return n.deliveryStatus === 'Blocked (Anonymous Safety Policy)';
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-[#0B1B3D] tracking-tight">Citizen Notification Dispatch</h1>
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-sky-100 text-sky-800 border border-sky-200 font-mono">
              Privacy & Media Registry
            </span>
          </div>
          <p className="text-sm text-slate-600 font-medium mt-1">
            Audit log of resolution media dispatched to citizen complainants with cryptographic signed URL access.
          </p>
        </div>

        <button
          onClick={onRefresh}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-cyan-300 bg-slate-900 border border-cyan-500/30 rounded-xl hover:bg-slate-800 transition shadow-md cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-cyan-400' : ''}`} />
          Refresh Log
        </button>
      </div>

      {/* STRICT PRIVACY POLICY & SIMULATION BANNER */}
      <div className="glass-panel p-5 rounded-3xl space-y-3.5 border-cyan-500/30">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-cyan-950 border border-cyan-500/40 text-cyan-400 flex items-center justify-center shadow-[0_0_12px_rgba(6,182,212,0.3)]">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">
                Namma Ooru Citizen Media Delivery & Privacy Protocol
              </h2>
              <p className="text-xs text-slate-400 font-mono">Enforced by Chennai Municipal Corporation Data Governance</p>
            </div>
          </div>

          <div className="inline-flex items-center gap-1.5 text-xs font-bold bg-[#091120] text-amber-300 border border-amber-500/40 px-3 py-1 rounded-full font-mono">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Delivery Mode: Simulated Dispatch Gateway</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs pt-1">
          <div className="p-3.5 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-emerald-300">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Registered Citizens (Eligible):</span>
            </div>
            <p className="text-slate-300 leading-relaxed">
              When an admin approves resolution evidence, an authenticated notification with a short-lived signed photo URL is generated and delivered via In-App Portal, SMS, or Email.
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-rose-950/20 border border-rose-500/30 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-rose-300">
              <ShieldAlert className="w-4 h-4 text-rose-400" />
              <span>Anonymous Reporters (Strictly Restricted):</span>
            </div>
            <p className="text-slate-300 leading-relaxed">
              Resolution photos are <strong>never</strong> transmitted to unauthenticated or anonymous reporters to prevent unauthorized dissemination and privacy violations.
            </p>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1 bg-[#091120] p-1 rounded-2xl text-xs font-semibold border border-slate-800">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${
              filterType === 'all'
                ? 'bg-cyan-500 text-black font-extrabold shadow-[0_0_10px_rgba(6,182,212,0.5)]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            All Logs ({notifications.length})
          </button>
          <button
            onClick={() => setFilterType('delivered')}
            className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${
              filterType === 'delivered'
                ? 'bg-cyan-500 text-black font-extrabold shadow-[0_0_10px_rgba(6,182,212,0.5)]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Delivered ({notifications.filter((n) => n.deliveryStatus === 'Delivered').length})
          </button>
          <button
            onClick={() => setFilterType('blocked')}
            className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${
              filterType === 'blocked'
                ? 'bg-cyan-500 text-black font-extrabold shadow-[0_0_10px_rgba(6,182,212,0.5)]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Blocked / Restricted ({notifications.filter((n) => n.deliveryStatus.includes('Blocked')).length})
          </button>
        </div>

        <span className="text-xs text-slate-400 font-mono hidden sm:inline">
          Showing {filteredNotifications.length} records
        </span>
      </div>

      {/* Notification Table */}
      <div className="glass-panel rounded-3xl overflow-hidden border border-cyan-500/20 shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-200 divide-y divide-slate-800">
            <thead className="bg-[#091120] text-[10px] font-bold text-cyan-400/80 uppercase font-mono tracking-wider">
              <tr>
                <th className="px-4 py-3.5">Complaint ID</th>
                <th className="px-4 py-3.5">Recipient Eligibility</th>
                <th className="px-4 py-3.5">Citizen Contact</th>
                <th className="px-4 py-3.5">Notification Type</th>
                <th className="px-4 py-3.5">Delivery Status</th>
                <th className="px-4 py-3.5">Signed Media Access</th>
                <th className="px-4 py-3.5">Timestamp</th>
                <th className="px-4 py-3.5 text-right">Payload</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 bg-[#060c18]/40">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-14 text-center text-slate-400">
                    <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-cyan-400" />
                    Fetching citizen dispatch events...
                  </td>
                </tr>
              ) : filteredNotifications.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-14 text-center text-slate-400">
                    <Bell className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                    <p className="font-bold text-white text-sm">No notification records in this filter</p>
                  </td>
                </tr>
              ) : (
                filteredNotifications.map((notif) => {
                  const isDelivered = notif.deliveryStatus === 'Delivered';
                  const isBlocked = notif.deliveryStatus.includes('Blocked');

                  return (
                    <tr
                      key={notif.id}
                      onClick={() => setSelectedNotif(notif)}
                      className="hover:bg-cyan-950/25 transition cursor-pointer"
                    >
                      {/* Complaint ID */}
                      <td className="px-4 py-3.5 font-mono font-bold text-cyan-300">
                        {notif.complaintId}
                      </td>

                      {/* Recipient Eligibility */}
                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold text-[10px] border font-mono ${
                            notif.recipientEligibility.includes('Eligible')
                              ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40 shadow-[0_0_8px_rgba(16,185,129,0.25)]'
                              : 'bg-rose-950/80 text-rose-300 border-rose-500/40 shadow-[0_0_8px_rgba(244,63,94,0.25)]'
                          }`}
                        >
                          {notif.recipientEligibility.includes('Eligible') ? (
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                          )}
                          {notif.recipientEligibility}
                        </span>
                      </td>

                      {/* Contact / Masked */}
                      <td className="px-4 py-3.5">
                        <div className="font-medium text-white">{notif.recipientName}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{notif.recipientContact}</div>
                      </td>

                      {/* Notification Type */}
                      <td className="px-4 py-3.5 font-medium text-slate-300">
                        {notif.notificationType}
                      </td>

                      {/* Delivery Status */}
                      <td className="px-4 py-3.5">
                        {isDelivered && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-300 bg-emerald-950/80 px-2.5 py-0.5 rounded-full border border-emerald-500/40 font-mono">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            Delivered ({notif.deliveredChannel})
                          </span>
                        )}
                        {isBlocked && (
                          <div>
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-300 bg-rose-950/80 px-2.5 py-0.5 rounded-full border border-rose-500/40 font-mono">
                              <XCircle className="w-3.5 h-3.5 text-rose-400" />
                              Blocked by Policy
                            </span>
                            {notif.failureReason && (
                              <p className="text-[10px] text-rose-400 line-clamp-1 mt-0.5 font-mono" title={notif.failureReason}>
                                {notif.failureReason}
                              </p>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Signed Media Access */}
                      <td className="px-4 py-3.5">
                        {notif.hasSignedPhotoUrl ? (
                          <div className="text-[11px] text-cyan-300 flex items-center gap-1 font-mono">
                            <Key className="w-3 h-3 text-cyan-400" />
                            <span>Signed (Valid 7 days)</span>
                          </div>
                        ) : (
                          <div className="text-[11px] text-slate-500 italic font-mono">None (Restricted)</div>
                        )}
                      </td>

                      {/* Creation Timestamp */}
                      <td className="px-4 py-3.5 text-slate-400 whitespace-nowrap font-mono text-[11px]">
                        {new Date(notif.creationTimestamp).toLocaleString('en-IN', {
                          timeZone: 'Asia/Kolkata',
                          dateStyle: 'short',
                          timeStyle: 'short',
                        })}
                      </td>

                      {/* Payload inspect */}
                      <td className="px-4 py-3.5 text-right">
                        <button
                          onClick={() => setSelectedNotif(notif)}
                          className="px-3 py-1 text-xs font-bold text-cyan-300 bg-cyan-950/60 hover:bg-cyan-900/80 border border-cyan-500/30 rounded-xl transition cursor-pointer"
                        >
                          Payload
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payload Modal */}
      {selectedNotif && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#03070f]/80 backdrop-blur-md">
          <div className="glass-panel-glow no-tilt rounded-3xl max-w-lg w-full p-6 border border-cyan-500/40 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-white text-base">Notification Audit Payload</h3>
                <span className="font-mono text-xs text-cyan-400">{selectedNotif.id}</span>
              </div>
              <button
                onClick={() => setSelectedNotif(null)}
                className="text-slate-400 hover:text-white text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3.5 bg-[#091120] rounded-2xl border border-slate-800">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-mono">Complaint ID</span>
                  <span className="font-mono font-bold text-white">{selectedNotif.complaintId}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-mono">Category</span>
                  <span className="font-semibold text-cyan-300">{selectedNotif.category}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-mono">Recipient</span>
                  <span className="text-white font-medium">{selectedNotif.recipientName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-mono">Status</span>
                  <span className="font-bold text-emerald-400">{selectedNotif.deliveryStatus}</span>
                </div>
              </div>

              {selectedNotif.failureReason && (
                <div className="p-3 bg-rose-950/40 border border-rose-500/30 rounded-2xl text-rose-300 space-y-1">
                  <span className="font-bold block font-mono">Delivery Block Explanation:</span>
                  <p>{selectedNotif.failureReason}</p>
                </div>
              )}

              {selectedNotif.hasSignedPhotoUrl && (
                <div className="p-3.5 bg-cyan-950/40 border border-cyan-500/30 rounded-2xl text-cyan-200 space-y-1.5">
                  <div className="flex items-center justify-between font-bold font-mono">
                    <span>Cryptographic Short-Lived Media Token:</span>
                    <span className="text-[10px] bg-cyan-900/60 px-2 py-0.5 rounded-full">HMAC-SHA256</span>
                  </div>
                  <p className="font-mono text-[10px] text-cyan-300 bg-[#060c18] p-2.5 rounded-xl border border-slate-800 break-all select-all">
                    https://storage.chennai.gov.in/civicproof/repairs/{selectedNotif.complaintId}?expires=
                    {encodeURIComponent(selectedNotif.signedUrlExpiry || '')}&token=e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
                  </p>
                  <p className="text-[11px] text-slate-400 font-mono">
                    Token expires on: {new Date(selectedNotif.signedUrlExpiry || '').toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedNotif(null)}
                className="px-4 py-2 rounded-xl bg-cyan-500 text-black font-extrabold hover:bg-cyan-400 transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
