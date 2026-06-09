-- Add attendance permissions
INSERT INTO permission (permission_key, permission_group, display_name, description) VALUES
    ('attendance.view', 'attendance', 'View Attendance', 'View attendance records and statistics'),
    ('attendance.create', 'attendance', 'Create Attendance', 'Create new attendance records'),
    ('attendance.edit', 'attendance', 'Edit Attendance', 'Update attendance records'),
    ('attendance.delete', 'attendance', 'Delete Attendance', 'Delete attendance records')
ON CONFLICT (permission_key) DO NOTHING;

-- Grant attendance permissions to SUPER_ADMIN
INSERT INTO role_permission (role_id, permission_id)
SELECT cr.id, p.id
FROM custom_role cr
CROSS JOIN permission p
WHERE cr.role_name = 'SUPER_ADMIN' AND p.permission_key LIKE 'attendance.%'
ON CONFLICT DO NOTHING;

-- Grant attendance permissions to PARISH_ADMIN
INSERT INTO role_permission (role_id, permission_id)
SELECT cr.id, p.id
FROM custom_role cr
CROSS JOIN permission p
WHERE cr.role_name = 'PARISH_ADMIN' AND p.permission_key LIKE 'attendance.%'
ON CONFLICT DO NOTHING;

-- Grant view permissions to SECRETARY
INSERT INTO role_permission (role_id, permission_id)
SELECT cr.id, p.id
FROM custom_role cr
CROSS JOIN permission p
WHERE cr.role_name = 'SECRETARY' AND p.permission_key = 'attendance.view'
ON CONFLICT DO NOTHING;

-- Grant view permissions to SCC_LEADER
INSERT INTO role_permission (role_id, permission_id)
SELECT cr.id, p.id
FROM custom_role cr
CROSS JOIN permission p
WHERE cr.role_name = 'SCC_LEADER' AND p.permission_key = 'attendance.view'
ON CONFLICT DO NOTHING;
