import { useState, useEffect, useMemo } from 'react';
import { api } from '../api/client';
import { Cluster, Scc, Parish, UserRole } from '../types';
import { Plus, Edit, Trash2, Download } from 'lucide-react';
import Modal from '../components/Modal';
import { CForm, SForm } from '../components/ClusterForms';
import ImportButton from '../components/ImportButton';
import DataTable, { Column, BulkAction } from '../components/DataTable';
import { useAuth } from '../context/AuthContext';
import { useParish } from '../context/ParishContext';

export default function Clusters() {
  const { user } = useAuth();
  const { getEffectiveParishId, activeParishId, isGlobalMode, setActiveParish } = useParish();
  const isViewer = user?.role === UserRole.VIEWER;
  const isDioceseAdmin = user?.role === UserRole.SUPER_ADMIN;

  const [tab, setTab] = useState<'c' | 's'>('c');
  const [clusters, setC] = useState<Cluster[]>([]);
  const [sccs, setS] = useState<Scc[]>([]);
  const [parishes, setP] = useState<Parish[]>([]);
  const [loading, setL] = useState(true);
  const [modal, setM] = useState<string | null>(null);
  const [selC, setSC] = useState<Cluster | undefined>();
  const [selS, setSS] = useState<Scc | undefined>();
  const [selectedClusterForScc, setSelectedClusterForScc] = useState<Cluster | undefined>(undefined);
  const [showImportModal, setShowImportModal] = useState<'cluster' | 'scc' | null>(null);
  const [selectedParishForImport, setSelectedParishForImport] = useState<string>('');
  const [selectedClusterForImport, setSelectedClusterForImport] = useState<string>('');

  // Get parish ID from context
  const parishId = getEffectiveParishId();

  const load = async () => {
    try {
      console.log('Loading clusters with parishId:', parishId);
      const [c, s, p] = await Promise.all([
        api.listClusters(parishId || undefined),
        api.listSccs(parishId || undefined),
        isDioceseAdmin ? api.listParishes() : Promise.resolve([]),
      ]);
      console.log('Loaded clusters:', c);
      console.log('Loaded SCCs:', s);
      setC(c); setS(s); setP(p);
    } catch (e) {
      console.error('Failed to load data:', e);
    } finally {
      setL(false);
    }
  };
  useEffect(() => {
    setL(true);
    load();
  }, [parishId]);

  const pn = (id: string) => parishes.find(p => p.id === id)?.parish_name || '-';
  const cn = (id?: string) => clusters.find(c => c.id === id)?.cluster_name || '-';
  const svC = async (d: any) => {
    const dataWithParish = isDioceseAdmin ? { ...d, parish_id: activeParishId } : d;
    if (selC) await api.updateCluster(selC.id, dataWithParish);
    else await api.createCluster(dataWithParish);
    await load();
    setM(null);
  };
  const svS = async (d: any) => {
    const dataWithParish = isDioceseAdmin ? { ...d, parish_id: activeParishId } : d;
    if (selectedClusterForScc) {
      dataWithParish.cluster_id = selectedClusterForScc.id;
      // Use the parish_id from the selected cluster
      dataWithParish.parish_id = selectedClusterForScc.parish_id;
    }
    if (selS) await api.updateScc(selS.id, dataWithParish);
    else await api.createScc(dataWithParish);
    await load();
    setM(null);
    setSelectedClusterForScc(undefined);
  };

  const handleCreateScc = () => {
    if (!activeParishId && !isDioceseAdmin) {
      alert('Please select a parish first');
      return;
    }
    if (clusters.length === 0) {
      alert('Please create a cluster first before creating SCCs');
      return;
    }
    setSS(undefined);
    setSelectedClusterForScc(undefined);
    setM('s');
  };

  const handleCreateSccForCluster = (cluster: Cluster) => {
    setSelectedClusterForScc(cluster);
    setSS(undefined);
    setM('s');
  };

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
          <button
            onClick={() => handleCreateSccForCluster(c)}
            className="p-1.5 text-green-600 hover:bg-green-50 rounded-md transition-colors"
            title="Add SCC to this cluster"
          >
            <Plus size={15} />
          </button>
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
          <button
            onClick={() => {
              // Navigate to families page with pre-selected SCC
              window.location.href = `/families?scc=${s.id}`;
            }}
            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
            title="Add Family to this SCC"
          >
            <Plus size={15} />
          </button>
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
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clusters & SCCs</h1>
          {isDioceseAdmin && parishes.length > 0 && (
            <div className="mt-2">
              <select
                value={activeParishId || ''}
                onChange={(e) => setActiveParish(e.target.value || null)}
                className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">All Parishes</option>
                {parishes.map(parish => (
                  <option key={parish.id} value={parish.id}>{parish.parish_name}</option>
                ))}
              </select>
            </div>
          )}
        </div>
        <div className="flex gap-2 items-center">
          {!isViewer && (
            <>
              <ImportButton
                label={tab === 'c' ? 'Import Clusters' : 'Import SCCs'}
                onImport={async (file) => {
                  // Show selection modal instead of direct import
                  if (tab === 'c') {
                    setShowImportModal('cluster');
                  } else {
                    if (clusters.length === 0) {
                      alert('Please create clusters first before importing SCCs');
                      return;
                    }
                    setShowImportModal('scc');
                  }
                  return { success_count: 0, errors: [] };
                }}
                templateColumns={tab === 'c'
                  ? ['cluster_code', 'cluster_name', 'location_description', 'leader_name']
                  : ['scc_code', 'scc_name', 'cluster_code', 'patron_saint', 'leader_name', 'location_description', 'meeting_day', 'meeting_time']
                }
              />
              <button onClick={() => { setSC(undefined); setM('c'); }} className="bg-primary-600 text-white px-3 py-2 rounded-lg text-sm flex items-center gap-1"><Plus size={16} />Cluster</button>
              <button onClick={handleCreateScc} className="bg-green-600 text-white px-3 py-2 rounded-lg text-sm flex items-center gap-1"><Plus size={16} />SCC</button>
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
        <CForm i={selC} p={parishes} selectedParishId={activeParishId} onD={svC} onX={() => setM(null)} />
      </Modal>
      <Modal isOpen={modal === 's'} onClose={() => { setM(null); setSelectedClusterForScc(undefined); }} title={selS ? 'Edit SCC' : 'Add SCC'}>
        {selectedClusterForScc && !selS && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              Creating SCC for cluster: <strong>{selectedClusterForScc.cluster_name}</strong>
            </p>
          </div>
        )}
        <SForm
          i={selS}
          p={parishes}
          c={clusters}
          selectedParishId={activeParishId}
          selectedClusterId={selectedClusterForScc?.id}
          onD={svS}
          onX={() => { setM(null); setSelectedClusterForScc(undefined); }}
        />
      </Modal>

      {/* Cluster Import Selection Modal */}
      <Modal
        isOpen={showImportModal === 'cluster'}
        onClose={() => { setShowImportModal(null); setSelectedParishForImport(''); }}
        title="Import Clusters - Select Parish"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Select the parish for which you want to import clusters:
          </p>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Parish *</label>
            <select
              value={selectedParishForImport}
              onChange={(e) => setSelectedParishForImport(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm border p-2"
              required
            >
              <option value="">Select Parish</option>
              {parishes.map(p => (
                <option key={p.id} value={p.id}>{p.parish_name}</option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              onClick={() => { setShowImportModal(null); setSelectedParishForImport(''); }}
              className="px-4 py-2 border rounded-md text-sm text-gray-700"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                if (!selectedParishForImport) {
                  alert('Please select a parish');
                  return;
                }
                // Trigger actual file selection
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = '.csv,.xlsx';
                input.onchange = async (e) => {
                  const file = (e.target as HTMLInputElement).files?.[0];
                  if (file) {
                    try {
                      const res = await api.importClusters(file, selectedParishForImport);
                      await load();
                      alert(`Successfully imported ${res.success_count} clusters${res.errors.length > 0 ? `. ${res.errors.length} errors occurred.` : ''}`);
                    } catch (err: any) {
                      alert('Import failed: ' + err.message);
                    }
                  }
                };
                input.click();
                setShowImportModal(null);
                setSelectedParishForImport('');
              }}
              className="px-4 py-2 rounded-md text-sm text-white bg-primary-600 hover:bg-primary-700"
            >
              Next: Select File
            </button>
          </div>
        </div>
      </Modal>

      {/* SCC Import Selection Modal */}
      <Modal
        isOpen={showImportModal === 'scc'}
        onClose={() => { setShowImportModal(null); setSelectedClusterForImport(''); }}
        title="Import SCCs - Select Cluster"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Select the cluster for which you want to import SCCs:
          </p>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Cluster *</label>
            <select
              value={selectedClusterForImport}
              onChange={(e) => setSelectedClusterForImport(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm border p-2"
              required
            >
              <option value="">Select Cluster</option>
              {clusters.map(c => (
                <option key={c.id} value={c.id}>{c.cluster_name} ({c.cluster_code})</option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              onClick={() => { setShowImportModal(null); setSelectedClusterForImport(''); }}
              className="px-4 py-2 border rounded-md text-sm text-gray-700"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                if (!selectedClusterForImport) {
                  alert('Please select a cluster');
                  return;
                }
                // Trigger actual file selection
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = '.csv,.xlsx';
                input.onchange = async (e) => {
                  const file = (e.target as HTMLInputElement).files?.[0];
                  if (file) {
                    try {
                      const cluster = clusters.find(c => c.id === selectedClusterForImport);
                      if (!cluster) return;
                      const res = await api.importSccs(file, cluster.parish_id);
                      await load();
                      alert(`Successfully imported ${res.success_count} SCCs${res.errors.length > 0 ? `. ${res.errors.length} errors occurred.` : ''}`);
                    } catch (err: any) {
                      alert('Import failed: ' + err.message);
                    }
                  }
                };
                input.click();
                setShowImportModal(null);
                setSelectedClusterForImport('');
              }}
              className="px-4 py-2 rounded-md text-sm text-white bg-primary-600 hover:bg-primary-700"
            >
              Next: Select File
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
