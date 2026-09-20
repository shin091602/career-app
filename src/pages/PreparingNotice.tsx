import { AppShell, Card } from '../components';
import { jobTitleOf, type PrototypeMeta } from '../prototypes';

/** コンテンツ未投入のプロトタイプで表示する画面 */
export function PreparingNotice({ prototype }: { prototype: PrototypeMeta }) {
  return (
    <AppShell title={jobTitleOf(prototype)} subtitle={prototype.format} showBack>
      <Card>
        <p className="text-sm">
          この体験はまだ準備中です。コンテンツができあがるまでお待ちください。
        </p>
      </Card>
    </AppShell>
  );
}
