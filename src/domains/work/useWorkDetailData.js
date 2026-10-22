// 파일 위치: src/domains/work/useWorkDetailData.js
// 기능 요약: 작품 상세 페이지의 모든 전역/로컬 상태 관리, 백엔드 API 연동, 마크다운 목차 자동 트래킹 및 스크롤 복원 세션을 총괄하는 커스텀 훅
// 버전: v1.0.0

import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../api/axiosCore';
import { extractMeta } from '../../utils/markdownParser';

export const useWorkDetailData = () => {
  const { workId } = useParams();
  const [searchParams] = useSearchParams();
  const pageId = searchParams.get('pageId');
  const charIdParam = searchParams.get('charId'); // 소속 인물 목록에서 넘어올 때 선택할 캐릭터 번호
  const navigate = useNavigate();

  console.log(`[useWorkDetailData] 데이터 상태 추적 코어 훅 가동 개시. 작품 ID: ${workId}, 현재 페이지 ID: ${pageId}`);

  // 원격 데이터 상태 원장
  const [work, setWork] = useState(null);
  const [characters, setCharacters] = useState([]);
  const [wikiPages, setWikiPages] = useState([]);
  const [loading, setLoading] = useState(true);

  // 상단 커버 배너 전용 상태
  const [coverY, setCoverY] = useState(50);
  const [isCoverEdit, setIsCoverEdit] = useState(false);
  const [isCoverDragging, setIsCoverDragging] = useState(false);

  // 등장인물 필터링 및 활성화 세션 상태
  const [groupCriteria, setGroupCriteria] = useState(() => localStorage.getItem(`galpi-char-group-${workId}`) || '관계');
  const [activeCharId, setActiveCharId] = useState(null);
  
  // 마크다운 DOM 트리거 수집 상태
  const [charSectionNum, setCharSectionNum] = useState(3);
  const [tocList, setTocList] = useState([]);

  // 캐릭터 썸네일 제어 및 배리언트 상태
  const [cardVariants, setCardVariants] = useState(() => JSON.parse(localStorage.getItem(`galpi-variants-${workId}`) || "{}"));
  const [formSwaps, setFormSwaps] = useState(() => JSON.parse(localStorage.getItem(`galpi-swaps-${workId}`) || "{}"));
  const [isBatchImgModalOpen, setIsBatchImgModalOpen] = useState(false);
  const [batchImgY, setBatchImgY] = useState(50);
  const [batchImgX, setBatchImgX] = useState(50);

  // 분류 기준 로컬 스토리지 동기화 세션
  useEffect(() => {
    console.log(`[useWorkDetailData] 캐릭터 분류 기준 변경 동기화 감지 ➔ 저장값: ${groupCriteria}`);
    localStorage.setItem(`galpi-char-group-${workId}`, groupCriteria);
  }, [groupCriteria, workId]);

  useEffect(() => { localStorage.setItem(`galpi-variants-${workId}`, JSON.stringify(cardVariants)); }, [cardVariants, workId]);
  useEffect(() => { localStorage.setItem(`galpi-swaps-${workId}`, JSON.stringify(formSwaps)); }, [formSwaps, workId]);

  // REST API 데이터베이스 병렬 패치 엔진
  useEffect(() => {
    const fetchData = async () => {
      console.log("[useWorkDetailData] 데이터베이스 비동기 병렬 요청 쿼리 락 가동");
      try {
        const [wRes, cRes, pRes] = await Promise.all([
          api.get(`/api/works/${workId}`),
          api.get(`/api/characters?workId=${workId}`),
          api.get(`/api/wikipages/work/${workId}`).catch(() => {
            console.warn("[useWorkDetailData] 위키 노드가 존재하지 않거나 리소스를 찾을 수 없습니다. 빈 구조로 대체 선언합니다.");
            return { data: [] };
          })
        ]);
        
        setWork(wRes.data);
        const parsed = extractMeta(wRes.data.description);
        if (parsed.meta.coverY !== undefined) {
          setCoverY(parsed.meta.coverY);
        }

        const validChars = cRes.data.filter(c => !c.name?.includes('[시스템_프리셋_')).map(c => {
          let dp = {}; 
          try { 
            if(c.dynamicProperties) dp = JSON.parse(c.dynamicProperties);
            else if(c._rawDynamic) dp = JSON.parse(c._rawDynamic); 
          } catch(e) {
            console.error(`[useWorkDetailData] 캐릭터 ID ${c.id} 동적 속성 복구 실패. 파싱 오류를 우회합니다.`);
          }
          return { ...c, ...dp, id: c.id };
        });
        
        setCharacters(validChars);
        setWikiPages(pRes.data);
        
        // ★ 이 키가 작품별로 나뉘어 있지 않고 전역이었어서, 다른(주로 더 긴) 작품에서
        // 저장된 스크롤 좌표가 지금 작품(주로 더 짧음)에 그대로 적용돼 브라우저가 그 좌표를
        // 알아서 페이지 최대 스크롤 높이로 clamp해버리는 바람에 "저장하고 돌아오면 항상
        // 캐릭터 그리드 맨 아래로 가버린다"는 증상으로 나타났다. 작품 ID로 스코프를 나눠서 고침.
        const savedY = sessionStorage.getItem(`galpi-note-scroll-y-${workId}`);
        if (savedY) {
          console.log(`[useWorkDetailData] 이전 스크롤 세션 좌표 감지 완료. 포지션 이동 집행: ${savedY}px`);
          setTimeout(() => window.scrollTo({ top: parseInt(savedY, 10), behavior: 'smooth' }), 300);
        }

      } catch (err) {
        console.error("[useWorkDetailData] 원격 통신 파이프라인에서 치명적 크래시 감지됨. 세션을 홈으로 물리 락 전환합니다.", err);
        navigate('/');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [workId, pageId, navigate]);

  // 실시간 DOM 마크다운 제목 스캐너 세션 (목차 인덱스 추출 파트)
  useEffect(() => {
    if (loading || !work) return;
    setTimeout(() => {
      console.log("[useWorkDetailData] 마크다운 뷰어 내 돔 엘리먼트 타겟 스캐닝 작동");
      let lastH1Num = 2;
      const mdH1s = document.querySelectorAll('.markdown-body h1');
      mdH1s.forEach(h => {
        const match = h.innerText.match(/^(\d+)\./);
        if (match) {
          const num = parseInt(match[1], 10);
          if (num > lastH1Num) lastH1Num = num;
        }
      });
      
      if (charSectionNum !== lastH1Num + 1) {
        setCharSectionNum(lastH1Num + 1);
        return; 
      }

      const headings = document.querySelectorAll('.auto-toc-target, .markdown-body h1, .markdown-body h2, .markdown-body h3');
      const tempToc = [];
      headings.forEach((h, index) => {
        if (!h.id) h.id = `galpi-auto-toc-${index}`;
        let lvl = 2;
        if (h.tagName.toLowerCase() === 'h1' || h.classList.contains('auto-toc-target')) lvl = 1;
        if (h.tagName.toLowerCase() === 'h3') lvl = 3;
        
        tempToc.push({ 
          id: `toc-item-${index}`, 
          targetId: h.id,
          text: h.innerText.replace(/✏️|➕/g, '').trim(), 
          level: lvl 
        });
      });
      setTocList(tempToc);
      console.log(`[useWorkDetailData] 목차 갱신 스캔 완료. 총 수집 개수: ${tempToc.length}`);
    }, 150); 
  }, [loading, work, pageId, activeCharId, charSectionNum]);

  // 실시간 스크롤 트래킹 백업 레이어
  useEffect(() => {
    const trackScroll = () => {
      if (window.scrollY > 0) sessionStorage.setItem(`galpi-note-scroll-y-${workId}`, window.scrollY);
    };
    window.addEventListener('scroll', trackScroll);
    return () => window.removeEventListener('scroll', trackScroll);
  }, [workId]);

  return {
    workId,
    pageId,
    charIdParam,
    navigate,
    work,
    setWork,
    characters,
    setCharacters,
    wikiPages,
    setWikiPages,
    loading,
    coverY,
    setCoverY,
    isCoverEdit,
    setIsCoverEdit,
    isCoverDragging,
    setIsCoverDragging,
    groupCriteria,
    setGroupCriteria,
    activeCharId,
    setActiveCharId,
    charSectionNum,
    tocList,
    cardVariants,
    setCardVariants,
    formSwaps,
    setFormSwaps,
    isBatchImgModalOpen,
    setIsBatchImgModalOpen,
    batchImgY,
    setBatchImgY,
    batchImgX,
    setBatchImgX
  };
};