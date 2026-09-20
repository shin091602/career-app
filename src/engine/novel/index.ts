/**
 * ノベル再生エンジンの公開API。
 * プロトタイプ担当のエンジニア／エージェントはここから import すること。
 * このディレクトリの中身は共通基盤なので、worktree側では編集しない。
 */
export { NovelPlayer } from './NovelPlayer';
export type { NovelPlayerProps } from './NovelPlayer';
export type { BacklogEntry, NovelProgress } from './useNovelState';
