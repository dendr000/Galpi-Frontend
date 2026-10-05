import { describe, it, expect } from 'vitest';
import { ITEM_COUNT as library } from './LibraryScene';
import { ITEM_COUNT as starchart } from './StarChartScene';
import { ITEM_COUNT as terminal } from './TerminalScene';
import { ITEM_COUNT as trace } from './TraceScene';

// 로그인 게이트의 정답은 "몇 번째 항목"이라는 인덱스로 서버(Galpi-Backend)에 저장된다.
// 서버가 정답을 뽑을 때 쓰는 범위(AuthController.THEME_ITEM_COUNT)와 화면의 항목 수가
// 어긋나면, 화면에 존재하지 않는 항목이 정답이 되어 로그인이 영영 안 열린다.
// 이 값을 바꿀 때는 백엔드의 THEME_ITEM_COUNT와 AuthControllerTest도 같이 바꿔야 한다.
describe('로그인 시안별 항목 수 (백엔드 AuthController.THEME_ITEM_COUNT와 동일해야 함)', () => {
  it('서고의 등불: 24 (3줄 x 8칸)', () => expect(library).toBe(24));
  it('성좌표: 60 (6줄 x 10칸)', () => expect(starchart).toBe(60));
  it('터미널 침입: 8 (로그 8줄)', () => expect(terminal).toBe(8));
  it('흔적: 7', () => expect(trace).toBe(7));
});
