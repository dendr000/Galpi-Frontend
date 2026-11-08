// Copyright (c) dendr000. MIT License.
// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('installConsoleGate', () => {
  beforeEach(() => { vi.resetModules(); localStorage.clear(); });

  it('불러오면 window.galpiDebug 함수가 생기고, 호출하면 저장하며 바로 적용된다', async () => {
    const original = console.log;
    await import('./installConsoleGate');
    expect(typeof window.galpiDebug).toBe('function');
    expect(window.galpiDebug(false)).toBe(false);
    expect(localStorage.getItem('galpi.debug')).toBe('0');
    expect(console.log).not.toBe(original);
    expect(window.galpiDebug(true)).toBe(true);
    expect(localStorage.getItem('galpi.debug')).toBe('1');
    expect(console.log).toBe(original);
  });
});
