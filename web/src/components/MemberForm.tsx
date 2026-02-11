import { useForm } from 'react-hook-form';
import { CreateMemberRequest, Member, UpdateMemberRequest, GenderType, MaritalStatus } from '../types';
import { useEffect } from 'react';

interface MemberFormProps {
  initialData?: Member;
  onSubmit: (data: CreateMemberRequest | UpdateMemberRequest) => Promise<void>;
  onCancel: () => void;
  parishId: string; // Required for creating new members
}

const MemberForm = ({ initialData, onSubmit, onCancel, parishId }: MemberFormProps) => {
  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<CreateMemberRequest>({
    defaultValues: {
      parish_id: parishId,
      member_code: '',
      first_name: '',
      last_name: '',
      gender: GenderType.MALE,
      marital_status: MaritalStatus.SINGLE,
      // Other defaults...
    }
  });

  useEffect(() => {
    if (initialData) {
      reset({
        parish_id: initialData.parish_id,
        member_code: initialData.member_code,
        first_name: initialData.first_name,
        middle_name: initialData.middle_name || '',
        last_name: initialData.last_name,
        date_of_birth: initialData.date_of_birth || '',
        gender: initialData.gender,
        marital_status: initialData.marital_status,
        national_id: initialData.national_id || '',
        occupation: initialData.occupation || '',
        email: initialData.email || '',
        phone_number: initialData.phone_number || '',
        physical_address: initialData.physical_address || '',
        is_head_of_family: initialData.is_head_of_family || false,
      });
    }
  }, [initialData, reset]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">First Name</label>
          <input
            {...register('first_name', { required: 'First Name is required' })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm border p-2"
          />
          {errors.first_name && <p className="text-red-500 text-xs mt-1">{errors.first_name.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Middle Name</label>
          <input
            {...register('middle_name')}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm border p-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Last Name</label>
          <input
            {...register('last_name', { required: 'Last Name is required' })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm border p-2"
          />
          {errors.last_name && <p className="text-red-500 text-xs mt-1">{errors.last_name.message}</p>}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Member Code</label>
        <input
          {...register('member_code', { required: 'Member Code is required' })}
          disabled={!!initialData}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm border p-2 disabled:bg-gray-100"
        />
        {errors.member_code && <p className="text-red-500 text-xs mt-1">{errors.member_code.message}</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Date of Birth</label>
          <input
            type="date"
            {...register('date_of_birth')}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm border p-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Gender</label>
          <select
            {...register('gender')}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm border p-2"
          >
            {Object.values(GenderType).map((gender) => (
              <option key={gender} value={gender}>{gender}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Marital Status</label>
          <select
            {...register('marital_status')}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm border p-2"
          >
            {Object.values(MaritalStatus).map((status) => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Phone</label>
          <input
            {...register('phone_number')}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm border p-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Email</label>
          <input
            {...register('email', { pattern: { value: /^\S+@\S+$/i, message: "Invalid email" } })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm border p-2"
          />
          {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Physical Address</label>
        <textarea
          {...register('physical_address')}
          rows={2}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm border p-2"
        />
      </div>

      <div className="flex items-center">
        <input
          id="is_head_of_family"
          type="checkbox"
          {...register('is_head_of_family')}
          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
        />
        <label htmlFor="is_head_of_family" className="ml-2 block text-sm text-gray-900">
          Is Head of Family
        </label>
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
          {isSubmitting ? 'Saving...' : (initialData ? 'Update Member' : 'Create Member')}
        </button>
      </div>
    </form>
  );
};

export default MemberForm;
