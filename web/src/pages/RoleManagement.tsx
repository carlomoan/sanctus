import { useState, useEffect } from 'react';
import { api } from '../api/client';
import { Permission, RoleWithPermissions, User, UserPermissionOverride, UserRole } from '../types';
import { useAuth } from '../context/AuthContext';
import { Shield, Plus, Edit, Trash2, Users, Clock, ChevronDown, ChevronRight, Check, X, Search } from 'lucide-react';
import Modal from '../components/Modal';

const PERMISSION_GROUP_LABELS: Record<string, string> = {
  people: 'People Management',
  ministry: 'Ministry',
  finance: 'Finance',
  admin: 'Administration',
};

export default function RoleManagement() {
  const { user } = useAuth();
  const [roles, setRoles] = useState<RoleWithPermissions[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [overrides, setOverrides] = useState<UserPermissionOverride[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'roles' | 'overrides'>('roles');

  // Role editing
  const [editingRole, setEditingRole] = useState<RoleWithPermissions | null>(null);
  const [expandedRole, setExpandedRole] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleDisplayName, setNewRoleDisplayName] = useState('');
  const [newRoleDescription, setNewRoleDescription] = useState('');
  const [selectedPermIds, setSelectedPermIds] = useState<Set<string>>(new Set());

  // Override granting
  const [isOverrideModalOpen, setIsOverrideModalOpen] = useState(false);
  const [overrideUserId, setOverrideUserId] = useState('');
  const [overridePermIds, setOverridePermIds] = useState<Set<string>>(new Set());
  const [overrideReason, setOverrideReason] = useState('');
  const [overrideExpiry, setOverrideExpiry] = useState('');
  const [userSearch, setUserSearch] = useState('');

  const isSuperAdmin = user?.role === UserRole.SUPER_ADMIN;

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [rolesData, permsData, usersData, overridesData] = await Promise.all([
        api.listRoles(),
        api.listPermissions(),
        api.listUsers(),
        api.listUserOverrides(),
      ]);
      setRoles(rolesData);
      setPermissions(permsData);
      setUsers(usersData);
      setOverrides(overridesData);
    } catch (e) {
      console.error('Failed to load role data:', e);
    } finally {
      setLoading(false);
    }
  };

  const permissionsByGroup = permissions.reduce((acc, p) => {
    if (!acc[p.permission_group]) acc[p.permission_group] = [];
    acc[p.permission_group].push(p);
    return acc;
  }, {} as Record<string, Permission[]>);

  // Role CRUD
  const handleCreateRole = async () => {
    try {
      await api.createRole({
        role_name: newRoleName.toUpperCase().replace(/\s+/g, '_'),
        display_name: newRoleDisplayName,
        description: newRoleDescription || undefined,
        permission_ids: Array.from(selectedPermIds),
      });
      setIsCreateModalOpen(false);
      setNewRoleName('');
      setNewRoleDisplayName('');
      setNewRoleDescription('');
      setSelectedPermIds(new Set());
      await loadData();
    } catch (e) {
      alert('Failed to create role: ' + e);
    }
  };

  const handleDeleteRole = async (roleId: string) => {
    if (!confirm('Delete this role? This cannot be undone.')) return;
    try {
      await api.deleteRole(roleId);
      await loadData();
    } catch (e) {
      alert('Failed to delete role: ' + e);
    }
  };

  const handleSavePermissions = async (roleId: string) => {
    try {
      await api.setRolePermissions(roleId, Array.from(selectedPermIds));
      setEditingRole(null);
      await loadData();
    } catch (e) {
      alert('Failed to update permissions: ' + e);
    }
  };

  const startEditPermissions = (role: RoleWithPermissions) => {
    setEditingRole(role);
    setSelectedPermIds(new Set(role.permissions.map(p => p.id)));
  };

  const togglePermission = (permId: string) => {
    setSelectedPermIds(prev => {
      const next = new Set(prev);
      if (next.has(permId)) next.delete(permId);
      else next.add(permId);
      return next;
    });
  };

  // Override CRUD
  const handleGrantOverrides = async () => {
    if (!overrideUserId || overridePermIds.size === 0) return;
    try {
      await api.grantUserOverrides({
        user_id: overrideUserId,
        permission_ids: Array.from(overridePermIds),
        reason: overrideReason || undefined,
        expires_at: overrideExpiry ? new Date(overrideExpiry).toISOString() : undefined,
      });
      setIsOverrideModalOpen(false);
      setOverrideUserId('');
      setOverridePermIds(new Set());
      setOverrideReason('');
      setOverrideExpiry('');
      await loadData();
    } catch (e) {
      alert('Failed to grant overrides: ' + e);
    }
  };

  const handleRevokeOverride = async (id: string) => {
    try {
      await api.revokeSingleOverride(id);
      await loadData();
    } catch (e) {
      alert('Failed to revoke override: ' + e);
    }
  };

  const filteredUsers = users.filter(u =>
    u.full_name.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.username.toLowerCase().includes(userSearch.toLowerCase())
  );

  if (!isSuperAdmin) {
    return (
      <div className="text-center py-12 text-gray-500">
        <Shield size={48} className="mx-auto mb-4 text-gray-300" />
        <p className="text-lg font-medium">Access Denied</p>
        <p className="text-sm">Only Super Admins can manage roles and permissions.</p>
      </div>
    );
  }

  if (loading) return <div className="text-center py-12 text-gray-500">Loading roles and permissions...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Shield size={24} /> Roles & Permissions
        </h1>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-6">
          <button
            onClick={() => setActiveTab('roles')}
            className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'roles'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Shield size={16} className="inline mr-1.5" />
            Roles ({roles.length})
          </button>
          <button
            onClick={() => setActiveTab('overrides')}
            className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'overrides'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Clock size={16} className="inline mr-1.5" />
            Temporary Overrides ({overrides.length})
          </button>
        </nav>
      </div>

      {/* Roles Tab */}
      {activeTab === 'roles' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-primary-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-primary-700 text-sm"
            >
              <Plus size={16} /> Create Role
            </button>
          </div>

          {roles.map(role => (
            <div key={role.id} className="bg-white rounded-lg shadow-sm border border-gray-100">
              <div
                className="px-6 py-4 flex items-center justify-between cursor-pointer"
                onClick={() => setExpandedRole(expandedRole === role.id ? null : role.id)}
              >
                <div className="flex items-center gap-3">
                  {expandedRole === role.id ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">{role.display_name}</span>
                      {role.is_system && (
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">System</span>
                      )}
                      <span className="text-xs text-gray-400 font-mono">{role.role_name}</span>
                    </div>
                    {role.description && <p className="text-sm text-gray-500 mt-0.5">{role.description}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">{role.permissions.length} permissions</span>
                  {editingRole?.id !== role.id && (
                    <button
                      onClick={(e) => { e.stopPropagation(); startEditPermissions(role); setExpandedRole(role.id); }}
                      className="text-primary-600 hover:text-primary-800 p-1"
                      title="Edit permissions"
                    >
                      <Edit size={16} />
                    </button>
                  )}
                  {!role.is_system && (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeleteRole(role.id); }}
                      className="text-red-500 hover:text-red-700 p-1"
                      title="Delete role"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>

              {expandedRole === role.id && (
                <div className="px-6 pb-4 border-t border-gray-100 pt-4">
                  {editingRole?.id === role.id ? (
                    <div className="space-y-4">
                      <p className="text-sm text-gray-600 font-medium">Select permissions for this role:</p>
                      {Object.entries(permissionsByGroup).map(([group, perms]) => (
                        <div key={group}>
                          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                            {PERMISSION_GROUP_LABELS[group] || group}
                          </h4>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                            {perms.map(p => (
                              <label key={p.id} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-50 rounded px-2 py-1">
                                <input
                                  type="checkbox"
                                  checked={selectedPermIds.has(p.id)}
                                  onChange={() => togglePermission(p.id)}
                                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                />
                                <span className="text-gray-700">{p.display_name}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      ))}
                      <div className="flex gap-2 pt-2">
                        <button
                          onClick={() => handleSavePermissions(role.id)}
                          className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-1 hover:bg-primary-700"
                        >
                          <Check size={14} /> Save Permissions
                        </button>
                        <button
                          onClick={() => setEditingRole(null)}
                          className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm flex items-center gap-1 hover:bg-gray-200"
                        >
                          <X size={14} /> Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {Object.entries(permissionsByGroup).map(([group, perms]) => {
                        const rolePermKeys = new Set(role.permissions.map(p => p.permission_key));
                        const groupPerms = perms.filter(p => rolePermKeys.has(p.permission_key));
                        if (groupPerms.length === 0) return null;
                        return (
                          <div key={group}>
                            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
                              {PERMISSION_GROUP_LABELS[group] || group}
                            </h4>
                            <div className="flex flex-wrap gap-1.5">
                              {groupPerms.map(p => (
                                <span key={p.id} className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded-full border border-green-200">
                                  {p.display_name}
                                </span>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Overrides Tab */}
      {activeTab === 'overrides' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-500">
              Grant temporary permissions to users when the person with the required role is absent.
            </p>
            <button
              onClick={() => setIsOverrideModalOpen(true)}
              className="bg-primary-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-primary-700 text-sm"
            >
              <Plus size={16} /> Grant Override
            </button>
          </div>

          {overrides.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg border border-gray-100">
              <Clock size={40} className="mx-auto mb-3 text-gray-300" />
              <p className="text-gray-500">No active permission overrides</p>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Permission</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reason</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Expires</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {overrides.map(ov => {
                    const ovUser = users.find(u => u.id === ov.user_id);
                    return (
                      <tr key={ov.id}>
                        <td className="px-6 py-4 text-sm">
                          <div className="font-medium text-gray-900">{ovUser?.full_name || ov.user_id}</div>
                          <div className="text-gray-500 text-xs">{ovUser?.username}</div>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <span className="bg-purple-50 text-purple-700 px-2 py-0.5 rounded text-xs">
                            {ov.permission_display_name}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">{ov.reason || '—'}</td>
                        <td className="px-6 py-4 text-sm">
                          {ov.expires_at ? (
                            <span className={`text-xs ${new Date(ov.expires_at) < new Date() ? 'text-red-500' : 'text-orange-600'}`}>
                              {new Date(ov.expires_at).toLocaleDateString()} {new Date(ov.expires_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          ) : (
                            <span className="text-xs text-gray-400">No expiry</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => handleRevokeOverride(ov.id)}
                            className="text-red-600 hover:text-red-800 text-sm"
                          >
                            Revoke
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Create Role Modal */}
      <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title="Create New Role">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role Name (internal)</label>
            <input
              value={newRoleName}
              onChange={e => setNewRoleName(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              placeholder="e.g. CHOIR_LEADER"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Display Name</label>
            <input
              value={newRoleDisplayName}
              onChange={e => setNewRoleDisplayName(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              placeholder="e.g. Choir Leader"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={newRoleDescription}
              onChange={e => setNewRoleDescription(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              rows={2}
              placeholder="What this role is for..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Permissions</label>
            <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg p-3 space-y-3">
              {Object.entries(permissionsByGroup).map(([group, perms]) => (
                <div key={group}>
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                    {PERMISSION_GROUP_LABELS[group] || group}
                  </h4>
                  {perms.map(p => (
                    <label key={p.id} className="flex items-center gap-2 text-sm py-0.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedPermIds.has(p.id)}
                        onChange={() => togglePermission(p.id)}
                        className="rounded border-gray-300 text-primary-600"
                      />
                      {p.display_name}
                    </label>
                  ))}
                </div>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button onClick={() => setIsCreateModalOpen(false)} className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">
              Cancel
            </button>
            <button
              onClick={handleCreateRole}
              disabled={!newRoleName || !newRoleDisplayName}
              className="px-4 py-2 text-sm text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50"
            >
              Create Role
            </button>
          </div>
        </div>
      </Modal>

      {/* Grant Override Modal */}
      <Modal isOpen={isOverrideModalOpen} onClose={() => setIsOverrideModalOpen(false)} title="Grant Temporary Permission">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Select User</label>
            <div className="relative">
              <Search size={16} className="absolute left-3 top-2.5 text-gray-400" />
              <input
                value={userSearch}
                onChange={e => setUserSearch(e.target.value)}
                className="w-full border border-gray-300 rounded-lg pl-9 pr-3 py-2 text-sm"
                placeholder="Search users..."
              />
            </div>
            <div className="max-h-32 overflow-y-auto border border-gray-200 rounded-lg mt-1">
              {filteredUsers.map(u => (
                <button
                  key={u.id}
                  onClick={() => setOverrideUserId(u.id)}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex justify-between items-center ${
                    overrideUserId === u.id ? 'bg-primary-50 text-primary-700' : ''
                  }`}
                >
                  <span>{u.full_name} <span className="text-gray-400">({u.username})</span></span>
                  {overrideUserId === u.id && <Check size={14} />}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Permissions to Grant</label>
            <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-3 space-y-3">
              {Object.entries(permissionsByGroup).map(([group, perms]) => (
                <div key={group}>
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                    {PERMISSION_GROUP_LABELS[group] || group}
                  </h4>
                  {perms.map(p => (
                    <label key={p.id} className="flex items-center gap-2 text-sm py-0.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={overridePermIds.has(p.id)}
                        onChange={() => {
                          setOverridePermIds(prev => {
                            const next = new Set(prev);
                            if (next.has(p.id)) next.delete(p.id);
                            else next.add(p.id);
                            return next;
                          });
                        }}
                        className="rounded border-gray-300 text-primary-600"
                      />
                      {p.display_name}
                    </label>
                  ))}
                </div>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
            <input
              value={overrideReason}
              onChange={e => setOverrideReason(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              placeholder="e.g. Accountant on leave, need temporary finance access"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Expires At (optional)</label>
            <input
              type="datetime-local"
              value={overrideExpiry}
              onChange={e => setOverrideExpiry(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
            <p className="text-xs text-gray-400 mt-1">Leave empty for no expiry (must be manually revoked)</p>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button onClick={() => setIsOverrideModalOpen(false)} className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">
              Cancel
            </button>
            <button
              onClick={handleGrantOverrides}
              disabled={!overrideUserId || overridePermIds.size === 0}
              className="px-4 py-2 text-sm text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50"
            >
              Grant Permissions
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
