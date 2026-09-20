import { AppShell, Card } from '../components';
import type { PrototypeMeta } from '../prototypes';

/** コンテンツ未着手のプロトタイプで表示する画面 */
export function PreparingNotice({ prototype }: { prototype: PrototypeMeta }) {
  return (
    <AppShell title={prototype.jobTitle} subtitle={prototype.format} showBack>
      <Card>
        <p className="text-sm">
          この体験はまだ準備中です。コンテンツができあがるまでお待ちください。
        </p>
      </Card>
    </AppShell>
  );
}
