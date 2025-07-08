# Cocktail Flow - Supabase Integration

A Next.js cocktail recipe application with Supabase backend integration and localStorage fallback.

## Features

- 🍸 Browse and search cocktail recipes
- ❤️ Save favorite cocktails (synced with Supabase)
- 🛒 Shopping list management (synced with Supabase)
- 👨‍💼 Admin panel for managing cocktails and ingredients
- 🔄 Automatic fallback to localStorage when offline
- 📱 Responsive design with Tailwind CSS

## Supabase Integration

This application uses Supabase as the primary database with localStorage as a backup/cache mechanism:

- **Favorites**: Stored in `user_favorites` table, cached in localStorage
- **Shopping Lists**: Stored in `user_shopping_list` table, cached in localStorage
- **Admin Data**: Cocktails, ingredients, and glass types stored in respective tables
- **Authentication**: Supabase Auth with admin role management

## Setup Instructions

### 1. Environment Configuration

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=https://uqbydhyrplrdhaqnkazc.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxYnlkaHlycGxyZGhhcW5rYXpjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3MTQyMjYsImV4cCI6MjA2NzI5MDIyNn0.GYf2mqHxAFP8jIKAqUOF2jg4_tmqmj7oDqtAiaGGiV4
```

### 2. Database Setup

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Run the SQL commands from `supabase-schema.sql` to create the database schema
4. The schema includes:
   - User management tables
   - Cocktails, ingredients, and glass types
   - User favorites and shopping lists
   - Row Level Security (RLS) policies

### 3. Install Dependencies

```bash
npm install
```

### 4. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

### 5. Test the Integration

Visit [http://localhost:3000/test-integration](http://localhost:3000/test-integration) to run integration tests and verify that:
- Supabase connection is working
- Data storage and retrieval functions correctly
- localStorage fallback works when offline

## Architecture

### Storage Layer

The application uses a hybrid storage approach:

1. **Primary**: Supabase database for persistent, synchronized data
2. **Fallback**: localStorage for offline functionality and caching
3. **Automatic**: Seamless switching between online and offline modes

### Key Components

- `src/lib/supabase.ts` - Supabase client configuration
- `src/lib/storage.ts` - Storage service with Supabase + localStorage fallback
- `src/utils/*Utils.ts` - Utility functions using the storage service
- `supabase-schema.sql` - Database schema and security policies

### Data Flow

1. **Read Operations**: Try Supabase first, fallback to localStorage, cache results
2. **Write Operations**: Write to Supabase, update localStorage cache on success
3. **Offline Mode**: All operations use localStorage, sync when connection restored

## Admin Features

- Password: `cocktailflow2024`
- Manage cocktails, ingredients, and glass types
- Data syncs to Supabase when authenticated
- Supports both Supabase Auth and simple password authentication

## Development

The application maintains backward compatibility while adding Supabase integration:

- Existing localStorage-based functionality continues to work
- New async functions provide Supabase integration
- Synchronous wrapper functions maintain API compatibility
- Graceful degradation when Supabase is unavailable

## Deployment

1. Deploy to Vercel or your preferred platform
2. Set environment variables in your deployment platform
3. Ensure Supabase project is configured with the correct domain
4. Run database migrations if needed

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test with the integration test page
5. Submit a pull request
