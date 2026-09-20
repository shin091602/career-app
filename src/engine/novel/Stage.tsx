import type { PrototypeId, Scene } from '../../types';
import { AssetImage } from '../../components';
import { StageCharacter } from './StageCharacter';
import type { TransitionPhase } from './useSceneTransition';

interface StageProps {
  scene: Scene;
  prototypeId: PrototypeId;
  phase: TransitionPhase;
}

/**
 * 画面全体の背景と立ち絵。
 * テキストボックスやテロップは、この上に重ねて置かれる。
 */
export function Stage({ scene, prototypeId, phase }: StageProps) {
  const characters = scene.characters ?? [];
  const hasSpeaker = characters.some((character) => character.speaking);

  return (
    <div className="absolute inset-0 overflow-hidden bg-bg">
      <div
        key={scene.bgAssetId ?? scene.id}
        className="absolute inset-0"
        style={phase === 'fade' ? { animation: 'novel-fade-in 420ms ease-out' } : undefined}
      >
        {scene.bgAssetId ? (
          <AssetImage
            assetId={scene.bgAssetId}
            kind="bg"
            prototypeId={prototypeId}
            className="size-full"
          />
        ) : (
          <div className="size-full bg-surface-muted" />
        )}
      </div>

      {/* 下半分を少し暗くして、テキストボックスの文字を読みやすくする */}
      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/45 to-transparent" />

      {characters.map((character) => (
        <StageCharacter
          key={`${character.slot}-${character.assetId}`}
          character={character}
          prototypeId={prototypeId}
          hasSpeaker={hasSpeaker}
        />
      ))}

      {/* 暗転。覆われている間に場面が差し替わる */}
      {phase === 'blackout' && (
        <div
          className="absolute inset-0 z-30 bg-black"
          style={{ animation: 'novel-blackout 720ms ease-in-out' }}
        />
      )}
    </div>
  );
}
