import { Link } from 'react-router-dom';
import { AppShell } from '../components';

export function NotFoundPage() {
  return (
    <AppShell title="ページが見つかりません">
      <Link to="/" className="underline">
        ホームへ戻る
      </Link>
    </AppShell>
  );
}
