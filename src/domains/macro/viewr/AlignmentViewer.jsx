// 파일 위치: src/components/macro/viewer/AlignmentViewer.jsx
// 기능 요약: TRPG/MBTI 가치관 좌표계를 시각화하는 2D 십자 매트릭스 산점도 뷰어 컴포넌트
// 버전: v1.0.0

import React from 'react';
import { parseRankValue } from '../tools/rankUtils';
import Icon from '../../../components/common/icons/Icon';

const AlignmentViewer = ({ dataStr }) => {
  console.log("[AlignmentViewer] 성향 매트릭스 렌더링 개시. 원본 데이터:", dataStr);

  try {
    const pairs = dataStr.split(',').map(s => s.trim().split('='));
    let xLabel = "가로축", yLabel = "세로축", xVal = 50, yVal = 50;
    
    if (pairs[0] && pairs[0].length === 2) { 
      xLabel = pairs[0][0].trim(); 
      xVal = parseRankValue(pairs[0][1]); 
    }
    if (pairs[1] && pairs[1].length === 2) { 
      yLabel = pairs[1][0].trim(); 
      yVal = parseRankValue(pairs[1][1]); 
    }

    const size = 260; 
    const center = size / 2;
    // Y축은 웹 렌더링 특성상 상단이 0이므로 (100 - Y) 로 역산
    const px = (xVal / 100) * size; 
    const py = size - ((yVal / 100) * size);

    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '25px 0', background: 'var(--surface-color)', padding: '25px 15px', borderRadius: '12px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
        <div style={{ fontWeight: 900, fontSize: '14px', marginBottom: '25px', color: 'var(--text-primary)', letterSpacing: '1px' }}>
          <Icon name="compass" lead /> 2D 성향 매트릭스
        </div>
        <svg width="100%" height="100%" viewBox={`-40 -40 ${size+80} ${size+80}`} style={{ maxWidth: '300px', overflow: 'visible', fontFamily: 'inherit' }}>
          {/* Background Grid */}
          <rect x="0" y="0" width={size} height={size} fill="var(--bg-color)" stroke="var(--border-color)" strokeWidth="1" rx="8" />
          
          {/* Axis Lines */}
          <line x1={center} y1="0" x2={center} y2={size} stroke="var(--text-secondary)" strokeWidth="2" strokeDasharray="4,4" />
          <line x1="0" y1={center} x2={size} y2={center} stroke="var(--text-secondary)" strokeWidth="2" strokeDasharray="4,4" />
          
          {/* Labels */}
          <text x={center} y="-12" fill="var(--text-primary)" fontSize="13" fontWeight="900" textAnchor="middle">{yLabel} (+)</text>
          <text x={center} y={size + 24} fill="var(--text-secondary)" fontSize="12" fontWeight="bold" textAnchor="middle">{yLabel} (-)</text>
          <text x={size + 12} y={center + 4} fill="var(--text-primary)" fontSize="13" fontWeight="900" textAnchor="start">{xLabel} (+)</text>
          <text x="-12" y={center + 4} fill="var(--text-secondary)" fontSize="12" fontWeight="bold" textAnchor="end">{xLabel} (-)</text>

          {/* Coordinate Point */}
          <circle cx={px} cy={py} r="7" fill="var(--primary-color)" stroke="var(--surface-color)" strokeWidth="3" style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }} />
          <text x={px} y={py - 14} fill="var(--primary-color)" fontSize="12" fontWeight="900" textAnchor="middle">현재 위치</text>
        </svg>
      </div>
    );
  } catch(e) {
    return <div style={{ color: '#e53e3e', fontSize: '12px', padding: '10px' }}>[성향 매트릭스 렌더링 오류: 구문 확인 요망]</div>;
  }
};

export default AlignmentViewer;