import { WorkOrderStatus, Priority, StaffRole, AuthorType } from '@prisma/client';

export { WorkOrderStatus, Priority, StaffRole, AuthorType };

// Status configuration with bilingual labels and colors
export interface StatusConfig {
  key: WorkOrderStatus;
  labelEn: string;
  labelZh: string;
  color: string;
  bgColor: string;
  textColor: string;
  sortOrder: number;
}

export const STATUS_CONFIG: Record<WorkOrderStatus, StatusConfig> = {
  DRAFT: {
    key: 'DRAFT',
    labelEn: 'Draft',
    labelZh: '草稿',
    color: '#6B7280',
    bgColor: 'bg-gray-100',
    textColor: 'text-gray-700',
    sortOrder: 0,
  },
  RECEIVED: {
    key: 'RECEIVED',
    labelEn: 'Received',
    labelZh: '已接收',
    color: '#3B82F6',
    bgColor: 'bg-blue-100',
    textColor: 'text-blue-700',
    sortOrder: 1,
  },
  IN_PROGRESS: {
    key: 'IN_PROGRESS',
    labelEn: 'In Progress',
    labelZh: '进行中',
    color: '#F59E0B',
    bgColor: 'bg-amber-100',
    textColor: 'text-amber-700',
    sortOrder: 2,
  },
  WAITING_FOR_CLIENT: {
    key: 'WAITING_FOR_CLIENT',
    labelEn: 'Waiting for Client',
    labelZh: '等待客户',
    color: '#F97316',
    bgColor: 'bg-orange-100',
    textColor: 'text-orange-700',
    sortOrder: 3,
  },
  WAITING_FOR_THIRD_PARTY: {
    key: 'WAITING_FOR_THIRD_PARTY',
    labelEn: 'Waiting for Third Party',
    labelZh: '等待第三方',
    color: '#8B5CF6',
    bgColor: 'bg-purple-100',
    textColor: 'text-purple-700',
    sortOrder: 4,
  },
  COMPLETED: {
    key: 'COMPLETED',
    labelEn: 'Completed',
    labelZh: '已完成',
    color: '#10B981',
    bgColor: 'bg-green-100',
    textColor: 'text-green-700',
    sortOrder: 5,
  },
  CLOSED: {
    key: 'CLOSED',
    labelEn: 'Closed',
    labelZh: '已关闭',
    color: '#4B5563',
    bgColor: 'bg-gray-200',
    textColor: 'text-gray-600',
    sortOrder: 6,
  },
  CANCELLED: {
    key: 'CANCELLED',
    labelEn: 'Cancelled',
    labelZh: '已取消',
    color: '#EF4444',
    bgColor: 'bg-red-100',
    textColor: 'text-red-700',
    sortOrder: 7,
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
  byStatus: { status: WorkOrderStatus; count: number }[];
  staffWorkload: { staffId: string; staffName: string; count: number }[];
}

// Work order display type (safe for client)
export interface WorkOrderClientView {
  id: string;
  workorderNumber: string;
  clientName: string;
  clientCompany: string | null;
  status: WorkOrderStatus;
  progressPercentage: number;
  priority: Priority;
  assignedStaffName: string | null;
  description: string | null;
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
  statusHistory: {
    id: string;
    oldStatus: WorkOrderStatus | null;
    newStatus: WorkOrderStatus;
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
