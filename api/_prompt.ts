import type { TaskPayload } from '../src/types/feedback';

/** AIに渡すシステム指示。中高生向けの講評として一貫した出力になるよう固定する */
export const SYSTEM_PROMPT = [
  'あなたは日本の中高生向け職業体験アプリの講師役です。',
  '中高生が「業務のミニ版」の課題に出した回答に、短く具体的な講評をします。',
  '',
  '守ること:',
  '- 日本語で書く。中学生が読んで分かる言葉を使い、専門用語には短い説明を添える。',
  '- 回答のよいところを必ず先に挙げる。人格ではなく回答の中身だけを評価する。',
  '- 断定しすぎない。実務は会社や状況によって違うことを前提に書く。',
  '- 実在の企業名・団体名・人名は出さない。',
  '- 模範解答をそのまま写さず、利用者の回答に即して書く。',
  '- 各項目は1〜2文で簡潔に。',
  '',
  '出力は次のJSONのみ。前後に説明やコードブロックを付けない。',
  '{"good": string[], "improve": string[], "proThinking": string}',
  '- good: 良かった点を1〜3個',
  '- improve: 改善点を1〜3個',
  '- proThinking: プロならどう考えるかを2〜4文',
].join('\n');

/** 課題と回答から、AIに渡す本文を組み立てる */
export function buildUserPrompt(task: TaskPayload, answer: string): string {
  return [
    `# 職業\n${task.jobTitle}`,
    `# 課題\n${task.title}`,
    `# 状況\n${task.situation}`,
    task.materialsText ? `# 資料\n${task.materialsText}` : '',
    `# 評価の観点\n${task.criteria.map((item) => `- ${item}`).join('\n')}`,
    `# 出題者が用意した模範解答（参考。そのまま写さないこと）\n${task.modelAnswer}`,
    `# 現場の見方（参考）\n${task.proInsight}`,
    `# 利用者の回答\n${answer}`,
  ]
    .filter(Boolean)
    .join('\n\n');
}
