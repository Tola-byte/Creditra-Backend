import { Router, type Request, type Response } from "express";
import { validateBody } from "../middleware/validate.js";
import { createApiKeyMiddleware } from "../middleware/auth.js";
import { loadApiKeys } from "../config/apiKeys.js";
import { riskEvaluateSchema } from "../schemas/index.js";
import type { RiskEvaluateBody } from "../schemas/index.js";
import {
  evaluateWallet,
  InvalidWalletAddressError,
} from "../services/riskService.js";
import { isValidStellarPublicKey } from "../utils/stellarAddress.js";
import { ok, fail } from "../utils/response.js";

export const riskRouter = Router();

const requireApiKey = createApiKeyMiddleware(() => loadApiKeys());

// Public endpoints

riskRouter.post(
  "/evaluate",
  validateBody(riskEvaluateSchema),
  async (req: Request, res: Response): Promise<void> => {
    const { walletAddress } = req.body as RiskEvaluateBody;

    if (
      typeof walletAddress !== "string" ||
      walletAddress.trim().length === 0
    ) {
      fail(res, "walletAddress is required", 400);
      return;
    }

    const normalizedWalletAddress = walletAddress.trim();

    if (!isValidStellarPublicKey(normalizedWalletAddress)) {
      fail(res, "Invalid wallet address format.", 400);
      return;
    }

    try {
      const result = await evaluateWallet(normalizedWalletAddress);
      ok(res, result);
    } catch (err) {
      if (err instanceof InvalidWalletAddressError) {
        fail(res, err.message, 400);
        return;
      }

      fail(res, "Unable to evaluate wallet at this time.", 500);
    }
  },
);

// Admin endpoints

riskRouter.post(
  "/admin/recalibrate",
  requireApiKey,
  (_req: Request, res: Response): void => {
    ok(res, { message: "Risk model recalibration triggered" });
  },
);
