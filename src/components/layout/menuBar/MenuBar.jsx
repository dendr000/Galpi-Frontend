// Copyright (c) dendr000. MIT License.
// 화면 맨 위의 앱 안 메뉴 바(파일, 편집, 보기, 설정). Electron 기본 메뉴가 아니라 웹에서도 같은 모양으로 동작한다.
// 마우스: 누르면 열림, 열린 상태에서 다른 메뉴 위로 가면 그 메뉴로 전환. 키보드: 방향키, Home/End, Enter/Space, Esc, Tab.
// 메뉴 구성과 활성 조건은 menuDefinitions.js, 실제 동작은 기존 기능을 그대로 부른다.
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import useSettingStore from '../../../store/useSettingStore';
import { isDebugEnabled, setDebugLogs } from '../../../utils/consoleGate';
import { isElectron } from '../../common/FindBar';
import Icon from '../../common/icons/Icon';
import { buildMenus } from './menuDefinitions';
import {
  isDarkMode, toggleDarkMode, cycleThemeForWork, dispatchMenuAction, openFindBar,
} from './menuActions';
import styles from './MenuBar.module.css';

const readDebugOn = () => {
  try {
    return isDebugEnabled({ isDev: import.meta.env.DEV, storage: globalThis.localStorage });
  } catch {
    return false;
  }
};

const MenuBar = ({ setIsSettingOpen }) => {
  const navigate = useNavigate();
  const { pathname, search } = useLocation();
  const layoutWidth = useSettingStore((s) => s.layoutWidth);
  const panelLeftOpen = useSettingStore((s) => s.panelLeftOpen);
  const panelRightOpen = useSettingStore((s) => s.panelRightOpen);
  const updateSetting = useSettingStore((s) => s.updateSetting);

  const [openId, setOpenId] = useState(null);
  const rootRef = useRef(null);
  const topRefs = useRef({});
  const pendingFocus = useRef(null); // 키보드로 열 때 포커스를 줄 위치: 'first' | 'last'

  const menus = buildMenus({
    pathname, search,
    settings: { layoutWidth, panelLeftOpen, panelRightOpen },
    isDark: isDarkMode(),
    debugOn: readDebugOn(),
    canFind: isElectron(),
    actions: {
      navigate,
      openSettings: () => setIsSettingOpen?.(true),
      toggleDark: toggleDarkMode,
      cycleTheme: cycleThemeForWork,
      openFind: openFindBar,
      exportWork: () => dispatchMenuAction('export-work'),
      setSetting: updateSetting,
      toggleDebug: (on) => setDebugLogs(on),
    },
  });

  // 열린 메뉴의 포커스 가능한 항목(구분선과 비활성 제외)
  const focusables = () => (rootRef.current ? Array.from(rootRef.current.querySelectorAll('[role="menu"] [data-focusable="true"]')) : []);

  // 키보드로 연 직후 첫 항목이나 마지막 항목으로 포커스를 옮긴다
  useEffect(() => {
    if (!openId || !pendingFocus.current) return;
    const list = focusables();
    const target = pendingFocus.current === 'last' ? list[list.length - 1] : list[0];
    pendingFocus.current = null;
    target?.focus();
  }, [openId]);

  // 메뉴 바 바깥을 누르면 닫는다
  useEffect(() => {
    if (!openId) return undefined;
    const onDown = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpenId(null);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [openId]);

  const close = (returnFocus = false) => {
    const was = openId;
    setOpenId(null);
    if (returnFocus && was) topRefs.current[was]?.focus();
  };

  const openMenu = (id, focus) => {
    pendingFocus.current = focus || null;
    setOpenId(id);
  };

  const moveMenu = (delta, focus) => {
    const idx = menus.findIndex((m) => m.id === openId);
    const next = menus[(idx + delta + menus.length) % menus.length];
    openMenu(next.id, focus);
  };

  const activate = (it) => {
    if (it.disabled) return;
    setOpenId(null);
    it.onSelect?.();
  };

  const onTopKeyDown = (e, id) => {
    const idx = menus.findIndex((m) => m.id === id);
    switch (e.key) {
      case 'ArrowDown': case 'Enter': case ' ':
        e.preventDefault(); openMenu(id, 'first'); break;
      case 'ArrowUp':
        e.preventDefault(); openMenu(id, 'last'); break;
      case 'ArrowRight': case 'ArrowLeft': {
        e.preventDefault();
        const next = menus[(idx + (e.key === 'ArrowRight' ? 1 : -1) + menus.length) % menus.length];
        if (openId) openMenu(next.id, 'first'); else topRefs.current[next.id]?.focus();
        break;
      }
      case 'Escape':
        if (openId) { e.preventDefault(); close(true); }
        break;
      default:
    }
  };

  const onMenuKeyDown = (e) => {
    const list = focusables();
    const cur = list.indexOf(document.activeElement);
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault(); list[(cur + 1) % list.length]?.focus(); break;
      case 'ArrowUp':
        e.preventDefault(); list[(cur - 1 + list.length) % list.length]?.focus(); break;
      case 'Home':
        e.preventDefault(); list[0]?.focus(); break;
      case 'End':
        e.preventDefault(); list[list.length - 1]?.focus(); break;
      case 'ArrowRight':
        e.preventDefault(); moveMenu(1, 'first'); break;
      case 'ArrowLeft':
        e.preventDefault(); moveMenu(-1, 'first'); break;
      case 'Escape':
        e.preventDefault(); close(true); break;
      case 'Tab':
        close(false); break;
      default:
    }
  };

  const onItemKeyDown = (e, it) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      activate(it);
    }
  };

  return (
    <div ref={rootRef} className={styles.bar} role="menubar" aria-label="앱 메뉴">
      {menus.map((menu) => {
        const isOpen = openId === menu.id;
        return (
          <div key={menu.id} className={styles.wrap}>
            <button
              type="button"
              role="menuitem"
              ref={(el) => { topRefs.current[menu.id] = el; }}
              className={`${styles.top} ${isOpen ? styles.topOpen : ''}`}
              aria-haspopup="menu"
              aria-expanded={isOpen}
              onClick={() => (isOpen ? setOpenId(null) : openMenu(menu.id))}
              onMouseEnter={() => { if (openId && openId !== menu.id) setOpenId(menu.id); }}
              onKeyDown={(e) => onTopKeyDown(e, menu.id)}
            >
              {menu.label}
            </button>
            {isOpen && (
              <div className={styles.menu} role="menu" aria-label={menu.label} onKeyDown={onMenuKeyDown}>
                {menu.items.map((it) => {
                  if (it.kind === 'separator') return <div key={it.id} className={styles.sep} role="separator" />;
                  const isCheck = it.kind === 'check';
                  return (
                    <div
                      key={it.id}
                      role={isCheck ? 'menuitemcheckbox' : 'menuitem'}
                      aria-checked={isCheck ? it.checked : undefined}
                      aria-disabled={it.disabled ? 'true' : undefined}
                      tabIndex={-1}
                      data-focusable={it.disabled ? undefined : 'true'}
                      className={`${styles.item} ${it.disabled ? styles.disabled : ''}`}
                      onClick={() => activate(it)}
                      onKeyDown={(e) => onItemKeyDown(e, it)}
                    >
                      <span className={styles.mark}>{isCheck && it.checked ? <Icon name="check" /> : null}</span>
                      <span>{it.label}</span>
                      {it.shortcut && <span className={styles.shortcut}>{it.shortcut}</span>}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default MenuBar;
