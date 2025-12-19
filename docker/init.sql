-- =============================================
-- 아들과딸 주간보호센터 통합 시스템 DB 스키마
-- =============================================

-- UUID 확장 활성화
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- 1. 기반 시스템 테이블
-- =============================================

-- 조직 유형 (본사, 센터 등)
CREATE TABLE org_type (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    level INT NOT NULL DEFAULT 0,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 조직 (본사, 각 센터)
CREATE TABLE organization (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_type_id UUID NOT NULL REFERENCES org_type(id),
    parent_id UUID REFERENCES organization(id),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    address VARCHAR(300),
    phone VARCHAR(20),
    status VARCHAR(20) DEFAULT 'ACTIVE',
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 사용자
CREATE TABLE "user" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE,
    phone VARCHAR(20) UNIQUE,
    password_hash VARCHAR(255),
    name VARCHAR(100) NOT NULL,
    profile_image VARCHAR(500),
    status VARCHAR(20) DEFAULT 'ACTIVE',
    last_login_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 사용자-조직 연결 (다대다)
CREATE TABLE user_organization (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
    is_primary BOOLEAN DEFAULT false,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, organization_id)
);

-- 소셜 로그인 제공자
CREATE TABLE auth_provider (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    provider VARCHAR(50) NOT NULL,
    provider_user_id VARCHAR(255) NOT NULL,
    access_token TEXT,
    refresh_token TEXT,
    token_expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(provider, provider_user_id)
);

-- 사용자 디바이스 (푸시 토큰)
CREATE TABLE user_device (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    device_type VARCHAR(20) NOT NULL,
    device_token VARCHAR(500),
    device_info JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    last_used_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 기능 정의
CREATE TABLE feature (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    module VARCHAR(50) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true
);

-- 권한 정의
CREATE TABLE permission (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    feature_id UUID NOT NULL REFERENCES feature(id) ON DELETE CASCADE,
    action VARCHAR(50) NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    UNIQUE(feature_id, action)
);

-- 역할
CREATE TABLE role (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organization(id) ON DELETE CASCADE,
    code VARCHAR(50) NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_system BOOLEAN DEFAULT false,
    level INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 역할-권한 연결
CREATE TABLE role_permission (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    role_id UUID NOT NULL REFERENCES role(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES permission(id) ON DELETE CASCADE,
    UNIQUE(role_id, permission_id)
);

-- 사용자-역할 연결
CREATE TABLE user_role (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES role(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    assigned_by UUID REFERENCES "user"(id),
    UNIQUE(user_id, role_id, organization_id)
);

-- 리프레시 토큰
CREATE TABLE refresh_token (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    token VARCHAR(500) UNIQUE NOT NULL,
    device_id UUID REFERENCES user_device(id),
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- 2. 어르신/보호자 테이블
-- =============================================

-- 어르신
CREATE TABLE elder (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organization(id),
    name VARCHAR(100) NOT NULL,
    birth_date DATE,
    gender VARCHAR(10),
    phone VARCHAR(20),
    address VARCHAR(300),
    care_grade VARCHAR(20),
    contract_start_date DATE,
    contract_end_date DATE,
    boarding_location VARCHAR(200),
    boarding_note TEXT,
    health_info JSONB DEFAULT '{}',
    special_note TEXT,
    profile_image VARCHAR(500),
    status VARCHAR(20) DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 보호자
CREATE TABLE guardian (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    relationship VARCHAR(50),
    address VARCHAR(300),
    is_emergency_contact BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 어르신-보호자 연결
CREATE TABLE elder_guardian (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    elder_id UUID NOT NULL REFERENCES elder(id) ON DELETE CASCADE,
    guardian_id UUID NOT NULL REFERENCES guardian(id) ON DELETE CASCADE,
    is_primary BOOLEAN DEFAULT false,
    UNIQUE(elder_id, guardian_id)
);

-- =============================================
-- 3. 송영 테이블
-- =============================================

-- 차량
CREATE TABLE vehicle (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organization(id),
    name VARCHAR(100) NOT NULL,
    plate_number VARCHAR(20) NOT NULL,
    capacity INT DEFAULT 10,
    vehicle_type VARCHAR(50),
    status VARCHAR(20) DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 송영 템플릿 (어르신별 기본 설정)
CREATE TABLE ride_template (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    elder_id UUID NOT NULL REFERENCES elder(id) ON DELETE CASCADE,
    route_type VARCHAR(20) NOT NULL,
    default_time TIME NOT NULL,
    default_vehicle_id UUID REFERENCES vehicle(id),
    default_driver_id UUID REFERENCES "user"(id),
    weekdays VARCHAR(20) DEFAULT '1,2,3,4,5',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(elder_id, route_type)
);

-- 송영 스케줄 (일별)
CREATE TABLE ride_schedule (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organization(id),
    service_date DATE NOT NULL,
    elder_id UUID NOT NULL REFERENCES elder(id),
    route_type VARCHAR(20) NOT NULL,
    scheduled_time TIME NOT NULL,
    vehicle_id UUID REFERENCES vehicle(id),
    driver_id UUID REFERENCES "user"(id),
    manager_ids UUID[] DEFAULT '{}',
    sequence INT,
    status VARCHAR(20) DEFAULT 'WAITING',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(service_date, elder_id, route_type)
);

-- 송영 기록 (상태 변경 로그)
CREATE TABLE ride_record (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    schedule_id UUID NOT NULL REFERENCES ride_schedule(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL,
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    recorded_by UUID REFERENCES "user"(id),
    location JSONB,
    note TEXT
);

-- 출결
CREATE TABLE attendance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organization(id),
    elder_id UUID NOT NULL REFERENCES elder(id),
    service_date DATE NOT NULL,
    status VARCHAR(20) NOT NULL,
    check_in_time TIMESTAMP,
    check_out_time TIMESTAMP,
    pickup_schedule_id UUID REFERENCES ride_schedule(id),
    dropoff_schedule_id UUID REFERENCES ride_schedule(id),
    note TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(elder_id, service_date)
);

-- =============================================
-- 4. 방송 테이블
-- =============================================

-- 방송 템플릿
CREATE TABLE broadcast_template (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organization(id),
    name VARCHAR(200) NOT NULL,
    content_type VARCHAR(20) NOT NULL,
    text_content TEXT,
    media_url VARCHAR(500),
    duration_sec INT DEFAULT 30,
    tts_settings JSONB DEFAULT '{"speed": 1.0, "voice": "default", "repeat": 1}',
    target_type VARCHAR(20) DEFAULT 'HALL',
    target_ids UUID[] DEFAULT '{}',
    is_emergency BOOLEAN DEFAULT false,
    is_system BOOLEAN DEFAULT false,
    created_by UUID REFERENCES "user"(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 방송 스케줄
CREATE TABLE broadcast_schedule (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organization(id),
    template_id UUID NOT NULL REFERENCES broadcast_template(id),
    name VARCHAR(200) NOT NULL,
    repeat_type VARCHAR(20) DEFAULT 'DAILY',
    repeat_config JSONB DEFAULT '{}',
    scheduled_time TIME NOT NULL,
    start_date DATE,
    end_date DATE,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES "user"(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 방송 실행 로그
CREATE TABLE broadcast_run (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    schedule_id UUID REFERENCES broadcast_schedule(id),
    template_id UUID NOT NULL REFERENCES broadcast_template(id),
    organization_id UUID NOT NULL REFERENCES organization(id),
    run_type VARCHAR(20) NOT NULL,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMP,
    status VARCHAR(20) DEFAULT 'RUNNING',
    target_devices JSONB DEFAULT '[]',
    result JSONB DEFAULT '{}',
    triggered_by UUID REFERENCES "user"(id)
);

-- 방송 파일 (슬라이드 이미지 등)
CREATE TABLE broadcast_file (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organization(id),
    file_type VARCHAR(20) NOT NULL,
    file_url VARCHAR(500) NOT NULL,
    file_name VARCHAR(200),
    display_order INT DEFAULT 0,
    duration_sec INT DEFAULT 5,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- 5. 업무 테이블
-- =============================================

-- 업무 카테고리
CREATE TABLE task_category (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organization(id),
    name VARCHAR(100) NOT NULL,
    color VARCHAR(20) DEFAULT '#3B82F6',
    icon VARCHAR(50),
    display_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 업무 템플릿
CREATE TABLE task_template (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organization(id),
    category_id UUID REFERENCES task_category(id),
    name VARCHAR(200) NOT NULL,
    description TEXT,
    default_assignee_type VARCHAR(20),
    default_assignee_ids UUID[] DEFAULT '{}',
    estimated_minutes INT,
    checklist JSONB DEFAULT '[]',
    approval_required BOOLEAN DEFAULT false,
    approver_id UUID REFERENCES "user"(id),
    repeat_type VARCHAR(20),
    repeat_config JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 업무
CREATE TABLE task (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organization(id),
    template_id UUID REFERENCES task_template(id),
    category_id UUID REFERENCES task_category(id),
    name VARCHAR(200) NOT NULL,
    description TEXT,
    priority VARCHAR(20) DEFAULT 'NORMAL',
    due_at TIMESTAMP,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    status VARCHAR(20) DEFAULT 'PENDING',
    checklist JSONB DEFAULT '[]',
    result_note TEXT,
    result_files JSONB DEFAULT '[]',
    approval_required BOOLEAN DEFAULT false,
    approval_status VARCHAR(20),
    created_by UUID REFERENCES "user"(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 업무 담당자
CREATE TABLE task_assignee (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID NOT NULL REFERENCES task(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES "user"(id),
    status VARCHAR(20) DEFAULT 'PENDING',
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    note TEXT,
    UNIQUE(task_id, user_id)
);

-- 업무 결재
CREATE TABLE task_approval (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID NOT NULL REFERENCES task(id) ON DELETE CASCADE,
    approver_id UUID NOT NULL REFERENCES "user"(id),
    approval_level INT DEFAULT 1,
    status VARCHAR(20) DEFAULT 'PENDING',
    comment TEXT,
    approved_at TIMESTAMP,
    UNIQUE(task_id, approver_id, approval_level)
);

-- 업무 이력
CREATE TABLE task_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID NOT NULL REFERENCES task(id) ON DELETE CASCADE,
    action VARCHAR(50) NOT NULL,
    actor_id UUID REFERENCES "user"(id),
    prev_value JSONB,
    new_value JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- 6. 공통 테이블
-- =============================================

-- 알림
CREATE TABLE notification (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organization(id),
    type VARCHAR(50) NOT NULL,
    title VARCHAR(200) NOT NULL,
    body TEXT,
    data JSONB DEFAULT '{}',
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 파일
CREATE TABLE file (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organization(id),
    uploader_id UUID REFERENCES "user"(id),
    file_type VARCHAR(50),
    file_name VARCHAR(200) NOT NULL,
    file_url VARCHAR(500) NOT NULL,
    file_size BIGINT,
    mime_type VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 설정
CREATE TABLE setting (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organization(id),
    user_id UUID REFERENCES "user"(id),
    category VARCHAR(50) NOT NULL,
    key VARCHAR(100) NOT NULL,
    value JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(organization_id, user_id, category, key)
);

-- 활동 로그
CREATE TABLE activity_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organization(id),
    user_id UUID REFERENCES "user"(id),
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50),
    entity_id UUID,
    details JSONB DEFAULT '{}',
    ip_address VARCHAR(50),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- 7. 인덱스 생성
-- =============================================

CREATE INDEX idx_user_organization_user ON user_organization(user_id);
CREATE INDEX idx_user_organization_org ON user_organization(organization_id);
CREATE INDEX idx_user_role_user ON user_role(user_id);
CREATE INDEX idx_user_role_org ON user_role(organization_id);
CREATE INDEX idx_elder_org ON elder(organization_id);
CREATE INDEX idx_elder_status ON elder(status);
CREATE INDEX idx_ride_schedule_date ON ride_schedule(service_date);
CREATE INDEX idx_ride_schedule_org ON ride_schedule(organization_id);
CREATE INDEX idx_ride_schedule_elder ON ride_schedule(elder_id);
CREATE INDEX idx_attendance_date ON attendance(service_date);
CREATE INDEX idx_attendance_elder ON attendance(elder_id);
CREATE INDEX idx_broadcast_schedule_org ON broadcast_schedule(organization_id);
CREATE INDEX idx_task_org ON task(organization_id);
CREATE INDEX idx_task_status ON task(status);
CREATE INDEX idx_task_due ON task(due_at);
CREATE INDEX idx_task_assignee_user ON task_assignee(user_id);
CREATE INDEX idx_notification_user ON notification(user_id);
CREATE INDEX idx_notification_read ON notification(is_read);
CREATE INDEX idx_activity_log_org ON activity_log(organization_id);
CREATE INDEX idx_activity_log_user ON activity_log(user_id);
CREATE INDEX idx_activity_log_created ON activity_log(created_at);

-- =============================================
-- 8. 초기 데이터
-- =============================================

-- 조직 유형
INSERT INTO org_type (code, name, level, description) VALUES
('HEADQUARTERS', '본사', 0, '시스템 전체 관리'),
('CENTER', '센터', 1, '주간보호센터');

-- 시스템 역할
INSERT INTO role (code, name, description, is_system, level) VALUES
('SYSTEM_ADMIN', '시스템 관리자', '전체 시스템 관리', true, 100),
('SUPER_ADMIN', '총관리자', '전체 센터 관리', true, 90),
('CENTER_ADMIN', '센터 관리자', '소속 센터 관리', true, 50),
('STAFF', '직원', '현장 업무 수행', true, 10);

-- 기능 정의
INSERT INTO feature (code, name, module) VALUES
('USER_MANAGEMENT', '사용자 관리', 'USER'),
('ORGANIZATION_MANAGEMENT', '조직 관리', 'ORGANIZATION'),
('ELDER_MANAGEMENT', '어르신 관리', 'ELDER'),
('RIDE_MANAGEMENT', '송영 관리', 'RIDE'),
('BROADCAST_MANAGEMENT', '방송 관리', 'BROADCAST'),
('TASK_MANAGEMENT', '업무 관리', 'TASK'),
('REPORT_VIEW', '리포트 조회', 'REPORT'),
('SETTING_MANAGEMENT', '설정 관리', 'SETTING');

-- 권한 정의
INSERT INTO permission (feature_id, action, name, description)
SELECT f.id, a.action, f.name || ' ' || a.action_name, f.name || ' ' || a.action_name || ' 권한'
FROM feature f
CROSS JOIN (
    VALUES 
        ('CREATE', '생성'),
        ('READ', '조회'),
        ('UPDATE', '수정'),
        ('DELETE', '삭제')
) AS a(action, action_name);

-- 업무 카테고리 (기본)
INSERT INTO task_category (name, color, icon, display_order) VALUES
('어르신 케어', '#10B981', 'heart', 1),
('시설 관리', '#F59E0B', 'building', 2),
('행정 업무', '#3B82F6', 'document', 3),
('안전 점검', '#EF4444', 'shield', 4),
('기타', '#6B7280', 'dots', 99);

COMMIT;
