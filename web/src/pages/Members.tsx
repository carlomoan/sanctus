import { useState, useEffect } from 'react';
import { api } from '../api/client';
import { Member, Parish, CreateMemberRequest, UpdateMemberRequest } from '../types';
import { Plus, Search, User, MapPin, Filter, Edit, Trash2 } from 'lucide-react';
import Modal from '../components/Modal';
import MemberForm from '../components/MemberForm';

const Members = () => {
  const [members, setMembers] = useState<Member[]>([]);
  const [parishes, setParishes] = useState<Parish[]>([]);
  const [selectedParishId, setSelectedParishId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | undefined>(undefined);

  useEffect(() => {
    const fetchParishes = async () => {
      try {
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

  const fetchMembers = async () => {
    if (!selectedParishId) return;

    setLoading(true);
    try {
      const data = await api.listMembers(selectedParishId);
      setMembers(data);
      setError(null);
    } catch (err) {
      setError('Failed to load members');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, [selectedParishId]);

  const handleCreate = () => {
    setSelectedMember(undefined);
    setIsModalOpen(true);
  };

  const handleEdit = (member: Member) => {
    setSelectedMember(member);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this member?')) {
      try {
        await api.deleteMember(id);
        setMembers(members.filter(m => m.id !== id));
      } catch (err) {
        console.error('Failed to delete member:', err);
        alert('Failed to delete member');
      }
    }
  };

  const handleSubmit = async (data: CreateMemberRequest | UpdateMemberRequest) => {
    try {
      if (selectedMember) {
        await api.updateMember(selectedMember.id, data as UpdateMemberRequest);
      } else {
        await api.createMember(data as CreateMemberRequest);
      }
      await fetchMembers();
      setIsModalOpen(false);
    } catch (err) {
      console.error('Failed to save member:', err);
      alert('Failed to save member');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Members</h1>
        <button
          onClick={handleCreate}
          disabled={!selectedParishId}
          className="bg-primary-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus size={20} />
          Add Member
        </button>
      </div>

      {/* Search and Filter */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search members..."
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

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
      </div>

      {/* Member List */}
      {!selectedParishId ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-100">
          <p className="text-gray-500">Please select a parish to view members.</p>
        </div>
      ) : loading ? (
        <div className="text-center py-12 text-gray-500">Loading members...</div>
      ) : error ? (
        <div className="text-center py-12 text-red-500">{error}</div>
      ) : members.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-100">
          <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <User className="text-gray-400" size={24} />
          </div>
          <h3 className="text-lg font-medium text-gray-900">No members found</h3>
          <p className="text-gray-500 mt-1">Get started by adding a new member to this parish.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Member
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Details
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {members.map((member) => (
                <tr key={member.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 font-bold">
                        {member.first_name[0]}{member.last_name[0]}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{member.first_name} {member.last_name}</div>
                        <div className="text-sm text-gray-500">{member.member_code}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{member.gender}</div>
                    <div className="text-sm text-gray-500">{member.marital_status}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{member.phone_number}</div>
                    {member.physical_address && (
                      <div className="flex items-center text-sm text-gray-500">
                        <MapPin size={12} className="mr-1" />
                        <span className="truncate max-w-[150px]">{member.physical_address}</span>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleEdit(member)}
                      className="text-primary-600 hover:text-primary-900 mr-3"
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(member.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <Trash2 size={18} />
                    </button>
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
        title={selectedMember ? 'Edit Member' : 'Add New Member'}
      >
        <MemberForm
          initialData={selectedMember}
          onSubmit={handleSubmit}
          onCancel={() => setIsModalOpen(false)}
          parishId={selectedParishId}
        />
      </Modal>
    </div>
  );
};

export default Members;
