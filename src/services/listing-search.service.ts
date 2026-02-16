import { Listing, ListingSearchResult } from '../types/listing.types';
import { Boundary, BoundaryLookup } from '../types/boundary.types';
import { AddressSearchCriteria } from '../types/google.types';
import { GooglePlacesService } from './google-places.service';

export class ListingSearchService {
  private googleService: GooglePlacesService;
  private listings: Listing[];
  private boundaries: Map<string, Boundary>;

  constructor(
    googleService: GooglePlacesService,
    listings: Listing[] = [],
    boundaries: Boundary[] = []
  ) {
    this.googleService = googleService;
    this.listings = listings;
    this.boundaries = new Map(boundaries.map(b => [b._id, b]));
  }

  /**
   * Load listings and boundaries data
   */
  loadData(listings: Listing[], boundaries: Boundary[]): void {
    this.listings = listings;
    this.boundaries = new Map(boundaries.map(b => [b._id, b]));
  }

  /**
   * Search listings by Google address
   */
  async searchListingsByAddress(address: string): Promise<ListingSearchResult[]> {
    // Step 1: Get parsed address from Google
    const googleAddress = await this.googleService.searchAddress(address);
    if (!googleAddress) {
      throw new Error('Could not parse address');
    }

    console.log('Parsed Google Address:', googleAddress);

    // Step 2: Build search criteria
    const criteria = this.googleService.buildSearchCriteria(googleAddress);
    console.log('Search Criteria:', criteria);

    // Step 3: Find boundary IDs from Google data
    const boundaryIds = this.findBoundaryIds(googleAddress);
    console.log('Found Boundary IDs:', boundaryIds);

    // Step 4: Find matching listings using criteria + boundary IDs
    const matchedListings = this.findMatchingListings(criteria, boundaryIds);
    console.log(`Found ${matchedListings.length} matching listings`);

    // Step 5: Convert to search results
    return matchedListings.map(listing => this.toSearchResult(listing));
  }

  /**
   * Find boundary IDs based on Google address data
   * This mimics a DB query: SELECT _id FROM boundaries WHERE city=? AND state=?
   */
  private findBoundaryIds(googleAddress: any): {
    cityIds: string[];
    countyIds: string[];
    postalIds: string[];
    stateIds: string[];
  } {
    const result = {
      cityIds: [] as string[],
      countyIds: [] as string[],
      postalIds: [] as string[],
      stateIds: [] as string[]
    };

    // Iterate through all boundaries and find matches
    this.boundaries.forEach((boundary, id) => {
      // Match by country first (important!)
      if (googleAddress.country && boundary.country !== googleAddress.country) {
        return;
      }

      // Find city boundary
      if (
        boundary.category === 'CITY' &&
        googleAddress.locality &&
        boundary.city?.toLowerCase() === googleAddress.locality.toLowerCase()
      ) {
        result.cityIds.push(id);
      }

      // Find county boundary
      if (
        boundary.category === 'COUNTY' &&
        googleAddress.administrative_area_level_2 &&
        boundary.county?.toLowerCase() === googleAddress.administrative_area_level_2.toLowerCase()
      ) {
        result.countyIds.push(id);
      }

      // Find postal code boundary
      if (
        boundary.category === 'POSTALCODE' &&
        googleAddress.postal_code &&
        boundary.display?.includes(googleAddress.postal_code)
      ) {
        result.postalIds.push(id);
      }

      // Find state boundary
      if (
        boundary.category === 'STATE' &&
        googleAddress.administrative_area_level_1 &&
        (boundary.stateShort === googleAddress.administrative_area_level_1 ||
         boundary.state?.toLowerCase() === googleAddress.administrative_area_level_1.toLowerCase())
      ) {
        result.stateIds.push(id);
      }
    });

    return result;
  }

  /**
   * Find listings matching search criteria and boundary IDs
   */
  private findMatchingListings(
    criteria: AddressSearchCriteria,
    boundaryIds: { cityIds: string[]; countyIds: string[]; postalIds: string[]; stateIds: string[] }
  ): Listing[] {
    const matches: Array<{ listing: Listing; distance: number; score: number }> = [];

    for (const listing of this.listings) {
      const match = this.matchListing(listing, criteria, boundaryIds);
      if (match) {
        matches.push(match);
      }
    }

    // Sort by score (higher is better) and distance (lower is better)
    matches.sort((a, b) => {
      if (Math.abs(a.score - b.score) > 0.1) {
        return b.score - a.score;
      }
      return a.distance - b.distance;
    });

    return matches.map(m => m.listing);
  }

  /**
   * Check if listing matches criteria and boundary IDs
   */
  private matchListing(
    listing: Listing,
    criteria: AddressSearchCriteria,
    boundaryIds: { cityIds: string[]; countyIds: string[]; postalIds: string[]; stateIds: string[] }
  ): { listing: Listing; distance: number; score: number } | null {
    let score = 0;
    let matchCount = 0;
    let totalChecks = 0;

    // Calculate distance
    const distance = this.googleService.calculateDistance(
      criteria.coordinates.lat,
      criteria.coordinates.lng,
      listing.list_address.coordinates_gp.lat,
      listing.list_address.coordinates_gp.lon
    );

    // Check if within radius
    if (distance > criteria.radius!) {
      return null;
    }

    // Distance score (closer is better)
    const distanceScore = Math.max(0, 1 - distance / criteria.radius!);
    score += distanceScore * 2; // Weight distance heavily

    // Exact address matching
    if (criteria.specificity === 'exact') {
      totalChecks += 2;

      // Match street number
      if (
        criteria.street_number &&
        listing.list_address.street_number.toLowerCase() ===
          criteria.street_number.toLowerCase()
      ) {
        matchCount++;
        score += 2;
      }

      // Match street name
      if (
        criteria.street_name &&
        listing.list_address.street_name.toLowerCase().includes(
          criteria.street_name.toLowerCase()
        )
      ) {
        matchCount++;
        score += 2;
      }

      // For exact address, require at least one match
      if (matchCount === 0) {
        return null;
      }
    }

    // Match city using boundary IDs (ПРАВИЛЬНЫЙ СПОСОБ!)
    if (boundaryIds.cityIds.length > 0) {
      totalChecks++;
      const hasMatch = this.listingHasBoundaryId(listing, 'city', boundaryIds.cityIds);
      if (hasMatch) {
        matchCount++;
        score += 1;
      }
    }

    // Match county using boundary IDs (ПРАВИЛЬНЫЙ СПОСОБ!)
    if (boundaryIds.countyIds.length > 0) {
      totalChecks++;
      const hasMatch = this.listingHasBoundaryId(listing, 'county', boundaryIds.countyIds);
      if (hasMatch) {
        matchCount++;
        score += 0.5;
      }
    }

    // Match postal code using boundary IDs
    if (boundaryIds.postalIds.length > 0) {
      totalChecks++;
      const hasMatch = this.listingHasBoundaryId(listing, 'postal_code', boundaryIds.postalIds);
      if (hasMatch) {
        matchCount++;
        score += 1.5;
      }
    }

    // Fallback: Match state directly
    if (criteria.state) {
      totalChecks++;
      if (
        listing.list_address.state_prov.toLowerCase() ===
        criteria.state.toLowerCase()
      ) {
        matchCount++;
        score += 1;
      }
    }

    // Match country
    if (criteria.country) {
      totalChecks++;
      if (
        listing.list_address.country.toLowerCase() ===
        criteria.country.toLowerCase()
      ) {
        matchCount++;
        score += 0.5;
      }
    }

    // Calculate final score
    const matchRatio = totalChecks > 0 ? matchCount / totalChecks : 0;
    const finalScore = score + matchRatio;

    // Require minimum score based on specificity
    const minScore =
      criteria.specificity === 'exact'
        ? 3
        : criteria.specificity === 'street'
        ? 2
        : criteria.specificity === 'neighborhood'
        ? 1
        : 0.5;

    if (finalScore < minScore) {
      return null;
    }

    return { listing, distance, score: finalScore };
  }

  /**
   * Check if listing contains any of the boundary IDs
   * This mimics: SELECT * FROM listings WHERE geo.city IN (?)
   */
  private listingHasBoundaryId(
    listing: Listing,
    boundaryType: 'city' | 'county' | 'postal_code' | 'state',
    searchIds: string[]
  ): boolean {
    const listingBoundaryIds = listing.geo[boundaryType];
    
    if (!Array.isArray(listingBoundaryIds)) {
      return false;
    }

    // Check if any of the listing's boundary IDs match our search IDs
    for (const listingId of listingBoundaryIds) {
      const listingIdStr = listingId.toString();
      if (searchIds.includes(listingIdStr)) {
        return true;
      }
    }

    return false;
  }


  /**
   * Convert listing to search result
   */
  private toSearchResult(listing: Listing): ListingSearchResult {
    return {
      list_id: listing.list_id.$numberLong,
      mls_number: listing.mls_number,
      address: listing.list_address.address,
      city: listing.list_address.city,
      state: listing.list_address.state_prov,
      postal_code: listing.list_address.postal_code,
      coordinates: listing.list_address.coordinates_gp,
      list_status: listing.list_status,
      prop_type: listing.prop_type,
      total_bed: listing.total_bed,
      total_bath: listing.total_bath,
      living_area: listing.living_area,
      current_list_price: listing.current_list_price,
      geo: listing.geo,
    };
  }

  /**
   * Get boundary information by ID
   */
  getBoundaryInfo(boundaryId: string): BoundaryLookup | null {
    const boundary = this.boundaries.get(boundaryId);
    if (!boundary) {
      return null;
    }

    return {
      id: boundary._id,
      category: boundary.category,
      city: boundary.city,
      state: boundary.state,
      county: boundary.county,
      display: boundary.display,
    };
  }

  /**
   * Get all boundaries for a listing
   */
  getListingBoundaries(listing: Listing): BoundaryLookup[] {
    const boundaries: BoundaryLookup[] = [];
    
    for (const boundaryId of listing.geo.boundary_agg) {
      const boundary = this.getBoundaryInfo(boundaryId);
      if (boundary) {
        boundaries.push(boundary);
      }
    }

    return boundaries;
  }
}
