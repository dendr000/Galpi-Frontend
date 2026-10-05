import { describe, it, expect } from 'vitest';
import { extractMeta, buildMetaStr } from './metaUtils';

describe('extractMeta', () => {
  it('비어 있으면 빈 clean/meta', () => {
    expect(extractMeta(undefined)).toEqual({ clean: '', meta: {} });
    expect(extractMeta(null)).toEqual({ clean: '', meta: {} });
    expect(extractMeta('')).toEqual({ clean: '', meta: {} });
  });

  it('메타 줄이 없으면 본문 그대로(앞뒤 공백만 정리)', () => {
    expect(extractMeta('  그냥 본문  ')).toEqual({ clean: '그냥 본문', meta: {} });
  });

  it('첫 줄의 [META_DATA:{...}]를 파싱하고 나머지를 본문으로 돌려준다', () => {
    const r = extractMeta('[META_DATA:{"alias":"약칭","themeOverride":"hero-comic"}]\n본문 첫 줄\n둘째 줄');
    expect(r.meta).toEqual({ alias: '약칭', themeOverride: 'hero-comic' });
    expect(r.clean).toBe('본문 첫 줄\n둘째 줄');
  });

  it('메타만 있고 본문이 없으면 clean은 빈 문자열', () => {
    expect(extractMeta('[META_DATA:{"a":1}]')).toEqual({ clean: '', meta: { a: 1 } });
  });

  it('JSON 값 안에 대괄호가 들어 있어도 파싱된다', () => {
    const r = extractMeta('[META_DATA:{"tags":["a","b]"]}]\n본문');
    expect(r.meta).toEqual({ tags: ['a', 'b]'] });
    expect(r.clean).toBe('본문');
  });

  it('JSON이 깨져 있으면 meta는 비우고 메타 줄은 본문에서 지운다', () => {
    const r = extractMeta('[META_DATA:{깨진 json}]\n본문');
    expect(r.meta).toEqual({});
    expect(r.clean).toBe('본문');
  });

  it('맨 앞에 붙은 잔여 기호(}, ], 쉼표, 공백)를 걷어낸다', () => {
    const r = extractMeta('}], \n[META_DATA:{"a":1}]\n본문');
    expect(r.meta).toEqual({ a: 1 });
    expect(r.clean).toBe('본문');
  });

  it('첫 줄이 아니라 본문 중간에 있는 메타도 찾아서 지운다', () => {
    const r = extractMeta('앞 문장 [META_DATA:{"a":2}] 뒤 문장');
    expect(r.meta).toEqual({ a: 2 });
    expect(r.clean).toBe('앞 문장  뒤 문장');
  });
});

describe('buildMetaStr', () => {
  it('메타가 비어 있으면 본문을 그대로 돌려준다', () => {
    expect(buildMetaStr('본문', {})).toBe('본문');
    expect(buildMetaStr('본문', null)).toBe('본문');
    expect(buildMetaStr('본문', undefined)).toBe('본문');
  });

  it('메타 줄 + 줄바꿈 + 본문 형태로 만든다', () => {
    expect(buildMetaStr('본문', { a: 1 })).toBe('[META_DATA:{"a":1}]\n본문');
  });

  it('본문이 비어 있어도 메타 줄은 만든다', () => {
    expect(buildMetaStr('', { a: 1 })).toBe('[META_DATA:{"a":1}]\n');
    expect(buildMetaStr(null, { a: 1 })).toBe('[META_DATA:{"a":1}]\n');
  });

  it('본문 앞뒤 공백은 정리한다', () => {
    expect(buildMetaStr('  본문  ', { a: 1 })).toBe('[META_DATA:{"a":1}]\n본문');
  });

  it('extractMeta와 왕복해도 값이 보존된다', () => {
    const meta = { alias: '약칭', 태그: '하렘, 헌터', _groupOrder: { 관계: ['연인', '친구'] } };
    const built = buildMetaStr('첫 줄\n둘째 줄', meta);
    expect(extractMeta(built)).toEqual({ clean: '첫 줄\n둘째 줄', meta });
  });
});
