// Copyright (c) dendr000. MIT License.
// 공개용 내보내기에 쓸 데이터(model)를 준비한다: 화면에 보이는 캐릭터와 그룹, 기밀 처리, 이미지, 본문 HTML 변환과 정화.
// 이미지를 불러오는 함수(loadImage)는 바깥에서 받아 시험에서 바꿔 끼울 수 있게 한다.
import { extractMeta } from '../../../utils/markdownParser';
import { sanitizeFilenameTitle } from '../../../utils/filenameSanitizer';
import { renderMarkdownHtml } from '../../macro/utils/renderMarkdownHtml';
import { getVisibleCharacters, buildCharacterGroups, getGroupOrderArray, getMultiGroupMode } from '../../character/characterGroups';
import { parseRatingAxes, parseRatingScale, getRatings } from '../../character/ratings';
import { isClassified } from '../../character/classified';
import { getAffiliationMembers } from '../organization';
import { sanitizeExportHtml } from './sanitizeExportHtml';
import { inlineLocalImages } from './inlineImages';

// 속성 표에 넣지 않는 이름: 시스템이 붙이는 값, 부제목(따로 보여 줌), 기밀 표시(도장으로 보여 줌)
const SKIP_PROPS = new Set(['작품명', '제작자', '부제목', '기밀']);
const EMPTY_VALUES = new Set(['불명', '미상', 'undefined']);

const getProps = (c) => {
  const out = [];
  for (const key of Array.isArray(c._propOrder) ? c._propOrder : []) {
    if (typeof key !== 'string' || key.startsWith('_') || SKIP_PROPS.has(key)) continue;
    const raw = key === '나이' && c.age ? c.age : c[key];
    if (raw === undefined || raw === null) continue;
    const text = String(raw);
    if (text.trim() === '' || EMPTY_VALUES.has(text.trim())) continue;
    out.push([key, text.split(',').map((s) => s.trim().replace(/^\*/, '')).join(', ')]);
  }
  return out;
};

const getDetailMarkdown = (c) => {
  try {
    if (c.pageBody?.rawText) return c.pageBody.rawText;
    if (c.pageBodyRaw) return c.pageBodyRaw;
    if (c._rawDynamic) {
      const d = JSON.parse(c._rawDynamic);
      if (d.pageBody?.rawText) return d.pageBody.rawText;
    }
  } catch (e) { /* 깨진 본문은 상세 없음으로 둔다 */ }
  return '';
};

export const prepareExportModel = async ({
  work, characters, wikiPages, formSwaps, groupCriteria, sortKey, sortDir, options, loadImage, today,
}) => {
  const parsed = extractMeta(work.description || '');
  const meta = parsed.meta;
  const withImages = !!options.images;
  const imageLoader = withImages ? loadImage : async () => '';

  // 마크다운 -> HTML -> 정화 -> 로컬 이미지 처리(포함이면 데이터 주소, 아니면 제거)
  const renderBody = async (md, startH1 = 1) => inlineLocalImages(sanitizeExportHtml(renderMarkdownHtml(md, startH1)), imageLoader);

  const axes = parseRatingAxes(meta.ratingAxes);
  const scale = parseRatingScale(meta.ratingScale);
  const charExt = String(meta.charExt || 'png').replace(/^\./, '');
  const workTitle = sanitizeFilenameTitle(work.title || '작품');

  // 보이는 캐릭터(숨김 제외, 폼 스왑 반영). 기밀 제외 옵션이면 여기서 뺀다(이름도 어디에도 나가지 않음)
  let { displayChars } = getVisibleCharacters(characters, formSwaps);
  if (options.classified === 'exclude') displayChars = displayChars.filter((c) => !isClassified(c));

  const { groupedChars, sortedGroupNames } = buildCharacterGroups({
    chars: displayChars, allCharacters: characters, groupCriteria,
    groupOrderArray: getGroupOrderArray(meta, groupCriteria), sortKey, sortDir,
    multiGroupMode: getMultiGroupMode(meta),
  });

  // 캐릭터 한 명의 내보내기 정보는 한 번만 만들고 여러 그룹이 함께 쓴다
  const built = new Map();
  const buildChar = async (c) => {
    if (built.has(c.id)) return built.get(c.id);
    const secret = isClassified(c);
    const masked = secret && options.classified === 'mask';
    let out;
    if (masked) {
      out = { id: c.id, name: c.name, subtitle: '', imgSrc: '', props: [], badges: [], detailHtml: '', masked: true, secret: true };
    } else {
      const imgUrl = `/img/character/${encodeURIComponent(`${workTitle}_${sanitizeFilenameTitle(c.name)}.${charExt}`)}`;
      const detailMd = getDetailMarkdown(c);
      out = {
        id: c.id,
        name: c.name,
        subtitle: c['부제목'] ? String(c['부제목']) : '',
        imgSrc: withImages ? await loadImage(imgUrl) : '',
        props: getProps(c),
        badges: getRatings(c, axes, scale).map((r) => ({ abbr: r.abbr, level: r.level, title: r.title })),
        detailHtml: detailMd ? await renderBody(detailMd) : '',
        masked: false,
        secret,
      };
    }
    built.set(c.id, out);
    return out;
  };

  const groups = [];
  for (const name of sortedGroupNames) {
    const chars = [];
    for (const c of groupedChars[name]) chars.push(await buildChar(c));
    groups.push({ name, chars });
  }

  let pages = [];
  if (options.pages) {
    for (const p of Array.isArray(wikiPages) ? wikiPages : []) {
      pages.push({
        id: p.id,
        title: p.title,
        html: p.content ? await renderBody(p.content) : '',
        members: getAffiliationMembers(displayChars, p.title).map((m) => ({ id: m.id, name: m.name })),
      });
    }
  }

  const coverSrc = withImages && meta.coverExt
    ? await loadImage(`/img/cover/${encodeURIComponent(`${workTitle}.${String(meta.coverExt).replace(/^\./, '')}`)}`, { maxWidth: 960 })
    : '';

  return {
    title: work.title || '',
    creator: work.creator || '',
    genre: work.genre || '',
    status: work.status || '',
    coverSrc,
    overviewHtml: meta.overview ? await renderBody(meta.overview) : '',
    settingsHtml: parsed.clean ? await renderBody(parsed.clean, 3) : '',
    ratings: { axes, scale },
    groups,
    pages,
    generatedAt: today,
  };
};
