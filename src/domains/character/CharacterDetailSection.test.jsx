// Copyright (c) dendr000. MIT License.
// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, cleanup, fireEvent } from '@testing-library/react';
import CharacterDetailSection, { getCharBodyText } from './CharacterDetailSection';

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

describe('CharacterDetailSection "그리드로" 버튼', () => {
  const char = { id: 4, name: '릴리', pageBodyRaw: '본문' };

  it('onBackToGrid 가 있으면 버튼이 보이고, 누르면 그 캐릭터 id 로 부른다', () => {
    const onBackToGrid = vi.fn();
    const { getByRole } = render(<CharacterDetailSection activeChar={char} charSectionNum={1} styles={{}} onBackToGrid={onBackToGrid} />);
    fireEvent.click(getByRole('button', { name: /그리드로/ }));
    expect(onBackToGrid).toHaveBeenCalledWith(4);
  });

  it('폼 전환 등으로 기준 캐릭터(_baseCharId)가 있으면 그 id 를 넘긴다', () => {
    const onBackToGrid = vi.fn();
    const { getByRole } = render(<CharacterDetailSection activeChar={{ ...char, _baseCharId: 2 }} charSectionNum={1} styles={{}} onBackToGrid={onBackToGrid} />);
    fireEvent.click(getByRole('button', { name: /그리드로/ }));
    expect(onBackToGrid).toHaveBeenCalledWith(2);
  });

  it('onBackToGrid 가 없으면 버튼을 그리지 않는다', () => {
    const { queryByRole } = render(<CharacterDetailSection activeChar={char} charSectionNum={1} styles={{}} />);
    expect(queryByRole('button', { name: /그리드로/ })).toBeNull();
  });
});

describe('getCharBodyText', () => {
  it('pageBody.rawText, pageBodyRaw, 저장된 JSON 순으로 본문을 찾는다', () => {
    expect(getCharBodyText({ pageBody: { rawText: 'A' }, pageBodyRaw: 'B' })).toBe('A');
    expect(getCharBodyText({ pageBodyRaw: 'B' })).toBe('B');
    expect(getCharBodyText({ _rawDynamic: JSON.stringify({ pageBody: { rawText: 'C' } }) })).toBe('C');
  });

  it('본문이 없거나 JSON 이 깨졌으면 안내 문구', () => {
    expect(getCharBodyText({})).toBe('등록된 본문 내용이 없습니다.');
    expect(getCharBodyText({ _rawDynamic: '{깨짐' })).toBe('등록된 본문 내용이 없습니다.');
  });
});
