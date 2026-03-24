import { Router, type Request, type Response } from "express";
import { validateBody } from "../middleware/validate.js";
import { createApiKeyMiddleware } from "../middleware/auth.js";
import { loadApiKeys } from "../config/apiKeys.js";
import {
  createCreditLineSchema,
  drawSchema,
  repaySchema,
} from "../schemas/index.js";
import type {
  CreateCreditLineBody,
  DrawBody,
  RepayBody,
} from "../schemas/index.js";
import { ok, fail } from "../utils/response.js";
import {
  listCreditLines,
  getCreditLine,
  suspendCreditLine,
  closeCreditLine,
  getTransactions,
  CreditLineNotFoundError,
  InvalidTransitionError,
  type TransactionType,
} from "../services/creditService.js";

export const creditRouter = Router();

const requireApiKey = createApiKeyMiddleware(() => loadApiKeys());

const VALID_TRANSACTION_TYPES: readonly TransactionType[] = [
  "draw",
  "repayment",
  "status_change",
];

function handleServiceError(err: unknown, res: Response): void {
  if (err instanceof CreditLineNotFoundError) {
    fail(res, err.message, 404);
    return;
  }

  if (err instanceof InvalidTransitionError) {
    fail(res, err.message, 409);
    return;
  }

  fail(res, "Internal server error", 500);
}

// Public endpoints

creditRouter.get("/lines", (_req: Request, res: Response): void => {
  ok(res, { creditLines: listCreditLines() });
});

creditRouter.get("/lines/:id", (req: Request, res: Response): void => {
  const id = req.params.id;
  const line = getCreditLine(id);

  if (!line) {
    fail(res, "Credit line not found", 404);
    return;
  }

  ok(res, line);
});

creditRouter.post(
  "/lines",
  validateBody(createCreditLineSchema),
  (req: Request, res: Response): void => {
    const { walletAddress, requestedLimit } = req.body as CreateCreditLineBody;

    res.status(201).json({
      id: "placeholder-id",
      walletAddress,
      requestedLimit,
      status: "pending",
      message:
        "Credit line creation not yet implemented; placeholder response.",
    });
  },
);

creditRouter.post(
  "/lines/:id/draw",
  validateBody(drawSchema),
  (req: Request, res: Response): void => {
    const { amount } = req.body as DrawBody;

    ok(res, {
      id: req.params.id,
      amount,
      message: "Draw not yet implemented; placeholder response.",
    });
  },
);

creditRouter.post(
  "/lines/:id/repay",
  validateBody(repaySchema),
  (req: Request, res: Response): void => {
    const { amount } = req.body as RepayBody;

    ok(res, {
      id: req.params.id,
      amount,
      message: "Repay not yet implemented; placeholder response.",
    });
  },
);

creditRouter.get(
  "/lines/:id/transactions",
  (req: Request, res: Response): void => {
    const id = req.params.id;
    const { type, from, to, page: pageParam, limit: limitParam } = req.query;

    if (
      typeof type === "string" &&
      !VALID_TRANSACTION_TYPES.includes(type as TransactionType)
    ) {
      fail(
        res,
        `Invalid type filter. Must be one of: ${VALID_TRANSACTION_TYPES.join(", ")}.`,
        400,
      );
      return;
    }

    if (typeof from === "string" && Number.isNaN(new Date(from).getTime())) {
      fail(res, "Invalid 'from' date. Must be a valid ISO 8601 date.", 400);
      return;
    }

    if (typeof to === "string" && Number.isNaN(new Date(to).getTime())) {
      fail(res, "Invalid 'to' date. Must be a valid ISO 8601 date.", 400);
      return;
    }

    const page =
      typeof pageParam === "string" ? Number.parseInt(pageParam, 10) : 1;
    const limit =
      typeof limitParam === "string" ? Number.parseInt(limitParam, 10) : 20;

    if (!Number.isInteger(page) || page < 1) {
      fail(res, "Invalid 'page'. Must be a positive integer.", 400);
      return;
    }

    if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
      fail(res, "Invalid 'limit'. Must be between 1 and 100.", 400);
      return;
    }

    try {
      const result = getTransactions(
        id,
        {
          type:
            typeof type === "string" ? (type as TransactionType) : undefined,
          from: typeof from === "string" ? from : undefined,
          to: typeof to === "string" ? to : undefined,
        },
        { page, limit },
      );

      ok(res, result);
    } catch (err) {
      handleServiceError(err, res);
    }
  },
);

// Admin endpoints

creditRouter.post(
  "/lines/:id/suspend",
  requireApiKey,
  (req: Request, res: Response): void => {
    try {
      const line = suspendCreditLine(req.params.id);
      ok(res, { line, message: "Credit line suspended." });
    } catch (err) {
      handleServiceError(err, res);
    }
  },
);

creditRouter.post(
  "/lines/:id/close",
  requireApiKey,
  (req: Request, res: Response): void => {
    try {
      const line = closeCreditLine(req.params.id);
      ok(res, { line, message: "Credit line closed." });
    } catch (err) {
      handleServiceError(err, res);
    }
  },
);
