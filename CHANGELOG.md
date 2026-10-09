# Changelog

이 프로젝트의 주요 변경 사항을 기록한다.
형식은 [Keep a Changelog](https://keepachangelog.com/ko/1.1.0/), 버전은 [유의적 버전](https://semver.org/lang/ko/)을 따른다.
시각은 한국 표준시(KST)이다. (2026-10-07부터 기록 시작 — 그 이전 변경은 git 커밋 이력을 본다. 아직 버전 번호를 매기지 않아 `[Unreleased]` 에 모은다.)

## [Unreleased]

### 변경 (Changed)
- 백엔드 기본 주소를 `http://localhost:8080`에서 `http://localhost:18080`으로 바꿨다(2026-10-09 12:01). `.env.example`과 `docs/USAGE.md`를 맞췄고, 이미 `.env`를 쓰고 있다면 `VITE_API_BASE_URL`의 포트를 18080으로 직접 바꿔야 한다.

### 추가 (Added)
- 상용구 관리 창에 "닫으면 '전체'로 자동 복귀" 체크박스를 추가했다(스페이스바 자동 치환 옆, 기본 켜짐). 폴더를 골라 정리한 뒤 창을 닫으면 활성 폴더가 '전체'로 돌아가 모든 폴더의 상용구를 에디터에서 다시 쓸 수 있다. 끄면 고른 폴더가 그대로 유지된다
