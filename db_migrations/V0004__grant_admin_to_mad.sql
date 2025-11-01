-- Give admin rights to Mad user
UPDATE t_p86100639_rpg_game_development.users
SET is_admin = true
WHERE nickname = 'Mad';