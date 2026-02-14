import { useState, useEffect, useMemo } from 'react';
import { api } from '../api/client';
import { Cluster, Scc, Parish, UserRole } from '../types';
import { Plus, Edit, Trash2, Download } from 'lucide-react';
import Modal from '../components/Modal';
import { CForm, SForm } from '../components/ClusterForms';
import ImportButton from '../components/ImportButton';
import DataTable, { Column, BulkAction } from '../components/DataTable';
import { useAuth } from '../context/AuthContext';

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

  const load = async () => {
    try {
      const [c, s, p] = await Promise.all([
        api.listClusters(parishId),
        api.listSccs(parishId),
        isDioceseAdmin ? api.listParishes() : Promise.resolve([]),
      ]);
      setC(c); setS(s); setP(p);
    } catch (e) { console.error(e); } finally { setL(false); }
  };
  useEffect(() => { load(); }, []);

  const pn = (id: string) => parishes.find(p => p.id === id)?.parish_name || '-';
  const cn = (id?: string) => clusters.find(c => c.id === id)?.cluster_name || '-';
  const svC = async (d: any) => { if (selC) await api.updateCluster(selC.id, d); else await api.createCluster(d); await load(); setM(null); };
  const svS = async (d: any) => { if (selS) await api.updateScc(selS.id, d); else await api.createScc(d); await load(); setM(null); };

  const handleBulkDeleteClusters = async (items: Cluster[]) => {
    for (const c of items) { try { await api.deleteCluster(c.id); } catch { /* skip */ } }
    await load();
  };

  const handleBulkDeleteSccs = async (items: Scc[]) => {
    for (const s of items) { try { await api.deleteScc(s.id); } catch { /* skip */ } }
    await load();
  };

  const handleExportClusters = (items: Cluster[]) => {
    const headers = ['Code', 'Name', 'Parish', 'Leader', 'SCCs'];
    const rows = items.map(c => [c.cluster_code, c.cluster_name, pn(c.parish_id), c.leader_name || '', sccs.filter(s => s.cluster_id === c.id).length.toString()]);
    const csv = [headers.join(','), ...rows.map(r => r.map(v => `"${v}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'clusters_export.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportSccs = (items: Scc[]) => {
    const headers = ['Code', 'Name', 'Parish', 'Cluster', 'Leader', 'Meeting Day', 'Meeting Time'];
    const rows = items.map(s => [s.scc_code, s.scc_name, pn(s.parish_id), cn(s.cluster_id), s.leader_name || '', s.meeting_day || '', s.meeting_time || '']);
    const csv = [headers.join(','), ...rows.map(r => r.map(v => `"${v}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'sccs_export.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  const clusterColumns: Column<Cluster>[] = useMemo(() => [
    { key: 'name', header: 'Name', sortable: true, sortKey: (c) => c.cluster_name, render: (c) => <span className="font-medium text-gray-900">{c.cluster_name}</span> },
    { key: 'code', header: 'Code', render: (c) => <span className="text-sm text-gray-500">{c.cluster_code}</span> },
    { key: 'parish', header: 'Parish', render: (c) => <span className="text-sm text-gray-500">{pn(c.parish_id)}</span> },
    { key: 'leader', header: 'Leader', render: (c) => <span className="text-sm text-gray-600">{c.leader_name || '-'}</span> },
    { key: 'sccs', header: 'SCCs', sortable: true, sortKey: (c) => sccs.filter(s => s.cluster_id === c.id).length, render: (c) => <span className="text-sm text-gray-700 font-medium">{sccs.filter(s => s.cluster_id === c.id).length}</span> },
    ...(!isViewer ? [{
      key: 'actions', header: 'Actions', className: 'text-right', headerClassName: 'text-right',
      render: (c: Cluster) => (
        <div className="flex items-center justify-end gap-1" onClick={e => e.stopPropagation()}>
          <button onClick={() => { setSC(c); setM('c'); }} className="p-1.5 text-primary-600 hover:bg-primary-50 rounded-md transition-colors" title="Edit"><Edit size={15} /></button>
          <button onClick={async () => { if (confirm('Delete this cluster?')) { await api.deleteCluster(c.id); load(); } }} className="p-1.5 text-red-500 hover:bg-red-50 rounded-md transition-colors" title="Delete"><Trash2 size={15} /></button>
        </div>
      ),
    }] as Column<Cluster>[] : []),
  ], [isViewer, sccs, parishes]);

  const sccColumns: Column<Scc>[] = useMemo(() => [
    { key: 'name', header: 'Name', sortable: true, sortKey: (s) => s.scc_name, render: (s) => <span className="font-medium text-gray-900">{s.scc_name}</span> },
    { key: 'code', header: 'Code', render: (s) => <span className="text-sm text-gray-500">{s.scc_code}</span> },
    { key: 'parish', header: 'Parish', render: (s) => <span className="text-sm text-gray-500">{pn(s.parish_id)}</span> },
    { key: 'cluster', header: 'Cluster', render: (s) => <span className="text-sm text-gray-500">{cn(s.cluster_id)}</span> },
    { key: 'leader', header: 'Leader', render: (s) => <span className="text-sm text-gray-600">{s.leader_name || '-'}</span> },
    { key: 'meeting', header: 'Meeting', render: (s) => <span className="text-sm text-gray-500 whitespace-nowrap">{s.meeting_day || ''} {s.meeting_time || ''}</span> },
    ...(!isViewer ? [{
      key: 'actions', header: 'Actions', className: 'text-right', headerClassName: 'text-right',
      render: (s: Scc) => (
        <div className="flex items-center justify-end gap-1" onClick={e => e.stopPropagation()}>
          <button onClick={() => { setSS(s); setM('s'); }} className="p-1.5 text-primary-600 hover:bg-primary-50 rounded-md transition-colors" title="Edit"><Edit size={15} /></button>
          <button onClick={async () => { if (confirm('Delete this SCC?')) { await api.deleteScc(s.id); load(); } }} className="p-1.5 text-red-500 hover:bg-red-50 rounded-md transition-colors" title="Delete"><Trash2 size={15} /></button>
        </div>
      ),
    }] as Column<Scc>[] : []),
  ], [isViewer, clusters, parishes]);

  const clusterBulkActions: BulkAction<Cluster>[] = [
    { label: 'Export CSV', icon: <Download size={14} />, onClick: handleExportClusters },
    ...(!isViewer ? [{ label: 'Delete Selected', icon: <Trash2 size={14} />, onClick: handleBulkDeleteClusters, variant: 'danger' as const, requireConfirm: true, confirmMessage: 'Delete the selected clusters?' }] : []),
  ];

  const sccBulkActions: BulkAction<Scc>[] = [
    { label: 'Export CSV', icon: <Download size={14} />, onClick: handleExportSccs },
    ...(!isViewer ? [{ label: 'Delete Selected', icon: <Trash2 size={14} />, onClick: handleBulkDeleteSccs, variant: 'danger' as const, requireConfirm: true, confirmMessage: 'Delete the selected SCCs?' }] : []),
  ];

  if (loading) return <p className="text-center py-8 text-gray-500">Loading...</p>;

  return (
    <div className="space-y-6">
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
        </div>
      </div>

      <div className="flex border-b">
        {(['c', 's'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 text-sm font-medium ${tab === t ? 'text-primary-700 border-b-2 border-primary-600' : 'text-gray-500'}`}>
            {t === 'c' ? 'Clusters' : 'SCCs'}
          </button>
        ))}
      </div>

      {tab === 'c' ? (
        <DataTable<Cluster>
          data={clusters}
          columns={clusterColumns}
          keyField="id"
          bulkActions={clusterBulkActions}
          emptyTitle="No clusters found"
          emptyMessage="Add your first cluster to organize SCCs."
        />
      ) : (
        <DataTable<Scc>
          data={sccs}
          columns={sccColumns}
          keyField="id"
          bulkActions={sccBulkActions}
          emptyTitle="No SCCs found"
          emptyMessage="Add your first Small Christian Community."
        />
      )}

      <Modal isOpen={modal === 'c'} onClose={() => setM(null)} title={selC ? 'Edit Cluster' : 'Add Cluster'}>
        <CForm i={selC} p={parishes} onD={svC} onX={() => setM(null)} />
      </Modal>
      <Modal isOpen={modal === 's'} onClose={() => setM(null)} title={selS ? 'Edit SCC' : 'Add SCC'}>
        <SForm i={selS} p={parishes} c={clusters} onD={svS} onX={() => setM(null)} />
      </Modal>
    </div>
  );
}
