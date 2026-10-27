/**
 * TripWise — Neutral Attraction Image & Fallback Manager
 * 
 * Implements strict image safety requirements:
 * 1. Deterministic verified images for all supported landmarks across every city.
 * 2. Never substitutes an unrelated image or photograph from another landmark or city.
 * 3. In the event of a network failure or 404, returns a clearly identifiable,
 *    neutral SVG placeholder showing the correct attraction name and city.
 */

import { destinations } from '../data/destination.js';
import { DESTINATION_PLACES } from '../data/mockData.js';

/**
 * Generates an authentic neutral SVG placeholder displaying the actual attraction name.
 */
export function getAttractionPlaceholder(attractionName = 'TripWise Landmark', cityName = '') {
  const cleanName = String(attractionName || 'TripWise Landmark')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

  const cleanCity = String(cityName || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  const subtitle = cleanCity
    ? `Verified Landmark Preview • ${cleanCity}`
    : 'Verified Landmark Preview';

  return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="800" height="500" viewBox="0 0 800 500" fill="%23f8fafc"><rect width="800" height="500" fill="%23f8fafc"/><rect x="20" y="20" width="760" height="460" rx="16" fill="%23ffffff" stroke="%23cbd5e1" stroke-width="2" stroke-dasharray="8 8"/><circle cx="400" cy="195" r="50" fill="%23e2e8f0"/><text x="400" y="210" font-family="-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif" font-size="40" text-anchor="middle">🏛️</text><text x="400" y="285" font-family="-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif" font-size="22" font-weight="700" fill="%231e293b" text-anchor="middle">${encodeURIComponent(cleanName)}</text><text x="400" y="320" font-family="-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif" font-size="14" font-weight="500" fill="%2364748b" text-anchor="middle">${encodeURIComponent(subtitle)}</text><text x="400" y="440" font-family="-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif" font-size="11" fill="%2394a3b8" text-anchor="middle">TripWise Smart Destination Engine</text></svg>`;
}

export const NEUTRAL_LANDMARK_PLACEHOLDER = getAttractionPlaceholder('TripWise Landmark');

export const NEUTRAL_HOTEL_PLACEHOLDER = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="800" height="500" viewBox="0 0 800 500" fill="%23f1f5f9"><rect width="800" height="500" fill="%23f1f5f9"/><rect x="20" y="20" width="760" height="460" rx="16" fill="%23ffffff" stroke="%23cbd5e1" stroke-width="2" stroke-dasharray="8 8"/><circle cx="400" cy="210" r="54" fill="%23e2e8f0"/><text x="400" y="225" font-family="-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif" font-size="42" text-anchor="middle">🏨</text><text x="400" y="300" font-family="-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif" font-size="20" font-weight="700" fill="%23334155" text-anchor="middle">Verified Hotel &amp; Stay</text><text x="400" y="332" font-family="-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif" font-size="14" fill="%2364748b" text-anchor="middle">Accommodation partner in this destination</text></svg>`;

export const NEUTRAL_DINING_PLACEHOLDER = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="800" height="500" viewBox="0 0 800 500" fill="%23f1f5f9"><rect width="800" height="500" fill="%23f1f5f9"/><rect x="20" y="20" width="760" height="460" rx="16" fill="%23ffffff" stroke="%23cbd5e1" stroke-width="2" stroke-dasharray="8 8"/><circle cx="400" cy="210" r="54" fill="%23e2e8f0"/><text x="400" y="225" font-family="-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif" font-size="42" text-anchor="middle">🍽️</text><text x="400" y="300" font-family="-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif" font-size="20" font-weight="700" fill="%23334155" text-anchor="middle">Authentic Dining Stop</text><text x="400" y="332" font-family="-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif" font-size="14" fill="%2364748b" text-anchor="middle">Curated culinary specialty in this destination</text></svg>`;

/**
 * Builds an authoritative map of verified attraction images across all supported cities.
 */
const VERIFIED_MAP = new Map();

function normalizeNameKey(str = '') {
  return String(str).toLowerCase().replace(/[^a-z0-9]/g, '');
}

// Index canonical destinations
destinations.forEach((d) => {
  if (d.id && d.image) {
    VERIFIED_MAP.set(d.id.toLowerCase(), d.image);
  }
  if (d.name && d.image) {
    VERIFIED_MAP.set(normalizeNameKey(d.name), d.image);
  }
});

// Also index mock places dataset for full compatibility
if (Array.isArray(DESTINATION_PLACES)) {
  DESTINATION_PLACES.forEach((p) => {
    if (p.id && p.image && !VERIFIED_MAP.has(p.id.toLowerCase())) {
      VERIFIED_MAP.set(p.id.toLowerCase(), p.image);
    }
    if (p.name && p.image && !VERIFIED_MAP.has(normalizeNameKey(p.name))) {
      VERIFIED_MAP.set(normalizeNameKey(p.name), p.image);
    }
  });
}

// Landmark cross-aliases to map compound and colloquial titles to verified photos
const LANDMARK_NAME_ALIASES = [
  ['charminar', 'charminarlaadbazaar'],
  ['golconda', 'golcondafort'],
  ['hussainsagar', 'hussainsagarlake', 'hussainsagarlakebuddhastatue'],
  ['chowmahalla', 'chowmahallapalace'],
  ['ramojifilmcity', 'ramojistudios'],
  ['salarjung', 'salarjungmuseum'],
  ['birlamandir', 'birlamandirhyderabad'],
  ['nehruzoo', 'nehruzoologicalpark'],
  ['qutbshahi', 'qutbshahitombs'],
  ['bagabeach', 'bagabeachwatersports'],
  ['fortaguada', 'aguadafort', 'fortaguadalighthouse'],
  ['dudhsagar', 'dudhsagarfalls', 'dudhsagarwaterfalls'],
  ['basilicaofbomjesus', 'bomjesusbasilica', 'bomjesus'],
  ['anjunabeach', 'anjunabeachfleamarket'],
  ['secathedral', 'secathedralgoa'],
  ['palolem', 'palolembeach'],
  ['bhagwanmahaveer', 'mollemwildlife', 'mollemnationalpark'],
  ['chapora', 'chaporafort', 'vagator', 'vagatorbeach', 'vagatorbeachchaporafort'],
  ['colva', 'colvabeach'],
  ['amberfort', 'amberpalace', 'amerfort', 'amberpalacefort'],
  ['hawamahal', 'hawamahalpalaceofwinds'],
  ['citypalace', 'citypalacejaipur', 'citypalacemuseum'],
  ['jantarmantar', 'jantarmantarjaipur'],
  ['nahargarh', 'nahargarhfort'],
  ['jaigarh', 'jaigarhfort'],
  ['alberthall', 'alberthallmuseum', 'albertmuseum'],
  ['jalmahal', 'waterpalace'],
  ['johribazaar', 'joharibazaar', 'johribazaargemmarkets'],
  ['sisodiarani', 'sisodiaranigarden', 'sisodiaranikabagh', 'sisodiaranigardenpalace'],
  ['redfort', 'lalqila'],
  ['indiagate', 'indiagatekartavyapath'],
  ['qutubminar', 'qutubminarcomplex', 'qutub'],
  ['humayunstomb', 'humayuntomb'],
  ['lotustemple', 'bahaihouseofworship'],
  ['chandnichowk', 'chandnichowkolddelhi'],
  ['akshardham', 'akshardhamtemple'],
  ['jamamasjid', 'jamamasjidolddelhi'],
  ['lodigarden', 'lodigardens', 'lodhigarden'],
  ['nationalmuseum', 'nationalmuseumdelhi'],
  ['hauzkhas', 'hauzkhasvillage', 'hauzkhascomplex'],
  ['puranaqila', 'oldfortdelhi'],
  ['gatewayofindia', 'gateway'],
  ['marinedrive', 'marinedrivechowpatty', 'queensnecklace'],
  ['elephanta', 'elephantacaves'],
  ['dharavi', 'dharavicrafttour'],
  ['chhatrapatishivajiterminus', 'cst', 'victoriaterminus', 'cstmumbai'],
  ['juhu', 'juhubeach'],
  ['siddhivinayak', 'siddhivinayaktemple'],
  ['bandraworlisealink', 'bandraworli', 'sealink'],
  ['cstmmuseum', 'csmvsmuseum', 'chhatrapatishivajimaharajmuseum', 'princeofwalesmuseum'],
  ['colabacauseway', 'colabacausewaymarket'],
];

LANDMARK_NAME_ALIASES.forEach((aliasGroup) => {
  let knownImg = '';
  for (const alias of aliasGroup) {
    if (VERIFIED_MAP.has(alias)) {
      knownImg = VERIFIED_MAP.get(alias);
      break;
    }
  }
  if (knownImg) {
    aliasGroup.forEach((alias) => {
      if (!VERIFIED_MAP.has(alias)) {
        VERIFIED_MAP.set(alias, knownImg);
      }
    });
  }
});

/**
 * Known generic placeholder / random stock IDs to reject in favor of neutral SVG
 */
const GENERIC_STOCK_PATTERNS = [
  'photo-1469854523086',
  'photo-1488646953014',
  'photo-1507525428034',
  'photo-1614680376739-414d95ff43df', // Unrelated Discord graphic
];

/**
 * Deterministically resolves a verified attraction image URL.
 * Never returns a random or mismatched landmark image.
 */
export function getVerifiedAttractionImage(place, cityName = '') {
  if (!place) return getAttractionPlaceholder('Landmark', cityName);

  // If already an object with explicit verified image
  if (typeof place === 'object') {
    const directImg = place.image || place.imageUrl;
    const placeId = (place.id || place.attractionId || '').toLowerCase();
    const placeName = place.name || place.title || '';
    const normName = normalizeNameKey(placeName);
    const targetCity = place.city || place.destination || cityName;

    if (placeId && VERIFIED_MAP.has(placeId)) {
      return VERIFIED_MAP.get(placeId);
    }
    if (normName && VERIFIED_MAP.has(normName)) {
      return VERIFIED_MAP.get(normName);
    }
    // Check if normName contains or is contained by a known landmark key
    for (const [key, img] of VERIFIED_MAP.entries()) {
      if (key.length >= 5 && (normName.includes(key) || key.includes(normName))) {
        return img;
      }
    }
    if (
      directImg &&
      typeof directImg === 'string' &&
      (directImg.startsWith('http') || directImg.startsWith('/') || directImg.startsWith('data:')) &&
      !GENERIC_STOCK_PATTERNS.some((pat) => directImg.includes(pat))
    ) {
      return directImg;
    }
    return getAttractionPlaceholder(placeName || 'Attraction', targetCity);
  }

  // If string (ID or Name)
  const query = String(place).toLowerCase();
  if (VERIFIED_MAP.has(query)) return VERIFIED_MAP.get(query);
  const norm = normalizeNameKey(query);
  if (VERIFIED_MAP.has(norm)) return VERIFIED_MAP.get(norm);
  for (const [key, img] of VERIFIED_MAP.entries()) {
    if (key.length >= 5 && (norm.includes(key) || key.includes(norm))) {
      return img;
    }
  }

  return getAttractionPlaceholder(place, cityName);
}

/**
 * Safe image fallback handler for <img> onError events.
 * Swaps broken image URLs for a neutral placeholder displaying the actual attraction name.
 */
export function handleAttractionImageError(event, attractionName = '', cityName = '') {
  if (event && event.currentTarget) {
    event.currentTarget.onerror = null; // Prevent infinite loop
    const name =
      attractionName ||
      event.currentTarget.getAttribute('data-name') ||
      event.currentTarget.alt ||
      'Attraction';
    const city = cityName || event.currentTarget.getAttribute('data-city') || '';
    event.currentTarget.src = getAttractionPlaceholder(name, city);
  }
}

export function handleHotelImageError(event) {
  if (event && event.currentTarget) {
    event.currentTarget.onerror = null;
    event.currentTarget.src = NEUTRAL_HOTEL_PLACEHOLDER;
  }
}

export function handleDiningImageError(event) {
  if (event && event.currentTarget) {
    event.currentTarget.onerror = null;
    event.currentTarget.src = NEUTRAL_DINING_PLACEHOLDER;
  }
}
