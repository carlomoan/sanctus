import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { DashboardStats, Parish, UserRole } from '../types';
import { useAuth } from '../context/AuthContext';
import {
  Users, Calendar, Clock, MapPin, TrendingUp, Church, Star, Globe,
  Building, Repeat, Coins, FileText, UserPlus, Home, Layers, ArrowRight,
  Search, TrendingDown, Activity, PieChart, BarChart3, UserCheck, Settings,
  Eye, Shield, CreditCard, FileSpreadsheet, Award,
  Church as LiturgicalIcon, CalendarDays, AlertTriangle, CheckCircle, Info,
  X as XIcon, Bell, Plus,
} from 'lucide-react';
import { format, isToday, isTomorrow } from 'date-fns';
import ImportButton from '../components/ImportButton';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

// ── Types ─────────────────────────────────────────────────────────────────────
interface RoleBasedStats extends DashboardStats {
  parish_growth?: number;
  monthly_income?: number;
  monthly_expenses?: number;
  member_attendance?: number;
  pending_tasks?: number;
}
interface UpcomingEvent {
  id: string; title: string; description?: string; start_date: string;
  start_time?: string; end_time?: string; location?: string;
  is_recurring: boolean; current_participants: number; max_participants?: number;
  status: 'draft' | 'published' | 'cancelled'; scope: 'diocese' | 'parish';
}
interface LiturgicalDay {
  id: string; date: string; title: string; description: string;
  feast_type: 'SOLEMNITY' | 'FEAST' | 'MEMORIAL' | 'OPTIONAL_MEMORIAL';
  liturgical_season: 'ADVENT' | 'CHRISTMAS' | 'LENT' | 'HOLY_WEEK' | 'EASTER' | 'ORDINARY_TIME';
  liturgical_color: 'WHITE' | 'RED' | 'GREEN' | 'VIOLET' | 'ROSE' | 'BLACK' | 'GOLD';
  rank: number;
}
interface AppNotification {
  id: string; type: 'success' | 'warning' | 'info' | 'error';
  title: string; message: string; time: string; read: boolean;
}

// ── Skeleton helpers ──────────────────────────────────────────────────────────
const Sk = ({ w = 'w-full', h = 'h-3' }: { w?: string; h?: string }) => (
  <div className={`skeleton ${w} ${h}`} />
);
const SkCard = () => (
  <div className="stat-card animate-pulse">
    <div className="flex-1 space-y-3">
      <Sk w="w-24" h="h-3" />
      <Sk w="w-20" h="h-7" />
      <Sk w="w-16" h="h-2.5" />
    </div>
    <div className="skeleton w-12 h-12 rounded-xl" />
  </div>
);

// ── Gradient map ──────────────────────────────────────────────────────────────
const GRADIENTS: Record<string, { from: string; to: string }> = {
  blue: { from: '#3b82f6', to: '#2563eb' },
  green: { from: '#10b981', to: '#059669' },
  red: { from: '#ef4444', to: '#dc2626' },
  purple: { from: '#8b5cf6', to: '#7c3aed' },
  amber: { from: '#f59e0b', to: '#d97706' },
  indigo: { from: '#6366f1', to: '#4f46e5' },
  orange: { from: '#f97316', to: '#ea580c' },
  teal: { from: '#14b8a6', to: '#0d9488' },
  gray: { from: '#6b7280', to: '#4b5563' },
};
const GradBubble = ({ color, children }: { color: string; children: React.ReactNode }) => {
  const g = GRADIENTS[color] || GRADIENTS.indigo;
  return (
    <div
      className="p-3 rounded-xl shadow-sm flex items-center justify-center
                 group-hover:scale-110 transition-transform duration-200 flex-shrink-0"
      style={{ background: `linear-gradient(135deg, ${g.from}, ${g.to})` }}
    >
      {children}
    </div>
  );
};

// ── Liturgical season badge ───────────────────────────────────────────────────
const seasonCls: Record<string, string> = {
  ADVENT: 'bg-purple-100 text-purple-800 border-purple-200',
  CHRISTMAS: 'bg-red-100 text-red-800 border-red-200',
  LENT: 'bg-gray-100 text-gray-700 border-gray-200',
  HOLY_WEEK: 'bg-red-100 text-red-800 border-red-200',
  EASTER: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  ORDINARY_TIME: 'bg-green-100 text-green-800 border-green-200',
};
const litColorCls: Record<string, string> = {
  WHITE: 'bg-white border-gray-300', RED: 'bg-red-500 border-red-500',
  GREEN: 'bg-green-500 border-green-500', VIOLET: 'bg-purple-500 border-purple-500',
  ROSE: 'bg-pink-300 border-pink-300', BLACK: 'bg-gray-900 border-gray-900',
  GOLD: 'bg-yellow-400 border-yellow-400',
};

// ── Notification icon ─────────────────────────────────────────────────────────
const NotifIcon = ({ type }: { type: AppNotification['type'] }) => {
  const map = {
    success: { icon: CheckCircle, bg: 'bg-emerald-50', text: 'text-emerald-600' },
    warning: { icon: AlertTriangle, bg: 'bg-amber-50', text: 'text-amber-600' },
    error: { icon: XIcon, bg: 'bg-red-50', text: 'text-red-600' },
    info: { icon: Info, bg: 'bg-blue-50', text: 'text-blue-600' },
  };
  const { icon: Icon, bg, text } = map[type];
  return (
    <div className={`p-2 rounded-lg flex-shrink-0 ${bg} ${text}`}>
      <Icon size={14} />
    </div>
  );
};

// ── Main component ────────────────────────────────────────────────────────────
const Dashboard = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stats, setStats] = useState<RoleBasedStats | null>(null);
  const [parishes, setParishes] = useState<Parish[]>([]);
  const [events, setEvents] = useState<UpcomingEvent[]>([]);
  const [litDays, setLitDays] = useState<LiturgicalDay[]>([]);
  const [notifications, setNotifs] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Chart data — 6-month mock trend (real data plugs in via stats)
  const chartData = [
    { month: 'Jan', income: 0, expenses: 0 },
    { month: 'Feb', income: 0, expenses: 0 },
    { month: 'Mar', income: 0, expenses: 0 },
    { month: 'Apr', income: 0, expenses: 0 },
    { month: 'May', income: 0, expenses: 0 },
    {
      month: 'Jun',
      income: stats?.monthly_income ?? 0,
      expenses: stats?.monthly_expenses ?? 0
    },
  ];

  useEffect(() => {
    const run = async () => {
      try {
        const [s, allParishes] = await Promise.all([
          api.getDashboardStats(), api.listParishes(),
        ]);
        const accessible = user?.role === UserRole.SUPER_ADMIN
          ? allParishes
          : allParishes.filter(p => p.id === user?.parish_id && p.is_active);

        setStats(s);
        setParishes(accessible);

        // Events
        try {
          const ev = await api.listEvents({
            start_date_from: format(new Date(), 'yyyy-MM-dd'), limit: 5,
          });
          setEvents(ev.map(e => ({
            id: e.id, title: e.title, description: e.description,
            start_date: e.start_date, start_time: e.start_time, end_time: e.end_time,
            location: e.location, max_participants: e.max_participants ?? undefined,
            current_participants: e.current_participants ?? 0,
            status: e.event_status.toLowerCase() as UpcomingEvent['status'],
            is_recurring: e.recurrence_pattern !== 'NONE',
            scope: e.scope.toLowerCase() as UpcomingEvent['scope'],
          })));
        } catch { /* leave empty */ }

        // Liturgical calendar
        try {
          const ld = await api.listLiturgicalCalendar({
            date_from: format(new Date(), 'yyyy-MM-dd'), limit: 4,
          });
          setLitDays(ld.map(d => ({
            id: d.id, date: d.date, title: d.title, description: d.description ?? '',
            feast_type: d.feast_type, liturgical_season: d.liturgical_season,
            liturgical_color: d.liturgical_color, rank: d.rank,
          })));
        } catch { /* leave empty */ }

        // Notifications
        try {
          const notifs = await api.listNotifications({ limit: 5 });
          setNotifs(notifs.map(n => ({
            id: n.id,
            type: n.status === 'FAILED' ? 'error'
              : n.status === 'DELIVERED' ? 'success'
                : n.status === 'PENDING' ? 'info' : 'warning',
            title: n.subject ?? n.notification_type,
            message: n.message,
            time: n.sent_at ?? n.created_at ?? '',
            read: n.status === 'DELIVERED',
          })));
        } catch { setNotifs([]); }
      } catch {
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [user]);

  // ── Stat cards config ────────────────────────────────────────────────────────
  const statCards = (() => {
    if (!stats) return [];
    const fmt = (n: number) =>
      n.toLocaleString('en-TZ', { style: 'currency', currency: 'TZS', maximumFractionDigits: 0 });

    switch (user?.role) {
      case UserRole.SUPER_ADMIN: return [
        { title: 'Total Parishes', value: (stats.active_parishes || 0).toLocaleString(), sub: 'Across diocese', icon: Church, color: 'indigo', path: '/parishes' },
        { title: 'Total Members', value: (stats.total_members || 0).toLocaleString(), sub: 'Registered parishioners', icon: Users, color: 'blue', path: '/members' },
        { title: 'Total Income', value: fmt(stats.total_income || 0), sub: 'All parishes', icon: Coins, color: 'green', path: '/finance' },
        { title: 'Active Users', value: '—', sub: 'System users', icon: UserCheck, color: 'purple', path: '/users' },
      ];
      case UserRole.PARISH_ADMIN: return [
        { title: 'Parish Members', value: (stats.total_members || 0).toLocaleString(), sub: 'Registered', icon: Users, color: 'blue', path: '/members' },
        { title: 'Monthly Income', value: fmt(stats.monthly_income || 0), sub: 'This month', icon: TrendingUp, color: 'green', path: '/finance' },
        { title: 'Attendance', value: stats.member_attendance ? `${stats.member_attendance}%` : '—', sub: 'Average Sunday', icon: Activity, color: 'purple', path: '/attendance' },
        { title: 'Families', value: (stats.total_families || 0).toLocaleString(), sub: 'Registered families', icon: Home, color: 'amber', path: '/families' },
      ];
      case UserRole.ACCOUNTANT: return [
        { title: 'Monthly Income', value: fmt(stats.monthly_income || stats.total_income || 0), sub: 'This month', icon: TrendingUp, color: 'green', path: '/finance' },
        { title: 'Monthly Expenses', value: fmt(stats.monthly_expenses || stats.total_expenses || 0), sub: 'This month', icon: TrendingDown, color: 'red', path: '/finance' },
        { title: 'Pending Vouchers', value: (stats.pending_approvals || 0).toLocaleString(), sub: 'Need approval', icon: FileText, color: 'orange', path: '/finance?tab=pending' },
        { title: 'Budget Used', value: stats.budget_used_percentage ? `${stats.budget_used_percentage}%` : '—', sub: 'Of annual budget', icon: PieChart, color: 'purple', path: '/budgets' },
      ];
      case UserRole.SECRETARY: return [
        { title: 'Parish Members', value: (stats.total_members || 0).toLocaleString(), sub: 'Registered', icon: Users, color: 'blue', path: '/members' },
        { title: 'Sacraments', value: (stats.sacraments_this_month || 0).toLocaleString(), sub: 'This month', icon: Layers, color: 'amber', path: '/sacraments' },
        { title: 'Pending Tasks', value: (stats.pending_tasks || 0).toLocaleString(), sub: 'Need attention', icon: FileText, color: 'orange', path: '/' },
        { title: 'Certificates', value: '—', sub: 'Issued this month', icon: Award, color: 'green', path: '/certificates' },
      ];
      default: return [
        { title: 'Members', value: (stats.total_members || 0).toLocaleString(), sub: 'Total registered', icon: Users, color: 'blue', path: '/members' },
        { title: 'Events', value: (stats.upcoming_events || 0).toLocaleString(), sub: 'Upcoming', icon: Activity, color: 'green', path: '/events' },
      ];
    }
  })();

  // ── Quick actions config ─────────────────────────────────────────────────────
  const quickActions = (() => {
    switch (user?.role) {
      case UserRole.SUPER_ADMIN: return [
        { icon: Users, label: t('users.userManagement'), path: '/users', color: 'blue' },
        { icon: Church, label: t('navigation.parishes'), path: '/parishes', color: 'indigo' },
        { icon: Shield, label: t('navigation.roles'), path: '/roles', color: 'purple' },
        { icon: Settings, label: t('navigation.settings'), path: '/settings', color: 'gray' },
        { icon: BarChart3, label: t('navigation.reports'), path: '/reports', color: 'green' },
      ];
      case UserRole.PARISH_ADMIN: return [
        { icon: UserPlus, label: t('dashboard.addMember'), path: '/members', color: 'blue' },
        { icon: Home, label: 'Add Family', path: '/families', color: 'purple' },
        { icon: MapPin, label: 'Add SCC', path: '/clusters', color: 'teal' },
        { icon: Layers, label: 'Sacrament', path: '/sacraments', color: 'amber' },
        { icon: Eye, label: 'Parish Profile', path: '/parish-profile', color: 'indigo' },
      ];
      case UserRole.ACCOUNTANT: return [
        { icon: Coins, label: 'Record Income', path: '/finance?tab=income', color: 'green' },
        { icon: CreditCard, label: 'Record Expense', path: '/finance?tab=expenses', color: 'red' },
        { icon: FileText, label: 'Vouchers', path: '/finance?tab=pending', color: 'orange' },
        { icon: PieChart, label: t('navigation.reports'), path: '/reports', color: 'purple' },
        { icon: FileSpreadsheet, label: 'Budgets', path: '/budgets', color: 'blue' },
      ];
      case UserRole.SECRETARY: return [
        { icon: UserPlus, label: t('dashboard.addMember'), path: '/members', color: 'blue' },
        { icon: Layers, label: 'Sacrament', path: '/sacraments', color: 'amber' },
        { icon: FileText, label: t('navigation.reports'), path: '/reports', color: 'purple' },
        { icon: Calendar, label: t('navigation.events'), path: '/events', color: 'indigo' },
        { icon: Award, label: 'Certificates', path: '/certificates', color: 'green' },
      ];
      default: return [
        { icon: Eye, label: 'View Members', path: '/members', color: 'blue' },
        { icon: BarChart3, label: t('navigation.reports'), path: '/reports', color: 'purple' },
      ];
    }
  })();

  const filteredParishes = parishes.filter(p =>
    p.parish_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.parish_code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const canFinance = user?.role === UserRole.SUPER_ADMIN ||
    user?.role === UserRole.PARISH_ADMIN ||
    user?.role === UserRole.ACCOUNTANT;
  const canPeople = user?.role === UserRole.SUPER_ADMIN ||
    user?.role === UserRole.PARISH_ADMIN ||
    user?.role === UserRole.SECRETARY;

  // ── Render ────────────────────────────────────────────────────────────────────
  if (error) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3">
      <XIcon size={32} className="text-red-400" />
      <p className="text-secondary-500">{error}</p>
      <button onClick={() => window.location.reload()} className="btn-secondary text-sm">{t('dashboard.retry')}</button>
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in">

      {/* ── Page header ─────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-secondary-900">
            {t('dashboard.welcome')}, {user?.full_name?.split(' ')[0]}
            <span className="text-secondary-300 font-normal"> 👋</span>
          </h1>
          <p className="text-secondary-500 text-sm mt-0.5">
            {{
              [UserRole.SUPER_ADMIN]: t('dashboard.superAdminDashboard'),
              [UserRole.PARISH_ADMIN]: t('dashboard.parishAdministration'),
              [UserRole.ACCOUNTANT]: t('dashboard.financialManagement'),
              [UserRole.SECRETARY]: t('dashboard.parishSecretariat'),
              [UserRole.VIEWER]: t('dashboard.parishInformation'),
            }[user?.role ?? UserRole.VIEWER] ?? t('dashboard.welcome')}
          </p>
        </div>
        {user?.role === UserRole.SUPER_ADMIN && (
          <div className="relative w-full sm:w-60">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary-400" />
            <input
              type="text" placeholder={t('dashboard.searchParishes')}
              value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              className="input-base pl-9 py-2"
            />
          </div>
        )}
      </div>

      {/* ── Stat cards ──────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {loading
          ? [1, 2, 3, 4].map(i => <SkCard key={i} />)
          : statCards.map((s, i) => (
            <div
              key={i}
              className="stat-card group"
              onClick={() => navigate(s.path)}
            >
              <div className="flex-1 min-w-0 mr-4">
                <p className="text-xs font-medium text-secondary-500 mb-1">{s.title}</p>
                <p className="text-2xl font-bold text-secondary-900 leading-tight">{s.value}</p>
                <p className="text-xs text-secondary-400 mt-1.5">{s.sub}</p>
              </div>
              <GradBubble color={s.color}>
                <s.icon size={18} className="text-white" />
              </GradBubble>
            </div>
          ))
        }
      </div>

      {/* ── Quick actions ────────────────────────────────────── */}
      <div className="section-card">
        <h2 className="text-sm font-semibold text-secondary-700 mb-4">{t('dashboard.quickActions')}</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {quickActions.map((a, i) => (
            <button key={i} onClick={() => navigate(a.path)} className="action-btn group">
              <GradBubble color={a.color}>
                <a.icon size={17} className="text-white" />
              </GradBubble>
              <span className="text-xs font-medium text-secondary-700">{a.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Analytics row ───────────────────────────────────── */}
      {(canFinance || canPeople) && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* Financial chart */}
          {canFinance && (
            <div className="section-card lg:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-secondary-700">{t('dashboard.financialOverview')}</h3>
                <select className="input-base !w-auto py-1 text-xs">
                  <option>{t('dashboard.last6Months')}</option>
                  <option>{t('dashboard.thisYear')}</option>
                </select>
              </div>
              {loading
                ? <div className="skeleton h-56 rounded-xl" />
                : (
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="gIncome" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="gExpense" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
                            <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis dataKey="month" axisLine={false} tickLine={false}
                          tick={{ fontSize: 11, fill: '#94a3b8' }} />
                        <YAxis axisLine={false} tickLine={false}
                          tick={{ fontSize: 11, fill: '#94a3b8' }}
                          tickFormatter={v => `${(v / 1e6).toFixed(1)}M`} />
                        <Tooltip
                          contentStyle={{
                            borderRadius: 8, border: '1px solid #e2e8f0',
                            boxShadow: '0 4px 12px rgb(0 0 0/0.08)', fontSize: 12
                          }}
                          formatter={(v: any) => `TZS ${Number(v).toLocaleString()}`}
                        />
                        <Area type="monotone" dataKey="income" stroke="#10b981" strokeWidth={2}
                          fill="url(#gIncome)" dot={false} />
                        <Area type="monotone" dataKey="expenses" stroke="#ef4444" strokeWidth={2}
                          fill="url(#gExpense)" dot={false} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                )
              }
              <div className="flex items-center gap-5 mt-3">
                <span className="flex items-center gap-1.5 text-xs text-secondary-500">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Income
                </span>
                <span className="flex items-center gap-1.5 text-xs text-secondary-500">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500" /> Expenses
                </span>
              </div>
            </div>
          )}

          {/* Notifications panel */}
          <div className="section-card flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-secondary-700 flex items-center gap-2">
                <Bell size={14} className="text-secondary-400" />
                Notifications
              </h3>
              <button onClick={() => navigate('/notifications')}
                className="text-xs text-primary-600 hover:text-primary-700 font-medium">
                View all
              </button>
            </div>
            {loading
              ? <div className="space-y-3">{[1, 2, 3].map(i => (
                <div key={i} className="flex gap-2 animate-pulse">
                  <div className="skeleton w-8 h-8 rounded-lg flex-shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <Sk w="w-3/4" h="h-3" />
                    <Sk w="w-1/2" h="h-2.5" />
                  </div>
                </div>
              ))}</div>
              : notifications.length === 0
                ? (
                  <div className="flex-1 flex flex-col items-center justify-center py-8 text-center">
                    <Bell size={24} className="text-secondary-200 mb-2" />
                    <p className="text-sm text-secondary-400">No notifications</p>
                  </div>
                )
                : (
                  <div className="space-y-2 flex-1">
                    {notifications.slice(0, 4).map(n => (
                      <div key={n.id}
                        className={`flex items-start gap-2.5 p-2.5 rounded-lg border
                                      transition-colors duration-150
                                      ${n.read
                            ? 'bg-transparent border-secondary-100'
                            : 'bg-indigo-50/40 border-indigo-100'}`}>
                        <NotifIcon type={n.type} />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-secondary-800 truncate">{n.title}</p>
                          <p className="text-xs text-secondary-500 truncate mt-0.5">{n.message}</p>
                        </div>
                        {!n.read && (
                          <span className="w-1.5 h-1.5 rounded-full bg-primary-500 mt-1 flex-shrink-0" />
                        )}
                      </div>
                    ))}
                  </div>
                )
            }
          </div>
        </div>
      )}

      {/* ── Attendance bar chart ─────────────────────────────── */}
      {canPeople && (
        <div className="section-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-secondary-700">Attendance Trend</h3>
            <select className="input-base !w-auto py-1 text-xs">
              <option>This month</option>
              <option>Last month</option>
            </select>
          </div>
          {loading
            ? <div className="skeleton h-48 rounded-xl" />
            : (
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={[
                      { week: 'Week 1', pct: 0 },
                      { week: 'Week 2', pct: 0 },
                      { week: 'Week 3', pct: 0 },
                      { week: 'Week 4', pct: stats?.member_attendance ?? 0 },
                    ]}
                    margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="week" axisLine={false} tickLine={false}
                      tick={{ fontSize: 11, fill: '#94a3b8' }} />
                    <YAxis axisLine={false} tickLine={false} domain={[0, 100]}
                      tick={{ fontSize: 11, fill: '#94a3b8' }}
                      tickFormatter={v => `${v}%`} />
                    <Tooltip
                      contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }}
                      formatter={(v: any) => [`${v}%`, 'Attendance']}
                    />
                    <Bar dataKey="pct" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )
          }
        </div>
      )}

      {/* ── Parishes grid ───────────────────────────────────── */}
      {user?.role === UserRole.SUPER_ADMIN && (
        <div className="section-card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-secondary-700">
              All Parishes
              <span className="ml-2 badge badge-neutral">{filteredParishes.length}</span>
            </h2>
            <button onClick={() => navigate('/parishes')}
              className="text-xs text-primary-600 hover:text-primary-700 font-medium">
              Manage
            </button>
          </div>
          {loading
            ? <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="animate-pulse flex gap-3 p-3 border border-secondary-100 rounded-card">
                  <div className="skeleton w-10 h-10 rounded-xl flex-shrink-0" />
                  <div className="flex-1 space-y-2 py-1">
                    <Sk w="w-3/4" h="h-3" />
                    <Sk w="w-1/3" h="h-2.5" />
                  </div>
                </div>
              ))}
            </div>
            : filteredParishes.length === 0
              ? (
                <div className="empty-state">
                  <Church size={28} className="text-secondary-200 mb-2" />
                  <p className="text-sm text-secondary-500">No parishes found</p>
                  <button onClick={() => navigate('/parishes')}
                    className="btn-primary text-xs mt-3 py-1.5 px-3">
                    <Plus size={13} /> Add Parish
                  </button>
                </div>
              )
              : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {filteredParishes.map(p => (
                    <div
                      key={p.id}
                      onClick={() => navigate(`/parishes/${p.id}`)}
                      className="flex items-center gap-3 p-3.5 rounded-card border border-secondary-100
                                 hover:border-indigo-200 hover:bg-indigo-50/40 hover:-translate-y-0.5
                                 hover:shadow-card-md transition-all duration-150 cursor-pointer group"
                    >
                      <div className="w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center
                                      text-white font-bold text-sm shadow-sm"
                        style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)' }}>
                        {p.parish_name[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-secondary-800 truncate
                                       group-hover:text-indigo-700 transition-colors">
                          {p.parish_name}
                        </p>
                        <p className="text-xs text-secondary-400">{p.parish_code}</p>
                      </div>
                      <span className={`badge flex-shrink-0 ${p.is_active ? 'badge-success' : 'badge-neutral'}`}>
                        {p.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  ))}
                </div>
              )
          }
        </div>
      )}

      {/* ── Non-admin parish profile ─────────────────────────── */}
      {user?.role !== UserRole.SUPER_ADMIN && parishes.length > 0 && (
        <div className="section-card flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-secondary-800">Your Parish</p>
            <p className="text-xs text-secondary-500 mt-0.5">{parishes[0].parish_name}</p>
          </div>
          <button onClick={() => navigate('/parish-profile')} className="btn-secondary text-xs">
            <Eye size={13} /> View Profile
          </button>
        </div>
      )}

      {/* ── Bulk import ──────────────────────────────────────── */}
      {(user?.role === UserRole.SUPER_ADMIN || user?.role === UserRole.PARISH_ADMIN) && (
        <div className="section-card">
          <h2 className="text-sm font-semibold text-secondary-700 mb-1">Bulk Import</h2>
          <p className="text-xs text-secondary-400 mb-4">
            Download a template, fill it in, then upload to import data.
          </p>
          {parishes.length === 0
            ? (
              <div className="flex items-start gap-3 bg-amber-50 border border-amber-200
                              rounded-lg p-3.5 text-sm text-amber-700">
                <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">No parish set up</p>
                  <p className="text-xs mt-0.5">Create a parish first before importing data.</p>
                </div>
              </div>
            )
            : (
              <div className="flex flex-wrap gap-2">
                <ImportButton label="Import Members" onImport={f => api.importMembers(f, parishes[0].id)} templateColumns={['member_code', 'first_name', 'last_name']} />
                <ImportButton label="Import Clusters" onImport={f => api.importClusters(f, parishes[0].id)} templateColumns={['cluster_code', 'cluster_name', 'location_description', 'leader_name']} />
                <ImportButton label="Import SCCs" onImport={f => api.importSccs(f, parishes[0].id)} templateColumns={['scc_code', 'scc_name', 'cluster_code', 'patron_saint', 'leader_name', 'location_description', 'meeting_day', 'meeting_time']} />
                <ImportButton label="Import Families" onImport={f => api.importFamilies(f, parishes[0].id)} templateColumns={['family_code', 'family_name', 'scc_code', 'physical_address', 'primary_phone', 'email', 'notes']} />
                <ImportButton label="Import Transactions" onImport={f => api.importTransactions(f, parishes[0].id)} templateColumns={['category', 'amount', 'payment_method', 'date(YYYY-MM-DD)', 'description']} />
              </div>
            )
          }
        </div>
      )}

      {/* ── Events & Liturgical calendar ─────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Events */}
        <div className="section-card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-secondary-700 flex items-center gap-2">
              <CalendarDays size={14} className="text-primary-500" />
              Upcoming Events
            </h2>
            <button onClick={() => navigate('/events')}
              className="text-xs text-primary-600 hover:text-primary-700 font-medium">
              View all
            </button>
          </div>
          {loading
            ? <div className="space-y-3"><SkListItem /><SkListItem /><SkListItem /></div>
            : events.length === 0
              ? (
                <div className="empty-state py-10">
                  <Calendar size={24} className="text-secondary-200 mb-2" />
                  <p className="text-sm text-secondary-500">No upcoming events</p>
                  <button onClick={() => navigate('/events')}
                    className="btn-primary text-xs mt-3 py-1.5 px-3">
                    <Plus size={13} /> Add Event
                  </button>
                </div>
              )
              : (
                <div className="space-y-2">
                  {events.slice(0, 3).map(ev => {
                    const d = new Date(ev.start_date);
                    const today = isToday(d);
                    const tomorrow = isTomorrow(d);
                    const dotColor = today ? '#ef4444' : tomorrow ? '#f97316' : '#6366f1';
                    return (
                      <div key={ev.id}
                        className="flex items-start gap-3 p-3 rounded-lg
                                      hover:bg-secondary-50 transition-colors duration-100 cursor-pointer group">
                        <div className="w-10 h-10 rounded-xl flex-shrink-0 flex flex-col items-center
                                        justify-center text-white text-xs font-bold shadow-sm"
                          style={{ background: `linear-gradient(135deg, ${dotColor}, ${dotColor}cc)` }}>
                          <span className="text-[10px] leading-none opacity-80">
                            {format(d, 'MMM').toUpperCase()}
                          </span>
                          <span className="text-sm leading-none font-extrabold">{format(d, 'd')}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="text-sm font-semibold text-secondary-800 truncate">{ev.title}</p>
                            {ev.is_recurring && <Repeat size={11} className="text-primary-400 flex-shrink-0" />}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            {ev.scope === 'diocese'
                              ? <span className="badge badge-info text-[10px] py-0"><Globe size={9} className="mr-0.5" /> Diocese</span>
                              : <span className="badge badge-neutral text-[10px] py-0"><Building size={9} className="mr-0.5" /> Parish</span>
                            }
                            {ev.start_time && (
                              <span className="text-xs text-secondary-400 flex items-center gap-0.5">
                                <Clock size={10} /> {ev.start_time}
                              </span>
                            )}
                          </div>
                          {ev.location && (
                            <p className="text-xs text-secondary-400 flex items-center gap-0.5 mt-0.5">
                              <MapPin size={10} /> {ev.location}
                            </p>
                          )}
                        </div>
                        <span className={`badge flex-shrink-0 text-[10px] ${ev.status === 'published' ? 'badge-success' : 'badge-neutral'
                          }`}>
                          {ev.status}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )
          }
        </div>

        {/* Liturgical calendar */}
        <div className="section-card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-secondary-700 flex items-center gap-2">
              <LiturgicalIcon size={14} className="text-purple-500" />
              Liturgical Calendar
            </h2>
            <button onClick={() => navigate('/liturgical-calendar')}
              className="text-xs text-purple-600 hover:text-purple-700 font-medium">
              View calendar
            </button>
          </div>
          {loading
            ? <div className="space-y-3"><SkListItem /><SkListItem /><SkListItem /></div>
            : litDays.length === 0
              ? (
                <div className="empty-state py-10">
                  <LiturgicalIcon size={24} className="text-secondary-200 mb-2" />
                  <p className="text-sm text-secondary-500">No upcoming feast days</p>
                </div>
              )
              : (
                <div className="space-y-2">
                  {litDays.slice(0, 3).map(day => {
                    const d = new Date(day.date);
                    return (
                      <div key={day.id}
                        className="flex items-start gap-3 p-3 rounded-lg border border-secondary-100
                                      hover:border-purple-200 hover:bg-purple-50/40
                                      transition-all duration-150 cursor-pointer">
                        <div className="w-10 h-10 rounded-xl flex-shrink-0 flex flex-col items-center
                                        justify-center text-white text-xs font-bold shadow-sm
                                        bg-gradient-to-br from-purple-500 to-purple-600">
                          <span className="text-[10px] leading-none opacity-80">
                            {format(d, 'MMM').toUpperCase()}
                          </span>
                          <span className="text-sm leading-none font-extrabold">{format(d, 'd')}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-secondary-800 truncate flex items-center gap-1">
                            {day.feast_type === 'SOLEMNITY' &&
                              <Star size={11} className="text-yellow-500 flex-shrink-0" />
                            }
                            {day.title}
                          </p>
                          <p className="text-xs text-secondary-500 truncate mt-0.5">{day.description}</p>
                          <div className="flex items-center gap-1.5 mt-1.5">
                            <span className={`badge text-[10px] py-0 border ${seasonCls[day.liturgical_season] ?? 'bg-gray-100 text-gray-700 border-gray-200'
                              }`}>
                              {day.liturgical_season.replace('_', ' ')}
                            </span>
                          </div>
                        </div>
                        <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 mt-1 ${litColorCls[day.liturgical_color] ?? 'bg-gray-400 border-gray-400'
                          }`} />
                      </div>
                    );
                  })}
                </div>
              )
          }
        </div>
      </div>

      {/* ── Bottom nav cards ─────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button
          onClick={() => navigate('/reports')}
          className="section-card flex items-center justify-between
                     hover:border-indigo-200 hover:shadow-card-md hover:-translate-y-0.5
                     transition-all duration-150 group text-left"
        >
          <div>
            <p className="text-sm font-semibold text-secondary-800">Reports & Analytics</p>
            <p className="text-xs text-secondary-400 mt-0.5">View detailed reports and insights</p>
          </div>
          <ArrowRight size={16} className="text-secondary-300 group-hover:text-primary-500
                                          group-hover:translate-x-0.5 transition-all flex-shrink-0" />
        </button>
        {user?.role !== UserRole.VIEWER && (
          <button
            onClick={() => navigate('/settings')}
            className="section-card flex items-center justify-between
                       hover:border-indigo-200 hover:shadow-card-md hover:-translate-y-0.5
                       transition-all duration-150 group text-left"
          >
            <div>
              <p className="text-sm font-semibold text-secondary-800">Settings</p>
              <p className="text-xs text-secondary-400 mt-0.5">Manage system and parish settings</p>
            </div>
            <ArrowRight size={16} className="text-secondary-300 group-hover:text-primary-500
                                            group-hover:translate-x-0.5 transition-all flex-shrink-0" />
          </button>
        )}
      </div>
    </div>
  );
};

// ── Small skeleton list item (reusable inline) ────────────────────────────────
const SkListItem = () => (
  <div className="flex items-start gap-3 animate-pulse">
    <div className="skeleton w-10 h-10 rounded-xl flex-shrink-0" />
    <div className="flex-1 space-y-2 py-1">
      <Sk w="w-3/4" h="h-3" />
      <Sk w="w-1/2" h="h-2.5" />
    </div>
    <div className="skeleton w-14 h-5 rounded-full flex-shrink-0" />
  </div>
);

export default Dashboard;