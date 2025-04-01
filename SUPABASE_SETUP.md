# Setting up Supabase for HappyFont

This document describes how to set up Supabase for the HappyFont application.

## Prerequisites

- A Supabase account (sign up at https://supabase.com)
- Node.js and npm installed
- Basic knowledge of PostgreSQL and SQL

## Step 1: Create a Supabase Project

1. Log in to the Supabase dashboard
2. Click on "New Project"
3. Enter a name for your project (e.g., "happyfont")
4. Set a secure database password
5. Choose a region closest to your users
6. Click "Create Project"

## Step 2: Set Up Environment Variables

Update your `.env` file with the following Supabase-specific environment variables:

```
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_KEY=your-supabase-service-key
```

You can find these values in your Supabase project dashboard under "Project Settings" > "API".

## Step 3: Create Database Schema

1. Go to the "SQL Editor" in your Supabase dashboard
2. Create a new query
3. Copy and paste the contents of the `supabase/schema.sql` file into the query editor
4. Run the query to create all the necessary tables and policies

## Step 4: Set Up Storage Buckets

Run the setup script to create the required storage buckets:

```bash
npm install dotenv
node supabase/setup-storage.js
```

This will create the following buckets:
- `fonts`: For storing generated font files
- `source-images`: For storing user-uploaded or AI-generated images
- `character-images`: For storing extracted character images

## Step 5: Set Up Authentication

1. Go to "Authentication" > "Providers" in your Supabase dashboard
2. Enable "Email" provider
3. Configure any additional providers you want to support (e.g., Google, GitHub)
4. Optionally, customize email templates under "Authentication" > "Email Templates"

## Step 6: Verify Your Setup

To verify your setup:

1. Run your application: `npm run dev`
2. Register a new user
3. Create a font
4. Check that the font data is stored in the Supabase database
5. Check that font files and images are stored in the appropriate storage buckets

## Using Supabase in the Application

The application is set up to use Supabase for:

1. **Authentication**: User registration, login, and session management
2. **Database**: Storing font metadata, character mappings, and other related data
3. **Storage**: Storing font files, source images, and character images

## Troubleshooting

### Common Issues

- **CORS Errors**: Make sure your application domain is added to the allowed domains in "Project Settings" > "API" > "CORS"
- **Storage Permissions**: Check that your storage bucket permissions are configured correctly
- **RLS Policies**: Make sure Row Level Security policies are properly set up to allow the correct operations

### Getting Help

If you encounter any issues, check the Supabase documentation at https://supabase.com/docs or join the Supabase Discord community for support. 