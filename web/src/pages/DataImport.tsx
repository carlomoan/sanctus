import { useState, useEffect } from 'react';
import { api } from '../api/client';
import { Upload, FileText, CheckCircle2, AlertCircle, Loader2, Info, Filter } from 'lucide-react';
import { Parish } from '../types';
import { useAuth } from '../context/AuthContext';

const DataImport = () => {
  const [importType, setReportType] = useState<'members' | 'transactions'>('members');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success_count: number; errors: string[] } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { user } = useAuth();
  const [parishes, setParishes] = useState<Parish[]>([]);
  const [selectedParishId, setSelectedParishId] = useState<string>('');

  useEffect(() => {
    const fetchParishes = async () => {
      try {
        const data = await api.listParishes();
        setParishes(data);
        if (data.length > 0 && !selectedParishId) {
          // Default to user's parish if available, otherwise first in list (or empty if forcing selection)
          setSelectedParishId(user?.parish_id || data[0].id);
        }
      } catch (err) {
        console.error('Failed to load parishes:', err);
      }
    };
    fetchParishes();
  }, [user]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setResult(null);
      setError(null);
    }
  };

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    if (!selectedParishId && !user?.parish_id) {
      setError("Please select a parish for import.");
      return;
    }

    setLoading(true);
    setResult(null);
    setError(null);

    try {
      let response;
      const targetParishId = selectedParishId || user?.parish_id;
      if (importType === 'members') {
        response = await api.importMembers(file, targetParishId);
      } else {
        response = await api.importTransactions(file, targetParishId);
      }
      setResult({
        success_count: response.success_count,
        errors: response.errors || []
      });
    } catch (err: any) {
      console.error('Import failed:', err);
      setError(err.message || 'Import failed. Please check your file format and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Data Import</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <form onSubmit={handleImport} className="space-y-6">
              {/* Parish Selector for Admins */}
              {(!user?.parish_id || user?.role === 'SUPER_ADMIN') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Target Parish</label>
                  <div className="flex items-center gap-2">
                    <Filter size={20} className="text-gray-400" />
                    <select
                      value={selectedParishId}
                      onChange={(e) => setSelectedParishId(e.target.value)}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm border p-2"
                      required
                    >
                      <option value="" disabled>Select Parish</option>
                      {parishes.map(parish => (
                        <option key={parish.id} value={parish.id}>{parish.parish_name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Import Type</label>
                <div className="flex bg-gray-100 p-1 rounded-lg w-max">
                  <button
                    type="button"
                    onClick={() => setReportType('members')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${importType === 'members' ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                      }`}
                  >
                    Members
                  </button>
                  <button
                    type="button"
                    onClick={() => setReportType('transactions')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${importType === 'transactions' ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                      }`}
                  >
                    Transactions
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Select File (.csv or .xlsx)</label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:border-primary-400 transition-colors cursor-pointer relative">
                  <div className="space-y-1 text-center">
                    <Upload className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="flex text-sm text-gray-600">
                      <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-primary-600 hover:text-primary-500 focus-within:outline-none">
                        <span>{file ? file.name : 'Upload a file'}</span>
                        <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleFileChange} accept=".csv,.xlsx" />
                      </label>
                      {!file && <p className="pl-1">or drag and drop</p>}
                    </div>
                    <p className="text-xs text-gray-500">CSV or Excel up to 10MB</p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={!file || loading}
                  className="bg-primary-600 text-white px-6 py-2 rounded-lg flex items-center gap-2 hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      <CheckCircle2 size={20} />
                      Start Import
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {result && (
            <div className={`p-6 rounded-lg shadow-sm border ${result.errors && result.errors.length === 0 ? 'bg-green-50 border-green-100' : 'bg-orange-50 border-orange-100'}`}>
              <div className="flex items-center gap-3 mb-4">
                {result.errors && result.errors.length === 0 ? (
                  <CheckCircle2 className="text-green-600 h-6 w-6" />
                ) : (
                  <AlertCircle className="text-orange-600 h-6 w-6" />
                )}
                <h3 className="text-lg font-semibold text-gray-900">Import Result</h3>
              </div>
              <p className="text-gray-700">Successfully imported <span className="font-bold text-gray-900">{result.success_count}</span> {importType}.</p>

              {result.errors && result.errors.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm font-medium text-orange-800 mb-2">Errors encountered:</p>
                  <ul className="list-disc pl-5 space-y-1">
                    {result.errors.map((err, idx) => (
                      <li key={idx} className="text-xs text-orange-700">{err}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-50 border border-red-100 rounded-lg flex items-center gap-3 text-red-700">
              <AlertCircle size={20} />
              <p className="text-sm">{error}</p>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-4 text-primary-600">
              <Info size={20} />
              <h3 className="font-semibold">Import Instructions</h3>
            </div>
            <div className="space-y-4 text-sm text-gray-600">
              <p>To ensure a successful import, please follow these guidelines:</p>

              {importType === 'members' ? (
                <div className="space-y-2">
                  <p className="font-medium text-gray-900">Expected CSV/Excel Columns:</p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li><code className="bg-gray-100 px-1 rounded">member_code</code> (Unique identifier)</li>
                    <li><code className="bg-gray-100 px-1 rounded">first_name</code></li>
                    <li><code className="bg-gray-100 px-1 rounded">last_name</code></li>
                    <li><code className="bg-gray-100 px-1 rounded">gender</code> (MALE/FEMALE)</li>
                    <li><code className="bg-gray-100 px-1 rounded">phone_number</code></li>
                  </ul>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="font-medium text-gray-900">Expected CSV Columns:</p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li><code className="bg-gray-100 px-1 rounded">category</code> (TITHE, OFFERTORY, etc.)</li>
                    <li><code className="bg-gray-100 px-1 rounded">amount</code> (e.g., 10000)</li>
                    <li><code className="bg-gray-100 px-1 rounded">payment_method</code> (CASH, MPESA, etc.)</li>
                    <li><code className="bg-gray-100 px-1 rounded">transaction_date</code> (YYYY-MM-DD)</li>
                    <li><code className="bg-gray-100 px-1 rounded">description</code></li>
                  </ul>
                </div>
              )}

              <div className="pt-4">
                <button className="text-primary-600 font-medium hover:text-primary-700 flex items-center gap-1">
                  <FileText size={16} />
                  Download Template
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataImport;
