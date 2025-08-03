#!/bin/bash

# CapitalCue Low-Cost Deployment Script
# Deploy to Railway (backend) + Netlify (frontend) for ~$5-15/month

set -e

echo "💰 CapitalCue Low-Cost Deployment"
echo "================================="
echo "Target cost: ~$5-15/month"
echo ""

# Check if railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "📦 Installing Railway CLI..."
    curl -fsSL https://railway.app/install.sh | sh
    echo "✅ Railway CLI installed"
else
    echo "✅ Railway CLI already installed"
fi

# Check if netlify CLI is installed
if ! command -v netlify &> /dev/null; then
    echo "📦 Installing Netlify CLI..."
    npm install -g netlify-cli
    echo "✅ Netlify CLI installed"
else
    echo "✅ Netlify CLI already installed"
fi

echo ""
echo "🔐 Setting up authentication..."

# Login to Railway
echo "Please login to Railway:"
railway login

# Login to Netlify  
echo "Please login to Netlify:"
netlify login

echo ""
echo "🚀 Deploying Backend to Railway..."

# Create Railway project
railway_project_exists=$(railway status 2>/dev/null | grep -c "Project:" || echo "0")

if [ "$railway_project_exists" -eq "0" ]; then
    echo "Creating new Railway project..."
    railway init
fi

# Set environment variables
echo "Setting environment variables..."
railway variables set NODE_ENV=production
railway variables set PORT=8080

# Prompt for required secrets
echo ""
echo "🔑 Please provide the following secrets:"
read -s -p "Claude API Key: " CLAUDE_API_KEY
echo ""
read -s -p "JWT Secret (or press Enter to generate): " JWT_SECRET
echo ""

if [ -z "$JWT_SECRET" ]; then
    JWT_SECRET=$(openssl rand -base64 32)
    echo "Generated JWT Secret: $JWT_SECRET"
fi

railway variables set CLAUDE_API_KEY="$CLAUDE_API_KEY"
railway variables set JWT_SECRET="$JWT_SECRET"

# Add database
echo "Adding PostgreSQL database..."
railway add postgresql

# Deploy backend
echo "Deploying backend to Railway..."
railway up

# Get the railway URL
backend_url=$(railway status | grep "Railway URL" | awk '{print $3}' || echo "")
if [ -z "$backend_url" ]; then
    backend_url="https://your-railway-app.railway.app"
fi

echo "✅ Backend deployed to: $backend_url"

echo ""
echo "🌐 Deploying Frontend to Netlify..."

# Build frontend with production API URLs
cd apps/frontend

# Update environment for production
cat > .env.production << EOF
VITE_DOCUMENT_API=${backend_url}/documents
VITE_CONSTRAINT_API=${backend_url}/constraints  
VITE_ALERTS_API=${backend_url}/alerts
VITE_AI_API=${backend_url}/ai
EOF

# Install dependencies
npm ci

# Build for production
npm run build

# Deploy to Netlify
netlify deploy --prod --dir=dist

# Get Netlify URL
frontend_url=$(netlify status | grep "Website URL" | awk '{print $3}' || echo "")
if [ -z "$frontend_url" ]; then
    frontend_url="https://your-netlify-app.netlify.app"
fi

cd ../..

echo ""
echo "🎉 Deployment Complete!"
echo "======================"
echo ""
echo "🔗 Your CapitalCue platform is live:"
echo "   Frontend: $frontend_url"
echo "   Backend API: $backend_url"
echo ""
echo "💰 Estimated Monthly Costs:"
echo "   Railway (Backend): ~$5-10/month"
echo "   Netlify (Frontend): Free"
echo "   PostgreSQL: Included with Railway"
echo "   Total: ~$5-10/month"
echo ""
echo "📊 Monitor your services:"
echo "   Railway Dashboard: https://railway.app/dashboard"
echo "   Netlify Dashboard: https://app.netlify.com/"
echo ""
echo "🔧 Manage your deployment:"
echo "   Backend logs: railway logs"
echo "   Redeploy: railway up"
echo "   Environment vars: railway variables"
echo ""
echo "✨ Next steps:"
echo "   1. Test your application at $frontend_url"
echo "   2. Configure custom domain (optional)"
echo "   3. Set up monitoring/alerts"
echo "   4. Add your Claude API key billing to track usage"

# Save deployment info
cat > deployment-info.txt << EOF
CapitalCue Deployment Information
================================

Frontend URL: $frontend_url
Backend URL: $backend_url
Deployment Date: $(date)

Railway Project: $(railway status | grep "Project:" | cut -d' ' -f2-)
Netlify Site: $(netlify status | grep "Site name" | cut -d' ' -f3-)

Monthly Cost Estimate: $5-10
- Railway: $5-10 (includes PostgreSQL)
- Netlify: Free
- Domain: $12/year (optional)

Management Commands:
- View backend logs: railway logs
- Redeploy backend: railway up  
- Update frontend: cd apps/frontend && npm run build && netlify deploy --prod --dir=dist
- View variables: railway variables
EOF

echo ""
echo "📄 Deployment info saved to deployment-info.txt"