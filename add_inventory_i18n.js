const fs = require('fs');

const en = JSON.parse(fs.readFileSync('i18n/en.json', 'utf8'));
const ar = JSON.parse(fs.readFileSync('i18n/ar.json', 'utf8'));

en.nav.inventory = "Inventory";
ar.nav.inventory = "المخزون";

en.inventory = {
  title: "Inventory",
  subtitle: "Manage your products and view sales reports",
  topSelling: "Top Selling Items",
  noSalesData: "No sales data yet.",
  sold: "sold",
  productsDirectory: "Products Directory",
  addBtn: "+ Add Product",
  cancelBtn: "Cancel",
  productName: "Product Name",
  productNamePlaceholder: "e.g. Hair Cream (Blue)",
  defaultPrice: "Default Price",
  saveBtn: "Save Product",
  savingBtn: "Saving...",
  noProducts: "No products in inventory."
};

ar.inventory = {
  title: "المخزون",
  subtitle: "إدارة المنتجات وعرض تقارير المبيعات",
  topSelling: "العناصر الأكثر مبيعاً",
  noSalesData: "لا توجد بيانات مبيعات بعد.",
  sold: "مباع",
  productsDirectory: "دليل المنتجات",
  addBtn: "+ إضافة منتج",
  cancelBtn: "إلغاء",
  productName: "اسم المنتج",
  productNamePlaceholder: "مثال: كريم شعر (أزرق)",
  defaultPrice: "السعر الافتراضي",
  saveBtn: "حفظ المنتج",
  savingBtn: "جاري الحفظ...",
  noProducts: "لا توجد منتجات في المخزون."
};

en.transactionForm.newProductBtn = "+ New Product";
en.transactionForm.productName = "Product name";
en.transactionForm.qty = "Qty";
en.transactionForm.price = "Price";
en.transactionForm.addRowBtn = "+ Add Row";
en.transactionForm.newProductTitle = "New Product";
en.transactionForm.nameLabel = "Name";
en.transactionForm.defaultPriceLabel = "Default Price";
en.transactionForm.cancelBtn = "Cancel";
en.transactionForm.saveBtn = "Save";

ar.transactionForm.newProductBtn = "+ منتج جديد";
ar.transactionForm.productName = "اسم المنتج";
ar.transactionForm.qty = "الكمية";
ar.transactionForm.price = "السعر";
ar.transactionForm.addRowBtn = "+ إضافة سطر";
ar.transactionForm.newProductTitle = "منتج جديد";
ar.transactionForm.nameLabel = "الاسم";
ar.transactionForm.defaultPriceLabel = "السعر الافتراضي";
ar.transactionForm.cancelBtn = "إلغاء";
ar.transactionForm.saveBtn = "حفظ";

fs.writeFileSync('i18n/en.json', JSON.stringify(en, null, 2));
fs.writeFileSync('i18n/ar.json', JSON.stringify(ar, null, 2));

console.log('Translations updated successfully!');
