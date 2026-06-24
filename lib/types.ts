export type TransactionStatus = "CONFIRMED" | "PENDING" | "CANCELLED";

export type PaymentSplit = {
  id?: string;
  method: string;
  amount: number;
};

export type Transaction = {
  id: string;
  sessionId: string;
  buyerName: string;
  buyerPhone: string | null;
  items: string;
  paymentMethod: string;
  paymentSplits?: PaymentSplit[];
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

export type BillItem = {
  id: string;
  billId: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
};

export type Bill = {
  id: string;
  providerId: string;
  totalAmount: number;
  status: "UNPAID" | "PARTIAL" | "PAID";
  date: string;
  createdAt: string;
  updatedAt: string;
  items?: BillItem[];
};

export type ProviderPayment = {
  id: string;
  providerId: string;
  amount: number;
  date: string;
  createdAt: string;
};

export type Provider = {
  id: string;
  name: string;
  phone: string | null;
  totalDebt: number; // calculated field
  billsCount?: number;
  paymentsCount?: number;
  createdAt: string;
  updatedAt: string;
  bills?: Bill[];
  payments?: ProviderPayment[];
};
