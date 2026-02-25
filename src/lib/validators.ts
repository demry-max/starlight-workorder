import { z } from "zod";
import { Priority, StaffRole } from "@prisma/client";

// Sanitize input to prevent XSS
export function sanitizeInput(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

export const clientLoginSchema = z.object({
  workorderNumber: z.string().min(1).max(50).trim(),
  password: z.string().min(1).max(128),
});

export const adminLoginSchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(1).max(128),
});

export const createWorkOrderSchema = z.object({
  clientName: z.string().min(1).max(255).trim(),
  clientCompany: z.string().max(255).trim().optional(),
  clientEmail: z.string().email().max(255).optional().or(z.literal("")),
  clientPhone: z.string().max(50).trim().optional(),
  description: z.string().max(5000).trim().optional(),
  priority: z.nativeEnum(Priority).optional().default("MEDIUM"),
  dueDate: z.string().datetime().optional().or(z.literal("")),
  assignedStaffId: z.string().uuid().optional(),
  salesRepId: z.string().uuid().optional(),
  password: z.string().min(6).max(128),
});

export const updateWorkOrderSchema = z.object({
  status: z.string().max(100).optional(),
  statusNote: z.string().max(1000).trim().optional(),
  progressPercentage: z.number().int().min(0).max(100).optional(),
  priority: z.nativeEnum(Priority).optional(),
  dueDate: z.string().datetime().optional().nullable(),
  assignedStaffId: z.string().uuid().optional().nullable(),
  salesRepId: z.string().uuid().optional().nullable(),
  description: z.string().max(5000).trim().optional(),
  clientName: z.string().min(1).max(255).trim().optional(),
  clientCompany: z.string().max(255).trim().optional().nullable(),
  clientEmail: z
    .string()
    .email()
    .max(255)
    .optional()
    .nullable()
    .or(z.literal("")),
  clientPhone: z.string().max(50).trim().optional().nullable(),
  password: z.string().min(6).max(128).optional(),
});

export const commentSchema = z.object({
  workOrderId: z.string().uuid(),
  content: z.string().min(1).max(2000).trim(),
  isInternal: z.boolean().optional().default(false),
});

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().max(255).trim().optional(),
  status: z.string().max(100).optional(),
  salesRepId: z.string().uuid().optional(),
  sortBy: z
    .enum(["created_at", "updated_at", "due_date", "status", "priority"])
    .optional()
    .default("created_at"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
});

export const createUserSchema = z.object({
  name: z.string().min(1).max(255).trim(),
  email: z.string().email().max(255),
  password: z.string().min(6).max(128),
  role: z.nativeEnum(StaffRole).default("STAFF"),
});

export const updateUserSchema = z.object({
  name: z.string().min(1).max(255).trim().optional(),
  email: z.string().email().max(255).optional(),
  password: z.string().min(6).max(128).optional(),
  role: z.nativeEnum(StaffRole).optional(),
  isActive: z.boolean().optional(),
});
