import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../api/axiosCore', () => ({ default: { put: vi.fn() } }));

import api from '../../api/axiosCore';
import { getThemeCycle, detectGenreTheme, resolveGenreTheme, cycleWorkTheme, THEME_LABELS } from './genreTheme';
import { extractMeta } from '../../utils/markdownParser';

describe('getThemeCycle', () => {
  it('분류가 비어 있거나 매칭이 없으면 빈 배열', () => {
    expect(getThemeCycle(null)).toEqual([]);
    expect(getThemeCycle(undefined)).toEqual([]);
    expect(getThemeCycle('')).toEqual([]);
    expect(getThemeCycle('로맨스, 일상')).toEqual([]);
  });

  it("맨 앞에 'auto'가 오고 그 뒤에 그룹의 테마들이 이어진다", () => {
    expect(getThemeCycle('무협')).toEqual(['auto', 'wuxia', 'wuxia-ink', 'wuxia-blood', 'wuxia-ascend']);
  });

  it('태그 앞뒤 공백은 무시한다', () => {
    expect(getThemeCycle(' 무협 , 로맨스 ')).toEqual(getThemeCycle('무협'));
  });

  it('키워드는 태그 전체가 같아야 매칭된다(부분 문자열은 안 된다)', () => {
    expect(getThemeCycle('현대무협')).toEqual([]);
  });

  it('여러 그룹에 걸리면 태그 순서가 아니라 그룹 정의 순서로 이어 붙인다', () => {
    const cycle = getThemeCycle('사이버펑크, 무협');
    expect(cycle[0]).toBe('auto');
    expect(cycle.slice(1, 5)).toEqual(['wuxia', 'wuxia-ink', 'wuxia-blood', 'wuxia-ascend']);
    expect(cycle.slice(5)).toEqual(['cyberpunk-neon', 'cyberpunk-terminal', 'cyberpunk-graffiti']);
  });

  it('SF는 사이버펑크 그룹에 들어간다', () => {
    expect(getThemeCycle('SF')).toContain('cyberpunk-neon');
  });

  it('순환 후보의 모든 테마에 표시용 라벨이 있다', () => {
    const keywords = ['무협', '사이버펑크', '아포칼립스', '히어로', '헌터', '요괴', '괴담'];
    keywords.forEach((k) => {
      getThemeCycle(k).forEach((theme) => {
        expect(THEME_LABELS[theme], `${theme} 라벨 누락`).toBeTruthy();
      });
    });
  });
});

describe('detectGenreTheme', () => {
  it('매칭된 첫 그룹의 첫 번째 테마를 돌려준다', () => {
    expect(detectGenreTheme('무협')).toBe('wuxia');
    expect(detectGenreTheme('사이버펑크')).toBe('cyberpunk-neon');
  });

  it('매칭이 없으면 null', () => {
    expect(detectGenreTheme('')).toBeNull();
    expect(detectGenreTheme('로맨스')).toBeNull();
    expect(detectGenreTheme(null)).toBeNull();
  });

  // 장르 테마는 무작위가 아니라 결정적이다. 새로고침할 때마다 테마가 바뀌는 것처럼 보였던 건
  // 예전 테스트로 남은 themeOverride 값 때문이었다.
  it('여러 번 불러도 항상 같은 값(무작위 아님)', () => {
    const results = new Set(Array.from({ length: 50 }, () => detectGenreTheme('사이버펑크, 동양판타지, 시뮬레이션, 텍스트게임, SF')));
    expect([...results]).toEqual(['cyberpunk-neon']);
  });
});

describe('resolveGenreTheme', () => {
  it('수동 지정(override)이 있으면 장르 추천보다 우선한다', () => {
    expect(resolveGenreTheme('무협', 'hero-comic')).toBe('hero-comic');
    expect(resolveGenreTheme('', 'hero-comic')).toBe('hero-comic');
  });

  it("override가 없거나 'auto'면 장르 추천값을 쓴다", () => {
    expect(resolveGenreTheme('무협', undefined)).toBe('wuxia');
    expect(resolveGenreTheme('무협', null)).toBe('wuxia');
    expect(resolveGenreTheme('무협', 'auto')).toBe('wuxia');
  });

  it("추천도 없고 override가 'auto'면 null", () => {
    expect(resolveGenreTheme('로맨스', 'auto')).toBeNull();
  });
});

describe('cycleWorkTheme', () => {
  beforeEach(() => {
    api.put.mockReset();
    api.put.mockResolvedValue({});
  });

  const makeWork = (over = {}) => ({ id: 5, title: '작품', genre: '사이버펑크', description: '본문', ...over });

  it('순환할 테마가 없는 작품이면 null을 돌려주고 서버를 부르지 않는다', async () => {
    expect(await cycleWorkTheme(makeWork({ genre: '로맨스' }))).toBeNull();
    expect(api.put).not.toHaveBeenCalled();
  });

  it('auto에서 다음(첫 번째 테마)으로 넘기고 서버에 저장한다', async () => {
    const result = await cycleWorkTheme(makeWork());
    expect(result.theme).toBe('cyberpunk-neon');
    expect(extractMeta(result.description).meta.themeOverride).toBe('cyberpunk-neon');
    expect(extractMeta(result.description).clean).toBe('본문');
    expect(api.put).toHaveBeenCalledTimes(1);
    expect(api.put).toHaveBeenCalledWith('/api/works/5', expect.objectContaining({ id: 5, description: result.description }));
  });

  it('현재 테마의 다음 테마로 한 칸씩 이동한다', async () => {
    const work = makeWork({ description: '[META_DATA:{"themeOverride":"cyberpunk-neon"}]\n본문' });
    expect((await cycleWorkTheme(work)).theme).toBe('cyberpunk-terminal');
  });

  it("마지막 테마 다음은 'auto'로 돌아가고 themeOverride를 지운다", async () => {
    const work = makeWork({ description: '[META_DATA:{"themeOverride":"cyberpunk-graffiti"}]\n본문' });
    const result = await cycleWorkTheme(work);
    expect(result.theme).toBe('auto');
    expect(extractMeta(result.description).meta.themeOverride).toBeUndefined();
    expect(result.description).toBe('본문');
  });

  it('다른 메타 값(약칭 등)은 그대로 보존한다', async () => {
    const work = makeWork({ description: '[META_DATA:{"alias":"약칭"}]\n본문' });
    const result = await cycleWorkTheme(work);
    expect(extractMeta(result.description).meta).toEqual({ alias: '약칭', themeOverride: 'cyberpunk-neon' });
  });

  it("순환 후보에 없는 옛 테마가 저장돼 있으면 'auto'로 초기화한다", async () => {
    const work = makeWork({ description: '[META_DATA:{"themeOverride":"wuxia"}]\n본문' });
    expect((await cycleWorkTheme(work)).theme).toBe('auto');
  });

  it('후보 수만큼 누르면 처음 상태로 한 바퀴 돈다', async () => {
    let work = makeWork();
    const cycleLength = getThemeCycle(work.genre).length;
    const seen = [];
    for (let i = 0; i < cycleLength; i += 1) {
      const result = await cycleWorkTheme(work);
      seen.push(result.theme);
      work = { ...work, description: result.description };
    }
    expect(seen).toEqual(['cyberpunk-neon', 'cyberpunk-terminal', 'cyberpunk-graffiti', 'auto']);
  });
});
