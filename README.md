# 익명 탄환 게임 - 관리자/플레이어 링크 분리

## 페이지 주소

- 플레이어: `http://localhost:5173/play`
- 관리자: `http://localhost:5173/admin`

배포 후에는 다음처럼 사용합니다.

- 플레이어: `https://도메인/play`
- 관리자: `https://도메인/admin`

## 실행

```bash
npm install
npm run dev
```

## 환경변수

`.env.example`을 `.env`로 복사한 뒤 값을 입력합니다.

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
VITE_ADMIN_PASSWORD=1234
```

환경변수를 변경한 뒤 Vite 서버를 재시작하세요.

## 구성

- `src/pages/PlayerPage.jsx`: 플레이어 로그인 및 총알 사용
- `src/pages/AdminPage.jsx`: 관리자 로그인 및 참가자/실행 목록 관리
- `src/App.jsx`: URL에 따라 페이지 분기
- `src/components/PageHeader.jsx`: 공통 헤더
