/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum UserRole {
  ADMIN = "admin",
  XODIM = "xodim",
  VIEWER = "viewer",
}

export enum DocumentStatus {
  JOYIDA = "Joyida",
  BERILGAN = "Berilgan",
  YOQ_QILINGAN = "Yo'q qilingan",
}

export interface User {
  id: string;
  username: string;
  passwordHash?: string; // Hidden or used server-side
  fullName: string;
  role: UserRole;
  isActive: boolean;
  lastLoginAt?: string;
  createdAt: string;
}

export interface Student {
  id: string;
  lastName: string;
  firstName: string;
  middleName?: string;
  studentId?: string; // Student ID card number, optional but unique
  groupName?: string;
  birthDate?: string;
  phone?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Employee {
  id: string;
  lastName: string;
  firstName: string;
  middleName?: string;
  employeeId?: string; // Unique Employee ID/Tababel number
  department?: string; // Kafedra yoki kafedra nomi
  position?: string; // Lavozimi
  phone?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
}

export interface Cabinet {
  id: string;
  name: string; // cabinet raqami yoki nomi
  description?: string;
  maxFloor: number; // maks qavat, masalan 1-99
  isActive: boolean;
  createdAt: string;
}

export interface Document {
  id: string;
  studentId?: string;
  employeeId?: string;
  categoryId: string;
  docName?: string;
  docDate?: string;
  expiryYear?: number | null;
  personType?: "student" | "employee" | "none";
  cabinetId: string;
  floor: number;
  filePath: string; // virtual path or base64 data key
  fileSize: number; // in bytes
  originalFilename: string;
  status: DocumentStatus;
  notes?: string;
  receivedAt: string;
  receivedByUserId: string;
  issuedAt?: string;
  issuedByUserId?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
  // Join fields for convenience in API responses
  student?: Student;
  employee?: Employee;
  category?: Category;
  cabinet?: Cabinet;
  receiver?: { fullName: string };
  issuer?: { fullName: string };
}

export interface AuditLog {
  id: string;
  userId: string;
  userFullName: string;
  action: string;
  entityType: string;
  entityId?: string;
  payloadJson?: string;
  ip: string;
  createdAt: string;
}
