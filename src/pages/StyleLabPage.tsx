import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import type { Branch, EndingCard, Episode, GaugeDef, Interrupt, Shot, Subtitle } from '../types';
import { SubtitleLayer } from '../engine/episode/SubtitleLayer';
import { ChoiceOverlay } from '../engine/episode/ChoiceOverlay';
import { GaugeBar } from '../engine/episode/GaugeBar';
import { TelopLayer } from '../engine/episode/TelopLayer';
import { InterruptLayer } from '../engine/episode/InterruptLayer';
import { ResultCard } from '../engine/episode/ResultCard';
import { Storyboard } from '../engine/episode/Storyboard';
import { usePersistentState } from '../lib/usePersistentState';
import { THEMES, THEME_ATTRIBUTE, type ThemeId } from '../theme/themes';

const SAMPLE_SUBTITLE: Subtitle = {
  speaker: '山田社長',
  text: 'なんとか、貸してもらえないかな。',
  atSec: 0,
};

const SAMPLE_BRANCH: Branch = {
  timeLimitSec: 8,
  onTimeout: { label: '答えられない', nextShotId: 'x' },
  choices: [
    { label: 'すぐ手配します', nextShotId: 'x' },
    { label: '詳しく聞かせて', nextShotId: 'x' },
  ],
};

const SAMPLE_GAUGES: GaugeDef[] = [
  { key: 'trust', label: '信頼', description: '相手の話を正面から受け止められたか。' },
  { key: 'result', label: '成果', description: '仕事として前に進められたか。' },
];

const SAMPLE_INTERRUPT: Interrupt = {
  kind: 'chat',
  from: '融資課長',
  body: '訪問前に、ここ3年の数字を押さえておいて。',
};

const SAMPLE_SHOT: Shot = {
  id: 's03-desk-figures',
  kind: 'story',
  durationSec: 6,
  videoAssetId: 'v-s03-desk-figures',
  subtitles: [],
};

const SAMPLE_ENDING: EndingCard = {
  id: 'ending-carry',
  shotId: 'x',
  type: '持ち帰り型',
  summary:
    'その場で答えを出さず、確かめるべきことを持ち帰った。慎重だが、相手を待たせた分だけ信頼は試される。',
  debriefShotIds: [],
};

const SAMPLE_EPISODE = {
  id: 'lab',
  title: 'lab',
  jobTitle: '銀行員',
  description: '',
  audioMode: 'embedded',
  startShotId: 'x',
  shots: [],
  gauges: SAMPLE_GAUGES,
  endings: [SAMPLE_ENDING, { ...SAMPLE_ENDING, id: 'ending-decide', type: '即断型' }],
  verified: false,
  sources: [],
} satisfies Episode;

function Panel({ label, children }: { label: string; children: ReactNode }) {
  return (
    <section className="space-y-2">
      <h2 className="text-xs font-bold text-ink-muted">{label}</h2>
      {children}
    </section>
  );
}

/** 縦画面のプレイヤーを切り取った枠。見本はこの中に実物を描く */
function PhoneFrame({ children, tall }: { children: ReactNode; tall?: boolean }) {
  return (
    <div
      className={`relative w-full overflow-hidden rounded-xl bg-black ${
        tall ? 'aspect-[9/16]' : 'aspect-[3/4]'
      }`}
    >
      {children}
    </div>
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
        <Panel label="字幕（動画の上に重ねる）">
          <PhoneFrame>
            <div className="absolute inset-0 bg-gradient-to-b from-[#2a2f3a] to-[#0d1016]" />
            <SubtitleLayer subtitle={SAMPLE_SUBTITLE} />
          </PhoneFrame>
        </Panel>

        <Panel label="2択（タップ／左右スワイプ・制限時間つき）">
          <PhoneFrame>
            <div className="absolute inset-0 bg-gradient-to-b from-[#3a2f2a] to-[#0d1016]" />
            <ChoiceOverlay
              branch={SAMPLE_BRANCH}
              onPick={() => undefined}
              remainingRatio={0.3}
              remainingSec={3}
            />
          </PhoneFrame>
        </Panel>

        <Panel label="ゲージ（選択の直後に動く）">
          <div className="rounded-xl bg-black p-3">
            <GaugeBar gauges={SAMPLE_GAUGES} values={{ trust: 2, result: -1 }} />
          </div>
        </Panel>

        <Panel label="時刻・場所のテロップ">
          <PhoneFrame>
            <div className="absolute inset-0 bg-gradient-to-b from-[#2f3a2a] to-[#0d1016]" />
            <TelopLayer telop={{ time: '10:30', place: '山田製作所 応接' }} />
          </PhoneFrame>
        </Panel>

        <Panel label="割り込み（チャット・メール・電話）">
          <PhoneFrame>
            <div className="absolute inset-0 bg-gradient-to-b from-[#2a333a] to-[#0d1016]" />
            <InterruptLayer interrupt={SAMPLE_INTERRUPT} onDismiss={() => undefined} />
          </PhoneFrame>
        </Panel>

        <Panel label="結果カード（タイプ診断とエンディング回収）">
          <PhoneFrame tall>
            <ResultCard
              episode={SAMPLE_EPISODE}
              ending={SAMPLE_ENDING}
              gauges={SAMPLE_GAUGES}
              values={{ trust: 2, result: 1 }}
              collectedEndingIds={['ending-carry']}
              onRestart={() => undefined}
            />
          </PhoneFrame>
        </Panel>

        <Panel label="素材が無いときの代替（絵コンテ風）">
          <PhoneFrame>
            <Storyboard shot={SAMPLE_SHOT} elapsedSec={2.4} />
          </PhoneFrame>
        </Panel>

        <p className="text-xs text-ink-muted">
          1案に決めたら <code>src/theme/themes.ts</code> の <code>ACTIVE_THEME</code>{' '}
          を書き換えると、アプリ全体に適用されます。
        </p>
      </div>
    </div>
  );
}
