import { useSearchParams } from 'react-router-dom';
import { EpisodePlayer } from '../engine/episode';
import { episodes } from '../../content/novel-ad/episodes';
import { getPrototype } from '../prototypes';
import { PreparingNotice } from './PreparingNotice';

const prototype = getPrototype('novel-ad');

/**
 * ショートドラマ（広告代理店社員）の入口。
 * 既定では1本目を再生する。?episode=<id> で別のエピソードを開ける（開発用）。
 */
export function NovelAdPage() {
  const [params] = useSearchParams();
  const requested = params.get('episode');
  const episode = requested ? episodes.find((item) => item.id === requested) : episodes[0];

  if (!episode) return <PreparingNotice prototype={prototype} />;

  return <EpisodePlayer episode={episode} prototypeId={prototype.id} />;
}
