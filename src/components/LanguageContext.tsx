import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type Language = "cyrillic" | "latin";

interface LanguageContextProps {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (text: string) => string;
  transliterateText: (text: string, to: Language) => string;
}

const LanguageContext = createContext<LanguageContextProps | undefined>(undefined);

// A dictionary for perfectly translating core UI elements rather than relying solely on programmatic transliteration.
// Highly optimized and precise vocabulary.
const uiTranslations: { [key: string]: string } = {
  // Authentication & Login Screen
  "Foydalanuvchi kirishi": "Фойдаланувчи кириши",
  "HEMIS tizimi va fizik arxiv integratsiyalashgan ombori": "HEMIS тизими ва физик архив интеграциялашган омбори",
  "Kadr va hujjatchilik jildlarini raqamli boshqaruv platformasi. Tizimga kirish uchun login va parol kiriting.": "Кадр ва ҳужжатчилик жилдларини рақамли бошқарув платформаси. Тизимга кириш учун логин ва парол киритинг.",
  "Foydalanuvchi nomi (Username)": "Фойдаланувчи номи (Username)",
  "Parol": "Парол",
  "Kirish": "Кириш",
  "Tizimga kirish...": "Тизимга кириш...",
  "Xato": "Хато",
  "Tizimga muvaffaqiyatli kirsangiz, barcha spravochniklar yuklanadi.": "Тизимга муваффақиятли кирсангиз, барча маълумотномалар юкланади.",

  // Headers & Global layout text
  "Institut Arxivi": "Институт Архиви",
  "Dashboard // Umumiy Statistika": "Дашборд // Умумий Статистика",
  "Qidiruv (Search) // Hujjatlar Qidiruvi": "Қидирув // Ҳужжатлар Қидируви",
  "Hujjat qabul (Intake) // Yangi Hujjat Qo'shish": "Ҳужжат қабул қилиш // Янги Ҳужжат Қўшиш",
  "Hujjatlar ro'yxati // Arxiv Hujjatlari Ombori": "Ҳужжатлар рўйхати // Архив Ҳужжатлари Омбори",
  "Kategoriyalar & Shkaflar // Tizim Spravochniklari": "Категориялар & Шкафлар // Тизим Маълумотномалари",
  "Admin panel // Tizim Sozlamalari & Audit": "Админ панели // Тизим Созламалари & Аудит",
  "Admin panel // Foydalanuvchilar boshqaruvi": "Админ панели // Фойдаланувчилар бошқаруви",
  "Bosh Arxivchi (Admin)": "Бош Архивчи (Админ)",
  "Arxiv Operator": "Архив Оператори",
  "Arxivchi (Viewer)": "Архив кўрувчи (Viewer)",
  "Tizim holati": "Тизим ҳолати",
  "ONLINE": "ФАОЛ (ONLINE)",
  "Kanal": "Канал",
  "Sertifikatlangan LAN": "Сертификатланган LAN",
  "Faol xodim": "Фаол ходим",
  "Arxiv Departament": "Архив Департаменти",

  // Sidebar Items
  "Asosiy Panel": "Асосий Панел",
  "Hujjat Qabul": "Ҳужжат Қабул Қилиш",
  "Tezkor Qidiruv": "Тезкор Қидирув",
  "Arxiv Repozitori": "Архив Репозиториси",
  "Kategoriya / Shkaf": "Категория / Шкаф",
  "Tizim Auditi / Admin": "Тизим Аудити / Админ",
  "Chiqish": "Чиқиш",

  // Dashboard Page
  "Ushbu kunda topshirilgan yangi arxiv hujjatlari soni": "Ушбу кунда топширилган янги архив ҳужжатлари сони",
  "Bugun topshirildi": "Бугун топширилди",
  "Tizimdagi faol va arxivga bog'langan turlar": "Тизимдаги фаол ва архивга боғланган турлар",
  "Faol Kategoriyalar": "Фаол Категориялар",
  "Sinflandirilgan va joylashtirilgan javonlar": "Синфлантирилган ва жойлаштирилган жавонлар",
  "Jismoniy Shkaflar": "Жисмоний Шкафлар",
  "ARXIVDAGI JAMI HUJJATLAR": "АРХИВДАГИ ЖАМИ ҲУЖЖАТЛАР",
  "JAMI RAQAMLASHTIRILGAN HUJJATLAR": "ЖАМИ РАҚАМЛАШТИРИЛГАН ҲУЖЖАТЛАР",
  "Tizim tahlili & Tezkor havolalar": "Тизим таҳлили & Тезкор ҳаволалар",
  "Hozirgina yangi hujjat qabul qilish lozimmi? Talaba ma'lumotlari kiritish va raqamli varaqlar (.pdf) fizik omborga bog'lanadi.": "Ҳозирда янги ҳужжат қабул қилиш лозимми? Талаба маълумотлари киритилиб, рақамли варақлар (.pdf) физик омборга боғланади.",
  "Yangi hujjat kiritish": "Янги ҳужжат киритиш",
  "Arxivda biror o'quvchi hujjatini izlayapsizmi? Student ID (HEMIS kodi), ismi yoki sana orqali darhol qidirish.": "Архивда бирор ўқувчи ҳужжатини излаяпсизми? Student ID (HEMIS коди), исми ёки сана орқали дарҳол қидириш.",
  "Tezkor qidiruvga o'tish": "Тезкор қидирувга ўтиш",
  "Hujjatlar dinamikasi (Oylar bo'yicha)": "Ҳужжатлар динамикаси (Ойлар бўйича)",
  "Kategoriyalar bo'yicha tahlil": "Категориялар бўйича таҳлил",
  "SO'NGGI QABUL QILINGAN HUJJATLAR": "СЎНГГИ ҚАБУЛ ҚИЛИНГАН ҲУЖЖАТЛАР",
  "Arxivga yangi kelib tushgan oxirgi 5 ta hujjatning qisqa ro'yxati": "Архивга янги келиб тушган охирги 5 та ҳужжатнинг қисқа рўйхати",
  "Noma'lum O'quvchi": "Номаълум Ўқувчи",
  "Natijalar yuklanmoqda...": "Натижалар юкланмоқда...",
  "Tahliliy ma'lumotlarni hisoblashda xatolik yuz berdi": "Таҳлилий маълумотларни ҳисоблашда хатолик юз берди",
  "arxivda yozuvlar mavjud emas": "архивда ёзувлар мавжуд эмас",

  // Search Tab Page
  "Hujjatlarni Tezkor Qidirish": "Ҳужжатларни Тезкор Қидириш",
  "HEMIS tizimi orqali hujjat turi, o'quvchi talaba kodi yoki joylashuv bo'yicha tezkor qidiruv paneli": "HEMIS тизими орқали ҳужжат тури, ўқувчи талаба коди ёки жойлашув бўйича тезкор қидирув панели",
  "Fizik Qidiruv Filtrlari (AND mantiqli)": "Физик Қидирув Фильтрлари (AND мантиқли)",
  "Qirqish uchun ism yoki HEMIS kodini kiriting...": "Қидириш учун исм ёки HEMIS кодини киритинг...",
  "Hujjat turini tanlang": "Ҳужжат турини танланг",
  "Barchasi (All)": "Барчаси (Barchasi)",
  "Fizik shkafni saralang": "Физик шкафни сараланг",
  "Qabul qilingan sana (Dan)": "Қабул қилинган сана (Дан)",
  "Qabul qilingan sana (Gacha)": "Қабул қилинган сана (Гача)",
  "Qidirish": "Қидириш",
  "Tozalash": "Тозалаш",
  "Filtrlarni tozalash": "Фильтрларни тозалаш",
  "Topildi": "Топилди",
  "ta yozuv": "та ёзув",
  "Sana bo'yicha saralangan (Yangi birinchi)": "Сана бўйича сараланган (Янги биринчи)",
  "Natijalar saralanmoqda...": "Натижалар сараланмоқда...",
  "Xato yuklanish": "Хато юкланиш",
  "HECH NARSA TOPILMADI": "ҲЕЧ НАРСА ТОПИЛМАДИ",
  "Kiritilgan filtrlar bo'yicha arxivdan mos yozuvlar topilmadi. Qidiruv kalit so'zlari yoki filtrlarni o'zgartirib ko'ring.": "Киритилган фильтрлар бўйича архивдан мос ёзувлар топилмади. Қидирув калит сўзлари ёки фильтрларни ўзгартириб кўринг.",
  "O'quvchi F.I.Sh.": "Ўқувчи Ф.И.Ш.",
  "Student ID (Talaba kodi)": "Student ID (Талаба коди)",
  "Hujjat turi (Kategoriya)": "Ҳужжат тури (Категория)",
  "Qabul sanasi": "Қабул санаси",
  "Fizik Shkaf": "Физик Шкаф",
  "Qavat (Plast)": "Қават (Пласт)",
  "Holat": "Ҳолат",
  "Amallar": "Амаллар",
  "Joyida": "Жойида",
  "Berilgan": "Берилган",
  "Batafsil ma'lumot va PDF korish": "Батафсил маълумот ва PDF кўриш",
  "Fizik joylashuv voucherini chop etish": "Физик жойлашув кодини чоп этиш",
  "Chop etish": "Чоп этиш",
  
  // Document Card Side Panel / Modal
  "Arxiv Kartasi: ": "Архив Картаси: ",
  "Hujjat haqida batafsil ma'lumot": "Ҳужжат ҳақида батафсил маълумот",
  "Yopish": "Ёпиш",
  "Hujjat kategoriyasi": "Ҳужжат категорияси",
  "Hujjat holati": "Ҳужжат ҳолати",
  "Arxivga qabul qildi (Xodim)": "Архивга қабул қилди (Ходим)",
  "Qabul qilingan sana & vaqt": "Қабул қилинган сана & вақт",
  "Barcha ma'lumotlar': ": "Барча маълумотлар",
  "Talaba kodi (ID)": "Талаба коди (ID)",
  "Akademik guruh": "Академик гуруҳ",
  "Tug'ilgan yili": "Туғилган йили",
  "Muloqot telefoni": "Мулоқот телефони",
  "Fayl talqinlari": "Файл талқинлари",
  "Asl fayl nomi": "Асл файл номи",
  "Hajmi": "Ҳажми",
  "Yuklab olish": "Юклаб олиш",
  "Fizik joylashuv": "Физик жойлашув",
  "qavat": "қават",
  "Chiqarilgan sana": "Чиқарилган сана",
  "Vaqtincha olib ketdi (Mas'ul shaxs)": "Вақтинча олиб кетди (Масъул шахс)",
  "Topshirgan xodim": "Топширган ходим",
  "PDF Hujjat Korish": "PDF Ҳужжат Кўриш",
  "Sessiya tekshirilmoqda yoki PDF fayl serverda mavjud emas": "Сессия текширилмоқда ёки PDF файл серверда мавжуд эмас",

  // Slip Printing Form
  "OLIY TA'LIM MUASSASASI ARXIVI": "ОЛИЙ ТАЪЛИМ МУАССАСАСИ АРХИВИ",
  "FIZIK NUSXA HUDUDIY CHOP QILISH VOUCHERI": "ФИЗИК НУСХА ҲУДУДИЙ ЧОП ҚИЛИШ ВУЧЕРИ",
  "Hujjat Unikal kodi (ID)": "Ҳужжат Уникал коди (ID)",
  "Talaba F.I.Sh.": "Талаба Ф.И.Ш.",
  "HEMIS ID": "HEMIS ID",
  "Guruh": "Гуруҳ",
  "Fizik Joylashuvi": "Физик Жойлашуви",
  "Arxivga Qabul Qilingan": "Архивга Қабул Қилинган",
  "Mas'ul Operator": "Масъул Оператор",
  "QAYTARIB TOPSHIRISH SHARTI: Hujjat vaqtinchalik olinsa, 3 ish kuni ichida qayta joyiga tiklanishi shart!": "ҚАЙТАРИБ ТОПШИРИШ ШАРТИ: Ҳужжат вақтинчалик олинса, 3 иш куни ичида қайта жойига тикланиши шарт!",
  "Slip": "Вучер",

  // Intake Tab (New Document Intake)
  "Arxivga yangi hujjat qabul qilish (Physical File Intake)": "Архивга янги ҳужжат қабул қилиш (Physical File Intake)",
  "Yangi qog'ozli nusxani raqamlashtirish (.pdf) va shkafdagi fizik manzili (Stellaj, qavat) jild bilan bog'lash": "Янги қоғозли нусхани рақамлаштириш (.pdf) ва шкафдаги физик манзили (Стеллаж, қават) жилд билан боғлаш",
  "Talaba Ma'lumotlari": "Талаба Маълумотlari",
  "HEMIS Talaba kodi (*)- tahrirsiz": "HEMIS Талаба коди (*)",
  "HEMIS Talaba kodi (*)": "HEMIS Талаба коди (*)",
  "Talaba unikal kodini kiriting keyin avto-to'ldirish": "Талаба уникал кодини киритинг кейин авто-тўлдириш",
  "Izlash": "Излаш",
  "Familiya (*)": "Фамилия (*)",
  "Ismi (*)": "Исми (*)",
  "Otasining ismi": "Отасининг исми",
  "Guruh nomi (*)": "Гуруҳ номи (*)",
  "Masalan: IF-20": "Масалан: IF-20",
  "Tug'ilgan sanasi": "Туғилган санаси",
  "Telefon raqami (ixtiyoriy)": "Телефон рақами (ихтиёрий)",
  "Hujjat & Fizik Joylashuv Parametrlari": "Ҳужжат & Физик Жойлашув Параметрлари",
  "Hujjat turi (kategoriya) (*)": "Ҳужжат тури (категория) (*)",
  "Kategoriyani tanlang": "Категорияни танланг",
  "Fizik joylashadigan shkaf (*)": "Физик жойлашадиган шкаф (*)",
  "Shkafni tanlang": "Шкафни танланг",
  "Shkafdagi javon (qavat) (*)": "Шкафдаги жавон (қават) (*)",
  "Yozuv / Hujjat qo'shimcha izohi": "Ёзув / Ҳужжат қўшимча изоҳи",
  "Kitob holati, muqovasi shikastlangan tushuntirish va hk...": "Китоб ҳолати, муқоваси шикастланган тушунтириш ва ҳ.к...",
  "Raqamlangan fayl (PDF yuklash) (*)": "Рақамланган файл (PDF юклаш) (*)",
  "Drop zone": "Судраб ташланг ёки танлаш учун босинг",
  "Faqat rasmiy PDF formatidagi fayl yuklang (Maksimal 15 MB)": "Фақат расмий PDF форматидаги файл юкланг (Максимал 15 МБ)",
  "Tanlangan fayl": "Танланган файл",
  "Formani tozalash": "Формани тозалаш",
  "Arxivga Qabul Qilish": "Архивга Қабул Қилиш",
  "Qabul qilinmoqda...": "Қабул қилинмоқда...",
  "Yangi talaba topilmadi, iltimos ma'lumotlarni qo'lda kiriting!": "Янги талаба топилмади, илтимос маълумотларни қўлда киритинг!",
  "HEMIS kodi kiritilmadi": "HEMIS коди киритилмади",
  "Muvaqqat xatolik": "Муваққат хатолик",
  "Muvaffaqiyat": "Муваффақият",
  "Talaba avtomatik izlandi!": "Талаба автоматик изланди!",
  "Ushbu HEMIS kodli talaba bazada topildi! Ma'lumotlar yuklandi.": "Ушбу HEMIS кодли талаба базада топилди! Маълумотлар юкланди.",
  "HEMIS kodli talaba topilmadi. Yangi talaba ma'lumotlarini to'g'ridan-to'g'ri kiriting.": "HEMIS кодли талаба топилмади. Янги талаба маълумотларини тўғридан-тўғри киритинг.",
  "Xatolik ro'y berdi: ": "Хатолик рўй берди: ",
  "HUJJAT QABUL QILINDI!": "ҲУЖЖАТ ҚАБУЛ ҚИЛИНДИ!",
  "Ushbu talabaning raqamli hujjati muvaffaqiyatli arxivlandi va tizimda saqlandi.": "Ушбу талабанинг рақамли ҳужжати муваффақиятли архивланди ва тизимда сақланди.",
  "Yangi jismoniy qabul": "Янги жисмоний қабул",
  "Chop etiladigan yorliq": "Чоп этиладиган ёрлиқ",

  // Repository Tab (Documents Archive Vault)
  "Hujjatlar Umumiy Ro'yxati": "Ҳужжатлар Умумий Рўйхаti",
  "Arxivda ro'yxatdan o'tgan barcha jildlar va fizik nusxalar ombori": "Архивда рўйхатдан ўтган барча жилдлар ва физик нусхалар омбори",
  "Filtrlash & Qidiruv": "Фильтрлаш & Қидирув",
  "Hamma arxiv materiallari": "Ҳамма архив материаллари",
  "HEMIS kod yoki Ism": "HEMIS код ёки Исм",
  "Barcha kategoriyalar": "Барча категориялар",
  "Barcha shkaflar": "Барча шкафлар",
  "Barcha holatlar": "Барча ҳолатлар",
  "Kamida 3 ta belgi kiriting...": "Камида 3 та белги киритинг...",
  "Qabul qilingan sana": "Қабул қилинган сана",
  "Xodim (Qabul qilgan)": "Ходим (Қабул қилган)",
  "Hujjat vaqtinchalik olib chiqilganligi haqida dalolatnoma yozish": "Ҳужжат вақтинчалик олиб чиқилганлиги ҳақида далолатнома ёзиш",
  "Vaqtinchalik berish (Rent file)": "Вақтинчалик бериш (Ижара)",
  "Joyiga qaytarish (Return to Cabinet)": "Жойига қайтариш (Топшириш)",
  "Hujjatni o'chirish faqat Admin huquqiga ega foydalanuvchilarga ruxsat etiladi": "Ҳужжатларни ўчириш фақат Админ ҳуқуқига эга фойдаланувчиларга рухсат этилади",
  "O'chirish": "Ўчириш",
  "Hujjat arxivdan mutlaqo o'chiriladimi?": "Ҳужжат архивдан мутлақо ўчириладими?",
  "HUJJATNI O'CHIRISH!": "ҲУЖЖАТНИ ЎЧИРИШ!",
  "Arxivdan hujjat o'chirilishidan oldin diqqat qiling: Ushbu amalni qaytarib bo'lmaydi! Jismoniy faylni o'chirish ushbu qaydning dasturdan butkul yo'qolishiga sabab bo'ladi.": "Архивдан ҳужжат ўчирилишидан олдин диққат қилинг: Ушбу амални қайтариб бўлмайди! Жисмоний файлни ўчириш ушбу қайднинг дастурдан буткул йўқолишига сабаб бўлади.",
  "O'chirishni tasdiqlayman": "Ўчиришни тасдиқлайман",
  "Hujjatni Vaqtinchalik Tashqariga Berish (Rent Act)": "Ҳужжатни Вақтинчалик Ташқарига Бериш (租借)",
  "Hujjatni talabaga yoki dekanat mas'uliga berish talabini rasmiylashtirish": "Ҳужжатни талабага ёки деканат масъулига бериш талабини расмийлаштириш",
  "Hujjat berilayotgan shaxs (To'liq ism-sharifi) (*)": "Ҳужжат берилаётган шахс (Тўлиқ исм-шарифи) (*)",
  "Masalan: Safarov Sardor Solihovich": "Масалан: Сафаров Сардор Солихович",
  "Sana (*)- tahrirlab bo'lmaydi": "Сана (*)",
  "Arxivdan Chiqarish": "Архивдан Чиқариш",
  "Hujjat Fizik Joyiga To'liq Qaytarildi!": "Ҳужжат Физик Жойига Тўлиқ Қайтарилди!",
  "Hujjatni belgilangan raqamdagi shkaf va javonga qaytarib qo'yganingizdan so'ng, ushbu tugmani bosing. Holat 'Joyida' bo'lib yangilanadi.": "Ҳужжатни белгиланган рақамдаги шкаф ва жавонга қайтариб қўйганингиздан сўнг, ушбу тугмани босинг. Ҳолат 'Жойида' бўлиб янгиланади.",
  "Tasdiqlayman, Joyida": "Тасдиқлайман, Жойида",

  // Settings Tab (Directory configuration)
  "Mundarija va Tizim Sozlamalari": "Мундарижа ва Тизим Созламалари",
  "Arxiv tizimi uchun asosiy spravochniklar, hujjat shakllari va jismoniy shkaf (javon) spetsifikatsiyalari boshqaruvi": "Архив тизими учун асосий маълумотномалар, ҳужжат шакллари ва жисмоний шкаф (жавон) спецификациялари бошқаруви",
  "HUJJAT KATEGORIYALARI": "ҲУЖЖАТ КАТЕГОРИЯЛАРИ",
  "jami: ": "жами: ",
  "Kategoriya nomi (*)": "Категория номи (*)",
  "Izoh / Qisqa tavsifi": "Изоҳ / Қисқа тавсифи",
  "Bekor qilish": "Бекор қилиш",
  "Saqlash": "Сақлаш",
  "O'chirish?": "Ўчириш?",
  "Yo'q": "Йўқ",
  "+ YANGI KATEGORIYA QO'SHISH:": " + ЯНГИ КАТЕГОРИЯ ҚЎШИШ:",
  "Masalan: Reyting daftar": "Масалан: Рейтинг дафтар",
  "Kategoriya qo'shish": "Категория қўшиш",
  "ARXIV SHKAFLARI (STELLAJ)": "АРХИВ ШКАФЛАРИ (СТЕЛЛАЖ)",
  "Shkaf nomi/raqami (*)": "Шкаф номи/рақами (*)",
  "Maksimal qavati (Butun son 1-99) (*)": "Максимал қавати (Бутун сон 1-99) (*)",
  "Bino yoki xonadagi fizik koordinata tavsifi": "Бино ёки хонадаги физик координата тавсифи",
  "+ YANGI SHKAF (STELLAJ) QO'SHISH:": "+ ЯНГИ ШКАФ (СТЕЛЛАЖ) ҚЎШИШ:",
  "Masalan: 4-shkaf (Zaxira)": "Масалан: 4-шкаф (Захира)",
  "Shkaf qo'shish": "Шкаф қўшиш",
  "Arxiv xonasi, 1-qavat metall quti": "Архив хонаси, 1-қават металл қути",
  "Xa": "Ҳа",

  // Admin Tab (Security and system accounts)
  "Tizim Nazorati va Xavfsizlik Auditi": "Тизим Назорати ва Хавфсизлик Аудити",
  "Administratorlar uchun maxsus: foydalanuvchilar hisoblari boshqaruvi va tizim harakatlari to'liq xavfsizlik audit jurnali": "Администраторлар учун махсус: фойдаланувчилар ҳисоблари бошқаруви ва тизим ҳаракатлари тўлиқ хавфсизлик аудит журнали",
  "TIZIMDAGI FOYDALANUVCHILAR": "ТИЗИМДАГИ ФОЙДАЛАНУВЧИЛАР",
  "Yangi Mas'ul Xodim Qo'shish": "Янги Масъул Ходим Қўшиш",
  "Xodim ismi va sharifi (*)- tahrirsiz": "Ходим исми ва шарифи (*)",
  "Xodim ismi va sharifi (*)": "Ходим исми ва шарифи (*)",
  "Masalan: Usmonov Sarvar": "Масалан: Усмонов Сарвар",
  "Foydalanuvchi logini (Username) (*)": "Фойдаланувчи логини (Username) (*)",
  "Yangi Parol (*)": "Янги Парол (*)",
  "Mas'ullik darajasi (Roli) (*)": "Масъуллик даражаси (Роли) (*)",
  "Foydalanuvchi faolligi": "Фойдаланувчи фаоллиги",
  "Faol foydalanuvchi": "Фаол фойдаланувчи",
  "Xodim Qo'shish": "Ходим Қўшиш",
  "Xavfsizlik Audit Jurnali": "Хавфсизлик Аудит Журнали",
  "Tizimda amalga oshirilgan to'liq backend va ma'lumotlar bazasi operatsiyalari real-vaqt jurnali": "Тизимда амалга оширилган тўлиқ backend ва маълумотлар базаси операциялари реал-вақт журнали",
  "Sana & Vaqt": "Сана & Вақт",
  "Mas'ul Operator (Log)": "Масъул Оператор (Log)",
  "Operatsiya Turi / Tafsiloti": "Операция Тури / Тафсилоти",
  "Baza Ob'ekti": "База Объекти",
  "Fizik ID": "Физик ID",
  "Ma'lumotlarni tozalashda xatolik": "Маълумотларни тозалашда хатолик",
  "Audat jurnali tozalandi": "Аудит журнали тозаланди",
  "Audit jurnali bo'sh": "Аудит журнали бўш",

  // Sidebar & App
  "Boshqaruv Tizimi": "Бошқарув Тизими",
  "Boshqaruv paneli": "Бошқарув панели",
  "Qidiruv (Search)": "Қидирув",
  "Hujjat qabul (Intake)": "Ҳужжат қабул қилиш",
  "Hujjatlar ro'yxati": "Ҳужжатлар рўйхати",
  "Mundarija": "Мундарижа",
  "Admin panel": "Админ панели",
  "Statistika & Oqim": "Статистика & Оқим",
  "Tezkor filter tizimi": "Тезкор фильтр тизими",
  "PDF va Fizik joylashuv": "PDF ва Физик жойлашув",
  "Inventar & Holat": "Инвентар & Ҳолат",
  "Kategoriyalar & Shkaflar": "Категориялар & Шкафлар",
  "Audit & Hisoblar": "Аудит & Ҳисоблар",
  "Menu": "Меню",

  // Login Screen extras
  "Farg'ona Jamoat Salomatligi Tibbiyot Instituti": "Фарғона Жамоат Саломатлиги Тиббиёт Институти",
  "Arxiv": "Архив",
  "FARG'ONA JAMOAT SALOMATLIGI TIBBIYOT INSTITUTI": "ФАРҒОНА ЖАМОАТ САЛОМАТЛИГИ ТИББИЁТ ИНСТИТУТИ",
  "INSTITUT ARXIVI": "ИНСТИТУТ АРХИВИ",
  "Tizimga kirish": "Тизимга кириш",
  "Arxiv hisobiga bog'lanish uchun quyidagi parametrlarni kiriting": "Архив ҳисобига боғланиш учун қуйидаги параметрларни киритинг",
  "Iltimos, maydonlarni to'ldiring": "Илтимос, майдонларни тўлдиринг",
  "Tizimga kirishda xatolik yuz berdi": "Тизимга киришда хатолик юз берди",
  "Masalan: xodim yoki admin": "Масалан: ходим ёки админ",
  "Tizim paroli (Password)": "Тизим пароли (Password)",
  "Yuklanmoqda...": "Юкланмоқда...",
  "Tizimga Kirish": "Тизимга Кириш",
  "SINAB KO'RISH uchun loginlar:": "СИНАБ КЎРИШ учун логинлар:",
  "Hujjatlarni boshqarish tizimi": "Ҳужжатларни бошқарув тизими",
  "Institut Axivi Bo'limi. barcha huquqlar himoyalangan.": "Институт Архиви Бўлими. барча ҳуқуқлар ҳимояланган.",
  "Xavfsizlik sertifikatlangan": "Хавфсизлик сертификатланган",
  "Lokal Tarmoq (LAN)": "Локал Тармоқ (LAN)",

  // Dashboard extras
  "Boshqaruv paneli (Dashboard)": "Бошқарув панели (Dashboard)",
  "Arxiv tizimining umumiy statistikasi va oxirgi faollik ko'rsatkichlari": "Архив тизимининг умумий статистикаси ва охирги фаоллик кўрсаткичлари",
  "REAL VAQTDA": "",
  "Hujjatlar": "Ҳужжатлар",
  "Xodim hujjatlari": "Ходим ҳужжатлари",
  "Talaba hujjatlari": "Талаба ҳужжатлари",
  "Xodimga bog'langan hujjatlar": "Ходимга боғланган ҳужжатлар",
  "Talabaga bog'langan hujjatlar": "Талабага боғланган ҳужжатлар",
  "O'quvchilar": "Ўқувчилар",
  "Kategoriyalar": "Категориялар",
  "Shkaflar": "Шкафлар",
  "Bugun Qabul": "Бугун Қабул",
  "Bugun Qidiruv": "Бугун Қидирув",
  "Arxivda saqlanayotgan jami faol hujjatlar": "Архивда сақланаятган жами фаол ҳужжатлар",
  "Kamida bitta hujjati bor talabalar jami soni": "Камида битта ҳужжати бор талабалар жами сони",
  "Tizimdagi faol mavjud hujjat turlari": "Тизимдаги фаол мавжуд ҳужжат турлари",
  "Fizik shkaflar va metall stellajlar": "Физик шкафлар ва металл стеллажлар",
  "Bugun kiritilgan yangi arxiv hujjatlari": "Бугун киритилган янги архив ҳужжатлари",
  "Xodimlar tomonidan amalga oshirilgan qidiruvlar": "Ходимлар томонидан амалга оширилган қидирувлар",
  "KATEGORIYALAR BO'YICHA TAQSIMOT": "КАТЕГОРИЯЛАР БЎЙИЧА ТАҚСИМОТ",
  "foiz ulushi": "фоиз улуши",
  "Hozircha hech qanday kategoriya kiritilmagan": "Ҳозирча ҳеч қандай категория киритилмаган",
  "OXIRGI 7 KUNLIK QABUL GRAFIGI": "ОХИРГИ 7 КУНЛИК ҚАБУЛ ГРАФИГИ",
  "KUNLIK SONI": "КУНЛИК СОНИ",
  "ta": "та",
  "SHKAFLAR VA TO'LIQLIK HOLATI": "ШКАФЛАР ВА ТЎЛИҚЛИК ҲОЛАТИ",
  "shkaf ustiga bosib filtrlash": "шкаф устига босиб фильтрлаш",
  "Tavsifi yo'q": "Тавсифи йўқ",
  "Qavatlar bo'yicha sig'im:": "Қаватлар бўйича сиғим:",
  "Ro'yxatni ko'rish": "Рўйхатни кўриш",
  "Hozircha hech qanday shkaf kiritilmagan": "Ҳозирча ҳеч қандай шкаф киритилмаган",
  "Fizik joylashuvi": "Физик жойлашуви",
  "Amal": "Амал",
  "Hozircha arxiv hujjatlari mavjud emas.": "Ҳозирча архив ҳужжатлари мавжуд эмас.",
  "oxirgi 10 ta": "охирги 10 та",

  // Document statuses
  "Yo'q qilingan": "Йўқ қилинган",
  "Chiqarilgan": "Чиқарилган",

  // Repository Tab
  "Hujjatlar Ombori (Inventarizatsiya)": "Ҳужжатлар Омбори (Инвентаризация)",
  "Faol hujjatlarni tahrirlash, holatini o'zgartirish, elektron PDF almashtirish va o'chirish boshqaruvi": "Фаол ҳужжатларни таҳрирлаш, ҳолатини ўзгартириш, электрон PDF алмаштириш ва ўчириш бошқаруви",
  "O'quvchi ismi yoki kodi bilan qidiring...": "Ўқувчи исми ёки коди билан қидиринг...",
  "Qidiruv": "Қидирув",
  "Barcha Kategoriyalar": "Барча Категориялар",
  "Barcha Shkaflar": "Барча Шкафлар",
  "Barcha Holatlar": "Барча Ҳолатлар",
  "Ma'lumotlar olinmoqda...": "Маълумотлар олинмоқда...",
  "O'quvchi (Talaba)": "Ўқувчи (Талаба)",
  "Holati": "Ҳолати",
  "Kodsiz": "Кодсиз",
  "O'quvsiz": "Ўқувсиз",
  "Kategoriya kiritilmagan": "Категория киритилмаган",
  "Ko'rish": "Кўриш",
  "Tahrirlash": "Таҳрирлаш",
  "O'chirish (Soft delete)": "Ўчириш (Soft delete)",
  "Hujjat talabaga berilgan": "Ҳужжат талабага берилган",
  "Hujjatlar topilmadi.": "Ҳужжатлар топилмади.",
  "Ombor Kartasi:": "Омбор Картаси:",
  "Hujjat Rekvizitlari": "Ҳужжат Реквизитлари",
  "Tahrirlangan joriy koordinata:": "Таҳрирланган жорий координата:",
  "O'quvchi rekvizitlari:": "Ўқувчи реквизитлари:",
  "Noma'lum": "Номаълум",
  "Guruhi:": "Гуруҳи:",
  "Kiritilmagan": "Киритилмаган",
  "Status rekvizitlari:": "Статус реквизитлари:",
  "Hujjat Holati:": "Ҳужжат Ҳолати:",
  "Qabul sanasi:": "Қабул санаси:",
  "Muvofiqlik izohlari:": "Мувофиқлик изоҳлари:",
  "Hech qanday zaxira izohlar mavjud emas": "Ҳеч қандай захира изоҳлар мавжуд эмас",
  "Yuklangan elektron fayl:": "Юкланган электрон файл:",
  "yuklash": "юклаш",
  "Tahrirlashga o'tish": "Таҳрирлашга ўтиш",
  "Hujjat rekvizitlarini tahrirlash": "Ҳужжат реквизитларини таҳрирлаш",
  "Hujjat Holati (*)": "Ҳужжат Ҳолати (*)",
  "Kimga va nima maqsadda chiqarilgan? (*)": "Кимга ва нима мақсадда чиқарилган? (*)",
  "Masalan: Dekanat boshlig'i Soliyevga vaqtinchalik reyting uchun": "Масалан: Деканат бошлиғи Солиевга вақтинчалик рейтинг учун",
  "Hujjat Kategoriyasi (*)": "Ҳужжат Категорияси (*)",
  "Fizik Shkaf (*)": "Физик Шкаф (*)",
  "Tokcha (Qavat:": "Токча (Қават:",
  "Batafsil izoh & ko'rsatmalar": "Батафсил изоҳ & кўрсатмалар",
  "Elektron PDF faylini almashtirish (Ixtiyoriy)": "Электрон PDF файлини алмаштириш (Ихтиёрий)",
  "Faqat PDF yuklash ruxsat etiladi": "Фақат PDF юклаш рухсат этилади",
  "Kattalik cheklovi: maks 20 MB": "Катталик чеклови: макс 20 МБ",
  "Yangi fayl:": "Янги файл:",
  "O'zgarishlarni Saqlash": "Ўзгаришларни Сақлаш",
  "Chindan ham ushbu hujjat yozuvini arxiv bazasidan o'chirmoqchimisiz? Ushbu amaldan so'ng hujjat asosi faqat tahliliy soft-delete loglarida saqlab qolinadi.": "Чиндан ҳам ушбу ҳужжат ёзувини архив базасидан ўчирмоқчимисиз? Ушбу амалдан сўнг ҳужжат асоси фақат таҳлилий soft-delete логларида сақлаб қолинади.",
  "Ha, o'chirilsin": "Ҳа, ўчирилсин",
  "Arxiv ro'yxatini yuklashda xatolik yuz berdi": "Архив рўйхатини юклашда хатолик юз берди",
  "Tahrirlashni saqlashda xatolik yuz berdi": "Таҳрирлашни сақлашда хатолик юз берди",
  "O'chirishda muammo sodir bo'ldi": "Ўчиришда муаммо содир бўлди",
  "Hujjatni yuklab olishda xatolik yuz berdi:": "Ҳужжатни юклаб олишда хатолик юз берди:",
  "Iltimos, qalqib chiquvchi oynalar (popup) bloklanishini o'chiring!": "Илтимос, қалқиб чиқувчи ойналар (popup) блокланишини ўчиринг!",
  "Chop etishda xatolik yuz berdi:": "Чоп этишда хатолик юз берди:",

  // Admin Tab
  "Administrator Boshqaruv Markazi": "Администратор Бошқарув Маркази",
  "Fizik arxiv xodimlari hisoblari hamda tizimdagi barcha faoliyatlar audit jurnalini nazorat qilish": "Физик архив ходимлари ҳисоблари ҳамда тизимдаги барча фаолиятлар аудит журналини назорат қилиш",
  "Fizik arxiv xodimlari hisoblarini boshqarish": "Физик архив ходимлари ҳисобларини бошқариш",
  "Foydalanuvchilar": "Фойдаланувчилар",
  "Foydalanuvchilar hisoblari": "Фойдаланувчилар ҳисоблари",
  "Audit tizim jurnali": "Аудит тизим журнали",
  "Audit jurnali": "Аудит журнали",
  "Oxirgi 10 ta yozuv ko'rsatiladi. To'liq tarix Excel faylida yuklab olinadi.": "Охирги 10 та ёзув кўрсатилади. Тўлиқ тарих Excel файлида юклаб олинади.",
  "Excel ga yuklash": "Excel га юклаш",
  "Excel yuklab olishda xatolik": "Excel юклаб олишда хатолик",
  "Eksport qilish uchun yozuvlar yo'q": "Экспорт қилиш учун ёзувлар йўқ",
  "Vaqt": "Вақт",
  "Ob'ekt": "Объект",
  "Jurnal yuklanmoqda...": "Журнал юкланмоқда...",
  "Hozircha yozuvlar yo'q": "Ҳозирча ёзувлар йўқ",
  "Markaziy so'rov ko'rib chiqilmoqda...": "Марказий сўров кўриб чиқилмоқда...",
  "YANGI FOYDALANUVChI QO'ShISh": "ЯНГИ ФОЙДАЛАНУВЧИ ҚЎШИШ",
  "Foydalanuvchi nomi (Login) (*)": "Фойдаланувчи номи (Login) (*)",
  "masalan: rustam_a": "масалан: rustam_a",
  "Xodim to'liq Ism-Familiyasi (*)": "Ходим тўлиқ Исм-Фамилияси (*)",
  "Ism Familiya Otasining ismi": "Исм Фамилия Отасининг исми",
  "Tizimdagi Rollari (*)": "Тизимдаги Роллари (*)",
  "Arxiv xodimi (Operator)": "Архив ходими (Оператор)",
  "Administrator (To'liq admin)": "Администратор (Тўлиқ админ)",
  "Faqat ko'ruvchi (Rahbariyat)": "Фақат кўрувчи (Раҳбарият)",
  "Boshlang'ich parol (≥ 8 belgi) (*)": "Бошланғич парол (≥ 8 белги) (*)",
  "Kamida 8 dona belgi": "Камида 8 дона белги",
  "Foydalanuvchi qo'shish": "Фойдаланувчи қўшиш",
  "Mavjud foiz xodimlari": "Мавжуд фоиз ходимлари",
  "Ro'yxati": "Рўйхати",
  "Xodim F.I.Sh:": "Ходим Ф.И.Ш:",
  "Roli:": "Роли:",
  "Yangi parol (Bo'sh qo'yilishi mumkin):": "Янги парол (Бўш қўйилиши мумкин):",
  "O'zgartirmaslik uchun bo'sh qoldiring": "Ўзгартирмаслик учун бўш қолдиринг",
  "Xodim faol va ishlashi mumkin": "Ходим фаол ва ишлаши мумкин",
  "Administrator": "Администратор",
  "Xodim": "Ходим",
  "Ko'ruvchi": "Кўрувчи",
  "Bloklangan": "Блокланган",
  "Arxivga kiritildi:": "Архивга киритилди:",
  "Oxirgi tizim faolligi:": "Охирги тизим фаоллиги:",
  "Hali tizimga kirmagan": "Ҳали тизимга кирмаган",
  "Jami": "Жами",
  "Log vaqti & Sana": "Лог вақти & Сана",
  "Tizim Foydalanuvchisi": "Тизим Фойдаланувчиси",
  "Bajarilgan Amallar": "Бажарилган Амаллар",
  "Kategoriya burchagi": "Категория бурчаги",
  "IP Address": "IP Манзил",
  "Ma'lumotlarni olishda xatolik yuz berdi": "Маълумотларни олишда хатолик юз берди",
  "Iltimos, barcha majburiy maydonlarni to'ldiring": "Илтимос, барча мажбурий майдонларни тўлдиринг",
  "Parol uzunligi kamida 8 belgidan iborat bo'lishi shart!": "Парол узунлиги камида 8 белгидан иборат бўлиши шарт!",
  "Xatolik sodir bo'ldi": "Хатолик содир бўлди",
  "Yangi yoziladigan parol kamida 8 belgidan iborat bo'lishi shart": "Янги ёзиладиган парол камида 8 белгидан иборат бўлиши шарт",
  "Saqlashda xatolik": "Сақлашда хатолик",

  // Intake Tab
  "Yangi Hujjat Qabul Qilish (Intake)": "Янги Ҳужжат Қабул Қилиш (Intake)",
  "Kompleks o'quvchi ma'lumotlari, PDF yuklash va fizik saqlash koordinatalarini ro'yxatga olish": "Комплекс ўқувчи маълумотлари, PDF юклаш ва физик сақлаш координаталарини рўйхатга олиш",
  "Hujjat arxiv bazasiga muvaffaqiyatli saqlanib, fizik saqlash joylashuvi koordinatalariga bog'landi.": "Ҳужжат архив базасига муваффақиятли сақланиб, физик сақлаш жойлашуви координаталарига боғланди.",
  "Qidiruv tizimiga o'tish": "Қидирув тизимига ўтиш",
  "Kategoriya tanlash": "Категория танлаш",
  "Soha bo'limini tanlang": "Соҳа бўлимини танланг",
  "Hujjat ma'lumotlari": "Ҳужжат маълумотлари",
  "Nomi, raqami va chiqarilgan sanasi": "Номи, рақами ва чиқарилган санаси",
  "Hujjat va xodim": "Ҳужжат ва ходим",
  "F.I.Sh va tababel rekvizitlari": "Ф.И.Ш ва табабел реквизитлари",
  "PDF nusxasi": "PDF нусхаси",
  "Maksimal hajm: 20 MB (.pdf)": "Максимал ҳажм: 20 МБ (.pdf)",
  "Arxiv joylashuvi": "Архив жойлашуви",
  "Shkaf va Tokcha (Tok)": "Шкаф ва Токча (Ток)",
  "Xulosa va saqlash": "Хулоса ва сақлаш",
  "Yakuniy ma'lumotlarni tahlil qilish": "Якуний маълумотларни таҳлил қилиш",
  "1-Bosqich: Hujjat Kategoriyasi Tanlash": "1-Босқич: Ҳужжат Категорияси Танлаш",
  "majburiy": "мажбурий",
  "Kategoriyaniturni tanlang (*):": "Категорияни танланг (*):",
  "Tavsif kiritilmagan": "Тавсиф киритилмаган",
  "Tanlangan": "Танланган",
  "2-Bosqich: Hujjat ma'lumotlari (Institut)": "2-Босқич: Ҳужжат маълумотлари (Институт)",
  "Hujjat nomi yoki raqamini kiriting (*)": "Ҳужжат номи ёки рақамини киритинг (*)",
  "Masalan: Bo'yruq № 312 yoki Nizom": "Масалан: Буйруқ № 312 ёки Низом",
  "Chiqarilgan sanasini kiriting (*)": "Чиқарилган санасини киритинг (*)",
  "2-Bosqich: Xodim hamda hujjat ma'lumotlari": "2-Босқич: Ходим ҳамда ҳужжат маълумотлари",
  "Mavjud xodimni qidirish": "Мавжуд ходимни қидириш",
  "Yangi xodim qo'shish": "Янги ходим қўшиш",
  "Arxivdagi xodimlar ro'yxatidan tanlang (*)": "Архивдаги ходимлар рўйхатидан танланг (*)",
  "-- Xodimni tanlang --": "-- Ходимни танланг --",
  "Yangi xodim ma'lumotlari:": "Янги ходим маълумотлари:",
  "Familiyasi (*)": "Фамилияси (*)",
  "Tababel raqami / ID": "Табабел рақами / ID",
  "Kafedrasi / Bo'limi": "Кафедраси / Бўлими",
  "Lavozimi": "Лавозими",
  "2-Bosqich: Hujjat ma'lumotlari (Talaba)": "2-Босқич: Ҳужжат маълумотлари (Талаба)",
  "Joriy etilgan sanasini tanlang (*)": "Жорий этилган санасини танланг (*)",
  "Kiritilayotgan hujjat nomi yoki raqami": "Киритилаётган ҳужжат номи ёки рақами",
  "3-Bosqich: Elektron PDF hujjati yuklash": "3-Босқич: Электрон PDF ҳужжати юклаш",
  "Faqat PDF formatini yuklashingiz mumkin (.pdf)": "Фақат PDF форматини юклашингиз мумкин (.pdf)",
  "Fayl hajmi 20 MB dan ko'p bo'lmasligi lozim": "Файл ҳажми 20 МБ дан кўп бўлмаслиги лозим",
  "Faylni tanlash yoki sudrab yuklash": "Файлни танлаш ёки судраб юклаш",
  "Faqat .pdf formatida, maksimal 20 MB": "Фақат .pdf форматида, максимал 20 МБ",
  "Progress": "Жараён",
  "Tayyor (Base64 tayyorlangan)": "Тайёр (Base64 тайёрланган)",
  "Bajarilmoqda...": "Бажарилмоқда...",
  "4-Bosqich: Fizik saqlash joylashuvi (Koordinata)": "4-Босқич: Физик сақлаш жойлашуви (Координата)",
  "Arxiv Shkafi (*)": "Архив Шкафи (*)",
  "-- Shkafni tanlang --": "-- Шкафни танланг --",
  "Tavsif:": "Тавсиф:",
  "Qavat raqami (Butun musbat son) (*)": "Қават рақами (Бутун мусбат сон) (*)",
  "Avvalo shkaf tanlang": "Аввало шкаф танланг",
  "Shkafdagi aniq joylashuv izohi (Ixtiyoriy)": "Шкафдаги аниқ жойлашув изоҳи (Ихтиёрий)",
  "Masalan: chap bo'lim orqa tomondagi ko'k jildli tezis jurnali": "Масалан: чап бўлим орқа томондаги кўк жилдли тезис журнали",
  "5-Bosqich: Arxivga kiritishdan oldin xulosa": "5-Босқич: Архивга киритишдан олдин хулоса",
  "tasdiqlash zaxirasi": "тасдиқлаш захираси",
  "Hujjat kiritiladigan o'quvchi:": "Ҳужжат киритиладиган ўқувчи:",
  "Hujjat kiritiladigan talaba:": "Ҳужжат киритиладиган талаба:",
  "Hujjat kiritiladigan xodim:": "Ҳужжат киритиладиган ходим:",
  "TALABA F.I.Sh:": "ТАЛАБА Ф.И.Ш:",
  "XODIM F.I.Sh:": "ХОДИМ Ф.И.Ш:",
  "Xodim ID:": "Ходим ID:",
  "Lavozimi:": "Лавозими:",
  "Guruh nomi:": "Гуруҳ номи:",
  "O'QUVCHI F.I.Sh:": "ЎҚУВЧИ Ф.И.Ш:",
  "HEMIS ID (CODE):": "HEMIS ID (CODE):",
  "O'QUVCHI F.I.Sh (YANGI):": "ЎҚУВЧИ Ф.И.Ш (ЯНГИ):",
  "GURUH & B-SANA:": "ГУРУҲ & Т-САНА:",
  "Telefon raqami": "Телефон рақами",
  "Kategoriya va yuklanadigan fayl nusxasi:": "Категория ва юкланадиган файл нусхаси:",
  "Hujjat turi (Kategoriya):": "Ҳужжат тури (Категория):",
  "Kategoriya topilmadi": "Категория топилмади",
  "Yuklangan PDF nomi:": "Юкланган PDF номи:",
  "Haqiqiy fizik saqlash koordinatasi:": "Ҳақиқий физик сақлаш координатаси:",
  "SHKAF REKVIZITI:": "ШКАФ РЕКВИЗИТИ:",
  "TOKCHA / QAVAT:": "ТОКЧА / ҚАВАТ:",
  "QAVAT": "ҚАВАТ",
  "QO'SHIMCHA IZOH:": "ҚЎШИМАЧА ИЗОҲ:",
  "Orqaga": "Орқага",
  "Keyingisi": "Кейингиси",
  "Arxivga Saqlash": "Архивга Сақлаш",
  "Mavjud xodimni tanlang!": "Мавжуд ходимни танланг!",
  "Hujjat qabul qilinishida xatolik yuz berdi": "Ҳужжат қабул қилинишида хатолик юз берди",
  "Familiyasi": "Фамилияси",
  "Ismi": "Исми",
  "Masalan: T-4190": "Масалан: T-4190",
  "Fizika kafedrasi": "Физика кафедраси",
  "Katta o'qituvchi": "Катта ўқитувчи",
  "Hujjat nomi yoki uning tartib raqami": "Ҳужжат номи ёки унинг тартиб рақами",
  "Hujjat nomi": "Ҳужжат номи",
  "Hujjat nomi bo'yicha qidiring...": "Ҳужжат номи бўйича қидиринг...",
  "Chiqarilgan sanasi (Joriy etilgan) (*)": "Чиқарилган санаси (Жорий этилган) (*)",
  "Hujjatni bu yerga bosing yoki sudrab keling": "Ҳужжатни бу ерга босинг ёки судраб келинг",
  "Maksimal": "Максимал",
  "Varaqa formati:": "Варақа формати:",
  "1 va": "1 ва",
  "oralig'ida": "оралиғида",
  "Naima": "Номаълум",

  // Settings extras
  "Arxiv spravochniklari boshqaruvi: Hujjat kategoriyalari hamda shkaflarni sozlash": "Архив маълумотномалари бошқаруви: Ҳужжат категориялари ҳамда шкафларни созлаш",
  "Ma'lumot spravochniklari yangilanmoqda...": "Маълумот маълумотномалари янгиланмоқда...",
  "Kategoriya nomi:": "Категория номи:",
  "Tavsifi:": "Тавсифи:",
  "Xodimlar uchun faol (Active)": "Ходимлар учун фаол (Active)",
  "Nofaol": "Нофаол",
  "Tavsifi kiritilmagan": "Тавсифи киритилмаган",
  "Shkaf nomi/raqami majburiy": "Шкаф номи/рақами мажбурий",
  "Maksimal qavat diapazoni: 1 dan 99 gacha": "Максимал қават диапазони: 1 дан 99 гача",
  "Tahrirlashda muammo sodir bo'ldi": "Таҳрирлашда муаммо содир бўлди",
  "Maksimal qavat diapazoni: 1 - 99": "Максимал қават диапазони: 1 - 99",
  "Shkafni saqlashda xatolik yuz berdi": "Шкафни сақлашда хатолик юз берди",
  "Kategoriyani o'chirishda xatolik yuz berdi": "Категорияни ўчиришда хатолик юз берди",
  "Shkafni o'chirishda xatolik yuz berdi": "Шкафни ўчиришда хатолик юз берди",
  "Kategoriya nomi majburiy": "Категория номи мажбурий",

  // Seed category descriptions
  "Institut": "Институт",
  "Talaba": "Талаба",
  "Institut rasmiy hujjatlari, ko'rsatma va buyruqlar.": "Институт расмий ҳужжатлари, кўрсатма ва буйруқлар.",
  "Xodimlar va o'qituvchilarning shaxsiy arxiv rekvizitlari.": "Ходимлар ва ўқитувчиларнинг шахсий архив реквизитлари.",
  "Talabalarning o'quv faoliyati varaqalari va buyruqlar.": "Талабаларнинг ўқув фаолияти варақалари ва буйруқлар.",
};

// Extremely precise rule-based Uzbek Latin-to-Cyrillic transliterating algorithm
export function latinToCyrillic(str: string): string {
  if (!str) return str;
  let s = str;

  // 1. Convert apostrophe / single-quote characters associated with O' and G'
  // Common visual representations: o', g', o’, g’, o‘, g‘, o`, g`, o´, g´
  s = s.replace(/([oO]|[gG])[’‘`'´]/g, (match, letter) => {
    if (letter === "o") return "ў";
    if (letter === "O") return "Ў";
    if (letter === "g") return "ғ";
    if (letter === "G") return "Ғ";
    return match;
  });

  // 2. Transliterate Ye at start of words / after vowels, otherwise is E inside words
  s = s.replace(/\bYe/g, "Е").replace(/\bye/g, "е").replace(/\bYE/g, "Е");
  s = s.replace(/([aeiouyoAEIOUYOўЎ])ye/g, "$1е")
       .replace(/([aeiouyoAEIOUYOўЎ])Ye/g, "$1Е")
       .replace(/([aeiouyoAEIOUYOўЎ])YE/g, "$1Е");

  // 3. Multi-character compounds
  s = s.replace(/Ch/g, "Ч").replace(/CH/g, "Ч").replace(/ch/g, "ч");
  s = s.replace(/Sh/g, "Ш").replace(/SH/g, "Ш").replace(/sh/g, "ш");
  s = s.replace(/Yu/g, "Ю").replace(/YU/g, "Ю").replace(/yu/g, "ю");
  s = s.replace(/Ya/g, "Я").replace(/YA/g, "Я").replace(/ya/g, "я");
  s = s.replace(/Yo/g, "Ё").replace(/YO/g, "Ё").replace(/yo/g, "ё");

  // 4. Standalone E representing /e/. At start of word/after vowels, it's Э.
  s = s.replace(/\bE/g, "Э").replace(/\be/g, "э");
  s = s.replace(/([aeieuoAEIEUOўЎ])e/g, "$1э")
       .replace(/([aeieuoAEIEUOўЎ])E/g, "$1Э");

  // 5. Single letters mapping
  const charMapping: { [key: string]: string } = {
    "A": "А", "a": "а",
    "B": "Б", "b": "б",
    "D": "Д", "d": "д",
    "F": "Ф", "f": "ф",
    "G": "Г", "g": "г",
    "H": "Ҳ", "h": "ҳ",
    "I": "И", "i": "и",
    "J": "Ж", "j": "ж",
    "K": "К", "k": "к",
    "L": "Л", "l": "л",
    "M": "М", "m": "м",
    "N": "Н", "n": "н",
    "O": "О", "o": "о",
    "P": "П", "p": "п",
    "Q": "Қ", "q": "қ",
    "R": "Р", "r": "р",
    "S": "С", "s": "с",
    "T": "Т", "t": "т",
    "U": "У", "u": "у",
    "V": "В", "v": "в",
    "X": "Х", "x": "х",
    "Y": "Й", "y": "й",
    "Z": "З", "z": "з",
    "E": "Е", "e": "е", // Remaining e's inside words become Е
    "'": "ъ",
    "’": "ъ",
    "‘": "ъ",
    "`": "ъ"
  };

  let output = "";
  for (let i = 0; i < s.length; i++) {
    const char = s[i];
    output += charMapping[char] !== undefined ? charMapping[char] : char;
  }

  return output;
}

// Highly optimized Cyrillic-to-Latin transliteration
export function cyrillicToLatin(str: string): string {
  if (!str) return str;
  let s = str;

  // Compounds first
  s = s.replace(/Ш/g, "Sh").replace(/ш/g, "sh");
  s = s.replace(/Ч/g, "Ch").replace(/ч/g, "ch");
  s = s.replace(/Ю/g, "Yu").replace(/ю/g, "yu");
  s = s.replace(/Я/g, "Ya").replace(/я/g, "ya");
  s = s.replace(/Ё/g, "Yo").replace(/ё/g, "yo");
  s = s.replace(/Ў/g, "O'").replace(/ў/g, "o'");
  s = s.replace(/Ғ/g, "G'").replace(/ғ/g, "g'");
  s = s.replace(/Ц/g, "Ts").replace(/ц/g, "ts");

  const charMapping: { [key: string]: string } = {
    "А": "A", "а": "a",
    "Б": "B", "б": "b",
    "В": "V", "в": "v",
    "Г": "G", "г": "g",
    "Д": "D", "д": "d",
    "Е": "E", "е": "e",
    "Ж": "J", "ж": "j",
    "З": "Z", "з": "z",
    "И": "I", "и": "i",
    "Й": "Y", "й": "y",
    "К": "K", "к": "k",
    "Л": "L", "l": "l",
    "М": "M", "м": "m",
    "Н": "N", "н": "n",
    "О": "O", "о": "o",
    "П": "P", "п": "p",
    "Р": "R", "р": "r",
    "С": "S", "с": "s",
    "Т": "T", "т": "t",
    "У": "U", "у": "u",
    "Ф": "F", "ф": "f",
    "Х": "X", "х": "x",
    "Ҳ": "H", "ҳ": "h",
    "Қ": "Q", "қ": "q",
    "Э": "E", "э": "e",
    "ъ": "'", "Ъ": "'"
  };

  let output = "";
  for (let i = 0; i < s.length; i++) {
    const char = s[i];
    output += charMapping[char] !== undefined ? charMapping[char] : char;
  }

  return output;
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  // Try to find previously configured language in localStorage, default to cyrillic (as explicitly requested: "defaultda krill-lotin turishi kerak")
  const [lang, setLangState] = useState<Language>(() => {
    const saved = localStorage.getItem("arxiv_lang");
    return (saved as Language) || "cyrillic";
  });

  const setLang = (newLang: Language) => {
    setLangState(newLang);
    localStorage.setItem("arxiv_lang", newLang);
  };

  // The custom translation helper
  const t = (text: string): string => {
    if (!text) return "";
    const trimmed = text.trim();

    // If active language is Latin, return text as is (it's written in Latin in code)
    if (lang === "latin") {
      return text;
    }

    // If active language is Cyrillic:
    // 1. Check if we have a perfect dictionary match (case sensitive or normalized)
    if (uiTranslations[trimmed] !== undefined) {
      return uiTranslations[trimmed];
    }

    // 2. Check for soft matching with colon, asterisk prefix or suffix
    const matchSuffixClean = trimmed.replace(/[\s:*()\-+]+$/, "");
    if (matchSuffixClean && uiTranslations[matchSuffixClean] !== undefined) {
      const cyrillicMain = uiTranslations[matchSuffixClean];
      // Re-append the suffixes/characters
      const difference = trimmed.substring(matchSuffixClean.length);
      return cyrillicMain + difference;
    }

    // 3. Programmatic fall-back via the transliteration engine for dynamic string values
    return latinToCyrillic(text);
  };

  // Help translate any text explicitly to a specific language
  const transliterateText = (text: string, targetLang: Language): string => {
    if (!text) return "";
    if (targetLang === "latin") {
      return cyrillicToLatin(text);
    }
    return latinToCyrillic(text);
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t, transliterateText }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useTranslation must be used within a LanguageProvider");
  }
  return context;
}
