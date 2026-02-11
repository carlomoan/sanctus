-- Add a test diocese
INSERT INTO diocese (id, diocese_code, diocese_name)
VALUES ('770e8400-e29b-41d4-a716-446655440000', 'DIOC-001', 'Morogoro Diocese')
ON CONFLICT DO NOTHING;

-- Add a test parish
INSERT INTO parish (id, diocese_id, parish_code, parish_name)
VALUES ('550e8400-e29b-41d4-a716-446655440000', '770e8400-e29b-41d4-a716-446655440000', 'PAR-001', 'St. Joseph Parish')
ON CONFLICT DO NOTHING;

-- Add a test user (password: Admin@123)
-- Hash for 'Admin@123': pbkdf2_sha256$600000$dzhrJYanLlDMt9lBVxXN1x$mVgZDDYuPyvrH8GnMddoy7WY2E1MGpPAUBfTOOzOKvI=
INSERT INTO app_user (id, parish_id, username, email, password_hash, full_name, role, is_active, must_change_password)
VALUES (
    '880e8400-e29b-41d4-a716-446655440000', 
    '15fc37d5-2739-4218-baff-1aa48942a400', 
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
    parish_id = EXCLUDED.parish_id;
