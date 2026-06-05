const fs = require('fs');

const en = JSON.parse(fs.readFileSync('i18n/en.json', 'utf8'));
const ar = JSON.parse(fs.readFileSync('i18n/ar.json', 'utf8'));

en.history = { ...en.history, subtitle: "Search past sessions and filter transactions.", transactionsFound: "transactions found" };
ar.history = { ...ar.history, subtitle: "ابحث في الجلسات السابقة وقم بتصفية المعاملات.", transactionsFound: "معاملة وجدت" };

en.filterBar.search = "Search";
ar.filterBar.search = "البحث";

en.summary.subtitle = "View daily summaries and download reports.";
en.summary.generatePdf = "Generate PDF";
ar.summary.subtitle = "عرض الملخصات اليومية وتنزيل التقارير.";
ar.summary.generatePdf = "إنشاء PDF";

en.cashiers.subtitle = "Add and remove cashier accounts.";
ar.cashiers.subtitle = "إضافة وإزالة حسابات الكاشير.";

fs.writeFileSync('i18n/en.json', JSON.stringify(en, null, 2));
fs.writeFileSync('i18n/ar.json', JSON.stringify(ar, null, 2));
