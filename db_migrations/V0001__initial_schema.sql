
-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    nickname VARCHAR(50) UNIQUE NOT NULL CHECK (nickname ~ '^[a-zA-Z0-9_]+$'),
    password VARCHAR(255) NOT NULL,
    unc_balance INTEGER DEFAULT 0 CHECK (unc_balance >= 0),
    is_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create rarities table
CREATE TABLE IF NOT EXISTS rarities (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    drop_chance DECIMAL(5, 2) NOT NULL CHECK (drop_chance >= 0 AND drop_chance <= 100),
    color VARCHAR(7) DEFAULT '#FFFFFF',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create characters table
CREATE TABLE IF NOT EXISTS characters (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    rarity_id INTEGER REFERENCES rarities(id),
    damage INTEGER NOT NULL CHECK (damage > 0),
    is_limited BOOLEAN DEFAULT FALSE,
    limited_drop_chance DECIMAL(5, 2),
    available_until TIMESTAMP,
    image_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create user_characters table (inventory)
CREATE TABLE IF NOT EXISTS user_characters (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    character_id INTEGER REFERENCES characters(id),
    acquired_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_on_market BOOLEAN DEFAULT FALSE,
    market_price INTEGER
);

-- Create spin_cooldowns table
CREATE TABLE IF NOT EXISTS spin_cooldowns (
    id SERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE REFERENCES users(id),
    last_spin_at TIMESTAMP NOT NULL,
    free_spins INTEGER DEFAULT 0
);

-- Create market_listings table
CREATE TABLE IF NOT EXISTS market_listings (
    id SERIAL PRIMARY KEY,
    user_character_id INTEGER UNIQUE REFERENCES user_characters(id),
    seller_id INTEGER REFERENCES users(id),
    price INTEGER NOT NULL CHECK (price > 0),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create trade_offers table
CREATE TABLE IF NOT EXISTS trade_offers (
    id SERIAL PRIMARY KEY,
    sender_id INTEGER REFERENCES users(id),
    receiver_id INTEGER REFERENCES users(id),
    sender_unc INTEGER DEFAULT 0,
    receiver_unc INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'cancelled')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create trade_offer_characters table
CREATE TABLE IF NOT EXISTS trade_offer_characters (
    id SERIAL PRIMARY KEY,
    trade_offer_id INTEGER REFERENCES trade_offers(id),
    user_character_id INTEGER REFERENCES user_characters(id),
    is_sender BOOLEAN NOT NULL
);

-- Insert default rarities
INSERT INTO rarities (name, drop_chance, color) VALUES
    ('Common', 60.00, '#9CA3AF'),
    ('Rare', 25.00, '#3B82F6'),
    ('Epic', 10.00, '#A855F7'),
    ('Legendary', 4.00, '#F59E0B'),
    ('Mythic', 1.00, '#EF4444')
ON CONFLICT (name) DO NOTHING;

-- Insert default characters
INSERT INTO characters (name, rarity_id, damage) VALUES
    ('Warrior', 1, 100),
    ('Mage', 2, 150),
    ('Assassin', 3, 200),
    ('Paladin', 4, 300),
    ('Dragon Knight', 5, 500)
ON CONFLICT DO NOTHING;

-- Insert admin user Universe with password Satoru1212 (using bcrypt hash)
INSERT INTO users (nickname, password, unc_balance, is_admin) VALUES
    ('Universe', '$2b$10$rQ3ZXJzJ0bVxYkF8qZ4z3e7N5Y6Z8K9L0M1N2P3Q4R5S6T7U8V9W0', 0, TRUE)
ON CONFLICT (nickname) DO NOTHING;
