// Top 100 most populous cities with coordinates
export interface City {
  name: string;
  country: string;
  lat: number;
  lng: number;
  population: number;
}

export const topCities: City[] = [
  { name: "Tokyo", country: "Japan", lat: 35.6762, lng: 139.6503, population: 37400068 },
  { name: "Delhi", country: "India", lat: 28.7041, lng: 77.1025, population: 30290936 },
  { name: "Shanghai", country: "China", lat: 31.2304, lng: 121.4737, population: 27058480 },
  { name: "São Paulo", country: "Brazil", lat: -23.5505, lng: -46.6333, population: 22043028 },
  { name: "Mexico City", country: "Mexico", lat: 19.4326, lng: -99.1332, population: 21782378 },
  { name: "Cairo", country: "Egypt", lat: 30.0444, lng: 31.2357, population: 20901000 },
  { name: "Mumbai", country: "India", lat: 19.0760, lng: 72.8777, population: 20411274 },
  { name: "Beijing", country: "China", lat: 39.9042, lng: 116.4074, population: 20384000 },
  { name: "Dhaka", country: "Bangladesh", lat: 23.8103, lng: 90.4125, population: 20283552 },
  { name: "Osaka", country: "Japan", lat: 34.6937, lng: 135.5023, population: 19222665 },
  { name: "New York City", country: "USA", lat: 40.7128, lng: -74.0060, population: 18804000 },
  { name: "Karachi", country: "Pakistan", lat: 24.8607, lng: 67.0011, population: 16093786 },
  { name: "Buenos Aires", country: "Argentina", lat: -34.6037, lng: -58.3816, population: 15057273 },
  { name: "Chongqing", country: "China", lat: 29.4316, lng: 106.9123, population: 14838000 },
  { name: "Istanbul", country: "Turkey", lat: 41.0082, lng: 28.9784, population: 14751000 },
  { name: "Kolkata", country: "India", lat: 22.5726, lng: 88.3639, population: 14681589 },
  { name: "Manila", country: "Philippines", lat: 14.5995, lng: 120.9842, population: 13923452 },
  { name: "Lagos", country: "Nigeria", lat: 6.5244, lng: 3.3792, population: 13903620 },
  { name: "Rio de Janeiro", country: "Brazil", lat: -22.9068, lng: -43.1729, population: 13458075 },
  { name: "Tianjin", country: "China", lat: 39.3434, lng: 117.3616, population: 13215344 },
  { name: "Kinshasa", country: "DRC", lat: -4.4419, lng: 15.2663, population: 13171000 },
  { name: "Guangzhou", country: "China", lat: 23.1291, lng: 113.2644, population: 13081000 },
  { name: "Los Angeles", country: "USA", lat: 34.0522, lng: -118.2437, population: 12459000 },
  { name: "Moscow", country: "Russia", lat: 55.7558, lng: 37.6173, population: 12410000 },
  { name: "Shenzhen", country: "China", lat: 22.5431, lng: 114.0579, population: 12357000 },
  { name: "Lahore", country: "Pakistan", lat: 31.5497, lng: 74.3436, population: 11738000 },
  { name: "Bangalore", country: "India", lat: 12.9716, lng: 77.5946, population: 11440000 },
  { name: "Paris", country: "France", lat: 48.8566, lng: 2.3522, population: 10901000 },
  { name: "Bogotá", country: "Colombia", lat: 4.7110, lng: -74.0721, population: 10574000 },
  { name: "Jakarta", country: "Indonesia", lat: -6.2088, lng: 106.8456, population: 10562000 },
  { name: "Chennai", country: "India", lat: 13.0827, lng: 80.2707, population: 10456000 },
  { name: "Lima", country: "Peru", lat: -12.0464, lng: -77.0428, population: 10391000 },
  { name: "Bangkok", country: "Thailand", lat: 13.7563, lng: 100.5018, population: 10156000 },
  { name: "Seoul", country: "South Korea", lat: 37.5665, lng: 126.9780, population: 9963000 },
  { name: "Nagoya", country: "Japan", lat: 35.1815, lng: 136.9066, population: 9507000 },
  { name: "Hyderabad", country: "India", lat: 17.3850, lng: 78.4867, population: 9482000 },
  { name: "London", country: "UK", lat: 51.5074, lng: -0.1278, population: 9304000 },
  { name: "Tehran", country: "Iran", lat: 35.6892, lng: 51.3890, population: 9135000 },
  { name: "Chicago", country: "USA", lat: 41.8781, lng: -87.6298, population: 8865000 },
  { name: "Chengdu", country: "China", lat: 30.5728, lng: 104.0668, population: 8813000 },
  { name: "Nanjing", country: "China", lat: 32.0603, lng: 118.7969, population: 8505000 },
  { name: "Wuhan", country: "China", lat: 30.5928, lng: 114.3055, population: 8346000 },
  { name: "Ho Chi Minh City", country: "Vietnam", lat: 10.8231, lng: 106.6297, population: 8314000 },
  { name: "Luanda", country: "Angola", lat: -8.8390, lng: 13.2894, population: 8040000 },
  { name: "Ahmedabad", country: "India", lat: 23.0225, lng: 72.5714, population: 7872000 },
  { name: "Kuala Lumpur", country: "Malaysia", lat: 3.1390, lng: 101.6869, population: 7780000 },
  { name: "Xi'an", country: "China", lat: 34.3416, lng: 108.9398, population: 7736000 },
  { name: "Hong Kong", country: "China", lat: 22.3193, lng: 114.1694, population: 7491000 },
  { name: "Dongguan", country: "China", lat: 23.0489, lng: 113.7447, population: 7446000 },
  { name: "Hangzhou", country: "China", lat: 30.2741, lng: 120.1551, population: 7236000 },
  { name: "Foshan", country: "China", lat: 23.0218, lng: 113.1219, population: 7197000 },
  { name: "Shenyang", country: "China", lat: 41.8057, lng: 123.4315, population: 7090000 },
  { name: "Riyadh", country: "Saudi Arabia", lat: 24.7136, lng: 46.6753, population: 6907000 },
  { name: "Baghdad", country: "Iraq", lat: 33.3128, lng: 44.3615, population: 6812000 },
  { name: "Santiago", country: "Chile", lat: -33.4489, lng: -70.6693, population: 6680000 },
  { name: "Surat", country: "India", lat: 21.1702, lng: 72.8311, population: 6564000 },
  { name: "Madrid", country: "Spain", lat: 40.4168, lng: -3.7038, population: 6497000 },
  { name: "Suzhou", country: "China", lat: 31.2989, lng: 120.5853, population: 6339000 },
  { name: "Pune", country: "India", lat: 18.5204, lng: 73.8567, population: 6276000 },
  { name: "Harbin", country: "China", lat: 45.8038, lng: 126.5350, population: 6115000 },
  { name: "Houston", country: "USA", lat: 29.7604, lng: -95.3698, population: 6115000 },
  { name: "Dallas", country: "USA", lat: 32.7767, lng: -96.7970, population: 5743000 },
  { name: "Toronto", country: "Canada", lat: 43.6532, lng: -79.3832, population: 5647000 },
  { name: "Dar es Salaam", country: "Tanzania", lat: -6.7924, lng: 39.2083, population: 5576000 },
  { name: "Miami", country: "USA", lat: 25.7617, lng: -80.1918, population: 5564000 },
  { name: "Belo Horizonte", country: "Brazil", lat: -19.9167, lng: -43.9345, population: 5513000 },
  { name: "Singapore", country: "Singapore", lat: 1.3521, lng: 103.8198, population: 5454000 },
  { name: "Philadelphia", country: "USA", lat: 39.9526, lng: -75.1652, population: 5441000 },
  { name: "Atlanta", country: "USA", lat: 33.7490, lng: -84.3880, population: 5268000 },
  { name: "Fukuoka", country: "Japan", lat: 33.5902, lng: 130.4017, population: 5245000 },
  { name: "Khartoum", country: "Sudan", lat: 15.5007, lng: 32.5599, population: 5185000 },
  { name: "Barcelona", country: "Spain", lat: 41.3851, lng: 2.1734, population: 5179000 },
  { name: "Johannesburg", country: "South Africa", lat: -26.2041, lng: 28.0473, population: 5169000 },
  { name: "Saint Petersburg", country: "Russia", lat: 59.9311, lng: 30.3609, population: 5132000 },
  { name: "Qingdao", country: "China", lat: 36.0671, lng: 120.3826, population: 5066000 },
  { name: "Dalian", country: "China", lat: 38.9140, lng: 121.6147, population: 4975000 },
  { name: "Washington DC", country: "USA", lat: 38.9072, lng: -77.0369, population: 4955000 },
  { name: "Yangon", country: "Myanmar", lat: 16.8661, lng: 96.1951, population: 4802000 },
  { name: "Alexandria", country: "Egypt", lat: 31.2001, lng: 29.9187, population: 4778000 },
  { name: "Jinan", country: "China", lat: 36.6512, lng: 117.1201, population: 4693000 },
  { name: "Guadalajara", country: "Mexico", lat: 20.6597, lng: -103.3496, population: 4687000 },
  { name: "Boston", country: "USA", lat: 42.3601, lng: -71.0589, population: 4628000 },
  { name: "Zhengzhou", country: "China", lat: 34.7466, lng: 113.6253, population: 4617000 },
  { name: "Melbourne", country: "Australia", lat: -37.8136, lng: 144.9631, population: 4596000 },
  { name: "Nairobi", country: "Kenya", lat: -1.2921, lng: 36.8219, population: 4386000 },
  { name: "Hanoi", country: "Vietnam", lat: 21.0285, lng: 105.8542, population: 4377000 },
  { name: "Sydney", country: "Australia", lat: -33.8688, lng: 151.2093, population: 4361000 },
  { name: "Monterrey", country: "Mexico", lat: 25.6866, lng: -100.3161, population: 4326000 },
  { name: "Changsha", country: "China", lat: 28.2282, lng: 112.9388, population: 4319000 },
  { name: "Brasília", country: "Brazil", lat: -15.8267, lng: -47.9218, population: 4291000 },
  { name: "Taipei", country: "Taiwan", lat: 25.0330, lng: 121.5654, population: 4276000 },
  { name: "Cape Town", country: "South Africa", lat: -33.9249, lng: 18.4241, population: 4265000 },
  { name: "Jeddah", country: "Saudi Arabia", lat: 21.5433, lng: 39.1728, population: 4248000 },
  { name: "Bucharest", country: "Romania", lat: 44.4268, lng: 26.1025, population: 4234000 },
  { name: "Kunming", country: "China", lat: 25.0389, lng: 102.7183, population: 4197000 },
  { name: "Changchun", country: "China", lat: 43.8171, lng: 125.3235, population: 4193000 },
  { name: "Phoenix", country: "USA", lat: 33.4484, lng: -112.0740, population: 4192000 },
  { name: "Busan", country: "South Korea", lat: 35.1796, lng: 129.0756, population: 4073000 },
  { name: "Abidjan", country: "Ivory Coast", lat: 5.3600, lng: -4.0083, population: 4055000 },
];

// Helper to convert lat/lng to 3D sphere coordinates
export const latLngToVector3 = (lat: number, lng: number, radius: number = 1): [number, number, number] => {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  
  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const y = radius * Math.cos(phi);
  const z = radius * Math.sin(phi) * Math.sin(theta);
  
  return [x, y, z];
};

// Get random subset of cities
export const getRandomCities = (count: number): City[] => {
  const shuffled = [...topCities].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
};
