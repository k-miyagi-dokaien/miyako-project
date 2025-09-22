import { area, circle, multiPolygon as turfMultiPolygon } from '@turf/turf';
import type { Feature, MultiPolygon, Point, Polygon } from 'geojson';
import polygonClipping, { type Polygon as ClipperPolygon } from 'polygon-clipping';

export type MultiPolygonCoords = ClipperPolygon;

const EMPTY_GEOMETRY: MultiPolygonCoords = [];

export const RADIUS_METERS = 30;

export function createSprinklerCircle(point: Feature<Point>, radiusMeters = RADIUS_METERS): Feature<Polygon> {
  return circle(point.geometry.coordinates, radiusMeters, { units: 'meters' });
}

export function featureToMultiPolygon(feature: Feature<Polygon | MultiPolygon>): MultiPolygonCoords {
  const polygons =
    feature.geometry.type === 'Polygon'
      ? [feature.geometry.coordinates]
      : feature.geometry.coordinates;

  return polygons.map((polygon) =>
    polygon.map((ring) => ring.map(([lng, lat]) => [lng, lat]))
  ) as unknown as MultiPolygonCoords;
}

export function areaOfMultiPolygon(coords: MultiPolygonCoords): number {
  if (!coords.length) {
    return 0;
  }
  return area(turfMultiPolygon(coords as unknown as [number, number][][][]));
}

export function unionAll(polygons: MultiPolygonCoords[]): MultiPolygonCoords {
  let accumulator: ClipperPolygon | null = null;
  polygons.forEach((current) => {
    if (!current.length) {
      return;
    }
    accumulator = accumulator
      ? (polygonClipping.union(accumulator, current) as unknown as ClipperPolygon)
      : current;
  });
  return normalizeMultiPolygon(accumulator);
}

export function intersect(a: MultiPolygonCoords, b: MultiPolygonCoords): MultiPolygonCoords {
  if (!a.length || !b.length) {
    return EMPTY_GEOMETRY;
  }
  return normalizeMultiPolygon(polygonClipping.intersection(a, b) as unknown as ClipperPolygon);
}

export function difference(subject: MultiPolygonCoords, clip: MultiPolygonCoords): MultiPolygonCoords {
  if (!subject.length) {
    return EMPTY_GEOMETRY;
  }
  if (!clip.length) {
    return subject;
  }
  return normalizeMultiPolygon(polygonClipping.difference(subject, clip) as unknown as ClipperPolygon);
}

export function normalizeMultiPolygon(coords: ClipperPolygon | null | undefined): MultiPolygonCoords {
  if (!coords) {
    return EMPTY_GEOMETRY;
  }
  return coords.filter((polygon) => polygon.length > 0 && polygon[0].length > 2);
}

export function polygonAreaSqm(feature: Feature<Polygon>): number {
  return area(feature);
}
