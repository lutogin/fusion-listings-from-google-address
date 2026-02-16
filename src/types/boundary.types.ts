/**
 * Boundary interface based on boundary-examaple.json
 */

export interface BoundaryGeometry {
  crs: {
    type: string;
    properties: {
      name: string;
    };
  };
  type: 'MultiPolygon' | 'Polygon';
  coordinates: number[][][][]; // For MultiPolygon
}

export interface BoundaryFeature {
  type: 'Feature';
  '@type': 'geo.area';
  geometry: BoundaryGeometry;
}

export interface CentroidGeometry {
  type: 'Point';
  coordinates: [number, number]; // [longitude, latitude]
}

export interface Centroid {
  '@type': 'geo.point';
  extension: {
    zoom: number;
  };
  geometry: CentroidGeometry;
}

export interface Geo {
  boundary: BoundaryFeature;
  centroid: Centroid;
}

export interface Label {
  name: string;
  nameLevel: string;
  categoryNative: string;
}

export interface ParentBoundaries {
  STATE?: number[];
  COUNTY?: number[];
  KW_REGION?: number[];
  POSTALCODE?: number[];
  [key: string]: number[] | undefined;
}

export interface Boundary {
  _id: string;
  active: boolean;
  area: number;
  autocompleteText: string;
  category: 'CITY' | 'COUNTY' | 'STATE' | 'POSTALCODE' | 'NEIGHBORHOOD' | string;
  city?: string;
  country: string;
  county?: string;
  createdAt: string;
  display: string;
  foreignKey: string;
  geo: Geo;
  label: Label;
  parentBoundaries: ParentBoundaries;
  source: string;
  state?: string;
  stateShort?: string;
  updatedAt: string;
  updatedBy: string;
  whatLocalsSay: any[];
}

/**
 * Simplified boundary for lookups
 */
export interface BoundaryLookup {
  id: string;
  category: string;
  city?: string;
  state?: string;
  county?: string;
  display: string;
}
