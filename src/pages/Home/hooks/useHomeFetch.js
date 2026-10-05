// 파일 위치: src/pages/Home/hooks/useHomeFetch.js
// 기능 요약: 백엔드 API로부터 작품 및 캐릭터 원장을 호출하고, 마크다운 메타데이터 파싱 및 숨김(검열) 카테고리 필터링을 전담합니다.
import { useState, useEffect } from 'react';
import api from '../../../api/axiosCore';
import { extractMeta } from '../../../utils/markdownParser';
import { filterHiddenWorks } from '../utils/filterHiddenWorks';

export const useHomeFetch = () => {
  const [works, setWorks] = useState([]);
  const [characters, setCharacters] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAllData = async () => {
      console.log("[useHomeFetch] 메인 대시보드 데이터 통신 개시");
      setIsLoading(true);
      try {
        // 숨김 분류는 DB(/api/hidden-categories)가 원본이다 — 분류 화면의 숨기기 버튼이 거기에만
        // 쓰는데, 예전엔 여기서 아무도 안 쓰는 localStorage만 읽어서 숨긴 분류가 홈에 그대로 보였다.
        // 이 요청만 실패해도 홈 목록은 떠야 하니 빈 목록으로 대체한다.
        const [worksRes, charsRes, hiddenRes] = await Promise.all([
          api.get('/api/works'),
          api.get('/api/characters'),
          api.get('/api/hidden-categories').catch(() => ({ data: [] }))
        ]);

        const rawWorks = worksRes.data;
        const charsData = charsRes.data;

        console.log(`[useHomeFetch] 서버 통신 완료 - 작품 수: ${rawWorks.length}, 캐릭터 수: ${charsData.length}`);

        const hiddenCats = Array.isArray(hiddenRes.data) ? hiddenRes.data : [];

        const withMeta = rawWorks.map(w => {
          const parsed = extractMeta(w.description);
          return { ...w, metaInfo: parsed };
        });
        const processedWorks = filterHiddenWorks(withMeta, hiddenCats);
        console.log(`[useHomeFetch] 🛑 검열 엔진: 숨김 태그 포함 작품 ${withMeta.length - processedWorks.length}개 차단됨`);

        setWorks(processedWorks);
        setCharacters(charsData);
      } catch (error) {
        console.error("[useHomeFetch] 데이터 통신 에러 발생:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAllData();
  }, []);

  return { works, setWorks, characters, isLoading };
};