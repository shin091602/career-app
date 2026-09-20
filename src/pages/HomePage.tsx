import { Link } from 'react-router-dom';
import { AppShell, Badge, Card, PasscodeField } from '../components';
import { PROTOTYPES } from '../prototypes';

/** 4つのプロトタイプへの入口。未実装のものは「準備中」として遷移させない */
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
            const inner = (
              <Card className={prototype.status === 'preparing' ? 'opacity-60' : ''}>
                <div className="flex items-center gap-2">
                  <Badge tone={prototype.status === 'ready' ? 'accent' : 'neutral'}>
                    {prototype.status === 'ready' ? prototype.format : '準備中'}
                  </Badge>
                  <span className="text-xs text-ink-muted">{prototype.format}</span>
                </div>
                <h2 className="mt-2 text-base font-bold">{prototype.jobTitle}</h2>
                <p className="mt-1 text-sm text-ink-muted">{prototype.description}</p>
              </Card>
            );

            return (
              <li key={prototype.id}>
                {prototype.status === 'ready' ? (
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
