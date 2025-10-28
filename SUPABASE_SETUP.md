# FitLock - Supabase Integration Guide

## Overview

FitLock now has a complete Supabase backend with:
- User authentication
- Cloud database storage
- Real-time sync across devices
- Row Level Security (RLS) for data privacy

## Database Schema

### Tables Created

#### 1. **profiles**
Stores user profile information
- `id` (UUID) - References auth.users
- `username` (TEXT) - Unique username
- `full_name` (TEXT)
- `current_belt` (TEXT) - White, Blue, Purple, Brown, Black
- `belt_stripes` (INTEGER) - 0-4 stripes
- `academy_name` (TEXT)
- `weight_class` (TEXT)
- `started_training_at` (DATE)
- Timestamps: `created_at`, `updated_at`

#### 2. **workouts**
Logs all training sessions
- `id` (UUID)
- `user_id` (UUID) - References profiles
- `workout_date` (DATE)
- `workout_type` (TEXT) - gi, nogi, drilling, open-mat, competition, private
- `duration_minutes` (INTEGER)
- `intensity` (INTEGER) - 1-4 scale
- `notes` (TEXT)
- `techniques_practiced` (TEXT[]) - Array of technique names
- `sparring_rounds` (INTEGER)
- `injuries` (TEXT)
- `partner_count` (INTEGER)
- Timestamps: `created_at`, `updated_at`

#### 3. **user_settings**
User preferences and app configuration
- `user_id` (UUID) - Primary key, references profiles
- `weekly_training_goal` (INTEGER) - Default 3
- `favorite_techniques` (TEXT[])
- `notification_enabled` (BOOLEAN)
- `theme` (TEXT) - dark/light
- `language` (TEXT)
- `units_system` (TEXT) - metric/imperial
- Timestamps: `created_at`, `updated_at`

#### 4. **achievements**
Track user milestones and achievements
- `id` (UUID)
- `user_id` (UUID)
- `achievement_type` (TEXT)
- `achievement_name` (TEXT)
- `description` (TEXT)
- `achieved_at` (TIMESTAMP)
- `metadata` (JSONB) - Flexible storage for achievement data

#### 5. **competitions**
Competition results and history
- `id` (UUID)
- `user_id` (UUID)
- `competition_name` (TEXT)
- `competition_date` (DATE)
- `location` (TEXT)
- `division`, `weight_class`, `belt_level` (TEXT)
- `placement` (TEXT) - Gold, Silver, Bronze, etc.
- `matches_won`, `matches_lost`, `submissions` (INTEGER)
- `notes` (TEXT)
- Timestamps: `created_at`, `updated_at`

### Security Features

#### Row Level Security (RLS)
All tables have RLS enabled with policies:
- Users can only view/edit their own data
- Automatic user isolation
- Prevents unauthorized access

#### Automatic Profile Creation
When a user signs up:
1. Auth user is created
2. Profile is automatically created via trigger
3. User settings are initialized with defaults

### Helper Views

#### workout_stats
Pre-calculated workout statistics per user:
- Total sessions
- Total minutes trained
- Average duration and intensity
- Gi vs No-Gi breakdown
- Competition count

#### recent_activity
Last 50 workout sessions ordered by date

## Prerequisites

### Install Docker Desktop
Supabase local development requires Docker:

1. Download Docker Desktop: https://docs.docker.com/desktop
2. Install and start Docker Desktop
3. Verify it's running: `docker --version`

## Getting Started

### 1. Start Local Supabase Instance

```bash
# Start all Supabase services (requires Docker)
npm run supabase:start

# This will start:
# - PostgreSQL database
# - GoTrue (Authentication)
# - PostgREST (API)
# - Realtime
# - Storage
# - Studio (Web UI)
```

The first start will download Docker images (~2-3 minutes).

### 2. Access Supabase Studio

Once started, you'll see output like:
```
API URL: http://localhost:54321
Studio URL: http://localhost:54323
```

Open the Studio URL in your browser to:
- View tables and data
- Test SQL queries
- Manage authentication
- Monitor real-time connections

### 3. Get Connection Details

```bash
npm run supabase:status
```

This shows:
- API URL
- API Keys (anon and service_role)
- Database connection string
- All service URLs

### 4. Apply Migrations

Migrations are automatically applied when you start Supabase.

To reset the database:
```bash
npm run db:reset
```

## Integration with FitLock App

### Install Supabase JS Client

```bash
npm install @supabase/supabase-js
```

### Initialize Supabase in Your App

Add to `script.js`:

```javascript
import { createClient } from '@supabase/supabase-js'

// Get these from `npm run supabase:status`
const supabaseUrl = 'http://localhost:54321'
const supabaseAnonKey = 'your-anon-key-here'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

### Example: Log a Workout

```javascript
async function logWorkout(workoutData) {
    const { data, error } = await supabase
        .from('workouts')
        .insert([{
            user_id: supabase.auth.user().id,
            workout_date: workoutData.date,
            workout_type: workoutData.type,
            duration_minutes: workoutData.duration,
            intensity: workoutData.intensity,
            notes: workoutData.notes
        }])

    if (error) console.error('Error logging workout:', error)
    return data
}
```

### Example: Fetch User Workouts

```javascript
async function getWorkouts() {
    const { data, error } = await supabase
        .from('workouts')
        .select('*')
        .order('workout_date', { ascending: false })

    if (error) console.error('Error fetching workouts:', error)
    return data
}
```

### Example: Authentication

```javascript
// Sign up
async function signUp(email, password, username) {
    const { user, error } = await supabase.auth.signUp({
        email: email,
        password: password,
        options: {
            data: {
                username: username
            }
        }
    })
    // Profile is automatically created via trigger
}

// Sign in
async function signIn(email, password) {
    const { user, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password
    })
}

// Sign out
async function signOut() {
    const { error } = await supabase.auth.signOut()
}

// Get current user
const user = supabase.auth.user()
```

## Deployment to Production

### 1. Create Supabase Project

1. Go to https://supabase.com
2. Click "New Project"
3. Choose organization and region
4. Set database password (save it!)

### 2. Link Your Project

```bash
npx supabase link --project-ref your-project-ref
```

### 3. Push Migrations

```bash
npx supabase db push
```

This applies all your local migrations to production.

### 4. Update App Configuration

Replace local URLs with production:
```javascript
const supabaseUrl = 'https://your-project.supabase.co'
const supabaseAnonKey = 'your-production-anon-key'
```

Get these from:
- Supabase Dashboard > Settings > API

## Useful Commands

```bash
# Start Supabase
npm run supabase:start

# Stop Supabase
npm run supabase:stop

# Check status
npm run supabase:status

# Reset database (WARNING: deletes all data)
npm run db:reset

# Create new migration
npx supabase migration new migration_name

# View database
npx supabase db diff

# Generate TypeScript types
npx supabase gen types typescript --local > types/supabase.ts
```

## Troubleshooting

### Docker Not Running
**Error:** `Cannot connect to the Docker daemon`
**Solution:** Start Docker Desktop app

### Port Already in Use
**Error:** `port 54321 already in use`
**Solution:**
```bash
npm run supabase:stop
# Wait 10 seconds
npm run supabase:start
```

### Migration Failed
**Solution:**
```bash
npm run supabase:stop
npm run db:reset
npm run supabase:start
```

### Can't Connect to Database
**Check:**
1. Docker Desktop is running
2. Supabase is started: `npm run supabase:status`
3. Check firewall settings

## Next Steps

1. **Start Docker Desktop**
2. **Run `npm run supabase:start`**
3. **Open Studio** at http://localhost:54323
4. **Integrate Supabase client** into FitLock app
5. **Add authentication UI** (login/signup forms)
6. **Replace localStorage** with Supabase calls
7. **Test real-time sync** across devices

## Migration File Location

The complete schema is in:
```
supabase/migrations/20251028082356_initial_schema.sql
```

This file includes:
- All table definitions
- Indexes for performance
- RLS policies
- Triggers for auto-updates
- Helper views
- Sample data (commented out)

## Benefits of Supabase Integration

✅ **Cloud Sync** - Access workouts from any device
✅ **Authentication** - Secure user accounts
✅ **Real-time** - Live updates across devices
✅ **Backup** - Never lose your data
✅ **Scalable** - Handles thousands of users
✅ **Type-safe** - Generate TypeScript types
✅ **Row-level Security** - Private by default

## Resources

- [Supabase Docs](https://supabase.com/docs)
- [JavaScript Client](https://supabase.com/docs/reference/javascript/introduction)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Realtime](https://supabase.com/docs/guides/realtime)

---

**Ready to train with cloud sync!** 🥋🔒☁️
