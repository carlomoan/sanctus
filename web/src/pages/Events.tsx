import { useState, useEffect } from 'react';
// Fixed: removed unused imports (Clock, Filter, MoreVertical, CalendarDays, Bell, Tag)
import { Calendar, MapPin, Users, Plus, Search, ChevronLeft, ChevronRight, Edit, Trash2, Eye, RefreshCw, Repeat, X, Building, Globe } from 'lucide-react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addDays, startOfWeek, endOfWeek } from 'date-fns';
import { toast } from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';

interface Event {
  id: string;
  title: string;
  description?: string;
  start_date: string;
  end_date?: string;
  start_time?: string;
  end_time?: string;
  location?: string;
  scope: 'diocese' | 'parish';
  parish_id?: string;
  diocese_id?: string;
  is_recurring: boolean;
  recurrence_pattern?: string;
  max_participants?: number;
  current_participants: number;
  // Fixed: added 'cancelled' to status union to match usage in filters/display
  status: 'draft' | 'published' | 'cancelled';
  created_at: string;
  updated_at: string;
}

interface EventFormData {
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  start_time: string;
  end_time: string;
  location: string;
  scope: 'diocese' | 'parish';
  is_recurring: boolean;
  recurrence_pattern: string;
  max_participants: number;
  // Fixed: form only allows draft/published — cancelled set externally
  status: 'draft' | 'published';
}

const Events = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  // Fixed: removed unused setSelectedDate — kept selectedDate for form default
  const [selectedDate] = useState<Date | null>(null);
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEventDetails, setShowEventDetails] = useState<Event | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterScope, setFilterScope] = useState<string>('all');
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [formData, setFormData] = useState<EventFormData>({
    title: '',
    description: '',
    start_date: '',
    end_date: '',
    start_time: '',
    end_time: '',
    location: '',
    scope: 'parish',
    is_recurring: false,
    recurrence_pattern: 'weekly',
    max_participants: 0,
    status: 'draft'
  });

  const canCreateDioceseEvents = user?.role === UserRole.SUPER_ADMIN || user?.role === UserRole.PARISH_ADMIN;

  const canEditEvent = (event: Event) => {
    if (user?.role === UserRole.SUPER_ADMIN) return true;
    if (event.scope === 'diocese' && user?.role === UserRole.PARISH_ADMIN) return true;
    if (event.scope === 'parish' && event.parish_id === user?.parish_id) return true;
    return false;
  };

  useEffect(() => {
    const mockEvents: Event[] = [
      {
        id: '1',
        title: 'Sunday Mass',
        description: 'Weekly Sunday Mass celebration',
        start_date: format(new Date(), 'yyyy-MM-dd'),
        start_time: '09:00',
        end_time: '10:30',
        location: 'Main Church',
        scope: 'parish',
        parish_id: user?.parish_id,
        is_recurring: true,
        recurrence_pattern: 'weekly',
        max_participants: 200,
        current_participants: 150,
        status: 'published',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      },
      {
        id: '2',
        title: 'Diocese Youth Conference',
        description: 'Annual youth conference for all parishes',
        start_date: format(addDays(new Date(), 3), 'yyyy-MM-dd'),
        start_time: '09:00',
        end_time: '17:00',
        location: 'Diocese Center',
        scope: 'diocese',
        diocese_id: 'diocese-1',
        is_recurring: false,
        recurrence_pattern: 'yearly',
        max_participants: 500,
        current_participants: 350,
        status: 'published',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      },
      {
        id: '3',
        title: 'Bible Study Group',
        description: 'Weekly Bible study and discussion',
        start_date: format(addDays(new Date(), 2), 'yyyy-MM-dd'),
        start_time: '19:00',
        end_time: '20:30',
        location: 'Parish Hall',
        scope: 'parish',
        parish_id: user?.parish_id,
        is_recurring: true,
        recurrence_pattern: 'weekly',
        max_participants: 30,
        current_participants: 25,
        status: 'published',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      },
      {
        id: '4',
        title: 'Priest Retreat',
        description: 'Annual retreat for diocese priests',
        start_date: format(addDays(new Date(), 10), 'yyyy-MM-dd'),
        start_time: '08:00',
        end_time: '18:00',
        location: 'Retreat Center',
        scope: 'diocese',
        diocese_id: 'diocese-1',
        is_recurring: false,
        recurrence_pattern: 'yearly',
        max_participants: 50,
        current_participants: 45,
        status: 'published',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      }
    ];

    setTimeout(() => {
      setEvents(mockEvents);
      setLoading(false);
    }, 1000);
  }, [user?.parish_id]);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);
  const days = eachDayOfInterval({ start: startDate, end: endDate });

  const filteredEvents = events.filter(event => {
    const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || event.status === filterStatus;
    const matchesScope = filterScope === 'all' || event.scope === filterScope;
    return matchesSearch && matchesStatus && matchesScope;
  });

  const getEventsForDate = (date: Date) => {
    return filteredEvents.filter(event => isSameDay(new Date(event.start_date), date));
  };

  const handleCreateEvent = () => {
    setEditingEvent(null);
    setFormData({
      title: '',
      description: '',
      start_date: format(selectedDate || new Date(), 'yyyy-MM-dd'),
      end_date: format(selectedDate || new Date(), 'yyyy-MM-dd'),
      start_time: '',
      end_time: '',
      location: '',
      scope: 'parish',
      is_recurring: false,
      recurrence_pattern: 'weekly',
      max_participants: 0,
      status: 'draft'
    });
    setShowCreateModal(true);
  };

  const handleEditEvent = (event: Event) => {
    setEditingEvent(event);
    setFormData({
      title: event.title,
      description: event.description || '',
      start_date: event.start_date,
      end_date: event.end_date || event.start_date,
      start_time: event.start_time || '',
      end_time: event.end_time || '',
      location: event.location || '',
      scope: event.scope,
      is_recurring: event.is_recurring,
      recurrence_pattern: event.recurrence_pattern || 'weekly',
      max_participants: event.max_participants || 0,
      // Fixed: if event.status is 'cancelled', default form to 'published' 
      // since the form only supports draft/published
      status: event.status === 'cancelled' ? 'published' : event.status
    });
    setShowCreateModal(true);
  };

  const handleSaveEvent = () => {
    if (!formData.title.trim()) {
      toast.error('Event title is required');
      return;
    }

    if (editingEvent) {
      setEvents(events.map(event =>
        event.id === editingEvent.id
          ? { ...event, ...formData, updated_at: new Date().toISOString() }
          : event
      ));
      toast.success('Event updated successfully');
    } else {
      const newEvent: Event = {
        id: Date.now().toString(),
        ...formData,
        parish_id: formData.scope === 'parish' ? user?.parish_id : undefined,
        diocese_id: formData.scope === 'diocese' ? 'diocese-1' : undefined,
        current_participants: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      setEvents([...events, newEvent]);
      toast.success('Event created successfully');
    }
    setShowCreateModal(false);
    setEditingEvent(null);
  };

  const handleDeleteEvent = (eventId: string) => {
    if (window.confirm('Are you sure you want to delete this event?')) {
      setEvents(events.filter(event => event.id !== eventId));
      toast.success('Event deleted successfully');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'bg-green-100 text-green-800 border-green-200';
      case 'draft': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="animate-spin h-8 w-8 text-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Events</h1>
          <p className="text-gray-600">Manage parish and diocese events</p>
        </div>
        <div className="mt-4 sm:mt-0 flex gap-3">
          <button
            onClick={() => setViewMode(viewMode === 'calendar' ? 'list' : 'calendar')}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <Calendar className="h-4 w-4 mr-2" />
            {viewMode === 'calendar' ? 'List View' : 'Calendar View'}
          </button>
          <button
            onClick={handleCreateEvent}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Event
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search events..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
        >
          <option value="all">All Status</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <select
          value={filterScope}
          onChange={(e) => setFilterScope(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
        >
          <option value="all">All Scopes</option>
          <option value="parish">Parish Events</option>
          <option value="diocese">Diocese Events</option>
        </select>
      </div>

      {viewMode === 'calendar' ? (
        <div className="bg-white rounded-lg shadow">
          <div className="flex items-center justify-between p-4 border-b">
            <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-2 hover:bg-gray-100 rounded-md">
              <ChevronLeft className="h-5 w-5" />
            </button>
            <h2 className="text-lg font-semibold">{format(currentMonth, 'MMMM yyyy')}</h2>
            <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-2 hover:bg-gray-100 rounded-md">
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
          <div className="grid grid-cols-7 gap-px bg-gray-200">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="bg-gray-50 p-2 text-center text-sm font-medium text-gray-700">{day}</div>
            ))}
            {days.map((day, idx) => {
              const dayEvents = getEventsForDate(day);
              const isCurrentMonth = isSameMonth(day, currentMonth);
              return (
                <div key={idx} className={`bg-white p-2 min-h-[100px] ${!isCurrentMonth ? 'text-gray-400' : ''}`}>
                  <div className="text-sm font-medium mb-1">{format(day, 'd')}</div>
                  <div className="space-y-1">
                    {dayEvents.slice(0, 2).map(event => (
                      <div
                        key={event.id}
                        onClick={() => setShowEventDetails(event)}
                        className={`text-xs p-1 rounded truncate cursor-pointer ${event.status === 'published' ? 'bg-primary-100 text-primary-800' : 'bg-gray-100 text-gray-800'}`}
                      >
                        {event.title}
                      </div>
                    ))}
                  </div>
                  {dayEvents.length > 2 && <div className="text-xs text-gray-500">+{dayEvents.length - 2} more</div>}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Event</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date & Time</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Participants</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredEvents.map(event => (
                  <tr key={event.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <div className="flex items-center">
                        <div>
                          <div className="text-sm font-medium text-gray-900 flex items-center">
                            {event.title}
                            {event.is_recurring && <Repeat className="inline h-3 w-3 ml-1 text-primary-600" />}
                          </div>
                          <div className="flex items-center mt-1">
                            {event.scope === 'diocese' ? (
                              <div className="flex items-center text-xs text-purple-600 bg-purple-100 px-2 py-1 rounded-full">
                                <Globe className="h-3 w-3 mr-1" />Diocese
                              </div>
                            ) : (
                              <div className="flex items-center text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                                <Building className="h-3 w-3 mr-1" />Parish
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-sm text-gray-500">{event.description}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <div>{format(new Date(event.start_date), 'MMM dd, yyyy')}</div>
                      {event.start_time && (
                        <div className="text-gray-500">{event.start_time} {event.end_time && `- ${event.end_time}`}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">{event.location || '-'}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <div className="flex items-center">
                        <Users className="h-4 w-4 mr-1 text-gray-400" />
                        {event.current_participants}
                        {/* Fixed: use optional chaining to guard max_participants */}
                        {(event.max_participants ?? 0) > 0 && `/${event.max_participants}`}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getStatusColor(event.status)}`}>
                        {event.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <div className="flex items-center space-x-2">
                        <button onClick={() => setShowEventDetails(event)} className="text-gray-400 hover:text-primary-600">
                          <Eye className="h-4 w-4" />
                        </button>
                        {canEditEvent(event) && (
                          <>
                            <button onClick={() => handleEditEvent(event)} className="text-gray-400 hover:text-primary-600">
                              <Edit className="h-4 w-4" />
                            </button>
                            <button onClick={() => handleDeleteEvent(event.id)} className="text-gray-400 hover:text-red-600">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <h3 className="text-lg font-semibold">{editingEvent ? 'Edit Event' : 'Create New Event'}</h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Event Title *</label>
                <input type="text" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500" placeholder="Enter event title" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500" rows={3} placeholder="Enter event description" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date *</label>
                  <input type="date" value={formData.start_date} onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                  <input type="date" value={formData.end_date} onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                  <input type="time" value={formData.start_time} onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                  <input type="time" value={formData.end_time} onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <input type="text" value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500" placeholder="Enter event location" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Event Scope *</label>
                <select value={formData.scope} onChange={(e) => setFormData({ ...formData, scope: e.target.value as 'diocese' | 'parish' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500" disabled={!canCreateDioceseEvents}>
                  <option value="parish">Parish Event</option>
                  {canCreateDioceseEvents && <option value="diocese">Diocese Event</option>}
                </select>
                {!canCreateDioceseEvents && <p className="text-xs text-gray-500 mt-1">Only SuperAdmin and ParishAdmin can create diocese events</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Max Participants</label>
                <input type="number" value={formData.max_participants} onChange={(e) => setFormData({ ...formData, max_participants: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500" min="0" placeholder="0 for unlimited" />
              </div>
              <div className="flex items-center">
                <input type="checkbox" id="is_recurring" checked={formData.is_recurring}
                  onChange={(e) => setFormData({ ...formData, is_recurring: e.target.checked })}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded" />
                <label htmlFor="is_recurring" className="ml-2 block text-sm text-gray-900">Recurring Event</label>
              </div>
              {formData.is_recurring && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Recurrence Pattern</label>
                  <select value={formData.recurrence_pattern} onChange={(e) => setFormData({ ...formData, recurrence_pattern: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500">
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value as 'draft' | 'published' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500">
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </select>
              </div>
            </div>
            <div className="p-6 border-t flex justify-end space-x-3">
              <button onClick={() => setShowCreateModal(false)} className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
              <button onClick={handleSaveEvent} className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700">
                {editingEvent ? 'Update Event' : 'Create Event'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Event Details Modal */}
      {showEventDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">{showEventDetails.title}</h3>
                <button onClick={() => setShowEventDetails(null)} className="text-gray-400 hover:text-gray-600">
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-1">Description</h4>
                <p className="text-gray-900">{showEventDetails.description}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-1">Date</h4>
                  <p className="text-gray-900">{format(new Date(showEventDetails.start_date), 'MMMM dd, yyyy')}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-1">Time</h4>
                  <p className="text-gray-900">{showEventDetails.start_time || 'All day'}{showEventDetails.end_time && ` - ${showEventDetails.end_time}`}</p>
                </div>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-1">Location</h4>
                <p className="text-gray-900 flex items-center">
                  <MapPin className="h-4 w-4 mr-1 text-gray-400" />
                  {showEventDetails.location || 'No location specified'}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-1">Scope</h4>
                  {showEventDetails.scope === 'diocese' ? (
                    <div className="flex items-center text-xs text-purple-600 bg-purple-100 px-2 py-1 rounded-full w-fit">
                      <Globe className="h-3 w-3 mr-1" />Diocese Event
                    </div>
                  ) : (
                    <div className="flex items-center text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-full w-fit">
                      <Building className="h-3 w-3 mr-1" />Parish Event
                    </div>
                  )}
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-1">Status</h4>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getStatusColor(showEventDetails.status)}`}>
                    {showEventDetails.status}
                  </span>
                </div>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-1">Participants</h4>
                <p className="text-gray-900 flex items-center">
                  <Users className="h-4 w-4 mr-1 text-gray-400" />
                  {showEventDetails.current_participants}
                  {/* Fixed: guard with optional chaining */}
                  {(showEventDetails.max_participants ?? 0) > 0 && `/${showEventDetails.max_participants}`}
                </p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-1">Recurrence</h4>
                <p className="text-gray-900 flex items-center">
                  <Repeat className="h-4 w-4 mr-1 text-primary-600" />
                  {showEventDetails.is_recurring ? showEventDetails.recurrence_pattern : 'Non-recurring'}
                </p>
              </div>
            </div>
            <div className="p-6 border-t flex justify-end space-x-3">
              <button onClick={() => setShowEventDetails(null)} className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">Close</button>
              {canEditEvent(showEventDetails) && (
                <>
                  <button onClick={() => { handleEditEvent(showEventDetails); setShowEventDetails(null); }}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">Edit</button>
                  <button onClick={() => { handleDeleteEvent(showEventDetails.id); setShowEventDetails(null); }}
                    className="px-4 py-2 border border-red-300 rounded-md text-sm font-medium text-red-700 hover:bg-red-50">Delete</button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Events;