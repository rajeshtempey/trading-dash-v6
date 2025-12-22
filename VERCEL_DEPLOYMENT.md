# TradingDash V6 - Deployment Instructions

## Quick Start: GitLab → Vercel Deployment

Your project is ready to deploy! Follow these steps:

### Step 1️⃣: Push to GitLab

```bash
# Navigate to your project
cd c:\Users\gammastack\Downloads\zip-repl\zip-repl

# Add your GitLab repository URL
git remote add origin https://gitlab.com/YOUR_USERNAME/trading-dash-v6.git

# Push code
git push -u origin main
```

**Need a GitLab repo?**
1. Go to [gitlab.com](https://gitlab.com)
2. Click "New project" → "Create blank project"
3. Name it `trading-dash-v6`
4. Copy the HTTPS URL and use it above

### Step 2️⃣: Deploy to Vercel

#### Method A: Via Web Dashboard (Easiest)

1. Visit [vercel.com](https://vercel.com)
2. Sign in / Sign up
3. Click "Add New Project"
4. Select "Import an existing project"
5. Connect your GitLab account
6. Select the `trading-dash-v6` repository
7. Keep default settings:
   - **Framework**: Vite ✓
   - **Build Command**: `npm run build` ✓
   - **Output Directory**: `dist` ✓
8. Click **"Deploy"** 🚀

**Your app will be live at**: `https://trading-dash-v6.vercel.app`

#### Method B: Via Vercel CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Navigate to project
cd c:\Users\gammastack\Downloads\zip-repl\zip-repl

# Deploy
vercel

# Follow prompts to connect your account and configure
```

### Step 3️⃣: Verify Deployment

- ✅ Check Vercel dashboard for deployment status
- ✅ Visit your production URL
- ✅ Test the chart and timeframe switching
- ✅ Verify real-time signals are loading

---

## Project Structure

```
├── client/                    # Frontend (React + Vite)
│   ├── src/
│   │   ├── components/       # React components
│   │   ├── pages/            # Page layouts
│   │   ├── tools/            # Drawing tools, Fibonacci
│   │   └── services/         # WebSocket, notifications
│   └── index.html
├── server/                    # Backend (Express)
│   ├── index.ts             # Main server
│   ├── indicators/          # Technical indicators
│   └── shira-v6-engine.ts  # Signal generation
├── shared/                    # Shared types
└── vercel.json              # Vercel configuration
```

## Technologies

- **Frontend**: React 18, TypeScript, Tailwind CSS, Vite
- **Backend**: Express, Node.js, Socket.io
- **Charts**: Lightweight Charts v4
- **Indicators**: 20+ technical indicators
- **Deployment**: Vercel (frontend) + Vercel Serverless Functions (backend)

## Environment Variables

If your app needs environment variables, add them in Vercel:

1. Go to **Project Settings** → **Environment Variables**
2. Add your variables from `.env`
3. Redeploy

```bash
# Common variables
NODE_ENV=production
VITE_API_URL=https://api.example.com
```

## Important Notes

### Backend Limitation
The Express backend server cannot run continuously on Vercel's free tier. For full functionality:

**Option 1: Vercel Pro** ($20/month)
- Allows serverless functions with longer runtime

**Option 2: Separate Backend Hosting**
- Deploy backend to:
  - [Railway.app](https://railway.app) (recommended, $5/month)
  - [Heroku](https://heroku.com)
  - [AWS Lambda](https://aws.amazon.com/lambda/)
  - [DigitalOcean](https://digitalocean.com)

Then update `VITE_API_URL` to your backend URL.

**Option 3: Local Backend + Vercel Frontend**
- Keep backend running locally during development
- Use frontend-only features on production

### Frontend Features (Works on Vercel)
✅ Chart visualization
✅ Technical indicators display
✅ Drawing tools
✅ Theme switching
✅ Responsive design
✅ WebSocket (if backend available)

### Backend Features (Needs separate hosting)
- Real-time price updates
- Signal generation
- ML predictions
- Pattern recognition
- Live candle data

---

## Deployment Status

| Component | Status | Deployed | Location |
|-----------|--------|----------|----------|
| Frontend | ✅ Ready | Vercel | vercel.com |
| Backend | ⚙️ Optional | Manual | Railway/Heroku |
| Database | ❌ Not used | - | - |
| Storage | ❌ Not used | - | - |

---

## Auto-Deployment

Once connected to GitLab on Vercel:

- **Every push to `main`** → Automatic production deployment
- **Every PR** → Automatic preview URL (staging)
- **Manual redeploy** → Via Vercel dashboard

No additional setup needed! 🎉

---

## Rollback

If something breaks:

1. Go to Vercel project dashboard
2. Click **"Deployments"**
3. Find the previous good deployment
4. Click **"⋮"** → **"Rollback"**

---

## Custom Domain

To add your own domain:

1. In Vercel project settings
2. Go to **"Domains"**
3. Add your custom domain
4. Follow DNS configuration instructions

Example: `trading.yourdomain.com`

---

## Monitoring & Analytics

Vercel provides:
- **Build logs**: See build errors
- **Function logs**: Monitor backend
- **Performance metrics**: Load times
- **Error tracking**: Runtime errors

Access via Vercel dashboard → Project → Analytics

---

## Support & Troubleshooting

### Build fails?
- Check build logs in Vercel
- Ensure `npm run build` works locally
- Verify all dependencies are installed

### Page loads but is blank?
- Check browser console for JS errors
- Verify environment variables are set
- Check network tab for failed requests

### Real-time features not working?
- Backend must be deployed separately
- Update API URL in environment variables
- Check CORS settings on backend

---

## Next Steps

1. ✅ **Push to GitLab**: `git push -u origin main`
2. ✅ **Deploy to Vercel**: Connect GitLab repo
3. 📊 **Monitor**: Use Vercel dashboard
4. 🔧 **Optimize**: Check performance metrics
5. 🎯 **Custom Domain**: Add your own domain (optional)
6. 🚀 **Scale**: Upgrade to Pro if needed (optional)

---

## Questions?

- Check [Vercel Docs](https://vercel.com/docs)
- Check [GitLab CI/CD Docs](https://docs.gitlab.com/ee/ci/)
- Check [Vite Docs](https://vitejs.dev/)

**Happy deploying! 🚀**
