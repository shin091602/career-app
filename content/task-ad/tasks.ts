import type { TaskSet } from '../../src/types';

/**
 * 広告代理店社員の課題（未着手）。
 * ここに TaskSet を入れると、ホーム画面の「準備中」が自動で外れる。
 * 共有ファイルを書き換える必要はない。
 *
 * エクスポート名 `taskSet` は4つのプロトタイプで共通なので変更しないこと。
 */
export const taskSet: TaskSet | null = null;
