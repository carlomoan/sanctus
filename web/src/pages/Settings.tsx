import { useState, useEffect } from 'react';
import { api } from '../api/client';
import { Parish } from '../types';
import { Settings as SettingsIcon, Globe, Printer, Mail, CreditCard, RefreshCw, Save, Check, Palette } from 'lucide-react';
import { SETTING_DEFINITIONS } from '../constants/settings';
import { useSettings } from '../context/SettingsContext';

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
  const { refreshSettings } = useSettings();

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
    const loadSettings = async () => {
      try {
        const pid = selectedParishId && selectedParishId.length > 0 ? selectedParishId : undefined;
        const settings = await api.listSettings(pid);
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
          parish_id: selectedParishId && selectedParishId.length > 0 ? selectedParishId : undefined,
          setting_key: d.key,
          setting_value: values[d.key] ?? d.value,
          setting_group: d.group,
          description: d.description,
        }));
      await api.bulkUpsertSettings(groupSettings);
      await refreshSettings();
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
