import { Priority, StaffRole, AuthorType } from '@prisma/client';

export { Priority, StaffRole, AuthorType };

// WorkOrderStatus is now a string (no longer a Prisma enum)
export type WorkOrderStatus = string;

// Status configuration with bilingual labels and colors
export interface StatusConfig {
  key: string;
  labelEn: string;
  labelZh: string;
  color: string;    // hex color for the dot
  bgColor: string;  // hex background color
  textColor: string; // hex text color
  sortOrder: number;
  defaultProgress: number;
  isTerminal: boolean;
  isDefault: boolean;
  isActive: boolean;
}

// Fallback STATUS_CONFIG for use when DB configs aren't loaded yet
export const STATUS_CONFIG: Record<string, StatusConfig> = {
  DRAFT: {
    key: 'DRAFT',
    labelEn: 'Draft',
    labelZh: '草稿',
    color: '#6B7280',
    bgColor: '#F3F4F6',
    textColor: '#374151',
    sortOrder: 0,
    defaultProgress: 0,
    isTerminal: false,
    isDefault: true,
    isActive: true,
  },
  RECEIVED: {
    key: 'RECEIVED',
    labelEn: 'Received',
    labelZh: '已接收',
    color: '#3B82F6',
    bgColor: '#DBEAFE',
    textColor: '#1D4ED8',
    sortOrder: 1,
    defaultProgress: 5,
    isTerminal: false,
    isDefault: false,
    isActive: true,
  },
  IN_PROGRESS: {
    key: 'IN_PROGRESS',
    labelEn: 'In Progress',
    labelZh: '进行中',
    color: '#F59E0B',
    bgColor: '#FEF3C7',
    textColor: '#92400E',
    sortOrder: 2,
    defaultProgress: 50,
    isTerminal: false,
    isDefault: false,
    isActive: true,
  },
  WAITING_FOR_CLIENT: {
    key: 'WAITING_FOR_CLIENT',
    labelEn: 'Waiting for Client',
    labelZh: '等待客户',
    color: '#F97316',
    bgColor: '#FFEDD5',
    textColor: '#9A3412',
    sortOrder: 3,
    defaultProgress: -1,
    isTerminal: false,
    isDefault: false,
    isActive: true,
  },
  WAITING_FOR_THIRD_PARTY: {
    key: 'WAITING_FOR_THIRD_PARTY',
    labelEn: 'Waiting for Third Party',
    labelZh: '等待第三方',
    color: '#8B5CF6',
    bgColor: '#EDE9FE',
    textColor: '#5B21B6',
    sortOrder: 4,
    defaultProgress: -1,
    isTerminal: false,
    isDefault: false,
    isActive: true,
  },
  COMPLETED: {
    key: 'COMPLETED',
    labelEn: 'Completed',
    labelZh: '已完成',
    color: '#10B981',
    bgColor: '#D1FAE5',
    textColor: '#065F46',
    sortOrder: 5,
    defaultProgress: 100,
    isTerminal: true,
    isDefault: false,
    isActive: true,
  },
  CLOSED: {
    key: 'CLOSED',
    labelEn: 'Closed',
    labelZh: '已关闭',
    color: '#4B5563',
    bgColor: '#E5E7EB',
    textColor: '#1F2937',
    sortOrder: 6,
    defaultProgress: 100,
    isTerminal: true,
    isDefault: false,
    isActive: true,
  },
  CANCELLED: {
    key: 'CANCELLED',
    labelEn: 'Cancelled',
    labelZh: '已取消',
    color: '#EF4444',
    bgColor: '#FEE2E2',
    textColor: '#991B1B',
    sortOrder: 7,
    defaultProgress: -1,
    isTerminal: true,
    isDefault: false,
    isActive: true,
  },
};

// JWT payload types
export interface ClientTokenPayload {
  type: 'client';
  workOrderId: string;
  workorderNumber: string;
}

export interface AdminTokenPayload {
  type: 'admin';
  staffId: string;
  email: string;
  role: StaffRole;
}

export type TokenPayload = ClientTokenPayload | AdminTokenPayload;

// API response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

// Dashboard types
export interface DashboardStats {
  totalOpen: number;
  overdue: number;
  waitingForClient: number;
  completedThisWeek: number;
  byStatus: { status: string; count: number }[];
  staffWorkload: { staffId: string; staffName: string; count: number }[];
}

// Work order display type (safe for client)
export interface WorkOrderClientView {
  id: string;
  workorderNumber: string;
  clientName: string;
  clientCompany: string | null;
  status: string;
  progressPercentage: number;
  priority: Priority;
  assignedStaffName: string | null;
  description: string | null;
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
  statusHistory: {
    id: string;
    oldStatus: string | null;
    newStatus: string;
    note: string | null;
    createdAt: string;
  }[];
  comments: {
    id: string;
    authorType: AuthorType;
    authorName: string | null;
    content: string;
    createdAt: string;
  }[];
}

// Supported locales
export type Locale = 'en' | 'zh';
