/**
 * 초기 테스트 데이터 생성 스크립트
 * 사용법: npm run seed
 * 
 * ⚠️ 중요: 먼저 npm run start:dev로 서버를 실행해서 테이블을 생성한 후,
 *        서버를 종료하고 이 스크립트를 실행하세요.
 */

import { DataSource } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { config } from 'dotenv';

config();

const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'snd_user',
  password: process.env.DB_PASSWORD || 'snd_password_2024',
  database: process.env.DB_DATABASE || 'snd_db',
});

async function seed() {
  try {
    await dataSource.initialize();
    console.log('📦 데이터베이스 연결 성공\n');

    // 비밀번호 해시
    const adminHash = await bcrypt.hash('admin1234', 10);
    const userHash = await bcrypt.hash('user1234', 10);

    // ========================================
    // 1. 조직 유형(org_type) 생성
    // ========================================
    console.log('🏷️  조직 유형 생성 중...');
    await dataSource.query(`
      INSERT INTO org_type (id, code, name, level, description, created_at, updated_at)
      VALUES 
        (gen_random_uuid(), 'HQ', '본사', 0, '최상위 조직', NOW(), NOW()),
        (gen_random_uuid(), 'CENTER', '주간보호센터', 1, '주간보호센터', NOW(), NOW())
      ON CONFLICT (code) DO NOTHING
    `);
    
    const orgTypes = await dataSource.query(`SELECT id, code, name FROM org_type`);
    const centerTypeId = orgTypes.find((t: any) => t.code === 'CENTER')?.id;
    console.log('✅ 조직 유형:', orgTypes.length, '개');

    if (!centerTypeId) {
      throw new Error('센터 조직 유형을 찾을 수 없습니다');
    }

    // ========================================
    // 2. 조직(organization) 생성
    // ========================================
    console.log('\n🏢 조직 생성 중...');
    await dataSource.query(`
      INSERT INTO organization (id, org_type_id, code, name, address, phone, status, settings, created_at, updated_at)
      VALUES 
        (gen_random_uuid(), $1, 'CENTER001', '아들과딸 주간보호센터 본점', '서울특별시 강남구 테헤란로 123', '02-1234-5678', 'ACTIVE', '{}', NOW(), NOW()),
        (gen_random_uuid(), $1, 'CENTER002', '아들과딸 주간보호센터 분당점', '경기도 성남시 분당구 판교로 456', '031-987-6543', 'ACTIVE', '{}', NOW(), NOW())
      ON CONFLICT (code) DO NOTHING
    `, [centerTypeId]);
    
    const orgs = await dataSource.query(`SELECT id, code, name FROM organization`);
    const mainOrgId = orgs.find((o: any) => o.code === 'CENTER001')?.id;
    console.log('✅ 조직:', orgs.length, '개');

    if (!mainOrgId) {
      throw new Error('본점 조직을 찾을 수 없습니다');
    }

    // ========================================
    // 3. 사용자(user) 생성
    // ========================================
    console.log('\n👤 사용자 생성 중...');
    await dataSource.query(`
      INSERT INTO "user" (id, email, phone, password_hash, name, status, created_at, updated_at)
      VALUES 
        (gen_random_uuid(), 'admin@snd.com', '010-1111-1111', $1, '관리자', 'ACTIVE', NOW(), NOW()),
        (gen_random_uuid(), 'manager@snd.com', '010-2222-2222', $1, '센터장', 'ACTIVE', NOW(), NOW()),
        (gen_random_uuid(), 'staff1@snd.com', '010-3333-3333', $2, '김직원', 'ACTIVE', NOW(), NOW()),
        (gen_random_uuid(), 'staff2@snd.com', '010-4444-4444', $2, '이직원', 'ACTIVE', NOW(), NOW()),
        (gen_random_uuid(), 'driver1@snd.com', '010-5555-5555', $2, '박운전', 'ACTIVE', NOW(), NOW())
      ON CONFLICT (email) DO NOTHING
    `, [adminHash, userHash]);
    
    const users = await dataSource.query(`SELECT id, email, name FROM "user"`);
    console.log('✅ 사용자:', users.length, '명');

    // ========================================
    // 4. 어르신(elder) 생성
    // ========================================
    console.log('\n👴 어르신 생성 중...');
    await dataSource.query(`
      INSERT INTO elder (id, organization_id, name, gender, birth_date, phone, address, care_grade, boarding_location, special_note, status, health_info, created_at, updated_at)
      VALUES 
        (gen_random_uuid(), $1, '홍길동', 'MALE', '1945-03-15', '010-1234-0001', '서울시 강남구 역삼동 123-45', '3등급', '역삼역 2번출구', '당뇨 주의', 'ACTIVE', '{"diabetes": true}', NOW(), NOW()),
        (gen_random_uuid(), $1, '김순자', 'FEMALE', '1948-07-20', '010-1234-0002', '서울시 강남구 삼성동 456-78', '2등급', '삼성역 5번출구', '휠체어 필요', 'ACTIVE', '{"wheelchair": true}', NOW(), NOW()),
        (gen_random_uuid(), $1, '박영수', 'MALE', '1942-11-08', '010-1234-0003', '서울시 서초구 반포동 789-01', '4등급', '고속터미널역 3번출구', '청력 저하', 'ACTIVE', '{"hearingAid": true}', NOW(), NOW()),
        (gen_random_uuid(), $1, '이영희', 'FEMALE', '1950-01-25', '010-1234-0004', '서울시 송파구 잠실동 234-56', '3등급', '잠실역 8번출구', '', 'ACTIVE', '{}', NOW(), NOW()),
        (gen_random_uuid(), $1, '최만복', 'MALE', '1947-05-12', '010-1234-0005', '서울시 강동구 천호동 567-89', '2등급', '천호역 1번출구', '고혈압 주의', 'ACTIVE', '{"hypertension": true}', NOW(), NOW())
      ON CONFLICT DO NOTHING
    `, [mainOrgId]);
    
    const elders = await dataSource.query(`SELECT id, name FROM elder`);
    console.log('✅ 어르신:', elders.length, '명');

    // ========================================
    // 5. 방송 템플릿(broadcast_template) 생성
    // ========================================
    console.log('\n📢 방송 템플릿 생성 중...');
    await dataSource.query(`
      INSERT INTO broadcast_template (id, organization_id, name, content_type, text_content, duration_sec, tts_settings, target_type, target_ids, is_emergency, is_system, created_at, updated_at)
      VALUES 
        (gen_random_uuid(), $1, '아침 인사', 'TEXT', '안녕하세요. 아들과딸 주간보호센터입니다. 오늘 하루도 건강하고 행복하게 보내세요.', 10, '{"speed": 1.0, "voice": "default", "repeat": 1}', 'HALL', ARRAY[]::uuid[], false, false, NOW(), NOW()),
        (gen_random_uuid(), $1, '식사 안내', 'TEXT', '점심 식사 시간입니다. 식당으로 이동해 주세요.', 5, '{"speed": 1.0, "voice": "default", "repeat": 1}', 'ALL', ARRAY[]::uuid[], false, false, NOW(), NOW()),
        (gen_random_uuid(), $1, '프로그램 시작', 'TEXT', '잠시 후 오후 프로그램이 시작됩니다. 활동실로 모여주세요.', 5, '{"speed": 1.0, "voice": "default", "repeat": 1}', 'HALL', ARRAY[]::uuid[], false, false, NOW(), NOW()),
        (gen_random_uuid(), $1, '송영 안내', 'TEXT', '하원 송영 시간입니다. 짐을 챙기시고 현관으로 이동해 주세요.', 5, '{"speed": 1.0, "voice": "default", "repeat": 1}', 'ALL', ARRAY[]::uuid[], false, false, NOW(), NOW()),
        (gen_random_uuid(), $1, '낙상 주의', 'TEXT', '어르신들의 안전을 위해 천천히 이동해 주세요. 낙상에 주의하세요.', 5, '{"speed": 1.2, "voice": "default", "repeat": 2}', 'HALL', ARRAY[]::uuid[], true, false, NOW(), NOW())
      ON CONFLICT DO NOTHING
    `, [mainOrgId]);
    
    const templates = await dataSource.query(`SELECT id, name FROM broadcast_template`);
    console.log('✅ 방송 템플릿:', templates.length, '개');

    // ========================================
    // 완료 메시지
    // ========================================
    console.log('\n' + '═'.repeat(55));
    console.log('🎉 초기 데이터 생성 완료!');
    console.log('═'.repeat(55));
    console.log('\n📋 테스트 계정 정보:');
    console.log('┌─────────────┬────────────────────┬────────────┐');
    console.log('│ 역할        │ 이메일             │ 비밀번호   │');
    console.log('├─────────────┼────────────────────┼────────────┤');
    console.log('│ 관리자      │ admin@snd.com      │ admin1234  │');
    console.log('│ 센터장      │ manager@snd.com    │ admin1234  │');
    console.log('│ 직원        │ staff1@snd.com     │ user1234   │');
    console.log('│ 직원        │ staff2@snd.com     │ user1234   │');
    console.log('│ 운전기사    │ driver1@snd.com    │ user1234   │');
    console.log('└─────────────┴────────────────────┴────────────┘');
    console.log('\n📊 생성된 데이터:');
    console.log(`   • 조직 유형: ${orgTypes.length}개`);
    console.log(`   • 센터: ${orgs.length}개`);
    console.log(`   • 사용자: ${users.length}명`);
    console.log(`   • 어르신: ${elders.length}명`);
    console.log(`   • 방송 템플릿: ${templates.length}개`);

  } catch (error: any) {
    console.error('\n❌ 시드 실행 중 오류:', error.message);
    
    if (error.message.includes('relation') && error.message.includes('does not exist')) {
      console.log('\n💡 해결 방법:');
      console.log('   1. 먼저 backend 서버를 실행하세요: npm run start:dev');
      console.log('   2. "Nest application successfully started" 메시지 확인');
      console.log('   3. Ctrl+C로 서버를 종료');
      console.log('   4. 다시 npm run seed를 실행');
    }
    
    if (error.message.includes('duplicate key')) {
      console.log('\n💡 이미 데이터가 존재합니다. 기존 데이터를 사용하세요.');
    }
  } finally {
    await dataSource.destroy();
    console.log('\n📦 데이터베이스 연결 종료');
  }
}

seed();
