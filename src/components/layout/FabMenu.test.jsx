// Copyright (c) dendr000. MIT License.
// @vitest-environment jsdom
// 팹: 메뉴가 닫혀 있을 때 보이지 않는 메뉴 칸이 그 아래 버튼들의 클릭을 막지 않는지.
import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, cleanup, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../../api/axiosCore', () => ({ default: { get: vi.fn(() => Promise.resolve({ data: [] })) } }));
vi.mock('../../utils/dictLocalDb', () => ({ seedDictIfNeeded: vi.fn(), resolveCycleReplacement: vi.fn() }));
vi.mock('../../store/useModalStore', () => ({
  useModalStore: () => ({ activeModal: null, subModal: null, openModal: vi.fn(), closeModal: vi.fn(), addClipboard: vi.fn() }),
}));
vi.mock('../../domains/fabTools/boilerplate/hooks/useBoilerplateCore', () => ({ useBoilerplateCore: () => ({ bpPopupState: null, commitBpExpansion: vi.fn(), updatePopupState: vi.fn() }) }));
vi.mock('../../domains/fabTools/boilerplate/hooks/useBoilerplateListener', () => ({ useBoilerplateListener: () => {} }));
vi.mock('../../domains/fabTools/boilerplate/components/BoilerplateSuggestPopup', () => ({ default: () => null }));
vi.mock('../../domains/fabTools/ClipboardModal', () => ({ default: () => null }));
vi.mock('../../domains/fabTools/dict/DictModal', () => ({ default: () => null }));
vi.mock('../../domains/fabTools/SearchModal', () => ({ default: () => null }));
vi.mock('../../domains/fabTools/RecentModal', () => ({ default: () => null }));
vi.mock('../../domains/memo/fab/FabMemoModal', () => ({ default: () => null }));
vi.mock('../../domains/fabTools/boilerplate/BoilerplateModal', () => ({ default: () => null }));

import FabMenu from './FabMenu';

afterEach(cleanup);

const setup = () => render(<MemoryRouter><FabMenu /></MemoryRouter>);

describe('FabMenu 클릭 영역', () => {
  it('바깥 상자는 클릭을 통과시키고, 팹 버튼만 클릭을 받는다(닫힌 메뉴 칸이 뒤쪽 버튼을 막지 않음)', () => {
    const { container } = setup();
    expect(container.querySelector('.galpi-fab-wrap').style.pointerEvents).toBe('none');
    expect(container.querySelector('#galpi-fab-main').style.pointerEvents).toBe('auto');
  });

  it('닫혀 있을 때 메뉴 칸은 클릭을 받지 않고, 팹 버튼을 누르면 받는다', () => {
    const { container } = setup();
    const menu = container.querySelector('.galpi-fab-menu');
    expect(menu.style.pointerEvents).toBe('none');
    fireEvent.click(container.querySelector('#galpi-fab-main'));
    expect(menu.style.pointerEvents).toBe('auto');
  });

  it('열려 있는 동안에도 메뉴 항목은 클릭을 받는다(바깥 상자가 통과해도 자식이 되살린다)', () => {
    const { container } = setup();
    fireEvent.click(container.querySelector('#galpi-fab-main'));
    const menu = container.querySelector('.galpi-fab-menu');
    expect(menu.style.pointerEvents).toBe('auto');
    expect(container.querySelectorAll('.galpi-fab-item').length).toBeGreaterThan(0);
  });
});
