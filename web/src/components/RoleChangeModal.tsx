import { useState, useEffect } from 'react';
import { UserRole, User } from '../types';
import { Shield, AlertTriangle } from 'lucide-react';

interface RoleChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (newRole: UserRole) => void;
  user: User | null;
  loading?: boolean;
}

const RoleChangeModal = ({ isOpen, onClose, onConfirm, user, loading = false }: RoleChangeModalProps) => {
  const [selectedRole, setSelectedRole] = useState<UserRole>(UserRole.VIEWER);
  const [confirmationText, setConfirmationText] = useState('');

  // Reset selected role when user changes
  useEffect(() => {
    if (user) {
      setSelectedRole(user.role);
    }
    setConfirmationText('');
  }, [user]);

  const roleOptions = [
    { value: UserRole.VIEWER, label: 'Viewer', description: 'Can only view information' },
    { value: UserRole.SECRETARY, label: 'Secretary', description: 'Can manage members and sacraments' },
    { value: UserRole.ACCOUNTANT, label: 'Accountant', description: 'Can manage finances and budgets' },
    { value: UserRole.PARISH_ADMIN, label: 'Parish Admin', description: 'Full parish management access' },
    { value: UserRole.SUPER_ADMIN, label: 'Super Admin', description: 'Full system access (use with caution)' },
  ];

  const handleConfirm = () => {
    if (!user) return;
    if (selectedRole === UserRole.SUPER_ADMIN && confirmationText !== 'CONFIRM') {
      alert('Please type "CONFIRM" to grant Super Admin privileges');
      return;
    }
    onConfirm(selectedRole);
  };

  const resetForm = () => {
    setSelectedRole(user?.role || UserRole.VIEWER);
    setConfirmationText('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex items-center gap-3 mb-4">
          <Shield className="text-blue-600" size={24} />
          <h2 className="text-xl font-semibold text-gray-900">Change User Role</h2>
        </div>

        <div className="mb-6">
          <p className="text-sm text-gray-600 mb-4">
            Change role for <span className="font-semibold">{user.full_name}</span> ({user.email})
          </p>

          <div className="space-y-3">
            {roleOptions.map((role) => (
              <label key={role.value} className="flex items-start gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                <input
                  type="radio"
                  name="role"
                  value={role.value}
                  checked={selectedRole === role.value}
                  onChange={(e) => setSelectedRole(e.target.value as UserRole)}
                  className="mt-1"
                />
                <div>
                  <div className="font-medium text-gray-900">{role.label}</div>
                  <div className="text-sm text-gray-500">{role.description}</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {selectedRole === UserRole.SUPER_ADMIN && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertTriangle className="text-red-600 mt-0.5" size={16} />
              <div>
                <p className="text-sm font-medium text-red-800">⚠️ Super Admin Access</p>
                <p className="text-xs text-red-700 mt-1">
                  This role has full system access including all parishes and user management.
                  This action cannot be easily reversed.
                </p>
                <p className="text-xs text-red-700 mt-2">
                  Type <span className="font-mono bg-red-100 px-1 rounded">CONFIRM</span> to proceed:
                </p>
                <input
                  type="text"
                  value={confirmationText}
                  onChange={(e) => setConfirmationText(e.target.value)}
                  placeholder="Type CONFIRM"
                  className="mt-2 w-full px-3 py-2 border border-red-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-3 justify-end">
          <button
            onClick={handleClose}
            disabled={loading}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading || (selectedRole === UserRole.SUPER_ADMIN && confirmationText !== 'CONFIRM')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Updating...' : 'Change Role'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RoleChangeModal;
