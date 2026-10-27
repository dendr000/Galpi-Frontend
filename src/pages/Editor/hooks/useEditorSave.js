// 파일 위치: src/pages/Editor/hooks/useEditorSave.js
import { useNavigate } from 'react-router-dom';
import api from '../../../api/axiosCore';
import { extractMeta } from '../../../utils/markdownParser';
import { carryOverCharacterSystemProps } from '../../../domains/character/characterOrder';
import { applyRatingMeta } from '../../../domains/character/ratings';
import { applyMultiGroupMeta } from '../../../domains/character/characterGroups';

export const useEditorSave = ({
  docType, docAction, targetId, targetWorkId, searchParams,
  title, rawText, overviewText, workMeta, charProps,
  themeColor, cardLabels, workContext, isHidden, setSaveStatus
}) => {
  const navigate = useNavigate();

  const handleGoBack = () => {
    if (targetWorkId && targetWorkId !== 'null') {
      if (docType === 'page' && targetId) navigate(`/work/${targetWorkId}?pageId=${targetId}`);
      else navigate(`/work/${targetWorkId}`);
    } else if (targetId && docType === 'work') {
      navigate(`/work/${targetId}`);
    } else {
      navigate(-1);
    }
  };

  const handleSave = async (isAutoSave = false) => {
    if (!title.trim()) {
        if (!isAutoSave) alert("제목을 입력해주세요.");
        return;
    }

    setSaveStatus('saving');

    try {
      if (docType === 'work') {
        const meta = applyMultiGroupMeta(applyRatingMeta({
          ...workMeta.originalMeta,
          alias: workMeta.alias, charExt: workMeta.charExt || 'png', coverExt: workMeta.coverExt, overview: overviewText,
        }, workMeta), workMeta);

        const validVariants = workMeta.imgVariants.filter(v => v.trim() !== '');
        if (validVariants.length > 0) meta.imgVariants = validVariants;

        const goObj = {};
        workMeta.groupOrderStr.split('\n').forEach(line => {
          const parts = line.split(':');
          if (parts.length >= 2) {
            const k = parts[0].trim();
            const vals = parts[1].split(',').map(v => v.trim()).filter(v => v !== "");
            if (k && vals.length > 0) goObj[k] = vals;
          }
        });
        if (Object.keys(goObj).length > 0) meta._groupOrder = goObj;

        const finalDesc = `[META_DATA:${JSON.stringify(meta)}]\n${rawText}`;
        const payload = {
          title, description: finalDesc, creator: workMeta.creator, genre: workMeta.genre, status: workMeta.status,
          checkDate: new Date().toLocaleDateString('ko-KR')
        };

        if (docAction === 'edit') {
          await api.put(`/api/works/${targetId}`, { ...payload, id: targetId });
          if (!isAutoSave) navigate(`/work/${targetId}`);
        } else if (!isAutoSave) {
          const res = await api.post('/api/works', payload);
          navigate(`/work/${res.data.id}`);
        }
      }
      else if (docType === 'page') {
        const payload = { title, content: rawText, workId: parseInt(targetWorkId) };
        const pId = searchParams.get('parentId');
        if (pId && pId !== 'null') payload.parentId = parseInt(pId);

        if (docAction === 'edit') {
          await api.put(`/api/wikipages/${targetId}`, { ...payload, id: targetId });
          if (!isAutoSave) navigate(`/work/${targetWorkId}?pageId=${targetId}`);
        } else if (!isAutoSave) {
          const res = await api.post('/api/wikipages', payload);
          navigate(`/work/${targetWorkId}?pageId=${res.data.id}`);
        }
      }
      else if (docType === 'char') {
        let dp = {
          pageBody: { rawText }, themeColor, _cardLabel1: cardLabels.label1, _cardLabel2: cardLabels.label2,
        };
        let originalChar = {};
        try {
          if (docAction === 'edit' && targetId) {
            const res = await api.get(`/api/characters?workId=${targetWorkId}`);
            const char = res.data.find(c => String(c.id) === String(targetId));
            if (char && char.dynamicProperties) {
              originalChar = JSON.parse(char.dynamicProperties);
              carryOverCharacterSystemProps(dp, originalChar);
            }
          }
        } catch (e) {
          console.warn("[useEditorSave] 원본 시스템 속성 파싱 실패:", e);
        }

        const payload = { workId: targetWorkId, name: title };
        const pOrder = [];

        charProps.forEach(p => {
          if (!p.key.trim() || !p.val.trim()) return;
          let val = p.val.trim();
          if (p.key === '나이' && /^\d+(\.\d+)?$/.test(val)) val += '세';

          if (p.key === '나이') payload.age = val;
          if (p.key === '생일') payload.birthday = val;
          if (p.key === '성별') payload.gender = val;
          if (p.key === '종족') payload.species = val;

          dp[p.key] = val;
          pOrder.push(p.key);
        });

        pOrder.push("작품명", "제작자");
        dp["작품명"] = workContext ? workContext.title : "";
        dp["제작자"] = workContext ? (workContext.creator || "미상") : "미상";
        dp._propOrder = pOrder;

        const cExt = workContext ? (extractMeta(workContext.description).meta.charExt || 'png') : 'png';
        payload.imageCode = `${workContext?.title || '불명'}_${title}.${cExt}`;
        dp._isHidden = isHidden;
        payload.dynamicProperties = JSON.stringify(dp);

        if (docAction === 'edit') {
          await api.put(`/api/characters/${targetId}`, { ...payload, id: targetId });
          if (!isAutoSave) navigate(`/work/${targetWorkId}`);
        } else if (!isAutoSave) {
          await api.post('/api/characters', payload);
          navigate(`/work/${targetWorkId}`);
        }
      }

      if (isAutoSave) {
          setSaveStatus('saved');
          setTimeout(() => setSaveStatus(''), 2500);
      }

    } catch (err) {
      setSaveStatus('error');
      if (!isAutoSave) alert("저장 처리에 실패했습니다.");
    }
  };

  return { handleGoBack, handleSave };
};