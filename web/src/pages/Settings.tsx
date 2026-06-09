import { useState, useEffect } from 'react';
import { api } from '../api/client';
import { Parish } from '../types';
import { Settings as SettingsIcon, Globe, Printer, Mail, CreditCard, RefreshCw, Save, Check, Palette, Church, Settings as SettingsIcon2, Type, Layout, Layers, AlertCircle } from 'lucide-react';
import { SETTING_DEFINITIONS } from '../constants/settings';
import { useSettings } from '../context/SettingsContext';
import { useAuth } from '../context/AuthContext';
import { useParish } from '../context/ParishContext';
import ReceiptBuilder from '../components/ReceiptBuilder';
import { defaultReceiptConfigs, ReceiptConfig } from '../components/CustomReceipt';
import IdInitialsConfig from '../components/IdInitialsConfig';
import { IdConfig } from '../utils/idGenerator';
import Modal from '../components/Modal';
import LanguageSelector from '../components/LanguageSelector';

// Color Settings Section Component
interface ColorSettingsSectionProps {
  values: Record<string, string>;
  updateValue: (key: string, value: string) => void;
  parishSpecificSettings: Set<string>;
  activeParishId: string | null;
  user: any;
}

const ColorSettingsSection = ({ values, updateValue, parishSpecificSettings, activeParishId, user }: ColorSettingsSectionProps) => {
  const colorCategories = [
    {
      id: 'brand',
      title: 'Brand Colors',
      icon: Palette,
      description: 'Primary and secondary brand colors',
      settings: ['ui.primary_color', 'ui.secondary_color'],
    },
    {
      id: 'sidebar',
      title: 'Sidebar Colors',
      icon: Layout,
      description: 'Sidebar background, text, and active state',
      settings: ['ui.sidebar_bg', 'ui.sidebar_text', 'ui.sidebar_active_bg', 'ui.sidebar_border'],
    },
    {
      id: 'topbar',
      title: 'Top Bar Colors',
      icon: Layers,
      description: 'Top navigation bar colors',
      settings: ['ui.topbar_bg', 'ui.topbar_text', 'ui.topbar_border'],
    },
    {
      id: 'background',
      title: 'Background Colors',
      icon: Layout,
      description: 'Page and card background colors',
      settings: ['ui.background_main', 'ui.background_light', 'ui.background_dark'],
    },
    {
      id: 'text',
      title: 'Text Colors',
      icon: Type,
      description: 'Text colors for different content types',
      settings: ['ui.text_primary', 'ui.text_secondary', 'ui.text_muted'],
    },
    {
      id: 'border',
      title: 'Border Colors',
      icon: Layers,
      description: 'Border colors for inputs and cards',
      settings: ['ui.border_primary', 'ui.border_secondary'],
    },
    {
      id: 'status',
      title: 'Status Colors',
      icon: AlertCircle,
      description: 'Colors for success, warning, info, and danger states',
      settings: ['ui.success_color', 'ui.warning_color', 'ui.info_color', 'ui.danger_color'],
    },
    {
      id: 'footer',
      title: 'Footer Colors',
      icon: Layout,
      description: 'Footer background and text colors',
      settings: ['ui.footer_bg', 'ui.footer_text', 'ui.footer_border'],
    },
  ];

  const otherSettings = SETTING_DEFINITIONS.filter(d => d.group === 'ui' && d.type !== 'color');

  const ColorPicker = ({ settingKey, defaultValue, label, description }: { settingKey: string; defaultValue: string; label: string; description: string }) => {
    const isParishOverride = parishSpecificSettings.has(settingKey) && activeParishId && user?.role === 'SUPER_ADMIN';
    return (
      <div className={`flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 ${isParishOverride ? 'bg-purple-50 -mx-2 px-2 py-2 rounded-lg' : ''}`}>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <label className="block text-sm font-medium text-secondary-800">{label}</label>
            {isParishOverride && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                <Church size={10} className="mr-1" />
                Parish override
              </span>
            )}
          </div>
          <p className="text-xs text-secondary-500 mt-0.5">{description}</p>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <input
            type="color"
            value={values[settingKey] || defaultValue}
            onChange={e => updateValue(settingKey, e.target.value)}
            className="h-10 w-14 rounded-lg border border-sidebar-border cursor-pointer shadow-sm"
          />
          <input
            type="text"
            value={values[settingKey] || ''}
            onChange={e => updateValue(settingKey, e.target.value)}
            className="w-32 border border-sidebar-border rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white shadow-sm"
            placeholder="#000000"
          />
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {colorCategories.map(category => {
        const Icon = category.icon;
        const categorySettings = SETTING_DEFINITIONS.filter(d => category.settings.includes(d.key));

        return (
          <div key={category.id} className="bg-white rounded-card shadow-card border border-sidebar-border p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center">
                <Icon size={20} className="text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-secondary-800">{category.title}</h3>
                <p className="text-sm text-secondary-500">{category.description}</p>
              </div>
            </div>
            <div className="space-y-4">
              {categorySettings.map(setting => (
                <ColorPicker
                  key={setting.key}
                  settingKey={setting.key}
                  defaultValue={setting.value}
                  label={setting.label}
                  description={setting.description}
                />
              ))}
            </div>
          </div>
        );
      })}

      {/* Other UI Settings */}
      {otherSettings.length > 0 && (
        <div className="bg-white rounded-card shadow-card border border-sidebar-border p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-secondary-500 to-secondary-600 flex items-center justify-center">
              <SettingsIcon2 size={20} className="text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-secondary-800">Other UI Settings</h3>
              <p className="text-sm text-secondary-500">Additional UI configuration options</p>
            </div>
          </div>
          <div className="space-y-6">
            {otherSettings.map(setting => (
              <div key={setting.key} className={`flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-8 ${parishSpecificSettings.has(setting.key) && activeParishId && user?.role === 'SUPER_ADMIN' ? 'bg-purple-50 -mx-2 px-2 py-2 rounded-lg' : ''}`}>
                <div className="sm:w-1/3">
                  <div className="flex items-center gap-2">
                    <label className="block text-sm font-medium text-secondary-800">{setting.label}</label>
                    {parishSpecificSettings.has(setting.key) && activeParishId && user?.role === 'SUPER_ADMIN' && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                        <Church size={10} className="mr-1" />
                        Parish override
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-secondary-500 mt-0.5">{setting.description}</p>
                </div>
                <div className="sm:w-2/3">
                  {setting.type === 'toggle' && (
                    <div className="flex items-center">
                      <button
                        onClick={() => updateValue(setting.key, values[setting.key] === 'true' ? 'false' : 'true')}
                        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${values[setting.key] === 'true' ? 'bg-primary-600' : 'bg-gray-200'}`}
                      >
                        <span className={`translate-x-0 inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${values[setting.key] === 'true' ? 'translate-x-5' : 'translate-x-0'}`} />
                      </button>
                      <span className="ml-3 text-sm text-secondary-600">{values[setting.key] === 'true' ? 'Enabled' : 'Disabled'}</span>
                    </div>
                  )}
                  {setting.type === 'text' && (
                    <input
                      type="text"
                      value={values[setting.key] || ''}
                      onChange={e => updateValue(setting.key, e.target.value)}
                      className="w-full border border-sidebar-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white shadow-sm"
                      placeholder={setting.description}
                    />
                  )}
                  {setting.type === 'textarea' && (
                    <textarea
                      value={values[setting.key] || ''}
                      onChange={e => updateValue(setting.key, e.target.value)}
                      rows={3}
                      className="w-full border border-sidebar-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white shadow-sm"
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

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
  const [showReceiptBuilder, setShowReceiptBuilder] = useState(false);
  const [receiptConfig, setReceiptConfig] = useState<ReceiptConfig>(defaultReceiptConfigs['thermal-80']);
  const [showIdConfig, setShowIdConfig] = useState(false);
  const [idConfig, setIdConfig] = useState<Partial<IdConfig>>({});
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
      // Save with parish_id if user has one (Parish Admin), otherwise save globally/diocese-level
      const parishId = user?.parish_id || activeParishId || undefined;

      // Save ALL settings, not just the active group
      const allSettings = SETTING_DEFINITIONS.map(d => ({
        parish_id: parishId,
        diocese_id: undefined, // Will be handled by backend as global/diocese when parish_id is null
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

  const handleOpenReceiptBuilder = () => {
    // Load existing config if available
    try {
      const existingConfig = values['custom_receipt_config'];
      if (existingConfig && existingConfig !== '{}') {
        const parsed = JSON.parse(existingConfig);
        setReceiptConfig(parsed);
      }
    } catch (e) {
      console.error('Failed to parse existing receipt config:', e);
    }
    setShowReceiptBuilder(true);
  };

  const handleSaveReceiptConfig = (config: ReceiptConfig) => {
    setReceiptConfig(config);
    const configJson = JSON.stringify(config, null, 2);
    updateValue('custom_receipt_config', configJson);
  };

  const handleOpenIdConfig = () => {
    // Load existing ID configuration
    const currentIdConfig: Partial<IdConfig> = {
      dioceseInitials: values['id.diocese_initials'] || undefined,
      parishInitials: values['id.parish_initials'] || undefined,
      clusterInitials: values['id.cluster_initials'] || undefined,
      sccInitials: values['id.scc_initials'] || undefined,
      familyInitials: values['id.family_initials'] || undefined,
      memberInitials: values['id.member_initials'] || undefined,
    };
    setIdConfig(currentIdConfig);
    setShowIdConfig(true);
  };

  const handleSaveIdConfig = (config: Partial<IdConfig>) => {
    setIdConfig(config);
    // Update all ID configuration values
    if (config.dioceseInitials !== undefined) {
      updateValue('id.diocese_initials', config.dioceseInitials);
    }
    if (config.parishInitials !== undefined) {
      updateValue('id.parish_initials', config.parishInitials);
    }
    if (config.clusterInitials !== undefined) {
      updateValue('id.cluster_initials', config.clusterInitials);
    }
    if (config.sccInitials !== undefined) {
      updateValue('id.scc_initials', config.sccInitials);
    }
    if (config.familyInitials !== undefined) {
      updateValue('id.family_initials', config.familyInitials);
    }
    if (config.memberInitials !== undefined) {
      updateValue('id.member_initials', config.memberInitials);
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
            {activeGroup === 'ui' ? (
              <ColorSettingsSection values={values} updateValue={updateValue} parishSpecificSettings={parishSpecificSettings} activeParishId={activeParishId} user={user} />
            ) : (
              groupSettings.map(setting => (
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
                    {setting.key === 'custom_receipt_config' ? (
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={handleOpenReceiptBuilder}
                            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                          >
                            <SettingsIcon2 size={16} />
                            Open Receipt Builder
                          </button>
                          <span className="text-sm text-gray-500">
                            {values[setting.key] && values[setting.key] !== '{}' ? 'Custom configuration saved' : 'Using default configuration'}
                          </span>
                        </div>
                        {values[setting.key] && values[setting.key] !== '{}' && (
                          <div className="p-3 bg-gray-50 rounded-lg">
                            <div className="text-xs font-medium text-gray-700 mb-1">Current Configuration:</div>
                            <pre className="text-xs text-gray-600 overflow-x-auto whitespace-pre-wrap">
                              {JSON.stringify(JSON.parse(values[setting.key]), null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    ) : setting.key.startsWith('id.') && setting.key.endsWith('_initials') ? (
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={handleOpenIdConfig}
                            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                          >
                            <SettingsIcon2 size={16} />
                            Configure ID Initials
                          </button>
                          <span className="text-sm text-gray-500">
                            {values[setting.key] ? `Using "${values[setting.key]}"` : 'Using default initials'}
                          </span>
                        </div>
                        {setting.key === 'id.diocese_initials' && (
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                            <div className="bg-gray-50 rounded p-2">
                              <div className="font-medium text-gray-700">Diocese</div>
                              <div className="text-gray-900">{values['id.diocese_initials'] || 'DIO'}-000001</div>
                            </div>
                            <div className="bg-gray-50 rounded p-2">
                              <div className="font-medium text-gray-700">Parish</div>
                              <div className="text-gray-900">{values['id.parish_initials'] || 'PAR'}-000001</div>
                            </div>
                            <div className="bg-gray-50 rounded p-2">
                              <div className="font-medium text-gray-700">Member</div>
                              <div className="text-gray-900">{values['id.member_initials'] || 'MEM'}-000001</div>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <input
                        type={setting.key.includes('password') || setting.key.includes('secret') ? 'password' : 'text'}
                        value={values[setting.key] || ''}
                        onChange={e => updateValue(setting.key, e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder={setting.description}
                      />
                    )}
                    {setting.type === 'textarea' && setting.key !== 'custom_receipt_config' && (
                      <textarea
                        value={values[setting.key] || ''}
                        onChange={e => updateValue(setting.key, e.target.value)}
                        rows={3}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    )}
                    {setting.type === 'select' && setting.key !== 'language' && (
                      <select
                        value={values[setting.key] || ''}
                        onChange={e => updateValue(setting.key, e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                      >
                        {setting.options?.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                    )}
                    {setting.key === 'language' && (
                      <div>
                        <LanguageSelector />
                      </div>
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
              ))
            )}

          </div>
        </div>
      </div>

      {/* Receipt Builder Modal */}
      {showReceiptBuilder && (
        <Modal
          isOpen={showReceiptBuilder}
          onClose={() => setShowReceiptBuilder(false)}
          title="Custom Receipt Builder"
          size="xlarge"
        >
          <ReceiptBuilder
            transaction={{
              id: 'sample',
              transaction_number: 'RCT/2024/001',
              amount: 50000,
              category: 'offertory' as any,
              payment_method: 'cash' as any,
              transaction_date: new Date().toISOString().split('T')[0],
              description: 'Sample transaction for receipt preview',
              parish_id: activeParishId || '1',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }}
            parish={parishes.find(p => p.id === (activeParishId || parishes[0]?.id)) || parishes[0]!}
            member={null}
            onConfigChange={handleSaveReceiptConfig}
            initialConfig={receiptConfig}
          />
        </Modal>
      )}

      {/* ID Configuration Modal */}
      {showIdConfig && (
        <Modal
          isOpen={showIdConfig}
          onClose={() => setShowIdConfig(false)}
          title="ID Initials Configuration"
          size="large"
        >
          <IdInitialsConfig
            config={idConfig}
            onChange={handleSaveIdConfig}
            disabled={saving}
          />
        </Modal>
      )}
    </div>
  );
}
