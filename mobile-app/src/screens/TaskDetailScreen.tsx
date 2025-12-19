import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import * as Speech from 'expo-speech';
import dayjs from 'dayjs';
import api from '../services/api';
import { Task } from '../types';

export default function TaskDetailScreen({ route, navigation }: any) {
  const { taskId } = route.params;
  const [task, setTask] = useState<Task | null>(null);
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTask();
  }, [taskId]);

  const loadTask = async () => {
    try {
      const res = await api.get(`/tasks/${taskId}`);
      if (res.data.success) {
        setTask(res.data.data);
      }
    } catch (error) {
      console.error('Failed to load task:', error);
      // 샘플 데이터
      setTask({
        id: taskId,
        organizationId: '1',
        name: '어르신 건강체크',
        description: '어르신들의 활력징후(혈압, 맥박, 체온)를 측정하고 기록합니다.',
        priority: 'HIGH',
        dueAt: dayjs().add(1, 'hour').toISOString(),
        status: 'IN_PROGRESS',
        approvalRequired: false,
        createdAt: dayjs().toISOString(),
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (status: string) => {
    if (status === 'IMPOSSIBLE' && !note.trim()) {
      Alert.alert('사유 입력', '불가 처리 시 사유를 입력해주세요.');
      return;
    }

    try {
      await api.put(`/tasks/${taskId}/status`, { status, note });
      Alert.alert('완료', '상태가 변경되었습니다.');
      navigation.goBack();
    } catch (error) {
      console.error('Failed to update status:', error);
      Alert.alert('오류', '상태 변경에 실패했습니다.');
    }
  };

  const speakDescription = () => {
    if (task?.description) {
      Speech.speak(task.description, { language: 'ko' });
    }
  };

  if (loading || !task) {
    return (
      <View style={styles.loadingContainer}>
        <Text>로딩 중...</Text>
      </View>
    );
  }

  const priorityConfig: Record<string, { color: string; label: string }> = {
    LOW: { color: '#9ca3af', label: '낮음' },
    MEDIUM: { color: '#3b82f6', label: '보통' },
    HIGH: { color: '#f97316', label: '높음' },
    URGENT: { color: '#ef4444', label: '긴급' },
  };

  const statusConfig: Record<string, { color: string; label: string }> = {
    PENDING: { color: '#f59e0b', label: '대기' },
    IN_PROGRESS: { color: '#3b82f6', label: '진행중' },
    COMPLETED: { color: '#10b981', label: '완료' },
    IMPOSSIBLE: { color: '#ef4444', label: '불가' },
  };

  const isOverdue = task.dueAt && dayjs(task.dueAt).isBefore(dayjs()) && task.status !== 'COMPLETED';

  return (
    <ScrollView style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>{task.name}</Text>
          <View style={[styles.priorityBadge, { backgroundColor: priorityConfig[task.priority].color }]}>
            <Text style={styles.priorityText}>{priorityConfig[task.priority].label}</Text>
          </View>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusConfig[task.status].color + '20' }]}>
          <View style={[styles.statusDot, { backgroundColor: statusConfig[task.status].color }]} />
          <Text style={[styles.statusText, { color: statusConfig[task.status].color }]}>
            {statusConfig[task.status].label}
          </Text>
        </View>
      </View>

      {/* 마감일 */}
      {task.dueAt && (
        <View style={[styles.dueSection, isOverdue && styles.dueSectionOverdue]}>
          <Text style={[styles.dueLabel, isOverdue && styles.dueLabelOverdue]}>
            {isOverdue ? '⚠️ 마감 시간이 지났습니다' : '마감'}
          </Text>
          <Text style={[styles.dueTime, isOverdue && styles.dueTimeOverdue]}>
            {dayjs(task.dueAt).format('MM월 DD일 HH:mm')}
          </Text>
        </View>
      )}

      {/* 설명 */}
      {task.description && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>업무 내용</Text>
            <TouchableOpacity onPress={speakDescription} style={styles.ttsButton}>
              <Text style={styles.ttsButtonText}>🔊 음성으로 듣기</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.description}>{task.description}</Text>
        </View>
      )}

      {/* 메모 입력 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>메모 (선택)</Text>
        <TextInput
          style={styles.noteInput}
          placeholder="메모를 입력하세요"
          value={note}
          onChangeText={setNote}
          multiline
          numberOfLines={3}
        />
      </View>

      {/* 상태 변경 버튼 */}
      {task.status !== 'COMPLETED' && task.status !== 'CANCELLED' && (
        <View style={styles.actionSection}>
          <Text style={styles.actionTitle}>상태 변경</Text>
          <View style={styles.actionButtons}>
            {task.status === 'PENDING' && (
              <TouchableOpacity
                style={[styles.actionButton, styles.actionButtonProgress]}
                onPress={() => handleStatusChange('IN_PROGRESS')}
              >
                <Text style={styles.actionButtonText}>진행중</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.actionButton, styles.actionButtonComplete]}
              onPress={() => handleStatusChange('COMPLETED')}
            >
              <Text style={styles.actionButtonText}>완료</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.actionButtonImpossible]}
              onPress={() => handleStatusChange('IMPOSSIBLE')}
            >
              <Text style={[styles.actionButtonText, styles.actionButtonTextDanger]}>불가</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    flex: 1,
  },
  priorityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
    marginLeft: 8,
  },
  priorityText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 12,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
  },
  dueSection: {
    backgroundColor: '#fff',
    padding: 16,
    marginTop: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dueSectionOverdue: {
    backgroundColor: '#fef2f2',
  },
  dueLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  dueLabelOverdue: {
    color: '#ef4444',
  },
  dueTime: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  dueTimeOverdue: {
    color: '#ef4444',
  },
  section: {
    backgroundColor: '#fff',
    padding: 16,
    marginTop: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  ttsButton: {
    padding: 8,
  },
  ttsButtonText: {
    color: '#3b82f6',
    fontSize: 14,
  },
  description: {
    fontSize: 16,
    color: '#4b5563',
    lineHeight: 24,
  },
  noteInput: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  actionSection: {
    padding: 16,
    marginTop: 12,
    marginBottom: 32,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionButtonProgress: {
    backgroundColor: '#3b82f6',
  },
  actionButtonComplete: {
    backgroundColor: '#10b981',
  },
  actionButtonImpossible: {
    backgroundColor: '#fee2e2',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  actionButtonTextDanger: {
    color: '#ef4444',
  },
});
