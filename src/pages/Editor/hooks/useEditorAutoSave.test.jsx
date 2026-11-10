// Copyright (c) dendr000. MIT License.
// @vitest-environment jsdom
// 편집기 자동 저장: 입력이 멈춘 뒤 환경 설정에서 고른 시간이 지나면 저장한다.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useEditorAutoSave } from './useEditorAutoSave';
import useSettingStore from '../../../store/useSettingStore';

const baseProps = () => ({
  docAction: 'edit', loading: false, title: '시험 문서', rawText: '처음', overviewText: '',
  workMeta: {}, charProps: {}, themeColor: '', cardLabels: {}, isHidden: false,
  handleSave: vi.fn(), setSaveStatus: vi.fn(),
});

// 처음 그릴 때는 저장하지 않으므로, 한 번 그린 뒤 본문을 바꿔서 다시 그린다
const typeAfterMount = (props) => {
  const view = renderHook((p) => useEditorAutoSave(p), { initialProps: props });
  view.rerender({ ...props, rawText: '바꾼 글' });
  return view;
};

beforeEach(() => {
  vi.useFakeTimers();
  useSettingStore.setState({ autoSaveInterval: '3' });
});
afterEach(() => {
  vi.useRealTimers();
  useSettingStore.setState({ autoSaveInterval: '3' });
});

describe('useEditorAutoSave: 지연 시간', () => {
  it('기본(3초)이면 입력 3초 뒤에 저장한다', () => {
    const props = baseProps();
    typeAfterMount(props);
    vi.advanceTimersByTime(2999);
    expect(props.handleSave).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(props.handleSave).toHaveBeenCalledWith(true);
  });

  it('30초로 고르면 3초가 지나도 저장하지 않고 30초 뒤에 저장한다', () => {
    useSettingStore.setState({ autoSaveInterval: '30' });
    const props = baseProps();
    typeAfterMount(props);
    vi.advanceTimersByTime(3000);
    expect(props.handleSave).not.toHaveBeenCalled();
    vi.advanceTimersByTime(27000);
    expect(props.handleSave).toHaveBeenCalledTimes(1);
  });

  it('옛 설정값 "0" 이 남아 있어도 3초로 동작한다(자동 저장이 꺼지지 않는다)', () => {
    useSettingStore.setState({ autoSaveInterval: '0' });
    const props = baseProps();
    typeAfterMount(props);
    vi.advanceTimersByTime(3000);
    expect(props.handleSave).toHaveBeenCalledTimes(1);
  });
});

describe('useEditorAutoSave: 저장하지 않는 경우', () => {
  it('새 문서 작성(new)은 처음 저장하기 전까지 자동 저장하지 않는다', () => {
    const props = { ...baseProps(), docAction: 'new' };
    typeAfterMount(props);
    vi.advanceTimersByTime(70000);
    expect(props.handleSave).not.toHaveBeenCalled();
  });

  it('제목이 비어 있으면 저장하지 않는다', () => {
    const props = { ...baseProps(), title: '   ' };
    typeAfterMount(props);
    vi.advanceTimersByTime(70000);
    expect(props.handleSave).not.toHaveBeenCalled();
  });

  it('처음 그릴 때(불러오기)는 저장하지 않는다', () => {
    const props = baseProps();
    renderHook((p) => useEditorAutoSave(p), { initialProps: props });
    vi.advanceTimersByTime(70000);
    expect(props.handleSave).not.toHaveBeenCalled();
  });

  it('계속 입력하면 마지막 입력 기준으로 한 번만 저장한다', () => {
    const props = baseProps();
    const view = renderHook((p) => useEditorAutoSave(p), { initialProps: props });
    view.rerender({ ...props, rawText: 'a' });
    vi.advanceTimersByTime(2000);
    view.rerender({ ...props, rawText: 'ab' });
    vi.advanceTimersByTime(2000);
    expect(props.handleSave).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1000);
    expect(props.handleSave).toHaveBeenCalledTimes(1);
  });
});
