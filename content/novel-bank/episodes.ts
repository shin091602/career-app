import type { Episode } from '../../src/types';
import { bankEpisode01 } from './bank-ep01';
import { pilotEpisode } from './pilot-01';

/**
 * 銀行員編のショートドラマ。
 * 先頭のエピソードが /novel-bank で再生される。
 * 2本目以降は /novel-bank?episode=<id> で開ける（ホームの「開発用」から）。
 *
 * エクスポート名 `episodes` はノベル型プロトタイプで共通なので変更しないこと。
 */
export const episodes: Episode[] = [bankEpisode01, pilotEpisode];
