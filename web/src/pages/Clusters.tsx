import { useState, useEffect } from 'react';
import { api } from '../api/client';
import { Cluster, Scc, Parish, UserRole } from '../types';
import { Plus, Edit, Trash2 } from 'lucide-react';
import Modal from '../components/Modal';
import { CForm, SForm } from '../components/ClusterForms';
import ImportButton from '../components/ImportButton';
import { useAuth } from '../context/AuthContext';

const H = "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase";
const D = "px-6 py-4 text-sm text-gray-500";
const D0 = "px-6 py-4 text-sm font-medium";

export default function Clusters() {
  const { user } = useAuth();
  const isViewer = user?.role === UserRole.VIEWER;
  const isDioceseAdmin = user?.role === UserRole.SUPER_ADMIN;
  const userParishId = user?.parish_id;

  const [tab, setTab] = useState<'c' | 's'>('c');
  const [clusters, setC] = useState<Cluster[]>([]);
  const [sccs, setS] = useState<Scc[]>([]);
  const [parishes, setP] = useState<Parish[]>([]);
  const [loading, setL] = useState(true);
  const [modal, setM] = useState<string | null>(null);
  const [selC, setSC] = useState<Cluster | undefined>();
  const [selS, setSS] = useState<Scc | undefined>();
  const parishId = isDioceseAdmin ? undefined : userParishId;
  const load = async () => { try { const [c, s, p] = await Promise.all([api.listClusters(parishId), api.listSccs(parishId), isDioceseAdmin ? api.listParishes() : Promise.resolve([])]); setC(c); setS(s); setP(p); } catch (e) { console.error(e); } finally { setL(false); } };
  useEffect(() => { load(); }, []);
  const pn = (id: string) => parishes.find(p => p.id === id)?.parish_name || '-';
  const cn = (id?: string) => clusters.find(c => c.id === id)?.cluster_name || '-';
  const svC = async (d: any) => { if (selC) await api.updateCluster(selC.id, d); else await api.createCluster(d); await load(); setM(null); };
  const svS = async (d: any) => { if (selS) await api.updateScc(selS.id, d); else await api.createScc(d); await load(); setM(null); };
  if (loading) return <p className="text-center py-8 text-gray-500">Loading...</p>;
  return (<div className="space-y-6">
    <div className="flex justify-between items-center">
      <h1 className="text-2xl font-bold text-gray-900">Clusters & SCCs</h1>
      <div className="flex gap-2 items-center">
        {!isViewer && (
          <>
            <ImportButton
              label={tab === 'c' ? 'Import Clusters' : 'Import SCCs'}
              onImport={async (file) => {
                const parish = parishes[0] || (userParishId ? { id: userParishId } : null);
                if (!parish) throw new Error('No parish available');
                if (tab === 'c') {
                  const res = await api.importClusters(file, parish.id);
                  await load();
                  return res;
                } else {
                  const res = await api.importSccs(file, parish.id);
                  await load();
                  return res;
                }
              }}
              templateColumns={tab === 'c'
                ? ['cluster_code', 'cluster_name', 'location_description', 'leader_name']
                : ['scc_code', 'scc_name', 'cluster_code', 'patron_saint', 'leader_name', 'location_description', 'meeting_day', 'meeting_time']
              }
            />
            <button onClick={() => { setSC(undefined); setM('c'); }} className="bg-primary-600 text-white px-3 py-2 rounded-lg text-sm flex items-center gap-1"><Plus size={16} />Cluster</button>
            <button onClick={() => { setSS(undefined); setM('s'); }} className="bg-green-600 text-white px-3 py-2 rounded-lg text-sm flex items-center gap-1"><Plus size={16} />SCC</button>
          </>
        )}
      </div></div>
    <div className="flex border-b">
      {['c', 's'].map(t => <button key={t} onClick={() => setTab(t as any)} className={`px-4 py-2 text-sm font-medium ${tab === t ? 'text-primary-700 border-b-2 border-primary-600' : 'text-gray-500'}`}>{t === 'c' ? 'Clusters' : 'SCCs'}</button>)}
    </div>
    {tab === 'c' ? <table className="min-w-full divide-y divide-gray-200 bg-white rounded-lg shadow-sm border"><thead className="bg-gray-50"><tr><th className={H}>Name</th><th className={H}>Code</th><th className={H}>Parish</th><th className={H}>Leader</th><th className={H}>SCCs</th><th className={H} /></tr></thead><tbody className="divide-y divide-gray-200">{clusters.map(c => <tr key={c.id}><td className={D0}>{c.cluster_name}</td><td className={D}>{c.cluster_code}</td><td className={D}>{pn(c.parish_id)}</td><td className={D}>{c.leader_name || '-'}</td><td className={D}>{sccs.filter(s => s.cluster_id === c.id).length}</td><td className={D + " text-right"}>{!isViewer && <><button onClick={() => { setSC(c); setM('c'); }} className="text-gray-400 hover:text-primary-600 mr-2"><Edit size={16} /></button><button onClick={async () => { if (confirm('Delete?')) { await api.deleteCluster(c.id); load(); } }} className="text-gray-400 hover:text-red-600"><Trash2 size={16} /></button></>}</td></tr>)}</tbody></table>
      : <table className="min-w-full divide-y divide-gray-200 bg-white rounded-lg shadow-sm border"><thead className="bg-gray-50"><tr><th className={H}>Name</th><th className={H}>Code</th><th className={H}>Parish</th><th className={H}>Cluster</th><th className={H}>Leader</th><th className={H}>Meeting</th><th className={H} /></tr></thead><tbody className="divide-y divide-gray-200">{sccs.map(s => <tr key={s.id}><td className={D0}>{s.scc_name}</td><td className={D}>{s.scc_code}</td><td className={D}>{pn(s.parish_id)}</td><td className={D}>{cn(s.cluster_id)}</td><td className={D}>{s.leader_name || '-'}</td><td className={D}>{s.meeting_day || ''} {s.meeting_time || ''}</td><td className={D + " text-right"}>{!isViewer && <><button onClick={() => { setSS(s); setM('s'); }} className="text-gray-400 hover:text-primary-600 mr-2"><Edit size={16} /></button><button onClick={async () => { if (confirm('Delete?')) { await api.deleteScc(s.id); load(); } }} className="text-gray-400 hover:text-red-600"><Trash2 size={16} /></button></>}</td></tr>)}</tbody></table>}
    <Modal isOpen={modal === 'c'} onClose={() => setM(null)} title={selC ? 'Edit Cluster' : 'Add Cluster'}><CForm i={selC} p={parishes} onD={svC} onX={() => setM(null)} /></Modal>
    <Modal isOpen={modal === 's'} onClose={() => setM(null)} title={selS ? 'Edit SCC' : 'Add SCC'}><SForm i={selS} p={parishes} c={clusters} onD={svS} onX={() => setM(null)} /></Modal>
  </div>);
}
