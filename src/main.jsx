import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import './styles/global.css'

// 추후 기존 common.css 역할을 할 전역 CSS를 여기에 연결합니다.
// import './styles/global.css'

// Gnb.jsx의 테마 토글은 localStorage('wiki-theme')에 저장만 하고 아무도 다시 읽지 않아서,
// 앱을 새로 열 때마다(특히 exe 재시작 시) 항상 기본값(라이트)으로 돌아가는 문제가 있었다.
// React가 첫 렌더를 하기 전에 여기서 미리 body에 적용해 깜빡임 없이 복원한다.
if (localStorage.getItem('wiki-theme') === 'dark') {
  document.body.setAttribute('data-theme', 'dark');
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)