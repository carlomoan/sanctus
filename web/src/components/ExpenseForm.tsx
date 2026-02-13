import { useForm } from 'react-hook-form';
import { CreateExpenseRequest, TransactionCategory, PaymentMethod } from '../types';

interface ExpenseFormProps {
  onSubmit: (data: CreateExpenseRequest) => Promise<void>;
  onCancel: () => void;
  parishId: string;
}

const ExpenseForm = ({ onSubmit, onCancel, parishId }: ExpenseFormProps) => {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<CreateExpenseRequest>({
    defaultValues: {
      parish_id: parishId,
      amount: 0,
      payment_method: PaymentMethod.CASH,
      expense_date: new Date().toISOString().split('T')[0],
      category: TransactionCategory.SALARY_EXPENSE,
    }
  });

  const expenseCategories = [
    TransactionCategory.SALARY_EXPENSE,
    TransactionCategory.UTILITIES_EXPENSE,
    TransactionCategory.MAINTENANCE_EXPENSE,
    TransactionCategory.SUPPLIES_EXPENSE,
    TransactionCategory.DIOCESAN_LEVY,
    TransactionCategory.CHARITY_EXPENSE,
    TransactionCategory.CONSTRUCTION_EXPENSE,
    TransactionCategory.OTHER_EXPENSE,
  ];

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Category</label>
          <select
            {...register('category', { required: 'Category is required' })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm border p-2"
          >
            {expenseCategories.map((cat) => (
              <option key={cat} value={cat}>{cat.replace('_', ' ')}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Amount</label>
          <input
            type="number"
            step="0.01"
            {...register('amount', { required: 'Amount is required', min: 0 })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm border p-2"
          />
          {errors.amount && <p className="text-red-500 text-xs mt-1">{errors.amount.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Date</label>
          <input
            type="date"
            {...register('expense_date', { required: 'Date is required' })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm border p-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Payment Method</label>
          <select
            {...register('payment_method', { required: 'Payment Method is required' })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm border p-2"
          >
            {Object.values(PaymentMethod).map((method) => (
              <option key={method} value={method}>{method.replace('_', ' ')}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Payee Name</label>
          <input
            {...register('payee_name', { required: 'Payee Name is required' })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm border p-2"
          />
          {errors.payee_name && <p className="text-red-500 text-xs mt-1">{errors.payee_name.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Payee Phone</label>
          <input
            {...register('payee_phone')}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm border p-2"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Description</label>
        <textarea
          {...register('description', { required: 'Description is required' })}
          rows={2}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm border p-2"
        />
        {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description.message}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Reference Number</label>
        <input
          {...register('reference_number')}
          placeholder="e.g. Invoice number, Receipt #"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm border p-2"
        />
      </div>

      <input type="hidden" {...register('parish_id')} />

      <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
        >
          {isSubmitting ? 'Saving...' : 'Create Voucher'}
        </button>
      </div>
    </form>
  );
};

export default ExpenseForm;
