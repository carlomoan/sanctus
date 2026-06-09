import { useForm } from 'react-hook-form';
import { CreateParishRequest, Parish, UpdateParishRequest, Member, SacramentRecord, SacramentType, Diocese } from '../types';
import { useEffect, useState } from 'react';
import { api } from '../api/client';

interface ParishFormProps {
  initialData?: Parish;
  onSubmit: (data: CreateParishRequest | UpdateParishRequest) => Promise<void>;
  onCancel: () => void;
  dioceses: Diocese[];
}

const ParishForm = ({ initialData, onSubmit, onCancel, dioceses }: ParishFormProps) => {
  const { register, handleSubmit, formState: { errors, isSubmitting }, reset, setValue } = useForm<CreateParishRequest>({
    defaultValues: { parish_name: '', parish_code: '', diocese_id: '' }
  });

  const [ordainedMembers, setOrdainedMembers] = useState<Member[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        // Only load members and sacraments, dioceses are passed as props
        const [members, sacraments] = await Promise.all([
          api.listMembers(),
          api.listSacraments(),
        ]);
        const ordainedIds = new Set(
          sacraments.filter((s: SacramentRecord) => s.sacrament_type === SacramentType.HOLY_ORDERS).map((s: SacramentRecord) => s.member_id)
        );
        setOrdainedMembers(members.filter((m: Member) => ordainedIds.has(m.id)));
      } catch (err) { console.error('Failed to load form data:', err); }
    };
    load();
  }, [initialData, setValue]);

  // Set default diocese when dioceses are available and not editing
  useEffect(() => {
    if (dioceses.length > 0 && !initialData) {
      setValue('diocese_id', dioceses[0].id);
    }
  }, [dioceses, initialData, setValue]);

  useEffect(() => {
    if (initialData) {
      reset({
        parish_name: initialData.parish_name,
        parish_code: initialData.parish_code,
        diocese_id: initialData.diocese_id,
        patron_saint: initialData.patron_saint || '',
        priest_name: initialData.priest_name || '',
        priest_id: initialData.priest_id || undefined,
        physical_address: initialData.physical_address || '',
        contact_email: initialData.contact_email || '',
        contact_phone: initialData.contact_phone || '',
      });
    }
  }, [initialData, reset]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div>
        <label className="block text-sm font-medium text-secondary-700 mb-1">Parish Name</label>
        <input
          {...register('parish_name', { required: 'Parish Name is required' })}
          className="mt-1 block w-full rounded-lg border-sidebar-border shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent sm:text-sm border p-2.5 transition-all duration-200"
        />
        {errors.parish_name && <p className="text-danger text-xs mt-1">{errors.parish_name.message}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-secondary-700 mb-1">Parish Code</label>
        <input
          {...register('parish_code', { required: 'Parish Code is required' })}
          disabled={!!initialData} // Code typically shouldn't change
          className="mt-1 block w-full rounded-lg border-sidebar-border shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent sm:text-sm border p-2.5 disabled:bg-background-light disabled:cursor-not-allowed transition-all duration-200"
        />
        {errors.parish_code && <p className="text-danger text-xs mt-1">{errors.parish_code.message}</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label className="block text-sm font-medium text-secondary-700 mb-1">Diocese *</label>
          <select
            {...register('diocese_id', { required: 'Diocese is required' })}
            disabled={!!initialData}
            className="mt-1 block w-full rounded-lg border-sidebar-border shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent sm:text-sm border p-2.5 disabled:bg-background-light disabled:cursor-not-allowed transition-all duration-200"
          >
            <option value="">Select Diocese</option>
            {dioceses.map(d => <option key={d.id} value={d.id}>{d.diocese_name}</option>)}
          </select>
          {errors.diocese_id && <p className="text-danger text-xs mt-1">{errors.diocese_id.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-secondary-700 mb-1">Patron Saint</label>
          <input
            {...register('patron_saint')}
            className="mt-1 block w-full rounded-lg border-sidebar-border shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent sm:text-sm border p-2.5 transition-all duration-200"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label className="block text-sm font-medium text-secondary-700 mb-1">Parish Priest (Ordained)</label>
          <select
            {...register('priest_id')}
            className="mt-1 block w-full rounded-lg border-sidebar-border shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent sm:text-sm border p-2.5 transition-all duration-200"
          >
            <option value="">-- Select Priest --</option>
            {ordainedMembers.map(m => (
              <option key={m.id} value={m.id}>{m.first_name} {m.last_name}</option>
            ))}
          </select>
          <p className="text-xs text-secondary-500 mt-1">Only members with Holy Orders sacrament</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-secondary-700 mb-1">Priest Name (Manual)</label>
          <input
            {...register('priest_name')}
            placeholder="If priest is not a registered member"
            className="mt-1 block w-full rounded-lg border-sidebar-border shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent sm:text-sm border p-2.5 transition-all duration-200"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-secondary-700 mb-1">Physical Address</label>
        <textarea
          {...register('physical_address')}
          rows={3}
          className="mt-1 block w-full rounded-lg border-sidebar-border shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent sm:text-sm border p-2.5 transition-all duration-200"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label className="block text-sm font-medium text-secondary-700 mb-1">Email</label>
          <input
            {...register('contact_email', { pattern: { value: /^\S+@\S+$/i, message: "Invalid email" } })}
            className="mt-1 block w-full rounded-lg border-sidebar-border shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent sm:text-sm border p-2.5 transition-all duration-200"
          />
          {errors.contact_email && <p className="text-danger text-xs mt-1">{errors.contact_email.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-secondary-700 mb-1">Phone</label>
          <input
            {...register('contact_phone')}
            className="mt-1 block w-full rounded-lg border-sidebar-border shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent sm:text-sm border p-2.5 transition-all duration-200"
          />
        </div>
      </div>

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
          {isSubmitting ? 'Saving...' : (initialData ? 'Update Parish' : 'Create Parish')}
        </button>
      </div>
    </form>
  );
};

export default ParishForm;
