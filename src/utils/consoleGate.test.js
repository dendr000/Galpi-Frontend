// Copyright (c) dendr000. MIT License.
import { describe, it, expect, vi } from 'vitest';
import { DEBUG_KEY, isDebugEnabled, applyConsoleGate, setDebugLogs } from './consoleGate';

const makeStorage = (init = {}) => {
  const data = { ...init };
  return { getItem: (k) => (k in data ? data[k] : null), setItem: (k, v) => { data[k] = String(v); }, data };
};
const makeConsole = () => ({ log: vi.fn(), debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() });
const callAll = (c) => { c.log('a'); c.debug('b'); c.info('c'); c.warn('d'); c.error('e'); };

describe('isDebugEnabled', () => {
  it('저장된 값이 없으면 개발 서버에서는 켜고 배포 빌드에서는 끈다', () => {
    expect(isDebugEnabled({ isDev: true, storage: makeStorage() })).toBe(true);
    expect(isDebugEnabled({ isDev: false, storage: makeStorage() })).toBe(false);
  });

  it("저장된 '1' 은 항상 켜고 '0' 은 항상 끈다", () => {
    expect(isDebugEnabled({ isDev: false, storage: makeStorage({ [DEBUG_KEY]: '1' }) })).toBe(true);
    expect(isDebugEnabled({ isDev: true, storage: makeStorage({ [DEBUG_KEY]: '0' }) })).toBe(false);
  });

  it('알 수 없는 값이나 저장소 오류는 기본값을 따른다', () => {
    expect(isDebugEnabled({ isDev: true, storage: makeStorage({ [DEBUG_KEY]: 'yes' }) })).toBe(true);
    expect(isDebugEnabled({ isDev: false, storage: makeStorage({ [DEBUG_KEY]: 'yes' }) })).toBe(false);
    const broken = { getItem: () => { throw new Error('blocked'); } };
    expect(isDebugEnabled({ isDev: false, storage: broken })).toBe(false);
    expect(isDebugEnabled({ isDev: true, storage: broken })).toBe(true);
    expect(isDebugEnabled({ isDev: false, storage: null })).toBe(false);
  });
});

describe('applyConsoleGate', () => {
  it('꺼져 있으면 log, debug, info 는 조용하고 warn, error 는 그대로 나온다', () => {
    const c = makeConsole();
    const { log, debug, info, warn, error } = c;
    const on = applyConsoleGate({ isDev: false, storage: makeStorage(), target: c });
    expect(on).toBe(false);
    callAll(c);
    expect(log).not.toHaveBeenCalled();
    expect(debug).not.toHaveBeenCalled();
    expect(info).not.toHaveBeenCalled();
    expect(warn).toHaveBeenCalledWith('d');
    expect(error).toHaveBeenCalledWith('e');
  });

  it('켜져 있으면 전부 그대로 나온다', () => {
    const c = makeConsole();
    const { log } = c;
    expect(applyConsoleGate({ isDev: true, storage: makeStorage(), target: c })).toBe(true);
    callAll(c);
    expect(log).toHaveBeenCalledWith('a');
  });

  it('여러 번 적용해도 원래 함수를 겹겹이 감싸지 않고, 켜면 원래 함수로 돌아간다', () => {
    const c = makeConsole();
    const original = c.log;
    applyConsoleGate({ isDev: false, storage: makeStorage(), target: c });
    applyConsoleGate({ isDev: false, storage: makeStorage(), target: c });
    expect(c.log).not.toBe(original);
    applyConsoleGate({ isDev: false, storage: makeStorage({ [DEBUG_KEY]: '1' }), target: c });
    expect(c.log).toBe(original);
  });
});

describe('setDebugLogs', () => {
  it("켜면 '1' 을 저장하고 바로 로그가 나온다. 끄면 '0' 을 저장하고 바로 조용해진다", () => {
    const c = makeConsole();
    const { log } = c;
    const storage = makeStorage();
    applyConsoleGate({ isDev: false, storage, target: c });
    expect(setDebugLogs(true, { isDev: false, storage, target: c })).toBe(true);
    expect(storage.data[DEBUG_KEY]).toBe('1');
    c.log('x');
    expect(log).toHaveBeenCalledTimes(1);
    expect(setDebugLogs(false, { isDev: true, storage, target: c })).toBe(false);
    expect(storage.data[DEBUG_KEY]).toBe('0');
    c.log('y');
    expect(log).toHaveBeenCalledTimes(1);
  });

  it('저장소에 쓸 수 없어도 이번 실행에서는 바로 적용된다', () => {
    const c = makeConsole();
    const { log } = c;
    const storage = { getItem: () => null, setItem: () => { throw new Error('full'); } };
    applyConsoleGate({ isDev: false, storage, target: c });
    expect(setDebugLogs(true, { isDev: false, storage, target: c })).toBe(true);
    c.log('x');
    expect(log).toHaveBeenCalledTimes(1);
  });
});

describe('저장소 접근 자체가 막힌 환경', () => {
  it('localStorage 를 읽는 것만으로 예외가 나도 앱 시작이 멈추지 않고 기본값을 따른다', () => {
    const desc = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
    Object.defineProperty(globalThis, 'localStorage', { configurable: true, get() { throw new Error('SecurityError'); } });
    try {
      const c = makeConsole();
      expect(applyConsoleGate({ isDev: false, target: c })).toBe(false);
      expect(setDebugLogs(true, { target: c })).toBe(true);
    } finally {
      if (desc) Object.defineProperty(globalThis, 'localStorage', desc); else delete globalThis.localStorage;
    }
  });
});
