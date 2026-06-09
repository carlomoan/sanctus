import { useForm } from 'react-hook-form';
import { CreateMemberRequest, Member, UpdateMemberRequest, GenderType, MaritalStatus, Family, Scc, FamilyRole } from '../types';
import { useEffect, useState } from 'react';
import { api } from '../api/client';

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
      family_id: '',
      scc_id: '',
      member_code: '',
      first_name: '',
      last_name: '',
      gender: GenderType.MALE,
      marital_status: MaritalStatus.SINGLE,
      // Other defaults...
    }
  });

  const [families, setFamilies] = useState<Family[]>([]);
  const [sccs, setSccs] = useState<Scc[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [fams, sccList] = await Promise.all([
          api.listFamilies(parishId),
          api.listSccs(parishId),
        ]);
        setFamilies(fams);
        setSccs(sccList);
      } catch (err) {
        console.error('Failed to load form data:', err);
      }
    };
    fetchData();
  }, [parishId]);

  useEffect(() => {
    if (initialData) {
      reset({
        parish_id: initialData.parish_id,
        family_id: initialData.family_id || '',
        scc_id: initialData.scc_id || '',
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
        family_role: initialData.family_role || FamilyRole.MEMBER,
      });
    }
  }, [initialData, reset]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div>
          <label className="block text-sm font-medium text-secondary-700 mb-1">First Name</label>
          <input
            {...register('first_name', { required: 'First Name is required' })}
            className="mt-1 block w-full rounded-lg border-sidebar-border shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent sm:text-sm border p-2.5 transition-all duration-200"
          />
          {errors.first_name && <p className="text-danger text-xs mt-1">{errors.first_name.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-secondary-700 mb-1">Middle Name</label>
          <input
            {...register('middle_name')}
            className="mt-1 block w-full rounded-lg border-sidebar-border shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent sm:text-sm border p-2.5 transition-all duration-200"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-secondary-700 mb-1">Last Name</label>
          <input
            {...register('last_name', { required: 'Last Name is required' })}
            className="mt-1 block w-full rounded-lg border-sidebar-border shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent sm:text-sm border p-2.5 transition-all duration-200"
          />
          {errors.last_name && <p className="text-danger text-xs mt-1">{errors.last_name.message}</p>}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-secondary-700 mb-1">Member Code</label>
        <input
          {...register('member_code', { required: 'Member Code is required' })}
          disabled={!!initialData}
          className="mt-1 block w-full rounded-lg border-sidebar-border shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent sm:text-sm border p-2.5 disabled:bg-background-light disabled:cursor-not-allowed transition-all duration-200"
        />
        {errors.member_code && <p className="text-danger text-xs mt-1">{errors.member_code.message}</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label className="block text-sm font-medium text-secondary-700 mb-1">Family (Optional)</label>
          <select
            {...register('family_id', {
              setValueAs: v => v === "" ? undefined : v
            })}
            className="mt-1 block w-full rounded-lg border-sidebar-border shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent sm:text-sm border p-2.5 transition-all duration-200"
          >
            <option value="">Select Family</option>
            {families.map(f => (
              <option key={f.id} value={f.id}>{f.family_name} ({f.family_code})</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-secondary-700 mb-1">SCC (Optional)</label>
          <select
            {...register('scc_id', {
              setValueAs: v => v === "" ? undefined : v
            })}
            className="mt-1 block w-full rounded-lg border-sidebar-border shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent sm:text-sm border p-2.5 transition-all duration-200"
          >
            <option value="">Select SCC</option>
            {sccs.map(s => (
              <option key={s.id} value={s.id}>{s.scc_name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div>
          <label className="block text-sm font-medium text-secondary-700 mb-1">Date of Birth</label>
          <input
            type="date"
            {...register('date_of_birth')}
            className="mt-1 block w-full rounded-lg border-sidebar-border shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent sm:text-sm border p-2.5 transition-all duration-200"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-secondary-700 mb-1">Gender</label>
          <select
            {...register('gender')}
            className="mt-1 block w-full rounded-lg border-sidebar-border shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent sm:text-sm border p-2.5 transition-all duration-200"
          >
            {Object.values(GenderType).map((gender) => (
              <option key={gender} value={gender}>{gender}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-secondary-700 mb-1">Marital Status</label>
          <select
            {...register('marital_status')}
            className="mt-1 block w-full rounded-lg border-sidebar-border shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent sm:text-sm border p-2.5 transition-all duration-200"
          >
            {Object.values(MaritalStatus).map((status) => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label className="block text-sm font-medium text-secondary-700 mb-1">Phone</label>
          <input
            {...register('phone_number')}
            className="mt-1 block w-full rounded-lg border-sidebar-border shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent sm:text-sm border p-2.5 transition-all duration-200"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-secondary-700 mb-1">Email</label>
          <input
            {...register('email', { pattern: { value: /^\S+@\S+$/i, message: "Invalid email" } })}
            className="mt-1 block w-full rounded-lg border-sidebar-border shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent sm:text-sm border p-2.5 transition-all duration-200"
          />
          {errors.email && <p className="text-danger text-xs mt-1">{errors.email.message}</p>}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-secondary-700 mb-1">Physical Address</label>
        <textarea
          {...register('physical_address')}
          rows={2}
          className="mt-1 block w-full rounded-lg border-sidebar-border shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent sm:text-sm border p-2.5 transition-all duration-200"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-secondary-700 mb-1">Family Role</label>
        <select
          {...register('family_role')}
          defaultValue={FamilyRole.MEMBER}
          className="mt-1 block w-full rounded-lg border-sidebar-border shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent sm:text-sm border p-2.5 transition-all duration-200"
        >
          {Object.values(FamilyRole).map((role) => (
            <option key={role} value={role}>{role}</option>
          ))}
        </select>
      </div>

      <input type="hidden" {...register('parish_id')} />

      <div className="flex justify-end gap-3 pt-4 border-t border-sidebar-border">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-sidebar-border rounded-lg text-sm font-medium text-secondary-700 hover:bg-background-light focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all duration-200"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-4 py-2.5 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 transition-all duration-200"
        >
          {isSubmitting ? 'Saving...' : (initialData ? 'Update Member' : 'Create Member')}
        </button>
      </div>
    </form>
  );
};

export default MemberForm;
