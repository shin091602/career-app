/**
 * ショートドラマ再生エンジンの公開API。
 * プロトタイプ担当のエンジニア／エージェントはここから import すること。
 * このディレクトリの中身は共通基盤なので、worktree側では編集しない。
 */
export { EpisodePlayer } from './EpisodePlayer';
export type { EpisodePlayerProps } from './EpisodePlayer';
export type { EpisodeProgress, LogEntry } from './useEpisodeState';
