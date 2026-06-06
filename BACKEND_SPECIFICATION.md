# 📋 TEXNIK TOPSHIRIQ (TECHNICAL SPECIFICATION)
## HEMIS Oliy Ta‘lim Muassasasi Raqamli Arxiv Tizimi (Digital Archive Backend)

Ushbu hujjat **HEMIS Oliy Ta'lim Muassasasi Raqamli Arxiv Tizimi** loyihasi uchun to'liq va mukammal ishlab chiqilgan backend tizimining texnik topshirig'idir (backend platformasini qaytadan yaratish yoki integratsiya qilish uchun qo‘llanma).

---

## 1. LOYIHA HAQIDA UMUMIY MA'LUMOT
Loyiha oliy ta'lim muassasalari (fakultet, kafedra, dekanat) talabalarining qog'oz shaklidagi arxiv hujjatlarini (Reyting daftari, Diplom ilovasi, Akademik ma’lumotnomalar va b.) raqamli tizimga kiritish, ularning jismoniy (fizik) arxiv javonlaridagi o'rni (Stellaj va Qavat) ma'lumotlarini inventarizatsiya qilish hamda tezkor qidiruv, yuklab olish va chop etish imkonini beruvchi to'liq tizimdir.

---

## 2. TIZIM MEXANIZMI VA ARXITEKTURASI

Tizim uch qavatli (3-tier) arxitekturaga asoslanishi tavsiya etiladi:
*   **Client Layer**: React 18+ (Vite) Single Page Application (SPA) - Foydalanuvchi interfeysi.
*   **Server Layer**: Node.js + Express.js API Gateway (TypeScript yoki JavaScript es6).
*   **Database Layer**: Obyektli-relyatsion ma'lumotlar bazasi (Relational Database) - **PostgreSQL** yoki **MySQL / MariaDB** (katta hajmli yuklamalar, tranzaksiyalar va ACID talablari uchun optimal tanlov).

```
   ┌────────────────────────────────┐
   │ React SPA Client (Front-end)   │
   └───────────────┬────────────────┘
                   │ HTTPS REST API Requests (JSON + JWT)
   ┌───────────────▼────────────────┐
   │ Node.js/Express Backend Server  │  ◄── Node.js / Express.js
   └───────────────┬────────────────┘
                   │ ORM Queries (Sequelize / Prisma / TypeORM)
   ┌───────────────▼────────────────┐
   │ PostgreSQL / SQLite Database   │  ◄── Relational storage (ACID)
   └────────────────────────────────┘
```

---

## 3. RELYATSION MA'LUMOTLAR BAZASI SXEMASI (DATABASE SCHEMA)

Ma'lumotlar bazasining asosiy jadvallari va ularning bog'lanish (Entity Relation) sxemalari quyidagicha shakllantiriladi:

### 3.1. `users` (Foydalanuvchilar va Mas'ullar jadvali)
| Maydon nomi | Turi | Tavsif | Cheklovlar |
| :--- | :--- | :--- | :--- |
| `id` | VARCHAR(50) / UUID | Birlamchi kalit (Primary Key) | Auto-generated, PK |
| `username` | VARCHAR(50) | Tizimga kirish logini | Unique, Not Null |
| `passwordHash` | VARCHAR(255) | BCrypt bilan shifrlangan parol | Not Null |
| `fullName` | VARCHAR(100) | Mas'ul xodimning to'liq ismi | Not Null |
| `role` | ENUM | Foydalanuvchi roli: `ADMIN`, `XODIM`, `VIEWER` | Not Null, Default: `VIEWER` |
| `isActive` | BOOLEAN | Foydalanuvchi faollik holati | Default: `true` |
| `lastLoginAt` | TIMESTAMP | So'nggi marta kirgan vaqti | Nullable |
| `createdAt` | TIMESTAMP | Yaratilgan vaqti | Default: `CURRENT_TIMESTAMP` |

### 3.2. `students` (Talabalar jildi)
| Maydon nomi | Turi | Tavsif | Cheklovlar |
| :--- | :--- | :--- | :--- |
| `id` | VARCHAR(50) / UUID | Birlamchi kalit (Primary Key) | PK |
| `lastName` | VARCHAR(50) | O'quvchining familiyasi | Not Null |
| `firstName` | VARCHAR(50) | O'quvchining ismi | Not Null |
| `middleName` | VARCHAR(50) | O'quvchining otasining ismi | Nullable |
| `studentId` | VARCHAR(20) | HEMIS talaba ID raqami (unikal) | Unique, Not Null |
| `groupName` | VARCHAR(20) | Gurhi nomi (masalan: IF-20) | Not Null |
| `birthDate` | DATE | Tug'ilgan sanasi | Nullable |
| `phone` | VARCHAR(20) | Telefon raqami | Nullable |
| `createdAt` | TIMESTAMP | Yozuv yaratilgan vaqt | Default: `CURRENT_TIMESTAMP` |

### 3.3. `categories` (Hujjat Kategoriyalari)
| Maydon nomi | Turi | Tavsif | Cheklovlar |
| :--- | :--- | :--- | :--- |
| `id` | VARCHAR(50) / UUID | Kategoriya unikal IDsi | PK |
| `name` | VARCHAR(100) | Kategoriya nomi (masalan: "Diplom ilovasi") | Not Null, Unique |
| `description` | TEXT | Kategoriya haqida batafsil izoh | Nullable |
| `isActive` | BOOLEAN | Faollik holati (so'rovlarda chiqishi) | Default: `true` |
| `createdAt` | TIMESTAMP | Yaratilgan vaqti | Default: `CURRENT_TIMESTAMP` |

### 3.4. `cabinets` (Arxiv Stellaj/Shkaflari)
| Maydon nomi | Turi | Tavsif | Cheklovlar |
| :--- | :--- | :--- | :--- |
| `id` | VARCHAR(50) / UUID | Shkaf unikal IDsi | PK |
| `name` | VARCHAR(100) | Shkaf raqami yoki nomi | Not Null, Unique |
| `description` | TEXT | Shkafning joylashuvi va izohi | Nullable |
| `maxFloor` | INT | Shkafdagi maksimal mumkin bo'lgan qavatlar soni | Not Null, Default: 9 |
| `isActive` | BOOLEAN | Arxivda mavjudligi va faolligi | Default: `true` |
| `createdAt` | TIMESTAMP | Ko'rsatilgan vaqt | Default: `CURRENT_TIMESTAMP` |

### 3.5. `documents` (Raqamli Hujjatlar va Fayllar)
| Maydon nomi | Turi | Tavsif | Cheklovlar |
| :--- | :--- | :--- | :--- |
| `id` | VARCHAR(50) / UUID | Hujjat kodi (Primary Key) | PK |
| `studentId` | VARCHAR(50) | Bog'liq talaba IDsi | Foreign Key (`students.id`) |
| `categoryId` | VARCHAR(50) | Bog'liq kategoriya IDsi | Foreign Key (`categories.id`) |
| `cabinetId` | VARCHAR(50) | Bog'liq shkaf IDsi | Foreign Key (`cabinets.id`) |
| `floor` | INT | Shkafdagi fizik qavat raqami | Not Null |
| `filePath` | VARCHAR(255) | Server diskidagi fayl nomi (.pdf) | Not Null |
| `fileSize` | INT | Fayl hajmi (baytlarda) | Not Null |
| `originalFilename` | VARCHAR(255) | yuklash vaqtida faylning asl nomi | Not Null |
| `status` | VARCHAR(20) | Hujjat holati (`JOYIDA`, `BERILGAN`) | Default: `JOYIDA` |
| `notes` | TEXT | Hujjat bo'yicha qo'shimcha izoh yoki nuqsonlar | Nullable |
| `receivedAt` | TIMESTAMP | Arxivga qabul qilingan vaqt | Default: `CURRENT_TIMESTAMP` |
| `receivedByUserId` | VARCHAR(50) | Hujjatni qabul qilgan xodim IDsi | Foreign Key (`users.id`) |
| `issuedTo` | VARCHAR(100) | Hujjat vaqtinchalik berilgan shaxs ismi | Nullable (status `BERILGAN` bo'lsa) |
| `issuedAt` | TIMESTAMP | Tashqariga berilgan vaqti | Nullable |
| `issuedByUserId` | VARCHAR(50) | Hujjatni ruxsat berib yuborgan xodim | Foreign Key (`users.id`) |
| `deletedAt` | TIMESTAMP | Soft-delete uchun o'chirilgan vaqti | Nullable |
| `createdAt` | TIMESTAMP | Yaratilgan sanasi | Default: `CURRENT_TIMESTAMP` |

### 3.6. `audit_logs` (Harakatlar Jurnali / Xavfsizlik Auditi)
| Maydon nomi | Turi | Tavsif | Cheklovlar |
| :--- | :--- | :--- | :--- |
| `id` | VARCHAR(50) / UUID | Log unikal IDsi | PK |
| `userId` | VARCHAR(50) | Harakatni bajargan administrator / xodim kodi | Foreign Key (`users.id`) |
| `userName` | VARCHAR(100) | Mas'ulning To'liq Ismi (Audit qulayligi uchun) | Not Null |
| `action` | TEXT | Amalga oshirilgan operatsiya tafsiloti | Not Null |
| `entity` | VARCHAR(50) | Ob'ekt turi (`Document`, `Cabinet`, `Category`, `User`) | Not Null |
| `entityId` | VARCHAR(50) | Ob'ektning jismoniy IDsi | Nullable |
| `createdAt` | TIMESTAMP | Jurnal yozilgan vaqti | Default: `CURRENT_TIMESTAMP` |

---

## 4. REST API ENDPOINTS REYESTRI

Barcha API so'rovlari uchun asosiy prefiks `/api` hisoblanadi. JSON formati ishlatiladi va `Authorization: Bearer <TKN>` ko'rinishida JWT token talab qilinadi (Auth talab qilinmaydigan yo'llardan tashqari).

### 4.1. Avtorizatsiya & Profil (Public/Private)
*   `POST /api/auth/login` - Tizimga kirish (username va password). Token, user ob'ektini qaytaradi.
*   `POST /api/auth/logout` - Tizimdan chiqish.
*   `GET /api/auth/me` - Tizimdagi aktual sessiyani aniqlash va profil ma'lumotlarini olish.

### 4.2. Arxiv Hujjatlari Boshqaruvi
*   `GET /api/documents` - Hujjatlarni barcha filtrlari bo'yicha qidirib olish (matn, kategoriya, shkaf, sana, status, pagination).
*   `GET /api/documents/:id` - Hujjatning barcha relyatsion ma'lumotlari (Talaba, Kategoriya, Shkaf, Mas'ullar) bilan birga to'liq tafsiloti.
*   `POST /api/documents` - Yangi arxiv hujjati qabul qilish (talaba va kategoriyalar dinamik ravishda mavjud bo'lmasa yaratiladi). PDF fayli multipart/form-data yoki Base64 shaklida qabul qilinib diskka saqlanadi.
*   `PUT /api/documents/:id` - Hujjat ma'lumotlarini tahrirlash (misol uchun fizik joylashuv, kategoriya, shkafni o'zgartirish).
*   `DELETE /api/documents/:id` - Hujjatni tizimdan o'chirish (Xavfsizlik maqsadida bazada jismoniy o'chirilmaydi, faqat `deletedAt` vaqt belgisi qo'yiladi- "Soft Delete").
*   `GET /api/documents/pdf/:id` - Hujjatning asl .pdf faylini stream qilib yuklab olish yoki browserda ochish.
*   `POST /api/documents/issue/:id` - Hujjatni vaqtinchalik talabaga yoki boshqa maxsus shaxsga olib ketish uchun berish (`status` = `BERILGAN` bo'ladi).
*   `POST /api/documents/return/:id` - Berilgan hujjat qaytarib joyiga qo'yilganda holatni yangilash (`status` = `JOYIDA`).

### 4.3. Hujjat Kategoriyalari
*   `GET /api/categories` - Tizimdagi barcha faol hujjat kategoriyalarini ro'yxati.
*   `POST /api/categories` - Yangi kategoriya yaratish.
*   `PUT /api/categories/:id` - Mavjud kategoriyani tahrirlash.
*   `DELETE /api/categories/:id` - Kategoriyani o'chirish (agar unda faol hujjatlar bo'lmasa).

### 4.4. Arxiv Stellaj / Shkaflari
*   `GET /api/cabinets` - Barcha arxiv shkaflari ro'yxati va ulardagi qavatlar.
*   `POST /api/cabinets` - Yangi shkaf qo'shish (qavatlar soni ko'rsatilgan holda).
*   `PUT /api/cabinets/:id` - Shkaf ma'lumotlarini o'zgartirish.
*   `DELETE /api/cabinets/:id` - Shkafni o'chirish (agar unda saqlanayotgan hujjatlar bo'lmasa).

### 4.5. Talabalar Boshqaruvi (HEMIS ma'lumotlari)
*   `GET /api/students` - HEMIS talabalar bazasi qidiruvi.
*   `POST /api/students` - Yangi talaba qo'shish (agar HEMIS integratsiyasi bo'lmasa, qo'lda kiritish).

### 4.6. Tahliliy ko'rsatkichlar & Tizim Audit
*   `GET /api/stats` - Bosh panel (Dashboard) uchun tahliliy ko'rsatkichlar (jami hujjatlar, shkaflar soni, oxirgi 30 kunda qabul qilinganlar, kategoriyalar kesimidagi hujjatlar diagrammasi).
*   `GET /api/audit-logs` - Tizimda kim qachon qanday o'zgarishlar kiritganligini ko'rsatuvchi xavfsizlik jurnali (faqat `ADMIN` rolidagilar ko'ra oladi).

---

## 5. XAVFSIZLIK CHORALARI VA TIZIM CHIDAMLILIGI

Backend xavfsiz va ishonchli ishlashi uchun quyidagi muhim normalar joriy etilishi majburiydir:

1.  **Parollarni Shifrlash**: Hech qaysi foydalanuvchining paroli ma'lumotlar bazasida ochiq matn (plain-text) ko'rinishida saqlanmasligi lozim. Buning uchun kamida **BCrypt** algoritmi va 10 chi darajali tuz (salt) orqali parollarni xeshlab saqlash joriy qilinadi.
2.  **API Autentifikatsiyasi (JWT)**: So'rovlar xavfsizligini ta'minlash maqsadida **JSON Web Token (JWT)** texnologiyasidan foydalaniladi. Foydalanuvchi muvaffaqiyatli kirgach, backend unga unikal token beradi. Token o'tish muddati 24 soat qilib belgilanadi.
3.  **Rollar Muhofazasi (RBAC)**: Rollarga qarab API ruxsatlari nazorat qilinadi:
    *   `VIEWER`: Faqat hujjatlarni qidirishi va chop etishi mumkin. Hujjat qo'sha olmaydi, tahrirlay olmaydi, o'chira olmaydi.
    *   `XODIM`: Hujjatlarni qidiradi, tizimga yuklaydi, tahrirlaydi, berilgan/joyida holatini o'zgartiradi. Sozlamalar va user jurnallarini tahrirlay olmaydi.
    *   `ADMIN`: Cheksiz huquqlarga ega (User qo'shish, o'chirish, spravochniklar boshqaruvi, audit kurnalini tozalash).
4.  **SQL Inyektsiyalari va Xavfli So'rovlar**: So'rovlarni unifikatsiyalash va SQL in'ektsiyalaridan himoya qilish uchun **Sequelize**, **Prisma**, yoki preprepared statements ishlatiladigan ORM'lar qo'llanishi shart.
5.  **Payload va File upload cheklovi**: PDF yuklashda fayl hajmini maksimal **15 Megabaytgacha** cheklash lozim. Cheklov Node.js'ning body-parser va multer paketlari orqali boshqariladi.

---

## 6. MULTIMEDIA & PDF INTEGRATSIYASIGA RUXSATLAR

*   Foydalanuvchi tomonidan yuklangan fayllar `uploads/` deb nomlangan tizim ichidagi muhofazalangan katalogda saqlanadi.
*   Tizimning xavfsiz ishlashi hamda har qanday xatarli fayllarni (masalan .exe, .js fayllar) yuklab olishni oldini olish maqsadida, backend tizim yuklanayotgan fayl kengaytmasini (extension) va MIME-turini qat'iy tekshiradi: faqatgina `application/pdf` turiga ruxsat beriladi.
*   Yuklangan fayllarga to'g'ridan-to'g'ri (direct link static mount) kirish bloklanadi. Fayllar faqat `/api/documents/pdf/:id` yo'li orqali, sessiya tekshirilgan holda `res.sendFile()` funksiyasi yordamida stream ko'rinishida jo'natiladi.

---

## 7. XULOSA
Ushbu texnik topshiriqda belgilangan mezonlar zamonaviy arxiv standartlariga to'liq javob berib, tizim drayveri sifatida uzoq yillar barqaror va xavfsiz ishlashini kafolatlaydi. Loyihani amalga oshirish jarayonida qayd etilgan struktura va arxitekturadan og'shmaslik tavsiya etiladi.
