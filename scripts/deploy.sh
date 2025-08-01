#!/bin/bash
set -e

# Financial Analyzer Deployment Script
echo "🚀 Financial Analyzer Deployment Script"
echo "========================================"

# Configuration
ENVIRONMENT=${1:-production}
COMPOSE_FILE="docker-compose.${ENVIRONMENT}.yml"

# Check if environment file exists
if [ ! -f ".env" ]; then
    echo "⚠️  .env file not found. Creating from template..."
    if [ -f ".env.${ENVIRONMENT}" ]; then
        cp ".env.${ENVIRONMENT}" .env
        echo "✅ Created .env from .env.${ENVIRONMENT}"
        echo "⚠️  Please update the values in .env before proceeding"
        exit 1
    else
        echo "❌ No environment template found for ${ENVIRONMENT}"
        exit 1
    fi
fi

# Check if Docker Compose file exists
if [ ! -f "$COMPOSE_FILE" ]; then
    echo "❌ Docker Compose file not found: $COMPOSE_FILE"
    exit 1
fi

echo "🏗️  Building services for ${ENVIRONMENT}..."

# Load environment variables
source .env

# Pre-deployment checks
echo "🔍 Running pre-deployment checks..."

# Check required environment variables
required_vars=("DATABASE_PASSWORD" "JWT_SECRET" "REDIS_PASSWORD")
for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        echo "❌ Required environment variable $var is not set"
        exit 1
    fi
done

# Build and start services
echo "🐳 Building Docker images..."
docker-compose -f "$COMPOSE_FILE" build --no-cache

echo "🚀 Starting services..."
docker-compose -f "$COMPOSE_FILE" up -d

# Wait for services to be healthy
echo "⏳ Waiting for services to be ready..."
sleep 30

# Health checks
echo "🏥 Running health checks..."
services=("postgres" "redis" "api" "web" "document-parser" "constraint-engine" "alert-manager" "ai-analyzer")

for service in "${services[@]}"; do
    echo -n "Checking $service... "
    if docker-compose -f "$COMPOSE_FILE" ps "$service" | grep -q "healthy\|Up"; then
        echo "✅ healthy"
    else
        echo "❌ unhealthy"
        echo "Service logs for $service:"
        docker-compose -f "$COMPOSE_FILE" logs --tail=20 "$service"
    fi
done

# Show running services
echo ""
echo "📊 Running services:"
docker-compose -f "$COMPOSE_FILE" ps

echo ""
echo "🎉 Deployment complete!"
echo ""
echo "📋 Access Information:"
echo "  Web Application: http://localhost:${WEB_PORT:-3000}"
echo "  API Server: http://localhost:${API_PORT:-3001}"
echo "  API Health: http://localhost:${API_PORT:-3001}/api/health"
echo ""
echo "📝 Useful commands:"
echo "  View logs: docker-compose -f $COMPOSE_FILE logs -f [service]"
echo "  Stop services: docker-compose -f $COMPOSE_FILE down"
echo "  Restart service: docker-compose -f $COMPOSE_FILE restart [service]"
echo "  Update services: ./scripts/deploy.sh $ENVIRONMENT"