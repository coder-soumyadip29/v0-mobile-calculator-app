export type ResponderType = "police" | "hospital";

export interface Responder {
  id: string;
  name: string;
  type: ResponderType;
  latitude: number;
  longitude: number;
  address?: string;
  division?: string;
  section?: string;
  phone?: string;
  nameAddrSource?: string;
  phoneSource?: string;
  coordSource?: string;
  nameAddrConfidence?: string;
  phoneConfidence?: string;
  coordConfidence?: string;
}

export const FALLBACK_RESPONDERS: Responder[] = [
  {
    id: "1",
    name: "Halisahar Police Station",
    type: "police",
    latitude: 22.9515,
    longitude: 88.419,
  },
  {
    id: "2",
    name: "Kalyani JNM Hospital",
    type: "hospital",
    latitude: 22.9749,
    longitude: 88.4344,
  },
  {
    id: "3",
    name: "Naihati Police Station",
    type: "police",
    latitude: 22.8988,
    longitude: 88.4187,
  },
  {
    id: "4",
    name: "Chinsurah Imambara Hospital",
    type: "hospital",
    latitude: 22.8885,
    longitude: 88.3965,
  },
];

const CSV_PATH = "/data/police-station.csv";

function parseCsvLine(line: string) {
  return line.split(",").map((value) => value.trim());
}

function toNumber(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function parsePoliceStationRow(
  values: string[],
  index: number,
): Responder | null {
  if (values.length < 13) return null;

  const addressEndIndex = values.length - 11;
  if (addressEndIndex < 1) return null;

  const name = values[0];
  const address = values.slice(1, addressEndIndex).join(", ").trim();
  const division = values[addressEndIndex] || undefined;
  const section = values[addressEndIndex + 1] || undefined;
  const phone = values[addressEndIndex + 2] || undefined;
  const latitude = toNumber(values[addressEndIndex + 3]);
  const longitude = toNumber(values[addressEndIndex + 4]);

  if (latitude === null || longitude === null) return null;

  return {
    id: `${index + 1}`,
    name,
    type: "police",
    latitude,
    longitude,
    address,
    division,
    section,
    phone,
    nameAddrSource: values[addressEndIndex + 5] || undefined,
    phoneSource: values[addressEndIndex + 6] || undefined,
    coordSource: values[addressEndIndex + 7] || undefined,
    nameAddrConfidence: values[addressEndIndex + 8] || undefined,
    phoneConfidence: values[addressEndIndex + 9] || undefined,
    coordConfidence: values[addressEndIndex + 10] || undefined,
  };
}

export function parsePoliceStationsCsv(csvText: string): Responder[] {
  const rows = csvText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (rows.length <= 1) return [];

  return rows.slice(1).flatMap((row, index) => {
    const parsed = parsePoliceStationRow(parseCsvLine(row), index);
    return parsed ? [parsed] : [];
  });
}

export async function loadRespondersFromCsv(): Promise<Responder[]> {
  try {
    const response = await fetch(CSV_PATH);
    if (!response.ok) {
      throw new Error(`Failed to load responder CSV: ${response.status}`);
    }

    const csvText = await response.text();
    const responders = parsePoliceStationsCsv(csvText);
    return responders.length > 0 ? responders : FALLBACK_RESPONDERS;
  } catch (error) {
    console.warn(
      "[Responders] Falling back to built-in responder list:",
      error,
    );
    return FALLBACK_RESPONDERS;
  }
}

export const RESPONDERS: Responder[] = FALLBACK_RESPONDERS;

export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371; // Radius of the Earth in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
}

export function calculateNearestResponder(
  lat: number,
  lng: number,
  responders: Responder[],
) {
  if (!responders || responders.length === 0) return null;

  let nearest = responders[0];
  let minDistance = calculateDistance(
    lat,
    lng,
    nearest.latitude,
    nearest.longitude,
  );

  for (let i = 1; i < responders.length; i++) {
    const d = calculateDistance(
      lat,
      lng,
      responders[i].latitude,
      responders[i].longitude,
    );
    if (d < minDistance) {
      minDistance = d;
      nearest = responders[i];
    }
  }

  return { responder: nearest, distance: minDistance };
}
