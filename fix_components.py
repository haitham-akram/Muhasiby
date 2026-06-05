import os
import glob
import re

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    original = content
    
    if "useLanguage" not in content and 'use client' in content:
        # Add useLanguage import
        content = re.sub(r"('use client';?\n)", r"\1\nimport { useLanguage } from '@/app/providers';\n", content)
        # Inject t into component if it exists
        content = re.sub(r"(export default function \w+\([^)]*\)\s*{)", r"\1\n  const { t } = useLanguage();\n", content)

    # Some custom replaces
    content = content.replace('"text-3xl font-semibold">History</h1>', '"text-3xl font-semibold">{t("history.title")}</h1>')
    content = content.replace('Search past sessions and filter transactions.', '{t("history.subtitle")}')
    content = content.replace('Search: ${search}', '${t("filterBar.search")}: ${search}')
    content = content.replace('Status: ${status}', '${t("filterBar.status")}: ${status}')
    content = content.replace('Method: ${method}', '${t("filterBar.paymentMethod")}: ${method}')
    content = content.replace('From: ${from}', '${t("filterBar.from")}: ${from}')
    content = content.replace('To: ${to}', '${t("filterBar.to")}: ${to}')
    content = content.replace('{results.length} transactions found', '{results.length} {t("history.transactionsFound")}')
    content = content.replace('Search transactions...', '{t("history.searchPlaceholder")}')
    
    # Table headers in history
    content = content.replace('<th className="px-4 py-3">Buyer</th>', '<th className="px-4 py-3">{t("transactionTable.buyerName")}</th>')
    content = content.replace('<th className="px-4 py-3">Amount</th>', '<th className="px-4 py-3">{t("transactionTable.amount")}</th>')
    content = content.replace('<th className="px-4 py-3">Method</th>', '<th className="px-4 py-3">{t("transactionTable.paymentMethod")}</th>')
    content = content.replace('<th className="px-4 py-3">Status</th>', '<th className="px-4 py-3">{t("transactionTable.status")}</th>')

    # Summary texts
    content = content.replace('"text-3xl font-semibold">Summary</h1>', '"text-3xl font-semibold">{t("summary.title")}</h1>')
    content = content.replace('View daily summaries and download reports.', '{t("summary.subtitle")}')
    content = content.replace('No sessions found for this period.', '{t("summary.noTransactions")}')
    content = content.replace('<span className="text-sm font-semibold">Generate PDF</span>', '<span className="text-sm font-semibold">{t("summary.generatePdf")}</span>')

    # Cashiers texts
    content = content.replace('"text-3xl font-semibold">Manage Cashiers</h1>', '"text-3xl font-semibold">{t("cashiers.title")}</h1>')
    content = content.replace('Add and remove cashier accounts.', '{t("cashiers.subtitle")}')
    content = content.replace('Add Cashier', '{t("cashiers.addBtn")}')
    content = content.replace('No cashiers found.', '{t("cashiers.noCashiers")}')
    content = content.replace('Name', '{t("cashiers.name")}')
    content = content.replace('Email', '{t("cashiers.email")}')
    content = content.replace('Password', '{t("cashiers.password")}')
    content = content.replace('Cancel', '{t("cashiers.cancel")}')

    # TransactionTable
    if 'TransactionTable' in filepath:
        content = content.replace('"px-4 py-3">Buyer Name</th>', '"px-4 py-3">{t("transactionTable.buyerName")}</th>')
        content = content.replace('"px-4 py-3">Time</th>', '"px-4 py-3">{t("transactionTable.time")}</th>')
        content = content.replace('"px-4 py-3">Payment Method</th>', '"px-4 py-3">{t("transactionTable.paymentMethod")}</th>')
        content = content.replace('"px-4 py-3">Items</th>', '"px-4 py-3">{t("transactionTable.items")}</th>')
        content = content.replace('"px-4 py-3">Amount</th>', '"px-4 py-3">{t("transactionTable.amount")}</th>')
        content = content.replace('"px-4 py-3">Status</th>', '"px-4 py-3">{t("transactionTable.status")}</th>')
        content = content.replace('"px-4 py-3 text-right">Delete</th>', '"px-4 py-3 text-right">{t("transactionTable.delete")}</th>')

    if content != original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)

for p in glob.glob('components/*.tsx'):
    process_file(p)

