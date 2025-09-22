import { useAppStore } from '@/store/appStore';

const LayerLegend = () => {
  const faucets = useAppStore((state) => state.faucets);
  const sprinklers = useAppStore((state) => state.sprinklers);
  const parcels = useAppStore((state) => state.parcels);

  return (
    <section className="rounded border border-slate-800 bg-slate-900/40 p-4 text-sm text-slate-300">
      <h2 className="text-sm font-semibold text-slate-100">レイヤー概要</h2>
      <ul className="mt-2 space-y-1 text-xs">
        <li>給水栓: {faucets.length}</li>
        <li>スプリンクラー: {sprinklers.length}</li>
        <li>農地: {parcels.length}</li>
      </ul>
    </section>
  );
};

export default LayerLegend;
