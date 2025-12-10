export interface Capital {
  name: string;
  country: string;
  lat: number;
  lng: number;
}

export const WORLD_CAPITALS: Capital[] = [
  // North America (0-11)
  { name: 'Washington D.C.', country: 'USA', lat: 38.9072, lng: -77.0369 },       // 0
  { name: 'Ottawa', country: 'Canada', lat: 45.4215, lng: -75.6972 },             // 1
  { name: 'Mexico City', country: 'Mexico', lat: 19.4326, lng: -99.1332 },        // 2
  { name: 'Havana', country: 'Cuba', lat: 23.1136, lng: -82.3666 },               // 3
  { name: 'Panama City', country: 'Panama', lat: 8.9824, lng: -79.5199 },         // 4
  { name: 'Toronto', country: 'Canada', lat: 43.6532, lng: -79.3832 },            // 5
  { name: 'Vancouver', country: 'Canada', lat: 49.2827, lng: -123.1207 },         // 6
  { name: 'San Francisco', country: 'USA', lat: 37.7749, lng: -122.4194 },        // 7
  { name: 'Miami', country: 'USA', lat: 25.7617, lng: -80.1918 },                 // 8
  { name: 'Chicago', country: 'USA', lat: 41.8781, lng: -87.6298 },               // 9
  { name: 'Los Angeles', country: 'USA', lat: 34.0522, lng: -118.2437 },          // 10
  { name: 'New York', country: 'USA', lat: 40.7128, lng: -74.0060 },              // 11
  // South America (12-20)
  { name: 'Brasília', country: 'Brazil', lat: -15.7975, lng: -47.8919 },          // 12
  { name: 'Buenos Aires', country: 'Argentina', lat: -34.6037, lng: -58.3816 },   // 13
  { name: 'Lima', country: 'Peru', lat: -12.0464, lng: -77.0428 },                // 14
  { name: 'Bogotá', country: 'Colombia', lat: 4.7110, lng: -74.0721 },            // 15
  { name: 'Santiago', country: 'Chile', lat: -33.4489, lng: -70.6693 },           // 16
  { name: 'Montevideo', country: 'Uruguay', lat: -34.9011, lng: -56.1645 },       // 17
  { name: 'Rio de Janeiro', country: 'Brazil', lat: -22.9068, lng: -43.1729 },    // 18
  { name: 'Quito', country: 'Ecuador', lat: -0.1807, lng: -78.4678 },             // 19
  { name: 'Caracas', country: 'Venezuela', lat: 10.4806, lng: -66.9036 },         // 20
  // Europe (21-46)
  { name: 'London', country: 'UK', lat: 51.5074, lng: -0.1278 },                  // 21
  { name: 'Paris', country: 'France', lat: 48.8566, lng: 2.3522 },                // 22
  { name: 'Berlin', country: 'Germany', lat: 52.5200, lng: 13.4050 },             // 23
  { name: 'Madrid', country: 'Spain', lat: 40.4168, lng: -3.7038 },               // 24
  { name: 'Rome', country: 'Italy', lat: 41.9028, lng: 12.4964 },                 // 25
  { name: 'Amsterdam', country: 'Netherlands', lat: 52.3676, lng: 4.9041 },       // 26
  { name: 'Vienna', country: 'Austria', lat: 48.2082, lng: 16.3738 },             // 27
  { name: 'Warsaw', country: 'Poland', lat: 52.2297, lng: 21.0122 },              // 28
  { name: 'Stockholm', country: 'Sweden', lat: 59.3293, lng: 18.0686 },           // 29
  { name: 'Oslo', country: 'Norway', lat: 59.9139, lng: 10.7522 },                // 30
  { name: 'Copenhagen', country: 'Denmark', lat: 55.6761, lng: 12.5683 },         // 31
  { name: 'Athens', country: 'Greece', lat: 37.9838, lng: 23.7275 },              // 32
  { name: 'Lisbon', country: 'Portugal', lat: 38.7223, lng: -9.1393 },            // 33
  { name: 'Dublin', country: 'Ireland', lat: 53.3498, lng: -6.2603 },             // 34
  { name: 'Budapest', country: 'Hungary', lat: 47.4979, lng: 19.0402 },           // 35
  { name: 'Bucharest', country: 'Romania', lat: 44.4268, lng: 26.1025 },          // 36
  { name: 'Zurich', country: 'Switzerland', lat: 47.3769, lng: 8.5417 },          // 37
  { name: 'Brussels', country: 'Belgium', lat: 50.8503, lng: 4.3517 },            // 38
  { name: 'Prague', country: 'Czech Republic', lat: 50.0755, lng: 14.4378 },      // 39
  { name: 'Helsinki', country: 'Finland', lat: 60.1699, lng: 24.9384 },           // 40
  { name: 'Reykjavik', country: 'Iceland', lat: 64.1466, lng: -21.9426 },         // 41
  { name: 'Barcelona', country: 'Spain', lat: 41.3851, lng: 2.1734 },             // 42
  { name: 'Milan', country: 'Italy', lat: 45.4642, lng: 9.1900 },                 // 43
  { name: 'Munich', country: 'Germany', lat: 48.1351, lng: 11.5820 },             // 44
  { name: 'Edinburgh', country: 'UK', lat: 55.9533, lng: -3.1883 },               // 45
  { name: 'Moscow', country: 'Russia', lat: 55.7558, lng: 37.6173 },              // 46
  // Asia (47-66)
  { name: 'Tokyo', country: 'Japan', lat: 35.6762, lng: 139.6503 },               // 47
  { name: 'Beijing', country: 'China', lat: 39.9042, lng: 116.4074 },             // 48
  { name: 'Seoul', country: 'South Korea', lat: 37.5665, lng: 126.9780 },         // 49
  { name: 'New Delhi', country: 'India', lat: 28.6139, lng: 77.2090 },            // 50
  { name: 'Singapore', country: 'Singapore', lat: 1.3521, lng: 103.8198 },        // 51
  { name: 'Bangkok', country: 'Thailand', lat: 13.7563, lng: 100.5018 },          // 52
  { name: 'Jakarta', country: 'Indonesia', lat: -6.2088, lng: 106.8456 },         // 53
  { name: 'Manila', country: 'Philippines', lat: 14.5995, lng: 120.9842 },        // 54
  { name: 'Hong Kong', country: 'China', lat: 22.3193, lng: 114.1694 },           // 55
  { name: 'Dubai', country: 'UAE', lat: 25.2048, lng: 55.2708 },                  // 56
  { name: 'Mumbai', country: 'India', lat: 19.0760, lng: 72.8777 },               // 57
  { name: 'Shanghai', country: 'China', lat: 31.2304, lng: 121.4737 },            // 58
  { name: 'Taipei', country: 'Taiwan', lat: 25.0330, lng: 121.5654 },             // 59
  { name: 'Kuala Lumpur', country: 'Malaysia', lat: 3.1390, lng: 101.6869 },      // 60
  { name: 'Hanoi', country: 'Vietnam', lat: 21.0285, lng: 105.8542 },             // 61
  { name: 'Osaka', country: 'Japan', lat: 34.6937, lng: 135.5023 },               // 62
  { name: 'Ho Chi Minh City', country: 'Vietnam', lat: 10.8231, lng: 106.6297 },  // 63
  { name: 'Doha', country: 'Qatar', lat: 25.2854, lng: 51.5310 },                 // 64
  { name: 'Abu Dhabi', country: 'UAE', lat: 24.4539, lng: 54.3773 },              // 65
  { name: 'Tel Aviv', country: 'Israel', lat: 32.0853, lng: 34.7818 },            // 66
  // Africa (67-76)
  { name: 'Cairo', country: 'Egypt', lat: 30.0444, lng: 31.2357 },                // 67
  { name: 'Cape Town', country: 'South Africa', lat: -33.9249, lng: 18.4241 },    // 68
  { name: 'Nairobi', country: 'Kenya', lat: -1.2921, lng: 36.8219 },              // 69
  { name: 'Lagos', country: 'Nigeria', lat: 6.5244, lng: 3.3792 },                // 70
  { name: 'Casablanca', country: 'Morocco', lat: 33.5731, lng: -7.5898 },         // 71
  { name: 'Johannesburg', country: 'South Africa', lat: -26.2041, lng: 28.0473 }, // 72
  { name: 'Accra', country: 'Ghana', lat: 5.6037, lng: -0.1870 },                 // 73
  { name: 'Dar es Salaam', country: 'Tanzania', lat: -6.7924, lng: 39.2083 },     // 74
  { name: 'Marrakech', country: 'Morocco', lat: 31.6295, lng: -7.9811 },          // 75
  { name: 'Tunis', country: 'Tunisia', lat: 36.8065, lng: 10.1815 },              // 76
  // Oceania (77-82)
  { name: 'Sydney', country: 'Australia', lat: -33.8688, lng: 151.2093 },         // 77
  { name: 'Melbourne', country: 'Australia', lat: -37.8136, lng: 144.9631 },      // 78
  { name: 'Auckland', country: 'New Zealand', lat: -36.8509, lng: 174.7645 },     // 79
  { name: 'Perth', country: 'Australia', lat: -31.9505, lng: 115.8605 },          // 80
  { name: 'Wellington', country: 'New Zealand', lat: -41.2866, lng: 174.7756 },   // 81
  { name: 'Brisbane', country: 'Australia', lat: -27.4698, lng: 153.0251 },       // 82
];

// Connection routes as index pairs into WORLD_CAPITALS
// Indices: North America 0-11, South America 12-20, Europe 21-46, Asia 47-66, Africa 67-76, Oceania 77-82
export const CONNECTION_ROUTES: [number, number][] = [
  // North America internal (0-11)
  [0, 1], [0, 2], [5, 6], [0, 11], [7, 10], [8, 3], [9, 5], [11, 9], [1, 5], [6, 7],
  // South America internal (12-20)
  [12, 13], [13, 16], [14, 15], [12, 18], [15, 19], [17, 13], [19, 20], [14, 19], [16, 17],
  // Europe internal (21-46)
  [21, 22], [22, 23], [23, 27], [24, 25], [21, 34], [26, 27], [28, 29],
  [29, 30], [30, 31], [23, 32], [25, 31], [28, 35], [33, 21], [34, 22],
  [36, 24], [37, 22], [38, 23], [39, 24], [40, 29], [41, 34], [42, 24], [43, 44], [45, 21], [46, 28],
  // Asia internal (47-66)
  [47, 48], [48, 49], [49, 58], [47, 62], [51, 52], [52, 53], [53, 54],
  [55, 51], [56, 57], [58, 47], [59, 55], [60, 61], [61, 52], [62, 47],
  [63, 52], [64, 65], [47, 59], [48, 58], [49, 47], [50, 56], [54, 60], [55, 48], [57, 50],
  // Africa internal (67-76)
  [67, 69], [68, 72], [69, 74], [70, 73], [71, 75], [72, 68], [74, 69], [67, 76], [68, 69], [70, 67],
  // Oceania internal (77-82)
  [77, 78], [78, 80], [79, 81], [80, 82], [77, 82], [78, 79],
  // Americas-Europe
  [0, 21], [5, 21], [0, 22], [2, 24], [11, 22], [11, 21], [1, 34],
  // Europe-Africa
  [21, 67], [24, 71], [33, 71], [36, 67], [22, 70], [25, 67], [42, 75],
  // Europe-Asia
  [23, 46], [25, 56], [27, 50], [32, 66], [28, 46], [29, 40], [46, 48],
  // Asia-Oceania
  [53, 77], [47, 77], [54, 77], [53, 78], [51, 77], [52, 78], [55, 77],
  // Americas-Asia (Pacific routes)
  [6, 47], [7, 47], [10, 47], [7, 49], [6, 49],
  // Africa-Asia
  [67, 56], [69, 50], [67, 66], [68, 51],
  // Africa-Oceania
  [68, 80], [68, 77],
  // South America-Africa
  [18, 70], [13, 68], [12, 70],
  // NZ-Asia
  [79, 47], [81, 49], [79, 53],
];
