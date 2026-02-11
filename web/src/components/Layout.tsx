import { Link, useLocation, Outlet, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, Church, Coins, Menu, X, Scroll, LogOut, ShieldCheck, Target, FileBarChart, Upload } from 'lucide-react';
import { useState, useMemo } from 'react';
import classNames from 'classnames';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';

const Layout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navigation = useMemo(() => {
    const items = [
      { name: 'Dashboard', href: '/', icon: LayoutDashboard },
      { name: 'Parishes', href: '/parishes', icon: Church },
      { name: 'Members', href: '/members', icon: Users },
      { name: 'Sacraments', href: '/sacraments', icon: Scroll },
      { name: 'Finance', href: '/finance', icon: Coins },
      { name: 'Budgets', href: '/budgets', icon: Target },
      { name: 'Reports', href: '/reports', icon: FileBarChart },
      { name: 'Import', href: '/import', icon: Upload },
    ];

    if (user?.role === UserRole.SUPER_ADMIN) {
      items.push({ name: 'Users', href: '/users', icon: ShieldCheck });
    }

    return items;
  }, [user?.role]);

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
          {navigation.map((item) => {
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
        </nav>

        {/* Footer / User Profile */}
        <div className="p-4 border-t border-gray-100">
          <div className={classNames("flex items-center justify-between", { "flex-col gap-4": !isSidebarOpen })}>
            <div className="flex items-center min-w-0">
              <div className="w-8 h-8 rounded-full bg-primary-100 flex-shrink-0 flex items-center justify-center text-primary-700 font-bold">
                {user?.full_name?.[0] || 'U'}
              </div>
              {isSidebarOpen && (
                <div className="ml-3 truncate">
                  <p className="text-sm font-medium text-gray-900 truncate">{user?.full_name}</p>
                  <p className="text-xs text-gray-500 truncate">{user?.role.replace('_', ' ')}</p>
                </div>
              )}
            </div>
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
    </div>
  );
};

export default Layout;
