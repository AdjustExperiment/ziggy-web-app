export interface City {
  name: string;
  country: string;
  lat: number;
  lng: number;
}

// Curated 35 cities with balanced global coverage (under WebGL marker limit)
export const WORLD_CITIES: City[] = [
  // Interleaved for even distribution across array positions
  { name: "Tokyo", country: "Japan", lat: 35.6762, lng: 139.6503 },
  { name: "New York", country: "USA", lat: 40.7128, lng: -74.0060 },
  { name: "Lagos", country: "Nigeria", lat: 6.5244, lng: 3.3792 },
  { name: "São Paulo", country: "Brazil", lat: -23.5505, lng: -46.6333 },
  { name: "London", country: "UK", lat: 51.5074, lng: -0.1278 },
  { name: "Sydney", country: "Australia", lat: -33.8688, lng: 151.2093 },
  
  { name: "Beijing", country: "China", lat: 39.9042, lng: 116.4074 },
  { name: "Los Angeles", country: "USA", lat: 34.0522, lng: -118.2437 },
  { name: "Cairo", country: "Egypt", lat: 30.0444, lng: 31.2357 },
  { name: "Buenos Aires", country: "Argentina", lat: -34.6037, lng: -58.3816 },
  { name: "Paris", country: "France", lat: 48.8566, lng: 2.3522 },
  { name: "Melbourne", country: "Australia", lat: -37.8136, lng: 144.9631 },
  
  { name: "Shanghai", country: "China", lat: 31.2304, lng: 121.4737 },
  { name: "Chicago", country: "USA", lat: 41.8781, lng: -87.6298 },
  { name: "Johannesburg", country: "South Africa", lat: -26.2041, lng: 28.0473 },
  { name: "Rio de Janeiro", country: "Brazil", lat: -22.9068, lng: -43.1729 },
  { name: "Berlin", country: "Germany", lat: 52.5200, lng: 13.4050 },
  { name: "Auckland", country: "New Zealand", lat: -36.8509, lng: 174.7645 },
  
  { name: "Singapore", country: "Singapore", lat: 1.3521, lng: 103.8198 },
  { name: "San Francisco", country: "USA", lat: 37.7749, lng: -122.4194 },
  { name: "Nairobi", country: "Kenya", lat: -1.2921, lng: 36.8219 },
  { name: "Lima", country: "Peru", lat: -12.0464, lng: -77.0428 },
  { name: "Rome", country: "Italy", lat: 41.9028, lng: 12.4964 },
  
  { name: "Seoul", country: "South Korea", lat: 37.5665, lng: 126.9780 },
  { name: "Miami", country: "USA", lat: 25.7617, lng: -80.1918 },
  { name: "Madrid", country: "Spain", lat: 40.4168, lng: -3.7038 },
  
  { name: "Mumbai", country: "India", lat: 19.0760, lng: 72.8777 },
  { name: "Toronto", country: "Canada", lat: 43.6532, lng: -79.3832 },
  { name: "Amsterdam", country: "Netherlands", lat: 52.3676, lng: 4.9041 },
  
  { name: "Dubai", country: "UAE", lat: 25.2048, lng: 55.2708 },
  { name: "Mexico City", country: "Mexico", lat: 19.4326, lng: -99.1332 },
  { name: "Stockholm", country: "Sweden", lat: 59.3293, lng: 18.0686 },
  
  { name: "Bangkok", country: "Thailand", lat: 13.7563, lng: 100.5018 },
  { name: "Vancouver", country: "Canada", lat: 49.2827, lng: -123.1207 },
  { name: "Moscow", country: "Russia", lat: 55.7558, lng: 37.6173 },
];

// Backwards compatibility
export const WORLD_CAPITALS = WORLD_CITIES;
export type Capital = City;
