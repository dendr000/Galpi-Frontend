// Copyright (c) dendr000. MIT License.
// @vitest-environment jsdom
// 그리드 카드를 눌러 선택하면 본문 구역으로 이동하는 동작.
import React, { useState } from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, fireEvent, cleanup } from '@testing-library/react';
import { useGridSelectScroll, scrollToCharCard } from './useGridSelectScroll';
import { setCharViewSettings } from './charViewSettings';

// 본문 구역(id)은 선택된 캐릭터가 있을 때만 그려진다 - 실제 작품 페이지와 같은 조건.
const Harness = () => {
  const [activeId, setActiveId] = useState(null);
  const select = useGridSelectScroll(setActiveId);
  return (
    <div>
      <button onClick={() => select(7)}>선택</button>
      <button onClick={() => select(null)}>해제</button>
      <button onClick={() => select(8)}>다른 캐릭터</button>
      {activeId !== null && <section id="character-detail-section">본문 {activeId}</section>}
    </div>
  );
};

let scrollSpy;
beforeEach(() => {
  localStorage.clear();
  scrollSpy = vi.fn();
  Element.prototype.scrollIntoView = scrollSpy;
});
afterEach(() => { cleanup(); delete Element.prototype.scrollIntoView; });

describe('useGridSelectScroll', () => {
  it('선택하면 본문 구역이 그려진 뒤에 그 위치로 부드럽게 이동한다', () => {
    const { getByText } = render(<Harness />);
    fireEvent.click(getByText('선택'));
    expect(scrollSpy).toHaveBeenCalledTimes(1);
    expect(scrollSpy.mock.instances[0].id).toBe('character-detail-section');
    expect(scrollSpy).toHaveBeenCalledWith({ behavior: 'smooth', block: 'start' });
  });

  it('선택을 해제할 때는 이동하지 않는다', () => {
    const { getByText } = render(<Harness />);
    fireEvent.click(getByText('선택'));
    scrollSpy.mockClear();
    fireEvent.click(getByText('해제'));
    expect(scrollSpy).not.toHaveBeenCalled();
  });

  it('본문 구역이 화면에 남아 있어도 해제(null)는 이동하지 않는다', () => {
    const Always = () => {
      const select = useGridSelectScroll(() => {});
      return (<div><button onClick={() => select(null)}>해제</button><section id="character-detail-section" /></div>);
    };
    const { getByText } = render(<Always />);
    fireEvent.click(getByText('해제'));
    expect(scrollSpy).not.toHaveBeenCalled();
  });

  it('다른 캐릭터로 바꿔도 본문으로 이동한다', () => {
    const { getByText } = render(<Harness />);
    fireEvent.click(getByText('선택'));
    fireEvent.click(getByText('다른 캐릭터'));
    expect(scrollSpy).toHaveBeenCalledTimes(2);
  });

  it('설정에서 자동 이동을 끄면 선택만 하고 이동하지 않는다', () => {
    setCharViewSettings({ autoScroll: false });
    const { getByText, container } = render(<Harness />);
    fireEvent.click(getByText('선택'));
    expect(container.querySelector('#character-detail-section').textContent).toBe('본문 7');
    expect(scrollSpy).not.toHaveBeenCalled();
  });

  it('본문 구역이 없으면(문서 보기 중 등) 오류 없이 아무것도 하지 않는다', () => {
    const NoSection = () => {
      const select = useGridSelectScroll(() => {});
      return <button onClick={() => select(1)}>선택</button>;
    };
    const { getByText } = render(<NoSection />);
    expect(() => fireEvent.click(getByText('선택'))).not.toThrow();
    expect(scrollSpy).not.toHaveBeenCalled();
  });
});

describe('scrollToCharCard', () => {
  it('해당 카드를 화면 가운데로 이동한다', () => {
    document.body.innerHTML = '<div id="char-card-3"></div>';
    scrollToCharCard(3);
    expect(scrollSpy).toHaveBeenCalledWith({ behavior: 'smooth', block: 'center' });
    document.body.innerHTML = '';
  });

  it('카드가 없거나 id 가 비어 있으면 오류 없이 넘어간다', () => {
    expect(() => scrollToCharCard(99)).not.toThrow();
    expect(() => scrollToCharCard(null)).not.toThrow();
    expect(scrollSpy).not.toHaveBeenCalled();
  });
});
