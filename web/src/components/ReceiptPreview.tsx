import React, { useState } from 'react';
import { IncomeTransaction, Parish, Member } from '../types';
import { generateReceiptPdf, downloadReceipt, printReceipt, ReceiptFormat } from '../utils/receiptPdf';
import { Eye, Download, Printer } from 'lucide-react';

interface ReceiptPreviewProps {
  transaction: IncomeTransaction;
  parish: Parish;
  member?: Member | null;
}

const ReceiptPreview: React.FC<ReceiptPreviewProps> = ({ transaction, parish, member }) => {
  const [format, setFormat] = useState<ReceiptFormat>('thermal-80');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const generatePreview = async () => {
    setLoading(true);
    try {
      const doc = await generateReceiptPdf({
        transaction,
        parish,
        member,
        format
      });
      const blob = doc.output('blob');
      const url = URL.createObjectURL(blob);
      setPreviewUrl(url);
    } catch (error) {
      console.error('Failed to generate preview:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    await downloadReceipt({
      transaction,
      parish,
      member,
      format
    });
  };

  const handlePrint = async () => {
    await printReceipt({
      transaction,
      parish,
      member,
      format
    });
  };

  React.useEffect(() => {
    generatePreview();
  }, [format, transaction, parish, member]);

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Receipt Preview</h3>
        <div className="flex items-center gap-4">
          <select
            value={format}
            onChange={(e) => setFormat(e.target.value as ReceiptFormat)}
            className="border border-gray-300 rounded px-3 py-1 text-sm"
          >
            <option value="thermal-58">Thermal 58mm</option>
            <option value="thermal-80">Thermal 80mm</option>
            <option value="a4">A4</option>
          </select>
        </div>
      </div>

      {/* Preview Window */}
      <div className="border border-gray-200 rounded-lg mb-4 bg-gray-50">
        {loading ? (
          <div className="flex items-center justify-center h-96">
            <div className="text-gray-500">Generating preview...</div>
          </div>
        ) : previewUrl ? (
          <iframe
            src={previewUrl}
            className="w-full h-96 border-0"
            title="Receipt Preview"
          />
        ) : (
          <div className="flex items-center justify-center h-96">
            <div className="text-gray-500">Preview not available</div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex justify-center gap-4">
        <button
          onClick={generatePreview}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          <Eye size={16} />
          Refresh Preview
        </button>
        <button
          onClick={handleDownload}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          <Download size={16} />
          Download PDF
        </button>
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
        >
          <Printer size={16} />
          Print
        </button>
      </div>
    </div>
  );
};

export default ReceiptPreview;
