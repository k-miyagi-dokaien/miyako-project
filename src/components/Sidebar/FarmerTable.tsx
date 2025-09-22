import { useMemo, useState } from 'react';
import { useAppStore } from '@/store/appStore';
import { calculateFarmerWaterUsage } from '@/utils/waterUsage';
import { calculateFarmerBilling } from '@/utils/billing';

const FarmerTable = () => {
  const farmers = useAppStore((state) => state.farmers);
  const faucets = useAppStore((state) => state.faucets);
  const parcels = useAppStore((state) => state.parcels);
  const addFarmer = useAppStore((state) => state.addFarmer);
  const updateFarmer = useAppStore((state) => state.updateFarmer);
  const removeFarmer = useAppStore((state) => state.removeFarmer);
  const [message, setMessage] = useState<string | null>(null);

  const waterUsageByFarmer = useMemo(() => calculateFarmerWaterUsage(faucets), [faucets]);
  const billingByFarmer = useMemo(
    () => calculateFarmerBilling(parcels, waterUsageByFarmer),
    [parcels, waterUsageByFarmer]
  );

  const handleRemove = (id: string) => {
    const ok = removeFarmer(id);
    if (!ok) {
      setMessage('リンクされている農地または給水栓があるため削除できません');
      return;
    }
    setMessage(null);
  };

  return (
    <section className="space-y-3">
      <header className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-slate-100">農家</h2>
        <button
          type="button"
          onClick={() => addFarmer('新しい農家')}
          className="rounded border border-slate-700 bg-slate-800 px-2 py-1 text-xs hover:bg-slate-700"
        >
          追加
        </button>
      </header>
      <div className="space-y-2">
        {farmers.length === 0 && (
          <p className="text-xs text-slate-400">農家を追加すると一覧に表示されます。</p>
        )}
        {farmers.map((farmer) => {
          const waterUsage = waterUsageByFarmer.get(farmer.id) ?? 0;
          const billing = billingByFarmer.get(farmer.id);
          const assessedArea = billing?.assessedAreaSqm ?? 0;
          return (
            <div key={farmer.id} className="rounded border border-slate-700 bg-slate-900/40 p-3">
              <label className="block text-xs text-slate-400">名称</label>
              <input
                value={farmer.name}
                onChange={(event) => updateFarmer(farmer.id, { name: event.target.value })}
                className="mt-1 w-full rounded border border-slate-700 bg-slate-950 px-2 py-1 text-sm text-slate-100 focus:border-sky-500 focus:outline-none"
              />
              <div className="mt-3 space-y-1 text-xs text-slate-300">
                <p>年間使用量: {waterUsage.toFixed(1)} m³</p>
                <p>賦課面積: {assessedArea.toFixed(1)} ㎡</p>
                {billing ? (
                  <>
                    <p>基本料金(地積割): {Math.round(billing.baseFeeYen).toLocaleString()} 円</p>
                    <p>基本水量: {billing.baseVolumeM3.toFixed(1)} m³</p>
                    <p>超過水量: {billing.overageVolumeM3.toFixed(1)} m³</p>
                    <p>超過水量料: {Math.round(billing.overageFeeYen).toLocaleString()} 円</p>
                    <p className="font-semibold text-emerald-300">
                      合計(非課税): {Math.round(billing.totalYen).toLocaleString()} 円
                    </p>
                  </>
                ) : (
                  <p className="text-slate-500">賦課面積と使用水量が0のため料金は発生しません。</p>
                )}
              </div>
              <div className="mt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => handleRemove(farmer.id)}
                  className="text-xs text-rose-400 hover:text-rose-300"
                >
                  削除
                </button>
              </div>
            </div>
          );
        })}
      </div>
      {message && <p className="text-xs text-amber-400">{message}</p>}
    </section>
  );
};

export default FarmerTable;
