// Copyright (c) dendr000. MIT License.
// @vitest-environment jsdom
// 목차: 본문 옆에 붙은(docked) 모드와 접힌(손잡이) 모드.
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';

const navigate = vi.hoisted(() => vi.fn());
vi.mock('react-router-dom', () => ({ useNavigate: () => navigate }));

import FloatingToc from './FloatingToc';

const toc = [
  { id: 'a', text: '1. 개요', level: 1, targetId: 'sec-overview' },
  { id: 'b', text: '2. 설정', level: 1, targetId: 'sec-worldview' },
];
const renderToc = (over = {}) =>
  render(<FloatingToc workId="91" pageId={null} activePage={null} tocList={toc} {...over} />);

afterEach(() => { cleanup(); navigate.mockReset(); });

describe('FloatingToc 붙은 모드', () => {
  it('목차 영역(complementary)으로 보이고 항목이 나온다', () => {
    renderToc({ docked: true, onCollapse: () => {} });
    expect(screen.getByRole('complementary', { name: '목차' })).toBeTruthy();
    expect(screen.getByText('1. 개요')).toBeTruthy();
    expect(screen.getByText('2. 설정')).toBeTruthy();
  });

  it('"목차 접기" 버튼을 누르면 onCollapse 가 호출된다', () => {
    const onCollapse = vi.fn();
    renderToc({ docked: true, onCollapse });
    fireEvent.click(screen.getByRole('button', { name: '목차 접기' }));
    expect(onCollapse).toHaveBeenCalledTimes(1);
  });

  it('목차 항목을 누르면 그 제목 위치로 스크롤한다', () => {
    const target = document.createElement('h2');
    target.id = 'sec-overview';
    target.scrollIntoView = vi.fn();
    document.body.appendChild(target);
    renderToc({ docked: true, onCollapse: () => {} });
    fireEvent.click(screen.getByText('1. 개요'));
    expect(target.scrollIntoView).toHaveBeenCalled();
    target.remove();
  });

  it('편집 버튼은 작품 편집 화면으로 이동한다', () => {
    renderToc({ docked: true, onCollapse: () => {} });
    fireEvent.click(screen.getByRole('button', { name: /편집/ }));
    expect(navigate).toHaveBeenCalledWith('/edit?type=work&action=edit&id=91');
  });
});

describe('FloatingToc 접힌(손잡이) 모드', () => {
  it('붙일 수 있는 폭(onDock 있음)이면 손잡이를 누를 때 onDock 이 호출된다', () => {
    const onDock = vi.fn();
    renderToc({ onDock });
    fireEvent.click(screen.getByTitle('목차 고정'));
    expect(onDock).toHaveBeenCalledTimes(1);
  });

  it('접힌 모드에서는 목차 영역(complementary)이 아니라 손잡이만 보인다', () => {
    renderToc();
    expect(screen.queryByRole('complementary')).toBeNull();
  });

  it('붙일 수 없는 폭(onDock 없음)이면 예전처럼 "열기" 안내만 한다', () => {
    renderToc();
    expect(screen.getByTitle('목차 열기')).toBeTruthy();
  });
});
