import { useState, useEffect, useRef } from 'react';
import { api } from '../api/client';
import { Diocese } from '../types';
import { Plus, Search, MapPin, Phone, Mail, Edit, Trash2, Upload, Church, Building } from 'lucide-react';
import Modal from '../components/Modal';

const API_BASE_URL = 'http://localhost:3000';

const Dioceses = () => {
  const [dioceses, setDioceses] = useState<Diocese[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDiocese, setSelectedDiocese] = useState<Diocese | undefined>(undefined);
  const [uploadingLogoId, setUploadingLogoId] = useState<string | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const logoTargetId = useRef<string>('');

  const fetchDioceses = async () => {
    try {
      const data = await api.listDioceses();
      setDioceses(data);
    } catch (err) {
      setError('Failed to load dioceses');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDioceses();
  }, []);

  const handleCreate = () => {
    setSelectedDiocese(undefined);
    setIsModalOpen(true);
  };

  const handleEdit = (diocese: Diocese) => {
    setSelectedDiocese(diocese);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this diocese? This action cannot be undone.')) {
      try {
        // Note: You'll need to implement deleteDiocese in the backend and API client
        // await api.deleteDiocese(id);
        // setDioceses(dioceses.filter(d => d.id !== id));
        alert('Delete functionality not yet implemented for dioceses.');
      } catch (err) {
        console.error('Failed to delete diocese:', err);
        alert('Failed to delete diocese');
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Building size={24} />
          Dioceses
        </h1>
        <button
          onClick={handleCreate}
          className="bg-primary-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-primary-700 transition-colors"
        >
          <Plus size={20} />
          Add Diocese
        </button>
      </div>

      {/* Search and Filter */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search dioceses..."
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </div>

      {/* Diocese List */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading dioceses...</div>
      ) : error ? (
        <div className="text-center py-12 text-red-500">{error}</div>
      ) : dioceses.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-100">
          <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <Building className="text-gray-400" size={24} />
          </div>
          <h3 className="text-lg font-medium text-gray-900">No dioceses found</h3>
          <p className="text-gray-500 mt-1">Get started by adding a new diocese.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {dioceses.map((diocese) => (
            <div key={diocese.id} className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                    {diocese.logo_url ? (
                      <img src={`${API_BASE_URL}${diocese.logo_url}`} alt="Logo" className="h-12 w-12 object-cover rounded-lg" />
                    ) : (
                      <Building size={24} className="text-gray-400" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{diocese.diocese_name}</h3>
                    <p className="text-sm text-gray-500">{diocese.diocese_code}</p>
                  </div>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${diocese.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                  {diocese.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>

              <div className="space-y-2 text-sm text-gray-600">
                {diocese.bishop_name && (
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Bishop:</span>
                    <span>{diocese.bishop_name}</span>
                  </div>
                )}
                {diocese.headquarters_address && (
                  <div className="flex items-center gap-2">
                    <MapPin size={16} className="text-gray-400" />
                    <span>{diocese.headquarters_address}</span>
                  </div>
                )}
                {diocese.contact_phone && (
                  <div className="flex items-center gap-2">
                    <Phone size={16} className="text-gray-400" />
                    <span>{diocese.contact_phone}</span>
                  </div>
                )}
                {diocese.contact_email && (
                  <div className="flex items-center gap-2">
                    <Mail size={16} className="text-gray-400" />
                    <span>{diocese.contact_email}</span>
                  </div>
                )}
                {diocese.country && (
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Country:</span>
                    <span>{diocese.country}</span>
                  </div>
                )}
                {diocese.established_date && (
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Established:</span>
                    <span>{new Date(diocese.established_date).toLocaleDateString()}</span>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-4 border-t border-gray-100 flex justify-end gap-2">
                <button
                  onClick={() => handleEdit(diocese)}
                  className="p-2 text-gray-400 hover:text-primary-600 rounded-full hover:bg-primary-50 transition-colors"
                  title="Edit"
                >
                  <Edit size={18} />
                </button>
                <button
                  onClick={() => handleDelete(diocese.id)}
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
        title={selectedDiocese ? 'Edit Diocese' : 'Add New Diocese'}
      >
        <div className="text-center py-8 text-gray-500">
          <Building size={48} className="mx-auto mb-4 text-gray-300" />
          <p>Diocese form component not yet implemented.</p>
          <p className="text-sm mt-2">This would include fields for name, code, bishop, address, etc.</p>
        </div>
      </Modal>
    </div>
  );
};

export default Dioceses;
