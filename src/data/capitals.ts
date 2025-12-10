export interface Capital {
  name: string;
  country: string;
  lat: number;
  lng: number;
}

export const WORLD_CAPITALS: Capital[] = [
  // North America
  { name: "Washington D.C.", country: "USA", lat: 38.9072, lng: -77.0369 },
  { name: "Ottawa", country: "Canada", lat: 45.4215, lng: -75.6972 },
  { name: "Mexico City", country: "Mexico", lat: 19.4326, lng: -99.1332 },
  
  // Europe
  { name: "London", country: "UK", lat: 51.5074, lng: -0.1278 },
  { name: "Paris", country: "France", lat: 48.8566, lng: 2.3522 },
  { name: "Berlin", country: "Germany", lat: 52.5200, lng: 13.4050 },
  { name: "Rome", country: "Italy", lat: 41.9028, lng: 12.4964 },
  { name: "Madrid", country: "Spain", lat: 40.4168, lng: -3.7038 },
  { name: "Amsterdam", country: "Netherlands", lat: 52.3676, lng: 4.9041 },
  { name: "Vienna", country: "Austria", lat: 48.2082, lng: 16.3738 },
  { name: "Brussels", country: "Belgium", lat: 50.8503, lng: 4.3517 },
  { name: "Stockholm", country: "Sweden", lat: 59.3293, lng: 18.0686 },
  { name: "Oslo", country: "Norway", lat: 59.9139, lng: 10.7522 },
  { name: "Copenhagen", country: "Denmark", lat: 55.6761, lng: 12.5683 },
  { name: "Helsinki", country: "Finland", lat: 60.1699, lng: 24.9384 },
  { name: "Warsaw", country: "Poland", lat: 52.2297, lng: 21.0122 },
  { name: "Prague", country: "Czech Republic", lat: 50.0755, lng: 14.4378 },
  { name: "Athens", country: "Greece", lat: 37.9838, lng: 23.7275 },
  { name: "Lisbon", country: "Portugal", lat: 38.7223, lng: -9.1393 },
  { name: "Dublin", country: "Ireland", lat: 53.3498, lng: -6.2603 },
  { name: "Zurich", country: "Switzerland", lat: 47.3769, lng: 8.5417 },
  { name: "Moscow", country: "Russia", lat: 55.7558, lng: 37.6173 },
  
  // Asia
  { name: "Tokyo", country: "Japan", lat: 35.6762, lng: 139.6503 },
  { name: "Beijing", country: "China", lat: 39.9042, lng: 116.4074 },
  { name: "Seoul", country: "South Korea", lat: 37.5665, lng: 126.9780 },
  { name: "New Delhi", country: "India", lat: 28.6139, lng: 77.2090 },
  { name: "Singapore", country: "Singapore", lat: 1.3521, lng: 103.8198 },
  { name: "Dubai", country: "UAE", lat: 25.2048, lng: 55.2708 },
  { name: "Bangkok", country: "Thailand", lat: 13.7563, lng: 100.5018 },
  { name: "Hong Kong", country: "China", lat: 22.3193, lng: 114.1694 },
  { name: "Manila", country: "Philippines", lat: 14.5995, lng: 120.9842 },
  { name: "Kuala Lumpur", country: "Malaysia", lat: 3.1390, lng: 101.6869 },
  { name: "Jakarta", country: "Indonesia", lat: -6.2088, lng: 106.8456 },
  { name: "Taipei", country: "Taiwan", lat: 25.0330, lng: 121.5654 },
  { name: "Tel Aviv", country: "Israel", lat: 32.0853, lng: 34.7818 },
  
  // Oceania
  { name: "Sydney", country: "Australia", lat: -33.8688, lng: 151.2093 },
  { name: "Melbourne", country: "Australia", lat: -37.8136, lng: 144.9631 },
  { name: "Wellington", country: "New Zealand", lat: -41.2865, lng: 174.7762 },
  { name: "Auckland", country: "New Zealand", lat: -36.8509, lng: 174.7645 },
  
  // South America
  { name: "Brasília", country: "Brazil", lat: -15.8267, lng: -47.9218 },
  { name: "São Paulo", country: "Brazil", lat: -23.5505, lng: -46.6333 },
  { name: "Buenos Aires", country: "Argentina", lat: -34.6037, lng: -58.3816 },
  { name: "Lima", country: "Peru", lat: -12.0464, lng: -77.0428 },
  { name: "Santiago", country: "Chile", lat: -33.4489, lng: -70.6693 },
  { name: "Bogotá", country: "Colombia", lat: 4.7110, lng: -74.0721 },
  
  // Africa
  { name: "Cairo", country: "Egypt", lat: 30.0444, lng: 31.2357 },
  { name: "Nairobi", country: "Kenya", lat: -1.2921, lng: 36.8219 },
  { name: "Cape Town", country: "South Africa", lat: -33.9249, lng: 18.4241 },
  { name: "Lagos", country: "Nigeria", lat: 6.5244, lng: 3.3792 },
  { name: "Johannesburg", country: "South Africa", lat: -26.2041, lng: 28.0473 },
  { name: "Casablanca", country: "Morocco", lat: 33.5731, lng: -7.5898 },
  { name: "Accra", country: "Ghana", lat: 5.6037, lng: -0.1870 },
];

// Pre-defined connection routes representing global debate network
// Each pair is [fromIndex, toIndex] in WORLD_CAPITALS array
export const CONNECTION_ROUTES: [number, number][] = [
  // North America to Europe
  [0, 3],   // Washington → London
  [1, 3],   // Ottawa → London
  [0, 4],   // Washington → Paris
  
  // European connections
  [3, 4],   // London → Paris
  [4, 5],   // Paris → Berlin
  [5, 9],   // Berlin → Vienna
  [6, 17],  // Rome → Athens
  [7, 18],  // Madrid → Lisbon
  [3, 19],  // London → Dublin
  [5, 15],  // Berlin → Warsaw
  [11, 14], // Stockholm → Helsinki
  [15, 21], // Warsaw → Moscow
  
  // Europe to Asia
  [5, 23],  // Berlin → Tokyo
  [21, 23], // Moscow → Beijing
  [9, 27],  // Vienna → Dubai
  
  // Asian connections
  [23, 24], // Tokyo → Beijing
  [24, 25], // Beijing → Seoul
  [25, 34], // Seoul → Taipei
  [26, 28], // New Delhi → Singapore
  [28, 29], // Singapore → Bangkok
  [29, 32], // Bangkok → Kuala Lumpur
  [32, 33], // Kuala Lumpur → Jakarta
  [30, 31], // Hong Kong → Manila
  [27, 35], // Dubai → Tel Aviv
  
  // Asia to Oceania
  [28, 36], // Singapore → Sydney
  [23, 39], // Tokyo → Auckland
  [36, 38], // Sydney → Wellington
  
  // Americas connections
  [0, 2],   // Washington → Mexico City
  [2, 44],  // Mexico City → Bogotá
  [44, 43], // Bogotá → Lima
  [43, 45], // Lima → Santiago
  [45, 42], // Santiago → Buenos Aires
  [42, 40], // Buenos Aires → São Paulo
  [40, 41], // São Paulo → Brasília
  
  // Americas to Africa
  [40, 48], // São Paulo → Cape Town
  
  // African connections
  [46, 49], // Cairo → Lagos
  [49, 50], // Lagos → Accra
  [47, 48], // Nairobi → Cape Town
  [51, 46], // Casablanca → Cairo
  [3, 51],  // London → Casablanca
  
  // Cross-continental
  [36, 47], // Sydney → Nairobi
  [27, 46], // Dubai → Cairo
  [35, 46], // Tel Aviv → Cairo
];
