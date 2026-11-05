import React, { useState, useRef, useEffect } from 'react';
import {
  Map,
  BarChart3,
  FileText,
  ChevronDown,
  Landmark,
  ShieldCheck,
  Bell,
  Settings,
  Menu,
  X,
  Clock,
  CheckCheck,
  RefreshCw,
  LogIn,
  LogOut,
  Database,
  AlertTriangle,
} from 'lucide-react';
import { useAdminAuth } from '../../contexts/AuthContext';
import type { HealthResponse } from '../../api/client';
import { LighthouseLogo } from '../common/LighthouseLogo';

export type ActiveNavTab =
  | 'map-view'
  | 'dashboard'
  | 'all-complaints'
  | 'in-progress'
  | 'resolved-complaints'
  | 'resolution-verification'
  | 'notifications'
  | 'settings';

interface TopNavigationProps {
  currentTab: ActiveNavTab;
  onNavigate: (tab: ActiveNavTab) => void;
  pendingVerificationCount?: number;
  unreadNotificationsCount?: number;
  onResetDemoData?: () => void;
  isResetting?: boolean;
  onOpenReportIssue?: () => void;
  health?: HealthResponse | null;
}

export const TopNavigation: React.FC<TopNavigationProps> = ({
  currentTab,
  onNavigate,
  pendingVerificationCount = 0,
  unreadNotificationsCount = 3,
  onResetDemoData,
  isResetting = false,
  onOpenReportIssue,
  health,
}) => {
  const { user, isAuthorizedAdmin, signInWithGoogle, signOutAdmin } = useAdminAuth();
  const [complaintsDropdownOpen, setComplaintsDropdownOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setComplaintsDropdownOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isComplaintsActive =
    currentTab === 'all-complaints' ||
    currentTab === 'in-progress' ||
    currentTab === 'resolved-complaints';

  const handleDropdownSelect = (tab: ActiveNavTab) => {
    onNavigate(tab);
    setComplaintsDropdownOpen(false);
    setMobileMenuOpen(false);
  };

  // Authentic Glacier Blue Liquid Glass capsule (Glacier #B9D8E1 / rgb(185, 219, 225)):
  // Translucent optical glass refraction, crisp specular meniscus sheen, liquid caustics, and glassy bevel rim
  const glassCapsuleStyle: React.CSSProperties = {
    background:
      /* 1. Top Specular Meniscus Highlight (light reflecting off curved glass top) */
      'linear-gradient(180deg, rgba(255, 255, 255, 0.78) 0%, rgba(255, 255, 255, 0.22) 35%, rgba(255, 255, 255, 0.04) 65%, transparent 100%), ' +
      /* 2. Prismatic Caustic Dispersion Sheen */
      'linear-gradient(120deg, rgba(255, 255, 255, 0.25) 0%, rgba(185, 219, 225, 0.15) 30%, rgba(255, 255, 255, 0.15) 60%, rgba(175, 215, 225, 0.20) 100%), ' +
      /* 3. Pure Glacier Blue Liquid Tint (#B9D8E1 / rgb(185, 219, 225) - authentic rich glacier blue volume) */
      'linear-gradient(135deg, rgba(185, 219, 225, 0.88) 0%, rgba(198, 228, 235, 0.82) 45%, rgba(175, 212, 220, 0.90) 100%)',
    backdropFilter: 'blur(24px) saturate(190%) contrast(102%)',
    WebkitBackdropFilter: 'blur(24px) saturate(190%) contrast(102%)',
    border: '1.2px solid rgba(255, 255, 255, 0.88)',
    borderRadius: '9999px',
    boxShadow:
      '0 12px 32px -4px rgba(10, 38, 64, 0.18), ' +
      '0 4px 10px -2px rgba(10, 38, 64, 0.08), ' +
      '0 0 1px 1px rgba(255, 255, 255, 0.75), ' +
      'inset 0 1.5px 2px 0 rgba(255, 255, 255, 0.95), ' +
      'inset 0 -1.5px 2px 0 rgba(135, 185, 198, 0.45), ' +
      'inset 0 0 14px 1px rgba(185, 219, 225, 0.35)',
  };

  // Matching Glacier Blue Liquid Glass dropdown panel style
  const dropdownGlassStyle: React.CSSProperties = {
    background:
      'linear-gradient(180deg, rgba(255, 255, 255, 0.85) 0%, rgba(255, 255, 255, 0.25) 25%, transparent 60%), ' +
      'linear-gradient(135deg, rgba(230, 246, 250, 0.92) 0%, rgba(185, 219, 225, 0.94) 100%)',
    backdropFilter: 'blur(32px) saturate(200%)',
    WebkitBackdropFilter: 'blur(32px) saturate(200%)',
    border: '1.2px solid rgba(255, 255, 255, 0.85)',
    boxShadow:
      '0 22px 46px rgba(10, 38, 64, 0.18), ' +
      '0 0 1px 1px rgba(255, 255, 255, 0.80), ' +
      'inset 0 1.5px 2px rgba(255, 255, 255, 0.95), ' +
      'inset 0 -1.5px 2px rgba(125, 178, 192, 0.45), ' +
      'inset 0 0 14px rgba(185, 219, 225, 0.30)',
  };

  // Helper for active tab pill container styles: elevated gleaming crystal droplet with specular rim
  const activePillStyle: React.CSSProperties = {
    background:
      'linear-gradient(180deg, rgba(255, 255, 255, 0.90) 0%, rgba(230, 246, 252, 0.80) 50%, rgba(195, 228, 238, 0.78) 100%)',
    color: '#0A2540',
    border: '1px solid rgba(255, 255, 255, 0.95)',
    boxShadow:
      '0 3px 10px rgba(10, 38, 64, 0.14), ' +
      '0 1px 3px rgba(10, 38, 64, 0.08), ' +
      'inset 0 1.2px 1.5px rgba(255, 255, 255, 1), ' +
      'inset 0 -1px 1.8px rgba(145, 195, 208, 0.50), ' +
      'inset 0 0 6px rgba(185, 219, 225, 0.30)',
    borderRadius: '999px',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
  };

  const navItemStyle = (active: boolean): React.CSSProperties => ({
    lineHeight: '1',
    letterSpacing: '-0.01em',
    textShadow: active ? '0 1px 1px rgba(255, 255, 255, 0.70)' : '0 1px 1px rgba(255, 255, 255, 0.45)',
    ...(active ? activePillStyle : {}),
  });

  const isTabActive = (tab: ActiveNavTab) => currentTab === tab;

  return (
    <>
      {/* Tri-Island Floating Top Navigation in Glacier Blue Liquid Glass */}
      <div
        className={`${
          currentTab === 'dashboard'
            ? 'relative top-0 left-0 right-0 w-full mt-[14px] mb-[10px] shrink-0 z-[1000] flex items-center justify-between pointer-events-none'
            : 'fixed top-[16px] left-[20px] right-[20px] sm:left-[28px] sm:right-[28px] xl:left-[36px] xl:right-[36px] z-[1000] flex items-center justify-between pointer-events-none'
        }`}
      >
        {/* 1. SEPARATE LEFT CORNER: Brand Logo & Namma Ooru Admin Portal Island */}
        <div
          className="relative pointer-events-auto h-[36px] min-h-[36px] max-h-[36px] inline-flex items-center gap-2 px-3 sm:px-3.5 rounded-full select-none transition-all box-border shrink-0 shadow-md"
          style={glassCapsuleStyle}
        >
          <button
            onClick={() => onNavigate('map-view')}
            className="relative z-10 flex items-center gap-2 text-left group transition cursor-pointer select-none"
            title="Namma Ooru Admin Portal"
          >
            <LighthouseLogo size={22} />
            <div className="flex flex-col justify-center">
              <span
                style={{ fontSize: '13px', lineHeight: '1.15', textShadow: '0 1px 1px rgba(255, 255, 255, 0.60)' }}
                className="font-bold tracking-tight whitespace-nowrap"
              >
                <span className="text-[#0a2540]">Namma </span>
                <span className="text-[#0284c7]">Ooru</span>
              </span>
              <span
                style={{ fontSize: '6.5px', letterSpacing: '0.22em', lineHeight: '1.2' }}
                className="font-semibold text-[#486581] uppercase mt-0.5 tracking-widest whitespace-nowrap"
              >
                ADMIN PORTAL
              </span>
            </div>
          </button>
        </div>

        {/* 2. ONLY THIS IN THE CENTRE: Navigation Tabs Island */}
        <header
          className="admin-navbar pointer-events-auto absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[36px] min-h-[36px] max-h-[36px] hidden lg:inline-flex items-center gap-0.5 sm:gap-1 p-0.5 rounded-full select-none transition-all box-border w-auto shadow-md"
          style={glassCapsuleStyle}
        >
          {/* 1. Map View */}
          <button
            onClick={() => onNavigate('map-view')}
            style={navItemStyle(isTabActive('map-view'))}
            className={`relative z-10 h-[28px] px-2.5 sm:px-3 rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer shrink-0 whitespace-nowrap text-[11.5px] ${
              isTabActive('map-view')
                ? 'text-[#0a2540] font-bold'
                : 'text-[#1e3a5f] hover:text-[#0a2540] hover:bg-white/45 font-semibold'
            }`}
          >
            <span>Map View</span>
          </button>

          {/* 2. Dashboard */}
          <button
            onClick={() => onNavigate('dashboard')}
            style={navItemStyle(isTabActive('dashboard'))}
            className={`relative z-10 h-[28px] px-3 sm:px-3.5 rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer shrink-0 whitespace-nowrap text-[11.5px] ${
              isTabActive('dashboard')
                ? 'text-[#0a2540] font-bold'
                : 'text-[#1e3a5f] hover:text-[#0a2540] hover:bg-white/45 font-semibold'
            }`}
          >
            <span>Dashboard</span>
          </button>

          {/* 3. Complaints */}
          <div className="relative z-10 shrink-0 whitespace-nowrap" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => onNavigate('all-complaints')}
              style={navItemStyle(isComplaintsActive)}
              className={`h-[28px] px-2.5 sm:px-3 rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer shrink-0 whitespace-nowrap text-[11.5px] ${
                isComplaintsActive
                  ? 'text-[#0a2540] font-bold'
                  : 'text-[#1e3a5f] hover:text-[#0a2540] hover:bg-white/45 font-semibold'
              }`}
            >
              <span>Complaints</span>
            </button>

            {complaintsDropdownOpen && (
              <div
                className="absolute left-0 mt-2 w-52 rounded-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150"
                style={dropdownGlassStyle}
              >
                <div className="px-3 py-1.5 text-[10px] font-bold text-[#486581] uppercase tracking-wider">
                  Complaint Views
                </div>
                <button
                  onClick={() => handleDropdownSelect('all-complaints')}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs transition cursor-pointer ${
                    currentTab === 'all-complaints' ? 'bg-[#0a4870]/12 text-[#0a2540] font-bold border border-[#0a4870]/20' : 'hover:bg-white/55 text-[#1e3a5f]'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5 text-[#0284c7]" />
                  <span>All Complaints</span>
                </button>
                <button
                  onClick={() => handleDropdownSelect('in-progress')}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs transition cursor-pointer ${
                    currentTab === 'in-progress' ? 'bg-[#0a4870]/12 text-[#0a2540] font-bold border border-[#0a4870]/20' : 'hover:bg-white/55 text-[#1e3a5f]'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                  <span>In Progress</span>
                </button>
                <button
                  onClick={() => handleDropdownSelect('resolved-complaints')}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs transition cursor-pointer ${
                    currentTab === 'resolved-complaints' ? 'bg-[#0a4870]/12 text-[#0a2540] font-bold border border-[#0a4870]/20' : 'hover:bg-white/55 text-[#1e3a5f]'
                  }`}
                >
                  <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Resolved Complaints</span>
                </button>
              </div>
            )}
          </div>

          {/* 4. Resolution Verification */}
          <button
            onClick={() => onNavigate('resolution-verification')}
            style={navItemStyle(isTabActive('resolution-verification'))}
            className={`relative z-10 h-[28px] px-2.5 sm:px-3 rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer shrink-0 whitespace-nowrap text-[11.5px] ${
              isTabActive('resolution-verification')
                ? 'text-[#0a2540] font-bold'
                : 'text-[#1e3a5f] hover:text-[#0a2540] hover:bg-white/45 font-semibold'
            }`}
          >
            <span>Verification</span>
          </button>
        </header>

        {/* 3. SEPARATE RIGHT CORNER: Quick Action Circles (Settings Gear, Notifications) & Admin Island */}
        <div className="flex items-center gap-1.5 sm:gap-2 pointer-events-auto shrink-0 select-none">
          {/* Settings Gear Circle Button */}
          <button
            type="button"
            onClick={() => onNavigate('settings')}
            style={{
              ...glassCapsuleStyle,
              ...(isTabActive('settings') ? activePillStyle : {}),
            }}
            className={`w-[36px] h-[36px] min-w-[36px] min-h-[36px] max-w-[36px] max-h-[36px] rounded-full flex items-center justify-center relative cursor-pointer transition-all duration-200 group shrink-0 shadow-md ${
              isTabActive('settings')
                ? 'text-[#0a2540]'
                : 'text-[#0a2540] hover:bg-white/45'
            }`}
            title="Settings"
            aria-label="Settings"
          >
            <Settings className="w-4 h-4 stroke-[1.9] transition-transform duration-200 group-hover:scale-110 group-hover:rotate-45 text-[#0a2540]" />
          </button>

          {/* Notifications Circle Button with unread indicator dot */}
          <button
            type="button"
            onClick={() => onNavigate('notifications')}
            style={{
              ...glassCapsuleStyle,
              ...(isTabActive('notifications') ? activePillStyle : {}),
            }}
            className={`w-[36px] h-[36px] min-w-[36px] min-h-[36px] max-w-[36px] max-h-[36px] rounded-full flex items-center justify-center relative cursor-pointer transition-all duration-200 group shrink-0 shadow-md ${
              isTabActive('notifications')
                ? 'text-[#0a2540]'
                : 'text-[#0a2540] hover:bg-white/45'
            }`}
            title={unreadNotificationsCount > 0 ? `Notifications (${unreadNotificationsCount} unread)` : 'Notifications'}
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4 stroke-[1.9] transition-transform duration-200 group-hover:scale-110 text-[#0a2540]" />
            {unreadNotificationsCount > 0 && (
              <span
                className="absolute top-[6px] right-[6px] w-[7px] h-[7px] rounded-full bg-[#EA580C] ring-[1.5px] ring-white shadow-[0_0_6px_rgba(234,88,12,0.6)] pointer-events-none"
                aria-label={`${unreadNotificationsCount} unread notifications`}
              />
            )}
          </button>

          {/* Admin Island with Dropdown */}
          <div
            className="relative h-[36px] min-h-[36px] max-h-[36px] inline-flex items-center gap-1 p-0.5 px-2 sm:px-2.5 rounded-full select-none transition-all box-border shrink-0 shadow-md"
            style={glassCapsuleStyle}
            ref={profileRef}
          >
            <button
              onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
              className="relative z-10 h-[28px] px-1.5 rounded-full flex items-center gap-1.5 hover:bg-white/45 transition cursor-pointer group shrink-0"
              title="Admin Session & Role Selector"
            >
              <div className="w-[20px] h-[20px] rounded-full bg-gradient-to-b from-[#0a2540] to-[#1e3a5f] border border-white/60 flex items-center justify-center text-white font-bold text-[9px] shadow-sm group-hover:scale-105 transition shrink-0">
                {user?.displayName ? user.displayName.charAt(0).toUpperCase() : 'A'}
              </div>
              <span className="font-semibold text-[#0a2540] text-[11.5px] shrink-0 group-hover:text-sky-800">Admin</span>
              <ChevronDown className={`w-2.5 h-2.5 text-[#486581] transition-transform duration-200 shrink-0 ${profileDropdownOpen ? 'rotate-180 text-[#0a2540]' : ''}`} />
            </button>

            {/* Mobile Menu Button for screens smaller than lg */}
            <div className="relative z-10 flex lg:hidden items-center ml-0.5">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-1 rounded-xl text-[#0a2540] hover:bg-white/45 transition cursor-pointer"
                aria-label="Toggle Navigation Menu"
              >
                {mobileMenuOpen ? <X className="w-3.5 h-3.5 text-[#0a2540]" /> : <Menu className="w-3.5 h-3.5 text-[#0a2540]" />}
              </button>
            </div>

            {profileDropdownOpen && (
              <div
                className="absolute right-0 mt-2 top-[42px] w-72 rounded-2xl p-4 z-50 text-xs text-[#0a2540] animate-in fade-in zoom-in-95 duration-150"
                style={dropdownGlassStyle}
              >
                <div className="flex items-center gap-3 pb-3 border-b border-[#0a2540]/10">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-b from-[#0a2540] to-[#1e3a5f] border border-white/60 flex items-center justify-center text-white font-bold text-base shadow-sm">
                    {user?.displayName ? user.displayName.charAt(0).toUpperCase() : 'A'}
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-[#0a2540] text-sm truncate">Er. K. Sivakumar</div>
                    <div className="text-[11px] text-[#486581] truncate">
                      {user?.email || 'admin@chennaicorporation.gov.in'}
                    </div>
                    <div className="text-[10px] text-[#0284c7] font-semibold mt-0.5">Chief Municipal Engineer</div>
                  </div>
                </div>

                <div className="py-3 space-y-2 border-b border-[#0a2540]/10">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-[#486581]">Storage Mode:</span>
                    <span className="font-mono text-[10px] text-amber-900 bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded-md flex items-center gap-1 font-semibold">
                      <Database className="w-3 h-3 text-amber-600" />
                      Local JSON
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-[#486581]">Verification:</span>
                    <span className="font-semibold text-emerald-700">Authorized Admin</span>
                  </div>
                </div>

                <div className="pt-3 space-y-2">
                  <button
                    onClick={() => {
                      onNavigate('settings');
                      setProfileDropdownOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-[#1e3a5f] hover:text-[#0a2540] hover:bg-white/55 transition cursor-pointer text-left font-medium"
                  >
                    <Settings className="w-3.5 h-3.5 text-[#0284c7]" />
                    <span>System Settings</span>
                  </button>

                  {onResetDemoData && (
                    <button
                      onClick={() => {
                        onResetDemoData();
                        setProfileDropdownOpen(false);
                      }}
                      disabled={isResetting}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-[#1e3a5f] hover:text-[#0a2540] hover:bg-white/55 transition cursor-pointer text-left font-medium"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 text-[#0284c7] ${isResetting ? 'animate-spin' : ''}`} />
                      <span>Reset Baseline Demo Data</span>
                    </button>
                  )}

                  {onOpenReportIssue && (
                    <button
                      onClick={() => {
                        onOpenReportIssue();
                        setProfileDropdownOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-[#1e3a5f] hover:text-[#0a2540] hover:bg-white/55 transition cursor-pointer text-left font-medium"
                    >
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                      <span>Report Field Issue</span>
                    </button>
                  )}

                  {user ? (
                    <button
                      onClick={() => {
                        signOutAdmin();
                        setProfileDropdownOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-[#e02424] hover:bg-rose-100/50 transition cursor-pointer text-left font-semibold"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out Admin</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        signInWithGoogle();
                        setProfileDropdownOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sky-700 hover:bg-sky-100/50 transition cursor-pointer text-left font-semibold"
                    >
                      <LogIn className="w-3.5 h-3.5" />
                      <span>Admin Google Login</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu for smaller screen viewports */}
      {mobileMenuOpen && (
        <div
          className="lg:hidden fixed top-[68px] left-4 right-4 rounded-3xl px-4 pt-3 pb-5 space-y-1.5 text-sm text-[#0a2540] z-40"
          style={dropdownGlassStyle}
        >
          <button
            onClick={() => {
              onNavigate('map-view');
              setMobileMenuOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl transition cursor-pointer ${
              currentTab === 'map-view' ? 'bg-white/90 text-[#0a2540] border border-white font-bold shadow-sm' : 'hover:bg-white/50 text-[#1e3a5f] font-semibold'
            }`}
          >
            <Map className="w-4 h-4 text-[#0284c7]" />
            <span>Map View</span>
          </button>

          <button
            onClick={() => {
              onNavigate('dashboard');
              setMobileMenuOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl transition cursor-pointer ${
              currentTab === 'dashboard' ? 'bg-white/90 text-[#0a2540] border border-white font-bold shadow-sm' : 'hover:bg-white/50 text-[#1e3a5f] font-semibold'
            }`}
          >
            <BarChart3 className="w-4 h-4 text-[#0284c7]" />
            <span>Dashboard</span>
          </button>

          <button
            onClick={() => {
              onNavigate('resolution-verification');
              setMobileMenuOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl transition cursor-pointer ${
              currentTab === 'resolution-verification'
                ? 'bg-white/90 text-[#0a2540] border border-white font-bold shadow-sm'
                : 'hover:bg-white/50 text-[#1e3a5f] font-semibold'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-[#0284c7]" />
            <span>Resolution Verification</span>
          </button>

          <button
            onClick={() => {
              onNavigate('notifications');
              setMobileMenuOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl transition cursor-pointer ${
              currentTab === 'notifications'
                ? 'bg-white/90 text-[#0a2540] border border-white font-bold shadow-sm'
                : 'hover:bg-white/50 text-[#1e3a5f] font-semibold'
            }`}
          >
            <Bell className="w-4 h-4 text-[#0284c7]" />
            <span>Notifications (3)</span>
          </button>

          <button
            onClick={() => {
              onNavigate('settings');
              setMobileMenuOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl transition cursor-pointer ${
              currentTab === 'settings' ? 'bg-white/90 text-[#0a2540] border border-white font-bold shadow-sm' : 'hover:bg-white/50 text-[#1e3a5f] font-semibold'
            }`}
          >
            <Settings className="w-4 h-4 text-[#0284c7]" />
            <span>Settings</span>
          </button>
        </div>
      )}
    </>
  );
};
