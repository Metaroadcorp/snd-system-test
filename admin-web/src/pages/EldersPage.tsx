import { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, Eye } from 'lucide-react';
import api from '@/services/api';
import type { Elder } from '@/types';
import dayjs from 'dayjs';

export default function EldersPage() {
  const [elders, setElders] = useState<Elder[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedElder, setSelectedElder] = useState<Elder | null>(null);

  useEffect(() => {
    loadElders();
  }, []);

  const loadElders = async () => {
    try {
      const res = await api.get('/elders');
      if (res.data.success) {
        setElders(res.data.data);
      }
    } catch (error) {
      console.error('Failed to load elders:', error);
      // 샘플 데이터
      setElders([
        { id: '1', organizationId: '1', name: '김영희', birthDate: '1945-03-15', gender: 'FEMALE', phone: '010-1234-5678', address: '서울시 강남구', careGrade: '3등급', status: 'ACTIVE' },
        { id: '2', organizationId: '1', name: '이순자', birthDate: '1942-07-22', gender: 'FEMALE', phone: '010-2345-6789', address: '서울시 서초구', careGrade: '2등급', status: 'ACTIVE' },
        { id: '3', organizationId: '1', name: '박철수', birthDate: '1940-11-08', gender: 'MALE', phone: '010-3456-7890', address: '서울시 송파구', careGrade: '4등급', status: 'ACTIVE' },
        { id: '4', organizationId: '1', name: '정미경', birthDate: '1948-01-30', gender: 'FEMALE', phone: '010-4567-8901', address: '서울시 강동구', careGrade: '3등급', status: 'ACTIVE' },
        { id: '5', organizationId: '1', name: '최동수', birthDate: '1938-09-12', gender: 'MALE', phone: '010-5678-9012', address: '서울시 광진구', careGrade: '5등급', status: 'SUSPENDED' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const filteredElders = elders.filter(
    (elder) =>
      elder.name.includes(search) ||
      elder.phone?.includes(search) ||
      elder.address?.includes(search)
  );

  const calculateAge = (birthDate: string) => {
    return dayjs().diff(dayjs(birthDate), 'year');
  };

  const handleEdit = (elder: Elder) => {
    setSelectedElder(elder);
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;
    try {
      await api.delete(`/elders/${id}`);
      setElders(elders.filter((e) => e.id !== id));
    } catch (error) {
      console.error('Failed to delete elder:', error);
    }
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
              placeholder="이름, 연락처, 주소 검색"
              className="input pl-10 w-64"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
        <button
          onClick={() => {
            setSelectedElder(null);
            setShowModal(true);
          }}
          className="btn btn-primary flex items-center gap-2"
        >
          <Plus size={18} />
          어르신 등록
        </button>
      </div>

      {/* 통계 */}
      <div className="grid grid-cols-4 gap-4">
        <div className="card">
          <p className="text-sm text-gray-500">전체</p>
          <p className="text-2xl font-bold">{elders.length}명</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500">이용중</p>
          <p className="text-2xl font-bold text-green-600">
            {elders.filter((e) => e.status === 'ACTIVE').length}명
          </p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500">휴원</p>
          <p className="text-2xl font-bold text-yellow-600">
            {elders.filter((e) => e.status === 'SUSPENDED').length}명
          </p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500">퇴원</p>
          <p className="text-2xl font-bold text-gray-400">
            {elders.filter((e) => e.status === 'INACTIVE').length}명
          </p>
        </div>
      </div>

      {/* 테이블 */}
      <div className="card p-0 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr className="text-left text-sm text-gray-500">
              <th className="px-6 py-4 font-medium">이름</th>
              <th className="px-6 py-4 font-medium">나이/성별</th>
              <th className="px-6 py-4 font-medium">연락처</th>
              <th className="px-6 py-4 font-medium">주소</th>
              <th className="px-6 py-4 font-medium">등급</th>
              <th className="px-6 py-4 font-medium">상태</th>
              <th className="px-6 py-4 font-medium">관리</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                  로딩 중...
                </td>
              </tr>
            ) : filteredElders.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                  등록된 어르신이 없습니다
                </td>
              </tr>
            ) : (
              filteredElders.map((elder) => (
                <tr key={elder.id} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-800">{elder.name}</td>
                  <td className="px-6 py-4 text-gray-600">
                    {calculateAge(elder.birthDate)}세 / {elder.gender === 'MALE' ? '남' : '여'}
                  </td>
                  <td className="px-6 py-4 text-gray-600">{elder.phone}</td>
                  <td className="px-6 py-4 text-gray-600 max-w-xs truncate">{elder.address}</td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-600">
                      {elder.careGrade}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={elder.status} />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEdit(elder)}
                        className="p-1 hover:bg-gray-100 rounded"
                      >
                        <Edit size={16} className="text-gray-500" />
                      </button>
                      <button
                        onClick={() => handleDelete(elder.id)}
                        className="p-1 hover:bg-gray-100 rounded"
                      >
                        <Trash2 size={16} className="text-red-500" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 모달 (간략화) */}
      {showModal && (
        <ElderModal
          elder={selectedElder}
          onClose={() => setShowModal(false)}
          onSave={() => {
            setShowModal(false);
            loadElders();
          }}
        />
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { bg: string; text: string; label: string }> = {
    ACTIVE: { bg: 'bg-green-100', text: 'text-green-600', label: '이용중' },
    INACTIVE: { bg: 'bg-gray-100', text: 'text-gray-600', label: '퇴원' },
    SUSPENDED: { bg: 'bg-yellow-100', text: 'text-yellow-600', label: '휴원' },
  };
  const c = config[status] || config.INACTIVE;
  return (
    <span className={`px-2 py-1 text-xs rounded-full ${c.bg} ${c.text}`}>{c.label}</span>
  );
}

function ElderModal({
  elder,
  onClose,
  onSave,
}: {
  elder: Elder | null;
  onClose: () => void;
  onSave: () => void;
}) {
  const [form, setForm] = useState({
    name: elder?.name || '',
    birthDate: elder?.birthDate || '',
    gender: elder?.gender || 'MALE' as 'MALE' | 'FEMALE',
    phone: elder?.phone || '',
    address: elder?.address || '',
    careGrade: elder?.careGrade || '',
    boardingLocation: elder?.boardingLocation || '',
    specialNote: elder?.specialNote || '',
    status: elder?.status || 'ACTIVE' as 'ACTIVE' | 'INACTIVE' | 'SUSPENDED',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (elder) {
        await api.put(`/elders/${elder.id}`, form);
      } else {
        await api.post('/elders', form);
      }
      onSave();
    } catch (error) {
      console.error('Failed to save elder:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-semibold mb-4">
          {elder ? '어르신 정보 수정' : '어르신 등록'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">이름</label>
              <input
                type="text"
                className="input"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">생년월일</label>
              <input
                type="date"
                className="input"
                value={form.birthDate}
                onChange={(e) => setForm({ ...form, birthDate: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">성별</label>
              <select
                className="input"
                value={form.gender}
                onChange={(e) => setForm({ ...form, gender: e.target.value as 'MALE' | 'FEMALE' })}
              >
                <option value="MALE">남</option>
                <option value="FEMALE">여</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">연락처</label>
              <input
                type="tel"
                className="input"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">주소</label>
              <input
                type="text"
                className="input"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">등급</label>
              <select
                className="input"
                value={form.careGrade}
                onChange={(e) => setForm({ ...form, careGrade: e.target.value })}
              >
                <option value="">선택</option>
                <option value="1등급">1등급</option>
                <option value="2등급">2등급</option>
                <option value="3등급">3등급</option>
                <option value="4등급">4등급</option>
                <option value="5등급">5등급</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">상태</label>
              <select
                className="input"
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as any })}
              >
                <option value="ACTIVE">이용중</option>
                <option value="SUSPENDED">휴원</option>
                <option value="INACTIVE">퇴원</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">승차 위치</label>
              <input
                type="text"
                className="input"
                value={form.boardingLocation}
                onChange={(e) => setForm({ ...form, boardingLocation: e.target.value })}
                placeholder="예: 역삼역 2번출구"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">특이사항</label>
              <textarea
                className="input"
                rows={2}
                value={form.specialNote}
                onChange={(e) => setForm({ ...form, specialNote: e.target.value })}
                placeholder="특이사항을 입력하세요"
              />
            </div>
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
