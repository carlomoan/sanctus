import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { DashboardStats, Parish, UserRole } from '../types';
import { useAuth } from '../context/AuthContext';
import {
  Users,
  Calendar,
  Clock,
  MapPin,
  TrendingUp,
  Church,
  Star,
  Globe,
  Building,
  Repeat,
  Coins, FileText, UserPlus, Home, Layers, ArrowRight, Search,
  TrendingDown, Activity, PieChart, BarChart3,
  UserCheck, Settings, Eye, Shield, CreditCard, FileSpreadsheet, Award,
  Church as LiturgicalIcon,
  CalendarDays,
  Bell,
  AlertTriangle,
  CheckCircle,
  Info,
  X as XIcon
} from 'lucide-react';
import { format, addDays, isToday, isTomorrow, subMonths } from 'date-fns';
import ImportButton from '../components/ImportButton';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

interface RoleBasedStats extends DashboardStats {
  parish_growth?: number;
  monthly_income?: number;
  monthly_expenses?: number;
  member_attendance?: number;
  pending_tasks?: number;
}

interface UpcomingEvent {
  id: string;
  title: string;
  description?: string;
  start_date: string;
  start_time?: string;
  end_time?: string;
  location?: string;
  is_recurring: boolean;
  current_participants: number;
  max_participants?: number;   // was 'participants' — fixed to match type
  status: 'draft' | 'published' | 'cancelled';
  scope: 'diocese' | 'parish';
}

interface LiturgicalDay {
  id: string;
  date: string;
  title: string;
  description: string;
  feast_type: 'SOLEMNITY' | 'FEAST' | 'MEMORIAL' | 'OPTIONAL_MEMORIAL';
  liturgical_season: 'ADVENT' | 'CHRISTMAS' | 'LENT' | 'HOLY_WEEK' | 'EASTER' | 'ORDINARY_TIME';
  liturgical_color: 'WHITE' | 'RED' | 'GREEN' | 'VIOLET' | 'ROSE' | 'BLACK' | 'GOLD';
  rank: number;
}

interface Notification {
  id: string;
  type: 'success' | 'warning' | 'info' | 'error';
  title: string;
  message: string;
  time: string;
  read: boolean;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stats, setStats] = useState<RoleBasedStats | null>(null);
  const [parishes, setParishes] = useState<Parish[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<UpcomingEvent[]>([]);
  const [liturgicalDays, setLiturgicalDays] = useState<LiturgicalDay[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Chart data derived from stats
  const incomeExpenseData = stats ? [
    { month: 'Current', income: stats.monthly_income ?? 0, expenses: stats.monthly_expenses ?? 0 },
  ] : [];

  const attendanceData = stats ? [
    { week: 'This Month', attendance: stats.member_attendance ?? 0 },
  ] : [];

  const getAccessibleParishes = (allParishes: Parish[]) => {
    if (!user) return [];
    if (user.role === UserRole.SUPER_ADMIN) return allParishes;
    return allParishes.filter(p => p.id === user.parish_id && p.is_active);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [s, allParishes] = await Promise.all([api.getDashboardStats(), api.listParishes()]);
        const accessibleParishes = getAccessibleParishes(allParishes);
        let filteredStats = s;
        if (user?.role !== UserRole.SUPER_ADMIN && user?.parish_id) {
          filteredStats = { ...s };
        }

        // Fetch real upcoming events from API
        let eventsData: UpcomingEvent[] = [];
        try {
          const events = await api.listEvents({ start_date_from: format(new Date(), 'yyyy-MM-dd'), limit: 5 });
          eventsData = events.map(e => ({
            id: e.id, title: e.title, description: e.description,
            start_date: e.start_date, start_time: e.start_time, end_time: e.end_time,
            location: e.location, max_participants: e.max_participants ?? undefined,
            current_participants: e.current_participants ?? 0,
            status: e.event_status.toLowerCase() as UpcomingEvent['status'],
            is_recurring: e.recurrence_pattern !== 'NONE', scope: e.scope.toLowerCase() as UpcomingEvent['scope'],
          }));
        } catch { /* fallback to empty */ }

        // Fetch real liturgical calendar from API
        let liturgicalData: LiturgicalDay[] = [];
        try {
          const litDays = await api.listLiturgicalCalendar({ date_from: format(new Date(), 'yyyy-MM-dd'), limit: 5 });
          liturgicalData = litDays.map(d => ({
            id: d.id, date: d.date, title: d.title, description: d.description ?? '',
            feast_type: d.feast_type, liturgical_season: d.liturgical_season,
            liturgical_color: d.liturgical_color, rank: d.rank,
          }));
        } catch { /* fallback to empty */ }

        setStats(filteredStats);
        setParishes(accessibleParishes);
        setUpcomingEvents(eventsData);
        setLiturgicalDays(liturgicalData);

        // Fetch real notifications from API
        try {
          const notifs = await api.listNotifications({ limit: 5 });
          setNotifications(notifs.map(n => ({
            id: n.id, type: (n.status === 'FAILED' ? 'error' : n.status === 'DELIVERED' ? 'success' : n.status === 'PENDING' ? 'info' : 'warning') as Notification['type'],
            title: n.subject ?? n.notification_type, message: n.message,
            time: n.sent_at ?? n.created_at ?? '', read: n.status === 'DELIVERED',
          })));
        } catch { setNotifications([]); }
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
        actions.push({ icon: Eye, label: 'View Dashboard', path: '/dashboard', color: 'gray' });
    }
    return actions;
  };

  const getRoleSpecificStats = () => {
    const stats_cards = [];
    switch (user?.role) {
      case UserRole.SUPER_ADMIN:
        stats_cards.push(
          { title: 'Total Parishes', value: (stats?.active_parishes || 0).toLocaleString(), subtitle: 'Across diocese', icon: Church, color: 'indigo', trend: stats?.parish_growth ? { value: stats.parish_growth, isPositive: stats.parish_growth > 0 } : undefined },
          { title: 'Total Members', value: (stats?.total_members || 0).toLocaleString(), subtitle: 'Registered parishioners', icon: Users, color: 'blue', trend: undefined },
          { title: 'Total Income', value: Number(stats?.total_income || 0).toLocaleString('en-TZ', { style: 'currency', currency: 'TZS', maximumFractionDigits: 0 }), subtitle: 'All parishes combined', icon: Coins, color: 'green', trend: undefined },
          { title: 'Active Users', value: '124', subtitle: 'System users', icon: UserCheck, color: 'purple', trend: undefined }
        );
        break;
      case UserRole.PARISH_ADMIN:
        stats_cards.push(
          { title: 'Parish Members', value: (stats?.total_members || 0).toLocaleString(), subtitle: 'Registered members', icon: Users, color: 'blue', trend: undefined },
          { title: 'Monthly Income', value: Number(stats?.monthly_income || 0).toLocaleString('en-TZ', { style: 'currency', currency: 'TZS', maximumFractionDigits: 0 }), subtitle: 'This month', icon: TrendingUp, color: 'green', trend: undefined },
          { title: 'Attendance Rate', value: stats?.member_attendance ? `${stats.member_attendance}%` : '0%', subtitle: 'Average Sunday attendance', icon: Activity, color: 'purple', trend: undefined },
          { title: 'Families', value: (stats?.total_families || 0).toLocaleString(), subtitle: 'Registered families', icon: Home, color: 'amber', trend: undefined }
        );
        break;
      case UserRole.ACCOUNTANT:
        stats_cards.push(
          { title: 'Monthly Income', value: Number(stats?.monthly_income || stats?.total_income || 0).toLocaleString('en-TZ', { style: 'currency', currency: 'TZS', maximumFractionDigits: 0 }), subtitle: 'This month', icon: TrendingUp, color: 'green', trend: undefined },
          { title: 'Monthly Expenses', value: Number(stats?.monthly_expenses || stats?.total_expenses || 0).toLocaleString('en-TZ', { style: 'currency', currency: 'TZS', maximumFractionDigits: 0 }), subtitle: 'This month', icon: TrendingDown, color: 'red', trend: undefined },
          { title: 'Pending Vouchers', value: (stats?.pending_approvals || 0).toLocaleString(), subtitle: 'Need approval', icon: FileText, color: 'orange', trend: undefined },
          { title: 'Budget Used', value: stats?.budget_used_percentage ? `${stats.budget_used_percentage}%` : '0%', subtitle: 'Of annual budget', icon: PieChart, color: 'purple', trend: undefined }
        );
        break;
      case UserRole.SECRETARY:
        stats_cards.push(
          { title: 'Parish Members', value: (stats?.total_members || 0).toLocaleString(), subtitle: 'Registered members', icon: Users, color: 'blue', trend: undefined },
          { title: 'Sacraments This Month', value: (stats?.sacraments_this_month || 0).toLocaleString(), subtitle: 'Baptisms, marriages, etc.', icon: Layers, color: 'amber', trend: undefined },
          { title: 'Pending Tasks', value: (stats?.pending_tasks || 0).toLocaleString(), subtitle: 'Need attention', icon: FileText, color: 'orange', trend: undefined },
          { title: 'Certificates Issued', value: '0', subtitle: 'This month', icon: Award, color: 'green', trend: undefined }
        );
        break;
      case UserRole.VIEWER:
        stats_cards.push(
          { title: 'Parish Members', value: (stats?.total_members || 0).toLocaleString(), subtitle: 'Total registered', icon: Users, color: 'blue', trend: undefined },
          { title: 'Mass Schedule', value: '0', subtitle: 'This week', icon: Calendar, color: 'purple', trend: undefined },
          { title: 'Events', value: (stats?.upcoming_events || 0).toLocaleString(), subtitle: 'Upcoming', icon: Activity, color: 'green', trend: undefined },
          { title: 'Announcements', value: '0', subtitle: 'Latest updates', icon: FileText, color: 'amber', trend: undefined }
        );
        break;
    }
    return stats_cards;
  };

  const getColorClasses = (color: string) => {
    const colors: Record<string, { bg: string; text: string; hover: string; gradient: string }> = {
      blue: { bg: 'bg-blue-50', text: 'text-blue-600', hover: 'hover:bg-blue-100', gradient: 'from-blue-500 to-blue-600' },
      green: { bg: 'bg-green-50', text: 'text-green-600', hover: 'hover:bg-green-100', gradient: 'from-green-500 to-green-600' },
      red: { bg: 'bg-red-50', text: 'text-red-600', hover: 'hover:bg-red-100', gradient: 'from-red-500 to-red-600' },
      purple: { bg: 'bg-purple-50', text: 'text-purple-600', hover: 'hover:bg-purple-100', gradient: 'from-purple-500 to-purple-600' },
      amber: { bg: 'bg-amber-50', text: 'text-amber-600', hover: 'hover:bg-amber-100', gradient: 'from-amber-500 to-amber-600' },
      indigo: { bg: 'bg-indigo-50', text: 'text-indigo-600', hover: 'hover:bg-indigo-100', gradient: 'from-indigo-500 to-indigo-600' },
      orange: { bg: 'bg-orange-50', text: 'text-orange-600', hover: 'hover:bg-orange-100', gradient: 'from-orange-500 to-orange-600' },
      gray: { bg: 'bg-gray-50', text: 'text-gray-600', hover: 'hover:bg-gray-100', gradient: 'from-gray-500 to-gray-600' },
      teal: { bg: 'bg-teal-50', text: 'text-teal-600', hover: 'hover:bg-teal-100', gradient: 'from-teal-500 to-teal-600' }
    };
    return colors[color] || colors.blue;
  };

  const getSeasonColor = (season: string) => {
    switch (season) {
      case 'ADVENT': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'CHRISTMAS': return 'bg-red-100 text-red-800 border-red-200';
      case 'LENT': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'HOLY_WEEK': return 'bg-red-100 text-red-800 border-red-200';
      case 'EASTER': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'ORDINARY_TIME': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getLiturgicalColorClass = (color: string) => {
    switch (color) {
      case 'WHITE': return 'bg-white border-gray-300';
      case 'RED': return 'bg-red-500';
      case 'GREEN': return 'bg-green-500';
      case 'VIOLET': return 'bg-purple-500';
      case 'ROSE': return 'bg-pink-300';
      case 'BLACK': return 'bg-black';
      case 'GOLD': return 'bg-yellow-400';
      default: return 'bg-gray-400';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-secondary-800">
            Welcome back, {user?.full_name?.split(' ')[0]}!
          </h1>
          <p className="text-secondary-500 text-sm mt-1">
            {user?.role === UserRole.SUPER_ADMIN && 'Super Admin Dashboard'}
            {user?.role === UserRole.PARISH_ADMIN && 'Parish Administration'}
            {user?.role === UserRole.ACCOUNTANT && 'Financial Management'}
            {user?.role === UserRole.SECRETARY && 'Parish Secretariat'}
            {user?.role === UserRole.VIEWER && 'Parish Information'}
          </p>
        </div>
        {user?.role === UserRole.SUPER_ADMIN && (
          <div className="relative w-full sm:w-64">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary-400" />
            <input
              type="text"
              placeholder="Search parishes..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400/50 bg-white"
            />
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {getRoleSpecificStats().map((stat, index) => {
          const colors = getColorClasses(stat.color);
          const Icon = stat.icon;
          return (
            <div
              key={index}
              className="bg-white p-6 rounded-card shadow-card hover:shadow-card-lg transition-all duration-300 cursor-pointer border border-slate-200 group"
              onClick={() => {
                if (stat.title.includes('Members')) navigate('/members');
                else if (stat.title.includes('Parishes')) navigate('/parishes');
                else if (stat.title.includes('Income') || stat.title.includes('Expenses')) navigate('/finance');
                else if (stat.title.includes('Vouchers')) navigate('/finance?tab=pending');
              }}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-secondary-500 text-sm font-medium mb-1">{stat.title}</h3>
                  <p className="text-3xl font-bold text-secondary-800">{stat.value}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-secondary-400 text-xs">{stat.subtitle}</span>
                    {stat.trend && (
                      <span className={`flex items-center gap-1 text-xs ${stat.trend.isPositive ? 'text-success' : 'text-danger'}`}>
                        {stat.trend.isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                        {stat.trend.value}%
                      </span>
                    )}
                  </div>
                </div>
                <div className={`p-3 bg-gradient-to-br ${colors.gradient} rounded-xl shadow-sm group-hover:scale-110 transition-transform duration-200`}>
                  <Icon size={20} className="text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="bg-white p-6 rounded-card shadow-card border border-slate-200">
        <h2 className="text-lg font-semibold text-secondary-800 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {getRoleSpecificQuickActions().map((action, index) => {
            const colors = getColorClasses(action.color);
            const Icon = action.icon;
            return (
              <button
                key={index}
                onClick={() => navigate(action.path)}
                className="flex flex-col items-center gap-3 p-4 rounded-card border border-slate-200 hover:border-primary-300 hover:bg-primary-50 transition-all duration-200 group"
              >
                <div className={`p-3 bg-gradient-to-br ${colors.gradient} rounded-xl shadow-sm group-hover:scale-110 transition-transform duration-200`}>
                  <Icon size={20} className="text-white" />
                </div>
                <span className="text-sm font-medium text-secondary-700 text-center">{action.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Analytics with Enhanced Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {(user?.role === UserRole.SUPER_ADMIN || user?.role === UserRole.PARISH_ADMIN || user?.role === UserRole.ACCOUNTANT) && (
          <>
            <div className="lg:col-span-2 bg-white p-6 rounded-card shadow-card border border-slate-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-secondary-800">Financial Performance</h3>
                <select className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary-500">
                  <option>Last 6 Months</option>
                  <option>Last Year</option>
                  <option>All Time</option>
                </select>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={incomeExpenseData}>
                    <defs>
                      <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} tickFormatter={(value) => `TZS ${(value / 1000000).toFixed(1)}M`} />
                    <Tooltip
                      contentStyle={{ borderRadius: '8px', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                      formatter={(value: number) => `TZS ${value.toLocaleString()}`}
                    />
                    <Area type="monotone" dataKey="income" stroke="#10B981" fillOpacity={1} fill="url(#colorIncome)" strokeWidth={2} />
                    <Area type="monotone" dataKey="expenses" stroke="#EF4444" fillOpacity={1} fill="url(#colorExpense)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="flex items-center justify-center gap-6 mt-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-success"></div>
                  <span className="text-sm text-secondary-600">Income</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-danger"></div>
                  <span className="text-sm text-secondary-600">Expenses</span>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-card shadow-card border border-slate-200">
              <h3 className="text-lg font-semibold text-secondary-800 mb-4">Notifications</h3>
              <div className="space-y-3">
                {notifications.slice(0, 4).map(notification => (
                  <div key={notification.id} className={`p-3 rounded-lg border ${notification.read ? 'bg-background-light border-slate-200' : 'bg-white border-primary-200'} transition-all`}>
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${notification.type === 'success' ? 'bg-success/10 text-success' : notification.type === 'warning' ? 'bg-warning/10 text-warning' : notification.type === 'error' ? 'bg-danger/10 text-danger' : 'bg-info/10 text-info'}`}>
                        {notification.type === 'success' && <CheckCircle size={16} />}
                        {notification.type === 'warning' && <AlertTriangle size={16} />}
                        {notification.type === 'error' && <XIcon size={16} />}
                        {notification.type === 'info' && <Info size={16} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-secondary-800">{notification.title}</p>
                        <p className="text-xs text-secondary-500 mt-0.5 truncate">{notification.message}</p>
                        <p className="text-xs text-secondary-400 mt-1">{notification.time}</p>
                      </div>
                      {!notification.read && (
                        <div className="w-2 h-2 rounded-full bg-primary-600 flex-shrink-0"></div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <button onClick={() => navigate('/notifications')} className="w-full mt-4 text-sm text-primary-600 hover:text-primary-700 font-medium text-center">
                View All Notifications
              </button>
            </div>
          </>
        )}
      </div>

      {/* Attendance Chart */}
      {(user?.role === UserRole.SUPER_ADMIN || user?.role === UserRole.PARISH_ADMIN || user?.role === UserRole.SECRETARY) && (
        <div className="bg-white p-6 rounded-card shadow-card border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-secondary-800">Weekly Attendance Trend</h3>
            <select className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary-500">
              <option>This Month</option>
              <option>Last Month</option>
              <option>Last 3 Months</option>
            </select>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={attendanceData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="week" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} domain={[0, 100]} tickFormatter={(value) => `${value}%`} />
                <Tooltip
                  contentStyle={{ borderRadius: '8px', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                  formatter={(value: number) => `${value}%`}
                />
                <Bar dataKey="attendance" fill="#4F46E5" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Parishes List */}
      {user?.role === UserRole.SUPER_ADMIN && (
        <div className="bg-white p-6 rounded-card shadow-card border border-slate-200">
          <h2 className="text-lg font-semibold text-secondary-800 mb-4">All Parishes ({filteredParishes.length})</h2>
          {filteredParishes.length === 0 ? (
            <div className="text-center py-8 text-secondary-500">
              <Church size={32} className="mx-auto text-secondary-300 mb-2" />
              <p>No parishes found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredParishes.map(parish => (
                <div
                  key={parish.id}
                  onClick={() => navigate(`/parishes/${parish.id}`)}
                  className="p-4 rounded-card border border-slate-200 hover:border-primary-300 hover:bg-primary-50 transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center text-white font-bold shadow-sm">
                      {parish.parish_name[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-secondary-800 truncate">{parish.parish_name}</h3>
                      <p className="text-xs text-secondary-500">{parish.parish_code}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-secondary-500">
                    <span className={`flex items-center gap-1 ${parish.is_active ? 'text-success' : 'text-danger'}`}>
                      <Activity size={14} />
                      {parish.is_active ? 'Active' : 'Inactive'}
                    </span>
                    {parish.contact_phone && <span>{parish.contact_phone}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Parish Profile for non-super admins */}
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

      {/* Bulk Import */}
      {(user?.role === UserRole.SUPER_ADMIN || user?.role === UserRole.PARISH_ADMIN) && (
        <div className="bg-white p-6 rounded-card shadow-card border border-slate-200">
          <h2 className="text-lg font-semibold text-secondary-800 mb-2">Bulk Import</h2>
          <p className="text-sm text-secondary-500 mb-4">Quickly import data from CSV or XLSX files. Download a template first, fill it in, then upload.</p>
          {parishes.length === 0 ? (
            <div className="bg-orange-50 border border-orange-200 rounded-card p-4 text-orange-700 text-sm">
              <span className="font-semibold">No parish available</span>
              <p className="mt-1">Please create a parish first before importing data.</p>
            </div>
          ) : (
            <div className="flex flex-wrap gap-3">
              <ImportButton label="Import Members" onImport={async (file) => api.importMembers(file, parishes[0].id)} templateColumns={['member_code', 'first_name', 'last_name']} />
              <ImportButton label="Import Clusters" onImport={async (file) => api.importClusters(file, parishes[0].id)} templateColumns={['cluster_code', 'cluster_name', 'location_description', 'leader_name']} />
              <ImportButton label="Import SCCs" onImport={async (file) => api.importSccs(file, parishes[0].id)} templateColumns={['scc_code', 'scc_name', 'cluster_code', 'patron_saint', 'leader_name', 'location_description', 'meeting_day', 'meeting_time']} />
              <ImportButton label="Import Families" onImport={async (file) => api.importFamilies(file, parishes[0].id)} templateColumns={['family_code', 'family_name', 'scc_code', 'physical_address', 'primary_phone', 'email', 'notes']} />
              <ImportButton label="Import Transactions" onImport={async (file) => api.importTransactions(file, parishes[0].id)} templateColumns={['category', 'amount', 'payment_method', 'date(YYYY-MM-DD)', 'description']} />
            </div>
          )}
        </div>
      )}

      {/* Upcoming Events & Liturgical Calendar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-card shadow-card border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-secondary-800 flex items-center">
              <CalendarDays className="h-5 w-5 mr-2 text-primary-600" />
              Upcoming Events
            </h2>
            <button onClick={() => navigate('/events')} className="text-sm text-primary-600 hover:text-primary-700 font-medium">
              View All
            </button>
          </div>
          {upcomingEvents.length === 0 ? (
            <div className="text-center py-8 text-secondary-500">
              <CalendarDays size={32} className="mx-auto text-secondary-300 mb-2" />
              <p>No upcoming events</p>
            </div>
          ) : (
            <div className="space-y-4">
              {upcomingEvents.slice(0, 3).map(event => {
                const eventDate = new Date(event.start_date);
                const isEventToday = isToday(eventDate);
                const isEventTomorrow = isTomorrow(eventDate);
                return (
                  <div key={event.id} className="flex items-start space-x-3 p-4 rounded-card hover:bg-background-light transition-all cursor-pointer group">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white font-semibold shadow-sm ${isEventToday ? 'bg-gradient-to-br from-red-500 to-red-600' : isEventTomorrow ? 'bg-gradient-to-br from-orange-500 to-orange-600' : 'bg-gradient-to-br from-blue-500 to-blue-600'}`}>
                      {format(eventDate, 'd')}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center">
                        <h3 className="text-sm font-semibold text-secondary-800 truncate">{event.title}</h3>
                        {event.is_recurring && <Repeat className="h-3 w-3 ml-1 text-primary-600" />}
                      </div>
                      <div className="flex items-center mt-1">
                        {event.scope === 'diocese' ? (
                          <div className="flex items-center text-xs text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full mr-2 border border-purple-100">
                            <Globe className="h-2 w-2 mr-1" />Diocese
                          </div>
                        ) : (
                          <div className="flex items-center text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full mr-2 border border-blue-100">
                            <Building className="h-2 w-2 mr-1" />Parish
                          </div>
                        )}
                      </div>
                      <p className="text-sm text-secondary-600 truncate mt-1">{event.description}</p>
                      <div className="flex items-center mt-1 text-xs text-secondary-500">
                        <Clock className="h-3 w-3 mr-1" />
                        {event.start_time} {event.end_time && `- ${event.end_time}`}
                        <MapPin className="h-3 w-3 ml-2 mr-1" />
                        {event.location}
                      </div>
                      <div className="flex items-center mt-1 text-xs text-secondary-500">
                        <Users className="h-3 w-3 mr-1" />
                        {event.current_participants}
                        {(event.max_participants ?? 0) > 0 && `/${event.max_participants}`}
                      </div>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${event.status === 'published' ? 'bg-success/10 text-success border border-success/20' : 'bg-secondary-100 text-secondary-600'}`}>
                        {event.status}
                      </span>
                      {event.is_recurring && <span className="text-xs text-secondary-400 mt-1">Recurring</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="bg-white p-6 rounded-card shadow-card border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-secondary-800 flex items-center">
              <LiturgicalIcon className="h-5 w-5 mr-2 text-purple-600" />
              Liturgical Calendar
            </h2>
            <button onClick={() => navigate('/liturgical-calendar')} className="text-sm text-purple-600 hover:text-purple-700 font-medium">
              View Calendar
            </button>
          </div>
          {liturgicalDays.length === 0 ? (
            <div className="text-center py-8 text-secondary-500">
              <LiturgicalIcon size={32} className="mx-auto text-secondary-300 mb-2" />
              <p>No upcoming liturgical days</p>
            </div>
          ) : (
            <div className="space-y-4">
              {liturgicalDays.slice(0, 3).map(day => {
                const dayDate = new Date(day.date);
                const isDayToday = isToday(dayDate);
                const isDayTomorrow = isTomorrow(dayDate);
                return (
                  <div key={day.id} className="flex items-start space-x-3 p-4 rounded-card border border-slate-200 hover:border-purple-300 hover:bg-purple-50 transition-all cursor-pointer">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold shadow-sm ${isDayToday ? 'bg-gradient-to-br from-purple-500 to-purple-600' : isDayTomorrow ? 'bg-gradient-to-br from-pink-500 to-pink-600' : 'bg-gradient-to-br from-gray-500 to-gray-600'}`}>
                      {format(dayDate, 'd')}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-secondary-800 truncate flex items-center">
                        {day.feast_type === 'SOLEMNITY' && <Star className="h-4 w-4 mr-1 text-yellow-500" />}
                        {day.title}
                      </h3>
                      <p className="text-sm text-secondary-600 truncate">{day.description}</p>
                      <div className="flex items-center mt-1 space-x-2">
                        <span className={`text-xs px-2 py-1 rounded-full border ${getSeasonColor(day.liturgical_season)}`}>
                          {day.liturgical_season}
                        </span>
                        <span className="text-xs text-secondary-500">{day.feast_type}</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end">
                      <div className={`w-6 h-6 rounded-full border ${getLiturgicalColorClass(day.liturgical_color)}`} />
                      <span className="text-xs text-secondary-500 mt-1">{day.liturgical_color}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Quick Navigation */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <button
          onClick={() => navigate('/reports')}
          className="bg-white p-6 rounded-card shadow-card border border-slate-200 flex items-center justify-between hover:border-primary-300 hover:shadow-card-lg transition-all duration-200 group"
        >
          <div>
            <h3 className="font-semibold text-secondary-800">Reports & Analytics</h3>
            <p className="text-sm text-secondary-500">View detailed reports and insights</p>
          </div>
          <ArrowRight size={20} className="text-secondary-400 group-hover:text-primary-600 transition-colors" />
        </button>
        {user?.role !== UserRole.VIEWER && (
          <button
            onClick={() => navigate('/settings')}
            className="bg-white p-6 rounded-card shadow-card border border-slate-200 flex items-center justify-between hover:border-primary-300 hover:shadow-card-lg transition-all duration-200 group"
          >
            <div>
              <h3 className="font-semibold text-secondary-800">Settings</h3>
              <p className="text-sm text-secondary-500">Manage system and parish settings</p>
            </div>
            <ArrowRight size={20} className="text-secondary-400 group-hover:text-primary-600 transition-colors" />
          </button>
        )}
      </div>
    </div>
  );
};

export default Dashboard;