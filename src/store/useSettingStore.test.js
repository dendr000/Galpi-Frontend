// Copyright (c) dendr000. MIT License.
// @vitest-environment jsdom
// 설정 저장소: 새 기본 폭과, 옛 저장값을 한 번만 옮기는 마이그레이션이 실제 저장소 연결에서 동작하는지 확인한다.
import { describe, it, expect, beforeEach, vi } from 'vitest';

const load = async () => {
  vi.resetModules();
  return (await import('./useSettingStore')).default;
};

beforeEach(() => {
  localStorage.clear();
});

describe('useSettingStore 폭 설정', () => {
  it('저장된 설정이 없으면 기본은 전체 폭(full)', async () => {
    const store = await load();
    expect(store.getState().layoutWidth).toBe('full');
  });

  it('버전 정보 없이 저장돼 있던 옛 center 는 불러올 때 full 로 바뀐다', async () => {
    localStorage.setItem('galpi-settings', JSON.stringify({ state: { layoutWidth: 'center', fontSize: '18' }, version: 0 }));
    const store = await load();
    expect(store.getState().layoutWidth).toBe('full');
    expect(store.getState().fontSize).toBe('18');
  });

  it('새 버전으로 저장된 center(사용자가 직접 고른 값)는 그대로 유지된다', async () => {
    const first = await load();
    first.getState().updateSetting('layoutWidth', 'center');
    const saved = JSON.parse(localStorage.getItem('galpi-settings'));
    expect(saved.version).toBeGreaterThanOrEqual(1);
    const second = await load();
    expect(second.getState().layoutWidth).toBe('center');
  });
});
