// Copyright (c) dendr000. MIT License.
// @vitest-environment jsdom
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import CharacterInfobox from './CharacterInfobox';

const char = { id: 7, name: '세라', age: '22세', gender: '여성', species: '인간' };

const renderBox = () =>
  render(
    <MemoryRouter>
      <CharacterInfobox
        char={char}
        workId={1}
        workTitle="작품"
        charExt="png"
        imgVariants={[]}
        setCharacters={() => {}}
        setActiveCharId={() => {}}
        characters={[char]}
        cardVariants={{}}
        setCardVariants={() => {}}
        formSwaps={{}}
        setFormSwaps={() => {}}
      />
    </MemoryRouter>
  );

afterEach(cleanup);

describe('CharacterInfobox 소속 링크', () => {
  const withAffiliation = { ...char, 소속: '북부 대공가, *비밀결사, 남부', _propOrder: ['소속'] };
  const renderWith = (wikiPages) => {
    const navigate = vi.fn();
    render(
      <MemoryRouter>
        <CharacterInfobox
          char={withAffiliation} workId={91} workTitle="작품" charExt="png" imgVariants={[]}
          setCharacters={() => {}} setActiveCharId={() => {}} characters={[withAffiliation]}
          cardVariants={{}} setCardVariants={() => {}} formSwaps={{}} setFormSwaps={() => {}}
          wikiPages={wikiPages} onOpenPage={navigate}
        />
      </MemoryRouter>
    );
    return navigate;
  };

  it('같은 제목의 하위 문서가 있는 소속 값만 링크가 되고, 누르면 문서를 연다', () => {
    const open = renderWith([{ id: 7, title: '북부대공가' }]);
    const links = screen.getAllByRole('link');
    expect(links.map((a) => a.textContent)).toEqual(['북부 대공가']);
    fireEvent.click(links[0]);
    expect(open).toHaveBeenCalledWith(7);
  });

  it('*로 시작하는 값은 *를 떼고 일반 글자로 보인다(문서가 있어도 링크 아님)', () => {
    renderWith([{ id: 8, title: '비밀결사' }]);
    expect(screen.queryByRole('link')).toBeNull();
    expect(screen.getByText(/비밀결사/)).toBeTruthy();
  });

  it('하위 문서가 없으면 링크 없이 값만 보인다', () => {
    renderWith([]);
    expect(screen.queryByRole('link')).toBeNull();
    expect(screen.getByText(/북부 대공가, 비밀결사, 남부/)).toBeTruthy();
  });
});

// 인포박스는 화면에 붙어 따라다니는(sticky) 상자다. 속성이 많아 상자가 화면보다 길어지면 아래쪽의
// 수정/삭제 버튼이 화면 밖으로 밀려 눌러 볼 수 없었다. 긴 내용은 안쪽 영역이 스크롤하고
// 버튼 줄은 그 바깥(상자 맨 아래)에 고정돼야 한다.
describe('CharacterInfobox 긴 상자에서 이름란, 사진, 수정/삭제 버튼 고정', () => {
  it('속성 표와 설명은 스크롤 영역 안에 있다', () => {
    renderBox();
    const scroll = document.querySelector('[class*="infoboxScroll"]');
    expect(scroll).not.toBeNull();
    expect(scroll.querySelector('table')).not.toBeNull();
    expect(scroll.querySelector('.gt-infobox-desc')).not.toBeNull();
  });

  it('이름란과 사진은 스크롤 영역 바깥(위쪽)에 있어 스크롤해도 사라지지 않는다', () => {
    renderBox();
    const scroll = document.querySelector('[class*="infoboxScroll"]');
    const title = document.querySelector('.gt-infobox-title');
    const image = document.querySelector('.gt-infobox-image');
    expect(title).not.toBeNull();
    expect(image).not.toBeNull();
    expect(scroll.contains(title)).toBe(false);
    expect(scroll.contains(image)).toBe(false);
    // 위쪽에 놓여 있어야 한다: 이름란, 사진 다음에 스크롤 영역이 온다
    expect(title.compareDocumentPosition(scroll) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(image.compareDocumentPosition(scroll) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('수정/삭제 버튼은 스크롤 영역 바깥에 있어 내용이 길어도 가려지지 않는다', () => {
    renderBox();
    const scroll = document.querySelector('[class*="infoboxScroll"]');
    expect(scroll.contains(screen.getByRole('button', { name: '수정' }))).toBe(false);
    expect(scroll.contains(screen.getByRole('button', { name: '삭제' }))).toBe(false);
  });
});

describe('WorkDetail.module.css 인포박스 높이 제한', () => {
  const css = fs.readFileSync(
    path.join(path.dirname(fileURLToPath(import.meta.url)), '../../pages/WorkDetail/WorkDetail.module.css'),
    'utf8'
  );
  const rule = (name) => (css.match(new RegExp(`\\.${name}\\s*\\{([^}]*)\\}`)) || [])[1] || '';

  it('상자는 화면 높이를 넘지 않도록 max-height 를 갖고 세로 flex 이다', () => {
    const r = rule('wikiInfobox');
    expect(r).toMatch(/max-height:\s*calc\(100vh/);
    expect(r).toMatch(/display:\s*flex/);
    expect(r).toMatch(/flex-direction:\s*column/);
  });

  it('이름란과 사진은 줄어들지 않고, 사진 높이는 낮은 화면에서 줄어든다', () => {
    expect(rule('infoboxTitle')).toMatch(/flex-shrink:\s*0/);
    const img = rule('infoboxImage');
    expect(img).toMatch(/flex-shrink:\s*0/);
    expect(img).toMatch(/height:\s*min\(300px,\s*38vh\)/);
  });

  it('스크롤 영역은 남는 높이만 쓰고(min-height:0) 세로로 스크롤한다', () => {
    const r = rule('infoboxScroll');
    expect(r).toMatch(/min-height:\s*0/);
    expect(r).toMatch(/overflow-y:\s*auto/);
  });
});

describe('CharacterInfobox 등급 배지', () => {
  const rated = { ...char, 위험도: '3' };
  const renderRated = (extra) =>
    render(
      <MemoryRouter>
        <CharacterInfobox
          char={rated} workId={91} workTitle="작품" charExt="png" imgVariants={[]}
          setCharacters={() => {}} setActiveCharId={() => {}} characters={[rated]}
          cardVariants={{}} setCardVariants={() => {}} formSwaps={{}} setFormSwaps={() => {}} {...extra}
        />
      </MemoryRouter>
    );

  it('등급 설정이 있고 값이 있으면 정보 상자에 배지를 보여 준다(스크롤 영역 안)', () => {
    renderRated({ ratingAxes: [{ key: '위험도', abbr: 'R' }], ratingScale: [{ level: 3, name: '중대', desc: '' }] });
    const chip = screen.getByText('R 3');
    expect(chip.closest('[class*="infoboxScroll"]')).not.toBeNull();
    expect(chip.closest('[title]').getAttribute('title')).toBe('위험도 3 중대');
  });

  it('등급 설정이 없으면 배지를 그리지 않는다', () => {
    renderRated();
    expect(document.querySelector('.gt-rating-badges')).toBeNull();
  });
});

describe('CharacterInfobox 기밀 표시', () => {
  const secret = { ...char, 기밀: 'Y' };
  const make = (over = {}) => ({
    has: true, mask: false, setMask: vi.fn(), reveal: vi.fn(),
    isClassified: (c) => c.기밀 === 'Y', isConcealed: () => false, ...over,
  });
  const renderSecret = (classified, who = secret) =>
    render(
      <MemoryRouter>
        <CharacterInfobox
          char={who} workId={91} workTitle="작품" charExt="png" imgVariants={[]}
          setCharacters={() => {}} setActiveCharId={() => {}} characters={[who]}
          cardVariants={{}} setCardVariants={() => {}} formSwaps={{}} setFormSwaps={() => {}} classified={classified}
        />
      </MemoryRouter>
    );

  it('기밀 캐릭터면 기밀 도장이 보이고, 가려지지 않았으면 흐려지지 않는다', () => {
    renderSecret(make());
    expect(document.querySelector('.gt-classified-stamp')).not.toBeNull();
    expect(document.querySelector('[data-concealed]')).toBeNull();
    expect(screen.queryByRole('button', { name: '기밀 열람' })).toBeNull();
  });

  it('기밀이 아닌 캐릭터에는 도장이 없다', () => {
    renderSecret(make(), char);
    expect(document.querySelector('.gt-classified-stamp')).toBeNull();
  });

  it('가려진 상태면 사진과 속성 표가 흐려지고 "기밀 열람" 버튼이 나온다', () => {
    renderSecret(make({ mask: true, isConcealed: () => true }));
    expect(document.querySelectorAll('[data-concealed]').length).toBeGreaterThanOrEqual(2);
    expect(screen.getByRole('button', { name: '기밀 열람' })).toBeTruthy();
  });

  it('"기밀 열람"을 누르면 그 캐릭터를 열람 처리한다', () => {
    const classified = make({ mask: true, isConcealed: () => true });
    renderSecret(classified);
    fireEvent.click(screen.getByRole('button', { name: '기밀 열람' }));
    expect(classified.reveal).toHaveBeenCalledWith(7);
  });

  it('가려진 상태에서도 수정, 삭제 버튼은 그대로 쓸 수 있다', () => {
    renderSecret(make({ mask: true, isConcealed: () => true }));
    expect(screen.getByRole('button', { name: '수정' })).toBeTruthy();
    expect(screen.getByRole('button', { name: '삭제' })).toBeTruthy();
  });

  it('가려진 상태에서는 소속 링크를 그리지 않는다', () => {
    const who = { ...secret, 소속: '북부', _propOrder: ['소속'] };
    render(
      <MemoryRouter>
        <CharacterInfobox
          char={who} workId={91} workTitle="작품" charExt="png" imgVariants={[]}
          setCharacters={() => {}} setActiveCharId={() => {}} characters={[who]}
          cardVariants={{}} setCardVariants={() => {}} formSwaps={{}} setFormSwaps={() => {}}
          wikiPages={[{ id: 7, title: '북부' }]} onOpenPage={() => {}}
          classified={make({ mask: true, isConcealed: () => true })}
        />
      </MemoryRouter>
    );
    expect(screen.queryByRole('link')).toBeNull();
  });
});
