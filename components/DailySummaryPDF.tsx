import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import { Transaction, Session } from '@/lib/types'
import { format } from 'date-fns'
import '@/lib/pdf-fonts'

const styles = StyleSheet.create({
  page: { padding: 30, fontSize: 10, fontFamily: 'Cairo' },
  header: { fontSize: 20, marginBottom: 20, textAlign: 'center', fontWeight: 'bold' },
  subHeader: {
    fontSize: 14,
    marginTop: 15,
    marginBottom: 10,
    borderBottomWidth: 1,
    paddingBottom: 5,
    fontWeight: 'bold',
  },
  statsGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  statBox: { padding: 10, backgroundColor: '#F6F6F6', borderRadius: 4, width: '30%' },
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
  col1: { width: '25%' },
  col2: { width: '30%' },
  col3: { width: '20%' },
  col4: { width: '15%' },
  col5: { width: '10%' },
  pendingItem: {
    marginBottom: 10,
    padding: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#F5A623',
    backgroundColor: '#FAFAFA',
  },
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

type DailySummaryPDFProps = {
  transactions: Transaction[]
  session: Session
  cashierName?: string
}

export const DailySummaryPDF = ({ transactions, session, cashierName = 'Cashier' }: DailySummaryPDFProps) => {
  const confirmedTransactions = transactions.filter((t) => t.status === 'CONFIRMED')
  const pendingTransactions = transactions.filter((t) => t.status === 'PENDING')
  const cancelledTransactions = transactions.filter((t) => t.status === 'CANCELLED')

  const totalConfirmed = confirmedTransactions.reduce((acc, t) => acc + t.amount, 0)
  const totalPending = pendingTransactions.reduce((acc, t) => acc + t.amount, 0)
  const totalCancelled = cancelledTransactions.reduce((acc, t) => acc + t.amount, 0)

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.header}>Daily Session Summary</Text>
        <Text style={{ textAlign: 'center', marginBottom: 20, color: '#6B6B6B' }}>
          Date: {format(new Date(session.date), 'dd MMM yyyy')} | Cashier: {cashierName}
        </Text>

        <View style={styles.statsGrid}>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Total Confirmed</Text>
            <Text style={[styles.statValue, { color: '#00A651' }]}>{totalConfirmed.toFixed(2)}</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Total Pending</Text>
            <Text style={[styles.statValue, { color: '#F5A623' }]}>{totalPending.toFixed(2)}</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Total Cancelled</Text>
            <Text style={[styles.statValue, { color: '#E74C3C' }]}>{totalCancelled.toFixed(2)}</Text>
          </View>
        </View>

        {pendingTransactions.length > 0 && (
          <View>
            <Text style={styles.subHeader}>Pending Follow-ups</Text>
            {pendingTransactions.map((t) => (
              <View key={t.id} style={styles.pendingItem}>
                <Text style={{ fontWeight: 'bold' }}>
                  {t.buyerName} - {t.amount.toFixed(2)}
                </Text>
                <Text style={{ color: '#6B6B6B' }}>Phone: {t.buyerPhone || 'N/A'}</Text>
                <Text style={{ color: '#6B6B6B' }}>Method: {t.paymentMethod}</Text>
              </View>
            ))}
          </View>
        )}

        <Text style={styles.subHeader}>All Transactions</Text>
        <View style={styles.table}>
          <View style={styles.trHead}>
            <Text style={[styles.th, styles.col1]}>Buyer</Text>
            <Text style={[styles.th, styles.col2]}>Items</Text>
            <Text style={[styles.th, styles.col3]}>Method</Text>
            <Text style={[styles.th, styles.col4]}>Amount</Text>
            <Text style={[styles.th, styles.col5]}>Status</Text>
          </View>
          {transactions.map((t) => (
            <View key={t.id} style={styles.tr}>
              <Text style={[styles.td, styles.col1]}>{t.buyerName}</Text>
              <Text style={[styles.td, styles.col2]}>{t.items}</Text>
              <Text style={[styles.td, styles.col3]}>{t.paymentMethod}</Text>
              <Text style={[styles.td, styles.col4]}>{t.amount.toFixed(2)}</Text>
              <Text style={[styles.td, styles.col5]}>{t.status.charAt(0)}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.footer}>Generated on {format(new Date(), 'dd MMM yyyy, HH:mm')} by Muhasiby</Text>
      </Page>
    </Document>
  )
}
