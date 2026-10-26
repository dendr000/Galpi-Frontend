// 파일 위치: src/components/work/BatchImageModal.jsx
// 버전: v1.3.0 (저장 데이터 동기화 및 리셋 버그 완벽 해결 버전)

import React, { useState, useEffect } from 'react';
import api from '../../api/axiosCore';
import { useDrag } from '@use-gesture/react';
import Icon from '../../components/common/icons/Icon';

const BatchImageModal = ({ isOpen, onClose, characters, work, charExt, batchImgY, setBatchImgY, batchImgX, setBatchImgX, setCharacters }) => {
  const [zoomScale, setZoomScale] = useState(1.0);

  // ★ 1. 모달이 열릴 때 DB(또는 상위 상태)에 저장된 기존 설정값을 불러와 모달에 세팅 (리셋 버그 해결)
  useEffect(() => {
    if (isOpen && characters.length > 0) {
      let dp = {};
      try {
        dp = JSON.parse(characters[0].dynamicProperties || characters[0]._rawDynamic || "{}");
      } catch(e) {}

      // 이전에 저장된 값이 있으면 적용, 없으면 기본값 적용
      const initialY = dp.cardImgY !== undefined ? dp.cardImgY : 50;
      const initialX = dp.cardImgX !== undefined ? dp.cardImgX : 50;
      const initialScale = dp.cardImgScale !== undefined ? dp.cardImgScale : 1.0;

      setBatchImgY(initialY);
      setBatchImgX(initialX);
      setZoomScale(initialScale);
      console.log(`[BatchImageModal] 기존 저장 데이터 복원 완료: X축=${initialX}%, Y축=${initialY}%, 배율=${initialScale}`);
    }
  }, [isOpen, characters, setBatchImgY, setBatchImgX]);

  // ★ 예전엔 세로(my) 움직임만 받아서 Y축만 조정했는데, 가로(mx)도 같이 받아서 좌우로도
  // 자유롭게 드래그할 수 있게 한다.
  const bindDrag = useDrag(({ movement: [mx, my], memo = [parseInt(batchImgX, 10) || 50, parseInt(batchImgY, 10) || 50], dragging }) => {
    if (dragging) {
      let newPosX = memo[0] + (mx * 0.25);
      let newPosY = memo[1] - (my * 0.25);
      newPosX = Math.max(0, Math.min(100, newPosX));
      newPosY = Math.max(0, Math.min(100, newPosY));
      setBatchImgX(Math.round(newPosX));
      setBatchImgY(Math.round(newPosY));
    }
    return memo;
  });

  const handleBatchSave = async () => {
    try {
      const promises = characters.map(c => {
        let dp = {};
        try { 
          dp = JSON.parse(c.dynamicProperties || c._rawDynamic || "{}"); 
        } catch(err) {}
        
        // X축·Y축 위치와 함께 추가된 확대 배율도 DB 속성으로 세팅
        dp.cardImgX = parseInt(batchImgX, 10);
        dp.cardImgY = parseInt(batchImgY, 10);
        dp.cardImgScale = parseFloat(zoomScale);
        const newDynamic = JSON.stringify(dp);

        return api.put(`/api/characters/${c.id}`, { ...c, dynamicProperties: newDynamic, _rawDynamic: newDynamic });
      });

      await Promise.all(promises);

      // ★ 2. 상위 컴포넌트 상태 업데이트 시 JSON 문자열(dynamicProperties) 전체를 덮어씌워 렌더링 강제 유발
      setCharacters(prev => prev.map(c => {
        let dp = {};
        try { dp = JSON.parse(c.dynamicProperties || c._rawDynamic || "{}"); } catch(err) {}
        dp.cardImgX = parseInt(batchImgX, 10);
        dp.cardImgY = parseInt(batchImgY, 10);
        dp.cardImgScale = parseFloat(zoomScale);
        const newDynamic = JSON.stringify(dp);

        return {
          ...c,
          cardImgX: dp.cardImgX,
          cardImgY: dp.cardImgY,
          cardImgScale: dp.cardImgScale,
          dynamicProperties: newDynamic,
          _rawDynamic: newDynamic
        };
      }));
      
      onClose();
      alert("일괄 변경이 완료되었습니다.");
    } catch(e) {
      alert("변경 중 오류가 발생했습니다.");
    }
  };

  if (!isOpen || characters.length === 0) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 100000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(3px)' }} onClick={onClose}>
      <div style={{ background: 'var(--surface-color)', width: '380px', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 10px 40px rgba(0,0,0,0.3)', display: 'flex', flexDirection: 'column' }} onClick={e => e.stopPropagation()}>
        
        <div style={{ padding: '15px 20px', background: 'var(--table-bg-alt)', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: '16px', color: 'var(--primary-color)' }}>
            <Icon name="image" lead /> 캐릭터 썸네일 일괄 조정
          </h3>
          <button style={{ background: 'transparent', border: 'none', fontSize: '20px', cursor: 'pointer', color: 'var(--text-secondary)' }} onClick={onClose}>&times;</button>
        </div>

        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px' }}>
          
          <div style={{ width: '220px', background: 'var(--surface-color)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '15px', display: 'flex', flexDirection: 'column', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
            <div 
              {...bindDrag()}
              style={{ 
                height: '160px', 
                background: 'var(--bg-color)',
                borderRadius: '4px',
                overflow: 'hidden',
                position: 'relative',
                cursor: 'move',
                touchAction: 'none',
                marginBottom: '10px'
              }}
            >
              <img
                src={`/img/character/${encodeURIComponent(work.title + "_" + characters[0].name + "." + charExt)}`}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  objectPosition: `${batchImgX}% ${batchImgY}%`,
                  transform: `scale(${zoomScale})`,
                  transition: 'transform 0.1s ease',
                  pointerEvents: 'none'
                }}
                onError={(e) => { e.target.style.display = 'none'; }}
                alt="미리보기"
                draggable="false"
              />
            </div>

            <div style={{ fontWeight: 'bold', fontSize: '14px', color: 'var(--text-primary)' }}>
              {characters[0].name}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', width: '100%', justifyContent: 'center' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
              <Icon name="search" lead /> 이미지 확대 제어:
            </span>
            <button className="wiki-btn" onClick={() => setZoomScale(prev => Math.max(1.0, prev - 0.1))} style={{ padding: '2px 6px', fontSize: '11px' }}>-</button>
            <span style={{ fontSize: '11px', fontWeight: 'bold', width: '35px', textAlign: 'center' }}>{Math.round(zoomScale * 100)}%</span>
            <button className="wiki-btn" onClick={() => setZoomScale(prev => Math.min(2.0, prev + 0.1))} style={{ padding: '2px 6px', fontSize: '11px' }}>+</button>
          </div>

          <input
            type="range" min="0" max="100" value={batchImgX}
            onChange={(e) => setBatchImgX(e.target.value)}
            style={{ width: '100%', cursor: 'pointer', accentColor: 'var(--primary-color)' }}
          />
          <span style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>X축 위치: {batchImgX}%</span>

          <input
            type="range" min="0" max="100" value={batchImgY}
            onChange={(e) => setBatchImgY(e.target.value)}
            style={{ width: '100%', cursor: 'pointer', accentColor: 'var(--primary-color)' }}
          />
          <span style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>Y축 위치: {batchImgY}%</span>

          <p style={{ margin: 0, fontSize: '12px', color: '#e53e3e', textAlign: 'center', lineHeight: 1.4 }}>
            저장 시 이 작품의 <strong>모든 캐릭터</strong> 썸네일 위치가<br/>선택한 값으로 일괄 변경됩니다.
          </p>
        </div>

        <div style={{ padding: '15px 20px', borderTop: '1px solid var(--border-color)', display: 'flex', gap: '10px' }}>
          <button className="wiki-btn" style={{ flex: 1, padding: '10px', background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }} onClick={onClose}>취소</button>
          <button className="wiki-btn" style={{ flex: 2, padding: '10px', background: 'var(--primary-color)', color: 'white', border: 'none' }} onClick={handleBatchSave}>일괄 저장 적용</button>
        </div>

      </div>
    </div>
  );
};

export default BatchImageModal;