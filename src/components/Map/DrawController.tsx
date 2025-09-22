import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import type { Feature, Point, Polygon } from 'geojson';
import 'leaflet-draw';

import { useAppStore } from '@/store/appStore';
import { createId } from '@/utils/id';
import { polygonAreaSqm } from '@/utils/geometry';

const faucetShapeOptions: L.CircleMarkerOptions = {
  radius: 10,
  color: '#38bdf8',
  weight: 2,
  fillColor: '#0ea5e9',
  fillOpacity: 0.8
};

const sprinklerShapeOptions: L.CircleMarkerOptions = {
  radius: 8,
  color: '#4ade80',
  weight: 2,
  fillColor: '#22c55e',
  fillOpacity: 0.8
};

const parcelShapeOptions: L.PolylineOptions = {
  color: '#fbbf24',
  weight: 2,
  fillOpacity: 0.2,
  fillColor: '#f59e0b'
};

const DrawController = () => {
  const map = useMap();
  const drawMode = useAppStore((state) => state.drawMode);
  const setDrawMode = useAppStore((state) => state.setDrawMode);
  const upsertFaucet = useAppStore((state) => state.upsertFaucet);
  const upsertSprinkler = useAppStore((state) => state.upsertSprinkler);
  const upsertParcel = useAppStore((state) => state.upsertParcel);
  const select = useAppStore((state) => state.select);

  const drawInstanceRef = useRef<L.Draw.Feature | null>(null);
  const drawModeRef = useRef(drawMode);

  useEffect(() => {
    drawModeRef.current = drawMode;
  }, [drawMode]);

  useEffect(() => {
    const handleCreated = (event: L.DrawEvents.Created) => {
      const mode = drawModeRef.current;
      const layer = event.layer;
      if (!mode) {
        map.removeLayer(layer);
        return;
      }

      if (mode === 'faucet' || mode === 'sprinkler') {
        const latLng = (layer as L.Marker).getLatLng();
        const geometry: Feature<Point> = {
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [latLng.lng, latLng.lat]
          },
          properties: {}
        };
        if (mode === 'faucet') {
          const id = createId('fac');
          upsertFaucet({
            id,
            name: `給水栓 ${useAppStore.getState().faucets.length + 1}`,
            geometry,
            annualWaterUsageM3: 0,
            farmerShares: []
          });
          select({ type: 'faucet', id });
        } else {
          const id = createId('spr');
          upsertSprinkler({
            id,
            name: `スプリンクラー ${useAppStore.getState().sprinklers.length + 1}`,
            geometry,
            faucetId: undefined
          });
          select({ type: 'sprinkler', id });
        }
      }

      if (mode === 'parcel') {
        const polygonLayer = layer as L.Polygon;
        const latLngs = polygonLayer.getLatLngs()[0] as L.LatLng[];
        const coordinates = latLngs.map((position) => [position.lng, position.lat]);
        if (coordinates.length > 0) {
          const [firstLng, firstLat] = coordinates[0];
          const [lastLng, lastLat] = coordinates[coordinates.length - 1];
          if (firstLng !== lastLng || firstLat !== lastLat) {
            coordinates.push([firstLng, firstLat]);
          }
        }
        const geometry: Feature<Polygon> = {
          type: 'Feature',
          geometry: {
            type: 'Polygon',
            coordinates: [coordinates]
          },
          properties: null
        };
        const id = createId('par');
        const assessedAreaSqm = polygonAreaSqm(geometry);
        upsertParcel({
          id,
          name: `農地 ${useAppStore.getState().parcels.length + 1}`,
          geometry,
          farmerId: undefined,
          assessedAreaSqm
        });
        select({ type: 'parcel', id });
      }

      map.removeLayer(layer);
      setDrawMode(null);
    };

    map.on(L.Draw.Event.CREATED, handleCreated as unknown as L.LeafletEventHandlerFn);
    return () => {
      map.off(L.Draw.Event.CREATED, handleCreated as unknown as L.LeafletEventHandlerFn);
    };
  }, [map, select, setDrawMode, upsertFaucet, upsertParcel, upsertSprinkler]);

  useEffect(() => {
    if (drawInstanceRef.current) {
      try {
        drawInstanceRef.current.disable();
      } catch (error) {
        // ignore
      }
      drawInstanceRef.current = null;
    }

    if (!drawMode) {
      return;
    }

    const drawMap = map as unknown as L.DrawMap;

    if (drawMode === 'faucet') {
      drawInstanceRef.current = new L.Draw.CircleMarker(drawMap, {
        shapeOptions: faucetShapeOptions
      } as any);
    } else if (drawMode === 'sprinkler') {
      drawInstanceRef.current = new L.Draw.CircleMarker(drawMap, {
        shapeOptions: sprinklerShapeOptions
      } as any);
    } else if (drawMode === 'parcel') {
      drawInstanceRef.current = new L.Draw.Polygon(drawMap, {
        shapeOptions: parcelShapeOptions,
        showArea: true
      } as any);
    }

    drawInstanceRef.current?.enable();

    return () => {
      if (drawInstanceRef.current) {
        try {
          drawInstanceRef.current.disable();
        } catch (error) {
          // ignore
        }
        drawInstanceRef.current = null;
      }
    };
  }, [map, drawMode]);

  return null;
};

export default DrawController;
