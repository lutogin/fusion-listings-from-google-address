import * as dotenv from 'dotenv';
import { GooglePlacesService } from './services/google-places.service';

dotenv.config();

/**
 * Test script to see what Google Places API actually returns
 * and map it to our database fields
 */

async function testGoogleAPI() {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  
  if (!apiKey) {
    console.error('❌ GOOGLE_MAPS_API_KEY not found in .env file');
    process.exit(1);
  }

  console.log('✅ API Key found, testing Google Places API...\n');
  console.log('='.repeat(80));

  const googleService = new GooglePlacesService(apiKey);

  // Test addresses
  const testAddresses = [
    '400 Inwood Road, Austin, TX 78746',
    'Inwood Road, Austin, TX',
    'Rollingwood, TX',
    'Travis County, TX',
    '78746'
  ];

  for (const address of testAddresses) {
    console.log(`\n📍 Testing: "${address}"`);
    console.log('-'.repeat(80));

    try {
      const result = await googleService.searchAddress(address);
      
      if (!result) {
        console.log('❌ No results found\n');
        continue;
      }

      console.log('\n🔍 GOOGLE API RESPONSE:');
      console.log(JSON.stringify(result, null, 2));

      console.log('\n📊 MAPPING TO OUR DATABASE FIELDS:');
      console.log('─'.repeat(80));
      
      // Mapping table
      const mapping = [
        {
          google: 'street_number',
          value: result.street_number,
          dbField: 'list_address.street_number',
          dbExample: '400'
        },
        {
          google: 'route',
          value: result.route,
          dbField: 'list_address.street_name',
          dbExample: 'Inwood'
        },
        {
          google: 'locality',
          value: result.locality,
          dbField: 'list_address.city',
          dbExample: 'Austin'
        },
        {
          google: 'administrative_area_level_1',
          value: result.administrative_area_level_1,
          dbField: 'list_address.state_prov',
          dbExample: 'TX'
        },
        {
          google: 'administrative_area_level_2',
          value: result.administrative_area_level_2,
          dbField: 'location.county',
          dbExample: 'Travis'
        },
        {
          google: 'postal_code',
          value: result.postal_code,
          dbField: 'list_address.postal_code',
          dbExample: '78746'
        },
        {
          google: 'country',
          value: result.country,
          dbField: 'list_address.country',
          dbExample: 'US'
        },
        {
          google: 'coordinates.lat',
          value: result.coordinates.lat,
          dbField: 'list_address.coordinates_gp.lat',
          dbExample: '30.27349507'
        },
        {
          google: 'coordinates.lng',
          value: result.coordinates.lng,
          dbField: 'list_address.coordinates_gp.lon',
          dbExample: '-97.78272307'
        },
        {
          google: 'formatted_address',
          value: result.formatted_address,
          dbField: 'list_address.address',
          dbExample: '400 Inwood Road, Austin, TX 78746'
        }
      ];

      mapping.forEach(({ google, value, dbField, dbExample }) => {
        const status = value ? '✅' : '❌';
        const displayValue = value || '(not found)';
        console.log(`${status} ${google.padEnd(30)} → ${dbField.padEnd(35)} | ${displayValue}`);
      });

      // Show search criteria
      const criteria = googleService.buildSearchCriteria(result);
      console.log('\n🎯 SEARCH CRITERIA:');
      console.log('─'.repeat(80));
      console.log(`Specificity: ${criteria.specificity}`);
      console.log(`Search Radius: ${criteria.radius}m`);
      console.log(`Coordinates: ${criteria.coordinates.lat}, ${criteria.coordinates.lng}`);

      // Show what fields we'll use for matching
      console.log('\n🔗 FIELDS USED FOR MATCHING:');
      console.log('─'.repeat(80));
      if (criteria.street_number) {
        console.log(`✓ Street Number: ${criteria.street_number} → list_address.street_number`);
      }
      if (criteria.street_name) {
        console.log(`✓ Street Name: ${criteria.street_name} → list_address.street_name`);
      }
      if (criteria.city) {
        console.log(`✓ City: ${criteria.city} → list_address.city + geo.city (via boundaries)`);
      }
      if (criteria.state) {
        console.log(`✓ State: ${criteria.state} → list_address.state_prov`);
      }
      if (criteria.county) {
        console.log(`✓ County: ${criteria.county} → location.county + geo.county (via boundaries)`);
      }
      if (criteria.postal_code) {
        console.log(`✓ Postal Code: ${criteria.postal_code} → list_address.postal_code`);
      }
      if (criteria.country) {
        console.log(`✓ Country: ${criteria.country} → list_address.country + boundaries.country`);
      }
      console.log(`✓ Coordinates: {${criteria.coordinates.lat}, ${criteria.coordinates.lng}} → calculateDistance()`);

      console.log('\n' + '='.repeat(80));

    } catch (error: any) {
      console.error('❌ Error:', error.message);
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
      }
    }
  }

  console.log('\n✅ Testing complete!');
  console.log('\n💡 KEY FINDINGS:');
  console.log('─'.repeat(80));
  console.log('1. Google "street_number" → DB "list_address.street_number"');
  console.log('2. Google "route" → DB "list_address.street_name"');
  console.log('3. Google "locality" → DB "list_address.city" + geo.city boundaries');
  console.log('4. Google "administrative_area_level_1" → DB "list_address.state_prov"');
  console.log('5. Google "administrative_area_level_2" → DB "location.county" + geo.county boundaries');
  console.log('6. Google "postal_code" → DB "list_address.postal_code"');
  console.log('7. Google "coordinates" → DB "list_address.coordinates_gp" for distance calc');
  console.log('\n💾 For boundaries: use geo.city, geo.county IDs to lookup in boundaries collection');
}

testGoogleAPI().catch(console.error);
