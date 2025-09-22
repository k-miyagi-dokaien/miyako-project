import { Fragment, useMemo } from 'react';
import { Circle, Marker, Polygon, Popup } from 'react-leaflet';
import L from 'leaflet';

import { useAppStore } from '@/store/appStore';
import { RADIUS_METERS } from '@/utils/geometry';

const faucetIcon = L.divIcon({
  className: 'layer-marker layer-marker--faucet',
  iconSize: [18, 18],
  iconAnchor: [9, 9],
  html: '<span></span>'
});

const sprinklerIcon = L.divIcon({
  className: 'layer-marker layer-marker--sprinkler',
  iconSize: [14, 14],
  iconAnchor: [7, 7],
  html: '<span></span>'
});

const FeatureLayers = () => {
  const faucets = useAppStore((state) => state.faucets);
  const sprinklers = useAppStore((state) => state.sprinklers);
  const showSprinklerBuffers = useAppStore((state) => state.showSprinklerBuffers);
  const parcels = useAppStore((state) => state.parcels);
  const farmers = useAppStore((state) => state.farmers);
  const selection = useAppStore((state) => state.selection);
  const select = useAppStore((state) => state.select);
  const upsertFaucet = useAppStore((state) => state.upsertFaucet);
  const upsertSprinkler = useAppStore((state) => state.upsertSprinkler);

  const farmerNameLookup = useMemo(
    () => new Map(farmers.map((farmer) => [farmer.id, farmer.name])),
    [farmers]
  );

  const faucetNameLookup = useMemo(
    () => new Map(faucets.map((faucet) => [faucet.id, faucet.name])),
    [faucets]
  );

  const parcelPaths = useMemo(
    () =>
      parcels.map((parcel) => {
        const ring = parcel.geometry.geometry.coordinates[0];
        const latLngs = ring.map(([lng, lat]) => [lat, lng]);
        return { parcel, latLngs } as const;
      }),
    [parcels]
  );

  return (
    <>
      {faucets.map((faucet) => {
        const [lng, lat] = faucet.geometry.geometry.coordinates;
        const isSelected = selection?.type === 'faucet' && selection.id === faucet.id;
        return (
          <Marker
            key={faucet.id}
            position={[lat, lng]}
            icon={faucetIcon}
            draggable={isSelected}
            eventHandlers={{
              click: () => select({ type: 'faucet', id: faucet.id }),
              dragend: (event) => {
                const { lat: newLat, lng: newLng } = event.target.getLatLng();
                upsertFaucet({
                  ...faucet,
                  geometry: {
                    ...faucet.geometry,
                    geometry: {
                      ...faucet.geometry.geometry,
                      coordinates: [newLng, newLat]
                    }
                  }
                });
              }
            }}
          >
            <Popup>
              <div className="space-y-1">
                <div className="font-semibold">{faucet.name}</div>
                <div>年間使用水量: {faucet.annualWaterUsageM3} m³</div>
                {faucet.farmerShares.length > 0 ? (
                  <ul className="list-disc pl-4">
                    {faucet.farmerShares.map((share) => (
                      <li key={`${share.farmerId}`}>
                        {farmerNameLookup.get(share.farmerId) ?? '不明'} :
                        {(share.share * 100).toFixed(0)}%
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div>農家未設定</div>
                )}
              </div>
            </Popup>
          </Marker>
        );
      })}

      {sprinklers.map((sprinkler) => {
        const [lng, lat] = sprinkler.geometry.geometry.coordinates;
        const isSelected = selection?.type === 'sprinkler' && selection.id === sprinkler.id;
        return (
          <Fragment key={sprinkler.id}>
            {showSprinklerBuffers && (
              <Circle
                center={[lat, lng]}
                radius={RADIUS_METERS}
                pathOptions={{
                  color: '#38bdf8',
                  weight: 1,
                  fillColor: '#38bdf8',
                  fillOpacity: 0.1,
                  dashArray: '4 4'
                }}
              />
            )}
            <Marker
              position={[lat, lng]}
              icon={sprinklerIcon}
              draggable={isSelected}
              eventHandlers={{
                click: () => select({ type: 'sprinkler', id: sprinkler.id }),
                dragend: (event) => {
                  const { lat: newLat, lng: newLng } = event.target.getLatLng();
                  upsertSprinkler({
                    ...sprinkler,
                    geometry: {
                      ...sprinkler.geometry,
                      geometry: {
                        ...sprinkler.geometry.geometry,
                        coordinates: [newLng, newLat]
                      }
                    }
                  });
                }
              }}
            >
              <Popup>
                <div className="space-y-1">
                  <div className="font-semibold">{sprinkler.name}</div>
                  <div>
                    給水栓:{' '}
                    {sprinkler.faucetId
                      ? faucetNameLookup.get(sprinkler.faucetId) ?? sprinkler.faucetId
                      : '未割り当て'}
                  </div>
                </div>
              </Popup>
            </Marker>
          </Fragment>
        );
      })}

      {parcelPaths.map(({ parcel, latLngs }) => {
        const isSelected = selection?.type === 'parcel' && selection.id === parcel.id;
        return (
          <Polygon
            key={parcel.id}
            positions={latLngs as L.LatLngExpression[]}
            pathOptions={{
              color: isSelected ? '#fb923c' : '#facc15',
              weight: isSelected ? 4 : 2,
              fillColor: '#fde68a',
              fillOpacity: 0.25
            }}
            eventHandlers={{
              click: () => select({ type: 'parcel', id: parcel.id })
            }}
          >
            <Popup>
              <div className="space-y-1">
                <div className="font-semibold">{parcel.name}</div>
                <div>
                  農家:{' '}
                  {parcel.farmerId
                    ? farmerNameLookup.get(parcel.farmerId) ?? parcel.farmerId
                    : '未割り当て'}
                </div>
              </div>
            </Popup>
          </Polygon>
        );
      })}
    </>
  );
};

export default FeatureLayers;
