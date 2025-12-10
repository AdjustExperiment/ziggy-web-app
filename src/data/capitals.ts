export interface Capital {
  name: string;
  country: string;
  lat: number;
  lng: number;
}

export const WORLD_CAPITALS: Capital[] = [
  // North America
  { name: 'Washington D.C.', country: 'USA', lat: 38.9072, lng: -77.0369 },
  { name: 'Ottawa', country: 'Canada', lat: 45.4215, lng: -75.6972 },
  { name: 'Mexico City', country: 'Mexico', lat: 19.4326, lng: -99.1332 },
  { name: 'Havana', country: 'Cuba', lat: 23.1136, lng: -82.3666 },
  { name: 'Panama City', country: 'Panama', lat: 8.9824, lng: -79.5199 },
  { name: 'Toronto', country: 'Canada', lat: 43.6532, lng: -79.3832 },
  { name: 'Vancouver', country: 'Canada', lat: 49.2827, lng: -123.1207 },
  // South America
  { name: 'Brasília', country: 'Brazil', lat: -15.7975, lng: -47.8919 },
  { name: 'Buenos Aires', country: 'Argentina', lat: -34.6037, lng: -58.3816 },
  { name: 'Lima', country: 'Peru', lat: -12.0464, lng: -77.0428 },
  { name: 'Bogotá', country: 'Colombia', lat: 4.7110, lng: -74.0721 },
  { name: 'Santiago', country: 'Chile', lat: -33.4489, lng: -70.6693 },
  { name: 'Montevideo', country: 'Uruguay', lat: -34.9011, lng: -56.1645 },
  // Europe
  { name: 'London', country: 'UK', lat: 51.5074, lng: -0.1278 },
  { name: 'Paris', country: 'France', lat: 48.8566, lng: 2.3522 },
  { name: 'Berlin', country: 'Germany', lat: 52.5200, lng: 13.4050 },
  { name: 'Madrid', country: 'Spain', lat: 40.4168, lng: -3.7038 },
  { name: 'Rome', country: 'Italy', lat: 41.9028, lng: 12.4964 },
  { name: 'Amsterdam', country: 'Netherlands', lat: 52.3676, lng: 4.9041 },
  { name: 'Vienna', country: 'Austria', lat: 48.2082, lng: 16.3738 },
  { name: 'Warsaw', country: 'Poland', lat: 52.2297, lng: 21.0122 },
  { name: 'Stockholm', country: 'Sweden', lat: 59.3293, lng: 18.0686 },
  { name: 'Oslo', country: 'Norway', lat: 59.9139, lng: 10.7522 },
  { name: 'Copenhagen', country: 'Denmark', lat: 55.6761, lng: 12.5683 },
  { name: 'Athens', country: 'Greece', lat: 37.9838, lng: 23.7275 },
  { name: 'Lisbon', country: 'Portugal', lat: 38.7223, lng: -9.1393 },
  { name: 'Dublin', country: 'Ireland', lat: 53.3498, lng: -6.2603 },
  { name: 'Budapest', country: 'Hungary', lat: 47.4979, lng: 19.0402 },
  { name: 'Bucharest', country: 'Romania', lat: 44.4268, lng: 26.1025 },
  { name: 'Kyiv', country: 'Ukraine', lat: 50.4501, lng: 30.5234 },
  { name: 'Moscow', country: 'Russia', lat: 55.7558, lng: 37.6173 },
  // Asia
  { name: 'Tokyo', country: 'Japan', lat: 35.6762, lng: 139.6503 },
  { name: 'Beijing', country: 'China', lat: 39.9042, lng: 116.4074 },
  { name: 'Seoul', country: 'South Korea', lat: 37.5665, lng: 126.9780 },
  { name: 'New Delhi', country: 'India', lat: 28.6139, lng: 77.2090 },
  { name: 'Singapore', country: 'Singapore', lat: 1.3521, lng: 103.8198 },
  { name: 'Bangkok', country: 'Thailand', lat: 13.7563, lng: 100.5018 },
  { name: 'Jakarta', country: 'Indonesia', lat: -6.2088, lng: 106.8456 },
  { name: 'Manila', country: 'Philippines', lat: 14.5995, lng: 120.9842 },
  { name: 'Hong Kong', country: 'China', lat: 22.3193, lng: 114.1694 },
  { name: 'Dubai', country: 'UAE', lat: 25.2048, lng: 55.2708 },
  { name: 'Mumbai', country: 'India', lat: 19.0760, lng: 72.8777 },
  { name: 'Shanghai', country: 'China', lat: 31.2304, lng: 121.4737 },
  // Africa
  { name: 'Cairo', country: 'Egypt', lat: 30.0444, lng: 31.2357 },
  { name: 'Cape Town', country: 'South Africa', lat: -33.9249, lng: 18.4241 },
  { name: 'Nairobi', country: 'Kenya', lat: -1.2921, lng: 36.8219 },
  { name: 'Lagos', country: 'Nigeria', lat: 6.5244, lng: 3.3792 },
  { name: 'Casablanca', country: 'Morocco', lat: 33.5731, lng: -7.5898 },
  { name: 'Johannesburg', country: 'South Africa', lat: -26.2041, lng: 28.0473 },
  // Oceania
  { name: 'Sydney', country: 'Australia', lat: -33.8688, lng: 151.2093 },
  { name: 'Melbourne', country: 'Australia', lat: -37.8136, lng: 144.9631 },
  { name: 'Auckland', country: 'New Zealand', lat: -36.8509, lng: 174.7645 },
];

export const CONNECTION_ROUTES: [number, number][] = [
  [0, 1], [0, 2], [5, 6], [7, 8], [8, 11], [9, 10],
  [13, 14], [14, 15], [15, 20], [16, 17], [13, 27],
  [22, 23], [15, 21], [20, 28], [28, 29], [21, 30],
  [32, 33], [33, 34], [34, 32], [36, 37], [37, 38],
  [38, 39], [40, 43], [35, 42], [33, 43],
  [44, 48], [45, 46], [46, 49], [44, 47],
  [50, 51], [50, 52],
  [0, 13], [5, 13], [0, 14], [2, 16], [7, 26],
  [13, 41], [15, 30], [30, 33], [17, 44],
  [36, 50], [32, 50], [40, 50],
  [6, 32], [0, 32], [9, 32],
  [16, 48], [17, 44], [26, 47],
  [44, 41], [46, 42],
];
