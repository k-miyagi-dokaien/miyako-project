import type { DrawMode } from '@/types';
import { clsx } from 'clsx';

interface ToolbarProps {
  drawMode: DrawMode;
  onSelectDrawMode: (mode: DrawMode) => void;
  onImport: () => void;
  onExport: () => void;
  onRecalculateShares: () => void;
  onReset: () => void;
  showSprinklerBuffers: boolean;
  onToggleSprinklerBuffers: () => void;
}

const drawButtons: Array<{ label: string; mode: Exclude<DrawMode, null> }> = [
  { mode: 'faucet', label: '給水栓' },
  { mode: 'sprinkler', label: 'スプリンクラー' },
  { mode: 'parcel', label: '農地' }
];

const Toolbar = ({
  drawMode,
  onSelectDrawMode,
  onImport,
  onExport,
  onRecalculateShares,
  onReset,
  showSprinklerBuffers,
  onToggleSprinklerBuffers
}: ToolbarProps) => {
  return (
    <div className="flex items-center gap-2 text-sm">
      {drawButtons.map(({ mode, label }) => (
        <button
          key={mode}
          type="button"
          onClick={() => onSelectDrawMode(drawMode === mode ? null : mode)}
          className={clsx(
            'rounded border border-slate-700 px-3 py-1 transition',
            drawMode === mode
              ? 'bg-sky-600 text-white shadow'
              : 'bg-slate-800 hover:bg-slate-700'
          )}
        >
          {label}を作図
        </button>
      ))}
      <div className="ml-3 mr-1 h-6 w-px bg-slate-700" />
      <button
        type="button"
        onClick={onImport}
        className="rounded border border-slate-700 bg-slate-800 px-3 py-1 hover:bg-slate-700"
      >
        読み込み
      </button>
      <button
        type="button"
        onClick={onExport}
        className="rounded border border-emerald-700 bg-emerald-600 px-3 py-1 font-medium text-white hover:bg-emerald-500"
      >
        保存
      </button>
      <button
        type="button"
        onClick={onRecalculateShares}
        className="rounded border border-slate-700 bg-slate-800 px-3 py-1 hover:bg-slate-700"
      >
        面積割合計算
      </button>
      <button
        type="button"
        onClick={onReset}
        className="rounded border border-rose-700 bg-rose-600 px-3 py-1 font-medium text-white hover:bg-rose-500"
      >
        リセット
      </button>
      <button
        type="button"
        onClick={onToggleSprinklerBuffers}
        className={clsx(
          'rounded border px-3 py-1 transition',
          showSprinklerBuffers
            ? 'border-sky-500 bg-sky-600 text-white shadow'
            : 'border-slate-700 bg-slate-800 hover:bg-slate-700'
        )}
      >
        散水円{showSprinklerBuffers ? '非表示' : '表示'}
      </button>
    </div>
  );
};

export default Toolbar;
