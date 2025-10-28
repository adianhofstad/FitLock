# FitLock + Supabase - Quick Start

## Prerequisites

1. **Install Docker Desktop** (required for local development)
   - Download: https://docs.docker.com/desktop
   - Start Docker Desktop app

## Start Supabase in 3 Steps

### 1. Start Local Supabase

```bash
npm run supabase:start
```

Wait 2-3 minutes for initial Docker image download (first time only).

### 2. Open Supabase Studio

Once started, open: **http://localhost:54323**

You'll see:
- Tables: profiles, workouts, user_settings, achievements, competitions
- SQL Editor
- Authentication manager
- API documentation

### 3. Get Your API Keys

```bash
npm run supabase:status
```

Copy:
- `API URL`: http://localhost:54321
- `anon key`: (long string starting with eyJ...)

## Database Schema Summary

### Tables Created
- **profiles** - User info (belt level, academy, started date)
- **workouts** - Training session logs
- **user_settings** - App preferences
- **achievements** - Milestones and badges
- **competitions** - Competition results

### Views
- **workout_stats** - Pre-calculated statistics
- **recent_activity** - Last 50 workouts

### Security
- ✅ Row Level Security (RLS) enabled
- ✅ Users can only see their own data
- ✅ Automatic profile creation on signup

## Integrate with FitLock

### Install Client Library

```bash
npm install @supabase/supabase-js
```

### Add to script.js

```javascript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
    'http://localhost:54321',
    'your-anon-key-from-status-command'
)

// Check if user is logged in
const user = supabase.auth.getUser()
```

## Common Commands

```bash
# Start
npm run supabase:start

# Stop
npm run supabase:stop

# Status & Keys
npm run supabase:status

# Reset Database (deletes all data)
npm run db:reset
```

## Test in Studio

1. Go to http://localhost:54323
2. Click "Table Editor"
3. Select "workouts" table
4. Click "Insert row"
5. Fill in workout data
6. See it appear in the table!

## What's Next?

- [ ] Start Docker Desktop
- [ ] Run `npm run supabase:start`
- [ ] Open Studio (http://localhost:54323)
- [ ] Install `@supabase/supabase-js`
- [ ] Add auth UI (login/signup)
- [ ] Replace localStorage with Supabase
- [ ] Test cloud sync!

## Need Help?

See full documentation: **SUPABASE_SETUP.md**

---

**Your database is ready! Time to add cloud sync to FitLock.** 🚀
