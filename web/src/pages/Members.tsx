import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { Member, Parish, CreateMemberRequest, UpdateMemberRequest, UserRole } from '../types';
import { Plus, Search, User, MapPin, Edit, Trash2, Filter, X, Download } from 'lucide-react';
import Modal from '../components/Modal';
import MemberForm from '../components/MemberForm';
import DataTable, { Column, BulkAction } from '../components/DataTable';
import { useAuth } from '../context/AuthContext';

const Members = () => {
  const { user } = useAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [parishes, setParishes] = useState<Parish[]>([]);
  const [selectedParishId, setSelectedParishId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filterGender, setFilterGender] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');

  const isDioceseAdmin = user?.role === UserRole.SUPER_ADMIN;
  const isViewer = user?.role === UserRole.VIEWER;
  const userParishId = user?.parish_id;

  useEffect(() => {
    const fetchParishes = async () => {
      try {
        if (!isDioceseAdmin && userParishId) {
          setSelectedParishId(userParishId);
          setParishes([]);
          return;
        }
        const data = await api.listParishes();
        setParishes(data);
        if (data.length > 0 && !selectedParishId) {
          setSelectedParishId(data[0].id);
        }
      } catch (err) {
        console.error('Failed to load parishes:', err);
      }
    };
    fetchParishes();
  }, []);

  const fetchMembers = async () => {
    if (!selectedParishId) return;

    setLoading(true);
    try {
      const data = await api.listMembers(selectedParishId);
      setMembers(data);
      setError(null);
    } catch (err) {
      setError('Failed to load members');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, [selectedParishId]);

  const filteredMembers = members.filter(member => {
    const matchesSearch =
      member.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.last_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.member_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (member.phone_number && member.phone_number.includes(searchQuery));

    const matchesGender = !filterGender || member.gender === filterGender;
    const matchesStatus = !filterStatus || (filterStatus === 'active' ? member.is_active : !member.is_active);

    return matchesSearch && matchesGender && matchesStatus;
  });

  const clearFilters = () => {
    setSearchQuery('');
    setFilterGender('');
    setFilterStatus('');
  };

  const hasActiveFilters = searchQuery || filterGender || filterStatus;

  const handleCreate = () => {
    setSelectedMember(undefined);
    setIsModalOpen(true);
  };

  const handleEdit = (member: Member) => {
    setSelectedMember(member);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this member?')) {
      try {
        await api.deleteMember(id);
        setMembers(members.filter(m => m.id !== id));
      } catch (err) {
        console.error('Failed to delete member:', err);
        alert('Failed to delete member');
      }
    }
  };

  const handleSubmit = async (data: CreateMemberRequest | UpdateMemberRequest) => {
    try {
      if (selectedMember) {
        await api.updateMember(selectedMember.id, data as UpdateMemberRequest);
      } else {
        await api.createMember(data as CreateMemberRequest);
      }
      await fetchMembers();
      setIsModalOpen(false);
    } catch (err) {
      console.error('Failed to save member:', err);
      alert('Failed to save member');
    }
  };

  const handleBulkDelete = async (items: Member[]) => {
    for (const m of items) {
      try { await api.deleteMember(m.id); } catch { /* skip */ }
    }
    await fetchMembers();
  };

  const handleBulkExport = (items: Member[]) => {
    const headers = ['Member Code', 'First Name', 'Middle Name', 'Last Name', 'Gender', 'Phone', 'Address', 'Status'];
    const rows = items.map(m => [m.member_code, m.first_name, m.middle_name || '', m.last_name, m.gender || '', m.phone_number || '', m.physical_address || '', m.is_active ? 'Active' : 'Inactive']);
    const csv = [headers.join(','), ...rows.map(r => r.map(c => `"${c}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'members_export.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  const memberColumns: Column<Member>[] = useMemo(() => [
    {
      key: 'member',
      header: 'Member',
      sortable: true,
      sortKey: (m) => `${m.first_name} ${m.last_name}`,
      render: (m) => (
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 flex-shrink-0 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 font-bold text-sm overflow-hidden">
            {m.photo_url ? (
              <img src={m.photo_url.startsWith('http') ? m.photo_url : `http://localhost:3000${m.photo_url}`} alt="" className="h-9 w-9 rounded-full object-cover" />
            ) : (
              m.first_name[0]
            )}
          </div>
          <div className="min-w-0">
            <Link to={`/members/${m.id}`} className="text-sm font-medium text-gray-900 hover:text-primary-600 hover:underline truncate block" onClick={e => e.stopPropagation()}>
              {m.first_name} {m.middle_name ? m.middle_name + ' ' : ''}{m.last_name}
            </Link>
            <span className="text-xs text-gray-500">{m.member_code}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'gender',
      header: 'Gender',
      sortable: true,
      sortKey: (m) => m.gender || '',
      render: (m) => <span className="text-sm text-gray-700">{m.gender || '-'}</span>,
    },
    {
      key: 'phone',
      header: 'Phone',
      render: (m) => <span className="text-sm text-gray-700 whitespace-nowrap">{m.phone_number || '-'}</span>,
    },
    {
      key: 'address',
      header: 'Address',
      render: (m) => m.physical_address ? (
        <div className="flex items-center gap-1 text-sm text-gray-500">
          <MapPin size={12} className="flex-shrink-0" />
          <span className="truncate max-w-[160px]">{m.physical_address}</span>
        </div>
      ) : <span className="text-gray-400">-</span>,
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      sortKey: (m) => m.is_active ? 1 : 0,
      render: (m) => (
        <span className={`px-2 py-0.5 text-xs font-medium rounded-full whitespace-nowrap ${m.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {m.is_active ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    ...(!isViewer ? [{
      key: 'actions',
      header: 'Actions',
      className: 'text-right',
      headerClassName: 'text-right',
      render: (m: Member) => (
        <div className="flex items-center justify-end gap-1" onClick={e => e.stopPropagation()}>
          <button onClick={() => handleEdit(m)} className="p-1.5 text-primary-600 hover:bg-primary-50 rounded-md transition-colors" title="Edit">
            <Edit size={15} />
          </button>
          <button onClick={() => handleDelete(m.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-md transition-colors" title="Delete">
            <Trash2 size={15} />
          </button>
        </div>
      ),
    }] as Column<Member>[] : []),
  ], [isViewer]);

  const memberBulkActions: BulkAction<Member>[] = [
    { label: 'Export CSV', icon: <Download size={14} />, onClick: handleBulkExport },
    ...(!isViewer ? [{ label: 'Delete Selected', icon: <Trash2 size={14} />, onClick: handleBulkDelete, variant: 'danger' as const, requireConfirm: true, confirmMessage: 'Are you sure you want to delete the selected members?' }] : []),
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Members</h1>
        {!isViewer && (
          <button
            onClick={handleCreate}
            disabled={!selectedParishId}
            className="bg-primary-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus size={20} />
            Add Member
          </button>
        )}
      </div>

      {/* Search and Filter */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search members by name, code, or phone..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {isDioceseAdmin && parishes.length > 0 && (
            <div className="flex items-center gap-2">
              <Filter size={20} className="text-gray-400" />
              <select
                value={selectedParishId}
                onChange={(e) => setSelectedParishId(e.target.value)}
                className="border border-gray-200 rounded-lg py-2 px-4 focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
              >
                <option value="" disabled>Select Parish</option>
                {parishes.map(parish => (
                  <option key={parish.id} value={parish.id}>{parish.parish_name}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {showFilters && (
          <div className="flex flex-wrap gap-4 pt-4 border-t border-gray-100">
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">Gender:</label>
              <select
                value={filterGender}
                onChange={e => setFilterGender(e.target.value)}
                className="border border-gray-200 rounded-lg py-1.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
              >
                <option value="">All</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">Status:</label>
              <select
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
                className="border border-gray-200 rounded-lg py-1.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
              >
                <option value="">All</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
              >
                <X size={14} /> Clear filters
              </button>
            )}
          </div>
        )}

        <div className="flex items-center justify-between text-sm">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-1 text-gray-600 hover:text-gray-900"
          >
            <Filter size={14} />
            {showFilters ? 'Hide' : 'Show'} Filters
          </button>
          <span className="text-gray-500">
            Showing {filteredMembers.length} of {members.length} members
            {hasActiveFilters && ' (filtered)'}
          </span>
        </div>
      </div>

      {/* Member List */}
      {!selectedParishId ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-100">
          <p className="text-gray-500">Please select a parish to view members.</p>
        </div>
      ) : loading ? (
        <div className="text-center py-12 text-gray-500">Loading members...</div>
      ) : error ? (
        <div className="text-center py-12 text-red-500">{error}</div>
      ) : (
        <DataTable<Member>
          data={filteredMembers}
          columns={memberColumns}
          keyField="id"
          bulkActions={memberBulkActions}
          emptyIcon={<User size={24} />}
          emptyTitle="No members found"
          emptyMessage="Get started by adding a new member to this parish."
        />
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedMember ? 'Edit Member' : 'Add Member'}
      >
        <MemberForm
          initialData={selectedMember}
          parishId={selectedParishId}
          onCancel={() => setIsModalOpen(false)}
          onSubmit={handleSubmit}
        />
      </Modal>
    </div>
  );
};

export default Members;
