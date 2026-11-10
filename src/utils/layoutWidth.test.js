// Copyright (c) dendr000. MIT License.
import { describe, it, expect } from 'vitest';
import { getAppMaxWidth, getWorkZoneLayout, getPageContainerClass, migrateSettings, SETTINGS_VERSION } from './layoutWidth';

describe('getAppMaxWidth: 앱 최상위 칸의 최대 폭', () => {
  it('전체 폭(full)이면 100%', () => {
    expect(getAppMaxWidth({ layoutWidth: 'full' })).toBe('100%');
  });

  it('본문 폭 제한(center)이면 1200px', () => {
    expect(getAppMaxWidth({ layoutWidth: 'center' })).toBe('1200px');
  });

  it('알 수 없는 값이면 기본인 전체 폭으로 본다', () => {
    expect(getAppMaxWidth({ layoutWidth: undefined })).toBe('100%');
    expect(getAppMaxWidth({ layoutWidth: 'zzz' })).toBe('100%');
  });

  it('편집기, 일괄, 메모 화면은 설정과 무관하게 100%', () => {
    for (const mode of ['isBulkMode', 'isEditorMode', 'isMemoMode']) {
      expect(getAppMaxWidth({ layoutWidth: 'center', [mode]: true })).toBe('100%');
    }
  });
});

describe('getWorkZoneLayout: 작품 페이지 장르 테마 영역의 폭 규칙', () => {
  it('전체 폭이면 영역을 창 전체로 펼치고 안쪽 칼럼만 읽기 폭을 둔다', () => {
    const l = getWorkZoneLayout('full');
    expect(l.zoneClass).toContain('galpi-work-full');
    expect(l.zoneClass).not.toContain('fixed-container');
    expect(l.innerClass).toContain('galpi-work-inner');
  });

  it('본문 폭 제한이면 예전처럼 fixed-container 를 쓴다', () => {
    const l = getWorkZoneLayout('center');
    expect(l.zoneClass).toContain('fixed-container');
    expect(l.zoneClass).not.toContain('galpi-work-full');
    expect(l.innerClass).not.toContain('galpi-work-inner');
  });

  it('알 수 없는 값이면 전체 폭', () => {
    expect(getWorkZoneLayout(undefined).zoneClass).toContain('galpi-work-full');
  });
});

describe('getPageContainerClass: 홈, 분류 같은 일반 화면 칸의 폭 규칙', () => {
  it('전체 폭이면 1200px 제한을 푸는 fluid 클래스를 함께 쓴다', () => {
    expect(getPageContainerClass('full')).toBe('fixed-container galpi-page-fluid');
  });

  it('본문 폭 제한이면 예전처럼 fixed-container 만 쓴다', () => {
    expect(getPageContainerClass('center')).toBe('fixed-container');
  });

  it('알 수 없는 값이거나 비어 있으면 전체 폭', () => {
    expect(getPageContainerClass('whatever')).toBe('fixed-container galpi-page-fluid');
    expect(getPageContainerClass(undefined)).toBe('fixed-container galpi-page-fluid');
  });
});

describe('migrateSettings: 저장된 설정을 새 기본값으로 한 번만 옮긴다', () => {
  it('옛 버전(0)에 저장된 center 는 full 로 바뀐다', () => {
    expect(migrateSettings({ layoutWidth: 'center', fontSize: '16' }, 0)).toEqual({ layoutWidth: 'full', fontSize: '16' });
  });

  it('옛 버전에 저장된 full 은 그대로', () => {
    expect(migrateSettings({ layoutWidth: 'full' }, 0).layoutWidth).toBe('full');
  });

  it('현재 버전 이후에 사용자가 고른 center 는 건드리지 않는다', () => {
    expect(migrateSettings({ layoutWidth: 'center' }, SETTINGS_VERSION)).toEqual({ layoutWidth: 'center' });
  });

  it('다른 설정값은 그대로 둔다', () => {
    const out = migrateSettings({ layoutWidth: 'center', bossKey: 'Alt+X', isStarryBackground: true }, 0);
    expect(out.bossKey).toBe('Alt+X');
    expect(out.isStarryBackground).toBe(true);
  });

  it('저장값이 비어 있거나 객체가 아니어도 오류 없이 돌려준다', () => {
    expect(migrateSettings(undefined, 0)).toEqual({});
    expect(migrateSettings(null, 0)).toEqual({});
  });

  it('버전이 올라가 있다(2 이상)', () => {
    expect(SETTINGS_VERSION).toBeGreaterThanOrEqual(2);
  });
});

describe('migrateSettings: 버전 2(줄 간격, 자동 저장 기본값 정리)', () => {
  it('한 번도 적용된 적 없던 옛 줄 간격 기본값 1.6 은 실제로 쓰던 1.8 로 옮긴다', () => {
    expect(migrateSettings({ lineHeight: '1.6' }, 1).lineHeight).toBe('1.8');
  });

  it('사용자가 고른 다른 줄 간격은 그대로 둔다', () => {
    expect(migrateSettings({ lineHeight: '2.0' }, 1).lineHeight).toBe('2.0');
  });

  it('옛 자동 저장 "0"(사용 안함, 실제로는 3초로 저장되고 있었다)은 "3" 으로 옮긴다', () => {
    expect(migrateSettings({ autoSaveInterval: '0' }, 1).autoSaveInterval).toBe('3');
  });

  it('사용자가 고른 30초, 60초는 그대로 둔다', () => {
    expect(migrateSettings({ autoSaveInterval: '30' }, 1).autoSaveInterval).toBe('30');
    expect(migrateSettings({ autoSaveInterval: '60' }, 1).autoSaveInterval).toBe('60');
  });

  it('버전 2 이후에 저장된 값은 건드리지 않는다', () => {
    const saved = { lineHeight: '1.6', autoSaveInterval: '0' };
    expect(migrateSettings(saved, 2)).toEqual(saved);
  });

  it('값이 없으면 키를 새로 만들지 않는다', () => {
    expect(migrateSettings({ fontSize: '16' }, 1)).toEqual({ fontSize: '16' });
  });

  it('버전 0 에서도 폭 옮기기와 함께 한 번에 적용된다', () => {
    expect(migrateSettings({ layoutWidth: 'center', lineHeight: '1.6', autoSaveInterval: '0' }, 0))
      .toEqual({ layoutWidth: 'full', lineHeight: '1.8', autoSaveInterval: '3' });
  });
});
