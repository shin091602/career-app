import { AppShell } from '../components';
import { NovelPlayer } from '../engine/novel';
import { scenario } from '../../content/novel-ad/scenario';
import { getPrototype } from '../prototypes';
import { PreparingNotice } from './PreparingNotice';

const prototype = getPrototype('novel-ad');

/** ノベル（広告代理店社員）の入口。シナリオが入るまでは準備中を出す */
export function NovelAdPage() {
  if (!scenario) return <PreparingNotice prototype={prototype} />;

  return (
    <AppShell title={scenario.title} subtitle={scenario.jobTitle} showBack>
      <NovelPlayer scenario={scenario} prototypeId={prototype.id} />
    </AppShell>
  );
}
