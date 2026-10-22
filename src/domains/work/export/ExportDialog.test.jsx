// Copyright (c) dendr000. MIT License.
// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent, waitFor } from '@testing-library/react';
import ExportDialog from './ExportDialog';

afterEach(cleanup);

const renderDialog = (over = {}) => {
  const props = { open: true, onClose: vi.fn(), onExport: vi.fn(async () => {}), hasClassified: true, ...over };
  render(<ExportDialog {...props} />);
  return props;
};

describe('ExportDialog', () => {
  it('열려 있지 않으면 아무것도 그리지 않는다', () => {
    const { container } = render(<ExportDialog open={false} onClose={() => {}} onExport={() => {}} hasClassified />);
    expect(container.firstChild).toBeNull();
  });

  it('제목과 옵션(기밀 처리, 이미지 포함, 하위 문서 포함)을 보여 준다. 기본값은 가림, 이미지 포함, 문서 포함', () => {
    renderDialog();
    expect(screen.getByRole('dialog', { name: '공개용 HTML 내보내기' })).toBeTruthy();
    expect(screen.getByLabelText(/가림/).checked).toBe(true);
    expect(screen.getByLabelText('제외').checked).toBe(false);
    expect(screen.getByLabelText('그대로').checked).toBe(false);
    expect(screen.getByLabelText(/이미지 포함/).checked).toBe(true);
    expect(screen.getByLabelText(/하위 문서 포함/).checked).toBe(true);
  });

  it('기밀 캐릭터가 없으면 기밀 처리 선택을 보여 주지 않는다', () => {
    renderDialog({ hasClassified: false });
    expect(screen.queryByLabelText(/가림/)).toBeNull();
  });

  it('기밀 처리는 인물 카드에만 적용된다는 안내를 보여 준다', () => {
    renderDialog();
    expect(screen.getByText(/본문에 직접 쓴 내용은 그대로/)).toBeTruthy();
  });

  it('내보내기를 누르면 고른 옵션으로 onExport 를 부르고, 끝나면 닫는다', async () => {
    const props = renderDialog();
    fireEvent.click(screen.getByLabelText('제외'));
    fireEvent.click(screen.getByLabelText(/이미지 포함/));
    fireEvent.click(screen.getByRole('button', { name: '내보내기' }));
    await waitFor(() => expect(props.onClose).toHaveBeenCalled());
    expect(props.onExport).toHaveBeenCalledWith({ classified: 'exclude', images: false, pages: true });
  });

  it('기밀 캐릭터가 없으면 기밀 옵션은 기본값(가림)으로 보낸다', async () => {
    const props = renderDialog({ hasClassified: false });
    fireEvent.click(screen.getByRole('button', { name: '내보내기' }));
    await waitFor(() => expect(props.onExport).toHaveBeenCalled());
    expect(props.onExport.mock.calls[0][0].classified).toBe('mask');
  });

  it('만드는 동안에는 버튼이 잠기고 "만드는 중"이 보인다', async () => {
    let finish;
    const onExport = vi.fn(() => new Promise((res) => { finish = res; }));
    const props = renderDialog({ onExport });
    fireEvent.click(screen.getByRole('button', { name: '내보내기' }));
    expect(await screen.findByText(/만드는 중/)).toBeTruthy();
    expect(screen.getByRole('button', { name: /만드는 중|내보내기/ }).disabled).toBe(true);
    expect(screen.getByRole('button', { name: '취소' }).disabled).toBe(true);
    finish();
    await waitFor(() => expect(props.onClose).toHaveBeenCalled());
  });

  it('실패하면 닫지 않고 오류 안내를 보여 주며 다시 시도할 수 있다', async () => {
    const onExport = vi.fn(async () => { throw new Error('boom'); });
    const props = renderDialog({ onExport });
    fireEvent.click(screen.getByRole('button', { name: '내보내기' }));
    expect(await screen.findByRole('alert')).toBeTruthy();
    expect(props.onClose).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: '내보내기' }).disabled).toBe(false);
  });

  it('취소를 누르면 닫는다', () => {
    const props = renderDialog();
    fireEvent.click(screen.getByRole('button', { name: '취소' }));
    expect(props.onClose).toHaveBeenCalled();
  });
});
