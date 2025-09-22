import type { Feature, GeoJsonProperties, Point, Polygon } from 'geojson';

type PointFeature = Feature<Point, GeoJsonProperties>;
type PolygonFeature = Feature<Polygon, GeoJsonProperties>;

export type Id = string;

export type Farmer = {
  id: Id;
  name: string;
  notes?: string;
};

export type FarmerShare = {
  farmerId: Id;
  share: number; // 0-1 representing portion of faucet usage
};

export type FaucetFeature = {
  id: Id;
  name: string;
  geometry: PointFeature;
  annualWaterUsageM3: number;
  farmerShares: FarmerShare[];
};

export type SprinklerFeature = {
  id: Id;
  name: string;
  geometry: PointFeature;
  faucetId?: Id;
};

export type ParcelFeature = {
  id: Id;
  name: string;
  geometry: PolygonFeature;
  farmerId?: Id;
  assessedAreaSqm: number;
};

export type MapView = {
  center: [number, number];
  zoom: number;
};

export type SchemaVersion = 1;

export type PersistedState = {
  meta: {
    schemaVersion: SchemaVersion;
    exportedAt: string;
  };
  map: MapView;
  farmers: Farmer[];
  faucets: FaucetFeature[];
  sprinklers: SprinklerFeature[];
  parcels: ParcelFeature[];
};

export type DrawMode = 'faucet' | 'sprinkler' | 'parcel' | null;

export type Selection =
  | { type: 'farmer'; id: Id }
  | { type: 'faucet'; id: Id }
  | { type: 'sprinkler'; id: Id }
  | { type: 'parcel'; id: Id }
  | null;
