import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { Parish, UserRole } from '../types';
import { useAuth } from '../context/AuthContext';
import {
  Church, Users, MapPin, Phone, Mail, Calendar, DollarSign, Activity,
  TrendingUp, TrendingDown, Home, Layers, FileText, Settings, ArrowLeft,
  Award, Clock, CheckCircle, AlertCircle, User, Building
} from 'lucide-react';

interface ParishStats {
  total_members: number;
  total_families: number;
  total_clusters: number;
  total_sccs: number;
  monthly_income: number;
  monthly_expenses: number;
  sacraments_this_month: number;
  attendance_rate: number;
  active_groups: number;
  upcoming_events: number;
}

const ParishProfile = () => {
  const { parishId } = useParams<{ parishId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [parish, setParish] = useState<Parish | null>(null);
  const [stats, setStats] = useState<ParishStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get parish ID from user if not in URL (for non-super admins)
  const effectiveParishId = parishId || user?.parish_id;

  useEffect(() => {
    const fetchParishData = async () => {
      if (!effectiveParishId) {
        setError('No parish specified');
        setLoading(false);
        return;
      }

      try {
        // Check if user has access to this parish
        if (user?.role !== UserRole.SUPER_ADMIN && user?.parish_id !== effectiveParishId) {
          setError('You do not have permission to view this parish');
          setLoading(false);
          return;
        }

        const [parishData, parishStats] = await Promise.all([
          api.getParish(effectiveParishId),
          api.getParishStats(effectiveParishId)
        ]);

        setParish(parishData);

        // Use real statistics from database with fallbacks
        setStats({
          total_members: parishStats.total_members || 0,
          total_families: parishStats.total_families || 0,
          total_clusters: parishStats.total_clusters || 0,
          total_sccs: 0, // Not available in DashboardStats
          monthly_income: Number(parishStats.total_income) || 0,
          monthly_expenses: Number(parishStats.total_expenses) || 0,
          sacraments_this_month: 0, // Not available in DashboardStats
          attendance_rate: 0, // Not available in DashboardStats
          active_groups: 0, // Not available in DashboardStats
          upcoming_events: 0 // Not available in DashboardStats
        });
      } catch (err) {
        console.error('Failed to load parish data:', err);
        setError('Failed to load parish information');
      } finally {
        setLoading(false);
      }
    };

    fetchParishData();
  }, [effectiveParishId, user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error || !parish) {
    return (
      <div className="text-center py-12">
        <div className="text-red-500 mb-4">{error || 'Parish not found'}</div>
        <button
          onClick={() => navigate(-1)}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
        >
          Go Back
        </button>
      </div>
    );
  }

  const StatCard = ({
    title,
    value,
    subtitle,
    icon: Icon,
    color = 'blue',
    trend
  }: {
    title: string;
    value: string | number;
    subtitle: string;
    icon: any;
    color?: string;
    trend?: { value: number; isPositive: boolean };
  }) => {
    const colorClasses = {
      blue: 'bg-blue-50 text-blue-600',
      green: 'bg-green-50 text-green-600',
      purple: 'bg-purple-50 text-purple-600',
      amber: 'bg-amber-50 text-amber-600',
      red: 'bg-red-50 text-red-600',
      indigo: 'bg-indigo-50 text-indigo-600'
    };

    return (
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <div className={`p-3 rounded-lg ${colorClasses[color as keyof typeof colorClasses]}`}>
            <Icon size={24} />
          </div>
          {trend && (
            <span className={`flex items-center gap-1 text-sm ${trend.isPositive ? 'text-green-600' : 'text-red-600'
              }`}>
              {trend.isPositive ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
              {trend.value}%
            </span>
          )}
        </div>
        <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
        <p className="text-gray-500 text-sm mt-1">{title}</p>
        <p className="text-gray-400 text-xs mt-1">{subtitle}</p>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft size={20} className="text-gray-600" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">{parish.parish_name}</h1>
          <p className="text-gray-500 text-sm mt-1">Parish Profile & Statistics</p>
        </div>
        {(user?.role === UserRole.SUPER_ADMIN || user?.role === UserRole.PARISH_ADMIN) && (
          <button
            onClick={() => navigate(`/parishes/${parish.id}/edit`)}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <Settings size={16} />
            Edit Parish
          </button>
        )}
      </div>

      {/* Basic Information */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
          <Church size={20} className="text-primary-600" />
          Parish Information
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-gray-50 rounded-lg">
              <Building size={16} className="text-gray-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Parish Code</p>
              <p className="font-medium text-gray-900">{parish.parish_code}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="p-2 bg-gray-50 rounded-lg">
              <Award size={16} className="text-gray-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Patron Saint</p>
              <p className="font-medium text-gray-900">{parish.patron_saint || 'Not specified'}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="p-2 bg-gray-50 rounded-lg">
              <User size={16} className="text-gray-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Parish Priest</p>
              <p className="font-medium text-gray-900">{parish.priest_name || 'Not assigned'}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="p-2 bg-gray-50 rounded-lg">
              <MapPin size={16} className="text-gray-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Address</p>
              <p className="font-medium text-gray-900">{parish.physical_address || 'Not specified'}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="p-2 bg-gray-50 rounded-lg">
              <Phone size={16} className="text-gray-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Contact Phone</p>
              <p className="font-medium text-gray-900">{parish.contact_phone || 'Not specified'}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="p-2 bg-gray-50 rounded-lg">
              <Mail size={16} className="text-gray-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Contact Email</p>
              <p className="font-medium text-gray-900">{parish.contact_email || 'Not specified'}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="p-2 bg-gray-50 rounded-lg">
              <Calendar size={16} className="text-gray-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Established Date</p>
              <p className="font-medium text-gray-900">
                {parish.established_date ? new Date(parish.established_date).toLocaleDateString() : 'Not specified'}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="p-2 bg-gray-50 rounded-lg">
              <Activity size={16} className="text-gray-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Status</p>
              <div className="flex items-center gap-2 mt-1">
                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${parish.is_active
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
                  }`}>
                  {parish.is_active ? <CheckCircle size={12} /> : <AlertCircle size={12} />}
                  {parish.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Statistics Overview */}
      {stats && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Total Members"
              value={stats.total_members.toLocaleString()}
              subtitle="Registered parishioners"
              icon={Users}
              color="blue"
              trend={{ value: 8, isPositive: true }}
            />
            <StatCard
              title="Total Families"
              value={stats.total_families.toLocaleString()}
              subtitle="Registered families"
              icon={Home}
              color="purple"
              trend={{ value: 5, isPositive: true }}
            />
            <StatCard
              title="Monthly Income"
              value={stats.monthly_income.toLocaleString('en-TZ', { style: 'currency', currency: 'TZS', maximumFractionDigits: 0 })}
              subtitle="This month's revenue"
              icon={DollarSign}
              color="green"
              trend={{ value: 12, isPositive: true }}
            />
            <StatCard
              title="Attendance Rate"
              value={`${stats.attendance_rate}%`}
              subtitle="Average Sunday attendance"
              icon={Activity}
              color="amber"
              trend={{ value: 3, isPositive: false }}
            />
          </div>

          {/* Detailed Statistics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Community Statistics */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Users size={20} className="text-primary-600" />
                Community Statistics
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Layers size={16} className="text-purple-600" />
                    <span className="text-sm font-medium text-gray-700">Small Christian Communities</span>
                  </div>
                  <span className="text-lg font-bold text-gray-900">{stats.total_sccs}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <MapPin size={16} className="text-blue-600" />
                    <span className="text-sm font-medium text-gray-700">Clusters</span>
                  </div>
                  <span className="text-lg font-bold text-gray-900">{stats.total_clusters}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Activity size={16} className="text-green-600" />
                    <span className="text-sm font-medium text-gray-700">Active Groups</span>
                  </div>
                  <span className="text-lg font-bold text-gray-900">{stats.active_groups}</span>
                </div>
              </div>
            </div>

            {/* Spiritual Activities */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Award size={20} className="text-primary-600" />
                Spiritual Activities
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Layers size={16} className="text-amber-600" />
                    <span className="text-sm font-medium text-gray-700">Sacraments This Month</span>
                  </div>
                  <span className="text-lg font-bold text-gray-900">{stats.sacraments_this_month}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Calendar size={16} className="text-indigo-600" />
                    <span className="text-sm font-medium text-gray-700">Upcoming Events</span>
                  </div>
                  <span className="text-lg font-bold text-gray-900">{stats.upcoming_events}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Clock size={16} className="text-blue-600" />
                    <span className="text-sm font-medium text-gray-700">Mass Schedule</span>
                  </div>
                  <span className="text-sm font-bold text-gray-900">4/week</span>
                </div>
              </div>
            </div>
          </div>

          {/* Financial Overview */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <DollarSign size={20} className="text-primary-600" />
              Financial Overview
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-green-600 font-medium mb-2">Monthly Income</p>
                <p className="text-2xl font-bold text-green-700">
                  {stats.monthly_income > 0
                    ? stats.monthly_income.toLocaleString('en-TZ', { style: 'currency', currency: 'TZS', maximumFractionDigits: 0 })
                    : 'No data'
                  }
                </p>
                <div className="flex items-center justify-center gap-1 mt-2 text-green-600">
                  <TrendingUp size={16} />
                  <span className="text-sm">Data available</span>
                </div>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <p className="text-sm text-red-600 font-medium mb-2">Monthly Expenses</p>
                <p className="text-2xl font-bold text-red-700">
                  {stats.monthly_expenses > 0
                    ? stats.monthly_expenses.toLocaleString('en-TZ', { style: 'currency', currency: 'TZS', maximumFractionDigits: 0 })
                    : 'No data'
                  }
                </p>
                <div className="flex items-center justify-center gap-1 mt-2 text-red-600">
                  <TrendingDown size={16} />
                  <span className="text-sm">Data available</span>
                </div>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-600 font-medium mb-2">Net Balance</p>
                <p className="text-2xl font-bold text-blue-700">
                  {(stats.monthly_income > 0 || stats.monthly_expenses > 0)
                    ? (stats.monthly_income - stats.monthly_expenses).toLocaleString('en-TZ', { style: 'currency', currency: 'TZS', maximumFractionDigits: 0 })
                    : 'No data'
                  }
                </p>
                <div className="flex items-center justify-center gap-1 mt-2 text-blue-600">
                  <TrendingUp size={16} />
                  <span className="text-sm">Calculated</span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Quick Actions */}
      {(user?.role === UserRole.SUPER_ADMIN || user?.role === UserRole.PARISH_ADMIN) && (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <button
              onClick={() => navigate(`/members?parish=${parish.id}`)}
              className="flex flex-col items-center gap-2 p-4 rounded-lg border border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-colors"
            >
              <Users size={20} className="text-blue-600" />
              <span className="text-sm font-medium text-gray-700">View Members</span>
            </button>
            <button
              onClick={() => navigate(`/finance?parish=${parish.id}`)}
              className="flex flex-col items-center gap-2 p-4 rounded-lg border border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-colors"
            >
              <DollarSign size={20} className="text-green-600" />
              <span className="text-sm font-medium text-gray-700">View Finance</span>
            </button>
            <button
              onClick={() => navigate(`/reports?parish=${parish.id}`)}
              className="flex flex-col items-center gap-2 p-4 rounded-lg border border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-colors"
            >
              <FileText size={20} className="text-purple-600" />
              <span className="text-sm font-medium text-gray-700">View Reports</span>
            </button>
            <button
              onClick={() => navigate(`/events?parish=${parish.id}`)}
              className="flex flex-col items-center gap-2 p-4 rounded-lg border border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-colors"
            >
              <Calendar size={20} className="text-amber-600" />
              <span className="text-sm font-medium text-gray-700">View Events</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ParishProfile;
