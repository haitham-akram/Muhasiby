import Dexie, { type Table } from 'dexie'
import type {
  LocalSession,
  LocalTransaction,
  LocalTransactionItem,
  LocalPaymentSplit,
  LocalProduct,
  LocalCustomer,
  LocalProvider,
  LocalBill,
  LocalBillItem,
  LocalProviderPayment,
} from './types'

export class MuhasibyDB extends Dexie {
  sessions!: Table<LocalSession, string>
  transactions!: Table<LocalTransaction, string>
  transactionItems!: Table<LocalTransactionItem, string>
  paymentSplits!: Table<LocalPaymentSplit, string>
  products!: Table<LocalProduct, string>
  customers!: Table<LocalCustomer, string>
  providers!: Table<LocalProvider, string>
  bills!: Table<LocalBill, string>
  billItems!: Table<LocalBillItem, string>
  providerPayments!: Table<LocalProviderPayment, string>

  constructor() {
    super('MuhasibyOffline')

    this.version(1).stores({
      sessions: 'uuid, syncStatus, userId, date',
      transactions: 'uuid, syncStatus, sessionUuid, status, createdAt',
      transactionItems: 'uuid, syncStatus, transactionUuid',
      paymentSplits: 'uuid, syncStatus, transactionUuid',
      products: 'uuid, syncStatus, name, serverId',
      customers: 'uuid, syncStatus, phone, serverId',
      providers: 'uuid, syncStatus, name, serverId',
      bills: 'uuid, syncStatus, providerUuid, status',
      billItems: 'uuid, syncStatus, billUuid',
      providerPayments: 'uuid, syncStatus, providerUuid',
    })
  }
}

// Singleton — safe to import anywhere on the client
let _db: MuhasibyDB | null = null

export function getDB(): MuhasibyDB {
  if (typeof window === 'undefined') {
    throw new Error('getDB() must only be called on the client side')
  }
  if (!_db) {
    _db = new MuhasibyDB()
  }
  return _db
}
