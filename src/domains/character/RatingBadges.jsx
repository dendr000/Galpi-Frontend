// Copyright (c) dendr000. MIT License.
// 캐릭터의 등급을 "R 3" 같은 작은 칩으로 보여 준다. 등급 색은 점에만 쓰고 글자색은 부모를 따른다
// (장르 테마마다 글자색이 달라서, 칩 글자까지 색을 정하면 어두운 테마에서 안 읽힌다).
import React from 'react';
import { ratingColor } from './ratings';

const chipStyle = {
  display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '1px 7px', borderRadius: '10px',
  border: '1px solid var(--border-color)', fontSize: '11px', fontWeight: 700, lineHeight: 1.6, color: 'inherit', whiteSpace: 'nowrap',
};

const RatingBadges = ({ ratings, style }) => {
  if (!ratings || ratings.length === 0) return null;
  return (
    <div className="gt-rating-badges" style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', ...style }}>
      {ratings.map((r) => (
        <span key={r.key} title={r.title} aria-label={r.title} style={chipStyle}>
          <span data-rating-dot style={{ width: '7px', height: '7px', borderRadius: '50%', background: ratingColor(r.level), flexShrink: 0 }} />
          {`${r.abbr} ${r.level}`}
        </span>
      ))}
    </div>
  );
};

export default RatingBadges;
