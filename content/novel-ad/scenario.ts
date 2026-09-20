import type { Scenario } from '../../src/types';

/**
 * 広告代理店社員のノベル（未着手）。
 * ここに Scenario を入れると、ホーム画面の「準備中」が自動で外れる。
 * 共有ファイルを書き換える必要はない。
 *
 * エクスポート名 `scenario` は4つのプロトタイプで共通なので変更しないこと。
 */
export const scenario: Scenario | null = null;
