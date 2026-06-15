import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../api/client';
import { User, UserRole, Parish, Diocese } from '../types';
import { Plus, Trash2, Mail, Phone, Church, Edit, UserCheck, UserX, Settings, RefreshCw } from 'lucide-react';
import Modal from '../components/Modal';
import UserForm from '../components/UserForm';
import UserEditForm from '../components/UserEditForm';
import RoleChangeModal from '../components/RoleChangeModal';
import { useAuth } from '../context/AuthContext';

const Users = () => {
  const { t } = useTranslation();
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

      // Debug logging to see what we're getting
      console.log('Users fetched from API:', usersData);
      console.log('Number of users:', usersData.length);
      usersData.forEach((user, index) => {
        console.log(`User ${index + 1}:`, user);
      });

      setUsers(usersData);
      setParishes(parishesData);
      setDioceses(diocesesData);
    } catch (err) {
      setError(t('users.failedToLoad'));
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
      alert(t('users.roleChangedSuccess', { role: newRole.replace('_', ' ') }));
    } catch (err) {
      console.error('Failed to update user role:', err);
      alert(t('users.failedToChangeRole'));
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
      alert(t('users.userUpdatedSuccess'));
    } catch (err: any) {
      console.error('Failed to update user:', err);
      alert(t('users.failedToUpdateUser'));
    }
  };

  const handleToggleUserStatus = async (user: User) => {
    try {
      await api.toggleUserStatus(user.id, !user.is_active);

      // Refetch all users to get latest data from database
      await fetchData();

      // Show success message
      alert(!user.is_active ? t('users.userActivatedSuccess') : t('users.userDeactivatedSuccess'));
    } catch (err: any) {
      console.error('Failed to toggle user status:', err);
      alert(t('users.failedToUpdateStatus'));
    }
  };

  const handleReactivateUser = async (user: User) => {
    try {
      await api.reactivateUser(user.id);

      // Refetch all users to get latest data from database
      await fetchData();

      // Show success message
      alert(t('users.userReactivatedSuccess', { username: user.username }));
    } catch (err: any) {
      console.error('Failed to reactivate user:', err);
      alert(t('users.failedToReactivate'));
    }
  };

  if (currentUser?.role !== UserRole.SUPER_ADMIN && currentUser?.role !== UserRole.PARISH_ADMIN) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">{t('users.accessDenied')}</h1>
          <p className="text-gray-600">{t('users.noPermission')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">{t('users.userManagement')}</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-primary-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-primary-700 transition-colors"
        >
          <Plus size={20} />
          {t('users.createUser')}
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">{t('common.loading')}</div>
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
                    {user.is_active ? t('common.active') : t('common.inactive')}
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
                    title={t('users.editUserTitle')}
                  >
                    <Settings size={18} />
                  </button>

                  {/* Show different buttons based on user status and current user role */}
                  {!user.is_active && currentUser?.role === UserRole.SUPER_ADMIN ? (
                    // SuperAdmin can reactivate deleted users
                    <button
                      onClick={() => handleReactivateUser(user)}
                      className="p-2 text-gray-400 hover:text-green-600 rounded-full hover:bg-green-50 transition-colors"
                      title={t('users.reactivateUser')}
                    >
                      <RefreshCw size={18} />
                    </button>
                  ) : user.is_active ? (
                    // Active users can be deactivated
                    <button
                      onClick={() => handleToggleUserStatus(user)}
                      disabled={user.id === currentUser.id}
                      className="p-2 text-gray-400 hover:text-orange-600 rounded-full hover:bg-orange-50 transition-colors disabled:opacity-30"
                      title={t('users.deactivateUser')}
                    >
                      <UserX size={18} />
                    </button>
                  ) : (
                    // Inactive users (Parish Admin view) can be activated
                    <button
                      onClick={() => handleToggleUserStatus(user)}
                      disabled={user.id === currentUser.id}
                      className="p-2 text-gray-400 hover:text-green-600 rounded-full hover:bg-green-50 transition-colors disabled:opacity-30"
                      title={t('users.activateUser')}
                    >
                      <UserCheck size={18} />
                    </button>
                  )}

                  <button
                    onClick={() => handleChangeRole(user)}
                    disabled={user.id === currentUser.id}
                    className="p-2 text-gray-400 hover:text-purple-600 rounded-full hover:bg-purple-50 transition-colors disabled:opacity-30"
                    title={t('users.changeRole')}
                  >
                    <Edit size={18} />
                  </button>
                </div>
                <button
                  onClick={() => handleDeleteUser(user.id)}
                  disabled={user.id === currentUser.id}
                  className="p-2 text-red-400 hover:text-red-600 rounded-full hover:bg-red-50 transition-colors disabled:opacity-30"
                  title={currentUser?.role === UserRole.SUPER_ADMIN ? 'Permanently Delete User' : 'Deactivate User'}
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
