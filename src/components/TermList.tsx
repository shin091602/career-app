import type { Term } from '../types';

/**
 * 難しい用語の解説。中高生向けなので、専門用語には必ずこれを添える。
 * 折りたたみにして本文の流れを邪魔しないようにする。
 */
export function TermList({ terms }: { terms?: Term[] }) {
  if (!terms || terms.length === 0) return null;

  return (
    <details className="rounded-xl border border-line bg-surface-muted px-3 py-2 text-sm">
      <summary className="min-h-[28px] cursor-pointer list-none font-medium text-ink-muted">
        ことばの意味（{terms.length}）
      </summary>
      <dl className="mt-2 space-y-2">
        {terms.map((term) => (
          <div key={term.term}>
            <dt className="font-medium">{term.term}</dt>
            <dd className="text-ink-muted">{term.description}</dd>
          </div>
        ))}
      </dl>
    </details>
  );
}
