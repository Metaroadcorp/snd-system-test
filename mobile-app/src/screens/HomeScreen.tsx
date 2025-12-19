import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import dayjs from 'dayjs';
import api from '../services/api';
import { useAuthStore } from '../stores/authStore';
import { Task, Notification } from '../types';

export default function HomeScreen({ navigation }: any) {
  const user = useAuthStore((state) => state.user);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // 오늘 업무 로드
      const tasksRes = await api.get('/tasks/my/today');
      if (tasksRes.data.success) {
        setTasks(tasksRes.data.data);
      }

      // 알림 로드
      const notiRes = await api.get('/notifications?limit=5');
      if (notiRes.data.success) {
        setNotifications(notiRes.data.data);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
      // 샘플 데이터
      setTasks([
        { id: '1', organizationId: '1', name: '어르신 건강체크', description: '활력징후 측정', priority: 'HIGH', dueAt: dayjs().add(1, 'hour').toISOString(), status: 'IN_PROGRESS', approvalRequired: false, createdAt: dayjs().toISOString() },
        { id: '2', organizationId: '1', name: '투약 확인', priority: 'URGENT', dueAt: dayjs().add(30, 'minute').toISOString(), status: 'PENDING', approvalRequired: true, createdAt: dayjs().toISOString() },
        { id: '3', organizationId: '1', name: '식사 보조', priority: 'HIGH', dueAt: dayjs().add(3, 'hour').toISOString(), status: 'PENDING', approvalRequired: false, createdAt: dayjs().toISOString() },
      ]);
      setNotifications([
        { id: '1', type: 'TASK', title: '새 업무가 배정되었습니다', body: '투약 확인', isRead: false, createdAt: dayjs().toISOString() },
        { id: '2', type: 'BROADCAST', title: '등원 안내', body: '어르신들께서 등원하고 계십니다', isRead: true, createdAt: dayjs().subtract(30, 'minute').toISOString() },
      ]);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* 헤더 */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>안녕하세요, {user?.name || '직원'}님</Text>
          <Text style={styles.date}>{dayjs().format('YYYY년 MM월 DD일 dddd')}</Text>
        </View>
      </View>

      {/* 새 알림 */}
      {notifications.filter((n) => !n.isRead).length > 0 && (
        <TouchableOpacity
          style={styles.notificationBanner}
          onPress={() => navigation.navigate('Notifications')}
        >
          <Text style={styles.notificationText}>
            📢 새 알림 {notifications.filter((n) => !n.isRead).length}건
          </Text>
        </TouchableOpacity>
      )}

      {/* 오늘의 업무 */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>오늘의 업무</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Tasks')}>
            <Text style={styles.sectionMore}>전체보기</Text>
          </TouchableOpacity>
        </View>

        {tasks.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>배정된 업무가 없습니다</Text>
          </View>
        ) : (
          tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onPress={() => navigation.navigate('TaskDetail', { taskId: task.id })}
            />
          ))
        )}
      </View>

      {/* 빠른 버튼 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>빠른 실행</Text>
        <View style={styles.quickButtons}>
          <QuickButton label="손위생" color="#3b82f6" onPress={() => {}} />
          <QuickButton label="수분섭취" color="#3b82f6" onPress={() => {}} />
          <QuickButton label="낙상주의" color="#ef4444" onPress={() => {}} />
          <QuickButton label="응급" color="#ef4444" onPress={() => {}} />
        </View>
      </View>
    </ScrollView>
  );
}

function TaskCard({ task, onPress }: { task: Task; onPress: () => void }) {
  const priorityColors: Record<string, string> = {
    LOW: '#9ca3af',
    MEDIUM: '#3b82f6',
    HIGH: '#f97316',
    URGENT: '#ef4444',
  };

  const statusLabels: Record<string, string> = {
    PENDING: '대기',
    IN_PROGRESS: '진행중',
    COMPLETED: '완료',
  };

  const isOverdue = task.dueAt && dayjs(task.dueAt).isBefore(dayjs()) && task.status !== 'COMPLETED';

  return (
    <TouchableOpacity
      style={[styles.taskCard, isOverdue && styles.taskCardOverdue]}
      onPress={onPress}
    >
      <View style={styles.taskHeader}>
        <View style={styles.taskTitleRow}>
          <View style={[styles.priorityDot, { backgroundColor: priorityColors[task.priority] }]} />
          <Text style={styles.taskTitle}>{task.name}</Text>
        </View>
        <Text style={[styles.taskStatus, task.status === 'IN_PROGRESS' && styles.taskStatusActive]}>
          {statusLabels[task.status]}
        </Text>
      </View>
      {task.description && <Text style={styles.taskDescription}>{task.description}</Text>}
      {task.dueAt && (
        <Text style={[styles.taskDue, isOverdue && styles.taskDueOverdue]}>
          마감: {dayjs(task.dueAt).format('HH:mm')}
        </Text>
      )}
    </TouchableOpacity>
  );
}

function QuickButton({
  label,
  color,
  onPress,
}: {
  label: string;
  color: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={[styles.quickButton, { backgroundColor: color }]} onPress={onPress}>
      <Text style={styles.quickButtonText}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  greeting: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  date: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  notificationBanner: {
    backgroundColor: '#fef3c7',
    padding: 12,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 8,
  },
  notificationText: {
    color: '#92400e',
    fontWeight: '500',
  },
  section: {
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  sectionMore: {
    fontSize: 14,
    color: '#3b82f6',
  },
  emptyCard: {
    backgroundColor: '#fff',
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  emptyText: {
    color: '#9ca3af',
  },
  taskCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  taskCardOverdue: {
    borderLeftWidth: 4,
    borderLeftColor: '#ef4444',
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  taskTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  taskStatus: {
    fontSize: 12,
    color: '#6b7280',
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  taskStatusActive: {
    backgroundColor: '#dbeafe',
    color: '#2563eb',
  },
  taskDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 8,
  },
  taskDue: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 8,
  },
  taskDueOverdue: {
    color: '#ef4444',
  },
  quickButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  quickButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});
