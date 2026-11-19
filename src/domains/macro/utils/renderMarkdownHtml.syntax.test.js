// Copyright (c) dendr000. MIT License.
// @vitest-environment jsdom
// 작품 본문 문법 검수에서 찾은 오류를 재현하는 시험. 실제 본문에서 나온 사례를 기준으로 한다.
import { describe, it, expect } from 'vitest';
import { renderMarkdownHtml } from './renderMarkdownHtml';

const dom = (html) => new DOMParser().parseFromString(html, 'text/html');
const textOf = (html) => dom(html).body.textContent;
const cellsOf = (html) => Array.from(dom(html).querySelectorAll('td,th'));

describe('물결표(~) 와 취소선', () => {
  it('본문의 ~ 한 쌍은 취소선이 되지 않는다(3~5명, 에~ 재밌다~)', () => {
    const html = renderMarkdownHtml('약 3~5명, 10~20레벨 그리고 "에~? 있어~ 재밌다~"');
    expect(html).not.toContain('<del');
    expect(textOf(html)).toContain('3~5명, 10~20레벨');
  });

  it('-- 취소선 문법은 그대로 동작한다', () => {
    expect(renderMarkdownHtml('이것은 --취소-- 입니다')).toContain('<del');
  });

  it('범위 표기 2020--2024 와 A--B--C 는 취소선이 되지 않는다', () => {
    expect(renderMarkdownHtml('2020--2024년 and A--B--C')).not.toContain('<del');
  });
});

describe('표 셀 서식', () => {
  it('셀의 1~10, 20~30 은 굵게가 되지 않는다', () => {
    const html = renderMarkdownHtml('||이름||범위||\n||a||1~10, 20~30||');
    expect(html).not.toContain('<strong');
    expect(cellsOf(html)[3].textContent).toBe('1~10, 20~30');
  });

  it('표 편집기가 저장하는 ~굵게~ 와 셀 일부 굵게는 그대로 동작한다', () => {
    const html = renderMarkdownHtml('||이름||설명||\n||리안||~굵게~ 글 ~두번째~||');
    expect(dom(html).querySelectorAll('strong').length).toBe(2);
  });

  it('셀의 max_hp_value 는 밑줄이 유지되고 기울임이 되지 않는다', () => {
    const html = renderMarkdownHtml('||키||값||\n||max_hp_value||my_var_x||');
    expect(html).not.toContain('<em');
    expect(cellsOf(html)[2].textContent).toBe('max_hp_value');
  });

  it('셀 전체를 감싼 _기울임_ 과 --취소선-- 은 동작한다', () => {
    const d = dom(renderMarkdownHtml('||a||b||\n||_기울_||--취소--||'));
    expect(d.querySelectorAll('em').length).toBe(1);
    expect(d.querySelectorAll('del').length).toBe(1);
  });

  it('한 행에 10--20 과 a--b 가 있어도 칸이 깨지지 않는다', () => {
    const cells = cellsOf(renderMarkdownHtml('||구간||값||\n||10--20||a--b||'));
    expect(cells.length).toBe(4);
    expect(cells[2].textContent).toBe('10--20');
    expect(cells[3].textContent).toBe('a--b');
  });

  it('칸 사이에 걸친 --x||y-- 가 두 칸을 하나의 취소선으로 묶지 않는다', () => {
    const cells = cellsOf(renderMarkdownHtml('||a||b||\n||x --y||z-- w||'));
    expect(cells.length).toBe(4);
    expect(cells[2].textContent).toBe('x --y');
    expect(cells[3].textContent).toBe('z-- w');
  });

  it('화살표(->, =>, →)가 있는 행도 표의 행이다', () => {
    const html = renderMarkdownHtml('||스킬||효과||\n||A→B||강화 -> 약화||\n||C=>D||x||');
    expect(html).not.toContain('||');
    expect(dom(html).querySelectorAll('tr').length).toBe(3);
  });

  it('[br] 은 셀 안 줄바꿈이 된다', () => {
    const html = renderMarkdownHtml('||이름||설명||\n||리안||첫줄 [br] 둘째줄||');
    expect(html).not.toContain('[br]');
    expect(cellsOf(html)[3].innerHTML).toContain('<br');
  });
});

describe('코드와 관계도 보호', () => {
  it('코드 블록 안의 갈피 문법은 변환되지 않는다', () => {
    const d = dom(renderMarkdownHtml('```\n||a||b||\n**x** [red:y] [[l]]\n```'));
    expect(d.querySelector('table')).toBeNull();
    const code = d.querySelector('pre code').textContent;
    expect(code).toContain('||a||b||');
    expect(code).toContain('**x** [red:y] [[l]]');
  });

  it('인라인 코드 안의 서식 문법은 변환되지 않는다', () => {
    const codes = Array.from(dom(renderMarkdownHtml('명령 `**x**` 와 `--help --version`')).querySelectorAll('code')).map((c) => c.textContent);
    expect(codes).toEqual(['**x**', '--help --version']);
  });

  it('관계도 노드 이름의 --, ** 는 바뀌지 않는다', () => {
    const json = '{"nodes":[{"id":"1","label":"a--b","x":50,"y":50},{"id":"2","label":"**굵**","x":200,"y":50}],"edges":[]}';
    const texts = Array.from(dom(renderMarkdownHtml(`[RELATION_GRAPH]\n${json}\n[/RELATION_GRAPH]`)).querySelectorAll('text')).map((t) => t.textContent);
    expect(texts).toEqual(['a--b', '**굵**']);
  });
});

describe('색 문법', () => {
  it('영문 대괄호 상태창([HP: 100/100], [STR:15])은 글자 그대로 남는다', () => {
    expect(textOf(renderMarkdownHtml('[HP: 100/100] [STR:15] [Lv.1]')).trim()).toBe('[HP: 100/100] [STR:15] [Lv.1]');
  });

  it('색 이름, 16진수, bg- 는 계속 동작하고 중첩도 된다', () => {
    const d = dom(renderMarkdownHtml('[red:위험] [green:초록] [#ff8800:주황] [bg-yellow:강조] [red:[blue:안쪽]]'));
    expect(d.querySelectorAll('span[style*="color"]').length).toBe(6);
    expect(textOf(renderMarkdownHtml('[red:[blue:안쪽]]')).trim()).toBe('안쪽');
  });

  it('색 안에 대괄호나 백링크가 있어도 닫히는 자리가 맞다', () => {
    expect(textOf(renderMarkdownHtml('[red:대괄호 [안] 포함]')).trim()).toBe('대괄호 [안] 포함');
    const d = dom(renderMarkdownHtml('[red:[[리안]] 님]'));
    expect(d.querySelector('span[style*="color"] .wiki-backlink').textContent).toBe('리안');
  });
});

describe('로그탭 본문', () => {
  const tabBody = (html) => dom(html).querySelector('.galpi-log-tab-wrapper').lastElementChild;

  it('굵게, 색, 백링크, 각주가 유지된다', () => {
    const body = tabBody(renderMarkdownHtml('[로그탭:노랑]\n**굵게** [red:빨강] [[리안]] 끝[* 뜻]\n[/로그탭]'));
    expect(body.querySelector('strong').textContent).toBe('굵게');
    expect(body.querySelector('span[style*="color"]').textContent).toBe('빨강');
    expect(body.querySelector('.wiki-backlink').textContent).toBe('리안');
    expect(body.querySelector('.wiki-footnote')).not.toBeNull();
  });

  it('줄바꿈과 빈 줄이 유지된다', () => {
    const body = tabBody(renderMarkdownHtml('[로그탭:초록]\n첫줄\n둘째줄\n\n새 문단\n[/로그탭]'));
    expect(body.innerHTML).toContain('첫줄<br>둘째줄');
    expect(body.querySelectorAll('p').length).toBe(2);
  });

  it('표와 타임라인을 안에 넣을 수 있다', () => {
    const body = tabBody(renderMarkdownHtml('[로그탭:파랑]\n||a||b||\n||1||2||\n\n[TIMELINE]\n1년::::시작::::설명\n[/TIMELINE]\n[/로그탭]'));
    expect(body.querySelector('table')).not.toBeNull();
    expect(body.querySelector('.galpi-timeline')).not.toBeNull();
  });

  it('< 가 들어 있어도 본문이 잘리지 않는다', () => {
    const body = tabBody(renderMarkdownHtml('[로그탭:빨강]\nHP < 50 이면 위험\n둘째줄\n[/로그탭]'));
    expect(body.textContent).toContain('HP < 50 이면 위험');
    expect(body.innerHTML).toContain('<br>');
  });

  it('로그탭 앞뒤 글과 여러 로그탭이 그대로 유지된다', () => {
    const d = dom(renderMarkdownHtml('앞글\n\n[로그탭:노랑]a[/로그탭]\n\n[로그탭:빨강]b[/로그탭]\n\n뒷글'));
    expect(d.querySelectorAll('.galpi-log-tab-wrapper').length).toBe(2);
    expect(d.body.textContent).toContain('앞글');
    expect(d.body.textContent).toContain('뒷글');
  });
});

describe('제목 번호', () => {
  it('# 없이 ## 로 시작해도 0.1. 이 되지 않는다', () => {
    const t = textOf(renderMarkdownHtml('## 하위\n본문\n### 더하위'));
    expect(t).not.toContain('0.');
    expect(t).toContain('1.하위');
  });

  it('## 를 건너뛴 ### 에 0 이 들어간 번호가 붙지 않는다', () => {
    expect(textOf(renderMarkdownHtml('# 가\n### 건너뜀'))).not.toContain('.0.');
  });

  it('정상적인 # ## ### 번호는 그대로다', () => {
    const t = textOf(renderMarkdownHtml('# 가\n## 나\n### 다'));
    expect(t).toContain('1.가');
    expect(t).toContain('1.1.나');
    expect(t).toContain('1.1.1.다');
  });
});

describe('대화 매크로', () => {
  it('작품 이름과 확장자를 받아 그 확장자로 아바타를 찾는다', () => {
    const html = renderMarkdownHtml('[대화: 리안(당황):] 안녕 [/대화]', 1, { workTitle: '작품', charExt: 'webp' });
    const url = html.match(/url\('([^']+)'\)/)[1];
    expect(decodeURIComponent(url)).toBe('/img/character/작품_리안_당황.webp');
    expect(html).not.toContain('.png');
  });

  it('작품 정보가 없으면 엉뚱한 이미지 주소를 만들지 않는다', () => {
    const html = renderMarkdownHtml('[대화: 리안:] 안녕 [/대화]');
    expect(html).not.toContain('작품명');
    expect(html).not.toContain('background-image');
  });

  it('여러 줄 말풍선 맨 앞뒤에 빈 줄이 붙지 않는다', () => {
    const room = dom(renderMarkdownHtml('[대화: 리안:]\n첫줄\n둘째줄\n[/대화]')).querySelector('.galpi-ext-chat-room');
    const bubble = room.lastElementChild.lastElementChild;
    expect(bubble.innerHTML.startsWith('<br')).toBe(false);
    expect(bubble.innerHTML.endsWith('<br>')).toBe(false);
    expect(bubble.innerHTML).toContain('첫줄<br>둘째줄');
  });

  it('연속된 대화 사이에 <br> 가 끼지 않는다', () => {
    const html = renderMarkdownHtml('[대화: 리안:] 하나 [/대화]\n[우대화: 세이:] 둘 [/우대화]');
    expect(html).not.toMatch(/<\/div>\s*<br\s*\/?>\s*<div/);
  });
});
