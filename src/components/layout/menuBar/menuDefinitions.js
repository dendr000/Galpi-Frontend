// Copyright (c) dendr000. MIT License.
// 상단 메뉴 바의 구성(파일, 편집, 보기, 설정)과 각 항목의 활성 조건, 실행 동작을 정한다.
// 순수 함수라서 화면 없이 시험할 수 있다. 실제 동작(이동, 설정 변경 등)은 actions 로 받아 기존 기능을 그대로 부른다.
import { newPageUrl } from '../../../domains/work/newPageUrl';

// 주소에서 작품 번호와(하위 문서를 보는 중이면) 문서 번호를 읽는다. 작품 페이지가 아니면 둘 다 null.
export const parseWorkRoute = (pathname, search) => {
  const m = /^\/work\/(\d+)(?:\/|$)/.exec(pathname || '');
  if (!m) return { workId: null, pageId: null };
  const pageId = new URLSearchParams(search || '').get('pageId');
  return { workId: m[1], pageId: pageId || null };
};

const item = (id, label, extra = {}) => ({ kind: 'item', id, label, ...extra });
const check = (id, label, checked, extra = {}) => ({ kind: 'check', id, label, checked: !!checked, ...extra });
const sep = (id) => ({ kind: 'separator', id });

export const buildMenus = ({ pathname, search, settings, isDark, debugOn, canFind, actions }) => {
  const { workId, pageId } = parseWorkRoute(pathname, search);
  const noWork = !workId;
  const { layoutWidth, panelLeftOpen, panelRightOpen } = settings;

  return [
    {
      id: 'file', label: '파일', items: [
        item('new-work', '새 작품', { onSelect: () => actions.navigate('/edit?type=work&action=new') }),
        item('new-page', '새 문서', { disabled: noWork, onSelect: () => actions.navigate(newPageUrl(workId)) }),
        item('new-char', '새 캐릭터', { disabled: noWork, onSelect: () => actions.navigate(`/edit?type=char&action=new&workId=${workId}`) }),
        sep('file-sep-1'),
        // 공개용 HTML 내보내기는 작품 첫 화면의 기능이다(하위 문서 화면에는 없다)
        item('export', '공개용 HTML 내보내기', { disabled: noWork || !!pageId, onSelect: () => actions.exportWork() }),
        item('bulk', '일괄 편집', { disabled: noWork, onSelect: () => actions.navigate(`/bulk?workId=${workId}`) }),
      ],
    },
    {
      id: 'edit', label: '편집', items: [
        item('edit-work', '이 작품 수정', { disabled: noWork, onSelect: () => actions.navigate(`/edit?type=work&action=edit&id=${workId}`) }),
        item('edit-page', '이 문서 수정', { disabled: noWork || !pageId, onSelect: () => actions.navigate(`/edit?type=page&action=edit&workId=${workId}&id=${pageId}`) }),
        sep('edit-sep-1'),
        item('find', '찾기', { disabled: !canFind, shortcut: 'Ctrl+F', onSelect: () => actions.openFind() }),
      ],
    },
    {
      id: 'view', label: '보기', items: [
        check('panel-left', '왼쪽 패널 (문서 트리)', panelLeftOpen, { disabled: noWork, onSelect: () => actions.setSetting('panelLeftOpen', !panelLeftOpen) }),
        check('panel-right', '오른쪽 패널 (목차)', panelRightOpen, { disabled: noWork, onSelect: () => actions.setSetting('panelRightOpen', !panelRightOpen) }),
        sep('view-sep-1'),
        check('wide-limit', '본문 폭 제한', layoutWidth === 'center', { onSelect: () => actions.setSetting('layoutWidth', layoutWidth === 'center' ? 'full' : 'center') }),
        check('dark', '다크 모드', isDark, { onSelect: () => actions.toggleDark() }),
        item('cycle-theme', '작품 테마 바꾸기', { disabled: noWork, onSelect: () => actions.cycleTheme(workId) }),
      ],
    },
    {
      id: 'settings', label: '설정', items: [
        item('open-settings', '환경 설정', { onSelect: () => actions.openSettings() }),
        check('debug-logs', '콘솔 로그 보기', debugOn, { onSelect: () => actions.toggleDebug(!debugOn) }),
      ],
    },
  ];
};
