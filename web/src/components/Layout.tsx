import { Link, useLocation, Outlet, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, Church, Coins, Menu, Scroll, LogOut, ShieldCheck, Wallet, FileBarChart, Upload, Network, Home, Settings, ChevronDown, ChevronRight, LucideIcon, Shield, Building, Calendar, Church as LiturgicalIcon, Megaphone, UserCheck, Search, Bell, ChevronLeft, User } from 'lucide-react';
import { useState, useMemo, useEffect, useRef } from 'react';
import classNames from 'classnames';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { UserRole } from '../types';
import { api } from '../api/client';
import ToastContainer, { ToastType } from './Toast';
import LanguageSelector from './LanguageSelector';

interface NavItem {
  name: string;
  href: string;
  icon: LucideIcon;
}

interface NavSection {
  id: string;
  label: string;
  items: NavItem[];
}

const Layout = () => {
  const { getSetting, loading } = useSettings();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['people', 'finance']));
  const [toasts, setToasts] = useState<{ id: string; type: ToastType; message: string }[]>([]);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const userDropdownRef = useRef<HTMLDivElement>(null);
  const notifDropdownRef = useRef<HTMLDivElement>(null);
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

  useEffect(() => {
    const fetchNotificationCount = async () => {
      try {
        const notifs = await api.listNotifications({ limit: 10 });
        setNotificationCount(notifs.filter(n => n.status === 'PENDING' || n.status === 'SENT').length);
      } catch { /* non-critical */ }
    };
    fetchNotificationCount();
    const interval = setInterval(fetchNotificationCount, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target as Node)) setShowUserDropdown(false);
      if (notifDropdownRef.current && !notifDropdownRef.current.contains(event.target as Node)) setShowNotifications(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const appName = getSetting('ui.app_name') || 'Sanctus';
  const logoUrl = getSetting('ui.logo_url');
  const footerContent = getSetting('ui.footer_content');
  const showFooter = getSetting('ui.footer_show') !== 'false';
  const showBreadcrumb = getSetting('ui.topbar_show_breadcrumb') !== 'false';
  const showSearch = getSetting('ui.topbar_show_search') !== 'false';

  const handleLogout = () => { logout(); navigate('/login'); };
  const removeToast = (id: string) => { setToasts(prev => prev.filter(t => t.id !== id)); };
  const toggleSection = (section: string) => {
    setExpandedSections(prev => { const s = new Set(prev); if (s.has(section)) s.delete(section); else s.add(section); return s; });
  };

  const breadcrumbs = useMemo(() => {
    const pathMap: Record<string, string> = {
      '/': 'Dashboard', '/families': 'Families', '/members': 'Members', '/clusters': 'Clusters & SCCs',
      '/sacraments': 'Sacraments', '/events': 'Events', '/liturgical-calendar': 'Liturgical Calendar',
      '/announcements': 'Announcements', '/attendance': 'Attendance', '/finance': 'Transactions',
      '/budgets': 'Budgets', '/reports': 'Reports', '/import': 'Data Import', '/dioceses': 'Dioceses',
      '/parishes': 'Parishes', '/users': 'Users', '/roles': 'Roles & Permissions', '/settings': 'Settings', '/profile': 'Profile',
    };
    const path = location.pathname;
    const crumbs = [{ label: 'Home', href: '/' }];
    if (path !== '/') crumbs.push({ label: pathMap[path] || path.slice(1).replace(/-/g, ' '), href: path });
    return crumbs;
  }, [location.pathname]);

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
        id: 'people', label: 'People', items: [
          { name: 'Families', href: '/families', icon: Home },
          { name: 'Members', href: '/members', icon: Users },
          { name: 'Clusters & SCCs', href: '/clusters', icon: Network },
        ]
      });
    }
    if (canManagePeople || isViewer) {
      sections.push({
        id: 'ministry', label: 'Ministry', items: [
          { name: 'Sacraments', href: '/sacraments', icon: Scroll },
          { name: 'Events', href: '/events', icon: Calendar },
          { name: 'Liturgical Calendar', href: '/liturgical-calendar', icon: LiturgicalIcon },
          { name: 'Announcements', href: '/announcements', icon: Megaphone },
          { name: 'Attendance', href: '/attendance', icon: UserCheck },
        ]
      });
    }
    if (canManageFinance || isViewer) {
      sections.push({
        id: 'finance', label: 'Finance', items: [
          { name: 'Transactions', href: '/finance', icon: Coins },
          { name: 'Budgets', href: '/budgets', icon: Wallet },
          { name: 'Reports', href: '/reports', icon: FileBarChart },
        ]
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

  return (
    <div className="flex h-screen bg-[#f8fafc] font-sans antialiased">
      {/* ===== SPLIT-TONE SIDEBAR ===== */}
      <div className={classNames(
        "flex flex-col transition-all duration-300 ease-in-out shadow-xl shadow-slate-900/10",
        { "w-64": isSidebarOpen, "w-[70px]": !isSidebarOpen }
      )}>
        {/* Dark left section with logo */}
        <div className="bg-[#0f172a] flex-shrink-0">
          <div className="flex items-center justify-between px-4 h-16">
            <div className="flex items-center gap-3 overflow-hidden min-w-0">
              {logoUrl ? (
                <img src={logoUrl} alt="Logo" className="h-8 w-8 object-contain rounded-lg flex-shrink-0 ring-2 ring-white/10" />
              ) : (
                <div className="h-8 w-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold flex-shrink-0 text-sm shadow-lg shadow-indigo-500/30">
                  {appName?.[0] || 'S'}
                </div>
              )}
              {isSidebarOpen && <h1 className="text-lg font-bold text-white/90 truncate tracking-tight">{appName}</h1>}
            </div>
            {isSidebarOpen && (
              <button onClick={() => setIsSidebarOpen(false)} className="p-1.5 rounded-lg hover:bg-white/10 transition-all text-slate-400 hover:text-white active:scale-95" title="Collapse sidebar">
                <ChevronLeft size={18} />
              </button>
            )}
          </div>
        </div>

        {/* Light right section with navigation */}
        <div className="bg-white flex-1 overflow-hidden flex flex-col">

          {/* Navigation */}
          <nav className="flex-1 py-4 overflow-y-auto scrollbar-thin">
            {navigation.map((section) => {
              const isExpanded = expandedSections.has(section.id);
              return (
                <div key={section.id} className="mb-1">
                  {isSidebarOpen && (
                    <button onClick={() => toggleSection(section.id)}
                      className="w-full flex items-center justify-between px-4 py-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400 hover:text-slate-600 transition-colors">
                      <span>{section.label}</span>
                      {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                    </button>
                  )}
                  {(isExpanded || !isSidebarOpen) && (
                    <div className={classNames({ "mt-1 space-y-0.5 px-3": isSidebarOpen, "px-2 space-y-0.5": !isSidebarOpen })}>
                      {section.items.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.href;
                        return (
                          <Link key={item.name} to={item.href}
                            className={classNames(
                              "flex items-center rounded-lg transition-all duration-200 group relative overflow-hidden",
                              {
                                "bg-gradient-to-r from-indigo-50 to-indigo-100/50 text-indigo-700 font-medium shadow-sm": isActive,
                                "text-slate-600 hover:bg-slate-50 hover:text-slate-900": !isActive,
                                "px-3 py-2.5 gap-3": isSidebarOpen,
                                "p-2.5 justify-center": !isSidebarOpen,
                              }
                            )}
                            title={!isSidebarOpen ? item.name : undefined}
                          >
                            {isActive && <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500 rounded-r" />}
                            <Icon size={18} className={classNames("flex-shrink-0 transition-transform duration-200 group-hover:scale-110", { "text-indigo-500": isActive, "text-slate-400 group-hover:text-slate-600": !isActive })} />
                            {isSidebarOpen && <span className="text-sm truncate">{item.name}</span>}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

          {/* User Profile at bottom */}
          <div className="border-t border-slate-100 p-3 bg-slate-50/50">
            <div className={classNames("flex items-center", { "gap-3": isSidebarOpen, "justify-center": !isSidebarOpen })}>
              <Link to="/profile" className="flex items-center min-w-0 group">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex-shrink-0 flex items-center justify-center text-white font-bold text-sm shadow-md shadow-indigo-200 group-hover:shadow-lg group-hover:shadow-indigo-300/50 transition-shadow">
                  {user?.full_name?.[0] || 'U'}
                </div>
                {isSidebarOpen && (
                  <div className="ml-3 truncate text-left">
                    <p className="text-sm font-semibold text-slate-700 truncate group-hover:text-indigo-600 transition-colors">{user?.full_name}</p>
                    <p className="text-xs text-slate-400 capitalize truncate">{user?.role?.replace('_', ' ').toLowerCase()}</p>
                  </div>
                )}
              </Link>
              {isSidebarOpen && (
                <button onClick={handleLogout} className="ml-auto p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all active:scale-95" title="Logout">
                  <LogOut size={16} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ===== MAIN AREA ===== */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* ===== TOP NAVBAR (DashboardKit style) ===== */}
        <header className="h-16 bg-white/80 backdrop-blur-xl border-b border-slate-200/60 flex items-center justify-between px-6 flex-shrink-0 sticky top-0 z-30">
          {/* Left: hamburger + breadcrumb */}
          <div className="flex items-center gap-4 min-w-0">
            {!isSidebarOpen && (
              <button onClick={() => setIsSidebarOpen(true)} className="p-2 rounded-xl hover:bg-slate-100 transition-all text-slate-500 hover:text-slate-700 active:scale-95">
                <Menu size={20} />
              </button>
            )}
            {showBreadcrumb && (
              <nav className="flex items-center text-sm text-slate-500 min-w-0">
                {breadcrumbs.map((crumb, i) => (
                  <span key={crumb.href} className="flex items-center">
                    {i > 0 && <ChevronRight size={14} className="mx-1.5 text-slate-300 flex-shrink-0" />}
                    {i === breadcrumbs.length - 1 ? (
                      <span className="font-semibold text-slate-800 truncate">{crumb.label}</span>
                    ) : (
                      <Link to={crumb.href} className="hover:text-indigo-600 transition-colors truncate">{crumb.label}</Link>
                    )}
                  </span>
                ))}
              </nav>
            )}
          </div>

          {/* Right: search, language, notifications, user */}
          <div className="flex items-center gap-2">
            {showSearch && (
              <div className="relative hidden md:block">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="text" placeholder="Search..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                  className="pl-9 pr-4 py-2 w-56 bg-slate-100/50 border border-slate-200/60 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400/50 transition-all placeholder:text-slate-400" />
              </div>
            )}

            <LanguageSelector />

            {/* Notifications */}
            <div className="relative" ref={notifDropdownRef}>
              <button onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2.5 rounded-xl hover:bg-slate-100 transition-all text-slate-500 hover:text-slate-700 active:scale-95">
                <Bell size={18} />
                {notificationCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-white">
                    {notificationCount > 9 ? '9+' : notificationCount}
                  </span>
                )}
              </button>
              {showNotifications && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-2xl shadow-slate-900/10 border border-slate-100 py-2 z-50 max-h-96 overflow-y-auto">
                  <div className="px-4 py-3 border-b border-slate-100">
                    <h3 className="font-semibold text-slate-800 text-sm">Notifications</h3>
                  </div>
                  <div className="px-4 py-8 text-center text-slate-400 text-sm">
                    <Bell size={28} className="mx-auto mb-3 text-slate-200" />
                    <p>No new notifications</p>
                  </div>
                </div>
              )}
            </div>

            {/* User Dropdown */}
            <div className="relative" ref={userDropdownRef}>
              <button onClick={() => setShowUserDropdown(!showUserDropdown)}
                className="flex items-center gap-2 p-1.5 pl-1.5 pr-3 rounded-xl hover:bg-slate-100 transition-all active:scale-95">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-bold text-xs shadow-md shadow-indigo-200">
                  {user?.full_name?.[0] || 'U'}
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-sm font-semibold text-slate-700 leading-tight">{user?.full_name}</p>
                  <p className="text-xs text-slate-400 capitalize leading-tight">{user?.role?.replace('_', ' ').toLowerCase()}</p>
                </div>
                <ChevronDown size={14} className="text-slate-400 hidden md:block" />
              </button>
              {showUserDropdown && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-2xl shadow-slate-900/10 border border-slate-100 py-2 z-50 overflow-hidden">
                  <Link to="/profile" onClick={() => setShowUserDropdown(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors">
                    <User size={16} /> Profile
                  </Link>
                  {canAdmin && (
                    <Link to="/settings" onClick={() => setShowUserDropdown(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors">
                      <Settings size={16} /> Settings
                    </Link>
                  )}
                  <div className="border-t border-slate-100 my-1" />
                  <button onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors">
                    <LogOut size={16} /> Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* ===== CONTENT AREA ===== */}
        <main className="flex-1 overflow-auto">
          <div className="p-6">
            <Outlet />
          </div>
          {showFooter && (
            <footer className="bg-white border-t border-slate-100 py-4 px-6 text-sm text-center text-slate-400">
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
