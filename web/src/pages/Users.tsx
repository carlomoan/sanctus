import { useState, useEffect } from 'react';
import { api } from '../api/client';
import { User, UserRole, Parish, Diocese } from '../types';
import { Plus, Shield, Trash2, Mail, Phone, Church, Edit, UserCheck, UserX, Settings } from 'lucide-react';
import Modal from '../components/Modal';
import UserForm from '../components/UserForm';
import UserEditForm from '../components/UserEditForm';
import RoleChangeModal from '../components/RoleChangeModal';
import { useAuth } from '../context/AuthContext';

const Users = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [parishes, setParishes] = useState<Parish[]>([]);
  const [dioceses, setDioceses] = useState<Diocese[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [updatingRole, setUpdatingRole] = useState(false);
  const { user: currentUser } = useAuth();

  const fetchData = async () => {
    try {
      setLoading(true);
      const [usersData, parishesData, diocesesData] = await Promise.all([
        api.listUsers(),
        api.listParishes(),
        api.listDioceses(),
      ]);
      setUsers(usersData);
      setParishes(parishesData);
      setDioceses(diocesesData);
    } catch (err) {
      setError('Failed to load users, parishes, or dioceses');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateUser = async (data: any) => {
    try {
      await api.createUser(data);
      await fetchData();
      setIsModalOpen(false);
    } catch (err: any) {
      console.error('Failed to create user:', err);

      // Handle specific database errors and re-throw for form display
      let errorMessage = 'Failed to create user';

      if (err.message.includes('duplicate key value violates unique constraint')) {
        if (err.message.includes('email_key')) {
          errorMessage = 'A user with this email address already exists. Please use a different email.';
        } else if (err.message.includes('username_key')) {
          errorMessage = 'A user with this username already exists. Please choose a different username.';
        } else {
          errorMessage = 'A user with this information already exists. Please check your inputs and try again.';
        }
      } else if (err.message.includes('API Error: 500')) {
        errorMessage = 'Server error occurred. Please try again later.';
      } else if (err.message) {
        errorMessage = err.message;
      }

      // Re-throw with the specific error message for the form to display
      throw new Error(errorMessage);
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (id === currentUser?.id) {
      alert('You cannot delete yourself');
      return;
    }
    if (confirm('Are you sure you want to delete this user?')) {
      try {
        await api.deleteUser(id);
        setUsers(users.filter(u => u.id !== id));
      } catch (err) {
        console.error('Failed to delete user:', err);
        alert('Failed to delete user');
      }
    }
  };

  const handleChangeRole = (user: User) => {
    setSelectedUser(user);
    setIsRoleModalOpen(true);
  };

  const handleRoleChange = async (newRole: UserRole) => {
    if (!selectedUser) return;

    setUpdatingRole(true);
    try {
      const updatedUser = await api.updateUser(selectedUser.id, { role: newRole });
      setUsers(users.map(u => u.id === selectedUser.id ? updatedUser : u));
      setIsRoleModalOpen(false);
      setSelectedUser(null);

      // Show success message
      alert(`Role changed to ${newRole.replace('_', ' ')} successfully`);
    } catch (err) {
      console.error('Failed to update user role:', err);
      alert('Failed to update user role');
    } finally {
      setUpdatingRole(false);
    }
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setIsEditModalOpen(true);
  };

  const handleUpdateUser = async (data: Partial<User>) => {
    if (!selectedUser) return;

    try {
      // Use the toggleUserStatus method if only status is being updated
      if (Object.keys(data).length === 1 && 'is_active' in data) {
        await api.toggleUserStatus(selectedUser.id, data.is_active!);
      } else {
        // For other updates, try the regular updateUser method
        await api.updateUser(selectedUser.id, data);
      }

      // Refetch all users to get latest data from database
      await fetchData();

      setIsEditModalOpen(false);
      setSelectedUser(null);

      // Show success message
      alert('User updated successfully');
    } catch (err: any) {
      console.error('Failed to update user:', err);
      alert('Failed to update user. Please try again later.');
    }
  };

  const handleToggleUserStatus = async (user: User) => {
    try {
      await api.toggleUserStatus(user.id, !user.is_active);

      // Refetch all users to get latest data from database
      await fetchData();

      // Show success message
      alert(`User ${!user.is_active ? 'activated' : 'deactivated'} successfully`);
    } catch (err: any) {
      console.error('Failed to toggle user status:', err);
      alert('Failed to update user status. Please try again later.');
    }
  };

  if (currentUser?.role !== UserRole.SUPER_ADMIN) {
    return (
      <div className="text-center py-12">
        <Shield className="mx-auto h-12 w-12 text-red-500" />
        <h2 className="mt-2 text-lg font-medium text-gray-900">Access Denied</h2>
        <p className="mt-1 text-sm text-gray-500">Only SuperAdmins can manage users.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-primary-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-primary-700 transition-colors"
        >
          <Plus size={20} />
          Add User
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading users...</div>
      ) : error ? (
        <div className="text-center py-12 text-red-500">{error}</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {users.map((user) => (
            <div key={user.id} className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center text-primary-700 font-bold">
                    {user.full_name[0]}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{user.full_name}</h3>
                    <p className="text-sm text-gray-500">@{user.username}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${user.role === UserRole.SUPER_ADMIN ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                    {user.role.replace('_', ' ')}
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${user.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                    {user.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>

              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <Mail size={16} className="text-gray-400" />
                  <span>{user.email}</span>
                </div>
                {user.phone_number && (
                  <div className="flex items-center gap-2">
                    <Phone size={16} className="text-gray-400" />
                    <span>{user.phone_number}</span>
                  </div>
                )}
                {user.parish_id && (
                  <div className="flex items-center gap-2">
                    <Church size={16} className="text-gray-400" />
                    <span>{parishes.find(p => p.id === user.parish_id)?.parish_name || 'Assigned Parish'}</span>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between">
                <div className="flex gap-1">
                  <button
                    onClick={() => handleEditUser(user)}
                    disabled={user.id === currentUser.id}
                    className="p-2 text-gray-400 hover:text-blue-600 rounded-full hover:bg-blue-50 transition-colors disabled:opacity-30"
                    title="Edit User"
                  >
                    <Settings size={18} />
                  </button>
                  <button
                    onClick={() => handleToggleUserStatus(user)}
                    disabled={user.id === currentUser.id}
                    className="p-2 text-gray-400 hover:text-green-600 rounded-full hover:bg-green-50 transition-colors disabled:opacity-30"
                    title={user.is_active ? 'Deactivate User' : 'Activate User'}
                  >
                    {user.is_active ? <UserX size={18} /> : <UserCheck size={18} />}
                  </button>
                  <button
                    onClick={() => handleChangeRole(user)}
                    disabled={user.id === currentUser.id}
                    className="p-2 text-gray-400 hover:text-purple-600 rounded-full hover:bg-purple-50 transition-colors disabled:opacity-30"
                    title="Change Role"
                  >
                    <Edit size={18} />
                  </button>
                </div>
                <button
                  onClick={() => handleDeleteUser(user.id)}
                  disabled={user.id === currentUser.id}
                  className="p-2 text-gray-400 hover:text-red-600 rounded-full hover:bg-red-50 transition-colors disabled:opacity-30"
                  title="Delete User"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add New User"
      >
        <UserForm
          onSubmit={handleCreateUser}
          onCancel={() => setIsModalOpen(false)}
          parishes={parishes}
          dioceses={dioceses}
        />
      </Modal>

      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit User"
      >
        {selectedUser && (
          <UserEditForm
            onSubmit={handleUpdateUser}
            onCancel={() => setIsEditModalOpen(false)}
            user={selectedUser}
            parishes={parishes}
            dioceses={dioceses}
          />
        )}
      </Modal>

      {selectedUser && (
        <RoleChangeModal
          isOpen={isRoleModalOpen}
          onClose={() => setIsRoleModalOpen(false)}
          onConfirm={handleRoleChange}
          user={selectedUser}
          loading={updatingRole}
        />
      )}
    </div>
  );
};

export default Users;
