# 전체 시스템 구조

[← 문서 목록으로](./README.md)

Galpi는 하나의 저장소가 아니라, 역할이 분리된 형제 저장소 3개로 구성됩니다. 이 문서는 `Galpi-Frontend`(이 저장소)만으로는 보이지 않는, 백엔드 · 데스크톱 패키징까지 포함한 전체 그림을 정리합니다.

```
Galpi/                      (부모 폴더, 각각 독립된 git 저장소)
 ├─ Galpi-Frontend/           프론트엔드 — 이 저장소 (Public)
 ├─ Galpi-Backend/            Spring Boot REST API + DB (Public)
 └─ Galpi-Exe/                Electron 데스크톱 패키징 (Private)
```

세 저장소를 분리한 이유는 단순합니다. 프론트/백엔드/패키징은 커밋 단위와 릴리즈 주기가 서로 다르고, 패키징 저장소는 완성 후에 급하게 파는 것보다 처음부터 별도로 키우는 쪽이 (다른 PC로 옮겨 계속 개발하기에도) 유리하다고 판단했습니다.

## 저장소별 역할

### Galpi-Frontend (프론트엔드)

React 19 + Vite SPA. 위키 UI, 에디터, 마크다운 매크로 렌더러, 장르 테마 CSS를 담당합니다. 백엔드와는 REST API(`/api/**`)로만 통신하고, 이미지 · 폰트는 `/img/**`, `/fonts/**`로 정적 서빙됩니다.

### Galpi-Backend (API 서버)

Spring Boot 3.5 + JPA/Hibernate. 작품 · 캐릭터 · 메모 · 상용구 · 한자 사전 등을 REST API로 노출합니다. **두 개의 스프링 프로파일**로 완전히 다른 두 가지 방식으로 뜰 수 있습니다.

| | 기본 프로파일 (개발) | `exe` 프로파일 (데스크톱) |
|---|---|---|
| DB | MySQL 8 (별도 서버 필요) | H2 파일 DB (`~/.galpi/data`, 내장) |
| 미디어 경로 | `Galpi-Media/` (개발 PC 고정 경로) | `~/.galpi/media/` |
| 용도 | 로컬 개발 | `Galpi-Exe` 패키징 |

두 프로파일은 `application.properties` / `application-exe.properties`로 완전히 분리되어 있어, 데스크톱용 작업이 평소 개발 환경에 영향을 주지 않습니다. `galpi.media.root` 프로퍼티 하나로 이미지/폰트 서빙 경로와 업로드 저장 경로를 동시에 제어합니다.

### Galpi-Exe (데스크톱 패키징)

Electron으로 위 두 저장소를 감싸는 **하이브리드 구조**입니다. Electron이 UI를 새로 만드는 게 아니라, 창/자동 업데이트 같은 네이티브 OS 기능만 담당하고 기존 Spring Boot 백엔드를 내부 자식 프로세스로 그대로 실행합니다.

```
Electron main.js
  └─ child_process.spawn(java -jar galpi.jar --spring.profiles.active=exe)
        └─ HTTP 폴링으로 기동 대기 (최대 30초)
              └─ BrowserWindow가 http://localhost:<port> 로드
```

`electron-builder`는 설치 마법사가 있는 인스톨러 대신 **portable 타깃**으로 설정되어 있습니다. 실행 파일 하나(`Galpi-Exe/release/Galpi <version>.exe`)가 `dist/win-unpacked/...`처럼 깊이 묻히지 않고 바로 보이도록 한 선택입니다. 데이터는 exe 패키지 바깥(`~/.galpi/`)에 저장되므로, 코드를 다시 패키징해도 사용자 데이터는 그대로 유지됩니다.

## 빌드 파이프라인

세 저장소가 최종적으로 하나의 exe로 합쳐지는 과정입니다.

```
1. Galpi-Frontend   : npm run build
                    → 산출물이 Galpi-Backend/src/main/resources/static 으로 직접 출력됨
                       (vite.config.js의 outDir 설정, baseURL이 '/'라 코드 변경 불필요)

2. Galpi-Backend  : gradlew bootJar
                    → 프론트 정적 리소스가 포함된 fat jar 생성

3. Galpi-Exe      : npm run dist (electron-builder --win portable)
                    → jar + .env를 extraResources로 묶어 단일 .exe 생성
```

`Galpi-Exe`에는 이 3단계를 한 번에 실행하는 `npm run update`(`update-build.js`)가 있고, 터미널 없이 쓰도록 `업데이트.bat`도 함께 있습니다. 코드를 어디를 고치든 이 스크립트 한 번으로 exe에 반영됩니다 — 단, **DB 마이그레이션은 자동화하지 않았습니다.** 코드를 고칠 때마다 자동으로 돌리면 이미 있는 데이터와 충돌할 위험이 있어서, `Galpi-Backend/scripts/migrate-to-h2`는 의도적으로 수동/별도 스크립트로 유지합니다.

## 왜 이런 구조를 택했는가

패키징을 검토할 때 세 가지 선택지를 비교했습니다.

| 선택지 | 결론 |
|---|---|
| 완전 네이티브 GUI (WPF/Qt 등) | 기각 — 이미 만든 장르별 CSS 애니메이션 · 커서 이펙트를 전부 새 툴킷 문법으로 다시 짜야 해서 사실상 재개발 |
| WebView2 하이브리드 | 크로미움 기반이라 CSS 손실은 없지만, 트레이 · 자동 업데이트 · 드래그&드롭 등 "진짜 프로그램" 느낌이 약함 |
| **Electron 하이브리드 (채택)** | WebView2와 마찬가지로 CSS 손실 없음 + 네이티브 기능 완성도가 높음. 설치 용량이 더 크다는 트레이드오프는 감수 |

셸을 무엇으로 고르든, 실제 체감 속도에 가장 큰 영향을 준 것은 셸 자체가 아니라 **"DB를 내장형으로 바꾸느냐"** 였습니다. 별도 MySQL 서버가 있어야 했던 기존 구조로는 일반 사용자에게 설치 자체가 진입장벽이었고, H2로 옮기면서 "실행 파일 더블클릭 → 바로 사용"이 가능해졌습니다.
