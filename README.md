# CapitalCue

A comprehensive enterprise solution for financial analysis and constraint management, built for VCs, stock investors, and financial analysts. CapitalCue provides automated document processing, intelligent constraint evaluation, AI-powered insights, and real-time financial monitoring.

## 🚀 Features

### Core Functionality
- **Document Processing**: Upload and process financial documents (PDFs, Excel files, CSV)
- **Constraint Management**: Create, manage, and evaluate financial constraints
- **AI-Powered Analysis**: Claude AI integration for intelligent financial insights
- **Real-time Monitoring**: Live dashboard with financial metrics and alerts
- **Compliance Reporting**: GDPR-compliant data handling and audit trails

### Advanced Features
- **Multi-Factor Authentication**: Secure access with TOTP-based MFA
- **Role-Based Access Control**: Granular permissions for different user types
- **Advanced Encryption**: AES-256-GCM encryption for data at rest
- **Audit Logging**: Comprehensive audit trails with integrity verification
- **Auto-scaling Infrastructure**: Kubernetes-based deployment with horizontal scaling

## 🏗️ Architecture

The platform follows a microservices architecture with the following components:

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React Web     │    │   Express API   │    │   PostgreSQL    │
│   Frontend      │◄──►│   Backend       │◄──►│   Database      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │ MCP Microservices │
                       ├─────────────────┤
                       │ Document Parser │
                       │ Constraint Engine│
                       │ Alert Manager   │
                       │ AI Analyzer     │
                       └─────────────────┘
```

### Technology Stack
- **Frontend**: React 18, TypeScript, Tailwind CSS, Lucide React
- **Backend**: Node.js, Express.js, TypeScript, Prisma ORM
- **Database**: PostgreSQL with Redis for caching
- **Microservices**: MCP (Model Context Protocol) services
- **AI Integration**: Anthropic Claude API
- **Authentication**: JWT with MFA support
- **Infrastructure**: Docker, Kubernetes, Nginx
- **Security**: Advanced encryption, audit logging, RBAC

## 📋 Prerequisites

- Node.js 18+ and npm 9+
- PostgreSQL 13+
- Redis 6+
- Docker and Docker Compose
- Kubernetes cluster (for production)

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone https://github.com/your-org/financial-analyzer.git
cd financial-analyzer
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Setup
```bash
# Copy environment templates
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env

# Update environment variables with your configuration
```

### 4. Database Setup
```bash
# Start database services
npm run test:db:up

# Run migrations
npm run db:migrate

# Seed test data
npm run db:seed
```

### 5. Start Development Environment
```bash
# Start all services
npm run dev

# Or start individual services
npm run dev --workspace=apps/api    # API server
npm run dev --workspace=apps/web    # Web frontend
npm run mcp:start                   # MCP microservices
```

### 6. Access the Application
- **Web Interface**: http://localhost:3000
- **API Server**: http://localhost:3001
- **API Documentation**: http://localhost:3001/docs

## 🧪 Testing

### Unit Tests
```bash
npm test                    # All tests
npm run test:watch         # Watch mode
npm run test:coverage      # Coverage report
```

### Integration Tests
```bash
npm run test:e2e           # End-to-end tests
npm run test:integration   # Integration tests
```

### Load Testing
```bash
npm run load-test          # Performance load testing
npm run performance-test   # Alias for load testing
```

## 🐳 Docker Deployment

### Development
```bash
npm run docker:build       # Build all containers
npm run docker:up          # Start services
npm run docker:logs        # View logs
npm run docker:down        # Stop services
```

### Production
```bash
# Build for production
docker-compose -f docker-compose.prod.yml build

# Deploy to production
docker-compose -f docker-compose.prod.yml up -d
```

## ☸️ Kubernetes Deployment

### Prerequisites
- Kubernetes cluster (1.20+)
- kubectl configured
- Helm 3+ (optional)

### Deploy to Kubernetes
```bash
# Apply all manifests
npm run k8s:deploy

# Or deploy individually
kubectl apply -f k8s/namespace.yml
kubectl apply -f k8s/database/
kubectl apply -f k8s/backend/
kubectl apply -f k8s/frontend/
kubectl apply -f k8s/microservices/
```

### Monitor Deployment
```bash
kubectl get pods -n financial-analyzer
kubectl get services -n financial-analyzer
kubectl logs -f deployment/financial-analyzer-api -n financial-analyzer
```

## 📊 Performance Benchmarks

### Response Time Targets
- API Endpoints: <500ms (95th percentile)
- Web Application: <3 seconds initial load
- Database Queries: <100ms average
- File Processing: <30 seconds for 50MB files

### Throughput Targets
- Concurrent Users: 100+ without degradation
- API Requests: 1,000 requests per minute
- Database Operations: 500 queries per second

### Resource Usage
- CPU Usage: <70% under normal load
- Memory Usage: <80% under normal load
- Database Connections: <80% of pool capacity

## 🔒 Security Features

### Authentication & Authorization
- JWT-based authentication with refresh tokens
- Multi-factor authentication (TOTP)
- Role-based access control (RBAC)
- Session management with configurable timeouts

### Data Protection
- AES-256-GCM encryption for sensitive data
- TLS 1.3 for data in transit
- Secure password hashing with bcrypt
- Input validation and sanitization

### Audit & Compliance
- Comprehensive audit logging
- GDPR compliance features
- Data retention policies
- Integrity verification with HMAC

## 📖 Documentation

### API Documentation
- [OpenAPI Specification](docs/api/openapi.yaml)
- [API Reference](docs/api/README.md)
- [Changelog](docs/api/CHANGELOG.md)

### User Documentation
- [User Guide](docs/user/README.md)
- [Getting Started Guide](docs/user/GETTING_STARTED.md)
- [Best Practices](docs/user/BEST_PRACTICES.md)

### Technical Documentation
- [Performance Optimization](docs/performance/PERFORMANCE_OPTIMIZATION.md)
- [Launch Readiness](docs/deployment/LAUNCH_READINESS_CHECKLIST.md)
- [Monitoring Guide](docs/operations/MONITORING.md)

## 🛠️ Development

### Project Structure
```
financial-analyzer/
├── apps/
│   ├── api/                 # Express.js API server
│   └── web/                 # React frontend
├── mcp-servers/             # Microservice servers
│   ├── document-parser/     # Document processing
│   ├── constraint-engine/   # Constraint evaluation
│   ├── alert-manager/       # Alert management
│   └── ai-analyzer/         # AI analysis
├── docs/                    # Documentation
├── k8s/                     # Kubernetes manifests
├── scripts/                 # Utility scripts
└── tests/                   # Integration tests
```

### Code Quality
```bash
npm run lint               # ESLint
npm run format             # Prettier
npm run type-check         # TypeScript
```

### Database Management
```bash
npm run db:migrate         # Run migrations
npm run db:seed           # Seed data
npm run studio            # Prisma Studio
```

## 🚀 Deployment Checklist

Before deploying to production, ensure:

- [ ] All environment variables configured
- [ ] Database migrations applied
- [ ] SSL certificates installed
- [ ] Security headers configured
- [ ] Monitoring and alerting setup
- [ ] Backup procedures tested
- [ ] Load testing completed
- [ ] Security audit passed

See the complete [Launch Readiness Checklist](docs/deployment/LAUNCH_READINESS_CHECKLIST.md).

## 📈 Monitoring & Observability

### Health Checks
- Application health: `/health`
- Database health: `/health/database`
- Services health: `/health/services`
- Readiness probe: `/health/ready`
- Liveness probe: `/health/live`

### Metrics
- Request rate and response times
- Error rates and types
- Resource utilization (CPU, memory, disk)
- Database performance metrics
- Business metrics (users, documents, analyses)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Make your changes and add tests
4. Run the test suite: `npm test`
5. Commit your changes: `git commit -am 'Add new feature'`
6. Push to the branch: `git push origin feature/new-feature`
7. Submit a pull request

### Development Guidelines
- Follow TypeScript best practices
- Write comprehensive tests
- Update documentation
- Follow commit message conventions
- Ensure code passes all quality checks

## 📞 Support

### Getting Help
- 📚 [Documentation](docs/)
- 🐛 [Issue Tracker](https://github.com/your-org/financial-analyzer/issues)
- 💬 [Discussions](https://github.com/your-org/financial-analyzer/discussions)

### Emergency Support
- **Security Issues**: security@financial-analyzer.com
- **Critical Bugs**: support@financial-analyzer.com

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

**CapitalCue** - Built with ❤️ for the financial community.

## 🚀 CapitalCue - AI-Powered Financial Analysis

Status: Ready for deployment with all fixes applied!
