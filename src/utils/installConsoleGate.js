// Copyright (c) dendr000. MIT License.
// 앱이 시작될 때 가장 먼저 불러와서(main.jsx 의 첫 import) 다른 파일이 시작하며 남기는 로그도 걸러지게 한다.
import { applyConsoleGate, setDebugLogs } from './consoleGate';

applyConsoleGate({ isDev: import.meta.env.DEV });
if (typeof window !== 'undefined') {
  window.galpiDebug = (on) => setDebugLogs(on);
}
