#!/bin/bash
set -e

# Financial Analyzer Health Check Script
echo "🏥 Financial Analyzer Health Check"
echo "=================================="

# Configuration
ENVIRONMENT=${1:-production}
COMPOSE_FILE="docker-compose.${ENVIRONMENT}.yml"

# Load environment variables
if [ -f ".env" ]; then
    source .env
else
    echo "❌ .env file not found"
    exit 1
fi

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Health check function
check_service() {
    local service=$1
    local url=$2
    local expected_status=${3:-200}
    
    echo -n "Checking $service... "
    
    if curl -f -s -o /dev/null -w "%{http_code}" "$url" | grep -q "$expected_status"; then
        echo -e "${GREEN}✅ healthy${NC}"
        return 0
    else
        echo -e "${RED}❌ unhealthy${NC}"
        return 1
    fi
}

# Check Docker services
echo "🐳 Docker Services Status:"
docker-compose -f "$COMPOSE_FILE" ps

echo ""
echo "🌐 Service Health Checks:"

# API Health Check
check_service "API Server" "http://localhost:${API_PORT:-3001}/api/health"

# Web Application Health Check
check_service "Web Application" "http://localhost:${WEB_PORT:-3000}"

# MCP Services Health Checks
check_service "Document Parser" "http://localhost:${DOCUMENT_PARSER_PORT:-8001}/health"
check_service "Constraint Engine" "http://localhost:${CONSTRAINT_ENGINE_PORT:-8002}/health"
check_service "Alert Manager" "http://localhost:${ALERT_MANAGER_PORT:-8003}/health"
check_service "AI Analyzer" "http://localhost:${AI_ANALYZER_PORT:-8004}/health"

# Database connectivity check
echo -n "Checking Database connectivity... "
if docker-compose -f "$COMPOSE_FILE" exec -T postgres pg_isready -U "${DATABASE_USER:-postgres}" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ connected${NC}"
else
    echo -e "${RED}❌ connection failed${NC}"
fi

# Redis connectivity check
echo -n "Checking Redis connectivity... "
if docker-compose -f "$COMPOSE_FILE" exec -T redis redis-cli ping > /dev/null 2>&1; then
    echo -e "${GREEN}✅ connected${NC}"
else
    echo -e "${RED}❌ connection failed${NC}"
fi

echo ""
echo "📊 Resource Usage:"

# Docker stats
echo "Docker container resources:"
docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}" \
    $(docker-compose -f "$COMPOSE_FILE" ps -q)

echo ""
echo "💾 Storage Usage:"
echo "Docker volumes:"
docker system df

echo ""
echo "📋 System Information:"
echo "Uptime: $(uptime)"
echo "Disk usage: $(df -h / | tail -1)"
echo "Memory usage: $(free -h | grep Mem:)"

# Check for any failed containers
echo ""
echo "🔍 Failed Containers:"
failed_containers=$(docker-compose -f "$COMPOSE_FILE" ps --filter "status=exited")
if [ -n "$failed_containers" ]; then
    echo -e "${RED}Found failed containers:${NC}"
    echo "$failed_containers"
    echo ""
    echo "Recent logs from failed containers:"
    docker-compose -f "$COMPOSE_FILE" ps -q --filter "status=exited" | while read container_id; do
        if [ -n "$container_id" ]; then
            container_name=$(docker inspect --format='{{.Name}}' "$container_id" | sed 's/\///')
            echo -e "${YELLOW}Logs for $container_name:${NC}"
            docker logs --tail=10 "$container_id"
            echo ""
        fi
    done
else
    echo -e "${GREEN}No failed containers found${NC}"
fi

echo ""
echo "🎉 Health check completed!"