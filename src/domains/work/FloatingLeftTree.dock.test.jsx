// Copyright (c) dendr000. MIT License.
// @vitest-environment jsdom
// 문서 트리: 본문 옆에 붙은(docked) 모드와 접힌(손잡이) 모드.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';

vi.mock('react-router-dom', () => ({ useNavigate: () => vi.fn() }));

import FloatingLeftTree from './FloatingLeftTree';

const pages = [{ id: 1, title: '조직', parentId: null }];
const renderTree = (over = {}) =>
  render(<FloatingLeftTree workId="91" workTitle="시험 작품" pageId={null} wikiPages={pages} {...over} />);

beforeEach(() => localStorage.clear());
afterEach(cleanup);

describe('FloatingLeftTree 붙은 모드', () => {
  it('붙은 모드에서는 문서 트리 영역(complementary)으로 보이고 손잡이는 없다', () => {
    renderTree({ docked: true, onCollapse: () => {} });
    expect(screen.getByRole('complementary', { name: '문서 트리' })).toBeTruthy();
    expect(screen.queryByTitle(/문서 트리 (열기|고정)/)).toBeNull();
  });

  it('붙은 모드에서도 트리 내용(작품 첫 화면 행, 문서)이 그대로 나온다', () => {
    renderTree({ docked: true, onCollapse: () => {} });
    expect(screen.getByRole('button', { name: /시험 작품.*첫 화면/ })).toBeTruthy();
    expect(screen.getByText('조직')).toBeTruthy();
  });

  it('"문서 트리 접기" 버튼을 누르면 onCollapse 가 호출된다', () => {
    const onCollapse = vi.fn();
    renderTree({ docked: true, onCollapse });
    fireEvent.click(screen.getByRole('button', { name: '문서 트리 접기' }));
    expect(onCollapse).toHaveBeenCalledTimes(1);
  });

  it('붙은 모드가 아니면 접기 버튼이 없다', () => {
    renderTree({ docked: false });
    expect(screen.queryByRole('button', { name: '문서 트리 접기' })).toBeNull();
    expect(screen.queryByRole('complementary')).toBeNull();
  });
});

describe('FloatingLeftTree 접힌(손잡이) 모드', () => {
  it('붙일 수 있는 폭(onDock 있음)이면 손잡이를 누를 때 onDock 이 호출된다', () => {
    const onDock = vi.fn();
    renderTree({ onDock });
    fireEvent.click(screen.getByTitle('문서 트리 고정'));
    expect(onDock).toHaveBeenCalledTimes(1);
  });

  it('붙일 수 없는 폭(onDock 없음)이면 손잡이는 예전처럼 "열기" 안내만 한다', () => {
    renderTree();
    expect(screen.getByTitle('문서 트리 열기')).toBeTruthy();
  });
});
