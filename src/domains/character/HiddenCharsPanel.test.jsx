// Copyright (c) dendr000. MIT License.
// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';

afterEach(cleanup);
import HiddenCharsPanel from './HiddenCharsPanel';

const hidden = [
  { char: { id: 1, name: '라우네아' }, formOf: '네아' },
  { char: { id: 2, name: '알라우멘트' }, formOf: '라우네아' },
];

describe('HiddenCharsPanel', () => {
  it('숨김 캐릭터가 없으면 아무것도 그리지 않는다', () => {
    const { container } = render(<HiddenCharsPanel hidden={[]} onRestore={vi.fn()} />);
    expect(container.firstChild).toBeNull();
  });

  it('접힌 상태에서는 인원 수만 보이고, 펼치면 이름과 복구 버튼이 나온다', () => {
    render(<HiddenCharsPanel hidden={hidden} onRestore={vi.fn()} />);
    expect(screen.getByText('숨김 캐릭터 2명')).toBeTruthy();
    expect(screen.queryByText('라우네아')).toBeNull();
    fireEvent.click(screen.getByRole('button', { expanded: false }));
    expect(screen.getByText('라우네아')).toBeTruthy();
    expect(screen.getByText('네아의 폼')).toBeTruthy();
  });

  it('복구 버튼은 그 캐릭터만 넘기고, 모두 복구는 전체를 넘긴다', async () => {
    const onRestore = vi.fn().mockResolvedValue({ done: 1, failed: 0 });
    render(<HiddenCharsPanel hidden={hidden} onRestore={onRestore} />);
    fireEvent.click(screen.getByRole('button', { expanded: false }));
    fireEvent.click(screen.getAllByText('복구')[0]);
    await waitFor(() => expect(onRestore).toHaveBeenCalledWith([hidden[0].char]));
    fireEvent.click(screen.getByText('모두 복구'));
    await waitFor(() => expect(onRestore).toHaveBeenLastCalledWith(hidden.map((h) => h.char)));
  });
});
