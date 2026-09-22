/**
 * Flow制作シート（docs/flow/<エピソードID>.md）の組み立て。
 *
 * 動画は開発者が Google Flow（Veo 3.1）で1本ずつ作る。
 * このシートは、Flow に貼るプロンプトを**作る順番どおりに**並べたもの：
 *
 *   1. 人物の設定画（3方向） → Flow の Ingredients に登録する
 *   2. 場所の背景画
 *   3. キーフレーム（Frames to Video の始点・終点になる静止画）
 *   4. クリップ（始点・終点を指定して動画にする）
 *
 * 保存名どおりに inbox/ へ置いて npm run import-assets を実行すると、アプリに入る。
 * 生成済みかどうかは public/assets/ を見て判定するので、シートを作り直しても印は消えない。
 *
 * npm run shotlist から呼ばれる（キーフレームを使うエピソードだけ）。
 */
import type {
  CharacterAngle,
  Episode,
  ProductionCharacter,
  ProductionKeyframe,
  ProductionNotes,
  PrototypeId,
  Shot,
} from '../src/types/index.ts';
import { SCORE_ENDING, endingForScore, scoreEndings } from '../src/types/index.ts';
import { assetExists, nextIdsOf } from './episodes.mts';
import { scoreDistribution } from './validate-episode.mts';

const DEFAULT_ANGLES: CharacterAngle[] = ['front', 'three-quarter', 'profile'];

const ANGLE_LABEL: Record<CharacterAngle, string> = {
  front: '正面',
  'three-quarter': '斜め45度',
  profile: '真横',
};

const ANGLE_POSE: Record<CharacterAngle, string> = {
  front: '体も顔も正面を向いた上半身。',
  'three-quarter': '体と顔を斜め45度に向けた上半身。',
  profile: '体と顔を真横に向けた上半身。',
};

/** 設定画の撮り方（どの人物・どの向きでも同じにする） */
const SHEET_STYLE =
  '無地の薄いグレー背景のスタジオ写真、柔らかく均一な光。実写。85mm相当のレンズ、' +
  '肌の質感や布の織り目が分かる解像感。イラスト・アニメ調・CGにしない。' +
  '実在の人物に似せない架空の人物。文字・ロゴは入れない。縦9:16。';

/** 一人称視点の決まり（キーフレームにもクリップにも付ける） */
const POV_RULE = '一人称視点：カメラはソファに座っている新人の目線そのもの。主人公は映さない。';

const CLIP_TAIL = '実写。字幕・文字・ロゴ・透かしは入れない。BGMは入れない。';

function mark(done: boolean): string {
  return done ? '✅' : '⬜';
}

function block(text: string): string {
  return ['```text', text, '```'].join('\n');
}

function characterPrompt(
  character: ProductionCharacter,
  angle: CharacterAngle,
  first: CharacterAngle,
): string {
  const base =
    angle === first
      ? `キャラクターの設定画。${character.appearance}`
      : `参照画像（${ANGLE_LABEL[first]}の設定画）と同じ人物。顔・髪型・ひげの有無・服装・撮り方を一切変えず、向きだけ変える。${character.appearance}`;
  return [base, ANGLE_POSE[angle], '表情は落ち着いた真顔、口は閉じている。', SHEET_STYLE].join('');
}

function keyframePrompt(keyframe: ProductionKeyframe, production: ProductionNotes): string {
  const names = (keyframe.characterIds ?? [])
    .map((id) => production.characters.find((character) => character.id === id)?.name ?? id)
    .join('、');
  const place = production.places.find((candidate) => candidate.id === keyframe.placeId);
  return [
    keyframe.prompt,
    POV_RULE,
    names ? `参照画像の人物（${names}）の顔・髪型・服装をそのまま使う。` : '',
    place ? `背景は参照画像の場所（${place.name}）と同じ部屋。` : '',
  ]
    .filter(Boolean)
    .join('');
}

function clipPrompt(shot: Shot, production: ProductionNotes): string {
  const note = production.shots[shot.id];
  const lines = shot.subtitles.filter(
    (subtitle) => subtitle.speaker && !subtitle.speaker.startsWith('（'),
  );
  // 同じ人が続けて話す字幕は1つのセリフにまとめる（字幕は短く切ってあるため）
  const spoken: { speaker: string; text: string }[] = [];
  for (const line of lines) {
    const last = spoken[spoken.length - 1];
    if (last && last.speaker === line.speaker) last.text += line.text;
    else spoken.push({ speaker: line.speaker as string, text: line.text });
  }
  const dialogue =
    spoken.length > 0
      ? `セリフ（日本語。自然な話し方で、口の動きを合わせる）：${spoken
          .map((line) => `${line.speaker}「${line.text}」`)
          .join(' ')}`
      : 'セリフは無い。';
  return [
    note?.motionPrompt ?? '',
    note?.cameraNote ?? POV_RULE,
    dialogue,
    `音：${note?.soundNote ?? 'その場の自然な環境音だけ。'}`,
    shot.branch ? '最後の1秒は動きを止め、相手はこちらを見たまま返事を待つ。' : '',
    CLIP_TAIL,
  ]
    .filter(Boolean)
    .join('\n');
}

/** 再生順に並べ、ターンごとに区切る */
function turnsOf(episode: Episode): { title: string; shots: Shot[] }[] {
  const endingIds = new Set(episode.endings.map((ending) => ending.shotId));
  const scoreTargets = scoreEndings(episode).map((ending) => ending.shotId);
  const seen = new Set<string>();
  const order: Shot[] = [];
  const queue = [episode.startShotId];

  while (queue.length > 0) {
    const id = queue.shift();
    if (!id || seen.has(id)) continue;
    const shot = episode.shots.find((candidate) => candidate.id === id);
    if (!shot) continue;
    seen.add(id);
    order.push(shot);
    for (const next of nextIdsOf(shot)) {
      if (next === SCORE_ENDING) queue.push(...scoreTargets);
      else queue.push(next);
    }
  }
  for (const shot of episode.shots) if (!seen.has(shot.id)) order.push(shot);

  const groups: { title: string; shots: Shot[] }[] = [];
  let turn = 0;
  for (const shot of order) {
    if (endingIds.has(shot.id) || shot.kind === 'debrief') {
      const last = groups[groups.length - 1];
      if (last?.title === '結末') last.shots.push(shot);
      else groups.push({ title: '結末', shots: [shot] });
    } else if (shot.kind === 'story' && shot.branch) {
      turn += 1;
      groups.push({ title: `ターン${turn}`, shots: [shot] });
    } else {
      const last = groups[groups.length - 1];
      if (last && last.title !== '結末') last.shots.push(shot);
      else groups.push({ title: 'つなぎ', shots: [shot] });
    }
  }
  return groups;
}

function branchLine(episode: Episode, shot: Shot): string {
  if (!shot.branch) return '';
  const target = (id: string) => (id === SCORE_ENDING ? '点数で結末へ' : `\`${id}\``);
  const [left, right] = shot.branch.choices;
  return [
    '',
    `**ここで選択**（最後のコマで止まったまま、制限時間 ${shot.branch.timeLimitSec ?? 'なし'} 秒）`,
    `- 「${left.label}」→ ${target(left.nextShotId)}`,
    `- 「${right.label}」→ ${target(right.nextShotId)}`,
    `- 時間切れ「${shot.branch.onTimeout.label}」→ ${target(shot.branch.onTimeout.nextShotId)}`,
  ].join('\n');
}

function scoreSection(episode: Episode): string {
  const tiers = scoreEndings(episode);
  if (tiers.length === 0) return '';
  const distribution = scoreDistribution(episode);
  const total = [...distribution.values()].reduce((sum, count) => sum + count, 0);
  const scores = [...distribution.keys()].sort((a, b) => a - b);

  const rows = [...tiers].reverse().map((tier) => {
    const count = scores
      .filter((score) => endingForScore(episode, score)?.id === tier.id)
      .reduce((sum, score) => sum + (distribution.get(score) ?? 0), 0);
    const band = Number.isFinite(tier.minScore ?? 0) ? `${tier.minScore}点以上` : 'それ未満';
    return `| ${tier.type} | ${band} | ${count} / ${total} 通り | \`${tier.shotId}\` |`;
  });

  return [
    '## 結末と点数',
    '',
    `点数は ${
      episode.scoreGauges?.join(' + ') ?? episode.gauges.map((gauge) => gauge.label).join(' + ')
    } の合計。取りうる点数は **${scores[0]}〜${scores[scores.length - 1]}**（選び方は時間切れも含めて ${total} 通り）。`,
    '',
    '| 結末 | 点数帯 | 届く選び方 | クリップ |',
    '| --- | --- | --- | --- |',
    ...rows,
    '',
  ].join('\n');
}

export function renderFlowSheet(
  prototypeId: PrototypeId,
  episode: Episode,
  production: ProductionNotes,
): string {
  const notes = episode.shots.map((shot) => production.shots[shot.id]);
  const keyframeIds = new Set(
    notes.flatMap((note) => [note?.startFrame, note?.endFrame]).filter(Boolean) as string[],
  );
  const keyframes = (production.keyframes ?? []).filter((keyframe) => keyframeIds.has(keyframe.id));
  const characterIds = new Set([
    ...notes.flatMap((note) => note?.characterIds ?? []),
    ...keyframes.flatMap((keyframe) => keyframe.characterIds ?? []),
  ]);
  const characters = production.characters.filter((character) => characterIds.has(character.id));
  const placeIds = new Set(
    [...notes.map((note) => note?.placeId), ...keyframes.map((keyframe) => keyframe.placeId)].filter(
      Boolean,
    ),
  );
  const places = production.places.filter((place) => placeIds.has(place.id));

  const videos = episode.shots.filter((shot) => shot.videoAssetId);
  const videosDone = videos.filter((shot) =>
    assetExists(prototypeId, shot.videoAssetId as string, 'mp4'),
  ).length;
  const keyframesDone = keyframes.filter((keyframe) =>
    assetExists(prototypeId, keyframe.id, 'webp'),
  ).length;
  const sheetCount = characters.reduce(
    (sum, character) => sum + (character.angles ?? DEFAULT_ANGLES).length,
    0,
  );

  const out: string[] = [];
  out.push('<!-- このファイルは npm run shotlist で生成されます。直接編集しないでください。 -->', '');
  out.push(`# Flow制作シート：${episode.title}`, '');
  out.push(`- エピソードID：\`${episode.id}\`（プロトタイプ：\`${prototypeId}\`）`);
  out.push(
    `- 作るもの：人物の設定画 ${sheetCount}枚／場所 ${places.length}枚／キーフレーム ${keyframes.length}枚／クリップ ${videos.length}本`,
  );
  out.push(
    `- 進み具合：キーフレーム ${keyframesDone} / ${keyframes.length}、クリップ ${videosDone} / ${videos.length}`,
  );
  out.push('');
  out.push('## 進め方', '');
  out.push('上から順に、プロンプトを1つずつ Flow に貼って作っていく。');
  out.push('');
  out.push('1. **人物の設定画**を3方向ずつ作り、Flow の Ingredients に登録する（2枚目以降は1枚目を参照画像に）');
  out.push('2. **場所**の背景画を作る');
  out.push('3. **キーフレーム**を作る。人物の設定画と場所を参照画像に入れる');
  out.push('4. **クリップ**を作る。Frames to Video で「始点」「終点」のキーフレームを指定し、プロンプトを貼る');
  out.push('   （終点が「なし」のものは始点だけ。尺は8秒でも10秒でもよい。アプリが実際の長さに合わせる）');
  out.push('5. **保存名どおりの名前**で `inbox/` に置き、`npm run import-assets` を実行する');
  out.push('   （キーフレームも入れると、動画が無いときの代替表示に使われる。設定画と場所は Flow の中で使うだけでよい）');
  out.push('');
  out.push('同じ人物は、どのキーフレームでも**同じ設定画**を参照させること。顔が揃う一番の決め手になる。');
  out.push('');

  // 1. 人物
  out.push('## 1. 人物の設定画', '');
  for (const character of characters) {
    const angles = character.angles ?? DEFAULT_ANGLES;
    const first = angles[0];
    out.push(`### ${character.name}（\`${character.id}\`）`, '');
    for (const angle of angles) {
      const reference = angle === first ? '' : `／参照画像：\`${character.id}-${first}\``;
      out.push(`**${ANGLE_LABEL[angle]}**　保存名 \`${character.id}-${angle}.png\`${reference}`, '');
      out.push(block(characterPrompt(character, angle, first)), '');
    }
  }

  // 2. 場所
  out.push('## 2. 場所', '');
  for (const place of places) {
    out.push(`### ${place.name}（\`${place.id}\`）`, '');
    out.push(`保存名 \`${place.id}.png\``, '');
    out.push(block(place.prompt.includes('人物は映さない') ? place.prompt : `${place.prompt}人物は映さない。`), '');
  }

  // 3. キーフレーム
  out.push('## 3. キーフレーム', '');
  out.push('Frames to Video の始点・終点になる静止画。**同じキーフレームを使うクリップ同士は、継ぎ目なくつながる。**', '');
  for (const keyframe of keyframes) {
    const uses = episode.shots
      .flatMap((shot) => {
        const note = production.shots[shot.id];
        const roles: string[] = [];
        if (note?.startFrame === keyframe.id) roles.push(`\`${shot.id}\` の始点`);
        if (note?.endFrame === keyframe.id) roles.push(`\`${shot.id}\` の終点`);
        return roles;
      })
      .join('、');
    const references = [
      ...(keyframe.characterIds ?? []).map((id) => `\`${id}\`（設定画）`),
      ...(keyframe.placeId ? [`\`${keyframe.placeId}\`（場所）`] : []),
    ].join('、');
    out.push(
      `### ${mark(assetExists(prototypeId, keyframe.id, 'webp'))} ${keyframe.name}`,
      '',
      `- 保存名：\`${keyframe.id}.png\``,
      `- 参照画像：${references || 'なし'}`,
      `- 使うところ：${uses}`,
      '',
      block(keyframePrompt(keyframe, production)),
      '',
    );
  }

  // 4. クリップ
  out.push('## 4. クリップ', '');
  for (const group of turnsOf(episode)) {
    out.push(`### ${group.title}`, '');
    for (const shot of group.shots) {
      const note = production.shots[shot.id];
      const kind = { story: '本編', reaction: '反応', ending: '結末', debrief: '答え合わせ' }[shot.kind];
      const done = shot.videoAssetId ? assetExists(prototypeId, shot.videoAssetId, 'mp4') : false;
      const ingredients = (note?.characterIds ?? [])
        .map((id) => production.characters.find((character) => character.id === id)?.name ?? id)
        .join('、');
      out.push(`#### ${mark(done)} \`${shot.id}\`（${kind}）`, '');
      out.push(`- 保存名：\`${shot.videoAssetId}.mp4\``);
      out.push(
        `- Frames to Video：始点 \`${note?.startFrame ?? 'なし'}\` ／ 終点 \`${note?.endFrame ?? 'なし'}\``,
      );
      out.push(`- Ingredients：${ingredients || 'なし'}`);
      out.push(`- 尺：8秒か10秒（アプリの想定は ${shot.durationSec} 秒。字幕はその中に収めてある）`);
      out.push('', block(clipPrompt(shot, production)));
      const branch = branchLine(episode, shot);
      if (branch) out.push(branch);
      out.push('');
    }
  }

  out.push(scoreSection(episode));
  return out.join('\n');
}

/** Flow制作シートを作る対象か（キーフレームを使っているエピソードだけ） */
export function usesKeyframes(episode: Episode, production: ProductionNotes): boolean {
  return episode.shots.some((shot) => Boolean(production.shots[shot.id]?.startFrame));
}
