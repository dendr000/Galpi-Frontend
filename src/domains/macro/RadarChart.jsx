import React from 'react';
import Icon from '../../components/common/icons/Icon';

const RadarChart = ({ dataStr }) => {
  if (!dataStr) return null;

  try {
    const pairs = dataStr.split(',').map(s => s.trim().split('='));
    const labels = [];
    const values = [];
    
    pairs.forEach(p => {
      if (p.length === 2) {
        labels.push(p[0].trim());
        values.push(parseFloat(p[1]) || 0);
      }
    });

    const numSides = labels.length;
    if (numSides < 3) return <div style={{ color: '#e53e3e', fontSize: '12px' }}>[스탯 분석 실패: 항목 3개 이상 필요]</div>;

    const maxVal = Math.max(100, ...values);
    const size = 300;
    const center = size / 2;
    const radius = size * 0.35;

    const bgPolygons = [];
    for (let level = 1; level <= 4; level++) {
      const pts = [];
      const r = radius * (level / 4);
      for (let i = 0; i < numSides; i++) {
        const angle = (Math.PI * 2 * i / numSides) - (Math.PI / 2);
        pts.push(`${center + r * Math.cos(angle)},${center + r * Math.sin(angle)}`);
      }
      bgPolygons.push(<polygon key={`bg-${level}`} points={pts.join(' ')} fill="none" stroke="var(--border-color)" strokeWidth="1" />);
    }

    const spokes = [], dataPoints = [], dataCircles = [], textLabels = [];
    for (let i = 0; i < numSides; i++) {
      const angle = (Math.PI * 2 * i / numSides) - (Math.PI / 2);
      
      const bgX = center + radius * Math.cos(angle);
      const bgY = center + radius * Math.sin(angle);
      spokes.push(<line key={`spoke-${i}`} x1={center} y1={center} x2={bgX} y2={bgY} stroke="var(--border-color)" strokeWidth="1" />);

      const r = radius * (values[i] / maxVal);
      const dx = center + r * Math.cos(angle);
      const dy = center + r * Math.sin(angle);
      dataPoints.push(`${dx},${dy}`);
      dataCircles.push(<circle key={`circle-${i}`} cx={dx} cy={dy} r="4" fill="var(--primary-color)" stroke="#fff" strokeWidth="1.5" />);

      const lx = center + (radius + 28) * Math.cos(angle);
      const ly = center + (radius + 20) * Math.sin(angle);
      let anchor = Math.cos(angle) > 0.1 ? "start" : Math.cos(angle) < -0.1 ? "end" : "middle";

      textLabels.push(
        <g key={`text-${i}`}>
          <text x={lx} y={ly - 6} fill="var(--text-primary)" fontSize="12" fontWeight="900" textAnchor={anchor} dominantBaseline="middle">{labels[i]}</text>
          <text x={lx} y={ly + 8} fill="var(--text-secondary)" fontSize="11" fontWeight="bold" textAnchor={anchor} dominantBaseline="middle">{values[i]}</text>
        </g>
      );
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '25px 0', background: 'var(--surface-color)', padding: '25px 15px', borderRadius: '12px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
        <div style={{ fontWeight: 900, fontSize: '14px', marginBottom: '15px', color: 'var(--text-primary)', letterSpacing: '1px' }}>
          <Icon name="bar-chart" lead /> 스탯 분석 차트
        </div>
        <svg width="100%" height="100%" viewBox={`0 0 ${size} ${size}`} style={{ maxWidth: '320px', overflow: 'visible', fontFamily: 'inherit' }}>
          {bgPolygons}
          {spokes}
          <polygon points={dataPoints.join(' ')} fill="var(--primary-color)" fillOpacity="0.3" stroke="var(--primary-color)" strokeWidth="2" strokeLinejoin="round" />
          {dataCircles}
          {textLabels}
        </svg>
      </div>
    );
  } catch (e) {
    return <div style={{color: '#e53e3e', fontSize: '12px'}}>[레이더 차트 오류]</div>;
  }
};

export default RadarChart;