import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { UserRole } from '../types';
import { Plus, Search, Calendar, MapPin, Clock, Users, Edit, Trash2 } from 'lucide-react';
import Modal from '../components/Modal';
import { useAuth } from '../context/AuthContext';
import { format } from 'date-fns';

interface ChurchEvent {
  id: string;
  title: string;
  description?: string;
  start_date: string;
  start_time?: string;
  end_time?: string;
  location?: string;
  max_participants?: number;
  current_participants?: number;
  event_status: 'draft' | 'published' | 'cancelled';
  scope: 'diocese' | 'parish';
  recurrence_pattern: 'NONE' | 'DAILY' | 'WEEKLY' | 'MONTHLY';
}

const Events = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [events, setEvents] = useState<ChurchEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<ChurchEvent | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    start_date: '',
    start_time: '',
    end_time: '',
    location: '',
    max_participants: '',
    scope: 'parish' as 'diocese' | 'parish',
    event_status: 'draft' as 'draft' | 'published' | 'cancelled',
    recurrence_pattern: 'NONE' as 'NONE' | 'DAILY' | 'WEEKLY' | 'MONTHLY',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isSuperAdmin = user?.role === UserRole.SUPER_ADMIN;
  const canManage = isSuperAdmin || user?.role === UserRole.PARISH_ADMIN || user?.role === UserRole.SECRETARY;

  const fetchEvents = async () => {
    try {
      const data = await api.listEvents({ limit: 100 });
      setEvents(data);
    } catch (err) {
      setError('Failed to load events');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchEvents(); }, []);

  const handleCreate = () => {
    setSelectedEvent(undefined);
    setFormData({
      title: '',
      description: '',
      start_date: '',
      start_time: '',
      end_time: '',
      location: '',
      max_participants: '',
      scope: isSuperAdmin ? 'diocese' : 'parish',
      event_status: 'draft',
      recurrence_pattern: 'NONE',
    });
    setIsModalOpen(true);
  };

  const handleEdit = (event: ChurchEvent) => {
    setSelectedEvent(event);
    setFormData({
      title: event.title,
      description: event.description || '',
      start_date: event.start_date,
      start_time: event.start_time || '',
      end_time: event.end_time || '',
      location: event.location || '',
      max_participants: event.max_participants?.toString() || '',
      scope: event.scope,
      event_status: event.event_status,
      recurrence_pattern: event.recurrence_pattern,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (selectedEvent) {
        await api.updateEvent(selectedEvent.id, {
          ...formData,
          max_participants: formData.max_participants ? parseInt(formData.max_participants) : undefined,
        });
      } else {
        await api.createEvent({
          ...formData,
          max_participants: formData.max_participants ? parseInt(formData.max_participants) : undefined,
        });
      }
      setIsModalOpen(false);
      fetchEvents();
    } catch (err) {
      setError('Failed to save event');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this event?')) return;
    try {
      await api.deleteEvent(id);
      fetchEvents();
    } catch (err) {
      setError('Failed to delete event');
      console.error(err);
    }
  };

  const filteredEvents = events.filter(event => {
    const matchesSearch = event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === 'all' || event.event_status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'cancelled': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Events</h1>
          <p className="text-slate-500 text-sm mt-1">Manage church events and schedules</p>
        </div>
        {canManage && (
          <button
            onClick={handleCreate}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-200"
          >
            <Plus size={18} />
            Add Event
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-elevation-1 border border-slate-200 p-6">
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search events..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400/50"
            />
          </div>
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400/50"
          >
            <option value="all">All Status</option>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {filteredEvents.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <Calendar size={48} className="mx-auto mb-3 text-slate-300" />
            <p className="text-lg font-medium">No events found</p>
            <p className="text-sm mt-1">Create your first event to get started</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredEvents.map(event => (
              <div
                key={event.id}
                className="bg-white border border-slate-200 rounded-xl p-5 hover:shadow-elevation-2 transition-all group"
              >
                <div className="flex items-start justify-between mb-3">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(event.event_status)}`}>
                    {event.event_status}
                  </span>
                  {canManage && (
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleEdit(event)} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 hover:text-indigo-600">
                        <Edit size={14} />
                      </button>
                      <button onClick={() => handleDelete(event.id)} className="p-1.5 hover:bg-red-50 rounded-lg text-slate-600 hover:text-red-600">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
                </div>
                <h3 className="font-semibold text-slate-900 mb-2">{event.title}</h3>
                {event.description && (
                  <p className="text-sm text-slate-500 mb-3 line-clamp-2">{event.description}</p>
                )}
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-slate-600">
                    <Calendar size={14} />
                    {format(new Date(event.start_date), 'MMM dd, yyyy')}
                  </div>
                  {event.start_time && (
                    <div className="flex items-center gap-2 text-slate-600">
                      <Clock size={14} />
                      {event.start_time} {event.end_time && `- ${event.end_time}`}
                    </div>
                  )}
                  {event.location && (
                    <div className="flex items-center gap-2 text-slate-600">
                      <MapPin size={14} />
                      <span className="truncate">{event.location}</span>
                    </div>
                  )}
                  {event.max_participants && (
                    <div className="flex items-center gap-2 text-slate-600">
                      <Users size={14} />
                      {event.current_participants || 0} / {event.max_participants}
                    </div>
                  )}
                </div>
                {event.recurrence_pattern !== 'NONE' && (
                  <div className="mt-3 pt-3 border-t border-slate-100">
                    <span className="text-xs text-indigo-600 font-medium">
                      Recurring: {event.recurrence_pattern}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedEvent ? 'Edit Event' : 'Add Event'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400/50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400/50"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Start Date</label>
              <input
                type="date"
                required
                value={formData.start_date}
                onChange={e => setFormData({ ...formData, start_date: e.target.value })}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400/50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Start Time</label>
              <input
                type="time"
                value={formData.start_time}
                onChange={e => setFormData({ ...formData, start_time: e.target.value })}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400/50"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">End Time</label>
              <input
                type="time"
                value={formData.end_time}
                onChange={e => setFormData({ ...formData, end_time: e.target.value })}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400/50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Max Participants</label>
              <input
                type="number"
                value={formData.max_participants}
                onChange={e => setFormData({ ...formData, max_participants: e.target.value })}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400/50"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Location</label>
            <input
              type="text"
              value={formData.location}
              onChange={e => setFormData({ ...formData, location: e.target.value })}
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400/50"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Scope</label>
              <select
                value={formData.scope}
                onChange={e => setFormData({ ...formData, scope: e.target.value as 'diocese' | 'parish' })}
                disabled={!isSuperAdmin}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400/50 disabled:bg-slate-50"
              >
                <option value="parish">Parish</option>
                {isSuperAdmin && <option value="diocese">Diocese</option>}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
              <select
                value={formData.event_status}
                onChange={e => setFormData({ ...formData, event_status: e.target.value as 'draft' | 'published' | 'cancelled' })}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400/50"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Recurrence</label>
            <select
              value={formData.recurrence_pattern}
              onChange={e => setFormData({ ...formData, recurrence_pattern: e.target.value as 'NONE' | 'DAILY' | 'WEEKLY' | 'MONTHLY' })}
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400/50"
            >
              <option value="NONE">None</option>
              <option value="DAILY">Daily</option>
              <option value="WEEKLY">Weekly</option>
              <option value="MONTHLY">Monthly</option>
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : selectedEvent ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Events;