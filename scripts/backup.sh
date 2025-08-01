#!/bin/bash
set -e

# Financial Analyzer Backup Script
echo "💾 Financial Analyzer Backup Script"
echo "==================================="

# Configuration
BACKUP_DIR="./backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
ENVIRONMENT=${1:-production}
COMPOSE_FILE="docker-compose.${ENVIRONMENT}.yml"

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Load environment variables
if [ -f ".env" ]; then
    source .env
else
    echo "❌ .env file not found"
    exit 1
fi

echo "📦 Creating backup for ${ENVIRONMENT} environment..."

# Database backup
echo "🗄️  Backing up PostgreSQL database..."
docker-compose -f "$COMPOSE_FILE" exec -T postgres pg_dump \
    -U "${DATABASE_USER:-postgres}" \
    -d "${DATABASE_NAME:-financial_analyzer}" \
    --clean --if-exists > "${BACKUP_DIR}/database_${TIMESTAMP}.sql"

if [ $? -eq 0 ]; then
    echo "✅ Database backup created: ${BACKUP_DIR}/database_${TIMESTAMP}.sql"
else
    echo "❌ Database backup failed"
    exit 1
fi

# File uploads backup
echo "📁 Backing up uploaded files..."
if docker-compose -f "$COMPOSE_FILE" ps api | grep -q "Up"; then
    docker run --rm \
        -v "$(docker-compose -f "$COMPOSE_FILE" ps -q api)":/source:ro \
        -v "$(pwd)/${BACKUP_DIR}":/backup \
        alpine:latest \
        tar czf "/backup/uploads_${TIMESTAMP}.tar.gz" -C /source uploads
    
    if [ $? -eq 0 ]; then
        echo "✅ Uploads backup created: ${BACKUP_DIR}/uploads_${TIMESTAMP}.tar.gz"
    else
        echo "⚠️  Uploads backup failed or no uploads directory found"
    fi
else
    echo "⚠️  API service not running, skipping uploads backup"
fi

# Configuration backup
echo "⚙️  Backing up configuration files..."
tar czf "${BACKUP_DIR}/config_${TIMESTAMP}.tar.gz" \
    .env \
    "$COMPOSE_FILE" \
    docker/nginx/nginx.conf \
    apps/api/prisma/schema.prisma

if [ $? -eq 0 ]; then
    echo "✅ Configuration backup created: ${BACKUP_DIR}/config_${TIMESTAMP}.tar.gz"
else
    echo "❌ Configuration backup failed"
fi

# Cleanup old backups (keep last 7 days)
echo "🧹 Cleaning up old backups..."
find "$BACKUP_DIR" -name "*.sql" -mtime +7 -delete
find "$BACKUP_DIR" -name "*.tar.gz" -mtime +7 -delete

echo ""
echo "🎉 Backup completed successfully!"
echo ""
echo "📋 Backup files created:"
ls -la "${BACKUP_DIR}/"*"${TIMESTAMP}"*

echo ""
echo "📝 To restore from backup:"
echo "  Database: docker-compose -f $COMPOSE_FILE exec -T postgres psql -U \$DATABASE_USER -d \$DATABASE_NAME < ${BACKUP_DIR}/database_${TIMESTAMP}.sql"
echo "  Uploads: tar xzf ${BACKUP_DIR}/uploads_${TIMESTAMP}.tar.gz"