import React, { useState, useMemo } from 'react';
import {
  ShieldCheck,
  Layers,
  CheckCircle2,
  Clock,
  BarChart3,
  Filter,
  Calendar,
  Search,
  ChevronDown,
  MapPin,
  Check,
  RotateCcw,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  X,
  AlertCircle,
} from 'lucide-react';
import type { Complaint } from '../../types/civic';
import {
  REFERENCE_SAMPLE_ROWS,
  CANONICAL_25_COMPLAINTS,
  getBeforePhotoForComplaint,
  getAfterPhotoForComplaint,
  getCategoryFallbackPhoto,
} from '../../data/canonicalComplaints';

interface ResolutionVerificationViewProps {
  complaints: Complaint[];
  isLoading: boolean;
  onVerify: (id: string, action: 'approve' | 'reject', reason?: string) => Promise<void>;
  onOpenPhoto: (url: string, title: string, subtitle?: string) => void;
  onSelectComplaint: (complaint: Complaint) => void;
  onRefresh: () => void;
}

interface VerificationRowItem {
  id: string; // "1001", "1002", etc.
  rawComplaintId: string; // "CP-CHN-2026-1001", etc.
  category: string;
  title: string;
  description: string;
  location: string;
  resolvedOn: string;
  status: 'Resolved' | 'Pending Verification' | 'Returned';
  beforePhotoUrl: string;
  afterPhotoUrl: string;
  submittedByDepartment: string;
  repairNotes: string;
}

export const ResolutionVerificationView: React.FC<ResolutionVerificationViewProps> = ({
  complaints,
  isLoading,
  onVerify,
  onOpenPhoto,
  onSelectComplaint,
  onRefresh,
}) => {
  // Filter & Search states
  const [activeTab, setActiveTab] = useState<'pending' | 'verified' | 'returned'>('pending');
  const [selectedCategory, setSelectedCategory] = useState<string>('All Categories');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('All Departments');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Modal for returning for review
  const [activeRejectId, setActiveRejectId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isProcessing, setIsProcessing] = useState<string | null>(null);

  // Exact 25 complaints from the complaint page only, with exact ID and location
  const allVerificationRows: VerificationRowItem[] = useMemo(() => {
    return REFERENCE_SAMPLE_ROWS.map((row) => {
      const canonical = CANONICAL_25_COMPLAINTS.find((c) => c.id === row.fullId);
      const beforePhoto =
        getBeforePhotoForComplaint(row.id, row.category) ||
        row.photo ||
        getCategoryFallbackPhoto(row.category, false);

      const afterPhoto =
        getAfterPhotoForComplaint(row.id, row.category) ||
        canonical?.verification?.afterRepairPhotoUrl ||
        getCategoryFallbackPhoto(row.category, true);

      return {
        id: row.id, // "1001", "1002", etc. exactly matching complaints page
        rawComplaintId: row.fullId,
        category: row.category,
        title: row.category,
        description: row.detail,
        location: row.location,
        resolvedOn: row.date,
        status: 'Resolved' as const,
        beforePhotoUrl: beforePhoto,
        afterPhotoUrl: afterPhoto,
        submittedByDepartment:
          row.department === 'Roads'
            ? 'Roads and Infrastructure Department'
            : row.department === 'Sanitation'
            ? 'Solid Waste Management Department'
            : row.department === 'Water Supply'
            ? 'Water Supply and Sewerage Department'
            : 'Electrical Department (TANGEDCO)',
        repairNotes: `Field remediation completed for ${row.detail} at ${row.location}. Visual proof submitted for verification.`,
      };
    });
  }, []);

  // Apply filters: Search, Category, Department
  const filteredRows = useMemo(() => {
    return allVerificationRows.filter((item) => {
      if (
        selectedCategory !== 'All Categories' &&
        !item.category.toLowerCase().includes(selectedCategory.toLowerCase()) &&
        !item.title.toLowerCase().includes(selectedCategory.toLowerCase())
      ) {
        return false;
      }

      if (
        selectedDepartment !== 'All Departments' &&
        !item.submittedByDepartment.toLowerCase().includes(selectedDepartment.toLowerCase())
      ) {
        return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesId = item.id.toLowerCase().includes(q) || item.rawComplaintId.toLowerCase().includes(q);
        const matchesLocation = item.location.toLowerCase().includes(q);
        const matchesTitle = item.title.toLowerCase().includes(q);
        const matchesDesc = item.description.toLowerCase().includes(q);
        if (!matchesId && !matchesLocation && !matchesTitle && !matchesDesc) {
          return false;
        }
      }

      return true;
    });
  }, [allVerificationRows, selectedCategory, selectedDepartment, searchQuery]);

  // Pagination (5 rows per page matching reference design)
  const pageSize = 5;
  const totalItems = allVerificationRows.length; // 25 canonical complaints
  const displayTotal = filteredRows.length;
  const totalPages = Math.ceil(filteredRows.length / pageSize) || 1;

  const currentRows = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredRows.slice(startIndex, startIndex + pageSize);
  }, [filteredRows, currentPage, pageSize]);

  // Checkbox handlers
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      const newSet = new Set(currentRows.map((r) => r.id));
      setSelectedIds(newSet);
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleToggleRow = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  // Action: Verify & Close
  const handleApprove = async (rawId: string) => {
    setIsProcessing(rawId);
    try {
      await onVerify(rawId, 'approve');
    } finally {
      setIsProcessing(null);
    }
  };

  // Action: Return for Review submit
  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeRejectId || !rejectionReason.trim()) return;
    setIsProcessing(activeRejectId);
    try {
      await onVerify(activeRejectId, 'reject', rejectionReason.trim());
      setActiveRejectId(null);
      setRejectionReason('');
    } finally {
      setIsProcessing(null);
    }
  };

  // Apple-grade crystal glass enclosure matching AllComplaintsView exactly
  const GLASS_ENCLOSURE_STYLE: React.CSSProperties = {
    background:
      'linear-gradient(135deg, rgba(255, 255, 255, 0.42) 0%, rgba(255, 255, 255, 0.18) 40%, rgba(0, 0, 0, 0.06) 100%)',
    backdropFilter: 'blur(32px) saturate(220%) contrast(106%)',
    WebkitBackdropFilter: 'blur(32px) saturate(220%) contrast(106%)',
    border: '1.5px solid rgba(255, 255, 255, 0.70)',
    borderRadius: '26px',
    boxShadow:
      '0 24px 50px -10px rgba(0, 0, 0, 0.22), ' +
      '0 8px 20px -4px rgba(0, 0, 0, 0.14), ' +
      '0 0 1px 1px rgba(255, 255, 255, 0.40), ' +
      'inset 0 1.5px 2px rgba(255, 255, 255, 0.85), ' +
      'inset 0 -1.5px 2px rgba(0, 0, 0, 0.18), ' +
      'inset 0 0 20px rgba(255, 255, 255, 0.10)',
  };

  return (
    <div
      className="w-full h-full relative flex flex-col justify-end select-none overflow-hidden"
      style={{
        backgroundImage: "url('/images/verification-backdrop.jpg')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
        backgroundRepeat: 'no-repeat',
      }}
    >
      {/* Subtle warm wash: enhances readability while preserving scenic lake reflections */}
      <div className="absolute inset-0 bg-gradient-to-b from-sky-950/10 via-transparent to-amber-950/15 pointer-events-none" />

      {/* Centered Page Container: Balanced width (1080px max) placed DOWN near bottom without column gaps */}
      <div className="w-[calc(100%-36px)] sm:w-[calc(100%-48px)] xl:w-[calc(100%-60px)] max-w-[1080px] mx-auto pb-3 sm:pb-4 xl:pb-5 flex flex-col box-border relative z-10">
        {/* 1. PAGE HEADING: Placed over backdrop, keeping the upper sky and Ripon Building 100% visible */}
        <div className="w-full flex items-center justify-between relative z-10 box-border mb-2 sm:mb-2.5 px-0.5 select-none">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/45 border border-white/70 backdrop-blur-md flex items-center justify-center text-[#0A2540] shadow-2xs shrink-0">
              <ShieldCheck className="w-5 h-5 stroke-[2] text-[#0A2540]" />
            </div>
            <div>
              <h1
                className="text-[24px] sm:text-[27px] font-black text-[#0A2540] tracking-tight leading-none"
                style={{
                  fontFamily: "'Playfair Display', Georgia, serif",
                  textShadow: '0 1px 2px rgba(255, 255, 255, 0.90)',
                }}
              >
                Resolution Verification
              </h1>
              <p className="text-[11px] sm:text-xs text-slate-700/90 font-medium mt-0.5 leading-tight">
                Review resolved complaints, verify evidence and confirm closure.
              </p>
              <div className="w-10 h-[3px] rounded-full bg-gradient-to-r from-[#0A2540] via-[#0f766e] to-[#2dd4bf] mt-1 shadow-xs" />
            </div>
          </div>
        </div>

        {/* 2. SINGLE COMPACT 3D FLOATING CRYSTAL GLASS ENCLOSURE CARD (1080px max width matching Complaints page) */}
        <div
          style={GLASS_ENCLOSURE_STYLE}
          className="w-full p-2.5 sm:p-3 xl:p-3.5 flex flex-col relative z-10 box-border"
        >
          {/* A. 4 STAT KPI CARDS (Balanced height ~56px) */}
          <div className="w-full grid grid-cols-4 gap-2 sm:gap-2.5 box-border">
            {/* Card 1: Pending Verification — 18 */}
            <div
              className="h-[54px] sm:h-[58px] rounded-[14px] px-2.5 xl:px-3 py-2 flex items-center gap-2.5 border border-white/85 shadow-xs backdrop-blur-md transition-all duration-200 select-none box-border"
              style={{
                background:
                  'linear-gradient(135deg, rgba(254, 243, 199, 0.88) 0%, rgba(255, 251, 235, 0.75) 100%)',
              }}
            >
              <div className="w-[34px] h-[34px] rounded-full bg-amber-500/15 border border-amber-500/25 flex items-center justify-center text-amber-700 shrink-0">
                <Layers className="w-4 h-4 stroke-[2.2]" />
              </div>
              <div className="flex flex-col min-w-0 justify-center">
                <span className="text-[11px] xl:text-[11.5px] font-semibold text-[#102B50] leading-tight whitespace-nowrap">
                  Pending Verification
                </span>
                <span className="text-[18px] xl:text-[20px] font-bold text-[#102B50] leading-none mt-0.5">
                  18
                </span>
              </div>
            </div>

            {/* Card 2: Verified Today — 26 */}
            <div
              className="h-[54px] sm:h-[58px] rounded-[14px] px-2.5 xl:px-3 py-2 flex items-center gap-2.5 border border-white/85 shadow-xs backdrop-blur-md transition-all duration-200 select-none box-border"
              style={{
                background:
                  'linear-gradient(135deg, rgba(209, 250, 229, 0.88) 0%, rgba(236, 253, 245, 0.75) 100%)',
              }}
            >
              <div className="w-[34px] h-[34px] rounded-full bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center text-emerald-700 shrink-0">
                <CheckCircle2 className="w-4 h-4 stroke-[2.2]" />
              </div>
              <div className="flex flex-col min-w-0 justify-center">
                <span className="text-[11px] xl:text-[11.5px] font-semibold text-[#102B50] leading-tight whitespace-nowrap">
                  Verified Today
                </span>
                <span className="text-[18px] xl:text-[20px] font-bold text-[#102B50] leading-none mt-0.5">
                  26
                </span>
              </div>
            </div>

            {/* Card 3: Avg. Verification Time — 6.4 hrs */}
            <div
              className="h-[54px] sm:h-[58px] rounded-[14px] px-2.5 xl:px-3 py-2 flex items-center gap-2.5 border border-white/85 shadow-xs backdrop-blur-md transition-all duration-200 select-none box-border"
              style={{
                background:
                  'linear-gradient(135deg, rgba(243, 232, 255, 0.88) 0%, rgba(250, 245, 255, 0.75) 100%)',
              }}
            >
              <div className="w-[34px] h-[34px] rounded-full bg-purple-500/15 border border-purple-500/25 flex items-center justify-center text-purple-700 shrink-0">
                <Clock className="w-4 h-4 stroke-[2.2]" />
              </div>
              <div className="flex flex-col min-w-0 justify-center">
                <span className="text-[11px] xl:text-[11.5px] font-semibold text-[#102B50] leading-tight whitespace-nowrap">
                  Avg. Verification Time
                </span>
                <span className="text-[18px] xl:text-[20px] font-bold text-[#102B50] leading-none mt-0.5">
                  6.4 hrs
                </span>
              </div>
            </div>

            {/* Card 4: Verification Rate — 93% */}
            <div
              className="h-[54px] sm:h-[58px] rounded-[14px] px-2.5 xl:px-3 py-2 flex items-center gap-2.5 border border-white/85 shadow-xs backdrop-blur-md transition-all duration-200 select-none box-border"
              style={{
                background:
                  'linear-gradient(135deg, rgba(224, 242, 254, 0.88) 0%, rgba(240, 249, 255, 0.75) 100%)',
              }}
            >
              <div className="w-[34px] h-[34px] rounded-full bg-sky-500/15 border border-sky-500/25 flex items-center justify-center text-sky-700 shrink-0">
                <BarChart3 className="w-4 h-4 stroke-[2.2]" />
              </div>
              <div className="flex flex-col min-w-0 justify-center">
                <span className="text-[11px] xl:text-[11.5px] font-semibold text-[#102B50] leading-tight whitespace-nowrap">
                  Verification Rate
                </span>
                <span className="text-[18px] xl:text-[20px] font-bold text-[#102B50] leading-none mt-0.5">
                  93%
                </span>
              </div>
            </div>
          </div>

          {/* B. FILTER & SEARCH BAR CAPSULE */}
          <div className="w-full flex items-center justify-between gap-2 mt-2.5 bg-white/65 backdrop-blur-md border border-white/90 rounded-full px-3 py-1 shadow-2xs box-border">
            {/* Left: Filter dropdowns */}
            <div className="flex items-center gap-2 flex-wrap">
              <Filter className="w-3.5 h-3.5 text-[#102B50] shrink-0" />

              {/* Category Dropdown */}
              <div className="relative">
                <select
                  value={selectedCategory}
                  onChange={(e) => {
                    setSelectedCategory(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="appearance-none h-[28px] pl-2.5 pr-6 bg-white/85 hover:bg-white text-[#102B50] font-semibold text-[11px] rounded-full border border-white/90 shadow-2xs cursor-pointer focus:outline-none transition leading-tight"
                >
                  <option value="All Categories">All Categories</option>
                  <option value="Road Damage">Road Damage</option>
                  <option value="Waste Disposal">Waste Disposal</option>
                  <option value="Water Leakage">Water Leakage</option>
                  <option value="Street Light">Street Light</option>
                </select>
                <ChevronDown className="w-3 h-3 text-[#64748B] absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {/* Department Dropdown */}
              <div className="relative">
                <select
                  value={selectedDepartment}
                  onChange={(e) => {
                    setSelectedDepartment(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="appearance-none h-[28px] pl-2.5 pr-6 bg-white/85 hover:bg-white text-[#102B50] font-semibold text-[11px] rounded-full border border-white/90 shadow-2xs cursor-pointer focus:outline-none transition leading-tight"
                >
                  <option value="All Departments">All Departments</option>
                  <option value="Roads and Infrastructure">Roads & Infra</option>
                  <option value="Solid Waste Management">Solid Waste</option>
                  <option value="Water Supply and Sewerage">Water Supply</option>
                  <option value="Electrical">Electrical</option>
                </select>
                <ChevronDown className="w-3 h-3 text-[#64748B] absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {/* Date Range Button */}
              <button
                type="button"
                className="h-[28px] px-2.5 bg-white/85 hover:bg-white text-[#102B50] font-semibold text-[11px] rounded-full border border-white/90 shadow-2xs flex items-center gap-1.5 cursor-pointer transition leading-tight"
              >
                <Calendar className="w-3 h-3 text-[#102B50] shrink-0" />
                <span>Select Date Range</span>
                <ChevronDown className="w-3 h-3 text-[#64748B] shrink-0" />
              </button>
            </div>

            {/* Right: Search Input */}
            <div className="relative w-[190px] sm:w-[220px] h-[28px] rounded-full bg-white/85 hover:bg-white focus-within:bg-white border border-white/90 shadow-2xs backdrop-blur-md flex items-center px-2.5 transition box-border shrink-0">
              <Search className="w-3 h-3 text-[#64748B] mr-1.5 shrink-0 stroke-[2.2]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search complaint..."
                className="w-full bg-transparent text-[11px] text-[#0B1B3D] font-medium placeholder:text-[#64748B] focus:outline-none"
              />
            </div>
          </div>

          {/* C. VERIFICATION TABLE: Exact 25 complaints with exact ID and location */}
          <div className="rounded-[16px] bg-white/92 border border-white/95 shadow-xs mt-2.5 overflow-hidden flex flex-col box-border">
            {/* Table Header Tabs & Sort Sub-Row */}
            <div className="h-[34px] px-3.5 border-b border-[#E8EFF7] bg-[#F7FAFD]/80 flex items-center justify-between flex-wrap gap-2 select-none box-border">
              <div className="flex items-center gap-5">
                <button
                  type="button"
                  onClick={() => setActiveTab('pending')}
                  className={`text-[11px] pb-1 transition cursor-pointer relative ${
                    activeTab === 'pending'
                      ? 'font-black text-[#0B1B3D] border-b-2 border-[#0B1B3D]'
                      : 'font-semibold text-[#64748B] hover:text-[#0B1B3D]'
                  }`}
                >
                  Pending Verification (18)
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('verified')}
                  className={`text-[11px] pb-1 transition cursor-pointer ${
                    activeTab === 'verified'
                      ? 'font-black text-[#0B1B3D] border-b-2 border-[#0B1B3D]'
                      : 'font-semibold text-[#64748B] hover:text-[#0B1B3D]'
                  }`}
                >
                  Verified (126)
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('returned')}
                  className={`text-[11px] pb-1 transition cursor-pointer ${
                    activeTab === 'returned'
                      ? 'font-black text-[#0B1B3D] border-b-2 border-[#0B1B3D]'
                      : 'font-semibold text-[#64748B] hover:text-[#0B1B3D]'
                  }`}
                >
                  Returned (7)
                </button>
              </div>

              {/* Sort Pill */}
              <button
                type="button"
                onClick={() => setSortOrder(sortOrder === 'newest' ? 'oldest' : 'newest')}
                className="h-[24px] px-2 bg-white hover:bg-slate-50 text-[10px] font-semibold text-[#102B50] border border-slate-200/90 rounded-md flex items-center gap-1 cursor-pointer shadow-2xs transition"
              >
                <span>{sortOrder === 'newest' ? 'Newest First' : 'Oldest First'}</span>
                <ChevronDown className="w-3 h-3 text-[#64748B]" />
              </button>
            </div>

            {/* Table Grid */}
            <div className="w-full overflow-x-auto">
              <div className="w-full min-w-[960px]">
                {/* Column Headers */}
                <div className="grid grid-cols-[34px_65px_110px_minmax(210px,1.3fr)_130px_95px_80px_205px_26px] h-[32px] items-center px-3 text-[11px] font-bold text-[#486581] border-b border-[#E8EFF7] bg-[#F7FAFD]/90 box-border">
                  <div className="flex items-center justify-center">
                    <input
                      type="checkbox"
                      onChange={handleSelectAll}
                      checked={currentRows.length > 0 && selectedIds.size === currentRows.length}
                      className="w-3.5 h-3.5 rounded border-slate-300 text-[#0f766e] focus:ring-0 cursor-pointer"
                    />
                  </div>
                  <div>ID</div>
                  <div>Evidence (B/A)</div>
                  <div>Complaint Details</div>
                  <div>Location</div>
                  <div>Resolved On</div>
                  <div>Status</div>
                  <div>Action</div>
                  <div />
                </div>

                {/* Table Rows (Exact complaints matching complaint page: 1001, 1002, etc.) */}
                {currentRows.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 space-y-1.5">
                    <AlertCircle className="w-6 h-6 text-slate-400 mx-auto" />
                    <p className="text-xs font-semibold text-slate-700">No verification records match your filters.</p>
                    <p className="text-[10.5px] text-slate-400">Try resetting the category or search query.</p>
                  </div>
                ) : (
                  currentRows.map((item) => {
                    const isRowSelected = selectedIds.has(item.id);

                    return (
                      <div
                        key={item.id}
                        className={`grid grid-cols-[34px_65px_110px_minmax(210px,1.3fr)_130px_95px_80px_205px_26px] h-[45px] items-center px-3 border-b border-[#F0F4F8] transition-colors duration-150 box-border ${
                          isRowSelected ? 'bg-teal-50/50' : 'hover:bg-[#F8FAFC]'
                        }`}
                      >
                        {/* Checkbox */}
                        <div className="flex items-center justify-center">
                          <input
                            type="checkbox"
                            checked={isRowSelected}
                            onChange={() => handleToggleRow(item.id)}
                            className="w-3.5 h-3.5 rounded border-slate-300 text-[#0f766e] focus:ring-0 cursor-pointer"
                          />
                        </div>

                        {/* ID: Exact ID matching complaints page (1001, 1002, etc.) */}
                        <div className="font-bold text-[12px] font-mono text-[#102B50] tracking-tight">
                          {item.id}
                        </div>

                        {/* Before / After Evidence Thumbnails */}
                        <div className="flex items-center gap-1.5">
                          {/* Before Thumbnail */}
                          <div
                            className="relative w-[44px] h-[28px] rounded-[6px] overflow-hidden border border-slate-300 shadow-2xs cursor-pointer group shrink-0 bg-slate-900"
                            onClick={() =>
                              onOpenPhoto(item.beforePhotoUrl, item.description, item.location)
                            }
                            title="Click to view original before damage evidence"
                          >
                            <img
                              src={item.beforePhotoUrl}
                              alt="Before damage"
                              className="w-full h-full object-cover group-hover:scale-110 transition duration-200"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src =
                                  getCategoryFallbackPhoto(item.category, false);
                              }}
                            />
                            <span className="absolute top-0.5 left-0.5 bg-black/75 text-[7px] font-bold text-white px-1 py-0.2 rounded font-sans leading-tight">
                              Before
                            </span>
                          </div>

                          {/* After Thumbnail */}
                          <div
                            className="relative w-[44px] h-[28px] rounded-[6px] overflow-hidden border border-emerald-400 shadow-2xs cursor-pointer group shrink-0 bg-slate-900"
                            onClick={() =>
                              onOpenPhoto(item.afterPhotoUrl, `Repaired: ${item.description}`, item.location)
                            }
                            title="Click to view department after repair proof"
                          >
                            <img
                              src={item.afterPhotoUrl}
                              alt="After repair proof"
                              className="w-full h-full object-cover group-hover:scale-110 transition duration-200"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src =
                                  getCategoryFallbackPhoto(item.category, true);
                              }}
                            />
                            <span className="absolute top-0.5 left-0.5 bg-[#0f766e] text-[7px] font-bold text-white px-1 py-0.2 rounded font-sans leading-tight">
                              After
                            </span>
                          </div>
                        </div>

                        {/* Complaint Details: Exact title & detail matching complaints page */}
                        <div className="min-w-0 pr-2">
                          <div className="font-bold text-[11px] text-[#102B50] truncate leading-tight">
                            {item.title}
                          </div>
                          <div className="text-[9.5px] text-[#64748B] truncate leading-tight">
                            {item.description}
                          </div>
                        </div>

                        {/* Location: Exact location matching complaints page (Anna Salai, Velachery, etc.) */}
                        <div className="flex items-center gap-1 text-[11px] text-[#102B50] font-semibold truncate pr-1">
                          <MapPin className="w-3 h-3 text-[#64748B] shrink-0" />
                          <span className="truncate">{item.location}</span>
                        </div>

                        {/* Resolved On */}
                        <div className="flex items-center gap-1 text-[10.5px] text-[#64748B] whitespace-nowrap">
                          <Calendar className="w-3 h-3 text-[#94A3B8] shrink-0" />
                          <span>{item.resolvedOn}</span>
                        </div>

                        {/* Status */}
                        <div>
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 leading-none">
                            {item.status}
                          </span>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-1.5">
                          {/* Verify & Close */}
                          <button
                            type="button"
                            onClick={() => handleApprove(item.rawComplaintId)}
                            disabled={isProcessing === item.rawComplaintId}
                            className="bg-[#0f766e] hover:bg-[#0d5c58] text-white font-semibold text-[10px] px-2.5 py-1 rounded-lg shadow-2xs transition flex items-center gap-1 cursor-pointer whitespace-nowrap active:scale-95 disabled:opacity-50"
                          >
                            <Check className="w-3 h-3 stroke-[2.5]" />
                            <span>{isProcessing === item.rawComplaintId ? 'Closing...' : 'Verify & Close'}</span>
                          </button>

                          {/* Return for Review */}
                          <button
                            type="button"
                            onClick={() => {
                              setActiveRejectId(item.rawComplaintId);
                              setRejectionReason('');
                            }}
                            disabled={isProcessing === item.rawComplaintId}
                            className="bg-white hover:bg-slate-50 border border-slate-300 text-[#102B50] font-semibold text-[10px] px-2 py-1 rounded-lg shadow-2xs transition flex items-center gap-1 cursor-pointer whitespace-nowrap active:scale-95 disabled:opacity-50"
                          >
                            <RotateCcw className="w-3 h-3 text-[#64748B]" />
                            <span>Return for Review</span>
                          </button>
                        </div>

                        {/* More Menu */}
                        <div className="flex justify-end">
                          <button
                            type="button"
                            className="p-0.5 rounded hover:bg-slate-200 text-[#64748B] transition cursor-pointer"
                            title="More options"
                          >
                            <MoreVertical className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Pagination Footer */}
            <div className="h-[34px] px-3.5 border-t border-[#E8EFF7] bg-[#F7FAFD]/70 flex items-center justify-between flex-wrap gap-2 text-[10.5px] text-[#64748B] select-none box-border">
              <div className="font-medium text-[#64748B]">
                Showing {Math.min(1, currentRows.length)}–{Math.min(currentPage * pageSize, displayTotal)} of {displayTotal} pending verifications
              </div>

              <div className="flex items-center gap-1">
                {/* Previous Page */}
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  disabled={currentPage === 1}
                  className="p-1 rounded border border-slate-200 bg-white hover:bg-slate-50 text-[#64748B] cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs transition"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>

                {/* Page Numbers */}
                {Array.from({ length: totalPages }, (_, i) => i + 1).slice(0, 5).map((pageNum) => (
                  <button
                    key={pageNum}
                    type="button"
                    onClick={() => setCurrentPage(pageNum)}
                    className={`min-w-[22px] h-5 px-1.5 rounded text-[10.5px] font-semibold cursor-pointer transition shadow-2xs ${
                      currentPage === pageNum
                        ? 'bg-[#0f766e] text-white font-bold'
                        : 'border border-slate-200 bg-white hover:bg-slate-50 text-[#102B50] font-medium'
                    }`}
                  >
                    {pageNum}
                  </button>
                ))}

                {/* Next Page */}
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="p-1 rounded border border-slate-200 bg-white hover:bg-slate-50 text-[#64748B] cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs transition"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Return for Review Modal */}
      {activeRejectId && (
        <div className="fixed inset-0 z-[1200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="rounded-2xl max-w-md w-full p-5 bg-white/95 border border-slate-200 backdrop-blur-2xl space-y-3.5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Return for Review</h3>
                <p className="text-[11px] text-slate-500 font-mono mt-0.5">{activeRejectId}</p>
              </div>
              <button
                type="button"
                onClick={() => setActiveRejectId(null)}
                className="text-slate-400 hover:text-slate-700 text-sm cursor-pointer p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-[11px] text-slate-600 leading-relaxed">
              Returning this complaint will instruct the department to inspect the field site again, perform any missing rectification work, and resubmit new photographic evidence.
            </p>

            <form onSubmit={handleRejectSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-800 font-semibold mb-1 text-[11px]">
                  Inspection Remarks / Rectification Required
                </label>
                <textarea
                  required
                  rows={3}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="e.g., Tarmac compaction uneven; loose gravel remains across pedestrian crossing. Re-roller required."
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-900 placeholder-slate-400 focus:border-[#0f766e] focus:ring-1 focus:ring-[#0f766e]/30 focus:outline-none text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setActiveRejectId(null)}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 font-medium text-xs cursor-pointer transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!rejectionReason.trim() || isProcessing === activeRejectId}
                  className="px-3.5 py-1.5 rounded-lg bg-[#0f766e] text-white font-bold hover:bg-[#0d5c58] text-xs transition shadow-sm disabled:opacity-50 cursor-pointer"
                >
                  {isProcessing === activeRejectId ? 'Returning...' : 'Confirm Return'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
