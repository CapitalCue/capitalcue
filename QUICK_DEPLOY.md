# 🚀 Quick Deploy CapitalCue (10 Minutes)

Deploy CapitalCue to production in **10 minutes** for **$0 cost**.

## ⚡ Super Quick Steps

### 1. Push to GitHub (2 minutes)

```bash
# Navigate to your project
cd /Users/sanmeshbajpeyee/financial-analyzer

# Initialize git (if not done)
git init
git add .
git commit -m "CapitalCue ready for deployment"

# Create repo on GitHub.com:
# - Go to github.com/new
# - Name: "capitalcue"
# - Public repository
# - Don't initialize with README

# Connect and push
git remote add origin https://github.com/YOUR_USERNAME/capitalcue.git
git branch -M main
git push -u origin main
```

### 2. Deploy Backend - Railway (3 minutes)

1. **Go to [railway.app](https://railway.app)**
2. **Sign up with GitHub**
3. **New Project** → **Deploy from GitHub repo**
4. **Select**: `capitalcue` repository
5. **Configure**:
   - Root Directory: `apps/api`
   - Auto-deploy: ✅ Enabled

6. **Add Database**:
   - Click "Add Database" → PostgreSQL
   - Railway auto-connects it

7. **Environment Variables** (click Variables tab):
   ```bash
   NODE_ENV=production
   JWT_SECRET=capitalcue-super-secret-jwt-key-2024-production
   CORS_ORIGIN=https://capitalcue.vercel.app
   ANTHROPIC_API_KEY=your-anthropic-key-here
   ```

8. **Deploy** - Railway automatically builds and deploys
9. **Copy your API URL** (e.g., `https://capitalcue.up.railway.app`)

### 3. Deploy Frontend - Vercel (3 minutes)

1. **Go to [vercel.com](https://vercel.com)**
2. **Sign up with GitHub**
3. **New Project** → **Import Git Repository**
4. **Select**: `capitalcue` repository
5. **Configure**:
   - Framework: Next.js
   - Root Directory: `apps/web`
   - Build Command: `cd apps/web && npm run build`

6. **Environment Variables**:
   ```bash
   NEXT_PUBLIC_API_URL=https://your-railway-url.up.railway.app
   NEXT_PUBLIC_APP_NAME=CapitalCue
   ```

7. **Deploy** - Vercel automatically builds and deploys
8. **Copy your Frontend URL** (e.g., `https://capitalcue.vercel.app`)

### 4. Update CORS (1 minute)

1. **Go back to Railway**
2. **Update CORS_ORIGIN** with your actual Vercel URL:
   ```bash
   CORS_ORIGIN=https://capitalcue.vercel.app
   ```
3. **Save** - Railway auto-redeploys

### 5. Test Your Live Site (1 minute)

Visit your live CapitalCue:
- **Homepage**: `https://capitalcue.vercel.app`
- **Pricing**: `https://capitalcue.vercel.app/pricing`
- **Signup**: `https://capitalcue.vercel.app/signup`
- **API Health**: `https://your-railway-url.up.railway.app/health`

## 🎉 You're Live!

**Total Time**: 10 minutes  
**Total Cost**: $0/month  
**Capacity**: 100+ users before needing to upgrade

## 💰 When to Upgrade

- **Month 1-2**: FREE (stay on free tiers)
- **Month 3**: Railway Pro $20/month (when $5 credit runs out)
- **Month 4**: Vercel Pro $20/month (if bandwidth exceeded)

## 🚨 Quick Fixes

**Build Fails?**
- Check Node.js version is 18+ in deployment logs
- Remove `@capitalcue/shared` dependency temporarily

**API Not Working?**
- Check DATABASE_URL is set automatically by Railway
- Verify JWT_SECRET is set

**CORS Errors?**
- Ensure CORS_ORIGIN exactly matches your Vercel URL
- No trailing slash in URL

## 🎯 Next Steps

After deployment:
1. **Get Anthropic API key** for AI features
2. **Set up domain** (optional): $10/year
3. **Launch marketing** to get first users
4. **Set up payments** when ready for revenue

**Your CapitalCue platform is now live and ready for customers!** 🚀

---

Need help? Check the full `DEPLOYMENT_GUIDE.md` for detailed instructions.