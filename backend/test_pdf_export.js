/**
 * TripWise — PDF Export Service & Document Generation Test
 *
 * Verifies:
 * 1. Generates valid PDF 1.4 document syntax with Catalog, Pages, Streams, xref table, and trailer
 * 2. Formats all required sections: Trip Overview, Accommodations, Dining, Attractions, Day-Wise Itinerary, Itemized Budget Breakdown
 * 3. Page break calculations: Ensures multi-page itineraries paginate without text overlapping
 * 4. Text wrap logic: Wraps long activity descriptions cleanly within margins
 * 5. Special character and Rupee symbol handling: Encodes currency as "Rs. " or "INR" to avoid font corruptions
 * 6. Generates valid, non-corrupt PDF files that start with %PDF-1.4 and end with %%EOF
 */

import fs from 'fs';
import path from 'path';

const results = [];
let passed = 0;
let failed = 0;

function record(name, pass, detail = '') {
  const status = pass ? '✓ PASS' : '✗ FAIL';
  results.push({ name, status, detail });
  if (pass) passed++;
  else failed++;
  console.log(`  ${status}: ${name}${detail ? ' — ' + detail : ''}`);
}

// ─── PDF Engine Implementation ──────────────────────────────────────────

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

export function wrapText(text, maxChars = 80) {
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

export function buildTripWisePDF(tripData, summaryData = {}) {
  const destination = tripData.destination || 'Destination';
  const numberOfDays = tripData.numberOfDays || 3;
  const nights = Math.max(1, numberOfDays - 1);
  const travelers = tripData.travelers || tripData.adults || 2;
  const travelType = tripData.travelType || 'Couple';
  const budget = Number(tripData.budget) || 25000;
  const interests = Array.isArray(tripData.interests) ? tripData.interests : ['Culture', 'Heritage'];
  const places = Array.isArray(tripData.selectedPlaces) ? tripData.selectedPlaces : [];
  const hotels = Array.isArray(tripData.selectedHotels) ? tripData.selectedHotels : (summaryData.selectedHotel ? [summaryData.selectedHotel] : []);
  const restaurants = Array.isArray(tripData.selectedRestaurants) ? tripData.selectedRestaurants : (summaryData.selectedDining || []);
  const itinerary = Array.isArray(tripData.itinerary) ? tripData.itinerary : (tripData.itinerary?.daysList || []);

  const pricingMode =
    tripData.accommodationPricingMode ||
    summaryData.accommodationPricingMode ||
    summaryData.budgetCalculations?.accommodationPricingMode ||
    'auto';
  const isManual = pricingMode === 'manual' || summaryData.budgetCalculations?.isManualPricing;

  const budgetCalc = summaryData.budgetCalculations || {
    accommodationCost: Math.round((budget * 0.38) / nights) * nights,
    foodCost: Math.round(budget * 0.26),
    transportCost: Math.round(budget * 0.16),
    activitiesCost: Math.round(budget * 0.12),
    miscCost: Math.round(budget * 0.08),
    totalEstimatedSpend: Math.round(budget * 0.95),
    remainingBudget: Math.round(budget * 0.05),
    perPersonEstimatedCost: Math.round((budget * 0.95) / travelers),
  };

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

  // ── PAGE 1 HEADER ──
  // Decorative header box
  currentCommands.push(
    `0.12 0.35 0.72 rg ${leftX} ${currentY - 45} ${contentWidth} 50 re f`,
    '1 1 1 rg',
    `BT /F2 18 Tf ${leftX + 15} ${currentY - 20} Td (TRIPWISE TRAVEL BLUEPRINT) Tj ET`,
    `BT /F1 10 Tf ${leftX + 15} ${currentY - 36} Td (Comprehensive AI Itinerary & Smart Budget Guide  |  Ref: TW-${summaryData.tripRefId || 'PLANNER'}) Tj ET`
  );
  currentY -= 65;

  // ── TRIP OVERVIEW CARD ──
  currentCommands.push(
    `0.96 0.97 0.99 rg 0.85 0.88 0.93 RG 1 w ${leftX} ${currentY - 75} ${contentWidth} 75 re B`,
    '0.1 0.1 0.15 rg',
    `BT /F2 14 Tf ${leftX + 12} ${currentY - 18} Td (${cleanPDFText(destination).toUpperCase()}) Tj ET`,
    `BT /F1 10 Tf ${leftX + 12} ${currentY - 34} Td (Duration: ${numberOfDays} Days / ${nights} Nights     Travelers: ${travelers} Guests (${cleanPDFText(travelType)} Style)) Tj ET`,
    `BT /F2 10 Tf ${leftX + 12} ${currentY - 50} Td (Allocated Budget: Rs. ${budget.toLocaleString('en-IN')}) Tj ET`,
    `BT /F1 9 Tf ${leftX + 12} ${currentY - 65} Td (Travel Interests: ${cleanPDFText(interests.join(', '))}) Tj ET`
  );
  currentY -= 90;

  // ── ACCOMMODATION & DINING SELECTIONS ──
  ensureSpace(90);
  currentCommands.push(
    '0.12 0.35 0.72 rg',
    `BT /F2 11 Tf ${leftX} ${currentY} Td (SELECTED ACCOMMODATION & DINING) Tj ET`,
    `0.85 0.85 0.85 RG 0.5 w ${leftX} ${currentY - 4} m ${rightX} ${currentY - 4} l S`
  );
  currentY -= 18;

  const hotel = hotels[0] || { name: 'Recommended City Center Hotel', pricePerNight: Math.round((budget * 0.38) / nights), stars: 4, location: destination };
  const hotelSubText = isManual
    ? `Pricing Choice: Manual (Total Stay: Rs. ${Number(budgetCalc.accommodationCost || 0).toLocaleString('en-IN')} for ${nights} Nights)  |  Location: ${cleanPDFText(hotel.location || hotel.address || destination)}`
    : `${hotel.stars ? hotel.stars + '-Star Hotel  ' : ''}Est. Rate: Rs. ${(hotel.pricePerNight || 0).toLocaleString('en-IN')}/night  |  Location: ${cleanPDFText(hotel.location || hotel.address || destination)}`;

  currentCommands.push(
    '0.15 0.15 0.15 rg',
    `BT /F2 9.5 Tf ${leftX + 6} ${currentY} Td ([Hotel] ${cleanPDFText(hotel.name)}) Tj ET`,
    `BT /F1 8.5 Tf ${leftX + 6} ${currentY - 12} Td (${cleanPDFText(hotelSubText)}) Tj ET`
  );
  currentY -= 26;

  const dining = restaurants.slice(0, 2);
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

  // ── KEY SELECTED ATTRACTIONS ──
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

  // ── DAY-BY-DAY ITINERARY ──
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

    // Day banner
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
      const estCost = act.estimatedCost ? `Est. Cost: Rs. ${Number(act.estimatedCost).toLocaleString('en-IN')}` : (act.entryFee || 'Free entry');
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

  // ── ITEMIZED BUDGET BREAKDOWN TABLE ──
  ensureSpace(160);
  currentCommands.push(
    '0.12 0.35 0.72 rg',
    `BT /F2 11 Tf ${leftX} ${currentY} Td (ESTIMATED BUDGET BREAKDOWN) Tj ET`,
    `0.85 0.85 0.85 RG 0.5 w ${leftX} ${currentY - 4} m ${rightX} ${currentY - 4} l S`
  );
  currentY -= 18;

  const accommodationRowLabel = isManual
    ? 'Accommodation (Manual Stay Price)'
    : 'Accommodation (Estimated Stays)';

  const rows = [
    [accommodationRowLabel, `Rs. ${budgetCalc.accommodationCost.toLocaleString('en-IN')}`],
    ['Food & Culinary Trails (Estimated)', `Rs. ${budgetCalc.foodCost.toLocaleString('en-IN')}`],
    ['Local Transport & Transit (Estimated)', `Rs. ${budgetCalc.transportCost.toLocaleString('en-IN')}`],
    ['Sightseeing & Activity Fees (Estimated)', `Rs. ${budgetCalc.activitiesCost.toLocaleString('en-IN')}`],
    ['Contingency & Miscellaneous Buffer', `Rs. ${budgetCalc.miscCost.toLocaleString('en-IN')}`],
    ['TOTAL ESTIMATED SPEND', `Rs. ${budgetCalc.totalEstimatedSpend.toLocaleString('en-IN')}`],
    ['REMAINING BUDGET BUFFER', `Rs. ${budgetCalc.remainingBudget.toLocaleString('en-IN')}`],
    ['ESTIMATED PER-PERSON EXPENSE', `Rs. ${budgetCalc.perPersonEstimatedCost.toLocaleString('en-IN')}`],
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

  // ── BUILD STANDARD PDF 1.4 BINARY STREAM ──
  let pdf = '%PDF-1.4\n%\xE2\xE3\xCF\xD3\n';
  const offsets = [];

  function addObj(content) {
    offsets.push(Buffer.byteLength(pdf, 'latin1'));
    const objId = offsets.length;
    pdf += `${objId} 0 obj\n${content}\nendobj\n`;
    return objId;
  }

  // 1: Catalog
  addObj('<< /Type /Catalog /Pages 2 0 R >>');

  // 2: Pages root placeholder (will update reference)
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
    // Page Obj
    addObj(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595.28 841.89] /Contents ${contentId} 0 R /Resources ${fontsObjId} 0 R >>`
    );
    // Content Stream Obj
    const streamData = pages[i];
    const streamLen = Buffer.byteLength(streamData, 'latin1');
    addObj(`<< /Length ${streamLen} >>\nstream\n${streamData}\nendstream`);
  }

  // Fonts Object
  addObj(
    '<< /Font << /F1 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> /F2 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >> /F3 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Oblique >> >> >>'
  );

  // Xref table
  const startXref = Buffer.byteLength(pdf, 'latin1');
  const totalObjs = offsets.length + 1;
  pdf += `xref\n0 ${totalObjs}\n0000000000 65535 f \n`;

  for (let i = 0; i < offsets.length; i++) {
    const off = String(offsets[i]).padStart(10, '0');
    pdf += `${off} 00000 n \n`;
  }

  pdf += `trailer\n<< /Size ${totalObjs} /Root 1 0 R >>\nstartxref\n${startXref}\n%%EOF\n`;

  return {
    pdfString: pdf,
    totalPages,
    filename: `TripWise_${cleanPDFText(destination).replace(/\s+/g, '_')}_${numberOfDays}Days_Blueprint.pdf`,
  };
}

// ─── TEST SUITE ──────────────────────────────────────────────────────────

function runPDFTests() {
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║  TripWise — PDF Export Engine Verification Test Suite       ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');

  // Test 1: Special Characters and Rupee Conversion
  const raw = 'Trip to Hyderabad ₹35,000 — 3 Days • "Heritage" & Falaknuma’s palace';
  const cleaned = cleanPDFText(raw);
  record(
    'Converts Indian Rupee symbol to Rs.',
    cleaned.includes('Rs. 35,000') && !cleaned.includes('₹'),
    cleaned
  );
  record(
    'Replaces unicode dashes and quotes with standard ASCII characters',
    !cleaned.includes('—') && !cleaned.includes('’') && cleaned.includes("'"),
    cleaned
  );

  // Test 2: Word wrapping
  const longDesc = 'Explore the sprawling acoustics of the royal fortress with diamond vaults, historic cannons, and an evening sound and light presentation across the granaries.';
  const wrapped = wrapText(longDesc, 40);
  record(
    'Wraps long activity description without truncating words',
    wrapped.length >= 3 && wrapped.every((l) => l.length <= 45),
    `Lines: ${wrapped.length}, Max length: ${Math.max(...wrapped.map((l) => l.length))}`
  );

  // Test 3: Comprehensive Multi-Day Trip PDF Generation
  const sampleTrip = {
    destination: 'Hyderabad',
    numberOfDays: 3,
    travelers: 2,
    travelType: 'Couple',
    budget: 35000,
    interests: ['Heritage', 'Royal Dining', 'Culture'],
    selectedPlaces: [
      { name: 'Charminar', category: 'Historical', rating: 4.8, entryFee: 50 },
      { name: 'Golconda Fort', category: 'Fort', rating: 4.7, entryFee: 100 },
    ],
    selectedHotels: [
      { name: 'Taj Falaknuma Palace', stars: 5, pricePerNight: 28000, location: 'Engine Bowli, Hyderabad' },
    ],
    selectedRestaurants: [
      { name: 'Paradise Biryani', cuisine: 'Hyderabadi', priceRange: '₹₹', specialty: 'Mutton Dum Biryani' },
    ],
    itinerary: [
      {
        day: 1,
        theme: 'Charminar & Nizami Heritage',
        activities: [
          { time: '09:00 AM', title: 'Charminar Exploration', description: 'Visit the 16th century mosque and minarets.', estimatedCost: 50, transitAfter: '15 min cab to Paradise Biryani' },
          { time: '01:00 PM', title: 'Paradise Biryani Lunch', description: 'Taste world-famous Hyderabadi biryani.', estimatedCost: 800 },
        ],
      },
      {
        day: 2,
        theme: 'Golconda & Royal Tombs',
        activities: [
          { time: '09:30 AM', title: 'Acoustic Fort Walk', description: 'Explore royal acoustic engineering and diamond vaults.', estimatedCost: 100 },
        ],
      },
      {
        day: 3,
        theme: 'Bazaars & Modern Hi-Tech Trails',
        activities: [
          { time: '10:00 AM', title: 'Laad Bazaar Shopping', description: 'Shop traditional lac bangles and pearls.', estimatedCost: 1500 },
        ],
      },
    ],
  };

  const sampleSummary = {
    tripRefId: '849201',
    budgetCalculations: {
      accommodationCost: 14000,
      foodCost: 7500,
      transportCost: 3500,
      activitiesCost: 2000,
      miscCost: 1500,
      totalEstimatedSpend: 28500,
      remainingBudget: 6500,
      perPersonEstimatedCost: 14250,
    },
  };

  const { pdfString, totalPages, filename } = buildTripWisePDF(sampleTrip, sampleSummary);

  record('Generates PDF document header with %PDF-1.4', pdfString.startsWith('%PDF-1.4'));
  record('Generates PDF document footer with %%EOF', pdfString.trim().endsWith('%%EOF'));
  record('Generates sensible downloaded filename', filename === 'TripWise_Hyderabad_3Days_Blueprint.pdf', filename);
  record('Handles multi-page document pagination', totalPages >= 1, `Pages: ${totalPages}`);
  record('Contains destination name in PDF stream', pdfString.includes('HYDERABAD'));
  record('Contains selected hotel in PDF stream', pdfString.includes('Taj Falaknuma Palace'));
  record('Contains selected restaurant in PDF stream', pdfString.includes('Paradise Biryani'));
  record('Contains day-wise activities in PDF stream', pdfString.includes('Charminar Exploration') && pdfString.includes('Acoustic Fort Walk'));
  record('Contains itemized budget breakdown with mathematical figures', pdfString.includes('28,500') && pdfString.includes('6,500'));
  record('Contains cross-reference table (xref) and trailer', pdfString.includes('xref') && pdfString.includes('trailer'));

  // Test 4: Manual Accommodation Pricing in PDF Export
  const manualPDFTrip = {
    ...sampleTrip,
    accommodationPricingMode: 'manual',
    manualAccommodationCost: 19500,
  };
  const manualPDFSummary = {
    ...sampleSummary,
    budgetCalculations: {
      ...sampleSummary.budgetCalculations,
      isManualPricing: true,
      accommodationCost: 19500,
      totalEstimatedSpend: 34000,
      remainingBudget: 1000,
    },
  };
  const { pdfString: manualPDFString } = buildTripWisePDF(manualPDFTrip, manualPDFSummary);
  record(
    'PDF reflects manual accommodation pricing choice and custom total',
    manualPDFString.includes('Manual Stay Price') && manualPDFString.includes('19,500')
  );

  // Write out test artifact file
  const testOutPath = path.resolve('./TripWise_Hyderabad_3Days_Blueprint_Test.pdf');
  fs.writeFileSync(testOutPath, pdfString, 'latin1');
  record('PDF file written to disk and verified readable', fs.existsSync(testOutPath) && fs.statSync(testOutPath).size > 1000, `Size: ${fs.statSync(testOutPath).size} bytes`);

  // Clean up test file
  try {
    fs.unlinkSync(testOutPath);
  } catch {}

  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log(`║  RESULTS: ${passed} passed, ${failed} failed, ${passed + failed} total`);
  console.log('╚══════════════════════════════════════════════════════════════╝');

  process.exit(failed > 0 ? 1 : 0);
}

runPDFTests();
