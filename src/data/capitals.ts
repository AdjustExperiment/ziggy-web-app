export interface City {
  name: string;
  country: string;
  lat: number;
  lng: number;
}

export const WORLD_CITIES: City[] = [
  // North America
  { name: "Washington D.C.", country: "USA", lat: 38.9072, lng: -77.0369 },
  { name: "New York", country: "USA", lat: 40.7128, lng: -74.0060 },
  { name: "Los Angeles", country: "USA", lat: 34.0522, lng: -118.2437 },
  { name: "Chicago", country: "USA", lat: 41.8781, lng: -87.6298 },
  { name: "Miami", country: "USA", lat: 25.7617, lng: -80.1918 },
  { name: "San Francisco", country: "USA", lat: 37.7749, lng: -122.4194 },
  { name: "Seattle", country: "USA", lat: 47.6062, lng: -122.3321 },
  { name: "Boston", country: "USA", lat: 42.3601, lng: -71.0589 },
  { name: "Dallas", country: "USA", lat: 32.7767, lng: -96.7970 },
  { name: "Atlanta", country: "USA", lat: 33.7490, lng: -84.3880 },
  { name: "Denver", country: "USA", lat: 39.7392, lng: -104.9903 },
  { name: "Phoenix", country: "USA", lat: 33.4484, lng: -112.0740 },
  { name: "Ottawa", country: "Canada", lat: 45.4215, lng: -75.6972 },
  { name: "Toronto", country: "Canada", lat: 43.6532, lng: -79.3832 },
  { name: "Vancouver", country: "Canada", lat: 49.2827, lng: -123.1207 },
  { name: "Montreal", country: "Canada", lat: 45.5017, lng: -73.5673 },
  { name: "Mexico City", country: "Mexico", lat: 19.4326, lng: -99.1332 },
  
  // South America
  { name: "Brasília", country: "Brazil", lat: -15.8267, lng: -47.9218 },
  { name: "São Paulo", country: "Brazil", lat: -23.5505, lng: -46.6333 },
  { name: "Rio de Janeiro", country: "Brazil", lat: -22.9068, lng: -43.1729 },
  { name: "Buenos Aires", country: "Argentina", lat: -34.6037, lng: -58.3816 },
  { name: "Lima", country: "Peru", lat: -12.0464, lng: -77.0428 },
  { name: "Bogotá", country: "Colombia", lat: 4.7110, lng: -74.0721 },
  { name: "Santiago", country: "Chile", lat: -33.4489, lng: -70.6693 },
  { name: "Caracas", country: "Venezuela", lat: 10.4806, lng: -66.9036 },
  
  // Europe
  { name: "London", country: "UK", lat: 51.5074, lng: -0.1278 },
  { name: "Paris", country: "France", lat: 48.8566, lng: 2.3522 },
  { name: "Berlin", country: "Germany", lat: 52.5200, lng: 13.4050 },
  { name: "Munich", country: "Germany", lat: 48.1351, lng: 11.5820 },
  { name: "Rome", country: "Italy", lat: 41.9028, lng: 12.4964 },
  { name: "Milan", country: "Italy", lat: 45.4642, lng: 9.1900 },
  { name: "Madrid", country: "Spain", lat: 40.4168, lng: -3.7038 },
  { name: "Barcelona", country: "Spain", lat: 41.3851, lng: 2.1734 },
  { name: "Amsterdam", country: "Netherlands", lat: 52.3676, lng: 4.9041 },
  { name: "Brussels", country: "Belgium", lat: 50.8503, lng: 4.3517 },
  { name: "Vienna", country: "Austria", lat: 48.2082, lng: 16.3738 },
  { name: "Zurich", country: "Switzerland", lat: 47.3769, lng: 8.5417 },
  { name: "Stockholm", country: "Sweden", lat: 59.3293, lng: 18.0686 },
  { name: "Oslo", country: "Norway", lat: 59.9139, lng: 10.7522 },
  { name: "Copenhagen", country: "Denmark", lat: 55.6761, lng: 12.5683 },
  { name: "Helsinki", country: "Finland", lat: 60.1699, lng: 24.9384 },
  { name: "Dublin", country: "Ireland", lat: 53.3498, lng: -6.2603 },
  { name: "Lisbon", country: "Portugal", lat: 38.7223, lng: -9.1393 },
  { name: "Warsaw", country: "Poland", lat: 52.2297, lng: 21.0122 },
  { name: "Prague", country: "Czech Republic", lat: 50.0755, lng: 14.4378 },
  { name: "Budapest", country: "Hungary", lat: 47.4979, lng: 19.0402 },
  { name: "Athens", country: "Greece", lat: 37.9838, lng: 23.7275 },
  { name: "Moscow", country: "Russia", lat: 55.7558, lng: 37.6173 },
  { name: "St. Petersburg", country: "Russia", lat: 59.9311, lng: 30.3609 },
  { name: "Kyiv", country: "Ukraine", lat: 50.4501, lng: 30.5234 },
  
  // Asia
  { name: "Tokyo", country: "Japan", lat: 35.6762, lng: 139.6503 },
  { name: "Osaka", country: "Japan", lat: 34.6937, lng: 135.5023 },
  { name: "Beijing", country: "China", lat: 39.9042, lng: 116.4074 },
  { name: "Shanghai", country: "China", lat: 31.2304, lng: 121.4737 },
  { name: "Hong Kong", country: "China", lat: 22.3193, lng: 114.1694 },
  { name: "Shenzhen", country: "China", lat: 22.5431, lng: 114.0579 },
  { name: "Guangzhou", country: "China", lat: 23.1291, lng: 113.2644 },
  { name: "Seoul", country: "South Korea", lat: 37.5665, lng: 126.9780 },
  { name: "Busan", country: "South Korea", lat: 35.1796, lng: 129.0756 },
  { name: "Taipei", country: "Taiwan", lat: 25.0330, lng: 121.5654 },
  { name: "Singapore", country: "Singapore", lat: 1.3521, lng: 103.8198 },
  { name: "Kuala Lumpur", country: "Malaysia", lat: 3.1390, lng: 101.6869 },
  { name: "Bangkok", country: "Thailand", lat: 13.7563, lng: 100.5018 },
  { name: "Ho Chi Minh City", country: "Vietnam", lat: 10.8231, lng: 106.6297 },
  { name: "Hanoi", country: "Vietnam", lat: 21.0278, lng: 105.8342 },
  { name: "Jakarta", country: "Indonesia", lat: -6.2088, lng: 106.8456 },
  { name: "Manila", country: "Philippines", lat: 14.5995, lng: 120.9842 },
  { name: "New Delhi", country: "India", lat: 28.6139, lng: 77.2090 },
  { name: "Mumbai", country: "India", lat: 19.0760, lng: 72.8777 },
  { name: "Bangalore", country: "India", lat: 12.9716, lng: 77.5946 },
  { name: "Chennai", country: "India", lat: 13.0827, lng: 80.2707 },
  { name: "Kolkata", country: "India", lat: 22.5726, lng: 88.3639 },
  { name: "Dhaka", country: "Bangladesh", lat: 23.8103, lng: 90.4125 },
  { name: "Karachi", country: "Pakistan", lat: 24.8607, lng: 67.0011 },
  { name: "Islamabad", country: "Pakistan", lat: 33.6844, lng: 73.0479 },
  { name: "Tehran", country: "Iran", lat: 35.6892, lng: 51.3890 },
  { name: "Dubai", country: "UAE", lat: 25.2048, lng: 55.2708 },
  { name: "Abu Dhabi", country: "UAE", lat: 24.4539, lng: 54.3773 },
  { name: "Riyadh", country: "Saudi Arabia", lat: 24.7136, lng: 46.6753 },
  { name: "Tel Aviv", country: "Israel", lat: 32.0853, lng: 34.7818 },
  { name: "Istanbul", country: "Turkey", lat: 41.0082, lng: 28.9784 },
  { name: "Ankara", country: "Turkey", lat: 39.9334, lng: 32.8597 },
  
  // Africa
  { name: "Cairo", country: "Egypt", lat: 30.0444, lng: 31.2357 },
  { name: "Lagos", country: "Nigeria", lat: 6.5244, lng: 3.3792 },
  { name: "Johannesburg", country: "South Africa", lat: -26.2041, lng: 28.0473 },
  { name: "Cape Town", country: "South Africa", lat: -33.9249, lng: 18.4241 },
  { name: "Nairobi", country: "Kenya", lat: -1.2921, lng: 36.8219 },
  { name: "Casablanca", country: "Morocco", lat: 33.5731, lng: -7.5898 },
  { name: "Algiers", country: "Algeria", lat: 36.7538, lng: 3.0588 },
  { name: "Tunis", country: "Tunisia", lat: 36.8065, lng: 10.1815 },
  { name: "Accra", country: "Ghana", lat: 5.6037, lng: -0.1870 },
  { name: "Addis Ababa", country: "Ethiopia", lat: 9.0320, lng: 38.7469 },
  
  // Oceania
  { name: "Canberra", country: "Australia", lat: -35.2809, lng: 149.1300 },
  { name: "Sydney", country: "Australia", lat: -33.8688, lng: 151.2093 },
  { name: "Melbourne", country: "Australia", lat: -37.8136, lng: 144.9631 },
  { name: "Brisbane", country: "Australia", lat: -27.4698, lng: 153.0251 },
  { name: "Perth", country: "Australia", lat: -31.9505, lng: 115.8605 },
  { name: "Auckland", country: "New Zealand", lat: -36.8509, lng: 174.7645 },
  { name: "Wellington", country: "New Zealand", lat: -41.2866, lng: 174.7756 },
];

// Backwards compatibility
export const WORLD_CAPITALS = WORLD_CITIES;
export type Capital = City;
