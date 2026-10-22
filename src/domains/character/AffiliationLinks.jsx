// Copyright (c) dendr000. MIT License.
// 소속 값을 쉼표 단위로 보여 주되, 같은 제목의 하위 문서가 있는 값은 그 문서로 이동하는 링크로 그린다.
import React from 'react';
import { splitAffiliations, findAffiliationPage } from '../work/organization';

// 글자색은 부모를 따른다(inherit): 장르 테마가 카드/표 글자색을 따로 정해 두므로 링크만 파랗게 하면 어두운 테마에서 안 읽힌다.
// 링크라는 표시는 점선 밑줄로 한다.
const linkStyle = { color: 'inherit', cursor: 'pointer', textDecoration: 'underline', textDecorationStyle: 'dotted', textUnderlineOffset: '2px' };

const AffiliationLinks = ({ value, wikiPages, onOpenPage }) => {
  const parts = splitAffiliations(value);
  return (
    <>
      {parts.map((p, i) => {
        const page = p.plain ? undefined : findAffiliationPage(wikiPages, p.text);
        return (
          <React.Fragment key={`${p.text}-${i}`}>
            {i > 0 && ', '}
            {page ? (
              <a
                href="#"
                className="wiki-affiliation-link"
                style={linkStyle}
                onClick={(e) => {
                  // 카드 안에서 눌러도 카드 선택이 바뀌지 않게 하고, 주소 이동은 앱 안 이동으로만 처리한다
                  e.preventDefault();
                  e.stopPropagation();
                  onOpenPage(page.id);
                }}
              >
                {p.text}
              </a>
            ) : (
              p.text
            )}
          </React.Fragment>
        );
      })}
    </>
  );
};

export default AffiliationLinks;
