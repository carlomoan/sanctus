import { useForm } from 'react-hook-form';
import { CreateSacramentRequest, SacramentType, Member, SacramentRecord } from '../types';
import { useEffect, useState } from 'react';
import { api } from '../api/client';

interface SacramentFormProps {
  initialData?: SacramentRecord;
  onSubmit: (data: CreateSacramentRequest) => Promise<void>;
  onCancel: () => void;
  parishId: string;
}

const SacramentForm = ({ initialData, onSubmit, onCancel, parishId }: SacramentFormProps) => {
  const { register, handleSubmit, formState: { errors, isSubmitting }, watch } = useForm<CreateSacramentRequest>({
    defaultValues: {
      parish_id: parishId,
      sacrament_type: SacramentType.BAPTISM,
      sacrament_date: new Date().toISOString().split('T')[0],
    }
  });

  const [members, setMembers] = useState<Member[]>([]);
  const selectedSacramentType = watch('sacrament_type');

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const data = await api.listMembers(parishId);
        setMembers(data);
      } catch (err) {
        console.error('Failed to load members:', err);
      }
    };
    fetchMembers();
  }, [parishId]);

  useEffect(() => {
    // Reset or set initial values if editing (not fully implemented for edit mode in this snippet for brevity, 
    // but structure supports it)
  }, [initialData]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label className="block text-sm font-medium text-secondary-700 mb-1">Member</label>
          <select
            {...register('member_id', { required: 'Member is required' })}
            className="mt-1 block w-full rounded-lg border-sidebar-border shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent sm:text-sm border p-2.5 transition-all duration-200"
            disabled={!!initialData}
          >
            <option value="">Select Member</option>
            {members.map((member) => (
              <option key={member.id} value={member.id}>
                {member.first_name} {member.last_name} ({member.member_code})
              </option>
            ))}
          </select>
          {errors.member_id && <p className="text-danger text-xs mt-1">{errors.member_id.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-secondary-700 mb-1">Sacrament Type</label>
          <select
            {...register('sacrament_type', { required: 'Type is required' })}
            className="mt-1 block w-full rounded-lg border-sidebar-border shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent sm:text-sm border p-2.5 transition-all duration-200"
            disabled={!!initialData}
          >
            {Object.values(SacramentType).map((type) => (
              <option key={type} value={type}>{type.replace(/_/g, ' ')}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label className="block text-sm font-medium text-secondary-700 mb-1">Date</label>
          <input
            type="date"
            {...register('sacrament_date', { required: 'Date is required' })}
            className="mt-1 block w-full rounded-lg border-sidebar-border shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent sm:text-sm border p-2.5 transition-all duration-200"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-secondary-700 mb-1">Officiating Minister</label>
          <input
            {...register('officiating_minister')}
            placeholder="Priest Name"
            className="mt-1 block w-full rounded-lg border-sidebar-border shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent sm:text-sm border p-2.5 transition-all duration-200"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label className="block text-sm font-medium text-secondary-700 mb-1">Church Name</label>
          <input
            {...register('church_name')}
            placeholder="e.g. St. Mary's"
            className="mt-1 block w-full rounded-lg border-sidebar-border shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent sm:text-sm border p-2.5 transition-all duration-200"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-secondary-700 mb-1">Certificate Number</label>
          <input
            {...register('certificate_number')}
            className="mt-1 block w-full rounded-lg border-sidebar-border shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent sm:text-sm border p-2.5 transition-all duration-200"
          />
        </div>
      </div>

      {(selectedSacramentType === SacramentType.BAPTISM || selectedSacramentType === SacramentType.CONFIRMATION) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-1">Godparent 1</label>
            <input
              {...register('godparent_1_name')}
              className="mt-1 block w-full rounded-lg border-sidebar-border shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent sm:text-sm border p-2.5 transition-all duration-200"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-1">Godparent 2</label>
            <input
              {...register('godparent_2_name')}
              className="mt-1 block w-full rounded-lg border-sidebar-border shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent sm:text-sm border p-2.5 transition-all duration-200"
            />
          </div>
        </div>
      )}

      {selectedSacramentType === SacramentType.MARRIAGE && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">Spouse Name</label>
              <input
                {...register('spouse_name')}
                className="mt-1 block w-full rounded-lg border-sidebar-border shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent sm:text-sm border p-2.5 transition-all duration-200"
              />
            </div>
            {/* Could add spouse_id selection if spouse is a member */}
          </div>
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-1">Witnesses</label>
            <textarea
              {...register('witnesses')}
              rows={2}
              className="mt-1 block w-full rounded-lg border-sidebar-border shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent sm:text-sm border p-2.5 transition-all duration-200"
            />
          </div>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-secondary-700 mb-1">Notes</label>
        <textarea
          {...register('notes')}
          rows={2}
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
          {isSubmitting ? 'Saving...' : 'Record Sacrament'}
        </button>
      </div>
    </form>
  );
};

export default SacramentForm;
