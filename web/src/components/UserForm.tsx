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
  const [errors, setErrors] = useState<Record<string, string>>({});

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

    // Password validation
    if (!formData.password.trim()) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
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
        parish_id: formData.parish_id === '' ? null : formData.parish_id,
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
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* General Error Message */}
      {errors.submit && (
        <div className="bg-danger/10 border border-danger/20 rounded-card p-4">
          <div className="text-sm text-danger">{errors.submit}</div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label className="block text-sm font-medium text-secondary-700 mb-1">Username</label>
          <input
            type="text"
            required
            value={formData.username}
            onChange={(e) => {
              setFormData({ ...formData, username: e.target.value });
              if (errors.username) setErrors({ ...errors, username: '' });
            }}
            className={`mt-1 block w-full rounded-lg shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent sm:text-sm border p-2.5 transition-all duration-200 ${errors.username
              ? 'border-danger focus:border-danger'
              : 'border-sidebar-border'
              }`}
          />
          {errors.username && (
            <p className="mt-1 text-sm text-danger">{errors.username}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-secondary-700 mb-1">Email</label>
          <input
            type="email"
            required
            value={formData.email}
            onChange={(e) => {
              setFormData({ ...formData, email: e.target.value });
              if (errors.email) setErrors({ ...errors, email: '' });
            }}
            className={`mt-1 block w-full rounded-lg shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent sm:text-sm border p-2.5 transition-all duration-200 ${errors.email
              ? 'border-danger focus:border-danger'
              : 'border-sidebar-border'
              }`}
          />
          {errors.email && (
            <p className="mt-1 text-sm text-danger">{errors.email}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-secondary-700 mb-1">Password</label>
          <input
            type="password"
            required
            value={formData.password}
            onChange={(e) => {
              setFormData({ ...formData, password: e.target.value });
              if (errors.password) setErrors({ ...errors, password: '' });
            }}
            className={`mt-1 block w-full rounded-lg shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent sm:text-sm border p-2.5 transition-all duration-200 ${errors.password
              ? 'border-danger focus:border-danger'
              : 'border-sidebar-border'
              }`}
          />
          {errors.password && (
            <p className="mt-1 text-sm text-danger">{errors.password}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-secondary-700 mb-1">Full Name</label>
          <input
            type="text"
            required
            value={formData.full_name}
            onChange={(e) => {
              setFormData({ ...formData, full_name: e.target.value });
              if (errors.full_name) setErrors({ ...errors, full_name: '' });
            }}
            className={`mt-1 block w-full rounded-lg shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent sm:text-sm border p-2.5 transition-all duration-200 ${errors.full_name
              ? 'border-danger focus:border-danger'
              : 'border-sidebar-border'
              }`}
          />
          {errors.full_name && (
            <p className="mt-1 text-sm text-danger">{errors.full_name}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-secondary-700 mb-1">Phone Number</label>
          <input
            type="text"
            value={formData.phone_number}
            onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
            className="mt-1 block w-full rounded-lg border-sidebar-border shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent sm:text-sm border p-2.5 transition-all duration-200"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-secondary-700 mb-1">Role</label>
          <select
            value={formData.role}
            onChange={(e) => {
              setFormData({ ...formData, role: e.target.value as UserRole });
              if (errors.role) setErrors({ ...errors, role: '' });
            }}
            className={`mt-1 block w-full rounded-lg shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent sm:text-sm border p-2.5 transition-all duration-200 ${errors.role
              ? 'border-danger focus:border-danger'
              : 'border-sidebar-border'
              }`}
          >
            {Object.values(UserRole).map((role) => (
              <option key={role} value={role}>{role.replace('_', ' ')}</option>
            ))}
          </select>
          {errors.role && (
            <p className="mt-1 text-sm text-danger">{errors.role}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-secondary-700 mb-1">Diocese</label>
          <select
            value={formData.diocese_id}
            onChange={(e) => {
              setFormData({ ...formData, diocese_id: e.target.value });
              if (errors.diocese_id) setErrors({ ...errors, diocese_id: '' });
            }}
            className={`mt-1 block w-full rounded-lg shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent sm:text-sm border p-2.5 transition-all duration-200 ${errors.diocese_id
              ? 'border-danger focus:border-danger'
              : 'border-sidebar-border'
              }`}
          >
            <option value="">Select Diocese</option>
            {dioceses.map((diocese) => (
              <option key={diocese.id} value={diocese.id}>{diocese.diocese_name}</option>
            ))}
          </select>
          {errors.diocese_id && (
            <p className="mt-1 text-sm text-danger">{errors.diocese_id}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-secondary-700 mb-1">Parish (Optional)</label>
          <select
            value={formData.parish_id}
            onChange={(e) => setFormData({ ...formData, parish_id: e.target.value })}
            disabled={!formData.diocese_id}
            className="mt-1 block w-full rounded-lg border-sidebar-border shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent sm:text-sm border p-2.5 disabled:bg-background-light disabled:cursor-not-allowed transition-all duration-200"
          >
            <option value="">
              {formData.diocese_id ? 'Select Parish' : 'First select a diocese'}
            </option>
            {filteredParishes.map((parish) => (
              <option key={parish.id} value={parish.id}>{parish.parish_name}</option>
            ))}
          </select>
          <p className="text-xs text-secondary-500 mt-1">Leave empty for diocese-level user</p>
        </div>
      </div>

      <div className="mt-5 sm:mt-6 flex gap-3 justify-end">
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex justify-center rounded-lg border border-sidebar-border shadow-sm px-4 py-2.5 bg-white text-base font-medium text-secondary-700 hover:bg-background-light focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:text-sm transition-all duration-200"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="inline-flex justify-center rounded-lg border border-transparent shadow-sm px-4 py-2.5 bg-gradient-to-r from-primary-600 to-primary-700 text-base font-semibold text-white hover:from-primary-700 hover:to-primary-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:text-sm disabled:opacity-50 transition-all duration-200"
        >
          {loading ? 'Creating...' : 'Create User'}
        </button>
      </div>
    </form>
  );
};

export default UserForm;
