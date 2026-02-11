import { useState, useEffect } from 'react';
import { api } from '../api/client';
import { Parish, IncomeTransaction, ExpenseVoucher, CreateIncomeRequest, CreateExpenseRequest } from '../types';
import { Plus, Filter, TrendingUp, TrendingDown, Calendar, FileText } from 'lucide-react';
import Modal from '../components/Modal';
import IncomeForm from '../components/IncomeForm';
import ExpenseForm from '../components/ExpenseForm';
import classNames from 'classnames';

const Finance = () => {
  const [parishes, setParishes] = useState<Parish[]>([]);
  const [selectedParishId, setSelectedParishId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'income' | 'expense'>('income');

  const [incomes, setIncomes] = useState<IncomeTransaction[]>([]);
  const [expenses, setExpenses] = useState<ExpenseVoucher[]>([]);

  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const fetchParishes = async () => {
      try {
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Finance</h1>
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

        <div className="flex items-center gap-2 w-full md:w-auto">
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
      </div>

      {/* Transactions List */}
      {!selectedParishId ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-100">
          <p className="text-gray-500">Please select a parish to view finances.</p>
        </div>
      ) : loading ? (
        <div className="text-center py-12 text-gray-500">Loading transactions...</div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reference</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {activeTab === 'income' ? (
                incomes.length === 0 ? (
                  <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-500">No income records found</td></tr>
                ) : (
                  incomes.map((income) => (
                    <tr key={income.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex items-center gap-2">
                          <Calendar size={14} className="text-gray-400" />
                          {income.transaction_date}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {income.transaction_number}
                        {income.reference_number && <span className="block text-xs text-gray-400">{income.reference_number}</span>}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                          {income.category.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                        {income.description || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold text-gray-900">
                        {Number(income.amount).toLocaleString('en-TZ', { style: 'currency', currency: 'TZS' })}
                      </td>
                    </tr>
                  ))
                )
              ) : (
                expenses.length === 0 ? (
                  <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-500">No expense vouchers found</td></tr>
                ) : (
                  expenses.map((expense) => (
                    <tr key={expense.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex items-center gap-2">
                          <Calendar size={14} className="text-gray-400" />
                          {expense.expense_date}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {expense.voucher_number}
                        <div className="flex items-center gap-1 text-xs text-gray-400 mt-1">
                          <FileText size={10} />
                          {expense.payee_name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">
                          {expense.category.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                        {expense.description}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold text-gray-900">
                        {Number(expense.amount).toLocaleString('en-TZ', { style: 'currency', currency: 'TZS' })}
                      </td>
                    </tr>
                  ))
                )
              )}
            </tbody>
          </table>
        </div>
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
