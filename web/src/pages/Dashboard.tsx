import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { DashboardStats } from '../types';
import { Users, Church, Coins, FileText } from 'lucide-react';

const Dashboard = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await api.getDashboardStats();
        setStats(data);
      } catch (err) {
        console.error('Failed to load dashboard stats:', err);
        setError('Failed to load dashboard statistics');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return <div className="text-center py-12 text-gray-500">Loading dashboard...</div>;
  }

  if (error) {
    return <div className="text-center py-12 text-red-500">{error}</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Stats Cards */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex items-start justify-between">
          <div>
            <h3 className="text-gray-500 text-sm font-medium">Total Members</h3>
            <p className="text-3xl font-bold text-gray-900 mt-2">{stats?.total_members.toLocaleString()}</p>
            <span className="text-gray-400 text-xs mt-1 inline-block">Registered parishioners</span>
          </div>
          <div className="p-3 bg-blue-50 rounded-lg text-blue-600">
            <Users size={24} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex items-start justify-between">
          <div>
            <h3 className="text-gray-500 text-sm font-medium">Active Parishes</h3>
            <p className="text-3xl font-bold text-gray-900 mt-2">{stats?.active_parishes.toLocaleString()}</p>
            <span className="text-gray-400 text-xs mt-1 inline-block">Across the diocese</span>
          </div>
          <div className="p-3 bg-indigo-50 rounded-lg text-indigo-600">
            <Church size={24} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex items-start justify-between">
          <div>
            <h3 className="text-gray-500 text-sm font-medium">Total Income</h3>
            <p className="text-3xl font-bold text-gray-900 mt-2">
              {Number(stats?.total_income).toLocaleString('en-TZ', { style: 'currency', currency: 'TZS', maximumFractionDigits: 0 })}
            </p>
            <span className="text-green-600 text-xs mt-1 inline-block">Recorded revenue</span>
          </div>
          <div className="p-3 bg-green-50 rounded-lg text-green-600">
            <Coins size={24} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex items-start justify-between">
          <div>
            <h3 className="text-gray-500 text-sm font-medium">Pending Approvals</h3>
            <p className="text-3xl font-bold text-gray-900 mt-2">{stats?.pending_approvals.toLocaleString()}</p>
            <span className="text-orange-600 text-xs mt-1 inline-block">Vouchers needing action</span>
          </div>
          <div className="p-3 bg-orange-50 rounded-lg text-orange-600">
            <FileText size={24} />
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
        <div className="space-y-4">
          <p className="text-gray-500 italic">No recent activity to display.</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
