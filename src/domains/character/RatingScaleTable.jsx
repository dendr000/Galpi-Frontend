// Copyright (c) dendr000. MIT License.
// 작품 페이지에 보여 주는 등급 기준표: 판정 축(약칭, 속성)과 등급 기준(등급, 명칭, 기준).
import React from 'react';

const cell = { padding: '8px 10px', borderBottom: '1px solid var(--border-color)', textAlign: 'left' };

const Table = ({ title, heads, rows }) => (
  <div style={{ marginBottom: '16px' }}>
    <h3 style={{ margin: '0 0 8px 0', fontSize: '15px', fontWeight: 800 }}>{title}</h3>
    <table className="gt-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
      <thead>
        <tr>{heads.map((h) => <th key={h} style={{ ...cell, background: 'var(--table-bg-alt)', fontWeight: 700 }}>{h}</th>)}</tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={i}>{r.map((v, j) => <td key={j} style={cell}>{v}</td>)}</tr>
        ))}
      </tbody>
    </table>
  </div>
);

const RatingScaleTable = ({ axes, scale, styles }) => {
  const hasAxes = Array.isArray(axes) && axes.length > 0;
  const hasScale = Array.isArray(scale) && scale.length > 0;
  if (!hasAxes && !hasScale) return null;
  return (
    <section id="sec-ratings" className={styles.wikiSection}>
      <div className={`${styles.sectionHeader} gt-section-header`}>
        <h2 id="sec-rating-scale" className={`${styles.sectionHeaderTitle} gt-section-title auto-toc-target`}>등급 기준표</h2>
      </div>
      {hasAxes && <Table title="판정 축" heads={['약칭', '속성']} rows={axes.map((a) => [a.abbr, a.key])} />}
      {hasScale && <Table title="등급 기준" heads={['등급', '명칭', '기준']} rows={scale.map((s) => [String(s.level), s.name, s.desc])} />}
    </section>
  );
};

export default RatingScaleTable;
