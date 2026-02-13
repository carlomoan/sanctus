import { useState, useEffect } from 'react';
import { api } from '../api/client';
import { Parish } from '../types';
import { Settings as SettingsIcon, Globe, Printer, Mail, CreditCard, RefreshCw, Save, Check, Palette } from 'lucide-react';

interface SettingItem {
  key: string;
  value: string;
  group: string;
  label: string;
  description: string;
  type: 'text' | 'select' | 'toggle' | 'textarea' | 'color';
  options?: { value: string; label: string }[];
}

const SETTING_DEFINITIONS: SettingItem[] = [
  // UI Configuration
  { key: 'ui.primary_color', value: '#4F46E5', group: 'ui', label: 'Primary Color', description: 'Main brand color used for buttons and links', type: 'color' },
  { key: 'ui.secondary_color', value: '#7C3AED', group: 'ui', label: 'Secondary Color', description: 'Accent color for highlights', type: 'color' },
  { key: 'ui.sidebar_bg', value: '#1E293B', group: 'ui', label: 'Sidebar Background', description: 'Sidebar background color', type: 'color' },
  { key: 'ui.sidebar_text', value: '#E2E8F0', group: 'ui', label: 'Sidebar Text Color', description: 'Sidebar text and icon color', type: 'color' },
  { key: 'ui.sidebar_active_bg', value: '#334155', group: 'ui', label: 'Sidebar Active Item', description: 'Background for active sidebar item', type: 'color' },
  { key: 'ui.sidebar_collapsed', value: 'false', group: 'ui', label: 'Sidebar Collapsed', description: 'Start with sidebar collapsed by default', type: 'toggle' },
  { key: 'ui.topbar_bg', value: '#FFFFFF', group: 'ui', label: 'Top Bar Background', description: 'Top navigation bar background color', type: 'color' },
  { key: 'ui.topbar_text', value: '#1E293B', group: 'ui', label: 'Top Bar Text Color', description: 'Top bar text and icon color', type: 'color' },
  { key: 'ui.topbar_show_breadcrumb', value: 'true', group: 'ui', label: 'Show Breadcrumb', description: 'Display breadcrumb navigation in top bar', type: 'toggle' },
  { key: 'ui.topbar_show_search', value: 'true', group: 'ui', label: 'Show Search', description: 'Display search bar in top navigation', type: 'toggle' },
  { key: 'ui.footer_show', value: 'true', group: 'ui', label: 'Show Footer', description: 'Display footer at the bottom of pages', type: 'toggle' },
  { key: 'ui.footer_bg', value: '#F8FAFC', group: 'ui', label: 'Footer Background', description: 'Footer background color', type: 'color' },
  { key: 'ui.footer_text', value: '#64748B', group: 'ui', label: 'Footer Text Color', description: 'Footer text color', type: 'color' },
  { key: 'ui.footer_content', value: '© 2026 Sanctus Parish Management System. All rights reserved.', group: 'ui', label: 'Footer Content', description: 'Text displayed in the footer', type: 'textarea' },
  { key: 'ui.logo_url', value: '', group: 'ui', label: 'Logo URL', description: 'URL for the system logo image', type: 'text' },
  { key: 'ui.app_name', value: 'Sanctus', group: 'ui', label: 'Application Name', description: 'Display name shown in header and title', type: 'text' },

  // Language & Locale
  {
    key: 'language', value: 'en', group: 'locale', label: 'Language', description: 'Application display language', type: 'select', options: [
      { value: 'en', label: 'English' }, { value: 'sw', label: 'Kiswahili' }, { value: 'fr', label: 'French' },
    ]
  },
  {
    key: 'currency', value: 'TZS', group: 'locale', label: 'Currency', description: 'Default currency for transactions', type: 'select', options: [
      { value: 'TZS', label: 'TZS - Tanzanian Shilling' }, { value: 'KES', label: 'KES - Kenyan Shilling' }, { value: 'UGX', label: 'UGX - Ugandan Shilling' }, { value: 'USD', label: 'USD - US Dollar' },
    ]
  },
  {
    key: 'date_format', value: 'DD/MM/YYYY', group: 'locale', label: 'Date Format', description: 'How dates are displayed', type: 'select', options: [
      { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY' }, { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY' }, { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD' },
    ]
  },

  // Sync
  { key: 'diocese_sync_enabled', value: 'false', group: 'sync', label: 'Diocese Sync', description: 'Enable data synchronization with diocese server', type: 'toggle' },
  { key: 'diocese_sync_url', value: '', group: 'sync', label: 'Diocese Sync URL', description: 'URL of the diocese sync server', type: 'text' },
  { key: 'parish_sync_enabled', value: 'false', group: 'sync', label: 'Parish Sync', description: 'Enable offline/online sync for parish data', type: 'toggle' },
  {
    key: 'sync_interval_minutes', value: '30', group: 'sync', label: 'Sync Interval (minutes)', description: 'How often to sync data automatically', type: 'select', options: [
      { value: '5', label: '5 minutes' }, { value: '15', label: '15 minutes' }, { value: '30', label: '30 minutes' }, { value: '60', label: '1 hour' },
    ]
  },

  // Printer
  {
    key: 'printer_type', value: 'a4', group: 'printer', label: 'Default Printer Type', description: 'Default paper format for receipts', type: 'select', options: [
      { value: 'a4', label: 'A4 Paper Printer' }, { value: 'thermal-80', label: 'Thermal 80mm' }, { value: 'thermal-58', label: 'Thermal 58mm (Bluetooth)' },
    ]
  },
  { key: 'auto_print_receipt', value: 'false', group: 'printer', label: 'Auto-Print Receipts', description: 'Automatically print receipt after recording income', type: 'toggle' },
  { key: 'receipt_footer_text', value: 'Thank you for your generous contribution!', group: 'printer', label: 'Receipt Footer Text', description: 'Custom message at the bottom of receipts', type: 'textarea' },

  // Email/SMS
  { key: 'smtp_host', value: '', group: 'email', label: 'SMTP Host', description: 'Email server hostname', type: 'text' },
  { key: 'smtp_port', value: '587', group: 'email', label: 'SMTP Port', description: 'Email server port', type: 'text' },
  { key: 'smtp_username', value: '', group: 'email', label: 'SMTP Username', description: 'Email account username', type: 'text' },
  { key: 'smtp_password', value: '', group: 'email', label: 'SMTP Password', description: 'Email account password', type: 'text' },
  {
    key: 'sms_provider', value: 'none', group: 'email', label: 'SMS Provider', description: 'SMS gateway provider', type: 'select', options: [
      { value: 'none', label: 'None' }, { value: 'africastalking', label: "Africa's Talking" }, { value: 'twilio', label: 'Twilio' }, { value: 'nexmo', label: 'Vonage (Nexmo)' },
    ]
  },
  { key: 'sms_api_key', value: '', group: 'email', label: 'SMS API Key', description: 'API key for SMS provider', type: 'text' },
  { key: 'sms_sender_id', value: '', group: 'email', label: 'SMS Sender ID', description: 'Sender name/number for SMS', type: 'text' },

  // Payment Integrations
  { key: 'mpesa_enabled', value: 'false', group: 'payments', label: 'M-Pesa Integration', description: 'Enable M-Pesa mobile money payments', type: 'toggle' },
  { key: 'mpesa_shortcode', value: '', group: 'payments', label: 'M-Pesa Shortcode', description: 'Business shortcode for M-Pesa', type: 'text' },
  { key: 'mpesa_consumer_key', value: '', group: 'payments', label: 'M-Pesa Consumer Key', description: 'Daraja API consumer key', type: 'text' },
  { key: 'mpesa_consumer_secret', value: '', group: 'payments', label: 'M-Pesa Consumer Secret', description: 'Daraja API consumer secret', type: 'text' },
  { key: 'tigopesa_enabled', value: 'false', group: 'payments', label: 'Tigo Pesa Integration', description: 'Enable Tigo Pesa payments', type: 'toggle' },
  { key: 'airtel_money_enabled', value: 'false', group: 'payments', label: 'Airtel Money Integration', description: 'Enable Airtel Money payments', type: 'toggle' },
  { key: 'bank_transfer_enabled', value: 'true', group: 'payments', label: 'Bank Transfer', description: 'Accept bank transfer payments', type: 'toggle' },
];

const GROUPS = [
  { id: 'ui', label: 'UI Configuration', icon: Palette },
  { id: 'locale', label: 'Language & Locale', icon: Globe },
  { id: 'sync', label: 'Sync & Connectivity', icon: RefreshCw },
  { id: 'printer', label: 'Printer & Receipts', icon: Printer },
  { id: 'email', label: 'Email & SMS', icon: Mail },
  { id: 'payments', label: 'Payment Integrations', icon: CreditCard },
];

export default function Settings() {
  const [activeGroup, setActiveGroup] = useState('locale');
  const [values, setValues] = useState<Record<string, string>>({});
  const [parishes, setParishes] = useState<Parish[]>([]);
  const [selectedParishId, setSelectedParishId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        const p = await api.listParishes();
        setParishes(p);
        if (p.length > 0) setSelectedParishId(p[0].id);
      } catch (e) { console.error(e); }
      setLoading(false);
    };
    init();
  }, []);

  useEffect(() => {
    if (!selectedParishId) return;
    const loadSettings = async () => {
      try {
        const settings = await api.listSettings(selectedParishId);
        const map: Record<string, string> = {};
        SETTING_DEFINITIONS.forEach(d => { map[d.key] = d.value; });
        settings.forEach((s: any) => { map[s.setting_key] = s.setting_value; });
        setValues(map);
      } catch (e) { console.error(e); }
    };
    loadSettings();
  }, [selectedParishId]);

  const updateValue = (key: string, value: string) => {
    setValues(prev => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const groupSettings = SETTING_DEFINITIONS
        .filter(d => d.group === activeGroup)
        .map(d => ({
          parish_id: selectedParishId || undefined,
          setting_key: d.key,
          setting_value: values[d.key] || d.value,
          setting_group: d.group,
          description: d.description,
        }));
      await api.bulkUpsertSettings(groupSettings);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      console.error('Failed to save settings:', e);
      alert('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const groupSettings = SETTING_DEFINITIONS.filter(d => d.group === activeGroup);

  if (loading) return <div className="text-center py-12 text-gray-500">Loading settings...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <SettingsIcon size={24} /> Settings
        </h1>
        {parishes.length > 1 && (
          <select
            value={selectedParishId}
            onChange={e => setSelectedParishId(e.target.value)}
            className="border border-gray-200 rounded-lg py-2 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            {parishes.map(p => <option key={p.id} value={p.id}>{p.parish_name}</option>)}
          </select>
        )}
      </div>

      <div className="flex gap-6">
        {/* Sidebar */}
        <div className="w-56 flex-shrink-0">
          <nav className="space-y-1">
            {GROUPS.map(g => {
              const Icon = g.icon;
              return (
                <button
                  key={g.id}
                  onClick={() => { setActiveGroup(g.id); setSaved(false); }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeGroup === g.id
                      ? 'bg-primary-50 text-primary-700 border border-primary-200'
                      : 'text-gray-600 hover:bg-gray-50'
                    }`}
                >
                  <Icon size={18} />
                  {g.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 bg-white rounded-lg shadow-sm border border-gray-100">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-lg font-medium text-gray-900">
              {GROUPS.find(g => g.id === activeGroup)?.label}
            </h2>
            <button
              onClick={handleSave}
              disabled={saving}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${saved
                  ? 'bg-green-50 text-green-700 border border-green-200'
                  : 'bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50'
                }`}
            >
              {saved ? <><Check size={16} /> Saved</> : <><Save size={16} /> {saving ? 'Saving...' : 'Save Changes'}</>}
            </button>
          </div>

          <div className="p-6 space-y-6">
            {groupSettings.map(setting => (
              <div key={setting.key} className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-8">
                <div className="sm:w-1/3">
                  <label className="block text-sm font-medium text-gray-900">{setting.label}</label>
                  <p className="text-xs text-gray-500 mt-0.5">{setting.description}</p>
                </div>
                <div className="sm:w-2/3">
                  {setting.type === 'text' && (
                    <input
                      type={setting.key.includes('password') || setting.key.includes('secret') ? 'password' : 'text'}
                      value={values[setting.key] || ''}
                      onChange={e => updateValue(setting.key, e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder={setting.description}
                    />
                  )}
                  {setting.type === 'textarea' && (
                    <textarea
                      value={values[setting.key] || ''}
                      onChange={e => updateValue(setting.key, e.target.value)}
                      rows={3}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  )}
                  {setting.type === 'select' && (
                    <select
                      value={values[setting.key] || ''}
                      onChange={e => updateValue(setting.key, e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      {setting.options?.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  )}
                  {setting.type === 'color' && (
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={values[setting.key] || setting.value}
                        onChange={e => updateValue(setting.key, e.target.value)}
                        className="h-10 w-14 rounded border border-gray-300 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={values[setting.key] || ''}
                        onChange={e => updateValue(setting.key, e.target.value)}
                        className="w-32 border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="#000000"
                      />
                    </div>
                  )}
                  {setting.type === 'toggle' && (
                    <button
                      onClick={() => updateValue(setting.key, values[setting.key] === 'true' ? 'false' : 'true')}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${values[setting.key] === 'true' ? 'bg-primary-600' : 'bg-gray-300'
                        }`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${values[setting.key] === 'true' ? 'translate-x-6' : 'translate-x-1'
                        }`} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
