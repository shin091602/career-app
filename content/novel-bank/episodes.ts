import type { Episode } from '../../src/types';
import { bankEpisode01 } from './bank-ep01';
import { pilotEpisode } from './pilot-01';
import { pilotEpisode02 } from './pilot-02';

/**
 * 銀行員編のショートドラマ。
 * 先頭のエピソードが /novel-bank で再生される。
 * 2本目以降は /novel-bank?episode=<id> で開ける（ホームの「開発用」から）。
 *
 * エクスポート名 `episodes` はノベル型プロトタイプで共通なので変更しないこと。
 */
// 素材が入っている pilot-02 を先頭にして、/novel-bank で通しで触れるようにしている。
// 本編（bank-ep01）の素材が揃ったら先頭に戻す。
export const episodes: Episode[] = [pilotEpisode02, bankEpisode01, pilotEpisode];
