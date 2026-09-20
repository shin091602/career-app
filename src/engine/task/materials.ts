import type { Material, Task, TaskPayload } from '../../types';

/** 資料をAIに渡すためのプレーンテキストへ整形する */
export function materialToText(material: Material): string {
  switch (material.kind) {
    case 'text':
    case 'note':
      return `【${material.title}】\n${material.body}`;
    case 'table': {
      const header = material.headers.join(' | ');
      const body = material.rows.map((row) => row.join(' | ')).join('\n');
      const caption = material.caption ? `\n(${material.caption})` : '';
      return `【${material.title}】\n${header}\n${body}${caption}`;
    }
  }
}

/** 課題からAIに渡す部分だけを抜き出す（模範解答も採点基準として渡す） */
export function toTaskPayload(task: Task, jobTitle: string): TaskPayload {
  return {
    title: task.title,
    jobTitle,
    situation: task.situation,
    materialsText: task.materials.map(materialToText).join('\n\n'),
    criteria: task.criteria.map((criterion) => `${criterion.label}：${criterion.description}`),
    modelAnswer: task.modelAnswer,
    proInsight: task.proInsight,
  };
}
