import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { DashboardStats, Parish } from '../types';
import { Users, Church, Coins, FileText, UserPlus, Home, MapPin, Layers, ArrowRight, Search } from 'lucide-react';
import ImportButton from '../components/ImportButton';

const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [parishes, setParishes] = useState<Parish[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [s, p] = await Promise.all([api.getDashboardStats(), api.listParishes()]);
        setStats(s);
        setParishes(p);
      } catch (err) {
        console.error('Failed to load dashboard stats:', err);
        setError('Failed to load dashboard statistics');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

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

  return (
    <div className="space-y-6">
      {/* Header with Search */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
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
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex items-start justify-between hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate('/members')}>
          <div>
            <h3 className="text-gray-500 text-sm font-medium">Total Members</h3>
            <p className="text-3xl font-bold text-gray-900 mt-2">{stats?.total_members.toLocaleString()}</p>
            <span className="text-gray-400 text-xs mt-1 inline-block">Registered parishioners</span>
          </div>
          <div className="p-3 bg-blue-50 rounded-lg text-blue-600">
            <Users size={24} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex items-start justify-between hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate('/parishes')}>
          <div>
            <h3 className="text-gray-500 text-sm font-medium">Active Parishes</h3>
            <p className="text-3xl font-bold text-gray-900 mt-2">{stats?.active_parishes.toLocaleString()}</p>
            <span className="text-gray-400 text-xs mt-1 inline-block">Across the diocese</span>
          </div>
          <div className="p-3 bg-indigo-50 rounded-lg text-indigo-600">
            <Church size={24} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex items-start justify-between hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate('/finance')}>
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

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex items-start justify-between hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate('/finance')}>
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

      {/* Quick Actions */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <button
            onClick={() => navigate('/members')}
            className="flex flex-col items-center gap-2 p-4 rounded-lg border border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-colors group"
          >
            <div className="p-2 bg-blue-50 rounded-lg text-blue-600 group-hover:bg-blue-100">
              <UserPlus size={20} />
            </div>
            <span className="text-sm font-medium text-gray-700">Add Member</span>
          </button>

          <button
            onClick={() => navigate('/families')}
            className="flex flex-col items-center gap-2 p-4 rounded-lg border border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-colors group"
          >
            <div className="p-2 bg-purple-50 rounded-lg text-purple-600 group-hover:bg-purple-100">
              <Home size={20} />
            </div>
            <span className="text-sm font-medium text-gray-700">Add Family</span>
          </button>

          <button
            onClick={() => navigate('/clusters')}
            className="flex flex-col items-center gap-2 p-4 rounded-lg border border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-colors group"
          >
            <div className="p-2 bg-teal-50 rounded-lg text-teal-600 group-hover:bg-teal-100">
              <MapPin size={20} />
            </div>
            <span className="text-sm font-medium text-gray-700">Add SCC/Cluster</span>
          </button>

          <button
            onClick={() => navigate('/finance')}
            className="flex flex-col items-center gap-2 p-4 rounded-lg border border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-colors group"
          >
            <div className="p-2 bg-green-50 rounded-lg text-green-600 group-hover:bg-green-100">
              <Coins size={20} />
            </div>
            <span className="text-sm font-medium text-gray-700">Record Transaction</span>
          </button>

          <button
            onClick={() => navigate('/sacraments')}
            className="flex flex-col items-center gap-2 p-4 rounded-lg border border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-colors group"
          >
            <div className="p-2 bg-amber-50 rounded-lg text-amber-600 group-hover:bg-amber-100">
              <Layers size={20} />
            </div>
            <span className="text-sm font-medium text-gray-700">Add Sacrament</span>
          </button>
        </div>
      </div>

      {/* Parishes List */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Parishes ({filteredParishes.length})</h2>
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
                  <span className="flex items-center gap-1">
                    <Users size={14} />
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

      {/* Bulk Import Section */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Bulk Import</h2>
        <p className="text-sm text-gray-500 mb-4">Quickly import data from CSV or XLSX files. Download a template first, fill it in, then upload.</p>
        {!defaultParishId ? (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 text-orange-700 text-sm">
            <span className="font-medium">No parish available</span>
            <p className="mt-1">Please create a parish first before importing data.</p>
          </div>
        ) : (
          <div className="flex flex-wrap gap-3">
            <ImportButton
              label="Import Members"
              onImport={async (file) => api.importMembers(file, defaultParishId)}
              templateColumns={['member_code', 'first_name', 'last_name']}
            />
            <ImportButton
              label="Import Clusters"
              onImport={async (file) => api.importClusters(file, defaultParishId)}
              templateColumns={['cluster_code', 'cluster_name', 'location_description', 'leader_name']}
            />
            <ImportButton
              label="Import SCCs"
              onImport={async (file) => api.importSccs(file, defaultParishId)}
              templateColumns={['scc_code', 'scc_name', 'cluster_code', 'patron_saint', 'leader_name', 'location_description', 'meeting_day', 'meeting_time']}
            />
            <ImportButton
              label="Import Families"
              onImport={async (file) => api.importFamilies(file, defaultParishId)}
              templateColumns={['family_code', 'family_name', 'scc_code', 'physical_address', 'primary_phone', 'email', 'notes']}
            />
            <ImportButton
              label="Import Transactions"
              onImport={async (file) => api.importTransactions(file, defaultParishId)}
              templateColumns={['category', 'amount', 'payment_method', 'date(YYYY-MM-DD)', 'description']}
            />
          </div>
        )}
      </div>

      {/* Quick Navigation */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button onClick={() => navigate('/reports')} className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex items-center justify-between hover:border-primary-300 transition-colors group">
          <div>
            <h3 className="font-medium text-gray-900">Financial Reports</h3>
            <p className="text-sm text-gray-500">View income statements, balance sheets & more</p>
          </div>
          <ArrowRight size={20} className="text-gray-400 group-hover:text-primary-600" />
        </button>
        <button onClick={() => navigate('/import')} className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex items-center justify-between hover:border-primary-300 transition-colors group">
          <div>
            <h3 className="font-medium text-gray-900">Data Import</h3>
            <p className="text-sm text-gray-500">Import members, transactions & more from files</p>
          </div>
          <ArrowRight size={20} className="text-gray-400 group-hover:text-primary-600" />
        </button>
      </div>
    </div>
  );
};

export default Dashboard;
