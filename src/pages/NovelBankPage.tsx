import { useSearchParams } from 'react-router-dom';
import { EpisodePlayer } from '../engine/episode';
import { episodes } from '../../content/novel-bank/episodes';
import { getPrototype } from '../prototypes';
import { PreparingNotice } from './PreparingNotice';

const prototype = getPrototype('novel-bank');

/**
 * ショートドラマ（銀行員）の入口。
 * 既定では1本目を再生する。?episode=<id> で別のエピソードを開ける（開発用）。
 */
export function NovelBankPage() {
  const [params] = useSearchParams();
  const requested = params.get('episode');
  const episode = requested ? episodes.find((item) => item.id === requested) : episodes[0];

  if (!episode) return <PreparingNotice prototype={prototype} />;

  return <EpisodePlayer episode={episode} prototypeId={prototype.id} />;
}
