/**
 * Advanced Authentication and Authorization Middleware
 * Implements multi-factor authentication, session management, and RBAC
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { createError } from './error-handler';
import { auditLogger, AuditEventType } from '../services/audit-logger';
import { generateSecureToken, verifyPassword } from '../utils/encryption';
import { securityMonitor } from '../services/security-monitor';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';

const prisma = new PrismaClient();

// Extended request interface
export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    name: string;
    userType: 'VC' | 'INVESTOR';
    permissions: string[];
    sessionId: string;
    mfaEnabled: boolean;
    mfaVerified: boolean;
  };
  session?: {
    id: string;
    userId: string;
    expires: Date;
    ipAddress: string;
    userAgent: string;
  };
}

// Permission definitions
export enum Permission {
  // User management
  USER_READ = 'user:read',
  USER_WRITE = 'user:write',
  USER_DELETE = 'user:delete',
  
  // Document management
  DOCUMENT_READ = 'document:read',
  DOCUMENT_WRITE = 'document:write',
  DOCUMENT_DELETE = 'document:delete',
  DOCUMENT_SHARE = 'document:share',
  
  // Constraint management
  CONSTRAINT_READ = 'constraint:read',
  CONSTRAINT_WRITE = 'constraint:write',
  CONSTRAINT_DELETE = 'constraint:delete',
  
  // Analysis
  ANALYSIS_READ = 'analysis:read',
  ANALYSIS_WRITE = 'analysis:write',
  ANALYSIS_DELETE = 'analysis:delete',
  ANALYSIS_EXPORT = 'analysis:export',
  
  // AI features
  AI_ANALYSIS = 'ai:analysis',
  AI_INSIGHTS = 'ai:insights',
  
  // System administration
  ADMIN_USERS = 'admin:users',
  ADMIN_SYSTEM = 'admin:system',
  ADMIN_AUDIT = 'admin:audit',
  
  // Compliance
  COMPLIANCE_VIEW = 'compliance:view',
  COMPLIANCE_EXPORT = 'compliance:export'
}

// Role-based permissions
const ROLE_PERMISSIONS = {
  INVESTOR: [
    Permission.USER_READ,
    Permission.DOCUMENT_READ,
    Permission.DOCUMENT_WRITE,
    Permission.CONSTRAINT_READ,
    Permission.CONSTRAINT_WRITE,
    Permission.ANALYSIS_READ,
    Permission.ANALYSIS_WRITE,
    Permission.ANALYSIS_EXPORT,
    Permission.AI_ANALYSIS,
    Permission.AI_INSIGHTS
  ],
  VC: [
    Permission.USER_READ,
    Permission.DOCUMENT_READ,
    Permission.DOCUMENT_WRITE,
    Permission.DOCUMENT_SHARE,
    Permission.CONSTRAINT_READ,
    Permission.CONSTRAINT_WRITE,
    Permission.ANALYSIS_READ,
    Permission.ANALYSIS_WRITE,
    Permission.ANALYSIS_EXPORT,
    Permission.AI_ANALYSIS,
    Permission.AI_INSIGHTS,
    Permission.COMPLIANCE_VIEW
  ],
  ADMIN: Object.values(Permission)
};

/**
 * Advanced JWT authentication middleware
 */
export const authenticateJWT = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Check if IP is blocked
    const clientIP = getClientIP(req);
    if (securityMonitor.isIPBlocked(clientIP)) {
      await securityMonitor.logSecurityEvent({
        type: 'MALICIOUS_REQUEST',
        severity: 'HIGH',
        ipAddress: clientIP,
        userAgent: req.get('User-Agent') || 'unknown',
        description: 'Request from blocked IP address',
        timestamp: new Date()
      });
      throw createError('Access denied', 403);
    }

    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      await auditLogger.logAuthentication(AuditEventType.ACCESS_DENIED, req);
      await securityMonitor.monitorAuthentication(req, undefined, false);
      throw createError('Access token required', 401);
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    
    // Check if token is blacklisted
    const blacklistedToken = await prisma.blacklistedToken.findUnique({
      where: { token }
    });
    
    if (blacklistedToken) {
      await auditLogger.logAuthentication(AuditEventType.ACCESS_DENIED, req, decoded.userId);
      throw createError('Token has been revoked', 401);
    }

    // Get user with current session
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        sessions: {
          where: {
            token,
            expires: { gt: new Date() },
            isActive: true
          }
        }
      }
    });

    if (!user || user.sessions.length === 0) {
      await auditLogger.logAuthentication(AuditEventType.ACCESS_DENIED, req, decoded.userId);
      await securityMonitor.monitorAuthentication(req, decoded.userId, false);
      throw createError('Invalid or expired token', 401);
    }

    // Check if user is quarantined
    if (securityMonitor.isUserQuarantined(user.id)) {
      await securityMonitor.logSecurityEvent({
        type: 'ACCOUNT_TAKEOVER',
        severity: 'HIGH',
        userId: user.id,
        ipAddress: clientIP,
        userAgent: req.get('User-Agent') || 'unknown',
        description: 'Request from quarantined user account',
        timestamp: new Date()
      });
      throw createError('Account temporarily restricted', 403);
    }

    const session = user.sessions[0];

    // Verify session IP (optional security check)
    const currentIP = getClientIP(req);
    if (process.env.STRICT_IP_VALIDATION === 'true' && session.ipAddress !== currentIP) {
      await auditLogger.logSecurityViolation(req, 'IP_MISMATCH', {
        sessionIP: session.ipAddress,
        currentIP
      });
      throw createError('Session IP mismatch', 401);
    }

    // Get user permissions
    const permissions = ROLE_PERMISSIONS[user.userType] || [];

    // Attach user and session to request
    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      userType: user.userType,
      permissions,
      sessionId: session.id,
      mfaEnabled: !!user.mfaSecret,
      mfaVerified: session.mfaVerified
    };

    req.session = {
      id: session.id,
      userId: user.id,
      expires: session.expires,
      ipAddress: session.ipAddress,
      userAgent: session.userAgent
    };

    // Update session last activity
    await prisma.session.update({
      where: { id: session.id },
      data: { lastActivity: new Date() }
    });

    // Log successful authentication
    await auditLogger.logAuthentication(AuditEventType.ACCESS_GRANTED, req, user.id, user.email);
    await securityMonitor.monitorAuthentication(req, user.id, true);

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      await auditLogger.logAuthentication(AuditEventType.ACCESS_DENIED, req);
      return next(createError('Invalid or expired token', 401));
    }
    next(error);
  }
};

/**
 * Multi-factor authentication middleware
 */
export const requireMFA = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw createError('Authentication required', 401);
    }

    // Check if MFA is enabled for user
    if (!req.user.mfaEnabled) {
      return next(); // MFA not required if not enabled
    }

    // Check if MFA is already verified for this session
    if (req.user.mfaVerified) {
      return next();
    }

    const mfaToken = req.headers['x-mfa-token'] as string;
    if (!mfaToken) {
      throw createError('MFA token required', 403, { mfaRequired: true });
    }

    // Get user's MFA secret
    const user = await prisma.user.findUnique({
      where: { id: req.user.id }
    });

    if (!user?.mfaSecret) {
      throw createError('MFA not properly configured', 403);
    }

    // Verify TOTP token
    const verified = speakeasy.totp.verify({
      secret: user.mfaSecret,
      encoding: 'base32',
      token: mfaToken,
      window: 2 // Allow 2 time steps tolerance
    });

    if (!verified) {
      await auditLogger.logSecurityViolation(req, 'INVALID_MFA_TOKEN', {
        userId: req.user.id,
        providedToken: mfaToken.substring(0, 2) + '****'
      });
      throw createError('Invalid MFA token', 403);
    }

    // Mark MFA as verified for this session
    await prisma.session.update({
      where: { id: req.user.sessionId },
      data: { mfaVerified: true }
    });

    req.user.mfaVerified = true;

    await auditLogger.logEvent({
      eventType: AuditEventType.ACCESS_GRANTED,
      userId: req.user.id,
      userEmail: req.user.email,
      outcome: 'SUCCESS',
      details: { mfaVerified: true }
    });

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Permission-based authorization middleware
 */
export const requirePermission = (permission: Permission) => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw createError('Authentication required', 401);
      }

      if (!req.user.permissions.includes(permission)) {
        await auditLogger.logEvent({
          eventType: AuditEventType.ACCESS_DENIED,
          userId: req.user.id,
          userEmail: req.user.email,
          resource: req.path,
          action: req.method,
          outcome: 'FAILURE',
          details: { 
            requiredPermission: permission,
            userPermissions: req.user.permissions
          }
        });
        
        throw createError('Insufficient permissions', 403);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Resource ownership validation
 */
export const requireOwnership = (resourceType: string, idParam: string = 'id') => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw createError('Authentication required', 401);
      }

      const resourceId = req.params[idParam];
      if (!resourceId) {
        throw createError('Resource ID required', 400);
      }

      let resource;
      
      switch (resourceType) {
        case 'document':
          resource = await prisma.document.findUnique({
            where: { id: resourceId },
            select: { userId: true }
          });
          break;
        case 'constraint':
          resource = await prisma.constraint.findUnique({
            where: { id: resourceId },
            select: { userId: true }
          });
          break;
        case 'analysis':
          resource = await prisma.analysis.findUnique({
            where: { id: resourceId },
            select: { userId: true }
          });
          break;
        default:
          throw createError('Unknown resource type', 400);
      }

      if (!resource) {
        throw createError(`${resourceType} not found`, 404);
      }

      if (resource.userId !== req.user.id && !req.user.permissions.includes(Permission.ADMIN_SYSTEM)) {
        await auditLogger.logEvent({
          eventType: AuditEventType.ACCESS_DENIED,
          userId: req.user.id,
          userEmail: req.user.email,
          resource: `${resourceType}:${resourceId}`,
          action: req.method,
          outcome: 'FAILURE',
          details: { 
            reason: 'Not resource owner',
            resourceOwnerId: resource.userId
          }
        });
        
        throw createError('Access denied: not resource owner', 403);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Rate limiting per user
 */
export const rateLimitPerUser = (maxRequests: number, windowMs: number) => {
  const requestCounts = new Map<string, { count: number; resetTime: number }>();

  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return next();
      }

      const now = Date.now();
      const userKey = `${userId}:${req.path}`;
      const userLimit = requestCounts.get(userKey);

      if (!userLimit || now > userLimit.resetTime) {
        requestCounts.set(userKey, {
          count: 1,
          resetTime: now + windowMs
        });
        return next();
      }

      if (userLimit.count >= maxRequests) {
        await auditLogger.logEvent({
          eventType: AuditEventType.RATE_LIMIT_EXCEEDED,
          userId: req.user.id,
          userEmail: req.user.email,
          resource: req.path,
          action: req.method,
          outcome: 'FAILURE',
          details: {
            maxRequests,
            windowMs,
            currentCount: userLimit.count
          }
        });

        throw createError('Rate limit exceeded', 429);
      }

      userLimit.count++;
      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Session management utilities
 */
export const createSession = async (
  userId: string,
  req: Request,
  mfaVerified: boolean = false
): Promise<{ token: string; session: any }> => {
  // Generate JWT token
  const token = jwt.sign(
    { userId },
    process.env.JWT_SECRET!,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

  // Create session record
  const session = await prisma.session.create({
    data: {
      userId,
      token,
      ipAddress: getClientIP(req),
      userAgent: req.get('User-Agent') || 'Unknown',
      mfaVerified,
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      isActive: true,
      lastActivity: new Date()
    }
  });

  return { token, session };
};

export const revokeSession = async (sessionId: string): Promise<void> => {
  const session = await prisma.session.findUnique({
    where: { id: sessionId }
  });

  if (session) {
    // Mark session as inactive
    await prisma.session.update({
      where: { id: sessionId },
      data: { isActive: false }
    });

    // Add token to blacklist
    await prisma.blacklistedToken.create({
      data: {
        token: session.token,
        expires: session.expires
      }
    });
  }
};

export const revokeAllUserSessions = async (userId: string): Promise<void> => {
  const sessions = await prisma.session.findMany({
    where: { userId, isActive: true }
  });

  // Mark all sessions as inactive
  await prisma.session.updateMany({
    where: { userId, isActive: true },
    data: { isActive: false }
  });

  // Add all tokens to blacklist
  if (sessions.length > 0) {
    await prisma.blacklistedToken.createMany({
      data: sessions.map(session => ({
        token: session.token,
        expires: session.expires
      }))
    });
  }
};

/**
 * MFA setup utilities
 */
export const setupMFA = async (userId: string): Promise<{ secret: string; qrCode: string }> => {
  const user = await prisma.user.findUnique({
    where: { id: userId }
  });

  if (!user) {
    throw new Error('User not found');
  }

  const secret = speakeasy.generateSecret({
    name: `Financial Analyzer (${user.email})`,
    issuer: 'Financial Analyzer'
  });

  // Store secret temporarily (not activated until verified)
  await prisma.user.update({
    where: { id: userId },
    data: { mfaTempSecret: secret.base32 }
  });

  const qrCode = await QRCode.toDataURL(secret.otpauth_url!);

  return {
    secret: secret.base32,
    qrCode
  };
};

export const enableMFA = async (userId: string, token: string): Promise<boolean> => {
  const user = await prisma.user.findUnique({
    where: { id: userId }
  });

  if (!user?.mfaTempSecret) {
    throw new Error('MFA setup not initiated');
  }

  const verified = speakeasy.totp.verify({
    secret: user.mfaTempSecret,
    encoding: 'base32',
    token,
    window: 2
  });

  if (verified) {
    await prisma.user.update({
      where: { id: userId },
      data: {
        mfaSecret: user.mfaTempSecret,
        mfaTempSecret: null,
        mfaEnabled: true
      }
    });

    return true;
  }

  return false;
};

/**
 * Utility functions
 */
function getClientIP(req: Request): string {
  return (req.headers['x-forwarded-for'] as string)?.split(',')[0] ||
         req.headers['x-real-ip'] as string ||
         req.connection.remoteAddress ||
         req.socket.remoteAddress ||
         'unknown';
}