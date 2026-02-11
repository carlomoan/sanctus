import { useState, useEffect } from 'react';
import { api } from '../api/client';
import { Parish, CreateParishRequest, UpdateParishRequest } from '../types';
import { Plus, Search, MapPin, Phone, Mail, Edit, Trash2 } from 'lucide-react';
import Modal from '../components/Modal';
import ParishForm from '../components/ParishForm';

const Parishes = () => {
  const [parishes, setParishes] = useState<Parish[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedParish, setSelectedParish] = useState<Parish | undefined>(undefined);

  const fetchParishes = async () => {
    try {
      const data = await api.listParishes();
      setParishes(data);
    } catch (err) {
      setError('Failed to load parishes');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchParishes();
  }, []);

  const handleCreate = () => {
    setSelectedParish(undefined);
    setIsModalOpen(true);
  };

  const handleEdit = (parish: Parish) => {
    setSelectedParish(parish);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this parish?')) {
      try {
        await api.deleteParish(id);
        setParishes(parishes.filter(p => p.id !== id));
      } catch (err) {
        console.error('Failed to delete parish:', err);
        alert('Failed to delete parish');
      }
    }
  };

  const handleSubmit = async (data: CreateParishRequest | UpdateParishRequest) => {
    try {
      if (selectedParish) {
        await api.updateParish(selectedParish.id, data as UpdateParishRequest);
      } else {
        await api.createParish(data as CreateParishRequest);
      }
      await fetchParishes();
      setIsModalOpen(false);
    } catch (err) {
      console.error('Failed to save parish:', err);
      alert('Failed to save parish');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Parishes</h1>
        <button
          onClick={handleCreate}
          className="bg-primary-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-primary-700 transition-colors"
        >
          <Plus size={20} />
          Add Parish
        </button>
      </div>

      {/* Search and Filter */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search parishes..."
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </div>

      {/* Parish List */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading parishes...</div>
      ) : error ? (
        <div className="text-center py-12 text-red-500">{error}</div>
      ) : parishes.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-100">
          <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <MapPin className="text-gray-400" size={24} />
          </div>
          <h3 className="text-lg font-medium text-gray-900">No parishes found</h3>
          <p className="text-gray-500 mt-1">Get started by adding a new parish.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {parishes.map((parish) => (
            <div key={parish.id} className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{parish.parish_name}</h3>
                  <p className="text-sm text-gray-500">{parish.parish_code}</p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${parish.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                  {parish.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>

              <div className="space-y-2 text-sm text-gray-600">
                {parish.physical_address && (
                  <div className="flex items-center gap-2">
                    <MapPin size={16} className="text-gray-400" />
                    <span>{parish.physical_address}</span>
                  </div>
                )}
                {parish.contact_phone && (
                  <div className="flex items-center gap-2">
                    <Phone size={16} className="text-gray-400" />
                    <span>{parish.contact_phone}</span>
                  </div>
                )}
                {parish.contact_email && (
                  <div className="flex items-center gap-2">
                    <Mail size={16} className="text-gray-400" />
                    <span>{parish.contact_email}</span>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-4 border-t border-gray-100 flex justify-end gap-2">
                <button
                  onClick={() => handleEdit(parish)}
                  className="p-2 text-gray-400 hover:text-primary-600 rounded-full hover:bg-primary-50 transition-colors"
                  title="Edit"
                >
                  <Edit size={18} />
                </button>
                <button
                  onClick={() => handleDelete(parish.id)}
                  className="p-2 text-gray-400 hover:text-red-600 rounded-full hover:bg-red-50 transition-colors"
                  title="Delete"
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
        title={selectedParish ? 'Edit Parish' : 'Add New Parish'}
      >
        <ParishForm
          initialData={selectedParish}
          onSubmit={handleSubmit}
          onCancel={() => setIsModalOpen(false)}
        />
      </Modal>
    </div>
  );
};

export default Parishes;
