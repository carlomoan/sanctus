// web/src/pages/Settings.tsx
// Complete rewrite — scoped saving, parish enforcement, live preview

import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../api/client';
import { Parish, UserRole } from '../types';
import {
  Settings as SettingsIcon, Globe, Printer, Mail, CreditCard,
  RefreshCw, Save, Check, Palette, Church, Type, Layout, Layers,
  AlertCircle, ChevronRight, Info, Lock, AlertTriangle, X,
} from 'lucide-react';
import { SETTING_DEFINITIONS, PARISH_EDITABLE_KEYS, DIOCESE_ONLY_KEYS } from '../constants/settings';
import { useSettings } from '../context/SettingsContext';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';

// ── Setting groups shown in left nav ──────────────────────────────────────────
const getGroups = (t: any) => [
  { id: 'ui', label: t('settings.uiConfiguration'), icon: Palette },
  { id: 'locale', label: t('settings.languageLocale'), icon: Globe },
  { id: 'sync', label: t('settings.syncConnectivity'), icon: RefreshCw },
  { id: 'printer', label: t('settings.printerReceipts'), icon: Printer },
  { id: 'email', label: t('settings.emailSms'), icon: Mail },
  { id: 'payments', label: t('settings.paymentIntegrations'), icon: CreditCard },
];

// ── Color categories inside UI group ─────────────────────────────────────────
const getColorCategories = (t: any) => [
  { id: 'brand', title: t('settings.brandColors'), icon: Palette, keys: ['ui.primary_color', 'ui.secondary_color'] },
  { id: 'sidebar', title: t('settings.sidebarColors'), icon: Layout, keys: ['ui.sidebar_bg', 'ui.sidebar_text', 'ui.sidebar_active_bg', 'ui.sidebar_border'] },
  { id: 'topbar', title: t('settings.topBarColors'), icon: Layers, keys: ['ui.topbar_bg', 'ui.topbar_text', 'ui.topbar_border'] },
  { id: 'background', title: t('settings.backgroundColors'), icon: Layout, keys: ['ui.background_main', 'ui.background_light', 'ui.background_dark'] },
  { id: 'text', title: t('settings.textColor'), icon: Type, keys: ['ui.text_primary', 'ui.text_secondary', 'ui.text_muted'] },
  { id: 'border', title: t('settings.borderColors'), icon: Layers, keys: ['ui.border_primary', 'ui.border_secondary'] },
  { id: 'status', title: t('settings.statusColors'), icon: AlertCircle, keys: ['ui.success_color', 'ui.warning_color', 'ui.info_color', 'ui.danger_color'] },
  { id: 'footer', title: t('settings.footer'), icon: Layout, keys: ['ui.footer_bg', 'ui.footer_text', 'ui.footer_border', 'ui.footer_content', 'ui.footer_show'] },
  { id: 'misc', title: t('settings.otherUiSettings'), icon: SettingsIcon, keys: ['ui.app_name', 'ui.logo_url', 'ui.sidebar_collapsed', 'id.diocese_initials', 'id.parish_initials', 'id.member_initials', 'id.family_initials', 'id.cluster_initials', 'id.scc_initials'] },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
const scopeLabel = (key: string, t: any) => {
  const def = SETTING_DEFINITIONS.find(d => d.key === key);
  if (!def) return null;
  if (def.scope === 'diocese') return { label: t('settings.dioceseOnly'), color: 'blue' };
  if (def.scope === 'parish') return { label: t('settings.parishLevel'), color: 'green' };
  return { label: t('settings.bothLevels'), color: 'purple' };
};

// ── Single field renderer ─────────────────────────────────────────────────────
const SettingField = ({
  settingKey, values, onChange, disabled, isOverridden, t,
}: {
  settingKey: string;
  values: Record<string, string>;
  onChange: (key: string, val: string) => void;
  disabled: boolean;
  isOverridden: boolean;
  t: any;
}) => {
  const def = SETTING_DEFINITIONS.find(d => d.key === settingKey);
  if (!def) return null;
  const val = values[settingKey] ?? def.value;
  const scope = scopeLabel(settingKey, t);

  return (
    <div className={`flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 py-3
                     ${isOverridden ? 'bg-purple-50/60 -mx-3 px-3 rounded-lg' : ''}`}>
      {/* Label */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <label className="text-sm font-medium text-secondary-800">{def.label}</label>
          {scope && (
            <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold
              ${scope.color === 'blue' ? 'bg-blue-100 text-blue-700' :
                scope.color === 'green' ? 'bg-emerald-100 text-emerald-700' :
                  'bg-purple-100 text-purple-700'}`}>
              {scope.label}
            </span>
          )}
          {isOverridden && (
            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded
                             text-[10px] font-semibold bg-amber-100 text-amber-700">
              <Church size={9} /> Parish override
            </span>
          )}
          {disabled && (
            <Lock size={11} className="text-secondary-400 flex-shrink-0" />
          )}
        </div>
        <p className="text-xs text-secondary-400 mt-0.5">{def.description}</p>
      </div>

      {/* Input */}
      <div className="flex-shrink-0">
        {def.type === 'color' ? (
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={val || '#000000'}
              disabled={disabled}
              onChange={e => onChange(def.key, e.target.value)}
              className="h-9 w-12 rounded-lg border border-secondary-200 cursor-pointer
                         shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
            />
            <input
              type="text"
              value={val || ''}
              disabled={disabled}
              onChange={e => onChange(def.key, e.target.value)}
              placeholder="#000000"
              className="w-28 input-base font-mono text-xs disabled:opacity-40"
            />
          </div>
        ) : def.type === 'toggle' ? (
          <button
            type="button"
            disabled={disabled}
            onClick={() => onChange(def.key, val === 'true' ? 'false' : 'true')}
            className={`relative inline-flex h-6 w-11 rounded-full border-2 border-transparent
                        transition-colors duration-200 focus:outline-none focus:ring-2
                        focus:ring-primary-500 focus:ring-offset-2
                        disabled:opacity-40 disabled:cursor-not-allowed
                        ${val === 'true' ? 'bg-primary-600' : 'bg-secondary-200'}`}
          >
            <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow
                              transition-transform duration-200
                              ${val === 'true' ? 'translate-x-5' : 'translate-x-0'}`} />
          </button>
        ) : def.type === 'select' ? (
          <select
            value={val}
            disabled={disabled}
            onChange={e => onChange(def.key, e.target.value)}
            className="input-base w-44 disabled:opacity-40"
          >
            {def.options?.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        ) : def.type === 'textarea' ? (
          <textarea
            value={val}
            disabled={disabled}
            rows={3}
            onChange={e => onChange(def.key, e.target.value)}
            className="input-base w-72 disabled:opacity-40"
          />
        ) : (
          <input
            type={def.key.includes('password') || def.key.includes('secret') ? 'password' : 'text'}
            value={val}
            disabled={disabled}
            onChange={e => onChange(def.key, e.target.value)}
            placeholder={def.description}
            className="input-base w-72 disabled:opacity-40"
          />
        )}
      </div>
    </div>
  );
};

// ── Main Settings page ────────────────────────────────────────────────────────
export default function Settings() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { settings, loading: ctxLoading,
    activeParishId, setActiveParishId,
    refreshSettings, canEditKey } = useSettings();

  const [activeGroup, setActiveGroup] = useState('ui');
  const [values, setValues] = useState<Record<string, string>>({});
  const [parishes, setParishes] = useState<Parish[]>([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedKeys, setSavedKeys] = useState<Set<string>>(new Set());
  const [parishOverrides, setParishOverrides] = useState<Set<string>>(new Set());
  const [dirtyKeys, setDirtyKeys] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);

  const isSuperAdmin = user?.role === UserRole.SUPER_ADMIN;
  const isParishAdmin = user?.role === UserRole.PARISH_ADMIN;
  const isGlobalMode = isSuperAdmin && !activeParishId;
  const effectiveScope = isParishAdmin ? 'parish' : isGlobalMode ? 'diocese' : 'parish';

  // ── Load parishes list ────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const ps = await api.listParishes();
        setParishes(ps);
        // Non-super-admins are locked to their own parish
        if (isParishAdmin && user?.parish_id) {
          setActiveParishId(user.parish_id);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setPageLoading(false);
      }
    })();
  }, [user]);

  // ── Sync local form values from context settings ──────────────────────────
  // Runs whenever context settings change (after refreshSettings)
  useEffect(() => {
    if (ctxLoading) return;
    setValues({ ...settings });
    setDirtyKeys(new Set());

    // Track which keys have parish-level overrides vs diocese-level
    if (activeParishId) {
      (async () => {
        try {
          const parishOnly = await api.listSettings(activeParishId);
          if (Array.isArray(parishOnly)) {
            setParishOverrides(new Set(parishOnly.map((s: any) => s.setting_key)));
          }
        } catch { setParishOverrides(new Set()); }
      })();
    } else {
      setParishOverrides(new Set());
    }
  }, [settings, ctxLoading, activeParishId]);

  // ── Update a single value ─────────────────────────────────────────────────
  const updateValue = useCallback((key: string, value: string) => {
    if (!canEditKey(key)) return; // silent guard
    setValues(prev => ({ ...prev, [key]: value }));
    setDirtyKeys(prev => new Set([...prev, key]));
    setSavedKeys(new Set()); // clear saved state on any change
  }, [canEditKey]);

  // ── Save — only dirty keys, to correct scope ──────────────────────────────
  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      // Determine save target
      // SuperAdmin in global mode → parish_id = null (diocese level)
      // SuperAdmin viewing a parish → parish_id = that parish's id
      // ParishAdmin → always their own parish_id (backend also enforces this)
      const saveParishId: string | null = isParishAdmin
        ? (user?.parish_id ?? null)
        : activeParishId;

      // Filter to only dirty keys that this user is allowed to edit
      // and that are appropriate for the current scope
      const keysToSave = [...dirtyKeys].filter(key => {
        if (!canEditKey(key)) return false;
        const def = SETTING_DEFINITIONS.find(d => d.key === key);
        if (!def) return false;
        // In global/diocese mode, only save diocese or 'both' scoped keys
        if (!saveParishId && def.scope === 'parish') return false;
        return true;
      });

      if (keysToSave.length === 0) {
        setSaving(false);
        return;
      }

      const payload = keysToSave.map(key => {
        const def = SETTING_DEFINITIONS.find(d => d.key === key)!;
        return {
          parish_id: saveParishId,
          setting_key: key,
          setting_value: values[key] ?? def.value,
          setting_group: def.group,
          description: def.description,
        };
      });

      await api.bulkUpsertSettings(payload);

      // Refresh context (re-fetches from DB and re-injects CSS vars via StyleInjector)
      await refreshSettings(saveParishId);

      setSavedKeys(new Set(keysToSave));
      setDirtyKeys(new Set());
      setTimeout(() => setSavedKeys(new Set()), 3000);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to save settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // ── Reset parish overrides back to diocese defaults ───────────────────────
  const handleResetParishToDefaults = async () => {
    if (!activeParishId) return;
    setSaving(true);
    try {
      await api.deleteParishSettings(activeParishId);
      await refreshSettings(activeParishId);
      setConfirmReset(false);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to reset settings');
    } finally {
      setSaving(false);
    }
  };

  // ── Switch parish context (SuperAdmin only) ───────────────────────────────
  const handleParishSwitch = (parishId: string | null) => {
    setActiveParishId(parishId);
    setDirtyKeys(new Set());
    setSavedKeys(new Set());
  };

  // ── Render ────────────────────────────────────────────────────────────────
  if (pageLoading || ctxLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="skeleton h-8 w-48 rounded" />
        <div className="skeleton h-4 w-72 rounded" />
        <div className="flex gap-6 mt-6">
          <div className="w-56 space-y-2">
            {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="skeleton h-10 rounded-lg" />)}
          </div>
          <div className="flex-1 skeleton rounded-xl h-96" />
        </div>
      </div>
    );
  }

  // Determine which settings to show in the current group
  const groupDefs = SETTING_DEFINITIONS.filter(d => d.group === activeGroup);
  const isDirty = dirtyKeys.size > 0;
  const allSaved = savedKeys.size > 0 && !isDirty;

  // Parish that's currently being viewed/edited
  const activeParish = parishes.find(p => p.id === activeParishId);

  // Get translated groups and color categories
  const groups = getGroups(t);
  const colorCategories = getColorCategories(t);

  return (
    <div className="space-y-5 animate-fade-in">

      {/* ── Page header ──────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-secondary-900 flex items-center gap-2">
            <SettingsIcon size={20} className="text-secondary-400" />
            {t('settings.title')}
          </h1>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className="text-xs text-secondary-400">Editing level:</span>
            {isGlobalMode ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs
                               font-semibold bg-blue-100 text-blue-700">
                <Globe size={11} /> {t('settings.dioceseMode')}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs
                               font-semibold bg-purple-100 text-purple-700">
                <Church size={11} />
                {activeParish?.parish_name ?? 'Parish'} {t('settings.title')}
              </span>
            )}
            {isDirty && (
              <span className="text-xs text-amber-600 font-medium flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                Unsaved changes
              </span>
            )}
          </div>
        </div>

        {/* SuperAdmin parish switcher */}
        {isSuperAdmin && parishes.length > 0 && (
          <div className="flex items-center gap-2">
            <select
              value={activeParishId ?? ''}
              onChange={e => handleParishSwitch(e.target.value || null)}
              className="input-base !w-auto py-1.5 text-sm"
            >
              <option value="">🌐 Diocese / Global Settings</option>
              {parishes.map(p => (
                <option key={p.id} value={p.id}>⛪ {p.parish_name}</option>
              ))}
            </select>
            {activeParishId && (
              <button
                onClick={() => setConfirmReset(true)}
                className="btn-secondary text-xs py-1.5"
                title="Reset this parish back to diocese defaults"
              >
                <RefreshCw size={13} /> Reset to defaults
              </button>
            )}
          </div>
        )}

        {/* ParishAdmin — show their parish name, no switcher */}
        {isParishAdmin && (
          <div className="flex items-center gap-2 text-sm text-secondary-600">
            <Church size={15} className="text-secondary-400" />
            {parishes.find(p => p.id === user?.parish_id)?.parish_name ?? 'Your Parish'}
          </div>
        )}
      </div>

      {/* ── Info banners ─────────────────────────────────────── */}
      {isGlobalMode && (
        <div className="flex items-start gap-2.5 p-3.5 bg-blue-50 border border-blue-200
                        rounded-xl text-sm text-blue-700">
          <Info size={15} className="flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold">Editing Diocese / Global settings.</span>
            {' '}These are inherited by all parishes as defaults. Select a specific parish above
            to customize settings for that parish only.
          </div>
        </div>
      )}

      {activeParishId && isSuperAdmin && (
        <div className="flex items-start gap-2.5 p-3.5 bg-purple-50 border border-purple-200
                        rounded-xl text-sm text-purple-700">
          <Church size={15} className="flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold">Editing {activeParish?.parish_name} settings.</span>
            {' '}Changes here apply only to this parish and override diocese defaults.
            Keys marked <span className="font-semibold">"Parish override"</span> already
            have custom values for this parish.
          </div>
        </div>
      )}

      {isParishAdmin && (
        <div className="flex items-start gap-2.5 p-3.5 bg-green-50 border border-green-200
                        rounded-xl text-sm text-green-700">
          <Info size={15} className="flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold">
              You are customizing settings for your parish only.
            </span>
            {' '}Diocese-level settings (shown with a lock icon) can only be changed
            by the Diocese Administrator.
          </div>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2.5 p-3.5 bg-red-50 border border-red-200
                        rounded-xl text-sm text-red-700">
          <AlertTriangle size={15} className="flex-shrink-0" />
          {error}
          <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-600">
            <X size={15} />
          </button>
        </div>
      )}

      {/* ── Main layout ──────────────────────────────────────── */}
      <div className="flex gap-5">

        {/* Left nav */}
        <nav className="w-52 flex-shrink-0 space-y-0.5">
          {groups.map(g => {
            const Icon = g.icon;
            const isActive = activeGroup === g.id;
            // Count dirty keys in this group
            const dirty = [...dirtyKeys].filter(k => {
              const def = SETTING_DEFINITIONS.find(d => d.key === k);
              return def?.group === g.id;
            }).length;

            return (
              <button
                key={g.id}
                onClick={() => setActiveGroup(g.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg
                            text-sm font-medium transition-all duration-150 text-left
                            ${isActive
                    ? 'bg-primary-50 text-primary-700 border border-primary-200/80'
                    : 'text-secondary-600 hover:bg-secondary-50 hover:text-secondary-900'
                  }`}
              >
                <Icon size={16} className={isActive ? 'text-primary-500' : 'text-secondary-400'} />
                <span className="flex-1">{g.label}</span>
                {dirty > 0 && (
                  <span className="w-4 h-4 rounded-full bg-amber-500 text-white
                                   text-[10px] font-bold flex items-center justify-center">
                    {dirty}
                  </span>
                )}
                {isActive && <ChevronRight size={14} className="text-primary-400" />}
              </button>
            );
          })}
        </nav>

        {/* Content panel */}
        <div className="flex-1 min-w-0 section-card !p-0 overflow-hidden">

          {/* Panel header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-secondary-100">
            <div>
              <h2 className="text-sm font-semibold text-secondary-800">
                {groups.find(g => g.id === activeGroup)?.label}
              </h2>
              <p className="text-xs text-secondary-400 mt-0.5">
                {effectiveScope === 'diocese'
                  ? 'These settings apply to all parishes as defaults'
                  : `These settings apply to ${activeParish?.parish_name ?? 'this parish'} only`}
              </p>
            </div>
            <button
              onClick={handleSave}
              disabled={saving || !isDirty}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold
                          transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed
                          ${allSaved
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : isDirty
                    ? 'bg-primary-600 text-white hover:bg-primary-700 shadow-sm hover:shadow-md'
                    : 'bg-secondary-100 text-secondary-400 border border-secondary-200'
                }`}
            >
              {saving
                ? <><RefreshCw size={14} className="animate-spin" /> {t('common.loading')}</>
                : allSaved
                  ? <><Check size={14} /> {t('settings.settingsSaved')}</>
                  : <><Save size={14} /> {t('common.save')}{isDirty ? ` (${dirtyKeys.size})` : ''}</>
              }
            </button>
          </div>

          {/* Settings content */}
          <div className="px-6 py-5 space-y-0 divide-y divide-secondary-50">
            {activeGroup === 'ui' ? (

              // UI group — organized into color categories
              <div className="space-y-6 py-1">
                {colorCategories.map(cat => {
                  const Icon = Layout;
                  const catDefs = cat.keys
                    .map(k => SETTING_DEFINITIONS.find(d => d.key === k))
                    .filter(Boolean) as typeof SETTING_DEFINITIONS;
                  if (catDefs.length === 0) return null;

                  return (
                    <div key={cat.id} className="bg-secondary-50/50 rounded-xl p-5 space-y-1">
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary-500
                                        to-primary-600 flex items-center justify-center">
                          <cat.icon size={14} className="text-white" />
                        </div>
                        <h3 className="text-sm font-semibold text-secondary-700">{cat.title}</h3>
                      </div>
                      {catDefs.map(def => (
                        <SettingField
                          key={def.key}
                          settingKey={def.key}
                          values={values}
                          onChange={updateValue}
                          disabled={!canEditKey(def.key)}
                          isOverridden={parishOverrides.has(def.key) && !!activeParishId}
                          t={t}
                        />
                      ))}
                    </div>
                  );
                })}
              </div>

            ) : (

              // All other groups — flat list
              groupDefs.map(def => (
                <div key={def.key} className="py-1">
                  <SettingField
                    settingKey={def.key}
                    values={values}
                    onChange={updateValue}
                    disabled={!canEditKey(def.key)}
                    isOverridden={parishOverrides.has(def.key) && !!activeParishId}
                    t={t}
                  />
                </div>
              ))
            )}

            {groupDefs.length === 0 && activeGroup !== 'ui' && (
              <div className="py-12 text-center text-secondary-400 text-sm">
                No settings in this group.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Reset confirm modal ───────────────────────────────── */}
      <Modal
        isOpen={confirmReset}
        onClose={() => setConfirmReset(false)}
        title={t('settings.resetParishSettings')}
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-3.5 bg-amber-50 border border-amber-200 rounded-lg">
            <AlertTriangle size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-amber-700">
              {t('settings.resetConfirmMessage')}
            </p>
          </div>
          <div className="flex justify-end gap-3">
            <button onClick={() => setConfirmReset(false)} className="btn-secondary text-sm">
              {t('common.cancel')}
            </button>
            <button
              onClick={handleResetParishToDefaults}
              disabled={saving}
              className="btn-danger text-sm"
            >
              {saving ? t('common.loading') : t('settings.resetToDefaults')}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}