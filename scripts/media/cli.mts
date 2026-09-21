/**
 * 脚本から動画までのメディアパイプライン。
 *
 *   npm run media -- estimate --episode pilot-01 [--quality draft] [--stage videos] [--shots p1,p2]
 *   npm run media -- gen      --episode pilot-01 --stage characters [--force] [--yes]
 *   npm run media -- pick     --episode pilot-01 --stage videos --item p1 --take 2
 *   npm run media -- review   --episode pilot-01 [--serve]
 *   npm run media -- export   --episode pilot-01
 *   npm run media -- spec     --episode pilot-01
 *
 * 決まりごと：
 * - **生成の前に必ず見積もりを出し、確認を取る**（--yes で省略）
 * - 1回の実行で MEDIA_MAX_COST_USD（既定 5ドル）を超える見積もりは実行しない
 * - 採用テイクがあるものは作り直さない（--force で作り直す。テイクは番号で増える）
 * - 段階は characters → places → frames → videos の順。前の段階の採用が必要
 */
import { createInterface } from 'node:readline/promises';
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { ROOT, assetPath } from '../episodes.mts';
import {
  DEFAULT_MAX_COST_USD,
  QUALITY_PRESETS,
  STAGES,
  STAGE_LABEL,
  VEO_REFERENCE_MAX,
  formatUsd,
  type Quality,
  type Stage,
} from './config.mts';
import { maxCostUsd, requireApiKey } from './env.mts';
import { generateImage, generateVideo, looksBilling } from './gemini.mts';
import { buildPlan, summarize, type Plan, type PlanItem } from './plan.mts';
import { loadSpec, loadSpecs, writeSpec, type MediaSpec } from './spec.mts';
import {
  appendManifest,
  loadPicks,
  nextTake,
  pickedFile,
  setPick,
  spentUsd,
  takeFile,
  takeName,
  writeTakeMeta,
  type Picks,
} from './state.mts';
import { compressVideo, fileSize, formatBytes, hasFfmpeg, makePoster } from './ffmpeg.mts';
import { serveWork, writeReview } from './review.mts';

// ===== 引数 =====

interface Args {
  command: string;
  episode?: string;
  quality: Quality;
  stages: Stage[];
  shotIds?: string[];
  item?: string;
  take?: number;
  force: boolean;
  yes: boolean;
  serve: boolean;
}

function parseArgs(argv: string[]): Args {
  const args: Args = {
    command: argv[0] ?? 'help',
    quality: 'draft',
    stages: [...STAGES],
    force: false,
    yes: false,
    serve: false,
  };

  for (let index = 1; index < argv.length; index += 1) {
    const token = argv[index];
    const value = argv[index + 1];
    switch (token) {
      case '--episode':
        args.episode = value;
        index += 1;
        break;
      case '--quality':
        if (value !== 'draft' && value !== 'final') {
          throw new Error('--quality は draft か final');
        }
        args.quality = value;
        index += 1;
        break;
      case '--stage': {
        const stages = (value ?? '').split(',').map((part) => part.trim());
        if (stages.includes('all')) {
          args.stages = [...STAGES];
        } else {
          for (const stage of stages) {
            if (!STAGES.includes(stage as Stage)) {
              throw new Error(`--stage は ${STAGES.join(' / ')} のどれか（all も可）`);
            }
          }
          args.stages = stages as Stage[];
        }
        index += 1;
        break;
      }
      case '--shots':
        args.shotIds = (value ?? '').split(',').map((part) => part.trim()).filter(Boolean);
        index += 1;
        break;
      case '--item':
        args.item = value;
        index += 1;
        break;
      case '--take':
        args.take = Number(value);
        index += 1;
        break;
      case '--force':
        args.force = true;
        break;
      case '--yes':
        args.yes = true;
        break;
      case '--serve':
        args.serve = true;
        break;
      default:
        throw new Error(`知らない引数：${token}`);
    }
  }
  return args;
}

async function requireEpisode(args: Args): Promise<MediaSpec> {
  if (!args.episode) {
    const specs = await loadSpecs();
    const known = specs.map((spec) => `${spec.episodeId}（${spec.title}）`).join('\n  - ');
    throw new Error(`--episode を指定してください。あるのは：\n  - ${known}`);
  }
  return loadSpec(args.episode);
}

// ===== 見積もり =====

/** 全角を2文字として数え、表の列を揃える */
function pad(text: string, width: number): string {
  let used = 0;
  for (const char of text) used += /[\x00-\x7f]/.test(char) ? 1 : 2;
  return text + ' '.repeat(Math.max(1, width - used));
}

function printPlan(plan: Plan, args: Args): { cost: number; max: number } {
  const { byStage, cost, max } = summarize(plan.items);
  const preset = QUALITY_PRESETS[plan.quality];

  console.log(`\n■ ${plan.spec.title}（${plan.spec.episodeId}）`);
  console.log(`  品質：${preset.label}`);
  if (args.shotIds) console.log(`  対象ショット：${args.shotIds.join(', ')}`);
  console.log('');

  if (plan.items.length === 0) {
    console.log('  作るものはありません（採用テイクが揃っています）。');
  } else {
    for (const stage of STAGES) {
      const row = byStage.get(stage);
      if (!row) continue;
      const seconds = row.seconds > 0 ? `${row.seconds}秒` : '';
      console.log(
        `  ${pad(STAGE_LABEL[stage], 18)}${pad(`${row.count}件`, 6)}${pad(seconds, 7)}${formatUsd(row.cost)}`,
      );
    }
    console.log(`  ${'-'.repeat(40)}`);
    console.log(`  ${pad('合計（推定）', 31)}${formatUsd(cost)}`);
    if (max > cost) {
      console.log(`  ${pad('上限（Fast に切り替わった場合）', 31)}${formatUsd(max)}`);
      console.log(
        `    ※${preset.video.model.id} が画像入力を受け付けなかったときだけ、` +
          `${preset.video.fallbackModel?.id ?? ''} に切り替わる`,
      );
    }
  }

  if (plan.skipped.length > 0) {
    console.log(`\n  採用済みなので作らないもの：${plan.skipped.length} 件`);
    for (const item of plan.skipped) {
      console.log(`    - ${item.stage}/${item.itemId}（${takeName(item.picked ?? 1)}）`);
    }
    console.log('    作り直すなら --force、特定のショットだけなら --shots を付けてください。');
  }

  return { cost, max };
}

/** 前の段階の採用テイクが揃っているか */
function blockedReason(plan: Plan, item: PlanItem, picks: Picks): string | null {
  const missing = item.needs.filter(
    (need) => pickedFile(plan.spec.episodeId, need.stage, need.itemId, picks) === null,
  );
  if (missing.length === 0) return null;
  return missing.map((need) => `${need.stage}/${need.itemId}`).join(', ');
}

async function confirm(question: string): Promise<boolean> {
  if (process.stdin.isTTY !== true) {
    console.log('\n（対話できない環境なので中止します。実行するなら --yes を付けてください）');
    return false;
  }
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  try {
    const answer = await rl.question(`${question} [y/N] `);
    return answer.trim().toLowerCase() === 'y';
  } finally {
    rl.close();
  }
}

// ===== 生成 =====

function refFilesFor(plan: Plan, item: PlanItem, picks: Picks): string[] {
  return item.needs
    .map((need) => pickedFile(plan.spec.episodeId, need.stage, need.itemId, picks))
    .filter((file): file is string => file !== null);
}

async function runGenerate(plan: Plan, args: Args): Promise<void> {
  // 先に鍵を確かめる（無いまま走らせると失敗だけがマニフェストに溜まる）
  requireApiKey();

  const episodeId = plan.spec.episodeId;
  const preset = QUALITY_PRESETS[plan.quality];
  const picks = await loadPicks(episodeId);

  const blocked: string[] = [];
  const failures: { item: PlanItem; reason: string }[] = [];
  const fallbacks: string[] = [];
  let spent = 0;
  let made = 0;
  /** 請求まわりで止まった場合、残りを試しても同じなので中断する */
  let halted: string | null = null;

  for (const item of plan.items) {
    if (halted) break;
    const reason = blockedReason(plan, item, picks);
    if (reason) {
      blocked.push(`${item.stage}/${item.itemId}（待ち：${reason}）`);
      continue;
    }

    const take = await nextTake(episodeId, item.stage, item.itemId);
    const output = takeFile(episodeId, item.stage, item.itemId, take);
    await mkdir(path.dirname(output), { recursive: true });
    const refs = refFilesFor(plan, item, picks);

    console.log(`\n[${item.stage}] ${item.label} → ${takeName(take)}`);

    if (item.image) {
      const result = await generateImage({
        model: item.model,
        prompt: item.prompt,
        aspect: item.image.aspect,
        size: item.image.size,
        refFiles: refs,
      });

      if (!result.ok) {
        console.log(`  × 作れませんでした：${result.reason}`);
        await appendManifest({
          at: new Date().toISOString(),
          episodeId,
          stage: item.stage,
          itemId: item.itemId,
          quality: plan.quality,
          model: item.model,
          status: result.blocked ? 'blocked' : 'error',
          estimatedCostUsd: 0,
          reason: result.reason,
          prompt: item.prompt,
        });
        if (result.blocked) blocked.push(`${item.stage}/${item.itemId}（${result.reason}）`);
        else failures.push({ item, reason: result.reason });
        if (looksBilling(result.reason)) halted = result.reason;
        continue;
      }

      await writeFile(output, Buffer.from(result.base64, 'base64'));
      spent += item.costUsd;
      made += 1;
      await writeTakeMeta(episodeId, {
        createdAt: new Date().toISOString(),
        stage: item.stage,
        itemId: item.itemId,
        take,
        quality: plan.quality,
        model: item.model,
        prompt: item.prompt,
        params: { aspect: item.image.aspect, size: item.image.size, refs: refs.map((file) => path.basename(path.dirname(file))) },
        estimatedCostUsd: item.costUsd,
      });
      await appendManifest({
        at: new Date().toISOString(),
        episodeId,
        stage: item.stage,
        itemId: item.itemId,
        quality: plan.quality,
        model: item.model,
        status: 'ok',
        take,
        estimatedCostUsd: item.costUsd,
        prompt: item.prompt,
        params: { aspect: item.image.aspect, size: item.image.size },
      });
      console.log(`  ✓ ${path.relative(ROOT, output)}（${formatUsd(item.costUsd)}）`);
    }

    if (item.video) {
      const frame = pickedFile(episodeId, 'frames', item.itemId, picks);
      if (!frame) {
        blocked.push(`${item.stage}/${item.itemId}（最初のフレームが未採用）`);
        continue;
      }

      // 設定画を直接渡せるモデルのときだけ、見た目を揃えるために添える
      const referenceFiles = item.video.useReferenceImages
        ? (item.shot?.characterIds ?? [])
            .map((characterId) => {
              const character = plan.spec.characters.find(
                (candidate) => candidate.id === characterId,
              );
              const expression = character?.expressions[0] ?? 'normal';
              return pickedFile(episodeId, 'characters', `${characterId}-${expression}`, picks);
            })
            .filter((file): file is string => Boolean(file))
            .slice(0, VEO_REFERENCE_MAX)
        : [];

      const result = await generateVideo({
        model: item.model,
        fallbackModel: preset.video.fallbackModel?.id,
        prompt: item.prompt,
        firstFrameFile: frame,
        referenceFiles,
        seconds: item.video.seconds,
        resolution: preset.video.resolution,
        withAudio: item.video.withAudio,
        downloadPath: output,
      });

      if (!result.ok) {
        console.log(`  × 作れませんでした：${result.reason}`);
        await appendManifest({
          at: new Date().toISOString(),
          episodeId,
          stage: item.stage,
          itemId: item.itemId,
          quality: plan.quality,
          model: item.model,
          status: result.blocked ? 'blocked' : 'error',
          estimatedCostUsd: 0,
          reason: result.reason,
          prompt: item.prompt,
        });
        if (result.blocked) blocked.push(`${item.stage}/${item.itemId}（${result.reason}）`);
        else failures.push({ item, reason: result.reason });
        if (looksBilling(result.reason)) halted = result.reason;
        continue;
      }

      // 切り替わったときは料金も変わるので、上限側で記録する
      const cost = result.fallbackFrom ? item.maxCostUsd : item.costUsd;
      spent += cost;
      made += 1;
      if (result.fallbackFrom) {
        fallbacks.push(`${item.itemId}：${result.fallbackFrom} → ${result.modelUsed}`);
      }

      await writeTakeMeta(episodeId, {
        createdAt: new Date().toISOString(),
        stage: item.stage,
        itemId: item.itemId,
        take,
        quality: plan.quality,
        model: result.modelUsed,
        prompt: item.prompt,
        params: {
          seconds: item.video.seconds,
          resolution: preset.video.resolution,
          withAudio: item.video.withAudio,
          referenceImages: referenceFiles.length,
        },
        estimatedCostUsd: cost,
        fallbackFrom: result.fallbackFrom,
      });
      await appendManifest({
        at: new Date().toISOString(),
        episodeId,
        stage: item.stage,
        itemId: item.itemId,
        quality: plan.quality,
        model: result.modelUsed,
        status: 'ok',
        take,
        estimatedCostUsd: cost,
        fallbackFrom: result.fallbackFrom,
        prompt: item.prompt,
        params: { seconds: item.video.seconds, resolution: preset.video.resolution },
      });
      console.log(`  ✓ ${path.relative(ROOT, output)}（${formatUsd(cost)}）`);
    }

    // 最初のテイクは自動で採用する。--force で作り直したときも新しいテイクに移す
    // （そうしないと、同じ実行の中で古いテイクが参照画像に使われてしまう）
    const picked = picks[item.stage]?.[item.itemId];
    if (picked === undefined || args.force) {
      await setPick(episodeId, item.stage, item.itemId, take);
      picks[item.stage] = { ...(picks[item.stage] ?? {}), [item.itemId]: take };
    }
  }

  console.log(`\n=== 結果 ===`);
  console.log(`  作ったもの：${made} 件`);
  console.log(`  この実行の推定費用：${formatUsd(spent)}`);
  console.log(`  このエピソードの累計（推定）：${formatUsd(await spentUsd(episodeId))}`);

  if (fallbacks.length > 0) {
    console.log(`\n  ● モデルの切り替えが起きました（費用は上限側）：`);
    for (const line of fallbacks) console.log(`    - ${line}`);
  }
  if (blocked.length > 0) {
    console.log(`\n  ● 飛ばしたもの：`);
    for (const line of blocked) console.log(`    - ${line}`);
  }
  if (failures.length > 0) {
    console.log(`\n  ● 失敗したもの（もう一度実行すれば作り直します）：`);
    for (const failure of failures) {
      console.log(`    - ${failure.item.stage}/${failure.item.itemId}：${failure.reason}`);
    }
  }
  if (halted) {
    console.log(
      `\n  ● 請求・残高の問題で中断しました。残りは試していません（費用は発生していません）：\n    ${halted}`,
    );
    return;
  }

  console.log(`\n次は：npm run media -- review --episode ${episodeId} --serve`);
}

// ===== 書き出し =====

async function runExport(spec: MediaSpec): Promise<void> {
  if (!hasFfmpeg()) {
    throw new Error('ffmpeg が見つかりません（macOS なら brew install ffmpeg）。');
  }
  const picks = await loadPicks(spec.episodeId);
  // public/assets/<プロトタイプ名>/ を用意する
  await mkdir(path.dirname(assetPath(spec.prototypeId, 'dummy', 'mp4')), { recursive: true });

  let written = 0;
  const skipped: string[] = [];

  for (const shot of spec.shots) {
    if (shot.videoAssetId) {
      const source = pickedFile(spec.episodeId, 'videos', shot.id, picks);
      if (!source) {
        skipped.push(`${shot.id}：動画の採用テイクがない`);
      } else {
        const output = assetPath(spec.prototypeId, shot.videoAssetId, 'mp4');
        const ok = compressVideo({
          input: source,
          output,
          durationSec: shot.durationSec,
          keepAudio: shot.audioMode === 'embedded',
        });
        if (!ok) {
          skipped.push(`${shot.id}：圧縮に失敗`);
        } else {
          const size = await fileSize(output);
          console.log(
            `  ✓ ${path.relative(ROOT, output)}（${formatBytes(size)}／${shot.durationSec}秒）` +
              `${shot.audioMode === 'embedded' ? '' : '／無音'}`,
          );
          if (size > 3 * 1024 * 1024) console.log('    ※3MBを超えています。尺か画質を見直してください');
          written += 1;
        }
      }
    }

    if (shot.imageAssetId) {
      const source = pickedFile(spec.episodeId, 'frames', shot.id, picks);
      if (!source) {
        skipped.push(`${shot.id}：最初のフレームの採用テイクがない`);
      } else {
        const output = assetPath(spec.prototypeId, shot.imageAssetId, 'webp');
        if (makePoster(source, output)) {
          const size = await fileSize(output);
          console.log(`  ✓ ${path.relative(ROOT, output)}（${formatBytes(size)}）`);
          written += 1;
        } else {
          skipped.push(`${shot.id}：ポスター画像の書き出しに失敗`);
        }
      }
    }
  }

  console.log(`\n  ${written} 件を配置しました。`);
  if (skipped.length > 0) {
    console.log('  作れなかったもの：');
    for (const line of skipped) console.log(`    - ${line}`);
  }

  // 素材状況の印を更新する
  console.log('\n  npm run shotlist：');
  spawnSync('npm', ['run', '--silent', 'shotlist'], { stdio: 'inherit', cwd: ROOT });
}

// ===== 入口 =====

function usage(): void {
  console.log(`使い方：
  npm run media -- estimate --episode <ID> [--quality draft|final] [--stage <段階>] [--shots <ID,ID>]
  npm run media -- gen      --episode <ID> --stage <段階> [--quality draft|final] [--shots ...] [--force] [--yes]
  npm run media -- pick     --episode <ID> --stage <段階> --item <ID> --take <番号>
  npm run media -- review   --episode <ID> [--serve]
  npm run media -- export   --episode <ID>
  npm run media -- spec     --episode <ID>

段階：${STAGES.join(' / ')}（all でぜんぶ）
費用の上限：MEDIA_MAX_COST_USD（既定 ${formatUsd(DEFAULT_MAX_COST_USD)}）`);
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));

  switch (args.command) {
    case 'estimate': {
      const spec = await requireEpisode(args);
      const plan = await buildPlan(spec, args.quality, {
        stages: args.stages,
        shotIds: args.shotIds,
        force: args.force,
      });
      await writeSpec(spec);
      const { max } = printPlan(plan, args);
      const limit = maxCostUsd();
      console.log(`\n  1回の上限：${formatUsd(limit)}（MEDIA_MAX_COST_USD）`);
      if (max > limit) {
        console.log('  ※このままでは上限を超えるので gen は実行できません。');
        console.log('    --shots や --stage で分けるか、MEDIA_MAX_COST_USD を上げてください。');
      }
      console.log(
        `\n  実行するなら：npm run media -- gen --episode ${spec.episodeId} --stage ${args.stages.join(',')} --quality ${args.quality}`,
      );
      break;
    }

    case 'gen': {
      const spec = await requireEpisode(args);
      const plan = await buildPlan(spec, args.quality, {
        stages: args.stages,
        shotIds: args.shotIds,
        force: args.force,
      });
      await writeSpec(spec);
      const { max } = printPlan(plan, args);
      if (plan.items.length === 0) break;

      const limit = maxCostUsd();
      if (max > limit) {
        throw new Error(
          `見積もり（上限 ${formatUsd(max)}）が1回の上限 ${formatUsd(limit)} を超えています。` +
            '--shots や --stage で分けるか、MEDIA_MAX_COST_USD を上げてください。',
        );
      }

      if (!args.yes) {
        const ok = await confirm(`\nこの内容で生成します（最大 ${formatUsd(max)}）。進めますか？`);
        if (!ok) {
          console.log('中止しました。');
          break;
        }
      }
      await runGenerate(plan, args);
      break;
    }

    case 'pick': {
      const spec = await requireEpisode(args);
      if (!args.item || !args.take || args.stages.length !== 1) {
        throw new Error('pick は --stage <段階> --item <ID> --take <番号> を指定してください。');
      }
      const stage = args.stages[0];
      const file = takeFile(spec.episodeId, stage, args.item, args.take);
      if (!existsSync(file)) {
        throw new Error(`そのテイクがありません：${path.relative(ROOT, file)}`);
      }
      await setPick(spec.episodeId, stage, args.item, args.take);
      console.log(`採用しました：${stage}/${args.item} → ${takeName(args.take)}`);
      break;
    }

    case 'review': {
      const spec = await requireEpisode(args);
      const file = await writeReview(spec);
      console.log(`確認用ページ：${path.relative(ROOT, file)}`);
      if (args.serve) serveWork(spec.episodeId);
      break;
    }

    case 'export': {
      const spec = await requireEpisode(args);
      await runExport(spec);
      break;
    }

    case 'spec': {
      const specs = args.episode ? [await loadSpec(args.episode)] : await loadSpecs();
      for (const spec of specs) {
        console.log(`書き出しました：${await writeSpec(spec)}`);
      }
      break;
    }

    default:
      usage();
  }
}

try {
  await main();
} catch (error) {
  console.error(`\n${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
}
