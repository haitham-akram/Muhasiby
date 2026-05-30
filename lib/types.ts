export type TransactionStatus = "CONFIRMED" | "PENDING" | "CANCELLED";

export type Transaction = {
  id: string;
  sessionId: string;
  buyerName: string;
  buyerPhone: string | null;
  items: string;
  paymentMethod: string;
  amount: number;
  status: TransactionStatus;
  createdAt: string;
  updatedAt: string;
};

export type Session = {
  id: string;
  date: string;
  closedAt: string | null;
};
