import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import type {
  DrawMode,
  Farmer,
  FarmerShare,
  FaucetFeature,
  MapView,
  ParcelFeature,
  PersistedState,
  Selection,
  SprinklerFeature
} from '@/types';
import { createId } from '@/utils/id';
import { serializeState } from '@/utils/serializer';
import { calculateFaucetShares } from '@/utils/shareCalculator';
import { polygonAreaSqm } from '@/utils/geometry';

const DEFAULT_CENTER: MapView = {
  center: [24.8055, 125.2941],
  zoom: 12
};

type AppState = {
  mapView: MapView;
  farmers: Farmer[];
  faucets: FaucetFeature[];
  sprinklers: SprinklerFeature[];
  parcels: ParcelFeature[];
  selection: Selection;
  drawMode: DrawMode;
  showSprinklerBuffers: boolean;
  setMapView: (view: MapView) => void;
  setDrawMode: (mode: DrawMode) => void;
  select: (selection: Selection) => void;
  clearSelection: () => void;
  addFarmer: (name?: string) => void;
  updateFarmer: (id: string, updates: Partial<Farmer>) => void;
  removeFarmer: (id: string) => boolean;
  upsertFaucet: (feature: FaucetFeature) => void;
  removeFaucet: (id: string) => void;
  upsertSprinkler: (feature: SprinklerFeature) => void;
  removeSprinkler: (id: string) => void;
  upsertParcel: (feature: ParcelFeature) => void;
  removeParcel: (id: string) => void;
  loadFromPersistedState: (data: PersistedState) => void;
  getPersistedState: () => PersistedState;
  recalculateFarmerShares: () => void;
  resetState: () => void;
  setSprinklerBuffersVisible: (visible: boolean) => void;
  toggleSprinklerBuffers: () => void;
};

const defaultState = {
  mapView: DEFAULT_CENTER,
  farmers: [] as Farmer[],
  faucets: [] as FaucetFeature[],
  sprinklers: [] as SprinklerFeature[],
  parcels: [] as ParcelFeature[],
  selection: null as Selection,
  drawMode: null as DrawMode,
  showSprinklerBuffers: false
};

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      ...defaultState,
      setMapView: (view) => set({ mapView: view }),
      setDrawMode: (mode) => set({ drawMode: mode }),
      select: (selection) => set({ selection }),
      clearSelection: () => set({ selection: null }),
      setSprinklerBuffersVisible: (visible) => set({ showSprinklerBuffers: visible }),
      toggleSprinklerBuffers: () =>
        set((state) => ({ showSprinklerBuffers: !state.showSprinklerBuffers })),
      addFarmer: (name = '新しい農家') =>
        set((state) => ({
          farmers: [
            ...state.farmers,
            {
              id: createId('far'),
              name
            }
          ]
        })),
      updateFarmer: (id, updates) =>
        set((state) => ({
          farmers: state.farmers.map((farmer) =>
            farmer.id === id ? { ...farmer, ...updates } : farmer
          )
        })),
      removeFarmer: (id) => {
        const state = get();
        const isReferenced =
          state.parcels.some((parcel) => parcel.farmerId === id) ||
          state.faucets.some((faucet) =>
            faucet.farmerShares.some((share) => share.farmerId === id)
          );
        if (isReferenced) {
          return false;
        }
        set({ farmers: state.farmers.filter((farmer) => farmer.id !== id) });
        return true;
      },
      upsertFaucet: (feature) =>
        set((state) => {
          const exists = state.faucets.some((item) => item.id === feature.id);
          return {
            faucets: exists
              ? state.faucets.map((item) => (item.id === feature.id ? feature : item))
              : [...state.faucets, feature]
          };
        }),
      removeFaucet: (id) =>
        set((state) => ({
          faucets: state.faucets.filter((item) => item.id !== id),
          sprinklers: state.sprinklers.map((sprinkler) =>
            sprinkler.faucetId === id ? { ...sprinkler, faucetId: undefined } : sprinkler
          )
        })),
      upsertSprinkler: (feature) =>
        set((state) => {
          const exists = state.sprinklers.some((item) => item.id === feature.id);
          return {
            sprinklers: exists
              ? state.sprinklers.map((item) =>
                  item.id === feature.id ? feature : item
                )
              : [...state.sprinklers, feature]
          };
        }),
      removeSprinkler: (id) =>
        set((state) => ({
          sprinklers: state.sprinklers.filter((item) => item.id !== id)
        })),
      upsertParcel: (feature) =>
        set((state) => {
          const exists = state.parcels.some((item) => item.id === feature.id);
          return {
            parcels: exists
              ? state.parcels.map((item) => (item.id === feature.id ? feature : item))
              : [...state.parcels, feature]
          };
        }),
      removeParcel: (id) =>
        set((state) => ({
          parcels: state.parcels.filter((item) => item.id !== id)
        })),
      loadFromPersistedState: (data) =>
        set({
          mapView: data.map,
          farmers: data.farmers,
          faucets: data.faucets.map((faucet) => ({
            ...faucet,
            farmerShares: faucet.farmerShares.map((share) => ({
              ...share,
              computedShare:
                typeof share.computedShare === 'number' ? share.computedShare : share.share
            }))
          })),
          sprinklers: data.sprinklers,
          parcels: data.parcels.map((parcel) => ({
            ...parcel,
            assessedAreaSqm:
              typeof parcel.assessedAreaSqm === 'number'
                ? parcel.assessedAreaSqm
                : polygonAreaSqm(parcel.geometry)
          })),
          selection: null,
          drawMode: null
        }),
      recalculateFarmerShares: () =>
        set((state) => {
          const shareMap = calculateFaucetShares(state.sprinklers, state.parcels);
          const updatedFaucets = state.faucets.map((faucet) => {
            const computedShares = shareMap.get(faucet.id);
            const existingMap = new Map(faucet.farmerShares.map((share) => [share.farmerId, share]));
            if (!computedShares) {
              return {
                ...faucet,
                farmerShares: faucet.farmerShares.map((share) => ({
                  ...share,
                  computedShare: share.computedShare
                }))
              };
            }
            const nextShares: FarmerShare[] = computedShares.map((item) => {
              const existing = existingMap.get(item.farmerId);
              const computedValue = Number(item.share.toFixed(6));
              if (existing) {
                existingMap.delete(item.farmerId);
                return {
                  ...existing,
                  share:
                    typeof existing.share === 'number'
                      ? existing.share
                      : computedValue,
                  computedShare: computedValue
                };
              }
              return {
                farmerId: item.farmerId,
                share: computedValue,
                computedShare: computedValue
              };
            });

            existingMap.forEach((share) => {
              nextShares.push({ ...share });
            });

            return {
              ...faucet,
              farmerShares: nextShares
            };
          });
          return { faucets: updatedFaucets };
        }),
      resetState: () =>
        set(() => ({
          mapView: {
            center: [...DEFAULT_CENTER.center] as [number, number],
            zoom: DEFAULT_CENTER.zoom
          },
          farmers: [],
          faucets: [],
          sprinklers: [],
          parcels: [],
          selection: null,
          drawMode: null,
          showSprinklerBuffers: false
        })),
      getPersistedState: () => serializeState(get())
    }),
    {
      name: 'miyako-app-state',
      version: 1,
      partialize: (state) => ({
        mapView: state.mapView,
        farmers: state.farmers,
        faucets: state.faucets,
        sprinklers: state.sprinklers,
        parcels: state.parcels
      })
    }
  )
);
