/**
 * Encryption and Security Utilities
 * Provides data encryption, hashing, and security functions
 */

import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { logger } from '../index';

// Encryption configuration
const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32;
const IV_LENGTH = 16;
const TAG_LENGTH = 16;
const SALT_ROUNDS = 12;

// Get encryption key from environment or generate
const getEncryptionKey = (): Buffer => {
  const key = process.env.ENCRYPTION_KEY;
  if (key) {
    return Buffer.from(key, 'hex');
  }
  
  // Generate and log warning in development
  const generatedKey = crypto.randomBytes(KEY_LENGTH);
  if (process.env.NODE_ENV !== 'production') {
    logger.warn('Using generated encryption key. Set ENCRYPTION_KEY environment variable for production.');
    logger.warn(`Generated key: ${generatedKey.toString('hex')}`);
  }
  
  return generatedKey;
};

const ENCRYPTION_KEY = getEncryptionKey();

/**
 * Encrypt sensitive data using AES-256-GCM
 */
export const encrypt = (text: string): { encrypted: string; iv: string; tag: string } => {
  try {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipherGCM(ALGORITHM, ENCRYPTION_KEY, iv);
    cipher.setAAD(Buffer.from('financial-analyzer', 'utf8'));
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const tag = cipher.getAuthTag();
    
    return {
      encrypted,
      iv: iv.toString('hex'),
      tag: tag.toString('hex')
    };
  } catch (error) {
    logger.error('Encryption failed:', error);
    throw new Error('Failed to encrypt data');
  }
};

/**
 * Decrypt sensitive data using AES-256-GCM
 */
export const decrypt = (encrypted: string, iv: string, tag: string): string => {
  try {
    const decipher = crypto.createDecipherGCM(ALGORITHM, ENCRYPTION_KEY, Buffer.from(iv, 'hex'));
    decipher.setAAD(Buffer.from('financial-analyzer', 'utf8'));
    decipher.setAuthTag(Buffer.from(tag, 'hex'));
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    logger.error('Decryption failed:', error);
    throw new Error('Failed to decrypt data');
  }
};

/**
 * Hash password with bcrypt
 */
export const hashPassword = async (password: string): Promise<string> => {
  try {
    return await bcrypt.hash(password, SALT_ROUNDS);
  } catch (error) {
    logger.error('Password hashing failed:', error);
    throw new Error('Failed to hash password');
  }
};

/**
 * Verify password against hash
 */
export const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
  try {
    return await bcrypt.compare(password, hash);
  } catch (error) {
    logger.error('Password verification failed:', error);
    return false;
  }
};

/**
 * Generate secure random token
 */
export const generateSecureToken = (length: number = 32): string => {
  return crypto.randomBytes(length).toString('hex');
};

/**
 * Generate cryptographically secure random string
 */
export const generateSecureId = (length: number = 16): string => {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  
  for (let i = 0; i < length; i++) {
    const randomIndex = crypto.randomInt(0, charset.length);
    result += charset[randomIndex];
  }
  
  return result;
};

/**
 * Hash sensitive data with SHA-256
 */
export const hashData = (data: string): string => {
  return crypto.createHash('sha256').update(data).digest('hex');
};

/**
 * Create HMAC signature
 */
export const createHMAC = (data: string, secret?: string): string => {
  const key = secret || process.env.HMAC_SECRET || 'default-hmac-secret';
  return crypto.createHmac('sha256', key).update(data).digest('hex');
};

/**
 * Verify HMAC signature
 */
export const verifyHMAC = (data: string, signature: string, secret?: string): boolean => {
  const expectedSignature = createHMAC(data, secret);
  return crypto.timingSafeEqual(
    Buffer.from(signature, 'hex'),
    Buffer.from(expectedSignature, 'hex')
  );
};

/**
 * Sanitize and mask sensitive data for logging
 */
export const maskSensitiveData = (data: any): any => {
  if (typeof data !== 'object' || data === null) {
    return data;
  }

  const sensitiveFields = [
    'password', 'token', 'secret', 'key', 'authorization',
    'cookie', 'session', 'ssn', 'social', 'credit', 'card',
    'bank', 'account', 'routing', 'pin', 'api_key', 'apiKey'
  ];

  const masked = { ...data };
  
  for (const [key, value] of Object.entries(masked)) {
    const lowerKey = key.toLowerCase();
    
    if (sensitiveFields.some(field => lowerKey.includes(field))) {
      if (typeof value === 'string' && value.length > 0) {
        masked[key] = value.substring(0, 2) + '*'.repeat(value.length - 2);
      } else {
        masked[key] = '[MASKED]';
      }
    } else if (typeof value === 'object' && value !== null) {
      masked[key] = maskSensitiveData(value);
    }
  }
  
  return masked;
};

/**
 * Encrypt database field
 */
export const encryptDatabaseField = (value: string | null): string | null => {
  if (!value) return null;
  
  try {
    const encrypted = encrypt(value.toString());
    return JSON.stringify(encrypted);
  } catch (error) {
    logger.error('Database field encryption failed:', error);
    throw new Error('Failed to encrypt database field');
  }
};

/**
 * Decrypt database field
 */
export const decryptDatabaseField = (encryptedValue: string | null): string | null => {
  if (!encryptedValue) return null;
  
  try {
    const parsed = JSON.parse(encryptedValue);
    return decrypt(parsed.encrypted, parsed.iv, parsed.tag);
  } catch (error) {
    logger.error('Database field decryption failed:', error);
    throw new Error('Failed to decrypt database field');
  }
};

/**
 * Secure data comparison (timing-safe)
 */
export const secureCompare = (a: string, b: string): boolean => {
  try {
    return crypto.timingSafeEqual(
      Buffer.from(a, 'utf8'),
      Buffer.from(b, 'utf8')
    );
  } catch {
    return false;
  }
};

/**
 * Generate API key with specific format
 */
export const generateAPIKey = (prefix: string = 'fa'): string => {
  const timestamp = Date.now().toString(36);
  const random = generateSecureId(24);
  return `${prefix}_${timestamp}_${random}`;
};

/**
 * Validate API key format
 */
export const validateAPIKeyFormat = (apiKey: string): boolean => {
  const apiKeyRegex = /^[a-zA-Z0-9]{2,10}_[a-zA-Z0-9]+_[a-zA-Z0-9]{24}$/;
  return apiKeyRegex.test(apiKey);
};

/**
 * Rate limiting key generation
 */
export const generateRateLimitKey = (identifier: string, endpoint: string): string => {
  return `rate_limit:${hashData(identifier)}:${endpoint}`;
};

/**
 * Data anonymization for compliance
 */
export const anonymizeEmail = (email: string): string => {
  const [username, domain] = email.split('@');
  if (username.length <= 2) {
    return `${username[0]}***@${domain}`;
  }
  return `${username.substring(0, 2)}${'*'.repeat(username.length - 2)}@${domain}`;
};

/**
 * Generate session token with expiry
 */
export const generateSessionToken = (): { token: string; expires: Date } => {
  const token = generateSecureToken(48);
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
  
  return { token, expires };
};

/**
 * Validate input against common security threats
 */
export const validateInput = (input: string): { isValid: boolean; threats: string[] } => {
  const threats: string[] = [];
  
  // SQL injection patterns
  const sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER)\b)/i,
    /(UNION|OR\s+1=1|AND\s+1=1)/i,
    /('|--|\/\*|\*\/|xp_|sp_)/i
  ];
  
  // XSS patterns
  const xssPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/i,
    /on\w+\s*=/i,
    /<iframe\b/i
  ];
  
  // Command injection patterns
  const cmdPatterns = [
    /[;&|`$()]/,
    /\b(cat|ls|rm|mkdir|chmod|sudo|su)\b/i
  ];
  
  sqlPatterns.forEach(pattern => {
    if (pattern.test(input)) threats.push('SQL_INJECTION');
  });
  
  xssPatterns.forEach(pattern => {
    if (pattern.test(input)) threats.push('XSS');
  });
  
  cmdPatterns.forEach(pattern => {
    if (pattern.test(input)) threats.push('COMMAND_INJECTION');
  });
  
  return {
    isValid: threats.length === 0,
    threats
  };
};