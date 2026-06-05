-- Create liturgical calendar system with recurring event patterns
-- This system accounts for the fact that liturgical event dates change every year

-- Create liturgical_season enum
DO $$ BEGIN
    CREATE TYPE liturgical_season AS ENUM (
        'ADVENT', 'CHRISTMAS', 'LENT', 'HOLY_WEEK', 'EASTER', 'ORDINARY_TIME'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create feast_type enum
DO $$ BEGIN
    CREATE TYPE feast_type AS ENUM (
        'SOLEMNITY', 'FEAST', 'MEMORIAL', 'OPTIONAL_MEMORIAL'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create liturgical_color enum
DO $$ BEGIN
    CREATE TYPE liturgical_color AS ENUM (
        'WHITE', 'RED', 'GREEN', 'VIOLET', 'ROSE', 'BLACK', 'GOLD'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create liturgical_calendar table
CREATE TABLE IF NOT EXISTS liturgical_calendar (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    year INTEGER NOT NULL,
    date DATE NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    feast_type feast_type NOT NULL,
    liturgical_season liturgical_season NOT NULL,
    liturgical_color liturgical_color NOT NULL,
    rank INTEGER NOT NULL DEFAULT 1,
    is_movable BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(year, date, title)
);

-- Create recurring_event_pattern table
CREATE TABLE IF NOT EXISTS recurring_event_pattern (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(200) NOT NULL,
    description TEXT,
    pattern_type VARCHAR(50) NOT NULL, -- 'weekly', 'monthly', 'yearly', 'liturgical'
    pattern_config JSONB NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create generated_event table
CREATE TABLE IF NOT EXISTS generated_event (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pattern_id UUID NOT NULL REFERENCES recurring_event_pattern(id) ON DELETE CASCADE,
    parish_id UUID REFERENCES parish(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    time TIME,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    is_liturgical BOOLEAN DEFAULT FALSE,
    generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_liturgical_calendar_year ON liturgical_calendar(year);
CREATE INDEX IF NOT EXISTS idx_liturgical_calendar_date ON liturgical_calendar(date);
CREATE INDEX IF NOT EXISTS idx_liturgical_calendar_season ON liturgical_calendar(liturgical_season);
CREATE INDEX IF NOT EXISTS idx_liturgical_calendar_feast_type ON liturgical_calendar(feast_type);
CREATE INDEX IF NOT EXISTS idx_liturgical_calendar_rank ON liturgical_calendar(rank);

CREATE INDEX IF NOT EXISTS idx_recurring_pattern_type ON recurring_event_pattern(pattern_type);
CREATE INDEX IF NOT EXISTS idx_recurring_pattern_active ON recurring_event_pattern(is_active);

CREATE INDEX IF NOT EXISTS idx_generated_event_pattern_id ON generated_event(pattern_id);
CREATE INDEX IF NOT EXISTS idx_generated_event_parish_id ON generated_event(parish_id);
CREATE INDEX IF NOT EXISTS idx_generated_event_date ON generated_event(date);
CREATE INDEX IF NOT EXISTS idx_generated_event_liturgical ON generated_event(is_liturgical);

-- Add constraints
ALTER TABLE liturgical_calendar ADD CONSTRAINT chk_liturgical_rank 
CHECK (rank > 0);

ALTER TABLE liturgical_calendar ADD CONSTRAINT chk_liturgical_year 
CHECK (year > 0);

-- Add comments for documentation
COMMENT ON TABLE liturgical_calendar IS 'Liturgical calendar with feast days, seasons, and colors - year-specific since dates change annually';
COMMENT ON TABLE recurring_event_pattern IS 'Patterns for generating recurring events (weekly masses, etc.)';
COMMENT ON TABLE generated_event IS 'Events generated from recurring patterns for specific parishes';

COMMENT ON COLUMN liturgical_calendar.year IS 'Liturgical year - required since feast dates change annually';
COMMENT ON COLUMN liturgical_calendar.feast_type IS 'Type of liturgical celebration: Solemnity, Feast, Memorial, etc.';
COMMENT ON COLUMN liturgical_calendar.liturgical_season IS 'Liturgical season: Advent, Christmas, Lent, etc.';
COMMENT ON COLUMN liturgical_calendar.liturgical_color IS 'Liturgical color for the celebration';
COMMENT ON COLUMN liturgical_calendar.rank IS 'Importance ranking for ordering (1=highest)';

COMMENT ON COLUMN recurring_event_pattern.pattern_type IS 'Type of pattern: weekly, monthly, yearly, liturgical';
COMMENT ON COLUMN recurring_event_pattern.pattern_config IS 'JSON configuration specific to the pattern type';

-- Create trigger to automatically update updated_at timestamps
CREATE OR REPLACE FUNCTION update_liturgical_calendar_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_liturgical_calendar_updated_at
    BEFORE UPDATE ON liturgical_calendar
    FOR EACH ROW
    EXECUTE FUNCTION update_liturgical_calendar_updated_at();

CREATE OR REPLACE FUNCTION update_recurring_pattern_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_recurring_pattern_updated_at
    BEFORE UPDATE ON recurring_event_pattern
    FOR EACH ROW
    EXECUTE FUNCTION update_recurring_pattern_updated_at();

-- Insert some basic liturgical calendar entries for 2024 (example data)
-- Note: These dates are for 2024 and will need to be updated for each year
INSERT INTO liturgical_calendar (year, date, title, description, feast_type, liturgical_season, liturgical_color, rank, is_movable) VALUES
-- Advent Season 2024
(2024, '2024-12-01', 'First Sunday of Advent', 'Beginning of the liturgical year', 'SOLEMNITY', 'ADVENT', 'VIOLET', 1, true),
(2024, '2024-12-08', 'Immaculate Conception', 'Patronal feast of the United States', 'SOLEMNITY', 'ADVENT', 'WHITE', 1, false),
(2024, '2024-12-25', 'Nativity of the Lord', 'Christmas Day', 'SOLEMNITY', 'CHRISTMAS', 'WHITE', 1, false),
(2024, '2024-12-26', 'St. Stephen', 'First Martyr', 'FEAST', 'CHRISTMAS', 'RED', 2, false),

-- Lent and Easter 2024
(2024, '2024-02-14', 'Ash Wednesday', 'Beginning of Lent', 'SOLEMNITY', 'LENT', 'VIOLET', 1, true),
(2024, '2024-03-24', 'Palm Sunday', 'Triumphal entry into Jerusalem', 'SOLEMNITY', 'HOLY_WEEK', 'RED', 1, true),
(2024, '2024-03-28', 'Good Friday', 'Crucifixion of the Lord', 'SOLEMNITY', 'HOLY_WEEK', 'RED', 1, true),
(2024, '2024-03-30', 'Easter Sunday', 'Resurrection of the Lord', 'SOLEMNITY', 'EASTER', 'WHITE', 1, true),
(2024, '2024-05-09', 'Ascension Thursday', 'Ascension of the Lord', 'SOLEMNITY', 'EASTER', 'WHITE', 1, true),
(2024, '2024-05-19', 'Pentecost Sunday', 'Descent of the Holy Spirit', 'SOLEMNITY', 'EASTER', 'RED', 1, true),

-- Other major feasts 2024
(2024, '2024-03-19', 'St. Joseph', 'Spouse of the Blessed Virgin Mary', 'SOLEMNITY', 'LENT', 'WHITE', 1, false),
(2024, '2024-03-25', 'Annunciation', 'Annunciation of the Lord', 'SOLEMNITY', 'LENT', 'WHITE', 1, false),
(2024, '2024-06-24', 'St. John the Baptist', 'Birth of St. John the Baptist', 'SOLEMNITY', 'ORDINARY_TIME', 'WHITE', 1, false),
(2024, '2024-06-29', 'Sts. Peter and Paul', 'Apostles Peter and Paul', 'SOLEMNITY', 'ORDINARY_TIME', 'RED', 1, false),
(2024, '2024-08-15', 'Assumption', 'Assumption of the Blessed Virgin Mary', 'SOLEMNITY', 'ORDINARY_TIME', 'WHITE', 1, false),
(2024, '2024-11-01', 'All Saints', 'All Saints Day', 'SOLEMNITY', 'ORDINARY_TIME', 'WHITE', 1, false),
(2024, '2024-11-02', 'All Souls', 'All Souls Day', 'MEMORIAL', 'ORDINARY_TIME', 'BLACK', 2, false),
(2024, '2024-12-31', 'Holy Family', 'Holy Family of Jesus, Mary, and Joseph', 'FEAST', 'CHRISTMAS', 'WHITE', 2, false);

-- Insert some basic recurring event patterns
INSERT INTO recurring_event_pattern (name, description, pattern_type, pattern_config, is_active) VALUES
('Sunday Mass', 'Weekly Sunday Mass celebration', 'weekly', '{"day_of_week": 0, "time": "09:00"}', true),
('Daily Mass', 'Daily Mass celebration', 'weekly', '{"day_of_week": 1, "time": "08:00"}', true),
('First Friday Devotion', 'First Friday devotion to Sacred Heart', 'monthly', '{"day_of_month": 1, "time": "19:00"}', true),
('Christmas Day Mass', 'Christmas Day Mass', 'yearly', '{"month": 12, "day": 25, "time": "10:00"}', true),
('Easter Sunday Mass', 'Easter Sunday Mass', 'liturgical', '{"feast_name": "Easter Sunday", "time": "10:00"}', true),
('Ash Wednesday Mass', 'Ash Wednesday Mass', 'liturgical', '{"feast_name": "Ash Wednesday", "time": "12:00"}', true);
