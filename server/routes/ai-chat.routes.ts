import type { Express, Request, Response } from "express";
import OpenAI from "openai";
import { db } from "../db";
import { leads } from "@shared/schema";
import { env } from "../config/env";
import { logger } from "../utils/logger";
import { z } from "zod";

const aiChatLogger = logger.child({ module: "ai-chat" });

const SYSTEM_PROMPT = `You are a helpful virtual assistant for OSS — Smart Hospitality Platform.
OSS is a modern SaaS platform for hotel owners and property managers. It includes:
- Smart room controls (lights, AC, curtains, smart locks)
- Booking and reservation management
- Guest communication and service requests
- Staff management and role-based access
- Financial management and invoicing
- Dynamic pricing engine
- Analytics and performance dashboards
- Subscription plans: Starter ($79/mo), Growth ($129/mo), Pro ($199/mo)
- 14-day free trial available
- Supports multiple properties in one account

Be concise, friendly, and helpful. Answer questions about features, pricing, and integrations.

IMPORTANT: If the user asks for a demo, trial, or to try the platform, respond ONLY with this exact JSON structure and nothing else:
{"type":"lead_form","message":"I'd love to set up a demo for you! Please share a few details:"}

Do not add any text before or after this JSON when a demo is requested.`;

const messageSchema = z.object({
  message: z.string().min(1).max(2000),
  history: z.array(z.object({
    role: z.enum(["user", "assistant"]),
    content: z.string(),
  })).optional().default([]),
});

const leadSchema = z.object({
  propertyName: z.string().min(1),
  country: z.string().min(1),
  propertyType: z.string().min(1),
  email: z.string().email(),
});

function isDemoRequest(message: string): boolean {
  const lower = message.toLowerCase();
  const demoKeywords = [
    "demo", "trial", "free trial", "try", "test the platform",
    "see the platform", "show me", "get started", "sign up",
    "demo görmək", "sınaq", "cəhd etmək",
  ];
  return demoKeywords.some(kw => lower.includes(kw));
}

export function registerAiChatRoutes(app: Express): void {

  app.post("/api/ai-chat", async (req: Request, res: Response) => {
    try {
      const parsed = messageSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid request body" });
      }

      const { message, history } = parsed.data;

      if (isDemoRequest(message)) {
        return res.json({
          type: "lead_form",
          message: "I'd love to set up a demo for you! Please share a few details:",
        });
      }

      const apiKey = env.OPENAI_API_KEY;
      if (!apiKey) {
        aiChatLogger.warn("OPENAI_API_KEY not configured");
        return res.json({
          type: "message",
          content: "I'm currently offline. Please contact us at support@ossaiproapp.com or click 'Start Free Trial' to get started!",
        });
      }

      const openai = new OpenAI({ apiKey });

      const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
        { role: "system", content: SYSTEM_PROMPT },
        ...history.slice(-10).map(h => ({
          role: h.role as "user" | "assistant",
          content: h.content,
        })),
        { role: "user", content: message },
      ];

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages,
        max_tokens: 500,
        temperature: 0.7,
      });

      const aiContent = completion.choices[0]?.message?.content || "I couldn't generate a response. Please try again.";

      let parsed2: any = null;
      try {
        parsed2 = JSON.parse(aiContent.trim());
      } catch {
        parsed2 = null;
      }

      if (parsed2?.type === "lead_form") {
        return res.json(parsed2);
      }

      res.json({ type: "message", content: aiContent });
    } catch (error: any) {
      aiChatLogger.error({ err: error }, "AI chat error");
      res.status(500).json({
        type: "message",
        content: "Something went wrong. Please try again shortly.",
      });
    }
  });

  app.post("/api/ai-chat/lead", async (req: Request, res: Response) => {
    try {
      const parsed = leadSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid lead data", errors: parsed.error.flatten().fieldErrors });
      }

      const { propertyName, country, propertyType, email } = parsed.data;

      await db.insert(leads).values({
        propertyName,
        country,
        propertyType,
        email,
      });

      aiChatLogger.info({ email, propertyName, country, propertyType }, "New AI chat lead saved");

      res.json({
        type: "message",
        content: `Thank you! We've received your information and will reach out to ${email} shortly to schedule your personalized demo of OSS Smart Hospitality Platform. 🎉`,
      });
    } catch (error: any) {
      aiChatLogger.error({ err: error }, "Failed to save lead");
      res.status(500).json({ message: "Failed to save your information. Please try again." });
    }
  });
}
