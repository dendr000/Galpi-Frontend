// 파일 위치: src/domains/macro/utils/macroGenerators.js
// 기능 요약: 마크다운 예약어를 감지하여 시각화 HTML/SVG 위젯을 문자열로 즉시 조립하는 순수 렌더링 함수 모음
// 버전: v2.3.1 (createRelationGraphHtml 누락 함수 복구 통합본)
import { sanitizeFilenameTitle } from '../../../utils/filenameSanitizer';

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

export const createRadarChartHtml = (dataStr) => {
  try {
    const pairs = dataStr.split(',').map(s => s.trim().split('='));
    const labels = []; const values = []; const originalValues = [];
    pairs.forEach(p => { 
      if (p.length === 2) { 
        labels.push(p[0].trim()); values.push(parseRankValue(p[1])); originalValues.push(p[1].trim());
      } 
    });
    const maxVal = Math.max(100, ...values); const size = 300; const center = size / 2; const radius = size * 0.35; const numSides = labels.length;
    if (numSides < 3) return `<div style="color:#e53e3e; font-size:12px;">[스탯 분석 실패: 항목 3개 이상 필요]</div>`;
    
    let bgPolygons = ""; let polygonPoints = ""; let labelHtml = ""; let pointsHtml = "";
    for(let level=1; level<=4; level++) {
      let pts = ""; let r = radius * (level/4);
      for(let i=0; i<numSides; i++) {
        let angle = (Math.PI * 2 * i / numSides) - (Math.PI / 2);
        pts += `${center + r * Math.cos(angle)},${center + r * Math.sin(angle)} `;
      }
      bgPolygons += `<polygon class="gt-macro-line" points="${pts.trim()}" fill="none" stroke="var(--border-color)" stroke-width="1"/>`;
    }
    for(let i=0; i<numSides; i++) {
      let angle = (Math.PI * 2 * i / numSides) - (Math.PI / 2);
      let bgX = center + radius * Math.cos(angle); let bgY = center + radius * Math.sin(angle);
      bgPolygons += `<line class="gt-macro-line" x1="${center}" y1="${center}" x2="${bgX}" y2="${bgY}" stroke="var(--border-color)" stroke-width="1"/>`;
      let r = radius * (values[i] / maxVal);
      let dx = center + r * Math.cos(angle); let dy = center + r * Math.sin(angle);
      polygonPoints += `${dx},${dy} `;
      pointsHtml += `<circle class="gt-macro-accent-dot" cx="${dx}" cy="${dy}" r="4" fill="var(--primary-color)" stroke="#fff" stroke-width="1.5"/>`;
      let lx = center + (radius + 28) * Math.cos(angle); let ly = center + (radius + 20) * Math.sin(angle);
      let anchor = "middle";
      if(Math.cos(angle) > 0.1) anchor = "start"; else if(Math.cos(angle) < -0.1) anchor = "end";
      labelHtml += `<text class="gt-macro-ink" x="${lx}" y="${ly-6}" fill="var(--text-primary)" font-size="12" font-weight="900" text-anchor="${anchor}" dominant-baseline="middle">${labels[i]}</text>`;
      labelHtml += `<text class="gt-macro-ink-soft" x="${lx}" y="${ly+8}" fill="var(--text-secondary)" font-size="11" font-weight="bold" text-anchor="${anchor}" dominant-baseline="middle">${originalValues[i]}</text>`;
    }
    return `<div class="galpi-ext-radar gt-macro-box" style="display:flex; flex-direction:column; align-items:center; margin: 25px 0; background: var(--surface-color); padding: 25px 15px; border-radius: 12px; border: 1px solid var(--border-color); box-shadow: var(--shadow-sm);"><div class="gt-macro-ink" style="font-weight:900; font-size:14px; margin-bottom:15px; color:var(--text-primary); letter-spacing: 1px;">📊 스탯 분석 차트</div><svg width="100%" height="100%" viewBox="0 0 ${size} ${size}" style="max-width: 320px; overflow:visible; font-family:inherit;">${bgPolygons}<polygon class="gt-macro-accent" points="${polygonPoints.trim()}" fill="var(--primary-color)" fill-opacity="0.3" stroke="var(--primary-color)" stroke-width="2" stroke-linejoin="round"/>${pointsHtml}${labelHtml}</svg></div>`;
  } catch(e) { return `<div style="color:#e53e3e; font-size:12px;">[레이더 차트 오류]</div>`; }
};

export const createRadarCompareHtml = (dataStr) => {
  return `<div class="galpi-ext-placeholder gt-macro-box gt-macro-accent" style="padding:15px; background:var(--surface-color); border:1px solid var(--primary-color); border-radius:8px; color:var(--primary-color); font-weight:bold; font-size:13px; text-align:center; margin:15px 0;">📊 다중 스탯 비교 위젯은 React Viewer 전용 모드에서 렌더링됩니다.</div>`;
};

export const createAlignmentChartHtml = (dataStr) => {
  try {
    const pairs = dataStr.split(',').map(s => s.trim().split('='));
    let xLabel = "가로축", yLabel = "세로축", xVal = 50, yVal = 50;
    if (pairs[0] && pairs[0].length === 2) { xLabel = pairs[0][0].trim(); xVal = parseRankValue(pairs[0][1]); }
    if (pairs[1] && pairs[1].length === 2) { yLabel = pairs[1][0].trim(); yVal = parseRankValue(pairs[1][1]); }
    
    const size = 260; const center = size / 2;
    const px = (xVal / 100) * size; const py = size - ((yVal / 100) * size);
    
    return `<div class="galpi-ext-alignment gt-macro-box" style="display:flex; flex-direction:column; align-items:center; margin: 25px 0; background: var(--surface-color); padding: 25px 15px; border-radius: 12px; border: 1px solid var(--border-color); box-shadow: var(--shadow-sm);"><div class="gt-macro-ink" style="font-weight:900; font-size:14px; margin-bottom:15px; color:var(--text-primary); letter-spacing: 1px;">🧭 2D 성향 매트릭스</div><svg width="100%" height="100%" viewBox="-30 -30 ${size+60} ${size+60}" style="max-width:300px; overflow:visible; font-family:inherit;"><rect class="gt-macro-box gt-macro-line" x="0" y="0" width="${size}" height="${size}" fill="var(--bg-color)" stroke="var(--border-color)" stroke-width="1"/><line class="gt-macro-line" x1="${center}" y1="0" x2="${center}" y2="${size}" stroke="var(--text-secondary)" stroke-width="2" stroke-dasharray="4,4"/><line class="gt-macro-line" x1="0" y1="${center}" x2="${size}" y2="${center}" stroke="var(--text-secondary)" stroke-width="2" stroke-dasharray="4,4"/><circle class="gt-macro-accent-dot" cx="${px}" cy="${py}" r="6" fill="var(--primary-color)" stroke="#fff" stroke-width="2"/><text class="gt-macro-ink" x="${center}" y="-10" fill="var(--text-primary)" font-size="12" font-weight="bold" text-anchor="middle">${yLabel}</text><text class="gt-macro-ink" x="${size+10}" y="${center+4}" fill="var(--text-primary)" font-size="12" font-weight="bold" text-anchor="start">${xLabel}</text><text class="gt-macro-accent" x="${px}" y="${py - 12}" fill="var(--primary-color)" font-size="12" font-weight="900" text-anchor="middle">현재 위치</text></svg></div>`;
  } catch(e) { return `<div style="color:#e53e3e; font-size:12px;">[성향 매트릭스 렌더링 오류]</div>`; }
};

export const createBarGraphHtml = (dataStr) => {
  try {
    const pairs = dataStr.split(',').map(s => s.trim().split('='));
    let html = `<div class="galpi-ext-bar-wrap gt-macro-box" style="display:flex; flex-direction:column; gap:10px; padding:15px; background:var(--surface-color); border:1px solid var(--border-color); border-radius:12px; margin:15px 0;">`;
    pairs.forEach(p => {
      if (p.length === 2) {
        const label = p[0].trim(); const valStr = p[1].trim(); const valParts = valStr.split('/');
        const current = parseRankValue(valParts[0]); const max = valParts.length > 1 ? parseRankValue(valParts[1]) : 100;
        const percent = max > 0 ? Math.min(100, Math.max(0, (current / max) * 100)) : 0;
        let barColor = "var(--primary-color)"; let barClass = "gt-macro-accent-bg";
        if (percent <= 30) { barColor = "#e53e3e"; barClass = ""; } else if (percent >= 80) { barColor = "#10b981"; barClass = ""; }
        html += `<div style="display:flex; align-items:center; gap:15px;"><div class="gt-macro-ink" style="width:80px; font-weight:900; font-size:13px; color:var(--text-primary); text-align:right;">${label}</div><div class="gt-macro-track" style="flex:1; height:14px; background:var(--table-bg-alt); border-radius:8px; overflow:hidden;"><div class="${barClass}" style="width: ${percent}%; height:100%; background: ${barColor}; border-radius:8px;"></div></div><div class="gt-macro-ink-soft" style="width:65px; font-size:12px; font-weight:bold; color:var(--text-secondary);">${valStr}</div></div>`;
      }
    });
    return html + `</div>`;
  } catch(e) { return `<div style="color:#e53e3e; font-size:12px;">[게이지 렌더링 오류]</div>`; }
};

export const createChatHtml = (type, name, expr, msg) => {
  const isRight = type === '우대화';
  const alignClass = isRight ? 'flex-end' : 'flex-start';
  const bgColor = isRight ? 'var(--primary-color)' : 'var(--surface-color)';
  const color = isRight ? '#ffffff' : 'var(--text-primary)';
  const workTitle = typeof window !== 'undefined' && window.currentWorkData?.title ? window.currentWorkData.title : '작품명';
  
  const safeWorkTitle = sanitizeFilenameTitle(workTitle);
  const safeName = sanitizeFilenameTitle(name.trim());
  const safeExpr = expr ? sanitizeFilenameTitle(expr.trim()) : '';
  const imgName = expr ? `${safeWorkTitle}_${safeName}_${safeExpr}.png` : `${safeWorkTitle}_${safeName}.png`;
  const avatarHtml = `<div style="width:42px; height:42px; border-radius:50%; background-color:var(--table-bg-alt); background-image:url('/img/character/${imgName}'); background-size:cover; background-position:center; border:2px solid var(--border-color); flex-shrink:0; box-shadow:0 2px 5px rgba(0,0,0,0.1);"></div>`;

  const bubbleClass = isRight ? 'gt-macro-accent-bg' : 'gt-macro-box';
  return `<div class="galpi-ext-chat-room" style="display:flex; gap:12px; align-items:flex-start; margin:15px 0; flex-direction:${isRight ? 'row-reverse' : 'row'};">
    ${avatarHtml}
    <div style="display:flex; flex-direction:column; align-items:${alignClass}; max-width:80%;">
      <div class="gt-macro-ink-soft" style="font-size:12px; font-weight:900; color:var(--text-secondary); margin-bottom:4px;">${name.trim()}${expr ? ` <span style="font-weight:normal; opacity:0.7;">(${expr.trim()})</span>` : ''}</div>
      <div class="${bubbleClass}" style="background:${bgColor}; color:${color}; padding:10px 14px; border-radius:12px; border:1px solid var(--border-color); font-size:14px; line-height:1.6; word-break:break-all;">${msg.trim().replace(/\n/g, '<br>')}</div>
    </div>
  </div>`;
};

export const createSpoilerHtml = (content) => {
  return `<span class="galpi-spoiler" style="background:#111111; color:#111111; cursor:pointer; padding:2px 6px; border-radius:4px; font-weight:bold; transition:color 0.3s ease;" onmouseover="this.style.color='#ffffff'" onmouseout="this.style.color='#111111'" title="마우스를 올려 스포일러 확인">${content}</span>`;
};

export const createTabHtml = (innerText) => {
  return `<div class="galpi-ext-placeholder gt-macro-box gt-macro-accent" style="padding:15px; background:var(--surface-color); border:1px solid var(--primary-color); border-radius:8px; color:var(--primary-color); font-weight:bold; font-size:13px; text-align:center; margin:15px 0;">📑 인라인 탭 컨테이너는 React Viewer 전용 모드에서 렌더링됩니다.</div>`;
};

export const createTimelineHtml = (innerText) => {
  let lines = innerText.trim().split('\n');
  let html = `<div class="galpi-timeline gt-macro-accent" style="border-left: 3px solid var(--primary-color); margin-left: 10px; padding-left: 15px; display: flex; flex-direction: column; gap: 15px; margin-top: 20px; margin-bottom: 20px;">\n`;
  let validCount = 0;
  lines.forEach(line => {
    let parts = line.split('::::');
    if (parts.length >= 1) {
      let dateVal = (parts[0] || "").trim();
      let titleVal = (parts[1] || "").trim();
      let descVal = (parts[2] || "").trim().replace(/<br>/g, '<br/>');
      if (dateVal || titleVal || descVal) {
        validCount++;
        html += `  <div class="tl-item" style="position: relative;">\n`;
        html += `    <div class="tl-dot gt-macro-accent-bg" style="position: absolute; left: -22px; top: 2px; width: 11px; height: 11px; border-radius: 50%; background: var(--primary-color); border: 2px solid var(--bg-color); box-sizing: content-box;"></div>\n`;
        if (dateVal) html += `    <div class="tl-date gt-macro-accent" style="font-weight: 900; color: var(--primary-color); font-size: 13px;">${dateVal}</div>\n`;
        if (titleVal) html += `    <div class="tl-title gt-macro-ink" style="font-weight: bold; font-size: 16px; margin-top: 2px; color: var(--text-primary);">${titleVal}</div>\n`;
        if (descVal) html += `    <div class="tl-desc gt-macro-ink-soft" style="font-size: 14px; color: var(--text-secondary); margin-top: 6px; line-height: 1.6;">${descVal}</div>\n`;
        html += `  </div>\n`;
      }
    }
  });
  html += `</div>\n`;
  return validCount > 0 ? html : "";
};

export const createLogTabHtml = (activeTab, innerText) => {
  const tabs = [
    { name: '내용', color: '#495057', bg: '#f8f9fa', border: '#ced4da' },
    { name: '파랑', color: '#1864ab', bg: '#e7f5ff', border: '#74c0fc' },
    { name: '초록', color: '#2b8a3e', bg: '#ebfbee', border: '#63e6be' },
    { name: '노랑', color: '#e67700', bg: '#fff9db', border: '#fcc419' },
    { name: '빨강', color: '#c92a2a', bg: '#fff5f5', border: '#ffa8a8' },
    { name: '사전', color: '#862e9c', bg: '#f8f0fc', border: '#eebefa' },
    { name: '설정', color: '#087f5b', bg: '#e6fcf5', border: '#63e6be' },
    { name: '기록', color: '#d9480f', bg: '#fff0f6', border: '#ffc078' }
  ];

  const active = tabs.find(t => t.name === activeTab) || tabs[0];

  let tabsHtml = `<div style="display:flex; border-bottom: 2px solid ${active.border}; margin-bottom: 0; overflow-x: auto; white-space: nowrap; scrollbar-width: none;">`;
  tabs.forEach(t => {
    const isActive = t.name === activeTab;
    const chromeClass = isActive ? 'gt-macro-ink' : 'gt-macro-box gt-macro-ink-soft';
    tabsHtml += `
      <div class="${chromeClass}" style="padding: 6px 14px; font-size: 13px; font-weight: 900; cursor: default;
        border: 1px solid ${isActive ? active.border : 'var(--border-color)'};
        border-bottom: none; border-radius: 6px 6px 0 0;
        background: ${isActive ? active.bg : 'var(--surface-color)'};
        color: ${isActive ? active.color : 'var(--text-secondary)'};
        margin-right: 4px; position: relative; top: 2px;
        ${isActive ? 'z-index: 2;' : 'z-index: 1;'}">
        ${t.name}
      </div>
    `;
  });
  tabsHtml += `</div>`;

  const contentFormatted = innerText.trim().replace(/\n/g, '<br>');
  let contentHtml = `<div class="gt-macro-ink" style="border: 2px solid ${active.border}; border-top: none; background: ${active.bg}20; padding: 20px; border-radius: 0 0 8px 8px; font-size: 14px; line-height: 1.7; color: var(--text-primary); margin-bottom: 25px; box-shadow: var(--shadow-sm);">${contentFormatted}</div>`;

  return `<div class="galpi-log-tab-wrapper" style="margin: 25px 0;">${tabsHtml}${contentHtml}</div>`;
};

export const createRelationGraphHtml = (innerText) => {
  let graphData = { nodes: [], edges: [] };
  try {
    let cleanJson = innerText.replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').trim();
    graphData = JSON.parse(cleanJson);
  } catch(e) {
    return `<div style="color:#e53e3e; padding:10px; font-weight:bold; background:rgba(229,62,62,0.1); border:1px solid #e53e3e; border-radius:8px;">⚠️ 관계도 데이터가 손상되었습니다. 코드를 확인하십시오.</div>`;
  }

  let width = graphData.width || 800;
  let height = graphData.height || 450;
  
  let html = `<div class="galpi-ext-relation gt-macro-box" style="margin:20px 0; background:var(--bg-color); border:1px solid var(--border-color); border-radius:12px; box-shadow:0 4px 15px rgba(0,0,0,0.03); overflow:hidden; display:flex; flex-direction:column;">`;
  html += '<div class="gt-macro-subheader gt-macro-accent" style="padding:12px 20px; background:var(--surface-color); border-bottom:1px solid var(--border-color); font-weight:900; color:var(--primary-color); font-size:15px;">📊 인물 관계도</div>';
  html += `<div style="width:100%; overflow-x:auto; overflow-y:hidden; padding:20px 0;"><svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" style="min-width:${width}px; display:block; margin:0 auto; user-select:none; overflow:visible; font-family:inherit;">`;

  html += '<defs>';
  html += '<marker id="diag-arr-normal" markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto-start-reverse"><path class="gt-macro-ink-soft" d="M 0 0 L 10 5 L 0 10 z" fill="var(--text-secondary)"/></marker>';
  html += '<marker id="diag-arr-active" markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto-start-reverse"><path class="gt-macro-accent" d="M 0 0 L 10 5 L 0 10 z" fill="var(--primary-color)"/></marker>';
  html += '<filter id="diag-shadow"><feDropShadow dx="0" dy="2" stdDeviation="3" flood-opacity="0.1"/></filter>';
  html += '</defs>';

  graphData.edges.forEach(e => {
    let n1 = graphData.nodes.find(n => n.id === e.source);
    let n2 = graphData.nodes.find(n => n.id === e.target);
    if (!n1 || !n2) return;

    let dx = n2.x - n1.x; let dy = n2.y - n1.y;
    let dist = Math.sqrt(dx*dx + dy*dy);
    if (dist === 0) return;

    let r1 = n1.shape === 'rect' ? 45 : 42;
    let r2 = n2.shape === 'rect' ? 45 : 42;

    let x1 = n1.x + (dx * r1 / dist); let y1 = n1.y + (dy * r1 / dist);
    let x2 = n2.x - (dx * r2 / dist); let y2 = n2.y - (dy * r2 / dist);

    let strokeCol = e.type === '<->' ? 'var(--primary-color)' : 'var(--text-secondary)';
    let lineClass = e.type === '<->' ? 'gt-macro-accent' : 'gt-macro-ink-soft';
    let lineStrokeClass = e.type === '<->' ? 'gt-macro-accent-stroke' : 'gt-macro-inksoft-stroke';
    let strokeW = e.type === '<->' ? '2.5' : '1.5';
    let isDashed = e.type === '--' ? 'stroke-dasharray="5,5"' : '';
    let mEndNorm = 'url(#diag-arr-normal)';

    html += `<g class="rel-edge-grp">`;

    const drawLabel = (txt, px1, py1, px2, py2) => {
      if (!txt) return;
      let textW = txt.length * 11 + 14;
      let cx = (px1 + px2) / 2; let cy = (py1 + py2) / 2;
      let angle = Math.atan2(py2 - py1, px2 - px1) * (180 / Math.PI);
      if (angle > 90 || angle < -90) angle += 180;

      html += `<g transform="rotate(${angle}, ${cx}, ${cy})">`;
      html += `<rect class="gt-macro-box ${lineStrokeClass}" x="${cx - (textW/2)}" y="${cy - 11}" width="${textW}" height="22" fill="var(--bg-color)" rx="4" ry="4" stroke="${strokeCol}" stroke-width="1"/>`;
      html += `<text class="${lineClass}" x="${cx}" y="${cy + 4}" fill="${strokeCol}" font-size="11" font-weight="900" text-anchor="middle">${txt}</text>`;
      html += `</g>`;
    };

    if (e.type === '<->') {
      let gap = 12;
      let nx = -dy / dist; let ny = dx / dist;
      let l1x1 = x1 + nx * gap; let l1y1 = y1 + ny * gap;
      let l1x2 = x2 + nx * gap; let l1y2 = y2 + ny * gap;
      let l2x1 = x2 - nx * gap; let l2y1 = y2 - ny * gap;
      let l2x2 = x1 - nx * gap; let l2y2 = y1 - ny * gap;

      html += `<line class="${lineClass}" x1="${l1x1}" y1="${l1y1}" x2="${l1x2}" y2="${l1y2}" stroke="${strokeCol}" stroke-width="${strokeW}" marker-end="url(#diag-arr-active)" opacity="0.85"/>`;
      html += `<line class="${lineClass}" x1="${l2x1}" y1="${l2y1}" x2="${l2x2}" y2="${l2y2}" stroke="${strokeCol}" stroke-width="${strokeW}" marker-end="url(#diag-arr-active)" opacity="0.85"/>`;
      drawLabel(e.desc, l1x1, l1y1, l1x2, l1y2);
      drawLabel(e.descRev, l2x1, l2y1, l2x2, l2y2);
    } else {
      let mEnd = e.type === '->' ? mEndNorm : '';
      html += `<line class="${lineClass}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${strokeCol}" stroke-width="${strokeW}" ${isDashed} marker-end="${mEnd}" opacity="0.85"/>`;
      drawLabel(e.desc, x1, y1, x2, y2);
    }
    html += `</g>`;
  });

  graphData.nodes.forEach(n => {
    let label = n.label || "미지정";
    let dispLabel = label.length > 6 ? label.substring(0, 5) + '..' : label;
    html += `<g transform="translate(${n.x}, ${n.y})">`;
    if (n.shape === 'rect') {
        html += `<rect class="gt-macro-box gt-macro-inksoft-stroke" x="-45" y="-22" width="90" height="44" fill="var(--surface-color)" stroke="var(--text-secondary)" stroke-width="2" rx="6" ry="6" filter="url(#diag-shadow)"/>`;
    } else {
        html += `<circle class="gt-macro-box gt-macro-accent-stroke" cx="0" cy="0" r="42" fill="var(--surface-color)" stroke="var(--primary-color)" stroke-width="2" filter="url(#diag-shadow)"/>`;
    }
    html += `<text class="gt-macro-ink" x="0" y="5" fill="var(--text-primary)" font-size="13" font-weight="900" text-anchor="middle">${dispLabel}</text>`;
    html += `</g>`;
  });

  html += '</svg></div></div>';
  return html.replace(/\n\s*/g, '');
};