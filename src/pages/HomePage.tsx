import { Link } from 'react-router-dom';
import { AppShell, Badge, Card, PasscodeField } from '../components';
import { descriptionOf, isReady, jobTitleOf, PROTOTYPES } from '../prototypes';

/**
 * 4つのプロトタイプへの入口。
 * コンテンツ（content/<名前>/）が未投入のものは「準備中」として遷移させない。
 */
export function HomePage() {
  return (
    <AppShell
      title="しごと体験アプリ"
      subtitle="4つの体験を試して、感想を聞かせてください（プロトタイプ）"
    >
      <div className="space-y-4">
        <PasscodeField />

        <ul className="space-y-3">
          {PROTOTYPES.map((prototype) => {
            const ready = isReady(prototype);
            const inner = (
              <Card className={ready ? '' : 'opacity-60'}>
                <div className="flex items-center gap-2">
                  <Badge tone={ready ? 'accent' : 'neutral'}>
                    {ready ? prototype.format : '準備中'}
                  </Badge>
                  <span className="text-xs text-ink-muted">{prototype.format}</span>
                </div>
                <h2 className="mt-2 text-base font-bold">{jobTitleOf(prototype)}</h2>
                <p className="mt-1 text-sm text-ink-muted">{descriptionOf(prototype)}</p>
              </Card>
            );

            return (
              <li key={prototype.id}>
                {ready ? (
                  <Link to={prototype.path} className="block">
                    {inner}
                  </Link>
                ) : (
                  <div aria-disabled="true">{inner}</div>
                )}
              </li>
            );
          })}
        </ul>

        <p className="text-xs text-ink-muted">
          このアプリは開発中のプロトタイプです。登場する会社・人物・数値はすべて架空のもので、
          実在のものとは関係ありません。
        </p>
      </div>
    </AppShell>
  );
}
