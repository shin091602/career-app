import { useEffect, useMemo, useState } from 'react';
import type { PrototypeId, TaskSet } from '../../types';
import { Badge, Button, ErrorBanner, SourceNote, Spinner, TermList } from '../../components';
import { usePasscode } from '../../lib/usePasscode';
import { usePersistentState } from '../../lib/usePersistentState';
import { MaterialView } from './MaterialView';
import { AnswerInput } from './AnswerInput';
import { FeedbackView } from './FeedbackView';
import { useFeedback } from './useFeedback';
import { toTaskPayload } from './materials';

export interface TaskRunnerProps {
  taskSet: TaskSet;
  prototypeId: PrototypeId;
}

/** 課題ごとの回答を localStorage に保存する（課題ID → 自由記述／選択ID） */
interface SavedAnswers {
  text: Record<string, string>;
  selected: Record<string, string[]>;
}

const EMPTY_ANSWERS: SavedAnswers = { text: {}, selected: {} };

/**
 * 課題画面の公開コンポーネント。
 * 課題表示 → 回答入力 → /api/feedback へ送信 → フィードバック表示 を扱う。
 */
export function TaskRunner({ taskSet, prototypeId }: TaskRunnerProps) {
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = usePersistentState<SavedAnswers>(
    `task:${prototypeId}:answers`,
    EMPTY_ANSWERS,
  );
  const { passcode } = usePasscode();
  const { status, feedback, errorMessage, submit, reset } = useFeedback();

  const task = taskSet.tasks[index];

  // 課題を切り替えたらフィードバックの表示をたたむ
  useEffect(() => {
    reset();
  }, [index, reset]);

  const payload = useMemo(
    () => (task ? toTaskPayload(task, taskSet.jobTitle) : null),
    [task, taskSet.jobTitle],
  );

  if (!task || !payload) {
    return (
      <p className="text-sm text-ink-muted">
        この体験の課題はまだ用意されていません（準備中）。
      </p>
    );
  }

  const text = answers.text[task.id] ?? '';
  const selected = answers.selected[task.id] ?? [];

  const answerText =
    task.answerFormat.kind === 'free'
      ? text
      : task.answerFormat.options
          .filter((option) => selected.includes(option.id))
          .map((option) => option.label)
          .join(' / ');

  const canSubmit =
    status !== 'loading' &&
    passcode.length > 0 &&
    (task.answerFormat.kind === 'free'
      ? text.trim().length >= task.answerFormat.minLength
      : selected.length > 0);

  return (
    <div className="space-y-4">
      {taskSet.tasks.length > 1 && (
        <div className="flex items-center gap-2 text-sm text-ink-muted">
          <span className="tabular-nums">
            課題 {index + 1} / {taskSet.tasks.length}
          </span>
          <div className="ml-auto flex gap-2">
            <Button variant="quiet" disabled={index === 0} onClick={() => setIndex(index - 1)}>
              前へ
            </Button>
            <Button
              variant="quiet"
              disabled={index >= taskSet.tasks.length - 1}
              onClick={() => setIndex(index + 1)}
            >
              次へ
            </Button>
          </div>
        </div>
      )}

      <section>
        <Badge>課題</Badge>
        <h2 className="mt-2 text-base font-bold">{task.title}</h2>
        <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed">{task.situation}</p>
      </section>

      <TermList terms={task.terms} />

      {task.materials.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-bold">資料</h2>
          {task.materials.map((material) => (
            <MaterialView key={material.id} material={material} />
          ))}
        </section>
      )}

      <section>
        <h2 className="text-sm font-bold">評価の観点</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-ink-muted">
          {task.criteria.map((criterion) => (
            <li key={criterion.key}>
              <span className="font-medium text-ink">{criterion.label}</span>：
              {criterion.description}
            </li>
          ))}
        </ul>
      </section>

      <AnswerInput
        format={task.answerFormat}
        text={text}
        onTextChange={(value) =>
          setAnswers((prev) => ({ ...prev, text: { ...prev.text, [task.id]: value } }))
        }
        selected={selected}
        onSelectedChange={(value) =>
          setAnswers((prev) => ({ ...prev, selected: { ...prev.selected, [task.id]: value } }))
        }
        disabled={status === 'loading'}
      />

      {passcode.length === 0 && (
        <ErrorBanner>
          AIフィードバックを使うには、ホーム画面でパスコードを入力してください。
        </ErrorBanner>
      )}

      <Button
        block
        disabled={!canSubmit}
        onClick={() =>
          submit({
            passcode,
            prototypeId,
            taskId: task.id,
            task: payload,
            answer: answerText,
          })
        }
      >
        {status === 'done' ? 'もう一度AIに見てもらう' : 'AIに見てもらう'}
      </Button>

      {status === 'loading' && <Spinner label="AIが読んでいます…" />}
      {status === 'error' && errorMessage && <ErrorBanner>{errorMessage}</ErrorBanner>}
      {status === 'done' && feedback && <FeedbackView feedback={feedback} task={task} />}

      <SourceNote verified={task.verified} sources={task.sources} />
    </div>
  );
}
