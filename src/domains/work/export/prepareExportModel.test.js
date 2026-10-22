// Copyright (c) dendr000. MIT License.
// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { prepareExportModel } from './prepareExportModel';

const meta = (obj, body = '설정 본문') => `[META_DATA:${JSON.stringify(obj)}]\n${body}`;

const work = (over = {}) => ({
  id: 91, title: '시험 작품', creator: '작가', genre: '판타지', status: '연재 중',
  description: meta({ overview: '개요 본문', charExt: 'webp', coverExt: 'png', ratingAxes: '위험도:R', ratingScale: '3:중대:도시 단위' }),
  ...over,
});

const dp = (obj) => JSON.stringify(obj);
const ch = (id, over = {}) => ({ id, name: `인물${id}`, 관계: '일반', _propOrder: ['관계'], ...over });

const loadImage = vi.fn(async (url) => `data:image/webp;base64,${encodeURIComponent(url)}`);

const run = (over = {}) =>
  prepareExportModel({
    work: work(), characters: [ch(1), ch(2)], wikiPages: [], formSwaps: {}, groupCriteria: '관계', sortKey: '', sortDir: 'asc',
    options: { classified: 'mask', images: true, pages: true }, loadImage, today: '2026-10-22', ...over,
  });

describe('prepareExportModel 기본', () => {
  it('작품 정보, 개요, 설정, 날짜를 담는다', async () => {
    const m = await run();
    expect(m).toMatchObject({ title: '시험 작품', creator: '작가', genre: '판타지', status: '연재 중', generatedAt: '2026-10-22' });
    expect(m.overviewHtml).toContain('개요 본문');
    expect(m.settingsHtml).toContain('설정 본문');
  });

  it('등급 설정을 해석해 담는다', async () => {
    const m = await run();
    expect(m.ratings.axes).toEqual([{ key: '위험도', abbr: 'R' }]);
    expect(m.ratings.scale).toEqual([{ level: 3, name: '중대', desc: '도시 단위' }]);
  });

  it('커버 이미지는 확장자가 있고 이미지 포함 옵션이 켜졌을 때만 불러온다', async () => {
    loadImage.mockClear();
    const m = await run();
    expect(m.coverSrc).toContain(encodeURIComponent('/img/cover/' + encodeURIComponent('시험 작품.png')));
    const none = await run({ options: { classified: 'mask', images: false, pages: true } });
    expect(none.coverSrc).toBe('');
  });

  it('개요나 설정이 비어 있으면 빈 문자열', async () => {
    const m = await run({ work: work({ description: meta({}, '') }) });
    expect(m.overviewHtml).toBe('');
    expect(m.settingsHtml).toBe('');
  });
});

describe('prepareExportModel 인물', () => {
  it('분류별 그룹으로 묶고 인물 정보(이름, 속성, 이미지)를 담는다', async () => {
    const m = await run({ characters: [ch(1, { 관계: '연인', 나이: '21세', _propOrder: ['관계', '나이'] }), ch(2, { 관계: '친구' })] });
    expect(m.groups.map((g) => g.name)).toEqual(['연인', '친구']);
    const c = m.groups[0].chars[0];
    expect(c).toMatchObject({ id: 1, name: '인물1', masked: false, secret: false });
    expect(c.props).toEqual([['관계', '연인'], ['나이', '21세']]);
    expect(c.imgSrc).toContain(encodeURIComponent('/img/character/' + encodeURIComponent('시험 작품_인물1.webp')));
  });

  it('이미지 포함을 끄면 이미지를 불러오지 않는다', async () => {
    loadImage.mockClear();
    const m = await run({ options: { classified: 'mask', images: false, pages: true } });
    expect(m.groups[0].chars[0].imgSrc).toBe('');
    expect(loadImage).not.toHaveBeenCalled();
  });

  it('숨김 캐릭터는 항상 뺀다', async () => {
    const m = await run({ characters: [ch(1), ch(2, { dynamicProperties: dp({ _isHidden: true }) })] });
    expect(m.groups[0].chars.map((c) => c.id)).toEqual([1]);
  });

  it('시스템용 속성과 불명, 미상, 빈 값, 작품명, 제작자, 부제목은 표에서 뺀다. 부제목은 따로 담는다', async () => {
    const m = await run({
      characters: [ch(1, { 나이: '불명', 직책: '미상', 별명: '', 부제목: '검은 장미', 작품명: 'x', 제작자: 'y', _내부: 'z', 소속: '*비밀, 북부', _propOrder: ['관계', '나이', '직책', '별명', '부제목', '작품명', '제작자', '_내부', '소속'] })],
    });
    const c = m.groups[0].chars[0];
    expect(c.props).toEqual([['관계', '일반'], ['소속', '비밀, 북부']]);
    expect(c.subtitle).toBe('검은 장미');
  });

  it('등급 배지를 계산해 담는다', async () => {
    const m = await run({ characters: [ch(1, { 위험도: '3', _propOrder: ['관계', '위험도'] })] });
    expect(m.groups[0].chars[0].badges).toEqual([{ abbr: 'R', level: 3, title: '위험도 3 중대: 도시 단위' }]);
  });

  it('상세 본문을 HTML 로 바꿔 담는다(없으면 빈 문자열)', async () => {
    const m = await run({ characters: [ch(1, { pageBodyRaw: '상세 **굵게**' }), ch(2)] });
    expect(m.groups[0].chars[0].detailHtml).toContain('굵게');
    expect(m.groups[0].chars[1].detailHtml).toBe('');
  });

  it('같은 캐릭터가 여러 그룹에 들어가도 각 그룹에 담는다', async () => {
    const m = await run({ groupCriteria: '소속', characters: [ch(1, { 소속: '북부, 사교' })] });
    expect(m.groups.map((g) => g.name).sort()).toEqual(['북부', '사교']);
  });

  it('속성 정렬을 반영한다', async () => {
    const m = await run({ sortKey: '서열', sortDir: 'asc', characters: [ch(1, { 서열: '3' }), ch(2, { 서열: '1' })] });
    expect(m.groups[0].chars.map((c) => c.id)).toEqual([2, 1]);
  });
});

describe('prepareExportModel 기밀 처리', () => {
  const chars = () => [ch(1, { 기밀: 'Y', 나이: '99세', pageBodyRaw: '비밀 상세', _propOrder: ['관계', '나이'] }), ch(2)];

  it('mask: 기밀 캐릭터는 이름과 도장 표시만 남기고 속성, 이미지, 상세, 배지를 담지 않는다', async () => {
    loadImage.mockClear();
    const m = await run({ characters: chars(), options: { classified: 'mask', images: true, pages: false } });
    const c = m.groups[0].chars.find((x) => x.id === 1);
    expect(c).toMatchObject({ masked: true, secret: true, props: [], imgSrc: '', detailHtml: '', badges: [], subtitle: '' });
    expect(JSON.stringify(m)).not.toContain('99세');
    expect(JSON.stringify(m)).not.toContain('비밀 상세');
    expect(loadImage.mock.calls.some(([u]) => u.includes(encodeURIComponent('인물1')))).toBe(false);
  });

  it('exclude: 기밀 캐릭터를 목록에서 뺀다', async () => {
    const m = await run({ characters: chars(), options: { classified: 'exclude', images: true, pages: false } });
    expect(m.groups[0].chars.map((c) => c.id)).toEqual([2]);
  });

  it('keep: 기밀 캐릭터를 도장만 붙여 그대로 내보낸다', async () => {
    const m = await run({ characters: chars(), options: { classified: 'keep', images: true, pages: false } });
    const c = m.groups[0].chars.find((x) => x.id === 1);
    expect(c).toMatchObject({ masked: false, secret: true });
    expect(c.props).toContainEqual(['나이', '99세']);
    expect(c.detailHtml).toContain('비밀 상세');
  });

  it('기밀 속성 자체는 속성 표에 넣지 않는다', async () => {
    const m = await run({ characters: [ch(1, { 기밀: 'Y', _propOrder: ['관계', '기밀'] })], options: { classified: 'keep', images: false, pages: false } });
    expect(m.groups[0].chars[0].props).toEqual([['관계', '일반']]);
  });

  it('기밀이 아닌 값("아니오")이면 일반 캐릭터로 낸다', async () => {
    const m = await run({ characters: [ch(1, { 기밀: '아니오' })] });
    expect(m.groups[0].chars[0]).toMatchObject({ masked: false, secret: false });
  });
});

describe('prepareExportModel 하위 문서', () => {
  const pages = [{ id: 7, title: '북부', content: '북부 소개 [[릴리]]' }, { id: 8, title: '남부', content: '' }];

  it('하위 문서를 HTML 로 바꿔 담고 같은 소속의 인물 목록을 붙인다', async () => {
    const m = await run({ wikiPages: pages, characters: [ch(1, { 소속: '북부' }), ch(2, { 소속: '남부' })] });
    const p = m.pages.find((x) => x.id === 7);
    expect(p.title).toBe('북부');
    expect(p.html).toContain('북부 소개');
    expect(p.members).toEqual([{ id: 1, name: '인물1' }]);
  });

  it('문서 포함을 끄면 문서를 담지 않는다', async () => {
    const m = await run({ wikiPages: pages, options: { classified: 'mask', images: true, pages: false } });
    expect(m.pages).toEqual([]);
  });

  it('exclude 일 때 제외된 기밀 캐릭터는 소속 인물 목록에도 나오지 않는다', async () => {
    const m = await run({
      wikiPages: pages, characters: [ch(1, { 소속: '북부', 기밀: 'Y' }), ch(2, { 소속: '북부' })],
      options: { classified: 'exclude', images: false, pages: true },
    });
    expect(m.pages.find((p) => p.id === 7).members).toEqual([{ id: 2, name: '인물2' }]);
  });
});

describe('prepareExportModel 본문 안전', () => {
  it('본문에 직접 쓴 스크립트와 이벤트 속성은 제거한다', async () => {
    const m = await run({ work: work({ description: meta({ overview: '<script>alert(1)</script><b onclick="x()">굵게</b>' }) }) });
    expect(m.overviewHtml).not.toMatch(/script|onclick/i);
    expect(m.overviewHtml).toContain('굵게');
  });

  it('본문 속 /img/ 주소는 이미지 포함이면 데이터 주소로, 끄면 지운다', async () => {
    const body = '![그림](/img/character/a.png)';
    const on = await run({ work: work({ description: meta({}, body) }) });
    expect(on.settingsHtml).toContain('data:image/webp;base64,');
    expect(on.settingsHtml).not.toContain('"/img/');
    const off = await run({ work: work({ description: meta({}, body) }), options: { classified: 'mask', images: false, pages: true } });
    expect(off.settingsHtml).not.toContain('/img/');
    expect(off.settingsHtml).not.toContain('data:image');
  });
});
