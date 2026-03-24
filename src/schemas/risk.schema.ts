import { z } from 'zod';

/** Schema for POST /api/risk/evaluate */
export const riskEvaluateSchema = z.object({
  walletAddress: z
    .string({ required_error: 'walletAddress is required' })
    .min(1, 'walletAddress must not be empty')
    .max(256, 'walletAddress must be at most 256 characters'),
  forceRefresh: z.boolean().optional(),
}).strict();

export type RiskEvaluateBody = z.infer<typeof riskEvaluateSchema>;

/** Schema for GET /api/risk/wallet/:walletAddress/history (pagination query) */
export const riskHistoryQuerySchema = z.object({
  offset: z.coerce.number().int().min(0).optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
}).strict();

export type RiskHistoryQuery = z.infer<typeof riskHistoryQuerySchema>;
