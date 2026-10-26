// Copyright (c) dendr000. MIT License.
// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';

const navigate = vi.hoisted(() => vi.fn());
vi.mock('react-router-dom', () => ({ useNavigate: () => navigate }));

import FloatingLeftTree from './FloatingLeftTree';

const pages = [
  { id: 1, title: '조직', parentId: null },
  { id: 2, title: '북부', parentId: 1 },
  { id: 3, title: '세계관', parentId: null },
];

const renderTree = (over = {}) =>
  render(<FloatingLeftTree workId="91" workTitle="시험 작품" pageId={null} wikiPages={pages} {...over} />);

const row = (title) => screen.getByText(title).closest('[class*="treeNodeRow"]');

// '조직' 폴더(1번)를 펼쳐 둔 상태로 시작한다(그 아래 '북부'가 보이게)
beforeEach(() => { navigate.mockReset(); localStorage.clear(); localStorage.setItem('galpi-tree-open-91', JSON.stringify([1])); });
afterEach(cleanup);

describe('FloatingLeftTree 작품 첫 화면으로 이동', () => {
  it('트리 맨 위에 작품 이름 행이 있고, 누르면 작품 첫 화면으로 이동한다', () => {
    renderTree();
    fireEvent.click(screen.getByRole('button', { name: /시험 작품.*첫 화면/ }));
    expect(navigate).toHaveBeenCalledWith('/work/91');
  });

  it('하위 문서를 보고 있지 않을 때만 현재 위치로 표시한다', () => {
    renderTree({ pageId: null });
    expect(screen.getByRole('button', { name: /시험 작품.*첫 화면/ }).getAttribute('aria-current')).toBe('page');
    cleanup();
    renderTree({ pageId: '2' });
    expect(screen.getByRole('button', { name: /시험 작품.*첫 화면/ }).getAttribute('aria-current')).toBeNull();
  });

  it('하위 문서가 하나도 없어도 작품 첫 화면 행은 보이고 안내 문구도 나온다', () => {
    renderTree({ wikiPages: [] });
    expect(screen.getByRole('button', { name: /시험 작품.*첫 화면/ })).toBeTruthy();
    expect(screen.getByText('생성된 하위 문서가 없습니다.')).toBeTruthy();
  });

  it('작품 이름이 없으면 "작품"으로 보인다', () => {
    renderTree({ workTitle: undefined });
    expect(screen.getByRole('button', { name: /작품.*첫 화면/ })).toBeTruthy();
  });
});

describe('FloatingLeftTree 우클릭 메뉴(문서)', () => {
  it('문서를 우클릭하면 메뉴가 열리고 기본 우클릭 메뉴는 막는다', () => {
    renderTree();
    const notPrevented = fireEvent.contextMenu(row('북부'));
    expect(notPrevented).toBe(false); // preventDefault 호출됨
    expect(screen.getByRole('menu')).toBeTruthy();
  });

  it('"하위 문서 만들기"는 그 문서 아래에 만든다', () => {
    renderTree();
    fireEvent.contextMenu(row('조직'));
    fireEvent.click(screen.getByRole('menuitem', { name: '하위 문서 만들기' }));
    expect(navigate).toHaveBeenCalledWith('/edit?type=page&action=new&workId=91&parentId=1');
  });

  it('"같은 위치에 문서 만들기"는 그 문서와 같은 상위 문서 아래에 만든다', () => {
    renderTree();
    fireEvent.contextMenu(row('북부'));
    fireEvent.click(screen.getByRole('menuitem', { name: '같은 위치에 문서 만들기' }));
    expect(navigate).toHaveBeenCalledWith('/edit?type=page&action=new&workId=91&parentId=1');
  });

  it('최상위 문서의 "같은 위치"는 최상위에 만든다', () => {
    renderTree();
    fireEvent.contextMenu(row('세계관'));
    fireEvent.click(screen.getByRole('menuitem', { name: '같은 위치에 문서 만들기' }));
    expect(navigate).toHaveBeenCalledWith('/edit?type=page&action=new&workId=91');
  });

  it('"문서 열기"는 그 문서를 연다', () => {
    renderTree();
    fireEvent.contextMenu(row('북부'));
    fireEvent.click(screen.getByRole('menuitem', { name: '문서 열기' }));
    expect(navigate).toHaveBeenCalledWith('/work/91?pageId=2');
  });

  it('항목을 고르면 메뉴가 닫힌다', () => {
    renderTree();
    fireEvent.contextMenu(row('북부'));
    fireEvent.click(screen.getByRole('menuitem', { name: '문서 열기' }));
    expect(screen.queryByRole('menu')).toBeNull();
  });

  it('Esc 를 누르거나 다른 곳을 누르면 닫힌다', () => {
    renderTree();
    fireEvent.contextMenu(row('북부'));
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('menu')).toBeNull();
    fireEvent.contextMenu(row('북부'));
    fireEvent.mouseDown(document.body);
    expect(screen.queryByRole('menu')).toBeNull();
  });

  it('다른 문서를 우클릭하면 메뉴가 그 문서 기준으로 바뀐다', () => {
    renderTree();
    fireEvent.contextMenu(row('북부'));
    fireEvent.contextMenu(row('세계관'));
    expect(screen.getAllByRole('menu')).toHaveLength(1);
    fireEvent.click(screen.getByRole('menuitem', { name: '하위 문서 만들기' }));
    expect(navigate).toHaveBeenCalledWith('/edit?type=page&action=new&workId=91&parentId=3');
  });

  it('Shift+우클릭은 앱 전체 메뉴가 쓰므로 여기서는 열지 않는다', () => {
    renderTree();
    fireEvent.contextMenu(row('북부'), { shiftKey: true });
    expect(screen.queryByRole('menu')).toBeNull();
  });
});

describe('FloatingLeftTree 우클릭 메뉴(최상위)', () => {
  it('작품 이름 행을 우클릭하면 "최상위 문서 만들기"가 나온다', () => {
    renderTree();
    fireEvent.contextMenu(screen.getByRole('button', { name: /시험 작품.*첫 화면/ }));
    expect(screen.queryByRole('menuitem', { name: '하위 문서 만들기' })).toBeNull();
    fireEvent.click(screen.getByRole('menuitem', { name: '최상위 문서 만들기' }));
    expect(navigate).toHaveBeenCalledWith('/edit?type=page&action=new&workId=91');
  });

  it('트리의 빈 곳을 우클릭해도 "최상위 문서 만들기"가 나온다', () => {
    renderTree();
    fireEvent.contextMenu(document.querySelector('[data-tree-body]'));
    fireEvent.click(screen.getByRole('menuitem', { name: '최상위 문서 만들기' }));
    expect(navigate).toHaveBeenCalledWith('/edit?type=page&action=new&workId=91');
  });

  it('하위 문서가 하나도 없는 작품에서도 최상위 문서를 만들 수 있다', () => {
    renderTree({ wikiPages: [] });
    fireEvent.contextMenu(document.querySelector('[data-tree-body]'));
    fireEvent.click(screen.getByRole('menuitem', { name: '최상위 문서 만들기' }));
    expect(navigate).toHaveBeenCalledWith('/edit?type=page&action=new&workId=91');
  });
});

describe('FloatingLeftTree 기존 동작 유지', () => {
  it('문서를 누르면 그 문서로 이동한다', () => {
    renderTree();
    fireEvent.click(row('세계관'));
    expect(navigate).toHaveBeenCalledWith('/work/91?pageId=3');
  });

  it('보고 있는 문서는 자동으로 펼쳐져 그 하위 문서가 보인다', () => {
    localStorage.clear();
    renderTree({ pageId: '1' });
    expect(screen.getByText('북부')).toBeTruthy();
  });
});
