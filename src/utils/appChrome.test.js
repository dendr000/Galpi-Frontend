// Copyright (c) dendr000. MIT License.
// 화면별로 앱 틀(메뉴 바, 상단 바, 떠 있는 메뉴, 푸터)을 보일지 정하는 규칙 시험.
import { describe, it, expect } from 'vitest';
import { getChromeVisibility, isFocusScreen } from './appChrome';

describe('getChromeVisibility: 화면별 앱 틀 표시 규칙', () => {
  it('홈, 분류, 작품 페이지는 메뉴 바, 상단 바, 떠 있는 메뉴, 푸터를 모두 보인다', () => {
    ['/', '/category', '/work/15', '/viewer/3'].forEach((p) => {
      expect(getChromeVisibility(p)).toEqual({
        showMenuBar: true, showGnb: true, showFab: true, showFooter: true,
      });
    });
  });

  it('편집기는 메뉴 바와 떠 있는 메뉴, 푸터를 보이고 상단 바만 숨긴다', () => {
    expect(getChromeVisibility('/edit')).toEqual({
      showMenuBar: true, showGnb: false, showFab: true, showFooter: true,
    });
  });

  it('메모 화면도 메뉴 바를 보이고 상단 바만 숨긴다', () => {
    expect(getChromeVisibility('/memo')).toEqual({
      showMenuBar: true, showGnb: false, showFab: true, showFooter: true,
    });
  });

  it('일괄 편집은 메뉴 바만 보이고 상단 바, 떠 있는 메뉴, 푸터는 숨긴다', () => {
    expect(getChromeVisibility('/bulk')).toEqual({
      showMenuBar: true, showGnb: false, showFab: false, showFooter: false,
    });
  });

  it('주소가 비었거나 없어도 오류 없이 일반 화면으로 본다', () => {
    expect(getChromeVisibility('').showGnb).toBe(true);
    expect(getChromeVisibility(undefined).showGnb).toBe(true);
  });
});

describe('isFocusScreen: 작업 중 화면(편집기, 일괄, 메모) 판별', () => {
  it('편집기, 일괄, 메모는 true', () => {
    expect(isFocusScreen('/edit')).toBe(true);
    expect(isFocusScreen('/bulk')).toBe(true);
    expect(isFocusScreen('/memo')).toBe(true);
  });

  it('그 밖의 화면은 false', () => {
    expect(isFocusScreen('/')).toBe(false);
    expect(isFocusScreen('/work/1')).toBe(false);
    expect(isFocusScreen(undefined)).toBe(false);
  });
});
