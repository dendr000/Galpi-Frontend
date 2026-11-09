// Copyright (c) dendr000. MIT License.
// 앱 틀 CSS 규칙 시험. jsdom 에는 레이아웃 계산이 없어서, 약속한 규칙이 파일에 들어 있는지 글자로 확인한다.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const read = (p) => readFileSync(resolve(__dirname, '..', p), 'utf-8').replace(/\r\n/g, '\n');
const rule = (css, selector) => {
  const m = new RegExp(`(^|\\n)${selector.replace(/[.]/g, '\\.')}\\s*\\{([^}]*)\\}`).exec(css);
  return m ? m[2] : null;
};

describe('폭 규칙 CSS', () => {
  it('전체 폭 클래스(.galpi-page-fluid)가 1200px 제한을 푼다', () => {
    const body = rule(read('styles/global.css'), '.fixed-container.galpi-page-fluid');
    expect(body).not.toBeNull();
    expect(body).toMatch(/max-width:\s*none/);
  });

  it('.galpi-page-fluid 는 .fixed-container 보다 뒤에 있어 우선한다', () => {
    const css = read('styles/global.css');
    expect(css.indexOf('.galpi-page-fluid')).toBeGreaterThan(css.indexOf('.fixed-container {'));
  });

  it('분류 화면은 1200px 최소 폭과 1600px 최대 폭을 두지 않는다(반쪽 창에서도 맞아야 한다)', () => {
    const body = rule(read('pages/Category/Category.module.css'), '.catPageWrap');
    expect(body).not.toBeNull();
    expect(body).not.toMatch(/min-width:\s*1200px/);
    expect(body).not.toMatch(/max-width:\s*1600px/);
  });

  it('분류 카드 격자는 폭에 맞춰 칸 수가 바뀐다', () => {
    const body = rule(read('pages/Category/Category.module.css'), '.catGrid');
    expect(body).toMatch(/auto-fill|auto-fit/);
  });
});

describe('메뉴 바가 붙는 화면의 높이 CSS', () => {
  it('메뉴 바 높이 변수(--app-menubar-h)가 28px 로 정의돼 있다', () => {
    expect(read('styles/global.css')).toMatch(/--app-menubar-h:\s*28px/);
  });

  const mustUseVar = [
    ['pages/BulkStudio/BulkStudio.module.css', '.layout'],
    ['pages/Editor/EditorPage.module.css', '.editorLayout'],
    ['pages/Editor/EditorPage.module.css', '.editorFullBleed'],
    ['domains/memo/page/PageMemo.module.css', '.memoWorkspaceContainer'],
  ];
  it.each(mustUseVar)('%s 의 %s 높이는 메뉴 바 높이를 뺀다', (file, selector) => {
    const body = rule(read(file), selector);
    expect(body).not.toBeNull();
    expect(body).toMatch(/var\(--app-menubar-h\)/);
  });
});
