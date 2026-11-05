// Copyright (c) dendr000. MIT License.
// @vitest-environment jsdom
// 캐릭터 본문 보기 설정 메뉴: 자동 이동, 더블클릭 큰 창.
import React from 'react';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, cleanup, fireEvent, screen } from '@testing-library/react';
import CharViewSettingsMenu from './CharViewSettingsMenu';
import { getCharViewSettings, setCharViewSettings } from './charViewSettings';

beforeEach(() => { localStorage.clear(); });
afterEach(cleanup);

const openMenu = () => fireEvent.click(screen.getByRole('button', { name: '보기 설정' }));
const scrollBox = () => screen.getByLabelText('카드를 선택하면 본문으로 이동');
const dblBox = () => screen.getByLabelText('카드를 더블클릭하면 큰 창으로 열기');

describe('CharViewSettingsMenu', () => {
  it('처음에는 닫혀 있고, 버튼을 누르면 두 항목이 기본값(켬)으로 보인다', () => {
    render(<CharViewSettingsMenu />);
    expect(screen.queryByLabelText('카드를 선택하면 본문으로 이동')).toBeNull();
    openMenu();
    expect(scrollBox().checked).toBe(true);
    expect(dblBox().checked).toBe(true);
  });

  it('저장된 설정을 보여 준다', () => {
    setCharViewSettings({ autoScroll: false, dblClickModal: false });
    render(<CharViewSettingsMenu />);
    openMenu();
    expect(scrollBox().checked).toBe(false);
    expect(dblBox().checked).toBe(false);
  });

  it('항목을 바꾸면 바로 저장하고, 다른 항목은 그대로 둔다', () => {
    render(<CharViewSettingsMenu />);
    openMenu();
    fireEvent.click(scrollBox());
    expect(getCharViewSettings()).toEqual({ autoScroll: false, dblClickModal: true });
    fireEvent.click(dblBox());
    expect(getCharViewSettings()).toEqual({ autoScroll: false, dblClickModal: false });
    expect(scrollBox().checked).toBe(false);
  });

  it('버튼을 다시 누르면 닫히고, 다시 열면 저장된 값이 보인다', () => {
    render(<CharViewSettingsMenu />);
    openMenu();
    fireEvent.click(dblBox());
    openMenu();
    expect(screen.queryByLabelText('카드를 더블클릭하면 큰 창으로 열기')).toBeNull();
    openMenu();
    expect(dblBox().checked).toBe(false);
  });

  it('Esc 로 닫는다', () => {
    render(<CharViewSettingsMenu />);
    openMenu();
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.queryByLabelText('카드를 선택하면 본문으로 이동')).toBeNull();
  });
});
