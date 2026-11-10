// Copyright (c) dendr000. MIT License.
// @vitest-environment jsdom
// 환경 설정 창: 줄 간격과 자동 저장 선택지가 설정 저장소와 연결돼 있는지 확인한다.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';

vi.mock('./GateSettingsPanel', () => ({ default: () => <div data-stub="gate" /> }));

import SettingModal from './SettingModal';
import useSettingStore from '../../store/useSettingStore';

beforeEach(() => {
  localStorage.clear();
  useSettingStore.setState({ lineHeight: '1.8', autoSaveInterval: '3' });
});
afterEach(cleanup);

describe('환경 설정 창: 줄 간격', () => {
  it('슬라이더를 움직이면 설정 저장소의 줄 간격이 바뀐다', () => {
    render(<SettingModal isOpen onClose={() => {}} />);
    const slider = screen.getByText(/줄 간격/).closest('label').querySelector('input[type="range"]');
    expect(slider.value).toBe('1.8');
    fireEvent.change(slider, { target: { value: '2.2' } });
    expect(useSettingStore.getState().lineHeight).toBe('2.2');
  });
});

describe('환경 설정 창: 자동 저장', () => {
  const openEditorTab = () => {
    render(<SettingModal isOpen onClose={() => {}} />);
    fireEvent.click(screen.getByText('에디터 및 단축키'));
    return screen.getByText(/자동 저장/).closest('label').querySelector('select');
  };

  it('"사용 안함" 선택지는 없고 3초(기본), 30초, 1분만 있다', () => {
    const select = openEditorTab();
    const labels = Array.from(select.options).map((o) => o.textContent);
    expect(labels).toEqual(['입력 후 3초 (기본)', '입력 후 30초', '입력 후 1분']);
    expect(select.value).toBe('3');
  });

  it('고르면 설정 저장소의 자동 저장 값이 바뀐다', () => {
    const select = openEditorTab();
    fireEvent.change(select, { target: { value: '60' } });
    expect(useSettingStore.getState().autoSaveInterval).toBe('60');
  });
});
