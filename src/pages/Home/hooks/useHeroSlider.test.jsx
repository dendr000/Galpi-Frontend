// Copyright (c) dendr000. MIT License.
// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useHeroSlider, SLIDE_INTERVAL_MS, SLIDE_TRANSITION_MS } from './useHeroSlider';

const work = (id, withCover = true) => ({ id, title: `작품${id}`, metaInfo: { meta: withCover ? { coverExt: 'png' } : {} } });
const worksOf = (n) => Array.from({ length: n }, (_, i) => work(i + 1));

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

const render = (works) => renderHook(({ w }) => useHeroSlider(w), { initialProps: { w: works } });
const tick = (ms) => act(() => { vi.advanceTimersByTime(ms); });

describe('useHeroSlider - 대상과 구성', () => {
  it('커버가 있는 작품만 슬라이드가 된다', () => {
    const works = [work(1), work(2, false), work(3)];
    const { result } = render(works);
    expect(result.current.slideWorks.map((w) => w.id).sort()).toEqual([1, 3]);
  });

  it('슬라이드가 둘 이상이면 트랙 끝에 첫 슬라이드의 복제본이 붙는다', () => {
    const { result } = render(worksOf(4));
    const { slideWorks, trackSlides } = result.current;
    expect(trackSlides).toHaveLength(5);
    expect(trackSlides[4].id).toBe(slideWorks[0].id);
  });

  it('섞은 뒤에도 작품 구성은 그대로다(빠지거나 중복 없음)', () => {
    const { result } = render(worksOf(10));
    expect(result.current.slideWorks.map((w) => w.id).sort((a, b) => a - b)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  });

  it('works가 같은 참조인 동안은 다시 렌더링해도 순서가 바뀌지 않는다', () => {
    const works = worksOf(10);
    const { result, rerender } = render(works);
    const before = result.current.slideWorks.map((w) => w.id);
    rerender({ w: works });
    tick(SLIDE_INTERVAL_MS);
    expect(result.current.slideWorks.map((w) => w.id)).toEqual(before);
  });

  it('슬라이드가 없으면 비어 있고 타이머도 돌지 않는다', () => {
    const { result } = render([work(1, false)]);
    expect(result.current.slideWorks).toEqual([]);
    expect(result.current.trackSlides).toEqual([]);
    tick(SLIDE_INTERVAL_MS * 3);
    expect(result.current.position).toBe(0);
  });

  it('슬라이드가 하나면 복제본 없이 제자리에 머문다', () => {
    const { result } = render(worksOf(1));
    expect(result.current.trackSlides).toHaveLength(1);
    tick(SLIDE_INTERVAL_MS * 3);
    expect(result.current.position).toBe(0);
  });
});

describe('useHeroSlider - 한쪽 방향으로만 넘어간다', () => {
  it('5초마다 한 칸씩 오른쪽(위치 +1)으로 넘어간다', () => {
    const { result } = render(worksOf(3));
    expect(result.current.position).toBe(0);
    tick(SLIDE_INTERVAL_MS);
    expect(result.current.position).toBe(1);
    tick(SLIDE_INTERVAL_MS);
    expect(result.current.position).toBe(2);
  });

  it('마지막 슬라이드 다음에는 되감지 않고 복제본(첫 슬라이드와 같은 화면)으로 한 칸 더 넘어간다', () => {
    const { result } = render(worksOf(3));
    tick(SLIDE_INTERVAL_MS * 3);
    expect(result.current.position).toBe(3);
    expect(result.current.trackSlides[3].id).toBe(result.current.trackSlides[0].id);
    expect(result.current.animate).toBe(true);
  });

  it('복제본에 도착해 전환이 끝나면 전환 효과를 끈 채 처음 위치로 순간 이동한다', () => {
    const { result } = render(worksOf(3));
    tick(SLIDE_INTERVAL_MS * 3);
    tick(SLIDE_TRANSITION_MS);
    expect(result.current.position).toBe(0);
    expect(result.current.animate).toBe(false);
  });

  it('순간 이동 직후 전환 효과가 다시 켜진다', () => {
    const { result } = render(worksOf(3));
    tick(SLIDE_INTERVAL_MS * 3 + SLIDE_TRANSITION_MS);
    tick(60);
    expect(result.current.animate).toBe(true);
  });

  it('복제본으로 넘어가는 전환 동안에는 전환 효과가 켜져 있어 오른쪽으로 계속 흐른다', () => {
    const { result } = render(worksOf(3));
    tick(SLIDE_INTERVAL_MS * 3);
    tick(SLIDE_TRANSITION_MS - 1);
    expect(result.current.position).toBe(3);
    expect(result.current.animate).toBe(true);
  });

  // 되감기가 없다는 핵심 보장: 전환 효과가 켜진 상태에서 위치가 줄어드는 순간이 한 번도 없어야 한다.
  it('여러 바퀴를 돌아도 전환 효과가 켜진 채로 위치가 줄어드는 일이 없다', () => {
    const { result } = render(worksOf(5));
    let prev = { position: result.current.position, animate: result.current.animate };
    let loops = 0;
    for (let ms = 0; ms < 5000 * 5 * 3 + 2000; ms += 50) {
      tick(50);
      const cur = { position: result.current.position, animate: result.current.animate };
      if (cur.position < prev.position) {
        expect(cur.animate, `위치 ${prev.position} -> ${cur.position} 감소는 전환 효과가 꺼진 순간 이동이어야 한다`).toBe(false);
        expect(cur.position).toBe(0);
        loops += 1;
      }
      prev = cur;
    }
    expect(loops).toBeGreaterThanOrEqual(3);
  });

  it('바퀴를 돌 때마다 보이는 슬라이드 순서가 같은 방향의 반복이다(1,2,...,N,1,2,...)', () => {
    const { result } = render(worksOf(3));
    const shown = [];
    for (let i = 0; i < 7; i += 1) {
      shown.push(result.current.trackSlides[result.current.position].id);
      tick(SLIDE_INTERVAL_MS);
      tick(SLIDE_TRANSITION_MS + 60);
    }
    const order = result.current.slideWorks.map((w) => w.id);
    const expected = Array.from({ length: 7 }, (_, i) => order[i % 3]);
    expect(shown.slice(0, 7)).toEqual(expected);
  });

  it('언마운트하면 타이머가 정리된다', () => {
    const { unmount } = render(worksOf(3));
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });
});
