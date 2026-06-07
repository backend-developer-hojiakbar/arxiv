/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export function mapUser(raw: Record<string, unknown>) {
  return {
    id: raw.id as string,
    username: raw.username as string,
    fullName: (raw.full_name ?? raw.fullName) as string,
    role: raw.role as string,
    isActive: (raw.is_active ?? raw.isActive ?? true) as boolean,
    createdAt: (raw.created_at ?? raw.createdAt ?? "") as string,
    lastLoginAt: (raw.last_login_at ?? raw.lastLoginAt) as string | undefined,
  };
}

export function mapCategory(raw: Record<string, unknown>) {
  return {
    id: raw.id as string,
    name: raw.name as string,
    description: raw.description as string | undefined,
    isActive: (raw.is_active ?? raw.isActive ?? true) as boolean,
    createdAt: (raw.created_at ?? raw.createdAt ?? "") as string,
    docCount: (raw.doc_count ?? raw.docCount ?? 0) as number,
  };
}

export function mapCabinet(raw: Record<string, unknown>) {
  return {
    id: raw.id as string,
    name: raw.name as string,
    description: raw.description as string | undefined,
    maxFloor: (raw.max_floor ?? raw.maxFloor ?? 9) as number,
    isActive: (raw.is_active ?? raw.isActive ?? true) as boolean,
    createdAt: (raw.created_at ?? raw.createdAt ?? "") as string,
    docCount: (raw.doc_count ?? raw.docCount ?? 0) as number,
  };
}

export function mapEmployee(raw: Record<string, unknown>) {
  return {
    id: raw.id as string,
    lastName: (raw.last_name ?? raw.lastName) as string,
    firstName: (raw.first_name ?? raw.firstName) as string,
    middleName: (raw.middle_name ?? raw.middleName) as string | undefined,
    employeeId: (raw.employee_id ?? raw.employeeId) as string | undefined,
    department: raw.department as string | undefined,
    position: raw.position as string | undefined,
    phone: raw.phone as string | undefined,
    isActive: (raw.is_active ?? raw.isActive ?? true) as boolean,
    createdAt: (raw.created_at ?? raw.createdAt ?? "") as string,
    updatedAt: (raw.updated_at ?? raw.updatedAt ?? "") as string,
  };
}

export function mapStudent(raw: Record<string, unknown>) {
  return {
    id: raw.id as string,
    lastName: (raw.last_name ?? raw.lastName) as string,
    firstName: (raw.first_name ?? raw.firstName) as string,
    middleName: (raw.middle_name ?? raw.middleName) as string | undefined,
    studentId: (raw.student_id ?? raw.studentId) as string | undefined,
    groupName: (raw.group_name ?? raw.groupName) as string | undefined,
    isActive: (raw.is_active ?? raw.isActive ?? true) as boolean,
    createdAt: (raw.created_at ?? raw.createdAt ?? "") as string,
    updatedAt: (raw.updated_at ?? raw.updatedAt ?? "") as string,
  };
}

export function mapDocument(raw: Record<string, unknown>) {
  const student = raw.student as Record<string, unknown> | null | undefined;
  const employee = raw.employee as Record<string, unknown> | null | undefined;
  const category = raw.category as Record<string, unknown> | null | undefined;
  const cabinet = raw.cabinet as Record<string, unknown> | null | undefined;

  let studentName = (raw.student_name ?? raw.studentName) as string | null;
  if (!studentName && student) {
    const st = mapStudent(student);
    studentName = [st.lastName, st.firstName, st.middleName].filter(Boolean).join(" ").trim() || null;
  }

  let employeeName: string | null = null;
  if (employee) {
    const emp = mapEmployee(employee);
    employeeName = [emp.lastName, emp.firstName, emp.middleName].filter(Boolean).join(" ").trim() || null;
  }

  return {
    id: raw.id as string,
    categoryId: (raw.category_id ?? raw.categoryId) as string,
    cabinetId: (raw.cabinet_id ?? raw.cabinetId) as string,
    floor: raw.floor as number,
    docName: (raw.doc_name ?? raw.docName) as string | undefined,
    docDate: (raw.doc_date ?? raw.docDate) as string | undefined,
    personType: (raw.person_type ?? raw.personType ?? "none") as string,
    employeeId: (raw.employee_id ?? raw.employeeId) as string | undefined,
    studentId: (raw.student_id ?? raw.studentId) as string | undefined,
    studentName,
    employeeName,
    groupName: (raw.group_name ?? raw.groupName ?? student?.group_name) as string | undefined,
    status: raw.status as string,
    filePath: (raw.pdf_path ?? raw.filePath) as string,
    originalFilename: (raw.original_filename ?? raw.originalFilename ?? "hujjat.pdf") as string,
    fileSize: (raw.file_size ?? raw.fileSize ?? 0) as number,
    notes: raw.notes as string | undefined,
    description: raw.description as string | undefined,
    receivedAt: (raw.received_at ?? raw.created_at ?? raw.receivedAt ?? raw.createdAt) as string,
    createdAt: (raw.created_at ?? raw.createdAt) as string,
    updatedAt: (raw.updated_at ?? raw.updatedAt) as string,
    createdBy: (raw.created_by ?? raw.createdBy) as string | undefined,
    category: category ? mapCategory(category) : undefined,
    cabinet: cabinet ? mapCabinet(cabinet) : undefined,
    employee: employee ? mapEmployee(employee) : undefined,
    student: student ? mapStudent(student) : undefined,
  };
}

export function mapAuditLog(raw: Record<string, unknown>) {
  return {
    id: raw.id as string,
    userId: (raw.user_id ?? raw.userId) as string,
    userFullName: (raw.user_full_name ?? raw.userFullName) as string,
    action: raw.action as string,
    entityType: (raw.entity_name ?? raw.entityType) as string,
    entityId: (raw.entity_id ?? raw.entityId) as string | undefined,
    createdAt: (raw.timestamp ?? raw.createdAt) as string,
    ip: (raw.ip as string) || "",
  };
}

export function getCategoryFlowType(
  catId: string,
  categories: Array<{ id: string; name: string }>
): "institut" | "employee" | "student" {
  const cat = categories.find((c) => c.id === catId);
  if (!cat) return "institut";
  const name = cat.name.toLowerCase();
  if (name.includes("talaba") || name.includes("o'quvchi") || name.includes("student")) {
    return "student";
  }
  if (name.includes("xodim") || name.includes("employee") || name.includes("o'qituvchi")) {
    return "employee";
  }
  return "institut";
}
