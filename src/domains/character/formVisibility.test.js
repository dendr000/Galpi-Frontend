// Copyright (c) dendr000. MIT License.
import { describe, it, expect } from 'vitest';
import { isCharHidden, getHiddenCharacters, withHidden } from './formVisibility';

const mk = (id, name, dp = {}, extra = {}) => ({ id, name, dynamicProperties: JSON.stringify(dp), ...extra });

describe('formVisibility', () => {
  it('_isHidden 가 켜진 캐릭터만 숨김으로 본다', () => {
    expect(isCharHidden(mk(1, 'a', { _isHidden: true }))).toBe(true);
    expect(isCharHidden(mk(2, 'b', { _isHidden: false }))).toBe(false);
    expect(isCharHidden(mk(3, 'c'))).toBe(false);
  });

  it('깨진 속성이거나 속성이 없어도 오류 없이 숨김이 아니다', () => {
    expect(isCharHidden({ id: 1, name: 'x', dynamicProperties: '{깨짐' })).toBe(false);
    expect(isCharHidden({ id: 2, name: 'y' })).toBe(false);
  });

  it('숨김 목록에는 그 캐릭터를 다음 폼으로 가리키는 캐릭터 이름이 붙는다', () => {
    const chars = [mk(1, '네아', { _switchTarget: '라우네아' }), mk(2, '라우네아', { _isHidden: true }), mk(3, '따로', { _isHidden: true })];
    const list = getHiddenCharacters(chars);
    expect(list.map((h) => [h.char.name, h.formOf])).toEqual([['라우네아', '네아'], ['따로', '']]);
  });

  it('휴지통 캐릭터는 숨김 목록에서 뺀다', () => {
    expect(getHiddenCharacters([mk(1, 'a', { _isHidden: true }, { isTrash: true })])).toEqual([]);
  });

  it('withHidden 은 원본을 바꾸지 않고 두 속성 문자열을 모두 갱신한다', () => {
    const c = mk(1, 'a', { _isHidden: true, 종족: '무스몬' });
    const r = withHidden(c, false);
    expect(JSON.parse(r.dynamicProperties)).toEqual({ _isHidden: false, 종족: '무스몬' });
    expect(r._rawDynamic).toBe(r.dynamicProperties);
    expect(JSON.parse(c.dynamicProperties)._isHidden).toBe(true);
  });
});
