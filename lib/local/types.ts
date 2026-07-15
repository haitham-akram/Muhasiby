/**
 * Local IndexedDB model types for offline-first storage.
 * Each model mirrors its Prisma counterpart but uses a client-generated
 * `uuid` as the primary key instead of a server-assigned ID.
 */

export type SyncStatus = 'pending' | 'synced' | 'failed'

export interface LocalBase {
  /** Client-generated UUID (primary key in IndexedDB) */
  uuid: string
  /** Server-assigned ID — populated after first successful sync */
  serverId?: string
  syncStatus: SyncStatus
  syncError?: string
  retryCount: number
  updatedAt: string
  createdAt: string
}

export interface LocalSession extends LocalBase {
  date: string
  userId: string
  closedAt?: string
}

export interface LocalTransaction extends LocalBase {
  /** local uuid of the parent session */
  sessionUuid: string
  /** server ID of the parent session — filled when session is synced */
  sessionServerId?: string
  buyerName: string
  buyerPhone?: string
  items: string
  paymentMethod: string
  amount: number
  status: 'CONFIRMED' | 'PENDING' | 'CANCELLED'
}

export interface LocalTransactionItem extends LocalBase {
  transactionUuid: string
  productUuid?: string
  name: string
  quantity: number
  unitCost: number
  unitPrice: number
  totalPrice: number
}

export interface LocalPaymentSplit extends LocalBase {
  transactionUuid: string
  method: string
  amount: number
}

export interface LocalProduct extends LocalBase {
  name: string
  defaultPrice: number
  costPrice: number
  stock: number
  categoryId?: string
  providerId?: string
}

export interface LocalCustomer extends LocalBase {
  name: string
  phone: string
}

export interface LocalProvider extends LocalBase {
  name: string
  phone?: string
}

export interface LocalBill extends LocalBase {
  providerUuid: string
  providerServerId?: string
  totalAmount: number
  status: 'UNPAID' | 'PARTIAL' | 'PAID'
  date: string
}

export interface LocalBillItem extends LocalBase {
  billUuid: string
  productUuid?: string
  description: string
  quantity: number
  unitPrice: number
  sellPrice?: number
  total: number
}

export interface LocalProviderPayment extends LocalBase {
  providerUuid: string
  providerServerId?: string
  amount: number
  date: string
}
