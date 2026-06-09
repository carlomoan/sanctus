import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Users, Calendar, TrendingUp, Download, Upload } from 'lucide-react';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import { useAuth } from '../context/AuthContext';

interface AttendanceRecord {
  id: string;
  parish_id: string;
  member_id: string | null;
  scc_id: string | null;
  event_id: string | null;
  attendance_date: string;
  status: string;
  check_in_time: string | null;
  notes: string | null;
}

interface AttendanceStats {
  total_present: number;
  total_absent: number;
  total_excused: number;
  attendance_rate: number;
  total_records: number;
}

export default function Attendance() {
  const { user } = useAuth();
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [stats, setStats] = useState<AttendanceStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<AttendanceRecord | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    fetchAttendance();
    fetchStats();
  }, [selectedDate]);

  const fetchAttendance = async () => {
    try {
      const response = await fetch(`/api/attendance?start_date=${selectedDate}&end_date=${selectedDate}`);
      if (response.ok) {
        const data = await response.json();
        setAttendance(data);
      }
    } catch (error) {
      console.error('Failed to fetch attendance:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch(`/api/attendance/stats?start_date=${selectedDate}&end_date=${selectedDate}`);
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Failed to fetch attendance stats:', error);
    }
  };

  const handleCreate = () => {
    setEditingRecord(null);
    setIsModalOpen(true);
  };

  const handleEdit = (record: AttendanceRecord) => {
    setEditingRecord(record);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this attendance record?')) return;

    try {
      const response = await fetch(`/api/attendance/${id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        fetchAttendance();
        fetchStats();
      }
    } catch (error) {
      console.error('Failed to delete attendance record:', error);
    }
  };

  const handleSubmit = async (formData: any) => {
    try {
      const url = editingRecord
        ? `/api/attendance/${editingRecord.id}`
        : '/api/attendance';
      const method = editingRecord ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setIsModalOpen(false);
        fetchAttendance();
        fetchStats();
      }
    } catch (error) {
      console.error('Failed to save attendance record:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PRESENT': return 'bg-green-100 text-green-800';
      case 'ABSENT': return 'bg-red-100 text-red-800';
      case 'EXCUSED': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const columns = [
    {
      key: 'date', label: 'Date', render: (item: AttendanceRecord) => (
        <span className="text-sm">{new Date(item.attendance_date).toLocaleDateString()}</span>
      )
    },
    {
      key: 'status', label: 'Status', render: (item: AttendanceRecord) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
          {item.status}
        </span>
      )
    },
    {
      key: 'check_in', label: 'Check-in', render: (item: AttendanceRecord) => (
        <span className="text-sm text-gray-600">{item.check_in_time || '-'}</span>
      )
    },
    {
      key: 'notes', label: 'Notes', render: (item: AttendanceRecord) => (
        <span className="text-sm text-gray-600 truncate max-w-xs">{item.notes || '-'}</span>
      )
    },
  ];

  const canCreate = user?.role === 'SUPER_ADMIN' || user?.role === 'PARISH_ADMIN' || user?.role === 'SECRETARY';

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Attendance Tracking</h1>
          <p className="text-gray-600">Track member and event attendance</p>
        </div>
        <div className="flex gap-2">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="border-slate-200 rounded-lg px-3 py-2"
          />
          {canCreate && (
            <button
              onClick={handleCreate}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus className="w-4 h-4" />
              Record Attendance
            </button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Records</p>
                <p className="text-2xl font-bold">{stats.total_records}</p>
              </div>
              <Users className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Present</p>
                <p className="text-2xl font-bold text-green-600">{stats.total_present}</p>
              </div>
              <Users className="w-8 h-8 text-green-600" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Absent</p>
                <p className="text-2xl font-bold text-red-600">{stats.total_absent}</p>
              </div>
              <Users className="w-8 h-8 text-red-600" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Attendance Rate</p>
                <p className="text-2xl font-bold text-blue-600">{stats.attendance_rate.toFixed(1)}%</p>
              </div>
              <TrendingUp className="w-8 h-8 text-blue-600" />
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-8">Loading attendance records...</div>
      ) : (
        <DataTable
          data={attendance}
          columns={columns}
          actions={(item) => (
            <div className="flex gap-2">
              {canCreate && (
                <>
                  <button
                    onClick={() => handleEdit(item)}
                    className="p-2 text-green-600 hover:bg-green-50 rounded"
                    title="Edit"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
          )}
        />
      )}

      {/* Create/Edit Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingRecord ? 'Edit Attendance' : 'Record Attendance'}>
        <AttendanceForm
          record={editingRecord}
          onSubmit={handleSubmit}
          onCancel={() => setIsModalOpen(false)}
        />
      </Modal>
    </div>
  );
}

function AttendanceForm({ record, onSubmit, onCancel }: {
  record: AttendanceRecord | null;
  onSubmit: (data: any) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState({
    attendance_date: record?.attendance_date || new Date().toISOString().split('T')[0],
    status: record?.status || 'PRESENT',
    check_in_time: record?.check_in_time || '',
    notes: record?.notes || '',
    member_id: record?.member_id || '',
    scc_id: record?.scc_id || '',
    event_id: record?.event_id || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      check_in_time: formData.check_in_time || null,
      member_id: formData.member_id || null,
      scc_id: formData.scc_id || null,
      event_id: formData.event_id || null,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
        <input
          type="date"
          value={formData.attendance_date}
          onChange={(e) => setFormData({ ...formData, attendance_date: e.target.value })}
          className="w-full border-slate-200 rounded-lg px-3 py-2"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
        <select
          value={formData.status}
          onChange={(e) => setFormData({ ...formData, status: e.target.value })}
          className="w-full border-slate-200 rounded-lg px-3 py-2"
          required
        >
          <option value="PRESENT">Present</option>
          <option value="ABSENT">Absent</option>
          <option value="EXCUSED">Excused</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Check-in Time</label>
        <input
          type="time"
          value={formData.check_in_time}
          onChange={(e) => setFormData({ ...formData, check_in_time: e.target.value })}
          className="w-full border-slate-200 rounded-lg px-3 py-2"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
        <textarea
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          className="w-full border-slate-200 rounded-lg px-3 py-2 h-24"
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
          {record ? 'Update' : 'Save'}
        </button>
      </div>
    </form>
  );
}
