// Copyright (c) dendr000. MIT License.
// 콘솔 로그 켜고 끄기. console.log / debug / info 만 다루고 warn, error 는 항상 그대로 둔다.
// 기본값: 개발 서버(npm run dev)에서는 켜고, 배포 빌드(exe 포함)에서는 끈다.
// 직접 정하기: 브라우저 콘솔에서 galpiDebug(true) 또는 galpiDebug(false). 이 PC 에 저장되어 다음 실행에도 유지된다.
export const DEBUG_KEY = 'galpi.debug';

const GATED = ['log', 'debug', 'info'];
// localStorage 에 접근만 해도 예외가 나는 환경(차단된 저장소)이 있어, 기본값을 구할 때도 감싸서 읽는다
const defaultStorage = () => {
  try { return globalThis.localStorage; } catch { return null; }
};
const originals = new WeakMap(); // 대상 console -> 처음 상태의 함수들(겹겹이 감싸지 않으려고 보관)

// 저장된 값('1' 켬, '0' 끔)이 있으면 그것을, 없거나 알 수 없으면 isDev 를 따른다.
export const isDebugEnabled = ({ isDev, storage }) => {
  try {
    const saved = storage?.getItem(DEBUG_KEY);
    if (saved === '1') return true;
    if (saved === '0') return false;
  } catch {
    // 저장소를 못 읽으면 기본값을 쓴다
  }
  return !!isDev;
};

const gate = (enabled, target) => {
  if (!originals.has(target)) {
    originals.set(target, Object.fromEntries(GATED.map((m) => [m, target[m]])));
  }
  const saved = originals.get(target);
  GATED.forEach((m) => { target[m] = enabled ? saved[m] : () => {}; });
  return enabled;
};

export const applyConsoleGate = ({ isDev, storage = defaultStorage(), target = console } = {}) =>
  gate(isDebugEnabled({ isDev, storage }), target);

// 켜거나 끄고 이 PC 에 저장한다. 저장에 실패해도 이번 실행에는 바로 적용한다.
export const setDebugLogs = (on, { storage = defaultStorage(), target = console } = {}) => {
  try {
    storage?.setItem(DEBUG_KEY, on ? '1' : '0');
  } catch {
    // 저장은 못 해도 지금 실행에는 적용한다
  }
  return gate(!!on, target);
};
