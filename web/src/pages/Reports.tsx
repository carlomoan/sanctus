import { useState, useEffect } from 'react';
import { api } from '../api/client';
import { TrialBalance, IncomeExpenditureStatement, Parish } from '../types';
import { Filter, Calendar, FileText, Download, TrendingUp, PieChart, Landmark, ArrowRightLeft, ClipboardList } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

type ReportType = 'income-expenditure' | 'trial-balance' | 'budget-vs-actual' | 'balance-sheet' | 'cash-flow' | 'audit-log';

const Reports = () => {
  const [parishes, setParishes] = useState<Parish[]>([]);
  const [selectedParishId, setSelectedParishId] = useState<string>('');
  const [startDate, setStartDate] = useState<string>(new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [reportType, setReportType] = useState<ReportType>('income-expenditure');

  const [trialBalance, setTrialBalance] = useState<TrialBalance | null>(null);
  const [incomeExpenditure, setIncomeExpenditure] = useState<IncomeExpenditureStatement | null>(null);
  const [budgetVsActual, setBudgetVsActual] = useState<any>(null);
  const [balanceSheet, setBalanceSheet] = useState<any>(null);
  const [cashFlow, setCashFlow] = useState<any>(null);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [auditActionFilter, setAuditActionFilter] = useState<string>('');
  const [auditTableFilter, setAuditTableFilter] = useState<string>('');

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
      switch (reportType) {
        case 'trial-balance':
          setTrialBalance(await api.getTrialBalance(selectedParishId, startDate, endDate));
          break;
        case 'income-expenditure':
          setIncomeExpenditure(await api.getIncomeExpenditure(selectedParishId, startDate, endDate));
          break;
        case 'budget-vs-actual':
          setBudgetVsActual(await api.getBudgetVsActual(selectedParishId, startDate, endDate));
          break;
        case 'balance-sheet':
          setBalanceSheet(await api.getBalanceSheet(selectedParishId, startDate, endDate));
          break;
        case 'cash-flow':
          setCashFlow(await api.getCashFlow(selectedParishId, startDate, endDate));
          break;
        case 'audit-log':
          {
            const [logs, usersData] = await Promise.all([
              api.listAuditLogs({
                parish_id: selectedParishId || undefined,
                action_type: auditActionFilter || undefined,
                table_name: auditTableFilter || undefined,
                limit: 200,
              }),
              users.length === 0 ? api.listUsers() : Promise.resolve(users),
            ]);
            setAuditLogs(logs);
            if (users.length === 0) setUsers(usersData);
          }
          break;
      }
    } catch (err) {
      console.error('Failed to load report:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchParishes(); }, []);
  useEffect(() => { fetchReport(); }, [selectedParishId, startDate, endDate, reportType, auditActionFilter, auditTableFilter]);

  const tabs: { id: ReportType, label: string, icon: any }[] = [
    { id: 'income-expenditure', label: 'Income & Expense', icon: TrendingUp },
    { id: 'trial-balance', label: 'Trial Balance', icon: Landmark },
    { id: 'budget-vs-actual', label: 'Budget vs Actual', icon: PieChart },
    { id: 'balance-sheet', label: 'Balance Sheet', icon: FileText },
    { id: 'cash-flow', label: 'Cash Flow', icon: ArrowRightLeft },
    { id: 'audit-log', label: 'Audit Log', icon: ClipboardList },
  ];

  const formatCurrency = (val: number) => val?.toLocaleString('en-TZ', { minimumFractionDigits: 2 }) || '0.00';

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Financial Reports</h1>
        <button className="bg-white text-gray-700 border border-gray-300 px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-50" onClick={() => window.print()}>
          <Download size={20} /> Export PDF
        </button>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2">
          <Filter size={20} className="text-gray-400" />
          <select value={selectedParishId} onChange={(e) => setSelectedParishId(e.target.value)} className="border border-gray-200 rounded-lg py-2 px-4 bg-white min-w-[200px]">
            <option value="" disabled>Select Parish</option>
            {parishes.map(p => <option key={p.id} value={p.id}>{p.parish_name}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <Calendar size={20} className="text-gray-400" />
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="border border-gray-200 rounded-lg py-2 px-4 bg-white" />
          <span className="text-gray-500">to</span>
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="border border-gray-200 rounded-lg py-2 px-4 bg-white" />
        </div>
      </div>

      <div className="flex bg-gray-100 p-1 rounded-lg overflow-x-auto">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setReportType(t.id)}
            className={`px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap flex items-center gap-2 transition-colors ${reportType === t.id ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
          >
            <t.icon size={16} /> {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Generating report...</div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
          {reportType === 'income-expenditure' && incomeExpenditure && (
            <div className="space-y-8">
              <h2 className="text-lg font-bold text-center uppercase border-b pb-4">Statement of Income & Expenditure</h2>
              <div>
                <h3 className="font-bold text-green-700 mb-2">Income</h3>
                <table className="w-full text-sm">
                  <tbody>
                    {incomeExpenditure.income_entries.map((e, i) => (
                      <tr key={i} className="border-b border-gray-50"><td className="py-2">{e.category.replace(/_/g, ' ')}</td><td className="text-right">{formatCurrency(e.amount)}</td></tr>
                    ))}
                    <tr className="font-bold bg-gray-50"><td className="py-2 pl-2">Total Income</td><td className="text-right pr-2">{formatCurrency(incomeExpenditure.total_income)}</td></tr>
                  </tbody>
                </table>
              </div>
              <div>
                <h3 className="font-bold text-red-700 mb-2">Expenditure</h3>
                <table className="w-full text-sm">
                  <tbody>
                    {incomeExpenditure.expenditure_entries.map((e, i) => (
                      <tr key={i} className="border-b border-gray-50"><td className="py-2">{e.category.replace(/_/g, ' ')}</td><td className="text-right">{formatCurrency(e.amount)}</td></tr>
                    ))}
                    <tr className="font-bold bg-gray-50"><td className="py-2 pl-2">Total Expenditure</td><td className="text-right pr-2">{formatCurrency(incomeExpenditure.total_expenditure)}</td></tr>
                  </tbody>
                </table>
              </div>
              <div className="flex justify-between font-bold text-lg pt-4 border-t-2 border-gray-200">
                <span>Net Surplus / (Deficit)</span>
                <span className={incomeExpenditure.net_surplus_deficit >= 0 ? 'text-green-700' : 'text-red-700'}>{formatCurrency(incomeExpenditure.net_surplus_deficit)}</span>
              </div>
            </div>
          )}

          {reportType === 'budget-vs-actual' && budgetVsActual && (
            <div className="space-y-6">
              <h2 className="text-lg font-bold text-center uppercase border-b pb-4">Budget vs Actual Report</h2>
              <table className="w-full text-sm">
                <thead className="bg-gray-50 font-bold">
                  <tr><th className="text-left p-2">Category</th><th className="text-right p-2">Budget</th><th className="text-right p-2">Actual</th><th className="text-right p-2">Variance</th></tr>
                </thead>
                <tbody>
                  {budgetVsActual.entries.map((e: any, i: number) => (
                    <tr key={i} className="border-b border-gray-50">
                      <td className="p-2">{e.category.replace(/_/g, ' ')}</td>
                      <td className="text-right p-2">{formatCurrency(e.budget)}</td>
                      <td className="text-right p-2">{formatCurrency(e.actual)}</td>
                      <td className={`text-right p-2 ${e.variance >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatCurrency(e.variance)}</td>
                    </tr>
                  ))}
                  <tr className="font-bold bg-gray-100">
                    <td className="p-2">Totals</td>
                    <td className="text-right p-2">{formatCurrency(budgetVsActual.total_budget)}</td>
                    <td className="text-right p-2">{formatCurrency(budgetVsActual.total_actual)}</td>
                    <td className="text-right p-2">{formatCurrency(budgetVsActual.total_variance)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {reportType === 'balance-sheet' && balanceSheet && (
            <div className="space-y-8">
              <h2 className="text-lg font-bold text-center uppercase border-b pb-4">Statement of Financial Position</h2>
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h3 className="font-bold text-lg mb-2 border-b">Assets</h3>
                  {balanceSheet.assets.entries.map((e: any, i: number) => (
                    <div key={i} className="flex justify-between py-2 border-b border-gray-50"><span>{e.name}</span><span>{formatCurrency(e.amount)}</span></div>
                  ))}
                  <div className="flex justify-between font-bold py-2 mt-2 bg-gray-50 px-2"><span>Total Assets</span><span>{formatCurrency(balanceSheet.assets.total)}</span></div>
                </div>
                <div>
                  <h3 className="font-bold text-lg mb-2 border-b">Liabilities & Equity</h3>
                  <div className="mb-6">
                    <h4 className="font-semibold text-gray-600 mb-2">Liabilities</h4>
                    {balanceSheet.liabilities.entries.map((e: any, i: number) => (
                      <div key={i} className="flex justify-between py-2 border-b border-gray-50"><span>{e.name}</span><span>{formatCurrency(e.amount)}</span></div>
                    ))}
                    <div className="flex justify-between font-bold py-2 mt-2 bg-gray-50 px-2"><span>Total Liabilities</span><span>{formatCurrency(balanceSheet.liabilities.total)}</span></div>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-600 mb-2">Equity</h4>
                    {balanceSheet.equity.entries.map((e: any, i: number) => (
                      <div key={i} className="flex justify-between py-2 border-b border-gray-50"><span>{e.name}</span><span>{formatCurrency(e.amount)}</span></div>
                    ))}
                    <div className="flex justify-between font-bold py-2 mt-2 bg-gray-50 px-2"><span>Total Equity</span><span>{formatCurrency(balanceSheet.equity.total)}</span></div>
                  </div>
                  <div className="flex justify-between font-bold py-2 mt-4 bg-gray-100 px-2 border-t-2 border-gray-300">
                    <span>Total Liab. & Equity</span>
                    <span>{formatCurrency(balanceSheet.liabilities.total + balanceSheet.equity.total)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {reportType === 'cash-flow' && cashFlow && (
            <div className="space-y-6">
              <h2 className="text-lg font-bold text-center uppercase border-b pb-4">Statement of Cash Flows</h2>
              {cashFlow.sections.map((sec: any, i: number) => (
                <div key={i}>
                  <h3 className="font-bold text-gray-700 mb-2">{sec.section_name}</h3>
                  <table className="w-full text-sm">
                    <tbody>
                      {sec.entries.map((e: any, j: number) => (
                        <tr key={j} className="border-b border-gray-50"><td className="py-2">{e.description}</td><td className="text-right">{formatCurrency(e.amount)}</td></tr>
                      ))}
                      <tr className="font-bold bg-gray-50"><td className="py-2 pl-2">Net Cash from {sec.section_name}</td><td className="text-right pr-2">{formatCurrency(sec.total)}</td></tr>
                    </tbody>
                  </table>
                </div>
              ))}
              <div className="pt-4 mt-4 border-t border-gray-200">
                <div className="flex justify-between py-2"><span>Net Increase in Cash</span><span className="font-bold">{formatCurrency(cashFlow.net_cash_flow)}</span></div>
                <div className="flex justify-between py-2"><span>Cash at Beginning of Period</span><span>{formatCurrency(cashFlow.opening_balance)}</span></div>
                <div className="flex justify-between py-2 font-bold text-lg bg-gray-100 px-2 rounded"><span>Cash at End of Period</span><span>{formatCurrency(cashFlow.closing_balance)}</span></div>
              </div>
            </div>
          )}

          {reportType === 'audit-log' && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-center uppercase border-b pb-4">User Audit Report</h2>
              <div className="flex flex-wrap gap-3 pb-4 border-b border-gray-100">
                <select
                  value={auditActionFilter}
                  onChange={e => setAuditActionFilter(e.target.value)}
                  className="border border-gray-200 rounded-lg py-2 px-3 text-sm bg-white min-w-[160px]"
                >
                  <option value="">All Actions</option>
                  <option value="INSERT">INSERT</option>
                  <option value="UPDATE">UPDATE</option>
                  <option value="DELETE">DELETE</option>
                  <option value="LOGIN">LOGIN</option>
                </select>
                <select
                  value={auditTableFilter}
                  onChange={e => setAuditTableFilter(e.target.value)}
                  className="border border-gray-200 rounded-lg py-2 px-3 text-sm bg-white min-w-[180px]"
                >
                  <option value="">All Tables</option>
                  <option value="income_transaction">Income Transactions</option>
                  <option value="expense_voucher">Expense Vouchers</option>
                  <option value="member">Members</option>
                  <option value="app_user">Users</option>
                  <option value="parish">Parishes</option>
                </select>
              </div>
              {auditLogs.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <ClipboardList size={40} className="mx-auto mb-3" />
                  <p>No audit log entries found for the selected filters.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left p-2 font-medium text-gray-600">Date/Time</th>
                        <th className="text-left p-2 font-medium text-gray-600">User</th>
                        <th className="text-left p-2 font-medium text-gray-600">Action</th>
                        <th className="text-left p-2 font-medium text-gray-600">Table</th>
                        <th className="text-left p-2 font-medium text-gray-600">Record ID</th>
                        <th className="text-left p-2 font-medium text-gray-600">Details</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {auditLogs.map((log: any) => {
                        const logUser = users.find((u: any) => u.id === log.user_id);
                        const actionColors: Record<string, string> = {
                          INSERT: 'bg-green-100 text-green-700',
                          UPDATE: 'bg-blue-100 text-blue-700',
                          DELETE: 'bg-red-100 text-red-700',
                          LOGIN: 'bg-purple-100 text-purple-700',
                        };
                        return (
                          <tr key={log.id} className="hover:bg-gray-50">
                            <td className="p-2 whitespace-nowrap text-gray-500">
                              {new Date(log.created_at).toLocaleDateString()} {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                            </td>
                            <td className="p-2">
                              <span className="font-medium">{logUser?.full_name || '—'}</span>
                              {logUser?.username && <span className="text-gray-400 text-xs ml-1">({logUser.username})</span>}
                            </td>
                            <td className="p-2">
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${actionColors[log.action_type] || 'bg-gray-100 text-gray-600'}`}>
                                {log.action_type}
                              </span>
                            </td>
                            <td className="p-2 text-gray-600">{log.table_name?.replace(/_/g, ' ') || '—'}</td>
                            <td className="p-2 font-mono text-xs text-gray-400">{log.record_id ? log.record_id.substring(0, 8) + '...' : '—'}</td>
                            <td className="p-2 text-xs text-gray-500 max-w-xs truncate">
                              {log.new_values ? JSON.stringify(log.new_values).substring(0, 80) + '...' : log.old_values ? 'Deleted record' : '—'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {reportType === 'trial-balance' && trialBalance && (
            <div className="space-y-6">
              <h2 className="text-lg font-bold text-center uppercase border-b pb-4">Trial Balance</h2>
              <table className="w-full text-sm">
                <thead className="bg-gray-50 font-bold">
                  <tr><th className="text-left p-2">Account</th><th className="text-right p-2">Debit</th><th className="text-right p-2">Credit</th></tr>
                </thead>
                <tbody>
                  {trialBalance.entries.map((e, i) => (
                    <tr key={i} className="border-b border-gray-50">
                      <td className="p-2">{e.category.replace(/_/g, ' ')}</td>
                      <td className="text-right p-2">{e.debit > 0 ? formatCurrency(e.debit) : '-'}</td>
                      <td className="text-right p-2">{e.credit > 0 ? formatCurrency(e.credit) : '-'}</td>
                    </tr>
                  ))}
                  <tr className="font-bold bg-gray-100 border-t-2 border-gray-900">
                    <td className="p-2">Totals</td>
                    <td className="text-right p-2">{formatCurrency(trialBalance.total_debit)}</td>
                    <td className="text-right p-2">{formatCurrency(trialBalance.total_credit)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Reports;
