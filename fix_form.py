import re

with open('components/TransactionForm.tsx', 'r') as f:
    c = f.read()

# I am adding 'useLanguage' manually
if 'useLanguage' not in c:
    c = c.replace('import { useSession } from "next-auth/react";', 'import { useSession } from "next-auth/react";\nimport { useLanguage } from "@/app/providers";')
    c = c.replace('export default function TransactionForm({', 'export default function TransactionForm({\n  onAdded,\n}: { onAdded: () => void }) {\n  const { t } = useLanguage();')
    c = re.sub(r'export default function TransactionForm\(\{[\s\n]*onAdded,[\s\n]*\}\: \{ onAdded\: \(\) \=\> void \}\) \{', 'export default function TransactionForm({\n  onAdded,\n}: { onAdded: () => void }) {\n  const { t } = useLanguage();', c)

    c = c.replace('>Buyer Name<', '>{t("transactionForm.buyerName")}<')
    c = c.replace('placeholder="Buyer name"', 'placeholder={t("transactionForm.buyerNamePlaceholder")}')
    c = c.replace('>Payment Method<', '>{t("transactionForm.paymentMethod")}<')
    c = c.replace('>Bank Transfer / Cash<', '>{t("transactionForm.paymentMethodPlaceholder")}<')
    c = c.replace('>Items Purchased<', '>{t("transactionForm.itemsPurchased")}<')
    c = c.replace('placeholder="Describe items sold"', 'placeholder={t("transactionForm.itemsPurchasedPlaceholder")}')
    c = c.replace('>Amount<', '>{t("transactionForm.amount")}<')
    c = c.replace('>Phone Number<', '>{t("transactionForm.phoneNumber")}<')
    c = c.replace('>Status<', '>{t("transactionForm.status")}<')
    c = c.replace('>Confirmed<', '>{t("transactionForm.statusConfirmed")}<')
    c = c.replace('>Pending<', '>{t("transactionForm.statusPending")}<')
    c = c.replace('>Cancelled<', '>{t("transactionForm.statusCancelled")}<')
    c = c.replace('>Add Transaction<', '>{t("transactionForm.addBtn")}<')
    c = c.replace('{isSubmitting ? "Saving..." : "Add Transaction"}', '{isSubmitting ? t("transactionForm.savingBtn") : t("transactionForm.addBtn")}')

with open('components/TransactionForm.tsx', 'w') as f:
    f.write(c)

with open('components/DashboardClient.tsx', 'r') as f:
    dc = f.read()

dc = dc.replace('No session active.', '{t("dashboard.statusClosed")}')
dc = dc.replace('>Open<', '>{t("dashboard.statusOpen")}<')
dc = dc.replace('Review today\'s totals and follow-ups.', '{t("dashboard.openPrompt")}')

with open('components/DashboardClient.tsx', 'w') as f:
    f.write(dc)

