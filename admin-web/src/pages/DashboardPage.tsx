import { useEffect, useState } from 'react';
import { Users, Car, Radio, ClipboardList, AlertTriangle, CheckCircle } from 'lucide-react';
import api from '@/services/api';
import dayjs from 'dayjs';

interface DashboardStats {
  elders: { total: number; active: number };
  rides: { today: number; completed: number; pending: number };
  broadcasts: { today: number; completed: number };
  tasks: { total: number; pending: number; inProgress: number; completed: number };
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      // 실제 구현에서는 대시보드 통계 API 호출
      // const res = await api.get('/dashboard/stats');
      setStats({
        elders: { total: 45, active: 42 },
        rides: { today: 84, completed: 56, pending: 28 },
        broadcasts: { today: 12, completed: 8 },
        tasks: { total: 24, pending: 8, inProgress: 10, completed: 6 },
      });
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">로딩 중...</div>;
  }

  return (
    <div className="space-y-6">
      {/* 오늘 날짜 */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-800">
          {dayjs().format('YYYY년 MM월 DD일 dddd')}
        </h2>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={Users}
          iconColor="bg-blue-100 text-blue-600"
          title="어르신"
          value={stats?.elders.active || 0}
          subValue={`전체 ${stats?.elders.total || 0}명`}
        />
        <StatCard
          icon={Car}
          iconColor="bg-green-100 text-green-600"
          title="오늘 송영"
          value={stats?.rides.completed || 0}
          subValue={`전체 ${stats?.rides.today || 0}건`}
          progress={(stats?.rides.completed || 0) / (stats?.rides.today || 1) * 100}
        />
        <StatCard
          icon={Radio}
          iconColor="bg-purple-100 text-purple-600"
          title="오늘 방송"
          value={stats?.broadcasts.completed || 0}
          subValue={`전체 ${stats?.broadcasts.today || 0}건`}
          progress={(stats?.broadcasts.completed || 0) / (stats?.broadcasts.today || 1) * 100}
        />
        <StatCard
          icon={ClipboardList}
          iconColor="bg-orange-100 text-orange-600"
          title="업무"
          value={stats?.tasks.inProgress || 0}
          subValue={`대기 ${stats?.tasks.pending || 0}건`}
        />
      </div>

      {/* 빠른 액션 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 오늘의 송영 현황 */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800">오늘의 송영</h3>
            <a href="/rides" className="text-sm text-primary-600 hover:underline">
              전체보기
            </a>
          </div>
          <div className="space-y-3">
            <RideItem time="08:30" elder="김영희" status="completed" />
            <RideItem time="08:35" elder="이순자" status="completed" />
            <RideItem time="08:40" elder="박철수" status="boarding" />
            <RideItem time="08:45" elder="정미경" status="pending" />
            <RideItem time="08:50" elder="최동수" status="pending" />
          </div>
        </div>

        {/* 오늘의 방송 현황 */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800">오늘의 방송</h3>
            <a href="/broadcasts" className="text-sm text-primary-600 hover:underline">
              전체보기
            </a>
          </div>
          <div className="space-y-3">
            <BroadcastItem time="07:30" title="오픈/안전점검" status="completed" />
            <BroadcastItem time="08:00" title="등원 안내" status="completed" />
            <BroadcastItem time="09:00" title="컨디션 체크" status="in_progress" />
            <BroadcastItem time="09:30" title="인지 프로그램" status="pending" />
            <BroadcastItem time="11:30" title="점심 준비" status="pending" />
          </div>
        </div>
      </div>

      {/* 업무 현황 */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-800">대기 중인 업무</h3>
          <a href="/tasks" className="text-sm text-primary-600 hover:underline">
            전체보기
          </a>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-sm text-gray-500 border-b">
                <th className="pb-3 font-medium">업무명</th>
                <th className="pb-3 font-medium">담당자</th>
                <th className="pb-3 font-medium">마감일</th>
                <th className="pb-3 font-medium">우선순위</th>
                <th className="pb-3 font-medium">상태</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              <TaskRow
                name="어르신 건강체크"
                assignee="김간호사"
                dueDate="오늘 10:00"
                priority="high"
                status="in_progress"
              />
              <TaskRow
                name="투약 확인"
                assignee="박요양보호사"
                dueDate="오늘 09:30"
                priority="urgent"
                status="pending"
              />
              <TaskRow
                name="프로그램 준비"
                assignee="이사회복지사"
                dueDate="오늘 09:00"
                priority="medium"
                status="completed"
              />
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  iconColor,
  title,
  value,
  subValue,
  progress,
}: {
  icon: any;
  iconColor: string;
  title: string;
  value: number;
  subValue: string;
  progress?: number;
}) {
  return (
    <div className="card">
      <div className="flex items-center gap-4">
        <div className={`p-3 rounded-lg ${iconColor}`}>
          <Icon size={24} />
        </div>
        <div className="flex-1">
          <p className="text-sm text-gray-500">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          <p className="text-sm text-gray-400">{subValue}</p>
        </div>
      </div>
      {progress !== undefined && (
        <div className="mt-4">
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary-500 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function RideItem({
  time,
  elder,
  status,
}: {
  time: string;
  elder: string;
  status: 'pending' | 'boarding' | 'completed';
}) {
  const statusConfig = {
    pending: { bg: 'bg-gray-100', text: 'text-gray-600', label: '대기' },
    boarding: { bg: 'bg-yellow-100', text: 'text-yellow-600', label: '탑승중' },
    completed: { bg: 'bg-green-100', text: 'text-green-600', label: '완료' },
  };
  const config = statusConfig[status];

  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
      <div className="flex items-center gap-3">
        <span className="text-sm text-gray-500 w-12">{time}</span>
        <span className="font-medium text-gray-800">{elder}</span>
      </div>
      <span className={`text-xs px-2 py-1 rounded-full ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    </div>
  );
}

function BroadcastItem({
  time,
  title,
  status,
}: {
  time: string;
  title: string;
  status: 'pending' | 'in_progress' | 'completed';
}) {
  const statusConfig = {
    pending: { bg: 'bg-gray-100', text: 'text-gray-600', label: '예정' },
    in_progress: { bg: 'bg-blue-100', text: 'text-blue-600', label: '방송중' },
    completed: { bg: 'bg-green-100', text: 'text-green-600', label: '완료' },
  };
  const config = statusConfig[status];

  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
      <div className="flex items-center gap-3">
        <span className="text-sm text-gray-500 w-12">{time}</span>
        <span className="font-medium text-gray-800">{title}</span>
      </div>
      <span className={`text-xs px-2 py-1 rounded-full ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    </div>
  );
}

function TaskRow({
  name,
  assignee,
  dueDate,
  priority,
  status,
}: {
  name: string;
  assignee: string;
  dueDate: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'completed';
}) {
  const priorityConfig = {
    low: { bg: 'bg-gray-100', text: 'text-gray-600', label: '낮음' },
    medium: { bg: 'bg-blue-100', text: 'text-blue-600', label: '보통' },
    high: { bg: 'bg-orange-100', text: 'text-orange-600', label: '높음' },
    urgent: { bg: 'bg-red-100', text: 'text-red-600', label: '긴급' },
  };
  const statusConfig = {
    pending: { icon: AlertTriangle, color: 'text-yellow-500' },
    in_progress: { icon: Radio, color: 'text-blue-500' },
    completed: { icon: CheckCircle, color: 'text-green-500' },
  };

  const pConfig = priorityConfig[priority];
  const sConfig = statusConfig[status];
  const StatusIcon = sConfig.icon;

  return (
    <tr className="border-b border-gray-50 last:border-0">
      <td className="py-3 font-medium text-gray-800">{name}</td>
      <td className="py-3 text-gray-600">{assignee}</td>
      <td className="py-3 text-gray-600">{dueDate}</td>
      <td className="py-3">
        <span className={`text-xs px-2 py-1 rounded-full ${pConfig.bg} ${pConfig.text}`}>
          {pConfig.label}
        </span>
      </td>
      <td className="py-3">
        <StatusIcon size={18} className={sConfig.color} />
      </td>
    </tr>
  );
}
