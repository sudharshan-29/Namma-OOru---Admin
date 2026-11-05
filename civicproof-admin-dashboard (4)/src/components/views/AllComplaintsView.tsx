import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Search,
  SlidersHorizontal,
  Plus,
  ChevronDown,
  Calendar,
  MapPin,
  Activity,
  Flag,
  Landmark,
  ArrowUpDown,
  CheckCircle2,
  ChevronsUp,
  BarChart2,
  Leaf,
  Zap,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  Check,
  ArrowLeftRight,
  X,
} from 'lucide-react';
import type {
  Complaint,
  ComplaintCategory,
  ComplaintPriority,
  ComplaintStatus,
  DepartmentName,
} from '../../types/civic';
import type { ComplaintsQueryParams } from '../../api/client';

interface AllComplaintsViewProps {
  complaints: Complaint[];
  total: number;
  page: number;
  totalPages: number;
  limit: number;
  isLoading: boolean;
  queryParams: ComplaintsQueryParams;
  onFilterChange: (newParams: Partial<ComplaintsQueryParams>) => void;
  onSelectComplaint: (complaint: Complaint) => void;
  onOpenPhoto: (url: string, title: string, subtitle?: string) => void;
  onRefresh: () => void;
  onOpenReportIssue?: () => void;
  onReassignComplaint?: (id: string, newDept: DepartmentName, reason: string) => Promise<void>;
}

// Exact Sample Complaints adhering strictly to user design reference
import {
  REFERENCE_SAMPLE_ROWS,
  type SampleComplaintRow,
  getCategoryFallbackPhoto,
} from '../../data/canonicalComplaints';

export const AllComplaintsView: React.FC<AllComplaintsViewProps> = ({
  complaints,
  total,
  page,
  totalPages,
  limit,
  isLoading,
  queryParams,
  onFilterChange,
  onSelectComplaint,
  onOpenPhoto,
  onRefresh,
  onOpenReportIssue,
  onReassignComplaint,
}) => {
  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState(queryParams.search || '');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [dateFilter, setDateFilter] = useState<string>('Date');
  const [statusFilter, setStatusFilter] = useState<string>('Status');
  const [priorityFilter, setPriorityFilter] = useState<string>('Priority');
  const [departmentFilter, setDepartmentFilter] = useState<string>('Department');
  const [sortBy, setSortBy] = useState<string>('Newest First');

  // Dropdown open states
  const [activeDropdown, setActiveDropdown] = useState<
    'date' | 'status' | 'priority' | 'department' | 'sort' | null
  >(null);

  // Checkbox selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Pagination
  const [activePage, setActivePage] = useState<number>(1);

  // Local state for administrative reassignments
  const [reassignedDepts, setReassignedDepts] = useState<
    Record<
      string,
      {
        shortDept: 'Roads' | 'Sanitation' | 'Water Supply' | 'Electricity';
        fullDept: DepartmentName;
      }
    >
  >({});

  // Reassignment Modal State
  const [reassignModalOpen, setReassignModalOpen] = useState(false);
  const [targetRow, setTargetRow] = useState<SampleComplaintRow | null>(null);
  const [newDepartment, setNewDepartment] = useState<DepartmentName>(
    'Roads and Infrastructure Department'
  );
  const [reassignReason, setReassignReason] = useState('');
  const [isSubmittingReassign, setIsSubmittingReassign] = useState(false);

  const shortToFullDeptName = (short: string): DepartmentName => {
    if (short === 'Roads') return 'Roads and Infrastructure Department';
    if (short === 'Sanitation') return 'Solid Waste Management Department';
    if (short === 'Water Supply') return 'Water Supply and Sewerage Department';
    return 'Roads and Infrastructure Department';
  };

  const handleOpenReassign = (row: SampleComplaintRow) => {
    setTargetRow(row);
    const currentShort = reassignedDepts[row.id]?.shortDept || row.department;
    if (currentShort === 'Roads') {
      setNewDepartment('Solid Waste Management Department');
    } else if (currentShort === 'Sanitation') {
      setNewDepartment('Water Supply and Sewerage Department');
    } else {
      setNewDepartment('Roads and Infrastructure Department');
    }
    setReassignReason('');
    setReassignModalOpen(true);
  };

  const handleConfirmReassign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetRow || !reassignReason.trim()) return;

    setIsSubmittingReassign(true);
    try {
      let newShort: 'Roads' | 'Sanitation' | 'Water Supply' | 'Electricity' = 'Roads';
      if (newDepartment === 'Solid Waste Management Department') newShort = 'Sanitation';
      else if (newDepartment === 'Water Supply and Sewerage Department') newShort = 'Water Supply';
      else newShort = 'Roads';

      setReassignedDepts((prev) => ({
        ...prev,
        [targetRow.id]: {
          shortDept: newShort,
          fullDept: newDepartment,
        },
      }));

      if (onReassignComplaint) {
        await onReassignComplaint(targetRow.fullId, newDepartment, reassignReason);
      }
      setReassignModalOpen(false);
    } catch (err) {
      console.error('Reassignment error:', err);
    } finally {
      setIsSubmittingReassign(false);
    }
  };

  // Ref for click outside dropdowns
  const dropdownRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setActiveDropdown(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter complaints based on search and filters
  const displayedRows = useMemo(() => {
    return REFERENCE_SAMPLE_ROWS.filter((row) => {
      const effectiveDept = reassignedDepts[row.id]?.shortDept || row.department;

      // Search filter
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matches =
          row.id.includes(q) ||
          row.detail.toLowerCase().includes(q) ||
          row.location.toLowerCase().includes(q) ||
          effectiveDept.toLowerCase().includes(q);
        if (!matches) return false;
      }

      // Category card filter
      if (selectedCategory && row.category !== selectedCategory) {
        return false;
      }

      // Status filter
      if (statusFilter !== 'Status' && row.status !== statusFilter) {
        return false;
      }

      // Priority filter
      if (priorityFilter !== 'Priority' && row.priority !== priorityFilter) {
        return false;
      }

      // Department filter
      if (departmentFilter !== 'Department' && effectiveDept !== departmentFilter) {
        return false;
      }

      return true;
    });
  }, [searchTerm, selectedCategory, statusFilter, priorityFilter, departmentFilter, reassignedDepts]);

  // Pagination: 5 rows per page matching reference design
  const pageSize = 5;
  const totalDisplayPages = Math.ceil(displayedRows.length / pageSize) || 1;
  const pagedRows = useMemo(() => {
    const start = (activePage - 1) * pageSize;
    return displayedRows.slice(start, start + pageSize);
  }, [displayedRows, activePage, pageSize]);

  // Handle select all checkbox
  const isAllSelected =
    pagedRows.length > 0 && pagedRows.every((r) => selectedIds.has(r.id));
  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(pagedRows.map((r) => r.id)));
    }
  };

  const toggleSelectRow = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  // User requested: in complaints page, clicking complaints should NOT open this card (only in Department Assignment)
  const handleView = (row: SampleComplaintRow) => {
    toggleSelectRow(row.id);
  };

  // Apple VisionOS liquid glass card enclosure:
  // Crystal translucency, high-refraction caustic blur, beveled meniscus edge, specular light catch
  const GLASS_ENCLOSURE_STYLE: React.CSSProperties = {
    background:
      'linear-gradient(135deg, rgba(255, 255, 255, 0.16) 0%, rgba(255, 255, 255, 0.02) 40%, rgba(0, 0, 0, 0.20) 100%)',
    backdropFilter: 'blur(32px) saturate(220%) contrast(106%)',
    WebkitBackdropFilter: 'blur(32px) saturate(220%) contrast(106%)',
    border: '1.5px solid rgba(255, 255, 255, 0.38)',
    borderRadius: '26px',
    boxShadow:
      '0 30px 65px -10px rgba(0, 0, 0, 0.55), ' +
      '0 12px 24px -4px rgba(0, 0, 0, 0.35), ' +
      '0 0 1px 1px rgba(255, 255, 255, 0.18), ' +
      'inset 0 2px 3px rgba(255, 255, 255, 0.75), ' +
      'inset 0 -2px 3.5px rgba(0, 0, 0, 0.55), ' +
      'inset 2px 0 3.5px rgba(255, 255, 255, 0.35), ' +
      'inset -2px 0 3.5px rgba(255, 255, 255, 0.25), ' +
      'inset 0 0 24px rgba(255, 255, 255, 0.08)',
  };

  return (
    <div
      className="w-full h-full relative flex flex-col justify-end select-none overflow-hidden"
      style={{
        backgroundImage: "url('/images/complaints-backdrop.jpg')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
        backgroundRepeat: 'no-repeat',
      }}
    >
      {/* Centered Page Container: Balanced width (1080px max) placed DOWN near bottom without column gaps */}
      <div className="w-[calc(100%-36px)] sm:w-[calc(100%-48px)] xl:w-[calc(100%-60px)] max-w-[1080px] mx-auto pb-3 sm:pb-4 xl:pb-5 flex flex-col box-border">
        
        {/* 1. PAGE HEADING: Only "Complaints" with vibrant cyan underline, framed over backdrop */}
        <div className="w-full flex items-center justify-between relative z-10 box-border mb-2 sm:mb-2.5 px-0.5">
          <div className="flex flex-col justify-center">
            <h1
              className="text-[28px] sm:text-[30px] font-black text-[#0B1B3D] tracking-tight leading-none"
              style={{
                fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                textShadow: '0 1px 2px rgba(255, 255, 255, 0.90)',
              }}
            >
              Complaints
            </h1>
            <div className="w-10 h-[3px] rounded-full bg-gradient-to-r from-[#0B1B3D] via-[#00B4D8] to-[#00E5FF] mt-1 shadow-xs" />
          </div>
        </div>

        {/* 2. SINGLE OUTER 3D FLOATING CRYSTAL GLASS ENCLOSURE CARD (Balanced, not over-expanded) */}
        <div
          style={GLASS_ENCLOSURE_STYLE}
          className="w-full p-2.5 sm:p-3 xl:p-3.5 flex flex-col relative z-10 box-border"
        >
          {/* A. 5 CATEGORY SUMMARY CARDS: Balanced height, no chevron button */}
          <div className="w-full grid grid-cols-5 gap-2 sm:gap-2.5 box-border">
            {/* Card 1: Road Damage — 56 */}
            <div
              onClick={() => {
                setSelectedCategory(selectedCategory === 'Road Damage' ? null : 'Road Damage');
                setActivePage(1);
              }}
              className={`h-[60px] sm:h-[64px] rounded-[14px] px-2.5 xl:px-3 py-2 flex items-center gap-2.5 border shadow-xs backdrop-blur-md transition-all duration-200 cursor-pointer select-none box-border ${
                selectedCategory === 'Road Damage'
                  ? 'border-[#0284C7] ring-2 ring-[#0284C7]/30 scale-[1.01]'
                  : 'border-white/85 hover:-translate-y-0.5'
              }`}
              style={{
                background:
                  'linear-gradient(135deg, rgba(215, 238, 255, 0.88) 0%, rgba(235, 246, 255, 0.75) 100%)',
              }}
            >
              <div className="w-[38px] h-[38px] flex items-center justify-center shrink-0">
                <img
                  src="/images/icon_subject_road.png"
                  alt="Road Damage"
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="flex flex-col min-w-0 justify-center">
                <span className="text-[11.5px] xl:text-[12px] font-semibold text-[#102B50] leading-tight whitespace-nowrap">
                  Road Damage
                </span>
                <span className="text-[19px] xl:text-[21px] font-bold text-[#102B50] leading-none mt-0.5">
                  56
                </span>
              </div>
            </div>

            {/* Card 2: Waste Disposal — 43 */}
            <div
              onClick={() => {
                setSelectedCategory(selectedCategory === 'Waste Disposal' ? null : 'Waste Disposal');
                setActivePage(1);
              }}
              className={`h-[60px] sm:h-[64px] rounded-[14px] px-2.5 xl:px-3 py-2 flex items-center gap-2.5 border shadow-xs backdrop-blur-md transition-all duration-200 cursor-pointer select-none box-border ${
                selectedCategory === 'Waste Disposal'
                  ? 'border-[#F04452] ring-2 ring-[#F04452]/30 scale-[1.01]'
                  : 'border-white/85 hover:-translate-y-0.5'
              }`}
              style={{
                background:
                  'linear-gradient(135deg, rgba(255, 228, 232, 0.88) 0%, rgba(255, 242, 244, 0.75) 100%)',
              }}
            >
              <div className="w-[38px] h-[38px] flex items-center justify-center shrink-0">
                <img
                  src="/images/icon_subject_waste.png"
                  alt="Waste Disposal"
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="flex flex-col min-w-0 justify-center">
                <span className="text-[11.5px] xl:text-[12px] font-semibold text-[#102B50] leading-tight whitespace-nowrap">
                  Waste Disposal
                </span>
                <span className="text-[19px] xl:text-[21px] font-bold text-[#102B50] leading-none mt-0.5">
                  43
                </span>
              </div>
            </div>

            {/* Card 3: Water Leakage — 38 */}
            <div
              onClick={() => {
                setSelectedCategory(selectedCategory === 'Water Leakage' ? null : 'Water Leakage');
                setActivePage(1);
              }}
              className={`h-[60px] sm:h-[64px] rounded-[14px] px-2.5 xl:px-3 py-2 flex items-center gap-2.5 border shadow-xs backdrop-blur-md transition-all duration-200 cursor-pointer select-none box-border ${
                selectedCategory === 'Water Leakage'
                  ? 'border-[#0096C7] ring-2 ring-[#0096C7]/30 scale-[1.01]'
                  : 'border-white/85 hover:-translate-y-0.5'
              }`}
              style={{
                background:
                  'linear-gradient(135deg, rgba(210, 247, 255, 0.88) 0%, rgba(235, 252, 255, 0.75) 100%)',
              }}
            >
              <div className="w-[38px] h-[38px] flex items-center justify-center shrink-0">
                <img
                  src="/images/icon_subject_water.png"
                  alt="Water Leakage"
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="flex flex-col min-w-0 justify-center">
                <span className="text-[11.5px] xl:text-[12px] font-semibold text-[#102B50] leading-tight whitespace-nowrap">
                  Water Leakage
                </span>
                <span className="text-[19px] xl:text-[21px] font-bold text-[#102B50] leading-none mt-0.5">
                  38
                </span>
              </div>
            </div>

            {/* Card 4: Street Light Issue — 32 */}
            <div
              onClick={() => {
                setSelectedCategory(
                  selectedCategory === 'Street Light Issue' ? null : 'Street Light Issue'
                );
                setActivePage(1);
              }}
              className={`h-[60px] sm:h-[64px] rounded-[14px] px-2.5 xl:px-3 py-2 flex items-center gap-2.5 border shadow-xs backdrop-blur-md transition-all duration-200 cursor-pointer select-none box-border ${
                selectedCategory === 'Street Light Issue'
                  ? 'border-[#D97706] ring-2 ring-[#D97706]/30 scale-[1.01]'
                  : 'border-white/85 hover:-translate-y-0.5'
              }`}
              style={{
                background:
                  'linear-gradient(135deg, rgba(254, 244, 226, 0.88) 0%, rgba(255, 250, 240, 0.75) 100%)',
              }}
            >
              <div className="w-[38px] h-[38px] flex items-center justify-center shrink-0">
                <img
                  src="/images/icon_subject_lamp.png"
                  alt="Street Light Issue"
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="flex flex-col min-w-0 justify-center">
                <span className="text-[11.5px] xl:text-[12px] font-semibold text-[#102B50] leading-tight whitespace-nowrap">
                  Street Light Issue
                </span>
                <span className="text-[19px] xl:text-[21px] font-bold text-[#102B50] leading-none mt-0.5">
                  32
                </span>
              </div>
            </div>

            {/* Card 5: Other — 17 */}
            <div
              onClick={() => {
                setSelectedCategory(selectedCategory === 'Other' ? null : 'Other');
                setActivePage(1);
              }}
              className={`h-[60px] sm:h-[64px] rounded-[14px] px-2.5 xl:px-3 py-2 flex items-center gap-2.5 border shadow-xs backdrop-blur-md transition-all duration-200 cursor-pointer select-none box-border ${
                selectedCategory === 'Other'
                  ? 'border-[#7C3AED] ring-2 ring-[#7C3AED]/30 scale-[1.01]'
                  : 'border-white/85 hover:-translate-y-0.5'
              }`}
              style={{
                background:
                  'linear-gradient(135deg, rgba(240, 234, 255, 0.88) 0%, rgba(248, 244, 255, 0.75) 100%)',
              }}
            >
              <div className="w-[38px] h-[38px] flex items-center justify-center shrink-0">
                <img
                  src="/images/icon_subject_other.png"
                  alt="Other"
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="flex flex-col min-w-0 justify-center">
                <span className="text-[11.5px] xl:text-[12px] font-semibold text-[#102B50] leading-tight whitespace-nowrap">
                  Other
                </span>
                <span className="text-[19px] xl:text-[21px] font-bold text-[#102B50] leading-none mt-0.5">
                  17
                </span>
              </div>
            </div>
          </div>

          {/* B. FILTER & SEARCH CONTROL ROW: Proportional pills */}
          <div className="w-full flex items-center justify-between gap-2.5 mt-2.5 box-border">
            {/* Left: 5 Filter Pills */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* 1. Date Filter */}
              <div className="relative">
                <button
                  onClick={() =>
                    setActiveDropdown(activeDropdown === 'date' ? null : 'date')
                  }
                  className="h-[34px] px-3 rounded-full bg-white/90 hover:bg-white text-[#102B50] font-semibold text-[11.5px] border border-white/90 shadow-2xs backdrop-blur-md flex items-center gap-1.5 transition cursor-pointer box-border"
                >
                  <Calendar className="w-3.5 h-3.5 text-[#102B50]" />
                  <span>{dateFilter}</span>
                  <ChevronDown className="w-3 h-3 text-[#64748B]" />
                </button>
                {activeDropdown === 'date' && (
                  <div className="absolute top-[38px] left-0 w-40 rounded-xl bg-white/95 p-1.5 shadow-xl border border-white/90 backdrop-blur-xl z-50 text-xs">
                    {['Date', 'Today', 'Last 7 Days', 'Last 30 Days', 'October 2025'].map((d) => (
                      <button
                        key={d}
                        onClick={() => {
                          setDateFilter(d);
                          setActiveDropdown(null);
                          setActivePage(1);
                        }}
                        className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-[#0a4870]/10 text-[#102B50] font-medium transition cursor-pointer"
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* 2. Status Filter */}
              <div className="relative">
                <button
                  onClick={() =>
                    setActiveDropdown(activeDropdown === 'status' ? null : 'status')
                  }
                  className="h-[34px] px-3 rounded-full bg-white/90 hover:bg-white text-[#102B50] font-semibold text-[11.5px] border border-white/90 shadow-2xs backdrop-blur-md flex items-center gap-1.5 transition cursor-pointer box-border"
                >
                  <Activity className="w-3.5 h-3.5 text-[#102B50]" />
                  <span>{statusFilter}</span>
                  <ChevronDown className="w-3 h-3 text-[#64748B]" />
                </button>
                {activeDropdown === 'status' && (
                  <div className="absolute top-[38px] left-0 w-40 rounded-xl bg-white/95 p-1.5 shadow-xl border border-white/90 backdrop-blur-xl z-50 text-xs">
                    {['Status', 'Unresolved', 'In Progress', 'Resolved'].map((st) => (
                      <button
                        key={st}
                        onClick={() => {
                          setStatusFilter(st);
                          setActiveDropdown(null);
                          setActivePage(1);
                        }}
                        className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-[#0a4870]/10 text-[#102B50] font-medium transition cursor-pointer"
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* 4. Priority Filter */}
              <div className="relative">
                <button
                  onClick={() =>
                    setActiveDropdown(activeDropdown === 'priority' ? null : 'priority')
                  }
                  className="h-[34px] px-3 rounded-full bg-white/90 hover:bg-white text-[#102B50] font-semibold text-[11.5px] border border-white/90 shadow-2xs backdrop-blur-md flex items-center gap-1.5 transition cursor-pointer box-border"
                >
                  <Flag className="w-3.5 h-3.5 text-[#102B50]" />
                  <span>{priorityFilter}</span>
                  <ChevronDown className="w-3 h-3 text-[#64748B]" />
                </button>
                {activeDropdown === 'priority' && (
                  <div className="absolute top-[38px] left-0 w-36 rounded-xl bg-white/95 p-1.5 shadow-xl border border-white/90 backdrop-blur-xl z-50 text-xs">
                    {['Priority', 'High', 'Medium', 'Low'].map((pr) => (
                      <button
                        key={pr}
                        onClick={() => {
                          setPriorityFilter(pr);
                          setActiveDropdown(null);
                          setActivePage(1);
                        }}
                        className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-[#0a4870]/10 text-[#102B50] font-medium transition cursor-pointer"
                      >
                        {pr}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* 5. Department Filter */}
              <div className="relative">
                <button
                  onClick={() =>
                    setActiveDropdown(activeDropdown === 'department' ? null : 'department')
                  }
                  className="h-[34px] px-3 rounded-full bg-white/90 hover:bg-white text-[#102B50] font-semibold text-[11.5px] border border-white/90 shadow-2xs backdrop-blur-md flex items-center gap-1.5 transition cursor-pointer box-border"
                >
                  <Landmark className="w-3.5 h-3.5 text-[#102B50]" />
                  <span>{departmentFilter}</span>
                  <ChevronDown className="w-3 h-3 text-[#64748B]" />
                </button>
                {activeDropdown === 'department' && (
                  <div className="absolute top-[38px] left-0 w-44 rounded-xl bg-white/95 p-1.5 shadow-xl border border-white/90 backdrop-blur-xl z-50 text-xs">
                    {['Department', 'Roads', 'Sanitation', 'Water Supply', 'Electricity'].map((dept) => (
                      <button
                        key={dept}
                        onClick={() => {
                          setDepartmentFilter(dept);
                          setActiveDropdown(null);
                          setActivePage(1);
                        }}
                        className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-[#0a4870]/10 text-[#102B50] font-medium transition cursor-pointer"
                      >
                        {dept}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right: Search Input Pill */}
            <div className="relative w-[220px] sm:w-[250px] h-[34px] rounded-full bg-white/90 hover:bg-white focus-within:bg-white border border-white/90 shadow-2xs backdrop-blur-md flex items-center px-3 transition box-border shrink-0">
              <Search className="w-3.5 h-3.5 text-[#486581] mr-2 shrink-0 stroke-[2.2]" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setActivePage(1);
                  onFilterChange({ search: e.target.value, page: 1 });
                }}
                placeholder="Search complaints..."
                className="w-full bg-transparent text-[11.5px] text-[#0B1B3D] font-medium placeholder:text-[#64748B] focus:outline-none"
              />
            </div>
          </div>

          {/* C. COMPLAINTS TABLE: Fitted columns without unwanted space */}
          <div className="rounded-[16px] bg-white/92 border border-white/95 shadow-xs mt-2.5 overflow-hidden flex flex-col box-border">
            <div className="w-full overflow-x-auto">
              <div className="w-full min-w-[960px]">
                {/* Header Row: Calibrated column template with 10 columns including Action */}
                <div className="grid grid-cols-[36px_45px_65px_minmax(190px,1fr)_120px_105px_70px_120px_110px_95px] h-[34px] items-center px-3 text-[11.5px] font-bold text-[#486581] border-b border-[#E8EFF7] bg-[#F7FAFD]/80 box-border">
                  <div className="flex items-center justify-center">
                    <input
                      type="checkbox"
                      checked={isAllSelected}
                      onChange={toggleSelectAll}
                      className="w-3.5 h-3.5 rounded border-slate-300 text-[#3A0F34] focus:ring-0 cursor-pointer"
                    />
                  </div>
                  <div className="text-left font-bold text-[#486581]">#</div>
                  <div className="text-left font-bold text-[#486581]">Photo</div>
                  <div className="text-left font-bold text-[#486581] flex items-center gap-1">
                    <span>Complaint Details</span>
                    <span className="text-[10px] text-[#64748B]">⇅</span>
                  </div>
                  <div className="text-left font-bold text-[#486581] flex items-center gap-1">
                    <span>Location</span>
                    <span className="text-[10px] text-[#64748B]">⇅</span>
                  </div>
                  <div className="text-left font-bold text-[#486581] flex items-center gap-1">
                    <span>Status</span>
                    <span className="text-[10px] text-[#64748B]">⇅</span>
                  </div>
                  <div className="text-left font-bold text-[#486581] flex items-center gap-1">
                    <span>Priority</span>
                    <span className="text-[10px] text-[#64748B]">⇅</span>
                  </div>
                  <div className="text-left font-bold text-[#486581] flex items-center gap-1">
                    <span>Department</span>
                    <span className="text-[10px] text-[#64748B]">⇅</span>
                  </div>
                  <div className="text-left font-bold text-[#486581] flex items-center gap-1">
                    <span>Date</span>
                    <span className="text-[10px] text-[#64748B]">⇅</span>
                  </div>
                  <div className="text-center font-bold text-[#486581]">Action</div>
                </div>

                {/* Rows: 46px height with clean, comfortable typography and Reassign Action */}
                <div className="divide-y divide-[#EDF2F7]">
                  {pagedRows.map((row) => {
                    const effectiveDept = reassignedDepts[row.id]?.shortDept || row.department;

                    return (
                      <div
                        key={row.id}
                        onClick={() => toggleSelectRow(row.id)}
                        className={`grid grid-cols-[36px_45px_65px_minmax(190px,1fr)_120px_105px_70px_120px_110px_95px] h-[46px] items-center px-3 hover:bg-[#F8FAFC] transition-colors cursor-pointer select-none box-border ${
                          selectedIds.has(row.id) ? 'bg-[#F0F8FA]' : ''
                        }`}
                      >
                        {/* 1. Checkbox */}
                        <div
                          className="flex items-center justify-center"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleSelectRow(row.id);
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={selectedIds.has(row.id)}
                            onChange={() => {}}
                            className="w-3.5 h-3.5 rounded border-slate-300 text-[#3A0F34] focus:ring-0 cursor-pointer"
                          />
                        </div>

                        {/* 2. ID */}
                        <div className="font-bold text-[#102B50] text-[12.5px]">{row.id}</div>

                        {/* 3. Photo Thumbnail */}
                        <div
                          className="shrink-0 flex items-center"
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenPhoto(row.photo, row.detail, row.location);
                          }}
                        >
                          <img
                            src={row.photo}
                            alt={row.detail}
                            className="w-[48px] h-[30px] rounded-md object-cover border border-white/90 shadow-2xs hover:scale-105 transition"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = getCategoryFallbackPhoto(row.category, false);
                            }}
                          />
                        </div>

                        {/* 4. Complaint Detail */}
                        <div className="font-semibold text-[#102B50] text-[12.5px] truncate pr-2">
                          {row.detail}
                        </div>

                        {/* 5. Location */}
                        <div className="flex items-center gap-1.5 text-[#102B50] font-medium text-[12px] truncate pr-1">
                          <MapPin className="w-3.5 h-3.5 text-[#102B50] shrink-0 fill-[#102B50]/15" />
                          <span className="truncate">{row.location}</span>
                        </div>

                        {/* 6. Status Badge */}
                        <div className="flex items-center">
                          {row.status === 'Unresolved' ? (
                            <div className="h-[24px] inline-flex items-center gap-1.5 px-2.5 rounded-full bg-[#FFEBEF] text-[#E02424] border border-[#FFCCD4] text-[11px] font-bold shadow-2xs whitespace-nowrap">
                              <svg className="w-3 h-3 flex-shrink-0" viewBox="0 0 16 16" fill="none">
                                <path d="M8 1L15 8L8 15L1 8L8 1Z" fill="#E02424" />
                                <path d="M8 4.5V8.5M8 11V11.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
                              </svg>
                              <span>Unresolved</span>
                            </div>
                          ) : row.status === 'In Progress' ? (
                            <div className="h-[24px] inline-flex items-center gap-1.5 px-2.5 rounded-full bg-[#FFF4E5] text-[#D97706] border border-[#FFE0B2] text-[11px] font-bold shadow-2xs whitespace-nowrap">
                              <svg className="w-3 h-3 flex-shrink-0" viewBox="0 0 16 16" fill="none">
                                <circle cx="8" cy="8" r="6" stroke="#F59E0B" strokeWidth="2.2" strokeLinecap="round" strokeDasharray="5 3.5" />
                              </svg>
                              <span>In Progress</span>
                            </div>
                          ) : (
                            <div className="h-[24px] inline-flex items-center gap-1.5 px-2.5 rounded-full bg-[#E6F7F5] text-[#0D9488] border border-[#B2EBF2] text-[11px] font-bold shadow-2xs whitespace-nowrap">
                              <svg className="w-3 h-3 flex-shrink-0" viewBox="0 0 16 16" fill="none">
                                <circle cx="8" cy="8" r="7" fill="#0D9488" />
                                <path d="M4.8 8.2L6.8 10.2L11.2 5.8" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                              <span>Resolved</span>
                            </div>
                          )}
                        </div>

                        {/* 7. Priority */}
                        <div className="flex items-center">
                          {row.status === 'Resolved' || row.priority === '\u2014' ? (
                            <span className="text-[#64748B] font-bold text-xs block text-center w-6 select-none">
                              –
                            </span>
                          ) : row.priority === 'High' ? (
                            <span className="text-[#E02424] font-bold text-[11.5px] whitespace-nowrap">
                              High
                            </span>
                          ) : row.priority === 'Medium' ? (
                            <span className="text-[#D97706] font-bold text-[11.5px] whitespace-nowrap">
                              Medium
                            </span>
                          ) : (
                            <span className="text-[#0284C7] font-bold text-[11.5px] whitespace-nowrap">
                              Low
                            </span>
                          )}
                        </div>

                        {/* 8. Department */}
                        <div className="flex items-center">
                          {effectiveDept === 'Roads' ? (
                            <div className="h-[24px] inline-flex items-center gap-1.5 px-2.5 rounded-lg bg-[#EBF5FB] text-[#102B50] border border-[#D0E7F9] text-[11.5px] font-semibold whitespace-nowrap">
                              <svg className="w-3 h-3 flex-shrink-0" viewBox="0 0 16 16" fill="none">
                                <path d="M3.5 14.5L6 1.5H10L12.5 14.5H3.5Z" fill="#102B50" />
                                <path d="M8 4V6M8 8V10M8 12V13" stroke="white" strokeWidth="1.2" strokeLinecap="round" />
                              </svg>
                              <span>Roads</span>
                            </div>
                          ) : effectiveDept === 'Sanitation' ? (
                            <div className="h-[24px] inline-flex items-center gap-1.5 px-2.5 rounded-lg bg-[#EDF9F6] text-[#102B50] border border-[#C6EFE7] text-[11.5px] font-semibold whitespace-nowrap">
                              <Leaf className="w-3 h-3 text-[#0D9488] fill-[#0D9488] shrink-0" />
                              <span>Sanitation</span>
                            </div>
                          ) : effectiveDept === 'Water Supply' ? (
                            <div className="h-[24px] inline-flex items-center gap-1.5 px-2.5 rounded-lg bg-[#EBF5FB] text-[#102B50] border border-[#D0E7F9] text-[11.5px] font-semibold whitespace-nowrap">
                              <svg className="w-3 h-3 flex-shrink-0" viewBox="0 0 16 16" fill="none">
                                <path d="M2.5 7H10C11.1 7 12 7.9 12 9V10H7.5V9C7.5 8.2 7 7.8 6.5 7.8H2.5V7Z" fill="#0284C7" />
                                <rect x="1.5" y="5" width="2" height="4" rx="0.5" fill="#0284C7" />
                                <circle cx="9.8" cy="12.5" r="1.3" fill="#0284C7" />
                              </svg>
                              <span>Water Supply</span>
                            </div>
                          ) : (
                            <div className="h-[24px] inline-flex items-center gap-1.5 px-2.5 rounded-lg bg-[#F3EFFD] text-[#102B50] border border-[#E0D7FA] text-[11.5px] font-semibold whitespace-nowrap">
                              <Zap className="w-3 h-3 text-[#7C3AED] fill-[#7C3AED] shrink-0" />
                              <span>Electricity</span>
                            </div>
                          )}
                        </div>

                        {/* 9. Date & Time */}
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 flex-shrink-0 text-[#102B50]" />
                          <div className="flex flex-col text-[11.5px] text-[#102B50] font-medium leading-tight">
                            <span>{row.date}</span>
                            <span className="text-[10px] text-[#486581]">{row.time}</span>
                          </div>
                        </div>

                        {/* 10. Action: Reassign Button matching user reference image exactly */}
                        <div className="flex items-center justify-center">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenReassign(row);
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1 text-[11px] font-bold text-[#0284C7] bg-[#E0F2FE] hover:bg-[#BAE6FD] border border-sky-200 rounded-full transition shadow-2xs cursor-pointer active:scale-95 whitespace-nowrap"
                            title="Reassign department"
                          >
                            <ArrowLeftRight className="w-3 h-3 stroke-[2.2]" />
                            <span>Reassign</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}

                  {displayedRows.length === 0 && (
                    <div className="py-8 text-center text-[#486581] font-medium text-xs">
                      No complaints match the selected filters or search query.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* D. FOOTER & PAGINATION: Balanced pagination footer */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2.5 px-1 mt-0.5 box-border">
            <div className="text-[11.5px] font-semibold text-[#102B50]">
              Showing {displayedRows.length === 0 ? 0 : (activePage - 1) * pageSize + 1}–{Math.min(activePage * pageSize, displayedRows.length)} of {displayedRows.length} complaints
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setActivePage((p) => Math.max(1, p - 1))}
                disabled={activePage === 1}
                className="w-[30px] h-[30px] rounded-lg bg-white/90 hover:bg-white disabled:opacity-40 text-[#102B50] border border-white/90 shadow-2xs flex items-center justify-center font-bold text-[11.5px] transition cursor-pointer"
                title="Previous Page"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              {Array.from({ length: totalDisplayPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setActivePage(p)}
                  className={`w-[30px] h-[30px] rounded-lg font-medium text-[11.5px] shadow-2xs flex items-center justify-center transition cursor-pointer ${
                    activePage === p
                      ? 'bg-[#3A0F34] text-white font-bold'
                      : 'bg-white/90 hover:bg-white text-[#102B50] border border-white/90'
                  }`}
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() => setActivePage((p) => Math.min(totalDisplayPages, p + 1))}
                disabled={activePage === totalDisplayPages}
                className="w-[30px] h-[30px] rounded-lg bg-white/90 hover:bg-white disabled:opacity-40 text-[#102B50] border border-white/90 shadow-2xs flex items-center justify-center font-bold text-[11.5px] transition cursor-pointer"
                title="Next Page"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Administrative Reassignment Modal */}
      {reassignModalOpen && targetRow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
          <div className="rounded-3xl max-w-md w-full p-5 bg-white/95 border border-white/90 shadow-2xl space-y-3.5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div>
                <h3 className="font-bold text-[#102B50] text-sm">Administrative Reassignment</h3>
                <p className="text-[11px] text-[#0284C7] font-mono font-semibold">
                  Complaint #{targetRow.id} ({targetRow.fullId})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setReassignModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 text-sm p-1 rounded-lg transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmReassign} className="space-y-3 text-xs">
              <div className="p-2.5 bg-[#F0F8FF] rounded-xl border border-sky-100 text-[#102B50] space-y-1">
                <div>
                  <span className="text-[#64748B]">Current Assignment:</span>{' '}
                  <strong className="text-[#102B50] font-bold">
                    {reassignedDepts[targetRow.id]?.fullDept || shortToFullDeptName(targetRow.department)}
                  </strong>
                </div>
                <div>
                  <span className="text-[#64748B]">Location:</span>{' '}
                  <span className="font-semibold text-[#102B50]">{targetRow.location}, Chennai</span>
                </div>
                <div>
                  <span className="text-[#64748B]">Complaint Category:</span>{' '}
                  <span className="font-semibold text-[#0284C7]">{targetRow.category}</span>
                </div>
              </div>

              <div>
                <label className="block text-[#102B50] font-bold mb-1">
                  New Target Department (Required)
                </label>
                <select
                  value={newDepartment}
                  onChange={(e) => setNewDepartment(e.target.value as DepartmentName)}
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-[#102B50] font-medium focus:border-[#0284C7] focus:ring-1 focus:ring-[#0284C7] focus:outline-none"
                >
                  <option value="Roads and Infrastructure Department">Roads and Infrastructure Department</option>
                  <option value="Solid Waste Management Department">Solid Waste Management Department</option>
                  <option value="Water Supply and Sewerage Department">Water Supply and Sewerage Department</option>
                </select>
              </div>

              <div>
                <label className="block text-[#102B50] font-bold mb-1">
                  Documented Reassignment Justification (Recorded in Audit Trail)
                </label>
                <textarea
                  required
                  rows={3}
                  value={reassignReason}
                  onChange={(e) => setReassignReason(e.target.value)}
                  placeholder="Specify reason for department transfer (e.g. Issue involves main pipeline beneath road)..."
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-[#102B50] font-normal placeholder-slate-400 focus:border-[#0284C7] focus:ring-1 focus:ring-[#0284C7] focus:outline-none resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setReassignModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-xl border border-slate-200 text-[#64748B] hover:bg-slate-50 font-semibold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingReassign || !reassignReason.trim()}
                  className="px-4 py-1.5 rounded-xl bg-[#0284C7] hover:bg-[#0369A1] disabled:opacity-50 text-white font-bold transition shadow-xs cursor-pointer disabled:cursor-not-allowed"
                >
                  {isSubmittingReassign ? 'Reassigning...' : 'Authorize Transfer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
