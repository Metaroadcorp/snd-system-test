import { useState, useEffect } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Upload,
  Download,
  Car,
  CheckCircle,
  Clock,
  XCircle,
} from 'lucide-react';
import api from '@/services/api';
import type { RideSchedule } from '@/types';
import dayjs from 'dayjs';

export default function RidesPage() {
  const [date, setDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [routeType, setRouteType] = useState<'PICKUP' | 'DROPOFF'>('PICKUP');
  const [schedules, setSchedules] = useState<RideSchedule[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSchedules();
  }, [date, routeType]);

  const loadSchedules = async () => {
    setLoading(true);
    try {
      const res = await api.get('/rides/schedules', {
        params: { date, routeType },
      });
      if (res.data.success) {
        setSchedules(res.data.data);
      }
    } catch (error) {
      console.error('Failed to load schedules:', error);
      // 샘플 데이터
      setSchedules([
        { id: '1', organizationId: '1', serviceDate: date, elderId: '1', routeType, scheduledTime: '08:30', sequence: 1, status: 'ARRIVED' },
        { id: '2', organizationId: '1', serviceDate: date, elderId: '2', routeType, scheduledTime: '08:35', sequence: 2, status: 'ARRIVED' },
        { id: '3', organizationId: '1', serviceDate: date, elderId: '3', routeType, scheduledTime: '08:40', sequence: 3, status: 'BOARDING' },
        { id: '4', organizationId: '1', serviceDate: date, elderId: '4', routeType, scheduledTime: '08:45', sequence: 4, status: 'PENDING' },
        { id: '5', organizationId: '1', serviceDate: date, elderId: '5', routeType, scheduledTime: '08:50', sequence: 5, status: 'PENDING' },
      ] as any);
    } finally {
      setLoading(false);
    }
  };

  const changeDate = (days: number) => {
    setDate(dayjs(date).add(days, 'day').format('YYYY-MM-DD'));
  };

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await api.put(`/rides/schedules/${id}/status`, { status });
      loadSchedules();
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  const stats = {
    total: schedules.length,
    completed: schedules.filter((s) => s.status === 'ARRIVED').length,
    inProgress: schedules.filter((s) => s.status === 'BOARDING').length,
    pending: schedules.filter((s) => s.status === 'PENDING').length,
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* 날짜 선택 */}
          <div className="flex items-center gap-2 bg-white rounded-lg border px-3 py-2">
            <button onClick={() => changeDate(-1)} className="p-1 hover:bg-gray-100 rounded">
              <ChevronLeft size={18} />
            </button>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="border-none focus:outline-none text-center"
            />
            <button onClick={() => changeDate(1)} className="p-1 hover:bg-gray-100 rounded">
              <ChevronRight size={18} />
            </button>
          </div>

          {/* 등/하원 선택 */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setRouteType('PICKUP')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                routeType === 'PICKUP' ? 'bg-white shadow' : ''
              }`}
            >
              등원
            </button>
            <button
              onClick={() => setRouteType('DROPOFF')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                routeType === 'DROPOFF' ? 'bg-white shadow' : ''
              }`}
            >
              하원
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button className="btn btn-secondary flex items-center gap-2">
            <Upload size={18} />
            CSV 업로드
          </button>
          <button className="btn btn-secondary flex items-center gap-2">
            <Download size={18} />
            다운로드
          </button>
          <button className="btn btn-primary flex items-center gap-2">
            <Plus size={18} />
            스케줄 추가
          </button>
        </div>
      </div>

      {/* 통계 */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard
          icon={Car}
          iconColor="bg-blue-100 text-blue-600"
          label="전체"
          value={stats.total}
        />
        <StatCard
          icon={CheckCircle}
          iconColor="bg-green-100 text-green-600"
          label="완료"
          value={stats.completed}
        />
        <StatCard
          icon={Clock}
          iconColor="bg-yellow-100 text-yellow-600"
          label="진행중"
          value={stats.inProgress}
        />
        <StatCard
          icon={Clock}
          iconColor="bg-gray-100 text-gray-600"
          label="대기"
          value={stats.pending}
        />
      </div>

      {/* 테이블 */}
      <div className="card p-0 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr className="text-left text-sm text-gray-500">
              <th className="px-6 py-4 font-medium">순서</th>
              <th className="px-6 py-4 font-medium">시간</th>
              <th className="px-6 py-4 font-medium">어르신</th>
              <th className="px-6 py-4 font-medium">차량</th>
              <th className="px-6 py-4 font-medium">기사</th>
              <th className="px-6 py-4 font-medium">관리자</th>
              <th className="px-6 py-4 font-medium">상태</th>
              <th className="px-6 py-4 font-medium">액션</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                  로딩 중...
                </td>
              </tr>
            ) : schedules.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                  등록된 송영이 없습니다
                </td>
              </tr>
            ) : (
              schedules.map((schedule, index) => (
                <tr key={schedule.id} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="px-6 py-4 text-gray-600">{index + 1}</td>
                  <td className="px-6 py-4 font-medium text-gray-800">
                    {schedule.scheduledTime}
                  </td>
                  <td className="px-6 py-4 text-gray-800">
                    {/* 실제로는 elder 정보 표시 */}
                    어르신 {schedule.elderId}
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    {schedule.vehicle?.name || '1호차'}
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    {schedule.driver?.name || '김기사'}
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    {schedule.manager?.name || '박관리'}
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={schedule.status} />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {schedule.status === 'PENDING' && (
                        <button
                          onClick={() => handleStatusChange(schedule.id, 'BOARDING')}
                          className="btn btn-secondary text-xs py-1 px-2"
                        >
                          탑승
                        </button>
                      )}
                      {schedule.status === 'BOARDING' && (
                        <button
                          onClick={() => handleStatusChange(schedule.id, 'ARRIVED')}
                          className="btn btn-primary text-xs py-1 px-2"
                        >
                          도착
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
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

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { bg: string; text: string; label: string }> = {
    PENDING: { bg: 'bg-gray-100', text: 'text-gray-600', label: '대기' },
    BOARDING: { bg: 'bg-yellow-100', text: 'text-yellow-600', label: '탑승중' },
    ARRIVED: { bg: 'bg-green-100', text: 'text-green-600', label: '완료' },
    CANCELLED: { bg: 'bg-red-100', text: 'text-red-600', label: '취소' },
    NO_SHOW: { bg: 'bg-gray-100', text: 'text-gray-600', label: '미이용' },
  };
  const c = config[status] || config.PENDING;
  return (
    <span className={`px-2 py-1 text-xs rounded-full ${c.bg} ${c.text}`}>{c.label}</span>
  );
}
