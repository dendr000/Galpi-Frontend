// Copyright (c) dendr000. MIT License.
// @vitest-environment jsdom
// 캐릭터 본문 보기 설정(앱 전체, 이 PC에 저장): 기본값, 저장, 깨진 값 처리.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { getCharViewSettings, setCharViewSettings, CHAR_VIEW_KEY } from './charViewSettings';

beforeEach(() => { localStorage.clear(); });
afterEach(() => { vi.restoreAllMocks(); });

describe('charViewSettings', () => {
  it('저장된 것이 없으면 기본값(자동 이동 켬, 더블클릭 큰 창 켬)', () => {
    expect(getCharViewSettings()).toEqual({ autoScroll: true, dblClickModal: true });
  });

  it('고른 값을 저장하고 다시 읽는다', () => {
    setCharViewSettings({ autoScroll: false });
    expect(getCharViewSettings()).toEqual({ autoScroll: false, dblClickModal: true });
  });

  it('일부만 바꾸면 나머지는 그대로 유지한다', () => {
    setCharViewSettings({ autoScroll: false });
    setCharViewSettings({ dblClickModal: false });
    expect(getCharViewSettings()).toEqual({ autoScroll: false, dblClickModal: false });
  });

  it('저장값이 깨진 JSON 이면 기본값', () => {
    localStorage.setItem(CHAR_VIEW_KEY, '{깨짐');
    expect(getCharViewSettings()).toEqual({ autoScroll: true, dblClickModal: true });
  });

  it('불리언이 아닌 값과 모르는 키는 무시하고 기본값을 쓴다', () => {
    localStorage.setItem(CHAR_VIEW_KEY, JSON.stringify({ autoScroll: 'no', dblClickModal: 0, other: 1 }));
    expect(getCharViewSettings()).toEqual({ autoScroll: true, dblClickModal: true });
  });

  it('localStorage 를 쓸 수 없어도 오류 없이 기본값을 돌려주고 저장은 조용히 실패한다', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('blocked'); });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('blocked'); });
    expect(getCharViewSettings()).toEqual({ autoScroll: true, dblClickModal: true });
    expect(() => setCharViewSettings({ autoScroll: false })).not.toThrow();
  });
});
