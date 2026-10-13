// 파일 위치: src/pages/Home/hooks/useHeroSlider.js
// 커버 이미지가 있는 작품을 무작위 순서로 늘어놓고, 한쪽(오른쪽) 방향으로만 계속 넘어가는 타이머를 통제합니다.
//
// 되감기 없이 이어지게 하는 방법: 트랙 끝에 첫 슬라이드의 복제본을 하나 더 붙인다. 마지막 슬라이드에서 한 칸 더
// 넘어가면 복제본(=첫 슬라이드와 똑같은 화면)이 보이고, 그 전환이 끝나면 전환 효과를 끈 채로 진짜 첫 슬라이드
// 위치로 순간 이동한다. 같은 화면이라 눈에는 계속 오른쪽으로 흐르는 것으로만 보인다.
import { useState, useEffect, useMemo } from 'react';
import { pickCoverWorks, shuffle } from '../heroSlides';

export const SLIDE_INTERVAL_MS = 5000;
export const SLIDE_TRANSITION_MS = 600;
const RESET_GAP_MS = 50;

export const useHeroSlider = (works) => {
  // works가 바뀔 때(페이지를 열 때)만 다시 섞는다. 슬라이드 도중에는 순서가 바뀌지 않는다.
  const slideWorks = useMemo(() => shuffle(pickCoverWorks(works)), [works]);
  const count = slideWorks.length;

  const [position, setPosition] = useState(0);
  const [animate, setAnimate] = useState(true);

  useEffect(() => {
    if (count < 2) return undefined;
    const timer = setInterval(() => setPosition((p) => p + 1), SLIDE_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [count]);

  // 복제본(position === count)에 도착해 전환이 끝나면 전환 없이 처음으로 순간 이동한다.
  useEffect(() => {
    if (count < 2 || position !== count) return undefined;
    const timer = setTimeout(() => {
      setAnimate(false);
      setPosition(0);
    }, SLIDE_TRANSITION_MS);
    return () => clearTimeout(timer);
  }, [position, count]);

  // 순간 이동이 끝난 직후 전환 효과를 다시 켠다(다음 슬라이드부터 부드럽게 넘어가도록).
  useEffect(() => {
    if (animate) return undefined;
    const timer = setTimeout(() => setAnimate(true), RESET_GAP_MS);
    return () => clearTimeout(timer);
  }, [animate]);

  const trackSlides = count > 1 ? [...slideWorks, slideWorks[0]] : slideWorks;
  return { slideWorks, trackSlides, position: Math.max(0, Math.min(position, trackSlides.length - 1)), animate };
};
