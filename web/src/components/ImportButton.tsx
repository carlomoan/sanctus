import { useState, useRef } from 'react';
import { Upload, CheckCircle, AlertCircle, X } from 'lucide-react';
import { ImportResponse } from '../types';

interface ImportButtonProps {
  label: string;
  onImport: (file: File) => Promise<ImportResponse>;
  accept?: string;
  templateColumns?: string[];
}

export default function ImportButton({ label, onImport, accept = '.csv,.xlsx', templateColumns }: ImportButtonProps) {
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResponse | null>(null);
  const [showResult, setShowResult] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setResult(null);
    try {
      const res = await onImport(file);
      setResult(res);
      setShowResult(true);
    } catch (err: any) {
      setResult({ success_count: 0, errors: [err.message || 'Import failed'] });
      setShowResult(true);
    } finally {
      setImporting(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const downloadTemplate = () => {
    if (!templateColumns) return;
    const csv = templateColumns.join(',') + '\n';
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${label.toLowerCase().replace(/\s+/g, '_')}_template.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="relative inline-block">
      <div className="flex items-center gap-1">
        <button
          onClick={() => fileRef.current?.click()}
          disabled={importing}
          className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          <Upload size={16} />
          {importing ? 'Importing...' : label}
        </button>
        {templateColumns && (
          <button
            onClick={downloadTemplate}
            className="text-xs text-primary-600 hover:underline px-1"
            title="Download CSV template"
          >
            Template
          </button>
        )}
      </div>
      <input
        ref={fileRef}
        type="file"
        accept={accept}
        onChange={handleFile}
        className="hidden"
      />

      {showResult && result && (
        <div className="absolute z-50 top-full mt-2 right-0 w-80 bg-white rounded-lg shadow-lg border border-gray-200 p-4">
          <div className="flex justify-between items-start mb-2">
            <h4 className="font-medium text-sm text-gray-900">Import Result</h4>
            <button onClick={() => setShowResult(false)} className="text-gray-400 hover:text-gray-600">
              <X size={16} />
            </button>
          </div>
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle size={16} className="text-green-500" />
            <span className="text-sm text-green-700">{result.success_count} imported successfully</span>
          </div>
          {result.errors.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-1">
                <AlertCircle size={16} className="text-red-500" />
                <span className="text-sm text-red-700">{result.errors.length} error(s)</span>
              </div>
              <div className="max-h-32 overflow-y-auto text-xs text-red-600 bg-red-50 rounded p-2 space-y-1">
                {result.errors.slice(0, 10).map((err, i) => (
                  <div key={i}>{err}</div>
                ))}
                {result.errors.length > 10 && (
                  <div className="text-gray-500">...and {result.errors.length - 10} more</div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
