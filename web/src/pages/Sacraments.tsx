import { useState, useEffect, useMemo } from 'react';
import { api } from '../api/client';
import { SacramentRecord, Parish, CreateSacramentRequest, UpdateSacramentRequest, UserRole } from '../types';
import { Plus, Search, Filter, Calendar, Edit, Trash2, Scroll, Download } from 'lucide-react';
import Modal from '../components/Modal';
import SacramentForm from '../components/SacramentForm';
import DataTable, { Column, BulkAction } from '../components/DataTable';
import { useAuth } from '../context/AuthContext';

const Sacraments = () => {
  const { user } = useAuth();
  const isDioceseAdmin = user?.role === UserRole.SUPER_ADMIN;
  const isViewer = user?.role === UserRole.VIEWER;
  const userParishId = user?.parish_id;

  const [sacraments, setSacraments] = useState<SacramentRecord[]>([]);
  const [parishes, setParishes] = useState<Parish[]>([]);
  const [selectedParishId, setSelectedParishId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSacrament, setSelectedSacrament] = useState<SacramentRecord | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState('');

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

  const fetchSacraments = async () => {
    if (!selectedParishId) return;

    setLoading(true);
    try {
      const data = await api.listSacraments(undefined, selectedParishId);
      setSacraments(data);
      setError(null);
    } catch (err) {
      setError('Failed to load sacraments');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSacraments();
  }, [selectedParishId]);

  const handleCreate = () => {
    setSelectedSacrament(undefined);
    setIsModalOpen(true);
  };

  const handleEdit = (sacrament: SacramentRecord) => {
    setSelectedSacrament(sacrament);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this sacrament record?')) {
      try {
        await api.deleteSacrament(id);
        setSacraments(sacraments.filter(s => s.id !== id));
      } catch (err) {
        console.error('Failed to delete sacrament:', err);
        alert('Failed to delete sacrament record');
      }
    }
  };

  const handleSubmit = async (data: CreateSacramentRequest | UpdateSacramentRequest) => {
    try {
      if (selectedSacrament) {
        await api.updateSacrament(selectedSacrament.id, data as UpdateSacramentRequest);
      } else {
        await api.createSacrament(data as CreateSacramentRequest);
      }
      await fetchSacraments();
      setIsModalOpen(false);
    } catch (err) {
      console.error('Failed to save sacrament:', err);
      alert('Failed to save sacrament record');
    }
  };

  const handleBulkDelete = async (items: SacramentRecord[]) => {
    for (const s of items) {
      try { await api.deleteSacrament(s.id); } catch { /* skip */ }
    }
    await fetchSacraments();
  };

  const handleBulkExport = (items: SacramentRecord[]) => {
    const headers = ['Type', 'Date', 'Certificate No', 'Church', 'Minister', 'Godparent'];
    const rows = items.map(s => [
      s.sacrament_type.replace(/_/g, ' '),
      s.sacrament_date,
      s.certificate_number || '',
      s.church_name || '',
      s.officiating_minister || '',
      s.godparent_1_name || '',
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.map(c => `"${c}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'sacraments_export.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  const filteredSacraments = sacraments.filter(s => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      s.sacrament_type.toLowerCase().includes(q) ||
      (s.certificate_number && s.certificate_number.toLowerCase().includes(q)) ||
      (s.church_name && s.church_name.toLowerCase().includes(q)) ||
      (s.officiating_minister && s.officiating_minister.toLowerCase().includes(q))
    );
  });

  const sacramentColumns: Column<SacramentRecord>[] = useMemo(() => [
    {
      key: 'type',
      header: 'Type',
      sortable: true,
      sortKey: (s) => s.sacrament_type,
      render: (s) => (
        <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 rounded-full whitespace-nowrap">
          {s.sacrament_type.replace(/_/g, ' ')}
        </span>
      ),
    },
    {
      key: 'date',
      header: 'Date',
      sortable: true,
      sortKey: (s) => s.sacrament_date,
      render: (s) => (
        <div className="flex items-center gap-1.5 whitespace-nowrap text-gray-900 text-sm">
          <Calendar size={13} className="text-gray-400 flex-shrink-0" />
          {s.sacrament_date}
        </div>
      ),
    },
    {
      key: 'certificate',
      header: 'Certificate',
      render: (s) => <span className="text-sm text-gray-700">{s.certificate_number || '-'}</span>,
    },
    {
      key: 'church',
      header: 'Church',
      render: (s) => <span className="text-sm text-gray-600 truncate block max-w-[160px]">{s.church_name || '-'}</span>,
    },
    {
      key: 'minister',
      header: 'Minister',
      render: (s) => <span className="text-sm text-gray-600 truncate block max-w-[140px]">{s.officiating_minister || '-'}</span>,
    },
    {
      key: 'godparent',
      header: 'Godparent',
      render: (s) => <span className="text-sm text-gray-600 truncate block max-w-[140px]">{s.godparent_1_name || '-'}</span>,
    },
    ...(!isViewer ? [{
      key: 'actions',
      header: 'Actions',
      className: 'text-right',
      headerClassName: 'text-right',
      render: (s: SacramentRecord) => (
        <div className="flex items-center justify-end gap-1" onClick={e => e.stopPropagation()}>
          <button onClick={() => handleEdit(s)} className="p-1.5 text-primary-600 hover:bg-primary-50 rounded-md transition-colors" title="Edit">
            <Edit size={15} />
          </button>
          <button onClick={() => handleDelete(s.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-md transition-colors" title="Delete">
            <Trash2 size={15} />
          </button>
        </div>
      ),
    }] as Column<SacramentRecord>[] : []),
  ], [isViewer]);

  const sacramentBulkActions: BulkAction<SacramentRecord>[] = [
    { label: 'Export CSV', icon: <Download size={14} />, onClick: handleBulkExport },
    ...(!isViewer ? [{ label: 'Delete Selected', icon: <Trash2 size={14} />, onClick: handleBulkDelete, variant: 'danger' as const, requireConfirm: true, confirmMessage: 'Are you sure you want to delete the selected sacrament records?' }] : []),
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Sacraments</h1>
        {!isViewer && (
          <button
            onClick={handleCreate}
            disabled={!selectedParishId}
            className="bg-primary-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus size={20} />
            Record Sacrament
          </button>
        )}
      </div>

      {/* Search and Filter */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search sacrament records..."
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

      {/* Sacrament List */}
      {!selectedParishId ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-100">
          <p className="text-gray-500">Please select a parish to view sacrament records.</p>
        </div>
      ) : loading ? (
        <div className="text-center py-12 text-gray-500">Loading records...</div>
      ) : error ? (
        <div className="text-center py-12 text-red-500">{error}</div>
      ) : (
        <DataTable<SacramentRecord>
          data={filteredSacraments}
          columns={sacramentColumns}
          keyField="id"
          bulkActions={sacramentBulkActions}
          emptyIcon={<Scroll size={24} />}
          emptyTitle="No records found"
          emptyMessage="Get started by recording a new sacrament."
        />
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedSacrament ? 'Edit Sacrament Record' : 'Record Sacrament'}
      >
        <SacramentForm
          initialData={selectedSacrament}
          onSubmit={handleSubmit} // @ts-ignore
          onCancel={() => setIsModalOpen(false)}
          parishId={selectedParishId}
        />
      </Modal>
    </div>
  );
};

export default Sacraments;
