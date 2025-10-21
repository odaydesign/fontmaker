# Quick Vercel Deployment Guide

## Step 1: Import to Vercel

1. **Go to Vercel**: https://vercel.com/new
2. **Import Git Repository**:
   - If you see your GitHub account, click "Import" next to `odaydesign/fontmaker`
   - If not, click "Add GitHub Account" and authorize Vercel

## Step 2: Configure Project Settings

**Framework Preset**: Next.js ✅ (auto-detected)
**Root Directory**: `./` ✅ (leave default)
**Build Command**: Uses `vercel.json` ✅
**Output Directory**: `.next` ✅ (auto)

## Step 3: Add Environment Variables

**IMPORTANT**: Click "Environment Variables" section and add these **ONE BY ONE**:

### Copy-Paste These Variables:

**Variable 1 - DATABASE_URL**
```
DATABASE_URL
```
Value:
```
postgresql://postgres.oltvasjxjslobgjvkrll:1423homerVaan!@aws-1-us-east-1.pooler.supabase.com:6543/postgres
```

**Variable 2 - NEXTAUTH_URL** (temporary, we'll update this)
```
NEXTAUTH_URL
```
Value:
```
https://temp-will-update-after-deploy.vercel.app
```

**Variable 3 - NEXTAUTH_SECRET**
```
NEXTAUTH_SECRET
```
Value:
```
jz6INUDCvt5vH6L45AjMcTgJy53ijRS2xEC/n2Dv+Xo=
```

**Variable 4 - NEXT_PUBLIC_SUPABASE_URL**
```
NEXT_PUBLIC_SUPABASE_URL
```
Value:
```
https://oltvasjxjslobgjvkrll.supabase.co
```

**Variable 5 - NEXT_PUBLIC_SUPABASE_ANON_KEY**
```
NEXT_PUBLIC_SUPABASE_ANON_KEY
```
Value:
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9sdHZhc2p4anNsb2JnanZrcmxsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA4ODAyOTUsImV4cCI6MjA3NjQ1NjI5NX0.TXhTWME3bM-lfIi_ygfzRgz0Y29ZE7nxOQJ5aDxCKQc
```

**Variable 6 - SUPABASE_SERVICE_ROLE_KEY**
```
SUPABASE_SERVICE_ROLE_KEY
```
Value:
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9sdHZhc2p4anNsb2JnanZrcmxsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDg4MDI5NSwiZXhwIjoyMDc2NDU2Mjk1fQ.xTYbERXRYZOm8cKghPTKeAkREVnP6OCgmGHPXsPOAtE
```

## Step 4: Deploy!

1. After adding all 6 environment variables, click **"Deploy"**
2. Wait for build to complete (2-3 minutes)
3. You'll see "Congratulations!" when done

## Step 5: Get Your Deployment URL

After deployment completes:
1. You'll see your URL like: `https://fontmaker-abc123.vercel.app`
2. **Copy this URL** - you'll need it for the next steps

## Step 6: Update NEXTAUTH_URL

1. In Vercel, go to your project → **Settings** → **Environment Variables**
2. Find `NEXTAUTH_URL`
3. Click **Edit**
4. Replace with your actual deployment URL (e.g., `https://fontmaker-abc123.vercel.app`)
5. Click **Save**
6. Go to **Deployments** tab
7. Click **"Redeploy"** on the latest deployment

## Step 7: Configure Supabase

1. Go to Supabase: https://supabase.com/dashboard/project/oltvasjxjslobgjvkrll
2. Click **Authentication** (left sidebar)
3. Click **URL Configuration**
4. Update **Site URL**: `https://your-vercel-url.vercel.app`
5. Under **Redirect URLs**, add:
   - `https://your-vercel-url.vercel.app/**`
   - `https://your-vercel-url.vercel.app/api/auth/callback/**`
6. Click **Save**

## Step 8: Test Your Deployment

Visit your Vercel URL and test:
- ✅ Homepage loads
- ✅ Sign up / Login works
- ✅ Create font functionality
- ✅ File uploads work

---

## Troubleshooting

### Build Failed?
- Check build logs in Vercel
- Ensure all 6 environment variables are set
- Check for typos in DATABASE_URL

### Can't Sign In?
- Ensure NEXTAUTH_URL matches your Vercel URL exactly
- Check Supabase redirect URLs are configured
- Try hard refresh (Cmd+Shift+R or Ctrl+Shift+R)

### Database Errors?
- Verify DATABASE_URL uses port `6543`
- Check Supabase project is not paused (https://supabase.com/dashboard)

---

## Quick Links

- **Vercel Dashboard**: https://vercel.com/dashboard
- **Supabase Dashboard**: https://supabase.com/dashboard/project/oltvasjxjslobgjvkrll
- **GitHub Repo**: https://github.com/odaydesign/fontmaker

---

**Need help?** Let me know which step you're on and any error messages you see!
