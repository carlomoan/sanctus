import { useForm } from 'react-hook-form';
import { CreateIncomeRequest, TransactionCategory, PaymentMethod, Member, Family } from '../types';
import { useEffect, useState } from 'react';
import { api } from '../api/client';

interface IncomeFormProps {
  onSubmit: (data: CreateIncomeRequest) => Promise<void>;
  onCancel: () => void;
  parishId: string;
}

const IncomeForm = ({ onSubmit, onCancel, parishId }: IncomeFormProps) => {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<CreateIncomeRequest>({
    defaultValues: {
      parish_id: parishId,
      amount: 0,
      payment_method: PaymentMethod.CASH,
      transaction_date: new Date().toISOString().split('T')[0],
      category: TransactionCategory.TITHE,
    }
  });

  const [members, setMembers] = useState<Member[]>([]);
  const [families, setFamilies] = useState<Family[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [mems, fams] = await Promise.all([
          api.listMembers(parishId),
          api.listFamilies(parishId),
        ]);
        setMembers(mems);
        setFamilies(fams);
      } catch (err) {
        console.error('Failed to load data:', err);
      }
    };
    fetchData();
  }, [parishId]);

  const incomeCategories = [
    TransactionCategory.TITHE,
    TransactionCategory.OFFERTORY,
    TransactionCategory.THANKSGIVING,
    TransactionCategory.DONATION,
    TransactionCategory.FUNDRAISING,
    TransactionCategory.MASS_OFFERING,
    TransactionCategory.WEDDING_FEE,
    TransactionCategory.BAPTISM_FEE,
    TransactionCategory.FUNERAL_FEE,
    TransactionCategory.CERTIFICATE_FEE,
    TransactionCategory.RENT_INCOME,
    TransactionCategory.INVESTMENT_INCOME,
    TransactionCategory.OTHER_INCOME,
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
            {incomeCategories.map((cat) => (
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
            {...register('transaction_date', { required: 'Date is required' })}
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
          <label className="block text-sm font-medium text-gray-700">Member (Optional)</label>
          <select
            {...register('member_id')}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm border p-2"
          >
            <option value="">Select Member</option>
            {members.map((member) => (
              <option key={member.id} value={member.id}>
                {member.first_name} {member.last_name} ({member.member_code})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Family (Optional)</label>
          <select
            {...register('family_id')}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm border p-2"
          >
            <option value="">Select Family</option>
            {families.map((fam) => (
              <option key={fam.id} value={fam.id}>
                {fam.family_name} ({fam.family_code})
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Description</label>
        <textarea
          {...register('description')}
          rows={2}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm border p-2"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Reference Number</label>
        <input
          {...register('reference_number')}
          placeholder="e.g. Check number, M-Pesa code"
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
          {isSubmitting ? 'Saving...' : 'Record Income'}
        </button>
      </div>
    </form>
  );
};

export default IncomeForm;
