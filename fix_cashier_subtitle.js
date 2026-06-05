const fs = require('fs');
const en = JSON.parse(fs.readFileSync('i18n/en.json', 'utf8'));
const ar = JSON.parse(fs.readFileSync('i18n/ar.json', 'utf8'));

en.cashiers.subtitle = "Add, edit, or remove cashiers from the system.";
ar.cashiers.subtitle = "إضافة، تعديل، أو إزالة الكاشيرات من النظام.";

fs.writeFileSync('i18n/en.json', JSON.stringify(en, null, 2));
fs.writeFileSync('i18n/ar.json', JSON.stringify(ar, null, 2));
