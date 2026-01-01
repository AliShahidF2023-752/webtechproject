# Supabase Setup Guide

This document explains how to set up Supabase for the Sports Matchmaking application.

## 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Create a new project or use your existing project
3. Note your project URL and anon key from Project Settings > API

## 2. Configure Environment Variables

Create a `.env.local` file in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

## 3. Run Database Migrations

Execute the SQL migrations in order in the Supabase SQL Editor:

1. **0001_initial_schema.sql** - Creates all tables, indexes, and triggers
2. **0002_rls_policies.sql** - Sets up Row Level Security policies
3. **0003_seed_data.sql** - Adds initial sports, venues, and sample data
4. **0004_bank_transfer_payment.sql** - Payment functions and views

### Quick Migration Steps:

1. Open your Supabase Dashboard
2. Go to SQL Editor
3. Copy and paste each migration file content
4. Click "Run"
5. Verify no errors in the output

## 4. Create Admin User

After running migrations, create an admin user:

1. Sign up through the app normally
2. In Supabase SQL Editor, run:

```sql
-- Replace with the actual user ID from auth.users
UPDATE public.users
SET role = 'admin'
WHERE email = 'your-admin-email@example.com';
```

## 5. Configure Auth Settings

In Supabase Dashboard > Authentication > Settings:

1. Enable Email authentication
2. Set Site URL to `http://localhost:3000`
3. Add `http://localhost:3000/auth/callback` to Redirect URLs
4. Optionally disable "Confirm email" for easier testing

## 6. Configure Storage (Optional)

For venue images and payment screenshots:

1. Go to Storage in Supabase Dashboard
2. Create buckets:
   - `venues` - For venue images
   - `payments` - For payment screenshots
   - `avatars` - For user profile pictures

## 7. Enable Realtime

For matchmaking and chat features:

1. Go to Database > Replication
2. Enable realtime for these tables:
   - `matchmaking_queue`
   - `chat_messages`
   - `matches`
   - `bookings`

## Troubleshooting

### RLS Policy Errors
If you get permission errors, ensure you're authenticated and the user has the correct role.

### Migration Errors
If a migration fails, check:
- Extensions are enabled (`uuid-ossp`, `pg_trgm`)
- Tables are created in correct order
- No duplicate type/function definitions

### Auth Callback Issues
Ensure the callback URL matches exactly what's configured in Supabase Auth settings.
