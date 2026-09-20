import type { AssetId, PrototypeId } from '../../types';

/** 動画は mp4、静止画は webp、音は mp3 に揃える */
export type AssetExt = 'mp4' | 'webp' | 'mp3';

/** 素材ファイルの置き場所。import-assets スクリプトが同じ場所に書き出す */
export function assetUrl(prototypeId: PrototypeId, assetId: AssetId, ext: AssetExt): string {
  return `/assets/${prototypeId}/${assetId}.${ext}`;
}
