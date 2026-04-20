import React, { useState, useEffect } from 'react';
import { ReceiptConfig, defaultReceiptConfigs, generateCustomReceipt } from './CustomReceipt';
import { IncomeTransaction, Parish, Member } from '../types';
import { Settings, Download, Printer, Eye, RotateCcw, Upload } from 'lucide-react';

interface ReceiptBuilderProps {
  transaction: IncomeTransaction;
  parish: Parish;
  member?: Member | null;
  onConfigChange?: (config: ReceiptConfig) => void;
  initialConfig?: ReceiptConfig;
}

const ReceiptBuilder: React.FC<ReceiptBuilderProps> = ({
  transaction,
  parish,
  member,
  onConfigChange,
  initialConfig
}) => {
  const [config, setConfig] = useState<ReceiptConfig>(
    initialConfig || defaultReceiptConfigs['thermal-80']
  );
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'layout' | 'typography' | 'content' | 'advanced'>('layout');
  const [generating, setGenerating] = useState(false);

  // Update config and notify parent
  const updateConfig = (newConfig: ReceiptConfig) => {
    setConfig(newConfig);
    onConfigChange?.(newConfig);
  };

  // Generate preview
  const generatePreview = async () => {
    setGenerating(true);
    try {
      const doc = await generateCustomReceipt({
        transaction,
        parish,
        member,
        config
      });
      const blob = doc.output('blob');
      const url = URL.createObjectURL(blob);
      setPreviewUrl(url);
    } catch (error) {
      console.error('Failed to generate preview:', error);
    } finally {
      setGenerating(false);
    }
  };

  // Auto-generate preview when config changes
  useEffect(() => {
    generatePreview();
  }, [config]);

  // Load preset configuration
  const loadPreset = (presetName: string) => {
    const preset = defaultReceiptConfigs[presetName];
    if (preset) {
      updateConfig({ ...preset });
    }
  };

  // Export configuration
  const exportConfig = () => {
    const dataStr = JSON.stringify(config, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const exportFileDefaultName = `receipt-config-${config.format}.json`;
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  // Import configuration
  const importConfig = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const importedConfig = JSON.parse(e.target?.result as string);
          updateConfig(importedConfig);
        } catch (error) {
          alert('Invalid configuration file');
        }
      };
      reader.readAsText(file);
    }
  };

  // Download receipt
  const downloadReceipt = async () => {
    const doc = await generateCustomReceipt({
      transaction,
      parish,
      member,
      config
    });

    // Check if running in Tauri
    if (typeof window !== 'undefined' && window.__TAURI__) {
      try {
        const { save } = window.__TAURI__.dialog;
        const { writeFile } = window.__TAURI__.fs;

        const filename = `receipt_${transaction.transaction_number.replace(/\//g, '-')}.pdf`;
        const filePath = await save({
          defaultPath: filename,
          filters: [{ name: 'PDF', extensions: ['pdf'] }]
        });

        if (filePath) {
          const blob = doc.output('blob');
          const buffer = await blob.arrayBuffer();
          await writeFile(filePath, new Uint8Array(buffer));
        }
      } catch (error) {
        console.error('Tauri download failed:', error);
        // Fallback to browser download
        doc.save(`receipt_${transaction.transaction_number.replace(/\//g, '-')}.pdf`);
      }
    } else {
      // Browser download
      doc.save(`receipt_${transaction.transaction_number.replace(/\//g, '-')}.pdf`);
    }
  };

  // Print receipt
  const printReceipt = async () => {
    const doc = await generateCustomReceipt({
      transaction,
      parish,
      member,
      config
    });

    // Check if running in Tauri
    if (typeof window !== 'undefined' && window.__TAURI__) {
      try {
        // In Tauri, we can use window.print() if the permissions are set
        // First create a temporary iframe to load the PDF
        const blob = doc.output('blob');
        const url = URL.createObjectURL(blob);

        // Create an iframe to print the PDF
        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        iframe.src = url;
        document.body.appendChild(iframe);

        iframe.onload = () => {
          iframe.contentWindow?.print();
          // Clean up
          setTimeout(() => {
            document.body.removeChild(iframe);
            URL.revokeObjectURL(url);
          }, 1000);
        };
      } catch (error) {
        console.error('Tauri print failed:', error);
        // Fallback to opening in new window
        const blob = doc.output('blob');
        const url = URL.createObjectURL(blob);
        const printWindow = window.open(url, '_blank');
        if (printWindow) {
          printWindow.addEventListener('load', () => {
            printWindow.print();
          });
        }
      }
    } else {
      // Browser approach
      const blob = doc.output('blob');
      const url = URL.createObjectURL(blob);
      const printWindow = window.open(url, '_blank');
      if (printWindow) {
        printWindow.addEventListener('load', () => {
          printWindow.print();
        });
      }
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg">
      {/* Header */}
      <div className="border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Settings size={20} />
            Receipt Builder
          </h3>
          <div className="flex items-center gap-2">
            {/* Presets */}
            <select
              value={config.format}
              onChange={(e) => loadPreset(e.target.value)}
              className="border border-gray-300 rounded px-3 py-1 text-sm"
            >
              <option value="thermal-58">🧾 Thermal 58mm</option>
              <option value="thermal-80">🧾 Thermal 80mm</option>
              <option value="a4">📄 A4</option>
            </select>

            {/* Actions */}
            <button
              onClick={exportConfig}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              title="Export Configuration"
            >
              <Upload size={16} />
            </button>
            <label className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg cursor-pointer" title="Import Configuration">
              <Download size={16} />
              <input type="file" accept=".json" onChange={importConfig} className="hidden" />
            </label>
            <button
              onClick={() => loadPreset(config.format)}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              title="Reset to Default"
            >
              <RotateCcw size={16} />
            </button>
          </div>
        </div>
      </div>

      <div className="flex">
        {/* Configuration Panel */}
        <div className="w-2/5 border-r border-gray-200 min-w-0">
          {/* Tabs */}
          <div className="flex border-b border-gray-200 flex-shrink-0">
            {(['layout', 'typography', 'content', 'advanced'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-2 text-sm font-medium capitalize flex-shrink-0 ${activeTab === tab
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
                  }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="p-4 space-y-4 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 180px)' }}>
            {activeTab === 'layout' && (
              <LayoutTab config={config} onChange={updateConfig} />
            )}
            {activeTab === 'typography' && (
              <TypographyTab config={config} onChange={updateConfig} />
            )}
            {activeTab === 'content' && (
              <ContentTab config={config} onChange={updateConfig} />
            )}
            {activeTab === 'advanced' && (
              <AdvancedTab config={config} onChange={updateConfig} />
            )}
          </div>
        </div>

        {/* Preview Panel */}
        <div className="w-3/5 min-w-0">
          <div className="border-b border-gray-200 p-4 flex items-center justify-between flex-shrink-0">
            <h4 className="font-medium">Preview</h4>
            <div className="flex items-center gap-2">
              <button
                onClick={generatePreview}
                disabled={generating}
                className="flex items-center gap-1 px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                <Eye size={14} />
                Refresh
              </button>
              <button
                onClick={downloadReceipt}
                className="flex items-center gap-1 px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
              >
                <Download size={14} />
                Download
              </button>
              <button
                onClick={printReceipt}
                className="flex items-center gap-1 px-3 py-1 text-sm bg-purple-600 text-white rounded hover:bg-purple-700"
              >
                <Printer size={14} />
                Print
              </button>
            </div>
          </div>

          <div className="p-4 bg-gray-50 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 180px)' }}>
            {generating ? (
              <div className="flex items-center justify-center h-96">
                <div className="text-gray-500">Generating preview...</div>
              </div>
            ) : previewUrl ? (
              <iframe
                src={previewUrl}
                className="w-full h-96 border-0 bg-white"
                title="Receipt Preview"
              />
            ) : (
              <div className="flex items-center justify-center h-96">
                <div className="text-gray-500">Preview not available</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Layout Tab Component
const LayoutTab: React.FC<{ config: ReceiptConfig; onChange: (config: ReceiptConfig) => void }> = ({ config, onChange }) => {
  const updateConfig = (updates: Partial<ReceiptConfig>) => {
    onChange({ ...config, ...updates });
  };

  const updateLayout = (updates: Partial<ReceiptConfig['layout']>) => {
    onChange({ ...config, layout: { ...config.layout, ...updates } });
  };

  const updateMargins = (updates: Partial<ReceiptConfig['margins']>) => {
    onChange({ ...config, margins: { ...config.margins, ...updates } });
  };

  return (
    <div className="space-y-4">
      {/* Page Settings */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Page Format</label>
        <select
          value={config.format}
          onChange={(e) => updateConfig({ format: e.target.value as ReceiptConfig['format'] })}
          className="w-full border border-gray-300 rounded px-3 py-2"
        >
          <option value="thermal-58">Thermal 58mm</option>
          <option value="thermal-80">Thermal 80mm</option>
          <option value="a4">A4</option>
          <option value="custom">Custom</option>
        </select>
      </div>

      {/* Orientation */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Orientation</label>
        <select
          value={config.orientation}
          onChange={(e) => updateConfig({ orientation: e.target.value as 'portrait' | 'landscape' })}
          className="w-full border border-gray-300 rounded px-3 py-2"
        >
          <option value="portrait">Portrait</option>
          <option value="landscape">Landscape</option>
        </select>
      </div>

      {/* Margins */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Margins (mm)</label>
        <div className="grid grid-cols-2 gap-2">
          <input
            type="number"
            placeholder="Top"
            value={config.margins.top}
            onChange={(e) => updateMargins({ top: Number(e.target.value) })}
            className="border border-gray-300 rounded px-2 py-1 text-sm"
          />
          <input
            type="number"
            placeholder="Right"
            value={config.margins.right}
            onChange={(e) => updateMargins({ right: Number(e.target.value) })}
            className="border border-gray-300 rounded px-2 py-1 text-sm"
          />
          <input
            type="number"
            placeholder="Bottom"
            value={config.margins.bottom}
            onChange={(e) => updateMargins({ bottom: Number(e.target.value) })}
            className="border border-gray-300 rounded px-2 py-1 text-sm"
          />
          <input
            type="number"
            placeholder="Left"
            value={config.margins.left}
            onChange={(e) => updateMargins({ left: Number(e.target.value) })}
            className="border border-gray-300 rounded px-2 py-1 text-sm"
          />
        </div>
      </div>

      {/* Logo Position */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Logo Position</label>
        <select
          value={config.layout.logoPosition}
          onChange={(e) => updateLayout({ logoPosition: e.target.value as ReceiptConfig['layout']['logoPosition'] })}
          className="w-full border border-gray-300 rounded px-3 py-2"
        >
          <option value="hidden">Hidden</option>
          <option value="top-left">Top Left</option>
          <option value="top-center">Top Center</option>
          <option value="top-right">Top Right</option>
        </select>
      </div>

      {/* Title Alignment */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Title Alignment</label>
        <select
          value={config.layout.titleAlignment}
          onChange={(e) => updateLayout({ titleAlignment: e.target.value as ReceiptConfig['layout']['titleAlignment'] })}
          className="w-full border border-gray-300 rounded px-3 py-2"
        >
          <option value="left">Left</option>
          <option value="center">Center</option>
          <option value="right">Right</option>
        </select>
      </div>

      {/* Details Alignment */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Details Layout</label>
        <select
          value={config.layout.detailsAlignment}
          onChange={(e) => updateLayout({ detailsAlignment: e.target.value as ReceiptConfig['layout']['detailsAlignment'] })}
          className="w-full border border-gray-300 rounded px-3 py-2"
        >
          <option value="left">Left Aligned</option>
          <option value="two-column">Two Column</option>
          <option value="right-aligned">Right Aligned</option>
        </select>
      </div>

      {/* Amount Position */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Amount Position</label>
        <select
          value={config.layout.amountPosition}
          onChange={(e) => updateLayout({ amountPosition: e.target.value as ReceiptConfig['layout']['amountPosition'] })}
          className="w-full border border-gray-300 rounded px-3 py-2"
        >
          <option value="left">Left</option>
          <option value="center">Center</option>
          <option value="right">Right</option>
        </select>
      </div>

      {/* Toggle Options */}
      <div className="space-y-2">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={config.layout.showBorders}
            onChange={(e) => updateLayout({ showBorders: e.target.checked })}
            className="rounded"
          />
          <span className="text-sm">Show Borders</span>
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={config.layout.showWatermark}
            onChange={(e) => updateLayout({ showWatermark: e.target.checked })}
            className="rounded"
          />
          <span className="text-sm">Show Watermark</span>
        </label>
      </div>
    </div>
  );
};

// Typography Tab Component
const TypographyTab: React.FC<{ config: ReceiptConfig; onChange: (config: ReceiptConfig) => void }> = ({ config, onChange }) => {
  const updateConfig = (updates: Partial<ReceiptConfig>) => {
    onChange({ ...config, ...updates });
  };

  const updateFontSizes = (updates: Partial<ReceiptConfig['fontSizes']>) => {
    onChange({ ...config, fontSizes: { ...config.fontSizes, ...updates } });
  };

  const updateColors = (updates: Partial<ReceiptConfig['colors']>) => {
    onChange({ ...config, colors: { ...config.colors, ...updates } });
  };

  return (
    <div className="space-y-4">
      {/* Font Family */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Font Family</label>
        <select
          value={config.fontFamily}
          onChange={(e) => updateConfig({ fontFamily: e.target.value as ReceiptConfig['fontFamily'] })}
          className="w-full border border-gray-300 rounded px-3 py-2"
        >
          <option value="helvetica">Helvetica</option>
          <option value="times">Times</option>
          <option value="courier">Courier</option>
        </select>
      </div>

      {/* Font Sizes */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Font Sizes (pt)</label>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <label className="text-sm w-20">Title:</label>
            <input
              type="number"
              value={config.fontSizes.title}
              onChange={(e) => updateFontSizes({ title: Number(e.target.value) })}
              className="flex-1 border border-gray-300 rounded px-2 py-1 text-sm"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm w-20">Subtitle:</label>
            <input
              type="number"
              value={config.fontSizes.subtitle}
              onChange={(e) => updateFontSizes({ subtitle: Number(e.target.value) })}
              className="flex-1 border border-gray-300 rounded px-2 py-1 text-sm"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm w-20">Heading:</label>
            <input
              type="number"
              value={config.fontSizes.heading}
              onChange={(e) => updateFontSizes({ heading: Number(e.target.value) })}
              className="flex-1 border border-gray-300 rounded px-2 py-1 text-sm"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm w-20">Body:</label>
            <input
              type="number"
              value={config.fontSizes.body}
              onChange={(e) => updateFontSizes({ body: Number(e.target.value) })}
              className="flex-1 border border-gray-300 rounded px-2 py-1 text-sm"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm w-20">Small:</label>
            <input
              type="number"
              value={config.fontSizes.small}
              onChange={(e) => updateFontSizes({ small: Number(e.target.value) })}
              className="flex-1 border border-gray-300 rounded px-2 py-1 text-sm"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm w-20">Large:</label>
            <input
              type="number"
              value={config.fontSizes.large}
              onChange={(e) => updateFontSizes({ large: Number(e.target.value) })}
              className="flex-1 border border-gray-300 rounded px-2 py-1 text-sm"
            />
          </div>
        </div>
      </div>

      {/* Colors */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Colors</label>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <label className="text-sm w-20">Text:</label>
            <input
              type="color"
              value={config.colors.text}
              onChange={(e) => updateColors({ text: e.target.value })}
              className="w-12 h-8 border border-gray-300 rounded"
            />
            <input
              type="text"
              value={config.colors.text}
              onChange={(e) => updateColors({ text: e.target.value })}
              className="flex-1 border border-gray-300 rounded px-2 py-1 text-sm"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm w-20">Accent:</label>
            <input
              type="color"
              value={config.colors.accent}
              onChange={(e) => updateColors({ accent: e.target.value })}
              className="w-12 h-8 border border-gray-300 rounded"
            />
            <input
              type="text"
              value={config.colors.accent}
              onChange={(e) => updateColors({ accent: e.target.value })}
              className="flex-1 border border-gray-300 rounded px-2 py-1 text-sm"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm w-20">Border:</label>
            <input
              type="color"
              value={config.colors.border}
              onChange={(e) => updateColors({ border: e.target.value })}
              className="w-12 h-8 border border-gray-300 rounded"
            />
            <input
              type="text"
              value={config.colors.border}
              onChange={(e) => updateColors({ border: e.target.value })}
              className="flex-1 border border-gray-300 rounded px-2 py-1 text-sm"
            />
          </div>
        </div>
      </div>

      {/* Spacing */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Spacing</label>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <label className="text-sm w-20">Line Height:</label>
            <input
              type="number"
              step="0.1"
              value={config.lineHeight}
              onChange={(e) => updateConfig({ lineHeight: Number(e.target.value) })}
              className="flex-1 border border-gray-300 rounded px-2 py-1 text-sm"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm w-20">Section Spacing:</label>
            <input
              type="number"
              value={config.sectionSpacing}
              onChange={(e) => updateConfig({ sectionSpacing: Number(e.target.value) })}
              className="flex-1 border border-gray-300 rounded px-2 py-1 text-sm"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

// Content Tab Component
const ContentTab: React.FC<{ config: ReceiptConfig; onChange: (config: ReceiptConfig) => void }> = ({ config, onChange }) => {
  const updateContent = (updates: Partial<ReceiptConfig['content']>) => {
    onChange({ ...config, content: { ...config.content, ...updates } });
  };

  const updateQrCode = (updates: Partial<ReceiptConfig['qrCode']>) => {
    onChange({ ...config, qrCode: { ...config.qrCode, ...updates } });
  };

  return (
    <div className="space-y-4">
      {/* Content Options */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Content Options</label>
        <div className="space-y-2">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={config.content.showParishAddress}
              onChange={(e) => updateContent({ showParishAddress: e.target.checked })}
              className="rounded"
            />
            <span className="text-sm">Show Parish Address</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={config.content.showContactInfo}
              onChange={(e) => updateContent({ showContactInfo: e.target.checked })}
              className="rounded"
            />
            <span className="text-sm">Show Contact Info</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={config.content.showMemberCode}
              onChange={(e) => updateContent({ showMemberCode: e.target.checked })}
              className="rounded"
            />
            <span className="text-sm">Show Member Code</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={config.content.showReference}
              onChange={(e) => updateContent({ showReference: e.target.checked })}
              className="rounded"
            />
            <span className="text-sm">Show Reference</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={config.content.showDescription}
              onChange={(e) => updateContent({ showDescription: e.target.checked })}
              className="rounded"
            />
            <span className="text-sm">Show Description</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={config.content.showAmountInWords}
              onChange={(e) => updateContent({ showAmountInWords: e.target.checked })}
              className="rounded"
            />
            <span className="text-sm">Show Amount in Words</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={config.content.showThankYouMessage}
              onChange={(e) => updateContent({ showThankYouMessage: e.target.checked })}
              className="rounded"
            />
            <span className="text-sm">Show Thank You Message</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={config.content.showSignatureLines}
              onChange={(e) => updateContent({ showSignatureLines: e.target.checked })}
              className="rounded"
            />
            <span className="text-sm">Show Signature Lines</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={config.content.showOfficialStamp}
              onChange={(e) => updateContent({ showOfficialStamp: e.target.checked })}
              className="rounded"
            />
            <span className="text-sm">Show Official Stamp</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={config.content.showVerificationUrl}
              onChange={(e) => updateContent({ showVerificationUrl: e.target.checked })}
              className="rounded"
            />
            <span className="text-sm">Show Verification URL</span>
          </label>
        </div>
      </div>

      {/* Thank You Message */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Thank You Message</label>
        <textarea
          value={config.content.thankYouMessage || ''}
          onChange={(e) => updateContent({ thankYouMessage: e.target.value })}
          className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
          rows={2}
          placeholder="Thank you for your generous contribution!"
        />
      </div>

      {/* QR Code Settings */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">QR Code Settings</label>
        <div className="space-y-2">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={config.qrCode.enabled}
              onChange={(e) => updateQrCode({ enabled: e.target.checked })}
              className="rounded"
            />
            <span className="text-sm">Enable QR Code</span>
          </label>

          {config.qrCode.enabled && (
            <>
              <div className="flex items-center gap-2">
                <label className="text-sm w-20">Size:</label>
                <input
                  type="number"
                  value={config.qrCode.size}
                  onChange={(e) => updateQrCode({ size: Number(e.target.value) })}
                  className="flex-1 border border-gray-300 rounded px-2 py-1 text-sm"
                />
              </div>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={config.qrCode.includeBorder}
                  onChange={(e) => updateQrCode({ includeBorder: e.target.checked })}
                  className="rounded"
                />
                <span className="text-sm">Include Border</span>
              </label>

              <div>
                <label className="text-sm">Data Type:</label>
                <select
                  value={config.qrCode.data}
                  onChange={(e) => updateQrCode({ data: e.target.value as ReceiptConfig['qrCode']['data'] })}
                  className="w-full border border-gray-300 rounded px-2 py-1 text-sm mt-1"
                >
                  <option value="basic">Basic (Receipt Number)</option>
                  <option value="detailed">Detailed (Full Info)</option>
                  <option value="custom">Custom</option>
                </select>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// Advanced Tab Component
const AdvancedTab: React.FC<{ config: ReceiptConfig; onChange: (config: ReceiptConfig) => void }> = ({ config, onChange }) => {
  const updateAdvanced = (updates: Partial<ReceiptConfig['advanced']>) => {
    onChange({ ...config, advanced: { ...config.advanced, ...updates } });
  };

  return (
    <div className="space-y-4">
      {/* Advanced Options */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Advanced Options</label>
        <div className="space-y-2">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={config.advanced.showPageNumbers}
              onChange={(e) => updateAdvanced({ showPageNumbers: e.target.checked })}
              className="rounded"
            />
            <span className="text-sm">Show Page Numbers</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={config.advanced.showDateTime}
              onChange={(e) => updateAdvanced({ showDateTime: e.target.checked })}
              className="rounded"
            />
            <span className="text-sm">Show Date/Time</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={config.advanced.showReceiptNumber}
              onChange={(e) => updateAdvanced({ showReceiptNumber: e.target.checked })}
              className="rounded"
            />
            <span className="text-sm">Show Receipt Number</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={config.advanced.enableCondensedMode}
              onChange={(e) => updateAdvanced({ enableCondensedMode: e.target.checked })}
              className="rounded"
            />
            <span className="text-sm">Enable Condensed Mode</span>
          </label>
        </div>
      </div>

      {/* Custom Header */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Custom Header</label>
        <textarea
          value={config.advanced.customHeader || ''}
          onChange={(e) => updateAdvanced({ customHeader: e.target.value })}
          className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
          rows={2}
          placeholder="Custom header text..."
        />
      </div>

      {/* Custom Footer */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Custom Footer</label>
        <textarea
          value={config.advanced.customFooter || ''}
          onChange={(e) => updateAdvanced({ customFooter: e.target.value })}
          className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
          rows={2}
          placeholder="Custom footer text..."
        />
      </div>

      {/* Signature Labels */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Signature Labels</label>
        <div className="space-y-2">
          <input
            type="text"
            value={config.content.signatureLabels.authorized}
            onChange={(e) => onChange({
              ...config,
              content: {
                ...config.content,
                signatureLabels: {
                  ...config.content.signatureLabels,
                  authorized: e.target.value
                }
              }
            })}
            className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
            placeholder="Authorized Signature"
          />
          <input
            type="text"
            value={config.content.signatureLabels.date}
            onChange={(e) => onChange({
              ...config,
              content: {
                ...config.content,
                signatureLabels: {
                  ...config.content.signatureLabels,
                  date: e.target.value
                }
              }
            })}
            className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
            placeholder="Date"
          />
          {config.content.signatureLabels.receiver && (
            <input
              type="text"
              value={config.content.signatureLabels.receiver}
              onChange={(e) => onChange({
                ...config,
                content: {
                  ...config.content,
                  signatureLabels: {
                    ...config.content.signatureLabels,
                    receiver: e.target.value
                  }
                }
              })}
              className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
              placeholder="Receiver Signature"
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default ReceiptBuilder;
