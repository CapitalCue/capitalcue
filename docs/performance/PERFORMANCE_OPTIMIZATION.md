# Performance Optimization Guide
## Financial Constraint Analysis Platform

This document outlines performance optimization strategies and load testing procedures for the Financial Constraint Analysis Platform.

## Table of Contents
- [Performance Targets](#performance-targets)
- [Application Optimization](#application-optimization)
- [Database Optimization](#database-optimization)
- [Caching Strategy](#caching-strategy)
- [Load Testing](#load-testing)
- [Monitoring & Profiling](#monitoring--profiling)
- [Scaling Strategies](#scaling-strategies)

---

## Performance Targets

### Response Time Targets
- **API Endpoints:** <500ms for 95% of requests
- **Web Application:** <3 seconds initial load
- **Database Queries:** <100ms average
- **File Uploads:** <30 seconds for 50MB files
- **Analysis Processing:** <2 minutes average

### Throughput Targets
- **Concurrent Users:** 100+ without degradation
- **API Requests:** 1,000 requests per minute
- **Database Operations:** 500 queries per second
- **File Processing:** 50 documents per hour
- **Analysis Engine:** 100 constraints per minute

### Resource Usage Targets
- **CPU Usage:** <70% under normal load
- **Memory Usage:** <80% under normal load
- **Disk I/O:** <60% utilization
- **Network Bandwidth:** Within allocated limits
- **Database Connections:** <80% of pool capacity

---

## Application Optimization

### Node.js Optimization
```javascript
// Memory optimization
process.env.NODE_OPTIONS = '--max-old-space-size=2048';

// Cluster mode for CPU utilization
const cluster = require('cluster');
const numCPUs = require('os').cpus().length;

if (cluster.isMaster && process.env.NODE_ENV === 'production') {
  // Fork workers
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }
} else {
  // Worker process
  require('./app');
}
```

### Express.js Optimizations
```javascript
// Compression middleware
app.use(compression({
  threshold: 1024,
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  }
}));

// Request timeout
app.use(timeout('30s'));

// Keep-alive connections
app.use((req, res, next) => {
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Keep-Alive', 'timeout=5, max=1000');
  next();
});
```

### React Frontend Optimizations
```javascript
// Code splitting
const LazyDashboard = lazy(() => import('./components/Dashboard'));
const LazyDocuments = lazy(() => import('./components/Documents'));

// Component memoization
const MemoizedConstraintCard = React.memo(ConstraintCard);

// Virtual scrolling for large lists
import { FixedSizeList as List } from 'react-window';

// Bundle analysis
// npm run build --analyze
```

### JSON Processing Optimization
```javascript
// Use streaming JSON parser for large files
const StreamingJsonParser = require('stream-json');
const parser = StreamingJsonParser.parser();

// Optimize JSON responses
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
```

---

## Database Optimization

### Index Strategy
```sql
-- Primary indexes for frequent queries
CREATE INDEX CONCURRENTLY idx_documents_user_id ON documents(user_id);
CREATE INDEX CONCURRENTLY idx_documents_company_id ON documents(company_id);
CREATE INDEX CONCURRENTLY idx_constraints_user_id ON constraints(user_id);
CREATE INDEX CONCURRENTLY idx_constraints_active ON constraints(user_id, is_active);

-- Composite indexes for complex queries
CREATE INDEX CONCURRENTLY idx_documents_user_company_status 
ON documents(user_id, company_id, status);

-- Partial indexes for filtered queries
CREATE INDEX CONCURRENTLY idx_constraints_active_user 
ON constraints(user_id) WHERE is_active = true;

-- Text search indexes
CREATE INDEX CONCURRENTLY idx_documents_content_search 
ON documents USING gin(to_tsvector('english', content));
```

### Query Optimization
```javascript
// Use connection pooling
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  engineType: 'binary',
});

// Optimize queries with select and include
const documents = await prisma.document.findMany({
  select: {
    id: true,
    fileName: true,
    status: true,
    createdAt: true,
    company: {
      select: { name: true }
    }
  },
  where: { userId },
  orderBy: { createdAt: 'desc' },
  take: 20,
  skip: page * 20
});

// Use transactions for related operations
await prisma.$transaction(async (tx) => {
  const analysis = await tx.analysis.create({ data: analysisData });
  await tx.constraint.updateMany({
    where: { userId },
    data: { lastAnalysisId: analysis.id }
  });
});
```

### Connection Pooling
```javascript
// Prisma connection pool configuration
DATABASE_POOL_MIN=5
DATABASE_POOL_MAX=20
DATABASE_POOL_TIMEOUT=20000
DATABASE_POOL_IDLE_TIMEOUT=300000

// Custom pool configuration
const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  min: 5,
  max: 20,
  idleTimeoutMillis: 300000,
  connectionTimeoutMillis: 20000,
});
```

---

## Caching Strategy

### Redis Caching Implementation
```javascript
const Redis = require('redis');
const client = Redis.createClient({
  url: process.env.REDIS_URL,
  retry_strategy: (options) => {
    if (options.error && options.error.code === 'ECONNREFUSED') {
      return new Error('Redis connection refused');
    }
    if (options.total_retry_time > 1000 * 60 * 60) {
      return new Error('Retry time exhausted');
    }
    return Math.min(options.attempt * 100, 3000);
  }
});

// Cache middleware
const cacheMiddleware = (duration = 300) => {
  return async (req, res, next) => {
    const key = `cache:${req.originalUrl}:${req.user?.id || 'anonymous'}`;
    
    try {
      const cached = await client.get(key);
      if (cached) {
        return res.json(JSON.parse(cached));
      }
      
      const originalSend = res.json;
      res.json = function(data) {
        client.setex(key, duration, JSON.stringify(data));
        originalSend.call(this, data);
      };
      
      next();
    } catch (error) {
      next(); // Fallback to no caching
    }
  };
};

// Cache frequently accessed data
app.get('/api/constraints/templates', cacheMiddleware(3600), getConstraintTemplates);
app.get('/api/companies/:id', cacheMiddleware(600), getCompanyDetails);
```

### Application-Level Caching
```javascript
// Memory cache for frequently accessed data
const NodeCache = require('node-cache');
const cache = new NodeCache({ stdTTL: 600, checkperiod: 120 });

// Cache constraint templates
const getConstraintTemplates = async () => {
  const cacheKey = 'constraint_templates';
  let templates = cache.get(cacheKey);
  
  if (!templates) {
    templates = await prisma.constraintTemplate.findMany();
    cache.set(cacheKey, templates, 3600); // 1 hour
  }
  
  return templates;
};

// Cache user session data
const getUserSession = async (userId) => {
  const cacheKey = `user_session_${userId}`;
  let session = cache.get(cacheKey);
  
  if (!session) {
    session = await prisma.user.findUnique({
      where: { id: userId },
      include: { preferences: true }
    });
    cache.set(cacheKey, session, 900); // 15 minutes
  }
  
  return session;
};
```

### CDN Configuration
```javascript
// Static asset caching headers
app.use('/static', express.static('public', {
  maxAge: '1y',
  etag: true,
  lastModified: true,
  setHeaders: (res, path) => {
    if (path.endsWith('.js') || path.endsWith('.css')) {
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    }
  }
}));

// API response caching headers
app.use('/api', (req, res, next) => {
  if (req.method === 'GET') {
    res.setHeader('Cache-Control', 'private, max-age=300');
  } else {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  }
  next();
});
```

---

## Load Testing

### Artillery Load Testing Configuration
```yaml
# artillery-config.yml
config:
  target: 'https://api.financial-analyzer.com'
  phases:
    - duration: 60
      arrivalRate: 5
      name: "Warm up"
    - duration: 300
      arrivalRate: 20
      name: "Normal load"
    - duration: 180
      arrivalRate: 50
      name: "Peak load"
    - duration: 120
      arrivalRate: 100
      name: "Stress test"
  defaults:
    headers:
      Content-Type: 'application/json'
      Authorization: 'Bearer {{ token }}'

scenarios:
  - name: "User Authentication"
    weight: 20
    flow:
      - post:
          url: "/auth/login"
          json:
            email: "test@example.com"
            password: "password123"
          capture:
            - json: "$.token"
              as: "token"
      
  - name: "Document Operations"
    weight: 30
    flow:
      - get:
          url: "/documents"
      - post:
          url: "/documents"
          formData:
            file: "@test-document.pdf"
            companyId: "{{ companyId }}"
            documentType: "QUARTERLY_REPORT"
      
  - name: "Constraint Management"
    weight: 25
    flow:
      - get:
          url: "/constraints"
      - post:
          url: "/constraints"
          json:
            name: "Test Constraint {{ $randomString() }}"
            metric: "current_ratio"
            operator: "LESS_THAN"
            value: 1.0
            severity: "WARNING"
            message: "Current ratio warning"
      
  - name: "Analysis Execution"
    weight: 25
    flow:
      - post:
          url: "/analysis/run"
          json:
            companyId: "{{ companyId }}"
            constraintIds: ["{{ constraintId }}"]
```

### K6 Performance Testing
```javascript
// k6-load-test.js
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

export let errorRate = new Rate('errors');

export let options = {
  stages: [
    { duration: '2m', target: 20 }, // Ramp up
    { duration: '5m', target: 50 }, // Stay at 50 users
    { duration: '2m', target: 100 }, // Ramp up to 100 users
    { duration: '5m', target: 100 }, // Stay at 100 users
    { duration: '2m', target: 0 }, // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests under 500ms
    http_req_failed: ['rate<0.05'], // Error rate under 5%
    errors: ['rate<0.05'],
  },
};

const BASE_URL = 'https://api.financial-analyzer.com';

export function setup() {
  // Login and get auth token
  const loginRes = http.post(`${BASE_URL}/auth/login`, {
    email: 'loadtest@example.com',
    password: 'loadtest123'
  });
  
  const token = loginRes.json('token');
  return { token };
}

export default function(data) {
  const headers = {
    'Authorization': `Bearer ${data.token}`,
    'Content-Type': 'application/json',
  };
  
  // Test document listing
  let response = http.get(`${BASE_URL}/documents`, { headers });
  check(response, {
    'documents status is 200': (r) => r.status === 200,
    'documents response time < 500ms': (r) => r.timings.duration < 500,
  }) || errorRate.add(1);
  
  sleep(1);
  
  // Test constraint listing
  response = http.get(`${BASE_URL}/constraints`, { headers });
  check(response, {
    'constraints status is 200': (r) => r.status === 200,
    'constraints response time < 500ms': (r) => r.timings.duration < 500,
  }) || errorRate.add(1);
  
  sleep(1);
  
  // Test analysis endpoint
  response = http.post(`${BASE_URL}/analysis/run`, 
    JSON.stringify({
      companyId: 'test-company-id',
      constraintIds: ['test-constraint-id']
    }), 
    { headers }
  );
  check(response, {
    'analysis status is 200 or 202': (r) => [200, 202].includes(r.status),
  }) || errorRate.add(1);
  
  sleep(2);
}
```

### Database Load Testing
```sql
-- pgbench configuration for database load testing
-- Initialize test database
pgbench -i -s 10 financial_analyzer_test

-- Run load test
pgbench -c 20 -j 4 -T 300 -P 10 financial_analyzer_test

-- Custom benchmark script (benchmark.sql)
\set user_id random(1, 1000)
\set company_id random(1, 100)
BEGIN;
SELECT * FROM documents WHERE user_id = :user_id ORDER BY created_at DESC LIMIT 10;
SELECT * FROM constraints WHERE user_id = :user_id AND is_active = true;
INSERT INTO analysis (user_id, company_id, status) VALUES (:user_id, :company_id, 'RUNNING');
COMMIT;
```

---

## Monitoring & Profiling

### Application Performance Monitoring
```javascript
// APM with Elastic APM
const apm = require('elastic-apm-node').start({
  serviceName: 'financial-analyzer-api',
  secretToken: process.env.ELASTIC_APM_SECRET_TOKEN,
  serverUrl: process.env.ELASTIC_APM_SERVER_URL,
  environment: process.env.NODE_ENV
});

// Custom performance metrics
const performanceMonitor = {
  startTimer: (name) => {
    const start = process.hrtime.bigint();
    return {
      end: () => {
        const end = process.hrtime.bigint();
        const duration = Number(end - start) / 1000000; // Convert to ms
        console.log(`${name}: ${duration.toFixed(2)}ms`);
        return duration;
      }
    };
  }
};

// Middleware for request timing
app.use((req, res, next) => {
  const timer = performanceMonitor.startTimer(`${req.method} ${req.path}`);
  res.on('finish', () => {
    const duration = timer.end();
    if (duration > 1000) {
      console.warn(`Slow request: ${req.method} ${req.path} - ${duration}ms`);
    }
  });
  next();
});
```

### Memory Leak Detection
```javascript
// Memory usage monitoring
const memoryMonitor = setInterval(() => {
  const usage = process.memoryUsage();
  console.log({
    rss: Math.round(usage.rss / 1024 / 1024) + 'MB',
    heapTotal: Math.round(usage.heapTotal / 1024 / 1024) + 'MB',
    heapUsed: Math.round(usage.heapUsed / 1024 / 1024) + 'MB',
    external: Math.round(usage.external / 1024 / 1024) + 'MB',
  });
  
  // Alert if memory usage is too high
  if (usage.heapUsed > 1.5 * 1024 * 1024 * 1024) { // 1.5GB
    console.error('High memory usage detected:', usage);
  }
}, 30000); // Every 30 seconds

// Graceful shutdown
process.on('SIGTERM', () => {
  clearInterval(memoryMonitor);
  process.exit(0);
});
```

---

## Scaling Strategies

### Horizontal Scaling
```yaml
# kubernetes-hpa.yml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: financial-analyzer-api-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: financial-analyzer-api
  minReplicas: 3
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

### Database Scaling
```javascript
// Read replicas configuration
const masterDb = new PrismaClient({
  datasources: { db: { url: process.env.DATABASE_URL } }
});

const replicaDb = new PrismaClient({
  datasources: { db: { url: process.env.DATABASE_REPLICA_URL } }
});

// Route read queries to replica
const getDocuments = async (userId) => {
  return await replicaDb.document.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' }
  });
};

// Route write queries to master
const createDocument = async (data) => {
  return await masterDb.document.create({ data });
};
```

### Load Balancer Configuration
```nginx
# nginx.conf
upstream api_servers {
    least_conn;
    server api-1:3001 max_fails=3 fail_timeout=30s;
    server api-2:3001 max_fails=3 fail_timeout=30s;
    server api-3:3001 max_fails=3 fail_timeout=30s;
}

server {
    listen 80;
    server_name api.financial-analyzer.com;
    
    location / {
        proxy_pass http://api_servers;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_connect_timeout 30s;
        proxy_send_timeout 30s;
        proxy_read_timeout 30s;
    }
    
    location /health {
        access_log off;
        proxy_pass http://api_servers;
    }
}
```

---

## Performance Testing Checklist

### Pre-Testing Setup
- [ ] Load testing environment configured
- [ ] Test data prepared (users, documents, constraints)
- [ ] Monitoring tools configured
- [ ] Baseline performance metrics captured
- [ ] Testing tools installed (Artillery, K6, Apache Bench)

### Load Testing Scenarios
- [ ] Authentication load testing (login/logout)
- [ ] Document upload/download stress testing
- [ ] Constraint management load testing
- [ ] Analysis execution performance testing
- [ ] Concurrent user simulation (100+ users)

### Performance Validation
- [ ] API response times <500ms (95th percentile)
- [ ] Database query performance <100ms average
- [ ] Memory usage <80% under load
- [ ] CPU usage <70% under load
- [ ] Error rate <5% under peak load

### Optimization Implementation
- [ ] Database indexes optimized
- [ ] Caching strategy implemented
- [ ] Code-level optimizations applied
- [ ] Resource pooling configured
- [ ] CDN configured for static assets

---

This performance optimization guide ensures the Financial Constraint Analysis Platform meets production-ready performance standards and can handle expected user loads efficiently.