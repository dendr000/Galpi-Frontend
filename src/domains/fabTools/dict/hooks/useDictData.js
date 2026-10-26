// src/domains/fabTools/dict/hooks/useDictData.js
import { useState, useEffect } from 'react';
import api from '../../../../api/axiosCore';
import { parseBulkDict } from '../utils/dictParser';
import { upsertEntryLocal, removeEntryLocal, forceReseedDict } from '../../../../utils/dictLocalDb';

// onDataChanged: 저장/수정/삭제/일괄등록이 성공한 뒤 호출되는 콜백. 검색 결과를 서버에서 다시 불러와 갱신하는 용도.
// ★ 사전은 이제 작품 구분 없는 전역 단일 사전이라 workId를 안 받는다. 대신 등록/수정/삭제가
// 성공할 때마다 Alt+H가 참조하는 IndexedDB 로컬 캐시도 같이 갱신해서, 페이지를 새로고침하지
// 않아도 방금 고친 내용이 바로 순환 치환에 반영되게 한다.
export const useDictData = ({ showToast, onDataChanged }) => {
  const [dictInput, setDictInput] = useState({ word: '', trans: '' });
  const [editingTarget, setEditingTarget] = useState(null);
  const [dictBulk, setDictBulk] = useState('');
  const [isDictBulkMode, setIsDictBulkMode] = useState(false);

  // ★ 추가: 모달이 열릴 때 드래그된 텍스트가 있다면 '원문' 인풋에 자동 바인딩
  useEffect(() => {
    const draftWord = localStorage.getItem('galpi-draft-dict-word');
    if (draftWord) {
      setDictInput(prev => ({ ...prev, word: draftWord }));
      localStorage.removeItem('galpi-draft-dict-word');
      setEditingTarget(null);
      setIsDictBulkMode(false);
    }
  }, []);

  const handleDictSave = async () => {
    const word = dictInput.word.trim();
    const trans = dictInput.trans.trim();
    if (!word || !trans) return alert("원문 단어와 치환 데이터를 채워넣어 주십시오.");

    try {
      if (editingTarget) {
        await api.delete(`/api/dicts?word=${encodeURIComponent(editingTarget.word)}&translation=${encodeURIComponent(editingTarget.translation)}`);
        await removeEntryLocal(editingTarget.word, editingTarget.translation);
      }

      const res = await api.post('/api/dicts', { word, translation: trans });
      await upsertEntryLocal(res.data);

      setDictInput({ word: '', trans: '' });
      setEditingTarget(null);
      showToast(editingTarget ? "사전 데이터가 수정되었습니다." : "사전 데이터베이스에 저장 완료되었습니다.");
      onDataChanged?.();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDictBulk = async () => {
    if (!dictBulk.trim()) return alert("텍스트 파일 블록이 공백 상태입니다.");

    const parsedData = parseBulkDict(dictBulk);
    // 중복 여부는 서버(saveBulkDicts)가 word+translation 기준으로 이미 걸러줌
    const payloads = parsedData.map(({ word, translation }) => ({ word, translation }));

    if (payloads.length > 0) {
      try {
        await api.post('/api/dicts/bulk', payloads);
        setDictBulk('');
        setIsDictBulkMode(false);
        showToast(`총 ${payloads.length}개의 어휘 묶음 처리가 종료되었습니다.`);
        // 일괄 등록은 실제로 몇 건이 새로 들어갔는지 알 수 없어 항목별로 로컬 캐시를 갱신하기
        // 애매하다 — 전체를 다시 적재해서 확실하게 맞춘다.
        await forceReseedDict(api);
        onDataChanged?.();
      } catch (e) {
        console.error(e);
      }
    } else {
      alert("추출 가능한 문법 구문 패턴이 없습니다.");
    }
  };

  const handleDelete = async (d) => {
    if (window.confirm(`[${d.word}(${d.translation})] 고유 어휘 쌍을 사전에서 소각하시겠습니까?`)) {
      try {
        await api.delete(`/api/dicts?word=${encodeURIComponent(d.word)}&translation=${encodeURIComponent(d.translation)}`);
        await removeEntryLocal(d.word, d.translation);
        showToast("사전 색인이 말소 처리되었습니다.");
        onDataChanged?.();
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleEditClick = (d) => {
    setDictInput({ word: d.word, trans: d.translation });
    setEditingTarget(d);
    setIsDictBulkMode(false);
  };

  const handleCancelEdit = () => {
    setDictInput({ word: '', trans: '' });
    setEditingTarget(null);
  };

  return {
    dictInput, setDictInput,
    editingTarget,
    dictBulk, setDictBulk,
    isDictBulkMode, setIsDictBulkMode,
    handleDictSave, handleDictBulk, handleDelete, handleEditClick, handleCancelEdit
  };
};
