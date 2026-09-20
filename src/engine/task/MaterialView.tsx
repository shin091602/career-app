import type { Material } from '../../types';
import { Card } from '../../components';

/** 課題に添える資料の表示。表はスマホでも崩れないよう横スクロールにする */
export function MaterialView({ material }: { material: Material }) {
  if (material.kind === 'table') {
    return (
      <Card>
        <h3 className="mb-2 text-sm font-bold">{material.title}</h3>
        <div className="-mx-1 overflow-x-auto">
          <table className="w-full min-w-[280px] border-collapse text-sm">
            <thead>
              <tr>
                {material.headers.map((header) => (
                  <th
                    key={header}
                    className="border-b border-line px-2 py-1.5 text-left font-medium whitespace-nowrap"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {material.rows.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {row.map((cell, cellIndex) => (
                    <td
                      key={cellIndex}
                      className="border-b border-line px-2 py-1.5 whitespace-nowrap tabular-nums"
                    >
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {material.caption && <p className="mt-2 text-xs text-ink-muted">{material.caption}</p>}
      </Card>
    );
  }

  return (
    <Card className={material.kind === 'note' ? 'bg-surface-muted' : undefined}>
      <h3 className="mb-1 text-sm font-bold">{material.title}</h3>
      <p className="whitespace-pre-wrap text-sm leading-relaxed">{material.body}</p>
    </Card>
  );
}
