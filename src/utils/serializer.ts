import type { PersistedState } from '@/types';

export function serializeState(state: {
  mapView: PersistedState['map'];
  farmers: PersistedState['farmers'];
  faucets: PersistedState['faucets'];
  sprinklers: PersistedState['sprinklers'];
  parcels: PersistedState['parcels'];
}): PersistedState {
  return {
    meta: {
      schemaVersion: 1,
      exportedAt: new Date().toISOString()
    },
    map: state.mapView,
    farmers: state.farmers,
    faucets: state.faucets,
    sprinklers: state.sprinklers,
    parcels: state.parcels
  };
}
