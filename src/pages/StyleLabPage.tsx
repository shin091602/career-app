import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import type { Choice, Interrupt, Material, Scene } from '../types';
import { MaterialView } from '../components';
import { TextBox } from '../engine/novel/TextBox';
import { ChoiceList } from '../engine/novel/ChoiceList';
import { StageCharacter } from '../engine/novel/StageCharacter';
import { usePersistentState } from '../lib/usePersistentState';
import { THEMES, THEME_ATTRIBUTE, type ThemeId } from '../theme/themes';

/** 見本に使う場面。実際のサンプルシナリオと同じ雰囲気の文にしてある */
const SAMPLE_SPEAKER = '山田社長';
const SAMPLE_TEXT =
  '注文が増えてきてね。今の機械じゃ追いつかないんだ。\n3,000万円の機械を入れたい。\n\n……なんとか、貸してもらえないかな。';

const SAMPLE_CHOICES: Choice[] = [
  { label: '「お任せください、すぐ手続きします」と即答する', nextSceneId: 'x' },
  { label: '注文が増えている理由と、返済の見込みを詳しく聞く', nextSceneId: 'x' },
  { label: '「今は難しいと思います」とその場で断る', nextSceneId: 'x' },
];

const SAMPLE_CHARACTERS: Scene['characters'] = [
  { assetId: 'char-senior-banker-normal', slot: 'left' },
  { assetId: 'char-factory-owner-worried', slot: 'center', speaking: true },
  { assetId: 'char-senior-banker-serious', slot: 'right' },
];

const SAMPLE_INTERRUPT: Interrupt = {
  kind: 'chat',
  from: '融資課長',
  body: '山田製作所の件、訪問前にここ3年の数字を押さえておいて。\n感触だけで持ち帰ってこないように。',
};

const SAMPLE_MATERIAL: Material = {
  kind: 'table',
  id: 'lab-table',
  title: '業績の推移（単位：万円）',
  headers: ['年度', '売上高', '営業利益'],
  rows: [
    ['2023年度', '18,000', '900'],
    ['2024年度', '19,500', '1,050'],
    ['2025年度', '22,000', '1,200'],
  ],
};

function Panel({ label, children }: { label: string; children: ReactNode }) {
  return (
    <section className="space-y-2">
      <h2 className="text-xs font-bold text-ink-muted">{label}</h2>
      {children}
    </section>
  );
}

/**
 * デザイン3案の比較用ページ（開発用）。
 *
 * 見本はすべて本番と同じコンポーネントで描いているので、
 * ここで見えているものがそのまま体験の見た目になる。
 * 1案に決めたら src/theme/themes.ts の ACTIVE_THEME を書き換える。
 */
export function StyleLabPage() {
  const [themeId, setThemeId] = usePersistentState<ThemeId>('styleLab:theme', 'drama');
  const active = THEMES.find((theme) => theme.id === themeId) ?? THEMES[0];

  return (
    <div className="mx-auto min-h-[100dvh] w-full max-w-[420px]">
      <header className="sticky top-0 z-10 border-b border-line bg-bg/95 px-4 py-3 backdrop-blur">
        <Link to="/" className="mb-1 inline-flex min-h-[32px] items-center text-sm text-ink-muted">
          ← ホーム
        </Link>
        <h1 className="text-lg font-bold">デザイン3案の比較</h1>
        <div className="mt-2 flex gap-2">
          {THEMES.map((theme) => (
            <button
              key={theme.id}
              onClick={() => setThemeId(theme.id)}
              className={`min-h-[36px] flex-1 rounded-lg border px-2 text-xs font-medium ${
                theme.id === themeId
                  ? 'border-accent bg-accent text-accent-ink'
                  : 'border-line bg-surface text-ink'
              }`}
            >
              {theme.name}
            </button>
          ))}
        </div>
        <p className="mt-2 text-xs text-ink-muted">{active.description}</p>
      </header>

      {/* この div の中だけ、選んだ案のトークンが効く */}
      <div {...{ [THEME_ATTRIBUTE]: themeId }} className="space-y-6 bg-bg px-4 py-5">
        <Panel label="会話（立ち絵は左・中央・右／話している人を強調）">
          <div className="relative aspect-[3/4] w-full overflow-hidden rounded-xl bg-surface-muted">
            {(SAMPLE_CHARACTERS ?? []).map((character) => (
              <StageCharacter
                key={character.slot}
                character={character}
                prototypeId="novel-bank"
                hasSpeaker
              />
            ))}
            <div className="absolute inset-x-0 bottom-0">
              <TextBox speaker={SAMPLE_SPEAKER} text={SAMPLE_TEXT} fullText={SAMPLE_TEXT} done />
            </div>
          </div>
        </Panel>

        <Panel label="選択肢">
          <ChoiceList choices={SAMPLE_CHOICES} onPick={() => undefined} />
        </Panel>

        <Panel label="選択肢（制限時間つき）">
          <ChoiceList
            choices={SAMPLE_CHOICES.slice(0, 2)}
            onPick={() => undefined}
            remainingRatio={0.28}
            remainingSec={4}
          />
        </Panel>

        <Panel label="時刻・場所のテロップ">
          <div className="flex justify-center">
            <div
              className="px-4 py-1.5 text-sm font-medium tracking-wide"
              style={{
                background: 'var(--novel-telop-bg)',
                color: 'var(--novel-telop-ink)',
                borderRadius: 'var(--novel-telop-radius)',
                fontFamily: 'var(--novel-font-display)',
              }}
            >
              10:30 ／ 山田製作所 応接スペース
            </div>
          </div>
        </Panel>

        <Panel label="割り込み（チャット・メール・電話）">
          <div
            className="overflow-hidden"
            style={{
              background: 'var(--novel-card-bg)',
              color: 'var(--c-text)',
              borderRadius: 'var(--novel-box-radius)',
              borderWidth: 'var(--novel-box-border-width)',
              borderStyle: 'solid',
              borderColor: 'var(--novel-box-border)',
              fontFamily: 'var(--novel-font-body)',
            }}
          >
            <div
              className="flex items-center justify-between px-4 py-2 text-xs font-bold"
              style={{ background: 'var(--c-accent)', color: 'var(--c-accent-text)' }}
            >
              <span>チャット</span>
              <span>{SAMPLE_INTERRUPT.from}</span>
            </div>
            <p className="px-4 py-3 whitespace-pre-wrap text-base leading-relaxed">
              {SAMPLE_INTERRUPT.body}
            </p>
          </div>
        </Panel>

        <Panel label="書類のズーム表示">
          <MaterialView material={SAMPLE_MATERIAL} />
        </Panel>

        <p className="text-xs text-ink-muted">
          1案に決めたら <code>src/theme/themes.ts</code> の <code>ACTIVE_THEME</code>{' '}
          を書き換えると、アプリ全体に適用されます。
        </p>
      </div>
    </div>
  );
}
