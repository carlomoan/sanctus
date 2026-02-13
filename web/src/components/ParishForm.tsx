import { useForm } from 'react-hook-form';
import { CreateParishRequest, Parish, UpdateParishRequest, Member, SacramentRecord, SacramentType, Diocese } from '../types';
import { useEffect, useState } from 'react';
import { api } from '../api/client';

interface ParishFormProps {
  initialData?: Parish;
  onSubmit: (data: CreateParishRequest | UpdateParishRequest) => Promise<void>;
  onCancel: () => void;
}

const ParishForm = ({ initialData, onSubmit, onCancel }: ParishFormProps) => {
  const { register, handleSubmit, formState: { errors, isSubmitting }, reset, setValue } = useForm<CreateParishRequest>({
    defaultValues: { parish_name: '', parish_code: '', diocese_id: '' }
  });

  const [ordainedMembers, setOrdainedMembers] = useState<Member[]>([]);
  const [dioceses, setDioceses] = useState<Diocese[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const [dios, members, sacraments] = await Promise.all([
          api.listDioceses(),
          api.listMembers(),
          api.listSacraments(),
        ]);
        setDioceses(dios);
        if (dios.length > 0 && !initialData) setValue('diocese_id', dios[0].id);
        const ordainedIds = new Set(
          sacraments.filter((s: SacramentRecord) => s.sacrament_type === SacramentType.HOLY_ORDERS).map((s: SacramentRecord) => s.member_id)
        );
        setOrdainedMembers(members.filter((m: Member) => ordainedIds.has(m.id)));
      } catch (err) { console.error('Failed to load form data:', err); }
    };
    load();
  }, [initialData, setValue]);

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
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Parish Name</label>
        <input
          {...register('parish_name', { required: 'Parish Name is required' })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm border p-2"
        />
        {errors.parish_name && <p className="text-red-500 text-xs mt-1">{errors.parish_name.message}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Parish Code</label>
        <input
          {...register('parish_code', { required: 'Parish Code is required' })}
          disabled={!!initialData} // Code typically shouldn't change
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm border p-2 disabled:bg-gray-100"
        />
        {errors.parish_code && <p className="text-red-500 text-xs mt-1">{errors.parish_code.message}</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Diocese</label>
          <select
            {...register('diocese_id', { required: 'Diocese is required' })}
            disabled={!!initialData}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm border p-2 disabled:bg-gray-100"
          >
            <option value="">Select Diocese</option>
            {dioceses.map(d => <option key={d.id} value={d.id}>{d.diocese_name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Patron Saint</label>
          <input
            {...register('patron_saint')}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm border p-2"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Parish Priest (Ordained)</label>
          <select
            {...register('priest_id')}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm border p-2"
          >
            <option value="">-- Select Priest --</option>
            {ordainedMembers.map(m => (
              <option key={m.id} value={m.id}>{m.first_name} {m.last_name}</option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-1">Only members with Holy Orders sacrament</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Priest Name (Manual)</label>
          <input
            {...register('priest_name')}
            placeholder="If priest is not a registered member"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm border p-2"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Physical Address</label>
        <textarea
          {...register('physical_address')}
          rows={3}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm border p-2"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Email</label>
          <input
            {...register('contact_email', { pattern: { value: /^\S+@\S+$/i, message: "Invalid email" } })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm border p-2"
          />
          {errors.contact_email && <p className="text-red-500 text-xs mt-1">{errors.contact_email.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Phone</label>
          <input
            {...register('contact_phone')}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm border p-2"
          />
        </div>
      </div>

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
          {isSubmitting ? 'Saving...' : (initialData ? 'Update Parish' : 'Create Parish')}
        </button>
      </div>
    </form>
  );
};

export default ParishForm;
