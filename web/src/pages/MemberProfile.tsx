import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { Member, Family, Scc, SacramentRecord, IncomeTransaction } from '../types';
import { ArrowLeft, User, Users, Church, Scroll, Coins, Edit, Camera } from 'lucide-react';
import Modal from '../components/Modal';
import MemberForm from '../components/MemberForm';

const API_BASE_URL = 'http://localhost:3000';

export default function MemberProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [member, setMember] = useState<Member | null>(null);
  const [family, setFamily] = useState<Family | null>(null);
  const [scc, setScc] = useState<Scc | null>(null);
  const [sacraments, setSacraments] = useState<SacramentRecord[]>([]);
  const [transactions, setTransactions] = useState<IncomeTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !member) return;
    if (file.size > 5 * 1024 * 1024) {
      alert('File too large. Maximum size is 5MB.');
      return;
    }
    setUploadingPhoto(true);
    try {
      const result = await api.uploadMemberPhoto(member.id, file);
      setMember({ ...member, photo_url: result.url });
    } catch (err) {
      console.error('Failed to upload photo:', err);
      alert('Failed to upload photo');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const loadData = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const m = await api.getMember(id);
      setMember(m);

      const [f, s, sac, trans] = await Promise.all([
        m.family_id ? api.listFamilies(m.parish_id).then(fs => fs.find(x => x.id === m.family_id) || null) : Promise.resolve(null),
        m.scc_id ? api.listSccs(m.parish_id).then(ss => ss.find(x => x.id === m.scc_id) || null) : Promise.resolve(null),
        api.listSacraments(m.parish_id).then(all => all.filter(r => r.member_id === id)),
        api.listIncomeTransactions(m.parish_id).then((all: IncomeTransaction[]) => all.filter((t: IncomeTransaction) => t.member_id === id))
      ]);

      setFamily(f);
      setScc(s);
      setSacraments(sac);
      setTransactions(trans);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [id]);

  if (loading) return <div className="p-8 text-center text-gray-500">Loading profile...</div>;
  if (!member) return <div className="p-8 text-center text-red-500">Member not found</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/members')} className="p-2 hover:bg-gray-100 rounded-full">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Member Profile</h1>
        <div className="flex-1" />
        <button
          onClick={() => setIsEditModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
        >
          <Edit size={16} /> Edit Profile
        </button>
      </div>

      {/* Header Card */}
      <div className="bg-white rounded-lg shadow p-6 flex items-start gap-6">
        <div className="relative group">
          <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center text-gray-400 overflow-hidden">
            {member.photo_url ? (
              <img src={member.photo_url.startsWith('http') ? member.photo_url : `${API_BASE_URL}${member.photo_url}`} alt="" className="w-full h-full rounded-full object-cover" />
            ) : (
              <User size={48} />
            )}
          </div>
          <button
            onClick={() => photoInputRef.current?.click()}
            disabled={uploadingPhoto}
            className="absolute inset-0 rounded-full bg-black bg-opacity-0 group-hover:bg-opacity-40 flex items-center justify-center transition-all cursor-pointer"
          >
            <Camera size={20} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
          <input
            ref={photoInputRef}
            type="file"
            accept="image/*"
            onChange={handlePhotoUpload}
            className="hidden"
          />
          {uploadingPhoto && (
            <div className="absolute inset-0 rounded-full bg-white bg-opacity-70 flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
        </div>
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-gray-900">
            {member.first_name} {member.middle_name} {member.last_name}
          </h2>
          <p className="text-gray-500 mt-1">{member.member_code} • {member.gender}</p>
          <div className="flex gap-4 mt-4">
            <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 px-3 py-1 rounded-full">
              <Users size={14} /> {family ? family.family_name : 'No Family'} ({member.family_role || 'MEMBER'})
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 px-3 py-1 rounded-full">
              <Church size={14} /> {scc ? scc.scc_name : 'No SCC'}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Personal Info */}
        <div className="bg-white rounded-lg shadow p-6 md:col-span-2 space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2 border-b pb-2">
            <User size={18} /> Personal Details
          </h3>
          <div className="grid grid-cols-2 gap-y-4 text-sm">
            <div><label className="block text-gray-500">Date of Birth</label>{member.date_of_birth || '-'}</div>
            <div><label className="block text-gray-500">Marital Status</label>{member.marital_status || '-'}</div>
            <div><label className="block text-gray-500">National ID</label>{member.national_id || '-'}</div>
            <div><label className="block text-gray-500">Occupation</label>{member.occupation || '-'}</div>
            <div><label className="block text-gray-500">Phone</label>{member.phone_number || '-'}</div>
            <div><label className="block text-gray-500">Email</label>{member.email || '-'}</div>
            <div className="col-span-2"><label className="block text-gray-500">Address</label>{member.physical_address || '-'}</div>
          </div>
        </div>

        {/* Sacraments */}
        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2 border-b pb-2">
            <Scroll size={18} /> Sacraments
          </h3>
          {sacraments.length === 0 ? (
            <p className="text-gray-500 text-sm">No sacrament records found.</p>
          ) : (
            <ul className="space-y-3">
              {sacraments.map(s => (
                <li key={s.id} className="text-sm border-l-2 border-primary-300 pl-3">
                  <div className="font-medium text-gray-900">{s.sacrament_type}</div>
                  <div className="text-gray-500 text-xs">{s.sacrament_date}</div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Contributions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold flex items-center gap-2 border-b pb-4 mb-4">
          <Coins size={18} /> Recent Contributions
        </h3>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-500">
              <tr>
                <th className="px-4 py-2">Date</th>
                <th className="px-4 py-2">Category</th>
                <th className="px-4 py-2">Method</th>
                <th className="px-4 py-2 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {transactions.slice(0, 10).map(t => (
                <tr key={t.id}>
                  <td className="px-4 py-2">{t.transaction_date}</td>
                  <td className="px-4 py-2">{t.category.replace('_', ' ')}</td>
                  <td className="px-4 py-2">{t.payment_method}</td>
                  <td className="px-4 py-2 text-right font-medium">{t.amount.toLocaleString()}</td>
                </tr>
              ))}
              {transactions.length === 0 && (
                <tr><td colSpan={4} className="px-4 py-4 text-center text-gray-500">No contributions recorded.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Member"
      >
        <MemberForm
          initialData={member}
          parishId={member.parish_id}
          onCancel={() => setIsEditModalOpen(false)}
          onSubmit={async (data) => {
            await api.updateMember(member.id, data);
            await loadData();
            setIsEditModalOpen(false);
          }}
        />
      </Modal>
    </div>
  );
}
