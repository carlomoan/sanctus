import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { Member, Parish, CreateMemberRequest, UpdateMemberRequest, UserRole, Family, Cluster, Scc } from '../types';
import { Plus, Search, User, MapPin, Edit, Trash2, Filter, X, Download, Upload, FileText } from 'lucide-react';
import Modal from '../components/Modal';
import MemberForm from '../components/MemberForm';
import DataTable, { Column, BulkAction } from '../components/DataTable';
import { useAuth } from '../context/AuthContext';
import { useParish } from '../context/ParishContext';
import { filterParishesByRole } from '../utils/parishFilters';

const Members = () => {
  const { user } = useAuth();
  const { getEffectiveParishId, activeParishId: _activeParishId, setActiveParish } = useParish();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filterGender, setFilterGender] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [showImportModal, setShowImportModal] = useState(false);
  const [selectedFamilyForImport, setSelectedFamilyForImport] = useState<string>('');

  // Cascading dropdown states
  const [selectedParish, setSelectedParish] = useState<string>('');
  const [selectedCluster, setSelectedCluster] = useState<string>('');
  const [selectedScc, setSelectedScc] = useState<string>('');
  const [selectedFamily, setSelectedFamily] = useState<string>('');

  // Data for dropdowns
  const [parishes, setParishes] = useState<Parish[]>([]);
  const [clusters, setClusters] = useState<Cluster[]>([]);
  const [sccs, setSccs] = useState<Scc[]>([]);
  const [families, setFamilies] = useState<Family[]>([]);
  const [members, setMembers] = useState<Member[]>([]);

  const isDioceseAdmin = user?.role === UserRole.SUPER_ADMIN;
  const isViewer = user?.role === UserRole.VIEWER;

  // Fetch parishes on mount
  useEffect(() => {
    const fetchParishes = async () => {
      try {
        const allParishes = await api.listParishes();
        const accessibleParishes = filterParishesByRole(allParishes, user);
        setParishes(accessibleParishes);

        // Auto-select parish for non-super admins
        if (!isDioceseAdmin && accessibleParishes.length > 0) {
          setSelectedParish(accessibleParishes[0].id);
        }
      } catch (err) {
        console.error('Failed to load parishes:', err);
      }
    };
    fetchParishes();
  }, [user, isDioceseAdmin]);

  // Fetch clusters when parish is selected
  useEffect(() => {
    if (selectedParish) {
      const fetchClusters = async () => {
        try {
          const data = await api.listClusters(selectedParish);
          setClusters(data);
          setSelectedCluster('');
          setSelectedScc('');
          setSelectedFamily('');
          setSccs([]);
          setFamilies([]);
          setMembers([]);
        } catch (err) {
          console.error('Failed to load clusters:', err);
        }
      };
      fetchClusters();
    }
  }, [selectedParish]);

  // Fetch SCCs when cluster is selected
  useEffect(() => {
    if (selectedCluster) {
      const fetchSccs = async () => {
        try {
          const data = await api.listSccs(selectedParish);
          setSccs(data.filter(s => s.cluster_id === selectedCluster));
          setSelectedScc('');
          setSelectedFamily('');
          setFamilies([]);
          setMembers([]);
        } catch (err) {
          console.error('Failed to load SCCs:', err);
        }
      };
      fetchSccs();
    }
  }, [selectedCluster, selectedParish]);

  // Fetch families when SCC is selected
  useEffect(() => {
    if (selectedScc) {
      const fetchFamilies = async () => {
        try {
          const data = await api.listFamilies(selectedParish);
          setFamilies(data.filter(f => f.scc_id === selectedScc));
          setSelectedFamily('');
          setMembers([]);
        } catch (err) {
          console.error('Failed to load families:', err);
        }
      };
      fetchFamilies();
    }
  }, [selectedScc, selectedParish]);

  // Fetch members when any selection is made
  useEffect(() => {
    const fetchMembers = async () => {
      if (!selectedParish) {
        setMembers([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        let memberData = await api.listMembers(selectedParish);

        // Filter based on the deepest selection made
        if (selectedFamily) {
          // Show family members
          memberData = memberData.filter(m => m.family_id === selectedFamily);
        } else if (selectedScc) {
          // Show SCC members (all families in this SCC)
          const sccFamilies = families.filter(f => f.scc_id === selectedScc);
          const familyIds = sccFamilies.map(f => f.id);
          memberData = memberData.filter(m => m.family_id && familyIds.includes(m.family_id));
        } else if (selectedCluster) {
          // Show cluster members (all SCCs and families in this cluster)
          const clusterSccs = sccs.filter(s => s.cluster_id === selectedCluster);
          const sccFamilyIds = families
            .filter(f => clusterSccs.some(s => s.id === f.scc_id))
            .map(f => f.id);
          memberData = memberData.filter(m => m.family_id && sccFamilyIds.includes(m.family_id));
        }
        // else: show all parish members (already filtered by parish)

        setMembers(memberData);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch members:', err);
        setError('Failed to load members');
      } finally {
        setLoading(false);
      }
    };

    fetchMembers();
  }, [selectedParish, selectedCluster, selectedScc, selectedFamily, families, sccs]);

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
    if (!selectedParish) {
      alert('Please select a parish first before adding a member');
      return;
    }
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
      // Refresh members list at current level
      if (selectedParish) {
        let memberData = await api.listMembers(selectedParish);

        // Apply the same filtering logic as in the useEffect
        if (selectedFamily) {
          memberData = memberData.filter(m => m.family_id === selectedFamily);
        } else if (selectedScc) {
          const sccFamilies = families.filter(f => f.scc_id === selectedScc);
          const familyIds = sccFamilies.map(f => f.id);
          memberData = memberData.filter(m => m.family_id && familyIds.includes(m.family_id));
        } else if (selectedCluster) {
          const clusterSccs = sccs.filter(s => s.cluster_id === selectedCluster);
          const sccFamilyIds = families
            .filter(f => clusterSccs.some(s => s.id === f.scc_id))
            .map(f => f.id);
          memberData = memberData.filter(m => m.family_id && sccFamilyIds.includes(m.family_id));
        }

        setMembers(memberData);
      }
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
    // Trigger refresh by updating the selected parish
    const currentParishId = getEffectiveParishId();
    if (currentParishId) {
      setActiveParish(null);
      setTimeout(() => setActiveParish(currentParishId), 100);
    }
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
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Members</h1>
          {/* Cascading Dropdowns */}
          <div className="mt-3 flex flex-wrap gap-2">
            {/* Parish Dropdown */}
            {isDioceseAdmin && (
              <select
                value={selectedParish}
                onChange={(e) => setSelectedParish(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Select Parish</option>
                {parishes.filter(p => p.is_active).map(parish => (
                  <option key={parish.id} value={parish.id}>{parish.parish_name}</option>
                ))}
              </select>
            )}

            {/* Cluster Dropdown */}
            <select
              value={selectedCluster}
              onChange={(e) => setSelectedCluster(e.target.value)}
              disabled={!selectedParish}
              className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50"
            >
              <option value="">Select Cluster</option>
              {clusters.map(cluster => (
                <option key={cluster.id} value={cluster.id}>{cluster.cluster_name}</option>
              ))}
            </select>

            {/* SCC Dropdown */}
            <select
              value={selectedScc}
              onChange={(e) => setSelectedScc(e.target.value)}
              disabled={!selectedCluster}
              className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50"
            >
              <option value="">Select SCC</option>
              {sccs.map(scc => (
                <option key={scc.id} value={scc.id}>{scc.scc_name}</option>
              ))}
            </select>

            {/* Family Dropdown */}
            <select
              value={selectedFamily}
              onChange={(e) => setSelectedFamily(e.target.value)}
              disabled={!selectedScc}
              className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50"
            >
              <option value="">Select Family</option>
              {families.map(family => (
                <option key={family.id} value={family.id}>{family.family_name}</option>
              ))}
            </select>
          </div>
        </div>
        {!isViewer && (
          <div className="flex gap-2">
            <button
              onClick={() => {
                if (families.length === 0) {
                  alert('Please create families first before importing members');
                  return;
                }
                setShowImportModal(true);
              }}
              className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-700 transition-colors"
            >
              <Upload size={20} />
              Import Members
            </button>
            <button
              onClick={handleCreate}
              disabled={!selectedParish}
              className="bg-primary-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus size={20} />
              Add Member
            </button>
          </div>
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
                value={selectedParish}
                onChange={(e) => setSelectedParish(e.target.value)}
                className="border border-gray-200 rounded-lg py-2 px-4 focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
              >
                <option value="" disabled>Select Parish</option>
                {parishes.filter(p => p.is_active).map(parish => (
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
      {!selectedParish ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-100">
          <User size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Parish to View Members</h3>
          <p className="text-gray-500">
            {isDioceseAdmin ? 'Please select a parish to view its members.' : 'Please select a parish from the context menu.'}
          </p>
        </div>
      ) : loading ? (
        <div className="text-center py-12 text-gray-500">Loading members...</div>
      ) : error ? (
        <div className="text-center py-12 text-red-500">{error}</div>
      ) : (
        <div>
          {/* Context Header */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <div className="flex items-center gap-2">
              <User size={20} className="text-blue-600" />
              <span className="text-sm font-medium text-blue-800">
                Showing members for:
                <span className="font-bold">
                  {selectedFamily ? ` ${families.find(f => f.id === selectedFamily)?.family_name}` :
                    selectedScc ? ` ${sccs.find(s => s.id === selectedScc)?.scc_name}` :
                      selectedCluster ? ` ${clusters.find(c => c.id === selectedCluster)?.cluster_name}` :
                        ` ${parishes.find(p => p.id === selectedParish)?.parish_name}`}
                </span>
                {selectedFamily && ` (Family)`}
                {selectedScc && !selectedFamily && ` (SCC)`}
                {selectedCluster && !selectedScc && ` (Cluster)`}
                {!selectedCluster && ` (Parish)`}
              </span>
            </div>
            <p className="text-xs text-blue-700 mt-1">
              {selectedFamily ? 'Members of this specific family' :
                selectedScc ? 'All members from all families in this SCC' :
                  selectedCluster ? 'All members from all SCCs and families in this cluster' :
                    'All members in this parish'}
            </p>
          </div>

          {/* Members Table */}
          <DataTable<Member>
            data={filteredMembers}
            columns={memberColumns}
            keyField="id"
            bulkActions={memberBulkActions}
            emptyIcon={<User size={24} />}
            emptyTitle="No members found"
            emptyMessage={`No members found${selectedFamily ? ' in this family' : selectedScc ? ' in this SCC' : selectedCluster ? ' in this cluster' : ' in this parish'}.`}
          />
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedMember ? 'Edit Member' : 'Add Member'}
      >
        <MemberForm
          initialData={selectedMember}
          parishId={selectedParish}
          onCancel={() => setIsModalOpen(false)}
          onSubmit={handleSubmit}
        />
      </Modal>

      {/* Member Import Selection Modal */}
      <Modal
        isOpen={showImportModal}
        onClose={() => { setShowImportModal(false); setSelectedFamilyForImport(''); }}
        title="Import Members - Select Family"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Select the family for which you want to import members:
          </p>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Family *</label>
            <select
              value={selectedFamilyForImport}
              onChange={(e) => setSelectedFamilyForImport(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm border p-2"
              required
            >
              <option value="">Select Family</option>
              {families.map(f => (
                <option key={f.id} value={f.id}>{f.family_name} ({f.family_code})</option>
              ))}
            </select>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <FileText size={16} className="text-blue-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-800">Template Format</p>
                <p className="text-xs text-blue-700 mt-1">
                  Your CSV file should include these columns: <code>first_name, last_name, member_code, gender, date_of_birth, phone_number, email, physical_address, role, is_active</code>
                </p>
                <button
                  onClick={() => {
                    const csv = 'first_name,last_name,member_code,gender,date_of_birth,phone_number,email,physical_address,role,is_active\n';
                    const blob = new Blob([csv], { type: 'text/csv' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'members_template.csv';
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                  className="text-xs text-blue-600 hover:text-blue-800 underline mt-2"
                >
                  Download Template
                </button>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              onClick={() => { setShowImportModal(false); setSelectedFamilyForImport(''); }}
              className="px-4 py-2 border rounded-md text-sm text-gray-700"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                if (!selectedFamilyForImport) {
                  alert('Please select a family');
                  return;
                }
                // Trigger actual file selection
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = '.csv,.xlsx';
                input.onchange = async (e) => {
                  const file = (e.target as HTMLInputElement).files?.[0];
                  if (file) {
                    try {
                      const family = families.find(f => f.id === selectedFamilyForImport);
                      if (!family) return;
                      const res = await api.importMembers(file, family.parish_id);
                      // Trigger refresh by updating the selected parish
                      const currentParishId = getEffectiveParishId();
                      if (currentParishId) {
                        setActiveParish(null);
                        setTimeout(() => setActiveParish(currentParishId), 100);
                      }
                      alert(`Successfully imported ${res.success_count} members${res.errors.length > 0 ? `. ${res.errors.length} errors occurred.` : ''}`);
                    } catch (err: any) {
                      alert('Import failed: ' + err.message);
                    }
                  }
                };
                input.click();
                setShowImportModal(false);
                setSelectedFamilyForImport('');
              }}
              className="px-4 py-2 rounded-md text-sm text-white bg-primary-600 hover:bg-primary-700"
            >
              Next: Select File
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Members;
