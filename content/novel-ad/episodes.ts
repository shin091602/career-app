import type { Episode } from '../../src/types';

/**
 * 広告代理店社員のショートドラマ（未着手）。
 * ここにエピソードを1本でも入れると、ホーム画面の「準備中」が自動で外れる。
 * 共有ファイルを書き換える必要はない。
 *
 * エクスポート名 `episodes` はノベル型プロトタイプで共通なので変更しないこと。
 */
export const episodes: Episode[] = [];
