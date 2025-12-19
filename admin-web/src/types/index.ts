// 사용자
export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  createdAt: string;
}

// 조직
export interface Organization {
  id: string;
  code: string;
  name: string;
  typeId: string;
  type?: OrgType;
  parentId?: string;
  address?: string;
  phone?: string;
  isActive: boolean;
}

export interface OrgType {
  id: string;
  code: string;
  name: string;
}

// 어르신
export interface Elder {
  id: string;
  organizationId: string;
  name: string;
  birthDate: string;
  gender: 'MALE' | 'FEMALE';
  phone?: string;
  address?: string;
  careGrade?: string;
  boardingLocation?: string;
  boardingNote?: string;
  healthInfo?: Record<string, any>;
  specialNote?: string;
  profileImage?: string;
  contractStartDate?: string;
  contractEndDate?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
}

// 보호자
export interface Guardian {
  id: string;
  name: string;
  relationship: string;
  phone: string;
  isPrimary: boolean;
}

// 차량
export interface Vehicle {
  id: string;
  organizationId: string;
  name: string;
  plateNumber: string;
  capacity: number;
  status: 'ACTIVE' | 'MAINTENANCE' | 'INACTIVE';
}

// 송영 스케줄
export interface RideSchedule {
  id: string;
  organizationId: string;
  serviceDate: string;
  elderId: string;
  elder?: Elder;
  routeType: 'PICKUP' | 'DROPOFF';
  scheduledTime: string;
  vehicleId?: string;
  vehicle?: Vehicle;
  driverId?: string;
  driver?: User;
  managerId?: string;
  manager?: User;
  sequence?: number;
  status: 'PENDING' | 'BOARDING' | 'ARRIVED' | 'CANCELLED' | 'NO_SHOW';
}

// 방송 템플릿
export interface BroadcastTemplate {
  id: string;
  organizationId: string;
  name: string;
  contentType: 'TEXT' | 'IMAGE' | 'VIDEO' | 'AUDIO' | 'SLIDE';
  textContent?: string;
  mediaUrl?: string;
  durationSec: number;
  ttsEnabled: boolean;
  ttsVoice?: string;
  targetType: 'ALL' | 'HALL' | 'TEAM' | 'USER';
  isUrgent: boolean;
}

// 방송 스케줄
export interface BroadcastSchedule {
  id: string;
  templateId: string;
  template?: BroadcastTemplate;
  repeatType: 'ONCE' | 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
  repeatConfig?: Record<string, any>;
  scheduledTime: string;
  startDate: string;
  endDate?: string;
  isActive: boolean;
}

// 업무
export interface Task {
  id: string;
  organizationId: string;
  name: string;
  description?: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  dueAt?: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'IMPOSSIBLE';
  checklist?: { id: string; text: string; checked: boolean }[];
  approvalRequired: boolean;
  createdBy?: string;
  createdAt: string;
}

// 업무 담당자
export interface TaskAssignee {
  id: string;
  taskId: string;
  task?: Task;
  userId: string;
  user?: User;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'IMPOSSIBLE';
  startedAt?: string;
  completedAt?: string;
  note?: string;
}

// 알림
export interface Notification {
  id: string;
  userId: string;
  type: 'TASK' | 'RIDE' | 'BROADCAST' | 'ANNOUNCEMENT' | 'SYSTEM';
  title: string;
  body?: string;
  data?: Record<string, any>;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
}

// API 응답
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
