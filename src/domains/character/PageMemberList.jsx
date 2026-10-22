// Copyright (c) dendr000. MIT License.
// 하위 문서(조직 소개 등) 아래에 그 문서 제목과 같은 소속의 인물을 카드로 모아 보여 주는 목록.
// 카드를 누르면 작품 페이지에서 그 캐릭터가 선택된 상태로 열린다(?charId=).
import React from 'react';
import { sanitizeFilenameTitle } from '../../utils/filenameSanitizer';
import { getPropValue } from './characterSort';
import ClassifiedStamp from './ClassifiedStamp';
import { NO_CLASSIFIED } from './classified';

const PageMemberList = ({ members, workId, work, charExt, navigate, styles, sortKey, classified = NO_CLASSIFIED }) => {
  if (!members || members.length === 0) return null;
  const ext = String(charExt || 'png').replace(/^\./, '');
  const workTitle = sanitizeFilenameTitle(work?.title || '작품');

  return (
    <section id="sec-page-members" className={styles.wikiSection}>
      <div className={`${styles.sectionHeader} gt-section-header`}>
        <h2 id="sec-members" className={`${styles.sectionHeaderTitle} gt-section-title auto-toc-target`}>
          소속 인물 ({members.length})
        </h2>
      </div>
      <div className={styles.characterGridContainer}>
        {members.map((c) => {
          const src = `/img/character/${encodeURIComponent(`${workTitle}_${sanitizeFilenameTitle(c.name)}.${ext}`)}`;
          const sortValue = sortKey ? getPropValue(c, sortKey) : '';
          const concealed = classified.isConcealed(c);
          return (
            <div
              key={c.id}
              id={`member-card-${c.id}`}
              className={`${styles.noteCard} gt-card`}
              onClick={() => navigate(`/work/${workId}?charId=${c.id}`)}
            >
              <div className={`${styles.cardImgWrap} gt-card-img`}>
                <img
                  src={src}
                  alt={c.name}
                  data-concealed={concealed ? '' : undefined}
                  style={concealed ? { filter: 'blur(9px)' } : undefined}
                  onError={(e) => { e.target.style.display = 'none'; e.target.parentElement.style.background = 'var(--table-bg-alt)'; }}
                />
                {classified.isClassified(c) && <ClassifiedStamp style={{ position: 'absolute', top: '8px', right: '8px' }} />}
              </div>
              <h4 style={{ margin: '10px 0 4px 0', color: 'var(--primary-color)', fontSize: '15px', fontWeight: 900 }}>{c.name}</h4>
              {sortKey && sortValue ? (
                <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)', ...(concealed ? { filter: 'blur(6px)', userSelect: 'none' } : null) }}>{`${sortKey} ${sortValue}`}</div>
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default PageMemberList;
