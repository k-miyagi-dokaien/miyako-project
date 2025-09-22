import { useEffect } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import { useAppStore } from '@/store/appStore';
import FeatureLayers from './FeatureLayers';
import DrawController from './DrawController';

const MapViewportSync = () => {
  const mapView = useAppStore((state) => state.mapView);
  const setMapView = useAppStore((state) => state.setMapView);
  const map = useMap();

  useEffect(() => {
    const handleMoveEnd = () => {
      const center = map.getCenter();
      const zoom = map.getZoom();
      setMapView({ center: [center.lat, center.lng], zoom });
    };
    map.on('moveend', handleMoveEnd);
    return () => {
      map.off('moveend', handleMoveEnd);
    };
  }, [map, setMapView]);

  useEffect(() => {
    const currentCenter = map.getCenter();
    const [lat, lng] = mapView.center;
    const zoom = mapView.zoom;
    const isSame =
      Math.abs(currentCenter.lat - lat) < 0.0001 &&
      Math.abs(currentCenter.lng - lng) < 0.0001 &&
      map.getZoom() === zoom;
    if (!isSame) {
      map.setView({ lat, lng }, zoom, { animate: false });
    }
  }, [map, mapView]);

  return null;
};

const MapCanvas = () => {
  const mapView = useAppStore((state) => state.mapView);

  return (
    <MapContainer
      center={mapView.center}
      zoom={mapView.zoom}
      className="h-full w-full"
      zoomControl
      preferCanvas
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FeatureLayers />
      <DrawController />
      <MapViewportSync />
    </MapContainer>
  );
};

export default MapCanvas;
