// Copyright (c) dendr000. MIT License.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it, expect } from 'vitest';

const css = fs.readFileSync(path.join(path.dirname(fileURLToPath(import.meta.url)), 'WorkDetail.module.css'), 'utf8');
const rule = (selector) => (css.match(new RegExp(String.raw`(?:^|\n)\s*\.${selector}\s*\{([^}]*)\}`)) || [])[1] || '';

// 화면을 반으로 나눠 쓰면(창 너비 약 960px) 본문이 550px 쯤으로 좁아진다. 정보 상자 자리(340px)는 아무것도
// 선택하지 않아도 비워 둔 채 남아 있어서, 섹션 제목과 선택 상자, 버튼이 글자 단위로 줄바꿈됐다.
describe('WorkDetail.module.css 좁은 창 배치', () => {
  it('섹션 머리말은 모자라면 글자를 쪼개지 않고 줄 단위로 넘어간다(flex-wrap)', () => {
    expect(rule('sectionHeader')).toMatch(/flex-wrap:\s*wrap/);
  });

  it('좁은 창(1199px 이하)에서는 내용이 없는 오른쪽 정보 상자 자리를 접어 본문이 넓게 쓰도록 한다', () => {
    const media = css.match(/@media\s*\(max-width:\s*1199px\)\s*\{([\s\S]*?)\n\}/);
    expect(media, '1199px 이하 미디어 쿼리').not.toBeNull();
    expect(media[1]).toMatch(/\.wikiAside:empty\s*\{[^}]*display:\s*none/);
  });

  it('넓은 창에서는 정보 상자 자리를 그대로 둔다(캐릭터를 고를 때 본문 폭이 갑자기 변하지 않게)', () => {
    expect(rule('wikiAside')).not.toMatch(/display:\s*none/);
    expect(rule('wikiAside')).toMatch(/width:\s*340px/);
  });
});
