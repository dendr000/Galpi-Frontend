// Copyright (c) dendr000. MIT License.
// 갈피 마크다운(전용 문법 + 매크로)을 화면에 그릴 HTML 문자열로 바꾸는 순수 파이프라인.
// MarkdownRenderer(화면)와 공개용 내보내기가 같은 결과를 쓰도록 한 곳에 둔다. DOMParser 가 필요한 브라우저 환경용.
import { marked } from 'marked';
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

export const renderMarkdownHtml = (rawText, startH1 = 1) => {
  if (!rawText) return '';

  const parsedText = parseWikiText(rawText);
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
};
