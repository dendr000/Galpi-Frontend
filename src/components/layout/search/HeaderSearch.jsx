// Copyright (c) dendr000. MIT License.
// 헤더 검색창: 글자를 입력하면 관련 작품이 아래로 추천되고, 엔터/클릭으로 작품 페이지로 이동한다.
// 현재 화면(홈의 분류 필터 등)과 무관하게 항상 전체 작품에서 찾는다. 숨김 분류 작품을 추천에 넣을지는
// Shift+우클릭 메뉴의 설정(searchSettings)을 따른다.
import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { IconSearch } from '../../common/icons/DomainIcons';
import api from '../../../api/axiosCore';
import { extractMeta } from '../../../utils/markdownParser';
import { buildCandidates, rankSuggestions } from './searchSuggest';
import { getIncludeHidden, SEARCH_SETTINGS_EVENT } from './searchSettings';

const STALE_MS = 60000;
const LIST_ID = 'galpi-search-suggestions';

// 검색 후보 원본 데이터를 가져온다. 실패하면 null — 목록을 못 불러와도 헤더는 계속 동작해야 한다.
const fetchSearchData = async () => {
  try {
    const [worksRes, hiddenRes] = await Promise.all([
      api.get('/api/works'),
      api.get('/api/hidden-categories').catch(() => ({ data: [] })),
    ]);
    return {
      works: worksRes.data.map((w) => ({ ...w, metaInfo: extractMeta(w.description || '') })),
      hiddenCats: Array.isArray(hiddenRes.data) ? hiddenRes.data : [],
    };
  } catch {
    return null;
  }
};

const HeaderSearch = () => {
  const navigate = useNavigate();
  const containerRef = useRef(null);
  const loadedAtRef = useRef(0);
  const [works, setWorks] = useState([]);
  const [hiddenCats, setHiddenCats] = useState([]);
  const [includeHidden, setIncludeHidden] = useState(getIncludeHidden);
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);

  const applyData = useCallback((data) => {
    if (!data) return;
    setWorks(data.works);
    setHiddenCats(data.hiddenCats);
    loadedAtRef.current = Date.now();
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetchSearchData().then((data) => {
      if (!cancelled) applyData(data);
    });
    return () => {
      cancelled = true;
    };
  }, [applyData]);

  useEffect(() => {
    const sync = () => setIncludeHidden(getIncludeHidden());
    window.addEventListener(SEARCH_SETTINGS_EVENT, sync);
    return () => window.removeEventListener(SEARCH_SETTINGS_EVENT, sync);
  }, []);

  useEffect(() => {
    const onDown = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, []);

  const candidates = useMemo(() => buildCandidates(works, hiddenCats, includeHidden), [works, hiddenCats, includeHidden]);
  const suggestions = useMemo(() => rankSuggestions(candidates, query), [candidates, query]);
  const showList = open && suggestions.length > 0;

  const go = (item) => {
    navigate(`/work/${item.id}`);
    setQuery('');
    setOpen(false);
    setActive(-1);
  };

  const handleKeyDown = (e) => {
    if (e.nativeEvent?.isComposing) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setOpen(true);
      setActive((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, -1));
    } else if (e.key === 'Escape') {
      setOpen(false);
      setActive(-1);
    } else if (e.key === 'Enter') {
      const q = query.trim();
      if (!q) return;
      const target = active >= 0 ? suggestions[active] : suggestions[0];
      if (target) go(target);
      else alert(`"${q}"와(과) 일치하는 작품을 찾지 못했습니다.`);
    }
  };

  const handleFocus = () => {
    setOpen(true);
    if (Date.now() - loadedAtRef.current > STALE_MS) fetchSearchData().then(applyData);
  };

  return (
    <div ref={containerRef} style={{ flex: 1, maxWidth: '600px', margin: '0 20px', position: 'relative' }}>
      <div style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5, display: 'flex', alignItems: 'center' }}>
        <IconSearch size={16} />
      </div>
      <input
        type="text"
        role="combobox"
        aria-expanded={showList}
        aria-controls={LIST_ID}
        aria-autocomplete="list"
        aria-activedescendant={showList && active >= 0 ? `${LIST_ID}-${active}` : undefined}
        placeholder="작품명, 장르, 약칭 검색"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setActive(-1);
          setOpen(true);
        }}
        onFocus={handleFocus}
        onKeyDown={handleKeyDown}
        style={{ width: '100%', padding: '10px 15px 10px 40px', borderRadius: '20px', border: '1px solid var(--border-color)', background: 'var(--bg-color)', color: 'var(--text-primary)', outline: 'none', fontSize: '14px', boxSizing: 'border-box' }}
      />
      {showList && (
        <ul
          id={LIST_ID}
          role="listbox"
          style={{ position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0, margin: 0, padding: '6px 0', listStyle: 'none', background: 'var(--surface-color)', border: '1px solid var(--border-color)', borderRadius: '12px', boxShadow: 'var(--shadow-md)', zIndex: 1100, maxHeight: '420px', overflowY: 'auto' }}
        >
          {suggestions.map((item, i) => (
            <li
              key={item.id}
              id={`${LIST_ID}-${i}`}
              role="option"
              aria-selected={i === active}
              onMouseEnter={() => setActive(i)}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => go(item)}
              style={{ padding: '9px 16px', cursor: 'pointer', display: 'flex', alignItems: 'baseline', gap: '10px', background: i === active ? 'var(--table-bg-alt)' : 'transparent' }}
            >
              <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flexShrink: 1, minWidth: 0 }}>{item.title}</span>
              {item.alias && <span style={{ color: 'var(--text-secondary)', fontSize: '12px', whiteSpace: 'nowrap' }}>{item.alias}</span>}
              <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                {item.genre && <span style={{ color: 'var(--text-secondary)', fontSize: '12px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '200px' }}>{item.genre}</span>}
                {item.hidden && <span style={{ fontSize: '11px', fontWeight: 700, padding: '1px 7px', borderRadius: '10px', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>숨김 분류</span>}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default HeaderSearch;
