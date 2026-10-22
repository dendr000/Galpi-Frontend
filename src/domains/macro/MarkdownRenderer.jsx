// src/domains/macro/MarkdownRenderer.jsx
import React, { useMemo, useRef } from 'react';
import { marked } from 'marked';
import { parseWikiText } from '../../utils/markdownParser';

import { 
  createRadarChartHtml, 
  createRadarCompareHtml,
  createBarGraphHtml, 
  createTimelineHtml, 
  createRelationGraphHtml, 
  createChatHtml,
  createSpoilerHtml,
  createAlignmentChartHtml,
  createTabHtml,
  createLogTabHtml
} from './utils/macroGenerators';
import { processMarkdownHtml } from './utils/htmlProcessor';
import { useFootnoteTooltip } from './hooks/useFootnoteTooltip';
import { useHeadingFold } from './hooks/useHeadingFold';

const MarkdownRenderer = ({ rawText, onNodeClick, startH1 = 1 }) => {
  const containerRef = useRef(null);

  const renderedHtml = useMemo(() => {
    if (!rawText) return "";

    let parsedText = parseWikiText(rawText);
    let rawHtml = marked.parse(parsedText, { breaks: true });

    rawHtml = rawHtml.replace(/(?:<p>)?\[스포일러\]([\s\S]*?)\[\/스포일러\](?:<\/p>)?/g, (m, content) => createSpoilerHtml(content));
    rawHtml = rawHtml.replace(/(?:<p>)?\[(대화|우대화):\s*(.*?)(?:\((.*?)\))?:\s*\]?([\s\S]*?)\[\/(?:대화|우대화)\](?:<\/p>)?/g, (m, type, name, expr, msg) => createChatHtml(type, name, expr, msg));

    rawHtml = rawHtml.replace(/(?:<p>)?\[스탯:(.*?)\](?:<\/p>)?/g, (m, p1) => createRadarChartHtml(p1.replace(/<[^>]*>?/gm, ''))); 
    rawHtml = rawHtml.replace(/(?:<p>)?\[스탯비교:(.*?)\](?:<\/p>)?/g, (m, p1) => createRadarCompareHtml(p1.replace(/<[^>]*>?/gm, ''))); 
    rawHtml = rawHtml.replace(/(?:<p>)?\[성향:(.*?)\](?:<\/p>)?/g, (m, p1) => createAlignmentChartHtml(p1.replace(/<[^>]*>?/gm, ''))); 
    rawHtml = rawHtml.replace(/(?:<p>)?\[게이지:(.*?)\](?:<\/p>)?/g, (m, p1) => createBarGraphHtml(p1.replace(/<[^>]*>?/gm, ''))); 
    rawHtml = rawHtml.replace(/(?:<p>)?\[TIMELINE\]([\s\S]*?)\[\/TIMELINE\](?:<\/p>)?/g, (m, content) => createTimelineHtml(content.replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]*>?/gm, ''))); 
    rawHtml = rawHtml.replace(/(?:<p>)?\[RELATION_GRAPH\]([\s\S]*?)\[\/RELATION_GRAPH\](?:<\/p>)?/g, (m, content) => createRelationGraphHtml(content.replace(/<[^>]*>?/gm, '')));
    rawHtml = rawHtml.replace(/(?:<p>)?\[로그탭:(.*?)\]([\s\S]*?)\[\/로그탭\](?:<\/p>)?/g, (m, p1, p2) => createLogTabHtml(p1, p2.replace(/<[^>]*>?/gm, '')));

    return processMarkdownHtml(rawHtml, startH1);
  }, [rawText, startH1]);

  useFootnoteTooltip();
  useHeadingFold(containerRef, [renderedHtml]);

  if (!rawText) return null;

  return (
    <>
      <style>{`
        .markdown-body h2 { border-bottom: 1px solid var(--border-color); padding-bottom: 6px; margin-bottom: 14px; margin-top: 24px; }
        .markdown-body h3, .markdown-body h4 { border-bottom: 1px dashed var(--border-color); padding-bottom: 4px; margin-bottom: 12px; margin-top: 20px; }
        .markdown-body h2:first-child, .markdown-body h3:first-child { margin-top: 0; }
        .galpi-spoiler { background-color: #111; color: #111; cursor: pointer; padding: 2px 6px; border-radius: 4px; font-weight: bold; transition: color 0.3s ease; }
        .galpi-spoiler:hover { color: #fff; }
        
        /* ★ 백링크(하이퍼링크) 텍스트 강제 제어 (밑줄 삭제, 순수 파란 텍스트) */
        .wiki-backlink { 
          color: var(--primary-color) !important; 
          font-weight: 900; 
          text-decoration: none !important; 
          border-bottom: none !important; 
          cursor: pointer; 
          transition: opacity 0.2s ease; 
        }
        .wiki-backlink:hover { opacity: 0.6; }
      `}</style>
      <div 
        ref={containerRef}
        className="markdown-body" 
        dangerouslySetInnerHTML={{ __html: renderedHtml }} 
        onClick={(e) => {
          if (e.target.classList.contains('wiki-backlink') && onNodeClick) {
            onNodeClick(e.target.textContent);
          }
        }}
      />
    </>
  );
};

export default MarkdownRenderer;