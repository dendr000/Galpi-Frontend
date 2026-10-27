// 파일 위치: src/pages/Editor/hooks/useEditorFetch.js
import { useEffect } from 'react';
import api from '../../../api/axiosCore';
import { extractMeta } from '../../../utils/markdownParser';
import { SYSTEM_PROPS } from '../constants/editorConstants';
import { getMultiGroupMode } from '../../../domains/character/characterGroups';

export const useEditorFetch = ({
  docType, docAction, targetId, targetWorkId,
  setLoading, setTitle, setRawText, setOverviewText,
  setWorkMeta, setWorkContext, setThemeColor, setIsHidden,
  setCardLabels, setCharProps, setFontList // ★ 폰트 세터 수신
}) => {
  
  // ★ 폰트 데이터 패치 및 글로벌 CSS 주입 파이프라인
  useEffect(() => {
    api.get('/api/fonts').then(res => {
      if (res.data && res.data.length > 0) {
        const sortedFonts = res.data.sort((a, b) => a.displayName.localeCompare(b.displayName, 'ko-KR'));
        setFontList(sortedFonts);
        
        const styleId = 'galpi-dynamic-fonts';
        if (!document.getElementById(styleId)) {
          const style = document.createElement('style');
          style.id = styleId;
          let css = '';
          sortedFonts.forEach(f => {
            // 마크다운 파서와의 호환성을 위해 displayName을 폰트 패밀리 명칭으로 직결
            css += `@font-face { font-family: '${f.displayName}'; src: url('/fonts/${f.filename}'); }\n`;
          });
          style.innerHTML = css;
          document.head.appendChild(style);
        }
      }
    }).catch(e => console.warn("[useEditorFetch] 폰트 스캔 실패:", e));
  }, [setFontList]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        if (docType === 'work') {
          if (docAction === 'edit' && targetId) {
            const res = await api.get(`/api/works/${targetId}`);
            const data = res.data;
            setTitle(data.title || '');

            const parsed = extractMeta(data.description);
            setRawText(parsed.clean);
            setOverviewText(parsed.meta.overview || '');

            let groupOrderStr = "";
            if (parsed.meta._groupOrder) {
              for (let k in parsed.meta._groupOrder) {
                groupOrderStr += `${k}: ${parsed.meta._groupOrder[k].join(', ')}\n`;
              }
            }

            setWorkMeta({
              creator: data.creator || '', genre: data.genre || '', status: data.status || '진행 전',
              alias: parsed.meta.alias || '', coverExt: parsed.meta.coverExt || '', charExt: parsed.meta.charExt || 'png',
              groupOrderStr: groupOrderStr, multiGroupMode: getMultiGroupMode(parsed.meta),
              ratingAxesStr: parsed.meta.ratingAxes || '', ratingScaleStr: parsed.meta.ratingScale || '',
              imgVariants: parsed.meta.imgVariants?.length > 0 ? parsed.meta.imgVariants : [''],
              originalMeta: parsed.meta
            });
          }
        }
        else if (docType === 'page') {
          if (docAction === 'edit' && targetId) {
            const res = await api.get(`/api/wikipages/${targetId}`);
            setTitle(res.data.title || '');
            setRawText(res.data.content || '');
          }
        }
        else if (docType === 'char') {
          if (targetWorkId) {
            const wRes = await api.get(`/api/works/${targetWorkId}`);
            const cRes = await api.get(`/api/characters?workId=${targetWorkId}`);
            setWorkContext({ ...wRes.data, characters: cRes.data });
          }
          if (docAction === 'edit' && targetId) {
            const res = await api.get(`/api/characters?workId=${targetWorkId}`);
            const char = res.data.find(c => String(c.id) === String(targetId));
            if (char) {
              setTitle(char.name || '');
              let dp = {};
              try { dp = JSON.parse(char.dynamicProperties || char._rawDynamic || "{}"); } catch (e) { }

              setThemeColor(dp.themeColor || char.themeColor || '#3b5bdb');
              setIsHidden(dp._isHidden || false);
              setCardLabels({ label1: dp._cardLabel1 || '나이', label2: dp._cardLabel2 || '성격' });
              setRawText(dp.pageBody?.rawText || '');

              const merged = { ...char, ...dp };
              if (char.age) merged['나이'] = char.age;
              if (char.birthday) merged['생일'] = char.birthday;
              if (char.gender) merged['성별'] = char.gender;
              if (char.species) merged['종족'] = char.species;

              const pOrder = dp._propOrder || [];
              const extractedProps = [];
              const renderKeys = new Set();

              pOrder.forEach(k => {
                if (merged[k] !== undefined && !k.startsWith('_') && !SYSTEM_PROPS.includes(k)) {
                  extractedProps.push({ key: k, val: merged[k] });
                  renderKeys.add(k);
                }
              });

              for (const k in merged) {
                if (!renderKeys.has(k) && !k.startsWith('_') && !SYSTEM_PROPS.includes(k)) {
                  extractedProps.push({ key: k, val: merged[k] });
                }
              }

              if (!extractedProps.some(p => p.key === '부제목')) {
                extractedProps.unshift({ key: '부제목', val: '' });
              } else {
                const subIdx = extractedProps.findIndex(p => p.key === '부제목');
                const subProp = extractedProps.splice(subIdx, 1)[0];
                extractedProps.unshift(subProp);
              }

              if (dp._switchTarget) {
                extractedProps.push({ key: '_switchTarget', val: dp._switchTarget });
              }

              setCharProps(extractedProps);
            }
          } else {
            setCharProps([
              { key: '부제목', val: '' }, { key: '나이', val: '' }, { key: '성별', val: '여성' },
              { key: '종족', val: '인간(人間)' }, { key: '관계', val: '일반' }
            ]);
            setIsHidden(false);
          }
        }
      } catch (err) {
        console.error(`[useEditorFetch] 원장 서버 패치 에러 발생:`, err);
        alert("데이터 로드 중 통신 장애가 감지되었습니다.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [docType, docAction, targetId, targetWorkId]);
};