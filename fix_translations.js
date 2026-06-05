const fs = require('fs');

const en = JSON.parse(fs.readFileSync('i18n/en.json', 'utf8'));
const ar = JSON.parse(fs.readFileSync('i18n/ar.json', 'utf8'));

en.statusBadge = {
  "CONFIRMED": "Confirmed",
  "PENDING": "Pending",
  "CANCELLED": "Cancelled"
};
ar.statusBadge = {
  "CONFIRMED": "مؤكد",
  "PENDING": "قيد الانتظار",
  "CANCELLED": "ملغى"
};

en.filterBar = {
  "status": "Status",
  "all": "All",
  "confirmed": "Confirmed",
  "pending": "Pending",
  "cancelled": "Cancelled",
  "paymentMethod": "Payment Method",
  "from": "From",
  "to": "To",
  "clearFilters": "Clear filters"
};
ar.filterBar = {
  "status": "الحالة",
  "all": "الكل",
  "confirmed": "مؤكد",
  "pending": "قيد الانتظار",
  "cancelled": "ملغى",
  "paymentMethod": "طريقة الدفع",
  "from": "من",
  "to": "إلى",
  "clearFilters": "مسح الفلاتر"
};

en.summaryStats = {
  "totalTransactions": "Total Transactions",
  "totalConfirmed": "Total Confirmed",
  "totalPending": "Total Pending",
  "totalCancelled": "Total Cancelled"
};
ar.summaryStats = {
  "totalTransactions": "إجمالي المعاملات",
  "totalConfirmed": "الإجمالي المؤكد",
  "totalPending": "الإجمالي المعلق",
  "totalCancelled": "الإجمالي الملغى"
};

en.history = {
  "title": "History",
  "searchPlaceholder": "Search transactions...",
  "noTransactions": "No transactions found."
};
ar.history = {
  "title": "السجل",
  "searchPlaceholder": "البحث في المعاملات...",
  "noTransactions": "لم يتم العثور على معاملات."
};

en.summary = {
  "title": "Summary",
  "noTransactions": "No sessions found for this period."
};
ar.summary = {
  "title": "الملخص",
  "noTransactions": "لم يتم العثور على جلسات لهذه الفترة."
};

en.cashiers = {
  "title": "Manage Cashiers",
  "addBtn": "Add Cashier",
  "name": "Name",
  "email": "Email",
  "password": "Password",
  "cancel": "Cancel",
  "loading": "Loading...",
  "noCashiers": "No cashiers found."
};
ar.cashiers = {
  "title": "إدارة الكاشير",
  "addBtn": "إضافة كاشير",
  "name": "الاسم",
  "email": "البريد الإلكتروني",
  "password": "كلمة المرور",
  "cancel": "إلغاء",
  "loading": "جاري التحميل...",
  "noCashiers": "لم يتم العثور على كاشيرات."
};

en.transactionTable = {
  "buyerName": "Buyer Name",
  "time": "Time",
  "paymentMethod": "Payment Method",
  "items": "Items",
  "amount": "Amount",
  "status": "Status",
  "delete": "Delete"
};
ar.transactionTable = {
  "buyerName": "اسم المشتري",
  "time": "الوقت",
  "paymentMethod": "طريقة الدفع",
  "items": "العناصر",
  "amount": "المبلغ",
  "status": "الحالة",
  "delete": "حذف"
};

fs.writeFileSync('i18n/en.json', JSON.stringify(en, null, 2));
fs.writeFileSync('i18n/ar.json', JSON.stringify(ar, null, 2));
