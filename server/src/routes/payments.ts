import { Router } from "express";
import Stripe from "stripe";
import { z } from "zod";
import { env } from "../lib/env.js";
import { requireAuth } from "../middleware/auth.js";

export const paymentsRouter = Router();

const createIntentSchema = z.object({
  amountRub: z.number().int().positive().max(5_000_000)
});

paymentsRouter.post("/stripe/create-intent", requireAuth, async (req, res) => {
  if (!env.STRIPE_SECRET_KEY) {
    return res.status(501).json({ message: "Stripe is not configured" });
  }

  const parsed = createIntentSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Invalid payload" });

  const stripe = new Stripe(env.STRIPE_SECRET_KEY);
  const intent = await stripe.paymentIntents.create({
    amount: parsed.data.amountRub * 100, // копейки
    currency: "rub",
    automatic_payment_methods: { enabled: true }
  });

  return res.json({ clientSecret: intent.client_secret });
});

