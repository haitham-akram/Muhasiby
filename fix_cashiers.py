import json

with open('i18n/en.json', 'r') as f:
    en = json.load(f)
with open('i18n/ar.json', 'r') as f:
    ar = json.load(f)

en["cashiers"].update({
    "addNew": "Add New Cashier",
    "creating": "Creating...",
    "create": "Create Cashier",
    "existing": "Existing Cashiers",
    "loading": "Loading cashiers...",
    "added": "Added: ",
    "delete": "Delete",
    "confirmDelete": "Are you sure you want to delete this cashier?"
})

ar["cashiers"].update({
    "addNew": "إضافة كاشير جديد",
    "creating": "جاري الإنشاء...",
    "create": "إنشاء كاشير",
    "existing": "الكاشيرات الحاليين",
    "loading": "جاري تحميل الكاشيرات...",
    "added": "تمت الإضافة: ",
    "delete": "حذف",
    "confirmDelete": "هل أنت متأكد من حذف الكاشير؟"
})

with open('i18n/en.json', 'w') as f:
    json.dump(en, f, indent=2)
with open('i18n/ar.json', 'w') as f:
    json.dump(ar, f, indent=2)

with open('components/CashiersClient.tsx', 'r') as f:
    c = f.read()

c = c.replace('>Add New Cashier<', '>{t("cashiers.addNew")}<')
c = c.replace("{isSubmitting ? 'Creating...' : 'Create Cashier'}", '{isSubmitting ? t("cashiers.creating") : t("cashiers.create")}')
c = c.replace('>Existing Cashiers<', '>{t("cashiers.existing")}<')
c = c.replace('>Loading cashiers...<', '>{t("cashiers.loading")}<')
c = c.replace("{format(new Date(cashier.createdAt), 'dd MMM yyyy')}", "{format(new Date(cashier.createdAt), 'dd MMM yyyy')}")
c = c.replace('Added: {', '{t("cashiers.added")} {')
c = c.replace('>Delete<', '>{t("cashiers.delete")}<')
c = c.replace("'Are you sure you want to delete this cashier?'", 't("cashiers.confirmDelete")')


with open('components/CashiersClient.tsx', 'w') as f:
    f.write(c)

