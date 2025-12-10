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
  { name: 'San Francisco', country: 'USA', lat: 37.7749, lng: -122.4194 },
  { name: 'Miami', country: 'USA', lat: 25.7617, lng: -80.1918 },
  { name: 'Chicago', country: 'USA', lat: 41.8781, lng: -87.6298 },
  { name: 'Los Angeles', country: 'USA', lat: 34.0522, lng: -118.2437 },
  { name: 'New York', country: 'USA', lat: 40.7128, lng: -74.0060 },
  // South America
  { name: 'Brasília', country: 'Brazil', lat: -15.7975, lng: -47.8919 },
  { name: 'Buenos Aires', country: 'Argentina', lat: -34.6037, lng: -58.3816 },
  { name: 'Lima', country: 'Peru', lat: -12.0464, lng: -77.0428 },
  { name: 'Bogotá', country: 'Colombia', lat: 4.7110, lng: -74.0721 },
  { name: 'Santiago', country: 'Chile', lat: -33.4489, lng: -70.6693 },
  { name: 'Montevideo', country: 'Uruguay', lat: -34.9011, lng: -56.1645 },
  { name: 'Rio de Janeiro', country: 'Brazil', lat: -22.9068, lng: -43.1729 },
  { name: 'Quito', country: 'Ecuador', lat: -0.1807, lng: -78.4678 },
  { name: 'Caracas', country: 'Venezuela', lat: 10.4806, lng: -66.9036 },
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
  { name: 'Zurich', country: 'Switzerland', lat: 47.3769, lng: 8.5417 },
  { name: 'Brussels', country: 'Belgium', lat: 50.8503, lng: 4.3517 },
  { name: 'Prague', country: 'Czech Republic', lat: 50.0755, lng: 14.4378 },
  { name: 'Helsinki', country: 'Finland', lat: 60.1699, lng: 24.9384 },
  { name: 'Reykjavik', country: 'Iceland', lat: 64.1466, lng: -21.9426 },
  { name: 'Barcelona', country: 'Spain', lat: 41.3851, lng: 2.1734 },
  { name: 'Milan', country: 'Italy', lat: 45.4642, lng: 9.1900 },
  { name: 'Munich', country: 'Germany', lat: 48.1351, lng: 11.5820 },
  { name: 'Edinburgh', country: 'UK', lat: 55.9533, lng: -3.1883 },
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
  { name: 'Taipei', country: 'Taiwan', lat: 25.0330, lng: 121.5654 },
  { name: 'Kuala Lumpur', country: 'Malaysia', lat: 3.1390, lng: 101.6869 },
  { name: 'Hanoi', country: 'Vietnam', lat: 21.0285, lng: 105.8542 },
  { name: 'Osaka', country: 'Japan', lat: 34.6937, lng: 135.5023 },
  { name: 'Ho Chi Minh City', country: 'Vietnam', lat: 10.8231, lng: 106.6297 },
  { name: 'Doha', country: 'Qatar', lat: 25.2854, lng: 51.5310 },
  { name: 'Abu Dhabi', country: 'UAE', lat: 24.4539, lng: 54.3773 },
  // Africa
  { name: 'Cairo', country: 'Egypt', lat: 30.0444, lng: 31.2357 },
  { name: 'Cape Town', country: 'South Africa', lat: -33.9249, lng: 18.4241 },
  { name: 'Nairobi', country: 'Kenya', lat: -1.2921, lng: 36.8219 },
  { name: 'Lagos', country: 'Nigeria', lat: 6.5244, lng: 3.3792 },
  { name: 'Casablanca', country: 'Morocco', lat: 33.5731, lng: -7.5898 },
  { name: 'Johannesburg', country: 'South Africa', lat: -26.2041, lng: 28.0473 },
  { name: 'Accra', country: 'Ghana', lat: 5.6037, lng: -0.1870 },
  { name: 'Dar es Salaam', country: 'Tanzania', lat: -6.7924, lng: 39.2083 },
  { name: 'Marrakech', country: 'Morocco', lat: 31.6295, lng: -7.9811 },
  { name: 'Tunis', country: 'Tunisia', lat: 36.8065, lng: 10.1815 },
  // Oceania
  { name: 'Sydney', country: 'Australia', lat: -33.8688, lng: 151.2093 },
  { name: 'Melbourne', country: 'Australia', lat: -37.8136, lng: 144.9631 },
  { name: 'Auckland', country: 'New Zealand', lat: -36.8509, lng: 174.7645 },
  { name: 'Perth', country: 'Australia', lat: -31.9505, lng: 115.8605 },
  { name: 'Wellington', country: 'New Zealand', lat: -41.2866, lng: 174.7756 },
  { name: 'Brisbane', country: 'Australia', lat: -27.4698, lng: 153.0251 },
];

// Connection routes as index pairs into WORLD_CAPITALS
// Indices: North America 0-11, South America 12-20, Europe 21-45, Asia 46-65, Africa 66-75, Oceania 76-81
export const CONNECTION_ROUTES: [number, number][] = [
  // North America internal (0-11)
  [0, 1], [0, 2], [5, 6], [0, 11], [7, 10], [8, 3], [9, 5], [11, 9], [1, 5], [6, 7],
  // South America internal (12-20)
  [12, 13], [13, 16], [14, 15], [12, 18], [15, 19], [17, 13], [19, 20], [14, 19], [16, 17],
  // Europe internal (21-45)
  [21, 22], [22, 23], [23, 27], [24, 25], [21, 34], [26, 27], [28, 29],
  [29, 30], [30, 31], [23, 32], [25, 31], [28, 35], [33, 21], [34, 22],
  [36, 24], [37, 22], [38, 23], [39, 24], [40, 29], [41, 34], [42, 24], [43, 44], [45, 21],
  // Asia internal (46-65)
  [46, 47], [47, 48], [48, 59], [46, 61], [50, 51], [51, 52], [52, 53],
  [54, 50], [55, 56], [57, 49], [58, 54], [59, 60], [60, 61], [61, 52],
  [62, 63], [64, 65], [46, 58], [47, 57], [48, 46], [49, 55], [53, 59],
  // Africa internal (66-75)
  [66, 70], [67, 68], [68, 73], [69, 71], [70, 75], [72, 66], [74, 75], [66, 69], [67, 71], [68, 67],
  // Oceania internal (76-81)
  [76, 77], [77, 79], [78, 80], [79, 81], [76, 81], [77, 78],
  // Americas-Europe
  [0, 21], [5, 21], [0, 22], [2, 24], [11, 22], [11, 21], [1, 33],
  // Europe-Africa
  [21, 66], [24, 70], [33, 66], [36, 70], [22, 69], [25, 66],
  // Europe-Asia
  [23, 55], [25, 49], [27, 55], [24, 46], [31, 49], [28, 55], [29, 47],
  // Asia-Oceania
  [52, 76], [46, 76], [53, 76], [52, 77], [50, 76], [51, 77],
  // Americas-Asia (Pacific routes)
  [6, 46], [7, 46], [10, 46], [7, 58], [6, 48],
  // Africa-Asia
  [66, 55], [68, 50], [66, 49], [67, 50],
  // Africa-Oceania
  [67, 79], [67, 76],
  // South America-Africa
  [18, 69], [13, 67], [12, 69],
  // NZ-Asia
  [78, 46], [80, 48], [78, 52],
];
