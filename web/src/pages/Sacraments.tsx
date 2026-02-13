import { useState, useEffect } from 'react';
import { api } from '../api/client';
import { SacramentRecord, Parish, CreateSacramentRequest, UpdateSacramentRequest, UserRole } from '../types';
import { Plus, Search, Filter, Calendar, Edit, Trash2, Scroll } from 'lucide-react';
import Modal from '../components/Modal';
import SacramentForm from '../components/SacramentForm';
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

  const handleSubmit = async (data: CreateSacramentRequest | UpdateSacramentRequest) => { // Type assertion handled in form or here
    try {
      if (selectedSacrament) {
        // Form likely returns full object, but API expects partial for update. 
        // For simplicity assuming the form handles structure or we cast.
        // Ideally we map fields properly.
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
      ) : sacraments.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-100">
          <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <Scroll className="text-gray-400" size={24} />
          </div>
          <h3 className="text-lg font-medium text-gray-900">No records found</h3>
          <p className="text-gray-500 mt-1">Get started by recording a new sacrament.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Details
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sacraments.map((record) => (
                <tr key={record.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                      {record.sacrament_type.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex items-center gap-2">
                      <Calendar size={14} className="text-gray-400" />
                      {record.sacrament_date}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    <div>
                      <span className="font-medium">Cert:</span> {record.certificate_number || '-'}
                    </div>
                    {record.church_name && (
                      <div className="text-gray-500 text-xs">
                        {record.church_name}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {!isViewer && (
                      <>
                        <button
                          onClick={() => handleEdit(record)}
                          className="text-primary-600 hover:text-primary-900 mr-3"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(record.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 size={18} />
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
