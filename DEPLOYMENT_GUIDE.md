# Deployment Guide: GitLab → Vercel

## Step 1: Create a GitLab Repository

1. Go to [gitlab.com](https://gitlab.com) and log in (or create an account)
2. Click **"New project"** button
3. Select **"Create blank project"**
4. Fill in the project details:
   - **Project name**: `trading-dash-v6` (or your preferred name)
   - **Project slug**: `trading-dash-v6` (auto-generated)
   - **Visibility**: Public or Private (your choice)
5. Click **"Create project"**
6. Copy the **HTTPS or SSH URL** from the project page (you'll need this)

## Step 2: Push Code to GitLab

Run these commands in your project directory:

```bash
cd c:\Users\gammastack\Downloads\zip-repl\zip-repl

# Add GitLab remote (replace URL with your GitLab project URL)
git remote add origin https://gitlab.com/YOUR_USERNAME/trading-dash-v6.git

# Or if using SSH (recommended if you have SSH keys configured):
git remote add origin git@gitlab.com:YOUR_USERNAME/trading-dash-v6.git

# Verify remote was added
git remote -v

# Push code to GitLab
git branch -M main
git push -u origin main
```

## Step 3: Create vercel.json Configuration

The project needs a `vercel.json` file for Vercel deployment (already created below if not present).

Key settings:
- Build command: `npm run build`
- Output directory: `dist`
- Root directory: `.` (project root)

## Step 4: Deploy to Vercel

### Option A: Connect via Vercel Dashboard (Recommended)

1. Go to [vercel.com](https://vercel.com) and sign up/log in
2. Click **"Add New..."** → **"Project"**
3. Select **"Import an existing project from GitLab"**
4. Authorize Vercel to access your GitLab account
5. Select the `trading-dash-v6` repository
6. Configure build settings:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm ci`
7. Add environment variables (if needed):
   - Any `.env` variables your app requires
8. Click **"Deploy"**

### Option B: Using Vercel CLI

```bash
# Install Vercel CLI globally (one-time)
npm install -g vercel

# Navigate to project
cd c:\Users\gammastack\Downloads\zip-repl\zip-repl

# Deploy to Vercel
vercel

# Follow the prompts to link your project and configure deployment
```

## Step 5: Configure Environment Variables (if needed)

If your app uses environment variables (like API keys):

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add any variables from your `.env` file
4. Redeploy to apply changes: Click **"Deployments"** → last deployment → **"Redeploy"**

## Step 6: Enable Auto-Deployment

By default, Vercel will automatically deploy when you push to GitLab:

- Every push to `main` branch = production deployment
- Pull Requests get preview URLs automatically

## Troubleshooting

### Build Fails with "PORT already in use"

Edit `package.json` and ensure the build script doesn't run a dev server:
```json
"build": "tsc && vite build"
```

### Missing API Endpoints

If your backend (Express server) is needed:
- Vercel can't run long-lived servers in the free tier
- Consider deploying backend separately to:
  - Railway.app
  - Heroku
  - AWS Lambda
  - Or keep it local for development

### Large Bundle Size

Run:
```bash
npm run build
npm install -g size-limit
size-limit
```

Then optimize large dependencies.

## Project URLs After Deployment

After successful deployment:
- **Production URL**: `https://trading-dash-v6.vercel.app` (or your custom domain)
- **Dashboard**: `https://vercel.com/dashboard`
- **Project Settings**: `https://vercel.com/yourproject/settings`

## Next Steps

1. ✅ Push to GitLab (instructions above)
2. ✅ Deploy to Vercel (instructions above)
3. Test the live deployment
4. Configure custom domain (optional, in Vercel settings)
5. Set up analytics and monitoring

---

**Note**: The backend server (Express on port 5000) won't run on Vercel's free tier. For full functionality with backend APIs, consider deploying the backend separately or using Vercel Pro.
