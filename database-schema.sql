-- Language Learning Platform Database Schema
-- Supports multiple languages, user subscriptions, and daily emails

-- Languages table
CREATE TABLE languages (
    id SERIAL PRIMARY KEY,
    code VARCHAR(5) UNIQUE NOT NULL, -- ISO 639-1 code (tr, pt, en, es, etc.)
    name VARCHAR(50) NOT NULL,
    native_name VARCHAR(50) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Language pairs for translation
CREATE TABLE language_pairs (
    id SERIAL PRIMARY KEY,
    source_language_id INTEGER REFERENCES languages(id),
    target_language_id INTEGER REFERENCES languages(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(source_language_id, target_language_id)
);

-- Difficulty levels
CREATE TABLE difficulty_levels (
    id SERIAL PRIMARY KEY,
    name VARCHAR(20) UNIQUE NOT NULL, -- beginner, intermediate, advanced
    display_name VARCHAR(50) NOT NULL,
    description TEXT,
    sort_order INTEGER DEFAULT 0
);

-- Categories for organizing vocabulary
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    parent_category_id INTEGER REFERENCES categories(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Words table (core vocabulary)
CREATE TABLE words (
    id SERIAL PRIMARY KEY,
    language_id INTEGER REFERENCES languages(id),
    word VARCHAR(255) NOT NULL,
    pronunciation VARCHAR(255),
    part_of_speech VARCHAR(50), -- noun, verb, adjective, etc.
    category_id INTEGER REFERENCES categories(id),
    difficulty_level_id INTEGER REFERENCES difficulty_levels(id),
    frequency_rank INTEGER, -- How common the word is
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(language_id, word)
);

-- Translations table (word pairs)
CREATE TABLE translations (
    id SERIAL PRIMARY KEY,
    source_word_id INTEGER REFERENCES words(id),
    target_word_id INTEGER REFERENCES words(id),
    confidence_score DECIMAL(3,2) DEFAULT 1.0, -- Translation accuracy
    is_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(source_word_id, target_word_id)
);

-- Example sentences
CREATE TABLE example_sentences (
    id SERIAL PRIMARY KEY,
    word_id INTEGER REFERENCES words(id),
    sentence TEXT NOT NULL,
    translation TEXT,
    context VARCHAR(100), -- formal, informal, business, etc.
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    password_hash VARCHAR(255),
    is_verified BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User preferences
CREATE TABLE user_preferences (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    source_language_id INTEGER REFERENCES languages(id),
    target_language_id INTEGER REFERENCES languages(id),
    difficulty_level_id INTEGER REFERENCES difficulty_levels(id),
    words_per_day INTEGER DEFAULT 5,
    email_frequency VARCHAR(20) DEFAULT 'daily', -- daily, weekly, monthly
    email_time TIME DEFAULT '09:00:00',
    timezone VARCHAR(50) DEFAULT 'UTC',
    is_email_subscribed BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id)
);

-- Daily word sets
CREATE TABLE daily_word_sets (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    date DATE NOT NULL,
    source_language_id INTEGER REFERENCES languages(id),
    target_language_id INTEGER REFERENCES languages(id),
    difficulty_level_id INTEGER REFERENCES difficulty_levels(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, date)
);

-- Word set items (words in each daily set)
CREATE TABLE word_set_items (
    id SERIAL PRIMARY KEY,
    daily_word_set_id INTEGER REFERENCES daily_word_sets(id),
    translation_id INTEGER REFERENCES translations(id),
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User progress tracking
CREATE TABLE user_word_progress (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    word_id INTEGER REFERENCES words(id),
    mastery_level INTEGER DEFAULT 0, -- 0-5 scale
    review_count INTEGER DEFAULT 0,
    last_reviewed TIMESTAMP,
    next_review TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, word_id)
);

-- Email templates
CREATE TABLE email_templates (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    subject VARCHAR(255) NOT NULL,
    html_content TEXT NOT NULL,
    text_content TEXT NOT NULL,
    variables JSONB, -- Template variables like {{user_name}}, {{word_count}}, etc.
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Email queue for sending daily emails
CREATE TABLE email_queue (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    email_template_id INTEGER REFERENCES email_templates(id),
    daily_word_set_id INTEGER REFERENCES daily_word_sets(id),
    status VARCHAR(20) DEFAULT 'pending', -- pending, sent, failed
    sent_at TIMESTAMP,
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User sessions for web app
CREATE TABLE user_sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    session_token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_words_language_difficulty ON words(language_id, difficulty_level_id);
CREATE INDEX idx_translations_source_target ON translations(source_word_id, target_word_id);
CREATE INDEX idx_daily_word_sets_user_date ON daily_word_sets(user_id, date);
CREATE INDEX idx_user_word_progress_user_word ON user_word_progress(user_id, word_id);
CREATE INDEX idx_email_queue_status ON email_queue(status);
CREATE INDEX idx_user_sessions_token ON user_sessions(session_token);

-- Insert default data
INSERT INTO languages (code, name, native_name) VALUES
('tr', 'Turkish', 'Türkçe'),
('pt', 'Portuguese', 'Português'),
('en', 'English', 'English'),
('es', 'Spanish', 'Español'),
('fr', 'French', 'Français'),
('de', 'German', 'Deutsch');

INSERT INTO difficulty_levels (name, display_name, description, sort_order) VALUES
('beginner', 'Beginner', 'Basic vocabulary for beginners', 1),
('intermediate', 'Intermediate', 'Intermediate level vocabulary', 2),
('advanced', 'Advanced', 'Advanced vocabulary and expressions', 3);

INSERT INTO categories (name, description) VALUES
('Food & Drinks', 'Vocabulary related to food, beverages, and dining'),
('Family & Relationships', 'Family members and relationship terms'),
('Travel & Transportation', 'Travel-related vocabulary and transportation'),
('Work & Business', 'Professional and business vocabulary'),
('Health & Body', 'Body parts, health, and medical terms'),
('Nature & Environment', 'Natural world and environmental terms'),
('Technology', 'Technology and digital vocabulary'),
('Emotions & Feelings', 'Emotional states and feelings'),
('Daily Activities', 'Common daily activities and routines'),
('Home & Furniture', 'Household items and furniture'); 