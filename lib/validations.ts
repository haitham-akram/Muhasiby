import { z } from "zod";

export const TransactionSchema = z
  .object({
    buyerName: z.string().min(2),
    items: z.string().min(3),
    paymentMethod: z.string().min(1),
    amount: z.number().positive(),
    status: z.enum(["CONFIRMED", "PENDING", "CANCELLED"]),
    buyerPhone: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.status === "PENDING" && (!data.buyerPhone || data.buyerPhone.length < 7)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Phone is required for pending payments",
        path: ["buyerPhone"],
      });
    }
  });
