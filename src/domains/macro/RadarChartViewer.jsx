// 파일 위치: src/components/macro/viewer/RadarChartViewer.jsx
// 기능 요약: recharts 라이브러리를 활용하여 마크다운 본문 내 [스탯: ...] 매크로 데이터를 선언적 애니메이션 방사형 차트로 시각화하는 전용 컴포넌트 (알파벳 등급 스케일 지원)
// 버전: v2.2.0

import React from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import Icon from '../../components/common/icons/Icon';

// ★ 알파벳 랭크 및 숫자 겸용 파싱 유틸리티
const parseRankValue = (valStr) => {
  if (!valStr) return 0;
  const s = String(valStr).toUpperCase().trim();
  if (!isNaN(parseFloat(s))) return parseFloat(s);
  
  const rankMap = {
    'EX': 100, 'SSS': 95, 'SS': 90, 'S+': 85, 'S': 80, 'S-': 75,
    'A+': 70, 'A': 65, 'A-': 60, 'B+': 55, 'B': 50, 'B-': 45,
    'C+': 40, 'C': 35, 'C-': 30, 'D+': 25, 'D': 20, 'D-': 15,
    'E': 10, 'F': 5
  };
  
  if (rankMap[s] !== undefined) return rankMap[s];
  for (const key of Object.keys(rankMap)) {
    if (s.startsWith(key)) return rankMap[key];
  }
  return 0;
};

const RadarChartViewer = ({ dataStr }) => {
  console.log("[RadarChartViewer] 스탯 차트 데이터 파싱 및 컴포넌트 마운트 실행. 원본 데이터:", dataStr);

  const pairs = dataStr.split(',').map(s => s.trim().split('='));
  const chartData = [];

  pairs.forEach(p => {
    if (p.length === 2) {
      const label = p[0].trim();
      const valStr = p[1].trim();
      // 숫자가 아닌 문자 등급을 감지하여 Recharts가 그릴 수 있는 수치로 치환
      const val = parseRankValue(valStr);
      chartData.push({ subject: label, value: val, fullMark: 100, originalStr: valStr });
    }
  });

  console.log("[RadarChartViewer] Recharts 매핑 구조체 변환 완료 데이터:", chartData);

  if (chartData.length < 3) {
    console.warn("[RadarChartViewer] 꼭짓점 개수 부족 오류 발생 (최소 3개 필요)");
    return <div style={{ color: '#e53e3e', fontSize: '12px', padding: '10px' }}>[스탯 분석 실패: 항목 3개 이상 필요]</div>;
  }

  // 커스텀 라벨 포맷터 (등급 문자열 그대로 렌더링 유지)
  const renderCustomTick = ({ payload, x, y, textAnchor, stroke, radius }) => {
    return (
      <text radius={radius} stroke={stroke} x={x} y={y} className="recharts-text recharts-polar-angle-axis-tick-value" textAnchor={textAnchor}>
        <tspan x={x} dy="0em" fill="var(--text-primary)" fontSize="11" fontWeight="bold">{payload.value}</tspan>
      </text>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '25px 0', background: 'var(--surface-color)', padding: '25px 15px', borderRadius: '12px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
      <div style={{ fontWeight: 900, fontSize: '14px', marginBottom: '15px', color: 'var(--text-primary)', letterSpacing: '1px' }}>
        <Icon name="bar-chart" lead /> 스탯 분석 차트
      </div>
      <div style={{ width: '100%', height: '300px', maxWidth: '320px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="70%" data={chartData}>
            <PolarGrid stroke="var(--border-color)" />
            <PolarAngleAxis dataKey="subject" tick={renderCustomTick} />
            <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: 'var(--text-secondary)', fontSize: 9 }} />
            <Radar name="스탯" dataKey="value" stroke="var(--primary-color)" fill="var(--primary-color)" fillOpacity={0.3} isAnimationActive={true} />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default RadarChartViewer;