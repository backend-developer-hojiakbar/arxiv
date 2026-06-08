/**
 * Builds english.ts and russian.ts from cyrillic.ts (source of truth for Uzbek Cyrillic).
 * Run: node scripts/build-i18n.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

function esc(s) {
  return s.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

const cyrlSrc = fs.readFileSync(path.join(root, "src/i18n/cyrillic.ts"), "utf8");
const entries = Object.fromEntries(
  [...cyrlSrc.matchAll(/^\s+"((?:\\.|[^"\\])+)"\s*:\s*"((?:\\.|[^"\\])*)"/gm)].map(([, k, v]) => [k, v])
);

/** Manual overrides — highest priority */
const EN = {
  Arxive: "Archive",
  "FJSTI Arxivi": "FJSTI Archive",
  "Arxive. Barcha huquqlar himoyalangan.": "Archive. All rights reserved.",
  "Foydalanuvchi nomi (Username)": "Username",
  "Tizim paroli (Password)": "Password",
  Xato: "Error",
  "Yuklanmoqda...": "Loading...",
  "Tizimga kirish": "Sign in",
  "Tizimga Kirish": "Sign in",
  "Tizimga kirish...": "Signing in...",
  "Boshqaruv Tizimi": "Management System",
  "Boshqaruv paneli": "Dashboard",
  "Boshqaruv paneli (Dashboard)": "Dashboard",
  "Qidiruv (Search)": "Search",
  "Hujjat qabul (Intake)": "Document intake",
  "Hujjatlar ro'yxati": "Document list",
  Mundarija: "Directory",
  "Admin panel": "Admin panel",
  Menu: "Menu",
  Chiqish: "Log out",
  Yopish: "Close",
  "Ko'rish": "View",
  Tahrirlash: "Edit",
  "O'chirish": "Delete",
  Saqlash: "Save",
  "Bekor qilish": "Cancel",
  Qidirish: "Search",
  Tozalash: "Clear",
  "Filtrlarni tozalash": "Clear filters",
  "Chop etish": "Print",
  "Yuklab olish": "Download",
  Orqaga: "Back",
  Keyingisi: "Next",
  Tanlash: "Select",
  Tanlangan: "Selected",
  Xa: "Yes",
  "Yo'q": "No",
  Joyida: "In place",
  Berilgan: "Issued",
  "Yo'q qilingan": "Deleted",
  Chiqarilgan: "Issued",
  Administrator: "Administrator",
  Xodim: "Staff",
  "Ko'ruvchi": "Viewer",
  Bloklangan: "Blocked",
  Talaba: "Student",
  Institut: "Institute",
  Kategoriyalar: "Categories",
  Shkaflar: "Cabinets",
  Hujjatlar: "Documents",
  Amallar: "Actions",
  Holat: "Status",
  Holati: "Status",
  Izoh: "Note",
  Tavsif: "Description",
  Sana: "Date",
  Vaqt: "Time",
  Jami: "Total",
  ta: "items",
  "Barchasi (All)": "All",
  "Noma'lum": "Unknown",
  Kiritilmagan: "Not entered",
  Progress: "Progress",
  Sahifa: "Page",
  Parol: "Password",
  Kirish: "Sign in",
  "Farg'ona Jamoat Salomatligi Tibbiyot Instituti": "Fergana Public Health Medical Institute",
  "Hujjatlarni boshqarish tizimi": "Document management system",
  "Xavfsizlik sertifikatlangan": "Security certified",
  "Arxiv hisobiga bog'lanish uchun quyidagi parametrlarni kiriting": "Enter your credentials to access the archive",
  "Iltimos, maydonlarni to'ldiring": "Please fill in all fields",
  "Tizimga kirishda xatolik yuz berdi": "An error occurred while signing in",
  "Masalan: xodim yoki admin": "e.g. xodim or admin",
  "Bosh Arxivchi (Admin)": "Chief archivist (Admin)",
  "Arxiv Operator": "Archive operator",
  "Arxivchi (Viewer)": "Archivist (Viewer)",
  "Inkubatsiya va Akseleratsiya markazi": "Incubation and Acceleration Center",
  "Inkubatsiya va Akseleratsiya markazi. Barcha huquqlar himoyalangan.": "Incubation and Acceleration Center. All rights reserved.",
  "Administratorlar uchun maxsus: foydalanuvchilar hisoblari boshqaruvi va tizim harakatlari to'liq xavfsizlik audit jurnali": "For administrators: user account management and full security audit log of system actions",
  "Arxiv tizimining umumiy statistikasi va oxirgi faollik ko'rsatkichlari": "General archive statistics and recent activity indicators",
  "Arxivda ro'yxatdan o'tgan barcha jildlar va fizik nusxalar ombori": "Repository of all registered files and physical copies",
  "Arxivdan hujjat o'chirilishidan oldin diqqat qiling: Ushbu amalni qaytarib bo'lmaydi! Jismoniy faylni o'chirish ushbu qaydning dasturdan butkul yo'qolishiga sabab bo'ladi.": "Warning before deleting: this cannot be undone! Deleting the file will permanently remove this record.",
  "Audit jurnali bo'sh": "Audit log is empty",
  "Batafsil izoh & ko'rsatmalar": "Detailed notes & instructions",
  "Chindan ham ushbu hujjat yozuvini arxiv bazasidan o'chirmoqchimisiz? Ushbu amaldan so'ng hujjat asosi faqat tahliliy soft-delete loglarida saqlab qolinadi.": "Really delete this record from the archive? Only soft-delete logs will remain.",
  "Fayl hajmi 20 MB dan ko'p bo'lmasligi lozim": "File size must not exceed 20 MB",
  "Fayl hajmi 30 MB dan ko'p bo'lmasligi lozim": "File size must not exceed 30 MB",
  "HEMIS ID": "HEMIS ID",
  "HEMIS ID (CODE):": "HEMIS ID (CODE):",
  "HEMIS kodli talaba topilmadi. Yangi talaba ma'lumotlarini to'g'ridan-to'g'ri kiriting.": "Student with this HEMIS code not found. Enter new student data directly.",
  "HEMIS tizimi orqali hujjat turi, o'quvchi talaba kodi yoki joylashuv bo'yicha tezkor qidiruv paneli": "Quick search by document type, student code, or location via HEMIS",
  "Hozirgina yangi hujjat qabul qilish lozimmi? Talaba ma'lumotlari kiritish va raqamli varaqlar (.pdf) fizik omborga bog'lanadi.": "Need to accept a new document? Enter student data and link digital PDFs to the physical repository.",
  "Hujjat Fizik Joyiga To'liq Qaytarildi!": "Document fully returned to its place!",
  "Hujjat arxiv bazasiga muvaffaqiyatli saqlanib, fizik saqlash joylashuvi koordinatalariga bog'landi.": "Document saved to archive and linked to physical storage coordinates.",
  "Hujjat arxiv bazasiga saqlanib, fizik joylashuv bilan bog'landi.": "Document saved to archive and linked to physical location.",
  "Hujjat arxivdan mutlaqo o'chiriladimi?": "Permanently delete document from archive?",
  "Hujjat berilayotgan shaxs (To'liq ism-sharifi) (*)": "Person receiving document (full name) (*)",
  "Hujjat nomi bo'yicha qidiring...": "Search by document name...",
  "Hujjatlar dinamikasi (Oylar bo'yicha)": "Document dynamics (by month)",
  "Hujjatni belgilangan raqamdagi shkaf va javonga qaytarib qo'yganingizdan so'ng, ushbu tugmani bosing. Holat 'Joyida' bo'lib yangilanadi.": "After returning the document to the designated cabinet and shelf, press this button. Status will update to 'In place'.",
  "Iltimos, barcha majburiy maydonlarni to'ldiring": "Please fill in all required fields",
  "Iltimos, qalqib chiquvchi oynalar (popup) bloklanishini o'chiring!": "Please disable popup blocking!",
  "Institut rasmiy hujjatlari, ko'rsatma va buyruqlar.": "Official institute documents, instructions, and orders.",
  "Kategoriyalar bo'yicha tahlil": "Analysis by category",
  "Kiritilgan filtrlar bo'yicha arxivdan mos yozuvlar topilmadi. Qidiruv kalit so'zlari yoki filtrlarni o'zgartirib ko'ring.": "No matching records found. Try different keywords or filters.",
  "Masalan: Bo'yruq № 312 yoki Nizom": "e.g. Order No. 312 or Regulation",
  "Masalan: Dekanat boshlig'i Soliyevga vaqtinchalik reyting uchun": "e.g. Temporarily to dean Soliyev for rating",
  "Masalan: chap bo'lim orqa tomondagi ko'k jildli tezis jurnali": "e.g. blue thesis journal in the back left section",
  "O'chirishda muammo sodir bo'ldi": "An error occurred while deleting",
  "O'zgarishlarni Saqlash": "Save changes",
  "Oxirgi 10 ta yozuv ko'rsatiladi. To'liq tarix Excel faylida yuklab olinadi.": "Last 10 records shown. Full history exported to Excel.",
  "Qavatlar bo'yicha sig'im:": "Capacity by floor:",
  "Qidiruv tizimiga o'tish": "Go to search",
  "REAL VAQTDA": "REAL TIME",
  "Sana (*)- tahrirlab bo'lmaydi": "Date (*) — read-only",
  "Tahrirlashda muammo sodir bo'ldi": "An error occurred while editing",
  "Tahrirlashga o'tish": "Go to edit",
  "Talaba unikal kodini kiriting keyin avto-to'ldirish": "Enter student unique code for auto-fill",
  "Talabalarning o'quv faoliyati varaqalari va buyruqlar.": "Student academic records and orders.",
  "Tavsifi yo'q": "No description",
  "Tezkor qidiruvga o'tish": "Go to quick search",
  "Tizimda amalga oshirilgan to'liq backend va ma'lumotlar bazasi operatsiyalari real-vaqt jurnali": "Real-time log of backend and database operations",
  "Tug'ilgan sanasi": "Date of birth",
  "Xatolik ro'y berdi: ": "An error occurred: ",
  "Xatolik sodir bo'ldi": "An error occurred",
  "Xodim to'liq Ism-Familiyasi (*)": "Staff full name (*)",
  "Xodimlar va o'qituvchilarning shaxsiy arxiv rekvizitlari.": "Personal archive records of staff and teachers.",
  "Yangi parol (Bo'sh qo'yilishi mumkin):": "New password (optional):",
  "Yangi qog'ozli nusxani raqamlashtirish (.pdf) va shkafdagi fizik manzili (Stellaj, qavat) jild bilan bog'lash": "Digitize new paper copy (.pdf) and link physical address (shelf, floor) to the file",
  "Yangi talaba topilmadi, iltimos ma'lumotlarni qo'lda kiriting!": "Student not found, please enter data manually!",
  "Yangi yoziladigan parol kamida 8 belgidan iborat bo'lishi shart": "New password must be at least 8 characters",
  "Yozuv / Hujjat qo'shimcha izohi": "Record / additional document note",
  "Arxiv tizimi uchun asosiy spravochniklar, hujjat shakllari va jismoniy shkaf (javon) spetsifikatsiyalari boshqaruvi": "Manage directories, document types, and physical cabinet specifications for the archive system",
  "Masalan: Reyting daftar": "e.g. Rating register",
  "QAYTARIB TOPSHIRISH SHARTI: Hujjat vaqtinchalik olinsa, 3 ish kuni ichida qayta joyiga tiklanishi shart!": "RETURN CONDITION: If taken temporarily, document must be returned within 3 business days!",
  "Shkafdagi javon (qavat) (*)": "Shelf in cabinet (floor) (*)",
  "+ YANGI KATEGORIYA QO'SHISH:": "+ ADD NEW CATEGORY:",
  "+ YANGI SHKAF (STELLAJ) QO'SHISH:": "+ ADD NEW CABINET (SHELVING):",
  "1 va": "1 to",
  "Admin panel // Foydalanuvchilar boshqaruvi": "Admin panel // User management",
  "Admin panel // Tizim Sozlamalari & Audit": "Admin panel // Settings & audit",
  "Administrator (To'liq admin)": "Administrator (full admin)",
  "Amal": "Action",
  "Arxivda saqlanayotgan jami faol hujjatlar": "Total active documents in archive",
  "Arxivdan Chiqarish": "Check out from archive",
  "Arxivga Qabul Qilish": "Accept to archive",
  "Arxivga kiritildi:": "Added to archive:",
  "Asosiy Panel": "Main panel",
  "Bajarilgan Amallar": "Actions performed",
  "Baza Ob'ekti": "Database object",
  "Bog'langan shaxslar": "Linked persons",
  "Boshlang'ich parol (≥ 8 belgi) (*)": "Initial password (≥ 8 chars) (*)",
  "Chop etiladigan yorliq": "Printable label",
  "Eksport qilish uchun yozuvlar yo'q": "No records to export",
  "F.I.Sh va tababel rekvizitlari": "Full name and personnel details",
  "F.I.Sh.": "Full name",
  "FARG'ONA JAMOAT SALOMATLIGI TIBBIYOT INSTITUTI": "FERGANA PUBLIC HEALTH MEDICAL INSTITUTE",
  "Faqat .pdf formatida, maksimal 20 MB": "PDF only, max 20 MB",
  "Faqat .pdf formatida, maksimal 30 MB": "PDF only, max 30 MB",
  "Faqat PDF formatini yuklashingiz mumkin (.pdf)": "Only PDF format allowed (.pdf)",
  "Faqat PDF yuklash ruxsat etiladi": "Only PDF upload allowed",
  "Faqat ko'ruvchi (Rahbariyat)": "Viewer only (management)",
  "Faqat rasmiy PDF formatidagi fayl yuklang (Maksimal 15 MB)": "Upload official PDF only (max 15 MB)",
  "Fizik arxiv xodimlari hisoblari hamda tizimdagi barcha faoliyatlar audit jurnalini nazorat qilish": "Manage archive staff accounts and system activity audit log",
  "Formani tozalash": "Clear form",
  "GURUH & B-SANA:": "GROUP & BIRTH DATE:",
  "HEMIS kod yoki Ism": "HEMIS code or name",
  "HEMIS kodi kiritilmadi": "HEMIS code not entered",
  "HUJJAT QABUL QILINDI!": "DOCUMENT ACCEPTED!",
  "HUJJATNI O'CHIRISH!": "DELETE DOCUMENT!",
  "Ha, o'chirilsin": "Yes, delete",
  "Hajmi": "Size",
  "Hozircha arxiv hujjatlari mavjud emas.": "No archive documents yet.",
  "Hozircha hech qanday kategoriya kiritilmagan": "No categories added yet",
  "Hozircha hech qanday shkaf kiritilmagan": "No cabinets added yet",
  "Hozircha yozuvlar yo'q": "No records yet",
  "Hujjat Holati (*)": "Document status (*)",
  "Hujjat Holati:": "Document status:",
  "Hujjatni o'chirish faqat Admin huquqiga ega foydalanuvchilarga ruxsat etiladi": "Only admin users can delete documents",
  "INSTITUT ARXIVI": "INSTITUTE ARCHIVE",
  "Inventar & Holat": "Inventory & status",
  "Izlash": "Search",
  "KUNLIK SONI": "DAILY COUNT",
  "Kamida 3 ta belgi kiriting...": "Enter at least 3 characters...",
  "Kamida 8 dona belgi": "At least 8 characters",
  "Kamida bitta hujjati bor talabalar jami soni": "Total students with at least one document",
  "Kanal": "Channel",
  "Katta o'qituvchi": "Senior teacher",
  "Kattalik cheklovi: maks 20 MB": "Size limit: max 20 MB",
  "Kimga va nima maqsadda chiqarilgan? (*)": "Issued to whom and for what purpose? (*)",
  "Lokal Tarmoq (LAN)": "Local network (LAN)",
  "Markaziy so'rov ko'rib chiqilmoqda...": "Processing request...",
  "Mas'ullik darajasi (Roli) (*)": "Responsibility level (role) (*)",
  "Mavjud foiz xodimlari": "Existing staff",
  "Mavjud xodimni qidirish": "Search existing staff",
  "Mavjud xodimni tanlang!": "Select existing staff!",
  "O'QUVCHI F.I.Sh (YANGI):": "STUDENT FULL NAME (NEW):",
  "O'QUVCHI F.I.Sh:": "STUDENT FULL NAME:",
  "O'zgartirmaslik uchun bo'sh qoldiring": "Leave blank to keep unchanged",
  "ONLINE": "ONLINE",
  "Ob'ekt": "Object",
  "Operatsiya Turi / Tafsiloti": "Operation type / details",
  "PDF nusxasi": "PDF copy",
  "Parol uzunligi kamida 8 belgidan iborat bo'lishi shart!": "Password must be at least 8 characters!",
  "QAVAT": "FLOOR",
  "QO'SHIMCHA IZOH:": "ADDITIONAL NOTE:",
  "Roli:": "Role:",
  "SHKAF REKVIZITI:": "CABINET:",
  "SHKAFLAR VA TO'LIQLIK HOLATI": "CABINETS AND COMPLETENESS STATUS",
  "SINAB KO'RISH uchun loginlar:": "Demo logins:",
  "Sertifikatlangan LAN": "Certified LAN",
  "Shkaf va Tokcha (Tok)": "Cabinet and shelf",
  "Status rekvizitlari:": "Status details:",
  "TALABA F.I.Sh:": "STUDENT FULL NAME:",
  "TOKCHA / QAVAT:": "SHELF / FLOOR:",
  "Tahrirlangan joriy koordinata:": "Edited current coordinates:",
  "Tasdiqlayman, Joyida": "Confirm, in place",
  "Tayyor (Base64 tayyorlangan)": "Ready (Base64 prepared)",
  "Tizimdagi faol mavjud hujjat turlari": "Active document types in system",
  "Tokcha (Qavat:": "Shelf (floor:",
  "Vaqtincha olib ketdi (Mas'ul shaxs)": "Temporarily taken (responsible person)",
  "Vaqtinchalik berish (Rent file)": "Temporary checkout",
  "Varaqa formati:": "Page format:",
  "XODIM F.I.Sh:": "STAFF FULL NAME:",
  "YANGI FOYDALANUVChI QO'ShISh": "ADD NEW USER",
  "Yakuniy ma'lumotlarni tahlil qilish": "Review final information",
  "Yangi Mas'ul Xodim Qo'shish": "Add new responsible staff",
  "Yangi Parol (*)": "New password (*)",
  "foiz ulushi": "percentage share",
  "jami: ": "total: ",
  "oralig'ida": "range",
  "Drop zone": "Drop zone — drag or click to select",
  "Joyiga qaytarish (Return to Cabinet)": "Return to place",
  "Naima": "Unknown",
  "Slip": "Voucher",
  "Xodim Qo'shish": "Add staff",
  "Xodim ismi va sharifi (*)": "Staff name (*)",
  "Xodim faol va ishlashi mumkin": "Staff is active and can work",
  "Foydalanuvchi logini (Username) (*)": "User login (username) (*)",
  "Foydalanuvchi faolligi": "User activity",
  "Faol foydalanuvchi": "Active user",
  "Foydalanuvchi qo'shish": "Add user",
  "Foydalanuvchilar": "Users",
  "Foydalanuvchilar hisoblari": "User accounts",
  "Fizik arxiv xodimlari hisoblarini boshqarish": "Manage physical archive staff accounts",
  "Fizik ID": "Physical ID",
  "Fizik arxiv xodimlari hisoblari": "Physical archive staff accounts",
  "Fizik joylashuvi": "Physical location",
  "Fizik Shkaf (*)": "Physical cabinet (*)",
  "Fizik shkafni saralang": "Select physical cabinet",
  "Fizik shkaflar va metall stellajlar": "Physical cabinets and metal shelving",
  "Fizik arxiv xodimlari hisoblari hamda tizimdagi barcha faoliyatlar audit jurnalini nazorat qilish": "Manage archive staff accounts and audit all system activity",
};

const RU = {
  Arxive: "Архив",
  "FJSTI Arxivi": "Архив FJSTI",
  "Arxive. Barcha huquqlar himoyalangan.": "Архив. Все права защищены.",
  "Farg'ona Jamoat Salomatligi Tibbiyot Instituti": "Ферганский институт общественного здравоохранения",
  "Boshqaruv Tizimi": "Система управления",
  "Tizimga kirish": "Вход в систему",
  "Tizimga Kirish": "Войти",
  "Yuklanmoqda...": "Загрузка...",
  Xato: "Ошибка",
  "Foydalanuvchi nomi (Username)": "Имя пользователя",
  "Tizim paroli (Password)": "Пароль",
  "Boshqaruv paneli": "Панель управления",
  "Boshqaruv paneli (Dashboard)": "Панель управления",
  "Qidiruv (Search)": "Поиск",
  "Hujjat qabul (Intake)": "Приём документов",
  "Hujjatlar ro'yxati": "Список документов",
  Mundarija: "Справочник",
  "Admin panel": "Панель администратора",
  Chiqish: "Выйти",
  Yopish: "Закрыть",
  "Ko'rish": "Просмотр",
  Tahrirlash: "Редактировать",
  "O'chirish": "Удалить",
  Saqlash: "Сохранить",
  "Bekor qilish": "Отмена",
  Qidirish: "Поиск",
  Tozalash: "Очистить",
  "Filtrlarni tozalash": "Сбросить фильтры",
  "Chop etish": "Печать",
  "Yuklab olish": "Скачать",
  Orqaga: "Назад",
  Keyingisi: "Далее",
  Joyida: "На месте",
  Berilgan: "Выдан",
  "Yo'q qilingan": "Удалён",
  Administrator: "Администратор",
  Xodim: "Сотрудник",
  "Ko'ruvchi": "Наблюдатель",
  Talaba: "Студент",
  Kategoriyalar: "Категории",
  Shkaflar: "Шкафы",
  Hujjatlar: "Документы",
  "Hujjatlarni boshqarish tizimi": "Система управления документами",
  "Xavfsizlik sertifikatlangan": "Безопасность сертифицирована",
  "Inkubatsiya va Akseleratsiya markazi": "Центр инкубации и акселерации",
  "HEMIS ID": "HEMIS ID",
  "HEMIS ID (CODE):": "HEMIS ID (КОД):",
  "Arxiv tizimi uchun asosiy spravochniklar, hujjat shakllari va jismoniy shkaf (javon) spetsifikatsiyalari boshqaruvi": "Управление справочниками, типами документов и физическими шкафами архивной системы",
  "QAYTARIB TOPSHIRISH SHARTI: Hujjat vaqtinchalik olinsa, 3 ish kuni ichida qayta joyiga tiklanishi shart!": "УСЛОВИЕ ВОЗВРАТА: при временной выдаче документ должен быть возвращён в течение 3 рабочих дней!",
  "Shkafdagi javon (qavat) (*)": "Полка в шкафу (этаж) (*)",
};

/** Cyrillic Uzbek → Russian (phrase-level, longest first) */
const RU_PHRASES = [
  ["Фойдаланувчи кириши", "Вход пользователя"],
  ["Тизимга кириш", "Вход в систему"],
  ["Тизимга муваффақиятли кирсангиз, барча маълумотномалар юкланади.", "После успешного входа загрузятся все справочники."],
  ["HEMIS тизими ва физик архив интеграциялашган омбори", "Репозиторий с интеграцией HEMIS и физического архива"],
  ["Кадр ва ҳужжатчилик жилдларини рақамли бошқарув платформаси. Тизимга кириш учун логин ва парол киритинг.", "Цифровая платформа управления кадровыми и документными делами. Введите логин и пароль для входа."],
  ["Дашборд // Умумий Статистика", "Панель управления // Общая статистика"],
  ["Қидирув // Ҳужжатлар Қидируви", "Поиск // Поиск документов"],
  ["Ҳужжат қабул қилиш // Янги Ҳужжат Қўшиш", "Приём документов // Добавить документ"],
  ["Ҳужжатлар рўйхати // Архив Ҳужжатлари Омбори", "Список документов // Хранилище архивных документов"],
  ["Категориялар & Шкафлар // Тизим Маълумотномалари", "Категории и шкафы // Системные справочники"],
  ["Админ панели // Тизим Созламалари & Аудит", "Панель администратора // Настройки и аудит"],
  ["Админ панели // Фойдаланувчилар бошқаруви", "Панель администратора // Управление пользователями"],
  ["Бош Архивчи (Админ)", "Главный архивариус (Админ)"],
  ["Архив Оператори", "Оператор архива"],
  ["Архив кўрувчи (Viewer)", "Архивариус (просмотр)"],
  ["Тизим ҳолати", "Статус системы"],
  ["ФАОЛ (ONLINE)", "АКТИВЕН (ONLINE)"],
  ["Сертификатланган LAN", "Сертифицированная LAN"],
  ["Фаол ходим", "Активный сотрудник"],
  ["Архив Департаменти", "Архивный отдел"],
  ["Асосий Панел", "Главная панель"],
  ["Ҳужжат Қабул Қилиш", "Приём документов"],
  ["Тезкор Қидирув", "Быстрый поиск"],
  ["Архив Репозиториси", "Архивное хранилище"],
  ["Категория / Шкаф", "Категория / Шкаф"],
  ["Тизим Аудити / Админ", "Аудит системы / Админ"],
  ["Чиқиш", "Выход"],
  ["Бошқарув панели", "Панель управления"],
  ["Бошқарув Тизими", "Система управления"],
  ["Ҳужжатлар рўйхати", "Список документов"],
  ["Мундарижа", "Справочник"],
  ["Админ панели", "Панель администратора"],
  ["СОЎНГГИ ҚАБУЛ ҚИЛИНГАН ҲУЖЖАТЛАР", "ПОСЛЕДНИЕ ПРИНЯТЫЕ ДОКУМЕНТЫ"],
  ["АРХИВДАГИ ЖАМИ ҲУЖЖАТЛАР", "ВСЕГО ДОКУМЕНТОВ В АРХИВЕ"],
  ["ЖАМИ РАҚАМЛАШТИРИЛГАН ҲУЖЖАТЛАР", "ВСЕГО ОЦИФРОВАННЫХ ДОКУМЕНТОВ"],
  ["ҲЕЧ НАРСА ТОПИЛМАДИ", "НИЧЕГО НЕ НАЙДЕНО"],
  ["Қидириш", "Поиск"],
  ["Тозалаш", "Очистить"],
  ["Фильтрларни тозалаш", "Сбросить фильтры"],
  ["Сақлаш", "Сохранить"],
  ["Бекор қилиш", "Отмена"],
  ["Ўчириш", "Удалить"],
  ["Таҳрирлаш", "Редактировать"],
  ["Кўриш", "Просмотр"],
  ["Ёпиш", "Закрыть"],
  ["Чоп этиш", "Печать"],
  ["Юклаб олиш", "Скачать"],
  ["Жойида", "На месте"],
  ["Берилган", "Выдан"],
  ["Йўқ қилинган", "Удалён"],
  ["Номаълум", "Неизвестно"],
  ["Киритилмаган", "Не указано"],
  ["Юкланмоқда", "Загрузка"],
  ["Сақланмоқда", "Сохранение"],
  ["Бажарилмоқда", "Обработка"],
  ["Натижалар юкланмоқда...", "Загрузка результатов..."],
  ["Маълумотлар олинмоқда...", "Загрузка данных..."],
  ["Инкубация ва Акселерация маркази", "Центр инкубации и акселерации"],
  ["Фарғона Жамоат Саломатлиги Тиббиёт Институти", "Ферганский институт общественного здравоохранения"],
  ["Архив ҳисобига боғланиш учун қуйидаги параметрларни киритинг", "Введите данные для доступа к архивному аккаунту"],
  ["Илтимос, майдонларни тўлдиринг", "Пожалуйста, заполните все поля"],
  ["Тизимга киришда хатолик юз берди", "Ошибка при входе в систему"],
  ["Ҳужжатларни бошқарув тизими", "Система управления документами"],
  ["Хавфсизлик сертификатланган", "Безопасность сертифицирована"],
  ["FJSTI Архиви", "Архив FJSTI"],
  ["Архив", "Архив"],
];

/** Latin Uzbek → English (phrase-level) */
const EN_PHRASES = [
  ["Foydalanuvchi kirishi", "User login"],
  ["HEMIS tizimi va fizik arxiv integratsiyalashgan ombori", "HEMIS-integrated physical archive repository"],
  ["Kadr va hujjatchilik jildlarini raqamli boshqaruv platformasi. Tizimga kirish uchun login va parol kiriting.", "Digital platform for personnel and document management. Enter login and password to sign in."],
  ["Tizimga muvaffaqiyatli kirsangiz, barcha spravochniklar yuklanadi.", "After successful login, all directories will load."],
  ["Dashboard // Umumiy Statistika", "Dashboard // General statistics"],
  ["Qidiruv (Search) // Hujjatlar Qidiruvi", "Search // Document search"],
  ["Hujjat qabul (Intake) // Yangi Hujjat Qo'shish", "Document intake // Add new document"],
  ["Hujjatlar ro'yxati // Arxiv Hujjatlari Ombori", "Document list // Archive document repository"],
  ["Kategoriyalar & Shkaflar // Tizim Spravochniklari", "Categories & cabinets // System directories"],
  ["Admin panel // Tizim Sozlamalari & Audit", "Admin panel // Settings & audit"],
  ["Admin panel // Foydalanuvchilar boshqaruvi", "Admin panel // User management"],
  ["Ushbu kunda topshirilgan yangi arxiv hujjatlari soni", "Number of new archive documents submitted today"],
  ["Bugun topshirildi", "Submitted today"],
  ["Tizimdagi faol va arxivga bog'langan turlar", "Active types linked to the archive"],
  ["Faol Kategoriyalar", "Active categories"],
  ["Sinflandirilgan va joylashtirilgan javonlar", "Classified and placed shelves"],
  ["Jismoniy Shkaflar", "Physical cabinets"],
  ["ARXIVDAGI JAMI HUJJATLAR", "TOTAL ARCHIVE DOCUMENTS"],
  ["JAMI RAQAMLASHTIRILGAN HUJJATLAR", "TOTAL DIGITIZED DOCUMENTS"],
  ["Tizim tahlili & Tezkor havolalar", "System analysis & quick links"],
  ["SO'NGGI QABUL QILINGAN HUJJATLAR", "RECENTLY ACCEPTED DOCUMENTS"],
  ["HECH NARSA TOPILMADI", "NOTHING FOUND"],
  ["Hujjatlarni Tezkor Qidirish", "Quick document search"],
  ["Fizik Qidiruv Filtrlari (AND mantiqli)", "Physical search filters (AND logic)"],
  ["Qirqish uchun ism yoki HEMIS kodini kiriting...", "Enter name or HEMIS code to search..."],
  ["Hujjat turini tanlang", "Select document type"],
  ["Fizik shkafni saralang", "Select physical cabinet"],
  ["Qabul qilingan sana (Dan)", "Received date (from)"],
  ["Qabul qilingan sana (Gacha)", "Received date (to)"],
  ["ta yozuv", "records"],
  ["Sana bo'yicha saralangan (Yangi birinchi)", "Sorted by date (newest first)"],
  ["Natijalar saralanmoqda...", "Sorting results..."],
  ["Xato yuklanish", "Loading error"],
  ["O'quvchi F.I.Sh.", "Student full name"],
  ["Student ID (Talaba kodi)", "Student ID"],
  ["Hujjat turi (Kategoriya)", "Document type (category)"],
  ["Qabul sanasi", "Received date"],
  ["Fizik Shkaf", "Physical cabinet"],
  ["Qavat (Plast)", "Shelf (floor)"],
  ["Batafsil ma'lumot va PDF korish", "View details and PDF"],
  ["Fizik joylashuv voucherini chop etish", "Print physical location voucher"],
  ["Arxiv Kartasi: ", "Archive card: "],
  ["Arxiv Kartasi:", "Archive card:"],
  ["Hujjat haqida batafsil ma'lumot", "Detailed document information"],
  ["Arxivga qabul qildi (Xodim)", "Accepted to archive (staff)"],
  ["Qabul qilingan sana & vaqt", "Received date & time"],
  ["Talaba kodi (ID)", "Student code (ID)"],
  ["Akademik guruh", "Academic group"],
  ["Tug'ilgan yili", "Year of birth"],
  ["Muloqot telefoni", "Contact phone"],
  ["Fayl talqinlari", "File details"],
  ["Asl fayl nomi", "Original file name"],
  ["PDF Hujjat Korish", "View PDF document"],
  ["OLIY TA'LIM MUASSASASI ARXIVI", "HIGHER EDUCATION INSTITUTION ARCHIVE"],
  ["FIZIK NUSXA HUDUDIY CHOP QILISH VOUCHERI", "PHYSICAL COPY LOCATION PRINT VOUCHER"],
  ["Hujjat Unikal kodi (ID)", "Document unique code (ID)"],
  ["Talaba F.I.Sh.", "Student full name"],
  ["Fizik Joylashuvi", "Physical location"],
  ["Arxivga Qabul Qilingan", "Accepted to archive"],
  ["Mas'ul Operator", "Responsible operator"],
  ["Administrator Boshqaruv Markazi", "Administrator control center"],
  ["Mundarija va Tizim Sozlamalari", "Directory and system settings"],
  ["HUJJAT KATEGORIYALARI", "DOCUMENT CATEGORIES"],
  ["ARXIV SHKAFLARI (STELLAJ)", "ARCHIVE CABINETS (SHELVING)"],
  ["TIZIMDAGI FOYDALANUVCHILAR", "SYSTEM USERS"],
  ["Yangi Hujjat Qabul Qilish (Intake)", "New document intake"],
  ["Hujjatlar Ombori (Inventarizatsiya)", "Document repository (inventory)"],
  ["KATEGORIYALAR BO'YICHA TAQSIMOT", "DISTRIBUTION BY CATEGORY"],
  ["OXIRGI 7 KUNLIK QABUL GRAFIGI", "LAST 7 DAYS INTAKE CHART"],
  ["SHKAFLAR VA TO'LIQLIK HOLATI", "CABINETS AND COMPLETENESS STATUS"],
  ["Statistika & Oqim", "Statistics & workflow"],
  ["Tezkor filter tizimi", "Quick filter system"],
  ["PDF va Fizik joylashuv", "PDF and physical location"],
  ["Inventar & Holat", "Inventory & status"],
  ["Kategoriyalar & Shkaflar", "Categories & cabinets"],
  ["Audit & Hisoblar", "Audit & accounts"],
  ["Arxiv shkaflari", "Archive cabinets"],
  ["Ushbu varaq arxiv javonidan hujjat izlash uchun mo'ljallangan.", "This page is for searching documents in the archive."],
];

function applyPhrases(text, phrases) {
  if (!text) return text;
  let result = text;
  for (const [from, to] of phrases) {
    if (result.includes(from)) result = result.split(from).join(to);
  }
  return result;
}

/** Word-boundary replacements for remaining Latin fragments */
const EN_WORDS = [
  ["Foydalanuvchi", "User"], ["foydalanuvchi", "user"], ["Foydalanuvchilar", "Users"],
  ["Hujjatlar", "Documents"], ["Hujjat", "Document"], ["hujjatlar", "documents"], ["hujjat", "document"],
  ["Arxivga", "To archive"], ["Arxivdan", "From archive"], ["Arxiv", "Archive"], ["arxiv", "archive"],
  ["Qidiruv", "Search"], ["qidiruv", "search"], ["Qidirish", "Search"], ["qidirish", "search"],
  ["Kategoriya", "Category"], ["Kategoriyalar", "Categories"], ["kategoriya", "category"],
  ["Shkaf", "Cabinet"], ["Shkaflar", "Cabinets"], ["shkaf", "cabinet"], ["shkaflar", "cabinets"],
  ["Talaba", "Student"], ["talaba", "student"], ["Talabalar", "Students"],
  ["O'quvchi", "Student"], ["o'quvchi", "student"], ["O'quvchilar", "Students"],
  ["Xodim", "Staff"], ["xodim", "staff"], ["Xodimlar", "Staff"],
  ["Saqlash", "Save"], ["saqlash", "save"], ["Saqlanmoqda", "Saving"],
  ["O'chirish", "Delete"], ["o'chirish", "delete"],
  ["Tahrirlash", "Edit"], ["tahrirlash", "edit"],
  ["Ko'rish", "View"], ["ko'rish", "view"], ["Batafsil", "Details"],
  ["Yuklash", "Upload"], ["yuklash", "upload"], ["Yuklangan", "Uploaded"],
  ["Filtr", "Filter"], ["filtr", "filter"], ["Filtrlarni", "Filters"],
  ["Boshqaruv", "Management"], ["boshqaruv", "management"],
  ["paneli", "panel"], ["Paneli", "Panel"],
  ["Tizim", "System"], ["tizim", "system"], ["Tizimga", "To system"],
  ["Holat", "Status"], ["holat", "status"], ["Holati", "Status"],
  ["Sana", "Date"], ["sana", "date"], ["Sanasi", "Date"],
  ["Izoh", "Note"], ["izoh", "note"], ["Tavsif", "Description"], ["tavsif", "description"],
  ["Nomi", "Name"], ["nomi", "name"], ["Nom", "Name"],
  ["Raqam", "Number"], ["raqam", "number"], ["Raqami", "Number"],
  ["Qavat", "Floor"], ["qavat", "floor"],
  ["Joylashuv", "Location"], ["joylashuv", "location"],
  ["Fizik", "Physical"], ["fizik", "physical"],
  ["Faol", "Active"], ["faol", "active"], ["Nofaol", "Inactive"],
  ["Yangi", "New"], ["yangi", "new"], ["Oxirgi", "Latest"], ["oxirgi", "latest"],
  ["Bugun", "Today"], ["bugun", "today"], ["Barcha", "All"], ["barcha", "all"],
  ["Topildi", "Found"], ["topildi", "found"], ["Topilmadi", "Not found"],
  ["Muvaffaqiyat", "Success"], ["Xatolik", "Error"], ["xatolik", "error"],
  ["Yuklanmoqda", "Loading"], ["Ma'lumotlar", "Data"], ["ma'lumotlar", "data"],
  ["Ma'lumot", "Data"], ["ma'lumot", "data"],
  ["Qabul", "Intake"], ["qabul", "intake"],
  ["Guruh", "Group"], ["guruh", "group"], ["Guruhi", "Group"],
  ["Familiya", "Last name"], ["familiya", "last name"], ["Familiyasi", "Last name"],
  ["Ismi", "First name"], ["ismi", "first name"],
  ["Lavozim", "Position"], ["lavozim", "position"],
  ["Bo'lim", "Department"], ["bo'lim", "department"],
  ["Telefon", "Phone"], ["telefon", "phone"],
  ["Fayl", "File"], ["fayl", "file"],
  ["Maksimal", "Maximum"], ["maksimal", "maximum"],
  ["Masalan", "e.g."], ["masalan", "e.g."],
  ["tanlang", "select"], ["Tanlang", "Select"], ["tanlash", "selection"],
  ["qo'shish", "add"], ["Qo'shish", "Add"],
  ["ro'yxat", "list"], ["Ro'yxat", "List"], ["ro'yxati", "list"],
  ["Statistika", "Statistics"], ["statistika", "statistics"],
  ["Inventar", "Inventory"], ["inventar", "inventory"],
  ["Ombor", "Repository"], ["ombor", "repository"],
  ["spravochnik", "directory"], ["Spravochnik", "Directory"],
  ["Audit", "Audit"], ["audit", "audit"],
  ["Jurnal", "Log"], ["jurnal", "log"],
  ["Excel", "Excel"], ["Operator", "Operator"],
  ["Institut", "Institute"], ["institut", "institute"],
  ["majburiy", "required"], ["Ixtiyoriy", "Optional"],
  ["Orqaga", "Back"], ["Keyingisi", "Next"], ["Sahifa", "Page"],
  ["Tanlash", "Select"], ["Tanlangan", "Selected"],
  ["Chiqish", "Log out"], ["Yopish", "Close"], ["Chop etish", "Print"],
  ["Bekor qilish", "Cancel"], ["Tozalash", "Clear"],
  ["Kiritilmagan", "Not entered"], ["Noma'lum", "Unknown"],
  ["Kodsiz", "No code"], ["O'quvsiz", "No student"],
  ["Bajarilmoqda", "Processing"], ["Saqlanmoqda", "Saving"],
  ["Qidiruv", "Search"], ["Intake", "Intake"],
  ["HEMIS", "HEMIS"], ["PDF", "PDF"], ["Username", "Username"],
  ["Password", "Password"], ["Dashboard", "Dashboard"],
  ["Admin", "Admin"], ["Viewer", "Viewer"],
  ["Iltimos", "Please"], ["iltimos", "please"],
  ["xatolik yuz berdi", "an error occurred"],
  ["yuklanmoqda", "loading"], ["saqlanmoqda", "saving"],
  ["topilmadi", "not found"], ["mavjud emas", "not available"],
  ["kiritilmagan", "not entered"], ["kiritilgan", "entered"],
  ["tanlangan", "selected"], ["tanlang", "select"],
  ["qabul qilindi", "accepted"], ["qabul qilish", "accept"],
  ["o'zgartirish", "change"], ["o'zgartirildi", "changed"],
  ["tasdiqlash", "confirm"], ["tasdiqlayman", "I confirm"],
  ["barcha huquqlar himoyalangan", "all rights reserved"],
];

const RU_WORDS = [
  ["Ҳужжатлар", "Документы"], ["Ҳужжат", "Документ"], ["ҳужжатлар", "документы"], ["ҳужжат", "документ"],
  ["Архивга", "В архив"], ["Архивдан", "Из архива"], ["Архив", "Архив"], ["архив", "архив"],
  ["Қидирув", "Поиск"], ["қидирув", "поиск"], ["Қидириш", "Поиск"], ["қидириш", "поиск"],
  ["Категориялар", "Категории"], ["Категория", "Категория"], ["категория", "категория"],
  ["Шкафлар", "Шкафы"], ["Шкаф", "Шкаф"], ["шкаф", "шкаф"],
  ["Талаба", "Студент"], ["талаба", "студент"], ["Талабалар", "Студенты"],
  ["Ўқувчи", "Студент"], ["ўқувчи", "студент"], ["Ўқувчилар", "Студенты"],
  ["Ходим", "Сотрудник"], ["ходим", "сотрудник"], ["Ходимлар", "Сотрудники"],
  ["Сақлаш", "Сохранить"], ["сақлаш", "сохранить"], ["Сақланмоқда", "Сохранение"],
  ["Ўчириш", "Удалить"], ["ўчириш", "удалить"],
  ["Таҳрирлаш", "Редактировать"], ["таҳрирлаш", "редактировать"],
  ["Кўриш", "Просмотр"], ["кўриш", "просмотр"], ["Батафсил", "Подробно"],
  ["Юклаш", "Загрузка"], ["юклаш", "загрузка"], ["Юкланган", "Загружено"],
  ["Фильтр", "Фильтр"], ["фильтр", "фильтр"], ["Фильтрларни", "Фильтры"],
  ["Тозалаш", "Очистить"], ["тозалаш", "очистить"],
  ["Бошқарув", "Управление"], ["бошқарув", "управление"],
  ["панели", "панель"], ["Панели", "Панель"],
  ["Тизим", "Система"], ["тизим", "система"], ["Тизимга", "В систему"],
  ["Ҳолат", "Статус"], ["ҳолат", "статус"], ["Ҳолати", "Статус"],
  ["Сана", "Дата"], ["сана", "дата"], ["Санаси", "Дата"],
  ["Вақт", "Время"], ["вақт", "время"],
  ["Изоҳ", "Примечание"], ["изоҳ", "примечание"],
  ["Тавсиф", "Описание"], ["тавсиф", "описание"], ["Тавсифи", "Описание"],
  ["Ном", "Название"], ["ном", "название"], ["Номи", "Название"],
  ["Рақам", "Номер"], ["рақам", "номер"], ["Рақами", "Номер"],
  ["Қават", "Этаж"], ["қават", "этаж"],
  ["Жойлашув", "Расположение"], ["жойлашув", "расположение"],
  ["Физик", "Физическое"], ["физик", "физическое"],
  ["Фаол", "Активный"], ["фаол", "активный"], ["Нофаол", "Неактивный"],
  ["Янги", "Новый"], ["янги", "новый"], ["Охирги", "Последний"],
  ["Бугун", "Сегодня"], ["бугун", "сегодня"],
  ["Барча", "Все"], ["барча", "все"], ["Барчаси", "Все"],
  ["Топилди", "Найдено"], ["топилди", "найдено"], ["Топилмади", "Не найдено"],
  ["Муваффақият", "Успех"], ["Хатолик", "Ошибка"], ["хатолик", "ошибка"],
  ["Юкланмоқда", "Загрузка"], ["юкланмоқда", "загрузка"],
  ["Қабул", "Приём"], ["қабул", "приём"],
  ["Фойдаланувчи", "Пользователь"], ["фойдаланувчи", "пользователь"],
  ["Ёпиш", "Закрыть"], ["Бекор қилиш", "Отмена"],
  ["Йўқ", "Нет"], ["Ҳа", "Да"],
  ["Жойида", "На месте"], ["Берилган", "Выдан"],
  ["Йўқ қилинган", "Удалён"],
  ["Номаълум", "Неизвестно"], ["Киритилмаган", "Не указано"],
  ["Жараён", "Прогресс"], ["Саҳифа", "Страница"],
  ["Гуруҳ", "Группа"], ["гуруҳ", "группа"],
  ["Фамилия", "Фамилия"], ["фамилия", "фамилия"],
  ["Исми", "Имя"], ["исми", "имя"],
  ["Лавозим", "Должность"], ["лавозим", "должность"],
  ["Бўлим", "Отдел"], ["бўлим", "отдел"],
  ["Телефон", "Телефон"], ["телефон", "телефон"],
  ["Файл", "Файл"], ["файл", "файл"],
  ["Максимал", "Максимальный"], ["максимал", "максимальный"],
  ["Масалан", "Например"], ["масалан", "например"],
  ["танланг", "выберите"], ["Танланг", "Выберите"],
  ["қўшиш", "добавить"], ["Қўшиш", "Добавить"],
  ["рўйхат", "список"], ["Рўйхат", "Список"],
  ["Статистика", "Статистика"], ["статистика", "статистика"],
  ["Инвентар", "Инвентарь"], ["инвентар", "инвентарь"],
  ["Омбор", "Хранилище"], ["омбор", "хранилище"],
  ["маълумотнома", "справочник"], ["Маълумотнома", "Справочник"],
  ["Аудит", "Аудит"], ["аудит", "аудит"],
  ["Журнал", "Журнал"], ["журнал", "журнал"],
  ["Институт", "Институт"], ["институт", "институт"],
  ["Илтимос", "Пожалуйста"], ["илтимос", "пожалуйста"],
  ["маълумот", "данные"], ["Маълумот", "Данные"],
  ["маълумотлар", "данные"], ["Маълумотлар", "Данные"],
  ["жами", "всего"], ["Жами", "Всего"],
  ["та", "шт."],
  ["мавжуд эмас", "отсутствует"],
  ["юз берди", "произошла"],
  ["киритинг", "введите"], ["Киритинг", "Введите"],
  ["тўлдиринг", "заполните"], ["Тўлдиринг", "Заполните"],
  ["барча", "все"], ["Барча", "Все"],
  ["ҳуқуқлар ҳимояланган", "все права защищены"],
];

const CYRILLIC_RE = /[А-Яа-яЁёЎўҒғҚқ]/;

function cyrillicToLatin(str) {
  if (!str) return str;
  let s = str;
  s = s.replace(/Ш/g, "Sh").replace(/ш/g, "sh");
  s = s.replace(/Ч/g, "Ch").replace(/ч/g, "ch");
  s = s.replace(/Ю/g, "Yu").replace(/ю/g, "yu");
  s = s.replace(/Я/g, "Ya").replace(/я/g, "ya");
  s = s.replace(/Ё/g, "Yo").replace(/ё/g, "yo");
  s = s.replace(/Ў/g, "O'").replace(/ў/g, "o'");
  s = s.replace(/Ғ/g, "G'").replace(/ғ/g, "g'");
  const map = {
    А: "A", а: "a", Б: "B", б: "b", В: "V", в: "v", Г: "G", г: "g",
    Д: "D", д: "d", Е: "E", е: "e", Ж: "J", ж: "j", З: "Z", з: "z",
    И: "I", и: "i", Й: "Y", й: "y", К: "K", к: "k", Л: "L", л: "l",
    М: "M", м: "m", Н: "N", н: "n", О: "O", о: "o", П: "P", п: "p",
    Р: "R", р: "r", С: "S", с: "s", Т: "T", т: "t", У: "U", у: "u",
    Ф: "F", ф: "f", Х: "X", х: "x", Ҳ: "H", ҳ: "h", Қ: "Q", қ: "q",
    Э: "E", э: "e", ъ: "'", Ъ: "'",
  };
  return [...s].map((c) => map[c] ?? c).join("");
}

function applyWords(text, words) {
  let result = text;
  const sorted = [...words].sort((a, b) => b[0].length - a[0].length);
  for (const [from, to] of sorted) {
    result = result.split(from).join(to);
  }
  return result;
}

/** Map Cyrillic Uzbek strings → English using known Latin-key translations */
const EN_BY_CYRL = {};
for (const [key, cyrl] of Object.entries(entries)) {
  if (EN[key]) EN_BY_CYRL[cyrl] = EN[key];
}
for (const [latin, english] of EN_PHRASES) {
  if (entries[latin]) EN_BY_CYRL[entries[latin]] = english;
}

function toEnglish(key, cyrl) {
  if (EN[key] !== undefined) return EN[key];
  const phraseHit = EN_PHRASES.find(([f]) => f === key);
  if (phraseHit) return phraseHit[1];
  if (cyrl && EN_BY_CYRL[cyrl]) return EN_BY_CYRL[cyrl];

  let result = applyPhrases(key, EN_PHRASES);
  if (result !== key && !CYRILLIC_RE.test(result)) return result;

  result = applyWords(key, EN_WORDS);
  if (result !== key && !CYRILLIC_RE.test(result)) return result;

  if (cyrl && CYRILLIC_RE.test(cyrl)) {
    result = applyWords(cyrillicToLatin(cyrl), EN_WORDS);
    if (!CYRILLIC_RE.test(result)) return result;
  }

  return key;
}

function toRussian(key, cyrl) {
  if (RU[key] !== undefined) return RU[key];
  if (RU_PHRASES.some(([f]) => cyrl === f || key === f)) {
    const hit = RU_PHRASES.find(([f]) => cyrl === f || key === f);
    return hit[1];
  }
  let result = applyPhrases(cyrl, RU_PHRASES);
  if (result !== cyrl) return result;
  result = applyWords(cyrl, RU_WORDS);
  return result;
}

// Add branding to cyrillic
const cyrlOut = { ...entries };
cyrlOut.Arxive = "Архив";
cyrlOut["FJSTI Arxivi"] = "FJSTI Архиви";
cyrlOut["Arxive. Barcha huquqlar himoyalangan."] = "Архив. Барча ҳуқуқлар ҳимояланган.";

let cyrlFile = "export const cyrillicTranslations: Record<string, string> = {\n";
let enFile = "export const englishTranslations: Record<string, string> = {\n";
let ruFile = "export const russianTranslations: Record<string, string> = {\n";

const allKeys = [...new Set([...Object.keys(cyrlOut), "Arxive", "FJSTI Arxivi", "Arxive. Barcha huquqlar himoyalangan."])];

for (const key of allKeys.sort()) {
  const cy = cyrlOut[key] ?? entries[key] ?? key;
  let en = toEnglish(key, cy);
  if (CYRILLIC_RE.test(en)) {
    en = applyWords(cyrillicToLatin(cy), EN_WORDS);
  }
  if (CYRILLIC_RE.test(en)) en = key;
  const ru = toRussian(key, cy);
  cyrlFile += `  "${esc(key)}": "${esc(cy)}",\n`;
  enFile += `  "${esc(key)}": "${esc(en)}",\n`;
  ruFile += `  "${esc(key)}": "${esc(ru)}",\n`;
}

cyrlFile += "};\n";
enFile += "};\n";
ruFile += "};\n";

fs.writeFileSync(path.join(root, "src/i18n/cyrillic.ts"), cyrlFile);
fs.writeFileSync(path.join(root, "src/i18n/english.ts"), enFile);
fs.writeFileSync(path.join(root, "src/i18n/russian.ts"), ruFile);

// Quality report
let enBad = 0, ruBad = 0;
const uzPat = /\b(hujjat|arxiv|kategor|shkaf|talaba|xodim|tizim|saqlash|qidiruv|foydalanuvchi|qabul|o'chirish|tahrirlash|ko'rish|yuklanmoqda)\b/i;
for (const key of allKeys) {
  const en = toEnglish(key, cyrlOut[key] ?? "");
  const ru = toRussian(key, cyrlOut[key] ?? "");
  if (en === key || uzPat.test(en)) enBad++;
  if (!/[А-Яа-яЁё]/.test(ru) && ru === key) ruBad++;
}
console.log(`Built ${allKeys.length} keys. EN needs review: ~${enBad}, RU gaps: ~${ruBad}`);
