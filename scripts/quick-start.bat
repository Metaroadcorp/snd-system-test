@echo off
chcp 65001 >nul
echo =============================================
echo  아들과딸 주간보호센터 통합 시스템
echo  빠른 시작 스크립트 (Windows)
echo =============================================
echo.

cd /d "%~dp0"
cd ..

echo [1/6] Docker 컨테이너 시작 중...
cd docker
docker-compose up -d
if %errorlevel% neq 0 (
    echo ❌ Docker 시작 실패!
    echo    Docker Desktop이 실행 중인지 확인하세요.
    pause
    exit /b 1
)

echo.
echo [2/6] PostgreSQL 준비 대기 중... (10초)
timeout /t 10 /nobreak >nul

echo.
echo [3/6] Backend 설정 중...
cd ../backend
if not exist ".env" (
    copy .env.example .env
    echo    .env 파일 생성됨
)

echo.
echo [4/6] 의존성 설치 중...
call npm install

echo.
echo [5/6] 서버 시작 및 테이블 생성 중...
echo    (테이블 생성 후 자동으로 종료됩니다)
start /wait /b cmd /c "npm run start:dev & timeout /t 15 & taskkill /f /im node.exe"

echo.
echo [6/6] 테스트 데이터 생성 중...
call npm run seed

echo.
echo =============================================
echo  ✅ 설치 완료!
echo.
echo  서버 시작: cd backend ^&^& npm run start:dev
echo  Admin Web: cd admin-web ^&^& npm run dev
echo.
echo  접속 주소:
echo  - Backend API: http://localhost:3000
echo  - Admin Web: http://localhost:5173
echo  - pgAdmin: http://localhost:5050
echo.
echo  테스트 계정:
echo  - admin@snd.com / admin1234
echo =============================================
pause
