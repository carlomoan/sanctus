-- Add missing permissions for comprehensive access control

-- Diocese management (missing from original permissions)
INSERT INTO permission (permission_key, permission_group, display_name, description) VALUES
    ('dioceses.view', 'admin', 'View Dioceses', 'View diocese list and details'),
    ('dioceses.create', 'admin', 'Create Dioceses', 'Create new dioceses'),
    ('dioceses.edit', 'admin', 'Edit Dioceses', 'Update diocese details'),
    ('dioceses.delete', 'admin', 'Delete Dioceses', 'Remove dioceses'),
    -- Event management
    ('events.view', 'ministry', 'View Events', 'View event list and details'),
    ('events.create', 'ministry', 'Create Events', 'Create new events'),
    ('events.edit', 'ministry', 'Edit Events', 'Update event details'),
    ('events.delete', 'ministry', 'Delete Events', 'Remove events'),
    ('events.schedule', 'ministry', 'Schedule Events', 'Create and manage event schedules'),
    ('events.recurring', 'ministry', 'Manage Recurring Events', 'Set up and manage repeating events'),
    -- Liturgical calendar management
    ('liturgical.view', 'ministry', 'View Liturgical Calendar', 'View liturgical calendar and events'),
    ('liturgical.manage', 'ministry', 'Manage Liturgical Calendar', 'Update liturgical calendar settings'),
    -- Income type management
    ('income_types.view', 'finance', 'View Income Types', 'View income type categories'),
    ('income_types.create', 'finance', 'Create Income Types', 'Create new income type categories'),
    ('income_types.edit', 'finance', 'Edit Income Types', 'Update income type categories'),
    ('income_types.delete', 'finance', 'Delete Income Types', 'Remove income type categories'),
    -- Audit and logging
    ('audit.view', 'admin', 'View Audit Logs', 'View system audit logs'),
    ('audit.export', 'admin', 'Export Audit Logs', 'Export audit logs for analysis'),
    -- System administration
    ('system.backup', 'admin', 'System Backup', 'Create system backups'),
    ('system.restore', 'admin', 'System Restore', 'Restore from system backups'),
    ('system.maintenance', 'admin', 'System Maintenance', 'Perform system maintenance tasks'),
    -- Communications
    ('communications.send', 'admin', 'Send Communications', 'Send emails and notifications'),
    ('communications.manage', 'admin', 'Manage Communications', 'Manage communication templates and settings'),
    -- Reports and analytics
    ('analytics.view', 'finance', 'View Analytics', 'View analytics and dashboards'),
    ('reports.custom', 'finance', 'Create Custom Reports', 'Create and manage custom reports'),
    -- Data management
    ('data.export', 'admin', 'Export Data', 'Export system data'),
    ('data.import', 'admin', 'Import Data', 'Import data into system'),
    ('data.purge', 'admin', 'Purge Data', 'Purge old system data'),
    -- Mobile app management
    ('mobile.manage', 'admin', 'Manage Mobile App', 'Manage mobile app settings and users'),
    ('sync.manage', 'admin', 'Manage Sync', 'Manage data synchronization settings')
ON CONFLICT (permission_key) DO NOTHING;

-- Update SUPER_ADMIN role to include all new permissions
INSERT INTO role_permission (role_id, permission_id)
SELECT cr.id, p.id FROM custom_role cr CROSS JOIN permission p
WHERE cr.role_name = 'SUPER_ADMIN'
  AND p.permission_key IN (
    'dioceses.view', 'dioceses.create', 'dioceses.edit', 'dioceses.delete',
    'events.view', 'events.create', 'events.edit', 'events.delete', 'events.schedule', 'events.recurring',
    'liturgical.view', 'liturgical.manage',
    'income_types.view', 'income_types.create', 'income_types.edit', 'income_types.delete',
    'audit.view', 'audit.export',
    'system.backup', 'system.restore', 'system.maintenance',
    'communications.send', 'communications.manage',
    'analytics.view', 'reports.custom',
    'data.export', 'data.import', 'data.purge',
    'mobile.manage', 'sync.manage'
  )
ON CONFLICT DO NOTHING;

-- Update PARISH_ADMIN role to include relevant new permissions
INSERT INTO role_permission (role_id, permission_id)
SELECT cr.id, p.id FROM custom_role cr CROSS JOIN permission p
WHERE cr.role_name = 'PARISH_ADMIN'
  AND p.permission_key IN (
    'events.view', 'events.create', 'events.edit', 'events.delete', 'events.schedule', 'events.recurring',
    'liturgical.view',
    'income_types.view', 'income_types.create', 'income_types.edit',
    'analytics.view', 'reports.custom'
  )
ON CONFLICT DO NOTHING;

-- Update ACCOUNTANT role to include relevant new permissions
INSERT INTO role_permission (role_id, permission_id)
SELECT cr.id, p.id FROM custom_role cr CROSS JOIN permission p
WHERE cr.role_name = 'ACCOUNTANT'
  AND p.permission_key IN (
    'income_types.view', 'income_types.create', 'income_types.edit',
    'analytics.view', 'reports.custom'
  )
ON CONFLICT DO NOTHING;

-- Update SECRETARY role to include relevant new permissions
INSERT INTO role_permission (role_id, permission_id)
SELECT cr.id, p.id FROM custom_role cr CROSS JOIN permission p
WHERE cr.role_name = 'SECRETARY'
  AND p.permission_key IN (
    'events.view', 'events.create', 'events.edit', 'events.schedule',
    'liturgical.view',
    'communications.send'
  )
ON CONFLICT DO NOTHING;
