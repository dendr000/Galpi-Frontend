// Copyright (c) dendr000. MIT License.
// 캐릭터 목록 위에 두는 "보기 설정" 작은 메뉴. 바꾼 값은 바로 이 PC에 저장한다(charViewSettings).
import React, { useEffect, useState } from 'react';
import Icon from '../../components/common/icons/Icon';
import { getCharViewSettings, setCharViewSettings } from './charViewSettings';

const ITEMS = [
  { key: 'autoScroll', label: '카드를 선택하면 본문으로 이동' },
  { key: 'dblClickModal', label: '카드를 더블클릭하면 큰 창으로 열기' },
];

const CharViewSettingsMenu = () => {
  const [open, setOpen] = useState(false);
  const [settings, setSettings] = useState(getCharViewSettings);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => { if (e.key === 'Escape' && !e.defaultPrevented && !e.isComposing) setOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const toggle = (key) => setSettings(setCharViewSettings({ [key]: !settings[key] }));

  return (
    <div style={{ position: 'relative' }}>
      <button
        type="button"
        className="wiki-btn gt-btn-edit"
        aria-label="보기 설정"
        title="보기 설정"
        aria-expanded={open}
        onClick={() => { if (!open) setSettings(getCharViewSettings()); setOpen(!open); }}
        style={{ padding: '4px 8px', display: 'inline-flex', alignItems: 'center', background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
      >
        <Icon name="settings" size={14} />
      </button>
      {open && (
        <div
          role="group"
          aria-label="보기 설정"
          style={{ position: 'absolute', top: '100%', left: 0, marginTop: '6px', zIndex: 50, minWidth: '250px', padding: '10px 12px', background: 'var(--surface-color)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', whiteSpace: 'nowrap' }}
        >
          {ITEMS.map((it) => (
            <label key={it.key} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input type="checkbox" aria-label={it.label} checked={settings[it.key]} onChange={() => toggle(it.key)} />
              {it.label}
            </label>
          ))}
        </div>
      )}
    </div>
  );
};

export default CharViewSettingsMenu;
