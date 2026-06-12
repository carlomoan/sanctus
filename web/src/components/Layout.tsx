import { Link, useLocation, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, Church, Coins, Menu, X, Scroll, LogOut,
  ShieldCheck, Wallet, FileBarChart, Upload, Network, Home, Settings,
  ChevronDown, ChevronRight, LucideIcon, Shield, Building, Calendar,
  Church as LiturgicalIcon,
} from 'lucide-react';
import { useState, useMemo, useEffect } from 'react';
import classNames from 'classnames';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { UserRole } from '../types';
import ToastContainer, { ToastType } from './Toast';

interface NavItem { name: string; href: string; icon: LucideIcon; }
interface NavSection { id: string; label: string; items: NavItem[]; }

/* ── Skeleton shimmer used while settings load ── */
const SidebarSkeleton = () => (
  <div className="flex flex-col gap-3 p-4 animate-pulse">
    {[...Array(6)].map((_, i) => (
      <div key={i} className="h-8 rounded-lg bg-white/10" />
    ))}
  </div>
);

const Layout = () => {
  const { getSetting, loading } = useSettings();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['main', 'people', 'finance', 'ministry'])
  );
  const [toasts, setToasts] = useState<{ id: string; type: ToastType; message: string }[]>([]);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  useEffect(() => {
    if (!loading && !settingsLoaded) {
      const collapsed = getSetting('ui.sidebar_collapsed') === 'true';
      setIsSidebarOpen(!collapsed);
      setSettingsLoaded(true);
    }
  }, [loading, settingsLoaded, getSetting]);

  const appName = getSetting('ui.app_name') || 'Sanctus';
  const logoUrl = getSetting('ui.logo_url');
  const footerContent = getSetting('ui.footer_content') || `© ${new Date().getFullYear()} Sanctus Parish Management`;
  const showFooter = getSetting('ui.footer_show') !== 'false';

  const handleLogout = () => { logout(); navigate('/login'); };
  const removeToast = (id: string) => setToasts(prev => prev.filter(t => t.id !== id));

  const toggleSection = (id: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const role = user?.role;
  const isDioceseAdmin = role === UserRole.SUPER_ADMIN;
  const isParishAdmin = role === UserRole.PARISH_ADMIN;
  const isAccountant = role === UserRole.ACCOUNTANT;
  const isSecretary = role === UserRole.SECRETARY;
  const isViewer = role === UserRole.VIEWER;
  const canManagePeople = isDioceseAdmin || isParishAdmin || isSecretary;
  const canManageFinance = isDioceseAdmin || isParishAdmin || isAccountant;
  const canAdmin = isDioceseAdmin || isParishAdmin;

  const navigation = useMemo((): NavSection[] => {
    const sections: NavSection[] = [];

    const mainItems: NavItem[] = [{ name: 'Dashboard', href: '/', icon: LayoutDashboard }];
    if (canAdmin) mainItems.push({ name: 'Settings', href: '/settings', icon: Settings });
    sections.push({ id: 'main', label: 'Main', items: mainItems });

    if (canManagePeople || isViewer) {
      sections.push({
        id: 'people', label: 'Diocese',
        items: [
          { name: 'Families', href: '/families', icon: Home },
          { name: 'Members', href: '/members', icon: Users },
          { name: 'Clusters & SCCs', href: '/clusters', icon: Network },
        ],
      });
    }

    if (canManagePeople || isViewer) {
      sections.push({
        id: 'ministry', label: 'Ministry',
        items: [
          { name: 'Sacraments', href: '/sacraments', icon: Scroll },
          { name: 'Events', href: '/events', icon: Calendar },
          { name: 'Liturgical Calendar', href: '/liturgical-calendar', icon: LiturgicalIcon },
        ],
      });
    }

    if (canManageFinance || isViewer) {
      sections.push({
        id: 'finance', label: 'Finance',
        items: [
          { name: 'Transactions', href: '/finance', icon: Coins },
          { name: 'Budgets', href: '/budgets', icon: Wallet },
          { name: 'Reports', href: '/reports', icon: FileBarChart },
        ],
      });
    }

    if (canAdmin) {
      const adminItems: NavItem[] = [];
      if (isDioceseAdmin) {
        adminItems.push({ name: 'Dioceses', href: '/dioceses', icon: Building });
        adminItems.push({ name: 'Parishes', href: '/parishes', icon: Church });
      }
      adminItems.push({ name: 'Data Import', href: '/import', icon: Upload });
      if (isDioceseAdmin) {
        adminItems.push({ name: 'Users', href: '/users', icon: ShieldCheck });
        adminItems.push({ name: 'Roles & Permissions', href: '/roles', icon: Shield });
      }
      sections.push({ id: 'admin', label: 'Administration', items: adminItems });
    }

    return sections;
  }, [role]);

  const userInitials = user?.full_name
    ?.split(' ')
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'U';

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">

      {/* ── Sidebar ─────────────────────────────────────────── */}
      <aside
        className={classNames(
          'flex flex-col flex-shrink-0 bg-sidebar-bg shadow-sidebar',
          'transition-all duration-300 ease-in-out',
          isSidebarOpen ? 'w-60' : 'w-[68px]'
        )}
      >
        {/* Logo */}
        <div className={classNames(
          'flex items-center h-16 border-b border-white/5 px-4',
          isSidebarOpen ? 'justify-between' : 'justify-center'
        )}>
          {isSidebarOpen && (
            <div className="flex items-center gap-2.5 min-w-0">
              {logoUrl
                ? <img src={logoUrl} alt="Logo" className="h-7 w-7 object-contain flex-shrink-0" />
                : (
                  <div className="w-7 h-7 rounded-lg bg-primary-600 flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-xs font-bold">✝</span>
                  </div>
                )
              }
              <span className="text-white font-bold text-base truncate">{appName}</span>
            </div>
          )}
          {!isSidebarOpen && (
            <div className="w-7 h-7 rounded-lg bg-primary-600 flex items-center justify-center">
              <span className="text-white text-xs font-bold">✝</span>
            </div>
          )}
          <button
            onClick={() => setIsSidebarOpen(v => !v)}
            className={classNames(
              'p-1.5 rounded-md text-sidebar-muted hover:text-white hover:bg-white/10',
              'transition-colors duration-150',
              !isSidebarOpen && 'absolute top-4 right-3'
            )}
            title={isSidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            {isSidebarOpen ? <X size={16} /> : <Menu size={16} />}
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
          {loading && !settingsLoaded
            ? <SidebarSkeleton />
            : navigation.map(section => {
              const isExpanded = expandedSections.has(section.id);
              return (
                <div key={section.id} className="mb-1">
                  {/* Section header */}
                  {isSidebarOpen && (
                    <button
                      onClick={() => toggleSection(section.id)}
                      className="w-full flex items-center justify-between px-2 py-1.5 mb-0.5
                                 text-sidebar-muted hover:text-white transition-colors duration-150 group"
                    >
                      <span className="nav-section-label">{section.label}</span>
                      {isExpanded
                        ? <ChevronDown size={12} className="opacity-60 group-hover:opacity-100" />
                        : <ChevronRight size={12} className="opacity-60 group-hover:opacity-100" />
                      }
                    </button>
                  )}

                  {/* Nav items */}
                  {(isExpanded || !isSidebarOpen) && (
                    <div className="space-y-0.5">
                      {section.items.map(item => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.href ||
                          (item.href !== '/' && location.pathname.startsWith(item.href));
                        return (
                          <Link
                            key={item.name}
                            to={item.href}
                            title={!isSidebarOpen ? item.name : undefined}
                            className={classNames(
                              'flex items-center gap-3 px-2.5 py-2 rounded-lg text-sm font-medium',
                              'transition-all duration-150',
                              isActive
                                ? 'bg-primary-600/20 text-white shadow-[inset_0_0_0_1px_rgba(99,102,241,0.3)]'
                                : 'text-sidebar-text hover:bg-white/8 hover:text-white',
                              !isSidebarOpen && 'justify-center px-2'
                            )}
                          >
                            <Icon
                              size={18}
                              className={classNames(
                                'flex-shrink-0 transition-colors',
                                isActive ? 'text-primary-400' : 'text-sidebar-muted group-hover:text-white'
                              )}
                            />
                            {isSidebarOpen && (
                              <span className="truncate">{item.name}</span>
                            )}
                            {/* Active indicator dot */}
                            {isActive && isSidebarOpen && (
                              <span className="ml-auto w-1.5 h-1.5 rounded-full bg-primary-400 flex-shrink-0" />
                            )}
                          </Link>
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
          <div className={classNames(
            'flex items-center gap-2',
            !isSidebarOpen && 'flex-col'
          )}>
            <Link
              to="/profile"
              className={classNames(
                'flex items-center gap-2.5 min-w-0 flex-1',
                'p-1.5 -ml-1.5 rounded-lg',
                'text-sidebar-text hover:bg-white/10 hover:text-white',
                'transition-colors duration-150',
                !isSidebarOpen && 'flex-col gap-0 p-1'
              )}
            >
              {/* Avatar */}
              <div className="w-7 h-7 rounded-full bg-primary-600 flex-shrink-0
                              flex items-center justify-center
                              text-white text-xs font-bold ring-2 ring-primary-500/30">
                {userInitials}
              </div>
              {isSidebarOpen && (
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-white/90 truncate leading-tight">
                    {user?.full_name}
                  </p>
                  <p className="text-[10px] text-sidebar-muted truncate leading-tight">
                    {user?.role.replace('_', ' ')}
                  </p>
                </div>
              )}
            </Link>

            <button
              onClick={handleLogout}
              className="p-1.5 rounded-lg text-sidebar-muted hover:text-red-400 hover:bg-red-500/10
                         transition-colors duration-150 flex-shrink-0"
              title="Sign out"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main content ─────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="h-14 bg-white border-b border-gray-100 shadow-[0_1px_3px_0_rgb(0_0_0/0.04)]
                           flex items-center justify-between px-6 flex-shrink-0">
          <div>
            {/* Breadcrumb-style current page title */}
            <p className="text-sm font-semibold text-gray-800 capitalize">
              {location.pathname === '/' ? 'Dashboard' : location.pathname.replace('/', '').replace('-', ' ')}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-400">
              {new Date().toLocaleDateString('en-TZ', { weekday: 'short', day: 'numeric', month: 'short' })}
            </span>
            {/* Online indicator */}
            <span className="flex items-center gap-1.5 text-xs text-green-600 font-medium">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse-dot" />
              Online
            </span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto">
          <div className="p-6 animate-fade-in">
            <Outlet />
          </div>
          {showFooter && (
            <footer className="px-6 py-4 text-xs text-gray-400 border-t border-gray-100 text-center">
              {footerContent}
            </footer>
          )}
        </main>
      </div>

      <ToastContainer toasts={toasts} onClose={removeToast} />
    </div>
  );
};

export default Layout;