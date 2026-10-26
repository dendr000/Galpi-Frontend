// 파일 위치: src/components/macro/viewer/RadarCompareViewer.jsx
// 기능 요약: 2명 이상의 캐릭터/세력 스탯을 하나의 Recharts 캔버스에 겹쳐서 렌더링하는 다중 비교 레이더 차트 위젯
// 버전: v1.0.0

import React from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { parseRankValue } from '../tools/rankUtils';
import Icon from '../../../components/common/icons/Icon';

const RadarCompareViewer = ({ dataStr }) => {
  console.log("[RadarCompareViewer] 다중 스탯 비교 차트 데이터 파싱 개시. 원본 데이터:", dataStr);

  // 데이터 가공 단락 (예: 주인공=근력:A,민첩:S / 라이벌=근력:S,민첩:B)
  const entities = dataStr.split('/').map(e => e.trim()).filter(Boolean);
  const statsMap = {};
  const subjects = [];

  entities.forEach(entity => {
    const [subjectName, statsStr] = entity.split('=');
    if (!subjectName || !statsStr) return;
    
    const sName = subjectName.trim();
    subjects.push(sName);

    const statPairs = statsStr.split(',');
    statPairs.forEach(pair => {
      const [label, valStr] = pair.split(':');
      if (!label || !valStr) return;
      
      const lName = label.trim();
      if (!statsMap[lName]) {
        statsMap[lName] = { statName: lName, fullMark: 100 };
      }
      statsMap[lName][sName] = parseRankValue(valStr);
      statsMap[lName][`${sName}_original`] = valStr.trim();
    });
  });

  const chartData = Object.values(statsMap);
  const colors = ['var(--primary-color)', '#e53e3e', '#10b981', '#f59f00', '#9c36b5'];

  if (chartData.length < 3 || subjects.length === 0) {
    return <div style={{ color: '#e53e3e', fontSize: '12px', padding: '10px' }}>[다중 스탯 분석 실패: 주체 및 항목(3개 이상) 구문 확인 요망]</div>;
  }

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{ background: 'var(--surface-color)', border: '1px solid var(--border-color)', padding: '10px', borderRadius: '8px', boxShadow: 'var(--shadow-sm)', fontSize: '12px' }}>
          <div style={{ fontWeight: 'bold', marginBottom: '5px', borderBottom: '1px solid var(--border-color)', paddingBottom: '3px' }}>{payload[0].payload.statName}</div>
          {payload.map((entry, index) => (
            <div key={index} style={{ color: entry.color, fontWeight: 'bold', marginTop: '3px' }}>
              {entry.name}: {entry.payload[`${entry.name}_original`]} ({entry.value})
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '25px 0', background: 'var(--surface-color)', padding: '25px 15px', borderRadius: '12px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
      <div style={{ fontWeight: 900, fontSize: '14px', marginBottom: '10px', color: 'var(--text-primary)', letterSpacing: '1px' }}>
        <Icon name="swap" lead /> 스탯 전력 비교 매트릭스
      </div>
      <div style={{ width: '100%', height: '320px', maxWidth: '400px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="65%" data={chartData}>
            <PolarGrid stroke="var(--border-color)" />
            <PolarAngleAxis dataKey="statName" tick={{ fill: 'var(--text-primary)', fontSize: 11, fontWeight: 'bold' }} />
            <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: '12px', fontWeight: 'bold', paddingTop: '10px' }} />
            {subjects.map((subject, idx) => (
              <Radar 
                key={idx}
                name={subject} 
                dataKey={subject} 
                stroke={colors[idx % colors.length]} 
                fill={colors[idx % colors.length]} 
                fillOpacity={0.3} 
                isAnimationActive={true} 
              />
            ))}
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default RadarCompareViewer;