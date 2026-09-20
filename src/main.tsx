import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { ACTIVE_THEME, THEME_ATTRIBUTE } from './theme/themes';
import './index.css';

// テーマをアプリ全体に適用する（src/theme/themes.ts の ACTIVE_THEME）
document.documentElement.setAttribute(THEME_ATTRIBUTE, ACTIVE_THEME);

const container = document.getElementById('root');
if (!container) throw new Error('#root が見つかりません');

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
