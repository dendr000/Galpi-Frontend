// Copyright (c) dendr000. MIT License.
import { describe, it, expect } from 'vitest';
import { DOCK_MIN_WIDTH, getPanelState } from './panelLayout';

describe('getPanelState: 양옆 패널을 본문 옆에 붙일지 정한다', () => {
  it('기준 폭 이상이고 둘 다 열려 있으면 양쪽 모두 붙는다', () => {
    expect(getPanelState({ width: DOCK_MIN_WIDTH, leftOpen: true, rightOpen: true }))
      .toEqual({ canDock: true, leftDocked: true, rightDocked: true });
  });

  it('기준 폭보다 1px 좁으면 붙지 않는다(손잡이로 접힘)', () => {
    expect(getPanelState({ width: DOCK_MIN_WIDTH - 1, leftOpen: true, rightOpen: true }))
      .toEqual({ canDock: false, leftDocked: false, rightDocked: false });
  });

  it('사용자가 접은 쪽만 붙지 않는다', () => {
    expect(getPanelState({ width: 1920, leftOpen: false, rightOpen: true }))
      .toEqual({ canDock: true, leftDocked: false, rightDocked: true });
    expect(getPanelState({ width: 1920, leftOpen: true, rightOpen: false }))
      .toEqual({ canDock: true, leftDocked: true, rightDocked: false });
  });

  it('폭을 모르면(0, 없음) 붙이지 않는다', () => {
    expect(getPanelState({ width: 0, leftOpen: true, rightOpen: true }).canDock).toBe(false);
    expect(getPanelState({ leftOpen: true, rightOpen: true }).canDock).toBe(false);
  });

  it('열림 값이 없으면 기본은 열림으로 본다', () => {
    const s = getPanelState({ width: 1920 });
    expect(s.leftDocked).toBe(true);
    expect(s.rightDocked).toBe(true);
  });

  it('기준 폭은 본문이 눌리지 않을 만큼(1650px)이다', () => {
    expect(DOCK_MIN_WIDTH).toBe(1650);
  });
});
