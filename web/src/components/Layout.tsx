import { Link, useLocation, Outlet, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, Church, Coins, Menu, X, Scroll, LogOut, ShieldCheck, Wallet, FileBarChart, Upload, Network, Home, Settings, ChevronDown, ChevronRight, LucideIcon, Shield, Building, Calendar, Church as LiturgicalIcon } from 'lucide-react';
import { useState, useMemo, useEffect } from 'react';
import classNames from 'classnames';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { UserRole } from '../types';
import ToastContainer, { ToastType } from './Toast';

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
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  // Initialize sidebar state once settings are loaded
  useEffect(() => {
    if (!loading && !settingsLoaded) {
      const collapsed = getSetting('ui.sidebar_collapsed') === 'true';
      setIsSidebarOpen(!collapsed);
      setSettingsLoaded(true);
    }
  }, [loading, settingsLoaded, getSetting]);

  const appName = getSetting('ui.app_name') || 'Sanctus';
  const logoUrl = getSetting('ui.logo_url');
  const footerContent = getSetting('ui.footer_content');
  const showFooter = getSetting('ui.footer_show') !== 'false';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(section)) newSet.delete(section);
      else newSet.add(section);
      return newSet;
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

    // Main — everyone sees Dashboard
    const mainItems: NavItem[] = [{ name: 'Dashboard', href: '/', icon: LayoutDashboard }];
    if (canAdmin) mainItems.push({ name: 'Settings', href: '/settings', icon: Settings });
    sections.push({ id: 'main', label: 'Main', items: mainItems });

    // People — admins, secretaries
    if (canManagePeople || isViewer) {
      const peopleItems: NavItem[] = [
        { name: 'Families', href: '/families', icon: Home },
        { name: 'Members', href: '/members', icon: Users },
        { name: 'Clusters & SCCs', href: '/clusters', icon: Network },
      ];
      sections.push({ id: 'people', label: 'People', items: peopleItems });
    }

    // Ministry — admins, secretaries, viewers
    if (canManagePeople || isViewer) {
      const ministryItems: NavItem[] = [
        { name: 'Sacraments', href: '/sacraments', icon: Scroll },
        { name: 'Events', href: '/events', icon: Calendar },
        { name: 'Liturgical Calendar', href: '/liturgical-calendar', icon: LiturgicalIcon },
      ];
      sections.push({ id: 'ministry', label: 'Ministry', items: ministryItems });
    }

    // Finance — admins, accountants, viewers (read-only)
    if (canManageFinance || isViewer) {
      const financeItems: NavItem[] = [
        { name: 'Transactions', href: '/finance', icon: Coins },
        { name: 'Budgets', href: '/budgets', icon: Wallet },
        { name: 'Reports', href: '/reports', icon: FileBarChart },
      ];
      sections.push({ id: 'finance', label: 'Finance', items: financeItems });
    }

    // Administration — only admins
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
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div
        className={classNames(
          "bg-sidebar-bg text-sidebar-text shadow-lg transition-all duration-300 ease-in-out flex flex-col",
          {
            "w-64": isSidebarOpen,
            "w-20": !isSidebarOpen,
          }
        )}
      >
        {/* Logo / Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100/10 h-16 bg-sidebar-bg">
          <div className="flex items-center gap-2 overflow-hidden">
            {logoUrl ? (
              <img src={logoUrl} alt="Logo" className="h-8 w-8 object-contain" />
            ) : null}
            {isSidebarOpen ? (
              <h1 className="text-xl font-bold text-primary-600 truncate">{appName}</h1>
            ) : (
              <h1 className="text-xl font-bold text-primary-600 hidden">{appName}</h1>
            )}
          </div>
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 rounded-md hover:bg-gray-100/10 transition-colors text-sidebar-text"
            title={isSidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
          >
            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navigation.map((section) => {
            const isExpanded = expandedSections.has(section.id);
            const Chevron = isExpanded ? ChevronDown : ChevronRight;
            return (
              <div key={section.id}>
                <button
                  onClick={() => toggleSection(section.id)}
                  className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold uppercase tracking-wider opacity-70 hover:opacity-100 transition-colors text-sidebar-text"
                >
                  <span>{section.label}</span>
                  <Chevron size={14} />
                </button>
                {isExpanded && (
                  <div className="mt-1 space-y-1">
                    {section.items.map((item) => {
                      const Icon = item.icon;
                      const isActive = location.pathname === item.href;
                      return (
                        <Link
                          key={item.name}
                          to={item.href}
                          className={classNames(
                            "flex items-center px-3 py-2 rounded-md transition-colors",
                            {
                              "bg-sidebar-active bg-primary-50/10 text-primary-600": isActive,
                              "text-sidebar-text hover:bg-gray-100/10 opacity-80 hover:opacity-100": !isActive,
                              "justify-center": !isSidebarOpen,
                            }
                          )}
                          title={!isSidebarOpen ? item.name : undefined}
                        >
                          <Icon size={20} className={classNames({ "mr-3": isSidebarOpen })} />
                          {isSidebarOpen && <span className="font-medium">{item.name}</span>}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Footer / User Profile */}
        <div className="p-4 border-t border-gray-100/10">
          <div className={classNames("flex items-center justify-between", { "flex-col gap-4": !isSidebarOpen })}>
            <Link
              to="/profile"
              className="flex items-center min-w-0 hover:bg-gray-100/10 rounded-md p-1 -ml-1 transition-colors flex-1 text-sidebar-text"
            >
              <div className="w-8 h-8 rounded-full bg-primary-100 flex-shrink-0 flex items-center justify-center text-primary-700 font-bold">
                {user?.full_name?.[0] || 'U'}
              </div>
              {isSidebarOpen && (
                <div className="ml-3 truncate text-left">
                  <p className="text-sm font-medium truncate opacity-90">{user?.full_name}</p>
                  <p className="text-xs truncate opacity-70">{user?.role.replace('_', ' ')}</p>
                </div>
              )}
            </Link>
            <button
              onClick={handleLogout}
              className={classNames(
                "p-2 opacity-60 hover:text-red-600 rounded-md hover:bg-red-50/10 transition-colors",
                { "mt-2": !isSidebarOpen }
              )}
              title="Logout"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-auto flex flex-col">
        <div className="flex-1 p-8">
          <Outlet />
        </div>
        {showFooter && (
          <footer className="bg-footer-bg text-footer-text py-4 px-8 text-sm text-center border-t border-gray-200">
            {footerContent}
          </footer>
        )}
      </main>

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </div>
  );
};

export default Layout;
