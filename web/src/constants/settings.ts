export interface SettingItem {
  key: string;
  value: string;
  group: string;
  label: string;
  description: string;
  type: 'text' | 'select' | 'toggle' | 'textarea' | 'color';
  options?: { value: string; label: string }[];
}

export const SETTING_DEFINITIONS: SettingItem[] = [
  // UI Configuration - Brand Colors
  { key: 'ui.primary_color', value: '#4F46E5', group: 'ui', label: 'Primary Color', description: 'Main brand color used for buttons and links', type: 'color' },
  { key: 'ui.secondary_color', value: '#7C3AED', group: 'ui', label: 'Secondary Color', description: 'Accent color for highlights', type: 'color' },

  // UI Configuration - Sidebar Colors
  { key: 'ui.sidebar_bg', value: '#1E293B', group: 'ui', label: 'Sidebar Background', description: 'Sidebar background color', type: 'color' },
  { key: 'ui.sidebar_text', value: '#E2E8F0', group: 'ui', label: 'Sidebar Text Color', description: 'Sidebar text and icon color', type: 'color' },
  { key: 'ui.sidebar_active_bg', value: '#334155', group: 'ui', label: 'Sidebar Active Item', description: 'Background for active sidebar item', type: 'color' },
  { key: 'ui.sidebar_border', value: '#334155', group: 'ui', label: 'Sidebar Border Color', description: 'Sidebar border and divider color', type: 'color' },

  // UI Configuration - Topbar Colors
  { key: 'ui.topbar_bg', value: '#FFFFFF', group: 'ui', label: 'Top Bar Background', description: 'Top navigation bar background color', type: 'color' },
  { key: 'ui.topbar_text', value: '#1E293B', group: 'ui', label: 'Top Bar Text Color', description: 'Top bar text and icon color', type: 'color' },
  { key: 'ui.topbar_border', value: '#E2E8F0', group: 'ui', label: 'Top Bar Border Color', description: 'Top bar border color', type: 'color' },

  // UI Configuration - Background Colors
  { key: 'ui.background_main', value: '#F1F5F9', group: 'ui', label: 'Main Background', description: 'Main page background color', type: 'color' },
  { key: 'ui.background_light', value: '#F8FAFC', group: 'ui', label: 'Light Background', description: 'Light background for cards and sections', type: 'color' },
  { key: 'ui.background_dark', value: '#1E293B', group: 'ui', label: 'Dark Background', description: 'Dark background for contrast elements', type: 'color' },

  // UI Configuration - Text Colors
  { key: 'ui.text_primary', value: '#1E293B', group: 'ui', label: 'Primary Text Color', description: 'Main text color for headings and important content', type: 'color' },
  { key: 'ui.text_secondary', value: '#64748B', group: 'ui', label: 'Secondary Text Color', description: 'Secondary text color for labels and descriptions', type: 'color' },
  { key: 'ui.text_muted', value: '#94A3B8', group: 'ui', label: 'Muted Text Color', description: 'Muted text color for hints and placeholders', type: 'color' },

  // UI Configuration - Border Colors
  { key: 'ui.border_primary', value: '#E2E8F0', group: 'ui', label: 'Primary Border Color', description: 'Main border color for inputs and cards', type: 'color' },
  { key: 'ui.border_secondary', value: '#F1F5F9', group: 'ui', label: 'Secondary Border Color', description: 'Secondary border color for dividers', type: 'color' },

  // UI Configuration - Status Colors
  { key: 'ui.success_color', value: '#10B981', group: 'ui', label: 'Success Color', description: 'Color for success states and positive indicators', type: 'color' },
  { key: 'ui.warning_color', value: '#F59E0B', group: 'ui', label: 'Warning Color', description: 'Color for warning states and alerts', type: 'color' },
  { key: 'ui.info_color', value: '#3B82F6', group: 'ui', label: 'Info Color', description: 'Color for informational messages', type: 'color' },
  { key: 'ui.danger_color', value: '#EF4444', group: 'ui', label: 'Danger Color', description: 'Color for error states and destructive actions', type: 'color' },

  // UI Configuration - Footer Colors
  { key: 'ui.footer_bg', value: '#F8FAFC', group: 'ui', label: 'Footer Background', description: 'Footer background color', type: 'color' },
  { key: 'ui.footer_text', value: '#64748B', group: 'ui', label: 'Footer Text Color', description: 'Footer text color', type: 'color' },
  { key: 'ui.footer_border', value: '#E2E8F0', group: 'ui', label: 'Footer Border Color', description: 'Footer border color', type: 'color' },

  // UI Configuration - Other Settings
  { key: 'ui.sidebar_collapsed', value: 'false', group: 'ui', label: 'Sidebar Collapsed', description: 'Start with sidebar collapsed by default', type: 'toggle' },
  { key: 'ui.topbar_show_breadcrumb', value: 'true', group: 'ui', label: 'Show Breadcrumb', description: 'Display breadcrumb navigation in top bar', type: 'toggle' },
  { key: 'ui.topbar_show_search', value: 'true', group: 'ui', label: 'Show Search', description: 'Display search bar in top navigation', type: 'toggle' },
  { key: 'ui.footer_show', value: 'true', group: 'ui', label: 'Show Footer', description: 'Display footer at the bottom of pages', type: 'toggle' },
  { key: 'ui.footer_content', value: '© 2026 Sanctus Parish Management System. All rights reserved.', group: 'ui', label: 'Footer Content', description: 'Text displayed in the footer', type: 'textarea' },
  { key: 'ui.logo_url', value: '', group: 'ui', label: 'Logo URL', description: 'URL for the system logo image', type: 'text' },
  { key: 'ui.app_name', value: 'Sanctus', group: 'ui', label: 'Application Name', description: 'Display name shown in header and title', type: 'text' },

  // ID Initials Configuration
  { key: 'id.diocese_initials', value: 'DIO', group: 'ui', label: 'Diocese ID Initials', description: '3-character prefix for Diocese IDs (e.g., DOM for Diocese of Morogoro)', type: 'text' },
  { key: 'id.parish_initials', value: 'PAR', group: 'ui', label: 'Parish ID Initials', description: '3-character prefix for Parish IDs (e.g., STM for St. Mary\'s)', type: 'text' },
  { key: 'id.cluster_initials', value: 'CLU', group: 'ui', label: 'Cluster ID Initials', description: '3-character prefix for Cluster IDs (e.g., CHR for Christian Community)', type: 'text' },
  { key: 'id.scc_initials', value: 'SCC', group: 'ui', label: 'SCC ID Initials', description: '3-character prefix for Small Christian Community IDs (e.g., SCC for Small Christian Community)', type: 'text' },
  { key: 'id.family_initials', value: 'FAM', group: 'ui', label: 'Family ID Initials', description: '3-character prefix for Family IDs (e.g., FAM for Family)', type: 'text' },
  { key: 'id.member_initials', value: 'MEM', group: 'ui', label: 'Member ID Initials', description: '3-character prefix for Member IDs (e.g., MEM for Member)', type: 'text' },

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
  { key: 'custom_receipt_config', value: '{}', group: 'printer', label: 'Custom Receipt Configuration', description: 'Advanced receipt layout and styling configuration', type: 'textarea' },

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
