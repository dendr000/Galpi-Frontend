// Copyright (c) dendr000. MIT License.
// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { exportFilename, exportWorkHtml, todayString } from './exportWork';
import { downloadTextFile } from './downloadFile';

afterEach(() => vi.restoreAllMocks());

describe('exportFilename', () => {
  it('작품 제목에 .html 을 붙이고 파일명에 못 쓰는 글자는 바꾼다', () => {
    expect(exportFilename('시험 작품')).toBe('시험 작품.html');
    expect(exportFilename('왜 나랑만 계약 안 해줘?')).toBe('왜 나랑만 계약 안 해줘？.html');
  });
  it('제목이 없으면 "작품"', () => {
    expect(exportFilename('')).toBe('작품.html');
    expect(exportFilename(undefined)).toBe('작품.html');
  });
});

describe('todayString', () => {
  it('YYYY-MM-DD 형식(한국 시간 기준 날짜)', () => {
    expect(todayString(new Date('2026-10-22T16:00:00Z'))).toBe('2026-10-23'); // 한국은 UTC+9
    expect(todayString(new Date('2026-10-22T10:00:00Z'))).toBe('2026-10-22');
  });
});

describe('exportWorkHtml', () => {
  const args = (over = {}) => ({
    work: { id: 1, title: '시험 작품', creator: '작가', genre: '', status: '', description: '[META_DATA:{"overview":"개요"}]\n설정' },
    characters: [{ id: 1, name: '릴리', 관계: '일반', _propOrder: ['관계'] }],
    wikiPages: [], formSwaps: {}, groupCriteria: '관계', sortKey: '', sortDir: 'asc',
    options: { classified: 'mask', images: false, pages: false },
    loadImage: vi.fn(async () => ''), today: '2026-10-22', ...over,
  });

  it('파일 이름과 완전한 HTML 문서를 돌려준다', async () => {
    const { filename, html } = await exportWorkHtml(args());
    expect(filename).toBe('시험 작품.html');
    expect(html.startsWith('<!doctype html>')).toBe(true);
    expect(html).toContain('릴리');
    expect(html).toContain('개요');
    expect(html).toContain('2026-10-22');
  });

  it('이미지를 불러오는 함수를 넘기지 않으면 기본 함수를 쓴다(이미지 옵션이 꺼져 있으면 호출되지 않음)', async () => {
    const a = args();
    delete a.loadImage;
    const { html } = await exportWorkHtml(a);
    expect(html).toContain('릴리');
  });
});

describe('downloadTextFile', () => {
  it('Blob 주소를 만들어 내려받기 링크를 눌러 파일을 저장하고 주소를 정리한다', () => {
    const click = vi.fn();
    const created = [];
    const realCreate = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation((tag) => {
      const el = realCreate(tag);
      if (tag === 'a') { el.click = click; created.push(el); }
      return el;
    });
    URL.createObjectURL = vi.fn(() => 'blob:fake');
    URL.revokeObjectURL = vi.fn();

    downloadTextFile('a b.html', '<p>hi</p>');

    expect(created[0].download).toBe('a b.html');
    expect(created[0].href).toBe('blob:fake');
    expect(click).toHaveBeenCalledTimes(1);
    expect(URL.createObjectURL.mock.calls[0][0].type).toBe('text/html;charset=utf-8');
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:fake');
    expect(document.body.contains(created[0])).toBe(false);
  });
});
