import { z } from 'zod';

/**
 * User-related validation schemas
 */
export const userUpdateSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  bio: z.string().max(200).optional(),
  status: z.enum(['online', 'away', 'busy', 'offline']).optional(),
});

export const userSearchSchema = z.object({
  query: z.string().min(1).max(50),
  type: z.enum(['handle', 'email']).optional().default('handle'),
});

/**
 * Friend request validation schemas
 */
export const friendRequestCreateSchema = z.object({
  toHandle: z.string().min(3).max(20).optional(),
  toEmail: z.string().email().optional(),
  message: z.string().max(200).optional(),
}).refine((data) => data.toHandle || data.toEmail, {
  message: 'Either toHandle or toEmail is required',
});

export const friendRequestUpdateSchema = z.object({
  status: z.enum(['accepted', 'rejected', 'cancelled']),
});

/**
 * Chat validation schemas
 */
export const chatCreateSchema = z.object({
  isGroup: z.boolean().default(false),
  name: z.string().min(1).max(50).optional(),
  // Allow min 1 because the API will include the current user automatically
  participants: z.array(z.string().min(1)).min(1),
});

export const chatUpdateSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  avatar: z.string().url().optional(),
  image: z.string().url().optional(), // allow "image" alias from client
});

export const chatMemberSchema = z.object({
  userId: z.string().min(1),
  role: z.enum(['admin', 'member']).optional().default('member'),
});

/**
 * Message validation schemas
 */
export const messageCreateSchema = z.object({
  chatId: z.string().min(1),
  text: z.string().max(2000).optional(),
  media: z.array(z.object({
    url: z.string().url(),
    publicId: z.string(),
    width: z.number().optional(),
    height: z.number().optional(),
    mime: z.string(),
    size: z.number(),
    filename: z.string(),
  })).optional(),
  replyTo: z.string().min(1).optional(),
}).refine((data) => data.text || (data.media && data.media.length > 0), {
  message: 'Either text or media is required',
});

export const messageUpdateSchema = z.object({
  text: z.string().min(1).max(2000),
  media: z.array(z.object({
    url: z.string().url(),
    publicId: z.string(),
    width: z.number().optional(),
    height: z.number().optional(),
    mime: z.string(),
    size: z.number(),
    filename: z.string(),
  })).optional(),
});

export const messageDeleteSchema = z.object({
  deleteForEveryone: z.boolean().default(false),
});

/**
 * Reaction validation schemas
 */
export const reactionSchema = z.object({
  messageId: z.string().min(1),
  emoji: z.string().min(1).max(10),
});

/**
 * Upload validation schemas
 */
export const uploadSignatureSchema = z.object({
  folder: z.string().default('chat-app'),
  publicId: z.string().optional(),
});

/**
 * Presence validation schemas
 */
export const presenceUpdateSchema = z.object({
  status: z.enum(['online', 'away', 'busy', 'offline']),
});

/**
 * Notification validation schemas
 */
export const notificationUpdateSchema = z.object({
  read: z.boolean(),
});

/**
 * Generic pagination schema
 */
export const paginationSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

/**
 * Search and filter schemas
 */
export const searchSchema = z.object({
  query: z.string().min(1).max(100),
  type: z.enum(['all', 'users', 'chats', 'messages']).optional().default('all'),
});

/**
 * Rate limiting schemas
 */
export const rateLimitSchema = z.object({
  windowMs: z.number().default(15 * 60 * 1000), // 15 minutes
  maxRequests: z.number().default(100),
});

/**
 * Validation helper functions
 */
export const validateRequest = (schema) => {
  return async (req, res, next) => {
    try {
      const validatedData = await schema.parseAsync(req.body);
      req.validatedData = validatedData;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation failed',
          details: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        });
      }
      return res.status(500).json({ error: 'Internal server error' });
    }
  };
};

export const validateQuery = (schema) => {
  return async (req, res, next) => {
    try {
      const validatedData = await schema.parseAsync(req.query);
      req.validatedQuery = validatedData;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Query validation failed',
          details: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        });
      }
      return res.status(500).json({ error: 'Internal server error' });
    }
  };
};

export const validateParams = (schema) => {
  return async (req, res, next) => {
    try {
      const validatedData = await schema.parseAsync(req.params);
      req.validatedParams = validatedData;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Parameter validation failed',
          details: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        });
      }
      return res.status(500).json({ error: 'Internal server error' });
    }
  };
};
