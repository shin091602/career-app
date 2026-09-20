/**
 * ショットリストの生成。
 *
 *   npm run shotlist
 *
 * content/<名前>/episodes.ts と production.ts から docs/shotlist/<エピソードID>.md を作る。
 * 素材の生成状況は public/assets/<名前>/ を見て判定するので、
 * 作り直しても手で付けた印が消えることはない。
 *
 * 構造の問題（3択になっている、遷移先が無い、制作メモが無い等）を見つけたら
 * ファイルを書かずに終了する。
 */
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { Episode, PrototypeId, ProductionNotes, Shot } from '../src/types/index.ts';
import { ROOT, NOVEL_PROTOTYPES, assetExists, audioModeOf, loadPrototype, nextIdsOf } from './episodes.mts';
import { validateEpisode } from './validate-episode.mts';

const KIND_LABEL: Record<Shot['kind'], string> = {
  story: '本編',
  reaction: '反応',
  ending: '結末',
  debrief: '答え合わせ',
};

const AUDIO_LABEL: Record<string, string> = {
  embedded: '動画に音声込み',
  separate: '別途合成',
};

/** 表のセルに入れるため、改行とパイプを潰す */
function cell(text: string | undefined): string {
  if (!text) return '—';
  return text.replace(/\|/g, '／').replace(/\n+/g, ' ');
}

function assetStatus(prototypeId: PrototypeId, shot: Shot): string {
  const parts: string[] = [];
  if (shot.videoAssetId) {
    parts.push(
      `${assetExists(prototypeId, shot.videoAssetId, 'mp4') ? '✅' : '⬜'} 動画 \`${shot.videoAssetId}\``,
    );
  }
  if (shot.imageAssetId) {
    parts.push(
      `${assetExists(prototypeId, shot.imageAssetId, 'webp') ? '✅' : '⬜'} 静止画 \`${shot.imageAssetId}\``,
    );
  }
  return parts.length > 0 ? parts.join('<br>') : '—';
}

function subtitleCell(shot: Shot): string {
  if (shot.subtitles.length === 0) return '—';
  return shot.subtitles
    .map((subtitle) => {
      const who = subtitle.speaker ? `${subtitle.speaker}：` : '';
      return `${subtitle.atSec.toFixed(1)}s ${who}${subtitle.text}`;
    })
    .join('<br>');
}

function charactersCell(production: ProductionNotes, shot: Shot): string {
  const note = production[shot.id];
  if (!note?.characters || note.characters.length === 0) return '—';
  return note.characters
    .map((character) =>
      character.referenceAssetId
        ? `${character.name}（設定画 \`${character.referenceAssetId}\`）`
        : character.name,
    )
    .join('<br>');
}

/** 分岐がどこで分かれてどこで合流するかを書き出す */
function branchMap(episode: Episode): string {
  const lines: string[] = [];

  for (const shot of episode.shots) {
    if (!shot.branch) continue;
    const [left, right] = shot.branch.choices;

    const follow = (fromId: string): string => {
      const path: string[] = [fromId];
      let current = episode.shots.find((candidate) => candidate.id === fromId);
      // 反応ショットを1つたどって合流先を見る
      while (current && current.kind === 'reaction' && current.next) {
        path.push(current.next);
        current = episode.shots.find((candidate) => candidate.id === current?.next);
      }
      return path.join(' → ');
    };

    lines.push(`- \`${shot.id}\`（${shot.branch.timeLimitSec ?? '制限なし'}秒）`);
    lines.push(`  - 左「${left.label}」→ ${follow(left.nextShotId)}`);
    lines.push(`  - 右「${right.label}」→ ${follow(right.nextShotId)}`);
    lines.push(`  - 時間切れ「${shot.branch.onTimeout.label}」→ ${follow(shot.branch.onTimeout.nextShotId)}`);
  }

  return lines.length > 0 ? lines.join('\n') : '分岐なし。';
}

function renderEpisode(
  prototypeId: PrototypeId,
  episode: Episode,
  production: ProductionNotes,
): string {
  const totalSec = episode.shots
    .filter((shot) => shot.kind !== 'debrief')
    .reduce((sum, shot) => sum + shot.durationSec, 0);
  const debriefSec = episode.shots
    .filter((shot) => shot.kind === 'debrief')
    .reduce((sum, shot) => sum + shot.durationSec, 0);

  const generated = episode.shots.filter(
    (shot) => shot.videoAssetId && assetExists(prototypeId, shot.videoAssetId, 'mp4'),
  ).length;

  const rows = episode.shots.map((shot) => {
    const note = production[shot.id];
    return [
      `\`${shot.id}\``,
      `${shot.durationSec}s`,
      KIND_LABEL[shot.kind],
      AUDIO_LABEL[audioModeOf(episode, shot)] ?? audioModeOf(episode, shot),
      assetStatus(prototypeId, shot),
      subtitleCell(shot),
      charactersCell(production, shot),
      cell(note?.imagePrompt),
      cell([note?.motionPrompt, note?.cameraNote].filter(Boolean).join(' ／ ')),
    ].join(' | ');
  });

  return `<!-- このファイルは npm run shotlist で生成されます。直接編集しないでください。 -->

# ${episode.title}

- エピソードID：\`${episode.id}\`（プロトタイプ：\`${prototypeId}\`）
- 職業：${episode.jobTitle}
- 既定の音声方式：**${AUDIO_LABEL[episode.audioMode]}**
- 本編の尺：**約${Math.round(totalSec)}秒**（答え合わせ ${Math.round(debriefSec)}秒を除く）
- ショット数：${episode.shots.length}（動画生成済み ${generated} / ${episode.shots.length}）
- 事実確認：${episode.verified ? '済み' : '**未確認（推測を含む）**'}

${episode.description}

## 作り方

1. この表の「画像生成プロンプト」で静止画を作る（ChatGPT）
2. その静止画を「動きの指示」で動画にする（Google Flow）
3. できたファイルを \`inbox/\` に置き、\`npm run import-assets\` を実行する
4. \`npm run shotlist\` をもう一度実行すると、素材状況の印が更新される

同じ人物が出るショットでは、**設定画を必ず参照して見た目を揃える**こと。

## 分岐

${branchMap(episode)}

## 結末

${episode.endings
  .map(
    (ending) =>
      `- **${ending.type}**（\`${ending.id}\` / ショット \`${ending.shotId}\`）：${ending.summary}\n  - 答え合わせ：${ending.debriefShotIds.map((id) => `\`${id}\``).join(' → ') || 'なし'}`,
  )
  .join('\n')}

## ショットリスト

| ショットID | 秒数 | 種別 | 音声方式 | 素材状況 | 字幕 | 登場人物・参照設定画 | 画像生成プロンプト（ChatGPT） | 動きの指示（Flow） |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
${rows.join('\n')}
`;
}

async function main() {
  const problems: string[] = [];
  const written: string[] = [];
  const outputs: { file: string; body: string }[] = [];

  for (const prototypeId of NOVEL_PROTOTYPES) {
    const { episodes, production } = await loadPrototype(prototypeId);
    for (const episode of episodes) {
      problems.push(...validateEpisode(prototypeId, episode, production));
      outputs.push({
        file: path.join(ROOT, 'docs', 'shotlist', `${episode.id}.md`),
        body: renderEpisode(prototypeId, episode, production),
      });
    }
  }

  if (problems.length > 0) {
    console.error('エピソードに問題があります。直してから実行してください。\n');
    for (const problem of problems) console.error(`  - ${problem}`);
    process.exit(1);
  }

  await mkdir(path.join(ROOT, 'docs', 'shotlist'), { recursive: true });
  for (const output of outputs) {
    await writeFile(output.file, output.body, 'utf8');
    written.push(path.relative(ROOT, output.file));
  }

  if (written.length === 0) {
    console.log('エピソードがまだありません。');
    return;
  }
  console.log('ショットリストを書き出しました：');
  for (const file of written) console.log(`  - ${file}`);
}

await main();
