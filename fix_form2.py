with open('components/TransactionForm.tsx', 'r') as f:
    c = f.read()

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
c = c.replace('{isSubmitting ? \'Saving...\' : \'Add Transaction\'}', '{isSubmitting ? t("transactionForm.savingBtn") : t("transactionForm.addBtn")}')

with open('components/TransactionForm.tsx', 'w') as f:
    f.write(c)

