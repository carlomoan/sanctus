// web/src/constants/settings.ts
// Single source of truth for all setting definitions
// scope: 'diocese' = only diocese admin / super admin can set
//        'parish'  = parish admin can override, inherits from diocese
//        'both'    = both levels can set independently

export type SettingScope = 'diocese' | 'parish' | 'both';
export type SettingType = 'text' | 'color' | 'toggle' | 'textarea' | 'select' | 'number';

export interface SettingDefinition {
  key: string;
  label: string;
  description: string;
  group: string;
  type: SettingType;
  value: string;       // default value
  scope: SettingScope;
  options?: { label: string; value: string }[];
}

export const SETTING_DEFINITIONS: SettingDefinition[] = [
  // ── UI CONFIG ─────────────────────────────────────────────
  // Diocese-only: brand identity set at top level
  { key: 'ui.app_name', label: 'Application Name', description: 'System name shown in title and sidebar', group: 'ui', type: 'text', value: 'Sanctus', scope: 'diocese' },
  { key: 'ui.logo_url', label: 'Logo URL', description: 'URL to organization logo image', group: 'ui', type: 'text', value: '', scope: 'diocese' },
  { key: 'ui.primary_color', label: 'Primary Color', description: 'Main brand color (hex)', group: 'ui', type: 'color', value: '#4f46e5', scope: 'diocese' },
  { key: 'ui.secondary_color', label: 'Secondary Color', description: 'Secondary brand color (hex)', group: 'ui', type: 'color', value: '#0f172a', scope: 'diocese' },

  // Parish-overridable: each parish can customize their own look
  { key: 'ui.sidebar_bg', label: 'Sidebar Background', description: 'Sidebar background color', group: 'ui', type: 'color', value: '#0f172a', scope: 'both' },
  { key: 'ui.sidebar_text', label: 'Sidebar Text', description: 'Sidebar text color', group: 'ui', type: 'color', value: '#cbd5e1', scope: 'both' },
  { key: 'ui.sidebar_active_bg', label: 'Sidebar Active BG', description: 'Active nav item background', group: 'ui', type: 'color', value: '#1e293b', scope: 'both' },
  { key: 'ui.sidebar_border', label: 'Sidebar Border', description: 'Sidebar border color', group: 'ui', type: 'color', value: '#1e293b', scope: 'both' },
  { key: 'ui.topbar_bg', label: 'Topbar Background', description: 'Top bar background color', group: 'ui', type: 'color', value: '#ffffff', scope: 'both' },
  { key: 'ui.topbar_text', label: 'Topbar Text', description: 'Top bar text color', group: 'ui', type: 'color', value: '#1e293b', scope: 'both' },
  { key: 'ui.topbar_border', label: 'Topbar Border', description: 'Top bar border color', group: 'ui', type: 'color', value: '#e2e8f0', scope: 'both' },
  { key: 'ui.background_main', label: 'Main Background', description: 'Page background color', group: 'ui', type: 'color', value: '#f8fafc', scope: 'both' },
  { key: 'ui.background_light', label: 'Light Background', description: 'Card/panel light background', group: 'ui', type: 'color', value: '#f1f5f9', scope: 'both' },
  { key: 'ui.background_dark', label: 'Dark Background', description: 'Dark panel background', group: 'ui', type: 'color', value: '#1e293b', scope: 'both' },
  { key: 'ui.text_primary', label: 'Primary Text', description: 'Main text color', group: 'ui', type: 'color', value: '#0f172a', scope: 'both' },
  { key: 'ui.text_secondary', label: 'Secondary Text', description: 'Muted/subtitle text color', group: 'ui', type: 'color', value: '#64748b', scope: 'both' },
  { key: 'ui.text_muted', label: 'Muted Text', description: 'Placeholder/helper text color', group: 'ui', type: 'color', value: '#94a3b8', scope: 'both' },
  { key: 'ui.border_primary', label: 'Primary Border', description: 'Input and card border color', group: 'ui', type: 'color', value: '#e2e8f0', scope: 'both' },
  { key: 'ui.border_secondary', label: 'Secondary Border', description: 'Subtle divider border color', group: 'ui', type: 'color', value: '#f1f5f9', scope: 'both' },
  { key: 'ui.success_color', label: 'Success Color', description: 'Success state color', group: 'ui', type: 'color', value: '#10b981', scope: 'diocese' },
  { key: 'ui.warning_color', label: 'Warning Color', description: 'Warning state color', group: 'ui', type: 'color', value: '#f59e0b', scope: 'diocese' },
  { key: 'ui.info_color', label: 'Info Color', description: 'Info state color', group: 'ui', type: 'color', value: '#3b82f6', scope: 'diocese' },
  { key: 'ui.danger_color', label: 'Danger Color', description: 'Danger/error state color', group: 'ui', type: 'color', value: '#ef4444', scope: 'diocese' },
  { key: 'ui.footer_bg', label: 'Footer Background', description: 'Footer background color', group: 'ui', type: 'color', value: '#ffffff', scope: 'both' },
  { key: 'ui.footer_text', label: 'Footer Text', description: 'Footer text color', group: 'ui', type: 'color', value: '#64748b', scope: 'both' },
  { key: 'ui.footer_border', label: 'Footer Border', description: 'Footer top border color', group: 'ui', type: 'color', value: '#e2e8f0', scope: 'both' },
  { key: 'ui.footer_content', label: 'Footer Text Content', description: 'Text shown in footer', group: 'ui', type: 'text', value: '© 2026 Sanctus Parish Management', scope: 'both' },
  { key: 'ui.footer_show', label: 'Show Footer', description: 'Show or hide the footer bar', group: 'ui', type: 'toggle', value: 'true', scope: 'both' },
  { key: 'ui.sidebar_collapsed', label: 'Sidebar Collapsed', description: 'Start with sidebar collapsed', group: 'ui', type: 'toggle', value: 'false', scope: 'both' },

  // ── LOCALE ────────────────────────────────────────────────
  {
    key: 'locale.language', label: 'Language', description: 'System interface language', group: 'locale', type: 'select', value: 'en', scope: 'both',
    options: [{ label: 'English', value: 'en' }, { label: 'Kiswahili', value: 'sw' }]
  },
  { key: 'locale.timezone', label: 'Timezone', description: 'Default timezone for dates', group: 'locale', type: 'text', value: 'Africa/Dar_es_Salaam', scope: 'both' },
  {
    key: 'locale.currency', label: 'Currency', description: 'Display currency', group: 'locale', type: 'select', value: 'TZS', scope: 'diocese',
    options: [{ label: 'TZS - Tanzanian Shilling', value: 'TZS' }, { label: 'USD - US Dollar', value: 'USD' }, { label: 'KES - Kenyan Shilling', value: 'KES' }]
  },
  {
    key: 'locale.date_format', label: 'Date Format', description: 'How dates are displayed', group: 'locale', type: 'select', value: 'DD/MM/YYYY', scope: 'both',
    options: [{ label: 'DD/MM/YYYY', value: 'DD/MM/YYYY' }, { label: 'MM/DD/YYYY', value: 'MM/DD/YYYY' }, { label: 'YYYY-MM-DD', value: 'YYYY-MM-DD' }]
  },

  // ── SYNC ─────────────────────────────────────────────────
  { key: 'sync.offline_enabled', label: 'Offline Mode', description: 'Enable offline data sync', group: 'sync', type: 'toggle', value: 'true', scope: 'diocese' },
  { key: 'sync.sync_interval', label: 'Sync Interval (mins)', description: 'How often to sync data', group: 'sync', type: 'number', value: '15', scope: 'diocese' },

  // ── PRINTER ───────────────────────────────────────────────
  {
    key: 'printer.receipt_width', label: 'Receipt Width', description: 'Thermal printer paper width (mm)', group: 'printer', type: 'select', value: '80', scope: 'parish',
    options: [{ label: '58mm', value: '58' }, { label: '80mm', value: '80' }]
  },
  { key: 'printer.auto_print', label: 'Auto Print Receipt', description: 'Auto-print receipt after transaction', group: 'printer', type: 'toggle', value: 'false', scope: 'parish' },
  { key: 'custom_receipt_config', label: 'Receipt Layout', description: 'Custom receipt template configuration', group: 'printer', type: 'textarea', value: '{}', scope: 'parish' },

  // ── EMAIL / SMS ───────────────────────────────────────────
  { key: 'sms.api_key', label: 'Africa\'s Talking API Key', description: 'SMS gateway API key', group: 'email', type: 'text', value: '', scope: 'diocese' },
  { key: 'sms.sender_id', label: 'SMS Sender ID', description: 'SMS sender name (max 11 chars)', group: 'email', type: 'text', value: 'SANCTUS', scope: 'diocese' },
  { key: 'email.smtp_host', label: 'SMTP Host', description: 'Email server hostname', group: 'email', type: 'text', value: '', scope: 'diocese' },
  { key: 'email.smtp_port', label: 'SMTP Port', description: 'Email server port', group: 'email', type: 'text', value: '587', scope: 'diocese' },
  { key: 'email.smtp_user', label: 'SMTP Username', description: 'Email account username', group: 'email', type: 'text', value: '', scope: 'diocese' },
  { key: 'email.smtp_password', label: 'SMTP Password', description: 'Email account password', group: 'email', type: 'text', value: '', scope: 'diocese' },
  { key: 'email.from_name', label: 'From Name', description: 'Sender display name in emails', group: 'email', type: 'text', value: 'Sanctus Parish', scope: 'both' },
  { key: 'email.from_address', label: 'From Address', description: 'Sender email address', group: 'email', type: 'text', value: '', scope: 'diocese' },

  // ── PAYMENTS ──────────────────────────────────────────────
  { key: 'payment.mpesa_shortcode', label: 'M-Pesa Shortcode', description: 'M-Pesa business shortcode', group: 'payments', type: 'text', value: '', scope: 'parish' },
  { key: 'payment.mpesa_key', label: 'M-Pesa Consumer Key', description: 'M-Pesa API consumer key', group: 'payments', type: 'text', value: '', scope: 'diocese' },
  { key: 'payment.mpesa_secret', label: 'M-Pesa Consumer Secret', description: 'M-Pesa API consumer secret', group: 'payments', type: 'text', value: '', scope: 'diocese' },
  { key: 'payment.tigopesa_code', label: 'TigoPesa Code', description: 'TigoPesa business number', group: 'payments', type: 'text', value: '', scope: 'parish' },
  { key: 'payment.airtel_code', label: 'Airtel Money Code', description: 'Airtel Money business number', group: 'payments', type: 'text', value: '', scope: 'parish' },

  // ── ID INITIALS ───────────────────────────────────────────
  { key: 'id.diocese_initials', label: 'Diocese Initials', description: 'Prefix for Diocese IDs', group: 'ui', type: 'text', value: 'DIO', scope: 'diocese' },
  { key: 'id.parish_initials', label: 'Parish Initials', description: 'Prefix for Parish IDs', group: 'ui', type: 'text', value: 'PAR', scope: 'parish' },
  { key: 'id.member_initials', label: 'Member Initials', description: 'Prefix for Member IDs', group: 'ui', type: 'text', value: 'MEM', scope: 'parish' },
  { key: 'id.family_initials', label: 'Family Initials', description: 'Prefix for Family IDs', group: 'ui', type: 'text', value: 'FAM', scope: 'parish' },
  { key: 'id.cluster_initials', label: 'Cluster Initials', description: 'Prefix for Cluster IDs', group: 'ui', type: 'text', value: 'CLU', scope: 'parish' },
  { key: 'id.scc_initials', label: 'SCC Initials', description: 'Prefix for SCC IDs', group: 'ui', type: 'text', value: 'SCC', scope: 'parish' },
];

/** Keys editable at diocese/global level only */
export const DIOCESE_ONLY_KEYS = new Set(
  SETTING_DEFINITIONS.filter(d => d.scope === 'diocese').map(d => d.key)
);

/** Keys a parish admin can override */
export const PARISH_EDITABLE_KEYS = new Set(
  SETTING_DEFINITIONS.filter(d => d.scope === 'parish' || d.scope === 'both').map(d => d.key)
);