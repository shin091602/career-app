import type { Shot, Subtitle } from '../../types';

/**
 * その時刻に出す字幕を返す。
 * durationSec の指定がなければ、次の字幕が出るまで表示し続ける。
 */
export function currentSubtitle(shot: Shot, elapsedSec: number): Subtitle | null {
  const ordered = [...shot.subtitles].sort((a, b) => a.atSec - b.atSec);

  for (let i = ordered.length - 1; i >= 0; i -= 1) {
    const subtitle = ordered[i];
    if (elapsedSec < subtitle.atSec) continue;

    const nextAt = ordered[i + 1]?.atSec ?? shot.durationSec;
    const endsAt = subtitle.durationSec ? subtitle.atSec + subtitle.durationSec : nextAt;
    return elapsedSec < endsAt ? subtitle : null;
  }

  return null;
}
