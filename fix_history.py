import re

with open('components/HistoryClient.tsx', 'r') as f:
    c = f.read()

if 'useLanguage' not in c:
    c = c.replace('import FilterChip from "@/components/FilterChip";', 'import FilterChip from "@/components/FilterChip";\nimport { useLanguage } from "@/app/providers";')
    c = c.replace('export default function HistoryClient() {', 'export default function HistoryClient() {\n  const { t } = useLanguage();')

c = c.replace('"text-3xl font-semibold">History</h1>', '"text-3xl font-semibold">{t("history.title")}</h1>')
c = c.replace('Search past sessions and filter transactions.', '{t("history.subtitle")}')
c = c.replace('Search: ${search}', '${t("filterBar.search")}: ${search}')
c = c.replace('Status: ${status}', '${t("filterBar.status")}: ${status}')
c = c.replace('Method: ${method}', '${t("filterBar.paymentMethod")}: ${method}')
c = c.replace('From: ${from}', '${t("filterBar.from")}: ${from}')
c = c.replace('To: ${to}', '${t("filterBar.to")}: ${to}')
c = c.replace('{results.length} transactions found', '{results.length} {t("history.transactionsFound")}')
c = c.replace('<th className="px-4 py-3">Buyer</th>', '<th className="px-4 py-3">{t("transactionTable.buyerName")}</th>')
c = c.replace('<th className="px-4 py-3">Amount</th>', '<th className="px-4 py-3">{t("transactionTable.amount")}</th>')
c = c.replace('<th className="px-4 py-3">Method</th>', '<th className="px-4 py-3">{t("transactionTable.paymentMethod")}</th>')
c = c.replace('<th className="px-4 py-3">Status</th>', '<th className="px-4 py-3">{t("transactionTable.status")}</th>')

with open('components/HistoryClient.tsx', 'w') as f:
    f.write(c)

with open('components/SummaryClient.tsx', 'r') as f:
    cs = f.read()
if 'useLanguage' not in cs:
    cs = cs.replace('import SummaryStats from "@/components/SummaryStats";', 'import SummaryStats from "@/components/SummaryStats";\nimport { useLanguage } from "@/app/providers";')
    cs = cs.replace('export default function SummaryClient() {', 'export default function SummaryClient() {\n  const { t } = useLanguage();')
cs = cs.replace('"text-3xl font-semibold">Summary</h1>', '"text-3xl font-semibold">{t("summary.title")}</h1>')
cs = cs.replace('View daily summaries and download reports.', '{t("summary.subtitle")}')
cs = cs.replace('No sessions found for this period.', '{t("summary.noTransactions")}')
cs = cs.replace('<span className="text-sm font-semibold">Generate PDF</span>', '<span className="text-sm font-semibold">{t("summary.generatePdf")}</span>')

with open('components/SummaryClient.tsx', 'w') as f:
    f.write(cs)

with open('components/CashiersClient.tsx', 'r') as f:
    cc = f.read()

if 'useLanguage' not in cc:
    cc = cc.replace('import React, { useEffect, useState } from "react";', 'import React, { useEffect, useState } from "react";\nimport { useLanguage } from "@/app/providers";')
    cc = cc.replace('export default function CashiersClient() {', 'export default function CashiersClient() {\n  const { t } = useLanguage();')

cc = cc.replace('"text-3xl font-semibold">Manage Cashiers</h1>', '"text-3xl font-semibold">{t("cashiers.title")}</h1>')
cc = cc.replace('Add and remove cashier accounts.', '{t("cashiers.subtitle")}')
cc = cc.replace('Add Cashier', '{t("cashiers.addBtn")}')
cc = cc.replace('>Name<', '>{t("cashiers.name")}<')
cc = cc.replace('>Email<', '>{t("cashiers.email")}<')
cc = cc.replace('>Password<', '>{t("cashiers.password")}<')
cc = cc.replace('>Cancel<', '>{t("cashiers.cancel")}<')
cc = cc.replace('Loading...', '{t("cashiers.loading")}')
cc = cc.replace('No cashiers found.', '{t("cashiers.noCashiers")}')

with open('components/CashiersClient.tsx', 'w') as f:
    f.write(cc)

with open('components/TransactionTable.tsx', 'r') as f:
    ct = f.read()

if 'useLanguage' not in ct:
    ct = ct.replace('import StatusBadge from "@/components/StatusBadge";', 'import StatusBadge from "@/components/StatusBadge";\nimport { useLanguage } from "@/app/providers";')
    ct = ct.replace('export default function TransactionTable({', 'export default function TransactionTable({\n  transactions,\n  onToggleStatus,\n  onDelete,\n}: TransactionTableProps) {\n  const { t } = useLanguage();')
    ct = re.sub(r'export default function TransactionTable\(\{\n  transactions,\n  onToggleStatus,\n  onDelete,\n}: TransactionTableProps\) \{', 'export default function TransactionTable({\n  transactions,\n  onToggleStatus,\n  onDelete,\n}: TransactionTableProps) {\n  const { t } = useLanguage();', ct)
    # wait wait, re.sub above might mess up if the original string isn't exactly that... 
    # lets do safer for transactiontable.tsx

