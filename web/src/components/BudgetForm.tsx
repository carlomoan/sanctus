import { useState } from 'react';
import { TransactionCategory, CreateBudgetRequest } from '../types';

interface BudgetFormProps {
  onSubmit: (data: CreateBudgetRequest) => Promise<void>;
  onCancel: () => void;
  parishId: string;
}

const BudgetForm = ({ onSubmit, onCancel, parishId }: BudgetFormProps) => {
  const [formData, setFormData] = useState<CreateBudgetRequest>({
    parish_id: parishId,
    category: TransactionCategory.TITHE,
    amount: 0,
    fiscal_year: new Date().getFullYear(),
    fiscal_month: undefined,
    description: '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit(formData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Category</label>
          <select
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value as TransactionCategory })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
          >
            {Object.values(TransactionCategory).map((cat) => (
              <option key={cat} value={cat}>{cat.replace(/_/g, ' ')}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Amount</label>
          <input
            type="number"
            required
            min="0"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Fiscal Year</label>
          <input
            type="number"
            required
            value={formData.fiscal_year}
            onChange={(e) => setFormData({ ...formData, fiscal_year: parseInt(e.target.value) })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Fiscal Month (Optional)</label>
          <select
            value={formData.fiscal_month || ''}
            onChange={(e) => setFormData({ ...formData, fiscal_month: e.target.value ? parseInt(e.target.value) : undefined })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
          >
            <option value="">Annual (Full Year)</option>
            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
              <option key={m} value={m}>{new Date(0, m - 1).toLocaleString('default', { month: 'long' })}</option>
            ))}
          </select>
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700">Description</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
            rows={3}
          />
        </div>
      </div>

      <div className="mt-5 sm:mt-6 flex gap-3 justify-end">
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:text-sm"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:text-sm disabled:opacity-50"
        >
          {loading ? 'Saving...' : 'Save Budget'}
        </button>
      </div>
    </form>
  );
};

export default BudgetForm;
