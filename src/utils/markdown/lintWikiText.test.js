// Copyright (c) dendr000. MIT License.
import { describe, it, expect } from 'vitest';
import { lintWikiText } from './lintWikiText';

const msgs = (t) => lintWikiText(t).map((w) => `${w.line}:${w.message}`);

describe('lintWikiText 짝이 있는 문법', () => {
  it('정상 본문은 경고가 없다', () => {
    expect(lintWikiText('# 제목\n[로그탭:노랑]\n내용\n[/로그탭]\n[스포일러]비밀[/스포일러]\n[red:빨강]')).toEqual([]);
  });

  it('닫히지 않은 로그탭은 시작 줄에서 알린다', () => {
    const r = lintWikiText('앞글\n[로그탭:노랑]\n내용');
    expect(r).toHaveLength(1);
    expect(r[0].line).toBe(2);
    expect(r[0].message).toContain('[/로그탭]');
  });

  it('여는 것 없이 닫기만 있으면 닫는 줄에서 알린다', () => {
    const r = lintWikiText('내용\n[/스포일러]');
    expect(r[0].line).toBe(2);
    expect(r[0].message).toContain('[스포일러]');
  });

  it('대화, 우대화, 타임라인, 관계도도 짝을 본다', () => {
    expect(lintWikiText('[대화: 리안:] 안녕').length).toBe(1);
    expect(lintWikiText('[우대화: 세이:] 안녕 [/우대화]')).toEqual([]);
    expect(lintWikiText('[TIMELINE]\n1년::::시작::::설명').length).toBe(1);
    expect(lintWikiText('[RELATION_GRAPH]\n{}').length).toBe(1);
  });

  it('여는 글이 여러 번이면 닫히지 않은 만큼 알린다', () => {
    expect(lintWikiText('[스포일러]a\n[스포일러]b[/스포일러]').length).toBe(1);
  });
});

describe('lintWikiText 그 밖의 검사', () => {
  it('닫히지 않은 색 문법을 알린다', () => {
    expect(msgs('빨강 [red:위험')[0]).toContain('닫는 ]');
    expect(lintWikiText('[red:[blue:안쪽]] 정상')).toEqual([]);
    expect(lintWikiText('[HP: 100/100] 상태창')).toEqual([]);
  });

  it('닫히지 않은 각주를 알린다', () => {
    expect(msgs('글[* 설명')[0]).toContain('각주');
    expect(lintWikiText('글[* 여러\n줄 각주]')).toEqual([]);
  });

  it('표의 칸 수가 윗줄과 다르면 그 줄을 알린다', () => {
    const r = lintWikiText('||a||b||c||\n||1||2||\n||1||2||3||');
    expect(r).toHaveLength(1);
    expect(r[0].line).toBe(2);
  });

  it('병합 표시(<-2>)가 있는 표는 칸 수를 검사하지 않는다', () => {
    expect(lintWikiText('||a||b||c||\n||<-2>1||2||')).toEqual([]);
  });

  it('제목 단계를 건너뛰면 알린다', () => {
    const r = lintWikiText('# 가\n### 다');
    expect(r[0].line).toBe(2);
    expect(lintWikiText('# 가\n## 나\n### 다')).toEqual([]);
    expect(lintWikiText('## 시작\n### 하위')).toEqual([]);
  });

  it('코드 안의 문법 예시는 검사하지 않는다', () => {
    expect(lintWikiText('```\n[로그탭:노랑]\n[red:x\n```\n`[스포일러]`')).toEqual([]);
  });

  it('빈 글은 경고가 없다', () => {
    expect(lintWikiText('')).toEqual([]);
    expect(lintWikiText(null)).toEqual([]);
  });
});
