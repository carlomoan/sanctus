-- Permissions system: granular permissions, custom roles, and temporary user permission overrides

-- Permission definitions (system-wide catalog of all permissions)
CREATE TABLE IF NOT EXISTS permission (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    permission_key VARCHAR(100) NOT NULL UNIQUE,
    permission_group VARCHAR(50) NOT NULL DEFAULT 'general',
    display_name VARCHAR(150) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Custom roles that SuperAdmin can create
CREATE TABLE IF NOT EXISTS custom_role (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    role_name VARCHAR(100) NOT NULL UNIQUE,
    display_name VARCHAR(150) NOT NULL,
    description TEXT,
    is_system BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Permissions assigned to a custom role
CREATE TABLE IF NOT EXISTS role_permission (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    role_id UUID NOT NULL REFERENCES custom_role(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES permission(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(role_id, permission_id)
);

-- Temporary permission overrides for a specific user
-- expires_at = NULL means permanent override (until manually removed)
CREATE TABLE IF NOT EXISTS user_permission_override (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES permission(id) ON DELETE CASCADE,
    granted_by UUID NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
    reason TEXT,
    expires_at TIMESTAMPTZ,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, permission_id)
);

-- Seed system roles matching the existing UserRole enum
INSERT INTO custom_role (role_name, display_name, description, is_system) VALUES
    ('SUPER_ADMIN', 'Diocese Admin', 'Full access to all parishes, users, and settings', TRUE),
    ('PARISH_ADMIN', 'Parish Admin', 'Full access within own parish', TRUE),
    ('ACCOUNTANT', 'Accountant', 'Finance section: transactions, budgets, reports', TRUE),
    ('SECRETARY', 'Secretary', 'People management within parish', TRUE),
    ('VIEWER', 'Viewer', 'Read-only access to people, ministry, finance', TRUE)
ON CONFLICT (role_name) DO NOTHING;

-- Seed all granular permissions
INSERT INTO permission (permission_key, permission_group, display_name, description) VALUES
    -- Members
    ('members.view', 'people', 'View Members', 'View member list and profiles'),
    ('members.create', 'people', 'Create Members', 'Add new members'),
    ('members.edit', 'people', 'Edit Members', 'Update member details'),
    ('members.delete', 'people', 'Delete Members', 'Remove members'),
    ('members.import', 'people', 'Import Members', 'Bulk import members from file'),
    -- Families
    ('families.view', 'people', 'View Families', 'View family list'),
    ('families.create', 'people', 'Create Families', 'Create new families'),
    ('families.edit', 'people', 'Edit Families', 'Update family details'),
    ('families.delete', 'people', 'Delete Families', 'Remove families'),
    -- Clusters & SCCs
    ('clusters.view', 'people', 'View Clusters', 'View cluster list'),
    ('clusters.create', 'people', 'Create Clusters', 'Create new clusters'),
    ('clusters.edit', 'people', 'Edit Clusters', 'Update cluster details'),
    ('clusters.delete', 'people', 'Delete Clusters', 'Remove clusters'),
    ('sccs.view', 'people', 'View SCCs', 'View SCC list'),
    ('sccs.create', 'people', 'Create SCCs', 'Create new SCCs'),
    ('sccs.edit', 'people', 'Edit SCCs', 'Update SCC details'),
    ('sccs.delete', 'people', 'Delete SCCs', 'Remove SCCs'),
    -- Sacraments
    ('sacraments.view', 'ministry', 'View Sacraments', 'View sacrament records'),
    ('sacraments.create', 'ministry', 'Record Sacraments', 'Record new sacraments'),
    ('sacraments.edit', 'ministry', 'Edit Sacraments', 'Update sacrament records'),
    ('sacraments.delete', 'ministry', 'Delete Sacraments', 'Remove sacrament records'),
    -- Finance
    ('finance.view', 'finance', 'View Transactions', 'View income and expense records'),
    ('finance.create', 'finance', 'Create Transactions', 'Record income and expenses'),
    ('finance.approve', 'finance', 'Approve Expenses', 'Approve or reject expense vouchers'),
    ('finance.delete', 'finance', 'Delete Transactions', 'Remove transaction records'),
    -- Budgets
    ('budgets.view', 'finance', 'View Budgets', 'View budget allocations'),
    ('budgets.create', 'finance', 'Create Budgets', 'Set budget allocations'),
    ('budgets.edit', 'finance', 'Edit Budgets', 'Update budget allocations'),
    -- Reports
    ('reports.view', 'finance', 'View Reports', 'View financial reports'),
    ('reports.export', 'finance', 'Export Reports', 'Export reports to PDF/Excel'),
    -- Data Import
    ('import.members', 'admin', 'Import Members', 'Bulk import member data'),
    ('import.transactions', 'admin', 'Import Transactions', 'Bulk import transaction data'),
    ('import.clusters', 'admin', 'Import Clusters', 'Bulk import cluster data'),
    -- Parishes
    ('parishes.view', 'admin', 'View Parishes', 'View parish list'),
    ('parishes.create', 'admin', 'Create Parishes', 'Create new parishes'),
    ('parishes.edit', 'admin', 'Edit Parishes', 'Update parish details'),
    ('parishes.delete', 'admin', 'Delete Parishes', 'Remove parishes'),
    -- Users
    ('users.view', 'admin', 'View Users', 'View user list'),
    ('users.create', 'admin', 'Create Users', 'Create new user accounts'),
    ('users.edit', 'admin', 'Edit Users', 'Update user details and roles'),
    ('users.delete', 'admin', 'Delete Users', 'Remove user accounts'),
    -- Settings
    ('settings.view', 'admin', 'View Settings', 'View system settings'),
    ('settings.edit', 'admin', 'Edit Settings', 'Modify system settings'),
    -- Roles & Permissions
    ('roles.view', 'admin', 'View Roles', 'View roles and permissions'),
    ('roles.manage', 'admin', 'Manage Roles', 'Create/edit roles and assign permissions'),
    ('permissions.override', 'admin', 'Override Permissions', 'Grant temporary permissions to users')
ON CONFLICT (permission_key) DO NOTHING;

-- Assign permissions to system roles
-- SUPER_ADMIN gets everything
INSERT INTO role_permission (role_id, permission_id)
SELECT cr.id, p.id FROM custom_role cr CROSS JOIN permission p
WHERE cr.role_name = 'SUPER_ADMIN'
ON CONFLICT DO NOTHING;

-- PARISH_ADMIN gets everything except parish/user/role management
INSERT INTO role_permission (role_id, permission_id)
SELECT cr.id, p.id FROM custom_role cr CROSS JOIN permission p
WHERE cr.role_name = 'PARISH_ADMIN'
  AND p.permission_key NOT IN ('parishes.create', 'parishes.delete', 'users.create', 'users.delete', 'roles.manage', 'permissions.override')
ON CONFLICT DO NOTHING;

-- ACCOUNTANT gets finance + budget + report permissions
INSERT INTO role_permission (role_id, permission_id)
SELECT cr.id, p.id FROM custom_role cr CROSS JOIN permission p
WHERE cr.role_name = 'ACCOUNTANT'
  AND (p.permission_group = 'finance' OR p.permission_key IN ('members.view', 'families.view'))
ON CONFLICT DO NOTHING;

-- SECRETARY gets people management
INSERT INTO role_permission (role_id, permission_id)
SELECT cr.id, p.id FROM custom_role cr CROSS JOIN permission p
WHERE cr.role_name = 'SECRETARY'
  AND (p.permission_group = 'people' OR p.permission_key IN ('sacraments.view', 'sacraments.create', 'sacraments.edit'))
ON CONFLICT DO NOTHING;

-- VIEWER gets all .view permissions
INSERT INTO role_permission (role_id, permission_id)
SELECT cr.id, p.id FROM custom_role cr CROSS JOIN permission p
WHERE cr.role_name = 'VIEWER'
  AND p.permission_key LIKE '%.view'
ON CONFLICT DO NOTHING;

-- Seed default UI settings
INSERT INTO app_setting (parish_id, setting_key, setting_value, setting_group, description) VALUES
    (NULL, 'ui.primary_color', '#4F46E5', 'ui', 'Primary brand color'),
    (NULL, 'ui.secondary_color', '#7C3AED', 'ui', 'Secondary accent color'),
    (NULL, 'ui.sidebar_bg', '#1E293B', 'ui', 'Sidebar background color'),
    (NULL, 'ui.sidebar_text', '#E2E8F0', 'ui', 'Sidebar text color'),
    (NULL, 'ui.sidebar_active_bg', '#334155', 'ui', 'Sidebar active item background'),
    (NULL, 'ui.sidebar_collapsed', 'false', 'ui', 'Sidebar collapsed by default'),
    (NULL, 'ui.topbar_bg', '#FFFFFF', 'ui', 'Top bar background color'),
    (NULL, 'ui.topbar_text', '#1E293B', 'ui', 'Top bar text color'),
    (NULL, 'ui.topbar_show_breadcrumb', 'true', 'ui', 'Show breadcrumb in top bar'),
    (NULL, 'ui.topbar_show_search', 'true', 'ui', 'Show search in top bar'),
    (NULL, 'ui.footer_show', 'true', 'ui', 'Show footer'),
    (NULL, 'ui.footer_bg', '#F8FAFC', 'ui', 'Footer background color'),
    (NULL, 'ui.footer_text', '#64748B', 'ui', 'Footer text color'),
    (NULL, 'ui.footer_content', '© 2026 Sanctus Parish Management System. All rights reserved.', 'ui', 'Footer text content'),
    (NULL, 'ui.footer_links', '[]', 'ui', 'Footer links JSON array'),
    (NULL, 'ui.logo_url', '', 'ui', 'System logo URL'),
    (NULL, 'ui.app_name', 'Sanctus', 'ui', 'Application display name'),
    (NULL, 'ui.date_format', 'YYYY-MM-DD', 'ui', 'Date display format'),
    (NULL, 'ui.currency', 'TZS', 'ui', 'Default currency code'),
    (NULL, 'ui.currency_locale', 'en-TZ', 'ui', 'Currency locale for formatting')
ON CONFLICT (setting_key) WHERE parish_id IS NULL DO NOTHING;
