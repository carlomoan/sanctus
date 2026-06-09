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
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label className="block text-sm font-medium text-secondary-700 mb-1">Category</label>
          <select
            {...register('category', { required: 'Category is required' })}
            className="mt-1 block w-full rounded-lg border-sidebar-border shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent sm:text-sm border p-2.5 transition-all duration-200"
          >
            {expenseCategories.map((cat) => (
              <option key={cat} value={cat}>{cat.replace('_', ' ')}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-secondary-700 mb-1">Amount</label>
          <input
            type="number"
            step="0.01"
            {...register('amount', { required: 'Amount is required', min: 0 })}
            className="mt-1 block w-full rounded-lg border-sidebar-border shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent sm:text-sm border p-2.5 transition-all duration-200"
          />
          {errors.amount && <p className="text-danger text-xs mt-1">{errors.amount.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label className="block text-sm font-medium text-secondary-700 mb-1">Date</label>
          <input
            type="date"
            {...register('expense_date', { required: 'Date is required' })}
            className="mt-1 block w-full rounded-lg border-sidebar-border shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent sm:text-sm border p-2.5 transition-all duration-200"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-secondary-700 mb-1">Payment Method</label>
          <select
            {...register('payment_method', { required: 'Payment Method is required' })}
            className="mt-1 block w-full rounded-lg border-sidebar-border shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent sm:text-sm border p-2.5 transition-all duration-200"
          >
            {Object.values(PaymentMethod).map((method) => (
              <option key={method} value={method}>{method.replace('_', ' ')}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label className="block text-sm font-medium text-secondary-700 mb-1">Payee Name</label>
          <input
            {...register('payee_name', { required: 'Payee Name is required' })}
            className="mt-1 block w-full rounded-lg border-sidebar-border shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent sm:text-sm border p-2.5 transition-all duration-200"
          />
          {errors.payee_name && <p className="text-danger text-xs mt-1">{errors.payee_name.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-secondary-700 mb-1">Payee Phone</label>
          <input
            {...register('payee_phone')}
            className="mt-1 block w-full rounded-lg border-sidebar-border shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent sm:text-sm border p-2.5 transition-all duration-200"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-secondary-700 mb-1">Description</label>
        <textarea
          {...register('description', { required: 'Description is required' })}
          rows={2}
          className="mt-1 block w-full rounded-lg border-sidebar-border shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent sm:text-sm border p-2.5 transition-all duration-200"
        />
        {errors.description && <p className="text-danger text-xs mt-1">{errors.description.message}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-secondary-700 mb-1">Reference Number</label>
        <input
          {...register('reference_number')}
          placeholder="e.g. Invoice number, Receipt #"
          className="mt-1 block w-full rounded-lg border-sidebar-border shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent sm:text-sm border p-2.5 transition-all duration-200"
        />
      </div>

      <input type="hidden" {...register('parish_id')} />

      <div className="flex justify-end gap-3 pt-4 border-t border-sidebar-border">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2.5 border border-sidebar-border rounded-lg text-sm font-medium text-secondary-700 hover:bg-background-light focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all duration-200"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-4 py-2.5 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 transition-all duration-200"
        >
          {isSubmitting ? 'Saving...' : 'Create Voucher'}
        </button>
      </div>
    </form>
  );
};

export default ExpenseForm;
