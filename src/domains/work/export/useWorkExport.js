// Copyright (c) dendr000. MIT License.
// 작품 페이지의 현재 상태(작품, 캐릭터, 문서, 분류와 정렬 선택)로 공개용 HTML 을 만들어 내려받는 함수를 돌려준다.
import { useCallback } from 'react';
import { exportWorkHtml } from './exportWork';
import { downloadTextFile } from './downloadFile';

export const useWorkExport = ({ work, characters, wikiPages, formSwaps, groupCriteria, sortKey, sortDir }) =>
  useCallback(
    async (options) => {
      const { filename, html } = await exportWorkHtml({ work, characters, wikiPages, formSwaps, groupCriteria, sortKey, sortDir, options });
      downloadTextFile(filename, html);
    },
    [work, characters, wikiPages, formSwaps, groupCriteria, sortKey, sortDir]
  );
