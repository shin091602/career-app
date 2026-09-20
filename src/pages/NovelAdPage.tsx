import { AppShell } from '../components';
import { NovelPlayer } from '../engine/novel';
import { adScenario } from '../../content/novel-ad/scenario';
import { getPrototype } from '../prototypes';
import { PreparingNotice } from './PreparingNotice';

const prototype = getPrototype('novel-ad');

/** ノベル（広告代理店社員）の入口。コンテンツが入るまでは準備中を出す */
export function NovelAdPage() {
  if (!adScenario) return <PreparingNotice prototype={prototype} />;

  return (
    <AppShell title={adScenario.title} subtitle={adScenario.jobTitle} showBack>
      <NovelPlayer scenario={adScenario} prototypeId={prototype.id} />
    </AppShell>
  );
}
