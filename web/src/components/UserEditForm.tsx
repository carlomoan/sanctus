import { useState, useEffect } from 'react';
import { User, UserRole } from '../types';

interface UserEditFormProps {
  onSubmit: (data: Partial<User>) => Promise<void>;
  onCancel: () => void;
  user: User;
  parishes: { id: string; parish_name: string; diocese_id: string }[];
  dioceses: { id: string; diocese_name: string }[];
}

const UserEditForm = ({ onSubmit, onCancel, user, parishes, dioceses }: UserEditFormProps) => {
  // Get the diocese_id from the user's parish
  const userParish = parishes.find(p => p.id === user.parish_id);
  const userDioceseId = userParish?.diocese_id || '';

  const [formData, setFormData] = useState({
    username: user.username,
    email: user.email,
    full_name: user.full_name,
    phone_number: user.phone_number || '',
    role: user.role,
    diocese_id: userDioceseId,
    parish_id: user.parish_id || '',
    is_active: user.is_active ?? true,
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Filter parishes based on selected diocese
  const filteredParishes = formData.diocese_id
    ? parishes.filter(p => p.diocese_id === formData.diocese_id)
    : parishes;

  // Reset parish when diocese changes
  useEffect(() => {
    if (formData.diocese_id && formData.diocese_id !== userDioceseId) {
      setFormData(prev => ({ ...prev, parish_id: '' }));
    }
  }, [formData.diocese_id, userDioceseId]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Username validation
    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    }

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Full name validation
    if (!formData.full_name.trim()) {
      newErrors.full_name = 'Full name is required';
    }

    // Role validation
    if (!formData.role) {
      newErrors.role = 'Role is required';
    }

    // Diocese validation
    if (!formData.diocese_id) {
      newErrors.diocese_id = 'Diocese is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setErrors({});
    try {
      const submissionData = {
        ...formData,
        parish_id: formData.parish_id === '' ? undefined : formData.parish_id,
        diocese_id: formData.diocese_id === '' ? undefined : formData.diocese_id,
      };
      await onSubmit(submissionData);
    } catch (err: any) {
      console.error(err);
      // Set error message from parent component if available
      if (err.message) {
        setErrors({ submit: err.message });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* General Error Message */}
      {errors.submit && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="text-sm text-red-800">{errors.submit}</div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Username</label>
          <input
            type="text"
            required
            value={formData.username}
            onChange={(e) => {
              setFormData({ ...formData, username: e.target.value });
              if (errors.username) setErrors({ ...errors, username: '' });
            }}
            className={`mt-1 block w-full rounded-md shadow-sm focus:ring-primary-500 sm:text-sm ${errors.username
              ? 'border-red-300 focus:border-red-500'
              : 'border-gray-300 focus:border-primary-500'
              }`}
          />
          {errors.username && (
            <p className="mt-1 text-sm text-red-600">{errors.username}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Email</label>
          <input
            type="email"
            required
            value={formData.email}
            onChange={(e) => {
              setFormData({ ...formData, email: e.target.value });
              if (errors.email) setErrors({ ...errors, email: '' });
            }}
            className={`mt-1 block w-full rounded-md shadow-sm focus:ring-primary-500 sm:text-sm ${errors.email
              ? 'border-red-300 focus:border-red-500'
              : 'border-gray-300 focus:border-primary-500'
              }`}
          />
          {errors.email && (
            <p className="mt-1 text-sm text-red-600">{errors.email}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Full Name</label>
          <input
            type="text"
            required
            value={formData.full_name}
            onChange={(e) => {
              setFormData({ ...formData, full_name: e.target.value });
              if (errors.full_name) setErrors({ ...errors, full_name: '' });
            }}
            className={`mt-1 block w-full rounded-md shadow-sm focus:ring-primary-500 sm:text-sm ${errors.full_name
              ? 'border-red-300 focus:border-red-500'
              : 'border-gray-300 focus:border-primary-500'
              }`}
          />
          {errors.full_name && (
            <p className="mt-1 text-sm text-red-600">{errors.full_name}</p>
          )}
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
            onChange={(e) => {
              setFormData({ ...formData, role: e.target.value as UserRole });
              if (errors.role) setErrors({ ...errors, role: '' });
            }}
            className={`mt-1 block w-full rounded-md shadow-sm focus:ring-primary-500 sm:text-sm ${errors.role
              ? 'border-red-300 focus:border-red-500'
              : 'border-gray-300 focus:border-primary-500'
              }`}
          >
            {Object.values(UserRole).map((role) => (
              <option key={role} value={role}>{role.replace('_', ' ')}</option>
            ))}
          </select>
          {errors.role && (
            <p className="mt-1 text-sm text-red-600">{errors.role}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Diocese</label>
          <select
            value={formData.diocese_id}
            onChange={(e) => {
              setFormData({ ...formData, diocese_id: e.target.value });
              if (errors.diocese_id) setErrors({ ...errors, diocese_id: '' });
            }}
            className={`mt-1 block w-full rounded-md shadow-sm focus:ring-primary-500 sm:text-sm ${errors.diocese_id
              ? 'border-red-300 focus:border-red-500'
              : 'border-gray-300 focus:border-primary-500'
              }`}
          >
            <option value="">Select Diocese</option>
            {dioceses.map((diocese) => (
              <option key={diocese.id} value={diocese.id}>{diocese.diocese_name}</option>
            ))}
          </select>
          {errors.diocese_id && (
            <p className="mt-1 text-sm text-red-600">{errors.diocese_id}</p>
          )}
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
        <div>
          <label className="block text-sm font-medium text-gray-700">Account Status</label>
          <select
            value={formData.is_active.toString()}
            onChange={(e) => setFormData({ ...formData, is_active: e.target.value === 'true' })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
          >
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
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
          {loading ? 'Updating...' : 'Update User'}
        </button>
      </div>
    </form>
  );
};

export default UserEditForm;
