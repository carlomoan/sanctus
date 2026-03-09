import { useState, useEffect } from 'react';
import { api } from '../api/client';
import { Parish } from '../types';
import { Settings as SettingsIcon, Globe, Printer, Mail, CreditCard, RefreshCw, Save, Check, Palette, Church } from 'lucide-react';
import { SETTING_DEFINITIONS } from '../constants/settings';
import { useSettings } from '../context/SettingsContext';
import { useAuth } from '../context/AuthContext';
import { useParish } from '../context/ParishContext';

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
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [parishSpecificSettings, setParishSpecificSettings] = useState<Set<string>>(new Set());
  const { refreshSettings, setSelectedParishId: setContextParishId } = useSettings();
  const { user } = useAuth();
  const { activeParishId, isGlobalMode, setActiveParish, setGlobalMode } = useParish();

  useEffect(() => {
    const init = async () => {
      try {
        const p = await api.listParishes();
        setParishes(p);
      } catch (e) { console.error(e); }
      setLoading(false);
    };
    init();
  }, [user]);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const finalSettings: Record<string, string> = {};
        const parishOverrides = new Set<string>();

        // 1. Load defaults
        SETTING_DEFINITIONS.forEach(d => { finalSettings[d.key] = d.value; });

        // 2. Load Global Settings
        try {
          const globalSettings = await api.listSettings();
          if (Array.isArray(globalSettings)) {
            globalSettings.forEach((s: any) => {
              if (s.setting_value !== undefined && s.setting_value !== null) {
                finalSettings[s.setting_key] = s.setting_value;
              }
            });
          }
        } catch (e) {
          console.warn('Failed to load global settings', e);
        }

        // 3. Load Parish Settings based on active parish from context
        const pid = activeParishId;
        if (pid) {
          try {
            const parishSettings = await api.listSettings(pid);
            if (Array.isArray(parishSettings)) {
              parishSettings.forEach((s: any) => {
                if (s.setting_value !== undefined && s.setting_value !== null) {
                  finalSettings[s.setting_key] = s.setting_value;
                  parishOverrides.add(s.setting_key);
                }
              });
            }
          } catch (e) {
            console.error('Failed to load parish settings', e);
          }
        }

        setValues(finalSettings);
        setParishSpecificSettings(parishOverrides);
      } catch (e) {
        console.error(e);
      }
    };
    loadSettings();
  }, [activeParishId, user]);

  const updateValue = (key: string, value: string) => {
    setValues(prev => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Save ALL settings, not just the active group
      const allSettings = SETTING_DEFINITIONS.map(d => ({
        parish_id: activeParishId,
        setting_key: d.key,
        setting_value: values[d.key] ?? d.value,
        setting_group: d.group,
        description: d.description,
      }));
      await api.bulkUpsertSettings(allSettings);
      // Update context parish ID and refresh settings
      setContextParishId(activeParishId);
      await refreshSettings(activeParishId);
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
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <SettingsIcon size={24} /> Settings
          </h1>
          <div className="mt-1 flex items-center gap-2">
            <span className="text-sm text-gray-500">Editing level:</span>
            {activeParishId && user?.role === 'SUPER_ADMIN' ? (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                <Church size={12} className="mr-1" />
                {parishes.find(p => p.id === activeParishId)?.parish_name || 'Parish'} (Parish-specific)
              </span>
            ) : (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                <Globe size={12} className="mr-1" />
                Global (All parishes)
              </span>
            )}
            {user?.role === 'SUPER_ADMIN' && parishes.length > 0 && (
              <button
                onClick={() => isGlobalMode ? (parishes.length > 0 && setActiveParish(parishes[0].id)) : setGlobalMode()}
                className="ml-2 inline-flex items-center px-2 py-1 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                <RefreshCw size={10} className="mr-1" />
                Switch to {isGlobalMode ? 'Parish' : 'Global'} Settings
              </button>
            )}
          </div>
        </div>
        {parishes.length > 1 && user?.role === 'SUPER_ADMIN' && (
          <select
            value={activeParishId || ''}
            onChange={e => {
              const parishId = e.target.value || null;
              if (parishId) {
                setActiveParish(parishId);
              } else {
                setGlobalMode();
              }
              setContextParishId(parishId);
            }}
            className="border border-gray-200 rounded-lg py-2 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">Global Settings</option>
            {parishes.map(p => <option key={p.id} value={p.id}>{p.parish_name}</option>)}
          </select>
        )}
        {user?.role !== 'SUPER_ADMIN' && user?.parish_id && (
          <div className="text-sm text-gray-600">
            {parishes.find(p => p.id === user.parish_id)?.parish_name}
          </div>
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
          {/* Info box when in global mode with remembered parish */}
          {!activeParishId && user?.role === 'SUPER_ADMIN' && (
            <div className="mx-6 mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center">
                <Globe size={16} className="text-blue-600 mr-2" />
                <div className="text-sm">
                  <span className="font-medium text-blue-900">Editing Global Settings</span>
                  <span className="text-blue-700 ml-2">
                    - Select a parish from the dropdown to edit parish-specific settings
                  </span>
                </div>
              </div>
            </div>
          )}
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
              {saved ? <><Check size={16} /> All Settings Saved</> : <><Save size={16} /> {saving ? 'Saving All Settings...' : 'Save All Settings'}</>}
            </button>
          </div>

          <div className="p-6 space-y-6">
            {groupSettings.map(setting => (
              <div key={setting.key} className={`flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-8 ${parishSpecificSettings.has(setting.key) && activeParishId && user?.role === 'SUPER_ADMIN' ? 'bg-purple-50 -mx-2 px-2 py-2 rounded-lg' : ''}`}>
                <div className="sm:w-1/3">
                  <div className="flex items-center gap-2">
                    <label className="block text-sm font-medium text-gray-900">{setting.label}</label>
                    {parishSpecificSettings.has(setting.key) && activeParishId && user?.role === 'SUPER_ADMIN' && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                        <Church size={10} className="mr-1" />
                        Parish override
                      </span>
                    )}
                  </div>
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
