import { useState, useEffect } from 'react';
import { api } from '../api/client';
import { Diocese, UserRole } from '../types';
import { Plus, Search, MapPin, Phone, Mail, Edit, Trash2, Building } from 'lucide-react';
import Modal from '../components/Modal';
import { useAuth } from '../context/AuthContext';

const API_BASE_URL = 'http://localhost:3000';

const Dioceses = () => {
  const { user } = useAuth();
  const [dioceses, setDioceses] = useState<Diocese[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDiocese, setSelectedDiocese] = useState<Diocese | undefined>(undefined);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '',
    email: '',
    bishop_name: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fixed: use exact UserRole enum value from types.ts
  const isSuperAdmin = user?.role === UserRole.SUPER_ADMIN;

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

  useEffect(() => { fetchDioceses(); }, []);

  const handleCreate = () => {
    setSelectedDiocese(undefined);
    setFormData({ name: '', address: '', phone: '', email: '', bishop_name: '' });
    setIsModalOpen(true);
  };

  const handleEdit = (diocese: Diocese) => {
    setSelectedDiocese(diocese);
    setFormData({
      // Fixed: use the actual Diocese fields from your type definition
      // diocese.diocese_name, diocese.headquarters_address, etc.
      name: diocese.diocese_name || '',
      address: diocese.headquarters_address || '',
      phone: diocese.contact_phone || '',
      email: diocese.contact_email || '',
      bishop_name: diocese.bishop_name || '',
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this diocese? This action cannot be undone.')) {
      try {
        await api.deleteDiocese(id);
        setDioceses(dioceses.filter(d => d.id !== id));
        alert('Diocese deleted successfully');
      } catch (err: any) {
        console.error('Failed to delete diocese:', err);
        alert(err.message || 'Failed to delete diocese');
      }
    }
  };

  const handleSubmit = async (e: React.SubmitEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (selectedDiocese) {
        const updatedDiocese = await api.updateDiocese(selectedDiocese.id, formData);
        setDioceses(dioceses.map(d => d.id === selectedDiocese.id ? updatedDiocese : d));
        alert('Diocese updated successfully');
      } else {
        const newDiocese = await api.createDiocese(formData);
        setDioceses([...dioceses, newDiocese]);
        alert('Diocese created successfully');
      }
      setIsModalOpen(false);
    } catch (err: any) {
      console.error('Failed to save diocese:', err);
      alert(err.message || 'Failed to save diocese');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Building size={24} />
          Dioceses
        </h1>
        {isSuperAdmin && (
          <button onClick={handleCreate} className="bg-primary-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-primary-700 transition-colors">
            <Plus size={20} />
            Add Diocese
          </button>
        )}
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input type="text" placeholder="Search dioceses..."
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" />
        </div>
      </div>

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
                {isSuperAdmin && (
                  <>
                    <button onClick={() => handleEdit(diocese)} className="p-2 text-gray-400 hover:text-primary-600 rounded-full hover:bg-primary-50 transition-colors" title="Edit">
                      <Edit size={18} />
                    </button>
                    <button onClick={() => handleDelete(diocese.id)} className="p-2 text-gray-400 hover:text-red-600 rounded-full hover:bg-red-50 transition-colors" title="Delete">
                      <Trash2 size={18} />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={selectedDiocese ? 'Edit Diocese' : 'Add New Diocese'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Diocese Name *</label>
            <input type="text" required value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Enter diocese name" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
            <textarea value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              rows={3} placeholder="Enter diocese address" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <input type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Enter phone number" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Enter email address" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Bishop Name</label>
            <input type="text" value={formData.bishop_name} onChange={(e) => setFormData({ ...formData, bishop_name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Enter bishop name" />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">Cancel</button>
            <button type="submit" disabled={isSubmitting}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50">
              {isSubmitting ? 'Saving...' : (selectedDiocese ? 'Update' : 'Create')}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Dioceses;