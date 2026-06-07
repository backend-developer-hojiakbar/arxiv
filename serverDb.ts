/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import path from "path";
import fs from "fs";
import type express from "express";
import { UserRole, DocumentStatus } from "./src/types.js";

export const PORT = 3000;
export const DB_PATH = path.join(process.cwd(), "db.json");
export const UPLOADS_DIR = path.join(process.cwd(), "uploads");

if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

export function createDummyPDF(filePath: string, text: string = "Institut Arxivi Hujjati") {
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

export interface DBStructure {
  users: any[];
  students: any[];
  employees: any[];
  categories: any[];
  cabinets: any[];
  documents: any[];
  auditLogs: any[];
}

export const initialDB: DBStructure = {
  users: [
    {
      id: "u-1",
      username: "admin",
      passwordHash: "admin123",
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
    },
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
    },
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
    },
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
    },
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
    },
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
    },
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
    },
  ],
};

export function readDB(): DBStructure {
  try {
    if (!fs.existsSync(DB_PATH)) {
      writeDB(initialDB);
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

export function writeDB(data: DBStructure) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), "utf-8");
  } catch (error) {
    console.error("DB writing error", error);
  }
}

export function getAuthUser(req: express.Request): any | null {
  const authHeader = req.headers.authorization;
  if (!authHeader) return null;
  const db = readDB();
  const userId = authHeader.replace("Bearer ", "").trim();
  const user = db.users.find((u) => u.id === userId && u.isActive);
  return user || null;
}

export function logAudit(
  userId: string,
  userFullName: string,
  action: string,
  entityType: string,
  entityId?: string,
  payload?: any,
  ip: string = "127.0.0.1"
) {
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
  if (db.auditLogs.length > 1000) {
    db.auditLogs = db.auditLogs.slice(0, 1000);
  }
  writeDB(db);
}

export function seedDatabaseIfNeeded() {
  const loadedDb = readDB();
  let shouldUpdateDb = false;
  if (!loadedDb.categories || loadedDb.categories.length !== 3 || !loadedDb.categories.find((c) => c.id === "cat-institut")) {
    loadedDb.categories = initialDB.categories;
    if (loadedDb.documents) {
      loadedDb.documents.forEach((d: any) => {
        if (d.categoryId === "cat-3" || d.categoryId === "cat-xodim") {
          d.categoryId = "cat-xodim";
          d.personType = "employee";
        } else if (d.categoryId === "cat-institut") {
          d.categoryId = "cat-institut";
          d.personType = "none";
        } else {
          d.categoryId = "cat-talaba";
          d.personType = "student";
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
}
