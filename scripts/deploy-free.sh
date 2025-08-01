#!/bin/bash

# CapitalCue Free Deployment Script
# This script helps you deploy CapitalCue to free hosting tiers

set -e

echo "🚀 CapitalCue Free Deployment Setup"
echo "===================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check prerequisites
echo -e "${BLUE}Checking prerequisites...${NC}"

# Check if git is installed
if ! command -v git &> /dev/null; then
    echo -e "${RED}❌ Git is not installed. Please install Git first.${NC}"
    exit 1
fi

# Check if node is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed. Please install Node.js 18+ first.${NC}"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo -e "${RED}❌ Node.js version must be 18 or higher. Current: $(node -v)${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Prerequisites check passed${NC}"

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -d "apps" ]; then
    echo -e "${RED}❌ Please run this script from the CapitalCue project root directory${NC}"
    exit 1
fi

echo ""
echo -e "${BLUE}Step 1: Preparing code for deployment...${NC}"

# Install dependencies
echo "Installing dependencies..."
npm install

# Build the applications
echo "Building applications..."
npm run build

echo -e "${GREEN}✅ Code preparation complete${NC}"

echo ""
echo -e "${BLUE}Step 2: Git repository setup...${NC}"

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "Initializing Git repository..."
    git init
    git add .
    git commit -m "Initial CapitalCue platform commit

🚀 Features:
- Complete financial analysis platform
- AI-powered constraint evaluation
- Multi-tier pricing ($49-$999/month)
- Enterprise-grade security
- Production-ready infrastructure
- Full documentation and testing

Ready for deployment to free hosting tiers!"
    echo -e "${GREEN}✅ Git repository initialized${NC}"
else
    echo "Git repository already exists"
    
    # Check if there are uncommitted changes
    if [ -n "$(git status --porcelain)" ]; then
        echo "Committing latest changes..."
        git add .
        git commit -m "Pre-deployment updates for CapitalCue

- Updated branding to CapitalCue
- Added deployment configurations
- Prepared for free hosting deployment"
    fi
    echo -e "${GREEN}✅ Git repository up to date${NC}"
fi

echo ""
echo -e "${YELLOW}📋 Next Steps (Manual):${NC}"
echo ""
echo "1. 🐙 Create GitHub Repository:"
echo "   • Go to https://github.com/new"
echo "   • Repository name: capitalcue"
echo "   • Keep it public (free hosting requirement)"
echo "   • Don't initialize with README (we have one)"
echo ""

echo "2. 📤 Push to GitHub:"
echo "   • git remote add origin https://github.com/YOUR_USERNAME/capitalcue.git"
echo "   • git branch -M main"
echo "   • git push -u origin main"
echo ""

echo "3. 🚂 Deploy Backend (Railway):"
echo "   • Visit https://railway.app"
echo "   • Sign up/in with GitHub"
echo "   • New Project → Deploy from GitHub"
echo "   • Select: capitalcue repository"
echo "   • Root directory: apps/api"
echo "   • Add PostgreSQL database"
echo ""

echo "4. ⚡ Deploy Frontend (Vercel):"
echo "   • Visit https://vercel.com"
echo "   • Sign up/in with GitHub"
echo "   • New Project → Import Git Repository"
echo "   • Select: capitalcue repository"
echo "   • Root directory: apps/web"
echo ""

echo "5. 🔧 Environment Variables:"
echo ""
echo "   Railway (Backend):"
echo "   NODE_ENV=production"
echo "   JWT_SECRET=your-super-secret-jwt-key-256-bits"
echo "   CORS_ORIGIN=https://capitalcue.vercel.app"
echo "   DATABASE_URL=\${{Postgres.DATABASE_URL}}"
echo "   ANTHROPIC_API_KEY=your-anthropic-key"
echo ""
echo "   Vercel (Frontend):"
echo "   NEXT_PUBLIC_API_URL=https://capitalcue-api.up.railway.app"
echo "   NEXT_PUBLIC_APP_NAME=CapitalCue"
echo ""

echo "6. 🧪 Test Deployment:"
echo "   • Frontend: https://capitalcue.vercel.app"
echo "   • API Health: https://capitalcue-api.up.railway.app/health"
echo ""

echo -e "${GREEN}🎉 Deployment preparation complete!${NC}"
echo ""
echo -e "${BLUE}💰 Expected Costs:${NC}"
echo "• Month 1-2: \$0 (free tiers)"
echo "• Month 3+: \$20-50 (when you outgrow free tiers)"
echo ""
echo -e "${BLUE}📈 Revenue Potential:${NC}"
echo "• 10 users × \$49/month = \$490/month"
echo "• 50 users × \$199/month = \$9,950/month"
echo ""
echo -e "${YELLOW}For detailed instructions, see: DEPLOYMENT_GUIDE.md${NC}"
echo ""
echo -e "${GREEN}Your CapitalCue platform is ready for the world! 🌍${NC}"