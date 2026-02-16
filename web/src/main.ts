import './style.css';

// Use your actual Google API key from .env
const GOOGLE_API_KEY = 'AIzaSyB0UY4xYbSQMKSAyMx5pBlpoRCMEv2sY8A'; // Replace with actual key

interface GoogleResponse {
  street_number?: string;
  route?: string;
  locality?: string;
  administrative_area_level_1?: string;
  administrative_area_level_2?: string;
  postal_code?: string;
  country?: string;
  formatted_address: string;
  coordinates: {
    lat: number;
    lng: number;
  };
}

async function searchAddress(address: string): Promise<GoogleResponse | null> {
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${GOOGLE_API_KEY}`;
  
  const response = await fetch(url);
  const data = await response.json();
  
  if (data.status !== 'OK' || !data.results.length) {
    throw new Error(`Google API Error: ${data.status}`);
  }
  
  const result = data.results[0];
  const parsed: any = {
    formatted_address: result.formatted_address,
    coordinates: {
      lat: result.geometry.location.lat,
      lng: result.geometry.location.lng
    }
  };
  
  result.address_components.forEach((component: any) => {
    if (component.types.includes('street_number')) {
      parsed.street_number = component.long_name;
    }
    if (component.types.includes('route')) {
      parsed.route = component.long_name;
    }
    if (component.types.includes('locality')) {
      parsed.locality = component.long_name;
    }
    if (component.types.includes('administrative_area_level_1')) {
      parsed.administrative_area_level_1 = component.short_name;
    }
    if (component.types.includes('administrative_area_level_2')) {
      parsed.administrative_area_level_2 = component.long_name;
    }
    if (component.types.includes('postal_code')) {
      parsed.postal_code = component.long_name;
    }
    if (component.types.includes('country')) {
      parsed.country = component.short_name;
    }
  });
  
  return parsed;
}

function displayGoogleResponse(data: GoogleResponse) {
  const el = document.getElementById('googleResponse')!;
  el.innerHTML = `<pre class="json-display">${JSON.stringify(data, null, 2)}</pre>`;
}

function displayMapping(data: GoogleResponse) {
  const mappings = [
    {
      google: 'street_number',
      value: data.street_number,
      dbField: 'list_address.street_number',
      dbExample: '"400"'
    },
    {
      google: 'route',
      value: data.route,
      dbField: 'list_address.street_name',
      dbExample: '"Inwood"'
    },
    {
      google: 'locality',
      value: data.locality,
      dbField: 'list_address.city',
      dbExample: '"Austin"'
    },
    {
      google: 'administrative_area_level_1',
      value: data.administrative_area_level_1,
      dbField: 'list_address.state_prov',
      dbExample: '"TX"'
    },
    {
      google: 'administrative_area_level_2',
      value: data.administrative_area_level_2,
      dbField: 'location.county',
      dbExample: '"Travis"'
    },
    {
      google: 'postal_code',
      value: data.postal_code,
      dbField: 'list_address.postal_code',
      dbExample: '"78746"'
    },
    {
      google: 'country',
      value: data.country,
      dbField: 'list_address.country',
      dbExample: '"US"'
    },
    {
      google: 'coordinates.lat',
      value: data.coordinates.lat,
      dbField: 'list_address.coordinates_gp.lat',
      dbExample: '30.27349507'
    },
    {
      google: 'coordinates.lng',
      value: data.coordinates.lng,
      dbField: 'list_address.coordinates_gp.lon',
      dbExample: '-97.78272307'
    }
  ];
  
  const el = document.getElementById('mappingTable')!;
  el.innerHTML = `
    <table class="mapping-table">
      <thead>
        <tr>
          <th>Google Field</th>
          <th>Value</th>
          <th>→ Database Field</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        ${mappings.map(m => `
          <tr>
            <td><code class="code-inline">${m.google}</code></td>
            <td><strong>${m.value || '(not found)'}</strong></td>
            <td><code class="code-inline">${m.dbField}</code></td>
            <td>
              <span class="status-badge ${m.value ? 'status-found' : 'status-missing'}">
                ${m.value ? '✅ Found' : '❌ Missing'}
              </span>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

function displayBoundaryLookup(data: GoogleResponse) {
  const el = document.getElementById('boundaryLookup')!;
  
  const city = data.locality || 'N/A';
  const county = data.administrative_area_level_2 || 'N/A';
  const state = data.administrative_area_level_1 || 'N/A';
  const postal = data.postal_code || 'N/A';
  
  el.innerHTML = `
    <div class="info-box">
      <h3>📍 What we got from Google:</h3>
      <ul class="step-list">
        <li>City: <span class="highlight">${city}</span></li>
        <li>County: <span class="highlight">${county}</span></li>
        <li>State: <span class="highlight">${state}</span></li>
        <li>Postal Code: <span class="highlight">${postal}</span></li>
      </ul>
    </div>

    <div class="info-box">
      <h3>🔍 How to find Boundary IDs:</h3>
      <p>Query the <code>boundaries</code> collection to get IDs:</p>
      
      <div class="query-box">
<span class="comment">// Find city boundary</span>
db.boundaries.findOne({
  <span class="keyword">category</span>: <span class="string">"CITY"</span>,
  <span class="keyword">city</span>: <span class="string">"${city}"</span>,
  <span class="keyword">state</span>: <span class="string">"${state}"</span>
})
<span class="comment">// Returns: { _id: "949963", city: "Rollingwood", ... }</span>

<span class="comment">// Find county boundary</span>
db.boundaries.findOne({
  <span class="keyword">category</span>: <span class="string">"COUNTY"</span>,
  <span class="keyword">county</span>: <span class="string">"${county}"</span>,
  <span class="keyword">state</span>: <span class="string">"${state}"</span>
})
<span class="comment">// Returns: { _id: "963036", county: "Travis", ... }</span>

<span class="comment">// Find postal code boundary</span>
db.boundaries.findOne({
  <span class="keyword">category</span>: <span class="string">"POSTALCODE"</span>,
  <span class="keyword">display</span>: <span class="keyword">/</span><span class="string">${postal}</span><span class="keyword">/</span>
})
<span class="comment">// Returns: { _id: "180798", display: "78746", ... }</span>
      </div>
    </div>

    <div class="info-box">
      <h3>📊 Result:</h3>
      <p>After querying boundaries, you'll have IDs like:</p>
      <ul class="step-list">
        <li><strong>City ID:</strong> <code>949963</code></li>
        <li><strong>County ID:</strong> <code>963036</code></li>
        <li><strong>Postal Code ID:</strong> <code>180798</code></li>
      </ul>
    </div>
  `;
}

function displayListingsQuery(data: GoogleResponse) {
  const el = document.getElementById('listingsQuery')!;
  
  const lat = data.coordinates.lat;
  const lng = data.coordinates.lng;
  
  el.innerHTML = `
    <div class="info-box">
      <h3>🎯 Method 1: Query by Boundary IDs</h3>
      <p>Use the boundary IDs we found to search for listings:</p>
      
      <div class="query-box">
<span class="comment">// Find all listings in this city</span>
db.listings.find({
  <span class="string">"geo.city"</span>: <span class="number">949963</span>,
  <span class="keyword">list_status</span>: { <span class="keyword">$in</span>: [<span class="string">"Active"</span>, <span class="string">"Sold"</span>] }
})

<span class="comment">// OR: Find listings matching any boundary</span>
db.listings.find({
  <span class="string">"geo.boundary_agg"</span>: { 
    <span class="keyword">$in</span>: [<span class="string">"949963"</span>, <span class="string">"963036"</span>, <span class="string">"180798"</span>] 
  },
  <span class="keyword">list_status</span>: { <span class="keyword">$in</span>: [<span class="string">"Active"</span>, <span class="string">"Sold"</span>] }
})
      </div>
    </div>

    <div class="info-box">
      <h3>📍 Method 2: Query by Coordinates (Exact Address)</h3>
      <p>For exact addresses, use geospatial query with coordinates:</p>
      
      <div class="query-box">
<span class="comment">// Find listings within 100m radius</span>
db.listings.find({
  <span class="string">"list_address.coordinates_gs"</span>: {
    <span class="keyword">$near</span>: {
      <span class="keyword">$geometry</span>: {
        <span class="keyword">type</span>: <span class="string">"Point"</span>,
        <span class="keyword">coordinates</span>: [<span class="number">${lng}</span>, <span class="number">${lat}</span>]
      },
      <span class="keyword">$maxDistance</span>: <span class="number">100</span> <span class="comment">// meters</span>
    }
  },
  <span class="keyword">list_status</span>: { <span class="keyword">$in</span>: [<span class="string">"Active"</span>, <span class="string">"Sold"</span>] }
})
      </div>
    </div>

    <div class="info-box">
      <h3>🔗 Method 3: Combined Query (Most Accurate)</h3>
      <p>Combine both methods for best results:</p>
      
      <div class="query-box">
<span class="comment">// 1. Get nearby listings (distance filter)</span>
<span class="keyword">const</span> nearbyListings = db.listings.find({
  <span class="string">"list_address.coordinates_gs"</span>: {
    <span class="keyword">$near</span>: {
      <span class="keyword">$geometry</span>: { 
        <span class="keyword">type</span>: <span class="string">"Point"</span>, 
        <span class="keyword">coordinates</span>: [<span class="number">${lng}</span>, <span class="number">${lat}</span>] 
      },
      <span class="keyword">$maxDistance</span>: <span class="number">2000</span> <span class="comment">// 2km</span>
    }
  },
  <span class="keyword">list_status</span>: { <span class="keyword">$in</span>: [<span class="string">"Active"</span>, <span class="string">"Sold"</span>] }
});

<span class="comment">// 2. Filter by boundary IDs</span>
<span class="keyword">const</span> matchedListings = nearbyListings.filter(listing => {
  <span class="keyword">return</span> listing.geo.boundary_agg.includes(<span class="string">"949963"</span>);
});

<span class="comment">// 3. Score and sort by relevance</span>
<span class="comment">// (check street number, street name, etc.)</span>
      </div>
    </div>

    <div class="info-box" style="background: #fff3cd; border-left-color: #ffc107;">
      <h3 style="color: #856404;">💡 Key Points:</h3>
      <ul class="step-list">
        <li>
          <strong>For exact addresses:</strong> Use coordinates + street matching
        </li>
        <li>
          <strong>For street/neighborhood:</strong> Use boundary IDs (geo.city, geo.county)
        </li>
        <li>
          <strong>boundary_agg field:</strong> Contains ALL boundary IDs as strings for easy querying
        </li>
        <li>
          <strong>Always filter by list_status:</strong> "Active" or "Sold"
        </li>
      </ul>
    </div>
  `;
}

// Event listeners
document.getElementById('searchBtn')!.addEventListener('click', async () => {
  const input = document.getElementById('addressInput') as HTMLInputElement;
  const address = input.value.trim();
  
  if (!address) {
    alert('Please enter an address');
    return;
  }
  
  // Show loading
  document.getElementById('loading')!.classList.remove('hidden');
  document.getElementById('error')!.classList.add('hidden');
  document.getElementById('results')!.classList.add('hidden');
  
  try {
    const result = await searchAddress(address);
    
    if (result) {
      displayGoogleResponse(result);
      displayMapping(result);
      displayBoundaryLookup(result);
      displayListingsQuery(result);
      
      document.getElementById('results')!.classList.remove('hidden');
    }
  } catch (error: any) {
    document.getElementById('error')!.textContent = error.message;
    document.getElementById('error')!.classList.remove('hidden');
  } finally {
    document.getElementById('loading')!.classList.add('hidden');
  }
});

// Allow Enter key
document.getElementById('addressInput')!.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    document.getElementById('searchBtn')!.click();
  }
});
