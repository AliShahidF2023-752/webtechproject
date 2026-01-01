# Sports Matchmaking & Venue Booking App

A skill-based sports matchmaking platform for Pakistan with venue booking, player ratings (ELO), behavior profiling, and admin-controlled monetization.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account

### Installation

```bash
# Install dependencies
npm install

# Copy environment file
cp env.example .env.local

# Edit .env.local with your Supabase credentials
# Then run the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Database Setup

Follow the [Supabase Setup Guide](./SUPABASE_SETUP.md) to configure your database.

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── admin/             # Admin dashboard
│   ├── auth/              # Authentication pages
│   ├── bookings/          # Booking management
│   ├── dashboard/         # Player dashboard
│   ├── matchmaking/       # Matchmaking interface
│   ├── profile/           # Profile management
│   ├── venues/            # Venue listings
│   └── api/               # API routes
├── components/            # Reusable components
│   ├── layout/            # Navbar, Footer
│   └── maps/              # Leaflet map components
├── lib/                   # Utilities & helpers
│   ├── supabase/          # Supabase clients
│   ├── elo.ts             # ELO rating calculations
│   └── analytics.ts       # Analytics tracking
├── styles/                # Global CSS
└── types/                 # TypeScript definitions

supabase/
└── migrations/            # SQL migration files
```

## ✨ Features

### For Players
- 🎯 Skill-based matchmaking with ELO ratings
- 📍 Find nearby venues with radius search
- 📅 Book courts and schedule matches
- 💬 In-app chat with opponents
- ⭐ Rate and review players
- 📊 Track your stats and progress

### For Admins
- 🗺️ Manage venues via interactive map
- 👥 User management and roles
- 💳 Payment verification dashboard
- 📈 Analytics and visitor tracking
- 🚨 Report moderation system
- ⚙️ System configuration

### Supported Sports (Phase 1)
- 🏓 Table Tennis
- 🏸 Badminton

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, TypeScript, CSS Modules
- **Backend**: Supabase (PostgreSQL, Auth, Realtime, Storage)
- **Maps**: Leaflet + OpenStreetMap
- **Charts**: Recharts

## 📱 Responsive Design

The application is built with a mobile-first responsive design, optimized for both smartphones and desktop browsers.

## 🔐 Authentication

- Email/password authentication
- Password recovery flow
- Role-based access control (Player, Vendor, Admin)

## 💰 Payment System

- Bank transfer payment with screen screenshot verification
- WhatsApp integration for payment proof
- Admin verification dashboard

## 📊 Analytics

- Visitor tracking (page views, sessions)
- Interaction heatmaps (clicks, scrolls)
- Admin analytics dashboard

## 🧪 Development

```bash
# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linting
npm run lint
```

## 📄 License

This project is for educational and academic purposes.

---

Built with ❤️ for Pakistan's sports community
