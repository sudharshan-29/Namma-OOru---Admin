import React, { useState, useEffect, useCallback } from 'react';
import type { ActiveNavTab } from './components/layout/TopNavigation';
import { TopNavigation } from './components/layout/TopNavigation';
import { MapView } from './components/views/MapView';
import { DashboardView } from './components/views/DashboardView';
import { AllComplaintsView } from './components/views/AllComplaintsView';
import { InProgressView } from './components/views/InProgressView';
import { ResolvedView } from './components/views/ResolvedView';
import { ResolutionVerificationView } from './components/views/ResolutionVerificationView';
import { NotificationsView } from './components/views/NotificationsView';
import { SettingsView } from './components/views/SettingsView';
import { ComplaintDetailModal } from './components/modals/ComplaintDetailModal';
import { ReportIssueModal } from './components/modals/ReportIssueModal';
import { PhotoModal } from './components/common/PhotoModal';
import { AuthProvider, useAdminAuth } from './contexts/AuthContext';
import {
  api,
  type ComplaintsQueryParams,
  type StatsResponse,
  type HealthResponse,
} from './api/client';
import type {
  Complaint,
  DepartmentSummary,
  NotificationRecord,
  SystemSettings,
  ComplaintPriority,
  DepartmentName,
  ComplaintStatus,
} from './types/civic';
import { CheckCircle2, AlertCircle, X, ShieldAlert, Database } from 'lucide-react';

function AdminDashboardInner() {
  const { user } = useAdminAuth();

  // CRITICAL REQUIREMENT: Map View must be the default landing page
  const [currentTab, setCurrentTab] = useState<ActiveNavTab>('map-view');

  // Core Data States
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [totalComplaints, setTotalComplaints] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [departments, setDepartments] = useState<DepartmentSummary[]>([]);
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [health, setHealth] = useState<HealthResponse | null>(null);

  // Loading States
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isResetting, setIsResetting] = useState<boolean>(false);

  // Filters for All Complaints
  const [queryParams, setQueryParams] = useState<ComplaintsQueryParams>({
    page: 1,
    limit: 10,
    sortBy: 'submissionTimestamp',
    sortOrder: 'desc',
    category: 'All',
    priority: 'All',
    status: 'All',
    department: 'All',
    reporterType: 'All',
    demoFilter: 'all',
  });

  // Modals
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState<boolean>(false);
  const [reportModalOpen, setReportModalOpen] = useState<boolean>(false);

  const [photoModalData, setPhotoModalData] = useState<{
    isOpen: boolean;
    url: string;
    title: string;
    subtitle?: string;
  }>({
    isOpen: false,
    url: '',
    title: '',
  });

  // Toast notification
  const [toast, setToast] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4500);
  };

  // URL Hash synchronization
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#/', '');
      const validTabs: ActiveNavTab[] = [
        'map-view',
        'dashboard',
        'all-complaints',
        'in-progress',
        'resolved-complaints',
        'resolution-verification',
        'notifications',
        'settings',
      ];
      if (validTabs.includes(hash as ActiveNavTab)) {
        setCurrentTab(hash as ActiveNavTab);
      } else {
        // Default to map-view
        setCurrentTab('map-view');
        window.location.hash = '#/map-view';
      }
    };

    if (!window.location.hash || window.location.hash === '#' || window.location.hash === '#/') {
      window.location.hash = '#/map-view';
    } else {
      handleHashChange();
    }

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Sync html, body, and #root styles for 1-screen non-scrolling dashboard, complaints, assignments & verification view
  useEffect(() => {
    const rootEl = document.getElementById('root');
    if (
      currentTab === 'dashboard' ||
      currentTab === 'all-complaints' ||
      currentTab === 'resolution-verification'
    ) {
      document.documentElement.style.height = '100%';
      document.documentElement.style.overflow = 'hidden';
      document.body.style.height = '100%';
      document.body.style.overflow = 'hidden';
      document.body.style.backgroundColor = 'transparent';
      if (rootEl) {
        rootEl.style.height = '100%';
        rootEl.style.overflow = 'hidden';
      }
    } else {
      document.documentElement.style.height = '';
      document.documentElement.style.overflow = '';
      document.body.style.height = '';
      document.body.style.overflow = '';
      document.body.style.backgroundColor = '';
      if (rootEl) {
        rootEl.style.height = '';
        rootEl.style.overflow = '';
      }
    }
  }, [currentTab]);

  const handleNavigate = (tab: ActiveNavTab) => {
    setCurrentTab(tab);
    window.location.hash = `#/${tab}`;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Data Fetching
  const fetchAllData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [complaintsRes, statsRes, deptRes, notifRes, settingsRes, healthRes] = await Promise.all([
        api.getComplaints(queryParams),
        api.getStats(),
        api.getDepartments(),
        api.getNotifications(),
        api.getSettings(),
        api.getHealth().catch(() => null),
      ]);

      setComplaints(complaintsRes.complaints);
      setTotalComplaints(complaintsRes.total);
      setCurrentPage(complaintsRes.page);
      setTotalPages(complaintsRes.totalPages);
      setStats(statsRes);
      setDepartments(deptRes.departments);
      setNotifications(notifRes.notifications);
      setSettings(settingsRes);
      if (healthRes) {
        setHealth(healthRes);
      }
    } catch (error) {
      console.error('Failed to load civic data:', error);
      showToast(
        error instanceof Error ? error.message : 'Failed to retrieve civic complaints',
        'error'
      );
    } finally {
      setIsLoading(false);
    }
  }, [queryParams]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // Handle complaint selection for details modal
  const handleSelectComplaint = async (complaint: Complaint) => {
    try {
      const fullRecord = await api.getComplaintById(complaint.id);
      setSelectedComplaint(fullRecord);
      setDetailModalOpen(true);
    } catch {
      setSelectedComplaint(complaint);
      setDetailModalOpen(true);
    }
  };

  // Open photo modal helper
  const handleOpenPhoto = (url: string, title: string, subtitle?: string) => {
    setPhotoModalData({
      isOpen: true,
      url,
      title,
      subtitle,
    });
  };

  // Admin Action: Override Priority
  const handleOverridePriority = async (id: string, priority: ComplaintPriority, reason: string) => {
    try {
      const res = await api.updateComplaint(id, {
        priority,
        priorityReason: reason,
      });
      showToast(`Priority for ${id} overridden to ${priority}. Recorded in Firestore audit trail.`);
      setSelectedComplaint(res.complaint);
      await fetchAllData();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to override priority', 'error');
      throw err;
    }
  };

  // Admin Action: Reassign Department
  const handleReassignDepartment = async (
    id: string,
    department: DepartmentName,
    reason: string
  ) => {
    try {
      const res = await api.updateComplaint(id, {
        assignedDepartment: department,
        reassignmentReason: reason,
      });
      showToast(`Complaint ${id} reassigned to ${department}. Recorded in Firestore audit trail.`);
      setSelectedComplaint(res.complaint);
      await fetchAllData();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to reassign department', 'error');
      throw err;
    }
  };

  // Admin Action: Verification (Approve or Reject Evidence)
  const handleVerify = async (
    id: string,
    action: 'approve' | 'reject',
    rejectionReason?: string
  ) => {
    try {
      const res = await api.updateComplaint(id, {
        verificationAction: action,
        rejectionReason,
      });

      if (action === 'approve') {
        showToast(
          `Resolution for ${id} APPROVED. Complaint marked Resolved in Firestore and notification created for eligible registered citizen.`
        );
      } else {
        showToast(`Evidence for ${id} rejected with recorded reason. Returned to In Progress for department correction.`);
      }

      if (selectedComplaint && selectedComplaint.id === id) {
        setSelectedComplaint(res.complaint);
      }
      await fetchAllData();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Verification action failed', 'error');
      throw err;
    }
  };

  // Admin Action: Update Status
  const handleUpdateStatus = async (id: string, status: ComplaintStatus, reason?: string) => {
    try {
      const res = await api.updateComplaint(id, {
        status,
        statusReason: reason || `Admin transitioned status to ${status}`,
      });
      showToast(`Complaint ${id} status updated to ${status}. Recorded in audit trail.`);
      if (selectedComplaint && selectedComplaint.id === id) {
        setSelectedComplaint(res.complaint);
      }
      await fetchAllData();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to update status', 'error');
      throw err;
    }
  };

  // Admin Action: Update Settings
  const handleUpdateSettings = async (newSettings: Partial<SystemSettings>) => {
    try {
      const res = await api.updateSettings(newSettings);
      setSettings(res.settings);
      showToast('Municipal governance settings saved to Cloud Firestore.');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to save settings', 'error');
      throw err;
    }
  };

  // Admin Action: Reset Demo Data
  const handleResetDemoData = async () => {
    setIsResetting(true);
    try {
      await api.resetDemoData();
      showToast('Initial Chennai civic dataset successfully restored in Firestore.');
      await fetchAllData();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to reset demo data', 'error');
    } finally {
      setIsResetting(false);
    }
  };

  // Query Params update helper
  const handleFilterChange = (newParams: Partial<ComplaintsQueryParams>) => {
    setQueryParams((prev) => ({
      ...prev,
      ...newParams,
    }));
  };

  const pendingVerificationCount = stats?.awaitingVerification ?? 0;

  return (
    <div
      className={`font-sans text-slate-900 selection:bg-sky-100 selection:text-sky-900 box-border ${
        currentTab === 'dashboard' ||
        currentTab === 'all-complaints' ||
        currentTab === 'resolution-verification'
          ? 'h-[100dvh] max-h-[100dvh] w-full flex flex-col overflow-hidden bg-transparent'
          : 'min-h-screen bg-slate-50 flex flex-col'
      }`}
      style={currentTab === 'dashboard' ? { padding: '0 var(--pad, clamp(20px, 2.5vw, 36px)) clamp(20px, calc(26 * var(--u)), 30px)' } : undefined}
    >
      {/* 2. EXACT HORIZONTAL TOP NAVIGATION BAR */}
      <TopNavigation
        currentTab={currentTab}
        onNavigate={handleNavigate}
        pendingVerificationCount={pendingVerificationCount}
        onResetDemoData={handleResetDemoData}
        isResetting={isResetting}
        onOpenReportIssue={() => setReportModalOpen(true)}
        health={health}
      />

      {/* VIEW 1: MAP VIEW (FULL-SCREEN GIS VIEW MATCHING USER SCREENSHOT) */}
      {currentTab === 'map-view' ? (
        <div className="w-full h-screen relative overflow-hidden bg-[#e8ecef]">
          <MapView
            stats={stats}
            isLoading={isLoading}
            complaints={complaints}
            onSelectComplaint={handleSelectComplaint}
            onNavigateToVerification={() => handleNavigate('resolution-verification')}
            onNavigateToInProgress={() => handleNavigate('in-progress')}
            onNavigateToAllComplaints={() => handleNavigate('all-complaints')}
            onOpenReportIssue={() => setReportModalOpen(true)}
          />
        </div>
      ) : currentTab === 'dashboard' ? (
        /* VIEW 2: DASHBOARD (SCENIC RECREATION MATCHING REFERENCE SCREENSHOT) */
        <DashboardView
          stats={stats}
          departments={departments}
          complaints={complaints}
          isLoading={isLoading}
          onNavigateToTab={handleNavigate}
          onSelectComplaint={handleSelectComplaint}
        />
      ) : currentTab === 'all-complaints' ? (
        /* VIEW 3a: ALL COMPLAINTS (EXACT GLASS DASHBOARD OVER CHENNAI SUNSET BACKDROP) */
        <div className="w-full h-full min-h-0 flex flex-col relative overflow-hidden">
          <AllComplaintsView
            complaints={complaints}
            total={totalComplaints}
            page={currentPage}
            totalPages={totalPages}
            limit={queryParams.limit || 10}
            isLoading={isLoading}
            queryParams={queryParams}
            onFilterChange={handleFilterChange}
            onSelectComplaint={() => {}}
            onOpenPhoto={handleOpenPhoto}
            onRefresh={fetchAllData}
            onOpenReportIssue={() => setReportModalOpen(true)}
            onReassignComplaint={handleReassignDepartment}
          />
        </div>
      ) : currentTab === 'resolution-verification' ? (
        /* VIEW 5: RESOLUTION VERIFICATION (OVER GREATER CHENNAI CORPORATION RIPON BUILDING SUNSET BACKDROP) */
        <div className="w-full h-full min-h-0 flex flex-col relative overflow-hidden">
          <ResolutionVerificationView
            complaints={complaints}
            isLoading={isLoading}
            onVerify={handleVerify}
            onOpenPhoto={handleOpenPhoto}
            onSelectComplaint={handleSelectComplaint}
            onRefresh={fetchAllData}
          />
        </div>
      ) : (
        <div className="pt-[52px] sm:pt-[54px] flex-1 flex flex-col">
          {/* Standard Content Views Container */}
          <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">

            {/* VIEW 3b: IN PROGRESS */}
            {currentTab === 'in-progress' && (
              <InProgressView
                complaints={complaints}
                isLoading={isLoading}
                onSelectComplaint={handleSelectComplaint}
                onOpenPhoto={handleOpenPhoto}
                onNavigateToVerification={() => handleNavigate('resolution-verification')}
              />
            )}

            {/* VIEW 3c: RESOLVED COMPLAINTS */}
            {currentTab === 'resolved-complaints' && (
              <ResolvedView
                complaints={complaints}
                isLoading={isLoading}
                onSelectComplaint={handleSelectComplaint}
                onOpenPhoto={handleOpenPhoto}
                onNavigateToAll={() => handleNavigate('all-complaints')}
              />
            )}

            {/* VIEW 6: NOTIFICATIONS */}
            {currentTab === 'notifications' && (
              <NotificationsView
                notifications={notifications}
                isLoading={isLoading}
                onRefresh={fetchAllData}
              />
            )}

            {/* VIEW 7: SETTINGS */}
            {currentTab === 'settings' && (
              <SettingsView
                settings={settings}
                isLoading={isLoading}
                onUpdateSettings={handleUpdateSettings}
                onResetDemoData={handleResetDemoData}
                health={health}
              />
            )}
          </main>

          {/* Footer */}
          <footer className="bg-[#0b1f33] border-t border-slate-800 py-6 text-xs text-slate-400 mt-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-200">Namma Ooru Chennai</span>
                <span>·</span>
                <span>
                  Admin Domain Dashboard v3.0{' '}
                  {health?.storageMode === 'local-json'
                    ? '(Local JSON Shared Store)'
                    : '(Cloud Firestore Connected)'}
                </span>
                <span>·</span>
                <span>Ripon Building, Greater Chennai Corporation</span>
              </div>
              <div className="flex items-center gap-4 text-slate-500">
                <span>
                  {health?.storageMode === 'local-json'
                    ? 'Local JSON (complaints-store.json, audit-logs.json)'
                    : 'Cloud Firestore'}
                </span>
                <span>Local Admin Auth</span>
              </div>
            </div>
          </footer>
        </div>
      )}

      {/* Toast Feedback */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 animate-in slide-in-from-bottom-3 duration-200">
          <div
            className={`flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg border text-xs font-semibold ${
              toast.type === 'success'
                ? 'bg-slate-900 text-white border-slate-800'
                : 'bg-rose-600 text-white border-rose-700'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-white shrink-0" />
            )}
            <span>{toast.message}</span>
            <button
              onClick={() => setToast(null)}
              className="ml-2 text-white/70 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      <ComplaintDetailModal
        complaint={selectedComplaint}
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        onOverridePriority={handleOverridePriority}
        onReassignDepartment={handleReassignDepartment}
        onVerify={handleVerify}
        onOpenPhoto={handleOpenPhoto}
        onUpdateStatus={handleUpdateStatus}
      />

      <ReportIssueModal
        isOpen={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        onComplaintSubmitted={(newComplaint) => {
          showToast(`Complaint ${newComplaint.id} registered and added to Chennai triage queue!`);
          fetchAllData();
        }}
      />

      <PhotoModal
        isOpen={photoModalData.isOpen}
        onClose={() => setPhotoModalData((prev) => ({ ...prev, isOpen: false }))}
        photoUrl={photoModalData.url}
        title={photoModalData.title}
        subtitle={photoModalData.subtitle}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AdminDashboardInner />
    </AuthProvider>
  );
}
