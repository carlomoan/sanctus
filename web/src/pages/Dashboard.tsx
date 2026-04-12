import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { DashboardStats, Parish, UserRole } from '../types';
import { useAuth } from '../context/AuthContext';
import {
  Users, Church, Coins, FileText, UserPlus, Home, MapPin, Layers, ArrowRight, Search,
  TrendingUp, TrendingDown, Calendar, DollarSign, Activity, PieChart, BarChart3,
  UserCheck, Settings, Eye, Edit, Shield, CreditCard, FileSpreadsheet, Award
} from 'lucide-react';
import ImportButton from '../components/ImportButton';

interface RoleBasedStats extends DashboardStats {
  parish_growth?: number;
  monthly_income?: number;
  monthly_expenses?: number;
  member_attendance?: number;
  pending_tasks?: number;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stats, setStats] = useState<RoleBasedStats | null>(null);
  const [parishes, setParishes] = useState<Parish[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Filter parishes based on user role
  const getAccessibleParishes = (allParishes: Parish[]) => {
    if (!user) return [];

    // Super admins can see all parishes
    if (user.role === UserRole.SUPER_ADMIN) {
      return allParishes;
    }

    // Other roles can only see their assigned parish and only active ones
    return allParishes.filter(p =>
      p.id === user.parish_id && p.is_active
    );
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [s, allParishes] = await Promise.all([api.getDashboardStats(), api.listParishes()]);

        // Filter parishes based on user role
        const accessibleParishes = getAccessibleParishes(allParishes);

        // Get stats for user's parish if not super admin
        let filteredStats = s;
        if (user?.role !== UserRole.SUPER_ADMIN && user?.parish_id) {
          // TODO: Implement parish-specific stats endpoint
          // For now, use the general stats but they should be filtered by parish
          filteredStats = { ...s };
        }

        setStats(filteredStats);
        setParishes(accessibleParishes);
      } catch (err) {
        console.error('Failed to load dashboard stats:', err);
        setError('Failed to load dashboard statistics');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return <div className="text-center py-12 text-red-500">{error}</div>;
  }

  const defaultParishId = parishes[0]?.id;
  const filteredParishes = parishes.filter(p =>
    p.parish_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.parish_code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getRoleSpecificQuickActions = () => {
    const actions = [];

    switch (user?.role) {
      case UserRole.SUPER_ADMIN:
        actions.push(
          { icon: Users, label: 'Manage Users', path: '/users', color: 'blue' },
          { icon: Church, label: 'Manage Parishes', path: '/parishes', color: 'indigo' },
          { icon: Shield, label: 'Role Management', path: '/roles', color: 'purple' },
          { icon: Settings, label: 'System Settings', path: '/settings', color: 'gray' },
          { icon: BarChart3, label: 'All Reports', path: '/reports', color: 'green' }
        );
        break;

      case UserRole.PARISH_ADMIN:
        actions.push(
          { icon: UserPlus, label: 'Add Member', path: '/members', color: 'blue' },
          { icon: Home, label: 'Add Family', path: '/families', color: 'purple' },
          { icon: MapPin, label: 'Add SCC/Cluster', path: '/clusters', color: 'teal' },
          { icon: Layers, label: 'Add Sacrament', path: '/sacraments', color: 'amber' },
          { icon: Eye, label: 'Parish Profile', path: '/parish-profile', color: 'indigo' }
        );
        break;

      case UserRole.ACCOUNTANT:
        actions.push(
          { icon: Coins, label: 'Record Income', path: '/finance?tab=income', color: 'green' },
          { icon: CreditCard, label: 'Record Expense', path: '/finance?tab=expenses', color: 'red' },
          { icon: FileText, label: 'Pending Vouchers', path: '/finance?tab=pending', color: 'orange' },
          { icon: PieChart, label: 'Financial Reports', path: '/reports', color: 'purple' },
          { icon: FileSpreadsheet, label: 'Budget Management', path: '/budgets', color: 'blue' }
        );
        break;

      case UserRole.SECRETARY:
        actions.push(
          { icon: UserPlus, label: 'Add Member', path: '/members', color: 'blue' },
          { icon: Layers, label: 'Add Sacrament', path: '/sacraments', color: 'amber' },
          { icon: FileText, label: 'Generate Reports', path: '/reports', color: 'purple' },
          { icon: Calendar, label: 'Manage Events', path: '/events', color: 'indigo' },
          { icon: Award, label: 'Certificates', path: '/certificates', color: 'green' }
        );
        break;

      case UserRole.VIEWER:
        actions.push(
          { icon: Eye, label: 'View Members', path: '/members', color: 'blue' },
          { icon: Church, label: 'Parish Info', path: '/parish-profile', color: 'indigo' },
          { icon: BarChart3, label: 'View Reports', path: '/reports', color: 'purple' },
          { icon: Calendar, label: 'View Calendar', path: '/calendar', color: 'green' }
        );
        break;

      default:
        actions.push(
          { icon: Eye, label: 'View Dashboard', path: '/dashboard', color: 'gray' }
        );
    }

    return actions;
  };

  const getRoleSpecificStats = () => {
    const stats_cards = [];

    switch (user?.role) {
      case UserRole.SUPER_ADMIN:
        stats_cards.push(
          {
            title: 'Total Parishes',
            value: (stats?.active_parishes || 0).toLocaleString(),
            subtitle: 'Across diocese',
            icon: Church,
            color: 'indigo',
            trend: stats?.parish_growth ? { value: stats.parish_growth, isPositive: stats.parish_growth > 0 } : undefined
          },
          {
            title: 'Total Members',
            value: (stats?.total_members || 0).toLocaleString(),
            subtitle: 'Registered parishioners',
            icon: Users,
            color: 'blue',
            trend: stats?.parish_growth ? { value: stats.parish_growth, isPositive: stats.parish_growth > 0 } : undefined
          },
          {
            title: 'Total Income',
            value: Number(stats?.total_income || 0).toLocaleString('en-TZ', { style: 'currency', currency: 'TZS', maximumFractionDigits: 0 }),
            subtitle: 'All parishes combined',
            icon: Coins,
            color: 'green',
            trend: undefined // TODO: Add income trend from backend
          },
          {
            title: 'Active Users',
            value: '124', // TODO: Get from backend
            subtitle: 'System users',
            icon: UserCheck,
            color: 'purple',
            trend: undefined // TODO: Add user trend from backend
          }
        );
        break;

      case UserRole.PARISH_ADMIN:
        stats_cards.push(
          {
            title: 'Parish Members',
            value: (stats?.total_members || 0).toLocaleString(),
            subtitle: 'Registered members',
            icon: Users,
            color: 'blue',
            trend: stats?.parish_growth ? { value: stats.parish_growth, isPositive: stats.parish_growth > 0 } : undefined
          },
          {
            title: 'Monthly Income',
            value: Number(stats?.monthly_income || 0).toLocaleString('en-TZ', { style: 'currency', currency: 'TZS', maximumFractionDigits: 0 }),
            subtitle: 'This month',
            icon: TrendingUp,
            color: 'green',
            trend: undefined // TODO: Add monthly income trend from backend
          },
          {
            title: 'Attendance Rate',
            value: stats?.member_attendance ? `${stats.member_attendance}%` : '0%',
            subtitle: 'Average Sunday attendance',
            icon: Activity,
            color: 'purple',
            trend: undefined // TODO: Add attendance trend from backend
          },
          {
            title: 'Families',
            value: (stats?.total_families || 0).toLocaleString(),
            subtitle: 'Registered families',
            icon: Home,
            color: 'amber',
            trend: undefined // TODO: Add families trend from backend
          }
        );
        break;

      case UserRole.ACCOUNTANT:
        stats_cards.push(
          {
            title: 'Monthly Income',
            value: Number(stats?.monthly_income || stats?.total_income || 0).toLocaleString('en-TZ', { style: 'currency', currency: 'TZS', maximumFractionDigits: 0 }),
            subtitle: 'This month',
            icon: TrendingUp,
            color: 'green',
            trend: undefined // TODO: Add monthly income trend from backend
          },
          {
            title: 'Monthly Expenses',
            value: Number(stats?.monthly_expenses || stats?.total_expenses || 0).toLocaleString('en-TZ', { style: 'currency', currency: 'TZS', maximumFractionDigits: 0 }),
            subtitle: 'This month',
            icon: TrendingDown,
            color: 'red',
            trend: undefined // TODO: Add expenses trend from backend
          },
          {
            title: 'Pending Vouchers',
            value: (stats?.pending_approvals || 0).toLocaleString(),
            subtitle: 'Need approval',
            icon: FileText,
            color: 'orange',
            trend: undefined
          },
          {
            title: 'Budget Used',
            value: stats?.budget_used_percentage ? `${stats.budget_used_percentage}%` : '0%',
            subtitle: 'Of annual budget',
            icon: PieChart,
            color: 'purple',
            trend: undefined
          }
        );
        break;

      case UserRole.SECRETARY:
        stats_cards.push(
          {
            title: 'Parish Members',
            value: (stats?.total_members || 0).toLocaleString(),
            subtitle: 'Registered members',
            icon: Users,
            color: 'blue',
            trend: undefined // TODO: Add members trend from backend
          },
          {
            title: 'Sacraments This Month',
            value: (stats?.sacraments_this_month || 0).toLocaleString(),
            subtitle: 'Baptisms, marriages, etc.',
            icon: Layers,
            color: 'amber',
            trend: undefined // TODO: Add sacraments trend from backend
          },
          {
            title: 'Pending Tasks',
            value: (stats?.pending_tasks || 0).toLocaleString(),
            subtitle: 'Need attention',
            icon: FileText,
            color: 'orange',
            trend: undefined
          },
          {
            title: 'Certificates Issued',
            value: '0', // TODO: Get from backend
            subtitle: 'This month',
            icon: Award,
            color: 'green',
            trend: undefined // TODO: Add certificates trend from backend
          }
        );
        break;

      case UserRole.VIEWER:
        stats_cards.push(
          {
            title: 'Parish Members',
            value: (stats?.total_members || 0).toLocaleString(),
            subtitle: 'Total registered',
            icon: Users,
            color: 'blue'
          },
          {
            title: 'Mass Schedule',
            value: '0', // TODO: Get from backend
            subtitle: 'This week',
            icon: Calendar,
            color: 'purple'
          },
          {
            title: 'Events',
            value: (stats?.upcoming_events || 0).toLocaleString(),
            subtitle: 'Upcoming',
            icon: Activity,
            color: 'green'
          },
          {
            title: 'Announcements',
            value: '0', // TODO: Get from backend
            subtitle: 'Latest updates',
            icon: FileText,
            color: 'amber'
          }
        );
        break;
    }

    return stats_cards;
  };

  const getColorClasses = (color: string) => {
    const colors: Record<string, { bg: string; text: string; hover: string }> = {
      blue: { bg: 'bg-blue-50', text: 'text-blue-600', hover: 'hover:bg-blue-100' },
      green: { bg: 'bg-green-50', text: 'text-green-600', hover: 'hover:bg-green-100' },
      red: { bg: 'bg-red-50', text: 'text-red-600', hover: 'hover:bg-red-100' },
      purple: { bg: 'bg-purple-50', text: 'text-purple-600', hover: 'hover:bg-purple-100' },
      amber: { bg: 'bg-amber-50', text: 'text-amber-600', hover: 'hover:bg-amber-100' },
      indigo: { bg: 'bg-indigo-50', text: 'text-indigo-600', hover: 'hover:bg-indigo-100' },
      orange: { bg: 'bg-orange-50', text: 'text-orange-600', hover: 'hover:bg-orange-100' },
      gray: { bg: 'bg-gray-50', text: 'text-gray-600', hover: 'hover:bg-gray-100' },
      teal: { bg: 'bg-teal-50', text: 'text-teal-600', hover: 'hover:bg-teal-100' }
    };
    return colors[color] || colors.blue;
  };

  return (
    <div className="space-y-6">
      {/* Header with Welcome Message */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back, {user?.full_name?.split(' ')[0]}!
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {user?.role === UserRole.SUPER_ADMIN && 'Super Admin Dashboard'}
            {user?.role === UserRole.PARISH_ADMIN && 'Parish Administration'}
            {user?.role === UserRole.ACCOUNTANT && 'Financial Management'}
            {user?.role === UserRole.SECRETARY && 'Parish Secretariat'}
            {user?.role === UserRole.VIEWER && 'Parish Information'}
          </p>
        </div>

        {user?.role === UserRole.SUPER_ADMIN && (
          <div className="relative w-full sm:w-64">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search parishes..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        )}
      </div>

      {/* Enhanced Stats Cards with Trends */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {getRoleSpecificStats().map((stat, index) => {
          const colors = getColorClasses(stat.color);
          const Icon = stat.icon;

          return (
            <div
              key={index}
              className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex items-start justify-between hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => {
                if (stat.title.includes('Members')) navigate('/members');
                else if (stat.title.includes('Parishes')) navigate('/parishes');
                else if (stat.title.includes('Income') || stat.title.includes('Expenses')) navigate('/finance');
                else if (stat.title.includes('Vouchers')) navigate('/finance?tab=pending');
                else if (stat.title.includes('Reports')) navigate('/reports');
              }}
            >
              <div className="flex-1">
                <h3 className="text-gray-500 text-sm font-medium">{stat.title}</h3>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-gray-400 text-xs">{stat.subtitle}</span>
                  {stat.trend && (
                    <span className={`flex items-center gap-1 text-xs ${stat.trend.isPositive ? 'text-green-600' : 'text-red-600'
                      }`}>
                      {stat.trend.isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                      {stat.trend.value}%
                    </span>
                  )}
                </div>
              </div>
              <div className={`p-3 ${colors.bg} rounded-lg ${colors.text}`}>
                <Icon size={24} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Role-Specific Quick Actions */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {getRoleSpecificQuickActions().map((action, index) => {
            const colors = getColorClasses(action.color);
            const Icon = action.icon;

            return (
              <button
                key={index}
                onClick={() => navigate(action.path)}
                className="flex flex-col items-center gap-2 p-4 rounded-lg border border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-colors group"
              >
                <div className={`p-2 ${colors.bg} rounded-lg ${colors.text} ${colors.hover}`}>
                  <Icon size={20} />
                </div>
                <span className="text-sm font-medium text-gray-700 text-center">{action.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Analytics Section - Enhanced */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Financial Performance Chart */}
        {(user?.role === UserRole.SUPER_ADMIN || user?.role === UserRole.PARISH_ADMIN || user?.role === UserRole.ACCOUNTANT) && (
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Financial Performance</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Monthly Revenue</span>
                <span className="text-sm font-medium text-green-600">
                  {stats?.monthly_income ? `TZS ${stats.monthly_income.toLocaleString()}` : 'No data'}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-green-600 h-2 rounded-full" style={{ width: stats?.monthly_income ? '75%' : '0%' }}></div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Expense Control</span>
                <span className="text-sm font-medium text-orange-600">
                  {stats?.monthly_expenses ? `TZS ${stats.monthly_expenses.toLocaleString()}` : 'No data'}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-orange-600 h-2 rounded-full" style={{ width: stats?.monthly_expenses ? '45%' : '0%' }}></div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Budget Utilization</span>
                <span className="text-sm font-medium text-blue-600">
                  {stats?.budget_used_percentage ? `${stats.budget_used_percentage}%` : 'No data'}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${stats?.budget_used_percentage || 0}%` }}></div>
              </div>
            </div>
          </div>
        )}

        {/* Parish Activity */}
        {(user?.role === UserRole.SUPER_ADMIN || user?.role === UserRole.PARISH_ADMIN || user?.role === UserRole.SECRETARY) && (
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Parish Activity</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Member Attendance</span>
                <span className="text-sm font-medium text-green-600">
                  {stats?.member_attendance ? `${stats.member_attendance}%` : 'No data'}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-green-600 h-2 rounded-full" style={{ width: `${stats?.member_attendance || 0}%` }}></div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Sacraments This Month</span>
                <span className="text-sm font-medium text-purple-600">
                  {stats?.sacraments_this_month ? stats.sacraments_this_month.toLocaleString() : '0'}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-purple-600 h-2 rounded-full" style={{ width: stats?.sacraments_this_month ? '40%' : '0%' }}></div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Community Engagement</span>
                <span className="text-sm font-medium text-blue-600">
                  {stats?.community_engagement || 'Not available'}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full" style={{
                  width: stats?.community_engagement === 'High' ? '85%' :
                    stats?.community_engagement === 'Medium' ? '60%' :
                      stats?.community_engagement === 'Low' ? '30%' : '0%'
                }}></div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Parishes List - Only for Super Admin */}
      {user?.role === UserRole.SUPER_ADMIN && (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">All Parishes ({filteredParishes.length})</h2>
          {filteredParishes.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Church size={32} className="mx-auto text-gray-300 mb-2" />
              <p>No parishes found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredParishes.map(parish => (
                <div
                  key={parish.id}
                  onClick={() => navigate(`/parishes/${parish.id}`)}
                  className="p-4 rounded-lg border border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center text-primary-700 font-bold">
                      {parish.parish_name[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 truncate">{parish.parish_name}</h3>
                      <p className="text-xs text-gray-500">{parish.parish_code}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span className={`flex items-center gap-1 ${parish.is_active ? 'text-green-600' : 'text-red-600'
                      }`}>
                      <Activity size={14} />
                      {parish.is_active ? 'Active' : 'Inactive'}
                    </span>
                    {parish.contact_phone && (
                      <span>{parish.contact_phone}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Parish Profile Button - For non-super admins */}
      {user?.role !== UserRole.SUPER_ADMIN && parishes.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Your Parish</h3>
              <p className="text-gray-500 text-sm mt-1">{parishes[0].parish_name}</p>
            </div>
            <button
              onClick={() => navigate('/parish-profile')}
              className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              <Eye size={16} />
              View Parish Profile
            </button>
          </div>
        </div>
      )}

      {/* Bulk Import - Only for Admin roles */}
      {(user?.role === UserRole.SUPER_ADMIN || user?.role === UserRole.PARISH_ADMIN) && (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Bulk Import</h2>
          <p className="text-sm text-gray-500 mb-4">Quickly import data from CSV or XLSX files. Download a template first, fill it in, then upload.</p>
          {parishes.length === 0 ? (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 text-orange-700 text-sm">
              <span className="font-medium">No parish available</span>
              <p className="mt-1">Please create a parish first before importing data.</p>
            </div>
          ) : (
            <div className="flex flex-wrap gap-3">
              <ImportButton
                label="Import Members"
                onImport={async (file) => api.importMembers(file, parishes[0].id)}
                templateColumns={['member_code', 'first_name', 'last_name']}
              />
              <ImportButton
                label="Import Clusters"
                onImport={async (file) => api.importClusters(file, parishes[0].id)}
                templateColumns={['cluster_code', 'cluster_name', 'location_description', 'leader_name']}
              />
              <ImportButton
                label="Import SCCs"
                onImport={async (file) => api.importSccs(file, parishes[0].id)}
                templateColumns={['scc_code', 'scc_name', 'cluster_code', 'patron_saint', 'leader_name', 'location_description', 'meeting_day', 'meeting_time']}
              />
              <ImportButton
                label="Import Families"
                onImport={async (file) => api.importFamilies(file, parishes[0].id)}
                templateColumns={['family_code', 'family_name', 'scc_code', 'physical_address', 'primary_phone', 'email', 'notes']}
              />
              <ImportButton
                label="Import Transactions"
                onImport={async (file) => api.importTransactions(file, parishes[0].id)}
                templateColumns={['category', 'amount', 'payment_method', 'date(YYYY-MM-DD)', 'description']}
              />
            </div>
          )}
        </div>
      )}

      {/* Quick Navigation */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button
          onClick={() => navigate('/reports')}
          className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex items-center justify-between hover:border-primary-300 transition-colors group"
        >
          <div>
            <h3 className="font-medium text-gray-900">Reports & Analytics</h3>
            <p className="text-sm text-gray-500">View detailed reports and insights</p>
          </div>
          <ArrowRight size={20} className="text-gray-400 group-hover:text-primary-600" />
        </button>

        {user?.role !== UserRole.VIEWER && (
          <button
            onClick={() => navigate('/settings')}
            className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex items-center justify-between hover:border-primary-300 transition-colors group"
          >
            <div>
              <h3 className="font-medium text-gray-900">Settings</h3>
              <p className="text-sm text-gray-500">Manage system and parish settings</p>
            </div>
            <ArrowRight size={20} className="text-gray-400 group-hover:text-primary-600" />
          </button>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
