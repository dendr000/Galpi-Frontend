// Copyright (c) dendr000. MIT License.
// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import ClassifiedStamp from './ClassifiedStamp';

afterEach(cleanup);

describe('ClassifiedStamp', () => {
  it('"기밀" 글자의 도장을 그린다', () => {
    render(<ClassifiedStamp />);
    expect(screen.getByText('기밀')).toBeTruthy();
  });

  it('글자색과 바탕색이 테마와 무관하게 고정이라 어느 테마에서도 읽힌다', () => {
    render(<ClassifiedStamp />);
    const el = screen.getByText('기밀');
    expect(el.style.color).not.toContain('var(');
    expect(el.style.background).not.toContain('var(');
  });
});
