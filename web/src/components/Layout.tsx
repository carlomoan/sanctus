// web/src/components/Layout.tsx
// Fix: All sidebar/topbar/background colors use inline style with CSS vars
// so they react to StyleInjector changes immediately without Tailwind recompile.

import { Link, useLocation, Outlet, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  LayoutDashboard, Users, Church, Coins, Menu, X, Scroll, LogOut,
  ShieldCheck, Wallet, FileBarChart, Upload, Network, Home, Settings,
  ChevronDown, ChevronRight, LucideIcon, Shield, Building, Calendar,
  Church as LiturgicalIcon,
} from 'lucide-react';
import { useState, useMemo, useEffect, CSSProperties } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { UserRole } from '../types';

interface NavItem { name: string; href: string; icon: LucideIcon; }
interface NavSection { id: string; label: string; items: NavItem[]; }

// ── Skeleton while settings load ───────────────────────────────────────────────
const SidebarSkeleton = () => (
  <div className="flex flex-col gap-2.5 p-3 animate-pulse">
    {[...Array(7)].map((_, i) => (
      <div key={i} className="h-8 rounded-lg bg-white/10" />
    ))}
  </div>
);

// ── CSS variable helpers ───────────────────────────────────────────────────────
// These functions return inline style objects that read CSS vars at RUNTIME,
// not at Tailwind compile time. This is the critical fix.
const sidebarStyles = (): CSSProperties => ({
  backgroundColor: 'var(--color-sidebar-bg, #0f172a)',
  color: 'var(--color-sidebar-text, #cbd5e1)',
  borderColor: 'var(--color-sidebar-border, #1e293b)',
});

const topbarStyles = (): CSSProperties => ({
  backgroundColor: 'var(--color-topbar-bg, #ffffff)',
  color: 'var(--color-topbar-text, #1e293b)',
  borderColor: 'var(--color-topbar-border, #e2e8f0)',
});

const mainBgStyle = (): CSSProperties => ({
  backgroundColor: 'var(--color-background-main, #f8fafc)',
});

const footerStyles = (): CSSProperties => ({
  backgroundColor: 'var(--color-footer-bg, #ffffff)',
  color: 'var(--color-footer-text, #64748b)',
  borderColor: 'var(--color-footer-border, #e2e8f0)',
});

const navItemActiveStyle = (): CSSProperties => ({
  backgroundColor: 'var(--color-sidebar-active-bg, #1e293b)',
  color: '#ffffff',
});

const navItemHoverStyle = (): CSSProperties => ({
  backgroundColor: 'rgba(255,255,255,0.06)',
});

// ── Hover-capable nav link ─────────────────────────────────────────────────────
const NavLink = ({
  item,
  isActive,
  collapsed,
}: {
  item: NavItem;
  isActive: boolean;
  collapsed: boolean;
}) => {
  const [hovered, setHovered] = useState(false);
  const Icon = item.icon;

  return (
    <Link
      to={item.href}
      title={collapsed ? item.name : undefined}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={
        isActive
          ? navItemActiveStyle()
          : hovered
            ? navItemHoverStyle()
            : undefined
      }
      className={`
        flex items-center gap-3 px-2.5 py-2 rounded-lg text-sm font-medium
        transition-colors duration-150 relative
        ${collapsed ? 'justify-center px-2' : ''}
      `}
    >
      <Icon
        size={17}
        style={{
          color: isActive
            ? 'var(--color-primary-400, #818cf8)'
            : 'var(--color-sidebar-text, #94a3b8)',
          opacity: isActive ? 1 : 0.7,
          flexShrink: 0,
        }}
      />
      {!collapsed && (
        <span style={{ color: isActive ? '#ffffff' : 'inherit' }} className="truncate">
          {item.name}
        </span>
      )}
      {/* Active dot */}
      {isActive && !collapsed && (
        <span
          className="ml-auto w-1.5 h-1.5 rounded-full flex-shrink-0"
          style={{ backgroundColor: 'var(--color-primary-400, #818cf8)' }}
        />
      )}
    </Link>
  );
};

// ── Main Layout ────────────────────────────────────────────────────────────────
const Layout = () => {
  const { t } = useTranslation();
  const { getSetting, loading } = useSettings();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [settingsReady, setSettingsReady] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['main', 'people', 'finance', 'ministry', 'admin'])
  );
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  // Apply sidebar collapsed preference from settings
  useEffect(() => {
    if (!loading && !settingsReady) {
      const collapsed = getSetting('ui.sidebar_collapsed') === 'true';
      setIsSidebarOpen(!collapsed);
      setSettingsReady(true);
    }
  }, [loading, settingsReady, getSetting]);

  const appName = getSetting('ui.app_name') || 'Sanctus';
  const logoUrl = getSetting('ui.logo_url');
  const footerContent = getSetting('ui.footer_content') || `© ${new Date().getFullYear()} Sanctus Parish Management`;
  const showFooter = getSetting('ui.footer_show') !== 'false';

  const handleLogout = () => { logout(); navigate('/login'); };

  const toggleSection = (id: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // ── Navigation items per role ───────────────────────────────────────────────
  const role = user?.role;
  const isSuperAdmin = role === UserRole.SUPER_ADMIN;
  const isParishAdmin = role === UserRole.PARISH_ADMIN;
  const isAccountant = role === UserRole.ACCOUNTANT;
  const isSecretary = role === UserRole.SECRETARY;
  const isViewer = role === UserRole.VIEWER;
  const canPeople = isSuperAdmin || isParishAdmin || isSecretary;
  const canFinance = isSuperAdmin || isParishAdmin || isAccountant;
  const canAdmin = isSuperAdmin || isParishAdmin;

  const navigation = useMemo((): NavSection[] => {
    const sections: NavSection[] = [];

    // Main
    const mainItems: NavItem[] = [{ name: t('navigation.dashboard'), href: '/', icon: LayoutDashboard }];
    if (canAdmin) mainItems.push({ name: t('navigation.settings'), href: '/settings', icon: Settings });
    sections.push({ id: 'main', label: 'Main', items: mainItems });

    // People
    if (canPeople || isViewer) {
      sections.push({
        id: 'people', label: t('navigation.dioceses'),
        items: [
          { name: t('navigation.families'), href: '/families', icon: Home },
          { name: t('navigation.members'), href: '/members', icon: Users },
          { name: t('navigation.clusters'), href: '/clusters', icon: Network },
        ],
      });
    }

    // Ministry
    if (canPeople || isViewer) {
      sections.push({
        id: 'ministry', label: 'Ministry',
        items: [
          { name: t('navigation.sacraments'), href: '/sacraments', icon: Scroll },
          { name: t('navigation.events'), href: '/events', icon: Calendar },
          { name: t('navigation.liturgicalCalendar'), href: '/liturgical-calendar', icon: LiturgicalIcon },
          { name: t('navigation.announcements'), href: '/announcements', icon: ShieldCheck },
          { name: t('navigation.attendance'), href: '/attendance', icon: Wallet },
        ],
      });
    }

    // Finance
    if (canFinance || isViewer) {
      sections.push({
        id: 'finance', label: t('navigation.finance'),
        items: [
          { name: 'Transactions', href: '/finance', icon: Coins },
          { name: t('navigation.budgets'), href: '/budgets', icon: Wallet },
          { name: t('navigation.reports'), href: '/reports', icon: FileBarChart },
        ],
      });
    }

    // Admin
    if (canAdmin) {
      const adminItems: NavItem[] = [];
      if (isSuperAdmin) {
        adminItems.push({ name: t('navigation.dioceses'), href: '/dioceses', icon: Building });
        adminItems.push({ name: t('navigation.parishes'), href: '/parishes', icon: Church });
      }
      adminItems.push({ name: t('navigation.import'), href: '/import', icon: Upload });
      if (isSuperAdmin) {
        adminItems.push({ name: t('navigation.users'), href: '/users', icon: ShieldCheck });
        adminItems.push({ name: t('navigation.roles'), href: '/roles', icon: Shield });
      }
      sections.push({ id: 'admin', label: 'Administration', items: adminItems });
    }

    return sections;
  }, [role, t]);

  const userInitials = user?.full_name
    ?.split(' ')
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() ?? 'U';

  const currentPageName = location.pathname === '/'
    ? 'Dashboard'
    : location.pathname.replace('/', '').replace(/-/g, ' ');

  return (
    <div className="flex h-screen overflow-hidden" style={mainBgStyle()}>

      {/* ══ SIDEBAR ══════════════════════════════════════════════════════════ */}
      <aside
        style={sidebarStyles()}
        className={`
          flex flex-col flex-shrink-0
          transition-all duration-300 ease-in-out
          ${isSidebarOpen ? 'w-60' : 'w-[68px]'}
        `}
      >
        {/* Logo / Brand */}
        <div
          className={`
            flex items-center h-16 px-4
            border-b border-white/5
            ${isSidebarOpen ? 'justify-between' : 'justify-center'}
          `}
        >
          {isSidebarOpen && (
            <div className="flex items-center gap-2.5 min-w-0">
              {logoUrl
                ? <img src={logoUrl} alt="Logo" className="h-7 w-7 object-contain flex-shrink-0" />
                : (
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: 'var(--color-primary-600, #4f46e5)' }}
                  >
                    <span className="text-white text-xs font-bold">✝</span>
                  </div>
                )
              }
              <span className="font-bold text-sm text-white truncate">{appName}</span>
            </div>
          )}
          {!isSidebarOpen && (
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: 'var(--color-primary-600, #4f46e5)' }}
            >
              <span className="text-white text-xs font-bold">✝</span>
            </div>
          )}
          <button
            onClick={() => setIsSidebarOpen(v => !v)}
            className="p-1.5 rounded-md transition-colors duration-150 hover:bg-white/10 flex-shrink-0"
            style={{ color: 'var(--color-sidebar-text, #64748b)' }}
            title={isSidebarOpen ? 'Collapse' : 'Expand'}
          >
            {isSidebarOpen ? <X size={15} /> : <Menu size={15} />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
          {loading && !settingsReady
            ? <SidebarSkeleton />
            : navigation.map(section => {
              const isExpanded = expandedSections.has(section.id);
              return (
                <div key={section.id} className="mb-1">
                  {/* Section label */}
                  {isSidebarOpen && (
                    <button
                      onClick={() => toggleSection(section.id)}
                      className="w-full flex items-center justify-between px-2 py-1 mb-0.5
                                 transition-colors duration-150 hover:opacity-100"
                      style={{ color: 'var(--color-sidebar-text, #64748b)', opacity: 0.6 }}
                    >
                      <span className="text-[10px] font-bold uppercase tracking-widest">
                        {section.label}
                      </span>
                      {isExpanded
                        ? <ChevronDown size={11} />
                        : <ChevronRight size={11} />
                      }
                    </button>
                  )}

                  {/* Nav items */}
                  {(isExpanded || !isSidebarOpen) && (
                    <div className="space-y-0.5">
                      {section.items.map(item => {
                        const isActive =
                          location.pathname === item.href ||
                          (item.href !== '/' && location.pathname.startsWith(item.href));
                        return (
                          <NavLink
                            key={item.name}
                            item={item}
                            isActive={isActive}
                            collapsed={!isSidebarOpen}
                          />
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })
          }
        </nav>

        {/* User footer */}
        <div className="border-t border-white/5 p-3">
          <div className={`flex items-center gap-2 ${!isSidebarOpen ? 'flex-col' : ''}`}>
            <Link
              to="/profile"
              className={`
                flex items-center gap-2.5 min-w-0 flex-1
                p-1.5 -ml-1.5 rounded-lg
                hover:bg-white/10 transition-colors duration-150
                ${!isSidebarOpen ? 'flex-col gap-0 p-1' : ''}
              `}
            >
              <div
                className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center
                           text-white text-xs font-bold"
                style={{
                  backgroundColor: 'var(--color-primary-600, #4f46e5)',
                  boxShadow: '0 0 0 2px rgba(99,102,241,0.3)',
                }}
              >
                {userInitials}
              </div>
              {isSidebarOpen && (
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-white/90 truncate leading-tight">
                    {user?.full_name}
                  </p>
                  <p
                    className="text-[10px] truncate leading-tight"
                    style={{ color: 'var(--color-sidebar-text, #64748b)' }}
                  >
                    {role?.replace('_', ' ')}
                  </p>
                </div>
              )}
            </Link>

            <button
              onClick={handleLogout}
              className="p-1.5 rounded-lg transition-colors duration-150
                         hover:bg-red-500/10 hover:text-red-400 flex-shrink-0"
              style={{ color: 'var(--color-sidebar-text, #64748b)' }}
              title="Sign out"
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </aside>

      {/* ══ MAIN CONTENT ═════════════════════════════════════════════════════ */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Top bar */}
        <header
          style={topbarStyles()}
          className="h-14 flex items-center justify-between px-6 flex-shrink-0
                     border-b shadow-[0_1px_3px_0_rgb(0_0_0/0.04)]"
        >
          <p
            className="text-sm font-semibold capitalize"
            style={{ color: 'var(--color-topbar-text, #1e293b)' }}
          >
            {currentPageName}
          </p>
          <div className="flex items-center gap-4">
            <span
              className="text-xs"
              style={{ color: 'var(--color-topbar-text, #94a3b8)', opacity: 0.6 }}
            >
              {new Date().toLocaleDateString('en-TZ', {
                weekday: 'short', day: 'numeric', month: 'short',
              })}
            </span>
            <span className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Online
            </span>
          </div>
        </header>

        {/* Page */}
        <main className="flex-1 overflow-auto">
          <div className="p-6 animate-fade-in">
            <Outlet />
          </div>

          {showFooter && (
            <footer
              style={footerStyles()}
              className="px-6 py-3 text-xs text-center border-t"
            >
              {footerContent}
            </footer>
          )}
        </main>
      </div>
    </div>
  );
};

export default Layout;