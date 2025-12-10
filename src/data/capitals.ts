export interface City {
  name: string;
  country: string;
  lat: number;
  lng: number;
}

// Curated list of ~48 cities for balanced global coverage
// (WebGL shader has ~50 marker limit)
export const WORLD_CITIES: City[] = [
  // Africa (6)
  { name: "Cairo", country: "Egypt", lat: 30.0444, lng: 31.2357 },
  { name: "Lagos", country: "Nigeria", lat: 6.5244, lng: 3.3792 },
  { name: "Johannesburg", country: "South Africa", lat: -26.2041, lng: 28.0473 },
  { name: "Nairobi", country: "Kenya", lat: -1.2921, lng: 36.8219 },
  { name: "Casablanca", country: "Morocco", lat: 33.5731, lng: -7.5898 },
  { name: "Addis Ababa", country: "Ethiopia", lat: 9.0320, lng: 38.7469 },
  
  // Asia (12)
  { name: "Tokyo", country: "Japan", lat: 35.6762, lng: 139.6503 },
  { name: "Beijing", country: "China", lat: 39.9042, lng: 116.4074 },
  { name: "Shanghai", country: "China", lat: 31.2304, lng: 121.4737 },
  { name: "Hong Kong", country: "China", lat: 22.3193, lng: 114.1694 },
  { name: "Seoul", country: "South Korea", lat: 37.5665, lng: 126.9780 },
  { name: "Singapore", country: "Singapore", lat: 1.3521, lng: 103.8198 },
  { name: "Bangkok", country: "Thailand", lat: 13.7563, lng: 100.5018 },
  { name: "Jakarta", country: "Indonesia", lat: -6.2088, lng: 106.8456 },
  { name: "Mumbai", country: "India", lat: 19.0760, lng: 72.8777 },
  { name: "New Delhi", country: "India", lat: 28.6139, lng: 77.2090 },
  { name: "Dubai", country: "UAE", lat: 25.2048, lng: 55.2708 },
  { name: "Istanbul", country: "Turkey", lat: 41.0082, lng: 28.9784 },
  
  // Europe (10)
  { name: "London", country: "UK", lat: 51.5074, lng: -0.1278 },
  { name: "Paris", country: "France", lat: 48.8566, lng: 2.3522 },
  { name: "Berlin", country: "Germany", lat: 52.5200, lng: 13.4050 },
  { name: "Rome", country: "Italy", lat: 41.9028, lng: 12.4964 },
  { name: "Madrid", country: "Spain", lat: 40.4168, lng: -3.7038 },
  { name: "Amsterdam", country: "Netherlands", lat: 52.3676, lng: 4.9041 },
  { name: "Moscow", country: "Russia", lat: 55.7558, lng: 37.6173 },
  { name: "Stockholm", country: "Sweden", lat: 59.3293, lng: 18.0686 },
  { name: "Vienna", country: "Austria", lat: 48.2082, lng: 16.3738 },
  { name: "Dublin", country: "Ireland", lat: 53.3498, lng: -6.2603 },
  
  // North America (10)
  { name: "New York", country: "USA", lat: 40.7128, lng: -74.0060 },
  { name: "Los Angeles", country: "USA", lat: 34.0522, lng: -118.2437 },
  { name: "Chicago", country: "USA", lat: 41.8781, lng: -87.6298 },
  { name: "San Francisco", country: "USA", lat: 37.7749, lng: -122.4194 },
  { name: "Miami", country: "USA", lat: 25.7617, lng: -80.1918 },
  { name: "Seattle", country: "USA", lat: 47.6062, lng: -122.3321 },
  { name: "Washington D.C.", country: "USA", lat: 38.9072, lng: -77.0369 },
  { name: "Toronto", country: "Canada", lat: 43.6532, lng: -79.3832 },
  { name: "Vancouver", country: "Canada", lat: 49.2827, lng: -123.1207 },
  { name: "Mexico City", country: "Mexico", lat: 19.4326, lng: -99.1332 },
  
  // South America (6)
  { name: "São Paulo", country: "Brazil", lat: -23.5505, lng: -46.6333 },
  { name: "Buenos Aires", country: "Argentina", lat: -34.6037, lng: -58.3816 },
  { name: "Rio de Janeiro", country: "Brazil", lat: -22.9068, lng: -43.1729 },
  { name: "Lima", country: "Peru", lat: -12.0464, lng: -77.0428 },
  { name: "Bogotá", country: "Colombia", lat: 4.7110, lng: -74.0721 },
  { name: "Santiago", country: "Chile", lat: -33.4489, lng: -70.6693 },
  
  // Oceania (4)
  { name: "Sydney", country: "Australia", lat: -33.8688, lng: 151.2093 },
  { name: "Melbourne", country: "Australia", lat: -37.8136, lng: 144.9631 },
  { name: "Auckland", country: "New Zealand", lat: -36.8509, lng: 174.7645 },
  { name: "Brisbane", country: "Australia", lat: -27.4698, lng: 153.0251 },
];

// Backwards compatibility
export const WORLD_CAPITALS = WORLD_CITIES;
export type Capital = City;
