-- Force update admin password hash to PBKDF2 format
UPDATE app_user 
SET password_hash = 'pbkdf2_sha256$600000$dzhrJYanLlDMt9lBVxXN1x$mVgZDDYuPyvrH8GnMddoy7WY2E1MGpPAUBfTOOzOKvI=' 
WHERE username = 'admin';
