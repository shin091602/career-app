import type { ParamDef } from '../../types';

interface ParamSummaryProps {
  params: ParamDef[];
  values: Record<string, number>;
}

/** エンディングで見せる、選択の積み重ねの結果 */
export function ParamSummary({ params, values }: ParamSummaryProps) {
  if (params.length === 0) return null;

  return (
    <dl className="space-y-2">
      {params.map((param) => (
        <div key={param.key} className="rounded-xl border border-line bg-surface p-3">
          <div className="flex items-baseline justify-between gap-2">
            <dt className="text-sm font-medium">{param.label}</dt>
            <span className="text-base font-bold tabular-nums">{values[param.key] ?? 0}</span>
          </div>
          <dd className="mt-0.5 text-xs text-ink-muted">{param.description}</dd>
        </div>
      ))}
    </dl>
  );
}
