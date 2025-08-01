# CapitalCue - FREE Deployment Guide 🚀

Deploy CapitalCue to production for **$0/month** using Vercel + Railway free tiers.

## 📋 Prerequisites

Before starting, ensure you have:
- [ ] Git installed
- [ ] Node.js 18+ installed
- [ ] GitHub account
- [ ] Vercel account (free)
- [ ] Railway account (free)

## 🚀 Step-by-Step Deployment

### Step 1: Push Code to GitHub

```bash
# Initialize git repository (if not already done)
git init
git add .
git commit -m "Initial CapitalCue platform commit"

# Create GitHub repository and push
# Go to github.com, create new repository named "capitalcue"
git remote add origin https://github.com/YOUR_USERNAME/capitalcue.git
git branch -M main
git push -u origin main
```

### Step 2: Deploy Backend API to Railway (FREE)

1. **Sign up for Railway**
   - Visit [railway.app](https://railway.app)
   - Sign up with GitHub account

2. **Create New Project**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your `capitalcue` repository
   - Select "apps/api" as the root directory

3. **Configure Railway Deployment**
   - Railway will auto-detect Node.js
   - Set these environment variables in Railway dashboard:

```bash
NODE_ENV=production
PORT=3001
JWT_SECRET=your-super-secret-jwt-key-256-bits-long
CORS_ORIGIN=https://your-app.vercel.app
DATABASE_URL=${{Postgres.DATABASE_URL}}
ANTHROPIC_API_KEY=your-anthropic-api-key-here
```

4. **Add PostgreSQL Database**
   - In Railway dashboard, click "New" → "Database" → "PostgreSQL"
   - Railway automatically connects it to your app
   - DATABASE_URL is automatically provided

5. **Deploy**
   - Railway will automatically build and deploy
   - Get your API URL (e.g., `https://capitalcue-api-production.up.railway.app`)

### Step 3: Deploy Frontend to Vercel (FREE)

1. **Sign up for Vercel**
   - Visit [vercel.com](https://vercel.com)
   - Sign up with GitHub account

2. **Import Project**
   - Click "New Project"
   - Import your GitHub repository
   - Select "apps/web" as the root directory

3. **Configure Build Settings**
   - Framework: Next.js
   - Root Directory: `apps/web`
   - Build Command: `npm run build`
   - Output Directory: `.next`

4. **Set Environment Variables**
   - In Vercel dashboard, go to Settings → Environment Variables:

```bash
NEXT_PUBLIC_API_URL=https://your-railway-api-url.up.railway.app
NEXT_PUBLIC_APP_NAME=CapitalCue
NEXT_PUBLIC_APP_VERSION=1.0.0
NODE_ENV=production
```

5. **Deploy**
   - Click "Deploy"
   - Get your frontend URL (e.g., `https://capitalcue.vercel.app`)

### Step 4: Update CORS Settings

1. **Update Railway Environment**
   - Go back to Railway dashboard
   - Update `CORS_ORIGIN` with your Vercel URL:
   ```bash
   CORS_ORIGIN=https://capitalcue.vercel.app
   ```

2. **Redeploy Railway**
   - Railway will automatically redeploy with new settings

### Step 5: Test Your Deployment

1. **Visit your live site**: `https://capitalcue.vercel.app`
2. **Test key pages**:
   - ✅ Homepage
   - ✅ Pricing page (`/pricing`)
   - ✅ Signup page (`/signup`)
   - ✅ Contact page (`/contact`)

3. **Test API endpoints**:
   ```bash
   curl https://your-railway-api-url.up.railway.app/health
   ```

## 💰 Free Tier Limits

### Vercel FREE (Frontend)
- ✅ **Bandwidth**: 100GB/month
- ✅ **Builds**: Unlimited
- ✅ **Domains**: Custom domains included
- ✅ **SSL**: Automatic HTTPS
- 🔄 **Upgrade when**: Bandwidth exceeded

### Railway FREE (Backend + Database)
- ✅ **Usage**: $5 credit/month
- ✅ **Database**: PostgreSQL included
- ✅ **RAM**: Up to 8GB
- ✅ **Build time**: 500 hours/month
- 🔄 **Upgrade when**: Credit runs out (~month 2-3)

## 🌐 Custom Domain Setup (Optional - $10/year)

### Option 1: Use Free Subdomains
- Vercel: `capitalcue.vercel.app`
- Railway: `capitalcue-api.up.railway.app`

### Option 2: Custom Domain ($10/year)
1. **Buy domain**: `capitalcue.com` from Namecheap/GoDaddy
2. **Configure Vercel**:
   - Add domain in Vercel dashboard
   - Point DNS A record to Vercel
3. **Update CORS**:
   ```bash
   CORS_ORIGIN=https://capitalcue.com
   ```

## 📊 Expected Costs by Growth Stage

| Stage | Users | Monthly Cost | What to Upgrade |
|-------|-------|--------------|-----------------|
| **Month 1-2** | 0-50 | **$0** | Nothing - free tiers |
| **Month 3-4** | 50-200 | **$20** | Railway Pro ($20/month) |
| **Month 5-6** | 200-500 | **$50** | Vercel Pro ($20) + Railway Pro |
| **Month 6+** | 500+ | **$100-200** | Dedicated infrastructure |

## 🚨 Troubleshooting

### Build Fails
```bash
# Check Node.js version in Railway/Vercel
node --version  # Should be 18+

# Clear build cache
rm -rf node_modules .next
npm install
npm run build
```

### Database Connection Issues
```bash
# Check DATABASE_URL in Railway
echo $DATABASE_URL

# Test connection
npm run migrate
```

### CORS Errors
```bash
# Ensure CORS_ORIGIN matches your frontend URL exactly
# https://capitalcue.vercel.app (no trailing slash)
```

## ✅ Post-Deployment Checklist

After successful deployment:

- [ ] **Test all pages** load correctly
- [ ] **Test API endpoints** respond
- [ ] **Check database** connection works
- [ ] **Verify environment variables** are set
- [ ] **Test signup flow** (without payment)
- [ ] **Set up monitoring** (optional)
- [ ] **Configure custom domain** (optional)

## 🎯 Next Steps After Deployment

1. **Marketing Setup**
   - Google Analytics
   - Social media accounts
   - Content marketing

2. **User Acquisition**
   - Launch on Product Hunt
   - Reach out to beta users
   - LinkedIn/Twitter marketing

3. **Revenue Generation**
   - Set up Stripe for payments
   - Enable paid subscriptions
   - Track conversion metrics

## 📞 Need Help?

If you encounter issues:
1. Check Railway/Vercel logs
2. Review environment variables
3. Test locally first
4. Check GitHub repository settings

**Your CapitalCue platform will be live at $0 cost and ready to acquire your first customers!** 🎉

---

**Estimated deployment time: 30-45 minutes**