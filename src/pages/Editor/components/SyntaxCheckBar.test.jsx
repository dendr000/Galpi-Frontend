// Copyright (c) dendr000. MIT License.
// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import SyntaxCheckBar, { lineStartIndex } from './SyntaxCheckBar';

afterEach(cleanup);

describe('lineStartIndex', () => {
  it('줄 번호의 시작 위치를 돌려준다', () => {
    expect(lineStartIndex('가\n나나\n다', 1)).toBe(0);
    expect(lineStartIndex('가\n나나\n다', 2)).toBe(2);
    expect(lineStartIndex('가\n나나\n다', 3)).toBe(5);
  });
  it('줄보다 큰 번호는 글 끝이다', () => {
    expect(lineStartIndex('가\n나', 9)).toBe(3);
  });
});

describe('SyntaxCheckBar', () => {
  it('문제가 없으면 아무것도 그리지 않는다', () => {
    const { container } = render(<SyntaxCheckBar text={'# 제목\n본문'} editorRef={{ current: null }} />);
    expect(container.firstChild).toBeNull();
  });

  it('문제가 있으면 건수를 보여 주고 펼치면 목록이 나온다', () => {
    render(<SyntaxCheckBar text={'앞글\n[로그탭:노랑]\n내용'} editorRef={{ current: null }} />);
    expect(screen.getByText('문법 확인 1건')).toBeTruthy();
    expect(screen.queryByText(/2줄/)).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: /문법 확인/ }));
    expect(screen.getByText(/2줄/)).toBeTruthy();
  });

  it('항목을 누르면 그 줄로 커서가 옮겨진다', () => {
    const ta = document.createElement('textarea');
    ta.value = '앞글\n[로그탭:노랑]\n내용';
    document.body.appendChild(ta);
    render(<SyntaxCheckBar text={ta.value} editorRef={{ current: ta }} />);
    fireEvent.click(screen.getByRole('button', { name: /문법 확인/ }));
    fireEvent.click(screen.getByText(/2줄/));
    expect(ta.selectionStart).toBe(3);
    ta.remove();
  });
});
