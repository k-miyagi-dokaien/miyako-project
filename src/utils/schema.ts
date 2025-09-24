import { z } from 'zod';
import type { Feature, Polygon } from 'geojson';
import type { PersistedState } from '@/types';
import { polygonAreaSqm } from '@/utils/geometry';

const mapViewSchema = z.object({
  center: z.tuple([z.number(), z.number()]),
  zoom: z.number().min(0).max(22)
});

const pointGeometrySchema = z.object({
  type: z.literal('Point'),
  coordinates: z.tuple([z.number(), z.number()])
});

const polygonGeometrySchema = z.object({
  type: z.literal('Polygon'),
  coordinates: z.array(
    z
      .array(z.tuple([z.number(), z.number()]))
      .refine((ring) => ring.length >= 4, {
        message: 'Polygon rings must contain at least 4 coordinates'
      })
  )
});

const propertiesSchema = z.union([z.record(z.any()), z.null()]).optional();

const pointFeatureSchema = z.object({
  type: z.literal('Feature'),
  geometry: pointGeometrySchema,
  properties: propertiesSchema
});

const polygonFeatureSchema = z.object({
  type: z.literal('Feature'),
  geometry: polygonGeometrySchema,
  properties: propertiesSchema
});

const farmerSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Farmer name required'),
  notes: z.string().optional()
});

const farmerShareSchema = z.object({
  farmerId: z.string(),
  share: z.number().min(0).max(1),
  computedShare: z.number().min(0).max(1).optional()
});

const faucetSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  geometry: pointFeatureSchema,
  annualWaterUsageM3: z.number().min(0),
  farmerShares: z.array(farmerShareSchema)
});

const sprinklerSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  geometry: pointFeatureSchema,
  faucetId: z.string().optional()
});

const parcelSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  geometry: polygonFeatureSchema,
  farmerId: z.string().optional(),
  assessedAreaSqm: z.number().min(0).optional()
});

const persistedStateSchema = z.object({
  meta: z.object({
    schemaVersion: z.literal(1),
    exportedAt: z.string().optional()
  }),
  map: mapViewSchema,
  farmers: z.array(farmerSchema),
  faucets: z.array(faucetSchema),
  sprinklers: z.array(sprinklerSchema),
  parcels: z.array(parcelSchema)
});

type Schema = z.infer<typeof persistedStateSchema>;

export function parsePersistedState(data: unknown): PersistedState {
  const parsed = persistedStateSchema.parse(data) as Schema;
  return {
    meta: {
      schemaVersion: 1,
      exportedAt: parsed.meta.exportedAt ?? new Date().toISOString()
    },
    map: parsed.map,
    farmers: parsed.farmers,
    faucets: parsed.faucets.map((item) => ({
      ...item,
      geometry: {
        ...item.geometry,
        properties: item.geometry.properties ?? null
      }
    })),
    sprinklers: parsed.sprinklers.map((item) => ({
      ...item,
      geometry: {
        ...item.geometry,
        properties: item.geometry.properties ?? null
      }
    })),
    parcels: parsed.parcels.map((item) => ({
      ...item,
      geometry: {
        ...item.geometry,
        properties: item.geometry.properties ?? null
      },
      assessedAreaSqm:
        typeof item.assessedAreaSqm === 'number'
          ? item.assessedAreaSqm
          : polygonAreaSqm(item.geometry as Feature<Polygon>)
    }))
  };
}
