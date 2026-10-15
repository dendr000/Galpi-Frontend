// Copyright (c) dendr000. MIT License.
// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { askText } from './askText';

afterEach(() => {
  delete window.openTextPromptModal;
  vi.restoreAllMocks();
});

describe('askText', () => {
  it('앱 안의 입력 모달이 있으면 그것으로 묻고 window.prompt 는 부르지 않는다', async () => {
    window.openTextPromptModal = vi.fn(() => Promise.resolve('새 폴더'));
    const promptSpy = vi.spyOn(window, 'prompt').mockImplementation(() => 'x');
    await expect(askText('폴더명:', '기본')).resolves.toBe('새 폴더');
    expect(window.openTextPromptModal).toHaveBeenCalledWith('폴더명:', '기본');
    expect(promptSpy).not.toHaveBeenCalled();
  });

  it('모달에서 취소하면 null 을 돌려준다', async () => {
    window.openTextPromptModal = vi.fn(() => Promise.resolve(null));
    await expect(askText('폴더명:')).resolves.toBeNull();
  });

  it('입력 모달이 없는 환경에서는 window.prompt 로 묻는다', async () => {
    vi.spyOn(window, 'prompt').mockReturnValue('폴백');
    await expect(askText('폴더명:', '기본')).resolves.toBe('폴백');
    expect(window.prompt).toHaveBeenCalledWith('폴더명:', '기본');
  });
});
