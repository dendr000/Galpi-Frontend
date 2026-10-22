// Copyright (c) dendr000. MIT License.
// 작품 페이지를 공개용 단일 HTML 파일로 만든다: 데이터 준비 -> HTML 조립. 내려받기는 downloadFile 이 맡는다.
import { sanitizeFilenameTitle } from '../../../utils/filenameSanitizer';
import { prepareExportModel } from './prepareExportModel';
import { buildExportHtml } from './exportHtml';
import { imageToDataUri } from './imageToDataUri';

export const exportFilename = (title) => `${sanitizeFilenameTitle(title || '작품')}.html`;

// 한국 시간(UTC+9) 기준 YYYY-MM-DD
export const todayString = (now = new Date()) => new Date(now.getTime() + 9 * 3600 * 1000).toISOString().slice(0, 10);

export const exportWorkHtml = async ({ loadImage = imageToDataUri, today = todayString(), ...rest }) => {
  const model = await prepareExportModel({ ...rest, loadImage, today });
  return { filename: exportFilename(rest.work.title), html: buildExportHtml(model) };
};
