# Galpi (갈피)

창작자를 위한 **위키형 세계관 노트**. 작품 · 캐릭터 · 설정 문서를 위키처럼 엮고, 소설/웹툰 원고를 쓰는 동안 필요한 도구(상용구, 한자 사전, 플로팅 메모)를 한 화면에서 바로 쓸 수 있게 만든 개인 창작 지원 툴입니다.

이 저장소(`Galpi-Frontend`)는 프론트엔드입니다. 전체 시스템은 형제 저장소 3개로 나뉘어 있습니다.

| 저장소 | 역할 | 공개 여부 |
|---|---|---|
| **Galpi-Frontend** (이 저장소) | React 프론트엔드 — 위키 UI, 에디터, 장르 테마 | Public |
| Galpi-Backend | Spring Boot REST API + DB(MySQL / H2) | Public |
| Galpi-Exe | Electron으로 위 둘을 감싼 데스크톱 실행 파일 | Private |

세 저장소가 어떻게 맞물리는지는 [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)에 정리했습니다.

## 핵심 기능

- **위키형 작품 문서** — 작품 아래 하위 문서를 트리로 계속 붙여나가는 구조, `[[문서명]]` 백링크로 캐릭터·다른 세계관 문서와 즉시 연결
- **커스텀 마크다운 매크로** — 스탯 차트 · 성향 매트릭스 · 관계도 · 타임라인 · 대화 로그 같은 위젯을 특수 문법 한 줄로 삽입 (자세히: [docs/SYNTAX.md](docs/SYNTAX.md))
- **장르별 테마** — 무협 · 사이버펑크 · 아포칼립스 · 히어로 · 헌터 · 동양판타지 · 괴담 등 20종 이상, 작품 분류에 따라 전용 커서 · 클릭 이펙트까지 자동 적용
- **캐릭터 Bulk Studio** — 등장인물 속성을 엑셀처럼 한 화면에서 일괄 편집
- **헤더 검색 추천** — 글자를 입력하면 관련 작품이 아래로 추천되고, 숨김 분류 작품을 포함할지는 Shift+우클릭 메뉴에서 켜고 끈다
- **집필 보조 플로팅 메모** — 상용구(자주 쓰는 문구 자동완성), 한자 사전 변환, 최근 문서, 클립보드 히스토리를 원고 옆에 띄워두고 사용
- **데스크톱 앱화** — Electron으로 패키징한 완전 오프라인 단일 실행 파일 (`Galpi-Exe`)

## 기술 스택

- **프론트엔드**: React 19, Vite, React Router, Zustand, marked
- **백엔드**: Spring Boot 3.5, JPA/Hibernate, MySQL 8(개발) / H2(데스크톱 임베디드)
- **데스크톱**: Electron + electron-builder

## 시작하기

이 저장소만으로는 화면에 데이터가 뜨지 않습니다 — 백엔드(`Galpi-Backend`)가 API를 응답할 수 있는 상태로 떠 있어야 합니다.

```bash
npm install
cp .env.example .env   # VITE_API_BASE_URL을 백엔드 주소로 맞추기
npm run dev             # http://localhost:9691
```

## 문서

- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — 전체 시스템 구조 (백엔드 · Exe 포함)
- [docs/USAGE.md](docs/USAGE.md) — 사용 방법
- [docs/SYNTAX.md](docs/SYNTAX.md) — 작품 페이지 문법 전체 레퍼런스
- [docs/DirectoryTree.md](docs/DirectoryTree.md) — 프론트엔드 폴더 구조
- [docs/COMMIT_CONVENTION.md](docs/COMMIT_CONVENTION.md) — 커밋 컨벤션
- 그 외 도메인별 문서는 [docs/README.md](docs/README.md)에 목록으로 정리되어 있습니다.

## 라이선스

[MIT](LICENSE) — 자유롭게 사용 · 수정 · 배포할 수 있습니다.

---

개인 창작용으로 시작한 1인 개발 프로젝트입니다. 회원가입 없이 단일 패스프레이즈로 여는 개인 노트 앱이라, 인증을 비롯한 일부 구조는 멀티유저 서비스를 전제하지 않습니다.
