// Copyright (c) dendr000. MIT License.
// 이모지 대신 쓰는 SVG 아이콘. 예: <Icon name="trash" />. 색은 주변 글자색, 크기는 글자 크기(1em)를 따르고 size(px)로 바꿀 수 있다.
import React from 'react';
import { getIconSvg } from './iconRegistry';

const Icon = ({ name, size, className = '', title, style, lead = false }) => {
  const svg = getIconSvg(name);
  if (!svg) return null;
  const box = size ? { width: `${size}px`, height: `${size}px` } : {};
  return (
    <span
      className={`gi gi-${name}${lead ? ' gi-lead' : ''}${className ? ` ${className}` : ''}`}
      style={{ ...box, ...style }}
      title={title}
      aria-hidden={title ? undefined : 'true'}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
};

export default Icon;
