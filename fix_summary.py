import re
import json

with open('i18n/en.json', 'r') as f:
    en = json.load(f)
with open('i18n/ar.json', 'r') as f:
    ar = json.load(f)

en["summaryClient"] = {
    "title": "Daily Summary",
    "reviewTotals": "Review today's totals and follow-ups.",
    "noSession": "No session yet.",
    "breakdown": "Breakdown by payment method",
    "noPayments": "No payments yet.",
    "pendingFollowUp": "Pending follow-up",
    "markConfirmed": "Mark confirmed",
    "noPending": "No pending transactions.",
    "recentTransactions": "Recent transactions",
    "noTransactions": "No transactions yet."
}
ar["summaryClient"] = {
    "title": "الملخص اليومي",
    "reviewTotals": "مراجعة إجماليات اليوم والمتابعات.",
    "noSession": "لا توجد جلسة بعد.",
    "breakdown": "تفصيل حسب طريقة الدفع",
    "noPayments": "لا توجد مدفوعات بعد.",
    "pendingFollowUp": "متابعات قيد الانتظار",
    "markConfirmed": "تحديد كمؤكد",
    "noPending": "لا توجد معاملات معلقة.",
    "recentTransactions": "المعاملات الأخيرة",
    "noTransactions": "لا توجد معاملات حتى الآن."
}
with open('i18n/en.json', 'w') as f:
    json.dump(en, f, indent=2)
with open('i18n/ar.json', 'w') as f:
    json.dump(ar, f, indent=2)

with open('components/SummaryClient.tsx', 'r') as f:
    c = f.read()

c = c.replace('"text-3xl font-semibold">Daily Summary</h1>', '"text-3xl font-semibold">{t("summaryClient.title")}</h1>')
c = c.replace('{session ? "Review today\'s totals and follow-ups." : "No session yet."}', '{session ? t("summaryClient.reviewTotals") : t("summaryClient.noSession")}')
c = c.replace('Breakdown by payment method', '{t("summaryClient.breakdown")}')
c = c.replace('No payments yet.', '{t("summaryClient.noPayments")}')
c = c.replace('Pending follow-up', '{t("summaryClient.pendingFollowUp")}')
c = c.replace('>Mark confirmed<', '>{t("summaryClient.markConfirmed")}<')
c = c.replace('No pending transactions.', '{t("summaryClient.noPending")}')
c = c.replace('>Recent transactions<', '>{t("summaryClient.recentTransactions")}<')
c = c.replace('No transactions yet.', '{t("summaryClient.noTransactions")}')
c = c.replace('<th className="px-4 py-3">Buyer</th>', '<th className="px-4 py-3">{t("transactionTable.buyerName")}</th>')
c = c.replace('<th className="px-4 py-3">Phone</th>', '<th className="px-4 py-3">{t("transactionForm.phoneNumber")}</th>')
c = c.replace('<th className="px-4 py-3">Amount</th>', '<th className="px-4 py-3">{t("transactionTable.amount")}</th>')
c = c.replace('<th className="px-4 py-3">Action</th>', '<th className="px-4 py-3">Action</th>') # Keep action English for now or add translation
c = c.replace('<th className="px-4 py-3">Method</th>', '<th className="px-4 py-3">{t("transactionTable.paymentMethod")}</th>')
c = c.replace('<th className="px-4 py-3">Status</th>', '<th className="px-4 py-3">{t("transactionTable.status")}</th>')

with open('components/SummaryClient.tsx', 'w') as f:
    f.write(c)

