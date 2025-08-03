#!/bin/bash

# CapitalCue Production Setup Script
# This script helps you configure CapitalCue for production deployment

set -e

echo "🚀 CapitalCue Production Setup"
echo "=============================="

# Check prerequisites
echo "📋 Checking prerequisites..."

# Check Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check Docker Compose
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

echo "✅ Docker and Docker Compose are installed"

# Create environment file
if [ ! -f ".env" ]; then
    echo "📝 Creating environment configuration..."
    cp .env.production .env
    
    echo ""
    echo "⚠️  IMPORTANT: Please update the following in your .env file:"
    echo "   - POSTGRES_PASSWORD (use a secure password)"
    echo "   - CLAUDE_API_KEY (get from Anthropic)"
    echo "   - JWT_SECRET (generate a secure secret)"
    echo ""
    echo "Generate secure passwords with:"
    echo "   openssl rand -base64 32"
    echo ""
    
    read -p "Press Enter after updating .env file..."
else
    echo "✅ Environment file already exists"
fi

# Setup SSL directory (optional)
echo "🔐 Setting up SSL directory..."
mkdir -p ssl
if [ ! -f "ssl/cert.pem" ] || [ ! -f "ssl/key.pem" ]; then
    echo "⚠️  SSL certificates not found. You can:"
    echo "   1. Add your own certificates to ssl/cert.pem and ssl/key.pem"
    echo "   2. Generate self-signed certificates for testing:"
    echo "      openssl req -x509 -newkey rsa:4096 -keyout ssl/key.pem -out ssl/cert.pem -days 365 -nodes"
    echo "   3. Use Let's Encrypt for production"
fi

# Create uploads directory
echo "📁 Creating upload directories..."
mkdir -p uploads
chmod 755 uploads

# Build and start services
echo "🔨 Building and starting services..."
echo "This may take several minutes on first run..."

# Stop any running services
docker-compose -f docker-compose.prod.yml down 2>/dev/null || true

# Build and start
docker-compose -f docker-compose.prod.yml up --build -d

# Wait for services
echo "⏳ Waiting for services to start..."
sleep 45

# Health check
echo "🔍 Performing health checks..."
services=("document-parser:8001" "constraint-engine:8002" "alert-manager:8003" "ai-analyzer:8004")
all_healthy=true

for service_port in "${services[@]}"; do
    service=$(echo $service_port | cut -d: -f1)
    port=$(echo $service_port | cut -d: -f2)
    
    echo "Checking $service on port $port..."
    
    # Try health check
    if curl -f -s "http://localhost:$port/health" > /dev/null; then
        echo "✅ $service is healthy"
    else
        echo "❌ $service is not responding"
        all_healthy=false
    fi
done

# Database check
echo "Checking database..."
if docker-compose -f docker-compose.prod.yml exec -T postgres pg_isready -U capitalcue > /dev/null 2>&1; then
    echo "✅ Database is ready"
else
    echo "❌ Database is not ready"
    all_healthy=false
fi

# Results
echo ""
echo "🎉 Setup Complete!"
echo "=================="

if [ "$all_healthy" = true ]; then
    echo "✅ All services are healthy and running"
    echo ""
    echo "🔗 Your CapitalCue backend is available at:"
    echo "   Document Parser: http://localhost:8001"
    echo "   Constraint Engine: http://localhost:8002"
    echo "   Alert Manager: http://localhost:8003"
    echo "   AI Analyzer: http://localhost:8004"
    echo "   Nginx (Load Balancer): http://localhost"
    echo ""
    echo "📚 API Documentation:"
    echo "   Document Parser Swagger: http://localhost:8001/docs"
    echo ""
    echo "🖥️  To deploy the frontend:"
    echo "   cd apps/frontend"
    echo "   npm install"
    echo "   npm run build"
    echo "   # Deploy dist/ folder to Netlify or your hosting provider"
    echo ""
    echo "📊 Monitor services with:"
    echo "   docker-compose -f docker-compose.prod.yml logs -f"
    echo ""
    echo "🛑 Stop services with:"
    echo "   docker-compose -f docker-compose.prod.yml down"
else
    echo "⚠️  Some services are not healthy. Check the logs:"
    echo "   docker-compose -f docker-compose.prod.yml logs"
    echo ""
    echo "Common issues:"
    echo "   - Make sure ports 8001-8004 are not in use"
    echo "   - Check that CLAUDE_API_KEY is valid in .env"
    echo "   - Ensure Docker has enough resources allocated"
fi

echo ""
echo "📖 For detailed deployment instructions, see DEPLOYMENT.md"