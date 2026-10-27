// 파일 위치: src/pages/BulkStudio/useBulkStudioData.js
// 기능 요약: 캐릭터 일괄 스튜디오 전역 상태 관리 및 시스템 예약어 필터링 강화

import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../../api/axiosCore';
import { sanitizeFilenameTitle } from '../../utils/filenameSanitizer';
import { getNextSortOrderBase } from './sortOrder';

const DEFAULT_COLS = ["부제목", "나이", "성별", "종족", "관계"];

// ★ 물리적으로 화면에 입력칸으로 노출되면 안 되는 시스템 내부 예약어(블랙리스트) 명단 정의
const SYSTEM_PROPS = ["작품명", "제작자", "age", "gender", "species", "sortOrder", "themeColor", "cardImgX", "cardImgY", "cardImgScale", "pageBody"];

// 자유 텍스트 대신 정해진 값 중에서만 고르는 속성들 — BulkTableRow가 이 목록에 있는 컬럼은
// <input> 대신 <select>로 그린다. fallback은 붙여넣기로 들어온 값이 옵션에 없을 때 쓴다.
export const ENUM_COLUMNS = {
  '관계': { options: ['일반', '친구', '연인'], fallback: '일반' },
  '성별': { options: ['남성', '여성', '없음'], fallback: '없음' },
};

// "성격" 속성 표기 통일: 에니어그램 날개(1W2, 4W5 등)는 W를 소문자로, MBTI(entp 등)는 전체를 대문자로.
// 직접 입력(handleCellChange)뿐 아니라 붙여넣기로 추가(importRowsFromText/importRowsFromGrid)도
// 이 함수를 거치도록 해서, 어느 경로로 값이 들어오든 같은 규칙이 적용되게 한다.
const normalizeCellValue = (key, val) => {
  if (key !== '성격' || !val) return val;
  return val.replace(/(\d)W(\d)/g, '$1w$2').replace(/\b[ie][ns][tf][jp]\b/gi, m => m.toUpperCase());
};

export const useBulkStudioData = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const urlWorkId = searchParams.get('workId');
  const [isAutoLoaded, setIsAutoLoaded] = useState(false);

  const [works, setWorks] = useState([]);
  const [selectedWorkId, setSelectedWorkId] = useState('');
  const [workMeta, setWorkMeta] = useState({});
  const [columns, setColumns] = useState([...DEFAULT_COLS]);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  const [suggestions, setSuggestions] = useState({});
  const suggestionTimer = useRef(null);

  // 화면을 반으로 나눠 왼쪽에서 자료를 보며 오른쪽에 입력하는 게 주 사용 패턴이라,
  // 실시간 뷰어(왼쪽 절반을 차지)는 기본적으로 접어서 시작한다.
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [activeRowIdx, setActiveRowIdx] = useState(null);
  const [tabMode, setTabMode] = useState('horizontal');
  const [sortMode, setSortMode] = useState('card');
  const [labels, setLabels] = useState({ label1: "나이", label2: "등급, 소속, 직책, 능력" });

  const [bodyModal, setBodyModal] = useState({ isOpen: false, rowIdx: null, text: '' });
  const [findReplaceModal, setFindReplaceModal] = useState({ isOpen: false });
  const [pasteModal, setPasteModal] = useState({ isOpen: false });

  const lastCheckedRowIdx = useRef(null);

  // ★ 폼 스위칭(_switchTarget/_isHidden) 같은, Bulk Studio가 모르는 "_"로 시작하는 내부
  // 속성을 일괄 저장 때 그대로 보존하기 위한 원본 dynamicProperties 캐시. loadCharacters가
  // 불러올 때마다 캐릭터 id별로 채워두고, handleSaveAll이 새 dp를 만들 때 여기서 "_" 속성만
  // 되살려 합친다 — Bulk Studio 표는 애초에 "_" 속성을 컬럼으로도, 행 데이터로도 들고 있지
  // 않아서(loadCharacters의 컬럼 필터 참고) 그냥 두면 저장할 때마다 통째로 사라졌었다.
  const originalDpRef = useRef({});

  useEffect(() => {
    const handleGlobalKey = (e) => {
      if (document.querySelector('.bulk-modal-overlay')) return;
      if ((e.altKey && e.key.toLowerCase() === 't') || ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'q')) {
        e.preventDefault();
        e.stopPropagation();
        setTabMode(prev => prev === 'horizontal' ? 'vertical' : 'horizontal');
      }
    };
    document.addEventListener('keydown', handleGlobalKey);
    return () => document.removeEventListener('keydown', handleGlobalKey);
  }, []);

  useEffect(() => {
    api.get('/api/works').then(res => setWorks(res.data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (works.length > 0 && urlWorkId && !isAutoLoaded) {
      loadCharacters(urlWorkId, works);
      setIsAutoLoaded(true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [works, urlWorkId, isAutoLoaded]);

  const loadCharacters = async (workId, currentWorks = works) => {
    setSelectedWorkId(workId);
    if (!workId) return setRows([]);
    setLoading(true);
    
    try {
      const targetWork = currentWorks.find(w => String(w.id) === String(workId));
      let meta = {};
      if (targetWork?.description) {
        const match = targetWork.description.match(/\[META_DATA:(.*?)\]/);
        if (match) { try { meta = JSON.parse(match[1]); } catch(e){} }
      }
      setWorkMeta(meta);

      const res = await api.get(`/api/characters?workId=${workId}`);
      let chars = res.data.filter(c => !c.isTrash);
      
      const newCols = new Set([...DEFAULT_COLS]);
      chars.forEach(c => {
        if (c.dynamicProperties || c._rawDynamic) {
          try {
            const dp = JSON.parse(c.dynamicProperties || c._rawDynamic);
            Object.keys(dp).forEach(k => {
              // ★ 시스템 예약어이거나 _로 시작하는 내부 속성이면 컬럼으로 만들지 않고 필터링
              if (!k.startsWith('_') && k !== '부제목' && !SYSTEM_PROPS.includes(k)) newCols.add(k);
            });
          } catch(e){}
        }
      });
      const colArray = Array.from(newCols).filter(k => k !== "부제목");
      colArray.unshift("부제목");
      setColumns(colArray);

      originalDpRef.current = {};
      const formattedRows = chars.map(c => {
        let dp = {}; try { dp = JSON.parse(c.dynamicProperties || c._rawDynamic || "{}"); } catch(e){}
        originalDpRef.current[c.id] = dp;
        const rowData = {
          id: c.id, name: c.name || '', _checked: false, pageBodyRaw: dp.pageBody?.rawText || '',
          themeColor: c.themeColor || dp.themeColor || '#3b5bdb',
          cardImgX: dp.cardImgX !== undefined ? dp.cardImgX : (c.cardImgX !== undefined ? c.cardImgX : 50),
          cardImgY: dp.cardImgY !== undefined ? dp.cardImgY : (c.cardImgY !== undefined ? c.cardImgY : 50),
          cardImgScale: dp.cardImgScale !== undefined ? dp.cardImgScale : (c.cardImgScale !== undefined ? c.cardImgScale : 1),
          _sortOrderNum: dp.sortOrder !== undefined ? dp.sortOrder : 999
        };
        colArray.forEach(col => {
          if (col === '나이') rowData[col] = c.age || dp[col] || '';
          else if (col === '성별') rowData[col] = c.gender || dp[col] || '';
          else if (col === '종족') rowData[col] = c.species || dp[col] || '';
          else rowData[col] = dp[col] || '';
        });
        return rowData;
      });

      if (formattedRows.length > 0) {
        let firstDp = {}; try { firstDp = JSON.parse(chars[0].dynamicProperties || chars[0]._rawDynamic || "{}"); } catch(e){}
        setLabels({ label1: firstDp._cardLabel1 || "나이", label2: firstDp._cardLabel2 || "등급, 소속, 능력" });
      }
      // 캐릭터가 없는 작품은 빈 표로 시작한다. 예전에는 빈 "새 캐릭터" 행을 하나 넣어 줬지만,
      // 대부분 "붙여넣기로 추가"로 한꺼번에 넣고 이 행은 매번 지워야 해서 뺐다("행 추가"로 만들 수 있다).
      // ★ 작품 페이지가 sortOrder 기준으로 정렬해서 보여주는데 여기선 그동안 정렬 없이
      // 백엔드가 준 순서(대개 id 순, 즉 동시 저장 시 완료된 순서) 그대로 표시했다 — 그래서
      // 붙여넣기로 여러 명을 한 번에 저장한 뒤 다시 들어오면 의도한 순서가 아니라 뒤섞인
      // 순서로 보였다. 같은 기준(sortOrder)으로 정렬해서 작품 페이지와 항상 일치하게 만든다.
      formattedRows.sort((a, b) => (a._sortOrderNum ?? 999) - (b._sortOrderNum ?? 999));
      setRows(formattedRows);
    } catch (e) { alert("데이터 로드 실패"); } finally { setLoading(false); }
  };

  // rows를 클로저로 참고하지 않고 함수형 setState만 쓴다 — 그래야 이 핸들러가 매 렌더마다
  // 새로 만들어지지 않고(useCallback 빈 deps), BulkTableRow의 React.memo가 실제로 동작한다.
  // 행 객체도 직접 mutate하지 않고 항상 새 객체로 교체한다 — 예전엔 newRows[rIdx][key]=val로
  // 기존 객체를 그대로 건드려서, React.memo가 (언젠가 제대로 동작하게 되면) 참조가 그대로라
  // 변경을 못 알아채는 문제가 잠재해 있었다.
  const handleCellChange = useCallback((rIdx, key, val) => {
    const finalVal = normalizeCellValue(key, val);

    setRows(prev => {
      const newRows = [...prev];
      newRows[rIdx] = { ...newRows[rIdx], [key]: finalVal };
      return newRows;
    });

    // 입력을 지워서 빈 값이 돼도 이전에 예약된 자동완성 요청은 항상 취소한다 —
    // 예전엔 val이 빈 문자열이면 이 클리어 자체를 건너뛰어서, 지운 뒤에도 낡은 제안
    // 요청이 뒤늦게 날아오는 버그가 있었다.
    if (suggestionTimer.current) clearTimeout(suggestionTimer.current);
    if (val.trim().length > 0 && !["name", "부제목", "_checked", "pageBodyRaw"].includes(key)) {
      suggestionTimer.current = setTimeout(async () => {
        try {
          const res = await api.get(`/api/characters/suggest?column=${encodeURIComponent(key)}&keyword=${encodeURIComponent(val.trim())}`);
          if (res.data && res.data.length > 0) {
            let splitData = [];
            res.data.forEach(item => {
              if (item.includes(',')) {
                item.split(',').forEach(part => splitData.push(part.trim()));
              } else {
                splitData.push(item.trim());
              }
            });
            setSuggestions(prev => ({
              ...prev,
              [key]: Array.from(new Set([...(prev[key] || []), ...splitData]))
            }));
          }
        } catch (e) {
          console.error("[useBulkStudioData] 자동완성 로드 실패", e);
        }
      }, 1500);
    }
  }, []);

  const toggleRowCheck = useCallback((e, rIdx) => {
    // setRows 업데이터 함수는 StrictMode에서 (같은 prev로) 두 번 호출될 수 있는 순수 함수여야
    // 한다 — lastCheckedRowIdx.current를 업데이터 "안"에서 건드리면, 첫 번째(버려지는) 호출의
    // 부작용이 두 번째(실제로 반영되는) 호출의 range 계산을 오염시켜 shift+클릭 범위선택이
    // 어긋나는 버그가 났었다. 그래서 읽기/쓰기 둘 다 업데이터 바깥, 이벤트당 한 번만 실행되는
    // 곳에서 하고, 업데이터에는 그 결과값(shiftKey, prevCheckedIdx)만 클로저로 넘긴다.
    const shiftKey = e.shiftKey;
    const prevCheckedIdx = lastCheckedRowIdx.current;
    lastCheckedRowIdx.current = rIdx;

    setRows(prev => {
      const newRows = [...prev];
      const isChecked = !newRows[rIdx]._checked;
      if (shiftKey && prevCheckedIdx !== null) {
        const start = Math.min(prevCheckedIdx, rIdx);
        const end = Math.max(prevCheckedIdx, rIdx);
        for (let i = start; i <= end; i++) newRows[i] = { ...newRows[i], _checked: isChecked };
        if (window.getSelection) window.getSelection().removeAllRanges();
      } else {
        newRows[rIdx] = { ...newRows[rIdx], _checked: isChecked };
      }
      return newRows;
    });
  }, []);

  const toggleAllChecks = (isChecked) => {
    const newRows = rows.map(r => ({ ...r, _checked: isChecked }));
    lastCheckedRowIdx.current = null;
    setRows(newRows);
  };

  const addRow = (count = 1) => {
    const newRows = [...rows];
    const baseTime = Date.now();
    const orderBase = getNextSortOrderBase(rows);
    for(let i=0; i<count; i++) {
      const nr = { id: `new_${baseTime + i}`, name: '', _checked: false, pageBodyRaw: '', _sortOrderNum: orderBase + i + 1, themeColor: '#3b5bdb', cardImgX: 50, cardImgY: 50, cardImgScale: 1 };
      columns.forEach(c => nr[c] = '');
      nr['관계'] = "일반"; nr['성별'] = "여성"; nr['종족'] = "인간(人間)";
      newRows.push(nr);
    }
    setRows(newRows);
  };

  // 헤더 한 줄 + 데이터 여러 줄을 붙여넣으면 한 번에 여러 캐릭터로 파싱한다.
  // 엑셀/구글시트/노션 표에서 그대로 복사한 실제 탭 구분 텍스트와, "이름 - 나이 - ..."처럼
  // 사람이 직접 적은 " - " 구분 텍스트 둘 다 자동으로 알아챈다. 헤더에 있는데 아직 없는
  // 속성(열)은 자동으로 만든다. 본문 칸은 내용에 " - "나 탭이 들어있어도 안 잘리도록
  // 맨 마지막 칸이 나머지 전부를 통째로 가져간다.
  // ★ 표로 입력 탭이 이 텍스트 탭과 서로 동기화되면서(BulkModals의 handlePasteModeChange),
  // 모달을 열 때 표의 기존 인물이 그대로 여기 텍스트로도 흘러들어올 수 있게 됐다 — 그래서
  // importRowsFromGrid와 마찬가지로 이름이 지금 표에 이미 있는 사람이면 새로 만들지 않고
  // 그 사람 값을 덮어쓴다(안 그러면 텍스트 탭에서 그냥 "추가"만 눌러도 전원이 중복 생성됨).
  const importRowsFromText = (text) => {
    const lines = text.split('\n').map(l => l.replace(/\r$/, '')).filter(l => l.trim() !== '');
    if (lines.length < 2) return { count: 0, error: '헤더 한 줄과 데이터 최소 한 줄이 필요합니다.' };

    const useTab = lines.some(l => l.includes('\t'));
    const delim = useTab ? '\t' : ' - ';
    const splitLine = (line, limit) => {
      const parts = line.split(delim);
      if (parts.length > limit) return [...parts.slice(0, limit - 1), parts.slice(limit - 1).join(delim)];
      return parts;
    };

    const headerLabels = splitLine(lines[0], 999).map(h => h.trim());
    if (!headerLabels.includes('이름')) return { count: 0, error: '헤더에 "이름" 칸이 있어야 합니다.' };

    const newColNames = headerLabels.filter(h => h !== '이름' && h !== '본문' && !columns.includes(h));
    const finalColumns = newColNames.length > 0 ? [...columns, ...newColNames] : columns;

    const nameIndex = new Map();
    rows.forEach((r, i) => { const n = (r.name || '').trim(); if (n) nameIndex.set(n, i); });

    const nextRows = newColNames.length > 0
      ? rows.map(r => { const copy = { ...r }; newColNames.forEach(c => { if (copy[c] === undefined) copy[c] = ''; }); return copy; })
      : [...rows];

    const baseTime = Date.now();
    const orderBase = getNextSortOrderBase(rows);
    let addedCount = 0, updatedCount = 0, newIdx = 0;

    for (let li = 1; li < lines.length; li++) {
      const cells = splitLine(lines[li], headerLabels.length).map(c => c.trim());
      const parsed = {};
      headerLabels.forEach((label, i) => {
        let val = cells[i] !== undefined ? cells[i] : '';
        val = normalizeCellValue(label, val);
        // 관계/성별처럼 셀렉트로 바뀐 속성은 붙여넣은 값이 정해진 보기 중 하나가 아니면
        // fallback 값으로 대체한다 — 안 그러면 <select>가 아무 것도 선택 안 된 채로 남는다.
        const enumConf = ENUM_COLUMNS[label];
        if (enumConf && val && !enumConf.options.includes(val)) val = enumConf.fallback;
        parsed[label] = val;
      });
      const name = (parsed['이름'] || '').trim();
      if (!name) continue;

      const applyParsed = (target) => {
        const merged = { ...target };
        Object.entries(parsed).forEach(([label, val]) => {
          if (label === '이름' || val === '') return;
          // 붙여넣기 텍스트는 한 줄 = 한 행이라 본문에 실제 줄바꿈을 넣을 수 없다 —
          // 그 대신 리터럴 "\n"(백슬래시+n 두 글자)을 쓰면 여기서 진짜 줄바꿈으로 바꿔준다.
          if (label === '본문') merged.pageBodyRaw = val.replace(/\\n/g, '\n');
          else merged[label] = val;
        });
        return merged;
      };

      const existingIdx = nameIndex.get(name);
      if (existingIdx !== undefined) {
        nextRows[existingIdx] = applyParsed(nextRows[existingIdx]);
        updatedCount++;
      } else {
        const nr = { id: `new_${baseTime + newIdx}`, name, _checked: false, pageBodyRaw: '', _sortOrderNum: orderBase + newIdx + 1, themeColor: '#3b5bdb', cardImgX: 50, cardImgY: 50, cardImgScale: 1 };
        finalColumns.forEach(c => { nr[c] = ''; });
        // ★ "새 캐릭터 추가" 버튼(addRow)과 똑같은 기본값 — 붙여넣은 헤더에 이 속성이 아예
        // 없으면 이 기본값이 그대로 남고, 있으면 applyParsed가 덮어쓴다. 예전엔 이 줄이 없어서
        // "이름 - 나이 - 능력"처럼 관계/성별/종족을 빼고 붙여넣으면 세 칸 다 빈 채로 남았다.
        nr['관계'] = "일반"; nr['성별'] = "여성"; nr['종족'] = "인간(人間)";
        nextRows.push(applyParsed(nr));
        addedCount++;
        newIdx++;
      }
    }

    if (addedCount === 0 && updatedCount === 0) return { count: 0, updatedCount: 0, error: '이름이 있는 데이터 행이 없습니다.' };

    if (newColNames.length > 0) setColumns(finalColumns);
    setRows(nextRows);

    return { count: addedCount, updatedCount, error: null };
  };

  // 붙여넣기 모달의 표 입력 모드(BulkPasteGrid)에서 이미 칸별로 구조화된 값을 그대로 받는다.
  // 모달을 열 때 표의 기존 인물을 그대로 그리드에 불러와두기 때문에(loadFromRows), 여기 넘어오는
  // gridRows에는 "새로 추가하는 사람"과 "이미 있던 사람(수정된 값일 수도)"이 섞여 있다 —
  // 이름이 지금 표에 이미 있는 사람과 일치하면 그 사람 값을 덮어쓰고(업데이트), 없으면 새로
  // 추가한다. 빈 칸은 여전히 "안 건드림"으로 취급해서(값을 지우는 용도로는 안 씀), 그리드에
  // 안 보이는 속성(열 삭제로 숨긴 것 포함)은 기존 값이 그대로 보존된다.
  const importRowsFromGrid = (gridRows, gridColumns) => {
    const newColNames = gridColumns.filter(c => c !== '부제목' && !columns.includes(c));
    const finalColumns = newColNames.length > 0 ? [...columns, ...newColNames] : columns;

    const nameIndex = new Map();
    rows.forEach((r, i) => { const n = (r.name || '').trim(); if (n) nameIndex.set(n, i); });

    const nextRows = newColNames.length > 0
      ? rows.map(r => { const copy = { ...r }; newColNames.forEach(c => { if (copy[c] === undefined) copy[c] = ''; }); return copy; })
      : [...rows];

    const applyFields = (target, gr) => {
      const merged = { ...target };
      // 표 붙여넣기 모드의 칸(input)도 실제 줄바꿈은 못 담으니, 텍스트 모드와 같은 "\n" 이스케이프를 쓴다.
      const body = (gr['본문'] || '').trim().replace(/\\n/g, '\n');
      if (body !== '') merged.pageBodyRaw = body;
      gridColumns.forEach(c => {
        const raw = normalizeCellValue(c, (gr[c] || '').trim());
        if (raw === '') return;
        const enumConf = ENUM_COLUMNS[c];
        merged[c] = (enumConf && !enumConf.options.includes(raw)) ? enumConf.fallback : raw;
      });
      return merged;
    };

    const baseTime = Date.now();
    const orderBase = getNextSortOrderBase(rows);
    let addedCount = 0, updatedCount = 0, newIdx = 0;

    gridRows.forEach(gr => {
      const name = (gr['이름'] || '').trim();
      if (!name) return;

      const existingIdx = nameIndex.get(name);
      if (existingIdx !== undefined) {
        nextRows[existingIdx] = applyFields(nextRows[existingIdx], gr);
        updatedCount++;
      } else {
        const nr = { id: `new_${baseTime + newIdx}`, name, _checked: false, pageBodyRaw: '', _sortOrderNum: orderBase + newIdx + 1, themeColor: '#3b5bdb', cardImgX: 50, cardImgY: 50, cardImgScale: 1 };
        finalColumns.forEach(c => { nr[c] = ''; });
        nr['관계'] = "일반"; nr['성별'] = "여성"; nr['종족'] = "인간(人間)";
        nextRows.push(applyFields(nr, gr));
        addedCount++;
        newIdx++;
      }
    });

    if (addedCount === 0 && updatedCount === 0) return { count: 0, updatedCount: 0, error: '이름이 채워진 행이 없습니다.' };

    if (newColNames.length > 0) setColumns(finalColumns);
    setRows(nextRows);

    return { count: addedCount, updatedCount, error: null };
  };

  const removeRow = useCallback((rIdx) => {
    if (window.confirm("이 행을 삭제하시겠습니까?")) setRows(prev => prev.filter((_, i) => i !== rIdx));
  }, []);

  const addColumn = (colName) => {
    if(!colName || colName.trim() === "") return;
    const cleanName = colName.trim();
    if([...SYSTEM_PROPS, "id", "name", "imageCode", "workId", "부제목", "pageBodyRaw", "_checked"].includes(cleanName) || cleanName.startsWith('_')) {
      return alert("시스템 예약어는 속성 이름으로 사용할 수 없습니다.");
    }
    if(columns.includes(cleanName)) return alert("이미 존재하는 속성입니다.");
    setColumns([...columns, cleanName]);
    setRows(rows.map(r => ({ ...r, [cleanName]: '' })));
  };

  const removeColumn = (colName) => {
    if(colName === "부제목") return alert("부제목 칸은 삭제할 수 없습니다.");
    if(window.confirm(`'${colName}' 속성을 지울까요?`)) setColumns(columns.filter(c => c !== colName));
  };

  const changeColOrder = (oldIdx, newVal) => {
    if(columns[oldIdx] === "부제목") return;
    let newIdx = newVal - 1;
    if(newIdx < 1) newIdx = 1;
    if(newIdx >= columns.length) newIdx = columns.length - 1;
    if(oldIdx !== newIdx) {
      const newCols = [...columns];
      const colName = newCols.splice(oldIdx, 1)[0];
      newCols.splice(newIdx, 0, colName);
      setColumns(newCols);
    }
  };

  const sortTable = (type) => {
    setSortMode(type);
    const newRows = [...rows];
    // workMeta._groupOrder를 직접 건드리지 않도록 복제해서 쓴다 — 예전엔 여기서
    // groupOrderMap["관계"] = [...]로 workMeta 안의 객체를 그대로 mutate했다.
    const groupOrderMap = { ...(workMeta._groupOrder || {}) };
    if (!groupOrderMap["관계"]) groupOrderMap["관계"] = ["연인", "친구", "일반"];

    newRows.sort((a, b) => {
      if (type === 'name') return (a.name || "").localeCompare(b.name || "", 'ko-KR');
      else {
        const rA = (a['관계'] || "일반").trim();
        const rB = (b['관계'] || "일반").trim();
        const orderArr = groupOrderMap["관계"];
        let idxA = orderArr.indexOf(rA); if(idxA === -1) idxA = 999;
        let idxB = orderArr.indexOf(rB); if(idxB === -1) idxB = 999;
        if (idxA !== idxB) return idxA - idxB;
        return (a._sortOrderNum || 999) - (b._sortOrderNum || 999);
      }
    });
    setRows(newRows);
  };

  const applyBatchValue = (col, val) => {
    if (!col) return alert("덮어쓸 대상을 선택하세요.");
    let count = 0;
    const newRows = rows.map(r => { if (r._checked) { count++; return { ...r, [col]: val }; } return r; });
    if (count === 0) return alert("대상을 1명 이상 선택해 주세요.");
    setRows(newRows);
    alert(`총 ${count}명의 [${col}] 값이 변경되었습니다.`);
  };

  const executeFindReplace = (targetCol, findVal, replaceVal) => {
    if (!findVal) return alert("찾을 내용을 입력하세요.");
    let count = 0;
    const newRows = rows.map(c => {
      let newC = { ...c };
      if (targetCol === "ALL" || targetCol === "본문(마크다운)") {
        if (targetCol === "ALL" && newC.name?.includes(findVal)) { newC.name = newC.name.split(findVal).join(replaceVal); count++; }
        if ((targetCol === "ALL" || targetCol === "본문(마크다운)") && newC.pageBodyRaw?.includes(findVal)) { newC.pageBodyRaw = newC.pageBodyRaw.split(findVal).join(replaceVal); count++; }
        if (targetCol === "ALL") { columns.forEach(kc => { if (newC[kc]?.toString().includes(findVal)) { newC[kc] = newC[kc].toString().split(findVal).join(replaceVal); count++; } }); }
      } else {
        if (newC[targetCol]?.toString().includes(findVal)) { newC[targetCol] = newC[targetCol].toString().split(findVal).join(replaceVal); count++; }
      }
      return newC;
    });
    setRows(newRows);
    setFindReplaceModal({ isOpen: false });
    alert(`총 ${count}개의 항목이 치환되었습니다.`);
  };

  const formatPropValue = (k, v) => {
    if(!v) return ""; let vStr = v.toString().trim(); if(vStr === "") return "";
    const numOnly = /^\d+(\.\d+)?$/.test(vStr);
    if (k === "나이" && numOnly) vStr += "세";
    if ((k === "신장" || k === "신체" || k === "키") && numOnly) vStr += "cm";
    if ((k === "체중" || k === "몸무게") && numOnly) vStr += "kg";
    // "S"만 넣든 "A"만 넣든 급수 표기가 자동으로 붙는다 — 이미 "급"으로 끝나 있거나
    // "없음"이면 그대로 둔다.
    if (k === "등급" && vStr !== "없음" && !vStr.endsWith("급")) vStr += "급";
    return vStr;
  };

  const handleSaveAll = async () => {
    if (!selectedWorkId) return alert("작품이 선택되지 않았습니다.");
    const targetWork = works.find(w => String(w.id) === String(selectedWorkId));
    let cExt = workMeta.charExt || "png";
    const workTitle = targetWork?.title || "작품";
    const creator = targetWork?.creator || "미상";

    // 이름 없는 행은 저장 대상에서 제외한다 — 이 목록을 따로 들고 있어야 나중에
    // Promise.allSettled 결과와 행 이름을 1:1로 다시 짝지을 수 있다.
    const targets = rows.filter(row => row.name.trim());

    const results = await Promise.allSettled(targets.map(row => {
      // ★ 저장 시 기존에 갖고 있던 시스템 속성(themeColor, imgY, imgScale) 등도 온전히 유지한 채 병합 저장합니다.
      let dp = {
        _propOrder: [...columns],
        pageBody: { rawText: row.pageBodyRaw },
        sortOrder: row._sortOrderNum !== undefined ? row._sortOrderNum : 999,
        themeColor: row.themeColor || "#3b5bdb",
        cardImgX: row.cardImgX !== undefined ? row.cardImgX : 50,
        cardImgY: row.cardImgY !== undefined ? row.cardImgY : 50,
        cardImgScale: row.cardImgScale !== undefined ? row.cardImgScale : 1,
        _cardLabel1: labels.label1,
        _cardLabel2: labels.label2,
        작품명: workTitle,
        제작자: creator
      };
      const payload = { workId: parseInt(selectedWorkId), name: row.name.trim(), imageCode: `${sanitizeFilenameTitle(workTitle)}_${sanitizeFilenameTitle(row.name.trim())}.${cExt.replace(/^\./, '')}` };

      columns.forEach(col => {
        if (row[col]?.trim() !== "") {
          const formattedVal = formatPropValue(col, row[col]);
          dp[col] = formattedVal;
          if (col === "나이") payload.age = formattedVal;
          if (col === "성별") payload.gender = formattedVal;
          if (col === "종족") payload.species = formattedVal;
        }
      });
      // ★ 폼 스위칭(_switchTarget/_isHidden) 등 Bulk Studio가 다루지 않는 "_" 내부 속성은
      // 위에서 새로 만든 dp에 없으니, 불러올 때 캐시해둔 원본에서 그대로 되살려 합친다.
      const originalDp = originalDpRef.current[row.id];
      if (originalDp) {
        Object.keys(originalDp).forEach(k => {
          if (k.startsWith('_') && !(k in dp)) dp[k] = originalDp[k];
        });
      }
      payload.dynamicProperties = JSON.stringify(dp);
      return String(row.id).startsWith('new_') ? api.post('/api/characters', payload) : api.put(`/api/characters/${row.id}`, payload);
    }));

    // 실패한 건이 있으면, 이전엔 "저장 실패" 한 마디만 뜨고 몇 명이 실제로 저장됐는지
    // 알 방법이 없었다 — 이제 성공/실패 인원과 실패한 캐릭터 이름을 구체적으로 알려준다.
    const failedIdx = results.map((r, i) => r.status === 'rejected' ? i : -1).filter(i => i !== -1);
    if (failedIdx.length > 0) {
      const failedNames = failedIdx.map(i => targets[i].name.trim()).join(', ');
      alert(`일괄 저장 중 일부가 실패했습니다.\n성공: ${results.length - failedIdx.length}명 · 실패: ${failedIdx.length}명\n실패한 캐릭터: ${failedNames}`);
      return;
    }

    // ★ 불러올 때는 있었는데(originalDpRef에 캐시됨) 지금 rows엔 없는 인물은 스튜디오에서
    // ✖(removeRow)로 뺀 것이다. removeRow는 화면(local state)에서만 지우고 서버엔 아무것도
    // 안 보내므로, 여기서 실제로 삭제 API를 호출해주지 않으면 저장 후 작품 페이지로 돌아갔을 때
    // 서버에 그대로 남아있던 그 인물이 다시 나타난다.
    const currentIds = new Set(rows.map(r => String(r.id)));
    const removedIds = Object.keys(originalDpRef.current).filter(id => !currentIds.has(id));
    if (removedIds.length > 0) {
      const deleteResults = await Promise.allSettled(removedIds.map(id => api.delete(`/api/characters/${id}`)));
      const deleteFailedCount = deleteResults.filter(r => r.status === 'rejected').length;
      if (deleteFailedCount > 0) {
        alert(`저장은 됐지만, 스튜디오에서 삭제한 인물 중 ${deleteFailedCount}명은 서버에서 지우지 못했습니다.`);
        return;
      }
    }

    alert("성공적으로 일괄 저장되었습니다.");
    navigate(`/work/${selectedWorkId}`);
  };

  return {
    works, selectedWorkId, columns, rows, loading, workMeta, suggestions,
    isPreviewOpen, setIsPreviewOpen, activeRowIdx, setActiveRowIdx,
    tabMode, setTabMode, sortMode, labels, setLabels,
    bodyModal, setBodyModal, findReplaceModal, setFindReplaceModal,
    pasteModal, setPasteModal,
    loadCharacters, handleCellChange, toggleRowCheck, toggleAllChecks,
    addRow, removeRow, addColumn, removeColumn, changeColOrder, sortTable,
    applyBatchValue, executeFindReplace, importRowsFromText, importRowsFromGrid, handleSaveAll
  };
};