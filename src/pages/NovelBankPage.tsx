import { NovelPlayer } from '../engine/novel';
import { scenario } from '../../content/novel-bank/scenario';
import { getPrototype } from '../prototypes';
import { PreparingNotice } from './PreparingNotice';

const prototype = getPrototype('novel-bank');

/** ノベル（銀行員）の入口。シナリオが入るまでは準備中を出す */
export function NovelBankPage() {
  if (!scenario) return <PreparingNotice prototype={prototype} />;

  return <NovelPlayer scenario={scenario} prototypeId={prototype.id} />;
}
