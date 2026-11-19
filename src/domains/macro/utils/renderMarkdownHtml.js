// Copyright (c) dendr000. MIT License.
// 갈피 마크다운(전용 문법 + 매크로)을 화면에 그릴 HTML 문자열로 바꾸는 순수 파이프라인.
// MarkdownRenderer(화면)와 공개용 내보내기가 같은 결과를 쓰도록 한 곳에 둔다. DOMParser 가 필요한 브라우저 환경용.
import { sanitizeExportHtml } from '../../work/export/sanitizeExportHtml';
import { Marked } from 'marked';
import { parseWikiText } from '../../../utils/markdownParser';
import {
  createRadarChartHtml,
  createRadarCompareHtml,
  createBarGraphHtml,
  createTimelineHtml,
  createRelationGraphHtml,
  createChatHtml,
  createSpoilerHtml,
  createAlignmentChartHtml,
  createLogTabHtml,
} from './macroGenerators';
import { processMarkdownHtml } from './htmlProcessor';

// 갈피의 취소선은 -- 이다. 표준 마크다운의 ~글~ 취소선은 "3~5명", "에~ 재밌다~" 같은 평범한 글을 지워 버리므로 끈다.
const md = new Marked({ breaks: true, tokenizer: { del() { return undefined; } } });

const LOGTAB_OPEN = '\uE010';
const LOGTAB_CLOSE = '\uE011';
const REL_OPEN = '\uE020';
const REL_CLOSE = '\uE021';
const REL_RE = new RegExp(`(?:<p>)?${REL_OPEN}(\\d+)${REL_CLOSE}(?:<\\/p>)?`, 'g');
const LOGTAB_RE = new RegExp(`(?:<p>)?${LOGTAB_OPEN}(\\d+)${LOGTAB_CLOSE}(?:<\\/p>)?`, 'g');

const stripTags = (s) => s.replace(/<[^>]*>?/gm, '');

// 위젯 매크로를 HTML 로 바꾼다. 본문과 로그탭 안쪽 둘 다 같은 규칙을 쓴다.
const applyMacros = (html, options) => {
  let out = html;
  out = out.replace(/(?:<p>)?\[스포일러\]([\s\S]*?)\[\/스포일러\](?:<\/p>)?/g, (m, content) => createSpoilerHtml(content));
  out = out.replace(/(?:<p>)?\[(대화|우대화):\s*(.*?)(?:\((.*?)\))?:\s*\]?([\s\S]*?)\[\/(?:대화|우대화)\](?:<br\s*\/?>)?(?:<\/p>)?/g,
    (m, type, name, expr, msg) => createChatHtml(type, name, expr, msg, options));

  out = out.replace(/(?:<p>)?\[스탯:(.*?)\](?:<\/p>)?/g, (m, p1) => createRadarChartHtml(stripTags(p1)));
  out = out.replace(/(?:<p>)?\[스탯비교:(.*?)\](?:<\/p>)?/g, (m, p1) => createRadarCompareHtml(stripTags(p1)));
  out = out.replace(/(?:<p>)?\[성향:(.*?)\](?:<\/p>)?/g, (m, p1) => createAlignmentChartHtml(stripTags(p1)));
  out = out.replace(/(?:<p>)?\[게이지:(.*?)\](?:<\/p>)?/g, (m, p1) => createBarGraphHtml(stripTags(p1)));
  out = out.replace(/(?:<p>)?\[TIMELINE\]([\s\S]*?)\[\/TIMELINE\](?:<\/p>)?/g, (m, content) => createTimelineHtml(content.replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]*>?/gm, '')));
  out = out.replace(/(?:<p>)?\[RELATION_GRAPH\]([\s\S]*?)\[\/RELATION_GRAPH\](?:<\/p>)?/g, (m, content) => createRelationGraphHtml(stripTags(content)));
  return out;
};

// options: { workTitle, charExt } 대화 매크로의 아바타 이미지 주소를 만들 때 쓴다.
export const renderMarkdownHtml = (rawText, startH1 = 1, options = {}) => {
  if (!rawText) return '';

  // 관계도 JSON 은 마크다운(굵게, 밑줄 등)을 거치면 글자가 바뀌므로 원문 그대로 맡아 두었다가 마지막에 그린다.
  const relations = [];
  const source = rawText.replace(/\[RELATION_GRAPH\]([\s\S]*?)\[\/RELATION_GRAPH\]/g, (m, json) => {
    relations.push(json);
    return `

${REL_OPEN}${relations.length - 1}${REL_CLOSE}

`;
  });

  // 로그탭은 본문을 따로 마크다운으로 바꿔서(굵게, 색, 링크, 표, 줄바꿈 유지) 끼워 넣는다.
  const logTabs = [];
  const parsedText = parseWikiText(source).replace(/\[로그탭:([^\]\n]*)\]([\s\S]*?)\[\/로그탭\]/g, (m, name, body) => {
    logTabs.push({ name: name.trim(), body });
    return `\n\n${LOGTAB_OPEN}${logTabs.length - 1}${LOGTAB_CLOSE}\n\n`;
  });

  let rawHtml = applyMacros(md.parse(parsedText), options);
  rawHtml = rawHtml.replace(LOGTAB_RE, (m, i) => {
    const tab = logTabs[Number(i)];
    return createLogTabHtml(tab.name, applyMacros(md.parse(tab.body.trim()), options), true);
  });

  rawHtml = rawHtml.replace(REL_RE, (m, i) => createRelationGraphHtml(relations[Number(i)].trim()));

  // 본문에 직접 쓴 HTML 의 스크립트와 이벤트 속성은 화면에서도 실행되지 않게 지운다.
  return sanitizeExportHtml(processMarkdownHtml(rawHtml, startH1));
};
