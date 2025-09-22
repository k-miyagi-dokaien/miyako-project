# Miyako Project Web App Design

## Goals and Scope
- Create a Leaflet-based web application that opens centered on Miyakojima City (24.8055, 125.2941) and remembers the last map view in exported data.
- Persist and restore all application state through a JSON file that can be imported/exported by the user.
- Manage farmer records (create, edit names, delete, link to assets) via a dedicated table interface.
- Capture water infrastructure: faucets (points with annual water usage and farmer area shares) and sprinklers (points linked to a faucet).
- Capture land parcels as editable polygons associated with one farmer.

## Key User Flows
1. Launch: load default dataset (center on Miyakojima, empty collections if no data).
2. Import: user selects JSON file to load entire app state; map view updates accordingly.
3. Map Editing: user draws/edits points and polygons for faucets, sprinklers, and land parcels.
4. Farmer Management: user edits farmer table (name, optional notes) and links farmers to parcels and faucet share ratios.
5. Save: user exports JSON capturing current state (map viewport, farmers, faucets, sprinklers, parcels).

## Data Model
All persisted data is stored as a single JSON object structured as follows:

```json
{
  "meta": {
    "schemaVersion": 1,
    "exportedAt": "2024-06-01T09:00:00Z"
  },
  "map": {
    "center": [24.8055, 125.2941],
    "zoom": 12,
    "baseLayer": "osm"
  },
  "farmers": [ /* Farmer */ ],
  "faucets": [ /* Faucet */ ],
  "sprinklers": [ /* Sprinkler */ ],
  "parcels": [ /* Parcel */ ]
}
```

Entity schemas (stored in arrays above):
- Farmer: `{ "id": "far-uuid", "name": "Farmer A", "notes": "optional" }`
- Faucet: `{ "id": "fac-uuid", "name": "Station 1", "geometry": {GeoJSON Point}, "annualWaterUsageM3": 1200, "farmerShares": [{ "farmerId": "far-uuid", "share": 0.6 }] }`
- Sprinkler: `{ "id": "spr-uuid", "name": "Sprinkler A", "geometry": {GeoJSON Point}, "faucetId": "fac-uuid" }`
- Parcel: `{ "id": "par-uuid", "name": "Field 3", "geometry": {GeoJSON Polygon}, "farmerId": "far-uuid" }`

### GeoJSON Usage
- Store geometries in EPSG:4326 (WGS84) matching Leaflet defaults.
- Use [`Feature`](https://datatracker.ietf.org/doc/html/rfc7946) objects when exporting if metadata (e.g., timestamps) needs to be attached; otherwise embed `geometry` with ancillary properties at parent level.

### Derived/Validation Rules
- `farmerShares` sum should be <= 1.0; warn if total deviates from 1.0 more than ±0.01.
- `faucetId` on sprinklers must reference existing faucet.
- `farmerId` on parcels must reference existing farmer.
- Prevent deletion of farmers referenced by parcels or faucet shares without reassignment.

## Application Architecture
- Frontend: React + TypeScript via Vite for fast dev server and build pipeline.
- Map: `react-leaflet` for integration with Leaflet; use `leaflet` and `leaflet-draw` for geometry creation/editing.
- State Management: Zustand store (lightweight) for app state (farmers, features, map viewport) synchronized with React components.
- Persistence: Import/export handled via browser File System Access API when available, with fallback to file input/download blob.
- Styling: Tailwind CSS or CSS modules; pick Tailwind for rapid layout of sidebar panels and map overlays.

## Component Breakdown
- `AppShell`: layout with sidebar + map, wiring store providers.
- `Toolbar`: buttons for load, save, undo/redo (if implemented), base-layer toggles.
- `MapCanvas`: Leaflet map displaying layers, handling draw/edit events, updating store.
- `Sidebar` panels:
  - `FarmerTable`: CRUD interface, validation warnings for linked entities.
  - `FeatureInspector`: context-aware form editing selected faucet/sprinkler/parcel metadata.
  - `LayerLegend`: toggles visibility and provides counts.
- `ImportExportModal`: handles JSON upload/download with validation feedback.

## Map Layers and Editing Strategy
- Separate `FeatureGroup`s for each entity type to allow independent styling and interaction.
- Use distinct symbology: faucets (blue circle marker), sprinklers (green circle marker), parcels (semi-transparent polygons).
- Attach popup templates summarizing linked data (e.g., faucet share breakdown).
- Enable draw controls conditionally: user selects entity type before drawing; stored geometries saved on `draw:created`/`draw:edited` events.
- Map viewport updates tracked on `moveend`/`zoomend` to persist in state.

## Persistence and Sync Flow
1. On load, initialize state from default config (embedded JSON) or user-imported file.
2. Every state mutation updates Zustand store; a debounce pushes a serialized snapshot to an in-memory buffer for `Save` action.
3. `Save` triggers JSON download with schema version and timestamp.
4. `Load` reads file, validates `schemaVersion`, replaces state, recenters map.

## Validation and Error Handling
- Use Zod to validate imported JSON; display user-friendly error list highlighting missing IDs or malformed geometries.
- Surface warnings for logical issues (share totals, orphaned sprinklers) but allow user to fix within UI.

## Testing Strategy
- Unit tests (Vitest) for state store actions and JSON validation functions.
- Integration tests with Playwright for core flows: load default, create features, export/import loop.

## Future Extensions
- Multi-layer base maps (satellite imagery) via configurable providers.
- Sync with backend API for collaborative editing.
- Time-series tracking of water usage trends and reporting dashboards.
