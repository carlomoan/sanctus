-- Add announcement permissions
INSERT INTO permission (permission_key, permission_group, display_name, description) VALUES
    ('announcements.view', 'announcements', 'View Announcements', 'View announcements list and details'),
    ('announcements.create', 'announcements', 'Create Announcements', 'Create new announcements'),
    ('announcements.edit', 'announcements', 'Edit Announcements', 'Update announcement details'),
    ('announcements.delete', 'announcements', 'Delete Announcements', 'Delete announcements'),
    ('announcements.publish', 'announcements', 'Publish Announcements', 'Publish announcements to make them visible')
ON CONFLICT (permission_key) DO NOTHING;

-- Grant announcement permissions to SUPER_ADMIN
INSERT INTO role_permission (role_id, permission_id)
SELECT cr.id, p.id
FROM custom_role cr
CROSS JOIN permission p
WHERE cr.role_name = 'SUPER_ADMIN' AND p.permission_key LIKE 'announcements.%'
ON CONFLICT DO NOTHING;

-- Grant announcement permissions to PARISH_ADMIN
INSERT INTO role_permission (role_id, permission_id)
SELECT cr.id, p.id
FROM custom_role cr
CROSS JOIN permission p
WHERE cr.role_name = 'PARISH_ADMIN' AND p.permission_key LIKE 'announcements.%'
ON CONFLICT DO NOTHING;
