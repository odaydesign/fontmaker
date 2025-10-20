# Vercel Deployment Guide

This guide will help you deploy HappyFont to Vercel with Supabase as your database and storage solution.

## Prerequisites

- Vercel account (sign up at https://vercel.com)
- GitHub account (your code should be pushed to GitHub)
- Supabase project (already set up at https://oltvasjxjslobgjvkrll.supabase.co)

## Step 1: Push Your Code to GitHub

Make sure all your changes are committed and pushed to GitHub:

```bash
git add .
git commit -m "Configure for Vercel deployment with Supabase"
git push origin main
```

## Step 2: Connect to Vercel

1. Go to https://vercel.com/dashboard
2. Click "Add New..." → "Project"
3. Import your GitHub repository
4. Select the repository for HappyFont

## Step 3: Configure Environment Variables

In the Vercel project settings, add these environment variables:

### Database
```
DATABASE_URL=postgresql://postgres.oltvasjxjslobgjvkrll:1423homerVaan!@aws-1-us-east-1.pooler.supabase.com:6543/postgres
```

### NextAuth
```
NEXTAUTH_URL=https://your-project.vercel.app
NEXTAUTH_SECRET=jz6INUDCvt5vH6L45AjMcTgJy53ijRS2xEC/n2Dv+Xo=
```

### Supabase
```
NEXT_PUBLIC_SUPABASE_URL=https://oltvasjxjslobgjvkrll.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9sdHZhc2p4anNsb2JnanZrcmxsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA4ODAyOTUsImV4cCI6MjA3NjQ1NjI5NX0.TXhTWME3bM-lfIi_ygfzRgz0Y29ZE7nxOQJ5aDxCKQc
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9sdHZhc2p4anNsb2JnanZrcmxsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDg4MDI5NSwiZXhwIjoyMDc2NDU2Mjk1fQ.xTYbERXRYZOm8cKghPTKeAkREVnP6OCgmGHPXsPOAtE
```

### Optional (if using OpenAI)
```
OPENAI_API_KEY=your-openai-api-key-here
```

### Optional (if using Stripe)
```
STRIPE_SECRET_KEY=your-stripe-secret-key
STRIPE_WEBHOOK_SECRET=your-stripe-webhook-secret
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your-stripe-publishable-key
```

## Step 4: Deploy

1. Click "Deploy"
2. Vercel will automatically build and deploy your application
3. Once deployed, you'll get a URL like `https://your-project.vercel.app`

## Step 5: Update NEXTAUTH_URL

After getting your Vercel URL:

1. Go back to Vercel project settings → Environment Variables
2. Update `NEXTAUTH_URL` with your actual Vercel URL (e.g., `https://happyfont.vercel.app`)
3. Redeploy the project

## Post-Deployment

### Update Supabase Auth Settings

1. Go to your Supabase dashboard: https://supabase.com/dashboard/project/oltvasjxjslobgjvkrll
2. Navigate to "Authentication" → "URL Configuration"
3. Add your Vercel URL to "Site URL": `https://your-project.vercel.app`
4. Add to "Redirect URLs": `https://your-project.vercel.app/**`

### Test Your Deployment

1. Visit your Vercel URL
2. Test user registration and login
3. Test font generation features
4. Check that file uploads work (stored in Supabase Storage)

## Troubleshooting

### Build Fails

- Check build logs in Vercel dashboard
- Ensure all environment variables are set correctly
- Verify DATABASE_URL is using port 6543 (transaction pooler)

### Database Connection Errors

- Vercel should be able to connect to Supabase without issues
- If you see connection errors, check that DATABASE_URL is correct
- Ensure your Supabase project is not paused (free tier pauses after 1 week of inactivity)

### Authentication Issues

- Verify NEXTAUTH_URL matches your Vercel deployment URL
- Check that NEXTAUTH_SECRET is set
- Ensure Supabase redirect URLs are configured correctly

## What's Been Set Up

✅ Supabase database with all tables (User, Font, FontFile, etc.)
✅ Supabase Storage buckets:
  - `fonts` - for font files (TTF, OTF, WOFF, WOFF2)
  - `source-images` - for source images (PNG, JPEG)
  - `character-images` - for character images (PNG)
✅ Prisma client configuration
✅ NextAuth authentication
✅ Vercel build configuration

## Custom Domain (Optional)

To add a custom domain:

1. Go to Vercel project settings → Domains
2. Add your domain (e.g., `happyfont.com`)
3. Follow DNS configuration instructions
4. Update `NEXTAUTH_URL` to use your custom domain
5. Update Supabase Auth redirect URLs to use your custom domain

## Monitoring

- View deployment logs in Vercel dashboard
- Monitor database usage in Supabase dashboard
- Check storage usage in Supabase Storage section

## Support

- Vercel Documentation: https://vercel.com/docs
- Supabase Documentation: https://supabase.com/docs
- Next.js Documentation: https://nextjs.org/docs
