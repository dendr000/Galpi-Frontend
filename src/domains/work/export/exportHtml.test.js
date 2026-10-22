// Copyright (c) dendr000. MIT License.
import { describe, it, expect } from 'vitest';
import { escapeHtml, buildExportHtml } from './exportHtml';

const model = (over = {}) => ({
  title: '시험 작품', creator: '작가', genre: '판타지', status: '연재 중', coverSrc: '',
  overviewHtml: '<p>개요 본문</p>', settingsHtml: '<p>설정 본문</p>',
  ratings: { axes: [], scale: [] },
  groups: [], pages: [], generatedAt: '2026-10-22',
  ...over,
});

const char = (over = {}) => ({
  id: 1, name: '릴리', subtitle: '', imgSrc: '', props: [['나이', '21세']], badges: [], detailHtml: '', masked: false, secret: false, ...over,
});

describe('escapeHtml', () => {
  it('HTML 특수문자를 바꾼다', () => {
    expect(escapeHtml('<b>"a" & \'b\'</b>')).toBe('&lt;b&gt;&quot;a&quot; &amp; &#39;b&#39;&lt;/b&gt;');
  });
  it('값이 없으면 빈 문자열, 숫자는 글자로', () => {
    expect(escapeHtml(undefined)).toBe('');
    expect(escapeHtml(null)).toBe('');
    expect(escapeHtml(3)).toBe('3');
  });
});

describe('buildExportHtml 문서 뼈대', () => {
  it('완전한 HTML 문서를 만든다(문서 선언, 언어, 인코딩, 화면 크기 설정)', () => {
    const html = buildExportHtml(model());
    expect(html.startsWith('<!doctype html>')).toBe(true);
    expect(html).toContain('<html lang="ko">');
    expect(html).toContain('<meta charset="utf-8">');
    expect(html).toContain('name="viewport"');
  });

  it('제목, 제작자, 분류, 상태와 내보낸 날짜를 넣는다', () => {
    const html = buildExportHtml(model());
    expect(html).toContain('<title>시험 작품</title>');
    expect(html).toContain('작가');
    expect(html).toContain('판타지');
    expect(html).toContain('연재 중');
    expect(html).toContain('2026-10-22');
  });

  it('제목과 제작자의 HTML 특수문자는 이스케이프한다(스크립트가 실행되지 않게)', () => {
    const html = buildExportHtml(model({ title: '<script>alert(1)</script>', creator: '"a"&' }));
    expect(html).not.toContain('<script>alert(1)</script>');
    expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
    expect(html).toContain('&quot;a&quot;&amp;');
  });

  it('라이트/다크 모드를 자동으로 따르는 스타일을 포함한다', () => {
    const html = buildExportHtml(model());
    expect(html).toContain('prefers-color-scheme: dark');
    expect(html).toContain('--text-primary');
  });

  it('스포일러는 이벤트 속성 없이 CSS 호버로 내용을 보여 준다', () => {
    const html = buildExportHtml(model());
    expect(html).toContain('.galpi-spoiler:hover');
  });

  it('외부 파일을 불러오지 않는 단일 파일이다(외부 스크립트, 스타일시트, 원격 이미지 없음)', () => {
    const html = buildExportHtml(model({ coverSrc: 'data:image/webp;base64,AAAA' }));
    expect(html).not.toMatch(/<script/i);
    expect(html).not.toMatch(/<link[^>]+rel=["']stylesheet/i);
    expect(html).not.toMatch(/(src|href)=["']https?:/i);
  });
});

describe('buildExportHtml 본문 구역', () => {
  it('개요와 설정을 각 구역에 넣는다', () => {
    const html = buildExportHtml(model());
    expect(html).toContain('id="overview"');
    expect(html).toContain('개요 본문');
    expect(html).toContain('id="settings"');
    expect(html).toContain('설정 본문');
  });

  it('개요나 설정이 비어 있으면 그 구역을 만들지 않는다', () => {
    const html = buildExportHtml(model({ overviewHtml: '', settingsHtml: '' }));
    expect(html).not.toContain('id="overview"');
    expect(html).not.toContain('id="settings"');
  });

  it('커버 이미지가 있으면 대문으로 넣는다', () => {
    expect(buildExportHtml(model({ coverSrc: 'data:image/webp;base64,AAAA' }))).toContain('<img class="cover" src="data:image/webp;base64,AAAA"');
    expect(buildExportHtml(model())).not.toContain('class="cover"');
  });

  it('등급 기준표가 있으면 판정 축과 기준을 표로 넣는다', () => {
    const html = buildExportHtml(model({
      ratings: { axes: [{ key: '위험도', abbr: 'R' }], scale: [{ level: 3, name: '중대', desc: '도시 단위' }] },
    }));
    expect(html).toContain('id="ratings"');
    expect(html).toContain('위험도');
    expect(html).toContain('도시 단위');
  });

  it('등급 설정이 없으면 기준표 구역이 없다', () => {
    expect(buildExportHtml(model())).not.toContain('id="ratings"');
  });

  it('위쪽 목차는 실제로 있는 구역만 가리킨다', () => {
    const html = buildExportHtml(model({ overviewHtml: '', groups: [{ name: '일반', chars: [char()] }] }));
    expect(html).toContain('href="#characters"');
    expect(html).not.toContain('href="#overview"');
  });
});

describe('buildExportHtml 인물', () => {
  it('그룹 이름과 인원 수, 인물 카드를 그린다', () => {
    const html = buildExportHtml(model({ groups: [{ name: '연인', chars: [char(), char({ id: 2, name: '레온' })] }] }));
    expect(html).toContain('연인');
    expect(html).toContain('(2)');
    expect(html).toContain('id="char-1"');
    expect(html).toContain('릴리');
    expect(html).toContain('id="char-2"');
  });

  it('속성은 이름과 값의 표로, 이미지는 있을 때만 넣는다', () => {
    const withImg = buildExportHtml(model({ groups: [{ name: 'g', chars: [char({ imgSrc: 'data:image/webp;base64,BBBB' })] }] }));
    expect(withImg).toContain('<th>나이</th>');
    expect(withImg).toContain('<td>21세</td>');
    expect(withImg).toContain('src="data:image/webp;base64,BBBB"');
    const noImg = buildExportHtml(model({ groups: [{ name: 'g', chars: [char()] }] }));
    expect(noImg).not.toContain('<img class="portrait"');
  });

  it('속성 이름과 값, 인물 이름의 특수문자를 이스케이프한다', () => {
    const html = buildExportHtml(model({ groups: [{ name: 'g', chars: [char({ name: '<i>x</i>', props: [['<k>', '<v>']] })] }] }));
    expect(html).not.toContain('<i>x</i>');
    expect(html).toContain('&lt;k&gt;');
    expect(html).toContain('&lt;v&gt;');
  });

  it('등급 배지를 작은 칩으로 넣고 설명은 title 에 둔다', () => {
    const html = buildExportHtml(model({ groups: [{ name: 'g', chars: [char({ badges: [{ abbr: 'R', level: 3, title: '위험도 3 중대: 도시 단위' }] })] }] }));
    expect(html).toContain('R 3');
    expect(html).toContain('title="위험도 3 중대: 도시 단위"');
  });

  it('상세 본문이 있으면 접었다 펴는 영역으로 넣는다', () => {
    const html = buildExportHtml(model({ groups: [{ name: 'g', chars: [char({ detailHtml: '<p>상세 내용</p>' })] }] }));
    expect(html).toContain('<details');
    expect(html).toContain('상세 내용');
    expect(buildExportHtml(model({ groups: [{ name: 'g', chars: [char()] }] }))).not.toContain('<details');
  });

  it('기밀 캐릭터(가림 처리)는 이름과 도장만 있고 속성, 이미지, 상세 내용이 없다', () => {
    const html = buildExportHtml(model({
      groups: [{ name: 'g', chars: [char({ masked: true, secret: true, imgSrc: 'data:image/webp;base64,SECRET', detailHtml: '<p>비밀 상세</p>', props: [['나이', '99세']] })] }],
    }));
    expect(html).toContain('릴리');
    expect(html).toContain('기밀');
    expect(html).not.toContain('SECRET');
    expect(html).not.toContain('비밀 상세');
    expect(html).not.toContain('99세');
  });

  it('기밀이지만 가리지 않는 캐릭터는 도장만 붙고 내용은 그대로 나온다', () => {
    const html = buildExportHtml(model({ groups: [{ name: 'g', chars: [char({ secret: true, props: [['나이', '33세']] })] }] }));
    expect(html).toContain('class="stamp"');
    expect(html).toContain('33세');
  });

  it('같은 인물이 여러 그룹에 나와도 id 는 처음 한 번만 붙인다(문서의 id 중복 방지)', () => {
    const html = buildExportHtml(model({ groups: [{ name: 'A', chars: [char()] }, { name: 'B', chars: [char()] }] }));
    expect(html.match(/id="char-1"/g)).toHaveLength(1);
    expect(html.match(/<h4>릴리<\/h4>/g)).toHaveLength(2);
  });

  it('인물이 하나도 없으면 인물 구역을 만들지 않는다', () => {
    expect(buildExportHtml(model())).not.toContain('id="characters"');
  });
});

describe('buildExportHtml 하위 문서', () => {
  it('하위 문서를 제목과 본문으로 넣고 소속 인물 이름을 인물 카드로 잇는다', () => {
    const html = buildExportHtml(model({
      groups: [{ name: 'g', chars: [char()] }],
      pages: [{ id: 7, title: '북부', html: '<p>북부 소개</p>', members: [{ id: 1, name: '릴리' }] }],
    }));
    expect(html).toContain('id="page-7"');
    expect(html).toContain('북부 소개');
    expect(html).toContain('href="#char-1"');
  });

  it('소속 인물이 가려진 기밀이거나 목록에 없으면 링크 없이 이름만 둔다', () => {
    const html = buildExportHtml(model({
      pages: [{ id: 7, title: '북부', html: '', members: [{ id: 99, name: '없는이' }] }],
    }));
    expect(html).toContain('없는이');
    expect(html).not.toContain('href="#char-99"');
  });

  it('하위 문서가 없으면 문서 구역이 없다', () => {
    expect(buildExportHtml(model())).not.toContain('id="pages"');
  });
});
