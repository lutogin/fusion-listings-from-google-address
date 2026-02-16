/**
 * Google Places API types
 */

export interface GoogleAddressComponent {
  long_name: string;
  short_name: string;
  types: string[];
}

export interface GoogleLocation {
  lat: number;
  lng: number;
}

export interface GoogleGeometry {
  location: GoogleLocation;
  location_type: string;
  viewport: {
    northeast: GoogleLocation;
    southwest: GoogleLocation;
  };
}

export interface GooglePlaceResult {
  address_components: GoogleAddressComponent[];
  formatted_address: string;
  geometry: GoogleGeometry;
  place_id: string;
  types: string[];
  plus_code?: {
    compound_code: string;
    global_code: string;
  };
}

export interface GooglePlacesResponse {
  results: GooglePlaceResult[];
  status: string;
}

/**
 * Parsed address from Google result
 */
export interface ParsedGoogleAddress {
  street_number?: string;
  route?: string; // street name
  locality?: string; // city
  administrative_area_level_1?: string; // state
  administrative_area_level_2?: string; // county
  postal_code?: string;
  country?: string;
  formatted_address: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  place_id: string;
}

/**
 * Search criteria extracted from Google address
 */
export interface AddressSearchCriteria {
  street_number?: string;
  street_name?: string;
  city?: string;
  state?: string;
  county?: string;
  postal_code?: string;
  country?: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  // Radius in meters for proximity search
  radius?: number;
  // Specificity level: exact, street, neighborhood, city
  specificity: 'exact' | 'street' | 'neighborhood' | 'city' | 'county';
}
