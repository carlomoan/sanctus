-- Add a test user (password: Admin@123)
-- Hash for 'Admin@123': pbkdf2_sha256$600000$dzhrJYanLlDMt9lBVxXN1x$mVgZDDYuPyvrH8GnMddoy7WY2E1MGpPAUBfTOOzOKvI=
-- First, fix any existing user with invalid state (SUPER_ADMIN with parish_id)
UPDATE app_user
SET role = 'PARISH_ADMIN', diocese_id = NULL, parish_id = (SELECT id FROM parish LIMIT 1)
WHERE username = 'admin' AND role = 'SUPER_ADMIN' AND parish_id IS NOT NULL;

INSERT INTO app_user (parish_id, username, email, password_hash, full_name, role, is_active, must_change_password)
VALUES (
    (SELECT id FROM parish LIMIT 1),
    'admin',
    'admin@sanctus.com',
    'pbkdf2_sha256$600000$dzhrJYanLlDMt9lBVxXN1x$mVgZDDYuPyvrH8GnMddoy7WY2E1MGpPAUBfTOOzOKvI=',
    'System Admin',
    'PARISH_ADMIN',
    TRUE,
    FALSE
)
ON CONFLICT (username) DO UPDATE SET
    password_hash = EXCLUDED.password_hash,
    parish_id = EXCLUDED.parish_id,
    role = EXCLUDED.role,
    diocese_id = NULL;
