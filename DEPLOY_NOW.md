# 🚀 Deploy CapitalCue Now - Low Cost Option ($5-15/month)

## ✅ Everything is Ready!

Your CapitalCue platform is fully prepared for deployment. Here's how to deploy it for just $5-15/month:

## 🎯 **Quick Deploy (5 minutes)**

### Step 1: Deploy Backend to Railway

1. **Open Terminal and run:**
```bash
# Login to Railway (opens browser)
railway login

# Initialize project
railway init
# Choose: "Create new project"
# Name: "capitalcue-backend"

# Set environment variables
railway variables set NODE_ENV=production
railway variables set PORT=8080

# Get Claude API key from https://console.anthropic.com/
railway variables set CLAUDE_API_KEY=your_claude_api_key_here

# Generate secure JWT secret
railway variables set JWT_SECRET=$(openssl rand -base64 32)

# Add PostgreSQL database
railway add postgresql

# Deploy!
railway up
```

2. **Get your backend URL:**
```bash
railway status
```
Copy the "Railway URL" (e.g., `https://capitalcue-backend-production-xxxx.up.railway.app`)

### Step 2: Deploy Frontend to Netlify

1. **Update frontend configuration:**
```bash
cd apps/frontend

# Replace YOUR_RAILWAY_URL with the actual URL from step 1
cat > .env.production << EOF
VITE_DOCUMENT_API=YOUR_RAILWAY_URL/documents
VITE_CONSTRAINT_API=YOUR_RAILWAY_URL/constraints
VITE_ALERTS_API=YOUR_RAILWAY_URL/alerts
VITE_AI_API=YOUR_RAILWAY_URL/ai
EOF

# Build frontend
npm ci
npm run build
```

2. **Deploy to Netlify:**
```bash
# Login to Netlify
netlify login

# Deploy
netlify deploy --prod --dir=dist
```

## 🎉 **That's It!**

Your CapitalCue platform is now live!

- **Backend**: Railway URL (handles all API requests)
- **Frontend**: Netlify URL (your main application)
- **Database**: PostgreSQL (included with Railway)
- **Cost**: ~$5-15/month total

## 🔧 **Management Commands**

```bash
# View backend logs
railway logs

# Redeploy backend
railway up

# Redeploy frontend
cd apps/frontend && npm run build && netlify deploy --prod --dir=dist

# Check status
railway status
netlify status
```

## 💰 **Cost Breakdown**

| Service | Cost | What You Get |
|---------|------|-------------|
| Railway | $5-10/month | Backend + Database |
| Netlify | Free | Frontend + CDN |
| **Total** | **$5-10/month** | Complete platform |

## 🆘 **Need Help?**

1. **Backend issues**: Check `railway logs`
2. **Frontend issues**: Check `netlify logs`
3. **Database issues**: Use `railway connect postgresql`

## ✨ **Optional Enhancements**

After deployment, you can:
- Add custom domain ($12/year)
- Set up monitoring
- Configure alerts
- Scale resources as needed

---

**🎯 Your platform will be production-ready in just 5 minutes!**