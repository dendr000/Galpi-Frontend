// Copyright (c) dendr000. MIT License.
// 환경 설정의 "자동 저장" 값을 편집기 자동 저장 지연(밀리초)으로 바꾸는 규칙 시험.
import { describe, it, expect } from 'vitest';
import { getAutoSaveDelayMs, AUTO_SAVE_OPTIONS, DEFAULT_AUTO_SAVE_SECONDS } from './autoSaveDelay';

describe('getAutoSaveDelayMs: 자동 저장 설정 -> 지연 시간', () => {
  it('3초, 30초, 60초를 밀리초로 바꾼다', () => {
    expect(getAutoSaveDelayMs('3')).toBe(3000);
    expect(getAutoSaveDelayMs('30')).toBe(30000);
    expect(getAutoSaveDelayMs('60')).toBe(60000);
  });

  it('숫자로 들어와도 같게 바꾼다', () => {
    expect(getAutoSaveDelayMs(30)).toBe(30000);
  });

  it('옛 값 "0"(사용 안함), 비어 있음, 음수, 숫자가 아닌 값은 기본(3초)로 본다', () => {
    ['0', 0, '', undefined, null, 'abc', '-5', -5].forEach((v) => {
      expect(getAutoSaveDelayMs(v)).toBe(DEFAULT_AUTO_SAVE_SECONDS * 1000);
    });
  });

  it('기본은 3초다', () => {
    expect(DEFAULT_AUTO_SAVE_SECONDS).toBe(3);
  });

  it('설정 화면의 선택지는 모두 유효한 값이고 기본값이 들어 있다', () => {
    const values = AUTO_SAVE_OPTIONS.map((o) => o.value);
    expect(values).toContain(String(DEFAULT_AUTO_SAVE_SECONDS));
    values.forEach((v) => expect(getAutoSaveDelayMs(v)).toBe(Number(v) * 1000));
    AUTO_SAVE_OPTIONS.forEach((o) => expect(typeof o.label).toBe('string'));
  });
});
