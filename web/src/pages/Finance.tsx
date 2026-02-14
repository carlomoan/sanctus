import { useState, useEffect, useMemo } from 'react';
import { api } from '../api/client';
import { Parish, IncomeTransaction, ExpenseVoucher, CreateIncomeRequest, CreateExpenseRequest, Member, UserRole } from '../types';
import { Plus, Filter, TrendingUp, TrendingDown, Calendar, FileText, Download, Printer } from 'lucide-react';
import Modal from '../components/Modal';
import IncomeForm from '../components/IncomeForm';
import ExpenseForm from '../components/ExpenseForm';
import DataTable, { Column, BulkAction } from '../components/DataTable';
import classNames from 'classnames';
import { downloadReceipt, printReceipt, ReceiptFormat } from '../utils/receiptPdf';
import { useAuth } from '../context/AuthContext';

const Finance = () => {
  const { user } = useAuth();
  const isDioceseAdmin = user?.role === UserRole.SUPER_ADMIN;
  const isViewer = user?.role === UserRole.VIEWER;
  const canCreateFinance = !isViewer;
  const userParishId = user?.parish_id;

  const [parishes, setParishes] = useState<Parish[]>([]);
  const [selectedParishId, setSelectedParishId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'income' | 'expense'>('income');

  const [incomes, setIncomes] = useState<IncomeTransaction[]>([]);
  const [expenses, setExpenses] = useState<ExpenseVoucher[]>([]);

  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [receiptFormat, setReceiptFormat] = useState<ReceiptFormat>('a4');
  const [generatingReceipt, setGeneratingReceipt] = useState<string | null>(null);

  const getSelectedParish = (): Parish | undefined => {
    return parishes.find(p => p.id === selectedParishId);
  };

  const handleDownloadReceipt = async (income: IncomeTransaction) => {
    const parish = getSelectedParish();
    if (!parish) return;
    setGeneratingReceipt(income.id);
    try {
      let member: Member | null = null;
      if (income.member_id) {
        try { member = await api.getMember(income.member_id); } catch { /* skip */ }
      }
      await downloadReceipt({ transaction: income, parish, member, format: receiptFormat });
    } catch (err) {
      console.error('Failed to generate receipt:', err);
      alert('Failed to generate receipt');
    } finally {
      setGeneratingReceipt(null);
    }
  };

  const handlePrintReceipt = async (income: IncomeTransaction) => {
    const parish = getSelectedParish();
    if (!parish) return;
    setGeneratingReceipt(income.id);
    try {
      let member: Member | null = null;
      if (income.member_id) {
        try { member = await api.getMember(income.member_id); } catch { /* skip */ }
      }
      await printReceipt({ transaction: income, parish, member, format: receiptFormat });
    } catch (err) {
      console.error('Failed to print receipt:', err);
      alert('Failed to print receipt');
    } finally {
      setGeneratingReceipt(null);
    }
  };

  const handleBulkDownloadReceipts = async (items: IncomeTransaction[]) => {
    for (const income of items) {
      await handleDownloadReceipt(income);
    }
  };

  const handleBulkPrintReceipts = async (items: IncomeTransaction[]) => {
    for (const income of items) {
      await handlePrintReceipt(income);
    }
  };

  useEffect(() => {
    const fetchParishes = async () => {
      try {
        if (!isDioceseAdmin && userParishId) {
          setSelectedParishId(userParishId);
          setParishes([]);
          return;
        }
        const data = await api.listParishes();
        setParishes(data);
        if (data.length > 0 && !selectedParishId) {
          setSelectedParishId(data[0].id);
        }
      } catch (err) {
        console.error('Failed to load parishes:', err);
      }
    };
    fetchParishes();
  }, []);

  const fetchTransactions = async () => {
    if (!selectedParishId) return;

    setLoading(true);
    try {
      const [incomeData, expenseData] = await Promise.all([
        api.listIncomeTransactions(selectedParishId),
        api.listExpenseVouchers(selectedParishId)
      ]);
      setIncomes(incomeData);
      setExpenses(expenseData);
    } catch (err) {
      console.error('Failed to load transactions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [selectedParishId]);

  const handleCreateIncome = async (data: CreateIncomeRequest) => {
    try {
      await api.createIncomeTransaction(data);
      await fetchTransactions();
      setIsModalOpen(false);
    } catch (err) {
      console.error('Failed to create income:', err);
      alert('Failed to record income');
    }
  };

  const handleCreateExpense = async (data: CreateExpenseRequest) => {
    try {
      await api.createExpenseVoucher(data);
      await fetchTransactions();
      setIsModalOpen(false);
    } catch (err) {
      console.error('Failed to create expense:', err);
      alert('Failed to create voucher');
    }
  };

  const incomeColumns: Column<IncomeTransaction>[] = useMemo(() => [
    {
      key: 'date',
      header: 'Date',
      sortable: true,
      sortKey: (i) => i.transaction_date,
      minWidth: '100px',
      render: (i) => (
        <div className="flex items-center gap-1.5 whitespace-nowrap text-gray-900">
          <Calendar size={13} className="text-gray-400 flex-shrink-0" />
          {i.transaction_date}
        </div>
      ),
    },
    {
      key: 'ref',
      header: 'Reference',
      minWidth: '120px',
      render: (i) => (
        <div className="text-gray-600">
          <span className="font-medium text-gray-800">{i.transaction_number}</span>
          {i.reference_number && <span className="block text-xs text-gray-400 truncate max-w-[140px]">{i.reference_number}</span>}
        </div>
      ),
    },
    {
      key: 'category',
      header: 'Category',
      sortable: true,
      sortKey: (i) => i.category,
      render: (i) => (
        <span className="px-2 py-0.5 text-xs font-medium bg-green-100 text-green-800 rounded-full whitespace-nowrap">
          {i.category.replace(/_/g, ' ')}
        </span>
      ),
    },
    {
      key: 'payment',
      header: 'Payment',
      render: (i) => (
        <span className="text-xs text-gray-500 whitespace-nowrap">{i.payment_method.replace(/_/g, ' ')}</span>
      ),
    },
    {
      key: 'description',
      header: 'Description',
      className: 'max-w-[200px]',
      render: (i) => (
        <span className="text-gray-700 truncate block max-w-[200px]" title={i.description || ''}>
          {i.description || '-'}
        </span>
      ),
    },
    {
      key: 'amount',
      header: 'Amount',
      sortable: true,
      sortKey: (i) => Number(i.amount),
      className: 'text-right',
      headerClassName: 'text-right',
      render: (i) => (
        <span className="font-bold text-gray-900 whitespace-nowrap">
          {Number(i.amount).toLocaleString('en-TZ', { style: 'currency', currency: 'TZS' })}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      className: 'text-center',
      headerClassName: 'text-center',
      render: (i) => (
        <div className="flex items-center justify-center gap-0.5" onClick={e => e.stopPropagation()}>
          <button
            onClick={() => handleDownloadReceipt(i)}
            disabled={generatingReceipt === i.id}
            className="p-1.5 text-primary-600 hover:bg-primary-50 rounded-md transition-colors disabled:opacity-50"
            title="Download Receipt"
          >
            <Download size={15} />
          </button>
          <button
            onClick={() => handlePrintReceipt(i)}
            disabled={generatingReceipt === i.id}
            className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-md transition-colors disabled:opacity-50"
            title="Print Receipt"
          >
            <Printer size={15} />
          </button>
        </div>
      ),
    },
  ], [generatingReceipt]);

  const expenseColumns: Column<ExpenseVoucher>[] = useMemo(() => [
    {
      key: 'date',
      header: 'Date',
      sortable: true,
      sortKey: (e) => e.expense_date,
      minWidth: '100px',
      render: (e) => (
        <div className="flex items-center gap-1.5 whitespace-nowrap text-gray-900">
          <Calendar size={13} className="text-gray-400 flex-shrink-0" />
          {e.expense_date}
        </div>
      ),
    },
    {
      key: 'voucher',
      header: 'Voucher',
      minWidth: '120px',
      render: (e) => (
        <div className="text-gray-600">
          <span className="font-medium text-gray-800">{e.voucher_number}</span>
          <div className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
            <FileText size={10} className="flex-shrink-0" />
            <span className="truncate max-w-[120px]">{e.payee_name}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'category',
      header: 'Category',
      sortable: true,
      sortKey: (e) => e.category,
      render: (e) => (
        <span className="px-2 py-0.5 text-xs font-medium bg-red-100 text-red-800 rounded-full whitespace-nowrap">
          {e.category.replace(/_/g, ' ')}
        </span>
      ),
    },
    {
      key: 'payment',
      header: 'Payment',
      render: (e) => (
        <span className="text-xs text-gray-500 whitespace-nowrap">{e.payment_method.replace(/_/g, ' ')}</span>
      ),
    },
    {
      key: 'description',
      header: 'Description',
      className: 'max-w-[200px]',
      render: (e) => (
        <span className="text-gray-700 truncate block max-w-[200px]" title={e.description}>
          {e.description}
        </span>
      ),
    },
    {
      key: 'amount',
      header: 'Amount',
      sortable: true,
      sortKey: (e) => Number(e.amount),
      className: 'text-right',
      headerClassName: 'text-right',
      render: (e) => (
        <span className="font-bold text-gray-900 whitespace-nowrap">
          {Number(e.amount).toLocaleString('en-TZ', { style: 'currency', currency: 'TZS' })}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (e) => (
        <span className={`px-2 py-0.5 text-xs font-medium rounded-full whitespace-nowrap ${e.approval_status === 'APPROVED' ? 'bg-green-100 text-green-700' :
            e.approval_status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
              'bg-gray-100 text-gray-600'
          }`}>
          {e.approval_status || 'N/A'}
        </span>
      ),
    },
  ], []);

  const incomeBulkActions: BulkAction<IncomeTransaction>[] = [
    { label: 'Download Receipts', icon: <Download size={14} />, onClick: handleBulkDownloadReceipts },
    { label: 'Print Receipts', icon: <Printer size={14} />, onClick: handleBulkPrintReceipts },
  ];

  const expenseBulkActions: BulkAction<ExpenseVoucher>[] = [
    { label: 'Export Selected', icon: <Download size={14} />, onClick: () => { } },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Finance</h1>
        {canCreateFinance && (
          <button
            onClick={() => setIsModalOpen(true)}
            disabled={!selectedParishId}
            className={classNames(
              "text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
              activeTab === 'income' ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"
            )}
          >
            <Plus size={20} />
            {activeTab === 'income' ? 'Record Income' : 'Create Voucher'}
          </button>
        )}
      </div>

      {/* Filters and Tabs */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white p-4 rounded-lg shadow-sm border border-gray-100">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('income')}
            className={classNames(
              "px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2",
              activeTab === 'income'
                ? "bg-green-50 text-green-700 border border-green-200"
                : "text-gray-600 hover:bg-gray-50"
            )}
          >
            <TrendingUp size={18} />
            Income
          </button>
          <button
            onClick={() => setActiveTab('expense')}
            className={classNames(
              "px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2",
              activeTab === 'expense'
                ? "bg-red-50 text-red-700 border border-red-200"
                : "text-gray-600 hover:bg-gray-50"
            )}
          >
            <TrendingDown size={18} />
            Expenses
          </button>
        </div>

        <div className="flex items-center gap-4 w-full md:w-auto">
          {isDioceseAdmin && parishes.length > 0 && (
            <div className="flex items-center gap-2">
              <Filter size={20} className="text-gray-400" />
              <select
                value={selectedParishId}
                onChange={(e) => setSelectedParishId(e.target.value)}
                className="border border-gray-200 rounded-lg py-2 px-4 focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white w-full md:w-64"
              >
                <option value="" disabled>Select Parish</option>
                {parishes.map(parish => (
                  <option key={parish.id} value={parish.id}>{parish.parish_name}</option>
                ))}
              </select>
            </div>
          )}
          {activeTab === 'income' && (
            <div className="flex items-center gap-2">
              <Printer size={16} className="text-gray-400" />
              <select
                value={receiptFormat}
                onChange={(e) => setReceiptFormat(e.target.value as ReceiptFormat)}
                className="border border-gray-200 rounded-lg py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
              >
                <option value="a4">A4 Paper</option>
                <option value="thermal-80">Thermal 80mm</option>
                <option value="thermal-58">Thermal 58mm</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Transactions List */}
      {!selectedParishId ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-100">
          <p className="text-gray-500">Please select a parish to view finances.</p>
        </div>
      ) : loading ? (
        <div className="text-center py-12 text-gray-500">Loading transactions...</div>
      ) : activeTab === 'income' ? (
        <DataTable<IncomeTransaction>
          data={incomes}
          columns={incomeColumns}
          keyField="id"
          bulkActions={incomeBulkActions}
          emptyIcon={<TrendingUp size={24} />}
          emptyTitle="No income records found"
          emptyMessage="Record your first income transaction to get started."
        />
      ) : (
        <DataTable<ExpenseVoucher>
          data={expenses}
          columns={expenseColumns}
          keyField="id"
          bulkActions={expenseBulkActions}
          emptyIcon={<TrendingDown size={24} />}
          emptyTitle="No expense vouchers found"
          emptyMessage="Create your first expense voucher to get started."
        />
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={activeTab === 'income' ? 'Record Income' : 'Create Expense Voucher'}
      >
        {activeTab === 'income' ? (
          <IncomeForm
            onSubmit={handleCreateIncome}
            onCancel={() => setIsModalOpen(false)}
            parishId={selectedParishId}
          />
        ) : (
          <ExpenseForm
            onSubmit={handleCreateExpense}
            onCancel={() => setIsModalOpen(false)}
            parishId={selectedParishId}
          />
        )}
      </Modal>
    </div>
  );
};

export default Finance;
