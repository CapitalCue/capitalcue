# 🚀 Railway Deployment Guide for CapitalCue

## Step-by-Step Deployment

### 1. Login to Railway
```bash
railway login
```
This opens your browser for authentication.

### 2. Initialize Project
```bash
railway init
# Choose "Create new project"
# Name it "capitalcue-backend"
```

### 3. Set Environment Variables
```bash
railway variables set NODE_ENV=production
railway variables set PORT=8080

# Required: Get your Claude API key from https://console.anthropic.com/
railway variables set CLAUDE_API_KEY=your_claude_api_key_here

# Generate a secure JWT secret:
railway variables set JWT_SECRET=$(openssl rand -base64 32)
```

### 4. Add Database
```bash
railway add postgresql
```
This automatically creates a PostgreSQL database and sets DATABASE_URL.

### 5. Deploy Backend
```bash
railway up
```

### 6. Get Your Backend URL
```bash
railway status
```
Copy the "Railway URL" - this is your backend API endpoint.

### 7. Deploy Frontend to Netlify

First, update the frontend environment variables:
```bash
cd apps/frontend

# Create production environment file
cat > .env.production << EOF
VITE_DOCUMENT_API=YOUR_RAILWAY_URL/documents
VITE_CONSTRAINT_API=YOUR_RAILWAY_URL/constraints
VITE_ALERTS_API=YOUR_RAILWAY_URL/alerts
VITE_AI_API=YOUR_RAILWAY_URL/ai
EOF

# Build and deploy
npm ci
npm run build
netlify login
netlify deploy --prod --dir=dist
```

## 🎯 Expected Results

### Backend (Railway)
- **URL**: `https://capitalcue-backend-production-xxxx.up.railway.app`
- **Cost**: ~$5-10/month
- **Services**: Document Parser, Constraint Engine, Alert Manager, AI Analyzer
- **Database**: PostgreSQL included

### Frontend (Netlify)
- **URL**: `https://amazing-site-name-123456.netlify.app`
- **Cost**: Free (up to 100GB bandwidth)
- **Features**: Global CDN, Auto SSL, Deploy previews

## 🔧 Management Commands

```bash
# View logs
railway logs

# Update environment variables
railway variables

# Redeploy
railway up

# Check status
railway status

# Open dashboard
railway open
```

## 💰 Cost Breakdown

| Service | Monthly Cost | What's Included |
|---------|-------------|-----------------|
| Railway | $5-10 | All 4 MCP services + PostgreSQL |
| Netlify | Free | Frontend hosting + CDN |
| **Total** | **$5-10** | Complete platform |

## 🆘 Troubleshooting

### Backend Issues
```bash
# Check logs
railway logs

# Restart service
railway up --detach

# Check variables
railway variables
```

### Frontend Issues
```bash
# Redeploy frontend
cd apps/frontend
npm run build
netlify deploy --prod --dir=dist

# Check build logs
netlify logs
```

### Database Issues
```bash
# Connect to database
railway connect postgresql

# Check database URL
railway variables | grep DATABASE_URL
```

## ✅ Success Indicators

Your deployment is successful when:

1. **Backend health check passes**: `https://your-railway-url.railway.app/health`
2. **Frontend loads**: Your Netlify URL shows the login page
3. **API connectivity**: Frontend can communicate with backend
4. **Database connected**: No database connection errors in logs

## 🎉 Next Steps

After successful deployment:

1. **Test the platform**: Upload documents, create constraints
2. **Custom domain**: Add your own domain (optional)
3. **Monitoring**: Set up alerts for service health
4. **Scaling**: Railway auto-scales based on traffic

---

**Need help?** Check the logs first, then refer to Railway and Netlify documentation.