#!/bin/bash

# CapitalCue Production Deployment Script
set -e

echo "🚀 Starting CapitalCue Production Deployment"

# Check if required environment variables are set
if [ ! -f ".env.production" ]; then
    echo "❌ .env.production file not found!"
    echo "Please copy .env.production.example to .env.production and configure it"
    exit 1
fi

# Load environment variables
export $(cat .env.production | grep -v '^#' | xargs)

echo "📦 Building Docker images..."

# Stop existing containers
echo "🛑 Stopping existing containers..."
docker-compose -f docker-compose.prod.yml down 2>/dev/null || true

# Build and start services
echo "🔨 Building and starting services..."
docker-compose -f docker-compose.prod.yml up --build -d

# Wait for services to be healthy
echo "⏳ Waiting for services to start..."
sleep 30

# Check health of all services
echo "🔍 Checking service health..."
services=("document-parser" "constraint-engine" "alert-manager" "ai-analyzer")

for service in "${services[@]}"; do
    echo "Checking $service..."
    if docker-compose -f docker-compose.prod.yml ps $service | grep -q "Up (healthy)"; then
        echo "✅ $service is healthy"
    else
        echo "❌ $service is not healthy"
        docker-compose -f docker-compose.prod.yml logs $service
        exit 1
    fi
done

echo "🎉 Backend services deployed successfully!"

# Deploy frontend to Netlify
echo "🌐 Deploying frontend to Netlify..."
cd apps/frontend

# Install dependencies
npm ci

# Build for production
npm run build

# Deploy to Netlify (requires netlify-cli)
if command -v netlify &> /dev/null; then
    netlify deploy --prod --dir=dist
    echo "✅ Frontend deployed to Netlify"
else
    echo "⚠️  Netlify CLI not found. Please install it with: npm install -g netlify-cli"
    echo "📁 Built files are in apps/frontend/dist/"
fi

cd ../..

echo "🎊 CapitalCue deployment completed!"
echo ""
echo "🔗 Services:"
echo "   API: https://api.capitalcue.com"
echo "   Frontend: https://capitalcue.com"
echo ""
echo "📊 Monitor with:"
echo "   docker-compose -f docker-compose.prod.yml logs -f"