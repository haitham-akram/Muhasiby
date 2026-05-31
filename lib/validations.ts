import { z } from "zod";

const BaseTransactionSchema = z.object({
  buyerName: z.string().min(2),
  items: z.string().min(3),
  paymentMethod: z.string().min(1),
  amount: z.number().positive(),
  status: z.enum(["CONFIRMED", "PENDING", "CANCELLED"]),
  buyerPhone: z.string().optional(),
});

const pendingPhoneRefine = (
  data: { status?: string; buyerPhone?: string | undefined },
  ctx: z.RefinementCtx,
  requirePhone: boolean
) => {
  if (data.status === "PENDING") {
    if (!data.buyerPhone && requirePhone) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Phone is required for pending payments",
        path: ["buyerPhone"],
      });
    } else if (data.buyerPhone && data.buyerPhone.length < 7) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Phone must be at least 7 digits for pending payments",
        path: ["buyerPhone"],
      });
    }
  }
};

export const TransactionSchema = BaseTransactionSchema.superRefine((data, ctx) =>
  pendingPhoneRefine(data, ctx, true)
);

export const TransactionCreateSchema = BaseTransactionSchema.extend({
  sessionId: z.string().min(1),
}).superRefine((data, ctx) => pendingPhoneRefine(data, ctx, true));

export const TransactionUpdateSchema = BaseTransactionSchema.partial().superRefine(
  (data, ctx) => pendingPhoneRefine(data, ctx, false)
);
