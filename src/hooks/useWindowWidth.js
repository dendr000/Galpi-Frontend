// Copyright (c) dendr000. MIT License.
// 현재 창 폭(px)을 돌려주고, 창 크기가 바뀌면 갱신한다.
import { useState, useEffect } from 'react';

export const useWindowWidth = () => {
  const [width, setWidth] = useState(() => window.innerWidth);
  useEffect(() => {
    const onResize = () => setWidth(window.innerWidth);
    window.addEventListener('resize', onResize);
    onResize();
    return () => window.removeEventListener('resize', onResize);
  }, []);
  return width;
};
