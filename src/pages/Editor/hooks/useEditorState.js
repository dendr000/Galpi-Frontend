// 파일 위치: src/pages/Editor/hooks/useEditorState.js
import { useState, useRef } from 'react';

export const useEditorState = () => {
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState(''); // '', 'saving', 'saved', 'error'
  
  const [title, setTitle] = useState('');
  const [rawText, setRawText] = useState('');
  const [overviewText, setOverviewText] = useState('');

  const [workMeta, setWorkMeta] = useState({
    creator: '', genre: '', status: '진행 전', alias: '', 
    coverExt: '', charExt: 'png', groupOrderStr: '', ratingAxesStr: '', ratingScaleStr: '',
    imgVariants: [''], originalMeta: {}
  });

  const [charProps, setCharProps] = useState([]);
  const [themeColor, setThemeColor] = useState('#3b5bdb');
  const [cardLabels, setCardLabels] = useState({ label1: '나이', label2: '성격' });
  const [workContext, setWorkContext] = useState(null);
  const [isHidden, setIsHidden] = useState(false);
  const [fontList, setFontList] = useState([]); // ★ 동적 폰트 리스트 상태 추가

  const editorRef = useRef(null);

  return {
    loading, setLoading,
    saveStatus, setSaveStatus,
    title, setTitle,
    rawText, setRawText,
    overviewText, setOverviewText,
    workMeta, setWorkMeta,
    charProps, setCharProps,
    themeColor, setThemeColor,
    cardLabels, setCardLabels,
    workContext, setWorkContext,
    isHidden, setIsHidden,
    fontList, setFontList, // ★ 반환값에 폰트 세터 추출
    editorRef
  };
};