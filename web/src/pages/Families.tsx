import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { api } from '../api/client';
import { Family, CreateFamilyRequest, Parish, Scc, Member, CreateMemberRequest, FamilyRole, GenderType, MaritalStatus, UserRole } from '../types';
import { Plus, Users, Edit, Trash2, ChevronDown, ChevronRight, UserPlus, Search, Upload, FileText } from 'lucide-react';
import Modal from '../components/Modal';
import { useForm } from 'react-hook-form';
import { useAuth } from '../context/AuthContext';
import { useParish } from '../context/ParishContext';

const cls = "mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm border p-2";

const Families = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { getEffectiveParishId, activeParishId, setActiveParish } = useParish();
  const [searchParams] = useSearchParams();
  const preSelectedSccId = searchParams.get('scc');

  // Get parish ID from context
  const parishId = getEffectiveParishId();
  const userParishId = user?.parish_id; // For parish admins

  const [families, setFamilies] = useState<Family[]>([]);
  const [parishes, setParishes] = useState<Parish[]>([]);
  const [sccs, setSccs] = useState<Scc[]>([]);
  const [allMembers, setAllMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [selected, setSelected] = useState<Family | undefined>();
  const [expandedFamily, setExpandedFamily] = useState<string | null>(null);
  const [memberTargetFamily, setMemberTargetFamily] = useState<Family | null>(null);
  const [editingMember, setEditingMember] = useState<Member | undefined>();
  const [searchQuery, setSearchQuery] = useState('');
  const [showImportModal, setShowImportModal] = useState(false);
  const [selectedSccForImport, setSelectedSccForImport] = useState<string>('');

  const isDioceseAdmin = user?.role === UserRole.SUPER_ADMIN;
  const isViewer = user?.role === UserRole.VIEWER;

  const fetchData = async () => {
    try {
      if (!parishId) {
        // No parish selected - clear data and only load parishes for diocese admin
        setFamilies([]);
        setSccs([]);
        setAllMembers([]);
        if (isDioceseAdmin) {
          const p = await api.listParishes();
          setParishes(p);
        } else {
          setParishes([]);
        }
        return;
      }

      const [f, p, s, m] = await Promise.all([
        api.listFamilies(parishId),
        isDioceseAdmin ? api.listParishes() : Promise.resolve([]),
        api.listSccs(parishId),
        api.listMembers(parishId),
      ]);
      setFamilies(f);
      setParishes(p);
      setSccs(s);
      setAllMembers(m);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };
  useEffect(() => { fetchData(); }, [parishId]);

  const handleFamilySubmit = async (data: any) => {
    try {
      // Always ensure parish_id is set
      if (!data.parish_id) {
        if (isDioceseAdmin && activeParishId) {
          data.parish_id = activeParishId;
        } else if (userParishId) {
          data.parish_id = userParishId;
        } else {
          throw new Error('Parish is required');
        }
      }

      console.log('Submitting family data:', data);

      if (selected) await api.updateFamily(selected.id, data);
      else await api.createFamily(data);
      await fetchData(); setIsModalOpen(false);
    } catch (e) {
      console.error('Failed to save family:', e);
      alert('Failed to save family: ' + (e as Error).message);
    }
  };

  const handleMemberSubmit = async (data: CreateMemberRequest) => {
    try {
      if (editingMember) {
        await api.updateMember(editingMember.id, data);
      } else {
        await api.createMember(data);
      }
      await fetchData();
      setIsMemberModalOpen(false);
      setEditingMember(undefined);
    } catch (e) { alert('Failed to save member'); }
  };

  const handleDeleteFamily = async (id: string) => {
    if (!confirm('Delete this family and unlink all its members?')) return;
    try { await api.deleteFamily(id); await fetchData(); } catch (e) { alert('Failed'); }
  };

  const handleDeleteMember = async (id: string) => {
    if (!confirm('Delete this member?')) return;
    try { await api.deleteMember(id); await fetchData(); } catch (e) { alert('Failed'); }
  };

  const getFamilyMembers = (fid: string) => allMembers.filter(m => m.family_id === fid);
  const getSccName = (sid?: string) => sccs.find(s => s.id === sid)?.scc_name || '-';
  const getParishName = (pid: string) => parishes.find(p => p.id === pid)?.parish_name || '-';

  const filteredFamilies = families.filter(f =>
    f.family_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.family_code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const openAddMember = (family: Family) => {
    setMemberTargetFamily(family);
    setEditingMember(undefined);
    setIsMemberModalOpen(true);
  };

  const openEditMember = (member: Member, family: Family) => {
    setMemberTargetFamily(family);
    setEditingMember(member);
    setIsMemberModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('families.title')}</h1>
          {isDioceseAdmin && parishes.length > 0 && (
            <div className="mt-2">
              <select
                value={activeParishId || ''}
                onChange={(e) => setActiveParish(e.target.value || null)}
                className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">{t('families.allParishes')}</option>
                {parishes.map(parish => (
                  <option key={parish.id} value={parish.id}>{parish.parish_name}</option>
                ))}
              </select>
            </div>
          )}
        </div>
        <div className="flex gap-2 items-center">
          {!isViewer && (
            <>
              <button
                onClick={() => {
                  if (sccs.length === 0) {
                    alert(t('families.createSccsFirst'));
                    return;
                  }
                  setShowImportModal(true);
                }}
                className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-700"
              >
                <Upload size={20} />
                {t('families.importFamilies')}
              </button>
              <button onClick={() => { setSelected(undefined); setIsModalOpen(true); }} className="bg-primary-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-primary-700">
                <Plus size={20} />{t('families.addFamily')}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder={t('families.searchFamilies')}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <div className="mt-2 text-sm text-gray-500">
          {t('families.showingCount', { count: filteredFamilies.length, total: families.length })}
        </div>
      </div>

      {/* Family List */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      ) : filteredFamilies.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-100">
          <Users className="mx-auto text-gray-300 mb-4" size={32} />
          <h3 className="text-lg font-medium text-gray-900">{t('families.noFamiliesFound')}</h3>
          <p className="text-gray-500 mt-1">{t('families.getStarted')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredFamilies.map(f => {
            const isExpanded = expandedFamily === f.id;
            const familyMembers = getFamilyMembers(f.id);
            return (
              <div key={f.id} className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                {/* Family Header Row */}
                <div
                  className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => setExpandedFamily(isExpanded ? null : f.id)}
                >
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="text-gray-400">
                      {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900 truncate">{f.family_name}</h3>
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{f.family_code}</span>
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                        {isDioceseAdmin && <span>{getParishName(f.parish_id)}</span>}
                        <span>{t('families.scc')}: {getSccName(f.scc_id)}</span>
                        <span className="flex items-center gap-1"><Users size={14} />{familyMembers.length} {t('families.members')}</span>
                        {f.primary_phone && <span>{f.primary_phone}</span>}
                      </div>
                    </div>
                  </div>
                  {!isViewer && (
                    <div className="flex items-center gap-2 ml-4" onClick={e => e.stopPropagation()}>
                      <button
                        onClick={() => openAddMember(f)}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-md transition-colors"
                        title={t('families.addFamilyMember')}
                      >
                        <UserPlus size={18} />
                      </button>
                      <button
                        onClick={() => { setSelected(f); setIsModalOpen(true); }}
                        className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-md transition-colors"
                        title={t('families.editFamily')}
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={() => handleDeleteFamily(f.id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                        title={t('families.deleteFamily')}
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  )}
                </div>

                {/* Expanded: Family Members */}
                {isExpanded && (
                  <div className="border-t border-gray-100 bg-gray-50">
                    {familyMembers.length === 0 ? (
                      <div className="p-6 text-center text-gray-500">
                        <p className="text-sm">No members in this family yet.</p>
                        {!isViewer && (
                          <button
                            onClick={() => openAddMember(f)}
                            className="mt-2 text-sm text-primary-600 hover:text-primary-700 font-medium"
                          >
                            + Add first family member
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="divide-y divide-gray-100">
                        <div className="grid grid-cols-12 gap-4 px-6 py-2 text-xs font-medium text-gray-500 uppercase bg-gray-100">
                          <div className="col-span-3">Name</div>
                          <div className="col-span-2">Role</div>
                          <div className="col-span-2">Gender</div>
                          <div className="col-span-2">Phone</div>
                          <div className="col-span-1">Status</div>
                          <div className="col-span-2 text-right">Actions</div>
                        </div>
                        {familyMembers.map(member => (
                          <div key={member.id} className="grid grid-cols-12 gap-4 px-6 py-3 items-center hover:bg-white transition-colors">
                            <div className="col-span-3">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 text-xs font-bold flex-shrink-0">
                                  {member.first_name[0]}{member.last_name[0]}
                                </div>
                                <div className="min-w-0">
                                  <p className="text-sm font-medium text-gray-900 truncate">{member.first_name} {member.last_name}</p>
                                  <p className="text-xs text-gray-500">{member.member_code}</p>
                                </div>
                              </div>
                            </div>
                            <div className="col-span-2">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${member.family_role === FamilyRole.HEAD ? 'bg-blue-100 text-blue-800' :
                                member.family_role === FamilyRole.SPOUSE ? 'bg-purple-100 text-purple-800' :
                                  'bg-gray-100 text-gray-700'
                                }`}>
                                {member.family_role || 'Member'}
                              </span>
                            </div>
                            <div className="col-span-2 text-sm text-gray-600">{member.gender || '-'}</div>
                            <div className="col-span-2 text-sm text-gray-600">{member.phone_number || '-'}</div>
                            <div className="col-span-1">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${member.is_active !== false ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                }`}>
                                {member.is_active !== false ? 'Active' : 'Inactive'}
                              </span>
                            </div>
                            <div className="col-span-2 text-right">
                              {!isViewer && (
                                <div className="flex items-center justify-end gap-1">
                                  <button
                                    onClick={() => openEditMember(member, f)}
                                    className="p-1 text-gray-400 hover:text-primary-600 rounded"
                                    title="Edit member"
                                  >
                                    <Edit size={14} />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteMember(member.id)}
                                    className="p-1 text-gray-400 hover:text-red-600 rounded"
                                    title="Remove member"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                        {!isViewer && (
                          <div className="px-6 py-3">
                            <button
                              onClick={() => openAddMember(f)}
                              className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
                            >
                              <UserPlus size={14} /> Add another member
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Family Create/Edit Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={selected ? 'Edit Family' : 'Add Family'}>
        <FamilyForm
          initialData={selected}
          parishes={parishes}
          sccs={sccs}
          userParishId={isDioceseAdmin ? undefined : userParishId}
          activeParishId={activeParishId || undefined}
          preSelectedSccId={preSelectedSccId || undefined}
          onSubmit={handleFamilySubmit}
          onCancel={() => setIsModalOpen(false)}
        />
      </Modal>

      {/* Member Create/Edit Modal */}
      <Modal
        isOpen={isMemberModalOpen}
        onClose={() => { setIsMemberModalOpen(false); setEditingMember(undefined); }}
        title={editingMember ? `Edit Member — ${memberTargetFamily?.family_name}` : `Add Member to ${memberTargetFamily?.family_name}`}
      >
        {memberTargetFamily && (
          <FamilyMemberForm
            family={memberTargetFamily}
            initialData={editingMember}
            parishId={memberTargetFamily.parish_id}
            onSubmit={handleMemberSubmit}
            onCancel={() => { setIsMemberModalOpen(false); setEditingMember(undefined); }}
          />
        )}
      </Modal>

      {/* Family Import Selection Modal */}
      <Modal
        isOpen={showImportModal}
        onClose={() => { setShowImportModal(false); setSelectedSccForImport(''); }}
        title="Import Families - Select SCC"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Select the SCC for which you want to import families:
          </p>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">SCC *</label>
            <select
              value={selectedSccForImport}
              onChange={(e) => setSelectedSccForImport(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm border p-2"
              required
            >
              <option value="">Select SCC</option>
              {sccs.map(s => (
                <option key={s.id} value={s.id}>{s.scc_name} ({s.scc_code})</option>
              ))}
            </select>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <FileText size={16} className="text-blue-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-800">Template Format</p>
                <p className="text-xs text-blue-700 mt-1">
                  Your CSV file should include these columns: <code>family_code, family_name, scc_code, physical_address, primary_phone, email, notes</code>
                </p>
                <button
                  onClick={() => {
                    const csv = 'family_code,family_name,scc_code,physical_address,primary_phone,email,notes\n';
                    const blob = new Blob([csv], { type: 'text/csv' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'families_template.csv';
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
              onClick={() => { setShowImportModal(false); setSelectedSccForImport(''); }}
              className="px-4 py-2 border rounded-md text-sm text-gray-700"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                if (!selectedSccForImport) {
                  alert('Please select an SCC');
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
                      const scc = sccs.find(s => s.id === selectedSccForImport);
                      if (!scc) return;
                      const res = await api.importFamilies(file, scc.parish_id);
                      await fetchData();
                      alert(`Successfully imported ${res.success_count} families${res.errors.length > 0 ? `. ${res.errors.length} errors occurred.` : ''}`);
                    } catch (err: any) {
                      alert('Import failed: ' + err.message);
                    }
                  }
                };
                input.click();
                setShowImportModal(false);
                setSelectedSccForImport('');
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

/* ─── Family Form ─── */
interface FamilyFormProps {
  initialData?: Family;
  parishes: Parish[];
  sccs: Scc[];
  userParishId?: string;
  activeParishId?: string;
  preSelectedSccId?: string;
  onSubmit: (d: any) => Promise<void>;
  onCancel: () => void;
}

const FamilyForm = ({ initialData, parishes, sccs, userParishId, activeParishId, preSelectedSccId, onSubmit, onCancel }: FamilyFormProps) => {
  const { register, handleSubmit, formState: { errors, isSubmitting }, reset, watch, setValue } = useForm<CreateFamilyRequest>();
  const [formSccs, setFormSccs] = useState<Scc[]>(sccs);
  const selectedParishId = watch('parish_id');

  // Load SCCs when parish selection changes
  useEffect(() => {
    const loadSccs = async () => {
      console.log('FamilyForm loadSccs called with selectedParishId:', selectedParishId);
      if (selectedParishId) {
        try {
          console.log('Fetching SCCs for parish:', selectedParishId);
          const sccData = await api.listSccs(selectedParishId);
          console.log('SCCs loaded:', sccData);
          console.log('SCC details:', sccData.map(s => ({ id: s.id, scc_name: s.scc_name })));
          setFormSccs(sccData);

          // If we have a pre-selected SCC and it's in the loaded list, set the form value
          if (preSelectedSccId && sccData.some(s => s.id === preSelectedSccId)) {
            console.log('Setting pre-selected SCC value:', preSelectedSccId);
            setValue('scc_id', preSelectedSccId);
          }
        } catch (error) {
          console.error('Failed to load SCCs:', error);
          setFormSccs([]);
        }
      } else {
        console.log('No parish selected, clearing SCCs');
        setFormSccs([]);
      }
    };

    loadSccs();
  }, [selectedParishId, preSelectedSccId, setValue]);

  useEffect(() => {
    console.log('FamilyForm initialization:', {
      initialData,
      userParishId,
      activeParishId,
      preSelectedSccId,
      initialSccs: sccs
    });
    if (initialData) {
      console.log('Resetting form with existing data');
      reset({
        family_name: initialData.family_name,
        family_code: initialData.family_code,
        parish_id: initialData.parish_id,
        scc_id: initialData.scc_id || '' as any,
        physical_address: initialData.physical_address || '',
        primary_phone: initialData.primary_phone || '',
        email: initialData.email || '',
      });
    } else if (userParishId || activeParishId) {
      console.log('Resetting form with new data, parish:', userParishId || activeParishId);
      reset({
        parish_id: userParishId || activeParishId,
        scc_id: preSelectedSccId || '' as any
      });
    } else {
      console.log('No initial parish data available');
    }
  }, [initialData, reset, userParishId, activeParishId, preSelectedSccId, sccs]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Family Name *</label>
          <input {...register('family_name', { required: 'Required' })} className={cls} placeholder="e.g. The Mwangi Family" />
          {errors.family_name && <p className="text-red-500 text-xs mt-1">{errors.family_name.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Family Code *</label>
          <input {...register('family_code', { required: 'Required' })} disabled={!!initialData} className={cls + " disabled:bg-gray-100"} placeholder="e.g. FAM-001" />
          {errors.family_code && <p className="text-red-500 text-xs mt-1">{errors.family_code.message}</p>}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        {activeParishId ? (
          <input type="hidden" {...register('parish_id')} value={activeParishId} />
        ) : userParishId ? (
          <input type="hidden" {...register('parish_id')} value={userParishId} />
        ) : (
          <div>
            <label className="block text-sm font-medium text-gray-700">Parish *</label>
            <select {...register('parish_id', { required: 'Required' })} className={cls}>
              <option value="">Select Parish</option>
              {parishes.map(p => <option key={p.id} value={p.id}>{p.parish_name}</option>)}
            </select>
          </div>
        )}
        <div>
          <label className="block text-sm font-medium text-gray-700">SCC *</label>
          <select
            {...register('scc_id', { required: 'SCC is required' })}
            disabled={!!preSelectedSccId && formSccs.some(s => s.id === preSelectedSccId)}
            className={cls + (!!preSelectedSccId && formSccs.some(s => s.id === preSelectedSccId) ? ' disabled:bg-gray-100' : '')}
          >
            <option value="">Select SCC</option>
            {formSccs.map(s => (
              <option key={s.id} value={s.id}>{s.scc_name}</option>
            ))}
          </select>
          {errors.scc_id && <p className="text-red-500 text-xs mt-1">{errors.scc_id.message}</p>}
          {preSelectedSccId && formSccs.some(s => s.id === preSelectedSccId) && (
            <p className="text-xs text-gray-500 mt-1">
              SCC pre-selected: {formSccs.find(s => s.id === preSelectedSccId)?.scc_name}
            </p>
          )}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Phone</label>
          <input {...register('primary_phone')} className={cls} placeholder="+255..." />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Email</label>
          <input {...register('email')} type="email" className={cls} />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Physical Address</label>
        <textarea {...register('physical_address')} rows={2} className={cls} />
      </div>
      <div className="flex justify-end gap-3 pt-4 border-t">
        <button type="button" onClick={onCancel} className="px-4 py-2 border rounded-md text-sm text-gray-700 hover:bg-gray-50">Cancel</button>
        <button type="submit" disabled={isSubmitting} className="px-4 py-2 rounded-md text-sm text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50">
          {isSubmitting ? 'Saving...' : (initialData ? 'Update Family' : 'Create Family')}
        </button>
      </div>
    </form>
  );
};

/* ─── Family Member Form (inline member creation within a family) ─── */
interface FamilyMemberFormProps {
  family: Family;
  initialData?: Member;
  parishId: string;
  onSubmit: (d: CreateMemberRequest) => Promise<void>;
  onCancel: () => void;
}

const FamilyMemberForm = ({ family, initialData, parishId, onSubmit, onCancel }: FamilyMemberFormProps) => {
  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<CreateMemberRequest>({
    defaultValues: {
      parish_id: parishId,
      family_id: family.id,
      family_role: FamilyRole.MEMBER,
      gender: GenderType.MALE,
      marital_status: MaritalStatus.SINGLE,
    },
  });

  useEffect(() => {
    if (initialData) {
      reset({
        parish_id: parishId,
        family_id: family.id,
        member_code: initialData.member_code,
        first_name: initialData.first_name,
        middle_name: initialData.middle_name || '',
        last_name: initialData.last_name,
        date_of_birth: initialData.date_of_birth || '',
        gender: initialData.gender || GenderType.MALE,
        marital_status: initialData.marital_status || MaritalStatus.SINGLE,
        national_id: initialData.national_id || '',
        occupation: initialData.occupation || '',
        email: initialData.email || '',
        phone_number: initialData.phone_number || '',
        physical_address: initialData.physical_address || family.physical_address || '',
        family_role: initialData.family_role || FamilyRole.MEMBER,
      });
    } else {
      reset({
        parish_id: parishId,
        family_id: family.id,
        family_role: FamilyRole.MEMBER,
        gender: GenderType.MALE,
        marital_status: MaritalStatus.SINGLE,
        physical_address: family.physical_address || '',
      });
    }
  }, [initialData, family, parishId, reset]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Family Role — prominent at top */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <label className="block text-sm font-semibold text-blue-800 mb-2">Role in Family *</label>
        <div className="flex gap-3">
          {Object.values(FamilyRole).map(role => (
            <label key={role} className="flex items-center gap-2 cursor-pointer">
              <input type="radio" {...register('family_role', { required: true })} value={role} className="text-primary-600" />
              <span className="text-sm font-medium text-blue-900">{role}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">First Name *</label>
          <input {...register('first_name', { required: 'Required' })} className={cls} />
          {errors.first_name && <p className="text-red-500 text-xs mt-1">{errors.first_name.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Middle Name</label>
          <input {...register('middle_name')} className={cls} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Last Name *</label>
          <input {...register('last_name', { required: 'Required' })} className={cls} />
          {errors.last_name && <p className="text-red-500 text-xs mt-1">{errors.last_name.message}</p>}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Member Code *</label>
        <input {...register('member_code', { required: 'Required' })} disabled={!!initialData} className={cls + " disabled:bg-gray-100"} placeholder="e.g. MEM-2026-001" />
        {errors.member_code && <p className="text-red-500 text-xs mt-1">{errors.member_code.message}</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Date of Birth</label>
          <input type="date" {...register('date_of_birth')} className={cls} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Gender</label>
          <select {...register('gender')} className={cls}>
            {Object.values(GenderType).map(g => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Marital Status</label>
          <select {...register('marital_status')} className={cls}>
            {Object.values(MaritalStatus).map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Phone</label>
          <input {...register('phone_number')} className={cls} placeholder="+255..." />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Email</label>
          <input {...register('email')} type="email" className={cls} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">National ID</label>
          <input {...register('national_id')} className={cls} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Occupation</label>
          <input {...register('occupation')} className={cls} />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Physical Address</label>
        <textarea {...register('physical_address')} rows={2} className={cls} />
      </div>

      <input type="hidden" {...register('parish_id')} />
      <input type="hidden" {...register('family_id')} />

      <div className="flex justify-end gap-3 pt-4 border-t">
        <button type="button" onClick={onCancel} className="px-4 py-2 border rounded-md text-sm text-gray-700 hover:bg-gray-50">Cancel</button>
        <button type="submit" disabled={isSubmitting} className="px-4 py-2 rounded-md text-sm text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50">
          {isSubmitting ? 'Saving...' : (initialData ? 'Update Member' : 'Add Member')}
        </button>
      </div>
    </form>
  );
};

export default Families;
