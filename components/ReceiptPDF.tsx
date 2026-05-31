import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import { Transaction } from '@/lib/types'
import { format } from 'date-fns'
import '@/lib/pdf-fonts'

// Create styles for the PDF
const styles = StyleSheet.create({
  page: { padding: 30, fontSize: 12, fontFamily: 'Cairo' },
  header: { fontSize: 20, marginBottom: 20, textAlign: 'center', fontWeight: 'bold' },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
    paddingBottom: 5,
  },
  label: { color: '#6B6B6B' },
  value: { fontWeight: 'bold' },
  footer: { marginTop: 30, textAlign: 'center', fontSize: 10, color: '#A0A0A0' },
})

export const ReceiptPDF = ({ transaction }: { transaction: Transaction }) => (
  <Document>
    <Page size="A5" style={styles.page}>
      <Text style={styles.header}>Transaction Receipt</Text>

      <View style={styles.row}>
        <Text style={styles.label}>Transaction ID</Text>
        <Text style={styles.value}>{transaction.id}</Text>
      </View>

      <View style={styles.row}>
        <Text style={styles.label}>Date</Text>
        <Text style={styles.value}>{format(new Date(transaction.createdAt), 'dd MMM yyyy, HH:mm')}</Text>
      </View>

      <View style={styles.row}>
        <Text style={styles.label}>Buyer Name</Text>
        <Text style={styles.value}>{transaction.buyerName}</Text>
      </View>

      {transaction.buyerPhone && (
        <View style={styles.row}>
          <Text style={styles.label}>Phone Number</Text>
          <Text style={styles.value}>{transaction.buyerPhone}</Text>
        </View>
      )}

      <View style={styles.row}>
        <Text style={styles.label}>Items</Text>
        <Text style={styles.value}>{transaction.items}</Text>
      </View>

      <View style={styles.row}>
        <Text style={styles.label}>Payment Method</Text>
        <Text style={styles.value}>{transaction.paymentMethod}</Text>
      </View>

      <View style={styles.row}>
        <Text style={styles.label}>Status</Text>
        <Text style={styles.value}>{transaction.status}</Text>
      </View>

      <View style={[styles.row, { borderBottomWidth: 0, marginTop: 10 }]}>
        <Text style={[styles.label, { fontSize: 16, color: '#000' }]}>Total Amount</Text>
        <Text style={[styles.value, { fontSize: 16 }]}>{transaction.amount.toFixed(2)}</Text>
      </View>

      <Text style={styles.footer}>Thank you for your business!</Text>
    </Page>
  </Document>
)
