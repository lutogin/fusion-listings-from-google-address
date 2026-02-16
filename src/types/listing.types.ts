/**
 * Listing interface based on listing-example.json
 */

export interface Coordinates {
  lat: number;
  lon: number;
}

export interface CoordinatesGS {
  type: 'Point';
  coordinates: [number, number]; // [longitude, latitude]
}

export interface Address {
  city: string;
  zip_4?: string | null;
  address: string;
  country: string;
  state_prov: string;
  postal_code: string;
  street_name: string;
  unit_number?: string | null;
  street_number: string;
  street_suffix: string;
  coordinates_gp: Coordinates;
  coordinates_gs: CoordinatesGS;
  street_post_dir?: string | null;
  street_direction?: string | null;
  full_street_address: string;
}

export interface Geo {
  address_id: Array<{ $numberLong: string }>;
  property_id: Array<{ $numberLong: string }>;
  parent_property_id?: number | null;
  mcd: number[];
  city: number[];
  state: number[];
  county: number[];
  postal_code: number[];
  neighborhood: number[];
  school_district: number[];
  school_attendance: number[];
  boundary_agg: string[];
}

export interface Location {
  county: string;
  zoning?: string | null;
  subdivision?: string | null;
  prop_directions?: string | null;
  region?: string | null;
  township?: string | null;
  elevation?: string | null;
  municipality?: string | null;
  neighborhoods?: string | null;
}

export interface Photo {
  ph_url: string;
  ph_type: string;
  ph_category: string;
  mls_ph_order: string;
  ph_order: number;
  ph_id: string;
  ph_short_desc?: string | null;
  ph_tags?: string | null;
  kw_ph_id: { $numberLong: string };
  ph_label?: string | null;
  kw_ph_url: string;
  ph_updated_at?: string | null;
}

export interface OpenHouse {
  oh_end_dt: { $date: string };
  oh_start_dt: { $date: string };
  oh_desc?: string | null;
  oh_status: string;
  oh_appt_req?: boolean | null;
  oh_updated_at: { $date: string };
  is_oh_virtual?: boolean | null;
  virtual_oh_url?: string | null;
}

export interface Listing {
  _id: { $numberLong: string };
  mls_id: string;
  mls_key: string;
  mls_number: string;
  list_id: { $numberLong: string };
  list_key: string;
  list_uuid: string;
  
  // Status & Type
  list_status: string;
  list_status_id: number;
  kwls_status: string;
  list_type: string;
  list_type_id: number;
  list_category: string;
  list_category_id: number;
  prop_type: string;
  prop_type_id: number;
  prop_subtype: string;
  prop_subtype_id: number;
  
  // Address & Location
  list_address: Address;
  property_address: Address;
  location: Location;
  geo: Geo;
  
  // Property Details
  total_bed: number;
  full_bath: number;
  half_bath: number;
  total_bath: number;
  living_area: number;
  living_area_sqft: number;
  living_area_units: string;
  year_built: number;
  lot_size_area: number;
  lot_size_area_acre: number;
  lot_size_units: string;
  
  // Pricing
  current_list_price: number;
  original_list_price: number;
  close_price?: number | null;
  lease_price?: number | null;
  price_per_sqft: number;
  price_per_acre: number;
  currency_code: string;
  
  // Dates
  list_dt: { $date: string };
  close_dt?: { $date: string } | null;
  kw_created_at: { $date: string };
  kw_updated_at: { $date: string };
  mls_updated_at: { $date: string };
  list_status_updated_at: { $date: string };
  current_price_updated_at: { $date: string };
  
  // Description & Media
  list_desc: string;
  photos: Photo[];
  open_houses: OpenHouse[];
  primary_photo_url: string;
  
  // Additional fields
  [key: string]: any;
}

/**
 * Simplified listing interface for search results
 */
export interface ListingSearchResult {
  list_id: string;
  mls_number: string;
  address: string;
  city: string;
  state: string;
  postal_code: string;
  coordinates: Coordinates;
  list_status: string;
  prop_type: string;
  total_bed: number;
  total_bath: number;
  living_area: number;
  current_list_price: number;
  geo: Geo;
}
