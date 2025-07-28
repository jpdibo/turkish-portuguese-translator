-- Turkish-Portuguese Translator Database Schema

-- Create languages table
CREATE TABLE IF NOT EXISTS languages (
    id SERIAL PRIMARY KEY,
    code VARCHAR(5) UNIQUE NOT NULL,
    name VARCHAR(50) NOT NULL,
    native_name VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create word_categories table
CREATE TABLE IF NOT EXISTS word_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create words table
CREATE TABLE IF NOT EXISTS words (
    id SERIAL PRIMARY KEY,
    turkish_word VARCHAR(255) NOT NULL,
    portuguese_word VARCHAR(255) NOT NULL,
    turkish_pronunciation VARCHAR(255),
    portuguese_pronunciation VARCHAR(255),
    difficulty_level INTEGER CHECK (difficulty_level BETWEEN 1 AND 5),
    category_id INTEGER REFERENCES word_categories(id),
    part_of_speech VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create word_examples table
CREATE TABLE IF NOT EXISTS word_examples (
    id SERIAL PRIMARY KEY,
    word_id INTEGER REFERENCES words(id) ON DELETE CASCADE,
    turkish_example TEXT NOT NULL,
    portuguese_example TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create user_progress table
CREATE TABLE IF NOT EXISTS user_progress (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    word_id INTEGER REFERENCES words(id) ON DELETE CASCADE,
    mastery_level INTEGER DEFAULT 0 CHECK (mastery_level BETWEEN 0 AND 5),
    last_reviewed TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    review_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, word_id)
);

-- Create email_subscriptions table
CREATE TABLE IF NOT EXISTS email_subscriptions (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    subscription_type VARCHAR(50) DEFAULT 'daily',
    preferred_difficulty_level INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create email_queue table
CREATE TABLE IF NOT EXISTS email_queue (
    id SERIAL PRIMARY KEY,
    subscription_id INTEGER REFERENCES email_subscriptions(id) ON DELETE CASCADE,
    subject VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
    sent_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_words_turkish ON words(turkish_word);
CREATE INDEX IF NOT EXISTS idx_words_portuguese ON words(portuguese_word);
CREATE INDEX IF NOT EXISTS idx_words_difficulty ON words(difficulty_level);
CREATE INDEX IF NOT EXISTS idx_user_progress_user ON user_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_word ON user_progress(word_id);
CREATE INDEX IF NOT EXISTS idx_email_queue_status ON email_queue(status);

-- Insert default languages
INSERT INTO languages (code, name, native_name) VALUES 
('tr', 'Turkish', 'Türkçe'),
('pt', 'Portuguese', 'Português')
ON CONFLICT (code) DO NOTHING;

-- Add English to languages
INSERT INTO languages (code, name, native_name) VALUES ('en', 'English', 'English') ON CONFLICT (code) DO NOTHING;

-- Add language_id to words table if not exists
ALTER TABLE words ADD COLUMN IF NOT EXISTS language_id INTEGER REFERENCES languages(id);

-- Add translations table for word pairs
CREATE TABLE IF NOT EXISTS translations (
    id SERIAL PRIMARY KEY,
    source_word_id INTEGER REFERENCES words(id) ON DELETE CASCADE,
    target_word_id INTEGER REFERENCES words(id) ON DELETE CASCADE,
    UNIQUE(source_word_id, target_word_id)
);

-- Add index for translations
CREATE INDEX IF NOT EXISTS idx_translations_source_target ON translations(source_word_id, target_word_id);

-- Insert default word categories
INSERT INTO word_categories (name, description) VALUES 
('Basic Vocabulary', 'Essential everyday words'),
('Food & Dining', 'Food, drinks, and dining related words'),
('Travel & Transportation', 'Transportation and travel vocabulary'),
('Family & Relationships', 'Family members and relationship terms'),
('Numbers & Time', 'Numbers, dates, and time expressions'),
('Colors & Descriptions', 'Colors and descriptive adjectives'),
('Business & Work', 'Professional and work-related vocabulary'),
('Health & Body', 'Health, body parts, and medical terms')
ON CONFLICT DO NOTHING; 