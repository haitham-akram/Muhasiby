import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import { Bill, Provider, ProviderPayment } from '@/lib/types'
import { format } from 'date-fns'
import '@/lib/pdf-fonts'
import en from '@/i18n/en.json'
import ar from '@/i18n/ar.json'

const styles = StyleSheet.create({
  page: { padding: 30, fontSize: 10, fontFamily: 'Cairo' },
  header: { fontSize: 20, marginBottom: 5, textAlign: 'center', fontWeight: 'bold' },
  subTitle: { fontSize: 12, marginBottom: 20, textAlign: 'center', color: '#6B6B6B' },
  sectionHeader: {
    fontSize: 14,
    marginTop: 15,
    marginBottom: 10,
    borderBottomWidth: 1,
    paddingBottom: 5,
    fontWeight: 'bold',
  },
  statsGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  statBox: { padding: 10, backgroundColor: '#F6F6F6', borderRadius: 4, width: '48%' },
  statLabel: { color: '#6B6B6B', fontSize: 10, marginBottom: 5 },
  statValue: { fontSize: 14, fontWeight: 'bold' },
  table: {
    display: 'flex',
    width: 'auto',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#E5E5E5',
    marginBottom: 20,
  },
  trHead: { flexDirection: 'row', backgroundColor: '#F6F6F6', borderBottomWidth: 1, borderBottomColor: '#E5E5E5' },
  tr: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#E5E5E5' },
  th: { padding: 5, fontWeight: 'bold', fontSize: 9 },
  td: { padding: 5, fontSize: 9 },
  colDate: { width: '25%' },
  colType: { width: '25%' },
  colStatus: { width: '25%' },
  colAmount: { width: '25%' },
  colDesc: { width: '40%' },
  colQty: { width: '20%' },
  colPrice: { width: '20%' },
  colTotal: { width: '20%' },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
    textAlign: 'center',
    fontSize: 10,
    color: '#A0A0A0',
  },
})

export const ProviderLedgerPDF = ({
  provider,
  bills,
  payments,
  lang = 'en',
}: {
  provider: Provider
  bills: Bill[]
  payments: ProviderPayment[]
  lang?: 'en' | 'ar'
}) => {
  const dict = lang === 'ar' ? ar : en
  const totalBills = bills.reduce((sum, b) => sum + b.totalAmount, 0)
  const totalPayments = payments.reduce((sum, p) => sum + p.amount, 0)
  const debt = totalBills - totalPayments

  const ledger = [
    ...bills.map((b) => ({ ...b, type: 'BILL' as const })),
    ...payments.map((p) => ({ ...p, type: 'PAYMENT' as const })),
  ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.header}>{dict.providers.title} - {provider.name}</Text>
        <Text style={styles.subTitle}>{provider.phone}</Text>

        <View style={styles.statsGrid}>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>{dict.providers.totalDebt}</Text>
            <Text style={[styles.statValue, { color: debt > 0 ? '#E74C3C' : '#00A651' }]}>
              {debt.toFixed(2)}
            </Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>{dict.providers.billsCount}</Text>
            <Text style={styles.statValue}>{bills.length}</Text>
          </View>
        </View>

        <Text style={styles.sectionHeader}>{dict.providers.title}</Text>
        <View style={styles.table}>
          <View style={styles.trHead}>
            <Text style={[styles.th, styles.colDate]}>{dict.providers.date}</Text>
            <Text style={[styles.th, styles.colType]}>Type</Text>
            <Text style={[styles.th, styles.colStatus]}>{dict.providers.status}</Text>
            <Text style={[styles.th, styles.colAmount]}>{dict.providers.amount}</Text>
          </View>
          {ledger.map((item, idx) => {
            const isBill = 'status' in item && typeof (item as Bill).status === 'string';
            return (
              <View key={idx} style={styles.tr}>
                <Text style={[styles.td, styles.colDate]}>{format(new Date(item.date), 'dd MMM yyyy')}</Text>
                <Text style={[styles.td, styles.colType]}>{item.type === 'BILL' ? dict.providers.bills : dict.providers.payments}</Text>
                <Text style={[styles.td, styles.colStatus]}>{isBill ? (item as Bill).status : 'COMPLETED'}</Text>
                <Text style={[styles.td, styles.colAmount]}>
                  {item.type === 'BILL' ? (item as Bill).totalAmount.toFixed(2) : `-${(item as ProviderPayment).amount.toFixed(2)}`}
                </Text>
              </View>
            );
          })}
        </View>
        <Text style={styles.footer}>Generated on {format(new Date(), 'dd MMM yyyy, HH:mm')} by Muhasiby</Text>
      </Page>
    </Document>
  )
}

export const SingleBillPDF = ({ bill, provider, lang = 'en' }: { bill: Bill; provider: Provider; lang?: 'en' | 'ar' }) => {
  const dict = lang === 'ar' ? ar : en
  const items = bill.items || []

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.header}>{dict.providers.bills}</Text>
        <View style={{ flexDirection: 'row', justifyContent: 'center', marginBottom: 20 }}>
          <Text style={{ fontSize: 12, color: '#6B6B6B' }}>
            {provider.name}
          </Text>
          <Text style={{ fontSize: 12, color: '#6B6B6B', marginHorizontal: 5 }}>|</Text>
          <Text style={{ fontSize: 12, color: '#6B6B6B' }}>
            {format(new Date(bill.createdAt || bill.date), 'dd MMM yyyy, HH:mm')}
          </Text>
        </View>

        <View style={styles.table}>
          <View style={styles.trHead}>
            <Text style={[styles.th, styles.colDesc]}>{dict.providers.description}</Text>
            <Text style={[styles.th, styles.colQty]}>{dict.providers.quantity}</Text>
            <Text style={[styles.th, styles.colPrice]}>{dict.providers.unitPrice}</Text>
            <Text style={[styles.th, styles.colTotal]}>{dict.providers.total}</Text>
          </View>
          {items.map((item) => (
            <View key={item.id} style={styles.tr}>
              <Text style={[styles.td, styles.colDesc]}>{item.description}</Text>
              <Text style={[styles.td, styles.colQty]}>{item.quantity}</Text>
              <Text style={[styles.td, styles.colPrice]}>{item.unitPrice.toFixed(2)}</Text>
              <Text style={[styles.td, styles.colTotal]}>{item.total.toFixed(2)}</Text>
            </View>
          ))}
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 10 }}>
          <Text style={{ fontWeight: 'bold', fontSize: 14 }}>
            {dict.providers.totalAmount}: {bill.totalAmount.toFixed(2)}
          </Text>
        </View>
        
        <Text style={styles.footer}>Generated on {format(new Date(), 'dd MMM yyyy, HH:mm')} by Muhasiby</Text>
      </Page>
    </Document>
  )
}
