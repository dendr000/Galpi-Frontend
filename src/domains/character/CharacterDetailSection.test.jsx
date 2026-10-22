// Copyright (c) dendr000. MIT License.
// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, cleanup, fireEvent } from '@testing-library/react';
import CharacterDetailSection from './CharacterDetailSection';

afterEach(cleanup);

describe('CharacterDetailSection 본문 안의 [[이름]] 링크', () => {
  it('파란 링크를 누르면 이름을 onBacklink 로 넘긴다', () => {
    const onBacklink = vi.fn();
    const char = { id: 1, name: '릴리', pageBodyRaw: '그날 [[리안]]을 만났다.' };
    const { container } = render(<CharacterDetailSection activeChar={char} charSectionNum={3} styles={{}} onBacklink={onBacklink} />);
    const link = container.querySelector('.wiki-backlink');
    expect(link).not.toBeNull();
    fireEvent.click(link);
    expect(onBacklink).toHaveBeenCalledWith('리안');
  });
});
