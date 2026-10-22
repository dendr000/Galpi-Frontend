// Copyright (c) dendr000. MIT License.
// 기밀 캐릭터에 붙이는 "기밀" 도장. 장르 테마에 따라 배경이 바뀌어도 읽히도록 글자색과 바탕색을 고정한다.
import React from 'react';

const stampStyle = {
  display: 'inline-block', padding: '1px 8px', border: '2px solid #c92a2a', borderRadius: '3px',
  color: '#c92a2a', background: 'rgba(255,255,255,0.92)', fontSize: '11px', fontWeight: 900,
  letterSpacing: '0.18em', lineHeight: 1.5, transform: 'rotate(-6deg)', pointerEvents: 'none', userSelect: 'none',
};

const ClassifiedStamp = ({ style }) => (
  <span className="gt-classified-stamp" style={{ ...stampStyle, ...style }}>기밀</span>
);

export default ClassifiedStamp;
