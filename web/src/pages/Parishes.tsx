import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../api/client';
import { Parish, CreateParishRequest, UpdateParishRequest, Diocese } from '../types';
import { Plus, Search, MapPin, Phone, Mail, Edit, Trash2, Upload, Church } from 'lucide-react';
import Modal from '../components/Modal';
import ParishForm from '../components/ParishForm';

const API_BASE_URL = 'http://localhost:3000';

const Parishes = () => {
  const { t } = useTranslation();
  const [parishes, setParishes] = useState<Parish[]>([]);
  const [dioceses, setDioceses] = useState<Diocese[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedParish, setSelectedParish] = useState<Parish | undefined>(undefined);
  const [uploadingLogoId, setUploadingLogoId] = useState<string | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const logoTargetId = useRef<string>('');

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const parishId = logoTargetId.current;
    if (!file || !parishId) return;

    if (file.size > 5 * 1024 * 1024) {
      alert(t('parish.fileTooLarge'));
      return;
    }

    setUploadingLogoId(parishId);
    try {
      const result = await api.uploadParishLogo(parishId, file);
      setParishes(prev => prev.map(p =>
        p.id === parishId ? { ...p, logo_url: result.url } : p
      ));
    } catch (err) {
      console.error('Failed to upload logo:', err);
      alert(t('parish.failedToUploadLogo'));
    } finally {
      setUploadingLogoId(null);
      if (logoInputRef.current) logoInputRef.current.value = '';
    }
  };

  const triggerLogoUpload = (parishId: string) => {
    logoTargetId.current = parishId;
    logoInputRef.current?.click();
  };

  const fetchParishes = async () => {
    try {
      const [parishesData, diocesesData] = await Promise.all([
        api.listParishes(),
        api.listDioceses(),
      ]);
      setParishes(parishesData);
      setDioceses(diocesesData);
    } catch (err) {
      setError(t('parish.failedToLoad'));
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
    if (confirm(t('parish.confirmDelete'))) {
      try {
        await api.deleteParish(id);
        setParishes(parishes.filter(p => p.id !== id));
      } catch (err) {
        console.error('Failed to delete parish:', err);
        alert(t('parish.failedToDelete'));
      }
    }
  };

  const handleSubmit = async (data: any) => {
    try {
      console.log('Submitting parish data:', data);
      // Transform empty string values to null for UUID fields
      const submitData = {
        ...data,
        priest_id: data.priest_id || null, // Convert empty string to null
      };
      console.log('Transformed parish data:', submitData);

      if (selectedParish) {
        await api.updateParish(selectedParish.id, submitData as UpdateParishRequest);
      } else {
        await api.createParish(submitData as CreateParishRequest);
      }
      await fetchParishes();
      setIsModalOpen(false);
    } catch (err: any) {
      console.error('Failed to save parish:', err);
      // Show more detailed error message
      const errorMessage = err?.message || err?.detail || t('parish.failedToSave');
      alert(`Error: ${errorMessage}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">{t('parish.title')}</h1>
        <button
          onClick={handleCreate}
          className="bg-primary-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-primary-700 transition-colors"
        >
          <Plus size={20} />
          {t('parish.addParish')}
        </button>
      </div>

      {/* Search and Filter */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder={t('parish.searchParishes')}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </div>

      {/* Parish List */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">{t('parish.loadingParishes')}</div>
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
          <input
            ref={logoInputRef}
            type="file"
            accept="image/*"
            onChange={handleLogoUpload}
            className="hidden"
          />
          {parishes.map((parish) => (
            <div key={parish.id} className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0 group relative cursor-pointer"
                    onClick={() => triggerLogoUpload(parish.id)}
                    title="Upload logo"
                  >
                    {parish.logo_url ? (
                      <img src={`${API_BASE_URL}${parish.logo_url}`} alt="Logo" className="h-12 w-12 object-cover rounded-lg" />
                    ) : (
                      <Church size={24} className="text-gray-400" />
                    )}
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 flex items-center justify-center transition-all rounded-lg">
                      <Upload size={14} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    {uploadingLogoId === parish.id && (
                      <div className="absolute inset-0 bg-white bg-opacity-70 flex items-center justify-center rounded-lg">
                        <div className="w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{parish.parish_name}</h3>
                    <p className="text-sm text-gray-500">{parish.parish_code}</p>
                  </div>
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
          dioceses={dioceses}
        />
      </Modal>
    </div>
  );
};

export default Parishes;
