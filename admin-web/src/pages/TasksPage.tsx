import { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Filter,
  CheckCircle,
  Clock,
  AlertTriangle,
  XCircle,
  Edit,
  Trash2,
  User,
} from 'lucide-react';
import api from '@/services/api';
import type { Task } from '@/types';
import dayjs from 'dayjs';

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'in_progress' | 'completed'>('all');
  const [showModal, setShowModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      const res = await api.get('/tasks');
      if (res.data.success) {
        setTasks(res.data.data);
      }
    } catch (error) {
      console.error('Failed to load tasks:', error);
      // 샘플 데이터
      setTasks([
        { id: '1', organizationId: '1', name: '어르신 건강체크', description: '활력징후 측정', priority: 'HIGH', dueAt: dayjs().add(1, 'hour').toISOString(), status: 'IN_PROGRESS', approvalRequired: false, createdAt: dayjs().toISOString() },
        { id: '2', organizationId: '1', name: '투약 확인', description: '약 복용 확인', priority: 'URGENT', dueAt: dayjs().add(30, 'minute').toISOString(), status: 'PENDING', approvalRequired: true, createdAt: dayjs().toISOString() },
        { id: '3', organizationId: '1', name: '프로그램 준비', description: '오전 인지 프로그램', priority: 'MEDIUM', dueAt: dayjs().add(2, 'hour').toISOString(), status: 'COMPLETED', approvalRequired: false, createdAt: dayjs().toISOString() },
        { id: '4', organizationId: '1', name: '식사 보조', description: '점심 식사 보조', priority: 'HIGH', dueAt: dayjs().add(3, 'hour').toISOString(), status: 'PENDING', approvalRequired: false, createdAt: dayjs().toISOString() },
        { id: '5', organizationId: '1', name: '송영 준비', description: '하원 송영 체크리스트', priority: 'MEDIUM', dueAt: dayjs().add(6, 'hour').toISOString(), status: 'PENDING', approvalRequired: false, createdAt: dayjs().toISOString() },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const filteredTasks = tasks.filter((task) => {
    if (filter === 'all') return true;
    if (filter === 'pending') return task.status === 'PENDING';
    if (filter === 'in_progress') return task.status === 'IN_PROGRESS';
    if (filter === 'completed') return task.status === 'COMPLETED';
    return true;
  });

  const stats = {
    total: tasks.length,
    pending: tasks.filter((t) => t.status === 'PENDING').length,
    inProgress: tasks.filter((t) => t.status === 'IN_PROGRESS').length,
    completed: tasks.filter((t) => t.status === 'COMPLETED').length,
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="업무 검색"
              className="input pl-10 w-64"
            />
          </div>
          <div className="flex bg-gray-100 rounded-lg p-1">
            <FilterButton label="전체" active={filter === 'all'} onClick={() => setFilter('all')} />
            <FilterButton label="대기" active={filter === 'pending'} onClick={() => setFilter('pending')} />
            <FilterButton label="진행중" active={filter === 'in_progress'} onClick={() => setFilter('in_progress')} />
            <FilterButton label="완료" active={filter === 'completed'} onClick={() => setFilter('completed')} />
          </div>
        </div>
        <button
          onClick={() => {
            setSelectedTask(null);
            setShowModal(true);
          }}
          className="btn btn-primary flex items-center gap-2"
        >
          <Plus size={18} />
          업무 등록
        </button>
      </div>

      {/* 통계 */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard icon={Clock} iconColor="bg-gray-100 text-gray-600" label="전체" value={stats.total} />
        <StatCard icon={AlertTriangle} iconColor="bg-yellow-100 text-yellow-600" label="대기" value={stats.pending} />
        <StatCard icon={Clock} iconColor="bg-blue-100 text-blue-600" label="진행중" value={stats.inProgress} />
        <StatCard icon={CheckCircle} iconColor="bg-green-100 text-green-600" label="완료" value={stats.completed} />
      </div>

      {/* 업무 목록 */}
      <div className="space-y-4">
        {loading ? (
          <div className="card text-center text-gray-500 py-8">로딩 중...</div>
        ) : filteredTasks.length === 0 ? (
          <div className="card text-center text-gray-500 py-8">등록된 업무가 없습니다</div>
        ) : (
          filteredTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onEdit={() => {
                setSelectedTask(task);
                setShowModal(true);
              }}
            />
          ))
        )}
      </div>

      {/* 모달 */}
      {showModal && (
        <TaskModal
          task={selectedTask}
          onClose={() => setShowModal(false)}
          onSave={() => {
            setShowModal(false);
            loadTasks();
          }}
        />
      )}
    </div>
  );
}

function FilterButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
        active ? 'bg-white shadow' : 'text-gray-600'
      }`}
    >
      {label}
    </button>
  );
}

function StatCard({
  icon: Icon,
  iconColor,
  label,
  value,
}: {
  icon: any;
  iconColor: string;
  label: string;
  value: number;
}) {
  return (
    <div className="card flex items-center gap-4">
      <div className={`p-3 rounded-lg ${iconColor}`}>
        <Icon size={20} />
      </div>
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-xl font-bold">{value}건</p>
      </div>
    </div>
  );
}

function TaskCard({ task, onEdit }: { task: Task; onEdit: () => void }) {
  const priorityConfig = {
    LOW: { bg: 'bg-gray-100', text: 'text-gray-600', label: '낮음' },
    MEDIUM: { bg: 'bg-blue-100', text: 'text-blue-600', label: '보통' },
    HIGH: { bg: 'bg-orange-100', text: 'text-orange-600', label: '높음' },
    URGENT: { bg: 'bg-red-100', text: 'text-red-600', label: '긴급' },
  };

  const statusConfig = {
    PENDING: { icon: Clock, color: 'text-yellow-500', label: '대기' },
    IN_PROGRESS: { icon: Clock, color: 'text-blue-500', label: '진행중' },
    COMPLETED: { icon: CheckCircle, color: 'text-green-500', label: '완료' },
    CANCELLED: { icon: XCircle, color: 'text-gray-500', label: '취소' },
    IMPOSSIBLE: { icon: XCircle, color: 'text-red-500', label: '불가' },
  };

  const pConfig = priorityConfig[task.priority];
  const sConfig = statusConfig[task.status];
  const StatusIcon = sConfig.icon;

  const isOverdue = task.dueAt && dayjs(task.dueAt).isBefore(dayjs()) && task.status !== 'COMPLETED';

  return (
    <div className={`card ${isOverdue ? 'border-red-200 bg-red-50' : ''}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <div className={`p-2 rounded-lg ${sConfig.color} bg-opacity-10`}>
            <StatusIcon size={20} className={sConfig.color} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-medium text-gray-800">{task.name}</h4>
              <span className={`px-2 py-0.5 text-xs rounded-full ${pConfig.bg} ${pConfig.text}`}>
                {pConfig.label}
              </span>
              {task.approvalRequired && (
                <span className="px-2 py-0.5 text-xs rounded-full bg-purple-100 text-purple-600">
                  승인필요
                </span>
              )}
            </div>
            {task.description && (
              <p className="text-sm text-gray-500 mt-1">{task.description}</p>
            )}
            <div className="flex items-center gap-4 mt-2 text-sm text-gray-400">
              {task.dueAt && (
                <span className={isOverdue ? 'text-red-500' : ''}>
                  마감: {dayjs(task.dueAt).format('MM/DD HH:mm')}
                </span>
              )}
              <span className="flex items-center gap-1">
                <User size={14} />
                담당자 2명
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={onEdit} className="p-2 hover:bg-gray-100 rounded-lg">
            <Edit size={16} className="text-gray-500" />
          </button>
          <button className="p-2 hover:bg-gray-100 rounded-lg">
            <Trash2 size={16} className="text-red-500" />
          </button>
        </div>
      </div>

      {/* 담당자 상태 버튼 (진행중인 업무만) */}
      {task.status !== 'COMPLETED' && task.status !== 'CANCELLED' && (
        <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-100">
          <span className="text-sm text-gray-500">상태 변경:</span>
          <button className="btn btn-secondary text-xs py-1 px-3">진행중</button>
          <button className="btn btn-primary text-xs py-1 px-3">완료</button>
          <button className="btn text-xs py-1 px-3 bg-red-50 text-red-600 hover:bg-red-100">불가</button>
        </div>
      )}
    </div>
  );
}

function TaskModal({
  task,
  onClose,
  onSave,
}: {
  task: Task | null;
  onClose: () => void;
  onSave: () => void;
}) {
  const [form, setForm] = useState({
    name: task?.name || '',
    description: task?.description || '',
    priority: task?.priority || 'MEDIUM',
    dueAt: task?.dueAt ? dayjs(task.dueAt).format('YYYY-MM-DDTHH:mm') : '',
    approvalRequired: task?.approvalRequired || false,
    assignees: [] as string[],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = {
        ...form,
        dueAt: form.dueAt ? new Date(form.dueAt).toISOString() : null,
      };
      if (task) {
        await api.put(`/tasks/${task.id}`, data);
      } else {
        await api.post('/tasks', data);
      }
      onSave();
    } catch (error) {
      console.error('Failed to save task:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-semibold mb-4">
          {task ? '업무 수정' : '업무 등록'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">업무명</label>
            <input
              type="text"
              className="input"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">설명</label>
            <textarea
              className="input min-h-[80px]"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">우선순위</label>
              <select
                className="input"
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value as any })}
              >
                <option value="LOW">낮음</option>
                <option value="MEDIUM">보통</option>
                <option value="HIGH">높음</option>
                <option value="URGENT">긴급</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">마감일시</label>
              <input
                type="datetime-local"
                className="input"
                value={form.dueAt}
                onChange={(e) => setForm({ ...form, dueAt: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">담당자</label>
            <select className="input" multiple>
              <option value="1">김간호사</option>
              <option value="2">박요양보호사</option>
              <option value="3">이사회복지사</option>
            </select>
            <p className="text-xs text-gray-400 mt-1">Ctrl+클릭으로 여러 명 선택</p>
          </div>

          <div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.approvalRequired}
                onChange={(e) => setForm({ ...form, approvalRequired: e.target.checked })}
              />
              <span className="text-sm text-gray-700">완료 시 승인 필요</span>
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={onClose} className="btn btn-secondary">
              취소
            </button>
            <button type="submit" className="btn btn-primary">
              저장
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
