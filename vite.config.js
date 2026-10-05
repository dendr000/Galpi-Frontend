// 파일 위치: vite.config.js
// 버전: v1.0.4
// 기능 요약: Vite 개발 서버 포트 설정, 환경 변수 로드 및 백엔드 프록시 우회 라우팅 제어

import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react'; // ★ 올바른 패키지명 롤백 완료

// ★ 기존 객체 형태에서 환경 변수를 불러오기 위해 콜백 함수 형태로 변경
export default defineConfig(({ mode }) => {
  // 현재 작업 디렉토리(process.cwd())에 있는 .env 파일을 읽어와 env 객체에 담습니다.
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    // 테스트(vitest): 기본은 node 환경(순수 로직). DOM이 필요한 테스트 파일만 맨 위에
    // `// @vitest-environment jsdom` 주석으로 jsdom을 켠다.
    test: {
      environment: 'node',
      include: ['src/**/*.test.{js,jsx}'],
    },
    build: {
      // exe(Electron) 패키징용 — 빌드 산출물을 Galpi-Backend가 바로 서빙할 수 있게
      // 정적 리소스 폴더로 직접 낸다. baseURL이 '/'라 백엔드가 서빙만 하면 코드 변경 없음.
      outDir: '../Galpi-Backend/src/main/resources/static',
      // outDir 안의 static/sql/Talbles.sql(빌드 산출물 아님)이 지워지지 않도록 false 유지
      emptyOutDir: false,
    },
    server: {
      port: 9691, // 로컬 개발 서버 포트를 9691로 강제 할당
      strictPort: true, // 9691 포트가 이미 사용 중일 경우 다른 포트로 넘어가지 않고 서버 실행 중단
      
      // 개발 서버 가동 인터페이스: 특정 포트로 유입되는 자원 파싱 경로를 분기 가로채기 합니다.
      proxy: {
        // 1. /api로 시작하는 데이터 요청에 대한 백엔드 포트 포워딩 제어
        '/api': {
          target: env.VITE_API_BASE_URL, // ★ 환경 변수 적용
          changeOrigin: true,
          secure: false,
          configure: (proxy, _options) => {
            proxy.on('error', (err, _req, _res) => {
              console.log('[Vite Proxy Error] 데이터 API 서버 통신 실패 거부 오류:', err);
            });
          }
        },
        // 2. /img로 시작하는 이미지 에셋 요청에 대한 외부 자원 가동용 백엔드 서버 포워딩 제어
        '/img': {
          target: env.VITE_API_BASE_URL, // ★ 환경 변수 적용
          changeOrigin: true,
          secure: false,
          configure: (proxy, _options) => {
            proxy.on('error', (err, _req, _res) => {
              console.log('[Vite Proxy Error] 이미지 에셋 전송 서버 가로채기 실패 오류:', err);
            });
          }
        },
        // 3. /fonts로 시작하는 폰트 에셋 요청에 대한 외부 자원 가동용 백엔드 서버 포워딩 제어
        '/fonts': {
          target: env.VITE_API_BASE_URL, // ★ 환경 변수 적용
          changeOrigin: true,
          secure: false,
          configure: (proxy, _options) => {
            proxy.on('error', (err, _req, _res) => {
              console.log('[Vite Proxy Error] 폰트 에셋 전송 서버 가로채기 실패 오류:', err);
            });
          }
        }
      }
    }
  };
});