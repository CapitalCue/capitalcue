# CapitalCue Production Deployment Guide

This guide covers deploying CapitalCue to production using Docker, AWS, and Netlify.

## 🏗️ Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────────┐
│   Frontend      │    │   Load Balancer  │    │   MCP Services      │
│   (Netlify)     │◄──►│   (Nginx/ALB)    │◄──►│   (ECS/Docker)      │
│                 │    │                  │    │                     │
│ - React/Vite    │    │ - SSL/TLS        │    │ - Document Parser   │
│ - Tailwind      │    │ - Rate Limiting  │    │ - Constraint Engine │
│ - TypeScript    │    │ - CORS           │    │ - Alert Manager     │
└─────────────────┘    └──────────────────┘    │ - AI Analyzer       │
                                               └─────────────────────┘
                                                         │
                                               ┌─────────────────────┐
                                               │   Database          │
                                               │   (RDS PostgreSQL)  │
                                               │                     │
                                               │ - User Data         │
                                               │ - Documents         │
                                               │ - Constraints       │
                                               │ - Analysis Results  │
                                               └─────────────────────┘
```

## 🚀 Quick Start

### Docker Compose (Recommended for Development)

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd financial-analyzer
   ```

2. **Set up environment**
   ```bash
   cp .env.production .env
   # Edit .env with your configuration
   ```

3. **Deploy with Docker Compose**
   ```bash
   ./scripts/deploy.sh production
   ```

### Kubernetes (Recommended for Production)

1. **Prerequisites**
   - Kubernetes cluster (v1.24+)
   - kubectl configured
   - Docker registry access

2. **Deploy to Kubernetes**
   ```bash
   ./scripts/k8s-deploy.sh deploy
   ```

## 🐳 Docker Deployment

### Development Environment

```bash
# Start development services
docker-compose -f docker-compose.dev.yml up -d

# View logs
docker-compose -f docker-compose.dev.yml logs -f
```

### Production Environment

```bash
# Deploy production stack
docker-compose -f docker-compose.production.yml up -d

# Check health
./scripts/health-check.sh production
```

## ☸️ Kubernetes Deployment

### Prerequisites

- Kubernetes cluster (GKE, EKS, AKS, or self-managed)
- kubectl configured with cluster access
- Docker registry (optional: GitHub Container Registry)

### Configuration

1. **Update secrets in `k8s/configmap.yaml`**
   ```bash
   # Base64 encode your secrets
   echo -n "your-secret" | base64
   ```

2. **Configure image registry**
   ```bash
   export DOCKER_REGISTRY=ghcr.io/your-org
   export IMAGE_TAG=latest
   ```

### Deployment Commands

```bash
# Full deployment
./scripts/k8s-deploy.sh deploy

# Build images only
./scripts/k8s-deploy.sh build

# Check status
./scripts/k8s-deploy.sh status

# View logs
./scripts/k8s-deploy.sh logs api

# Cleanup
./scripts/k8s-deploy.sh cleanup
```

### Scaling

```bash
# Scale API service
kubectl scale deployment api --replicas=5 -n financial-analyzer

# Scale web service
kubectl scale deployment web --replicas=3 -n financial-analyzer

# Auto-scaling is configured via HPA
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | Required |
| `REDIS_URL` | Redis connection string | Required |
| `JWT_SECRET` | JWT signing secret | Required |
| `ANTHROPIC_API_KEY` | Claude AI API key | Required |
| `NODE_ENV` | Environment mode | `production` |
| `LOG_LEVEL` | Logging level | `info` |
| `MAX_FILE_SIZE` | Max upload size | `52428800` |

### Database Migration

```bash
# Docker Compose
docker-compose exec api npx prisma migrate deploy

# Kubernetes
kubectl exec -n financial-analyzer deployment/api -- npx prisma migrate deploy
```

### SSL/TLS Configuration

#### Docker Compose
1. Place certificates in `docker/nginx/ssl/`
2. Uncomment HTTPS server block in `docker/nginx/nginx.conf`
3. Update environment variables:
   ```bash
   SSL_CERT_PATH=./docker/nginx/ssl/cert.pem
   SSL_KEY_PATH=./docker/nginx/ssl/key.pem
   ```

#### Kubernetes
1. Create TLS secret:
   ```bash
   kubectl create secret tls financial-analyzer-tls \
     --cert=path/to/cert.pem \
     --key=path/to/key.pem \
     -n financial-analyzer
   ```
2. Uncomment TLS section in `k8s/ingress.yaml`

## 📊 Monitoring & Observability

### Health Checks

```bash
# Check all services
./scripts/health-check.sh production

# Individual service health
curl http://localhost:3001/api/health
curl http://localhost:3000/
```

### Logging

```bash
# Docker Compose
docker-compose logs -f [service]

# Kubernetes
kubectl logs -f deployment/api -n financial-analyzer
```

### Metrics

Services expose metrics on `/metrics` endpoint:
- API: `http://localhost:3001/metrics`
- MCP Services: `http://localhost:800x/metrics`

## 🔒 Security

### Network Security
- All services communicate over internal networks
- External access only through load balancer
- Rate limiting configured on API endpoints
- CORS configured for frontend

### Data Security
- Database credentials stored as secrets
- JWT tokens for authentication
- File uploads validated and sandboxed
- Regular security scans via GitHub Actions

### Production Hardening

1. **Change default passwords**
   ```bash
   # Generate secure passwords
   openssl rand -base64 32
   ```

2. **Enable firewall rules**
   - Only allow necessary ports (80, 443)
   - Restrict database access to application subnets

3. **Configure monitoring**
   - Set up log aggregation
   - Configure alerting for critical errors
   - Monitor resource usage

## 🔄 CI/CD

### GitHub Actions

The platform includes comprehensive CI/CD pipelines:

- **Continuous Integration** (`.github/workflows/ci.yml`)
  - Tests, linting, security scans
  - Docker image builds
  - Code quality analysis

- **Continuous Deployment** (`.github/workflows/cd.yml`)
  - Automated deployments to staging/production
  - Rolling updates with rollback capability
  - Health checks and smoke tests

- **Security Scanning** (`.github/workflows/security.yml`)
  - Daily vulnerability scans
  - Container image security
  - Secret detection

### Required Secrets

Configure these secrets in your GitHub repository:

```bash
# Kubernetes access
KUBECONFIG_STAGING
KUBECONFIG_PRODUCTION

# Container registry
GITHUB_TOKEN  # Automatically provided

# Security scanning
SNYK_TOKEN
SONAR_TOKEN
LHCI_GITHUB_APP_TOKEN
```

## 📋 Backup & Recovery

### Database Backup

```bash
# Create backup
./scripts/backup.sh production

# Restore from backup
docker-compose exec postgres psql -U postgres -d financial_analyzer < backup.sql
```

### File Backup

```bash
# Backup uploaded files
docker-compose exec api tar czf /backup/uploads.tar.gz /app/uploads
```

### Disaster Recovery

1. **Database Recovery**
   - Restore from latest backup
   - Run database migrations
   - Verify data integrity

2. **Service Recovery**
   - Redeploy using same configuration
   - Restore file uploads
   - Test all endpoints

## 🔧 Troubleshooting

### Common Issues

1. **Database Connection Failed**
   ```bash
   # Check database status
   docker-compose ps postgres
   kubectl get pods -l app=postgres -n financial-analyzer
   
   # Check connection
   docker-compose exec postgres pg_isready
   ```

2. **API Service Not Starting**
   ```bash
   # Check logs
   docker-compose logs api
   kubectl logs deployment/api -n financial-analyzer
   
   # Check environment variables
   docker-compose exec api env | grep DATABASE_URL
   ```

3. **High Memory Usage**
   ```bash
   # Check resource usage
   docker stats
   kubectl top pods -n financial-analyzer
   
   # Scale down if needed
   kubectl scale deployment api --replicas=2 -n financial-analyzer
   ```

### Performance Tuning

1. **Database Optimization**
   - Configure connection pooling
   - Add database indexes
   - Monitor slow queries

2. **API Performance**
   - Enable Redis caching
   - Optimize expensive operations
   - Configure proper resource limits

3. **Frontend Optimization**
   - Enable CDN for static assets
   - Configure browser caching
   - Optimize bundle size

## 📞 Support

For deployment issues:
1. Check the troubleshooting section above
2. Review service logs for errors
3. Consult the health check endpoints
4. Open an issue with detailed logs and configuration

---

## 🎯 Quick Reference

### Essential Commands

```bash
# Deploy production
./scripts/deploy.sh production

# Deploy to Kubernetes
./scripts/k8s-deploy.sh deploy

# Health check
./scripts/health-check.sh production

# Create backup
./scripts/backup.sh production

# View logs
docker-compose logs -f api
kubectl logs -f deployment/api -n financial-analyzer
```

### Service URLs

- **Web Application**: http://localhost:3000
- **API Server**: http://localhost:3001
- **API Health**: http://localhost:3001/api/health
- **Document Parser**: http://localhost:8001
- **Constraint Engine**: http://localhost:8002
- **Alert Manager**: http://localhost:8003
- **AI Analyzer**: http://localhost:8004