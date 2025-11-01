
-- Update Universe user with properly hashed password for Satoru1212
UPDATE users 
SET password = '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGGa5/p75c50L7N1Yi'
WHERE nickname = 'Universe';
