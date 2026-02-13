import { Link, useLocation, Outlet, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, Church, Coins, Menu, X, Scroll, LogOut, ShieldCheck, Wallet, FileBarChart, Upload, Network, Home, Settings, ChevronDown, ChevronRight, LucideIcon, Shield } from 'lucide-react';
import { useState, useMemo } from 'react';
import classNames from 'classnames';
import { useAuth } from '../context/AuthContext';
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
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['people', 'finance']));
  const [toasts, setToasts] = useState<{ id: string; type: ToastType; message: string }[]>([]);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

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
  const canWrite = !isViewer;
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
      sections.push({
        id: 'ministry', label: 'Ministry', items: [
          { name: 'Sacraments', href: '/sacraments', icon: Scroll },
        ]
      });
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
          "bg-white shadow-lg transition-all duration-300 ease-in-out flex flex-col",
          {
            "w-64": isSidebarOpen,
            "w-20": !isSidebarOpen,
          }
        )}
      >
        {/* Logo / Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100 h-16">
          {isSidebarOpen ? (
            <h1 className="text-xl font-bold text-primary-600 truncate">Sanctus</h1>
          ) : (
            <span className="text-xl font-bold text-primary-600 mx-auto">S</span>
          )}
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-1 rounded-md hover:bg-gray-100 text-gray-500"
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
                  className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider hover:text-gray-700 transition-colors"
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
                              "bg-primary-50 text-primary-700": isActive,
                              "text-gray-600 hover:bg-gray-50 hover:text-gray-900": !isActive,
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
        <div className="p-4 border-t border-gray-100">
          <div className={classNames("flex items-center justify-between", { "flex-col gap-4": !isSidebarOpen })}>
            <Link
              to="/profile"
              className="flex items-center min-w-0 hover:bg-gray-50 rounded-md p-1 -ml-1 transition-colors flex-1"
            >
              <div className="w-8 h-8 rounded-full bg-primary-100 flex-shrink-0 flex items-center justify-center text-primary-700 font-bold">
                {user?.full_name?.[0] || 'U'}
              </div>
              {isSidebarOpen && (
                <div className="ml-3 truncate text-left">
                  <p className="text-sm font-medium text-gray-900 truncate">{user?.full_name}</p>
                  <p className="text-xs text-gray-500 truncate">{user?.role.replace('_', ' ')}</p>
                </div>
              )}
            </Link>
            <button
              onClick={handleLogout}
              className={classNames(
                "p-2 text-gray-400 hover:text-red-600 rounded-md hover:bg-red-50 transition-colors",
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
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          <Outlet />
        </div>
      </main>

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </div>
  );
};

export default Layout;
