-- Add notification permissions
INSERT INTO permission (permission_key, permission_group, display_name, description) VALUES
    ('notifications.view', 'notifications', 'View Notifications', 'View notification history and status'),
    ('notifications.send', 'notifications', 'Send Notifications', 'Send SMS and other notifications'),
    ('notifications.manage', 'notifications', 'Manage Notifications', 'Manage notification settings and templates')
ON CONFLICT (permission_key) DO NOTHING;

-- Grant notification permissions to SUPER_ADMIN
INSERT INTO role_permission (role_id, permission_id)
SELECT cr.id, p.id
FROM custom_role cr
CROSS JOIN permission p
WHERE cr.role_name = 'SUPER_ADMIN' AND p.permission_key LIKE 'notifications.%'
ON CONFLICT DO NOTHING;

-- Grant notification permissions to PARISH_ADMIN
INSERT INTO role_permission (role_id, permission_id)
SELECT cr.id, p.id
FROM custom_role cr
CROSS JOIN permission p
WHERE cr.role_name = 'PARISH_ADMIN' AND p.permission_key LIKE 'notifications.%'
ON CONFLICT DO NOTHING;

-- Grant send permissions to SECRETARY
INSERT INTO role_permission (role_id, permission_id)
SELECT cr.id, p.id
FROM custom_role cr
CROSS JOIN permission p
WHERE cr.role_name = 'SECRETARY' AND p.permission_key IN ('notifications.send', 'notifications.view')
ON CONFLICT DO NOTHING;
