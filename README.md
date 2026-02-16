for prod

// production (MongoDB):
async findBoundaryIds(googleAddress) {
  const cityBoundary = await db.boundaries.findOne({
    category: "CITY",
    city: googleAddress.locality,
    state: googleAddress.administrative_area_level_1,
    country: googleAddress.country
  });
  
  return { cityIds: [cityBoundary._id], ... };
}

1. Google returned: city="Austin", state="TX", country="US"

2. findBoundaryIds() - searches for a boundary by name:
   → Goes through all boundaries
   → Finds: boundary._id=“949963” where city="Austin" 
   → Returns: { cityIds: [“949963”], countyIds: [...], ... }

3. matchListing() - searches listings by boundary IDs:
   → Checks: listing.geo.city contains “949963”? ✅
   → If yes, it's a match!

4. listingHasBoundaryId() - checks for the presence of an ID:
   → listing.geo.city = [949963]
   → searchIds = [“949963”]
   → Is there a match? ✅ true