import type { AssetId, PrototypeId } from '../types';

export type AssetKind = 'bg' | 'char';

interface AssetImageProps {
  assetId: AssetId;
  kind: AssetKind;
  prototypeId: PrototypeId;
  className?: string;
}

const KIND_LABEL: Record<AssetKind, string> = {
  bg: '背景 9:16',
  char: '人物 透過PNG',
};

/** 素材IDから安定した色を作る（同じIDなら常に同じ色になる） */
function hueFromId(assetId: string): number {
  let hash = 0;
  for (let i = 0; i < assetId.length; i += 1) {
    hash = (hash * 31 + assetId.charCodeAt(i)) % 360;
  }
  return hash;
}

/**
 * 素材の表示。
 * フェーズ0では実ファイルを持たないため、常にダミー（色付き矩形＋素材ID）を描く。
 * 実素材は public/assets/<prototypeId>/<assetId>.<ext> に置き、
 * 素材が揃った段階でこのコンポーネントだけを差し替える。
 */
export function AssetImage({ assetId, kind, prototypeId, className = '' }: AssetImageProps) {
  const hue = hueFromId(assetId);

  return (
    <div
      className={`flex flex-col items-center justify-center gap-1 overflow-hidden text-center ${className}`}
      style={{
        background: `linear-gradient(160deg, hsl(${hue} 42% 72%), hsl(${(hue + 40) % 360} 38% 52%))`,
      }}
      role="img"
      aria-label={`${KIND_LABEL[kind]}のダミー画像（素材ID: ${assetId}）`}
    >
      <span className="rounded-full bg-black/45 px-2 py-0.5 text-[11px] text-white">
        {KIND_LABEL[kind]}
      </span>
      <span className="px-2 text-xs font-medium break-all text-white drop-shadow">{assetId}</span>
      <span className="text-[10px] text-white/75">{prototypeId}</span>
    </div>
  );
}
