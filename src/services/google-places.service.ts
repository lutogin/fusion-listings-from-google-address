import { Client, PlaceInputType } from '@googlemaps/google-maps-services-js';
import { ParsedGoogleAddress, AddressSearchCriteria } from '../types/google.types';

export class GooglePlacesService {
  private client: Client;
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.client = new Client({});
  }

  /**
   * Search for address using Google Places API
   */
  async searchAddress(address: string): Promise<ParsedGoogleAddress | null> {
    try {
      const response = await this.client.geocode({
        params: {
          address: address,
          key: this.apiKey,
        },
      });

      if (response.data.status !== 'OK' || response.data.results.length === 0) {
        console.error('No results found for address:', address);
        return null;
      }

      const result = response.data.results[0];
      return this.parseGoogleResult(result);
    } catch (error) {
      console.error('Error searching address:', error);
      throw error;
    }
  }

  /**
   * Parse Google Places result into structured address
   */
  private parseGoogleResult(result: any): ParsedGoogleAddress {
    const components: { [key: string]: string } = {};

    // Extract address components
    result.address_components.forEach((component: any) => {
      const types = component.types;
      if (types.includes('street_number')) {
        components.street_number = component.long_name;
      }
      if (types.includes('route')) {
        components.route = component.long_name;
      }
      if (types.includes('locality')) {
        components.locality = component.long_name;
      }
      if (types.includes('administrative_area_level_1')) {
        components.administrative_area_level_1 = component.short_name;
      }
      if (types.includes('administrative_area_level_2')) {
        components.administrative_area_level_2 = component.long_name;
      }
      if (types.includes('postal_code')) {
        components.postal_code = component.long_name;
      }
      if (types.includes('country')) {
        components.country = component.short_name;
      }
    });

    return {
      street_number: components.street_number,
      route: components.route,
      locality: components.locality,
      administrative_area_level_1: components.administrative_area_level_1,
      administrative_area_level_2: components.administrative_area_level_2,
      postal_code: components.postal_code,
      country: components.country,
      formatted_address: result.formatted_address,
      coordinates: {
        lat: result.geometry.location.lat,
        lng: result.geometry.location.lng,
      },
      place_id: result.place_id,
    };
  }

  /**
   * Convert parsed Google address to search criteria
   */
  buildSearchCriteria(googleAddress: ParsedGoogleAddress): AddressSearchCriteria {
    // Determine specificity based on available components
    let specificity: AddressSearchCriteria['specificity'] = 'city';
    let radius = 5000; // Default 5km

    if (googleAddress.street_number && googleAddress.route) {
      // Exact address provided
      specificity = 'exact';
      radius = 100; // 100m for exact address
    } else if (googleAddress.route) {
      // Street provided but no number
      specificity = 'street';
      radius = 500; // 500m for street
    } else if (googleAddress.locality) {
      // City/neighborhood level
      specificity = 'neighborhood';
      radius = 2000; // 2km for neighborhood
    } else if (googleAddress.administrative_area_level_2) {
      // County level
      specificity = 'county';
      radius = 10000; // 10km for county
    }

    return {
      street_number: googleAddress.street_number,
      street_name: googleAddress.route,
      city: googleAddress.locality,
      state: googleAddress.administrative_area_level_1,
      county: googleAddress.administrative_area_level_2,
      postal_code: googleAddress.postal_code,
      country: googleAddress.country,
      coordinates: googleAddress.coordinates,
      radius,
      specificity,
    };
  }

  /**
   * Calculate distance between two coordinates (Haversine formula)
   * Returns distance in meters
   */
  calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }
}
