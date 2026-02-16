import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import { GooglePlacesService } from './services/google-places.service';
import { ListingSearchService } from './services/listing-search.service';
import { Listing } from './types/listing.types';
import { Boundary } from './types/boundary.types';

// Load environment variables
dotenv.config();

async function main() {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  
  if (!apiKey) {
    console.error('Error: GOOGLE_MAPS_API_KEY not found in environment variables');
    console.error('Please create a .env file with your Google Maps API key');
    console.error('Example: GOOGLE_MAPS_API_KEY=your_api_key_here');
    process.exit(1);
  }

  console.log('Loading data files...');
  
  // Load example data
  const listingData: Listing = JSON.parse(
    fs.readFileSync(path.join(__dirname, '../listing-example.json'), 'utf-8')
  );
  
  const boundaryData: Boundary = JSON.parse(
    fs.readFileSync(path.join(__dirname, '../boundary-examaple.json'), 'utf-8')
  );

  // Initialize services
  const googleService = new GooglePlacesService(apiKey);
  const listingService = new ListingSearchService(
    googleService,
    [listingData], // In production, load from database
    [boundaryData] // In production, load from database
  );

  // Test address search
  const testAddress = '400 Inwood Road, Austin';
  console.log('\n=== Testing Address Search ===');
  console.log('Searching for:', testAddress);
  console.log('');

  try {
    // const results = await listingService.searchListingsByAddress(testAddress);
    
    // console.log('\n=== Search Results ===');
    // console.log(`Found ${results.length} listing(s)\n`);

    // results.forEach((result, index) => {
    //   console.log(`--- Listing ${index + 1} ---`);
    //   console.log(`Address: ${result.address}`);
    //   console.log(`MLS Number: ${result.mls_number}`);
    //   console.log(`Status: ${result.list_status}`);
    //   console.log(`Type: ${result.prop_type}`);
    //   console.log(`Beds: ${result.total_bed}, Baths: ${result.total_bath}`);
    //   console.log(`Living Area: ${result.living_area} sqft`);
    //   console.log(`Price: $${result.current_list_price.toLocaleString()}`);
    //   console.log(`Coordinates: ${result.coordinates.lat}, ${result.coordinates.lon}`);
      
    //   // Show boundary information
    //   console.log('Boundaries:');
    //   const boundaries = listingService.getListingBoundaries(
    //     listingData // In production, get from results
    //   );
    //   boundaries.forEach(b => {
    //     console.log(`  - ${b.category}: ${b.display}`);
    //   });
    //   console.log('');
    // });

    // // Test different address formats
    // console.log('\n=== Testing Different Address Formats ===\n');

    const testAddresses = [
      'Inwood Road, Austin, TX',
      'Austin, TX 78746',
      'Rollingwood, TX',
      'Travis County, TX',
    ];

    for (const addr of testAddresses) {
      console.log(`Searching: "${addr}"`);
      const parsedAddress = await googleService.searchAddress(addr);
      if (parsedAddress) {
        const criteria = googleService.buildSearchCriteria(parsedAddress);
        console.log(`  Specificity: ${criteria.specificity}`);
        console.log(`  Search radius: ${criteria.radius}m`);
        console.log(`  Coordinates: ${criteria.coordinates.lat}, ${criteria.coordinates.lng}`);
      }
      console.log('');
    }

  } catch (error) {
    console.error('Error during search:', error);
    process.exit(1);
  }
}

// Run if this is the main module
if (require.main === module) {
  main().catch(console.error);
}

export { GooglePlacesService, ListingSearchService };
