/**
 * 再生順の確認。
 *
 *   npm run playback                     すべてのエピソード
 *   npm run playback -- --episode pilot-02
 *
 * jsdom 上でプレイヤーを実際に動かし、ターン制の順番どおりに進むかを見る。
 *
 *   本編クリップ → （最後まで再生してから）選択 → 分岐した反応クリップ → 次の本編
 *
 * 見るのは次の3点：
 * - 本編の**頭で選択肢が出ていない**こと（出ていると動画が再生されないまま選択になる）
 * - 選択のあと、**反応クリップが飛ばされずに再生される**こと
 * - 最後に結果カードへ着くこと
 */
import { JSDOM } from 'jsdom';
import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import type { Episode } from '../src/types/index.ts';
import { NOVEL_PROTOTYPES, loadPrototype } from './episodes.mts';

const TICK_SEC = 0.2;

function setupDom() {
  const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', {
    url: 'http://localhost/',
    pretendToBeVisual: true,
  });
  const g = globalThis as Record<string, unknown>;
  g.window = dom.window;
  g.document = dom.window.document;
  Object.defineProperty(globalThis, 'navigator', {
    value: dom.window.navigator,
    configurable: true,
  });
  g.IS_REACT_ACT_ENVIRONMENT = true;
  dom.window.HTMLMediaElement.prototype.play = () => Promise.resolve();
  dom.window.HTMLMediaElement.prototype.pause = () => undefined;

  // 時間は手で進める（rAF も自分で回す）
  const clock = { now: 0 };
  const frames: FrameRequestCallback[] = [];
  const realPerformance = globalThis.performance;
  g.performance = new Proxy(realPerformance, {
    get(target, prop) {
      if (prop === 'now') return () => clock.now;
      const value = Reflect.get(target, prop);
      return typeof value === 'function' ? value.bind(target) : value;
    },
  }) as never;
  const raf = ((callback: FrameRequestCallback) => frames.push(callback)) as never;
  g.requestAnimationFrame = raf;
  g.cancelAnimationFrame = (() => undefined) as never;
  dom.window.requestAnimationFrame = raf;
  dom.window.cancelAnimationFrame = (() => undefined) as never;

  return { dom, clock, frames };
}

async function run(episode: Episode, prototypeId: string): Promise<string[]> {
  const { dom, clock, frames } = setupDom();
  const { EpisodePlayer } = await import('../src/engine/episode/index.ts');
  const container = dom.window.document.getElementById('root') as HTMLElement;
  const root = createRoot(container);

  await act(async () => {
    root.render(
      createElement(
        MemoryRouter,
        null,
        createElement(EpisodePlayer, { episode, prototypeId: prototypeId as never }),
      ),
    );
  });

  const problems: string[] = [];
  const text = () => container.textContent ?? '';
  const buttons = () => [...container.querySelectorAll('button')] as HTMLElement[];
  const choiceButtons = () => {
    const labels = new Set(
      episode.shots.flatMap((shot) => shot.branch?.choices.map((choice) => choice.label) ?? []),
    );
    return buttons().filter((button) => labels.has((button.textContent ?? '').trim()));
  };
  const activeShot = () => {
    const videos = [...container.querySelectorAll('video')] as HTMLVideoElement[];
    const active = videos.find((video) => video.style.opacity === '');
    return active ? (active.getAttribute('src') ?? '').split('/').pop() : '（動画なし）';
  };

  async function tick(seconds: number) {
    for (let elapsed = 0; elapsed < seconds; elapsed += TICK_SEC) {
      clock.now += TICK_SEC * 1000;
      const queued = frames.splice(0, frames.length);
      await act(async () => {
        for (const callback of queued) callback(clock.now);
      });
    }
  }

  await act(async () => {
    buttons()
      .find((button) => (button.textContent ?? '').includes('タップして始める'))
      ?.click();
  });

  // 0.2秒ずつ進めながら、選択肢が出た瞬間を見る
  let current = activeShot();
  let sinceChange = 0;
  let guard = 0;

  while (!text().includes('あなたのタイプは') && guard < 1500) {
    guard += 1;
    await tick(TICK_SEC);
    sinceChange += TICK_SEC;

    const now = activeShot();
    if (now !== current) {
      current = now;
      sinceChange = 0;
    }

    // 割り込み（チャット・電話）は出たら閉じる。閉じないと再生が止まったままになる
    const dismiss = buttons().find((button) =>
      ['読んだ', '閉じる', '出る'].includes((button.textContent ?? '').trim()),
    );
    if (dismiss) {
      await act(async () => dismiss.click());
      continue;
    }

    const picks = choiceButtons();
    if (picks.length !== 2) continue;

    // 本編クリップが再生される前に選択肢が出ていないか
    if (sinceChange < 1) {
      problems.push(
        `${episode.id}: ${current} の頭（${sinceChange.toFixed(1)}秒）で選択肢が出ている。` +
          '動画が再生されないまま選択になる',
      );
    }

    await act(async () => picks[1].click());
    const reaction = activeShot();
    await tick(1);
    if (activeShot() !== reaction) {
      problems.push(`${episode.id}: 選択のあとの反応クリップ（${reaction}）が飛ばされた`);
    }
    current = activeShot();
    sinceChange = 1;
  }

  if (!text().includes('あなたのタイプは')) {
    problems.push(`${episode.id}: 最後まで進んでも結果カードに着かない`);
  }

  await act(async () => root.unmount());
  return problems;
}

async function main() {
  const args = process.argv.slice(2);
  const only = args.includes('--episode') ? args[args.indexOf('--episode') + 1] : null;
  const problems: string[] = [];
  let checked = 0;

  for (const prototypeId of NOVEL_PROTOTYPES) {
    const { episodes } = await loadPrototype(prototypeId);
    for (const episode of episodes) {
      if (only && episode.id !== only) continue;
      if (!episode.shots.some((shot) => shot.branch)) continue;
      checked += 1;
      problems.push(...(await run(episode, prototypeId)));
    }
  }

  if (checked === 0) {
    console.log('確認できるエピソードがありません。');
    return;
  }
  if (problems.length === 0) {
    console.log(`再生順は正しく進みます（${checked} エピソードを確認）。`);
    return;
  }
  console.error(`再生順に問題があります（${checked} エピソードを確認）：\n`);
  for (const problem of problems) console.error(`  - ${problem}`);
  process.exit(1);
}

await main();
