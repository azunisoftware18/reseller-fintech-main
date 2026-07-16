import { z } from 'zod';

// CREATE (one-time)
export const createSmtpConfigSchema = z.object({
  smtpHost: z.string().min(3).max(255),
  smtpPort: z.string().min(2).max(10),
  smtpUsername: z.string().min(3).max(255),
  smtpPassword: z.string().min(3).max(255),
  encryptionType: z.enum(['TLS', 'SSL', 'STARTTLS']).optional(),
  fromName: z.string().min(1).max(255),
  fromEmail: z.string().email(),
});

// UPDATE (many times)
export const updateSmtpConfigSchema = z.object({
  smtpHost: z.string().min(3).max(255).optional(),
  smtpPort: z.string().min(2).max(10).optional(),
  smtpUsername: z.string().min(3).max(255).optional(),
  smtpPassword: z.string().min(3).max(255).optional(),
  encryptionType: z.enum(['TLS', 'SSL', 'STARTTLS']).optional(),
  fromName: z.string().min(1).max(255).optional(),
  fromEmail: z.string().email().optional(),
});

export const idParamSchema = z.object({
  id: z.string().uuid('Invalid id'),
});
