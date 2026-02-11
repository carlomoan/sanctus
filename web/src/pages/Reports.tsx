import { useState, useEffect } from 'react';
import { api } from '../api/client';
import { TrialBalance, IncomeExpenditureStatement, Parish } from '../types';
import { Filter, Calendar, FileText, Download, TrendingUp, TrendingDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Reports = () => {
  const [parishes, setParishes] = useState<Parish[]>([]);
  const [selectedParishId, setSelectedParishId] = useState<string>('');
  const [startDate, setStartDate] = useState<string>(new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [reportType, setReportType] = useState<'trial-balance' | 'income-expenditure'>('income-expenditure');
  const [trialBalance, setTrialBalance] = useState<TrialBalance | null>(null);
  const [incomeExpenditure, setIncomeExpenditure] = useState<IncomeExpenditureStatement | null>(null);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const fetchParishes = async () => {
    try {
      const data = await api.listParishes();
      setParishes(data);
      if (data.length > 0 && !selectedParishId) {
        setSelectedParishId(user?.parish_id || data[0].id);
      }
    } catch (err) {
      console.error('Failed to load parishes:', err);
    }
  };

  const fetchReport = async () => {
    if (!selectedParishId) return;
    setLoading(true);
    try {
      if (reportType === 'trial-balance') {
        const data = await api.getTrialBalance(selectedParishId, startDate, endDate);
        setTrialBalance(data);
      } else {
        const data = await api.getIncomeExpenditure(selectedParishId, startDate, endDate);
        setIncomeExpenditure(data);
      }
    } catch (err) {
      console.error('Failed to load report:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchParishes();
  }, []);

  useEffect(() => {
    fetchReport();
  }, [selectedParishId, startDate, endDate, reportType]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Financial Reports</h1>
        <button
          className="bg-white text-gray-700 border border-gray-300 px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-50 transition-colors"
          onClick={() => window.print()}
        >
          <Download size={20} />
          Export PDF
        </button>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2">
          <Filter size={20} className="text-gray-400" />
          <select
            value={selectedParishId}
            onChange={(e) => setSelectedParishId(e.target.value)}
            className="border border-gray-200 rounded-lg py-2 px-4 focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white min-w-[200px]"
          >
            <option value="" disabled>Select Parish</option>
            {parishes.map(parish => (
              <option key={parish.id} value={parish.id}>{parish.parish_name}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <Calendar size={20} className="text-gray-400" />
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="border border-gray-200 rounded-lg py-2 px-4 focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
          />
          <span className="text-gray-500">to</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="border border-gray-200 rounded-lg py-2 px-4 focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
          />
        </div>

        <div className="flex bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setReportType('income-expenditure')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${reportType === 'income-expenditure' ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
          >
            Income & Expenditure
          </button>
          <button
            onClick={() => setReportType('trial-balance')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${reportType === 'trial-balance' ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
          >
            Trial Balance
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Generating report...</div>
      ) : reportType === 'income-expenditure' && incomeExpenditure ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">Income & Expenditure Statement</h2>
            <p className="text-sm text-gray-500">For the period {startDate} to {endDate}</p>
          </div>

          <div className="p-6 space-y-8">
            {/* Income Section */}
            <div>
              <div className="flex items-center gap-2 mb-4 text-green-600">
                <TrendingUp size={20} />
                <h3 className="font-bold uppercase tracking-wider text-sm">Income</h3>
              </div>
              <table className="min-w-full">
                <tbody className="divide-y divide-gray-100">
                  {incomeExpenditure.income_entries.map((entry, idx) => (
                    <tr key={idx}>
                      <td className="py-2 text-gray-700">{entry.category.replace(/_/g, ' ')}</td>
                      <td className="py-2 text-right font-medium text-gray-900">
                        {entry.amount.toLocaleString('en-TZ', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                  <tr className="border-t-2 border-gray-900 font-bold">
                    <td className="py-3 text-gray-900">TOTAL INCOME</td>
                    <td className="py-3 text-right text-gray-900">
                      {incomeExpenditure.total_income.toLocaleString('en-TZ', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Expenditure Section */}
            <div>
              <div className="flex items-center gap-2 mb-4 text-red-600">
                <TrendingDown size={20} />
                <h3 className="font-bold uppercase tracking-wider text-sm">Expenditure</h3>
              </div>
              <table className="min-w-full">
                <tbody className="divide-y divide-gray-100">
                  {incomeExpenditure.expenditure_entries.map((entry, idx) => (
                    <tr key={idx}>
                      <td className="py-2 text-gray-700">{entry.category.replace(/_/g, ' ')}</td>
                      <td className="py-2 text-right font-medium text-gray-900">
                        {entry.amount.toLocaleString('en-TZ', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                  <tr className="border-t-2 border-gray-900 font-bold">
                    <td className="py-3 text-gray-900">TOTAL EXPENDITURE</td>
                    <td className="py-3 text-right text-gray-900">
                      {incomeExpenditure.total_expenditure.toLocaleString('en-TZ', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Net Surplus/Deficit */}
            <div className={`p-4 rounded-lg flex justify-between items-center ${incomeExpenditure.net_surplus_deficit >= 0 ? 'bg-green-50 border border-green-100' : 'bg-red-50 border border-red-100'
              }`}>
              <span className="font-bold text-gray-900">NET SURPLUS / (DEFICIT)</span>
              <span className={`text-xl font-bold ${incomeExpenditure.net_surplus_deficit >= 0 ? 'text-green-700' : 'text-red-700'
                }`}>
                {incomeExpenditure.net_surplus_deficit.toLocaleString('en-TZ', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>
      ) : reportType === 'trial-balance' && trialBalance ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900 text-center uppercase tracking-widest">Trial Balance</h2>
            <p className="text-sm text-gray-500 text-center">As at {endDate}</p>
          </div>

          <table className="min-w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Account Description</th>
                <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Debit (TZS)</th>
                <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Credit (TZS)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {trialBalance.entries.map((entry, idx) => (
                <tr key={idx}>
                  <td className="px-6 py-3 text-sm text-gray-700 font-medium">{entry.category.replace(/_/g, ' ')}</td>
                  <td className="px-6 py-3 text-right text-sm text-gray-900">
                    {entry.debit > 0 ? entry.debit.toLocaleString('en-TZ', { minimumFractionDigits: 2 }) : '-'}
                  </td>
                  <td className="px-6 py-3 text-right text-sm text-gray-900">
                    {entry.credit > 0 ? entry.credit.toLocaleString('en-TZ', { minimumFractionDigits: 2 }) : '-'}
                  </td>
                </tr>
              ))}
              <tr className="bg-gray-50 border-t-2 border-gray-900">
                <td className="px-6 py-4 text-sm font-bold text-gray-900 uppercase">Totals</td>
                <td className="px-6 py-4 text-right text-sm font-extrabold text-gray-900 border-b-4 border-double border-gray-900">
                  {trialBalance.total_debit.toLocaleString('en-TZ', { minimumFractionDigits: 2 })}
                </td>
                <td className="px-6 py-4 text-right text-sm font-extrabold text-gray-900 border-b-4 border-double border-gray-900">
                  {trialBalance.total_credit.toLocaleString('en-TZ', { minimumFractionDigits: 2 })}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-100">
          <FileText className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-lg font-medium text-gray-900">No report data available</h3>
          <p className="mt-1 text-sm text-gray-500">Select a parish and date range to generate a report.</p>
        </div>
      )}
    </div>
  );
};

export default Reports;
