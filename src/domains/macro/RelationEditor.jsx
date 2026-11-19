// src/components/macro/tools/RelationEditor.jsx

import React, { useState, useCallback, useEffect } from 'react';
import { 
  ReactFlow, Controls, Background, 
  applyNodeChanges, applyEdgeChanges, addEdge, 
  MarkerType, Handle, Position,
  EdgeLabelRenderer
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import styles from '../../domains/macro/MacroToolbar.module.css';
import Icon from '../../components/common/icons/Icon';

// 1. 커스텀 인물 노드 (핸들을 정중앙으로 이동시켜 바닐라 공식과 호환)
const CustomNode = ({ data, selected }) => {
  const isRect = data.shape === 'rect';
  return (
    <div style={{
      width: isRect ? 80 : 70, height: isRect ? 40 : 70,
      borderRadius: isRect ? '6px' : '50%',
      background: selected ? 'var(--table-bg-alt)' : 'var(--surface-color)',
      border: `2px solid ${selected ? '#e53e3e' : (isRect ? 'var(--text-secondary)' : 'var(--primary-color)')}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: '12px', fontWeight: 'bold', color: 'var(--text-primary)',
      boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
    }}>
      {/* 핸들을 노드의 정중앙(50%)에 투명하게 배치하여 모든 연결선의 중심점이 되도록 설정 */}
      <Handle type="target" position={Position.Top} style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)', opacity: 0, position: 'absolute' }} />
      <div style={{ textAlign: 'center', wordBreak: 'keep-all', padding: '0 4px' }}>{data.label}</div>
      <Handle type="source" position={Position.Bottom} style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)', opacity: 0, position: 'absolute' }} />
    </div>
  );
};

// ★ 2. 바닐라 평행선 및 반지름 절단 공식을 완벽 이식한 커스텀 엣지
const RelationEdge = ({ id, sourceX, sourceY, targetX, targetY, selected, data, label }) => {
  const isBi = data?.type === '<->';
  const isDashed = data?.type === '--';
  
  // 1. 노드 중앙 간의 거리 및 방향 벡터 계산
  let dx = targetX - sourceX; 
  let dy = targetY - sourceY; 
  let dist = Math.sqrt(dx * dx + dy * dy) || 1;

  // 2. 바닐라 JS 공식: 노드 반지름(약 45px)만큼 선분을 깎아내어 노드 바깥에서 시작하게 만듦
  let r1 = 45; 
  let r2 = 45;
  let sx = sourceX + (dx * r1) / dist;
  let sy = sourceY + (dy * r1) / dist;
  let tx = targetX - (dx * r2) / dist;
  let ty = targetY - (dy * r2) / dist;

  // 3. 실제 그려질 선분을 기준으로 한 법선 벡터 (평행 이동용)
  let sdx = tx - sx;
  let sdy = ty - sy;
  let sdist = Math.sqrt(sdx * sdx + sdy * sdy) || 1;
  let nx = -sdy / sdist; 
  let ny = sdx / sdist;

  let strokeColor = selected ? '#e53e3e' : (isBi ? 'var(--primary-color)' : 'var(--text-secondary)');
  let strokeWidth = selected || isBi ? 2.5 : 1.5;
  let dashStyle = isDashed ? '5,5' : 'none';

  // React Flow 자체 마커 대신, 커스텀 정의한 마커 URL 사용
  let mEndAct = 'url(#rf-arr-active)';
  let mEndNorm = 'url(#rf-arr-normal)';
  let mEnd = selected ? mEndAct : (isBi ? mEndAct : mEndNorm);

  // 텍스트 회전 각도 계산
  let angle = Math.atan2(sdy, sdx) * (180 / Math.PI);
  let textAngle = angle;
  if (textAngle > 90 || textAngle < -90) textAngle += 180;

  const labelBoxStyle = {
    background: 'var(--surface-color)', padding: '2px 8px', border: `1px solid ${strokeColor}`, 
    borderRadius: '4px', fontSize: '11px', fontWeight: '900', minWidth: 'max-content', textAlign: 'center',
    boxShadow: '0 2px 6px rgba(0,0,0,0.08)'
  };

  if (isBi) {
    let gap = 12; // 평행선 간격
    // 정방향 선
    let l1x1 = sx + nx * gap; let l1y1 = sy + ny * gap;
    let l1x2 = tx + nx * gap; let l1y2 = ty + ny * gap;
    // 역방향 선: 화살표 방향을 위해 tx->sx 방향으로 그음
    let l2x1 = tx - nx * gap; let l2y1 = ty - ny * gap;
    let l2x2 = sx - nx * gap; let l2y2 = sy - ny * gap;

    let c1x = (l1x1 + l1x2) / 2; let c1y = (l1y1 + l1y2) / 2;
    let c2x = (l2x1 + l2x2) / 2; let c2y = (l2y1 + l2y2) / 2;

    return (
      <>
        <line x1={l1x1} y1={l1y1} x2={l1x2} y2={l1y2} stroke={strokeColor} strokeWidth={strokeWidth} markerEnd={mEnd} opacity="0.85" />
        <line x1={l2x1} y1={l2y1} x2={l2x2} y2={l2y2} stroke={strokeColor} strokeWidth={strokeWidth} markerEnd={mEnd} opacity="0.85" />
        {/* 마우스 클릭 감지용 보이지 않는 두꺼운 선 */}
        <line x1={sourceX} y1={sourceY} x2={targetX} y2={targetY} stroke="transparent" strokeWidth={25} style={{ cursor: 'pointer' }} />
        
        <EdgeLabelRenderer>
          {label && (
            <div style={{ position: 'absolute', transform: `translate(-50%, -50%) translate(${c1x}px,${c1y}px) rotate(${textAngle}deg)`, pointerEvents: 'all' }} className="nodrag nopan">
              <div style={{ ...labelBoxStyle, color: 'var(--primary-color)' }}>{label}</div>
            </div>
          )}
          {data?.descRev && (
            <div style={{ position: 'absolute', transform: `translate(-50%, -50%) translate(${c2x}px,${c2y}px) rotate(${textAngle}deg)`, pointerEvents: 'all' }} className="nodrag nopan">
              <div style={{ ...labelBoxStyle, borderColor: '#e53e3e', color: '#e53e3e' }}>{data.descRev}</div>
            </div>
          )}
        </EdgeLabelRenderer>
      </>
    );
  }

  // 단방향 및 점선
  let cx = (sx + tx) / 2; 
  let cy = (sy + ty) / 2;
  return (
    <>
      <line x1={sx} y1={sy} x2={tx} y2={ty} stroke={strokeColor} strokeWidth={strokeWidth} strokeDasharray={dashStyle} markerEnd={isDashed ? undefined : mEnd} opacity="0.85" />
      <line x1={sourceX} y1={sourceY} x2={targetX} y2={targetY} stroke="transparent" strokeWidth={25} style={{ cursor: 'pointer' }} />
      <EdgeLabelRenderer>
        {label && (
          <div style={{ position: 'absolute', transform: `translate(-50%, -50%) translate(${cx}px,${cy}px) rotate(${textAngle}deg)`, pointerEvents: 'all' }} className="nodrag nopan">
            <div style={{ ...labelBoxStyle, color: strokeColor }}>{label}</div>
          </div>
        )}
      </EdgeLabelRenderer>
    </>
  );
};

const nodeTypes = { custom: CustomNode };
const edgeTypes = { relation: RelationEdge };

const RelationEditor = ({ selectedText, onInsert, onCancel }) => {
  const initData = () => {
    if (selectedText && selectedText.includes('[RELATION_GRAPH]')) {
      try {
        const jsonStr = selectedText.replace(/\[\/?RELATION_GRAPH\]/g, '').replace(/&quot;/g, '"').trim();
        const parsed = JSON.parse(jsonStr);
        if (parsed.nodes) {
          const initNodes = parsed.nodes.map(n => ({
            id: n.id, type: 'custom', position: { x: n.x, y: n.y }, data: { label: n.label, shape: n.shape }
          }));
          const initEdges = parsed.edges.map((e, i) => ({
            id: `e-${e.source}-${e.target}-${i}`, source: e.source, target: e.target, label: e.desc, type: 'relation',
            data: { type: e.type, descRev: e.descRev || '' }
          }));
          return { nodes: initNodes, edges: initEdges };
        }
      } catch(e) {}
    }
    return {
      nodes: [
        { id: 'n1', type: 'custom', position: { x: 200, y: 150 }, data: { label: '테스트', shape: 'circle' } },
        { id: 'n2', type: 'custom', position: { x: 400, y: 150 }, data: { label: '테스트2', shape: 'rect' } }
      ],
      edges: [{ 
        id: 'e-n1-n2', source: 'n1', target: 'n2', label: '관계', type: 'relation', data: { type: '->', descRev: '' }
      }]
    };
  };

  const initial = initData();
  const [nodes, setNodes] = useState(initial.nodes);
  const [edges, setEdges] = useState(initial.edges);
  
  const [rfInstance, setRfInstance] = useState(null);
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState(null);
  const [diagInputName, setDiagInputName] = useState("");

  const onNodesChange = useCallback((changes) => setNodes((nds) => applyNodeChanges(changes, nds)), []);
  const onEdgesChange = useCallback((changes) => setEdges((eds) => applyEdgeChanges(changes, eds)), []);
  
  const onConnect = useCallback((params) => {
    setEdges((eds) => addEdge({ 
      ...params, label: '관계', type: 'relation', data: { type: '->', descRev: '' }
    }, eds));
  }, []);

  const onSelectionChange = useCallback(({ nodes, edges }) => {
    setSelectedNodeId(nodes.length > 0 ? nodes[0].id : null);
    setSelectedEdgeId(edges.length > 0 ? edges[0].id : null);
  }, []);

  const addDiagNode = (shape) => {
    if (!diagInputName.trim()) return alert("명칭을 입력하세요.");
    const id = "node_" + Date.now();
    let position = { x: 300, y: 200 };
    if (rfInstance) {
      const center = rfInstance.screenToFlowPosition({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
      position = { x: center.x + Math.random() * 20, y: center.y + Math.random() * 20 };
    }
    setNodes([...nodes, { id, type: 'custom', position, data: { label: diagInputName, shape } }]);
    setDiagInputName("");
  };

  const updateEdgeStyle = (edgeId, type) => {
    setEdges(eds => eds.map(e => {
      if (e.id === edgeId) {
        return { ...e, data: { ...e.data, type } };
      }
      return e;
    }));
  };

  const handleConfirm = () => {
    if (nodes.length === 0) return alert("배치된 인물 오브젝트가 존재하지 않습니다.");
    
    let minX = Math.min(...nodes.map(n => n.position.x));
    let maxX = Math.max(...nodes.map(n => n.position.x));
    let minY = Math.min(...nodes.map(n => n.position.y));
    let maxY = Math.max(...nodes.map(n => n.position.y));

    let offX = minX < 45 ? 45 - minX : 0;
    let offY = minY < 45 ? 45 - minY : 0;
    
    const payload = {
      width: Math.floor(Math.max(720, maxX + offX + 100)),
      height: Math.floor(Math.max(380, maxY + offY + 100)),
      nodes: nodes.map(n => ({ id: n.id, label: n.data.label, shape: n.data.shape, x: n.position.x + offX, y: n.position.y + offY })),
      edges: edges.map(e => ({ source: e.source, target: e.target, type: e.data?.type || '->', desc: e.label, descRev: e.data?.descRev || '' }))
    };
    onInsert(`\n[RELATION_GRAPH]\n${JSON.stringify(payload)}\n[/RELATION_GRAPH]\n`);
  };

  const activeNode = nodes.find(n => n.id === selectedNodeId);
  const activeEdge = edges.find(e => e.id === selectedEdgeId);

  return (
    <>
      <div className={styles.modalBody}>
        <div style={{ display: 'flex', gap: '15px', height: '70vh', minHeight: '500px', userSelect: 'none' }}>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', background: 'var(--table-bg-alt)', padding: '8px 12px', borderRadius: '6px' }}>
              <input className={styles.toolInput} style={{ width: '160px', flex: 'none', padding: '6px', height: '32px', boxSizing: 'border-box' }} placeholder="명칭 입력" value={diagInputName} onChange={e => setDiagInputName(e.target.value)} onKeyDown={e => e.key === 'Enter' && addDiagNode('circle')} />
              <button className="wiki-btn" style={{ background: 'var(--primary-color)', color: 'white', height: '32px' }} onClick={() => addDiagNode('circle')}><Icon name="circle" lead />원형 추가</button>
              <button className="wiki-btn" style={{ background: 'var(--text-secondary)', color: 'white', height: '32px' }} onClick={() => addDiagNode('rect')}><Icon name="square" lead />사각형 추가</button>
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)', marginLeft: 'auto', fontWeight: 'bold' }}><Icon name="lightbulb" lead />도형 중심을 드래그하여 연결</span>
            </div>
            
            <div className={styles.diagramBoard} style={{ border: '2px dashed var(--border-color)', borderRadius: '8px', overflow: 'hidden', position: 'relative' }}>
              {/* 커스텀 마커를 React Flow 내부에 SVG로 직접 주입 */}
              <svg style={{ position: 'absolute', top: 0, left: 0, width: 0, height: 0 }}>
                <defs>
                  <marker id="rf-arr-normal" markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto-start-reverse">
                    <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--text-secondary)" />
                  </marker>
                  <marker id="rf-arr-active" markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto-start-reverse">
                    <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--primary-color)" />
                  </marker>
                </defs>
              </svg>

              <ReactFlow 
                nodes={nodes} edges={edges} 
                onNodesChange={onNodesChange} onEdgesChange={onEdgesChange} onConnect={onConnect}
                onSelectionChange={onSelectionChange} onInit={setRfInstance}
                nodeTypes={nodeTypes} edgeTypes={edgeTypes}
                fitView
              >
                <Background color="var(--border-color)" gap={16} />
                <Controls />
              </ReactFlow>
            </div>
          </div>

          {/* ★ 세로로 찢어지던 버그 해결: height: 'fit-content' 고정 및 input 높이 명시적 지정 */}
          <div className={styles.diagPanel} style={{ width: '220px', padding: '12px', background: 'var(--table-bg-alt)', border: '1px solid var(--border-color)', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '8px', height: 'fit-content' }}>
            {activeNode ? (
              <>
                <div style={{ fontWeight: 900, color: 'var(--primary-color)', borderBottom: '1px dashed var(--border-color)', paddingBottom: '6px', fontSize: '13px' }}><Icon name="edit" lead />도형 속성 변경</div>
                <label style={{ fontSize: '11px', fontWeight: 'bold', marginTop: '4px' }}>명칭 수정</label>
                <input className={styles.toolInput} style={{ padding: '6px 8px', fontSize: '12px', height: '32px', boxSizing: 'border-box' }} value={activeNode.data.label} onChange={e => setNodes(nds => nds.map(n => n.id === activeNode.id ? { ...n, data: { ...n.data, label: e.target.value } } : n))} />
                <button className="wiki-btn" style={{ background: '#e53e3e', color: 'white', marginTop: '10px', padding: '8px', height: '32px' }} onClick={() => { setNodes(nds => nds.filter(n => n.id !== activeNode.id)); setSelectedNodeId(null); }}><Icon name="trash" lead />도형 삭제</button>
              </>
            ) : activeEdge ? (
              <>
                <div style={{ fontWeight: 900, color: 'var(--primary-color)', borderBottom: '1px dashed var(--border-color)', paddingBottom: '6px', fontSize: '13px' }}><Icon name="settings" lead />연결선 설정</div>
                
                <label style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--primary-color)', marginTop: '4px' }}>관계 기술 (정방향)</label>
                <input className={styles.toolInput} style={{ padding: '6px 8px', fontSize: '12px', height: '32px', boxSizing: 'border-box' }} value={activeEdge.label || ''} onChange={e => setEdges(eds => eds.map(edge => edge.id === activeEdge.id ? { ...edge, label: e.target.value } : edge))} />

                {activeEdge.data?.type === '<->' && (
                  <>
                    <label style={{ fontSize: '11px', fontWeight: 'bold', marginTop: '8px', color: '#e53e3e' }}>관계 기술 (역방향)</label>
                    <input className={styles.toolInput} style={{ borderColor: '#e53e3e', padding: '6px 8px', fontSize: '12px', height: '32px', boxSizing: 'border-box' }} value={activeEdge.data?.descRev || ''} onChange={e => setEdges(eds => eds.map(edge => edge.id === activeEdge.id ? { ...edge, data: { ...edge.data, descRev: e.target.value } } : edge))} />
                  </>
                )}

                <label style={{ fontSize: '11px', fontWeight: 'bold', marginTop: '8px' }}>선 종류 결정</label>
                <select className={styles.toolInput} style={{ padding: '6px 8px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', height: '32px', boxSizing: 'border-box' }} value={activeEdge.data?.type || '->'} onChange={e => updateEdgeStyle(activeEdge.id, e.target.value)}>
                  <option value="->">단방향 화살표</option>
                  <option value="<->">양방향 화살표</option>
                  <option value="--">종속/연결 점선</option>
                </select>
                <button className="wiki-btn" style={{ background: '#e53e3e', color: 'white', marginTop: '10px', padding: '8px', height: '32px' }} onClick={() => { setEdges(eds => eds.filter(e => e.id !== activeEdge.id)); setSelectedEdgeId(null); }}><Icon name="close" lead />연결선 제거</button>
              </>
            ) : (
              <div style={{ color: 'var(--text-secondary)', textAlign: 'center', paddingTop: '40px', fontWeight: 'bold', fontSize: '12px', lineHeight: 1.6 }}>도형이나 연결선을<br/>클릭하면 이곳에<br/>설정창이 활성화됩니다.</div>
            )}
          </div>
        </div>
      </div>
      <div className={styles.modalFooter}>
        <button className={styles.cancelBtn} onClick={onCancel}>취소</button>
        <button className={styles.confirmBtn} onClick={handleConfirm}>에디터에 삽입</button>
      </div>
    </>
  );
};

export default RelationEditor;