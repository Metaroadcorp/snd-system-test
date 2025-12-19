// 사용자
export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
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
  approvalRequired: boolean;
  createdAt: string;
}

// 업무 담당
export interface TaskAssignee {
  id: string;
  taskId: string;
  task?: Task;
  userId: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'IMPOSSIBLE';
  startedAt?: string;
  completedAt?: string;
  note?: string;
}

// 알림
export interface Notification {
  id: string;
  type: 'TASK' | 'RIDE' | 'BROADCAST' | 'ANNOUNCEMENT' | 'SYSTEM';
  title: string;
  body?: string;
  data?: Record<string, any>;
  isRead: boolean;
  createdAt: string;
}

// 송영
export interface RideSchedule {
  id: string;
  serviceDate: string;
  elderId: string;
  elderName?: string;
  routeType: 'PICKUP' | 'DROPOFF';
  scheduledTime: string;
  vehicleName?: string;
  driverName?: string;
  status: 'PENDING' | 'BOARDING' | 'ARRIVED' | 'CANCELLED' | 'NO_SHOW';
}

// 방송
export interface Broadcast {
  id: string;
  name: string;
  textContent?: string;
  scheduledTime: string;
  status: 'PENDING' | 'PLAYING' | 'COMPLETED';
}

// API 응답
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}
