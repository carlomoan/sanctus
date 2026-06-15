import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Filter } from 'lucide-react';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import { useAuth } from '../context/AuthContext';
import { Announcement } from '../types';

interface CreateAnnouncementRequest {
  title: string;
  content: string;
  announcement_type: string;
  scope: string;
  priority: string;
  target_audience?: string;
  attachment_url?: string;
  publish_date?: string;
  expiry_date?: string;
}

export default function Announcements() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [viewingAnnouncement, setViewingAnnouncement] = useState<Announcement | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterScope, setFilterScope] = useState<string>('all');

  useEffect(() => {
    fetchAnnouncements();
  }, [filterStatus, filterScope]);

  const fetchAnnouncements = async () => {
    try {
      const params = new URLSearchParams();
      if (filterStatus !== 'all') params.append('status', filterStatus);
      if (filterScope !== 'all') params.append('scope', filterScope);

      const response = await fetch(`/api/announcements?${params}`);
      if (response.ok) {
        const data = await response.json();
        setAnnouncements(data.announcements || []);
      }
    } catch (error) {
      console.error('Failed to fetch announcements:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingAnnouncement(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (formData: CreateAnnouncementRequest) => {
    try {
      const url = editingAnnouncement
        ? `/api/announcements/${editingAnnouncement.id}`
        : '/api/announcements';
      const method = editingAnnouncement ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setIsModalOpen(false);
        fetchAnnouncements();
      }
    } catch (error) {
      console.error('Failed to save announcement:', error);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT': return 'bg-red-100 text-red-800';
      case 'HIGH': return 'bg-orange-100 text-orange-800';
      case 'NORMAL': return 'bg-blue-100 text-blue-800';
      case 'LOW': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PUBLISHED': return 'bg-green-100 text-green-800';
      case 'DRAFT': return 'bg-yellow-100 text-yellow-800';
      case 'ARCHIVED': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const columns = [
    {
      key: 'title',
      header: t('announcements.titleField'),
      render: (item: Announcement) => (
        <div className="font-medium">{item.title}</div>
      )
    },
    {
      key: 'type',
      header: t('announcements.typeField'),
      render: (item: Announcement) => (
        <span className="text-sm text-gray-600">{item.announcement_type}</span>
      )
    },
    {
      key: 'scope',
      header: t('announcements.scopeField'),
      render: (item: Announcement) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${item.scope === 'DIOCESE' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`}>
          {item.scope}
        </span>
      )
    },
    {
      key: 'priority',
      header: t('announcements.priorityField'),
      render: (item: Announcement) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(item.priority)}`}>
          {item.priority}
        </span>
      )
    },
    {
      key: 'status',
      header: t('common.status'),
      render: (item: Announcement) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status || '')}`}>
          {item.status || 'Unknown'}
        </span>
      )
    },
    {
      key: 'author', header: t('announcements.author'), render: (item: Announcement) => (
        <span className="text-sm text-gray-600">{item.author_name || 'Unknown'}</span>
      )
    },
    {
      key: 'views', header: t('announcements.views'), render: (item: Announcement) => (
        <span className="text-sm text-gray-600">{item.view_count}</span>
      )
    },
    {
      key: 'created', header: t('announcements.created'), render: (item: Announcement) => (
        <span className="text-sm text-gray-600">{item.created_at ? new Date(item.created_at).toLocaleDateString() : '-'}</span>
      )
    },
  ];

  const canCreate = user?.role === 'SUPER_ADMIN' || user?.role === 'PARISH_ADMIN';

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('announcements.title')}</h1>
          <p className="text-gray-600">{t('announcements.description')}</p>
        </div>
        {canCreate && (
          <button
            onClick={handleCreate}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            {t('announcements.newAnnouncement')}
          </button>
        )}
      </div>

      <div className="flex gap-4 items-center">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="border-slate-200 rounded-lg px-3 py-2 text-sm"
          >
            <option value="all">{t('announcements.allStatus')}</option>
            <option value="PUBLISHED">{t('announcements.published')}</option>
            <option value="DRAFT">{t('announcements.draft')}</option>
            <option value="ARCHIVED">{t('announcements.archived')}</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={filterScope}
            onChange={(e) => setFilterScope(e.target.value)}
            className="border-slate-200 rounded-lg px-3 py-2 text-sm"
          >
            <option value="all">{t('announcements.allScopes')}</option>
            <option value="DIOCESE">{t('announcements.diocese')}</option>
            <option value="PARISH">{t('announcements.parish')}</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8">{t('common.loading')}</div>
      ) : (
        <DataTable<Announcement>
          data={announcements}
          columns={columns}
          keyField="id"
        />
      )}

      {/* Create/Edit Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingAnnouncement ? t('announcements.editAnnouncement') : t('announcements.newAnnouncement')}>
        <AnnouncementForm
          announcement={editingAnnouncement}
          onSubmit={handleSubmit}
          onCancel={() => setIsModalOpen(false)}
          user={user}
        />
      </Modal>

      {/* View Modal */}
      <Modal isOpen={!!viewingAnnouncement} onClose={() => setViewingAnnouncement(null)} title={t('announcements.viewAnnouncement')}>
        {viewingAnnouncement && (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold">{viewingAnnouncement.title}</h3>
              <div className="flex gap-2 mt-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(viewingAnnouncement.priority)}`}>
                  {viewingAnnouncement.priority}
                </span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(viewingAnnouncement.status || '')}`}>
                  {viewingAnnouncement.status || 'Unknown'}
                </span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${viewingAnnouncement.scope === 'DIOCESE' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`}>
                  {viewingAnnouncement.scope}
                </span>
              </div>
            </div>
            <div className="prose max-w-none">
              <p className="whitespace-pre-wrap">{viewingAnnouncement.content}</p>
            </div>
            <div className="text-sm text-gray-600">
              <p><strong>Author:</strong> {viewingAnnouncement.author_name || 'Unknown'}</p>
              <p><strong>Type:</strong> {viewingAnnouncement.announcement_type}</p>
              <p><strong>Views:</strong> {viewingAnnouncement.view_count}</p>
              {viewingAnnouncement.publish_date && (
                <p><strong>Published:</strong> {new Date(viewingAnnouncement.publish_date).toLocaleString()}</p>
              )}
              {viewingAnnouncement.expiry_date && (
                <p><strong>Expires:</strong> {new Date(viewingAnnouncement.expiry_date).toLocaleString()}</p>
              )}
              <p><strong>Created:</strong> {viewingAnnouncement.created_at ? new Date(viewingAnnouncement.created_at).toLocaleString() : 'Unknown'}</p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

function AnnouncementForm({ announcement, onSubmit, onCancel, user }: {
  announcement: Announcement | null;
  onSubmit: (data: CreateAnnouncementRequest) => void;
  onCancel: () => void;
  user: any;
}) {
  const [formData, setFormData] = useState<CreateAnnouncementRequest>({
    title: announcement?.title || '',
    content: announcement?.content || '',
    announcement_type: announcement?.announcement_type || 'GENERAL',
    scope: announcement?.scope || (user?.role === 'SUPER_ADMIN' ? 'DIOCESE' : 'PARISH'),
    priority: announcement?.priority || 'NORMAL',
    target_audience: announcement?.target_audience || 'ALL',
    attachment_url: announcement?.attachment_url || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          className="w-full border-slate-200 rounded-lg px-3 py-2"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
        <textarea
          value={formData.content}
          onChange={(e) => setFormData({ ...formData, content: e.target.value })}
          className="w-full border-slate-200 rounded-lg px-3 py-2 h-32"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
          <select
            value={formData.announcement_type}
            onChange={(e) => setFormData({ ...formData, announcement_type: e.target.value })}
            className="w-full border-slate-200 rounded-lg px-3 py-2"
          >
            <option value="GENERAL">General</option>
            <option value="PARISH">Parish</option>
            <option value="DIOCESE">Diocese</option>
            <option value="EVENT">Event</option>
            <option value="LITURGICAL">Liturgical</option>
            <option value="EMERGENCY">Emergency</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
          <select
            value={formData.priority}
            onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
            className="w-full border-slate-200 rounded-lg px-3 py-2"
          >
            <option value="LOW">Low</option>
            <option value="NORMAL">Normal</option>
            <option value="HIGH">High</option>
            <option value="URGENT">Urgent</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Scope</label>
        <select
          value={formData.scope}
          onChange={(e) => setFormData({ ...formData, scope: e.target.value })}
          className="w-full border-slate-200 rounded-lg px-3 py-2"
          disabled={user?.role !== 'SUPER_ADMIN'}
        >
          <option value="PARISH">Parish</option>
          {user?.role === 'SUPER_ADMIN' && <option value="DIOCESE">Diocese</option>}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Target Audience</label>
        <select
          value={formData.target_audience}
          onChange={(e) => setFormData({ ...formData, target_audience: e.target.value })}
          className="w-full border-slate-200 rounded-lg px-3 py-2"
        >
          <option value="ALL">All</option>
          <option value="PRIESTS">Priests</option>
          <option value="SECRETARIES">Secretaries</option>
          <option value="MEMBERS">Members</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Attachment URL (optional)</label>
        <input
          type="url"
          value={formData.attachment_url}
          onChange={(e) => setFormData({ ...formData, attachment_url: e.target.value })}
          className="w-full border-slate-200 rounded-lg px-3 py-2"
        />
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border-slate-200 rounded-lg hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          {announcement ? 'Update' : 'Create'}
        </button>
      </div>
    </form>
  );
}
