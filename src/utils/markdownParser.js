// 파일 위치: src/utils/markdownParser.js
// 기능 요약: 마크다운 파서 및 매크로 렌더링 엔진 진입점 (Barrel File)
// 하위 모듈들의 기능을 명시하여 외부 컴포넌트에서 필요한 기능만 직관적으로 임포트할 수 있도록 연결합니다.

// 1. 메타데이터 파서 및 조립 모듈
// 기능: 문서 본문에 은닉된 '[META_DATA:{...}]' 형태의 JSON 설정값을 파싱하여 객체로 추출하거나, 저장 시 다시 병합
export { extractMeta, buildMetaStr } from './markdown/metaUtils';

// 2. 커스텀 마크다운 문법 1차 해독기 모듈
// 기능: 갈피 전용 특수 마크다운 문법(폰트, 크기, 정렬, 색상, 커스텀 표 등)을 HTML 뼈대 및 예약어로 변환
// (실행 시 styleInjector를 호출하여 매크로용 글로벌 CSS를 DOM에 안전하게 자동 주입)
export { parseWikiText } from './markdown/syntaxParser';
