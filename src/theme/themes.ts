/**
 * デザイン3案。
 *
 * 見た目は CSS の `[data-novel-theme="..."]` ブロック（src/theme/theme.css）で
 * トークンを上書きする形で切り替える。
 *
 * ★1案に決めるときは、下の ACTIVE_THEME を書き換えるだけでアプリ全体に効く。
 *   決まったら theme.css から使わないブロックを消し、index.html の
 *   Google Fonts の link も使うファミリーだけに絞ると初回表示が軽くなる。
 */
export type ThemeId = 'drama' | 'anime' | 'business';

export interface ThemeMeta {
  id: ThemeId;
  name: string;
  /** どんな雰囲気か（/style-lab に出す） */
  description: string;
}

export const THEMES: readonly ThemeMeta[] = [
  {
    id: 'drama',
    name: 'A ドラマ調',
    description: '落ち着いたダークトーン。緊張感のある企業ドラマの雰囲気。明朝体。',
  },
  {
    id: 'anime',
    name: 'B お仕事アニメ調',
    description: '明るく親しみやすい。中高生が手に取りやすい雰囲気。丸ゴシック。',
  },
  {
    id: 'business',
    name: 'C ビジネスツール調',
    description: 'ミニマルで実際の業務画面に近い。情報が読みやすいゴシック。',
  },
] as const;

/** アプリ全体に適用するテーマ。ここを変えると全画面の見た目が変わる */
export const ACTIVE_THEME: ThemeId = 'drama';

/** html 要素に立てる属性名 */
export const THEME_ATTRIBUTE = 'data-novel-theme';
