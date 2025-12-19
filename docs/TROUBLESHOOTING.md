# 트러블슈팅 가이드 (상세)

이 문서는 설치 및 실행 중 발생할 수 있는 문제들과 해결 방법을 상세히 설명합니다.

---

## 🔴 DB 연결 문제들

### 문제: "password authentication failed"

```
error: password authentication failed for user "snd_user"
```

**왜 발생하는가?**

1. **기존 Docker 볼륨 충돌**: PostgreSQL Docker 이미지는 볼륨이 비어있을 때만 `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB` 환경변수를 사용하여 초기 설정을 합니다. 이미 볼륨에 데이터가 있으면 환경변수를 무시합니다.

2. **pgAdmin으로 수동 생성한 DB**: pgAdmin에서 다른 이름/비밀번호로 DB를 생성했다면 충돌이 발생합니다.

3. **.env 파일과 docker-compose.yml 불일치**: 두 파일의 DB 설정이 다르면 연결 실패합니다.

**해결 방법:**

```bash
# 완전 초기화 (모든 데이터 삭제됨!)
cd docker
docker-compose down -v    # -v 옵션이 볼륨을 삭제함
docker-compose up -d      # 새로 시작하면 init.sql이 실행됨
```

---

### 문제: "init.sql이 실행되지 않음"

**왜 발생하는가?**

PostgreSQL Docker 이미지의 동작 방식:
- `/docker-entrypoint-initdb.d/` 안의 스크립트는 **볼륨이 비어있을 때만** 실행됩니다
- 이미 DB 데이터가 있으면 스크립트를 건너뜁니다 (데이터 보호 목적)

**이게 왜 중요한가?**

- 첫 설치 시 init.sql이 실행되어 테이블이 생성됨
- 하지만 우리 시스템은 TypeORM `synchronize: true` 옵션으로 테이블을 자동 생성함
- 따라서 init.sql은 참고용이고, 실제로는 NestJS 서버 첫 실행 시 테이블이 생성됨

**확인 방법:**

```bash
# PostgreSQL 컨테이너 로그 확인
docker logs snd-postgres

# 다음 메시지가 있으면 init.sql이 실행됨:
# "/docker-entrypoint-initdb.d/init.sql"

# 다음 메시지가 있으면 이미 DB가 있어서 건너뜀:
# "PostgreSQL Database directory appears to contain a database"
```

---

### 문제: "Port 5432 is already in use"

```
Error response from daemon: Ports are not available: exposing port TCP 0.0.0.0:5432
```

**왜 발생하는가?**

로컬에 PostgreSQL이 설치되어 있고 실행 중이면 5432 포트를 사용합니다.
Docker PostgreSQL도 같은 포트를 사용하려고 하면 충돌합니다.

**확인 방법:**

```bash
# Windows
netstat -ano | findstr "5432"

# Mac/Linux
lsof -i :5432
```

**해결 방법 1: 로컬 PostgreSQL 중지**

```bash
# Windows (버전에 따라 다름)
net stop postgresql-x64-17
net stop postgresql-x64-16
net stop postgresql-x64-15

# Mac (Homebrew)
brew services stop postgresql
brew services stop postgresql@14

# Linux
sudo systemctl stop postgresql
```

**해결 방법 2: Docker 포트 변경**

`docker/docker-compose.yml`:
```yaml
ports:
  - "5433:5432"  # 외부 포트를 5433으로 변경
```

`backend/.env`:
```env
DB_PORT=5433    # 같이 변경
```

---

### 문제: "ECONNREFUSED 127.0.0.1:5432"

```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**왜 발생하는가?**

1. Docker 컨테이너가 실행되지 않음
2. PostgreSQL이 아직 준비되지 않음 (시작 중)
3. 방화벽이 차단함

**확인 및 해결:**

```bash
# 컨테이너 실행 상태 확인
docker ps

# 컨테이너가 없으면 시작
cd docker
docker-compose up -d

# PostgreSQL 로그 확인 (에러 확인)
docker logs snd-postgres

# 10초 정도 대기 후 재시도 (PostgreSQL 초기화 시간 필요)
```

---

## 🔴 TypeScript/NestJS 문제들

### 문제: "Could not find a declaration file for module 'xxx'"

```
error TS7016: Could not find a declaration file for module 'cors'.
error TS7016: Could not find a declaration file for module 'bcryptjs'.
```

**왜 발생하는가?**

TypeScript는 타입 정의 파일(.d.ts)이 필요합니다.
일부 JavaScript 라이브러리는 타입 정의가 별도 패키지로 제공됩니다.

**해결:**

```bash
npm install -D @types/cors @types/bcryptjs
```

---

### 문제: "relation 'xxx' does not exist"

```
QueryFailedError: relation "user" does not exist
```

**왜 발생하는가?**

데이터베이스에 테이블이 아직 생성되지 않았습니다.
TypeORM은 서버 시작 시 `synchronize: true` 옵션으로 테이블을 자동 생성합니다.

**해결:**

```bash
# 서버를 먼저 한 번 실행 (테이블 생성됨)
npm run start:dev

# "Nest application successfully started" 메시지 확인
# Ctrl+C로 종료

# 그 다음 seed 실행
npm run seed
```

---

### 문제: "duplicate key value violates unique constraint"

```
error: duplicate key value violates unique constraint "user_email_key"
```

**왜 발생하는가?**

seed 스크립트를 여러 번 실행하면 이미 존재하는 데이터를 다시 삽입하려고 합니다.

**해결:**

이미 데이터가 있으므로 그냥 사용하면 됩니다.
또는 완전 초기화 후 재실행:

```bash
cd docker
docker-compose down -v
docker-compose up -d
# 10초 대기
cd ../backend
npm run start:dev  # 테이블 생성, Ctrl+C로 종료
npm run seed       # 데이터 생성
```

---

## 🔴 Docker 문제들

### 문제: "Cannot connect to the Docker daemon"

```
Cannot connect to the Docker daemon at unix:///var/run/docker.sock
```

**왜 발생하는가?**

Docker Desktop이 실행되지 않았거나, Docker 서비스가 중지됨

**해결:**

1. Docker Desktop 앱을 실행
2. 시스템 트레이에서 Docker 아이콘 확인
3. Docker Desktop이 "Running" 상태인지 확인

---

### 문제: "no matching manifest for windows/amd64"

```
no matching manifest for windows/amd64 in the manifest list
```

**왜 발생하는가?**

Docker Desktop 설정 문제 또는 이미지가 현재 OS를 지원하지 않음

**해결:**

Docker Desktop 설정에서:
- Settings > General > "Use WSL 2 based engine" 활성화
- 또는 "Switch to Linux containers" 클릭

---

## 🔴 Admin Web 문제들

### 문제: "Module not found"

```
Error: Cannot find module '@/services/api'
```

**왜 발생하는가?**

의존성이 설치되지 않았거나, path alias 설정 문제

**해결:**

```bash
cd admin-web
rm -rf node_modules
npm install
npm run dev
```

---

### 문제: CORS 에러

```
Access to XMLHttpRequest at 'http://localhost:3000' has been blocked by CORS policy
```

**왜 발생하는가?**

브라우저 보안 정책으로 다른 도메인 간 요청이 차단됨

**해결:**

Backend에서 CORS가 이미 설정되어 있어야 합니다.
`backend/src/main.ts`에서:

```typescript
app.enableCors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
});
```

---

## 📋 유용한 명령어 모음

### Docker 관련
```bash
# 컨테이너 상태 확인
docker ps

# 모든 컨테이너 로그 확인
docker-compose logs

# 특정 컨테이너 로그
docker logs snd-postgres
docker logs snd-redis

# 컨테이너 재시작
docker-compose restart

# 완전 초기화 (데이터 삭제)
docker-compose down -v

# PostgreSQL 직접 접속
docker exec -it snd-postgres psql -U snd_user -d snd_db
```

### PostgreSQL 직접 명령어
```sql
-- 테이블 목록 확인
\dt

-- 특정 테이블 구조 확인
\d "user"

-- 데이터 확인
SELECT * FROM "user";

-- 종료
\q
```

### 포트 확인
```bash
# Windows
netstat -ano | findstr "5432"
netstat -ano | findstr "3000"

# Mac/Linux
lsof -i :5432
lsof -i :3000
```

---

## 📞 추가 지원

위의 해결 방법으로 해결되지 않는 경우:
1. 에러 메시지 전체를 복사
2. 실행한 명령어 순서 정리
3. 운영체제 및 버전 확인
