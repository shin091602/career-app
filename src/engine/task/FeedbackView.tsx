import { useState } from 'react';
import type { FeedbackResponse, Task } from '../../types';
import { Badge, Button, Card } from '../../components';

interface FeedbackViewProps {
  feedback: FeedbackResponse;
  task: Task;
}

/**
 * AIフィードバックの表示。
 * 「良かった点 → 改善点 → プロならこう考える」の順に見せ、
 * 模範解答は自分で考える余地を残すため後出しにする。
 */
export function FeedbackView({ feedback, task }: FeedbackViewProps) {
  const [showModel, setShowModel] = useState(false);

  return (
    <div className="space-y-4">
      <section>
        <Badge tone="good">良かった点</Badge>
        <ul className="mt-2 space-y-2">
          {feedback.good.map((item, index) => (
            <li key={index} className="rounded-xl border border-line bg-surface p-3 text-sm">
              {item}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <Badge tone="improve">改善点</Badge>
        <ul className="mt-2 space-y-2">
          {feedback.improve.map((item, index) => (
            <li key={index} className="rounded-xl border border-line bg-surface p-3 text-sm">
              {item}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <Badge tone="accent">プロならこう考える</Badge>
        <Card className="mt-2">
          <p className="whitespace-pre-wrap text-sm leading-relaxed">{feedback.proThinking}</p>
        </Card>
      </section>

      <section>
        {showModel ? (
          <Card>
            <h3 className="mb-1 text-sm font-bold">模範解答</h3>
            <p className="whitespace-pre-wrap text-sm leading-relaxed">{task.modelAnswer}</p>
            <h3 className="mt-3 mb-1 text-sm font-bold">現場の見方</h3>
            <p className="whitespace-pre-wrap text-sm leading-relaxed">{task.proInsight}</p>
          </Card>
        ) : (
          <Button variant="secondary" block onClick={() => setShowModel(true)}>
            模範解答を見る
          </Button>
        )}
      </section>

      {feedback.raw && (
        <details className="rounded-xl border border-line px-3 py-2 text-xs text-ink-muted">
          <summary className="cursor-pointer list-none">AIの生出力（開発用）</summary>
          <pre className="mt-2 overflow-x-auto whitespace-pre-wrap">{feedback.raw}</pre>
        </details>
      )}
    </div>
  );
}
