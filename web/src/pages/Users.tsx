import { useState, useEffect } from 'react';
import { api } from '../api/client';
import { User, UserRole, Parish } from '../types';
import { Plus, User as UserIcon, Shield, Trash2, Mail, Phone, Church } from 'lucide-react';
import Modal from '../components/Modal';
import UserForm from '../components/UserForm';
import { useAuth } from '../context/AuthContext';

const Users = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [parishes, setParishes] = useState<Parish[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { user: currentUser } = useAuth();

  const fetchData = async () => {
    try {
      setLoading(true);
      const [usersData, parishesData] = await Promise.all([
        api.listUsers(),
        api.listParishes(),
      ]);
      setUsers(usersData);
      setParishes(parishesData);
    } catch (err) {
      setError('Failed to load users or parishes');
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
    } catch (err) {
      console.error('Failed to create user:', err);
      alert('Failed to create user');
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
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  user.role === UserRole.SUPER_ADMIN ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                }`}>
                  {user.role.replace('_', ' ')}
                </span>
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

              <div className="mt-4 pt-4 border-t border-gray-100 flex justify-end">
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
        />
      </Modal>
    </div>
  );
};

export default Users;
