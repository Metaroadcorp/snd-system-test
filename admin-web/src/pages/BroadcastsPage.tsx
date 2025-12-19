import { useState, useEffect } from 'react';
import {
  Plus,
  Play,
  Pause,
  Calendar,
  Clock,
  Volume2,
  Image,
  Video,
  FileText,
  Edit,
  Trash2,
  Upload,
  Download,
} from 'lucide-react';
import api from '@/services/api';
import type { BroadcastTemplate, BroadcastSchedule } from '@/types';
import dayjs from 'dayjs';

export default function BroadcastsPage() {
  const [tab, setTab] = useState<'schedule' | 'template' | 'button'>('schedule');
  const [templates, setTemplates] = useState<BroadcastTemplate[]>([]);
  const [schedules, setSchedules] = useState<BroadcastSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'template' | 'schedule'>('template');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // 템플릿 로드
      // const templatesRes = await api.get('/broadcasts/templates');
      // 스케줄 로드
      // const schedulesRes = await api.get('/broadcasts/schedules');
      
      // 샘플 데이터
      setTemplates([
        { id: '1', organizationId: '1', name: '오픈/안전점검', contentType: 'TEXT', textContent: '좋은 아침입니다. 센터가 오픈되었습니다.', durationSec: 30, ttsEnabled: true, targetType: 'HALL', isUrgent: false },
        { id: '2', organizationId: '1', name: '등원 안내', contentType: 'TEXT', textContent: '어르신들께서 등원하고 계십니다.', durationSec: 30, ttsEnabled: true, targetType: 'ALL', isUrgent: false },
        { id: '3', organizationId: '1', name: '점심 준비', contentType: 'TEXT', textContent: '점심 식사 준비를 시작합니다.', durationSec: 30, ttsEnabled: true, targetType: 'HALL', isUrgent: false },
        { id: '4', organizationId: '1', name: '낙상 주의', contentType: 'TEXT', textContent: '어르신 이동 시 낙상에 주의해주세요.', durationSec: 30, ttsEnabled: true, targetType: 'ALL', isUrgent: true },
      ]);

      setSchedules([
        { id: '1', templateId: '1', repeatType: 'DAILY', scheduledTime: '07:30', startDate: '2024-01-01', isActive: true },
        { id: '2', templateId: '2', repeatType: 'DAILY', scheduledTime: '08:00', startDate: '2024-01-01', isActive: true },
        { id: '3', templateId: '3', repeatType: 'DAILY', scheduledTime: '11:30', startDate: '2024-01-01', isActive: true },
      ] as any);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRunNow = async (templateId: string) => {
    try {
      await api.post('/broadcasts/run', { templateId, runType: 'MANUAL' });
      alert('방송이 시작되었습니다');
    } catch (error) {
      console.error('Failed to run broadcast:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* 탭 */}
      <div className="flex items-center justify-between">
        <div className="flex bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setTab('schedule')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              tab === 'schedule' ? 'bg-white shadow' : ''
            }`}
          >
            스케줄
          </button>
          <button
            onClick={() => setTab('template')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              tab === 'template' ? 'bg-white shadow' : ''
            }`}
          >
            템플릿
          </button>
          <button
            onClick={() => setTab('button')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              tab === 'button' ? 'bg-white shadow' : ''
            }`}
          >
            버튼
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button className="btn btn-secondary flex items-center gap-2">
            <Download size={18} />
            설정 내보내기
          </button>
          <button className="btn btn-secondary flex items-center gap-2">
            <Upload size={18} />
            설정 가져오기
          </button>
          <button
            onClick={() => {
              setModalType(tab === 'schedule' ? 'schedule' : 'template');
              setShowModal(true);
            }}
            className="btn btn-primary flex items-center gap-2"
          >
            <Plus size={18} />
            {tab === 'schedule' ? '스케줄 추가' : tab === 'template' ? '템플릿 추가' : '버튼 추가'}
          </button>
        </div>
      </div>

      {/* 오늘의 방송 타임라인 */}
      {tab === 'schedule' && (
        <div className="card">
          <h3 className="font-semibold mb-4">오늘의 방송 타임라인</h3>
          <div className="relative">
            {/* 타임라인 */}
            <div className="absolute left-4 top-0 bottom-0 w-px bg-gray-200" />
            <div className="space-y-4">
              {schedules.map((schedule) => {
                const template = templates.find((t) => t.id === schedule.templateId);
                return (
                  <div key={schedule.id} className="flex items-start gap-4 pl-8 relative">
                    <div className="absolute left-2 top-2 w-4 h-4 rounded-full bg-primary-500 border-2 border-white" />
                    <div className="flex-1 bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-sm text-gray-500 mr-2">
                            {schedule.scheduledTime}
                          </span>
                          <span className="font-medium">{template?.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleRunNow(schedule.templateId)}
                            className="btn btn-secondary text-xs py-1 px-2 flex items-center gap-1"
                          >
                            <Play size={14} />
                            즉시 실행
                          </button>
                          <button className="btn btn-secondary text-xs py-1 px-2">
                            <Edit size={14} />
                          </button>
                        </div>
                      </div>
                      <p className="text-sm text-gray-500 mt-2">{template?.textContent}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 템플릿 목록 */}
      {tab === 'template' && (
        <div className="grid grid-cols-2 gap-4">
          {templates.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              onRun={() => handleRunNow(template.id)}
            />
          ))}
        </div>
      )}

      {/* 버튼 목록 */}
      {tab === 'button' && (
        <div className="space-y-6">
          <div className="card">
            <h4 className="font-medium text-gray-700 mb-4">안전/응급</h4>
            <div className="flex flex-wrap gap-3">
              <BroadcastButton label="낙상 주의" color="red" onClick={() => handleRunNow('4')} />
              <BroadcastButton label="휠체어 브레이크" color="yellow" onClick={() => {}} />
              <BroadcastButton label="응급 프로토콜" color="red" onClick={() => {}} />
            </div>
          </div>
          <div className="card">
            <h4 className="font-medium text-gray-700 mb-4">운영 루틴</h4>
            <div className="flex flex-wrap gap-3">
              <BroadcastButton label="손위생" color="blue" onClick={() => {}} />
              <BroadcastButton label="수분 섭취" color="blue" onClick={() => {}} />
              <BroadcastButton label="체조 시작" color="green" onClick={() => {}} />
              <BroadcastButton label="식사 준비" color="green" onClick={() => handleRunNow('3')} />
              <BroadcastButton label="송영 출발" color="blue" onClick={() => {}} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TemplateCard({
  template,
  onRun,
}: {
  template: BroadcastTemplate;
  onRun: () => void;
}) {
  const typeIcon = {
    TEXT: FileText,
    IMAGE: Image,
    VIDEO: Video,
    AUDIO: Volume2,
    SLIDE: Image,
  };
  const Icon = typeIcon[template.contentType] || FileText;

  return (
    <div className="card">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gray-100 rounded-lg">
            <Icon size={20} className="text-gray-600" />
          </div>
          <div>
            <h4 className="font-medium">{template.name}</h4>
            <p className="text-sm text-gray-500">
              {template.durationSec}초 · {template.ttsEnabled ? 'TTS' : '무음'}
            </p>
          </div>
        </div>
        {template.isUrgent && (
          <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-600">긴급</span>
        )}
      </div>
      <p className="text-sm text-gray-600 mt-3 line-clamp-2">{template.textContent}</p>
      <div className="flex items-center gap-2 mt-4">
        <button onClick={onRun} className="btn btn-primary text-sm flex-1 flex items-center justify-center gap-1">
          <Play size={16} />
          즉시 실행
        </button>
        <button className="btn btn-secondary text-sm">
          <Edit size={16} />
        </button>
        <button className="btn btn-secondary text-sm text-red-500">
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
}

function BroadcastButton({
  label,
  color,
  onClick,
}: {
  label: string;
  color: 'red' | 'yellow' | 'green' | 'blue';
  onClick: () => void;
}) {
  const colors = {
    red: 'bg-red-500 hover:bg-red-600',
    yellow: 'bg-yellow-500 hover:bg-yellow-600',
    green: 'bg-green-500 hover:bg-green-600',
    blue: 'bg-blue-500 hover:bg-blue-600',
  };

  return (
    <button
      onClick={onClick}
      className={`px-6 py-3 rounded-lg text-white font-medium transition-colors ${colors[color]}`}
    >
      {label}
    </button>
  );
}
