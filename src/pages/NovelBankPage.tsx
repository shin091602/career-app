import { AppShell } from '../components';
import { NovelPlayer } from '../engine/novel';
import { bankScenario } from '../../content/novel-bank/scenario';
import { getPrototype } from '../prototypes';

const prototype = getPrototype('novel-bank');

/** ノベル（銀行員）の入口。シナリオを渡すだけの薄いページ */
export function NovelBankPage() {
  return (
    <AppShell title={bankScenario.title} subtitle={bankScenario.jobTitle} showBack>
      <NovelPlayer scenario={bankScenario} prototypeId={prototype.id} />
    </AppShell>
  );
}
