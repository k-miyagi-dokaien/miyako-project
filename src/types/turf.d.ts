declare module '@turf/turf' {
  import type { Feature, MultiPolygon, Point, Polygon, Position } from 'geojson';

  export interface CircleOptions {
    steps?: number;
    units?: 'degrees' | 'radians' | 'miles' | 'kilometers' | 'meters';
    properties?: Record<string, unknown> | null;
  }

  export function circle(
    center: Position | Point,
    radius: number,
    options?: CircleOptions
  ): Feature<Polygon>;

  export function area(feature: Feature<Polygon | MultiPolygon>): number;

  export function multiPolygon(
    coordinates: Position[][][],
    properties?: Record<string, unknown> | null
  ): Feature<MultiPolygon>;
}
