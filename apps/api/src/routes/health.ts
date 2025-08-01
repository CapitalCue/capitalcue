/**
 * Enhanced Health Check Routes
 * Comprehensive health monitoring for production deployment
 */

import express from 'express';
import { PrismaClient } from '@prisma/client';
import { createClient } from 'redis';
import axios from 'axios';
import { logger } from '../index';

const router = express.Router();
const prisma = new PrismaClient();

// Initialize Redis client for health checks
let redisClient: any = null;
if (process.env.REDIS_URL) {
  redisClient = createClient({ url: process.env.REDIS_URL });
  redisClient.on('error', (err: any) => logger.error('Redis client error:', err));
}

interface HealthCheck {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  uptime: number;
  version: string;
  environment: string;
  services: {
    database: ServiceHealth;
    redis: ServiceHealth;
    documentParser: ServiceHealth;
    constraintEngine: ServiceHealth;
    alertManager: ServiceHealth;
    aiAnalyzer: ServiceHealth;
  };
  system: {
    memory: MemoryInfo;
    cpu: CPUInfo;
    disk: DiskInfo;
  };
  metrics: {
    requestCount: number;
    errorRate: number;
    averageResponseTime: number;
    activeConnections: number;
  };
}

interface ServiceHealth {
  status: 'healthy' | 'unhealthy' | 'degraded';
  responseTime?: number;
  lastCheck: string;
  error?: string;
}

interface MemoryInfo {
  used: number;
  total: number;
  percentage: number;
  heap: {
    used: number;
    total: number;
  };
}

interface CPUInfo {
  usage: number;
  loadAverage: number[];
}

interface DiskInfo {
  used: number;
  total: number;
  percentage: number;
}

// Health check cache to avoid excessive resource usage
let healthCache: { data: HealthCheck; timestamp: number } | null = null;
const HEALTH_CACHE_TTL = 30000; // 30 seconds

/**
 * Basic health check endpoint
 */
router.get('/', async (req, res) => {
  try {
    const health = await getBasicHealth();
    const statusCode = health.status === 'healthy' ? 200 : 503;
    res.status(statusCode).json(health);
  } catch (error) {
    logger.error('Basic health check failed:', error);
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Health check failed'
    });
  }
});

/**
 * Detailed health check endpoint
 */
router.get('/detailed', async (req, res) => {
  try {
    const health = await getDetailedHealth();
    const statusCode = health.status === 'healthy' ? 200 : 
                      health.status === 'degraded' ? 200 : 503;
    res.status(statusCode).json(health);
  } catch (error) {
    logger.error('Detailed health check failed:', error);
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Detailed health check failed'
    });
  }
});

/**
 * Readiness probe for Kubernetes
 */
router.get('/ready', async (req, res) => {
  try {
    const isReady = await checkReadiness();
    if (isReady) {
      res.status(200).json({
        status: 'ready',
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(503).json({
        status: 'not ready',
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    logger.error('Readiness check failed:', error);
    res.status(503).json({
      status: 'not ready',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

/**
 * Liveness probe for Kubernetes
 */
router.get('/live', async (req, res) => {
  try {
    const isAlive = await checkLiveness();
    if (isAlive) {
      res.status(200).json({
        status: 'alive',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
      });
    } else {
      res.status(503).json({
        status: 'not alive',
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    logger.error('Liveness check failed:', error);
    res.status(503).json({
      status: 'not alive',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

/**
 * Database health check endpoint
 */
router.get('/database', async (req, res) => {
  try {
    const dbHealth = await checkDatabaseHealth();
    const statusCode = dbHealth.status === 'healthy' ? 200 : 503;
    res.status(statusCode).json(dbHealth);
  } catch (error) {
    logger.error('Database health check failed:', error);
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

/**
 * MCP services health check endpoint
 */
router.get('/services', async (req, res) => {
  try {
    const servicesHealth = await checkMCPServicesHealth();
    const allHealthy = Object.values(servicesHealth).every(service => service.status === 'healthy');
    const statusCode = allHealthy ? 200 : 503;
    
    res.status(statusCode).json({
      status: allHealthy ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      services: servicesHealth
    });
  } catch (error) {
    logger.error('Services health check failed:', error);
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

/**
 * Get basic health information
 */
async function getBasicHealth(): Promise<Partial<HealthCheck>> {
  const dbHealth = await checkDatabaseHealth();
  const status = dbHealth.status === 'healthy' ? 'healthy' : 'unhealthy';

  return {
    status,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.APP_VERSION || '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  };
}

/**
 * Get detailed health information with caching
 */
async function getDetailedHealth(): Promise<HealthCheck> {
  const now = Date.now();
  
  // Return cached data if still valid
  if (healthCache && (now - healthCache.timestamp) < HEALTH_CACHE_TTL) {
    return healthCache.data;
  }

  // Perform health checks
  const [
    databaseHealth,
    redisHealth,
    servicesHealth,
    systemInfo,
    metrics
  ] = await Promise.all([
    checkDatabaseHealth(),
    checkRedisHealth(),
    checkMCPServicesHealth(),
    getSystemInfo(),
    getMetrics()
  ]);

  // Determine overall status
  const serviceStatuses = [
    databaseHealth.status,
    redisHealth.status,
    ...Object.values(servicesHealth).map(s => s.status)
  ];

  const unhealthyCount = serviceStatuses.filter(s => s === 'unhealthy').length;
  const degradedCount = serviceStatuses.filter(s => s === 'degraded').length;

  let overallStatus: 'healthy' | 'unhealthy' | 'degraded';
  if (unhealthyCount === 0 && degradedCount === 0) {
    overallStatus = 'healthy';
  } else if (unhealthyCount > 0) {
    overallStatus = 'unhealthy';
  } else {
    overallStatus = 'degraded';
  }

  const health: HealthCheck = {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.APP_VERSION || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    services: {
      database: databaseHealth,
      redis: redisHealth,
      documentParser: servicesHealth.documentParser,
      constraintEngine: servicesHealth.constraintEngine,
      alertManager: servicesHealth.alertManager,
      aiAnalyzer: servicesHealth.aiAnalyzer
    },
    system: systemInfo,
    metrics
  };

  // Cache the result
  healthCache = { data: health, timestamp: now };
  
  return health;
}

/**
 * Check database health
 */
async function checkDatabaseHealth(): Promise<ServiceHealth> {
  const startTime = Date.now();
  
  try {
    // Simple database query to check connectivity
    await prisma.$queryRaw`SELECT 1`;
    
    const responseTime = Date.now() - startTime;
    
    return {
      status: responseTime < 1000 ? 'healthy' : 'degraded',
      responseTime,
      lastCheck: new Date().toISOString()
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      responseTime: Date.now() - startTime,
      lastCheck: new Date().toISOString(),
      error: error.message
    };
  }
}

/**
 * Check Redis health
 */
async function checkRedisHealth(): Promise<ServiceHealth> {
  if (!redisClient) {
    return {
      status: 'degraded',
      lastCheck: new Date().toISOString(),
      error: 'Redis client not configured'
    };
  }

  const startTime = Date.now();
  
  try {
    await redisClient.ping();
    
    const responseTime = Date.now() - startTime;
    
    return {
      status: responseTime < 500 ? 'healthy' : 'degraded',
      responseTime,
      lastCheck: new Date().toISOString()
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      responseTime: Date.now() - startTime,
      lastCheck: new Date().toISOString(),
      error: error.message
    };
  }
}

/**
 * Check MCP services health
 */
async function checkMCPServicesHealth(): Promise<{
  documentParser: ServiceHealth;
  constraintEngine: ServiceHealth;
  alertManager: ServiceHealth;
  aiAnalyzer: ServiceHealth;
}> {
  const services = [
    { name: 'documentParser', url: process.env.DOCUMENT_PARSER_URL },
    { name: 'constraintEngine', url: process.env.CONSTRAINT_ENGINE_URL },
    { name: 'alertManager', url: process.env.ALERT_MANAGER_URL },
    { name: 'aiAnalyzer', url: process.env.AI_ANALYZER_URL }
  ];

  const results: any = {};

  await Promise.all(
    services.map(async (service) => {
      results[service.name] = await checkServiceHealth(service.url);
    })
  );

  return results;
}

/**
 * Check individual service health
 */
async function checkServiceHealth(serviceUrl?: string): Promise<ServiceHealth> {
  if (!serviceUrl) {
    return {
      status: 'degraded',
      lastCheck: new Date().toISOString(),
      error: 'Service URL not configured'
    };
  }

  const startTime = Date.now();
  
  try {
    const response = await axios.get(`${serviceUrl}/health`, {
      timeout: 5000,
      headers: { 'User-Agent': 'FinancialAnalyzer-HealthCheck/1.0' }
    });
    
    const responseTime = Date.now() - startTime;
    
    return {
      status: response.status === 200 && responseTime < 2000 ? 'healthy' : 'degraded',
      responseTime,
      lastCheck: new Date().toISOString()
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      responseTime: Date.now() - startTime,
      lastCheck: new Date().toISOString(),
      error: error.message
    };
  }
}

/**
 * Get system information
 */
function getSystemInfo(): {
  memory: MemoryInfo;
  cpu: CPUInfo;
  disk: DiskInfo;
} {
  const memUsage = process.memoryUsage();
  const totalMemory = require('os').totalmem();
  const freeMemory = require('os').freemem();
  const usedMemory = totalMemory - freeMemory;

  return {
    memory: {
      used: usedMemory,
      total: totalMemory,
      percentage: Math.round((usedMemory / totalMemory) * 100),
      heap: {
        used: memUsage.heapUsed,
        total: memUsage.heapTotal
      }
    },
    cpu: {
      usage: process.cpuUsage().user / 1000000, // Convert to seconds
      loadAverage: require('os').loadavg()
    },
    disk: {
      used: 0, // Would need to implement disk usage check
      total: 0,
      percentage: 0
    }
  };
}

/**
 * Get application metrics
 */
function getMetrics(): {
  requestCount: number;
  errorRate: number;
  averageResponseTime: number;
  activeConnections: number;
} {
  // These would typically come from a metrics collection system
  // For now, return placeholder values
  return {
    requestCount: 0,
    errorRate: 0,
    averageResponseTime: 0,
    activeConnections: 0
  };
}

/**
 * Check if the application is ready to serve requests
 */
async function checkReadiness(): Promise<boolean> {
  try {
    // Check database connectivity
    await prisma.$queryRaw`SELECT 1`;
    
    // Check critical MCP services
    const criticalServices = [
      process.env.DOCUMENT_PARSER_URL,
      process.env.CONSTRAINT_ENGINE_URL
    ];

    for (const serviceUrl of criticalServices) {
      if (serviceUrl) {
        try {
          await axios.get(`${serviceUrl}/health`, { timeout: 2000 });
        } catch (error) {
          logger.warn(`Critical service not ready: ${serviceUrl}`);
          return false;
        }
      }
    }

    return true;
  } catch (error) {
    logger.error('Readiness check failed:', error);
    return false;
  }
}

/**
 * Check if the application is alive
 */
async function checkLiveness(): Promise<boolean> {
  try {
    // Basic checks to ensure the application is still functioning
    const memUsage = process.memoryUsage();
    const maxHeapSize = 2 * 1024 * 1024 * 1024; // 2GB
    
    // Check if memory usage is within acceptable limits
    if (memUsage.heapUsed > maxHeapSize * 0.9) {
      logger.warn('Memory usage is critically high');
      return false;
    }

    // Check if event loop is not blocked (simplified check)
    const startTime = Date.now();
    await new Promise(resolve => setImmediate(resolve));
    const eventLoopDelay = Date.now() - startTime;
    
    if (eventLoopDelay > 100) { // 100ms threshold
      logger.warn('Event loop appears to be blocked');
      return false;
    }

    return true;
  } catch (error) {
    logger.error('Liveness check failed:', error);
    return false;
  }
}

export default router;