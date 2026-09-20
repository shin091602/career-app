import type { PrototypeId, StageCharacter as StageCharacterData } from '../../types';
import { AssetImage } from '../../components';

/** 立ち絵の横位置 */
const SLOT_CLASS = {
  left: 'left-0',
  center: 'left-1/2 -translate-x-1/2',
  right: 'right-0',
} as const;

interface StageCharacterProps {
  character: StageCharacterData;
  prototypeId: PrototypeId;
  /** 同じ場面に話者指定の人物がいるか（いなければ全員を等しく明るく出す） */
  hasSpeaker: boolean;
}

/**
 * 立ち絵1体。
 * 話している人物は手前に出して明るく、それ以外は少し引いて暗くする。
 * 表情差分は素材IDで分けているので、ここでは assetId をそのまま使う。
 */
export function StageCharacter({ character, prototypeId, hasSpeaker }: StageCharacterProps) {
  const dimmed = hasSpeaker && !character.speaking;

  return (
    <div
      className={`absolute bottom-0 h-[62%] w-[48%] max-w-[220px] transition-all duration-300 ${
        SLOT_CLASS[character.slot]
      } ${character.speaking ? 'z-20' : 'z-10'}`}
      style={{
        filter: dimmed ? 'brightness(0.55) saturate(0.8)' : 'none',
        transform: `${character.slot === 'center' ? 'translateX(-50%) ' : ''}scale(${
          character.speaking ? 1 : 0.94
        })`,
        transformOrigin: 'bottom center',
      }}
    >
      <AssetImage
        assetId={character.assetId}
        kind="char"
        prototypeId={prototypeId}
        className="size-full rounded-t-xl"
      />
    </div>
  );
}
