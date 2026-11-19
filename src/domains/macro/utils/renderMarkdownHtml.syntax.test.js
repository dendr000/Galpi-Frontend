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

describe('스포일러 열기', () => {
  it('마우스 올림 속성 대신 키보드 포커스를 받아 누르면(터치) 열린다', () => {
    const el = dom(renderMarkdownHtml('[스포일러]비밀[/스포일러]')).querySelector('.galpi-spoiler');
    expect(el.getAttribute('tabindex')).toBe('0');
    expect(el.getAttribute('role')).toBe('button');
    expect(el.hasAttribute('onmouseover')).toBe(false);
    expect(el.hasAttribute('onmouseout')).toBe(false);
  });
});

describe('백링크 별칭', () => {
  it('[[이름|표시글]] 은 표시글만 보이고 이동 대상은 이름이다', () => {
    const el = dom(renderMarkdownHtml('만난 사람 [[리안|그 소년]] 이다')).querySelector('.wiki-backlink');
    expect(el.textContent).toBe('그 소년');
    expect(el.getAttribute('data-target')).toBe('리안');
  });

  it('별칭이 없는 [[이름]] 은 그대로 동작한다', () => {
    const el = dom(renderMarkdownHtml('[[리안]]')).querySelector('.wiki-backlink');
    expect(el.textContent).toBe('리안');
    expect(el.hasAttribute('data-target')).toBe(false);
  });
});

describe('줄 끝 || 가 없는 표 행', () => {
  it('마지막 || 를 빼먹어도 표의 행이 된다', () => {
    const html = renderMarkdownHtml('||이름||설명||\n||리안||주인공');
    expect(html).not.toContain('||');
    expect(cellsOf(html).map((c) => c.textContent)).toEqual(['이름', '설명', '리안', '주인공']);
  });

  it('||로 시작하지만 칸 구분이 없는 글은 표가 아니다', () => {
    const d = dom(renderMarkdownHtml('||그냥 글'));
    expect(d.querySelector('table')).toBeNull();
  });
});

describe('본문에 직접 쓴 위험한 HTML', () => {
  it('이벤트 속성, script, javascript: 주소는 화면용 결과에서도 제거된다', () => {
    const html = renderMarkdownHtml('<img src="x" onerror="alert(1)">\n\n<script>alert(2)</script>\n\n<a href="javascript:alert(3)">누르기</a>');
    const d = dom(html);
    expect(d.querySelector('img').hasAttribute('onerror')).toBe(false);
    expect(d.querySelector('script')).toBeNull();
    expect(d.querySelector('a').hasAttribute('href')).toBe(false);
  });

  it('갈피 문법이 만든 서식과 스포일러, 각주는 그대로 남는다', () => {
    const d = dom(renderMarkdownHtml('[red:빨강] [스포일러]비밀[/스포일러] 끝[* 뜻]'));
    expect(d.querySelector('span[style*="color"]')).not.toBeNull();
    expect(d.querySelector('.galpi-spoiler').getAttribute('tabindex')).toBe('0');
    expect(d.querySelector('.wiki-footnote').getAttribute('data-content')).toBe('뜻');
  });
});

describe('코드 안의 매크로 예시', () => {
  it('코드 블록 안의 로그탭과 스포일러 예시는 그대로 글자로 남는다', () => {
    const d = dom(renderMarkdownHtml('```\n[로그탭:노랑]\n내용\n[/로그탭]\n[스포일러]비밀[/스포일러]\n```'));
    expect(d.querySelector('.galpi-log-tab-wrapper')).toBeNull();
    expect(d.querySelector('.galpi-spoiler')).toBeNull();
    const code = d.querySelector('pre code').textContent;
    expect(code).toContain('[로그탭:노랑]');
    expect(code).toContain('[스포일러]비밀[/스포일러]');
  });

  it('인라인 코드 안의 [스탯:...] 예시도 위젯이 되지 않는다', () => {
    const d = dom(renderMarkdownHtml('문법은 `[게이지:HP,50,100]` 처럼 쓴다'));
    expect(d.querySelector('code').textContent).toBe('[게이지:HP,50,100]');
  });

  it('코드 밖의 로그탭은 코드 블록이 함께 있어도 동작한다', () => {
    const d = dom(renderMarkdownHtml('```\n[로그탭:빨강]x[/로그탭]\n```\n\n[로그탭:노랑]진짜[/로그탭]'));
    expect(d.querySelectorAll('.galpi-log-tab-wrapper').length).toBe(1);
  });
});

describe('| a | b | 표', () => {
  it('구분선(|---|)이 있는 표는 표가 된다', () => {
    const html = renderMarkdownHtml('| 이름 | 설명 |\n|---|---|\n| 리안 | 주인공 |\n| 세이 | 조력자 |');
    const d = dom(html);
    expect(d.querySelectorAll('tr').length).toBe(3);
    expect(cellsOf(html).map((c) => c.textContent)).toEqual(['이름', '설명', '리안', '주인공', '세이', '조력자']);
    expect(html).not.toContain('<del');
    expect(d.querySelector('.galpi-ext-quote')).toBeNull();
  });

  it('구분선이 없는 | 글 줄은 인용문 그대로다', () => {
    const d = dom(renderMarkdownHtml('| 첫 줄 |\n| 둘째 줄'));
    expect(d.querySelector('table')).toBeNull();
    expect(d.querySelector('.galpi-ext-quote')).not.toBeNull();
  });

  it('구분선 정렬 표기(:---:)와 바깥 | 가 없는 형식도 읽는다', () => {
    const html = renderMarkdownHtml('| a | b |\n|:--:|--:|\n| 1 | 2 |');
    expect(cellsOf(html).map((c) => c.textContent)).toEqual(['a', 'b', '1', '2']);
  });
});

describe('각주 목록', () => {
  it('각주가 있으면 본문 맨 아래에 번호 순서대로 내용이 모인다', () => {
    const d = dom(renderMarkdownHtml('첫째[* 하나] 둘째[* 둘\n줄]'));
    const items = Array.from(d.querySelectorAll('.galpi-footnote-list li'));
    expect(items.map((li) => li.getAttribute('value'))).toEqual(['1', '2']);
    expect(items[0].textContent).toBe('하나');
    expect(items[1].innerHTML).toContain('<br>');
  });

  it('각주가 없으면 목록을 만들지 않는다', () => {
    expect(dom(renderMarkdownHtml('그냥 글')).querySelector('.galpi-footnote-list')).toBeNull();
  });

  it('각주 안의 < 는 글자로 남고 태그가 되지 않는다', () => {
    const d = dom(renderMarkdownHtml('글[* <b>굵게</b> 그대로]'));
    expect(d.querySelector('.galpi-footnote-list li b')).toBeNull();
    expect(d.querySelector('.galpi-footnote-list li').textContent).toContain('<b>굵게</b>');
  });
});

describe('긴 표', () => {
  const rows = (n) => ['||번호||이름||', ...Array.from({ length: n }, (_, i) => `||${i}||이름${i}||`)].join('\n');

  it('행이 많은 표는 스크롤 상자 안에서 헤더가 고정되도록 표시된다', () => {
    const d = dom(renderMarkdownHtml(rows(30)));
    expect(d.querySelector('.gt-table-long')).not.toBeNull();
  });

  it('행이 적은 표는 그대로다', () => {
    const d = dom(renderMarkdownHtml(rows(3)));
    expect(d.querySelector('table')).not.toBeNull();
    expect(d.querySelector('.gt-table-long')).toBeNull();
  });
});

describe('인물 관계도 모양', () => {
  const EMOJI = /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}️]/u;
  const graph = (extra = '') => `[RELATION_GRAPH]\n{"width":1400,"height":600,"nodes":[{"id":"a","label":"가","x":100,"y":100},{"id":"b","label":"나","x":300,"y":100}],"edges":[{"source":"a","target":"b","type":"->","desc":"친구"}]${extra}}\n[/RELATION_GRAPH]`;

  it('머리글과 위젯 어디에도 이모지를 쓰지 않고 SVG 아이콘을 쓴다', () => {
    const html = renderMarkdownHtml(graph());
    expect(EMOJI.test(html)).toBe(false);
    expect(dom(html).querySelector('.gt-macro-subheader .gi svg')).not.toBeNull();
  });

  it('데이터가 깨졌을 때 나오는 경고에도 이모지가 없다', () => {
    const html = renderMarkdownHtml('[RELATION_GRAPH]\n{깨진\n[/RELATION_GRAPH]');
    expect(html).toContain('손상');
    expect(EMOJI.test(html)).toBe(false);
  });

  it('그래프는 칸 폭에 맞춰 줄어들어 넓은 그래프도 좌우 스크롤을 강제하지 않는다', () => {
    const svg = dom(renderMarkdownHtml(graph())).querySelector('.galpi-relation-scroll > svg');
    expect(svg.style.width).toBe('100%');
    expect(svg.style.maxWidth).toBe('1400px');
    expect(parseInt(svg.style.minWidth, 10)).toBeLessThan(1400);
  });

  it('다른 위젯의 머리글에도 이모지가 없다', () => {
    const html = renderMarkdownHtml('[스탯:힘=5,민첩=7,지능=3]\n\n[성향:3,4]\n\n[스탯비교:가=1,2,3|나=4,5,6]');
    expect(EMOJI.test(html)).toBe(false);
  });
});

describe('인물 관계도 작은 그래프', () => {
  it('원래 폭이 좁은 그래프는 키우지 않는다', () => {
    const json = '{"width":300,"height":200,"nodes":[{"id":"a","label":"가","x":50,"y":50}],"edges":[]}';
    const svg = new DOMParser().parseFromString(renderMarkdownHtml(`[RELATION_GRAPH]\n${json}\n[/RELATION_GRAPH]`), 'text/html').querySelector('.galpi-relation-scroll > svg');
    expect(svg.style.minWidth).toBe('300px');
  });
});
