import { Fragment } from 'react';
import { useAppStore } from '@/store/appStore';
import type { FaucetFeature, ParcelFeature, SprinklerFeature } from '@/types';
import { polygonAreaSqm } from '@/utils/geometry';

const formatCoordinate = (value: number) => value.toFixed(6);

const FaucetInspector = ({ feature }: { feature: FaucetFeature }) => {
  const farmers = useAppStore((state) => state.farmers);
  const upsertFaucet = useAppStore((state) => state.upsertFaucet);
  const removeFaucet = useAppStore((state) => state.removeFaucet);
  const select = useAppStore((state) => state.select);

  const handleChange = <K extends keyof FaucetFeature>(key: K, value: FaucetFeature[K]) => {
    upsertFaucet({ ...feature, [key]: value });
  };

  const handleShareChange = (index: number, key: 'farmerId' | 'share', value: string) => {
    const updatedShares = feature.farmerShares.map((share, idx) =>
      idx === index
        ? {
            ...share,
            [key]: key === 'share' ? Number(value) : value
          }
        : share
    );
    handleChange('farmerShares', updatedShares);
  };

  const addShare = () => {
    const fallbackFarmerId = farmers[0]?.id;
    if (!fallbackFarmerId) {
      return;
    }
    handleChange('farmerShares', [
      ...feature.farmerShares,
      { farmerId: fallbackFarmerId, share: 0 }
    ]);
  };

  const removeShare = (index: number) => {
    handleChange(
      'farmerShares',
      feature.farmerShares.filter((_, idx) => idx !== index)
    );
  };

  const shareTotal = feature.farmerShares.reduce((sum, share) => sum + share.share, 0);

  return (
    <div className="space-y-3">
      <header className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-100">給水栓</h3>
        <button
          type="button"
          onClick={() => {
            removeFaucet(feature.id);
            select(null);
          }}
          className="text-xs text-rose-400 hover:text-rose-300"
        >
          削除
        </button>
      </header>
      <div>
        <label className="text-xs text-slate-400">名称</label>
        <input
          value={feature.name}
          onChange={(event) => handleChange('name', event.target.value)}
          className="mt-1 w-full rounded border border-slate-700 bg-slate-950 px-2 py-1 text-sm text-slate-100 focus:border-sky-500 focus:outline-none"
        />
      </div>
      <div>
        <label className="text-xs text-slate-400">年間使用水量 (m³)</label>
        <input
          type="number"
          min={0}
          value={feature.annualWaterUsageM3}
          onChange={(event) => handleChange('annualWaterUsageM3', Number(event.target.value))}
          className="mt-1 w-full rounded border border-slate-700 bg-slate-950 px-2 py-1 text-sm text-slate-100 focus:border-sky-500 focus:outline-none"
        />
      </div>
      <div>
        <div className="flex items-center justify-between">
          <label className="text-xs text-slate-400">農家の利用割合</label>
          <button
            type="button"
            className="text-xs text-sky-400 hover:text-sky-300"
            onClick={addShare}
            disabled={farmers.length === 0}
          >
            追加
          </button>
        </div>
        <div className="mt-2 space-y-2">
          {feature.farmerShares.length === 0 && (
            <p className="text-xs text-slate-500">農家が割り当てられていません。</p>
          )}
          {feature.farmerShares.map((share, index) => (
            <Fragment key={`${share.farmerId}-${index}`}>
              <div className="flex items-center gap-2">
                <select
                  value={share.farmerId}
                  onChange={(event) => handleShareChange(index, 'farmerId', event.target.value)}
                  className="flex-1 rounded border border-slate-700 bg-slate-950 px-2 py-1 text-sm text-slate-100 focus:border-sky-500 focus:outline-none"
                >
                  {farmers.map((farmer) => (
                    <option key={farmer.id} value={farmer.id}>
                      {farmer.name}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  min={0}
                  max={1}
                  step={0.01}
                  value={share.share}
                  onChange={(event) => handleShareChange(index, 'share', event.target.value)}
                  className="w-24 rounded border border-slate-700 bg-slate-950 px-2 py-1 text-sm text-right text-slate-100 focus:border-sky-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => removeShare(index)}
                  className="text-xs text-rose-400 hover:text-rose-300"
                >
                  削除
                </button>
              </div>
            </Fragment>
          ))}
        </div>
        <p className="mt-1 text-xs text-slate-400">
          合計: <span className={shareTotal > 1.01 ? 'text-rose-300' : ''}>{shareTotal.toFixed(2)}</span>
        </p>
      </div>
      <div className="rounded border border-slate-800 bg-slate-900/50 p-2 text-xs text-slate-400">
        位置: {formatCoordinate(feature.geometry.geometry.coordinates[1])},
        {formatCoordinate(feature.geometry.geometry.coordinates[0])}
      </div>
    </div>
  );
};

const SprinklerInspector = ({ feature }: { feature: SprinklerFeature }) => {
  const upsertSprinkler = useAppStore((state) => state.upsertSprinkler);
  const removeSprinkler = useAppStore((state) => state.removeSprinkler);
  const faucets = useAppStore((state) => state.faucets);
  const select = useAppStore((state) => state.select);

  const handleChange = <K extends keyof SprinklerFeature>(key: K, value: SprinklerFeature[K]) => {
    upsertSprinkler({ ...feature, [key]: value });
  };

  return (
    <div className="space-y-3">
      <header className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-100">スプリンクラー</h3>
        <button
          type="button"
          onClick={() => {
            removeSprinkler(feature.id);
            select(null);
          }}
          className="text-xs text-rose-400 hover:text-rose-300"
        >
          削除
        </button>
      </header>
      <div>
        <label className="text-xs text-slate-400">名称</label>
        <input
          value={feature.name}
          onChange={(event) => handleChange('name', event.target.value)}
          className="mt-1 w-full rounded border border-slate-700 bg-slate-950 px-2 py-1 text-sm text-slate-100 focus:border-sky-500 focus:outline-none"
        />
      </div>
      <div>
        <label className="text-xs text-slate-400">給水栓</label>
        <select
          value={feature.faucetId ?? ''}
          onChange={(event) => handleChange('faucetId', event.target.value || undefined)}
          className="mt-1 w-full rounded border border-slate-700 bg-slate-950 px-2 py-1 text-sm text-slate-100 focus:border-sky-500 focus:outline-none"
        >
          <option value="">未割り当て</option>
          {faucets.map((faucet) => (
            <option key={faucet.id} value={faucet.id}>
              {faucet.name}
            </option>
          ))}
        </select>
      </div>
      <div className="rounded border border-slate-800 bg-slate-900/50 p-2 text-xs text-slate-400">
        位置: {formatCoordinate(feature.geometry.geometry.coordinates[1])},
        {formatCoordinate(feature.geometry.geometry.coordinates[0])}
      </div>
    </div>
  );
};

const ParcelInspector = ({ feature }: { feature: ParcelFeature }) => {
  const farmers = useAppStore((state) => state.farmers);
  const upsertParcel = useAppStore((state) => state.upsertParcel);
  const removeParcel = useAppStore((state) => state.removeParcel);
  const select = useAppStore((state) => state.select);

  const handleChange = <K extends keyof ParcelFeature>(key: K, value: ParcelFeature[K]) => {
    upsertParcel({ ...feature, [key]: value });
  };

  const coordinates = feature.geometry.geometry.coordinates[0];
  const geometryAreaSqm = polygonAreaSqm(feature.geometry);

  return (
    <div className="space-y-3">
      <header className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-100">農地</h3>
        <button
          type="button"
          onClick={() => {
            removeParcel(feature.id);
            select(null);
          }}
          className="text-xs text-rose-400 hover:text-rose-300"
        >
          削除
        </button>
      </header>
      <div>
        <label className="text-xs text-slate-400">名称</label>
        <input
          value={feature.name}
          onChange={(event) => handleChange('name', event.target.value)}
          className="mt-1 w-full rounded border border-slate-700 bg-slate-950 px-2 py-1 text-sm text-slate-100 focus:border-sky-500 focus:outline-none"
        />
      </div>
      <div>
        <label className="text-xs text-slate-400">農家</label>
        <select
          value={feature.farmerId ?? ''}
          onChange={(event) => handleChange('farmerId', event.target.value || undefined)}
          className="mt-1 w-full rounded border border-slate-700 bg-slate-950 px-2 py-1 text-sm text-slate-100 focus:border-sky-500 focus:outline-none"
        >
          <option value="">未割り当て</option>
          {farmers.map((farmer) => (
            <option key={farmer.id} value={farmer.id}>
              {farmer.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="text-xs text-slate-400">賦課面積 (㎡)</label>
        <input
          type="number"
          min={0}
          step={0.1}
          value={feature.assessedAreaSqm}
          onChange={(event) =>
            handleChange('assessedAreaSqm', Math.max(Number(event.target.value), 0))
          }
          className="mt-1 w-full rounded border border-slate-700 bg-slate-950 px-2 py-1 text-sm text-slate-100 focus:border-sky-500 focus:outline-none"
        />
      </div>
      <div className="rounded border border-slate-800 bg-slate-900/50 p-2 text-xs text-slate-400">
        <p>頂点数: {coordinates.length}</p>
        <p>地図面積: {geometryAreaSqm.toFixed(1)} ㎡</p>
      </div>
    </div>
  );
};

const FeatureInspector = () => {
  const selection = useAppStore((state) => state.selection);
  const faucets = useAppStore((state) => state.faucets);
  const sprinklers = useAppStore((state) => state.sprinklers);
  const parcels = useAppStore((state) => state.parcels);

  if (!selection) {
    return (
      <section className="rounded border border-slate-800 bg-slate-900/40 p-4 text-sm text-slate-300">
        地図上のオブジェクトを選択すると詳細が表示されます。
      </section>
    );
  }

  if (selection.type === 'faucet') {
    const feature = faucets.find((item) => item.id === selection.id);
    if (!feature) {
      return null;
    }
    return (
      <section className="rounded border border-slate-800 bg-slate-900/40 p-4 text-sm text-slate-300">
        <FaucetInspector feature={feature} />
      </section>
    );
  }

  if (selection.type === 'sprinkler') {
    const feature = sprinklers.find((item) => item.id === selection.id);
    if (!feature) {
      return null;
    }
    return (
      <section className="rounded border border-slate-800 bg-slate-900/40 p-4 text-sm text-slate-300">
        <SprinklerInspector feature={feature} />
      </section>
    );
  }

  if (selection.type === 'parcel') {
    const feature = parcels.find((item) => item.id === selection.id);
    if (!feature) {
      return null;
    }
    return (
      <section className="rounded border border-slate-800 bg-slate-900/40 p-4 text-sm text-slate-300">
        <ParcelInspector feature={feature} />
      </section>
    );
  }

  return null;
};

export default FeatureInspector;
