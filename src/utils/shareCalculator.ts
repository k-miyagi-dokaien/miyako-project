import type { FaucetFeature, ParcelFeature, SprinklerFeature } from '@/types';
import type { MultiPolygonCoords } from './geometry';
import {
  RADIUS_METERS,
  areaOfMultiPolygon,
  createSprinklerCircle,
  difference,
  featureToMultiPolygon,
  intersect,
  normalizeMultiPolygon,
  unionAll
} from './geometry';
import type { Feature, Polygon } from 'geojson';

export type FaucetShare = {
  farmerId: string;
  share: number;
  area: number;
};

const EPSILON = 1e-6;

type CoverageCell = {
  geometry: MultiPolygonCoords;
  farmerIds: string[];
};

function buildFaucetZones(
  sprinklers: SprinklerFeature[]
): Map<string, MultiPolygonCoords> {
  const grouped = new Map<string, Feature<Polygon>[]>() ;
  sprinklers.forEach((sprinkler) => {
    const faucetId = sprinkler.faucetId;
    if (!faucetId) {
      return;
    }
    const circleFeature = createSprinklerCircle(sprinkler.geometry, RADIUS_METERS);
    const list = grouped.get(faucetId) ?? [];
    list.push(circleFeature);
    grouped.set(faucetId, list);
  });

  const zones = new Map<string, MultiPolygonCoords>();
  for (const [faucetId, features] of grouped.entries()) {
    const union = unionAll(features.map(featureToMultiPolygon));
    zones.set(faucetId, union);
  }

  return zones;
}

function buildCoverageCells(
  zone: MultiPolygonCoords,
  parcels: ParcelFeature[]
): CoverageCell[] {
  const cells: CoverageCell[] = [];

  parcels.forEach((parcel) => {
    if (!parcel.farmerId) {
      return;
    }
    const parcelGeometry = featureToMultiPolygon(parcel.geometry);
    const overlap = intersect(zone, parcelGeometry);
    if (overlap.length === 0) {
      return;
    }

    let remaining = overlap;
    const additions: CoverageCell[] = [];

    for (const cell of cells) {
      const intersection = intersect(cell.geometry, overlap);
      if (intersection.length === 0) {
        continue;
      }
      const updatedCellGeometry = difference(cell.geometry, intersection);
      cell.geometry = updatedCellGeometry;
      if (cell.geometry.length === 0) {
        cell.geometry = [];
      }
      remaining = difference(remaining, intersection);
      additions.push({ geometry: intersection, farmerIds: [...cell.farmerIds, parcel.farmerId] });
    }

    const cleanedCells = cells.filter((cell) => cell.geometry.length > 0);
    cleanedCells.push(...additions);

    const leftover = normalizeMultiPolygon(remaining);
    if (leftover.length > 0) {
      cleanedCells.push({ geometry: leftover, farmerIds: [parcel.farmerId] });
    }

    cells.length = 0;
    cells.push(...cleanedCells);
  });

  return cells.filter((cell) => areaOfMultiPolygon(cell.geometry) > EPSILON);
}

function calculateSharesForZone(
  zone: MultiPolygonCoords,
  parcels: ParcelFeature[]
): FaucetShare[] {
  const coverageCells = buildCoverageCells(zone, parcels);
  if (coverageCells.length === 0) {
    return [];
  }

  const farmerArea = new Map<string, number>();
  let coveredArea = 0;

  coverageCells.forEach((cell) => {
    const cellArea = areaOfMultiPolygon(cell.geometry);
    if (cellArea <= EPSILON) {
      return;
    }
    coveredArea += cellArea;
    const shareArea = cellArea / cell.farmerIds.length;
    cell.farmerIds.forEach((farmerId) => {
      const previous = farmerArea.get(farmerId) ?? 0;
      farmerArea.set(farmerId, previous + shareArea);
    });
  });

  if (coveredArea <= EPSILON) {
    return [];
  }

  return Array.from(farmerArea.entries())
    .map(([farmerId, areaValue]) => ({
      farmerId,
      area: areaValue,
      share: areaValue / coveredArea
    }))
    .filter((item) => item.share > EPSILON)
    .sort((a, b) => b.share - a.share);
}

export function calculateFaucetShares(
  sprinklers: SprinklerFeature[],
  parcels: ParcelFeature[]
): Map<string, FaucetShare[]> {
  const zones = buildFaucetZones(sprinklers);
  const result = new Map<string, FaucetShare[]>();

  for (const [faucetId, zone] of zones.entries()) {
    const shares = calculateSharesForZone(zone, parcels);
    result.set(faucetId, shares);
  }

  return result;
}
