import React, { useState } from 'react';
import {
  Settings,
  Shield,
  Clock,
  Layers,
  Sliders,
  CheckCircle2,
  RefreshCw,
  Save,
  AlertCircle,
  Building2,
  Lock,
  Database,
  PlayCircle,
  XCircle,
} from 'lucide-react';
import type { SystemSettings, PriorityRule } from '../../types/civic';
import { api, type HealthResponse } from '../../api/client';
import firebaseConfig from '../../../firebase-applet-config.json';

interface SettingsViewProps {
  settings: SystemSettings | null;
  isLoading: boolean;
  onUpdateSettings: (newSettings: Partial<SystemSettings>) => Promise<void>;
  onResetDemoData: () => Promise<void>;
  health?: HealthResponse | null;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  isLoading,
  onUpdateSettings,
  onResetDemoData,
  health,
}) => {
  const [formData, setFormData] = useState<SystemSettings | null>(settings);
  const [isSaving, setIsSaving] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Test suite state
  const [isRunningTests, setIsRunningTests] = useState(false);
  const [testResults, setTestResults] = useState<{
    allPassed: boolean;
    summary: string;
    results: { test: string; passed: boolean; message: string }[];
  } | null>(null);

  // Sync when settings prop loads
  React.useEffect(() => {
    if (settings) {
      setFormData(settings);
    }
  }, [settings]);

  if (!formData) {
    return (
      <div className="p-12 text-center text-slate-400 bg-white rounded-xl border border-slate-200">
        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-sky-600" />
        Loading administrative configuration...
      </div>
    );
  }

  const handleSlaChange = (priority: keyof SystemSettings['slaHours'], value: number) => {
    setFormData({
      ...formData,
      slaHours: {
        ...formData.slaHours,
        [priority]: value,
      },
    });
  };

  const handleToggleRule = (ruleId: string) => {
    setFormData({
      ...formData,
      priorityRules: formData.priorityRules.map((r) =>
        r.id === ruleId ? { ...r, enabled: !r.enabled } : r
      ),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      await onUpdateSettings(formData);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    if (
      window.confirm(
        'Are you sure you want to restore the initial demo complaints and notifications? This will reload the baseline Chennai scenario in Firestore.'
      )
    ) {
      setIsResetting(true);
      try {
        await onResetDemoData();
      } finally {
        setIsResetting(false);
      }
    }
  };

  const handleRunTests = async () => {
    setIsRunningTests(true);
    try {
      const res = await api.runTestSuite();
      setTestResults(res);
    } catch (err: any) {
      alert('Test suite error: ' + err.message);
    } finally {
      setIsRunningTests(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">System Settings & Governance</h1>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
              {health?.storageMode === 'local-json' || !health?.firestoreAvailable
                ? 'Local JSON Storage Active'
                : 'Firebase Backed'}
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Configure municipal SLA resolution thresholds, automated category-to-department mappings, and priority rules.
          </p>
        </div>

        {saveSuccess && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            {health?.storageMode === 'local-json' || !health?.firestoreAvailable
              ? 'Settings Saved to Local JSON Store (data/settings-store.json)'
              : 'Settings Saved to Firestore'}
          </div>
        )}
      </div>

      {/* Card 0: Storage & Backend Infrastructure Status */}
      <div className="bg-white rounded-xl border border-sky-200 p-5 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-sky-600" />
            <h2 className="text-sm font-bold text-slate-900">
              {health?.storageMode === 'local-json' || !health?.firestoreAvailable
                ? 'Local JSON Storage Engine'
                : 'Firebase Backend Infrastructure'}
            </h2>
          </div>
          <span
            className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded border ${
              health?.storageMode === 'local-json' || !health?.firestoreAvailable
                ? 'text-amber-800 bg-amber-50 border-amber-300'
                : 'text-emerald-700 bg-emerald-50 border-emerald-200'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                health?.storageMode === 'local-json' || !health?.firestoreAvailable
                  ? 'bg-amber-500'
                  : 'bg-emerald-500 animate-pulse'
              }`}
            />
            {health?.storageMode === 'local-json' || !health?.firestoreAvailable
              ? 'Local JSON Store Active (data/*.json)'
              : 'Connected & Rules Active'}
          </span>
        </div>

        {health?.storageMode === 'local-json' || !health?.firestoreAvailable ? (
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-slate-400 font-semibold block text-[10px] uppercase">Complaints Store</span>
              <span className="font-mono font-bold text-slate-800 truncate block text-[11px]">
                {health?.jsonStorage?.complaints || 'data/complaints-store.json'}
              </span>
            </div>
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-slate-400 font-semibold block text-[10px] uppercase">Settings Store</span>
              <span className="font-mono font-bold text-slate-800 truncate block text-[11px]">
                {health?.jsonStorage?.settings || 'data/settings-store.json'}
              </span>
            </div>
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-slate-400 font-semibold block text-[10px] uppercase">Audit Trail</span>
              <span className="font-mono font-bold text-slate-800 truncate block text-[11px]">
                {health?.jsonStorage?.auditLogs || 'data/audit-logs.json'}
              </span>
            </div>
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-slate-400 font-semibold block text-[10px] uppercase">Departments</span>
              <span className="font-mono font-bold text-slate-800 truncate block text-[11px]">
                {health?.jsonStorage?.departments || 'data/departments.json'}
              </span>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-slate-400 font-semibold block text-[10px] uppercase">Firebase Project ID</span>
              <span className="font-mono font-bold text-slate-800 truncate block">{firebaseConfig.projectId}</span>
            </div>

            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-slate-400 font-semibold block text-[10px] uppercase">Cloud Firestore DB</span>
              <span className="font-mono font-bold text-slate-800 truncate block text-[11px]">
                {firebaseConfig.firestoreDatabaseId}
              </span>
            </div>

            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-slate-400 font-semibold block text-[10px] uppercase">Cloud Storage Bucket</span>
              <span className="font-mono font-bold text-slate-800 truncate block">{firebaseConfig.storageBucket}</span>
            </div>
          </div>
        )}

        {/* Security & Backend Automated Test Runner */}
        <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="text-xs text-slate-600">
            <strong>Backend Security & Workflow Validation:</strong> Verify all 9 test assertions required by Section 13 (Authorization, Routing, Verification, Anonymous Safety, Immutability).
          </div>
          <button
            type="button"
            onClick={handleRunTests}
            disabled={isRunningTests}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition shrink-0 disabled:opacity-50"
          >
            <PlayCircle className={`w-3.5 h-3.5 ${isRunningTests ? 'animate-spin' : ''}`} />
            {isRunningTests ? 'Executing Tests...' : 'Run Security Tests'}
          </button>
        </div>

        {/* Test Results Display */}
        {testResults && (
          <div className="mt-3 p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-slate-900">
                Test Results: {testResults.summary}
              </span>
              <span
                className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                  testResults.allPassed
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : 'bg-rose-100 text-rose-800 border border-rose-300'
                }`}
              >
                {testResults.allPassed ? 'ALL TESTS PASSED' : 'SOME TESTS FAILED'}
              </span>
            </div>

            <div className="space-y-1.5 text-xs">
              {testResults.results.map((r, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2 p-2 rounded-lg bg-white border border-slate-200"
                >
                  {r.passed ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <div className="font-semibold text-slate-800">{r.test}</div>
                    <div className="text-[11px] text-slate-500">{r.message}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Card 1: Admin Profile & Authority */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Shield className="w-4 h-4 text-sky-600" />
            <h2 className="text-sm font-bold text-slate-900">Admin Authority Profile</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Supervising Official Name</label>
              <input
                type="text"
                value={formData.adminName}
                onChange={(e) => setFormData({ ...formData, adminName: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-900 focus:outline-sky-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Official Designation</label>
              <input
                type="text"
                value={formData.adminDesignation}
                onChange={(e) => setFormData({ ...formData, adminDesignation: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-900 focus:outline-sky-500"
              />
            </div>
          </div>
        </div>

        {/* Card 2: Department Mapping Mandate */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-sky-600" />
              <h2 className="text-sm font-bold text-slate-900">Mandatory Category-Department Mapping</h2>
            </div>
            <span className="text-[11px] font-semibold text-sky-800 bg-sky-50 border border-sky-200 px-2 py-0.5 rounded">
              Fixed Municipal Contract
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3 rounded-lg border border-amber-200 bg-amber-50/50 space-y-1">
              <span className="font-bold text-amber-900 block">1. Road Damage</span>
              <p className="text-slate-600">Routes to:</p>
              <span className="font-semibold text-slate-900 block">Roads and Infrastructure Department</span>
            </div>

            <div className="p-3 rounded-lg border border-emerald-200 bg-emerald-50/50 space-y-1">
              <span className="font-bold text-emerald-900 block">2. Improper Waste Disposal</span>
              <p className="text-slate-600">Routes to:</p>
              <span className="font-semibold text-slate-900 block">Solid Waste Management Department</span>
            </div>

            <div className="p-3 rounded-lg border border-sky-200 bg-sky-50/50 space-y-1">
              <span className="font-bold text-sky-900 block">3. Water Leakage</span>
              <p className="text-slate-600">Routes to:</p>
              <span className="font-semibold text-slate-900 block">Water Supply and Sewerage Department</span>
            </div>
          </div>
        </div>

        {/* Card 3: SLA Turnaround Hours */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Clock className="w-4 h-4 text-sky-600" />
            <h2 className="text-sm font-bold text-slate-900">Configurable SLA Resolution Limits (Hours)</h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div className="p-3 rounded-lg border border-rose-200 bg-rose-50/30">
              <label className="block font-bold text-rose-800 mb-1">Critical SLA (Hrs)</label>
              <input
                type="number"
                min="1"
                max="72"
                value={formData.slaHours.Critical}
                onChange={(e) => handleSlaChange('Critical', parseInt(e.target.value, 10) || 12)}
                className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-900 font-bold focus:outline-rose-500"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">Default: 12 hours</span>
            </div>

            <div className="p-3 rounded-lg border border-orange-200 bg-orange-50/30">
              <label className="block font-bold text-orange-800 mb-1">High SLA (Hrs)</label>
              <input
                type="number"
                min="1"
                max="120"
                value={formData.slaHours.High}
                onChange={(e) => handleSlaChange('High', parseInt(e.target.value, 10) || 24)}
                className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-900 font-bold focus:outline-orange-500"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">Default: 24 hours</span>
            </div>

            <div className="p-3 rounded-lg border border-blue-200 bg-blue-50/30">
              <label className="block font-bold text-blue-800 mb-1">Medium SLA (Hrs)</label>
              <input
                type="number"
                min="1"
                max="168"
                value={formData.slaHours.Medium}
                onChange={(e) => handleSlaChange('Medium', parseInt(e.target.value, 10) || 48)}
                className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-900 font-bold focus:outline-blue-500"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">Default: 48 hours</span>
            </div>

            <div className="p-3 rounded-lg border border-slate-200 bg-slate-50">
              <label className="block font-bold text-slate-700 mb-1">Low SLA (Hrs)</label>
              <input
                type="number"
                min="1"
                max="240"
                value={formData.slaHours.Low}
                onChange={(e) => handleSlaChange('Low', parseInt(e.target.value, 10) || 72)}
                className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-900 font-bold focus:outline-slate-500"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">Default: 72 hours</span>
            </div>
          </div>
        </div>

        {/* Card 4: Explainable Auto-Prioritization Rules */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-sky-600" />
              <h2 className="text-sm font-bold text-slate-900">Explainable Auto-Prioritization Rules</h2>
            </div>
            <span className="text-xs text-slate-500">4 Active Rules</span>
          </div>

          <div className="space-y-3">
            {formData.priorityRules.map((rule) => (
              <div
                key={rule.id}
                className={`p-3.5 rounded-xl border transition text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                  rule.enabled ? 'bg-slate-50/70 border-slate-200' : 'bg-slate-100/60 border-slate-200 opacity-60'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-slate-500">{rule.id}</span>
                    <span className="font-bold text-slate-900">{rule.name}</span>
                    <span
                      className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                        rule.assignedPriority === 'Critical'
                          ? 'bg-rose-100 text-rose-800'
                          : rule.assignedPriority === 'High'
                          ? 'bg-orange-100 text-orange-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      Assigned: {rule.assignedPriority}
                    </span>
                  </div>
                  <p className="text-slate-600">{rule.description}</p>
                  <div className="flex flex-wrap items-center gap-1 pt-1">
                    <span className="text-slate-400 text-[10px]">Keywords:</span>
                    {rule.keywords.map((kw, i) => (
                      <span key={i} className="bg-white border border-slate-200 text-slate-700 px-1.5 py-0.5 rounded text-[10px]">
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rule.enabled}
                      onChange={() => handleToggleRule(rule.id)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-sky-600"></div>
                  </label>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <button
            type="button"
            onClick={handleReset}
            disabled={isResetting}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded-lg hover:bg-rose-100 transition disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin' : ''}`} />
            Restore Initial Demo Data in Firestore
          </button>

          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-sky-600 text-white font-semibold text-xs hover:bg-sky-700 transition shadow-xs disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {isSaving ? 'Saving Changes...' : 'Save Configuration to Firestore'}
          </button>
        </div>
      </form>
    </div>
  );
};
