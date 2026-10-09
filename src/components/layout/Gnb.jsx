// 파일 위치: src/components/layout/Gnb.jsx
import { useNavigate, useLocation } from 'react-router-dom';
import { IconGear, IconPalette, IconMoon, IconPlus } from '../common/icons/DomainIcons';
import api from '../../api/axiosCore';
import { cycleWorkTheme, THEME_LABELS } from '../../domains/work/genreTheme';
import HeaderSearch from './search/HeaderSearch';

// App.jsx에서 setIsSettingOpen 함수를 넘겨받습니다.
const Gnb = ({ setIsSettingOpen }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const isWorkPage = /^\/work\/\d+/.test(location.pathname);

  const toggleDark = () => {
    const isDark = document.body.getAttribute('data-theme') === 'dark';
    document.body.setAttribute('data-theme', isDark ? 'light' : 'dark');
    localStorage.setItem('wiki-theme', isDark ? 'light' : 'dark');
  };

  // 팔레트 버튼: 이 작품의 분류에 어울리는 테마들을 순서대로 순환시킨다 (자동 → 테마1 → 테마2 → ... → 자동).
  // 분류에 해당하는 테마가 하나도 없으면 안내만 하고 아무것도 바꾸지 않는다.
  const handlePaletteClick = async () => {
    if (!isWorkPage) return;
    const workId = location.pathname.match(/^\/work\/(\d+)/)?.[1];
    if (!workId) return;

    const row = document.getElementById('galpi-theme-row');
    try {
      const { data: work } = await api.get(`/api/works/${workId}`);
      const result = await cycleWorkTheme(work);
      if (!result) {
        alert('이 작품 분류엔 아직 준비된 테마가 없어요.');
        return;
      }
      window.dispatchEvent(new CustomEvent('galpi-theme-cycled', { detail: { workId, ...result } }));
      if (row) {
        row.classList.remove('galpi-theme-pulse');
        void row.offsetWidth; // 리플로우 강제: 같은 클래스를 다시 붙여도 애니메이션이 재생되도록
        row.classList.add('galpi-theme-pulse');
      }
      console.log(`[Gnb] 테마 순환: ${THEME_LABELS[result.theme] || result.theme}`);
    } catch (e) {
      console.error('[Gnb] 테마 순환 실패', e);
    }
  };

  return (
    <header style={{ height: '60px', background: 'var(--surface-color)', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', position: 'sticky', top: 0, zIndex: 1000, boxShadow: 'var(--shadow-sm)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        <h2 style={{ margin: 0, color: 'var(--primary-color)', cursor: 'pointer', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '8px' }} onClick={() => navigate('/')}>
          <img src="/img/svg/ci.svg" alt="Galpi CI 로고" style={{ height: '24px' }} onError={(e) => e.target.style.display='none'} />
          갈피(galpi)
        </h2>
      </div>
      
      {/* 중앙 검색창: 입력하면 관련 작품이 아래로 추천된다 */}
      <HeaderSearch />

      {/* 우측 컨트롤 및 버튼 영역 (전면 SVG 벡터 아이콘 적용) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
        <button onClick={() => setIsSettingOpen(true)} style={iconBtnStyle} title="환경 설정">
          <IconGear size={20} color="var(--text-secondary)" />
        </button>
        <button
          onClick={handlePaletteClick}
          style={{ ...iconBtnStyle, opacity: isWorkPage ? 1 : 0.35, cursor: isWorkPage ? 'pointer' : 'not-allowed' }}
          title={isWorkPage ? '이 작품의 테마 변경' : '작품 페이지에서 사용할 수 있습니다'}
        >
          <IconPalette size={20} color="var(--text-secondary)" />
        </button>
        <button onClick={toggleDark} style={iconBtnStyle} title="다크 모드 전환">
          <IconMoon size={20} color="var(--text-secondary)" />
        </button>
        <button className="wiki-btn" onClick={() => navigate('/edit?type=work&action=new')} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '6px', fontWeight: 'bold' }}>
          <IconPlus size={16} /> 새 작품 등록
        </button>
      </div>
    </header>
  );
};

const iconBtnStyle = { background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '4px' };
export default Gnb;