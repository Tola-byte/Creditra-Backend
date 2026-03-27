import { z } from 'zod';
import { TransactionType } from '../models/Transaction.js';

const numericString = /^\d+(\.\d+)?$/;
const isoDateTime = z.string().datetime({ offset: true });
const positiveIntString = z.coerce.number().int().positive();
const nonNegativeIntString = z.coerce.number().int().min(0);

/** Schema for POST /api/credit/lines — create a credit line */
export const createCreditLineSchema = z.object({
  walletAddress: z
    .string()
    .min(1, 'walletAddress is required')
    .max(256, 'walletAddress must be at most 256 characters'),
  requestedLimit: z
    .string()
    .min(1, 'requestedLimit is required')
    .regex(numericString, 'requestedLimit must be a numeric string'),
}).strict();

export type CreateCreditLineBody = z.infer<typeof createCreditLineSchema>;

/** Schema for GET /api/credit/lines (pagination query) */
export const creditLinesQuerySchema = z.object({
  offset: nonNegativeIntString.optional(),
  limit: positiveIntString.max(100).optional(),
}).strict();

export type CreditLinesQuery = z.infer<typeof creditLinesQuerySchema>;

/** Schema for POST /api/credit/lines/:id/draw — draw from a credit line */
export const drawSchema = z.object({
  amount: z
    .string()
    .min(1, 'amount is required')
    .regex(numericString, 'amount must be a numeric string'),
}).strict();

export type DrawBody = z.infer<typeof drawSchema>;

/** Schema for POST /api/credit/lines/:id/repay — repay a credit line */
export const repaySchema = z.object({
  amount: z
    .string()
    .min(1, 'amount is required')
    .regex(numericString, 'amount must be a numeric string'),
}).strict();

export type RepayBody = z.infer<typeof repaySchema>;

/** Schema for GET /api/credit/lines/:id/transactions (filters + pagination query) */
export const transactionHistoryQuerySchema = z.object({
  type: z.nativeEnum(TransactionType).optional(),
  from: isoDateTime.optional(),
  to: isoDateTime.optional(),
  page: positiveIntString.optional(),
  limit: positiveIntString.max(100).optional(),
}).strict();

export type TransactionHistoryQuery = z.infer<typeof transactionHistoryQuerySchema>;
