import { useState, useEffect } from 'react';
import { api } from '../api/client';
import { TrialBalance, IncomeExpenditureStatement, Parish, UserRole } from '../types';
import { Calendar, FileText, Download, TrendingUp, PieChart, Landmark, ArrowRightLeft, ClipboardList, Printer, Search, Users, Building2, Receipt, CreditCard, Eye } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { filterParishesByRole } from '../utils/parishFilters';
import { downloadReportPdf, printReportPdf, ReportData, ReportSection, formatCurrency } from '../utils/reportPdf';

type ReportType = 'income-expenditure' | 'trial-balance' | 'budget-vs-actual' | 'balance-sheet' | 'cash-flow' | 'audit-log';

type DateRangePreset = 'custom' | 'this-month' | 'last-month' | 'this-year' | 'last-year' | 'last-30-days' | 'last-90-days';

const fc = (val: number) => formatCurrency(val);

const Reports = () => {
    const [parishes, setParishes] = useState<Parish[]>([]);
    const [selectedParishId, setSelectedParishId] = useState<string>('');
    const [startDate, setStartDate] = useState<string>(new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [dateRangePreset, setDateRangePreset] = useState<DateRangePreset>('this-year');
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
    const [expandedLog, setExpandedLog] = useState<string | null>(null);

    const [loading, setLoading] = useState(false);
    const [exporting, setExporting] = useState(false);
    const { user } = useAuth();

    const handleDateRangePreset = (preset: DateRangePreset) => {
        setDateRangePreset(preset);
        const now = new Date();
        let start: Date;
        let end: Date = now;

        switch (preset) {
            case 'this-month':
                start = new Date(now.getFullYear(), now.getMonth(), 1);
                break;
            case 'last-month':
                start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                end = new Date(now.getFullYear(), now.getMonth(), 0);
                break;
            case 'this-year':
                start = new Date(now.getFullYear(), 0, 1);
                break;
            case 'last-year':
                start = new Date(now.getFullYear() - 1, 0, 1);
                end = new Date(now.getFullYear() - 1, 11, 31);
                break;
            case 'last-30-days':
                start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                break;
            case 'last-90-days':
                start = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
                break;
            case 'custom':
            default:
                return;
        }

        setStartDate(start.toISOString().split('T')[0]);
        setEndDate(end.toISOString().split('T')[0]);
    };

    const getReportTitle = () => {
        const titles: Record<ReportType, string> = {
            'income-expenditure': 'Income and Expenditure Statement',
            'trial-balance': 'Trial Balance',
            'budget-vs-actual': 'Budget vs Actual',
            'balance-sheet': 'Balance Sheet',
            'cash-flow': 'Cash Flow Statement',
            'audit-log': 'Audit Log',
        };
        return titles[reportType];
    };

    const buildReportSections = (): ReportSection[] => {
        const sections: ReportSection[] = [];

        if (reportType === 'income-expenditure' && incomeExpenditure) {
            sections.push({
                title: 'Income',
                table: {
                    columns: [{ header: 'Category', width: 120 }, { header: 'Amount (TZS)', width: 50, align: 'right' }],
                    rows: [
                        ...incomeExpenditure.income_entries.map(e => ({ cells: [e.category.replace(/_/g, ' '), fc(e.amount)] })),
                        { cells: ['Total Income', fc(incomeExpenditure.total_income)], bold: true, bg: '240,253,244' },
                    ],
                },
            });
            sections.push({
                title: 'Expenditure',
                table: {
                    columns: [{ header: 'Category', width: 120 }, { header: 'Amount (TZS)', width: 50, align: 'right' }],
                    rows: [
                        ...incomeExpenditure.expenditure_entries.map(e => ({ cells: [e.category.replace(/_/g, ' '), fc(e.amount)] })),
                        { cells: ['Total Expenditure', fc(incomeExpenditure.total_expenditure)], bold: true, bg: '254,242,242' },
                    ],
                },
            });
            sections.push({
                title: 'Net Surplus / (Deficit)',
                text: `TZS ${fc(incomeExpenditure.net_surplus_deficit)}`,
            });
        }

        if (reportType === 'trial-balance' && trialBalance) {
            sections.push({
                table: {
                    columns: [{ header: 'Account', width: 100 }, { header: 'Debit (TZS)', width: 45, align: 'right' }, { header: 'Credit (TZS)', width: 45, align: 'right' }],
                    rows: [
                        ...trialBalance.entries.map(e => ({
                            cells: [e.category.replace(/_/g, ' '), e.debit > 0 ? fc(e.debit) : '-', e.credit > 0 ? fc(e.credit) : '-'],
                        })),
                        { cells: ['Totals', fc(trialBalance.total_debit), fc(trialBalance.total_credit)], bold: true, bg: '243,244,246' },
                    ],
                },
            });
        }

        if (reportType === 'budget-vs-actual' && budgetVsActual) {
            sections.push({
                table: {
                    columns: [{ header: 'Category', width: 80 }, { header: 'Budget', width: 40, align: 'right' }, { header: 'Actual', width: 40, align: 'right' }, { header: 'Variance', width: 40, align: 'right' }],
                    rows: [
                        ...budgetVsActual.entries.map((e: any) => ({
                            cells: [e.category.replace(/_/g, ' '), fc(e.budget), fc(e.actual), fc(e.variance)],
                        })),
                        { cells: ['Totals', fc(budgetVsActual.total_budget), fc(budgetVsActual.total_actual), fc(budgetVsActual.total_variance)], bold: true, bg: '243,244,246' },
                    ],
                },
            });
        }

        if (reportType === 'balance-sheet' && balanceSheet) {
            sections.push({
                title: 'Assets',
                table: {
                    columns: [{ header: 'Item', width: 120 }, { header: 'Amount (TZS)', width: 50, align: 'right' }],
                    rows: [
                        ...balanceSheet.assets.entries.map((e: any) => ({ cells: [e.name, fc(e.amount)] })),
                        { cells: ['Total Assets', fc(balanceSheet.assets.total)], bold: true, bg: '240,253,244' },
                    ],
                },
            });
            sections.push({
                title: 'Liabilities',
                table: {
                    columns: [{ header: 'Item', width: 120 }, { header: 'Amount (TZS)', width: 50, align: 'right' }],
                    rows: [
                        ...balanceSheet.liabilities.entries.map((e: any) => ({ cells: [e.name, fc(e.amount)] })),
                        { cells: ['Total Liabilities', fc(balanceSheet.liabilities.total)], bold: true, bg: '254,242,242' },
                    ],
                },
            });
            sections.push({
                title: 'Equity',
                table: {
                    columns: [{ header: 'Item', width: 120 }, { header: 'Amount (TZS)', width: 50, align: 'right' }],
                    rows: [
                        ...balanceSheet.equity.entries.map((e: any) => ({ cells: [e.name, fc(e.amount)] })),
                        { cells: ['Total Equity', fc(balanceSheet.equity.total)], bold: true, bg: '239,246,255' },
                    ],
                },
            });
        }

        if (reportType === 'cash-flow' && cashFlow) {
            cashFlow.sections.forEach((sec: any) => {
                sections.push({
                    title: sec.section_name,
                    table: {
                        columns: [{ header: 'Description', width: 120 }, { header: 'Amount (TZS)', width: 50, align: 'right' }],
                        rows: [
                            ...sec.entries.map((e: any) => ({ cells: [e.description, fc(e.amount)] })),
                            { cells: [`Net Cash from ${sec.section_name}`, fc(sec.total)], bold: true, bg: '243,244,246' },
                        ],
                    },
                });
            });
            sections.push({
                title: 'Summary',
                text: `Net Increase: TZS ${fc(cashFlow.net_cash_flow)} | Opening: TZS ${fc(cashFlow.opening_balance)} | Closing: TZS ${fc(cashFlow.closing_balance)}`,
            });
        }

        if (reportType === 'audit-log' && auditLogs.length > 0) {
            sections.push({
                table: {
                    columns: [{ header: 'Date/Time', width: 35 }, { header: 'User', width: 35 }, { header: 'Action', width: 25 }, { header: 'Table', width: 35 }, { header: 'Details', width: 40 }],
                    rows: auditLogs.slice(0, 50).map((log: any) => {
                        const logUser = users.find((u: any) => u.id === log.user_id);
                        return {
                            cells: [
                                new Date(log.created_at).toLocaleDateString(),
                                logUser?.full_name || log.user_id?.substring(0, 8) || 'System',
                                log.action_type,
                                log.table_name?.replace(/_/g, ' ') || '-',
                                log.new_values ? JSON.stringify(log.new_values).substring(0, 40) + '...' : '-',
                            ],
                        };
                    }),
                },
            });
        }

        return sections;
    };

    const exportToPDF = async () => {
        const parish = parishes.find(p => p.id === selectedParishId);
        if (!parish && reportType !== 'audit-log') {
            alert('Please select a parish first');
            return;
        }

        setExporting(true);
        try {
            const reportData: ReportData = {
                title: getReportTitle(),
                parish: parish || { id: '', parish_name: 'All Parishes', parish_code: '', diocese_id: '', is_active: true } as Parish,
                generatedBy: user?.full_name || user?.username || 'Unknown',
                generatedAt: new Date(),
                periodStart: startDate,
                periodEnd: endDate,
                sections: buildReportSections(),
                reportType,
            };

            await downloadReportPdf(reportData);
        } finally {
            setExporting(false);
        }
    };

    const handlePrint = async () => {
        const parish = parishes.find(p => p.id === selectedParishId);
        if (!parish && reportType !== 'audit-log') {
            alert('Please select a parish first');
            return;
        }

        setExporting(true);
        try {
            const reportData: ReportData = {
                title: getReportTitle(),
                parish: parish || { id: '', parish_name: 'All Parishes', parish_code: '', diocese_id: '', is_active: true } as Parish,
                generatedBy: user?.full_name || user?.username || 'Unknown',
                generatedAt: new Date(),
                periodStart: startDate,
                periodEnd: endDate,
                sections: buildReportSections(),
                reportType,
            };

            await printReportPdf(reportData);
        } finally {
            setExporting(false);
        }
    };

    const fetchParishes = async () => {
        try {
            const allParishes = await api.listParishes();
            const accessibleParishes = filterParishesByRole(allParishes, user);
            setParishes(accessibleParishes);

            if (user?.role !== UserRole.SUPER_ADMIN && accessibleParishes.length > 0) {
                setSelectedParishId(accessibleParishes[0].id);
            } else if (accessibleParishes.length > 0 && !selectedParishId) {
                setSelectedParishId(accessibleParishes[0].id);
            }
        } catch (err) {
            console.error('Failed to load parishes:', err);
        }
    };

    const fetchReport = async () => {
        if (!selectedParishId && reportType !== 'audit-log') return;
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
                        const logs = await api.listAuditLogs({
                            parish_id: selectedParishId || undefined,
                            action_type: auditActionFilter || undefined,
                            table_name: auditTableFilter || undefined,
                            limit: 200,
                        });
                        setAuditLogs(logs);

                        if (users.length === 0 && user?.role === UserRole.SUPER_ADMIN) {
                            try {
                                const usersData = await api.listUsers();
                                setUsers(usersData);
                            } catch {
                                // ParishAdmin can't list users
                            }
                        }
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

    const tabs: { id: ReportType; label: string; icon: any }[] = [
        { id: 'income-expenditure', label: 'Income & Expense', icon: TrendingUp },
        { id: 'trial-balance', label: 'Trial Balance', icon: Landmark },
        { id: 'budget-vs-actual', label: 'Budget vs Actual', icon: PieChart },
        { id: 'balance-sheet', label: 'Balance Sheet', icon: FileText },
        { id: 'cash-flow', label: 'Cash Flow', icon: ArrowRightLeft },
        { id: 'audit-log', label: 'Audit Log', icon: ClipboardList },
    ];

    const actionColors: Record<string, string> = {
        INSERT: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        UPDATE: 'bg-blue-50 text-blue-700 border-blue-200',
        DELETE: 'bg-red-50 text-red-700 border-red-200',
        LOGIN: 'bg-violet-50 text-violet-700 border-violet-200',
    };

    const actionIcons: Record<string, any> = {
        INSERT: Receipt,
        UPDATE: CreditCard,
        DELETE: Building2,
        LOGIN: Users,
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Financial Reports</h1>
                    <p className="text-sm text-gray-500 mt-1">Generate, export, and print parish financial statements</p>
                </div>
                <div className="flex gap-2">
                    <button
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-gray-300 bg-white text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
                        onClick={handlePrint}
                        disabled={exporting || loading}
                    >
                        <Printer size={16} /> Print
                    </button>
                    <button
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 transition-colors disabled:opacity-50"
                        onClick={exportToPDF}
                        disabled={exporting || loading}
                    >
                        <Download size={16} /> {exporting ? 'Exporting...' : 'Export PDF'}
                    </button>
                </div>
            </div>

            {/* Filters Bar */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                <div className="flex flex-wrap gap-4 items-center">
                    {user?.role === UserRole.SUPER_ADMIN && (
                        <div className="flex items-center gap-2">
                            <Building2 size={18} className="text-gray-400" />
                            <select
                                value={selectedParishId}
                                onChange={(e) => setSelectedParishId(e.target.value)}
                                className="border border-gray-200 rounded-lg py-2 px-3 bg-white min-w-[200px] text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            >
                                <option value="" disabled>Select Parish</option>
                                {parishes.filter(p => p.is_active).map(p => <option key={p.id} value={p.id}>{p.parish_name}</option>)}
                            </select>
                        </div>
                    )}

                    <div className="flex items-center gap-2">
                        <Calendar size={18} className="text-gray-400" />
                        <select
                            value={dateRangePreset}
                            onChange={(e) => handleDateRangePreset(e.target.value as DateRangePreset)}
                            className="border border-gray-200 rounded-lg py-2 px-3 bg-white min-w-[160px] text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        >
                            <option value="custom">Custom Range</option>
                            <option value="this-month">This Month</option>
                            <option value="last-month">Last Month</option>
                            <option value="this-year">This Year</option>
                            <option value="last-year">Last Year</option>
                            <option value="last-30-days">Last 30 Days</option>
                            <option value="last-90-days">Last 90 Days</option>
                        </select>
                    </div>

                    {dateRangePreset === 'custom' && (
                        <>
                            <div className="flex items-center gap-2">
                                <label className="text-sm text-gray-500">From:</label>
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="border border-gray-200 rounded-lg py-2 px-3 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <label className="text-sm text-gray-500">To:</label>
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="border border-gray-200 rounded-lg py-2 px-3 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                />
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex bg-gray-100 p-1 rounded-xl overflow-x-auto">
                {tabs.map(t => {
                    const Icon = t.icon;
                    return (
                        <button
                            key={t.id}
                            onClick={() => setReportType(t.id)}
                            className={`px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap flex items-center gap-2 transition-all ${reportType === t.id
                                ? 'bg-white text-primary-700 shadow-sm ring-1 ring-primary-200'
                                : 'text-gray-500 hover:text-gray-700 hover:bg-white/50'
                                }`}
                        >
                            <Icon size={16} /> {t.label}
                        </button>
                    );
                })}
            </div>

            {/* Report Content */}
            {loading ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600 mx-auto mb-4" />
                    <p className="text-gray-500 text-sm">Generating report...</p>
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    {/* Report Header */}
                    <div className="bg-gradient-to-r from-primary-600 to-primary-700 px-6 py-4">
                        <h2 className="text-lg font-semibold text-white">{getReportTitle()}</h2>
                        <p className="text-primary-100 text-sm mt-0.5">
                            Period: {startDate} to {endDate}
                            {selectedParishId && ` | Parish: ${parishes.find(p => p.id === selectedParishId)?.parish_name || ''}`}
                        </p>
                    </div>

                    <div className="p-6">
                        {/* Income & Expenditure */}
                        {reportType === 'income-expenditure' && incomeExpenditure && (
                            <div className="space-y-8">
                                {/* Summary Cards */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                                        <p className="text-xs font-medium text-emerald-600 uppercase tracking-wider">Total Income</p>
                                        <p className="text-2xl font-bold text-emerald-700 mt-1">TZS {fc(incomeExpenditure.total_income)}</p>
                                    </div>
                                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                        <p className="text-xs font-medium text-red-600 uppercase tracking-wider">Total Expenditure</p>
                                        <p className="text-2xl font-bold text-red-700 mt-1">TZS {fc(incomeExpenditure.total_expenditure)}</p>
                                    </div>
                                    <div className={`border rounded-lg p-4 ${incomeExpenditure.net_surplus_deficit >= 0 ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
                                        <p className={`text-xs font-medium uppercase tracking-wider ${incomeExpenditure.net_surplus_deficit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                            Net Surplus / (Deficit)
                                        </p>
                                        <p className={`text-2xl font-bold mt-1 ${incomeExpenditure.net_surplus_deficit >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                                            TZS {fc(incomeExpenditure.net_surplus_deficit)}
                                        </p>
                                    </div>
                                </div>

                                {/* Income Table */}
                                <div>
                                    <h3 className="text-sm font-semibold text-emerald-700 uppercase tracking-wider mb-3 flex items-center gap-2">
                                        <TrendingUp size={16} /> Income Breakdown
                                    </h3>
                                    <div className="overflow-hidden rounded-lg border border-gray-200">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="bg-emerald-50">
                                                    <th className="text-left p-3 font-semibold text-emerald-800">Category</th>
                                                    <th className="text-right p-3 font-semibold text-emerald-800">Amount (TZS)</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100">
                                                {incomeExpenditure.income_entries.map((e, i) => (
                                                    <tr key={i} className="hover:bg-gray-50 transition-colors">
                                                        <td className="p-3 text-gray-700">{e.category.replace(/_/g, ' ')}</td>
                                                        <td className="p-3 text-right font-mono text-gray-900">{fc(e.amount)}</td>
                                                    </tr>
                                                ))}
                                                <tr className="bg-emerald-50 font-bold">
                                                    <td className="p-3 text-emerald-800">Total Income</td>
                                                    <td className="p-3 text-right font-mono text-emerald-800">{fc(incomeExpenditure.total_income)}</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                {/* Expenditure Table */}
                                <div>
                                    <h3 className="text-sm font-semibold text-red-700 uppercase tracking-wider mb-3 flex items-center gap-2">
                                        <CreditCard size={16} /> Expenditure Breakdown
                                    </h3>
                                    <div className="overflow-hidden rounded-lg border border-gray-200">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="bg-red-50">
                                                    <th className="text-left p-3 font-semibold text-red-800">Category</th>
                                                    <th className="text-right p-3 font-semibold text-red-800">Amount (TZS)</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100">
                                                {incomeExpenditure.expenditure_entries.map((e, i) => (
                                                    <tr key={i} className="hover:bg-gray-50 transition-colors">
                                                        <td className="p-3 text-gray-700">{e.category.replace(/_/g, ' ')}</td>
                                                        <td className="p-3 text-right font-mono text-gray-900">{fc(e.amount)}</td>
                                                    </tr>
                                                ))}
                                                <tr className="bg-red-50 font-bold">
                                                    <td className="p-3 text-red-800">Total Expenditure</td>
                                                    <td className="p-3 text-right font-mono text-red-800">{fc(incomeExpenditure.total_expenditure)}</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Trial Balance */}
                        {reportType === 'trial-balance' && trialBalance && (
                            <div className="space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                        <p className="text-xs font-medium text-blue-600 uppercase tracking-wider">Total Debits</p>
                                        <p className="text-2xl font-bold text-blue-700 mt-1">TZS {fc(trialBalance.total_debit)}</p>
                                    </div>
                                    <div className="bg-violet-50 border border-violet-200 rounded-lg p-4">
                                        <p className="text-xs font-medium text-violet-600 uppercase tracking-wider">Total Credits</p>
                                        <p className="text-2xl font-bold text-violet-700 mt-1">TZS {fc(trialBalance.total_credit)}</p>
                                    </div>
                                </div>
                                <div className="overflow-hidden rounded-lg border border-gray-200">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="bg-gray-50">
                                                <th className="text-left p-3 font-semibold text-gray-700">Account</th>
                                                <th className="text-right p-3 font-semibold text-gray-700">Debit (TZS)</th>
                                                <th className="text-right p-3 font-semibold text-gray-700">Credit (TZS)</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {trialBalance.entries.map((e, i) => (
                                                <tr key={i} className="hover:bg-gray-50 transition-colors">
                                                    <td className="p-3 text-gray-700">{e.category.replace(/_/g, ' ')}</td>
                                                    <td className="p-3 text-right font-mono text-gray-900">{e.debit > 0 ? fc(e.debit) : '-'}</td>
                                                    <td className="p-3 text-right font-mono text-gray-900">{e.credit > 0 ? fc(e.credit) : '-'}</td>
                                                </tr>
                                            ))}
                                            <tr className="bg-gray-100 font-bold border-t-2 border-gray-300">
                                                <td className="p-3 text-gray-800">Totals</td>
                                                <td className="p-3 text-right font-mono text-gray-800">{fc(trialBalance.total_debit)}</td>
                                                <td className="p-3 text-right font-mono text-gray-800">{fc(trialBalance.total_credit)}</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* Budget vs Actual */}
                        {reportType === 'budget-vs-actual' && budgetVsActual && (
                            <div className="space-y-6">
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                        <p className="text-xs font-medium text-blue-600 uppercase tracking-wider">Total Budget</p>
                                        <p className="text-2xl font-bold text-blue-700 mt-1">TZS {fc(budgetVsActual.total_budget)}</p>
                                    </div>
                                    <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                                        <p className="text-xs font-medium text-emerald-600 uppercase tracking-wider">Total Actual</p>
                                        <p className="text-2xl font-bold text-emerald-700 mt-1">TZS {fc(budgetVsActual.total_actual)}</p>
                                    </div>
                                    <div className={`border rounded-lg p-4 ${budgetVsActual.total_variance >= 0 ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
                                        <p className={`text-xs font-medium uppercase tracking-wider ${budgetVsActual.total_variance >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>Variance</p>
                                        <p className={`text-2xl font-bold mt-1 ${budgetVsActual.total_variance >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>TZS {fc(budgetVsActual.total_variance)}</p>
                                    </div>
                                </div>
                                <div className="overflow-hidden rounded-lg border border-gray-200">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="bg-gray-50">
                                                <th className="text-left p-3 font-semibold text-gray-700">Category</th>
                                                <th className="text-right p-3 font-semibold text-gray-700">Budget (TZS)</th>
                                                <th className="text-right p-3 font-semibold text-gray-700">Actual (TZS)</th>
                                                <th className="text-right p-3 font-semibold text-gray-700">Variance (TZS)</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {budgetVsActual.entries.map((e: any, i: number) => (
                                                <tr key={i} className="hover:bg-gray-50 transition-colors">
                                                    <td className="p-3 text-gray-700">{e.category.replace(/_/g, ' ')}</td>
                                                    <td className="p-3 text-right font-mono text-gray-900">{fc(e.budget)}</td>
                                                    <td className="p-3 text-right font-mono text-gray-900">{fc(e.actual)}</td>
                                                    <td className={`p-3 text-right font-mono font-semibold ${e.variance >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{fc(e.variance)}</td>
                                                </tr>
                                            ))}
                                            <tr className="bg-gray-100 font-bold border-t-2 border-gray-300">
                                                <td className="p-3 text-gray-800">Totals</td>
                                                <td className="p-3 text-right font-mono text-gray-800">{fc(budgetVsActual.total_budget)}</td>
                                                <td className="p-3 text-right font-mono text-gray-800">{fc(budgetVsActual.total_actual)}</td>
                                                <td className="p-3 text-right font-mono text-gray-800">{fc(budgetVsActual.total_variance)}</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* Balance Sheet */}
                        {reportType === 'balance-sheet' && balanceSheet && (
                            <div className="space-y-8">
                                <div className="grid md:grid-cols-2 gap-8">
                                    <div>
                                        <h3 className="text-sm font-semibold text-emerald-700 uppercase tracking-wider mb-3 flex items-center gap-2">
                                            <TrendingUp size={16} /> Assets
                                        </h3>
                                        <div className="overflow-hidden rounded-lg border border-gray-200">
                                            <table className="w-full text-sm">
                                                <thead>
                                                    <tr className="bg-emerald-50">
                                                        <th className="text-left p-3 font-semibold text-emerald-800">Item</th>
                                                        <th className="text-right p-3 font-semibold text-emerald-800">Amount (TZS)</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-100">
                                                    {balanceSheet.assets.entries.map((e: any, i: number) => (
                                                        <tr key={i} className="hover:bg-gray-50">
                                                            <td className="p-3 text-gray-700">{e.name}</td>
                                                            <td className="p-3 text-right font-mono text-gray-900">{fc(e.amount)}</td>
                                                        </tr>
                                                    ))}
                                                    <tr className="bg-emerald-50 font-bold">
                                                        <td className="p-3 text-emerald-800">Total Assets</td>
                                                        <td className="p-3 text-right font-mono text-emerald-800">{fc(balanceSheet.assets.total)}</td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                    <div className="space-y-6">
                                        <div>
                                            <h3 className="text-sm font-semibold text-red-700 uppercase tracking-wider mb-3 flex items-center gap-2">
                                                <CreditCard size={16} /> Liabilities
                                            </h3>
                                            <div className="overflow-hidden rounded-lg border border-gray-200">
                                                <table className="w-full text-sm">
                                                    <thead>
                                                        <tr className="bg-red-50">
                                                            <th className="text-left p-3 font-semibold text-red-800">Item</th>
                                                            <th className="text-right p-3 font-semibold text-red-800">Amount (TZS)</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-gray-100">
                                                        {balanceSheet.liabilities.entries.map((e: any, i: number) => (
                                                            <tr key={i} className="hover:bg-gray-50">
                                                                <td className="p-3 text-gray-700">{e.name}</td>
                                                                <td className="p-3 text-right font-mono text-gray-900">{fc(e.amount)}</td>
                                                            </tr>
                                                        ))}
                                                        <tr className="bg-red-50 font-bold">
                                                            <td className="p-3 text-red-800">Total Liabilities</td>
                                                            <td className="p-3 text-right font-mono text-red-800">{fc(balanceSheet.liabilities.total)}</td>
                                                        </tr>
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-semibold text-blue-700 uppercase tracking-wider mb-3 flex items-center gap-2">
                                                <Landmark size={16} /> Equity
                                            </h3>
                                            <div className="overflow-hidden rounded-lg border border-gray-200">
                                                <table className="w-full text-sm">
                                                    <thead>
                                                        <tr className="bg-blue-50">
                                                            <th className="text-left p-3 font-semibold text-blue-800">Item</th>
                                                            <th className="text-right p-3 font-semibold text-blue-800">Amount (TZS)</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-gray-100">
                                                        {balanceSheet.equity.entries.map((e: any, i: number) => (
                                                            <tr key={i} className="hover:bg-gray-50">
                                                                <td className="p-3 text-gray-700">{e.name}</td>
                                                                <td className="p-3 text-right font-mono text-gray-900">{fc(e.amount)}</td>
                                                            </tr>
                                                        ))}
                                                        <tr className="bg-blue-50 font-bold">
                                                            <td className="p-3 text-blue-800">Total Equity</td>
                                                            <td className="p-3 text-right font-mono text-blue-800">{fc(balanceSheet.equity.total)}</td>
                                                        </tr>
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                        <div className="bg-gray-100 rounded-lg p-4 border-t-2 border-gray-300">
                                            <div className="flex justify-between font-bold text-gray-800">
                                                <span>Total Liabilities & Equity</span>
                                                <span className="font-mono">TZS {fc(balanceSheet.liabilities.total + balanceSheet.equity.total)}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Cash Flow */}
                        {reportType === 'cash-flow' && cashFlow && (
                            <div className="space-y-6">
                                {cashFlow.sections.map((sec: any, i: number) => (
                                    <div key={i}>
                                        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3">{sec.section_name}</h3>
                                        <div className="overflow-hidden rounded-lg border border-gray-200">
                                            <table className="w-full text-sm">
                                                <thead>
                                                    <tr className="bg-gray-50">
                                                        <th className="text-left p-3 font-semibold text-gray-700">Description</th>
                                                        <th className="text-right p-3 font-semibold text-gray-700">Amount (TZS)</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-100">
                                                    {sec.entries.map((e: any, j: number) => (
                                                        <tr key={j} className="hover:bg-gray-50">
                                                            <td className="p-3 text-gray-700">{e.description}</td>
                                                            <td className="p-3 text-right font-mono text-gray-900">{fc(e.amount)}</td>
                                                        </tr>
                                                    ))}
                                                    <tr className="bg-gray-50 font-bold">
                                                        <td className="p-3 text-gray-800">Net Cash from {sec.section_name}</td>
                                                        <td className="p-3 text-right font-mono text-gray-800">{fc(sec.total)}</td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                ))}

                                <div className="bg-gradient-to-r from-primary-50 to-primary-100 rounded-lg p-5 border border-primary-200 space-y-3">
                                    <div className="flex justify-between text-gray-700">
                                        <span>Net Increase in Cash</span>
                                        <span className="font-bold font-mono">TZS {fc(cashFlow.net_cash_flow)}</span>
                                    </div>
                                    <div className="flex justify-between text-gray-700">
                                        <span>Cash at Beginning of Period</span>
                                        <span className="font-mono">TZS {fc(cashFlow.opening_balance)}</span>
                                    </div>
                                    <div className="flex justify-between font-bold text-lg text-primary-800 pt-2 border-t border-primary-200">
                                        <span>Cash at End of Period</span>
                                        <span className="font-mono">TZS {fc(cashFlow.closing_balance)}</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Audit Log */}
                        {reportType === 'audit-log' && (
                            <div className="space-y-4">
                                <div className="flex flex-wrap gap-3">
                                    <div className="flex items-center gap-2">
                                        <Search size={16} className="text-gray-400" />
                                        <select
                                            value={auditActionFilter}
                                            onChange={e => setAuditActionFilter(e.target.value)}
                                            className="border border-gray-200 rounded-lg py-2 px-3 text-sm bg-white min-w-[160px] focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                        >
                                            <option value="">All Actions</option>
                                            <option value="INSERT">Create</option>
                                            <option value="UPDATE">Update</option>
                                            <option value="DELETE">Delete</option>
                                            <option value="LOGIN">Login</option>
                                        </select>
                                    </div>
                                    <select
                                        value={auditTableFilter}
                                        onChange={e => setAuditTableFilter(e.target.value)}
                                        className="border border-gray-200 rounded-lg py-2 px-3 text-sm bg-white min-w-[180px] focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
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
                                    <div className="text-center py-16">
                                        <ClipboardList size={48} className="mx-auto mb-4 text-gray-300" />
                                        <p className="text-gray-400 text-lg font-medium">No audit log entries found</p>
                                        <p className="text-gray-300 text-sm mt-1">Try adjusting the filters or date range</p>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        <div className="text-xs text-gray-400 mb-2">{auditLogs.length} entries found</div>
                                        {auditLogs.map((log: any) => {
                                            const logUser = users.find((u: any) => u.id === log.user_id);
                                            const ActionIcon = actionIcons[log.action_type] || Eye;
                                            const isExpanded = expandedLog === log.id;
                                            return (
                                                <div
                                                    key={log.id}
                                                    className={`border rounded-lg transition-all ${isExpanded ? 'border-primary-200 shadow-sm' : 'border-gray-100 hover:border-gray-200'}`}
                                                >
                                                    <button
                                                        className="w-full flex items-center gap-3 p-3 text-left"
                                                        onClick={() => setExpandedLog(isExpanded ? null : log.id)}
                                                    >
                                                        <div className={`p-1.5 rounded-lg ${actionColors[log.action_type] || 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                                                            <ActionIcon size={14} />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2">
                                                                <span className="font-medium text-sm text-gray-800">
                                                                    {logUser?.full_name || 'System'}
                                                                </span>
                                                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${actionColors[log.action_type] || 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                                                                    {log.action_type}
                                                                </span>
                                                                <span className="text-xs text-gray-400">{log.table_name?.replace(/_/g, ' ') || '-'}</span>
                                                            </div>
                                                        </div>
                                                        <div className="text-xs text-gray-400 whitespace-nowrap">
                                                            {new Date(log.created_at).toLocaleDateString()} {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </div>
                                                    </button>
                                                    {isExpanded && (
                                                        <div className="px-4 pb-3 border-t border-gray-100 pt-3 space-y-2">
                                                            <div className="grid grid-cols-2 gap-2 text-xs">
                                                                <div>
                                                                    <span className="text-gray-400">Record ID:</span>
                                                                    <span className="ml-2 font-mono text-gray-600">{log.record_id || '-'}</span>
                                                                </div>
                                                                <div>
                                                                    <span className="text-gray-400">Parish:</span>
                                                                    <span className="ml-2 text-gray-600">{log.parish_id ? parishes.find(p => p.id === log.parish_id)?.parish_name || log.parish_id.substring(0, 8) + '...' : 'All'}</span>
                                                                </div>
                                                            </div>
                                                            {log.new_values && (
                                                                <div>
                                                                    <span className="text-xs text-gray-400">New Values:</span>
                                                                    <pre className="text-xs bg-gray-50 rounded p-2 mt-1 overflow-x-auto text-gray-600">{JSON.stringify(log.new_values, null, 2)}</pre>
                                                                </div>
                                                            )}
                                                            {log.old_values && (
                                                                <div>
                                                                    <span className="text-xs text-gray-400">Old Values:</span>
                                                                    <pre className="text-xs bg-gray-50 rounded p-2 mt-1 overflow-x-auto text-gray-600">{JSON.stringify(log.old_values, null, 2)}</pre>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Empty State for no data */}
                        {!loading && !incomeExpenditure && !trialBalance && !budgetVsActual && !balanceSheet && !cashFlow && reportType !== 'audit-log' && (
                            <div className="text-center py-16">
                                <FileText size={48} className="mx-auto mb-4 text-gray-300" />
                                <p className="text-gray-400 text-lg font-medium">No data available</p>
                                <p className="text-gray-300 text-sm mt-1">Select a parish and date range to generate the report</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Reports;
