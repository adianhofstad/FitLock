-- FitLock Database Schema
-- Initial migration for BJJ Fitness Tracker

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- PROFILES TABLE
-- =====================================================
-- User profile information
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    username TEXT UNIQUE,
    full_name TEXT,
    avatar_url TEXT,
    current_belt TEXT DEFAULT 'White' CHECK (current_belt IN ('White', 'Blue', 'Purple', 'Brown', 'Black')),
    belt_stripes INTEGER DEFAULT 0 CHECK (belt_stripes >= 0 AND belt_stripes <= 4),
    academy_name TEXT,
    weight_class TEXT,
    started_training_at DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- =====================================================
-- WORKOUTS TABLE
-- =====================================================
-- Training session logs
CREATE TABLE IF NOT EXISTS public.workouts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    workout_date DATE NOT NULL,
    workout_type TEXT NOT NULL CHECK (workout_type IN ('gi', 'nogi', 'drilling', 'open-mat', 'competition', 'private')),
    duration_minutes INTEGER NOT NULL CHECK (duration_minutes > 0),
    intensity INTEGER NOT NULL CHECK (intensity >= 1 AND intensity <= 4),
    notes TEXT,
    techniques_practiced TEXT[], -- Array of technique names
    sparring_rounds INTEGER,
    injuries TEXT,
    partner_count INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Index for faster queries by user and date
CREATE INDEX IF NOT EXISTS idx_workouts_user_date ON public.workouts(user_id, workout_date DESC);
CREATE INDEX IF NOT EXISTS idx_workouts_user_created ON public.workouts(user_id, created_at DESC);

-- =====================================================
-- USER SETTINGS TABLE
-- =====================================================
-- User preferences and app settings
CREATE TABLE IF NOT EXISTS public.user_settings (
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE PRIMARY KEY,
    weekly_training_goal INTEGER DEFAULT 3 CHECK (weekly_training_goal > 0),
    favorite_techniques TEXT[],
    notification_enabled BOOLEAN DEFAULT true,
    theme TEXT DEFAULT 'dark' CHECK (theme IN ('dark', 'light')),
    language TEXT DEFAULT 'en',
    units_system TEXT DEFAULT 'metric' CHECK (units_system IN ('metric', 'imperial')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- =====================================================
-- ACHIEVEMENTS TABLE
-- =====================================================
-- Track user achievements and milestones
CREATE TABLE IF NOT EXISTS public.achievements (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    achievement_type TEXT NOT NULL,
    achievement_name TEXT NOT NULL,
    description TEXT,
    achieved_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    metadata JSONB -- Store additional data like count, value, etc.
);

CREATE INDEX IF NOT EXISTS idx_achievements_user ON public.achievements(user_id, achieved_at DESC);

-- =====================================================
-- COMPETITIONS TABLE
-- =====================================================
-- Track competition results
CREATE TABLE IF NOT EXISTS public.competitions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    competition_name TEXT NOT NULL,
    competition_date DATE NOT NULL,
    location TEXT,
    division TEXT,
    weight_class TEXT,
    belt_level TEXT,
    placement TEXT, -- "Gold", "Silver", "Bronze", "4th", etc.
    matches_won INTEGER DEFAULT 0,
    matches_lost INTEGER DEFAULT 0,
    submissions INTEGER DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_competitions_user ON public.competitions(user_id, competition_date DESC);

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competitions ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
    ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Workouts policies
CREATE POLICY "Users can view their own workouts"
    ON public.workouts FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own workouts"
    ON public.workouts FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own workouts"
    ON public.workouts FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own workouts"
    ON public.workouts FOR DELETE
    USING (auth.uid() = user_id);

-- User settings policies
CREATE POLICY "Users can view their own settings"
    ON public.user_settings FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own settings"
    ON public.user_settings FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own settings"
    ON public.user_settings FOR UPDATE
    USING (auth.uid() = user_id);

-- Achievements policies
CREATE POLICY "Users can view their own achievements"
    ON public.achievements FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own achievements"
    ON public.achievements FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Competitions policies
CREATE POLICY "Users can view their own competitions"
    ON public.competitions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own competitions"
    ON public.competitions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own competitions"
    ON public.competitions FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own competitions"
    ON public.competitions FOR DELETE
    USING (auth.uid() = user_id);

-- =====================================================
-- FUNCTIONS & TRIGGERS
-- =====================================================

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to all tables
CREATE TRIGGER set_updated_at_profiles
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_workouts
    BEFORE UPDATE ON public.workouts
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_user_settings
    BEFORE UPDATE ON public.user_settings
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_competitions
    BEFORE UPDATE ON public.competitions
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Function to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, username, full_name, avatar_url)
    VALUES (
        NEW.id,
        NEW.raw_user_meta_data->>'username',
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'avatar_url'
    );

    INSERT INTO public.user_settings (user_id)
    VALUES (NEW.id);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create profile when user signs up
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- HELPER VIEWS
-- =====================================================

-- View for workout statistics
CREATE OR REPLACE VIEW public.workout_stats AS
SELECT
    user_id,
    COUNT(*) as total_sessions,
    SUM(duration_minutes) as total_minutes,
    ROUND(AVG(duration_minutes)) as avg_duration,
    ROUND(AVG(intensity::numeric), 1) as avg_intensity,
    COUNT(DISTINCT workout_date) as unique_training_days,
    COUNT(CASE WHEN workout_type = 'gi' THEN 1 END) as gi_sessions,
    COUNT(CASE WHEN workout_type = 'nogi' THEN 1 END) as nogi_sessions,
    COUNT(CASE WHEN workout_type = 'competition' THEN 1 END) as competitions
FROM public.workouts
GROUP BY user_id;

-- View for recent activity
CREATE OR REPLACE VIEW public.recent_activity AS
SELECT
    w.id,
    w.user_id,
    w.workout_date,
    w.workout_type,
    w.duration_minutes,
    w.intensity,
    w.notes,
    w.created_at
FROM public.workouts w
ORDER BY w.workout_date DESC, w.created_at DESC
LIMIT 50;
