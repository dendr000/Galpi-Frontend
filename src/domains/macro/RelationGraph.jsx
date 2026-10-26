import React, { useState, useRef, useEffect } from 'react';
import Icon from '../../components/common/icons/Icon';

const RelationGraph = ({ dataStr, isEditMode = false, onNodeClick, onChange }) => {
  const [data, setData] = useState({ nodes: [], edges: [], width: 800, height: 450 });
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1.0);
  const [isPanning, setIsPanning] = useState(false);
  const [draggedNode, setDraggedNode] = useState(null);

  const svgRef = useRef(null);
  const panStartRef = useRef({ x: 0, y: 0 });
  const mouseStartRef = useRef({ x: 0, y: 0 });

  // JSON 복호화 및 데이터 초기화
  useEffect(() => {
    if (!dataStr) return;
    try {
      const cleanJson = decodeURIComponent(dataStr)
        .replace(/&quot;/g, '"').replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<').replace(/&gt;/g, '>').trim();
      setData(JSON.parse(cleanJson));
    } catch(e) {
      console.error("다이어그램 파싱 오류", e);
    }
  }, [dataStr]);

  // 마우스 휠 확대/축소
  const handleWheel = (e) => {
    e.preventDefault();
    setZoom(prev => Math.max(0.3, Math.min(3.0, prev + (e.deltaY < 0 ? 0.05 : -0.05))));
  };

  // 배경 및 노드 드래그 시작
  const handleMouseDown = (e) => {
    if (e.target.tagName.toLowerCase() === 'svg') {
      setIsPanning(true);
      mouseStartRef.current = { x: e.clientX, y: e.clientY };
      panStartRef.current = { x: pan.x, y: pan.y };
    }
  };

  // 실시간 마우스 좌표 추적 및 렌더링
  const handleMouseMove = (e) => {
    if (isPanning) {
      setPan({
        x: panStartRef.current.x + (e.clientX - mouseStartRef.current.x),
        y: panStartRef.current.y + (e.clientY - mouseStartRef.current.y)
      });
    } else if (draggedNode && isEditMode && svgRef.current) {
      // SVG CTM을 활용하여 화면 픽셀을 SVG 내부 좌표로 정확히 역산 치환
      const ctm = svgRef.current.getScreenCTM().inverse();
      const dx = (e.clientX - mouseStartRef.current.x) * ctm.a;
      const dy = (e.clientY - mouseStartRef.current.y) * ctm.d;
      
      setData(prev => ({
        ...prev,
        nodes: prev.nodes.map(n => 
          n.id === draggedNode.id ? { ...n, x: draggedNode.ix + dx, y: draggedNode.iy + dy } : n
        )
      }));
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
    if (draggedNode && isEditMode && onChange) onChange(data); // 에디터 모드일 경우 변경된 좌표 부모에게 전달
    setDraggedNode(null);
  };

  const handleNodeMouseDown = (e, n) => {
    if (!isEditMode) return;
    e.stopPropagation();
    mouseStartRef.current = { x: e.clientX, y: e.clientY };
    setDraggedNode({ id: n.id, ix: n.x, iy: n.y });
  };

  const handleNodeClick = (e, n) => {
    e.stopPropagation();
    if (!isEditMode && onNodeClick) onNodeClick(n.label);
  };

  // 간선(선) 벡터 렌더링 엔진
  const renderEdges = () => {
    return data.edges.map((e, idx) => {
      const n1 = data.nodes.find(n => n.id === e.source);
      const n2 = data.nodes.find(n => n.id === e.target);
      if (!n1 || !n2) return null;

      const dx = n2.x - n1.x; const dy = n2.y - n1.y;
      const dist = Math.sqrt(dx*dx + dy*dy);
      if (dist === 0) return null;

      // 선이 도형 중심이 아니라 바깥선에서 끝나도록 길이 보정
      const r1 = n1.shape === 'rect' ? 45 : 42;
      const r2 = n2.shape === 'rect' ? 45 : 42;
      const x1 = n1.x + (dx * r1 / dist); const y1 = n1.y + (dy * r1 / dist);
      const x2 = n2.x - (dx * r2 / dist); const y2 = n2.y - (dy * r2 / dist);

      const strokeCol = e.type === '<->' ? 'var(--primary-color)' : 'var(--text-secondary)';
      const strokeW = e.type === '<->' ? '2.5' : '1.5';
      const isDashed = e.type === '--' ? '5,5' : 'none';

      // 텍스트 라벨 (거꾸로 뒤집힘 방지 회전 연산 포함)
      const drawLabel = (txt, px1, py1, px2, py2) => {
        if (!txt) return null;
        const textW = txt.length * 11 + 14;
        const cx = (px1 + px2) / 2; const cy = (py1 + py2) / 2;
        let angle = Math.atan2(py2 - py1, px2 - px1) * (180 / Math.PI);
        if (angle > 90 || angle < -90) angle += 180; 
        return (
          <g transform={`rotate(${angle}, ${cx}, ${cy})`}>
            <rect x={cx - textW/2} y={cy - 11} width={textW} height="22" fill="var(--bg-color)" rx="4" ry="4" stroke={strokeCol} strokeWidth="1"/>
            <text x={cx} y={cy + 4} fill={strokeCol} fontSize="11" fontWeight="900" textAnchor="middle">{txt}</text>
          </g>
        );
      };

      if (e.type === '<->') {
        const gap = 12; const nx = -dy/dist; const ny = dx/dist;
        return (
          <g key={idx}>
            <line x1={x1+nx*gap} y1={y1+ny*gap} x2={x2+nx*gap} y2={y2+ny*gap} stroke={strokeCol} strokeWidth={strokeW} markerEnd="url(#diag-arr-act)" opacity="0.85"/>
            <line x1={x2-nx*gap} y1={y2-ny*gap} x2={x1-nx*gap} y2={y1-ny*gap} stroke={strokeCol} strokeWidth={strokeW} markerEnd="url(#diag-arr-act)" opacity="0.85"/>
            {drawLabel(e.desc, x1+nx*gap, y1+ny*gap, x2+nx*gap, y2+ny*gap)}
            {drawLabel(e.descRev, x2-nx*gap, y2-ny*gap, x1-nx*gap, y1-ny*gap)}
          </g>
        );
      }

      return (
        <g key={idx}>
          <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={strokeCol} strokeWidth={strokeW} strokeDasharray={isDashed} markerEnd={e.type==='->'?"url(#diag-arr-norm)":""} opacity="0.85"/>
          {drawLabel(e.desc, x1, y1, x2, y2)}
        </g>
      );
    });
  };

  if (!data.nodes.length) return null;

  return (
    <div style={{ margin: '20px 0', background: 'var(--bg-color)', border: '1px solid var(--border-color)', borderRadius: '12px', overflow: 'hidden' }}>
      <div style={{ padding: '12px 20px', background: 'var(--surface-color)', borderBottom: '1px solid var(--border-color)', fontWeight: 900, color: 'var(--primary-color)' }}>
        <Icon name="bar-chart" lead /> 인물 관계도 <span style={{ fontSize: '11px', color: 'var(--text-secondary)', marginLeft: '10px' }}>{isEditMode ? "(도형을 끌어 배치하세요)" : "(빈 공간을 드래그하여 시야 이동 가능)"}</span>
      </div>
      <div 
        style={{ width: '100%', overflow: 'hidden', padding: '20px 0', cursor: isPanning ? 'grabbing' : 'grab' }}
        onWheel={handleWheel} onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}
      >
        <svg ref={svgRef} width="100%" height="450" style={{ minWidth: 800, display: 'block', margin: '0 auto', userSelect: 'none', overflow: 'visible' }}>
          <defs>
            <marker id="diag-arr-norm" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto-start-reverse"><path d="M 0 0 L 8 4 L 0 8 z" fill="var(--text-secondary)"/></marker>
            <marker id="diag-arr-act" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto-start-reverse"><path d="M 0 0 L 8 4 L 0 8 z" fill="var(--primary-color)"/></marker>
            <filter id="diag-shadow"><feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.1"/></filter>
          </defs>
          <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
            {renderEdges()}
            {data.nodes.map(n => (
              <g 
                key={n.id} transform={`translate(${n.x}, ${n.y})`} 
                style={{ cursor: isEditMode ? 'grab' : 'pointer' }}
                onMouseDown={(e) => handleNodeMouseDown(e, n)} onClick={(e) => handleNodeClick(e, n)}
              >
                {n.shape === 'rect' ? (
                  <rect x="-45" y="-22" width="90" height="44" fill="var(--surface-color)" stroke="var(--text-secondary)" strokeWidth="2" rx="6" ry="6" filter="url(#diag-shadow)"/>
                ) : (
                  <circle cx="0" cy="0" r="42" fill="var(--surface-color)" stroke="var(--primary-color)" strokeWidth="2" filter="url(#diag-shadow)"/>
                )}
                <text y="5" fill="var(--text-primary)" fontSize="13" fontWeight="900" textAnchor="middle" pointerEvents="none">
                  {n.label.length > 6 ? n.label.substring(0, 5) + '..' : n.label}
                </text>
              </g>
            ))}
          </g>
        </svg>
      </div>
    </div>
  );
};

export default RelationGraph;