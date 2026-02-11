UPDATE app_user 
SET role = 'SUPER_ADMIN', 
    parish_id = NULL,
    diocese_id = (SELECT id FROM diocese LIMIT 1)
WHERE username = 'admin';
