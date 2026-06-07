import { useState, useEffect } from 'react';
// Fixed: removed unused imports (Calendar, Clock, Filter, Users, MapPin)
import { ChevronLeft, ChevronRight, Church, Palette, Info, Plus, Edit, Trash2, Eye, Search, Star, Cross, Heart, Flame, Bell, BookOpen, X } from 'lucide-react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, startOfWeek, endOfWeek } from 'date-fns';
import { toast } from 'react-hot-toast';

interface LiturgicalDay {
  id: string;
  date: string;
  title: string;
  description: string;
  feast_type: 'SOLEMNITY' | 'FEAST' | 'MEMORIAL' | 'OPTIONAL_MEMORIAL';
  liturgical_season: 'ADVENT' | 'CHRISTMAS' | 'LENT' | 'HOLY_WEEK' | 'EASTER' | 'ORDINARY_TIME';
  liturgical_color: 'WHITE' | 'RED' | 'GREEN' | 'VIOLET' | 'ROSE' | 'BLACK' | 'GOLD';
  rank: number;
  is_movable: boolean;
  created_at: string;
  updated_at: string;
}

interface RecurringPattern {
  id: string;
  name: string;
  description: string;
  pattern_type: 'weekly' | 'monthly' | 'yearly' | 'liturgical';
  pattern_config: any;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const LiturgicalCalendar = () => {
  const [liturgicalDays, setLiturgicalDays] = useState<LiturgicalDay[]>([]);
  const [recurringPatterns, setRecurringPatterns] = useState<RecurringPattern[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedSeason, setSelectedSeason] = useState<string>('all');
  const [selectedFeastType, setSelectedFeastType] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showDayDetails, setShowDayDetails] = useState<LiturgicalDay | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingDay, setEditingDay] = useState<LiturgicalDay | null>(null);
  const [showPatternsModal, setShowPatternsModal] = useState(false);
  const [year, setYear] = useState(new Date().getFullYear());

  useEffect(() => {
    const mockLiturgicalDays: LiturgicalDay[] = [
      { id: '1', date: `${year}-12-25`, title: 'Nativity of the Lord', description: 'Christmas Day', feast_type: 'SOLEMNITY', liturgical_season: 'CHRISTMAS', liturgical_color: 'WHITE', rank: 1, is_movable: false, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
      { id: '2', date: `${year}-12-08`, title: 'Immaculate Conception', description: 'Patronal feast', feast_type: 'SOLEMNITY', liturgical_season: 'ADVENT', liturgical_color: 'WHITE', rank: 1, is_movable: false, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
      { id: '3', date: `${year}-02-14`, title: 'Ash Wednesday', description: 'Beginning of Lent', feast_type: 'SOLEMNITY', liturgical_season: 'LENT', liturgical_color: 'VIOLET', rank: 1, is_movable: true, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
      { id: '4', date: `${year}-04-09`, title: 'Good Friday', description: 'Crucifixion of the Lord', feast_type: 'SOLEMNITY', liturgical_season: 'HOLY_WEEK', liturgical_color: 'RED', rank: 1, is_movable: true, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
      { id: '5', date: `${year}-04-11`, title: 'Easter Sunday', description: 'Resurrection of the Lord', feast_type: 'SOLEMNITY', liturgical_season: 'EASTER', liturgical_color: 'WHITE', rank: 1, is_movable: true, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
      { id: '6', date: `${year}-06-09`, title: 'Pentecost Sunday', description: 'Descent of the Holy Spirit', feast_type: 'SOLEMNITY', liturgical_season: 'EASTER', liturgical_color: 'RED', rank: 1, is_movable: true, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' }
    ];
    const mockPatterns: RecurringPattern[] = [
      { id: '1', name: 'Sunday Mass', description: 'Weekly Sunday Mass', pattern_type: 'weekly', pattern_config: { day_of_week: 0, time: '09:00' }, is_active: true, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
      { id: '2', name: 'Daily Mass', description: 'Daily Mass celebration', pattern_type: 'weekly', pattern_config: { day_of_week: 1, time: '08:00' }, is_active: true, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' }
    ];
    setTimeout(() => { setLiturgicalDays(mockLiturgicalDays); setRecurringPatterns(mockPatterns); setLoading(false); }, 1000);
  }, [year]);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);
  const days = eachDayOfInterval({ start: startDate, end: endDate });

  const filteredDays = liturgicalDays.filter(day => {
    const matchesSearch = day.title.toLowerCase().includes(searchTerm.toLowerCase()) || day.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSeason = selectedSeason === 'all' || day.liturgical_season === selectedSeason;
    const matchesFeastType = selectedFeastType === 'all' || day.feast_type === selectedFeastType;
    const matchesYear = new Date(day.date).getFullYear() === year;
    return matchesSearch && matchesSeason && matchesFeastType && matchesYear;
  });

  const getLiturgicalDaysForDate = (date: Date) => filteredDays.filter(day => isSameDay(new Date(day.date), date));

  const getSeasonColor = (season: string) => {
    switch (season) {
      case 'ADVENT': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'CHRISTMAS': return 'bg-red-100 text-red-800 border-red-200';
      case 'LENT': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'HOLY_WEEK': return 'bg-red-100 text-red-800 border-red-200';
      case 'EASTER': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'ORDINARY_TIME': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getLiturgicalColor = (color: string) => {
    switch (color) {
      case 'WHITE': return 'bg-white border-gray-300';
      case 'RED': return 'bg-red-500';
      case 'GREEN': return 'bg-green-500';
      case 'VIOLET': return 'bg-purple-500';
      case 'ROSE': return 'bg-pink-300';
      case 'BLACK': return 'bg-black';
      case 'GOLD': return 'bg-yellow-400';
      default: return 'bg-gray-400';
    }
  };

  const getFeastTypeIcon = (feastType: string) => {
    switch (feastType) {
      case 'SOLEMNITY': return <Star className="h-4 w-4" />;
      case 'FEAST': return <Cross className="h-4 w-4" />;
      case 'MEMORIAL': return <Flame className="h-4 w-4" />;
      case 'OPTIONAL_MEMORIAL': return <BookOpen className="h-4 w-4" />;
      default: return <Church className="h-4 w-4" />;
    }
  };

  const getSeasonIcon = (season: string) => {
    switch (season) {
      case 'ADVENT': return <Flame className="h-5 w-5" />;
      case 'CHRISTMAS': return <Star className="h-5 w-5" />;
      case 'LENT': return <Cross className="h-5 w-5" />;
      case 'HOLY_WEEK': return <Cross className="h-5 w-5" />;
      case 'EASTER': return <Star className="h-5 w-5" />;
      case 'ORDINARY_TIME': return <Heart className="h-5 w-5" />;
      default: return <Church className="h-5 w-5" />;
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <Church className="h-6 w-6 mr-2 text-primary-600" />
            Liturgical Calendar
          </h1>
          <p className="text-gray-600">Feast days, seasons, and liturgical celebrations</p>
        </div>
        <div className="mt-4 sm:mt-0 flex gap-3">
          <button onClick={() => setShowPatternsModal(true)} className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
            <Bell className="h-4 w-4 mr-2" />Recurring Patterns
          </button>
          <button onClick={() => setShowCreateModal(true)} className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700">
            <Plus className="h-4 w-4 mr-2" />Add Liturgical Day
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input type="text" placeholder="Search feast days..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500" />
          </div>
          <select value={selectedSeason} onChange={(e) => setSelectedSeason(e.target.value)} className="px-4 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500">
            <option value="all">All Seasons</option>
            <option value="ADVENT">Advent</option>
            <option value="CHRISTMAS">Christmas</option>
            <option value="LENT">Lent</option>
            <option value="HOLY_WEEK">Holy Week</option>
            <option value="EASTER">Easter</option>
            <option value="ORDINARY_TIME">Ordinary Time</option>
          </select>
          <select value={selectedFeastType} onChange={(e) => setSelectedFeastType(e.target.value)} className="px-4 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500">
            <option value="all">All Types</option>
            <option value="SOLEMNITY">Solemnity</option>
            <option value="FEAST">Feast</option>
            <option value="MEMORIAL">Memorial</option>
            <option value="OPTIONAL_MEMORIAL">Optional Memorial</option>
          </select>
          <input type="number" value={year} onChange={(e) => setYear(parseInt(e.target.value))} min="2020" max="2030"
            className="px-4 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500" />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="flex items-center justify-between p-4 border-b">
          <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-2 hover:bg-gray-100 rounded-md"><ChevronLeft className="h-5 w-5" /></button>
          <h2 className="text-lg font-semibold">{format(currentMonth, 'MMMM yyyy')}</h2>
          <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-2 hover:bg-gray-100 rounded-md"><ChevronRight className="h-5 w-5" /></button>
        </div>
        <div className="grid grid-cols-7 gap-px bg-gray-200">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="bg-gray-50 p-2 text-center text-sm font-medium text-gray-700">{day}</div>
          ))}
          {days.map((day, idx) => {
            const dayLiturgicalDays = getLiturgicalDaysForDate(day);
            const isCurrentMonth = isSameMonth(day, currentMonth);
            const isSelected = selectedDate && isSameDay(day, selectedDate);
            return (
              <div key={idx} onClick={() => setSelectedDate(day)}
                className={`bg-white p-2 min-h-32 cursor-pointer hover:bg-gray-50 ${!isCurrentMonth ? 'text-gray-400' : ''} ${isSelected ? 'ring-2 ring-primary-500' : ''}`}>
                <div className="text-sm font-medium mb-1">{format(day, 'd')}</div>
                <div className="space-y-1">
                  {dayLiturgicalDays.map(liturgicalDay => (
                    <div key={liturgicalDay.id} onClick={(e) => { e.stopPropagation(); setShowDayDetails(liturgicalDay); }}
                      className={`text-xs p-1 rounded cursor-pointer border ${getSeasonColor(liturgicalDay.liturgical_season)}`}>
                      <div className="flex items-center">
                        {getFeastTypeIcon(liturgicalDay.feast_type)}
                        <span className="ml-1 truncate font-medium">{liturgicalDay.title}</span>
                      </div>
                      <div className="flex items-center mt-1">
                        <div className={`w-3 h-3 rounded-full border ${getLiturgicalColor(liturgicalDay.liturgical_color)}`} />
                        <span className="ml-1 text-xs opacity-75">{liturgicalDay.feast_type}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <Palette className="h-5 w-5 mr-2" />Liturgical Seasons & Colors
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[
            { season: 'ADVENT', color: 'VIOLET', icon: <Flame className="h-4 w-4" /> },
            { season: 'CHRISTMAS', color: 'WHITE', icon: <Star className="h-4 w-4" /> },
            { season: 'LENT', color: 'VIOLET', icon: <Cross className="h-4 w-4" /> },
            { season: 'HOLY_WEEK', color: 'RED', icon: <Cross className="h-4 w-4" /> },
            { season: 'EASTER', color: 'WHITE', icon: <Star className="h-4 w-4" /> },
            { season: 'ORDINARY_TIME', color: 'GREEN', icon: <Heart className="h-4 w-4" /> },
          ].map(({ season, color, icon }) => (
            <div key={season} className="flex items-center space-x-2">
              <div className={`w-6 h-6 rounded-full border ${getLiturgicalColor(color)}`} />
              <div className="flex items-center">{icon}<span className="ml-1 text-sm font-medium">{season}</span></div>
            </div>
          ))}
        </div>
      </div>

      {/* Day Details Modal */}
      {showDayDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold flex items-center">
                  {getSeasonIcon(showDayDetails.liturgical_season)}
                  <span className="ml-2">{showDayDetails.title}</span>
                </h3>
                <button onClick={() => setShowDayDetails(null)} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div><h4 className="text-sm font-medium text-gray-700 mb-1">Description</h4><p className="text-gray-900">{showDayDetails.description}</p></div>
              <div className="grid grid-cols-2 gap-4">
                <div><h4 className="text-sm font-medium text-gray-700 mb-1">Date</h4><p className="text-gray-900">{format(new Date(showDayDetails.date), 'MMMM dd, yyyy')}</p></div>
                <div><h4 className="text-sm font-medium text-gray-700 mb-1">Feast Type</h4><div className="flex items-center">{getFeastTypeIcon(showDayDetails.feast_type)}<span className="ml-2">{showDayDetails.feast_type}</span></div></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><h4 className="text-sm font-medium text-gray-700 mb-1">Season</h4><div className="flex items-center">{getSeasonIcon(showDayDetails.liturgical_season)}<span className="ml-2">{showDayDetails.liturgical_season}</span></div></div>
                <div><h4 className="text-sm font-medium text-gray-700 mb-1">Liturgical Color</h4><div className="flex items-center"><div className={`w-6 h-6 rounded-full border ${getLiturgicalColor(showDayDetails.liturgical_color)}`} /><span className="ml-2">{showDayDetails.liturgical_color}</span></div></div>
              </div>
              <div className="flex items-center"><Info className="h-4 w-4 mr-2 text-gray-400" /><span className="text-sm text-gray-600">{showDayDetails.is_movable ? 'Movable feast' : 'Fixed feast'} • Rank: {showDayDetails.rank}</span></div>
            </div>
            <div className="p-6 border-t flex justify-end space-x-3">
              <button onClick={() => setShowDayDetails(null)} className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">Close</button>
              <button onClick={() => { setEditingDay(showDayDetails); setShowDayDetails(null); setShowCreateModal(true); }}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">
                <Edit className="h-4 w-4 mr-1 inline" />Edit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Recurring Patterns Modal */}
      {showPatternsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold flex items-center"><Bell className="h-5 w-5 mr-2" />Recurring Event Patterns</h3>
                <button onClick={() => setShowPatternsModal(false)} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {recurringPatterns.map(pattern => (
                  <div key={pattern.id} className="border rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900">{pattern.name}</h4>
                        <p className="text-sm text-gray-600">{pattern.description}</p>
                        <div className="flex items-center mt-2 space-x-4">
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">{pattern.pattern_type}</span>
                          <span className={`text-xs px-2 py-1 rounded ${pattern.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                            {pattern.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button className="text-gray-400 hover:text-primary-600"><Eye className="h-4 w-4" /></button>
                        <button className="text-gray-400 hover:text-primary-600"><Edit className="h-4 w-4" /></button>
                        <button className="text-gray-400 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="p-6 border-t flex justify-end">
              <button onClick={() => setShowPatternsModal(false)} className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <h3 className="text-lg font-semibold">{editingDay ? 'Edit Liturgical Day' : 'Add Liturgical Day'}</h3>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                  <input type="text" defaultValue={editingDay?.title} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <input type="date" defaultValue={editingDay?.date} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea rows={3} defaultValue={editingDay?.description} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Feast Type</label>
                  <select defaultValue={editingDay?.feast_type} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500">
                    <option value="SOLEMNITY">Solemnity</option>
                    <option value="FEAST">Feast</option>
                    <option value="MEMORIAL">Memorial</option>
                    <option value="OPTIONAL_MEMORIAL">Optional Memorial</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Liturgical Season</label>
                  <select defaultValue={editingDay?.liturgical_season} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500">
                    <option value="ADVENT">Advent</option>
                    <option value="CHRISTMAS">Christmas</option>
                    <option value="LENT">Lent</option>
                    <option value="HOLY_WEEK">Holy Week</option>
                    <option value="EASTER">Easter</option>
                    <option value="ORDINARY_TIME">Ordinary Time</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Liturgical Color</label>
                  <select defaultValue={editingDay?.liturgical_color} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500">
                    <option value="WHITE">White</option>
                    <option value="RED">Red</option>
                    <option value="GREEN">Green</option>
                    <option value="VIOLET">Violet</option>
                    <option value="ROSE">Rose</option>
                    <option value="BLACK">Black</option>
                    <option value="GOLD">Gold</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Rank</label>
                  <input type="number" min="1" max="10" defaultValue={editingDay?.rank} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500" />
                </div>
              </div>
              <div className="flex items-center">
                <input type="checkbox" id="is_movable" defaultChecked={editingDay?.is_movable} className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded" />
                <label htmlFor="is_movable" className="ml-2 block text-sm text-gray-900">Movable Feast</label>
              </div>
            </div>
            <div className="p-6 border-t flex justify-end space-x-3">
              <button onClick={() => { setShowCreateModal(false); setEditingDay(null); }} className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
              <button onClick={() => { toast.success(editingDay ? 'Liturgical day updated' : 'Liturgical day created'); setShowCreateModal(false); setEditingDay(null); }}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700">
                {editingDay ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LiturgicalCalendar;