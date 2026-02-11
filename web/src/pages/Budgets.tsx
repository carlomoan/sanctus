import { useState, useEffect } from 'react';
import { api } from '../api/client';
import { Budget, Parish } from '../types';
import { Plus, Filter, Calendar, Target, Edit, Trash2 } from 'lucide-react';
import Modal from '../components/Modal';
import BudgetForm from '../components/BudgetForm';
import { useAuth } from '../context/AuthContext';

const Budgets = () => {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [parishes, setParishes] = useState<Parish[]>([]);
  const [selectedParishId, setSelectedParishId] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
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

  const fetchBudgets = async () => {
    if (!selectedParishId) return;
    setLoading(true);
    try {
      const data = await api.listBudgets(selectedParishId, selectedYear);
      setBudgets(data);
    } catch (err) {
      console.error('Failed to load budgets:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchParishes();
  }, []);

  useEffect(() => {
    fetchBudgets();
  }, [selectedParishId, selectedYear]);

  const handleCreateBudget = async (data: any) => {
    try {
      await api.createBudget(data);
      await fetchBudgets();
      setIsModalOpen(false);
    } catch (err) {
      console.error('Failed to create budget:', err);
      alert('Failed to create budget');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Budget Management</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          disabled={!selectedParishId}
          className="bg-primary-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-primary-700 transition-colors disabled:opacity-50"
        >
          <Plus size={20} />
          Set Budget
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-4 bg-white p-4 rounded-lg shadow-sm border border-gray-100 items-center justify-between">
        <div className="flex items-center gap-4 w-full md:w-auto">
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
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="border border-gray-200 rounded-lg py-2 px-4 focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
            >
              {[selectedYear - 1, selectedYear, selectedYear + 1].map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading budgets...</div>
      ) : budgets.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-100">
          <Target className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-lg font-medium text-gray-900">No budgets set</h3>
          <p className="mt-1 text-sm text-gray-500">Plan your finances by setting a budget for this year.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Period</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Budgeted Amount</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {budgets.map((budget) => (
                <tr key={budget.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                      {budget.category.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {budget.fiscal_month
                      ? `${new Date(0, budget.fiscal_month - 1).toLocaleString('default', { month: 'long' })} ${budget.fiscal_year}`
                      : `Full Year ${budget.fiscal_year}`}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold text-gray-900">
                    {Number(budget.amount).toLocaleString('en-TZ', { style: 'currency', currency: 'TZS' })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button className="text-gray-400 hover:text-primary-600 mr-3">
                      <Edit size={18} />
                    </button>
                    <button className="text-gray-400 hover:text-red-600">
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Set Budget"
      >
        <BudgetForm
          onSubmit={handleCreateBudget}
          onCancel={() => setIsModalOpen(false)}
          parishId={selectedParishId}
        />
      </Modal>
    </div>
  );
};

export default Budgets;
