# Sports Matchmaking & Venue Booking App - Project Documentation

This document serves as the comprehensive "Project Bible" and context for the Sports Matchmaking Application. It includes the technical stack, directory structure, implemented features, and the complete development log.

## 1. Technical Context

### Tech Stack
*   **Framework**: Next.js 16 (App Router)
*   **Language**: TypeScript
*   **Database & Auth**: Supabase (PostgreSQL 15+)
*   **Styling**: CSS Modules (scoped styles) with global variables in `globals.css`
*   **Maps & Geolocation**: Leaflet (`leaflet`, `react-leaflet`) with OpenStreetMap
*   **Charts**: Recharts
*   **Date Handling**: date-fns
*   **PDF Generation**: jspdf, jspdf-autotable

### Key Dependencies
*   `@supabase/ssr`: Server-side Supabase client
*   `@supabase/supabase-js`: Client-side Supabase client
*   `leaflet`: Interactive maps
*   `uuid`: Unique identifier generation

### Environment Variables
Required in `.env.local`:
*   `NEXT_PUBLIC_SUPABASE_URL`
*   `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## 2. Project Structure

```
src/
├── app/                    # App Router Pages & API Routes
│   ├── admin/              # Admin Dashboard & Sub-pages (Venues, Config, Users)
│   ├── api/                # API Routes (Cron jobs, Webhooks)
│   ├── auth/               # Login, Signup, Callback
│   ├── dashboard/          # Player Dashboard
│   ├── matchmaking/        # Queue & Matching UI
│   ├── vendor/             # Vendor Dashboard & Venue Management
│   ├── venues/             # Public Venue Discovery
│   └── ...                 # Other core pages (Bookings, Profile, etc.)
├── components/
│   ├── layout/             # Navbar, Footer
│   ├── maps/               # MapView, LocationPicker
│   ├── venues/             # VenueForm, VenueCard
│   └── ...                 # Shared UI components
├── lib/
│   └── supabase/           # Auth & DB Clients (client.ts, server.ts, middleware.ts)
├── styles/                 # Shared styles
└── types/                  # TypeScript interfaces
```

## 3. Database Schema Overview
The database is hosted on Supabase (PostgreSQL). Key tables include:
*   **Identity**: `users` (Roles: player, vendor, admin), `player_profiles`
*   **Venues**: `venues` (with lat/lng), `courts` (pricing), `sports`
*   **Matchmaking**: `matchmaking_queue`, `matches`, `match_players`
*   **Commerce**: `bookings`, `payments`, `system_config`
*   **Security**: `reports`, `visitor_analytics`, `interaction_events`

---

## 4. Development Task Log & Feature Status

### Phase 1: Project Initialization & Infrastructure
- [x] **Project Setup**:
    - [x] Initialize Next.js project with TypeScript.
    - [x] Configure CSS Modules and global variables.
    - [x] Set up absolute import paths (`@/*`).
- [x] **Database Integration**:
    - [x] Configure Supabase client for Server/Client.
    - [x] Set up environment variables.

### Phase 2: Database Schema (PostgreSQL)
- [x] **Core Entities**:
    - [x] `public.users`: Extended Auth table with Roles.
    - [x] `player_profiles`: ELO ratings, behavior statistics.
    - [x] `venues`: Geo-location and approval status.
    - [x] `courts`: Individual courts with rates.
- [x] **Matchmaking & Gameplay**:
    - [x] `matches`, `matchmaking_queue`, `match_players`, `match_feedback`.
- [x] **Commerce**:
    - [x] `bookings`, `payments` (Bank Transfer), `system_config`.
- [x] **Security & Integrity**:
    - [x] `reports`, `visitor_analytics`.
    - [x] **RLS Policies**: Row Level Security on all tables.
    - [x] **Seed Data**: `0003_seed_data.sql` with valid UUIDs.

### Phase 3: Authentication & User Flow
- [x] **Auth Interfaces**: Login, Signup, Password Recovery.
- [x] **Middleware Protection**: Role-based access control (Admin/Vendor/Player).
- [x] **Onboarding**: Mandatory Profile Setup flow.

### Phase 4: Matchmaking System
- [x] **Real-time Queue**:
    - [x] Queue joining with preferences (Sport, Radius, Availability).
    - [x] Real-time updates via Supabase Subscriptions.
- [x] **Matching Logic**:
    - [x] Haversine Distance calculation (Fixed ReferenceError).
    - [x] ELO-based skill matching.

### Phase 5: Venue Management & Discovery
- [x] **Venue Discovery**:
    - [x] Leaflet-based interactive Map.
    - [x] Radius-based search.
- [x] **Advanced Venue Creation** (Recent Upgrade):
    - [x] **Interactive Location Picker**: Click-to-drop pin on Leaflet map.
    - [x] **Reverse Geocoding**: Auto-fetch Address/City from Nominatim API.
    - [x] **Current Location**: "Use Current Location" with robust error handling.
    - [x] **Unified `VenueForm`**: Shared component for Admin/Vendor.
- [x] **Approval Workflow**:
    - [x] New venues default to "Pending".
    - [x] Admin interface to Activate venues.

### Phase 6: Booking & Financials
- [x] **Booking Process**: Court & Time Slot selection with conflict detection.
- [x] **Payment System**: Bank Transfer with screenshot verification & WhatsApp integration.

### Phase 7: Dashboards
- [x] **Admin Dashboard** (`/admin`):
    - [x] Overview Stats, User Management, Reports.
    - [x] **Venue Management**: Create (Map-based), Approve, Delete.
    - [x] **System Config**: Platform fees, Maintenance mode.
- [x] **Vendor Dashboard** (`/vendor`):
    - [x] Manage Venues/Courts, View Bookings, Earnings.

### Phase 8: Quality Assurance & UX
- [x] **Refinements**:
    - [x] Fixed 404s for Admin sub-pages (`/config`, `/venues`).
    - [x] Harmonized UI styling.
    - [x] Verified Geolocation permissions handling.

## 5. Deployment Status
- **Build**: Development build verified functional.
- **Database**: Schemas synced, Seed data applied.
- **Status**: Ready for local testing and feature extension.
