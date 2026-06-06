/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { UserRole, DocumentStatus } from "./src/types.js";

const PORT = 3000;
const DB_PATH = path.join(process.cwd(), "db.json");
const UPLOADS_DIR = path.join(process.cwd(), "uploads");

// Ensure UPLOADS directory exists
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Helper to write a simple valid 1-page PDF
function createDummyPDF(filePath: string, text: string = "Institut Arxivi Hujjati") {
  const pdfContent = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /Resources << /Font << /F1 4 0 R >> >> /MediaBox [0 0 595.275 841.889] /Contents 5 0 R >>
endobj
4 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
5 0 obj
<< /Length ${text.length + 50} >>
stream
BT /F1 24 Tf 80 750 Td (${text}) Tj ET
endstream
endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000242 00000 n 
0000000305 00000 n 
trailer
<< /Size 6 /Root 1 0 R >>
startxref
400
%%EOF`;
  fs.writeFileSync(filePath, pdfContent, "utf-8");
}

// Initial Database structure
interface DBStructure {
  users: any[];
  students: any[];
  employees: any[];
  categories: any[];
  cabinets: any[];
  documents: any[];
  auditLogs: any[];
}

const initialDB: DBStructure = {
  users: [
    {
      id: "u-1",
      username: "admin",
      passwordHash: "admin123", // Simple plain-text for developer/sandbox environment
      fullName: "Fayzullayev Alisher Alimovich",
      role: UserRole.ADMIN,
      isActive: true,
      lastLoginAt: undefined,
      createdAt: new Date("2026-01-15T09:00:00Z").toISOString(),
    },
    {
      id: "u-2",
      username: "xodim",
      passwordHash: "xodim123",
      fullName: "Soliqova Dilfuza Rustamovna",
      role: UserRole.XODIM,
      isActive: true,
      lastLoginAt: undefined,
      createdAt: new Date("2026-01-20T10:30:00Z").toISOString(),
    },
    {
      id: "u-3",
      username: "viewer",
      passwordHash: "viewer123",
      fullName: "Usmonov Bahodir Shavkatovich",
      role: UserRole.VIEWER,
      isActive: true,
      lastLoginAt: undefined,
      createdAt: new Date("2026-02-01T14:00:00Z").toISOString(),
    }
  ],
  categories: [
    {
      id: "cat-institut",
      name: "Institut",
      description: "Institut bo'linmalari va ma'muriy-tashkiliy farmon hamda buyruqlari",
      isActive: true,
      createdAt: new Date("2026-01-01T09:00:00Z").toISOString(),
    },
    {
      id: "cat-xodim",
      name: "Xodim",
      description: "Institut professor-o'qituvchilari hamda yordamchi xodimlarining shaxsiy jildlari",
      isActive: true,
      createdAt: new Date("2026-01-01T09:00:00Z").toISOString(),
    },
    {
      id: "cat-talaba",
      name: "Talaba",
      description: "Talabalarning reyting daftarchalari, diplom ilovalari, tavsiyanoma va shaxsiy hujjatlari",
      isActive: true,
      createdAt: new Date("2026-01-02T09:00:00Z").toISOString(),
    }
  ],
  cabinets: [
    {
      id: "cab-1",
      name: "1-shkaf",
      description: "Asosiy bino, 2-qavat dekarativ metall stellajlar, o'ng tomon",
      maxFloor: 9,
      isActive: true,
      createdAt: new Date("2026-01-01T08:00:00Z").toISOString(),
    },
    {
      id: "cab-2",
      name: "2-shkaf",
      description: "Bosh arxiv zali, chap devor bo'yidagi yog'och stellaj",
      maxFloor: 6,
      isActive: true,
      createdAt: new Date("2026-01-01T08:00:00Z").toISOString(),
    },
    {
      id: "cab-3",
      name: "3-shkaf",
      description: "Arxiv ichki omborxonasi, maxsus yong'inga chidamli seyf-shkaf",
      maxFloor: 12,
      isActive: true,
      createdAt: new Date("2026-01-01T08:00:00Z").toISOString(),
    }
  ],
  students: [
    {
      id: "std-1",
      lastName: "Abduvahobov",
      firstName: "Shirinbek",
      middleName: "Karimovich",
      studentId: "HEMIS102938",
      groupName: "IF-20",
      birthDate: "2001-04-12",
      phone: "+998 90 123 45 67",
      createdAt: new Date("2026-02-10T11:00:00Z").toISOString(),
      updatedAt: new Date("2026-02-10T11:00:00Z").toISOString(),
    },
    {
      id: "std-2",
      lastName: "To'rayev",
      firstName: "Jasur",
      middleName: "Alisherovich",
      studentId: "HEMIS492019",
      groupName: "KI-21",
      birthDate: "2002-09-25",
      phone: "+998 99 987 65 43",
      createdAt: new Date("2026-02-12T12:30:00Z").toISOString(),
      updatedAt: new Date("2026-02-12T12:30:00Z").toISOString(),
    },
    {
      id: "std-3",
      lastName: "Qodirova",
      firstName: "Malika",
      middleName: "Rustamovna",
      studentId: "HEMIS837102",
      groupName: "DI-22",
      birthDate: "2003-01-18",
      phone: "+998 93 555 44 33",
      createdAt: new Date("2026-02-15T15:20:00Z").toISOString(),
      updatedAt: new Date("2026-02-15T15:20:00Z").toISOString(),
    }
  ],
  employees: [
    {
      id: "emp-1",
      lastName: "Raimov",
      firstName: "Izzat",
      middleName: "Sardorovich",
      employeeId: "EMP-1029",
      department: "Kompyuter tizimlari dekanati",
      position: "Dekan o'rinbosari",
      phone: "+998 90 321 09 87",
      createdAt: new Date("2026-02-12T10:00:00Z").toISOString(),
      updatedAt: new Date("2026-02-12T10:00:00Z").toISOString(),
    },
    {
      id: "emp-2",
      lastName: "Ismoilova",
      firstName: "Dilorom",
      middleName: "Baxtiyorovna",
      employeeId: "EMP-2039",
      department: "Gumanitar fanlar kafedrasi",
      position: "Katta o'qituvchi",
      phone: "+998 99 777 55 44",
      createdAt: new Date("2026-02-14T11:00:00Z").toISOString(),
      updatedAt: new Date("2026-02-14T11:00:00Z").toISOString(),
    }
  ],
  documents: [
    {
      id: "doc-1",
      studentId: "std-1",
      categoryId: "cat-talaba",
      docName: "Diplom ilovasi",
      docDate: "2026-02-11",
      personType: "student",
      cabinetId: "cab-1",
      floor: 3,
      filePath: "doc-1.pdf",
      fileSize: 15420,
      originalFilename: "Abduvahobov_Diplom_Ilova.pdf",
      status: DocumentStatus.JOYIDA,
      notes: "Orqa qatordagi ko'k jild ichida joylashgan",
      receivedAt: new Date("2026-02-11T09:30:00Z").toISOString(),
      receivedByUserId: "u-2",
      createdAt: new Date("2026-02-11T09:30:00Z").toISOString(),
      updatedAt: new Date("2026-02-11T09:30:00Z").toISOString(),
    },
    {
      id: "doc-2",
      employeeId: "emp-1",
      categoryId: "cat-xodim",
      docName: "Shaxsiy jild buyrug'i",
      docDate: "2026-02-13",
      personType: "employee",
      cabinetId: "cab-2",
      floor: 5,
      filePath: "doc-2.pdf",
      fileSize: 16180,
      originalFilename: "Torayev_Akademik_M.pdf",
      status: DocumentStatus.JOYIDA,
      notes: "Oq muqovali shaffof papka",
      receivedAt: new Date("2026-02-13T14:15:00Z").toISOString(),
      receivedByUserId: "u-2",
      createdAt: new Date("2026-02-13T14:15:00Z").toISOString(),
      updatedAt: new Date("2026-02-13T14:15:00Z").toISOString(),
    },
    {
      id: "doc-3",
      studentId: "std-3",
      categoryId: "cat-talaba",
      docName: "Reyting daftarchasi",
      docDate: "2026-02-16",
      personType: "student",
      cabinetId: "cab-1",
      floor: 1,
      filePath: "doc-3.pdf",
      fileSize: 14900,
      originalFilename: "Qodirova_Reyting_Daftar.pdf",
      status: DocumentStatus.BERILGAN,
      notes: "Qaytarish muddati ko'rsatilmagan, vaqtinchalik olingan",
      receivedAt: new Date("2026-02-16T10:00:00Z").toISOString(),
      receivedByUserId: "u-1",
      issuedAt: new Date("2026-02-18T16:45:00Z").toISOString(),
      issuedByUserId: "u-2",
      createdAt: new Date("2026-02-16T10:00:00Z").toISOString(),
      updatedAt: new Date("2026-02-18T16:45:00Z").toISOString(),
    }
  ],
  auditLogs: [
    {
      id: "log-1",
      userId: "u-1",
      userFullName: "Fayzullayev Alisher Alimovich",
      action: "Tizim ishga tushirildi",
      entityType: "System",
      entityId: "system",
      payloadJson: JSON.stringify({ message: "Initsializatsiya" }),
      ip: "127.0.0.1",
      createdAt: new Date("2026-02-10T08:00:00Z").toISOString(),
    }
  ],
};

function readDB(): DBStructure {
  try {
    if (!fs.existsSync(DB_PATH)) {
      writeDB(initialDB);
      // Generate standard dummy PDF files
      createDummyPDF(path.join(UPLOADS_DIR, "doc-1.pdf"), "O'quvchi: Shirinbek Abduvahobov. Diplom Ilova hujjati. Joylashuvi: 1-shkaf, 3-qavat");
      createDummyPDF(path.join(UPLOADS_DIR, "doc-2.pdf"), "O'quvchi: Jasur To'rayev. Akademik Ma'lumotnoma hujjati. Joylashuvi: 2-shkaf, 5-qavat");
      createDummyPDF(path.join(UPLOADS_DIR, "doc-3.pdf"), "O'quvchi: Malika Qodirova. Reyting Daftarchasi hujjati. Joylashuvi: 1-shkaf, 1-qavat");
      return initialDB;
    }
    const data = fs.readFileSync(DB_PATH, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    console.error("DB reading error, using initial", error);
    return initialDB;
  }
}

function writeDB(data: DBStructure) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), "utf-8");
  } catch (error) {
    console.error("DB writing error", error);
  }
}

async function startServer() {
  const app = express();

  // Middleware for body parsing with raised limits to support PDF Base64 text payloads
  app.use(express.json({ limit: "25mb" }));
  app.use(express.urlencoded({ extended: true, limit: "25mb" }));

  // Pre-seed db if not exists
  const loadedDb = readDB();
  let shouldUpdateDb = false;
  if (!loadedDb.categories || loadedDb.categories.length !== 3 || !loadedDb.categories.find(c => c.id === 'cat-institut')) {
    loadedDb.categories = initialDB.categories;
    // Map existing documents' categories to new standard categories for safety
    if (loadedDb.documents) {
      loadedDb.documents.forEach((d: any) => {
        if (d.categoryId === 'cat-3' || d.categoryId === 'cat-xodim') {
          d.categoryId = 'cat-xodim';
          d.personType = 'employee';
        } else if (d.categoryId === 'cat-institut') {
          d.categoryId = 'cat-institut';
          d.personType = 'none';
        } else {
          d.categoryId = 'cat-talaba';
          d.personType = 'student';
        }
      });
    }
    shouldUpdateDb = true;
  }
  if (!loadedDb.employees || loadedDb.employees.length === 0) {
    loadedDb.employees = initialDB.employees;
    shouldUpdateDb = true;
  }
  if (shouldUpdateDb) {
    writeDB(loadedDb);
  }

  // Helper utility to fetch current user based on Authorization header
  const getAuthUser = (req: express.Request): any | null => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return null;
    const db = readDB();
    // Simple mock authorization string: "Bearer u-1"
    const userId = authHeader.replace("Bearer ", "").trim();
    const user = db.users.find((u) => u.id === userId && u.isActive);
    return user || null;
  };

  // Log action helper
  const logAudit = (userId: string, userFullName: string, action: string, entityType: string, entityId?: string, payload?: any, ip: string = "127.0.0.1") => {
    const db = readDB();
    const newLog = {
      id: "log-" + Date.now() + Math.random().toString(36).substr(2, 4),
      userId,
      userFullName,
      action,
      entityType,
      entityId,
      payloadJson: payload ? JSON.stringify(payload) : undefined,
      ip,
      createdAt: new Date().toISOString(),
    };
    db.auditLogs.unshift(newLog);
    // Keep only last 1000 logs
    if (db.auditLogs.length > 1000) {
      db.auditLogs = db.auditLogs.slice(0, 1000);
    }
    writeDB(db);
  };

  // --- API ROUTES ---

  // Auth: Login
  app.post("/api/auth/login", (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
      res.status(400).json({ error: "Foydalanuvchi nomi va parol yuborilishi shart" });
      return;
    }

    const db = readDB();
    const user = db.users.find((u) => u.username.toLowerCase() === username.toLowerCase());

    if (!user || user.passwordHash !== password) {
      res.status(401).json({ error: "Login yoki parol noto‘g‘ri" });
      return;
    }

    if (!user.isActive) {
      res.status(403).json({ error: "Ushbu foydalanuvchi hisob varog'i faolsizlantirilgan" });
      return;
    }

    // Success response
    user.lastLoginAt = new Date().toISOString();
    writeDB(db);

    logAudit(user.id, user.fullName, "Tizimga muvaffaqiyatli kirdi (Login)", "Auth", user.id);

    // Keep passwordHash out of client response
    const { passwordHash, ...userResponse } = user;
    res.json({ token: user.id, user: userResponse });
  });

  // Auth: Logout
  app.post("/api/auth/logout", (req, res) => {
    const user = getAuthUser(req);
    if (user) {
      logAudit(user.id, user.fullName, "Tizimdan chiqdi (Logout)", "Auth", user.id);
    }
    res.json({ success: true });
  });

  // GET Statistics for Dashboard
  app.get("/api/stats", (req, res) => {
    const user = getAuthUser(req);
    if (!user) {
      res.status(401).json({ error: "Avtorizatsiya talab qilinadi" });
      return;
    }

    const db = readDB();

    // 1. Counters
    const activeDocs = db.documents.filter(d => !d.deletedAt);
    const jamiHujjatlar = activeDocs.length;
    
    // Students with at least 1 document
    const studentIdsWithDocs = new Set(activeDocs.map(d => d.studentId));
    const jamiOquvchilar = studentIdsWithDocs.size;

    const jamiKategoriyalar = db.categories.filter(c => c.isActive).length;
    const jamiShkaflar = db.cabinets.filter(c => c.isActive).length;

    // Today's intake
    const todayStr = new Date().toISOString().split("T")[0];
    const bugunQabulQilingan = activeDocs.filter(d => d.receivedAt.startsWith(todayStr)).length;

    // Today's searches count from logs
    const bugunQidiruvlar = db.auditLogs.filter(l => l.createdAt.startsWith(todayStr) && l.action.includes("Qidiruv")).length;

    // 2. Category distribution
    const categoryStats = db.categories.map(c => {
      const count = activeDocs.filter(d => d.categoryId === c.id).length;
      return {
        id: c.id,
        name: c.name,
        count,
        percent: jamiHujjatlar > 0 ? Math.round((count / jamiHujjatlar) * 100) : 0
      };
    }).sort((a, b) => b.count - a.count);

    // 3. Cabinets distribution & details
    const cabinetStats = db.cabinets.map(cab => {
      const cabDocs = activeDocs.filter(d => d.cabinetId === cab.id);
      const floorDistribution: { [key: number]: number } = {};
      for (let i = 1; i <= cab.maxFloor; i++) {
        floorDistribution[i] = 0;
      }
      cabDocs.forEach(d => {
        if (d.floor >= 1 && d.floor <= cab.maxFloor) {
          floorDistribution[d.floor] = (floorDistribution[d.floor] || 0) + 1;
        }
      });
      return {
        id: cab.id,
        name: cab.name,
        description: cab.description,
        count: cabDocs.length,
        floorDistribution
      };
    });

    // 4. Oxirgi faoliyat (last 15 items)
    const processedDocuments = activeDocs.map(doc => {
      const studentObj = db.students.find(s => s.id === doc.studentId);
      const categoryObj = db.categories.find(c => c.id === doc.categoryId);
      const cabinetObj = db.cabinets.find(cab => cab.id === doc.cabinetId);
      return {
        id: doc.id,
        studentName: studentObj ? `${studentObj.lastName} ${studentObj.firstName}` : "Noma'lum O'quvchi",
        categoryName: categoryObj ? categoryObj.name : "Noma'lum Kategoriya",
        cabinetName: cabinetObj ? cabinetObj.name : "Noma'lum Shkaf",
        floor: doc.floor,
        status: doc.status,
        receivedAt: doc.receivedAt,
      };
    });
    const songgiYozuvlar = processedDocuments
      .sort((a, b) => new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime())
      .slice(0, 15);

    // 5. Weekly intake graph data (last 7 days)
    const weeklyData: any[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayStr = d.toISOString().split("T")[0];
      const count = activeDocs.filter(doc => doc.receivedAt.startsWith(dayStr)).length;
      // Get readable Uzbek day names or simple format
      const weekdayUz = ["Yak", "Dus", "Se", "Chor", "Pay", "Jum", "Sha"][d.getDay()];
      weeklyData.push({
        date: dayStr,
        dayName: `${dayStr.substring(8, 10)}-${dayStr.substring(5, 7)} (${weekdayUz})`,
        count
      });
    }

    res.json({
      counters: {
        jamiHujjatlar,
        jamiOquvchilar,
        jamiKategoriyalar,
        jamiShkaflar,
        bugunQabulQilingan,
        bugunQidiruvlar
      },
      categoryStats,
      cabinetStats,
      songgiYozuvlar,
      weeklyData
    });
  });

  // Documents API
  app.get("/api/documents", (req, res) => {
    const user = getAuthUser(req);
    if (!user) {
      res.status(401).json({ error: "Avtorizatsiya talab qilinadi" });
      return;
    }

    const { q, categoryId, cabinetId, dateFrom, dateTo, docDate, status, page = 1, limit = 50 } = req.query;
    const db = readDB();

    let filtered = db.documents.filter(d => !d.deletedAt);

    // Text search (lastName, firstName, middleName, studentId, employeeId, docName)
    if (q) {
      const searchStr = String(q).toLowerCase();
      filtered = filtered.filter(doc => {
        const studentObj = db.students.find(s => s.id === doc.studentId);
        const employeeObj = db.employees ? db.employees.find(e => e.id === doc.employeeId) : undefined;
        
        let targetName = "";
        let targetId = "";
        
        if (studentObj) {
          targetName = `${studentObj.lastName} ${studentObj.firstName} ${studentObj.middleName || ""}`.toLowerCase();
          targetId = (studentObj.studentId || "").toLowerCase();
        } else if (employeeObj) {
          targetName = `${employeeObj.lastName} ${employeeObj.firstName} ${employeeObj.middleName || ""}`.toLowerCase();
          targetId = (employeeObj.employeeId || "").toLowerCase();
        }

        const docNameVal = (doc.docName || "").toLowerCase();
        const originalFilenameVal = (doc.originalFilename || "").toLowerCase();
        const notesVal = (doc.notes || "").toLowerCase();

        return targetName.includes(searchStr) || 
               targetId.includes(searchStr) || 
               docNameVal.includes(searchStr) || 
               originalFilenameVal.includes(searchStr) || 
               notesVal.includes(searchStr);
      });

      // Simple search query log for the system audit
      logAudit(user.id, user.fullName, `Qidiruv qilindi: "${q}"`, "Search", undefined, { query: q });
    }

    if (categoryId) {
      filtered = filtered.filter(d => d.categoryId === String(categoryId));
    }

    if (cabinetId) {
      filtered = filtered.filter(d => d.cabinetId === String(cabinetId));
    }

    if (status) {
      filtered = filtered.filter(d => d.status === String(status));
    }

    if (dateFrom) {
      filtered = filtered.filter(d => d.receivedAt >= String(dateFrom));
    }

    if (dateTo) {
      // Expand till end of day
      const toStr = String(dateTo).includes("T") ? String(dateTo) : `${dateTo}T23:59:59.999Z`;
      filtered = filtered.filter(d => d.receivedAt <= toStr);
    }

    if (docDate) {
      filtered = filtered.filter(d => d.docDate === String(docDate));
    }

    // Join entities
    const total = filtered.length;
    const joined = filtered.map(doc => {
      const studentObj = db.students.find(s => s.id === doc.studentId);
      const employeeObj = db.employees ? db.employees.find(e => e.id === doc.employeeId) : undefined;
      const categoryObj = db.categories.find(c => c.id === doc.categoryId);
      const cabinetObj = db.cabinets.find(cab => cab.id === doc.cabinetId);
      const receiverObj = db.users.find(u => u.id === doc.receivedByUserId);
      const issuerObj = doc.issuedByUserId ? db.users.find(u => u.id === doc.issuedByUserId) : undefined;

      return {
        ...doc,
        student: studentObj,
        employee: employeeObj,
        category: categoryObj,
        cabinet: cabinetObj,
        receiver: receiverObj ? { fullName: receiverObj.fullName } : undefined,
        issuer: issuerObj ? { fullName: issuerObj.fullName } : undefined,
      };
    });

    // Sort receivedAt Descending (default)
    joined.sort((a, b) => new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime());

    // Pagination
    const pageNum = parseInt(String(page)) || 1;
    const limitNum = parseInt(String(limit)) || 50;
    const startIndex = (pageNum - 1) * limitNum;
    const paginated = joined.slice(startIndex, startIndex + limitNum);

    res.json({
      documents: paginated,
      total,
      page: pageNum,
      limit: limitNum,
    });
  });

  // Get specific Document PDF file
  app.get("/api/documents/pdf/:id", (req, res) => {
    // Note: PDF URL can be verified with standard Auth, but we can allow downloading with token or parameter
    const db = readDB();
    const doc = db.documents.find(d => d.id === req.params.id && !d.deletedAt);
    if (!doc) {
      res.status(404).send("Hujjat topilmadi");
      return;
    }

    const isDownload = req.query.download === "true";
    const disposition = isDownload ? "attachment" : "inline";

    const pdfPath = path.join(UPLOADS_DIR, doc.filePath);
    if (fs.existsSync(pdfPath)) {
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `${disposition}; filename="${encodeURIComponent(doc.originalFilename)}"`);
      res.sendFile(pdfPath);
    } else {
      // Generate dynamically if physical file is missing from uploads
      createDummyPDF(pdfPath, `Hujjat ID: ${doc.id}\nAsl nomi: ${doc.originalFilename}\nFizik joylashuvi: ${doc.floor}-qavat`);
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `${disposition}; filename="${encodeURIComponent(doc.originalFilename)}"`);
      res.sendFile(pdfPath);
    }
  });

  // GET specific Document
  app.get("/api/documents/:id", (req, res) => {
    const user = getAuthUser(req);
    if (!user) {
      res.status(401).json({ error: "Avtorizatsiya talab qilinadi" });
      return;
    }

    const db = readDB();
    const doc = db.documents.find(d => d.id === req.params.id && !d.deletedAt);
    if (!doc) {
      res.status(404).json({ error: "Hujjat topilmadi" });
      return;
    }

    const studentObj = db.students.find(s => s.id === doc.studentId);
    const categoryObj = db.categories.find(c => c.id === doc.categoryId);
    const cabinetObj = db.cabinets.find(cab => cab.id === doc.cabinetId);
    const receiverObj = db.users.find(u => u.id === doc.receivedByUserId);
    const issuerObj = doc.issuedByUserId ? db.users.find(u => u.id === doc.issuedByUserId) : undefined;

    res.json({
      ...doc,
      student: studentObj,
      category: categoryObj,
      cabinet: cabinetObj,
      receiver: receiverObj ? { fullName: receiverObj.fullName } : undefined,
      issuer: issuerObj ? { fullName: issuerObj.fullName } : undefined,
    });
  });

  // POST Document (Intake process)
  app.post("/api/documents", (req, res) => {
    const user = getAuthUser(req);
    if (!user) {
      res.status(401).json({ error: "Avtorizatsiya talab qilinadi" });
      return;
    }

    if (user.role === UserRole.VIEWER) {
      res.status(403).json({ error: "Hujjat qabul qilish huquqingiz yo'q" });
      return;
    }

    const {
      categoryId,
      docName,
      docDate,
      personType, // 'student' | 'employee' | 'none'

      // Student details
      studentId,
      studentFirstName,
      studentLastName,
      studentMiddleName,
      studentRegId,
      studentGroup,
      studentBirthDate,
      studentPhone,

      // Employee details
      employeeId,
      employeeFirstName,
      employeeLastName,
      employeeMiddleName,
      employeeRegId,
      employeeDepartment,
      employeePosition,
      employeePhone,

      cabinetId,
      floor,
      pdfFilename,
      pdfBase64,
      notes,
    } = req.body;

    // Validate inputs
    if (!cabinetId || !floor) {
      res.status(400).json({ error: "Shkaf va qavat belgilanishi shart" });
      return;
    }

    const db = readDB();

    // 1. Resolve Category
    const category = db.categories.find(c => c.id === categoryId);
    if (!category) {
      res.status(400).json({ error: "Tanlangan kategoriya topilmadi" });
      return;
    }

    let resolvedStudentId = undefined;
    let resolvedEmployeeId = undefined;

    // 2. Resolve Person based on type
    if (categoryId === "cat-talaba") {
      resolvedStudentId = studentId;
      if (!resolvedStudentId && (studentFirstName || studentLastName)) {
        if (!studentFirstName || !studentLastName) {
          res.status(400).json({ error: "Yangi talaba ma'lumotlari kiritilishi shart (Familia va Ism)" });
          return;
        }

        // Check duplicate
        if (studentRegId) {
          const studentDup = db.students.find(s => s.studentId && s.studentId.trim().toLowerCase() === studentRegId.trim().toLowerCase());
          if (studentDup) {
            resolvedStudentId = studentDup.id;
          }
        }

        if (!resolvedStudentId) {
          const newStudentId = "std-" + Date.now();
          const newStudent = {
            id: newStudentId,
            lastName: studentLastName.trim(),
            firstName: studentFirstName.trim(),
            middleName: studentMiddleName ? studentMiddleName.trim() : "",
            studentId: studentRegId ? studentRegId.trim() : undefined,
            groupName: studentGroup ? studentGroup.trim() : "",
            birthDate: studentBirthDate || undefined,
            phone: studentPhone || undefined,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          db.students.push(newStudent);
          resolvedStudentId = newStudentId;
          logAudit(user.id, user.fullName, `Yangi talaba qo'shildi: ${studentLastName} ${studentFirstName}`, "Student", newStudentId);
        }
      }
    } else if (categoryId === "cat-xodim") {
      resolvedEmployeeId = employeeId;
      if (!resolvedEmployeeId) {
        if (!employeeFirstName || !employeeLastName) {
          res.status(400).json({ error: "Yangi xodim ma'lumotlari kiritilishi shart (Familia va Ism)" });
          return;
        }

        // Check duplicate
        if (employeeRegId) {
          const empDup = db.employees.find(e => e.employeeId && e.employeeId.trim().toLowerCase() === employeeRegId.trim().toLowerCase());
          if (empDup) {
            resolvedEmployeeId = empDup.id;
          }
        }

        if (!resolvedEmployeeId) {
          const newEmpId = "emp-" + Date.now();
          const newEmp = {
            id: newEmpId,
            lastName: employeeLastName.trim(),
            firstName: employeeFirstName.trim(),
            middleName: employeeMiddleName ? employeeMiddleName.trim() : "",
            employeeId: employeeRegId ? employeeRegId.trim() : undefined,
            department: employeeDepartment ? employeeDepartment.trim() : "",
            position: employeePosition ? employeePosition.trim() : "",
            phone: employeePhone || undefined,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          if (!db.employees) db.employees = [];
          db.employees.push(newEmp);
          resolvedEmployeeId = newEmpId;
          logAudit(user.id, user.fullName, `Yangi xodim qo'shildi: ${employeeLastName} ${employeeFirstName}`, "Employee", newEmpId);
        }
      }
    }

    // Validate Floor ranges
    const cabinet = db.cabinets.find(cab => cab.id === cabinetId);
    if (!cabinet) {
      res.status(400).json({ error: "Tanlangan shkaf topilmadi" });
      return;
    }

    const floorNum = parseInt(String(floor));
    if (isNaN(floorNum) || floorNum < 1 || floorNum > cabinet.maxFloor) {
      res.status(400).json({ error: `Haqiqiy qavat ko'rsatilishi shart (Ushbu shkaf uchun: 1-${cabinet.maxFloor})` });
      return;
    }

    // 3. Resolve PDF
    if (!pdfFilename && !pdfBase64) {
      res.status(400).json({ error: "Hujjat PDF fayli yuklanishi lozim" });
      return;
    }

    const docId = "doc-" + Date.now();
    const cleanFilename = pdfFilename || "hujjat.pdf";
    const secureFilename = `${docId}.pdf`;
    const fullPdfPath = path.join(UPLOADS_DIR, secureFilename);

    let finalFileSize = 10240; // Default size if mocked

    if (pdfBase64) {
      const base64Data = pdfBase64.replace(/^data:application\/pdf;base64,/, "");
      const buffer = Buffer.from(base64Data, "base64");
      fs.writeFileSync(fullPdfPath, buffer);
      finalFileSize = buffer.length;
    } else {
      createDummyPDF(fullPdfPath, `Kategoriya: ${category.name}\nHujjat: ${docName || "N/A"}\nQabul qilingan: ${new Date().toLocaleDateString()}`);
    }

    // Create document record
    const newDoc = {
      id: docId,
      studentId: resolvedStudentId,
      employeeId: resolvedEmployeeId,
      categoryId,
      docName: docName || "",
      docDate: docDate || "",
      personType: personType || (categoryId === "cat-talaba" ? "student" : categoryId === "cat-xodim" ? "employee" : "none"),
      cabinetId,
      floor: floorNum,
      filePath: secureFilename,
      fileSize: finalFileSize,
      originalFilename: cleanFilename,
      status: DocumentStatus.JOYIDA,
      notes: notes || "",
      receivedAt: new Date().toISOString(),
      receivedByUserId: user.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    db.documents.push(newDoc);
    writeDB(db);

    let auditEntityDesc = "";
    if (categoryId === "cat-talaba") {
      const docStudent = db.students.find(s => s.id === resolvedStudentId);
      auditEntityDesc = `talaba: ${docStudent?.lastName || ""} ${docStudent?.firstName || ""}`;
    } else if (categoryId === "cat-xodim") {
      const docEmp = db.employees.find(e => e.id === resolvedEmployeeId);
      auditEntityDesc = `xodim: ${docEmp?.lastName || ""} ${docEmp?.firstName || ""}`;
    } else {
      auditEntityDesc = "Institut hujjati";
    }

    logAudit(user.id, user.fullName, `Yangi arxiv hujjat qabul qilindi: "${docName || cleanFilename}" (${auditEntityDesc})`, "Document", docId, { documentId: docId });

    res.status(201).json(newDoc);
  });

  // PUT Document Update (status, details)
  app.put("/api/documents/:id", (req, res) => {
    const user = getAuthUser(req);
    if (!user) {
      res.status(401).json({ error: "Avtorizatsiya talab qilinadi" });
      return;
    }

    if (user.role === UserRole.VIEWER) {
      res.status(403).json({ error: "Tahrirlash huquqingiz yo'q" });
      return;
    }

    const db = readDB();
    const docIndex = db.documents.findIndex(d => d.id === req.params.id && !d.deletedAt);
    if (docIndex === -1) {
      res.status(404).json({ error: "Hujjat topilmadi" });
      return;
    }

    const doc = db.documents[docIndex];
    const { status, cabinetId, floor, notes, categoryId, pdfBase64, pdfFilename } = req.body;

    const oldStatus = doc.status;

    // Validate cabinet/floor if modified
    if (cabinetId || floor) {
      const activeCabId = cabinetId || doc.cabinetId;
      const cab = db.cabinets.find(c => c.id === activeCabId);
      if (!cab) {
        res.status(400).json({ error: "Tanlangan shkaf mavjud emas" });
        return;
      }
      const activeFloor = floor ? parseInt(String(floor)) : doc.floor;
      if (isNaN(activeFloor) || activeFloor < 1 || activeFloor > cab.maxFloor) {
        res.status(400).json({ error: `Ushbu shkaf uchun qavat diapazoni: 1-${cab.maxFloor}` });
        return;
      }
      doc.cabinetId = activeCabId;
      doc.floor = activeFloor;
    }

    if (categoryId) {
      const cat = db.categories.find(c => c.id === categoryId);
      if (!cat) {
        res.status(400).json({ error: "Tanlangan kategoriya topilmadi" });
        return;
      }
      doc.categoryId = categoryId;
    }

    if (notes !== undefined) {
      doc.notes = notes;
    }

    // Core state machine: Status flow
    if (status && status !== doc.status) {
      doc.status = status as DocumentStatus;
      
      if (status === DocumentStatus.BERILGAN) {
        doc.issuedAt = new Date().toISOString();
        doc.issuedByUserId = user.id;
      } else if (status === DocumentStatus.JOYIDA) {
        doc.issuedAt = undefined;
        doc.issuedByUserId = undefined;
      }
    }

    // Optional dynamic PDF Replacement
    if (pdfBase64 && pdfFilename) {
      const fullPdfPath = path.join(UPLOADS_DIR, doc.filePath);
      const base64Data = pdfBase64.replace(/^data:application\/pdf;base64,/, "");
      const buffer = Buffer.from(base64Data, "base64");
      fs.writeFileSync(fullPdfPath, buffer);
      doc.originalFilename = pdfFilename;
      doc.fileSize = buffer.length;
    }

    doc.updatedAt = new Date().toISOString();
    writeDB(db);

    logAudit(
      user.id, 
      user.fullName, 
      `Hujjat tahrirlandi: (Holat: ${oldStatus} -> ${doc.status})`, 
      "Document", 
      doc.id, 
      { docId: doc.id, changes: req.body }
    );

    res.json(doc);
  });

  // DELETE Document (Soft delete)
  app.delete("/api/documents/:id", (req, res) => {
    const user = getAuthUser(req);
    if (!user) {
      res.status(401).json({ error: "Avtorizatsiya talab qilinadi" });
      return;
    }

    if (user.role !== UserRole.ADMIN) {
      res.status(403).json({ error: "Hujjatni faqat administrator o'chirishi mumkin" });
      return;
    }

    const db = readDB();
    const docIndex = db.documents.findIndex(d => d.id === req.params.id && !d.deletedAt);
    if (docIndex === -1) {
      res.status(404).json({ error: "Hujjat topilmadi" });
      return;
    }

    db.documents[docIndex].deletedAt = new Date().toISOString();
    db.documents[docIndex].updatedAt = new Date().toISOString();
    writeDB(db);

    logAudit(user.id, user.fullName, `Hujjat o'chirildi (soft delete): ID ${req.params.id}`, "Document", req.params.id);

    res.json({ success: true });
  });

  // GET Categories list
  app.get("/api/categories", (req, res) => {
    const user = getAuthUser(req);
    if (!user) {
      res.status(401).json({ error: "Avtorizatsiya talab qilinadi" });
      return;
    }

    const { all } = req.query;
    const db = readDB();

    // Include counts
    const activeDocs = db.documents.filter(d => !d.deletedAt);
    let list = db.categories;

    // Filter inactive out unless 'all=true' is passed
    if (all !== "true") {
      list = list.filter(c => c.isActive);
    }

    const result = list.map(cat => {
      const docCount = activeDocs.filter(d => d.categoryId === cat.id).length;
      return {
        ...cat,
        docCount
      };
    });

    res.json(result);
  });

  // POST Category CRUD
  app.post("/api/categories", (req, res) => {
    const user = getAuthUser(req);
    if (!user) {
      res.status(401).json({ error: "Avtorizatsiya talab qilinadi" });
      return;
    }

    if (user.role === UserRole.VIEWER) {
      res.status(403).json({ error: "Kategoriya kiritish ruxsati yo'q" });
      return;
    }

    const { name, description } = req.body;
    if (!name || name.trim() === "") {
      res.status(400).json({ error: "Kategoriya nomi kiritilishi shart" });
      return;
    }

    const db = readDB();
    // Check duplication case-insensitive
    const duplicate = db.categories.find(c => c.name.trim().toLowerCase() === name.trim().toLowerCase());
    if (duplicate) {
      res.status(400).json({ error: "Ushbu nomdagi kategoriya allaqachon mavjud" });
      return;
    }

    const newCat = {
      id: "cat-" + Date.now(),
      name: name.trim(),
      description: description || "",
      isActive: true,
      createdAt: new Date().toISOString()
    };

    db.categories.push(newCat);
    writeDB(db);

    logAudit(user.id, user.fullName, `Yangi kategoriya yaratildi: "${newCat.name}"`, "Category", newCat.id);

    res.status(201).json(newCat);
  });

  // PUT Category Update
  app.put("/api/categories/:id", (req, res) => {
    const user = getAuthUser(req);
    if (!user) {
      res.status(401).json({ error: "Avtorizatsiya talab qilinadi" });
      return;
    }

    if (user.role === UserRole.VIEWER) {
      res.status(403).json({ error: "Kategoriyani o'zgartirish ruxsati yo'q" });
      return;
    }

    const { name, description, isActive } = req.body;
    const db = readDB();
    const index = db.categories.findIndex(c => c.id === req.params.id);

    if (index === -1) {
      res.status(404).json({ error: "Kategoriya topilmadi" });
      return;
    }

    const cat = db.categories[index];

    if (name && name.trim().toLowerCase() !== cat.name.toLowerCase()) {
      const duplicate = db.categories.find(c => c.id !== cat.id && c.name.trim().toLowerCase() === name.trim().toLowerCase());
      if (duplicate) {
        res.status(400).json({ error: "Ushbu nomdagi kategoriya allaqachon mavjud" });
        return;
      }
      cat.name = name.trim();
    }

    if (description !== undefined) cat.description = description;
    if (isActive !== undefined) cat.isActive = !!isActive;

    writeDB(db);

    logAudit(user.id, user.fullName, `Kategoriya yangilandi: "${cat.name}" (Faol: ${cat.isActive})`, "Category", cat.id);

    res.json(cat);
  });

  // DELETE Category
  app.delete("/api/categories/:id", (req, res) => {
    const user = getAuthUser(req);
    if (!user) {
      res.status(401).json({ error: "Avtorizatsiya talab qilinadi" });
      return;
    }

    if (user.role === UserRole.VIEWER) {
      res.status(403).json({ error: "Kategoriyani o'chirish ruxsati yo'q" });
      return;
    }

    const db = readDB();
    const catIndex = db.categories.findIndex(c => c.id === req.params.id);
    if (catIndex === -1) {
      res.status(404).json({ error: "Kategoriya topilmadi" });
      return;
    }

    // Check if category is used by active documents
    const usageCount = db.documents.filter(d => !d.deletedAt && d.categoryId === req.params.id).length;
    if (usageCount > 0) {
      res.status(400).json({ error: `Kategoriyadan foydalanilmoqda (${usageCount} ta hujjat). Uni o'chirish uchun avval ushbu kategoriyaga tegishli hujjatlarni o'chiring yoki boshqa kategoriyaga o'tkazing.` });
      return;
    }

    const catName = db.categories[catIndex].name;
    db.categories.splice(catIndex, 1);
    writeDB(db);

    logAudit(user.id, user.fullName, `Kategoriya o'chirildi: "${catName}"`, "Category", req.params.id);

    res.json({ success: true });
  });

  // GET Cabinets list
  app.get("/api/cabinets", (req, res) => {
    const user = getAuthUser(req);
    if (!user) {
      res.status(401).json({ error: "Avtorizatsiya talab qilinadi" });
      return;
    }

    const db = readDB();
    const activeDocs = db.documents.filter(d => !d.deletedAt);

    const result = db.cabinets.map(cab => {
      const docCount = activeDocs.filter(d => d.cabinetId === cab.id).length;
      return {
        ...cab,
        docCount
      };
    });

    res.json(result);
  });

  // GET Students list
  app.get("/api/students", (req, res) => {
    const user = getAuthUser(req);
    if (!user) {
      res.status(401).json({ error: "Avtorizatsiya talab qilinadi" });
      return;
    }
    const db = readDB();
    res.json(db.students || []);
  });

  // GET Employees list
  app.get("/api/employees", (req, res) => {
    const user = getAuthUser(req);
    if (!user) {
      res.status(401).json({ error: "Avtorizatsiya talab qilinadi" });
      return;
    }
    const db = readDB();
    res.json(db.employees || []);
  });

  // POST Cabinet CRUD
  app.post("/api/cabinets", (req, res) => {
    const user = getAuthUser(req);
    if (!user) {
      res.status(401).json({ error: "Avtorizatsiya talab qilinadi" });
      return;
    }

    if (user.role === UserRole.VIEWER) {
      res.status(403).json({ error: "Shkaf qo'shish huquqi yo'q" });
      return;
    }

    const { name, description, maxFloor = 9 } = req.body;
    if (!name || name.trim() === "") {
      res.status(400).json({ error: "Shkaf nomi/raqami kiritilishi shart" });
      return;
    }

    const maxFloorNum = parseInt(String(maxFloor));
    if (isNaN(maxFloorNum) || maxFloorNum < 1 || maxFloorNum > 99) {
      res.status(400).json({ error: "Shkaf qavati 1 va 99 oralig'ida bo'lishi lozim" });
      return;
    }

    const db = readDB();
    const duplicate = db.cabinets.find(c => c.name.trim().toLowerCase() === name.trim().toLowerCase());
    if (duplicate) {
      res.status(400).json({ error: "Ushbu nomdagi shkaf allaqachon mavjud" });
      return;
    }

    const newCab = {
      id: "cab-" + Date.now(),
      name: name.trim(),
      description: description || "",
      maxFloor: maxFloorNum,
      isActive: true,
      createdAt: new Date().toISOString()
    };

    db.cabinets.push(newCab);
    writeDB(db);

    logAudit(user.id, user.fullName, `Yangi shkaf yaratildi: "${newCab.name}"`, "Cabinet", newCab.id);

    res.status(201).json(newCab);
  });

  // PUT Cabinet update
  app.put("/api/cabinets/:id", (req, res) => {
    const user = getAuthUser(req);
    if (!user) {
      res.status(401).json({ error: "Avtorizatsiya talab qilinadi" });
      return;
    }

    if (user.role === UserRole.VIEWER) {
      res.status(403).json({ error: "Shkafni tahrirlash huquqi yo'q" });
      return;
    }

    const { name, description, maxFloor, isActive } = req.body;
    const db = readDB();
    const index = db.cabinets.findIndex(c => c.id === req.params.id);

    if (index === -1) {
      res.status(404).json({ error: "Shkaf topilmadi" });
      return;
    }

    const cab = db.cabinets[index];

    if (name && name.trim().toLowerCase() !== cab.name.toLowerCase()) {
      const duplicate = db.cabinets.find(c => c.id !== cab.id && c.name.trim().toLowerCase() === name.trim().toLowerCase());
      if (duplicate) {
        res.status(400).json({ error: "Ushbu nomdagi shkaf allaqachon mavjud" });
        return;
      }
      cab.name = name.trim();
    }

    if (maxFloor !== undefined) {
      const maxFloorNum = parseInt(String(maxFloor));
      if (!isNaN(maxFloorNum) && maxFloorNum >= 1 && maxFloorNum <= 99) {
        cab.maxFloor = maxFloorNum;
      }
    }

    if (description !== undefined) cab.description = description;
    if (isActive !== undefined) cab.isActive = !!isActive;

    writeDB(db);

    logAudit(user.id, user.fullName, `Shkaf yangilandi: "${cab.name}" (Maks qavat: ${cab.maxFloor}, Faol: ${cab.isActive})`, "Cabinet", cab.id);

    res.json(cab);
  });

  // DELETE Cabinet
  app.delete("/api/cabinets/:id", (req, res) => {
    const user = getAuthUser(req);
    if (!user) {
      res.status(401).json({ error: "Avtorizatsiya talab qilinadi" });
      return;
    }

    if (user.role === UserRole.VIEWER) {
      res.status(403).json({ error: "Shkafni o'chirish huquqi yo'q" });
      return;
    }

    const db = readDB();
    const cabIndex = db.cabinets.findIndex(c => c.id === req.params.id);
    if (cabIndex === -1) {
      res.status(404).json({ error: "Shkaf topilmadi" });
      return;
    }

    // Check if cabinet is used by active documents
    const usageCount = db.documents.filter(d => !d.deletedAt && d.cabinetId === req.params.id).length;
    if (usageCount > 0) {
      res.status(400).json({ error: `Shkafdan foydalanilmoqda (${usageCount} ta hujjat). Uni o'chirish uchun avval ushbu shkafdagi hujjatlarni boshqa joyga ko'chiring.` });
      return;
    }

    const cabName = db.cabinets[cabIndex].name;
    db.cabinets.splice(cabIndex, 1);
    writeDB(db);

    logAudit(user.id, user.fullName, `Shkaf o'chirildi: "${cabName}"`, "Cabinet", req.params.id);

    res.json({ success: true });
  });

  // USERS MANAGEMENT (Admin only)
  app.get("/api/users", (req, res) => {
    const user = getAuthUser(req);
    if (!user) {
      res.status(401).json({ error: "Avtorizatsiya talab qilinadi" });
      return;
    }

    if (user.role !== UserRole.ADMIN) {
      res.status(403).json({ error: "Ushbu sahifa faqat administrator uchun ochiq" });
      return;
    }

    const db = readDB();
    // Return list without passwords
    const list = db.users.map(({ passwordHash, ...u }) => u);
    res.json(list);
  });

  app.post("/api/users", (req, res) => {
    const user = getAuthUser(req);
    if (!user) {
      res.status(401).json({ error: "Avtorizatsiya talab qilinadi" });
      return;
    }

    if (user.role !== UserRole.ADMIN) {
      res.status(403).json({ error: "Ruxsat etilmagan harakat" });
      return;
    }

    const { username, fullName, role, password, isActive = true } = req.body;
    if (!username || !fullName || !role || !password) {
      res.status(400).json({ error: "Majburiy maydonlar to'liq kiritilmadi" });
      return;
    }

    if (password.length < 8) {
      res.status(400).json({ error: "Parol uzunligi kamida 8 ta belgidan iborat bo'lishi lozim" });
      return;
    }

    const db = readDB();
    const duplicate = db.users.find(u => u.username.toLowerCase() === username.toLowerCase());
    if (duplicate) {
      res.status(400).json({ error: "Bunday foydalanuvchi nomi allaqachon mavjud" });
      return;
    }

    const newUser = {
      id: "u-" + Date.now(),
      username: username.trim().toLowerCase(),
      fullName: fullName.trim(),
      role: role as UserRole,
      passwordHash: password,
      isActive: !!isActive,
      createdAt: new Date().toISOString()
    };

    db.users.push(newUser);
    writeDB(db);

    logAudit(user.id, user.fullName, `Yangi foydalanuvchi qo'shildi: "${newUser.username}" (${newUser.role})`, "User", newUser.id);

    const { passwordHash, ...response } = newUser;
    res.status(201).json(response);
  });

  app.put("/api/users/:id", (req, res) => {
    const user = getAuthUser(req);
    if (!user) {
      res.status(401).json({ error: "Avtorizatsiya talab qilinadi" });
      return;
    }

    if (user.role !== UserRole.ADMIN) {
      res.status(403).json({ error: "Ruxsat etilmagan harakat" });
      return;
    }

    const { fullName, role, password, isActive } = req.body;
    const db = readDB();
    const index = db.users.findIndex(u => u.id === req.params.id);

    if (index === -1) {
      res.status(404).json({ error: "Foydalanuvchi topilmadi" });
      return;
    }

    const targetUser = db.users[index];

    if (fullName) targetUser.fullName = fullName;
    if (role) targetUser.role = role as UserRole;
    if (isActive !== undefined) targetUser.isActive = !!isActive;
    if (password) {
      if (password.length < 8) {
        res.status(400).json({ error: "Parol uzunligi kamida 8 ta belgidan iborat bo'lishi lozim" });
        return;
      }
      targetUser.passwordHash = password;
    }

    writeDB(db);

    logAudit(user.id, user.fullName, `Foydalanuvchi ma'lumotlari yangilandi: "${targetUser.username}"`, "User", targetUser.id);

    const { passwordHash, ...response } = targetUser;
    res.json(response);
  });

  // GET Audit Logs
  app.get("/api/audit-logs", (req, res) => {
    const user = getAuthUser(req);
    if (!user) {
      res.status(401).json({ error: "Avtorizatsiya talab qilinadi" });
      return;
    }

    if (user.role !== UserRole.ADMIN) {
      res.status(403).json({ error: "Audit jurnali faqat administratorlarga ko'rinadi" });
      return;
    }

    const db = readDB();
    res.json(db.auditLogs);
  });

  // --- VITE MIDDLEWARE SETUP ---

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server started and listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start full stack Express backend service", err);
});
