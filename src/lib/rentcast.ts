// Client for RentCast (https://developers.rentcast.io) — used to auto-fetch
// live sale/rental comparables for a property. Covers US addresses only.
// Requires RENTCAST_API_KEY to be set; callers should check isRentcastConfigured()
// before offering this feature.

const SQFT_PER_SQM = 10.7639;

export function isRentcastConfigured(): boolean {
  return Boolean(process.env.RENTCAST_API_KEY);
}

export interface RentcastComparable {
  addressLine: string;
  city: string;
  state: string;
  postalCode: string;
  areaSqm: number | null;
  price: number;
  listingType: "sale" | "rental";
  observedDate: Date | null;
}

interface RentcastComparableRaw {
  addressLine1: string;
  city: string;
  state: string;
  zipCode: string;
  squareFootage: number | null;
  price: number;
  listedDate: string | null;
  lastSeenDate: string | null;
}

interface RentcastAvmResponse {
  comparables: RentcastComparableRaw[];
}

async function callRentcast(path: string, params: Record<string, string>): Promise<RentcastAvmResponse> {
  const apiKey = process.env.RENTCAST_API_KEY;
  if (!apiKey) {
    throw new Error("RENTCAST_API_KEY is not configured");
  }
  const url = new URL(`https://api.rentcast.io/v1${path}`);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  const res = await fetch(url, { headers: { "X-Api-Key": apiKey } });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`RentCast request failed (${res.status}): ${body.slice(0, 300)}`);
  }
  return res.json();
}

function mapComparable(raw: RentcastComparableRaw, listingType: "sale" | "rental"): RentcastComparable {
  return {
    addressLine: raw.addressLine1,
    city: raw.city,
    state: raw.state,
    postalCode: raw.zipCode,
    areaSqm: raw.squareFootage != null ? raw.squareFootage / SQFT_PER_SQM : null,
    price: raw.price,
    listingType,
    observedDate: raw.lastSeenDate ? new Date(raw.lastSeenDate) : raw.listedDate ? new Date(raw.listedDate) : null
  };
}

/**
 * Fetches both sale-value comps and long-term rental comps for a US address
 * and merges them into one list (a comp may appear from either call).
 */
export async function fetchLiveComparables(address: {
  addressLine: string;
  city: string;
  state: string;
  postalCode: string;
  areaSqm?: number | null;
}): Promise<RentcastComparable[]> {
  const fullAddress = `${address.addressLine}, ${address.city}, ${address.state} ${address.postalCode}`;
  const params: Record<string, string> = { address: fullAddress, compCount: "10" };
  if (address.areaSqm) {
    params.squareFootage = String(Math.round(address.areaSqm * SQFT_PER_SQM));
  }

  const [valueRes, rentRes] = await Promise.all([
    callRentcast("/avm/value", params),
    callRentcast("/avm/rent/long-term", params)
  ]);

  return [
    ...valueRes.comparables.map((c) => mapComparable(c, "sale")),
    ...rentRes.comparables.map((c) => mapComparable(c, "rental"))
  ];
}
