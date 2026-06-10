/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Local /api/v1 routes matching the frontend api.ts contract.
 */

import { Router, type Request, type Response } from "express";
import path from "path";
import fs from "fs";
import multer from "multer";
import { UserRole, DocumentStatus } from "./src/types.js";
import { getCategoryFlowType } from "./src/apiMappers.js";
import {
  UPLOADS_DIR,
  createDummyPDF,
  readDB,
  writeDB,
  getAuthUser,
  logAudit,
} from "./serverDb.js";

function requireAuth(req: Request, res: Response): any | null {
  const user = getAuthUser(req);
  if (!user) {
    res.status(401).json({ error: "Avtorizatsiya talab qilinadi" });
    return null;
  }
  return user;
}

function serializeUser(u: any) {
  return {
    id: u.id,
    username: u.username,
    full_name: u.fullName,
    role: u.role,
    is_active: u.isActive,
    created_at: u.createdAt,
    last_login_at: u.lastLoginAt,
  };
}

function serializeStudent(s: any) {
  return {
    id: s.id,
    last_name: s.lastName,
    first_name: s.firstName,
    middle_name: s.middleName,
    student_id: s.studentId,
    group_name: s.groupName,
    birth_date: s.birthDate,
    phone: s.phone,
    is_active: s.isActive !== false,
    created_at: s.createdAt,
    updated_at: s.updatedAt,
  };
}

function serializeEmployee(e: any) {
  return {
    id: e.id,
    last_name: e.lastName,
    first_name: e.firstName,
    middle_name: e.middleName,
    employee_id: e.employeeId,
    department: e.department,
    position: e.position,
    phone: e.phone,
    is_active: e.isActive !== false,
    created_at: e.createdAt,
    updated_at: e.updatedAt,
  };
}

function serializeCategory(c: any) {
  return {
    id: c.id,
    name: c.name,
    description: c.description,
    is_active: c.isActive,
    created_at: c.createdAt,
  };
}

function serializeCabinet(c: any) {
  return {
    id: c.id,
    name: c.name,
    description: c.description,
    max_floor: c.maxFloor,
    is_active: c.isActive,
    created_at: c.createdAt,
  };
}

function serializeDocument(doc: any, db: ReturnType<typeof readDB>) {
  const student = doc.studentId ? db.students.find((s) => s.id === doc.studentId) : undefined;
  const employee = doc.employeeId ? db.employees?.find((e) => e.id === doc.employeeId) : undefined;
  const category = db.categories.find((c) => c.id === doc.categoryId);
  const cabinet = db.cabinets.find((c) => c.id === doc.cabinetId);
  const receiver = db.users.find((u) => u.id === doc.receivedByUserId);
  const issuer = doc.issuedByUserId ? db.users.find((u) => u.id === doc.issuedByUserId) : undefined;

  return {
    id: doc.id,
    category_id: doc.categoryId,
    cabinet_id: doc.cabinetId,
    floor: doc.floor,
    doc_name: doc.docName,
    doc_date: doc.docDate,
    expiry_year: doc.expiryYear ?? null,
    person_type: doc.personType || "none",
    employee_id: doc.employeeId,
    student_id: doc.studentId,
    student_name: student ? `${student.lastName} ${student.firstName}` : null,
    group_name: student?.groupName,
    status: doc.status,
    pdf_path: doc.filePath,
    original_filename: doc.originalFilename,
    file_size: doc.fileSize,
    notes: doc.notes,
    description: doc.description,
    created_at: doc.receivedAt || doc.createdAt,
    updated_at: doc.updatedAt,
    received_at: doc.receivedAt,
    issued_at: doc.issuedAt,
    student: student ? serializeStudent(student) : null,
    employee: employee ? serializeEmployee(employee) : null,
    category: category ? serializeCategory(category) : null,
    cabinet: cabinet ? serializeCabinet(cabinet) : null,
    receiver: receiver ? { full_name: receiver.fullName } : undefined,
    issuer: issuer ? { full_name: issuer.fullName } : undefined,
  };
}

function isDocExpired(expiryYear?: number | null): boolean {
  if (expiryYear == null || Number.isNaN(expiryYear)) return false;
  return new Date().getFullYear() > expiryYear;
}

function filterDocuments(db: ReturnType<typeof readDB>, query: Record<string, unknown>) {
  let filtered = db.documents.filter((d) => !d.deletedAt);
  const q = query.query || query.q;
  const categoryId = query.category_id || query.categoryId;
  const cabinetId = query.cabinet_id || query.cabinetId;
  const docDate = query.doc_date || query.docDate;
  const dateFrom = query.date_from || query.dateFrom;
  const dateTo = query.date_to || query.dateTo;
  const status = query.status;
  const expired = query.expired;
  const floor = query.floor;
  const personType = query.person_type || query.personType;

  if (q) {
    const searchStr = String(q).toLowerCase();
    filtered = filtered.filter((doc) => {
      const studentObj = db.students.find((s) => s.id === doc.studentId);
      const employeeObj = db.employees?.find((e) => e.id === doc.employeeId);
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
      return (
        targetName.includes(searchStr) ||
        targetId.includes(searchStr) ||
        docNameVal.includes(searchStr) ||
        originalFilenameVal.includes(searchStr) ||
        notesVal.includes(searchStr)
      );
    });
  }

  if (categoryId) filtered = filtered.filter((d) => d.categoryId === String(categoryId));
  if (cabinetId) filtered = filtered.filter((d) => d.cabinetId === String(cabinetId));
  if (status) filtered = filtered.filter((d) => d.status === String(status));
  if (expired === "true" || expired === true) {
    filtered = filtered.filter((d) => isDocExpired(d.expiryYear));
  } else if (expired === "false" || expired === false) {
    filtered = filtered.filter((d) => !isDocExpired(d.expiryYear));
  }
  if (docDate) filtered = filtered.filter((d) => d.docDate === String(docDate));
  if (dateFrom) filtered = filtered.filter((d) => d.receivedAt >= String(dateFrom));
  if (dateTo) {
    const toStr = String(dateTo).includes("T") ? String(dateTo) : `${dateTo}T23:59:59.999Z`;
    filtered = filtered.filter((d) => d.receivedAt <= toStr);
  }
  if (floor) filtered = filtered.filter((d) => d.floor === parseInt(String(floor)));
  if (personType) filtered = filtered.filter((d) => d.personType === String(personType));

  filtered.sort((a, b) => new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime());
  return filtered;
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 },
});

function savePdfBuffer(docId: string, buffer: Buffer, originalFilename: string) {
  const secureFilename = `${docId}.pdf`;
  const fullPdfPath = path.join(UPLOADS_DIR, secureFilename);
  fs.writeFileSync(fullPdfPath, buffer);
  return { secureFilename, fileSize: buffer.length, originalFilename };
}

export function createV1Router(): Router {
  const router = Router();

  router.get("/speech/token", async (req, res) => {
    const authHeader = req.headers.authorization || "";
    if (!authHeader.startsWith("Bearer ")) {
      res.status(401).json({ error: "Avtorizatsiya talab qilinadi" });
      return;
    }

    const key = process.env.AZURE_SPEECH_KEY || "";
    const region = process.env.AZURE_SPEECH_REGION || "";
    if (!key || !region) {
      res.status(503).json({
        error: "Azure Speech sozlanmagan. AZURE_SPEECH_KEY va AZURE_SPEECH_REGION kerak.",
      });
      return;
    }

    try {
      const response = await fetch(`https://${region}.api.cognitive.microsoft.com/sts/v1.0/issueToken`, {
        method: "POST",
        headers: { "Ocp-Apim-Subscription-Key": key },
      });
      if (!response.ok) {
        res.status(502).json({ error: "Azure Speech token olinmadi" });
        return;
      }
      const token = await response.text();
      res.json({
        token,
        region,
        language: process.env.AZURE_SPEECH_LANGUAGE || "uz-UZ",
      });
    } catch {
      res.status(502).json({ error: "Azure Speech token olinmadi" });
    }
  });

  // --- Auth ---
  router.post("/auth/login", (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
      res.status(400).json({ error: "Foydalanuvchi nomi va parol yuborilishi shart" });
      return;
    }
    const db = readDB();
    const user = db.users.find((u) => u.username.toLowerCase() === username.toLowerCase());
    if (!user || user.passwordHash !== password) {
      res.status(401).json({ error: "Login yoki parol noto'g'ri" });
      return;
    }
    if (!user.isActive) {
      res.status(403).json({ error: "Ushbu foydalanuvchi hisob varog'i faolsizlantirilgan" });
      return;
    }
    user.lastLoginAt = new Date().toISOString();
    writeDB(db);
    logAudit(user.id, user.fullName, "Tizimga muvaffaqiyatli kirdi (Login)", "Auth", user.id);
    res.json({
      access_token: user.id,
      refresh_token: `${user.id}-refresh`,
    });
  });

  router.post("/auth/refresh", (req, res) => {
    const refreshToken = req.body.refresh_token as string;
    if (!refreshToken || !refreshToken.endsWith("-refresh")) {
      res.status(401).json({ error: "Refresh token noto'g'ri" });
      return;
    }
    const userId = refreshToken.replace("-refresh", "");
    const db = readDB();
    const user = db.users.find((u) => u.id === userId && u.isActive);
    if (!user) {
      res.status(401).json({ error: "Foydalanuvchi topilmadi" });
      return;
    }
    res.json({ access_token: user.id, refresh_token: `${user.id}-refresh` });
  });

  router.get("/auth/me", (req, res) => {
    const user = requireAuth(req, res);
    if (!user) return;
    res.json(serializeUser(user));
  });

  router.post("/auth/logout", (req, res) => {
    const user = getAuthUser(req);
    if (user) {
      logAudit(user.id, user.fullName, "Tizimdan chiqdi (Logout)", "Auth", user.id);
    }
    res.json({ success: true });
  });

  // --- Dashboard ---
  router.get("/dashboard/counters", (req, res) => {
    const user = requireAuth(req, res);
    if (!user) return;
    const db = readDB();
    const activeDocs = db.documents.filter((d) => !d.deletedAt);
    const todayStr = new Date().toISOString().split("T")[0];
    const linkedStudentIds = new Set(activeDocs.map((d) => d.studentId).filter(Boolean));
    const linkedStudents = db.students.filter((s) => linkedStudentIds.has(s.id)).length;
    const unlinkedStudentDocs = activeDocs.filter(
      (d) => !d.studentId && getCategoryFlowType(d.categoryId, db.categories) === "student"
    ).length;
    res.json({
      total_documents: activeDocs.length,
      total_unique_students: linkedStudents + unlinkedStudentDocs,
      total_categories: db.categories.filter((c) => c.isActive).length,
      total_cabinets: db.cabinets.filter((c) => c.isActive).length,
      today_added: activeDocs.filter((d) => d.receivedAt.startsWith(todayStr)).length,
      today_searches: db.auditLogs.filter((l) => l.createdAt.startsWith(todayStr) && l.action.includes("Qidiruv")).length,
    });
  });

  router.get("/dashboard/activities", (req, res) => {
    const user = requireAuth(req, res);
    if (!user) return;
    const db = readDB();
    const activeDocs = db.documents.filter((d) => !d.deletedAt);
    const activities = activeDocs
      .map((doc) => {
        const student = doc.studentId ? db.students.find((s) => s.id === doc.studentId) : undefined;
        const employee = doc.employeeId ? db.employees?.find((e) => e.id === doc.employeeId) : undefined;
        const category = db.categories.find((c) => c.id === doc.categoryId);
        const cabinet = db.cabinets.find((c) => c.id === doc.cabinetId);

        let person_name = "";
        let person_subtitle = "";
        if (student) {
          person_name = `${student.lastName} ${student.firstName} ${student.middleName || ""}`.trim();
          person_subtitle = student.studentId ? `ID: ${student.studentId}` : "Talaba";
        } else if (employee) {
          person_name = `${employee.lastName} ${employee.firstName} ${employee.middleName || ""}`.trim();
          person_subtitle = employee.employeeId ? `ID: ${employee.employeeId}` : "Xodim";
        } else {
          person_name = doc.docName || "Institut hujjati";
          person_subtitle = "Umumiy hujjat";
        }

        return {
          id: doc.id,
          created_at: doc.receivedAt,
          person_name,
          person_subtitle,
          category_name: category?.name || null,
          cabinet_name: cabinet?.name || null,
          floor: doc.floor,
          status: doc.status,
        };
      })
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 15);
    res.json(activities);
  });

  router.get("/dashboard/categories-chart", (req, res) => {
    const user = requireAuth(req, res);
    if (!user) return;
    const db = readDB();
    const activeDocs = db.documents.filter((d) => !d.deletedAt);
    res.json(
      db.categories
        .filter((c) => c.isActive)
        .map((c) => ({
          id: c.id,
          name: c.name,
          count: activeDocs.filter((d) => d.categoryId === c.id).length,
        }))
    );
  });

  router.get("/dashboard/weekly-stats", (req, res) => {
    const user = requireAuth(req, res);
    if (!user) return;
    const db = readDB();
    const activeDocs = db.documents.filter((d) => !d.deletedAt);
    const weeklyData = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayStr = d.toISOString().split("T")[0];
      weeklyData.push({
        date: dayStr,
        count: activeDocs.filter((doc) => doc.receivedAt.startsWith(dayStr)).length,
      });
    }
    res.json(weeklyData);
  });

  // --- Documents ---
  router.get("/documents", (req, res) => {
    const user = requireAuth(req, res);
    if (!user) return;
    const db = readDB();
    const filtered = filterDocuments(db, req.query);

    if (req.query.query || req.query.q) {
      logAudit(user.id, user.fullName, `Qidiruv qilindi: "${req.query.query || req.query.q}"`, "Search", undefined, {
        query: req.query.query || req.query.q,
      });
    }

    const page = parseInt(String(req.query.page)) || 1;
    const size = parseInt(String(req.query.size || req.query.limit)) || 50;
    const total = filtered.length;
    const pages = Math.max(1, Math.ceil(total / size));
    const startIndex = (page - 1) * size;
    const items = filtered.slice(startIndex, startIndex + size).map((doc) => serializeDocument(doc, db));

    res.json({ items, total, page, size, pages });
  });

  router.get("/documents/:id/download", (req, res) => {
    const user = requireAuth(req, res);
    if (!user) return;
    const db = readDB();
    const doc = db.documents.find((d) => d.id === req.params.id && !d.deletedAt);
    if (!doc) {
      res.status(404).send("Hujjat topilmadi");
      return;
    }
    const pdfPath = path.join(UPLOADS_DIR, doc.filePath);
    if (!fs.existsSync(pdfPath)) {
      createDummyPDF(pdfPath, `Hujjat ID: ${doc.id}\nAsl nomi: ${doc.originalFilename}`);
    }
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="${encodeURIComponent(doc.originalFilename)}"`);
    res.sendFile(pdfPath);
  });

  router.get("/documents/:id", (req, res) => {
    const user = requireAuth(req, res);
    if (!user) return;
    const db = readDB();
    const doc = db.documents.find((d) => d.id === req.params.id && !d.deletedAt);
    if (!doc) {
      res.status(404).json({ error: "Hujjat topilmadi" });
      return;
    }
    res.json(serializeDocument(doc, db));
  });

  const createDocumentHandler = (req: Request, res: Response) => {
    const user = requireAuth(req, res);
    if (!user) return;
    if (user.role === UserRole.VIEWER) {
      res.status(403).json({ error: "Hujjat qabul qilish huquqingiz yo'q" });
      return;
    }

    const body = req.body;
    const categoryId = body.category_id;
    const cabinetId = body.cabinet_id;
    const floor = body.floor;
    const docName = body.doc_name;
    const docDate = body.doc_date;
    const expiryYearRaw = body.expiry_year;
    const personType = body.person_type;
    const employeeId = body.employee_id;
    const studentId = body.student_id;
    const studentName = body.student_name;
    const groupName = body.group_name;
    const notes = body.notes;
    const pdfBase64 = body.pdf_base64;
    const pdfFilename = body.pdf_filename;
    const uploadedFile = (req as Request & { file?: Express.Multer.File }).file;

    if (!categoryId || !cabinetId || !floor || !docName?.trim()) {
      res.status(400).json({ error: "Kategoriya, shkaf, qavat va hujjat nomi majburiy" });
      return;
    }

    const db = readDB();
    const category = db.categories.find((c) => c.id === categoryId);
    if (!category) {
      res.status(400).json({ error: "Tanlangan kategoriya topilmadi" });
      return;
    }

    const cabinet = db.cabinets.find((c) => c.id === cabinetId);
    if (!cabinet) {
      res.status(400).json({ error: "Tanlangan shkaf topilmadi" });
      return;
    }

    const floorNum = parseInt(String(floor));
    if (isNaN(floorNum) || floorNum < 1 || floorNum > cabinet.maxFloor) {
      res.status(400).json({ error: `Haqiqiy qavat ko'rsatilishi shart (Ushbu shkaf uchun: 1-${cabinet.maxFloor})` });
      return;
    }

    let resolvedStudentId = studentId || undefined;
    let resolvedEmployeeId = employeeId || undefined;

    if (!resolvedStudentId && studentName && categoryId === "cat-talaba") {
      const parts = String(studentName).trim().split(/\s+/);
      const lastName = parts[0] || "";
      const firstName = parts[1] || "";
      const middleName = parts.slice(2).join(" ");
      if (lastName && firstName) {
        const dup = groupName
          ? db.students.find(
              (s) =>
                s.lastName.toLowerCase() === lastName.toLowerCase() &&
                s.firstName.toLowerCase() === firstName.toLowerCase()
            )
          : undefined;
        if (dup) {
          resolvedStudentId = dup.id;
        } else {
          const newStudentId = "std-" + Date.now();
          db.students.push({
            id: newStudentId,
            lastName,
            firstName,
            middleName,
            groupName: groupName || "",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
          resolvedStudentId = newStudentId;
          logAudit(user.id, user.fullName, `Yangi talaba qo'shildi: ${lastName} ${firstName}`, "Student", newStudentId);
        }
      }
    }

    if (!resolvedEmployeeId && categoryId === "cat-xodim" && !employeeId) {
      res.status(400).json({ error: "Xodim tanlanishi shart" });
      return;
    }

    const docId = "doc-" + Date.now();
    let filePath = `${docId}.pdf`;
    let fileSize = 10240;
    let originalFilename = pdfFilename || "hujjat.pdf";

    if (uploadedFile?.buffer) {
      const saved = savePdfBuffer(docId, uploadedFile.buffer, uploadedFile.originalname || pdfFilename || "hujjat.pdf");
      filePath = saved.secureFilename;
      fileSize = saved.fileSize;
      originalFilename = saved.originalFilename;
    } else if (pdfBase64) {
      const base64Data = String(pdfBase64).replace(/^data:application\/pdf;base64,/, "");
      const buffer = Buffer.from(base64Data, "base64");
      const saved = savePdfBuffer(docId, buffer, pdfFilename || "hujjat.pdf");
      filePath = saved.secureFilename;
      fileSize = saved.fileSize;
      originalFilename = saved.originalFilename;
    } else {
      res.status(400).json({ error: "Hujjat PDF fayli yuklanishi lozim" });
      return;
    }

    const newDoc = {
      id: docId,
      studentId: resolvedStudentId,
      employeeId: resolvedEmployeeId,
      categoryId,
      docName: docName || "",
      docDate: docDate || "",
      expiryYear: expiryYearRaw != null && expiryYearRaw !== "" ? parseInt(String(expiryYearRaw), 10) : undefined,
      personType: personType || (categoryId === "cat-talaba" ? "student" : categoryId === "cat-xodim" ? "employee" : "none"),
      cabinetId,
      floor: floorNum,
      filePath,
      fileSize,
      originalFilename,
      status: DocumentStatus.JOYIDA,
      notes: notes || "",
      receivedAt: new Date().toISOString(),
      receivedByUserId: user.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    db.documents.push(newDoc);
    writeDB(db);
    logAudit(user.id, user.fullName, `Yangi arxiv hujjat qabul qilindi: "${docName || originalFilename}"`, "Document", docId);
    res.status(201).json(serializeDocument(newDoc, db));
  };

  router.post("/documents", (req, res, next) => {
    const contentType = req.get("content-type") || "";
    if (contentType.includes("multipart/form-data")) {
      upload.single("file")(req, res, (err) => {
        if (err) {
          res.status(400).json({ error: err.message || "Fayl yuklashda xatolik" });
          return;
        }
        createDocumentHandler(req, res);
      });
      return;
    }
    createDocumentHandler(req, res);
  });

  const updateDocumentHandler = (req: Request, res: Response) => {
    const user = requireAuth(req, res);
    if (!user) return;
    if (user.role === UserRole.VIEWER) {
      res.status(403).json({ error: "Tahrirlash huquqingiz yo'q" });
      return;
    }

    const db = readDB();
    const docIndex = db.documents.findIndex((d) => d.id === req.params.id && !d.deletedAt);
    if (docIndex === -1) {
      res.status(404).json({ error: "Hujjat topilmadi" });
      return;
    }

    const doc = db.documents[docIndex];
    const body = req.body;
    const status = body.status;
    const cabinetId = body.cabinet_id;
    const floor = body.floor;
    const notes = body.notes;
    const categoryId = body.category_id;
    const docName = body.doc_name;
    const docDate = body.doc_date;
    const expiryYearRaw = body.expiry_year;
    const personType = body.person_type;
    const employeeId = body.employee_id;
    const studentId = body.student_id;
    const pdfBase64 = body.pdf_base64;
    const pdfFilename = body.pdf_filename;
    const uploadedFile = (req as Request & { file?: Express.Multer.File }).file;

    if (cabinetId || floor) {
      const activeCabId = cabinetId || doc.cabinetId;
      const cab = db.cabinets.find((c) => c.id === activeCabId);
      if (!cab) {
        res.status(400).json({ error: "Tanlangan shkaf mavjud emas" });
        return;
      }
      const activeFloor = floor !== undefined ? parseInt(String(floor)) : doc.floor;
      if (isNaN(activeFloor) || activeFloor < 1 || activeFloor > cab.maxFloor) {
        res.status(400).json({ error: `Ushbu shkaf uchun qavat diapazoni: 1-${cab.maxFloor}` });
        return;
      }
      doc.cabinetId = activeCabId;
      doc.floor = activeFloor;
    }

    if (categoryId) {
      const cat = db.categories.find((c) => c.id === categoryId);
      if (!cat) {
        res.status(400).json({ error: "Tanlangan kategoriya topilmadi" });
        return;
      }
      doc.categoryId = categoryId;
    }

    if (notes !== undefined) doc.notes = notes;
    if (docName !== undefined && String(docName).trim()) doc.docName = String(docName).trim();
    if (docDate !== undefined) doc.docDate = docDate;

    if (expiryYearRaw !== undefined) {
      doc.expiryYear =
        expiryYearRaw === null || expiryYearRaw === ""
          ? undefined
          : parseInt(String(expiryYearRaw), 10) || undefined;
    }

    if (personType !== undefined) doc.personType = personType;

    if (employeeId !== undefined) {
      if (employeeId === null || employeeId === "") {
        doc.employeeId = undefined;
      } else {
        const emp = db.employees.find((e) => e.id === employeeId);
        if (!emp) {
          res.status(400).json({ error: "Tanlangan xodim topilmadi" });
          return;
        }
        doc.employeeId = employeeId;
      }
    }

    if (studentId !== undefined) {
      if (studentId === null || studentId === "") {
        doc.studentId = undefined;
      } else {
        const std = db.students.find((s) => s.id === studentId);
        if (!std) {
          res.status(400).json({ error: "Tanlangan talaba topilmadi" });
          return;
        }
        doc.studentId = studentId;
      }
    }

    if (status && status !== doc.status) {
      doc.status = status;
      if (status === DocumentStatus.BERILGAN) {
        doc.issuedAt = new Date().toISOString();
        doc.issuedByUserId = user.id;
      } else if (status === DocumentStatus.JOYIDA) {
        doc.issuedAt = undefined;
        doc.issuedByUserId = undefined;
      }
    }

    if (uploadedFile?.buffer) {
      const fullPdfPath = path.join(UPLOADS_DIR, doc.filePath);
      fs.writeFileSync(fullPdfPath, uploadedFile.buffer);
      doc.originalFilename = uploadedFile.originalname || pdfFilename || doc.originalFilename;
      doc.fileSize = uploadedFile.buffer.length;
    } else if (pdfBase64) {
      const base64Data = String(pdfBase64).replace(/^data:application\/pdf;base64,/, "");
      const buffer = Buffer.from(base64Data, "base64");
      const fullPdfPath = path.join(UPLOADS_DIR, doc.filePath);
      fs.writeFileSync(fullPdfPath, buffer);
      doc.originalFilename = pdfFilename || doc.originalFilename;
      doc.fileSize = buffer.length;
    }

    doc.updatedAt = new Date().toISOString();
    writeDB(db);
    logAudit(user.id, user.fullName, `Hujjat tahrirlandi`, "Document", doc.id, { changes: body });
    res.json(serializeDocument(doc, db));
  };

  router.put("/documents/:id", (req, res) => {
    const contentType = req.get("content-type") || "";
    if (contentType.includes("multipart/form-data")) {
      upload.single("file")(req, res, (err) => {
        if (err) {
          res.status(400).json({ error: err.message || "Fayl yuklashda xatolik" });
          return;
        }
        updateDocumentHandler(req, res);
      });
      return;
    }
    updateDocumentHandler(req, res);
  });

  router.delete("/documents/:id", (req, res) => {
    const user = requireAuth(req, res);
    if (!user) return;
    if (user.role !== UserRole.ADMIN) {
      res.status(403).json({ error: "Hujjatni faqat administrator o'chirishi mumkin" });
      return;
    }
    const db = readDB();
    const docIndex = db.documents.findIndex((d) => d.id === req.params.id && !d.deletedAt);
    if (docIndex === -1) {
      res.status(404).json({ error: "Hujjat topilmadi" });
      return;
    }
    db.documents[docIndex].deletedAt = new Date().toISOString();
    db.documents[docIndex].updatedAt = new Date().toISOString();
    writeDB(db);
    logAudit(user.id, user.fullName, `Hujjat o'chirildi: ID ${req.params.id}`, "Document", req.params.id);
    res.status(204).send();
  });

  // --- Categories ---
  router.get("/categories", (req, res) => {
    const user = requireAuth(req, res);
    if (!user) return;
    const db = readDB();
    const activeDocs = db.documents.filter((d) => !d.deletedAt);
    res.json(
      db.categories.map((c) => ({
        ...serializeCategory(c),
        doc_count: activeDocs.filter((d) => d.categoryId === c.id).length,
      }))
    );
  });

  router.post("/categories", (req, res) => {
    const user = requireAuth(req, res);
    if (!user) return;
    if (user.role === UserRole.VIEWER) {
      res.status(403).json({ error: "Kategoriya kiritish ruxsati yo'q" });
      return;
    }
    const { name, description } = req.body;
    if (!name?.trim()) {
      res.status(400).json({ error: "Kategoriya nomi kiritilishi shart" });
      return;
    }
    const db = readDB();
    const duplicate = db.categories.find((c) => c.name.trim().toLowerCase() === name.trim().toLowerCase());
    if (duplicate) {
      res.status(400).json({ error: "Ushbu nomdagi kategoriya allaqachon mavjud" });
      return;
    }
    const newCat = {
      id: "cat-" + Date.now(),
      name: name.trim(),
      description: description || "",
      isActive: true,
      createdAt: new Date().toISOString(),
    };
    db.categories.push(newCat);
    writeDB(db);
    logAudit(user.id, user.fullName, `Yangi kategoriya yaratildi: "${newCat.name}"`, "Category", newCat.id);
    res.status(201).json(serializeCategory(newCat));
  });

  router.put("/categories/:id", (req, res) => {
    const user = requireAuth(req, res);
    if (!user) return;
    if (user.role === UserRole.VIEWER) {
      res.status(403).json({ error: "Kategoriyani o'zgartirish ruxsati yo'q" });
      return;
    }
    const { name, description, is_active: isActive } = req.body;
    const db = readDB();
    const index = db.categories.findIndex((c) => c.id === req.params.id);
    if (index === -1) {
      res.status(404).json({ error: "Kategoriya topilmadi" });
      return;
    }
    const cat = db.categories[index];
    if (name && name.trim().toLowerCase() !== cat.name.toLowerCase()) {
      const duplicate = db.categories.find((c) => c.id !== cat.id && c.name.trim().toLowerCase() === name.trim().toLowerCase());
      if (duplicate) {
        res.status(400).json({ error: "Ushbu nomdagi kategoriya allaqachon mavjud" });
        return;
      }
      cat.name = name.trim();
    }
    if (description !== undefined) cat.description = description;
    if (isActive !== undefined) cat.isActive = !!isActive;
    writeDB(db);
    logAudit(user.id, user.fullName, `Kategoriya yangilandi: "${cat.name}"`, "Category", cat.id);
    res.json(serializeCategory(cat));
  });

  router.delete("/categories/:id", (req, res) => {
    const user = requireAuth(req, res);
    if (!user) return;
    if (user.role === UserRole.VIEWER) {
      res.status(403).json({ error: "Kategoriyani o'chirish ruxsati yo'q" });
      return;
    }
    const db = readDB();
    const usageCount = db.documents.filter((d) => !d.deletedAt && d.categoryId === req.params.id).length;
    if (usageCount > 0) {
      res.status(400).json({ error: `Kategoriyadan foydalanilmoqda (${usageCount} ta hujjat)` });
      return;
    }
    const catIndex = db.categories.findIndex((c) => c.id === req.params.id);
    if (catIndex === -1) {
      res.status(404).json({ error: "Kategoriya topilmadi" });
      return;
    }
    db.documents = db.documents.filter(
      (d) => !(d.deletedAt && d.categoryId === req.params.id)
    );
    db.categories.splice(catIndex, 1);
    writeDB(db);
    res.status(204).send();
  });

  // --- Cabinets ---
  router.get("/cabinets", (req, res) => {
    const user = requireAuth(req, res);
    if (!user) return;
    const db = readDB();
    const activeDocs = db.documents.filter((d) => !d.deletedAt);
    res.json(
      db.cabinets.map((c) => ({
        ...serializeCabinet(c),
        doc_count: activeDocs.filter((d) => d.cabinetId === c.id).length,
      }))
    );
  });

  router.post("/cabinets", (req, res) => {
    const user = requireAuth(req, res);
    if (!user) return;
    if (user.role === UserRole.VIEWER) {
      res.status(403).json({ error: "Shkaf qo'shish huquqi yo'q" });
      return;
    }
    const { name, description, max_floor: maxFloor = 9 } = req.body;
    if (!name?.trim()) {
      res.status(400).json({ error: "Shkaf nomi/raqami kiritilishi shart" });
      return;
    }
    const maxFloorNum = parseInt(String(maxFloor));
    if (isNaN(maxFloorNum) || maxFloorNum < 1 || maxFloorNum > 99) {
      res.status(400).json({ error: "Shkaf qavati 1 va 99 oralig'ida bo'lishi lozim" });
      return;
    }
    const db = readDB();
    const duplicate = db.cabinets.find((c) => c.name.trim().toLowerCase() === name.trim().toLowerCase());
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
      createdAt: new Date().toISOString(),
    };
    db.cabinets.push(newCab);
    writeDB(db);
    logAudit(user.id, user.fullName, `Yangi shkaf yaratildi: "${newCab.name}"`, "Cabinet", newCab.id);
    res.status(201).json(serializeCabinet(newCab));
  });

  router.put("/cabinets/:id", (req, res) => {
    const user = requireAuth(req, res);
    if (!user) return;
    if (user.role === UserRole.VIEWER) {
      res.status(403).json({ error: "Shkafni tahrirlash huquqi yo'q" });
      return;
    }
    const { name, description, max_floor: maxFloor, is_active: isActive } = req.body;
    const db = readDB();
    const index = db.cabinets.findIndex((c) => c.id === req.params.id);
    if (index === -1) {
      res.status(404).json({ error: "Shkaf topilmadi" });
      return;
    }
    const cab = db.cabinets[index];
    if (name && name.trim().toLowerCase() !== cab.name.toLowerCase()) {
      const duplicate = db.cabinets.find((c) => c.id !== cab.id && c.name.trim().toLowerCase() === name.trim().toLowerCase());
      if (duplicate) {
        res.status(400).json({ error: "Ushbu nomdagi shkaf allaqachon mavjud" });
        return;
      }
      cab.name = name.trim();
    }
    if (maxFloor !== undefined) {
      const maxFloorNum = parseInt(String(maxFloor));
      if (!isNaN(maxFloorNum) && maxFloorNum >= 1 && maxFloorNum <= 99) cab.maxFloor = maxFloorNum;
    }
    if (description !== undefined) cab.description = description;
    if (isActive !== undefined) cab.isActive = !!isActive;
    writeDB(db);
    res.json(serializeCabinet(cab));
  });

  router.delete("/cabinets/:id", (req, res) => {
    const user = requireAuth(req, res);
    if (!user) return;
    if (user.role === UserRole.VIEWER) {
      res.status(403).json({ error: "Shkafni o'chirish huquqi yo'q" });
      return;
    }
    const db = readDB();
    const usageCount = db.documents.filter((d) => !d.deletedAt && d.cabinetId === req.params.id).length;
    if (usageCount > 0) {
      res.status(400).json({ error: `Shkafdan foydalanilmoqda (${usageCount} ta hujjat)` });
      return;
    }
    const cabIndex = db.cabinets.findIndex((c) => c.id === req.params.id);
    if (cabIndex === -1) {
      res.status(404).json({ error: "Shkaf topilmadi" });
      return;
    }
    db.documents = db.documents.filter(
      (d) => !(d.deletedAt && d.cabinetId === req.params.id)
    );
    db.cabinets.splice(cabIndex, 1);
    writeDB(db);
    res.status(204).send();
  });

  // --- Students ---
  router.get("/students", (req, res) => {
    const user = requireAuth(req, res);
    if (!user) return;
    const db = readDB();
    let list = db.students || [];
    const query = req.query.query as string;
    if (query) {
      const q = query.toLowerCase();
      list = list.filter((s) => {
        const name = `${s.lastName} ${s.firstName} ${s.middleName || ""}`.toLowerCase();
        return name.includes(q) || (s.studentId || "").toLowerCase().includes(q);
      });
    }
    res.json(list.map(serializeStudent));
  });

  router.post("/students", (req, res) => {
    const user = requireAuth(req, res);
    if (!user) return;
    if (user.role === UserRole.VIEWER) {
      res.status(403).json({ error: "Ruxsat yo'q" });
      return;
    }
    const { last_name, first_name, middle_name, student_id, group_name } = req.body;
    if (!last_name?.trim() || !first_name?.trim()) {
      res.status(400).json({ error: "Familia va ism kiritilishi shart" });
      return;
    }
    const db = readDB();
    if (student_id) {
      const dup = db.students.find((s) => s.studentId?.toLowerCase() === student_id.trim().toLowerCase());
      if (dup) {
        res.status(201).json(serializeStudent(dup));
        return;
      }
    }
    const newStudent = {
      id: "std-" + Date.now(),
      lastName: last_name.trim(),
      firstName: first_name.trim(),
      middleName: middle_name?.trim() || "",
      studentId: student_id?.trim(),
      groupName: group_name?.trim() || "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    db.students.push(newStudent);
    writeDB(db);
    logAudit(user.id, user.fullName, `Yangi talaba: ${newStudent.lastName} ${newStudent.firstName}`, "Student", newStudent.id);
    res.status(201).json(serializeStudent(newStudent));
  });

  router.put("/students/:id", (req, res) => {
    const user = requireAuth(req, res);
    if (!user) return;
    const db = readDB();
    const index = db.students.findIndex((s) => s.id === req.params.id);
    if (index === -1) {
      res.status(404).json({ error: "Talaba topilmadi" });
      return;
    }
    const s = db.students[index];
    const body = req.body;
    if (body.last_name) s.lastName = body.last_name;
    if (body.first_name) s.firstName = body.first_name;
    if (body.middle_name !== undefined) s.middleName = body.middle_name;
    if (body.student_id !== undefined) s.studentId = body.student_id;
    if (body.group_name !== undefined) s.groupName = body.group_name;
    s.updatedAt = new Date().toISOString();
    writeDB(db);
    res.json(serializeStudent(s));
  });

  // --- Employees ---
  router.get("/employees", (req, res) => {
    const user = requireAuth(req, res);
    if (!user) return;
    const db = readDB();
    let list = db.employees || [];
    const query = req.query.query as string;
    if (query) {
      const q = query.toLowerCase();
      list = list.filter((e) => {
        const name = `${e.lastName} ${e.firstName} ${e.middleName || ""}`.toLowerCase();
        return name.includes(q) || (e.employeeId || "").toLowerCase().includes(q);
      });
    }
    res.json(list.map(serializeEmployee));
  });

  router.post("/employees", (req, res) => {
    const user = requireAuth(req, res);
    if (!user) return;
    if (user.role === UserRole.VIEWER) {
      res.status(403).json({ error: "Ruxsat yo'q" });
      return;
    }
    const { last_name, first_name, middle_name, employee_id, department, position, phone } = req.body;
    if (!last_name?.trim() || !first_name?.trim() || !employee_id?.trim()) {
      res.status(400).json({ error: "Familia, ism va xodim ID kiritilishi shart" });
      return;
    }
    const db = readDB();
    const dup = db.employees.find((e) => e.employeeId?.toLowerCase() === employee_id.trim().toLowerCase());
    if (dup) {
      res.status(201).json(serializeEmployee(dup));
      return;
    }
    const newEmp = {
      id: "emp-" + Date.now(),
      lastName: last_name.trim(),
      firstName: first_name.trim(),
      middleName: middle_name?.trim() || "",
      employeeId: employee_id.trim(),
      department: department?.trim() || "",
      position: position?.trim() || "",
      phone: phone || undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    if (!db.employees) db.employees = [];
    db.employees.push(newEmp);
    writeDB(db);
    logAudit(user.id, user.fullName, `Yangi xodim: ${newEmp.lastName} ${newEmp.firstName}`, "Employee", newEmp.id);
    res.status(201).json(serializeEmployee(newEmp));
  });

  router.put("/employees/:id", (req, res) => {
    const user = requireAuth(req, res);
    if (!user) return;
    const db = readDB();
    const index = db.employees.findIndex((e) => e.id === req.params.id);
    if (index === -1) {
      res.status(404).json({ error: "Xodim topilmadi" });
      return;
    }
    const e = db.employees[index];
    const body = req.body;
    if (body.last_name) e.lastName = body.last_name;
    if (body.first_name) e.firstName = body.first_name;
    if (body.middle_name !== undefined) e.middleName = body.middle_name;
    if (body.employee_id !== undefined) e.employeeId = body.employee_id;
    if (body.department !== undefined) e.department = body.department;
    if (body.position !== undefined) e.position = body.position;
    if (body.phone !== undefined) e.phone = body.phone;
    e.updatedAt = new Date().toISOString();
    writeDB(db);
    res.json(serializeEmployee(e));
  });

  // --- Users ---
  router.get("/users", (req, res) => {
    const user = requireAuth(req, res);
    if (!user) return;
    if (user.role !== UserRole.ADMIN) {
      res.status(403).json({ error: "Ushbu sahifa faqat administrator uchun ochiq" });
      return;
    }
    const db = readDB();
    res.json(db.users.map(serializeUser));
  });

  router.post("/users", (req, res) => {
    const user = requireAuth(req, res);
    if (!user) return;
    if (user.role !== UserRole.ADMIN) {
      res.status(403).json({ error: "Ruxsat etilmagan harakat" });
      return;
    }
    const { username, password, full_name: fullName, role } = req.body;
    if (!username || !fullName || !role || !password) {
      res.status(400).json({ error: "Majburiy maydonlar to'liq kiritilmadi" });
      return;
    }
    if (password.length < 8) {
      res.status(400).json({ error: "Parol uzunligi kamida 8 ta belgidan iborat bo'lishi lozim" });
      return;
    }
    const db = readDB();
    const duplicate = db.users.find((u) => u.username.toLowerCase() === username.toLowerCase());
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
      isActive: true,
      createdAt: new Date().toISOString(),
    };
    db.users.push(newUser);
    writeDB(db);
    logAudit(user.id, user.fullName, `Yangi foydalanuvchi: "${newUser.username}"`, "User", newUser.id);
    res.status(201).json(serializeUser(newUser));
  });

  router.put("/users/:id", (req, res) => {
    const user = requireAuth(req, res);
    if (!user) return;
    if (user.role !== UserRole.ADMIN) {
      res.status(403).json({ error: "Ruxsat etilmagan harakat" });
      return;
    }
    const { full_name: fullName, role, password, is_active: isActive } = req.body;
    const db = readDB();
    const index = db.users.findIndex((u) => u.id === req.params.id);
    if (index === -1) {
      res.status(404).json({ error: "Foydalanuvchi topilmadi" });
      return;
    }
    const target = db.users[index];
    if (fullName) target.fullName = fullName;
    if (role) target.role = role;
    if (isActive !== undefined) target.isActive = !!isActive;
    if (password) {
      if (password.length < 8) {
        res.status(400).json({ error: "Parol uzunligi kamida 8 ta belgidan iborat bo'lishi lozim" });
        return;
      }
      target.passwordHash = password;
    }
    writeDB(db);
    res.json(serializeUser(target));
  });

  // --- Audit logs ---
  router.get("/audit-logs", (req, res) => {
    const user = requireAuth(req, res);
    if (!user) return;
    if (user.role !== UserRole.ADMIN) {
      res.status(403).json({ error: "Audit jurnali faqat administratorlarga ko'rinadi" });
      return;
    }
    const db = readDB();
    const page = parseInt(String(req.query.page)) || 1;
    const size = parseInt(String(req.query.size)) || 50;
    const start = (page - 1) * size;
    const items = db.auditLogs.slice(start, start + size).map((log) => ({
      id: log.id,
      user_id: log.userId,
      user_full_name: log.userFullName,
      action: log.action,
      entity_name: log.entityType,
      entity_id: log.entityId,
      timestamp: log.createdAt,
      ip: log.ip,
    }));
    res.json({ items });
  });

  return router;
}
