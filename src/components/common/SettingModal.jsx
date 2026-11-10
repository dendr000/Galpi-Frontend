// src/components/common/SettingModal.jsx
import React, { useState } from 'react';
import useSettingStore from '../../store/useSettingStore';
import { IconGear, IconX, IconEye, IconKeyboard, IconLock } from './icons/SettingsIcon';
import GateSettingsPanel from './GateSettingsPanel';
import { AUTO_SAVE_OPTIONS } from '../../pages/Editor/hooks/autoSaveDelay';

const SettingModal = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState('appearance');
  const { fontSize, lineHeight, fontFamily, layoutWidth, isCustomCursor, cursorColor, isStarryBackground, autoSaveInterval, bossKey, blindTheme, updateSetting } = useSettingStore();

  if (!isOpen) return null;

  const handleKeyCapture = (e) => {
    e.preventDefault(); e.stopPropagation();
    if (['Shift', 'Control', 'Alt', 'Meta'].includes(e.key)) return;
    let keys = [];
    if (e.ctrlKey || e.metaKey) keys.push('Ctrl');
    if (e.altKey) keys.push('Alt');
    if (e.shiftKey) keys.push('Shift');
    let k = e.key.toUpperCase();
    if (k === ' ') k = 'SPACE'; if (k === 'ESCAPE') k = 'ESC';
    keys.push(k);
    updateSetting('bossKey', keys.join('+'));
  };

  const tabs = [
    { id: 'appearance', icon: <IconEye size={16} />, label: '화면 및 텍스트' },
    { id: 'editor', icon: <IconKeyboard size={16} />, label: '에디터 및 단축키' },
    { id: 'security', icon: <IconLock size={16} />, label: '보안 및 인증' },
  ];

  const inputStyle = { padding: '10px 12px', border: '1px solid var(--border-color)', borderRadius: '6px', background: 'var(--surface-color)', color: 'var(--text-primary)', outline: 'none', width: '100%', boxSizing: 'border-box', marginTop: '6px', fontSize: '13.5px' };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 9999999 }}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ width: '800px', height: '520px', display: 'flex', flexDirection: 'column', padding: 0, borderRadius: '12px', overflow: 'hidden', boxShadow: '0 10px 40px rgba(0,0,0,0.15)' }}>
        
        <div style={{ background: 'var(--table-bg-alt)', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)' }}>
          <h2 style={{ margin: 0, color: 'var(--primary-color)', fontSize: '17px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <IconGear size={20} /> 갈피 환경 설정
          </h2>
          <button onClick={onClose} style={{ border: 'none', background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px', borderRadius: '4px', transition: 'background 0.2s' }} title="닫기">
            <IconX size={20} />
          </button>
        </div>
        
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          <div style={{ width: '220px', background: 'var(--bg-color)', padding: '20px 15px', borderRight: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {tabs.map(t => (
              <div 
                key={t.id} 
                onClick={() => setActiveTab(t.id)} 
                style={{ 
                  padding: '12px 16px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px', borderRadius: '8px', 
                  background: activeTab === t.id ? 'var(--table-bg-alt)' : 'transparent', 
                  color: activeTab === t.id ? 'var(--primary-color)' : 'var(--text-secondary)',
                  display: 'flex', alignItems: 'center', gap: '10px', transition: 'all 0.2s ease'
                }}
              >
                {t.icon} {t.label}
              </div>
            ))}
          </div>
          
          <div style={{ flex: 1, padding: '30px', overflowY: 'auto', background: 'var(--surface-color)' }}>
            {activeTab === 'appearance' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <label style={{ fontWeight: 'bold', fontSize: '14px', color: 'var(--text-primary)' }}>
                  글자 크기: {fontSize}px 
                  <input type="range" min="12" max="24" value={fontSize} onChange={e => updateSetting('fontSize', e.target.value)} style={{ width: '100%', marginTop: '10px', accentColor: 'var(--primary-color)' }} />
                </label>
                <label style={{ fontWeight: 'bold', fontSize: '14px', color: 'var(--text-primary)' }}>
                  줄 간격: {lineHeight} 
                  <input type="range" min="1.2" max="2.5" step="0.1" value={lineHeight} onChange={e => updateSetting('lineHeight', e.target.value)} style={{ width: '100%', marginTop: '10px', accentColor: 'var(--primary-color)' }} />
                </label>
                <label style={{ fontWeight: 'bold', fontSize: '14px', color: 'var(--text-primary)' }}>
                  레이아웃: 
                  <select style={inputStyle} value={layoutWidth} onChange={e => updateSetting('layoutWidth', e.target.value)}>
                    <option value="full">전체 폭 (창을 가득 채움)</option>
                    <option value="center">본문 폭 제한 (1200px, 가운데 정렬)</option>
                  </select>
                </label>
                <label style={{ fontWeight: 'bold', fontSize: '14px', color: 'var(--text-primary)' }}>
                  글꼴: 
                  <select style={inputStyle} value={fontFamily} onChange={e => updateSetting('fontFamily', e.target.value)}>
                    <option value="default">기본 폰트</option>
                    <option value="serif">명조체</option>
                    <option value="monospace">모노스페이스</option>
                  </select>
                </label>
                
                {/* 커스텀 커서 토글 및 팔레트 렌더링 구역 */}
                <div style={{ marginTop: '15px', padding: '18px', background: 'var(--bg-color)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 'bold', fontSize: '14px', color: 'var(--text-primary)', cursor: 'pointer' }}>
                    <input 
                      type="checkbox" 
                      checked={isCustomCursor} 
                      onChange={e => updateSetting('isCustomCursor', e.target.checked)} 
                      style={{ accentColor: 'var(--primary-color)', width: '16px', height: '16px', cursor: 'pointer', margin: 0 }} 
                    /> 
                    마우스 커서 스무스 모션 (Trailing Cursor)
                  </label>

                  {/* 커서 활성화 시에만 컬러 팔레트 표시 */}
                  {isCustomCursor && (
                    <div style={{ marginTop: '15px', marginLeft: '26px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '12.5px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>커서 색상:</span>
                      {[
                        { label: '기본 파랑', val: '#3b5bdb' },
                        { label: '마젠타', val: '#d81b60' },
                        { label: '핫핑크', val: '#ff1493' },
                        { label: '형광연두', val: '#c3ff00' },
                        { label: '주황', val: '#ff8c00' }
                      ].map(c => (
                        <button
                          key={c.val}
                          title={c.label}
                          onClick={() => updateSetting('cursorColor', c.val)}
                          style={{
                            width: '20px', height: '20px', borderRadius: '50%', background: c.val,
                            border: cursorColor === c.val ? `2.5px solid ${c.val}` : '1px solid var(--border-color)',
                            boxShadow: cursorColor === c.val ? `0 0 8px ${c.val}80` : 'none',
                            cursor: 'pointer', padding: 0, transition: '0.2s',
                            outlineOffset: '2px', outline: cursorColor === c.val ? `1px solid var(--border-color)` : 'none'
                          }}
                        />
                      ))}
                    </div>
                  )}

                  <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginTop: '10px', marginLeft: '26px', lineHeight: '1.5' }}>
                    버튼이나 링크에 올리면 원이 커지고 클릭 시 색이 채워집니다.<br/>화면 전환이 잦을 경우 성능을 위해 꺼두는 것을 권장합니다.
                  </div>
                </div>

                {/* 전역 밤하늘 배경 토글 — 작품 분류와 무관하게 항상 동일하게 적용 */}
                <div style={{ padding: '18px', background: 'var(--bg-color)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 'bold', fontSize: '14px', color: 'var(--text-primary)', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={isStarryBackground}
                      onChange={e => updateSetting('isStarryBackground', e.target.checked)}
                      style={{ accentColor: 'var(--primary-color)', width: '16px', height: '16px', cursor: 'pointer', margin: 0 }}
                    />
                    밤하늘 배경 (떠오르는 잔별)
                  </label>
                  <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginTop: '10px', marginLeft: '26px', lineHeight: '1.5' }}>
                    작품 분류와 상관없이 사이트 전체 배경에 별이 위로 떠오르며 반짝입니다.
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'editor' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <label style={{ fontWeight: 'bold', fontSize: '14px', color: 'var(--text-primary)' }}>
                  보스 키 (화면 가리기 단축키): 
                  <input type="text" value={bossKey} readOnly onKeyDown={handleKeyCapture} style={{ ...inputStyle, cursor: 'pointer' }} placeholder="클릭 후 키보드 입력" />
                </label>
                <label style={{ fontWeight: 'bold', fontSize: '14px', color: 'var(--text-primary)' }}>
                  블라인드 테마: 
                  <select style={inputStyle} value={blindTheme} onChange={e => updateSetting('blindTheme', e.target.value)}>
                    <option value="aurora">다크 오로라</option>
                    <option value="matrix">매트릭스 빗방울</option>
                    <option value="blackout">완전 암전</option>
                  </select>
                </label>
                <label style={{ fontWeight: 'bold', fontSize: '14px', color: 'var(--text-primary)' }}>
                  자동 저장: 
                  <select style={inputStyle} value={autoSaveInterval} onChange={e => updateSetting('autoSaveInterval', e.target.value)}>
                    {AUTO_SAVE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </label>
              </div>
            )}

            {activeTab === 'security' && <GateSettingsPanel />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingModal;