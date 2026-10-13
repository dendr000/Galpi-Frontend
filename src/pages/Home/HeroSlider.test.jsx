// Copyright (c) dendr000. MIT License.
// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

const hookState = vi.hoisted(() => ({ value: null }));
vi.mock('./hooks/useHeroSlider', () => ({ useHeroSlider: () => hookState.value }));

import HeroSlider from './HeroSlider';

const w = (id, title) => ({ id, title, genre: '헌터, 하렘', creator: '작가', metaInfo: { meta: { coverExt: 'png' } } });
const a = w(1, '첫째 작품');
const b = w(2, '둘째 작품');

const renderSlider = () =>
  render(
    <MemoryRouter>
      <HeroSlider works={[]} />
    </MemoryRouter>
  );

const track = () => document.querySelector('[class*="hero-slider-inner"]');

afterEach(cleanup);

describe('HeroSlider', () => {
  it('슬라이드가 없으면 아무것도 그리지 않는다', () => {
    hookState.value = { slideWorks: [], trackSlides: [], position: 0, animate: true };
    const { container } = renderSlider();
    expect(container.firstChild).toBeNull();
  });

  it('트랙(복제본 포함) 전체를 그린다: 작품 2개면 슬라이드 3칸', () => {
    hookState.value = { slideWorks: [a, b], trackSlides: [a, b, a], position: 0, animate: true };
    renderSlider();
    expect(screen.getAllByRole('heading', { level: 1 }).map((h) => h.textContent)).toEqual(['첫째 작품', '둘째 작품', '첫째 작품']);
  });

  it('위치만큼 오른쪽으로 이동한 트랜스폼을 준다(translateX(-N*100%))', () => {
    hookState.value = { slideWorks: [a, b], trackSlides: [a, b, a], position: 2, animate: true };
    renderSlider();
    expect(track().style.transform).toBe('translateX(-200%)');
  });

  it('animate가 true면 CSS의 전환 효과를 그대로 쓴다', () => {
    hookState.value = { slideWorks: [a, b], trackSlides: [a, b, a], position: 1, animate: true };
    renderSlider();
    expect(track().style.transition).toBe('');
  });

  it('animate가 false(순간 이동)면 전환 효과를 끈다', () => {
    hookState.value = { slideWorks: [a, b], trackSlides: [a, b, a], position: 0, animate: false };
    renderSlider();
    expect(track().style.transition).toBe('none');
  });

  it('복제본과 원본이 같은 작품이어도 key 충돌 경고 없이 그려진다', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    hookState.value = { slideWorks: [a, b], trackSlides: [a, b, a], position: 0, animate: true };
    renderSlider();
    const keyWarnings = errorSpy.mock.calls.filter((c) => String(c[0]).includes('same key'));
    expect(keyWarnings).toHaveLength(0);
    errorSpy.mockRestore();
  });
});
