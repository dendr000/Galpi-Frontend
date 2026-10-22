// Copyright (c) dendr000. MIT License.
// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import RatingBadges from './RatingBadges';
import RatingScaleTable from './RatingScaleTable';

afterEach(cleanup);

const ratings = [
  { key: '위험도', abbr: 'R', level: 3, name: '중대', desc: '도시 단위', title: '위험도 3 중대: 도시 단위' },
  { key: '유용성', abbr: 'U', level: 0, name: '', desc: '', title: '유용성 0' },
];

describe('RatingBadges', () => {
  it('등급이 없으면 아무것도 그리지 않는다', () => {
    const { container } = render(<RatingBadges ratings={[]} />);
    expect(container.firstChild).toBeNull();
    const again = render(<RatingBadges />);
    expect(again.container.firstChild).toBeNull();
  });

  it('약칭과 숫자를 칩으로 그리고 설명은 툴팁(title)에 둔다', () => {
    render(<RatingBadges ratings={ratings} />);
    const chip = screen.getByText('R 3').closest('[title]');
    expect(chip.getAttribute('title')).toBe('위험도 3 중대: 도시 단위');
    expect(screen.getByText('U 0')).toBeTruthy();
  });

  it('칩 글자색은 부모를 따른다(장르 테마 글자색을 덮어쓰지 않아 어두운 테마에서도 읽힘)', () => {
    render(<RatingBadges ratings={ratings} />);
    expect(screen.getByText('R 3').closest('[title]').style.color).toBe('inherit');
  });

  it('등급 색은 점에만 쓴다', () => {
    const { container } = render(<RatingBadges ratings={ratings} />);
    const dots = container.querySelectorAll('[data-rating-dot]');
    expect(dots).toHaveLength(2);
    expect(dots[0].style.background).not.toBe('');
  });
});

describe('RatingScaleTable', () => {
  const axes = [{ key: '위험도', abbr: 'R' }, { key: '유용성', abbr: 'U' }];
  const scale = [{ level: 0, name: '무해', desc: '확인 불가' }, { level: 3, name: '중대', desc: '도시 단위' }];

  it('설정이 전혀 없으면 아무것도 그리지 않는다', () => {
    const { container } = render(<RatingScaleTable axes={[]} scale={[]} styles={{}} />);
    expect(container.firstChild).toBeNull();
  });

  it('판정 축(약칭, 속성)과 등급 기준(등급, 명칭, 기준)을 표로 보여 준다', () => {
    render(<RatingScaleTable axes={axes} scale={scale} styles={{}} />);
    expect(screen.getByText('위험도')).toBeTruthy();
    expect(screen.getByText('U')).toBeTruthy();
    expect(screen.getByText('중대')).toBeTruthy();
    expect(screen.getByText('도시 단위')).toBeTruthy();
    expect(document.querySelectorAll('tbody tr').length).toBe(4);
  });

  it('등급 기준만 있거나 판정 축만 있어도 있는 쪽만 그린다', () => {
    render(<RatingScaleTable axes={[]} scale={scale} styles={{}} />);
    expect(screen.queryByText('판정 축')).toBeNull();
    expect(screen.getByText('등급 기준')).toBeTruthy();
  });
});
