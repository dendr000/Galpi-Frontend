// src/store/useSettingStore.js
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { SETTINGS_VERSION, migrateSettings } from '../utils/layoutWidth';

const useSettingStore = create(
  persist(
    (set) => ({
      // --- 화면 (Appearance) ---
      fontSize: '14', lineHeight: '1.8', fontFamily: 'default', layoutWidth: 'full',
      isCustomCursor: false,
      cursorColor: '#3b5bdb', // ★ 커스텀 커서 색상 (기본값: 메인 파랑)
      panelLeftOpen: true, panelRightOpen: true, // 작품 페이지 양옆 패널(문서 트리, 목차)을 본문 옆에 붙여 둘지. 창이 좁으면 값과 무관하게 접힌다
      isStarryBackground: false, // 분류(장르)와 무관하게 헤더 설정에서 켜는 전역 밤하늘 배경
      
      // --- 에디터 (Editor) ---
      autoSaveInterval: '3', bossKey: 'Alt+X', blindTheme: 'aurora',

      isBlindActive: false, // 블라인드 모드 활성화 여부
      
      updateSetting: (key, value) => set({ [key]: value }),
      toggleBlind: () => set((state) => ({ isBlindActive: !state.isBlindActive })),
    }),
    {
      name: 'galpi-settings', // 로컬 스토리지에 자동 저장/불러오기
      version: SETTINGS_VERSION,
      migrate: migrateSettings,
    }
  )
);

export default useSettingStore;