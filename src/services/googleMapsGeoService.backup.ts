/**
 * Real Geographical Coordinates Database and Adapter for Historical Map Engine
 * Maps historical places, subahs, cities, and campaign vectors onto accurate real-world coordinates.
 */

import type { HistoricalMap, HistoricalFrame, HistoricalRegion, HistoricalCity, CampaignVector } from '../types';

export interface GeoPoint {
  lat: number;
  lng: number;
}

// 1. Authoritative Dictionary of Real-World Coordinates for Indian Historical Places
export const HISTORICAL_GEO_CITIES: Record<string, GeoPoint> = {
  // Capitals & Imperial Cities
  'delhi': { lat: 28.6139, lng: 77.2090 },
  'agra': { lat: 27.1767, lng: 78.0081 },
  'fatehpur sikri': { lat: 27.0945, lng: 77.6679 },
  'lahore': { lat: 31.5204, lng: 74.3587 },
  'kabul': { lat: 34.5553, lng: 69.2075 },
  'qandahar': { lat: 31.6289, lng: 65.7372 },
  'srinagar': { lat: 34.0837, lng: 74.7973 },
  'pataliputra': { lat: 25.6110, lng: 85.1440 },
  'patna': { lat: 25.5941, lng: 85.1376 },
  'dhaka': { lat: 23.8103, lng: 90.4125 },
  'murshidabad': { lat: 24.1750, lng: 88.2800 },
  'kolkata': { lat: 22.5726, lng: 88.3639 },
  'cuttack': { lat: 20.4625, lng: 85.8828 },
  'puri': { lat: 19.8135, lng: 85.8312 },
  'bhubaneswar': { lat: 20.2961, lng: 85.8245 },
  'dhauli': { lat: 20.1923, lng: 85.8394 },
  'konark': { lat: 19.8876, lng: 86.0945 },
  'jajpur': { lat: 20.8492, lng: 86.3323 },
  'cuttack (kataka)': { lat: 20.4625, lng: 85.8828 },
  'ahmedabad': { lat: 23.0225, lng: 72.5714 },
  'sabarmati': { lat: 23.0605, lng: 72.5800 },
  'sabarmati (ahmedabad)': { lat: 23.0605, lng: 72.5800 },
  'surat': { lat: 21.1702, lng: 72.8311 },
  'cambay': { lat: 22.3135, lng: 72.6190 },
  'bharuch': { lat: 21.7051, lng: 72.9959 },
  'dandi': { lat: 20.8880, lng: 72.8028 },
  'dandi beach': { lat: 20.8880, lng: 72.8028 },
  'porbandar': { lat: 21.6417, lng: 69.6293 },
  'kheda': { lat: 22.7533, lng: 72.6841 },
  'champaran': { lat: 26.6469, lng: 84.9089 },
  'bombay': { lat: 18.9633, lng: 72.8122 },
  'bombay (gowalia tank)': { lat: 18.9633, lng: 72.8122 },
  'pune': { lat: 18.5204, lng: 73.8567 },
  'pune (yerwada)': { lat: 18.5529, lng: 73.9015 },
  'wardha': { lat: 20.7453, lng: 78.6022 },
  'sevagram': { lat: 20.7139, lng: 78.6186 },
  'sevagram (wardha)': { lat: 20.7139, lng: 78.6186 },
  'noakhali': { lat: 22.8696, lng: 91.0995 },
  'birla house (delhi)': { lat: 28.6019, lng: 77.2144 },
  'inchudi': { lat: 21.4934, lng: 86.9135 },
  'inchudi (balasore)': { lat: 21.4934, lng: 86.9135 },

  // Historic Fortresses & Battlefields
  'panipat': { lat: 29.3909, lng: 76.9635 },
  'khanwa': { lat: 27.0267, lng: 77.5385 },
  'chausa': { lat: 25.5255, lng: 83.8966 },
  'kannauj': { lat: 27.0547, lng: 79.9173 },
  'bilgram': { lat: 27.1794, lng: 80.0335 },
  'sirhind': { lat: 30.6425, lng: 76.3861 },
  'haldighati': { lat: 24.8912, lng: 73.7088 },
  'chittorgarh': { lat: 24.8887, lng: 74.6269 },
  'ranthambore': { lat: 26.0173, lng: 76.5026 },
  'mandu': { lat: 22.3664, lng: 75.4044 },
  'ujjain': { lat: 23.1765, lng: 75.7885 },
  'ujjayini': { lat: 23.1765, lng: 75.7885 },
  'asirgarh': { lat: 21.4705, lng: 76.2952 },
  'burhanpur': { lat: 21.3145, lng: 76.2223 },
  'daulatabad': { lat: 19.9431, lng: 75.2155 },
  'khuldabad': { lat: 20.0055, lng: 75.1884 },
  'bijapur': { lat: 16.8302, lng: 75.7100 },
  'golconda': { lat: 17.3833, lng: 78.4011 },
  'golconda / hyderabad': { lat: 17.3833, lng: 78.4011 },
  'hyderabad': { lat: 17.3850, lng: 78.4867 },
  'jinji': { lat: 12.2533, lng: 79.4183 },
  'jinji fortress': { lat: 12.2533, lng: 79.4183 },
  'thanjavur': { lat: 10.7870, lng: 79.1378 },
  'srirangam': { lat: 10.8622, lng: 78.6922 },
  'srirangam (kaveri)': { lat: 10.8622, lng: 78.6922 },
  'srirangapatna': { lat: 12.4238, lng: 76.6830 },
  'mysore': { lat: 12.2958, lng: 76.6394 },
  'hampi': { lat: 15.3350, lng: 76.4600 },
  'raichur': { lat: 16.2076, lng: 77.3463 },
  'kondavidu': { lat: 16.2570, lng: 80.2600 },
  'udayagiri': { lat: 14.8710, lng: 79.3170 },
  'udayagiri (nellore)': { lat: 14.8710, lng: 79.3170 },

  // Ancient & British Period
  'taxila': { lat: 33.7463, lng: 72.8397 },
  'sarnath': { lat: 25.3811, lng: 83.0214 },
  'plassey': { lat: 23.8000, lng: 88.2500 },
  'buxar': { lat: 25.5647, lng: 83.9777 },
  'allahabad': { lat: 25.4358, lng: 81.8463 },
  'meerut': { lat: 28.9845, lng: 77.7064 },
  'kanpur': { lat: 26.4499, lng: 80.3319 },
  'lucknow': { lat: 26.8467, lng: 80.9462 },
  'jhansi': { lat: 25.4484, lng: 78.5685 },
  'gwalior': { lat: 26.2183, lng: 78.1828 },
  'barrackpore': { lat: 22.7667, lng: 88.3667 },
  'chauri chaura': { lat: 26.6500, lng: 83.5833 },
  'moirang': { lat: 24.5000, lng: 93.7667 },
  'moirang (manipur)': { lat: 24.5000, lng: 93.7667 },
  'kohima': { lat: 25.6751, lng: 94.1086 },
  'peshawar': { lat: 34.0151, lng: 71.5249 },
  'singapore': { lat: 1.3521, lng: 103.8198 },
  'rangoon': { lat: 16.8661, lng: 96.1951 },
  'port blair': { lat: 11.6234, lng: 92.7265 }
};

// 2. Authoritative Geographical Polygons for Historical Indian Provinces / Subahs
export const HISTORICAL_GEO_REGIONS: Record<string, GeoPoint[]> = {
  // Mughal Imperial Subahs
  'delhi_agra': [
    { lat: 29.8, lng: 76.5 },
    { lat: 29.5, lng: 78.4 },
    { lat: 28.2, lng: 79.4 },
    { lat: 26.8, lng: 78.9 },
    { lat: 26.5, lng: 77.1 },
    { lat: 27.6, lng: 76.2 }
  ],
  'punjab_lahore': [
    { lat: 33.2, lng: 73.2 },
    { lat: 32.8, lng: 76.4 },
    { lat: 30.6, lng: 76.8 },
    { lat: 29.6, lng: 74.2 },
    { lat: 30.1, lng: 71.6 },
    { lat: 32.2, lng: 72.0 }
  ],
  'kabul_qandahar': [
    { lat: 35.8, lng: 67.5 },
    { lat: 35.2, lng: 71.8 },
    { lat: 31.6, lng: 69.8 },
    { lat: 30.6, lng: 65.2 },
    { lat: 32.2, lng: 63.8 },
    { lat: 34.6, lng: 66.2 }
  ],
  'kashmir_frontier': [
    { lat: 36.8, lng: 73.8 },
    { lat: 36.0, lng: 77.8 },
    { lat: 33.0, lng: 76.8 },
    { lat: 33.4, lng: 73.8 },
    { lat: 35.2, lng: 73.0 }
  ],
  'rajasthan_rajputana': [
    { lat: 28.5, lng: 72.8 },
    { lat: 28.2, lng: 76.4 },
    { lat: 26.4, lng: 77.2 },
    { lat: 24.0, lng: 75.8 },
    { lat: 23.8, lng: 72.4 },
    { lat: 26.0, lng: 70.4 }
  ],
  'gujarat': [
    { lat: 24.6, lng: 69.8 },
    { lat: 24.4, lng: 73.4 },
    { lat: 22.8, lng: 73.9 },
    { lat: 20.8, lng: 73.2 },
    { lat: 20.6, lng: 70.6 },
    { lat: 22.0, lng: 68.8 }
  ],
  'malwa_bundelkhand': [
    { lat: 26.2, lng: 76.6 },
    { lat: 26.0, lng: 80.6 },
    { lat: 23.0, lng: 81.0 },
    { lat: 21.6, lng: 78.4 },
    { lat: 21.8, lng: 75.0 },
    { lat: 24.4, lng: 75.2 }
  ],
  'bihar_bengal': [
    { lat: 27.4, lng: 83.8 },
    { lat: 26.8, lng: 89.8 },
    { lat: 24.8, lng: 92.6 },
    { lat: 21.6, lng: 89.6 },
    { lat: 22.0, lng: 86.6 },
    { lat: 24.6, lng: 83.6 }
  ],
  'odisha_utkala': [
    { lat: 22.4, lng: 85.2 },
    { lat: 21.8, lng: 87.4 },
    { lat: 19.4, lng: 85.6 },
    { lat: 18.6, lng: 84.4 },
    { lat: 19.0, lng: 82.6 },
    { lat: 21.2, lng: 83.2 }
  ],
  'khandesh_ahmadnagar': [
    { lat: 22.2, lng: 74.2 },
    { lat: 21.8, lng: 78.0 },
    { lat: 19.4, lng: 77.6 },
    { lat: 18.6, lng: 74.6 },
    { lat: 19.8, lng: 73.2 }
  ],
  'bijapur_golconda': [
    { lat: 18.6, lng: 74.2 },
    { lat: 18.8, lng: 80.6 },
    { lat: 15.8, lng: 81.4 },
    { lat: 14.2, lng: 79.6 },
    { lat: 14.6, lng: 75.2 },
    { lat: 16.8, lng: 73.8 }
  ],
  'deep_south_carnatic': [
    { lat: 14.4, lng: 74.8 },
    { lat: 14.0, lng: 80.2 },
    { lat: 10.8, lng: 79.9 },
    { lat: 8.2, lng: 77.4 },
    { lat: 9.8, lng: 76.4 },
    { lat: 12.6, lng: 75.0 }
  ],

  // Mauryan Provinces
  'magadha_heartland': [
    { lat: 26.8, lng: 83.5 },
    { lat: 26.5, lng: 87.5 },
    { lat: 24.2, lng: 87.8 },
    { lat: 23.8, lng: 83.8 }
  ],
  'northwest_seleucid': [
    { lat: 35.8, lng: 68.0 },
    { lat: 35.0, lng: 74.5 },
    { lat: 31.0, lng: 72.0 },
    { lat: 30.0, lng: 65.0 }
  ],
  'avanti_western': [
    { lat: 25.2, lng: 73.0 },
    { lat: 25.0, lng: 77.8 },
    { lat: 21.5, lng: 77.2 },
    { lat: 21.8, lng: 72.0 }
  ],
  'deccan_suvarnagiri': [
    { lat: 18.2, lng: 74.0 },
    { lat: 18.0, lng: 80.0 },
    { lat: 13.5, lng: 79.0 },
    { lat: 13.8, lng: 74.5 }
  ],
  'kalinga_coastal': [
    { lat: 22.2, lng: 85.5 },
    { lat: 21.8, lng: 87.5 },
    { lat: 18.5, lng: 84.5 },
    { lat: 19.0, lng: 82.5 }
  ],

  // Mahatma Gandhi Centres
  'gandhi_gujarat': [
    { lat: 23.8, lng: 71.0 },
    { lat: 23.6, lng: 73.6 },
    { lat: 20.8, lng: 73.2 },
    { lat: 20.6, lng: 71.0 },
    { lat: 21.8, lng: 69.5 }
  ],
  'gandhi_bihar': [
    { lat: 27.2, lng: 83.8 },
    { lat: 27.0, lng: 86.8 },
    { lat: 25.0, lng: 86.5 },
    { lat: 25.2, lng: 83.6 }
  ],
  'gandhi_maharashtra': [
    { lat: 21.5, lng: 73.5 },
    { lat: 21.2, lng: 79.5 },
    { lat: 18.2, lng: 79.0 },
    { lat: 18.5, lng: 73.0 }
  ],
  'gandhi_eastern_bengal_odisha': [
    { lat: 24.5, lng: 87.0 },
    { lat: 24.2, lng: 91.5 },
    { lat: 21.5, lng: 91.0 },
    { lat: 20.0, lng: 86.5 },
    { lat: 20.2, lng: 85.0 }
  ],
  'gandhi_delhi_up': [
    { lat: 29.2, lng: 76.8 },
    { lat: 29.0, lng: 82.5 },
    { lat: 25.5, lng: 82.0 },
    { lat: 25.8, lng: 77.0 }
  ],

  // Netaji Subhas Chandra Bose Centres
  'netaji_bengal_odisha': [
    { lat: 24.5, lng: 86.8 },
    { lat: 24.0, lng: 89.8 },
    { lat: 20.2, lng: 86.8 },
    { lat: 20.0, lng: 84.8 }
  ],
  'netaji_escape_frontier': [
    { lat: 35.5, lng: 68.5 },
    { lat: 35.0, lng: 72.5 },
    { lat: 33.5, lng: 72.0 },
    { lat: 33.8, lng: 68.0 }
  ],
  'netaji_ina_southeast_asia': [
    { lat: 18.0, lng: 95.0 },
    { lat: 17.5, lng: 98.0 },
    { lat: 12.0, lng: 94.0 },
    { lat: 12.5, lng: 92.0 }
  ],
  'netaji_imphal_kohima': [
    { lat: 26.2, lng: 93.5 },
    { lat: 26.0, lng: 95.2 },
    { lat: 24.0, lng: 94.8 },
    { lat: 24.2, lng: 93.2 }
  ]
};

/**
 * Get geographical polygon boundary for a historical region
 */
export function getHistoricalRegionGeoCoords(region: HistoricalRegion): GeoPoint[] {
  // 1. If region already has validated geo coordinates, return them
  if (region.geoCoordinates && region.geoCoordinates.length >= 3) {
    return region.geoCoordinates;
  }

  // 2. Check region ID in authoritative dictionary
  const id = region.id.toLowerCase();
  for (const [key, coords] of Object.entries(HISTORICAL_GEO_REGIONS)) {
    if (id.includes(key) || key.includes(id)) {
      return coords;
    }
  }

  // 3. Fallback: Project SVG viewBox coordinates (0..1000, 0..850) into Subcontinent Lat/Lng
  // viewBox: x in [0, 1000] -> lng approx [65, 95]
  // viewBox: y in [0, 850]  -> lat approx [36, 7]
  const svgCenter = region.labelCoordinates || { x: 500, y: 425 };
  const centerLat = 36.5 - (svgCenter.y / 850) * 28.5;
  const centerLng = 66.0 + (svgCenter.x / 1000) * 28.0;

  const latSpan = 1.4;
  const lngSpan = 1.6;

  return [
    { lat: centerLat + latSpan, lng: centerLng - lngSpan },
    { lat: centerLat + latSpan * 0.9, lng: centerLng + lngSpan },
    { lat: centerLat - latSpan * 0.8, lng: centerLng + lngSpan * 1.1 },
    { lat: centerLat - latSpan * 1.1, lng: centerLng - lngSpan * 0.7 }
  ];
}

/**
 * Get geographical coordinate for a historical city, capital or battlefield
 */
export function getCityGeoCoord(city: HistoricalCity): GeoPoint {
  if (city.lat !== undefined && city.lng !== undefined) {
    return { lat: city.lat, lng: city.lng };
  }

  const nameKey = city.name.toLowerCase().trim();
  for (const [key, pt] of Object.entries(HISTORICAL_GEO_CITIES)) {
    if (nameKey.includes(key) || key.includes(nameKey)) {
      return pt;
    }
  }

  // Fallback conversion from SVG x, y
  const lat = 36.5 - (city.y / 850) * 28.5;
  const lng = 66.0 + (city.x / 1000) * 28.0;
  return { lat, lng };
}

/**
 * Get geographical polyline points for a campaign vector
 */
export function getCampaignGeoPath(vector: CampaignVector): GeoPoint[] {
  if (vector.geoPath && vector.geoPath.length >= 2) {
    return vector.geoPath;
  }

  const startPt: GeoPoint = vector.from.lat !== undefined && vector.from.lng !== undefined
    ? { lat: vector.from.lat, lng: vector.from.lng }
    : {
        lat: 36.5 - (vector.from.y / 850) * 28.5,
        lng: 66.0 + (vector.from.x / 1000) * 28.0
      };

  const endPt: GeoPoint = vector.to.lat !== undefined && vector.to.lng !== undefined
    ? { lat: vector.to.lat, lng: vector.to.lng }
    : {
        lat: 36.5 - (vector.to.y / 850) * 28.5,
        lng: 66.0 + (vector.to.x / 1000) * 28.0
      };

  // Add intermediate arc point for geodesic curvature
  const midLat = (startPt.lat + endPt.lat) / 2 + 0.5;
  const midLng = (startPt.lng + endPt.lng) / 2;

  return [startPt, { lat: midLat, lng: midLng }, endPt];
}

/**
 * Calculate appropriate initial center and bounds for the active historical map
 */
export function calculateMapCenterAndBounds(
  regions: HistoricalRegion[],
  cities: HistoricalCity[]
): { center: GeoPoint; zoom: number; bounds?: { north: number; south: number; east: number; west: number } } {
  const allPoints: GeoPoint[] = [];

  cities.forEach(c => allPoints.push(getCityGeoCoord(c)));
  regions.forEach(r => {
    const coords = getHistoricalRegionGeoCoords(r);
    coords.forEach(pt => allPoints.push(pt));
  });

  if (allPoints.length === 0) {
    return { center: { lat: 23.5, lng: 78.5 }, zoom: 5 };
  }

  let minLat = 90;
  let maxLat = -90;
  let minLng = 180;
  let maxLng = -180;

  allPoints.forEach(p => {
    if (p.lat < minLat) minLat = p.lat;
    if (p.lat > maxLat) maxLat = p.lat;
    if (p.lng < minLng) minLng = p.lng;
    if (p.lng > maxLng) maxLng = p.lng;
  });

  const center: GeoPoint = {
    lat: (minLat + maxLat) / 2,
    lng: (minLng + maxLng) / 2
  };

  return {
    center,
    zoom: 5,
    bounds: {
      north: maxLat + 1.2,
      south: minLat - 1.2,
      east: maxLng + 1.5,
      west: minLng - 1.5
    }
  };
}
