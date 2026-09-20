import type { DocumentZoom, PrototypeId } from '../../types';
import { AssetImage, MaterialView } from '../../components';

interface DocumentOverlayProps {
  document: DocumentZoom;
  prototypeId: PrototypeId;
  onClose: () => void;
}

/**
 * 書類（決算書・企画書など）のズーム表示。
 * 表の描画は課題画面と同じ MaterialView を使うので、見た目が揃う。
 */
export function DocumentOverlay({ document, prototypeId, onClose }: DocumentOverlayProps) {
  return (
    <div className="absolute inset-0 z-40 flex flex-col bg-black/70">
      <div
        className="flex items-center justify-between px-4 pb-2"
        style={{ paddingTop: 'calc(0.75rem + env(safe-area-inset-top, 0px))' }}
      >
        <h2
          className="text-base font-bold text-white"
          style={{ fontFamily: 'var(--novel-font-display)' }}
        >
          {document.title}
        </h2>
        <button
          onClick={onClose}
          className="min-h-[36px] rounded-full bg-white/20 px-3 text-sm text-white"
        >
          閉じる
        </button>
      </div>

      <div
        className="flex-1 space-y-3 overflow-y-auto px-4"
        style={{
          paddingBottom: 'calc(1rem + env(safe-area-inset-bottom, 0px))',
          animation: 'novel-zoom-in 240ms ease-out',
        }}
      >
        {document.assetId && (
          <AssetImage
            assetId={document.assetId}
            kind="bg"
            prototypeId={prototypeId}
            className="aspect-[4/3] w-full rounded-xl"
          />
        )}
        <MaterialView material={document.material} />
      </div>
    </div>
  );
}
