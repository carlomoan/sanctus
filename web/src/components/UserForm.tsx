import { useState, useEffect } from 'react';
import { UserRole } from '../types';

interface UserFormProps {
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
  parishes: { id: string; parish_name: string; diocese_id: string }[];
  dioceses: { id: string; diocese_name: string }[];
}

const UserForm = ({ onSubmit, onCancel, parishes, dioceses }: UserFormProps) => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    full_name: '',
    phone_number: '',
    role: UserRole.PARISH_ADMIN,
    diocese_id: '',
    parish_id: '',
  });
  const [loading, setLoading] = useState(false);

  // Filter parishes based on selected diocese
  const filteredParishes = formData.diocese_id
    ? parishes.filter(p => p.diocese_id === formData.diocese_id)
    : parishes;

  // Reset parish when diocese changes
  useEffect(() => {
    if (formData.diocese_id) {
      setFormData(prev => ({ ...prev, parish_id: '' }));
    }
  }, [formData.diocese_id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const submissionData = {
        ...formData,
        parish_id: formData.parish_id === '' ? null : formData.parish_id,
      };
      await onSubmit(submissionData);
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
          <label className="block text-sm font-medium text-gray-700">Username</label>
          <input
            type="text"
            required
            value={formData.username}
            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Email</label>
          <input
            type="email"
            required
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Password</label>
          <input
            type="password"
            required
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Full Name</label>
          <input
            type="text"
            required
            value={formData.full_name}
            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Phone Number</label>
          <input
            type="text"
            value={formData.phone_number}
            onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Role</label>
          <select
            value={formData.role}
            onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
          >
            {Object.values(UserRole).map((role) => (
              <option key={role} value={role}>{role.replace('_', ' ')}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Diocese</label>
          <select
            value={formData.diocese_id}
            onChange={(e) => setFormData({ ...formData, diocese_id: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
          >
            <option value="">Select Diocese</option>
            {dioceses.map((diocese) => (
              <option key={diocese.id} value={diocese.id}>{diocese.diocese_name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Parish (Optional)</label>
          <select
            value={formData.parish_id}
            onChange={(e) => setFormData({ ...formData, parish_id: e.target.value })}
            disabled={!formData.diocese_id}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm disabled:bg-gray-100"
          >
            <option value="">
              {formData.diocese_id ? 'Select Parish' : 'First select a diocese'}
            </option>
            {filteredParishes.map((parish) => (
              <option key={parish.id} value={parish.id}>{parish.parish_name}</option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-1">Leave empty for diocese-level user</p>
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
          {loading ? 'Creating...' : 'Create User'}
        </button>
      </div>
    </form>
  );
};

export default UserForm;
