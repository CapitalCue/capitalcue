import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import Joi from 'joi';
import axios from 'axios';
import { PrismaClient } from '@prisma/client';
import { asyncHandler, createError } from '../middleware/error-handler';
import { AuthenticatedRequest } from '../middleware/auth';
import { uploadRateLimiter } from '../middleware/rate-limiter';

const router = Router();
const prisma = new PrismaClient();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = process.env.UPLOAD_DIR || './uploads';
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error as Error, '');
    }
  },
  filename: (req, file, cb) => {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `document-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || '52428800'), // 50MB default
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, Excel, and CSV files are allowed.'));
    }
  }
});

// Validation schemas
const companySchema = Joi.object({
  name: Joi.string().min(1).max(200).required(),
  ticker: Joi.string().max(10).optional(),
  sector: Joi.string().min(1).max(100).required(),
  description: Joi.string().max(1000).optional(),
});

const documentMetadataSchema = Joi.object({
  companyId: Joi.string().optional(),
  documentType: Joi.string().valid('quarterly_report', 'annual_report', 'financial_statement', 'other').required(),
  company: companySchema.optional(),
});

/**
 * POST /api/documents/upload
 * Upload a financial document
 */
router.post('/upload',
  uploadRateLimiter,
  upload.single('document'),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.file) {
      throw createError('No file uploaded', 400);
    }

    const { error } = documentMetadataSchema.validate(req.body);
    if (error) {
      // Clean up uploaded file if validation fails
      await fs.unlink(req.file.path);
      throw createError(error.details[0].message, 400);
    }

    const { companyId, documentType, company } = req.body;
    let finalCompanyId = companyId;

    // Create company if not provided
    if (!finalCompanyId && company) {
      const newCompany = await prisma.company.create({
        data: {
          ...company,
          userId: req.user!.id,
        },
      });
      finalCompanyId = newCompany.id;
    }

    if (!finalCompanyId) {
      await fs.unlink(req.file.path);
      throw createError('Either companyId or company data must be provided', 400);
    }

    // Verify company belongs to user
    const companyExists = await prisma.company.findFirst({
      where: {
        id: finalCompanyId,
        userId: req.user!.id,
      },
    });

    if (!companyExists) {
      await fs.unlink(req.file.path);
      throw createError('Company not found or access denied', 404);
    }

    // Determine file type
    const fileTypeMap: Record<string, 'PDF' | 'EXCEL' | 'CSV'> = {
      'application/pdf': 'PDF',
      'application/vnd.ms-excel': 'EXCEL',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'EXCEL',
      'text/csv': 'CSV',
    };

    const fileType = fileTypeMap[req.file.mimetype];

    // Create document record
    const document = await prisma.document.create({
      data: {
        fileName: req.file.originalname,
        fileType,
        fileSize: req.file.size,
        filePath: req.file.path,
        documentType: documentType.toUpperCase(),
        companyId: finalCompanyId,
        userId: req.user!.id,
        status: 'UPLOADED',
      },
      include: {
        company: {
          select: { name: true, ticker: true, sector: true },
        },
      },
    });

    // Trigger document processing asynchronously
    processDocumentAsync(document.id);

    res.status(201).json({
      success: true,
      message: 'Document uploaded successfully',
      data: { document },
    });
  })
);

/**
 * GET /api/documents
 * Get user's documents with filtering and pagination
 */
router.get('/',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const {
      page = 1,
      limit = 20,
      companyId,
      status,
      documentType,
      search,
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = Math.min(parseInt(limit as string), 100);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {
      userId: req.user!.id,
    };

    if (companyId) where.companyId = companyId;
    if (status) where.status = status;
    if (documentType) where.documentType = documentType;
    if (search) {
      where.OR = [
        { fileName: { contains: search, mode: 'insensitive' } },
        { company: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [documents, totalCount] = await Promise.all([
      prisma.document.findMany({
        where,
        orderBy: { uploadedAt: 'desc' },
        skip,
        take: limitNum,
        include: {
          company: {
            select: { name: true, ticker: true, sector: true },
          },
          _count: {
            select: { analyses: true },
          },
        },
      }),
      prisma.document.count({ where }),
    ]);

    res.json({
      success: true,
      data: documents,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limitNum),
      },
    });
  })
);

/**
 * GET /api/documents/:id
 * Get specific document details
 */
router.get('/:id',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const document = await prisma.document.findFirst({
      where: {
        id: req.params.id,
        userId: req.user!.id,
      },
      include: {
        company: true,
        analyses: {
          orderBy: { startedAt: 'desc' },
          take: 5,
          include: {
            alerts: {
              select: {
                id: true,
                severity: true,
                message: true,
                isAcknowledged: true,
                createdAt: true,
              },
            },
          },
        },
      },
    });

    if (!document) {
      throw createError('Document not found', 404);
    }

    res.json({
      success: true,
      data: { document },
    });
  })
);

/**
 * DELETE /api/documents/:id
 * Delete a document
 */
router.delete('/:id',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const document = await prisma.document.findFirst({
      where: {
        id: req.params.id,
        userId: req.user!.id,
      },
    });

    if (!document) {
      throw createError('Document not found', 404);
    }

    // Delete physical file
    try {
      await fs.unlink(document.filePath);
    } catch (error) {
      console.warn('Failed to delete physical file:', error);
    }

    // Delete from database (cascade will handle related records)
    await prisma.document.delete({
      where: { id: document.id },
    });

    res.json({
      success: true,
      message: 'Document deleted successfully',
    });
  })
);

/**
 * POST /api/documents/:id/process
 * Manually trigger document processing
 */
router.post('/:id/process',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const document = await prisma.document.findFirst({
      where: {
        id: req.params.id,
        userId: req.user!.id,
      },
    });

    if (!document) {
      throw createError('Document not found', 404);
    }

    if (document.status === 'PROCESSING') {
      throw createError('Document is already being processed', 400);
    }

    // Update status to processing
    await prisma.document.update({
      where: { id: document.id },
      data: { status: 'PROCESSING' },
    });

    // Start processing
    processDocumentAsync(document.id);

    res.json({
      success: true,
      message: 'Document processing started',
    });
  })
);

/**
 * GET /api/documents/:id/download
 * Download original document file
 */
router.get('/:id/download',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const document = await prisma.document.findFirst({
      where: {
        id: req.params.id,
        userId: req.user!.id,
      },
    });

    if (!document) {
      throw createError('Document not found', 404);
    }

    try {
      const stats = await fs.stat(document.filePath);
      
      res.setHeader('Content-Disposition', `attachment; filename="${document.fileName}"`);
      res.setHeader('Content-Type', 'application/octet-stream');
      res.setHeader('Content-Length', stats.size);
      
      const fileStream = require('fs').createReadStream(document.filePath);
      fileStream.pipe(res);
    } catch (error) {
      throw createError('File not found on disk', 404);
    }
  })
);

/**
 * Async function to process documents via MCP server
 */
async function processDocumentAsync(documentId: string) {
  try {
    const document = await prisma.document.findUnique({
      where: { id: documentId },
      include: { company: true },
    });

    if (!document) {
      console.error('Document not found for processing:', documentId);
      return;
    }

    // Update status to processing
    await prisma.document.update({
      where: { id: documentId },
      data: { status: 'PROCESSING' },
    });

    // Call document parser MCP server
    const parserUrl = process.env.MCP_DOCUMENT_PARSER_URL || 'http://localhost:8001';
    const response = await axios.post(`${parserUrl}/parse`, {
      document_id: documentId,
      file_path: document.filePath,
      file_type: document.fileType.toLowerCase(),
    }, {
      timeout: 300000, // 5 minutes timeout
    });

    if (response.data.success) {
      // Store extracted metrics
      const { metrics } = response.data.data;
      
      if (metrics && metrics.length > 0) {
        // Create an analysis record to hold the metrics
        const analysis = await prisma.analysis.create({
          data: {
            documentId,
            userId: document.userId,
            status: 'COMPLETED',
            startedAt: new Date(),
            completedAt: new Date(),
          },
        });

        // Store metrics
        await prisma.financialMetric.createMany({
          data: metrics.map((metric: any) => ({
            name: metric.name,
            value: metric.value,
            unit: metric.unit,
            period: metric.period,
            source: metric.source,
            confidence: metric.confidence,
            analysisId: analysis.id,
          })),
        });
      }

      // Update document status
      await prisma.document.update({
        where: { id: documentId },
        data: {
          status: 'PROCESSED',
          processedAt: new Date(),
        },
      });

      console.log('Document processed successfully:', documentId);
    } else {
      throw new Error(response.data.error || 'Processing failed');
    }

  } catch (error) {
    console.error('Document processing failed:', error);
    
    // Update document status to failed
    await prisma.document.update({
      where: { id: documentId },
      data: { status: 'FAILED' },
    });
  }
}

export default router;