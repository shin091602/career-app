import type { AnswerFormat } from '../../types';

interface AnswerInputProps {
  format: AnswerFormat;
  /** 自由記述の本文 */
  text: string;
  onTextChange: (value: string) => void;
  /** 選択式で選ばれた選択肢ID */
  selected: string[];
  onSelectedChange: (value: string[]) => void;
  disabled?: boolean;
}

/** 回答入力。自由記述と選択式の両方に対応する */
export function AnswerInput({
  format,
  text,
  onTextChange,
  selected,
  onSelectedChange,
  disabled,
}: AnswerInputProps) {
  if (format.kind === 'free') {
    const tooShort = text.trim().length < format.minLength;
    return (
      <div>
        <label htmlFor="answer" className="block text-sm font-bold">
          あなたの回答
        </label>
        <textarea
          id="answer"
          value={text}
          disabled={disabled}
          maxLength={format.maxLength}
          rows={8}
          placeholder={format.placeholder}
          onChange={(event) => onTextChange(event.target.value)}
          className="mt-2 w-full rounded-xl border border-line bg-surface p-3 text-base leading-relaxed disabled:opacity-60"
        />
        <p className="mt-1 text-right text-xs text-ink-muted tabular-nums">
          {text.length} / {format.maxLength} 字
          {tooShort && <span className="ml-2">（{format.minLength}字以上で送信できます）</span>}
        </p>
      </div>
    );
  }

  const inputType = format.multiple ? 'checkbox' : 'radio';

  return (
    <fieldset disabled={disabled}>
      <legend className="text-sm font-bold">
        あなたの回答{format.multiple && <span className="text-ink-muted">（複数選べます）</span>}
      </legend>
      <div className="mt-2 space-y-2">
        {format.options.map((option) => {
          const checked = selected.includes(option.id);
          return (
            <label
              key={option.id}
              className={`flex min-h-[44px] cursor-pointer items-start gap-3 rounded-xl border p-3 ${
                checked ? 'border-accent bg-surface-muted' : 'border-line bg-surface'
              }`}
            >
              <input
                type={inputType}
                name="answer-choice"
                value={option.id}
                checked={checked}
                onChange={() => {
                  if (!format.multiple) {
                    onSelectedChange([option.id]);
                    return;
                  }
                  onSelectedChange(
                    checked
                      ? selected.filter((id) => id !== option.id)
                      : [...selected, option.id],
                  );
                }}
                className="mt-1.5 size-4 shrink-0"
              />
              <span className="text-sm leading-relaxed">
                {option.label}
                {checked && option.note && (
                  <span className="mt-1 block text-xs text-ink-muted">{option.note}</span>
                )}
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
