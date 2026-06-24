import { z } from "zod";

export const PaymentSplitSchema = z.object({
  method: z.string().min(1),
  amount: z.number().positive(),
});

const BaseTransactionSchema = z.object({
  buyerName: z.string().min(2),
  items: z.string().min(3),
  paymentMethod: z.string().min(1),
  paymentSplits: z.array(PaymentSplitSchema).optional(),
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

export const ProductSchema = z.object({
  name: z.string().min(2),
  defaultPrice: z.number().min(0),
});

export const TransactionItemSchema = z.object({
  productId: z.string().optional(),
  name: z.string().min(1),
  quantity: z.number().int().positive(),
  unitPrice: z.number().min(0),
  totalPrice: z.number().min(0),
});

export const TransactionSchema = BaseTransactionSchema.extend({
  transactionItems: z.array(TransactionItemSchema).optional(),
}).superRefine((data, ctx) =>
  pendingPhoneRefine(data, ctx, true)
);

export const TransactionCreateSchema = BaseTransactionSchema.extend({
  sessionId: z.string().min(1),
  transactionItems: z.array(TransactionItemSchema).optional(),
}).superRefine((data, ctx) => pendingPhoneRefine(data, ctx, true));

export const TransactionUpdateSchema = BaseTransactionSchema.partial().superRefine(
  (data, ctx) => pendingPhoneRefine(data, ctx, false)
);

