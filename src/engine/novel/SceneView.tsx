import type { PrototypeId, Scene } from '../../types';
import { AssetImage, TermList } from '../../components';

interface SceneViewProps {
  scene: Scene;
  prototypeId: PrototypeId;
  /** テキスト部分をタップしたとき（次へ送る） */
  onTapText?: () => void;
}

/**
 * 1場面の表示。背景（9:16）の上に人物を重ね、下にテキストボックスを置く。
 * スマホ縦画面での読みやすさを優先し、背景は画面幅いっぱいに広げる。
 */
export function SceneView({ scene, prototypeId, onTapText }: SceneViewProps) {
  return (
    <div className="space-y-3">
      <div className="relative w-full overflow-hidden rounded-2xl border border-line aspect-[9/16] max-h-[52dvh]">
        {scene.bgAssetId ? (
          <AssetImage
            assetId={scene.bgAssetId}
            kind="bg"
            prototypeId={prototypeId}
            className="absolute inset-0 size-full"
          />
        ) : (
          <div className="absolute inset-0 bg-surface-muted" />
        )}

        {scene.charAssetId && (
          <AssetImage
            assetId={scene.charAssetId}
            kind="char"
            prototypeId={prototypeId}
            className="absolute bottom-0 left-1/2 h-[68%] w-[52%] -translate-x-1/2 rounded-t-2xl"
          />
        )}
      </div>

      <div
        className="rounded-2xl bg-overlay px-4 py-3 text-overlay-ink"
        onClick={onTapText}
        role={onTapText ? 'button' : undefined}
        tabIndex={onTapText ? 0 : undefined}
        onKeyDown={(event) => {
          if (!onTapText) return;
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            onTapText();
          }
        }}
      >
        {scene.speaker && <p className="mb-1 text-sm font-bold text-accent">{scene.speaker}</p>}
        <p className="whitespace-pre-wrap text-base leading-relaxed">{scene.text}</p>
      </div>

      <TermList terms={scene.terms} />
    </div>
  );
}
