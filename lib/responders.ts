export type ResponderType = 'police' | 'hospital';

export interface Responder {
  id: string;
  name: string;
  type: ResponderType;
  latitude: number;
  longitude: number;
}

export const RESPONDERS: Responder[] = [
  { id: '1', name: 'Halisahar Police Station', type: 'police', latitude: 22.9515, longitude: 88.4190 },
  { id: '2', name: 'Kalyani JNM Hospital', type: 'hospital', latitude: 22.9749, longitude: 88.4344 },
  { id: '3', name: 'Naihati Police Station', type: 'police', latitude: 22.8988, longitude: 88.4187 },
  { id: '4', name: 'Chinsurah Imambara Hospital', type: 'hospital', latitude: 22.8885, longitude: 88.3965 }
];

export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of the Earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; // Distance in km
}

export function calculateNearestResponder(lat: number, lng: number, responders: Responder[]) {
  if (!responders || responders.length === 0) return null;
  
  let nearest = responders[0];
  let minDistance = calculateDistance(lat, lng, nearest.latitude, nearest.longitude);
  
  for (let i = 1; i < responders.length; i++) {
    const d = calculateDistance(lat, lng, responders[i].latitude, responders[i].longitude);
    if (d < minDistance) {
      minDistance = d;
      nearest = responders[i];
    }
  }
  
  return { responder: nearest, distance: minDistance };
}
