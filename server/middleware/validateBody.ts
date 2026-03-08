import type { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { logger } from "../utils/logger";

export function validateBody(schema: z.ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      logger.warn({ errors: result.error.flatten(), path: req.path }, "Request validation failed");
      return res.status(400).json({ error: "Invalid request data", details: result.error.flatten().fieldErrors });
    }
    req.body = result.data;
    next();
  };
}
