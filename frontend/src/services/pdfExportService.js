/**
 * TripWise — Client-Side PDF Generation & Export Engine
 *
 * Provides standalone, zero-dependency PDF 1.4 binary generation for travel blueprints:
 * 1. Generates standard PDF-1.4 with Catalog, Pages, font definitions, xref table, and trailer
 * 2. Formats Destination, Duration, Guests, Budget, Travel Style, and Interests
 * 3. Formats Selected Accommodations & Selected Dining
 * 4. Formats Key Attractions & Day-Wise AI Itinerary with automatic page breaks
 * 5. Formats Itemized Budget Breakdown Table with mathematical figures
 * 6. Sanitizes special characters and Rupee symbols (Rs. / INR) to avoid font encoding issues
 * 7. Automatically triggers browser download with a sensible, clean filename
 */

import { calculateTripBudget } from '../utils/budgetEngine.js';

/**
 * Sanitizes text for PDF Type 1 fonts (ASCII safe, currency converted, brackets escaped)
 */
export function cleanPDFText(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/\u20B9/g, 'Rs. ')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/\u2022/g, '-')
    .replace(/[^\x20-\x7E]/g, ' ')
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)');
}

/**
 * Wraps text into multiple lines bounded by maxChars per line
 */
export function wrapText(text, maxChars = 78) {
  if (!text) return [];
  const words = String(text).split(/\s+/);
  const lines = [];
  let currentLine = '';

  for (const word of words) {
    if (!word) continue;
    if ((currentLine + (currentLine ? ' ' : '') + word).length <= maxChars) {
      currentLine += (currentLine ? ' ' : '') + word;
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines;
}

/**
 * Builds the PDF 1.4 document stream
 */
export function buildTripWisePDF(tripData = {}, summaryData = {}) {
  const destination = tripData.destination || 'Destination';
  const numberOfDays = Number(tripData.numberOfDays) || 3;
  const nights = Math.max(1, numberOfDays - 1);
  const travelers = Number(tripData.travelers || tripData.adults) || 2;
  const travelType = tripData.travelType || 'Couple';
  const budget = Number(tripData.budget) || 25000;
  const interests = Array.isArray(tripData.interests) ? tripData.interests : ['Culture', 'Heritage'];
  const places = Array.isArray(tripData.selectedPlaces) ? tripData.selectedPlaces : [];
  const hotels = Array.isArray(tripData.selectedHotels) && tripData.selectedHotels.length > 0
    ? tripData.selectedHotels
    : (summaryData.selectedHotel ? [summaryData.selectedHotel] : []);
  const restaurants = Array.isArray(tripData.selectedRestaurants) && tripData.selectedRestaurants.length > 0
    ? tripData.selectedRestaurants
    : (summaryData.selectedDining || []);
  const itinerary = Array.isArray(tripData.itinerary)
    ? tripData.itinerary
    : (Array.isArray(tripData.itinerary?.daysList) ? tripData.itinerary.daysList : []);

  const pricingMode =
    tripData.accommodationPricingMode ||
    summaryData.accommodationPricingMode ||
    summaryData.budgetCalculations?.accommodationPricingMode ||
    'auto';
  const manualCost =
    tripData.manualAccommodationCost !== undefined
      ? tripData.manualAccommodationCost
      : summaryData.manualAccommodationCost !== undefined
      ? summaryData.manualAccommodationCost
      : summaryData.budgetCalculations?.manualAccommodationCost;

  const budgetCalc = summaryData.budgetCalculations || calculateTripBudget({
    budget,
    numberOfDays,
    travelers,
    selectedHotel: hotels[0] || null,
    selectedRestaurants: restaurants,
    selectedPlaces: places,
    destination,
    travelType,
    accommodationPricingMode: pricingMode,
    manualAccommodationCost: manualCost,
  });

  const isManual = budgetCalc.isManualPricing || pricingMode === 'manual';

  const pages = [];
  let currentCommands = [];
  let currentY = 790;
  const leftX = 40;
  const rightX = 555;
  const contentWidth = 515;

  function flushPage() {
    if (currentCommands.length > 0) {
      pages.push(currentCommands.join('\n'));
      currentCommands = [];
    }
  }

  function startNewPage() {
    flushPage();
    currentY = 780;
    // Running page top banner
    currentCommands.push(
      '0.5 0.5 0.5 rg',
      `BT /F1 8 Tf ${leftX} 810 Td (TripWise Travel Blueprint  |  ${cleanPDFText(destination)} (${numberOfDays} Days)  |  Page ${pages.length + 1}) Tj ET`,
      `0.85 0.85 0.85 RG 0.5 w ${leftX} 805 m ${rightX} 805 l S`
    );
  }

  function ensureSpace(neededHeight) {
    if (currentY - neededHeight < 60) {
      startNewPage();
    }
  }

  // ── 1. HEADER BANNER ──
  currentCommands.push(
    `0.12 0.35 0.72 rg ${leftX} ${currentY - 45} ${contentWidth} 50 re f`,
    '1 1 1 rg',
    `BT /F2 18 Tf ${leftX + 15} ${currentY - 20} Td (TRIPWISE TRAVEL BLUEPRINT) Tj ET`,
    `BT /F1 10 Tf ${leftX + 15} ${currentY - 36} Td (Comprehensive AI Itinerary & Smart Budget Guide  |  Ref: TW-${summaryData.tripRefId || 'PLANNER'}) Tj ET`
  );
  currentY -= 65;

  // ── 2. TRIP OVERVIEW CARD ──
  currentCommands.push(
    `0.96 0.97 0.99 rg 0.85 0.88 0.93 RG 1 w ${leftX} ${currentY - 75} ${contentWidth} 75 re B`,
    '0.1 0.1 0.15 rg',
    `BT /F2 14 Tf ${leftX + 12} ${currentY - 18} Td (${cleanPDFText(destination).toUpperCase()}) Tj ET`,
    `BT /F1 10 Tf ${leftX + 12} ${currentY - 34} Td (Duration: ${numberOfDays} Days / ${nights} Nights     Travelers: ${travelers} Guests (${cleanPDFText(travelType)} Style)) Tj ET`,
    `BT /F2 10 Tf ${leftX + 12} ${currentY - 50} Td (Allocated Budget: Rs. ${budget.toLocaleString('en-IN')}) Tj ET`,
    `BT /F1 9 Tf ${leftX + 12} ${currentY - 65} Td (Travel Interests: ${cleanPDFText(interests.join(', '))}) Tj ET`
  );
  currentY -= 90;

  // ── 3. ACCOMMODATION & DINING SELECTIONS ──
  ensureSpace(90);
  currentCommands.push(
    '0.12 0.35 0.72 rg',
    `BT /F2 11 Tf ${leftX} ${currentY} Td (SELECTED ACCOMMODATION & DINING) Tj ET`,
    `0.85 0.85 0.85 RG 0.5 w ${leftX} ${currentY - 4} m ${rightX} ${currentY - 4} l S`
  );
  currentY -= 18;

  const hotel = hotels[0] || { name: 'Recommended City Center Hotel', pricePerNight: Math.round((budget * 0.38) / nights), stars: 4, location: destination };
  const hotelDetails = isManual
    ? `Pricing Choice: Manual (Total Stay: Rs. ${Number(budgetCalc.accommodationCost || 0).toLocaleString('en-IN')} for ${nights} Nights, ${budgetCalc.roomsCount || 1} Room${(budgetCalc.roomsCount || 1) > 1 ? 's' : ''})  |  Location: ${cleanPDFText(hotel.location || hotel.address || destination)}`
    : `${hotel.stars ? hotel.stars + '-Star Hotel  ' : ''}Pricing Choice: Automatic (Est. Rate: Rs. ${(hotel.pricePerNight || 0).toLocaleString('en-IN')}/night x ${nights} Nights x ${budgetCalc.roomsCount || 1} Room${(budgetCalc.roomsCount || 1) > 1 ? 's' : ''} = Rs. ${Number(budgetCalc.accommodationCost || 0).toLocaleString('en-IN')})  |  Location: ${cleanPDFText(hotel.location || hotel.address || destination)}`;

  currentCommands.push(
    '0.15 0.15 0.15 rg',
    `BT /F2 9.5 Tf ${leftX + 6} ${currentY} Td ([Hotel] ${cleanPDFText(hotel.name)}) Tj ET`,
    `BT /F1 8.5 Tf ${leftX + 6} ${currentY - 12} Td (${cleanPDFText(hotelDetails)}) Tj ET`
  );
  currentY -= 26;

  const dining = restaurants.slice(0, 4);
  if (dining.length > 0) {
    dining.forEach((r) => {
      currentCommands.push(
        `BT /F2 9 Tf ${leftX + 6} ${currentY} Td ([Dining] ${cleanPDFText(r.name)}) Tj ET`,
        `BT /F1 8.5 Tf ${leftX + 6} ${currentY - 11} Td (Cuisine: ${cleanPDFText(r.cuisine || 'Regional')}  |  Price: ${cleanPDFText(r.priceRange || 'Moderate')}  |  Specialty: ${cleanPDFText(r.specialty || r.famousFor || 'Signature Dishes')}) Tj ET`
      );
      currentY -= 22;
    });
  }
  currentY -= 8;

  // ── 4. KEY ATTRACTIONS & SIGHTS ──
  if (places.length > 0) {
    ensureSpace(50);
    currentCommands.push(
      '0.12 0.35 0.72 rg',
      `BT /F2 11 Tf ${leftX} ${currentY} Td (KEY ATTRACTIONS & SIGHTS) Tj ET`,
      `0.85 0.85 0.85 RG 0.5 w ${leftX} ${currentY - 4} m ${rightX} ${currentY - 4} l S`
    );
    currentY -= 16;

    places.slice(0, 6).forEach((p) => {
      ensureSpace(16);
      const feeText = p.entryFee ? `Fee: Rs. ${p.entryFee}` : 'Free Entry';
      currentCommands.push(
        '0.15 0.15 0.15 rg',
        `BT /F1 8.5 Tf ${leftX + 6} ${currentY} Td (* ${cleanPDFText(p.name)} (${cleanPDFText(p.category || 'Sightseeing')}) - Rating: ${p.rating || 4.5}*  [${cleanPDFText(feeText)}]) Tj ET`
      );
      currentY -= 14;
    });
    currentY -= 8;
  }

  // ── 5. DETAILED DAY-WISE ITINERARY ──
  if (itinerary.length > 0) {
    ensureSpace(60);
    currentCommands.push(
      '0.12 0.35 0.72 rg',
      `BT /F2 11 Tf ${leftX} ${currentY} Td (DETAILED DAY-WISE ITINERARY) Tj ET`,
      `0.85 0.85 0.85 RG 0.5 w ${leftX} ${currentY - 4} m ${rightX} ${currentY - 4} l S`
    );
    currentY -= 18;

    itinerary.forEach((dayObj, dayIdx) => {
      ensureSpace(45);
      const dayNum = dayObj.day || dayIdx + 1;
      const dayTheme = dayObj.theme || dayObj.title || `Day ${dayNum} Schedule`;

      // Day Header banner
      currentCommands.push(
        `0.22 0.28 0.45 rg ${leftX} ${currentY - 14} ${contentWidth} 16 re f`,
        '1 1 1 rg',
        `BT /F2 9.5 Tf ${leftX + 8} ${currentY - 10} Td (DAY ${dayNum}: ${cleanPDFText(dayTheme).toUpperCase()}) Tj ET`
      );
      currentY -= 24;

      const activities = Array.isArray(dayObj.activities) ? dayObj.activities : [];
      activities.forEach((act) => {
        const title = act.title || act.placeName || 'Activity Stop';
        const timeStr = act.time || 'Flexible';
        const descLines = wrapText(act.description || '', 78);
        const estCost = act.estimatedCost
          ? `Est. Cost: Rs. ${Number(act.estimatedCost).toLocaleString('en-IN')}`
          : (act.entryFee || 'Free entry');
        const boxHeight = 22 + descLines.length * 11 + (act.transitAfter ? 12 : 0);

        ensureSpace(boxHeight + 8);

        currentCommands.push(
          '0.15 0.15 0.15 rg',
          `BT /F2 9 Tf ${leftX + 8} ${currentY} Td (${cleanPDFText(timeStr)} - ${cleanPDFText(title)}) Tj ET`,
          `BT /F3 8 Tf ${rightX - 160} ${currentY} Td (${cleanPDFText(estCost)}) Tj ET`
        );
        currentY -= 12;

        descLines.forEach((line) => {
          currentCommands.push(
            '0.3 0.3 0.3 rg',
            `BT /F1 8 Tf ${leftX + 16} ${currentY} Td (${cleanPDFText(line)}) Tj ET`
          );
          currentY -= 11;
        });

        if (act.transitAfter) {
          currentCommands.push(
            '0.45 0.45 0.5 rg',
            `BT /F3 7.5 Tf ${leftX + 16} ${currentY} Td (--> Transit: ${cleanPDFText(act.transitAfter)}) Tj ET`
          );
          currentY -= 11;
        }
        currentY -= 4;
      });
      currentY -= 8;
    });
  }

  // ── 6. ITEMIZED BUDGET BREAKDOWN TABLE ──
  ensureSpace(160);
  currentCommands.push(
    '0.12 0.35 0.72 rg',
    `BT /F2 11 Tf ${leftX} ${currentY} Td (ESTIMATED BUDGET BREAKDOWN) Tj ET`,
    `0.85 0.85 0.85 RG 0.5 w ${leftX} ${currentY - 4} m ${rightX} ${currentY - 4} l S`
  );
  currentY -= 18;

  const accommodationRowLabel = isManual
    ? 'Accommodation (Manual Stay Price)'
    : 'Accommodation (Automatic Hotel Estimate)';

  const rows = [
    [accommodationRowLabel, `Rs. ${Number(budgetCalc.accommodationCost || 0).toLocaleString('en-IN')}`],
    ['Food & Culinary Trails (Estimated)', `Rs. ${Number(budgetCalc.foodCost || 0).toLocaleString('en-IN')}`],
    ['Local Transport & Transit (Estimated)', `Rs. ${Number(budgetCalc.transportCost || 0).toLocaleString('en-IN')}`],
    ['Sightseeing & Activity Fees (Estimated)', `Rs. ${Number(budgetCalc.activitiesCost || 0).toLocaleString('en-IN')}`],
    ['Contingency & Miscellaneous Buffer', `Rs. ${Number(budgetCalc.miscCost || 0).toLocaleString('en-IN')}`],
    ['TOTAL ESTIMATED SPEND', `Rs. ${Number(budgetCalc.totalEstimatedSpend || 0).toLocaleString('en-IN')}`],
    ['REMAINING BUDGET BUFFER', (budgetCalc.remainingBudget ?? 0) < 0
      ? `Shortfall: -Rs. ${Math.abs(budgetCalc.remainingBudget).toLocaleString('en-IN')}`
      : `Rs. ${Number(budgetCalc.remainingBudget || 0).toLocaleString('en-IN')}`],
    ['ESTIMATED PER-PERSON EXPENSE', `Rs. ${Number(budgetCalc.perPersonEstimatedCost || 0).toLocaleString('en-IN')}`],
  ];

  rows.forEach((row, i) => {
    const isTotal = i >= 5;
    const bg = i % 2 === 0 ? '0.98 0.98 0.99' : '0.94 0.95 0.97';
    const font = isTotal ? '/F2 8.5 Tf' : '/F1 8.5 Tf';
    const textColor = isTotal ? '0.1 0.25 0.55 rg' : '0.2 0.2 0.2 rg';

    currentCommands.push(
      `${bg} rg ${leftX} ${currentY - 12} ${contentWidth} 14 re f`,
      `${textColor}`,
      `BT ${font} ${leftX + 8} ${currentY - 8} Td (${cleanPDFText(row[0])}) Tj ET`,
      `BT ${font} ${rightX - 90} ${currentY - 8} Td (${cleanPDFText(row[1])}) Tj ET`
    );
    currentY -= 14;
  });

  currentY -= 12;
  ensureSpace(35);
  currentCommands.push(
    '0.45 0.45 0.45 rg',
    `BT /F3 7.5 Tf ${leftX} ${currentY} Td (* Notice: All hotel, dining, transit, and activity prices are realistic estimates based on travel season and party size.) Tj ET`,
    `BT /F3 7.5 Tf ${leftX} ${currentY - 10} Td (Generated by TripWise Smart Travel Engine  |  Always check live venue timings before traveling.) Tj ET`
  );

  flushPage();

  // ── 7. ASSEMBLE PDF 1.4 BINARY STREAM ──
  let pdf = '%PDF-1.4\n%\xE2\xE3\xCF\xD3\n';
  const offsets = [];

  function addObj(content) {
    offsets.push(encodeLatin1Length(pdf));
    const objId = offsets.length;
    pdf += `${objId} 0 obj\n${content}\nendobj\n`;
    return objId;
  }

  function encodeLatin1Length(str) {
    return new TextEncoder().encode(str).length;
  }

  // 1: Catalog
  addObj('<< /Type /Catalog /Pages 2 0 R >>');

  // 2: Pages root
  const totalPages = pages.length;
  const pageObjIds = [];
  for (let i = 0; i < totalPages; i++) {
    pageObjIds.push(3 + i * 2);
  }
  const kidsStr = pageObjIds.map((id) => `${id} 0 R`).join(' ');
  addObj(`<< /Type /Pages /Kids [${kidsStr}] /Count ${totalPages} >>`);

  // Resources object (Fonts)
  const fontsObjId = 3 + totalPages * 2;

  // Add Page objects and Content streams
  for (let i = 0; i < totalPages; i++) {
    const contentId = 3 + i * 2 + 1;
    addObj(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595.28 841.89] /Contents ${contentId} 0 R /Resources ${fontsObjId} 0 R >>`
    );
    const streamData = pages[i];
    const streamLen = encodeLatin1Length(streamData);
    addObj(`<< /Length ${streamLen} >>\nstream\n${streamData}\nendstream`);
  }

  // Fonts Object
  addObj(
    '<< /Font << /F1 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> /F2 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >> /F3 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Oblique >> >> >>'
  );

  // Xref table
  const startXref = encodeLatin1Length(pdf);
  const totalObjs = offsets.length + 1;
  pdf += `xref\n0 ${totalObjs}\n0000000000 65535 f \n`;

  for (let i = 0; i < offsets.length; i++) {
    const off = String(offsets[i]).padStart(10, '0');
    pdf += `${off} 00000 n \n`;
  }

  pdf += `trailer\n<< /Size ${totalObjs} /Root 1 0 R >>\nstartxref\n${startXref}\n%%EOF\n`;

  const cleanDest = cleanPDFText(destination).replace(/[^a-zA-Z0-9]/g, '_');
  const filename = `TripWise_${cleanDest}_${numberOfDays}Days_Blueprint.pdf`;

  return {
    pdfString: pdf,
    totalPages,
    filename,
  };
}

/**
 * Downloads the generated PDF directly in the browser
 */
export async function generateAndDownloadTripPDF(tripData, summaryData = {}) {
  try {
    const { pdfString, filename } = buildTripWisePDF(tripData, summaryData);

    const blob = new Blob([pdfString], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 1000);

    return { success: true, filename };
  } catch (err) {
    console.error('PDF generation failed:', err);
    throw new Error('Failed to generate PDF document. Please try again or use the print option.');
  }
}
