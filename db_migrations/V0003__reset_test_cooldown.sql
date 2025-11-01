
-- Clear spin cooldowns for testing
UPDATE spin_cooldowns SET last_spin_at = '2020-01-01 00:00:00' WHERE user_id = 1;
