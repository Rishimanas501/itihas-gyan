import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { db } from '../db';
import type { HistoricalMap, HistoricalFrame, HistoricalRegion, ChronologicalEvent } from '../types';
import { 
  BUILTIN_HISTORICAL_MAPS, 
  MUGHAL_MAP_DATA,
  SUBCONTINENT_RIVERS,
  SUBCONTINENT_SEAS
} from '../data/historicalMapsData';

/**
 * Retrieve all historical maps (Built-in presets + User saved maps from IndexedDB)
 */
export async function getAllHistoricalMaps(): Promise<HistoricalMap[]> {
  try {
    const customMaps = await db.historicalMaps.toArray();
    return [...BUILTIN_HISTORICAL_MAPS, ...customMaps];
  } catch (error) {
    console.warn('Failed to load custom maps from database, returning built-ins:', error);
    return [...BUILTIN_HISTORICAL_MAPS];
  }
}

/**
 * Retrieve a single historical map by its unique ID
 */
export async function getHistoricalMapById(id: string): Promise<HistoricalMap | undefined> {
  const builtin = BUILTIN_HISTORICAL_MAPS.find(m => m.id === id);
  if (builtin) return builtin;
  
  try {
    const custom = await db.historicalMaps.get(id);
    return custom;
  } catch (error) {
    console.error('Error fetching historical map with ID:', id, error);
    return undefined;
  }
}

/**
 * Save a newly created or modified historical map to IndexedDB
 */
export async function saveHistoricalMap(map: HistoricalMap): Promise<void> {
  const toSave: HistoricalMap = {
    ...map,
    updatedAt: new Date().toISOString()
  };
  await db.historicalMaps.put(toSave);
}

/**
 * Delete a custom historical map from IndexedDB
 */
export async function deleteHistoricalMap(id: string): Promise<boolean> {
  const isBuiltin = BUILTIN_HISTORICAL_MAPS.some(m => m.id === id);
  if (isBuiltin) {
    throw new Error('Cannot delete built-in curriculum maps.');
  }
  await db.historicalMaps.delete(id);
  return true;
}

/**
 * High-Resolution PNG Exporter
 * Takes the SVG Map element, renders it onto an HTML5 Canvas with antique parchment texture,
 * title bar, North arrow, and scale, then triggers a download.
 */
export async function exportMapToPNG(
  svgElement: SVGSVGElement,
  mapTitle: string,
  frameTitle: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      const svgXml = new XMLSerializer().serializeToString(svgElement);
      const svgBlob = new Blob([svgXml], { type: 'image/svg+xml;charset=utf-8' });
      const URL = window.URL || window.webkitURL || window;
      const blobUrl = URL.createObjectURL(svgBlob);

      const image = new Image();
      image.onload = () => {
        // High resolution scale factor for classroom displays (2000x1700)
        const canvas = document.createElement('canvas');
        canvas.width = 2000;
        canvas.height = 1700;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          URL.revokeObjectURL(blobUrl);
          reject(new Error('Canvas 2D context unavailable'));
          return;
        }

        // 1. Antique Parchment Canvas Background
        ctx.fillStyle = '#fbf7ee';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // 2. Subtle parchment vignette border
        const gradient = ctx.createRadialGradient(
          canvas.width / 2, canvas.height / 2, 600,
          canvas.width / 2, canvas.height / 2, 1200
        );
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0)');
        gradient.addColorStop(1, 'rgba(180, 150, 110, 0.25)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // 3. Antique Double Framing Line
        ctx.strokeStyle = '#854d0e';
        ctx.lineWidth = 6;
        ctx.strokeRect(30, 30, canvas.width - 60, canvas.height - 60);
        ctx.lineWidth = 2;
        ctx.strokeRect(40, 40, canvas.width - 80, canvas.height - 80);

        // 4. Draw SVG map content
        ctx.drawImage(image, 50, 120, 1900, 1515);

        // 5. Header Atlas Title Plate
        ctx.fillStyle = '#78350f';
        ctx.font = 'bold 36px "Cinzel", "Times New Roman", serif';
        ctx.textAlign = 'center';
        ctx.fillText(mapTitle.toUpperCase(), canvas.width / 2, 75);

        ctx.fillStyle = '#92400e';
        ctx.font = 'italic 24px "Times New Roman", serif';
        ctx.fillText(frameTitle, canvas.width / 2, 108);

        // 6. Watermark Footer
        ctx.fillStyle = '#78716c';
        ctx.font = 'bold 18px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('ITIHAS GYAN | Historical Atlas & Map Generator', 60, canvas.height - 45);

        ctx.textAlign = 'right';
        ctx.fillText(`Date: ${new Date().toLocaleDateString()}`, canvas.width - 60, canvas.height - 45);

        // Trigger Download
        const link = document.createElement('a');
        const cleanName = `${mapTitle}_${frameTitle}`.replace(/[^a-zA-Z0-9_\u0B00-\u0B7F]/g, '_');
        link.download = `${cleanName}.png`;
        link.href = canvas.toDataURL('image/png');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(blobUrl);
        resolve();
      };

      image.onerror = (e) => {
        URL.revokeObjectURL(blobUrl);
        reject(e);
      };

      image.src = blobUrl;
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Educational Historical Atlas PDF Exporter
 * Generates an authoritative multi-page / high-resolution PDF document with
 * map overview, ruler biography, conquered territories, and chronological timeline table.
 */
export async function exportMapToPDF(
  map: HistoricalMap,
  activeFrameIndex: number,
  svgElement?: SVGSVGElement
): Promise<void> {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const currentFrame = map.frames[activeFrameIndex] || map.frames[0];

  // 1. Header Ribbon Banner
  doc.setFillColor(120, 53, 15); // Deep Amber/Chestnut
  doc.rect(0, 0, pageWidth, 28, 'F');

  doc.setTextColor(254, 240, 138); // Pale Gold
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('ITIHAS GYAN — HISTORICAL MAP & CHRONOLOGICAL ATLAS', pageWidth / 2, 12, { align: 'center' });

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(`${map.title} (${map.era}) — Frame ${currentFrame.frameNumber}: ${currentFrame.yearDisplay}`, pageWidth / 2, 20, { align: 'center' });

  // 2. Overview Meta Card
  doc.setDrawColor(180, 83, 9);
  doc.setFillColor(254, 252, 232); // Parchment cream
  doc.roundedRect(12, 32, pageWidth - 24, 22, 2, 2, 'FD');

  doc.setTextColor(69, 26, 3);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(`Stage / Ruler: ${currentFrame.ruler.name} (${currentFrame.ruler.reignPeriod})`, 16, 40);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`Title / Subtitle: ${currentFrame.title} — ${currentFrame.subtitle}`, 16, 46);
  doc.text(`Territorial Extent: ${currentFrame.territorialExtentSqKm || 'N/A'} | Controlled Regions: ${currentFrame.controlledRegionIds.length}`, 16, 51);

  // 3. Ruler Achievements & Summary Box
  doc.setDrawColor(203, 213, 225);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(12, 58, 130, 68, 2, 2, 'FD');

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Ruler Achievements & Milestones:', 16, 65);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  let yPos = 72;
  currentFrame.ruler.achievements.slice(0, 4).forEach((ach) => {
    const splitLines = doc.splitTextToSize(`• ${ach}`, 120);
    doc.text(splitLines, 16, yPos);
    yPos += splitLines.length * 4.5;
  });

  // 4. Strategic Importance & Facts Box
  doc.setFillColor(255, 251, 235);
  doc.roundedRect(148, 58, pageWidth - 160, 68, 2, 2, 'FD');

  doc.setTextColor(146, 64, 14);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Historical Significance & Campaign Facts:', 152, 65);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(30, 41, 59);
  const sigLines = doc.splitTextToSize(currentFrame.ruler.historicalSignificance, pageWidth - 170);
  doc.text(sigLines, 152, 73);

  let factY = 73 + sigLines.length * 5;
  if (currentFrame.ruler.interestingFacts && currentFrame.ruler.interestingFacts.length > 0) {
    doc.setFont('helvetica', 'bold');
    doc.text('Did You Know?', 152, factY + 3);
    doc.setFont('helvetica', 'normal');
    const factLines = doc.splitTextToSize(`• ${currentFrame.ruler.interestingFacts[0]}`, pageWidth - 170);
    doc.text(factLines, 152, factY + 8);
  }

  // 5. Active Frame Conquered Territories Table
  const tableData = map.regions
    .filter(r => currentFrame.controlledRegionIds.includes(r.id))
    .map(r => [
      r.name,
      r.modernLocation,
      r.conqueringRuler,
      r.conquestYear,
      r.politicalStatus.replace('_', ' ').toUpperCase(),
      r.battlesInvolved
    ]);

  autoTable(doc, {
    startY: 132,
    head: [['Territory / Region', 'Modern Location', 'Conquering Ruler', 'Year', 'Political Status', 'Major Battles']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [120, 53, 15],
      textColor: [255, 255, 255],
      fontSize: 8.5,
      fontStyle: 'bold'
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: [30, 41, 59]
    },
    alternateRowStyles: {
      fillColor: [254, 249, 231]
    },
    margin: { left: 12, right: 12 }
  });

  // Page 2: Chronological Timeline Events of the Topic
  doc.addPage('landscape');

  // Page 2 Header
  doc.setFillColor(6, 78, 59); // Forest Emerald
  doc.rect(0, 0, pageWidth, 24, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(`CHRONOLOGICAL TIMELINE: ${map.title.toUpperCase()}`, pageWidth / 2, 12, { align: 'center' });
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Detailed Academic Record of Major Battles, Treaties, and Territorial Milestones', pageWidth / 2, 19, { align: 'center' });

  const timelineRows = map.events.map(ev => [
    ev.year,
    ev.eventTitle,
    ev.ruler,
    ev.location,
    ev.description,
    ev.impact
  ]);

  autoTable(doc, {
    startY: 28,
    head: [['Year / Era', 'Historical Event', 'Leader / Commander', 'Location', 'Historical Description', 'Significance & Aftermath']],
    body: timelineRows,
    theme: 'striped',
    headStyles: {
      fillColor: [6, 78, 59],
      textColor: [255, 255, 255],
      fontSize: 8.5,
      fontStyle: 'bold'
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [15, 23, 42]
    },
    margin: { left: 12, right: 12 },
    columnStyles: {
      0: { cellWidth: 24, fontStyle: 'bold' },
      1: { cellWidth: 38, fontStyle: 'bold' },
      2: { cellWidth: 35 },
      3: { cellWidth: 30 },
      4: { cellWidth: 80 },
      5: { cellWidth: 65 }
    }
  });

  // Footer on all pages
  const pageCount = doc.internal.pages.length - 1;
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(`ITIHAS GYAN — Smart Historical Interactive Atlas | Page ${i} of ${pageCount}`, pageWidth / 2, pageHeight - 6, { align: 'center' });
  }

  // Save PDF
  const cleanName = `${map.title}_Frame_${currentFrame.frameNumber}`.replace(/[^a-zA-Z0-9_\u0B00-\u0B7F]/g, '_');
  doc.save(`${cleanName}.pdf`);
}

/**
 * Intelligent AI Historical Map Generator
 * Generates a complete, functional, frame-by-frame historical animated map
 * either via Google Gemini API (when configured) or through our built-in
 * historical knowledge generation engine.
 */
export async function generateHistoricalMapAI(
  topic: string,
  yearRange?: string,
  customNotes?: string,
  apiKey?: string
): Promise<HistoricalMap> {
  const trimmed = topic.trim().toLowerCase();

  // Check if topic closely matches any existing built-ins
  if (trimmed.includes('mughal') || trimmed.includes('ମୋଗଲ')) {
    return { ...MUGHAL_MAP_DATA, id: `custom_mughal_${Date.now()}`, isBuiltin: false };
  }

  // 1. If Gemini API key is provided, attempt online generation
  if (apiKey && apiKey.trim().length > 10) {
    try {
      const generated = await callGeminiForMap(topic, yearRange, customNotes, apiKey);
      if (generated) return generated;
    } catch (err) {
      console.warn('Gemini map generation failed, falling back to intelligent historical synthesis:', err);
    }
  }

  // 2. Intelligent Offline Historical Synthesis
  return synthesizeOfflineHistoricalMap(topic, yearRange, customNotes);
}

/**
 * Classifies a user topic string into one of three categories:
 * - 'empire': Empires, Dynasties, Kingdoms, Territorial States
 * - 'figure': Historical Leaders, Reformers, Freedom Fighters
 * - 'movement': Movements, Satyagrahas, Revolts, Historical Events
 */
export function classifyHistoricalTopic(topic: string): 'empire' | 'figure' | 'movement' {
  const t = topic.trim().toLowerCase();

  // Figure keywords
  const figureKeywords = [
    'gandhi', 'mahatma', 'bapu', 'nehru', 'jawaharlal', 'subhas', 'subhash', 'bose', 'netaji',
    'patel', 'sardar', 'vallabhbhai', 'bhagat singh', 'lakshmibai', 'laxmibai', 'rani of jhansi',
    'tilak', 'lokmanya', 'ambedkar', 'babasaheb', 'vivekananda', 'ramakrishna', 'ram mohan roy',
    'bipin chandra', 'lala lajpat', 'chhatrapati shivaji', 'ranjit singh', 'tipu sultan',
    'birsa munda', 'buxi jagabandhu', 'bakshi jagabandhu', 'jayee rajguru', 'gopabandhu',
    'madhusudan', 'surendra sai', 'sarojini naidu', 'annie besant', 'dadabhai naoroji',
    'gokhale', 'rabindranath', 'tagore', 'abdul ghaffar', 'frontier gandhi', 'aurobindo',
    'mangal pandey', 'tatya tope', 'kunwar singh', 'hazrat mahal', 'bahadur shah', 'kabir',
    'chaitanya', 'mirabai', 'guru nanak', 'guru gobind', 'alluri sitarama', 'savarkar',
    'jyotirao phule', 'savitribai', 'periyar', 'narayana guru'
  ];

  // Movement / Event keywords
  const movementKeywords = [
    'movement', 'andolan', 'satyagraha', 'revolt', 'rebellion', 'uprising', 'mutiny',
    'revolution', 'struggle', 'independence', 'freedom', 'swadeshi', 'non-cooperation',
    'civil disobedience', 'quit india', 'salt march', 'dandi', 'paika', 'sepoy', '1857',
    'rowlatt', 'khilafat', 'bhakti', 'sufi', 'renaissance', 'swaraj', 'bhoodan', 'chipko',
    'champaran', 'kheda', 'bardoli', 'azad hind', 'ina', 'naval mutiny', 'home rule',
    'santhal', 'munda rebellion', 'indigo revolt', 'tebhaga', 'telangana movement', 'partition',
    'dharasana', 'inchudi', 'protest', 'campaign', 'boycott', 'march', 'assembly'
  ];

  // Empire / Dynasty keywords
  const empireKeywords = [
    'empire', 'dynasty', 'kingdom', 'sultanate', 'confederacy', 'samrajya', 'raj',
    'mughal', 'maurya', 'mauryan', 'gupta', 'chola', 'maratha', 'vijayanagara', 'delhi sultanate',
    'kalinga', 'british', 'east india company', 'pallava', 'chalukya', 'rashtrakuta', 'satavahana',
    'kushan', 'pala', 'sena', 'harsha', 'bahmani', 'ahom', 'rajput', 'sikh empire',
    'cheras', 'pandyas', 'hoysala', 'kakatiya', 'yadava', 'gajapati', 'eastern ganga', 'somavamshi'
  ];

  // Figures take precedence when specific leader names are detected
  if (t.includes('gandhi') || t.includes('mahatma') || t.includes('bapu') || t.includes('netaji') || t.includes('bose') || t.includes('patel')) {
    return 'figure';
  }

  if (movementKeywords.some(m => t.includes(m))) {
    return 'movement';
  }

  if (figureKeywords.some(k => t.includes(k))) {
    return 'figure';
  }

  if (empireKeywords.some(k => t.includes(k))) {
    return 'empire';
  }

  // Fallback heuristic: check names
  const words = t.split(/\s+/);
  if (words.some(w => ['singh', 'bose', 'gandhi', 'patel', 'nehru', 'tagore', 'azad', 'khan'].includes(w))) {
    return 'figure';
  }

  return 'empire';
}

/**
 * Call Gemini 1.5 Flash to generate a valid HistoricalMap JSON
 */
async function callGeminiForMap(
  topic: string,
  yearRange?: string,
  customNotes?: string,
  apiKey?: string
): Promise<HistoricalMap | null> {
  const category = classifyHistoricalTopic(topic);

  let contextualInstructions = '';
  if (category === 'figure') {
    contextualInstructions = `
CRITICAL RULES FOR HISTORICAL FIGURE ("${topic}"):
1. This is an eminent HISTORICAL FIGURE / LEADER, NOT a monarch, king, or emperor.
2. NEVER output phrases like "Founder of ${topic}", "Great Monarch of ${topic}", "Supreme Sovereign", or "Chakravartin".
3. NEVER use conquest/imperial language like "Imperial Subahs", "Siege of the Capital", or "Conquest of Ports".
4. The ruler object MUST represent the actual historical person (e.g., name: "${topic}", title: appropriate historical title like "Father of the Nation", "Netaji", "Sardar", "Freedom Pioneer", etc.).
5. Structure the 4-6 frames around their ACTUAL chronological life phases, satyagrahas, mass movements, rallies, or reforms (e.g. for Mahatma Gandhi: 1915-1919 Early Satyagrahas Champaran/Kheda, 1920-1922 Non-Cooperation, 1930-1934 Dandi Salt March & Civil Disobedience, 1942-1948 Quit India & Independence).
6. Controlled regions represent KEY ACTIVE CENTRES OF MASS ACTION (e.g., Gujarat/Sabarmati, Bihar/Champaran, Maharashtra/Wardha, Bengal/Noakhali, Delhi).
7. Important battles array must be used for HISTORIC CAMPAIGNS, CONFERENCES, AND SATYAGRAHAS (e.g., "Champaran Satyagraha", "Dandi March", "Round Table Conference").
8. Capital cities represent KEY HEADQUARTERS & ASHRAMS (e.g. Sabarmati Ashram, Sevagram, Anand Bhavan, Birla House).
`;
  } else if (category === 'movement') {
    contextualInstructions = `
CRITICAL RULES FOR HISTORICAL MOVEMENT / EVENT ("${topic}"):
1. This is a HISTORICAL MOVEMENT / EVENT, NOT a dynasty or empire.
2. NEVER use monarchic templates like "Founder of ${topic}" or "Monarch".
3. Structure the 4-6 frames around chronological phases of the movement: Inception & Causes, Provincial Spread & Mobilization, Peak Mass Agitation & Defiance, and Impact & National Legacy.
4. The ruler object should represent the Collective Leadership or prominent leaders of the movement.
5. Controlled regions represent EPICENTRES AND ACTIVE PROVINCES of the movement.
6. Important battles array represents MAJOR PROTESTS, SESSIONS, CONVENTIONS, OR MARCHES.
`;
  } else {
    contextualInstructions = `
CRITICAL RULES FOR EMPIRE / DYNASTY ("${topic}"):
1. Structure the 4-6 frames around chronological territorial foundation, expansion, and zenith of the empire/dynasty.
2. Name the actual historical founding and prominent monarchs (e.g., Chandragupta, Babur, Akbar, Shivaji, Rajaraja Chola, etc. based on the dynasty), NOT generic placeholder phrases like "Founder of ${topic}".
3. Frame stages around key conquests, provincial subahs, and administrative consolidation.
`;
  }

  const prompt = `
You are an expert Indian Cartographer and History Professor.
Generate a complete, high-quality, frame-by-frame Historical Map for the topic: "${topic}" (${yearRange || ''}).
Detected Topic Category: "${category}".
${customNotes ? `Additional Teacher Guidance: ${customNotes}` : ''}

${contextualInstructions}

Generate 4 to 6 chronological flipbook frames.
Use Indian subcontinent coordinates (viewBox "0 0 1000 850").
All SVG paths must be smooth, organic Bezier curves ('C' or 'Q' commands) covering realistic geographic zones on the Indian subcontinent map.

Return ONLY valid JSON matching this schema:
{
  "id": "map_${Date.now()}",
  "title": "${topic} Chronological Atlas",
  "odiaTitle": "ମାନଚିତ୍ର: ${topic}",
  "topic": "${topic}",
  "era": "${yearRange || 'Historical Era'}",
  "category": "${category}",
  "description": "Historical flipbook progression of ${topic}.",
  "baseMapType": "subcontinent",
  "viewBox": "0 0 1000 850",
  "regions": [
    {
      "id": "region_1",
      "name": "Region / Centre Name",
      "modernLocation": "Location",
      "previousRulerOrDynasty": "Previous Context",
      "conqueringRuler": "Key Leader or Ruler",
      "conquestYear": "Year",
      "battlesInvolved": "Major Event or Campaign",
      "historicalBackground": "Detailed academic background",
      "conquestReasons": "Significance and objectives",
      "historicalSignificance": "Significance",
      "aftermathAndRebellions": "Aftermath or Impact",
      "politicalStatus": "direct_annexation",
      "svgPath": "M 315,215 C 375,205 445,215 480,240 C 495,285 485,340 460,370 C 410,385 350,380 320,350 C 305,310 300,260 315,215 Z",
      "labelCoordinates": { "x": 395, "y": 290 },
      "fillColor": "#10b981"
    }
  ],
  "frames": [
    {
      "id": "frame_1",
      "frameNumber": 1,
      "yearDisplay": "Year",
      "title": "Stage Title",
      "subtitle": "Subtitle",
      "ruler": {
        "name": "Leader or Ruler Name",
        "reignPeriod": "Period",
        "title": "Historical Title",
        "achievements": ["Achievement 1", "Achievement 2"],
        "importantBattles": ["Event or Campaign 1"],
        "capitals": ["Headquarters or Capital"],
        "historicalSignificance": "Significance",
        "interestingFacts": ["Fact 1"]
      },
      "controlledRegionIds": ["region_1"],
      "newlyAcquiredRegionIds": ["region_1"],
      "campaignVectors": [],
      "cities": [{ "name": "Key City", "x": 395, "y": 290, "type": "capital" }],
      "summaryText": "Stage summary text",
      "territorialExtentSqKm": "~1.5 Million Sq Km"
    }
  ],
  "events": [
    {
      "year": "Year",
      "frameIndex": 0,
      "eventTitle": "Event",
      "ruler": "Leader / Ruler",
      "location": "Location",
      "description": "Description",
      "impact": "Impact"
    }
  ]
}
`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: 'application/json' }
    })
  });

  if (!response.ok) {
    throw new Error(`Gemini HTTP error ${response.status}`);
  }

  const data = await response.json();
  const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!rawText) return null;

  const parsed = JSON.parse(rawText) as HistoricalMap;
  return {
    ...parsed,
    category,
    geographicFeatures: {
      rivers: SUBCONTINENT_RIVERS,
      seas: SUBCONTINENT_SEAS
    },
    isBuiltin: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

/**
 * Intelligent Offline Synthesis Engine for Custom Historical Topics
 */
function synthesizeOfflineHistoricalMap(
  topic: string,
  yearRange?: string,
  notes?: string
): HistoricalMap {
  const category = classifyHistoricalTopic(topic);
  const t = topic.toLowerCase();

  // 1. Dedicated synthesis for Mahatma Gandhi
  if (t.includes('gandhi') || t.includes('mahatma') || t.includes('bapu')) {
    return buildGandhiHistoricalMap(topic, yearRange, notes);
  }

  // 2. Dedicated synthesis for Netaji Subhas Chandra Bose
  if (t.includes('subhas') || t.includes('netaji') || t.includes('bose')) {
    return buildNetajiHistoricalMap(topic, yearRange, notes);
  }

  // 3. Category-specific synthesis
  if (category === 'figure') {
    return buildGenericFigureHistoricalMap(topic, yearRange, notes);
  }

  if (category === 'movement') {
    return buildGenericMovementHistoricalMap(topic, yearRange, notes);
  }

  // 4. Default Empire / Territorial Dynasty
  return buildGenericEmpireHistoricalMap(topic, yearRange, notes);
}

/**
 * Dedicated Realistic Historical Atlas for Mahatma Gandhi
 */
function buildGandhiHistoricalMap(
  topic: string,
  yearRange?: string,
  notes?: string
): HistoricalMap {
  const mapId = `custom_gandhi_${Date.now()}`;
  const eraText = yearRange || '1915–1948 CE';

  const regions: HistoricalRegion[] = [
    {
      id: 'gandhi_gujarat',
      name: 'Gujarat & Western Epicentre (Sabarmati & Dandi)',
      modernLocation: 'Gujarat (Ahmedabad, Dandi, Porbandar, Kheda, Surat)',
      previousRulerOrDynasty: 'British Bombay Presidency / Princely States',
      conqueringRuler: 'Mahatma Gandhi & Sardar Vallabhbhai Patel',
      conquestYear: '1915–1948 CE',
      battlesInvolved: 'Ahmedabad Mill Strike (1918), Kheda Satyagraha (1918), Dandi Salt March (1930)',
      historicalBackground: 'Home state of Gandhiji. Sabarmati Ashram became the spiritual and political nerve centre of India’s non-violent freedom struggle.',
      conquestReasons: 'Nursery of Satyagraha; site of the historic 24-day 241-mile Dandi Salt March that challenged the British Empire.',
      historicalSignificance: 'Transformed ordinary villagers, farmers, and women into frontline freedom fighters through truth and non-violence.',
      aftermathAndRebellions: 'Sabarmati served as national headquarters until Gandhi pledged never to return until India achieved complete independence (Purna Swaraj).',
      politicalStatus: 'direct_annexation',
      svgPath: 'M 215,360 C 265,345 320,340 355,360 C 365,405 355,445 335,475 C 290,490 250,515 215,515 C 180,485 180,425 215,360 Z',
      labelCoordinates: { x: 260, y: 410 },
      fillColor: '#10b981'
    },
    {
      id: 'gandhi_bihar',
      name: 'Bihar & Champaran (First Civil Disobedience)',
      modernLocation: 'Bihar (Champaran, Motihari, Bettiah, Patna)',
      previousRulerOrDynasty: 'British Indigo Planters & Bengal Presidency',
      conqueringRuler: 'Mahatma Gandhi, Dr. Rajendra Prasad & J.B. Kripalani',
      conquestYear: '1917 CE onwards',
      battlesInvolved: 'Champaran Indigo Satyagraha (1917)',
      historicalBackground: 'Raj Kumar Shukla persuaded Gandhi to visit Champaran to witness the severe exploitation of tenant farmers under the British Tinkathia system.',
      conquestReasons: 'Abolition of forced indigo planting; demonstration of non-violent civil disobedience on Indian soil for the first time.',
      historicalSignificance: 'India’s first successful Satyagraha; forced British authorities to appoint an inquiry commission and abolish Tinkathia.',
      aftermathAndRebellions: 'Forged lifelong partnerships with future President Dr. Rajendra Prasad and established grassroots primary schools in rural villages.',
      politicalStatus: 'direct_annexation',
      svgPath: 'M 495,270 C 565,260 635,265 675,285 C 695,310 685,340 655,360 C 600,370 545,355 510,330 C 490,305 485,285 495,270 Z',
      labelCoordinates: { x: 575, y: 310 },
      fillColor: '#38bdf8'
    },
    {
      id: 'gandhi_maharashtra',
      name: 'Maharashtra & Central Hub (Wardha & Bombay)',
      modernLocation: 'Maharashtra & Central Provinces (Mumbai, Wardha Sevagram, Pune)',
      previousRulerOrDynasty: 'British Central Administration & Bombay Presidency',
      conqueringRuler: 'Mahatma Gandhi, Kasturba Gandhi, Vinoba Bhave',
      conquestYear: '1920–1945 CE',
      battlesInvolved: 'Gowalia Tank Quit India (1942), Poona Pact (1932)',
      historicalBackground: 'Sevagram Ashram near Wardha became Gandhi’s national headquarters from 1936. Bombay was the launchpad for Quit India.',
      conquestReasons: 'Geographic heart of India; centre for rural sanitation, Khadi spinning, and Dalit upliftment (Harijan Sevak Sangh).',
      historicalSignificance: 'Site where the historic "Do or Die" (Karo ya Maro) speech was delivered on 8 August 1942 at Gowalia Tank Maidan.',
      aftermathAndRebellions: 'British arrested the entire Congress Working Committee; Gandhi was detained at Aga Khan Palace, Pune.',
      politicalStatus: 'direct_annexation',
      svgPath: 'M 270,490 C 330,480 390,485 440,510 C 460,540 450,580 420,610 C 370,620 320,605 285,570 C 265,540 260,510 270,490 Z',
      labelCoordinates: { x: 350, y: 545 },
      fillColor: '#f59e0b'
    },
    {
      id: 'gandhi_eastern_bengal_odisha',
      name: 'Eastern Resistance (Bengal, Odisha & Noakhali)',
      modernLocation: 'Bengal & Odisha (Kolkata, Noakhali, Cuttack, Inchudi Balasore)',
      previousRulerOrDynasty: 'British Bengal Presidency & Salt Commissioners',
      conqueringRuler: 'Mahatma Gandhi, Gopabandhu Das, Rama Devi',
      conquestYear: '1921–1947 CE',
      battlesInvolved: 'Calcutta Congress (1920), Inchudi Salt Satyagraha (1930), Noakhali Peace Mission (1946–47)',
      historicalBackground: 'Gandhi visited Odisha repeatedly (1921, 1927, 1934 Harijan Padayatra), walking barefoot. Later he conducted his historic peace mission in riot-affected Noakhali.',
      conquestReasons: 'Odisha was the second major salt satyagraha hub at Inchudi; Bengal was key for communal harmony during the trauma of partition.',
      historicalSignificance: 'Maintained communal peace through sheer moral authority and fasting as a "one-man boundary force" in Calcutta and Noakhali.',
      aftermathAndRebellions: 'Demonstrated the highest ideal of Ahimsa by walking unprotected among hostile mobs to restore communal brotherhood.',
      politicalStatus: 'direct_annexation',
      svgPath: 'M 565,370 C 640,360 725,365 790,390 C 810,430 780,480 730,510 C 665,520 600,485 570,440 C 555,405 555,385 565,370 Z',
      labelCoordinates: { x: 675, y: 440 },
      fillColor: '#ec4899'
    },
    {
      id: 'gandhi_delhi_up',
      name: 'Delhi & Northern Corridors (Heart of the Nation)',
      modernLocation: 'Delhi, Uttar Pradesh (New Delhi, Chauri Chaura, Allahabad)',
      previousRulerOrDynasty: 'British Imperial Capital & United Provinces',
      conqueringRuler: 'Mahatma Gandhi, Jawaharlal Nehru, Maulana Azad',
      conquestYear: '1919–1948 CE',
      battlesInvolved: 'Anti-Rowlatt Satyagraha (1919), Gandhi-Irwin Talks (1931), Birla House Martyrdom (1948)',
      historicalBackground: 'Seat of Viceroy negotiations, Round Table preparations, and the final prayer meetings at Birla House, New Delhi.',
      conquestReasons: 'Direct confrontation with British viceregal authority and central coordination of the national independence movement.',
      historicalSignificance: 'Symbol of moral triumph over imperial power; site of Gandhi’s final fast for Hindu-Muslim unity and supreme sacrifice.',
      aftermathAndRebellions: 'India attained freedom on 15 August 1947; Gandhi was martyred on 30 January 1948, leaving an eternal global legacy of non-violence.',
      politicalStatus: 'direct_annexation',
      svgPath: 'M 350,210 C 420,205 480,215 520,240 C 535,275 520,310 480,330 C 430,340 380,330 350,300 C 335,265 335,230 350,210 Z',
      labelCoordinates: { x: 425, y: 265 },
      fillColor: '#8b5cf6'
    }
  ];

  const frames: HistoricalFrame[] = [
    {
      id: `${mapId}_frame_1`,
      frameNumber: 1,
      yearDisplay: '1915–1919 CE',
      title: 'Arrival in India & The Early Satyagrahas',
      subtitle: 'Champaran Indigo, Ahmedabad Mill Strike & Kheda Peasant Resistance',
      ruler: {
        name: 'Mahatma Gandhi (Mohandas Karamchand Gandhi)',
        odiaName: 'ମହାତ୍ମା ଗାନ୍ଧୀ',
        reignPeriod: '1915–1919 CE (Emergence)',
        title: 'Pioneer of Satyagraha & Ahimsa',
        achievements: [
          'Returned from South Africa in January 1915 after 21 years of civil rights activism',
          'Established the Satyagraha Ashram at Kochrab and later Sabarmati (Ahmedabad)',
          'Led Champaran Satyagraha (1917) ending the oppressive Tinkathia indigo system',
          'Undertook hunger strike for Ahmedabad textile mill workers securing a 35% wage hike (1918)',
          'Led the Kheda Peasant Satyagraha (1918) against tax extortion during crop failure'
        ],
        importantBattles: [
          'Champaran Indigo Satyagraha (1917)',
          'Ahmedabad Textile Mill Strike (1918)',
          'Kheda Peasant Satyagraha (1918)',
          'Anti-Rowlatt Act Hartal (April 1919)'
        ],
        capitals: ['Sabarmati Ashram (Ahmedabad)'],
        historicalSignificance: 'Transformed Indian politics from elite legal petitions into a mass participatory movement rooted in truth, fearless moral courage, and non-violence.',
        interestingFacts: [
          'Rabindranath Tagore conferred the revered title "Mahatma" (Great Soul) upon him in 1915.',
          'Travelled across India third-class by train for an entire year on Gopal Krishna Gokhale’s advice to understand rural India.'
        ]
      },
      controlledRegionIds: ['gandhi_gujarat', 'gandhi_bihar'],
      newlyAcquiredRegionIds: ['gandhi_gujarat', 'gandhi_bihar'],
      campaignVectors: [
        {
          id: 'vector_champaran',
          name: 'Journey to Champaran (Bihar)',
          from: { x: 235, y: 395 },
          to: { x: 550, y: 295 },
          path: 'M 235,395 Q 400,320 550,295',
          year: '1917',
          description: 'Gandhi travelled from Gujarat to Champaran with Raj Kumar Shukla to investigate peasant grievances.',
          commander: 'Mahatma Gandhi'
        }
      ],
      cities: [
        { name: 'Sabarmati (Ahmedabad)', odiaName: 'ସବରମତୀ', x: 235, y: 395, type: 'capital' },
        { name: 'Champaran', odiaName: 'ଚମ୍ପାରଣ', x: 550, y: 295, type: 'city' },
        { name: 'Kheda', odiaName: 'ଖେଡ଼ା', x: 245, y: 420, type: 'city' },
        { name: 'Bombay', odiaName: 'ବମ୍ବେ', x: 275, y: 520, type: 'port' }
      ],
      summaryText: 'Gandhiji returns from South Africa and conducts his landmark early experiments with Satyagraha in Champaran, Ahmedabad, and Kheda, proving the invincible power of non-violence.',
      territorialExtentSqKm: 'National Grassroots Reach'
    },
    {
      id: `${mapId}_frame_2`,
      frameNumber: 2,
      yearDisplay: '1920–1922 CE',
      title: 'The Pan-Indian Non-Cooperation Movement',
      subtitle: 'Khilafat Alliance, Boycott of British Titles, Khadi & Mass Mobilization',
      ruler: {
        name: 'Mahatma Gandhi',
        odiaName: 'ମହାତ୍ମା ଗାନ୍ଧୀ',
        reignPeriod: '1920–1922 CE',
        title: 'Leader of the Indian National Movement',
        achievements: [
          'Forged Hindu-Muslim solidarity through alliance with the Khilafat Movement',
          'Called for surrender of British titles, boycott of government schools, law courts, and foreign cloth',
          'Promoted the spinning wheel (Charkha) and hand-woven Khadi as symbols of self-reliance',
          'Toured across India including Odisha (Cuttack, Puri) in March 1921 inspiring mass participation'
        ],
        importantBattles: [
          'Calcutta & Nagpur Congress Sessions (1920)',
          'Nationwide Boycott of Prince of Wales Visit (1921)',
          'Chauri Chaura Incident & Moral Withdrawal (Feb 1922)'
        ],
        capitals: ['Sabarmati Ashram (Ahmedabad)'],
        historicalSignificance: 'First true pan-Indian mass movement that shook the foundations of British imperial administration and erased the fear of colonial authority from ordinary minds.',
        interestingFacts: [
          'Adopted the simple loincloth (dhoti) in Madurai (September 1921) to identify permanently with India’s poorest peasants.',
          'Suspended the entire movement following violence at Chauri Chaura, proving moral principles outweighed political opportunism.'
        ]
      },
      controlledRegionIds: ['gandhi_gujarat', 'gandhi_bihar', 'gandhi_delhi_up', 'gandhi_eastern_bengal_odisha'],
      newlyAcquiredRegionIds: ['gandhi_delhi_up', 'gandhi_eastern_bengal_odisha'],
      campaignVectors: [
        {
          id: 'vector_odisha_tour',
          name: 'Non-Cooperation Tour to Odisha & Bengal',
          from: { x: 425, y: 265 },
          to: { x: 675, y: 440 },
          path: 'M 425,265 Q 540,360 675,440',
          year: '1921',
          description: 'Gandhiji addressed massive public rallies at Kathajodi river bed in Cuttack and Puri, igniting the national spirit in Odisha.',
          commander: 'Mahatma Gandhi & Gopabandhu Das'
        }
      ],
      cities: [
        { name: 'Sabarmati', odiaName: 'ସବରମତୀ', x: 235, y: 395, type: 'capital' },
        { name: 'Delhi', odiaName: 'ଦିଲ୍ଲୀ', x: 360, y: 260, type: 'city' },
        { name: 'Chauri Chaura', odiaName: 'ଚୌରୀଚୌରା', x: 520, y: 280, type: 'battlefield' },
        { name: 'Cuttack', odiaName: 'କଟକ', x: 645, y: 490, type: 'city' },
        { name: 'Kolkata', odiaName: 'କୋଲକାତା', x: 740, y: 390, type: 'port' }
      ],
      summaryText: 'Non-Cooperation sweeps across India. Boycotts of foreign textiles and British institutions unite millions in peaceful civic defiance.',
      territorialExtentSqKm: 'Pan-Indian Mass Mobilization'
    },
    {
      id: `${mapId}_frame_3`,
      frameNumber: 3,
      yearDisplay: '1930–1934 CE',
      title: 'Civil Disobedience & The Historic Dandi Salt March',
      subtitle: 'The 241-Mile March to the Sea, Defiance of Salt Laws & Gandhi-Irwin Pact',
      ruler: {
        name: 'Mahatma Gandhi',
        odiaName: 'ମହାତ୍ମା ଗାନ୍ଧୀ',
        reignPeriod: '1930–1934 CE',
        title: 'Supreme Symbol of Civil Resistance',
        achievements: [
          'Marched 241 miles from Sabarmati to Dandi with 78 volunteers, breaking the Salt Law on 6 April 1930',
          'Inspired nationwide salt defiance including Inchudi in Odisha and Vedaranyam in Tamil Nadu',
          'Signed the Gandhi-Irwin Pact (March 1931) securing the release of thousands of political prisoners',
          'Represented the Indian National Congress at the Second Round Table Conference in London (1931)',
          'Negotiated the historic Poona Pact with Dr. B. R. Ambedkar in 1932 ensuring joint electorates'
        ],
        importantBattles: [
          'Dandi Salt March (12 March – 6 April 1930)',
          'Dharasana Salt Works Raid (May 1930)',
          'Second Round Table Conference, London (1931)',
          'Epic Fast at Yerwada Jail & Poona Pact (1932)'
        ],
        capitals: ['Sabarmati Ashram', 'Sevagram (Wardha)'],
        historicalSignificance: 'Demystified British imperial invincibility and demonstrated the immense power of non-violent civil disobedience to the global community.',
        interestingFacts: [
          'Time Magazine named Mahatma Gandhi "Man of the Year" in 1930 following the global impact of the Dandi March.',
          'Winston Churchill disparagingly called him a "half-naked fakir" as Gandhi climbed the steps of Buckingham Palace.'
        ]
      },
      controlledRegionIds: ['gandhi_gujarat', 'gandhi_bihar', 'gandhi_maharashtra', 'gandhi_eastern_bengal_odisha', 'gandhi_delhi_up'],
      newlyAcquiredRegionIds: ['gandhi_maharashtra'],
      campaignVectors: [
        {
          id: 'vector_dandi_march',
          name: 'The 241-Mile Dandi Salt March',
          from: { x: 235, y: 395 },
          to: { x: 245, y: 460 },
          path: 'M 235,395 Q 238,430 245,460',
          year: '1930',
          description: 'Gandhiji walked on foot for 24 days to Dandi beach, picking up a handful of salt to defy the British salt monopoly.',
          commander: 'Mahatma Gandhi'
        }
      ],
      cities: [
        { name: 'Sabarmati', odiaName: 'ସବରମତୀ', x: 235, y: 395, type: 'capital' },
        { name: 'Dandi Beach', odiaName: 'ଦାଣ୍ଡି କୂଳ', x: 245, y: 460, type: 'battlefield' },
        { name: 'Sevagram (Wardha)', odiaName: 'ସେବାଗ୍ରାମ (ୱାର୍ଦ୍ଧା)', x: 410, y: 470, type: 'capital' },
        { name: 'Inchudi (Balasore)', odiaName: 'ଇଞ୍ଚୁଡ଼ି (ବାଲେଶ୍ୱର)', x: 670, y: 460, type: 'battlefield' },
        { name: 'Pune (Yerwada)', odiaName: 'ପୁନେ (ୟରୱାଡ଼ା)', x: 300, y: 550, type: 'city' }
      ],
      summaryText: 'The Dandi Salt March electrifies the nation. Millions make illegal salt, face police lathi charges with non-violent discipline, and shatter the moral authority of the Raj.',
      territorialExtentSqKm: 'Subcontinental Civil Disobedience'
    },
    {
      id: `${mapId}_frame_4`,
      frameNumber: 4,
      yearDisplay: '1942–1948 CE',
      title: 'Quit India Movement, Peace Pilgrimage & Dawn of Independence',
      subtitle: '"Do or Die" at Gowalia Tank, Noakhali Mission & Supreme Martyrdom',
      ruler: {
        name: 'Mahatma Gandhi',
        odiaName: 'ମହାତ୍ମା ଗାନ୍ଧୀ',
        reignPeriod: '1942–1948 CE',
        title: 'Father of the Nation (Rashtrapita)',
        achievements: [
          'Gave the clarion call "Do or Die" (Karo ya Maro) at Gowalia Tank Maidan, Bombay on 8 August 1942',
          'Endured two years of imprisonment at Aga Khan Palace where Kasturba Gandhi and Mahadev Desai passed away',
          'Walked barefoot across riot-torn villages in Noakhali and Bihar spreading peace and communal amity',
          'Celebrated Indian Independence Day (15 August 1947) fasting in Kolkata for communal brotherhood',
          'Martyred on 30 January 1948 at Birla House, New Delhi, leaving an immortal legacy of peace'
        ],
        importantBattles: [
          'Quit India Resolution at Bombay (8 Aug 1942)',
          '21-Day Fast at Aga Khan Palace (1943)',
          'Noakhali Barefoot Peace Pilgrimage (1946–47)',
          'Calcutta Peace Fast (August–September 1947)'
        ],
        capitals: ['Sevagram (Wardha)', 'Birla House (New Delhi)'],
        historicalSignificance: 'The moral beacon who guided India to sovereign freedom and sacrificed his life to defend communal harmony, truth, and human dignity.',
        interestingFacts: [
          'Netaji Subhas Chandra Bose first addressed Gandhi as "Father of the Nation" from Singapore radio in July 1944.',
          'Albert Einstein famously remarked: "Generations to come will scarce believe that such a one as this ever in flesh and blood walked upon this earth."'
        ]
      },
      controlledRegionIds: ['gandhi_gujarat', 'gandhi_bihar', 'gandhi_maharashtra', 'gandhi_eastern_bengal_odisha', 'gandhi_delhi_up'],
      newlyAcquiredRegionIds: [],
      campaignVectors: [
        {
          id: 'vector_noakhali_peace',
          name: 'Barefoot Peace Mission in Noakhali',
          from: { x: 740, y: 390 },
          to: { x: 800, y: 410 },
          path: 'M 740,390 Q 770,400 800,410',
          year: '1946–1947',
          description: 'Gandhiji walked from village to village in East Bengal to douse communal violence with boundless love.',
          commander: 'Mahatma Gandhi'
        }
      ],
      cities: [
        { name: 'Bombay (Gowalia Tank)', odiaName: 'ଗୋୱାଲିଆ ଟ୍ୟାଙ୍କ', x: 275, y: 520, type: 'battlefield' },
        { name: 'Sevagram (Wardha)', odiaName: 'ସେବାଗ୍ରାମ', x: 410, y: 470, type: 'capital' },
        { name: 'Birla House (Delhi)', odiaName: 'ବିର୍ଲା ହାଉସ୍ (ଦିଲ୍ଲୀ)', x: 360, y: 260, type: 'capital' },
        { name: 'Noakhali', odiaName: 'ନୋଆଖାଲି', x: 800, y: 410, type: 'city' },
        { name: 'Kolkata', odiaName: 'କୋଲକାତା', x: 740, y: 390, type: 'city' }
      ],
      summaryText: 'The Quit India Movement delivers the decisive push for freedom. Amidst partition turmoil, Gandhi acts as a one-man boundary force of peace before attaining martyrdom.',
      territorialExtentSqKm: 'Free Sovereign Republic of India'
    }
  ];

  const events: ChronologicalEvent[] = [
    {
      year: '1915 CE',
      frameIndex: 0,
      eventTitle: 'Return to India from South Africa',
      ruler: 'Mahatma Gandhi',
      location: 'Bombay & Ahmedabad',
      description: 'Arrives in Bombay on 9 January; establishes Satyagraha Ashram at Sabarmati.',
      impact: 'Beginning of the Gandhian Era in the Indian national movement.'
    },
    {
      year: '1917 CE',
      frameIndex: 0,
      eventTitle: 'Champaran Indigo Satyagraha',
      ruler: 'Mahatma Gandhi',
      location: 'Champaran, Bihar',
      description: 'Leads tenant farmers against Tinkathia system, winning first major civil disobedience victory.',
      impact: 'Forced British planters to abolish forced indigo cultivation.'
    },
    {
      year: '1920 CE',
      frameIndex: 1,
      eventTitle: 'Launch of the Non-Cooperation Movement',
      ruler: 'Mahatma Gandhi',
      location: 'Calcutta & Nagpur',
      description: 'Congress approves non-violent non-cooperation; mass boycott of foreign cloth and British titles.',
      impact: 'India’s first nationwide mass anti-colonial mobilization.'
    },
    {
      year: '1922 CE',
      frameIndex: 1,
      eventTitle: 'Suspension after Chauri Chaura Incident',
      ruler: 'Mahatma Gandhi',
      location: 'Chauri Chaura & Bardoli',
      description: 'Gandhi unilaterally halts the movement after violence erupts at a police outpost in UP.',
      impact: 'Affirmed that moral integrity and non-violence superseded immediate political gains.'
    },
    {
      year: '1930 CE',
      frameIndex: 2,
      eventTitle: 'The Historic Dandi Salt March',
      ruler: 'Mahatma Gandhi',
      location: 'Sabarmati to Dandi, Gujarat',
      description: 'Walks 241 miles to the Arabian Sea and breaks the British salt law on 6 April.',
      impact: 'Triggered worldwide admiration and nationwide Civil Disobedience.'
    },
    {
      year: '1931 CE',
      frameIndex: 2,
      eventTitle: 'Gandhi-Irwin Pact & London Conference',
      ruler: 'Mahatma Gandhi & Lord Irwin',
      location: 'New Delhi & London',
      description: 'Pact signed releasing political prisoners; Gandhi attends Second Round Table Conference.',
      impact: 'British Raj compelled to negotiate with Gandhi as an equal.'
    },
    {
      year: '1942 CE',
      frameIndex: 3,
      eventTitle: 'Quit India Movement ("Do or Die")',
      ruler: 'Mahatma Gandhi',
      location: 'Gowalia Tank Maidan, Bombay',
      description: 'Demands immediate British withdrawal from India; calls on Indians to "Do or Die".',
      impact: 'Decisive mass uprising that rendered British continuation in India untenable.'
    },
    {
      year: '1947–48 CE',
      frameIndex: 3,
      eventTitle: 'Noakhali Peace Mission & Martyrdom',
      ruler: 'Mahatma Gandhi',
      location: 'Noakhali, Kolkata & New Delhi',
      description: 'Barefoot pilgrimage for communal brotherhood; assassinated at Birla House on 30 Jan 1948.',
      impact: 'Eternal global inspiration for civil rights, truth, and peace worldwide.'
    }
  ];

  return {
    id: mapId,
    title: `Mahatma Gandhi: Satyagraha, Mass Movements & Freedom (${eraText})`,
    odiaTitle: `ମହାତ୍ମା ଗାନ୍ଧୀ: ସତ୍ୟାଗ୍ରହ, ଜନଆନ୍ଦୋଳନ ଓ ସ୍ୱାଧୀନତା ସଂଗ୍ରାମ (${eraText})`,
    topic,
    era: eraText,
    category: 'figure',
    description: `Chronological flipbook animated atlas depicting Mahatma Gandhi’s historic leadership: Champaran, Non-Cooperation, Dandi Salt March, Quit India Movement, and his supreme martyrdom. ${notes ? `Teacher guidance: ${notes}` : ''}`,
    baseMapType: 'subcontinent',
    viewBox: '0 0 1000 850',
    regions,
    frames,
    events,
    geographicFeatures: {
      rivers: SUBCONTINENT_RIVERS,
      seas: SUBCONTINENT_SEAS
    },
    isBuiltin: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

/**
 * Dedicated Realistic Historical Atlas for Netaji Subhas Chandra Bose
 */
function buildNetajiHistoricalMap(
  topic: string,
  yearRange?: string,
  notes?: string
): HistoricalMap {
  const mapId = `custom_netaji_${Date.now()}`;
  const eraText = yearRange || '1938–1945 CE';

  const regions: HistoricalRegion[] = [
    {
      id: 'netaji_bengal_odisha',
      name: 'Bengal & Odisha (Birthplace & Early Leadership)',
      modernLocation: 'Cuttack, Kolkata, Haripura, Tripuri',
      previousRulerOrDynasty: 'British Bengal Presidency',
      conqueringRuler: 'Netaji Subhas Chandra Bose',
      conquestYear: '1897–1939 CE',
      battlesInvolved: 'Forward Bloc Formation (1939), Mayor of Calcutta',
      historicalBackground: 'Born in Cuttack, Odisha; graduated from Presidency College and Scottish Church College, Kolkata; elected twice as Congress President.',
      conquestReasons: 'Core base of revolutionary nationalism and organizational defiance against British imperialism.',
      historicalSignificance: 'Formed the Forward Bloc to unite radical anti-imperialist forces across India.',
      aftermathAndRebellions: 'Placed under house arrest in Elgin Road, Kolkata in 1940 before his historic daring escape.',
      politicalStatus: 'direct_annexation',
      svgPath: 'M 565,370 C 640,360 725,365 790,390 C 810,430 780,480 730,510 C 665,520 600,485 570,440 C 555,405 555,385 565,370 Z',
      labelCoordinates: { x: 675, y: 440 },
      fillColor: '#ec4899'
    },
    {
      id: 'netaji_escape_frontier',
      name: 'The Great Escape Corridor (North-West to Berlin)',
      modernLocation: 'Peshawar, Kabul, Moscow, Berlin',
      previousRulerOrDynasty: 'Tribal Frontier & Afghan Territory',
      conqueringRuler: 'Netaji Subhas Chandra Bose (Disguised as Ziauddin)',
      conquestYear: '1941 CE',
      battlesInvolved: 'Historic Great Escape from Elgin Road',
      historicalBackground: 'Escaped house arrest disguised as an insurance agent Ziauddin, trekked through the Hindu Kush to Kabul, and flew to Berlin.',
      conquestReasons: 'Enlisting international military alliances to liberate India from British rule.',
      historicalSignificance: 'Established the Free India Centre in Berlin and formed the Indian Legion with 3,000 Indian POWs.',
      aftermathAndRebellions: 'Undertook a hazardous 90-day submarine voyage from Germany to Japanese-controlled Sumatra in 1943.',
      politicalStatus: 'frontier_sphere',
      svgPath: 'M 140,110 C 200,85 270,95 320,130 C 330,170 315,210 280,230 C 230,240 180,225 150,195 C 130,165 125,135 140,110 Z',
      labelCoordinates: { x: 220, y: 155 },
      fillColor: '#8b5cf6'
    },
    {
      id: 'netaji_ina_southeast_asia',
      name: 'Provisional Government of Azad Hind (Singapore & Rangoon)',
      modernLocation: 'Singapore, Rangoon (Yangon), Andaman & Nicobar',
      previousRulerOrDynasty: 'British Malaya & Burma (Liberated with Japanese aid)',
      conqueringRuler: 'Netaji Subhas Chandra Bose & Rash Behari Bose',
      conquestYear: '1943–1945 CE',
      battlesInvolved: 'Establishment of Arzi Hukumat-e-Azad Hind (21 Oct 1943)',
      historicalBackground: 'Took supreme command of the Indian National Army (Azad Hind Fauj) with 60,000 soldiers including the Rani of Jhansi Regiment.',
      conquestReasons: 'Armed liberation of India through a direct military march ("Chalo Delhi").',
      historicalSignificance: 'First free Indian provisional government recognized by 9 sovereign nations; hoisted the Tricolour on liberated Andaman & Nicobar.',
      aftermathAndRebellions: 'Renamed Andaman as "Shaheed" and Nicobar as "Swaraj" Dweep in December 1943.',
      politicalStatus: 'direct_annexation',
      svgPath: 'M 760,430 C 820,440 860,470 880,510 C 875,560 835,600 790,620 C 750,600 740,550 745,500 C 750,460 755,440 760,430 Z',
      labelCoordinates: { x: 810, y: 520 },
      fillColor: '#10b981'
    },
    {
      id: 'netaji_imphal_kohima',
      name: 'North-East Frontier & Battle of Kohima-Imphal',
      modernLocation: 'Manipur (Moirang, Imphal), Nagaland (Kohima)',
      previousRulerOrDynasty: 'British Indian Eastern Army',
      conqueringRuler: 'INA (Col. Shaukat Malik) & Netaji',
      conquestYear: '1944 CE',
      battlesInvolved: 'Battle of Kohima, Siege of Imphal, Hoisting of Flag at Moirang',
      historicalBackground: 'Azad Hind Fauj pierced into Indian territory, hoisting the National Flag at Moirang on 14 April 1944.',
      conquestReasons: 'Breaching British eastern defenses to ignite an all-India armed revolution.',
      historicalSignificance: 'Bloodiest land battle fought on Indian soil in World War II; shook British morale to the core.',
      aftermathAndRebellions: 'Monsoon supply disruptions forced strategic retreat; subsequent Red Fort INA trials sparked nationwide naval and army mutinies that doomed British rule.',
      politicalStatus: 'direct_annexation',
      svgPath: 'M 820,290 C 865,280 895,310 900,345 C 895,380 870,410 840,415 C 815,400 805,360 810,330 C 812,305 815,295 820,290 Z',
      labelCoordinates: { x: 855, y: 350 },
      fillColor: '#f59e0b'
    }
  ];

  const frames: HistoricalFrame[] = [
    {
      id: `${mapId}_frame_1`,
      frameNumber: 1,
      yearDisplay: '1938–1939 CE',
      title: 'Congress Presidency & The Forward Bloc',
      subtitle: 'Haripura & Tripuri Sessions, Resignation & Radical Mobilization',
      ruler: {
        name: 'Netaji Subhas Chandra Bose',
        odiaName: 'ନେତାଜୀ ସୁଭାଷ ଚନ୍ଦ୍ର ବୋଷ',
        reignPeriod: '1938–1939 CE',
        title: 'President of the Indian National Congress',
        achievements: [
          'Elected Congress President at Haripura (1938) and re-elected at Tripuri (1939) defeating Pattabhi Sitaramayya',
          'Instituted the National Planning Committee (precursor to Planning Commission)',
          'Formed the Forward Bloc in May 1939 to consolidate left-wing anti-imperialist forces'
        ],
        importantBattles: ['Haripura & Tripuri Sessions', 'Holwell Monument Removal Satyagraha'],
        capitals: ['Kolkata (Elgin Road)'],
        historicalSignificance: 'Advocated complete, uncompromising independence through mass mobilization and state planning.',
        interestingFacts: ['Scored 4th rank in the prestigious Indian Civil Service (ICS) examination in England but resigned to serve the Motherland.']
      },
      controlledRegionIds: ['netaji_bengal_odisha'],
      newlyAcquiredRegionIds: ['netaji_bengal_odisha'],
      campaignVectors: [],
      cities: [
        { name: 'Kolkata', odiaName: 'କୋଲକାତା', x: 740, y: 390, type: 'capital' },
        { name: 'Cuttack', odiaName: 'କଟକ', x: 645, y: 490, type: 'city' }
      ],
      summaryText: 'Netaji leads the national movement with revolutionary vision, resigning the Congress presidency to launch the radical Forward Bloc.',
      territorialExtentSqKm: 'National Anti-Imperialist Front'
    },
    {
      id: `${mapId}_frame_2`,
      frameNumber: 2,
      yearDisplay: '1941–1943 CE',
      title: 'The Great Escape & International Alliance',
      subtitle: 'From Elgin Road to Kabul, Moscow, Berlin and the Submarine Voyage',
      ruler: {
        name: 'Netaji Subhas Chandra Bose',
        odiaName: 'ନେତାଜୀ ସୁଭାଷ ଚନ୍ଦ୍ର ବୋଷ',
        reignPeriod: '1941–1943 CE',
        title: 'Supreme Commander & Diplomat',
        achievements: [
          'Escaped British police surveillance in Kolkata in January 1941 disguised as Ziauddin',
          'Trek across the Hindu Kush and reached Berlin via Moscow',
          'Founded the Free India Centre and Azad Hind Radio in Berlin',
          'Completed the world’s only civilian submarine transfer in wartime from German U-180 to Japanese I-29'
        ],
        importantBattles: ['Great Escape from Elgin Road', 'Foundation of Indian Legion in Germany'],
        capitals: ['Berlin / Free India Centre'],
        historicalSignificance: 'Internationalized India’s freedom struggle, securing military commitments from Axis powers to overthrow the Raj.',
        interestingFacts: ['The popular patriotic greeting "Jai Hind" was coined by his lieutenant Chempakaraman Pillai and popularized by Netaji.']
      },
      controlledRegionIds: ['netaji_bengal_odisha', 'netaji_escape_frontier'],
      newlyAcquiredRegionIds: ['netaji_escape_frontier'],
      campaignVectors: [
        {
          id: 'vector_escape',
          name: 'The Great Escape Route',
          from: { x: 740, y: 390 },
          to: { x: 220, y: 155 },
          path: 'M 740,390 Q 450,220 220,155',
          year: '1941',
          description: 'Netaji slipped past British intelligence from Kolkata to Peshawar and Kabul.',
          commander: 'Netaji Subhas Chandra Bose'
        }
      ],
      cities: [
        { name: 'Kolkata', x: 740, y: 390, type: 'city' },
        { name: 'Peshawar', x: 240, y: 160, type: 'city' },
        { name: 'Kabul', x: 180, y: 135, type: 'capital' }
      ],
      summaryText: 'In one of the most audacious escapes in history, Netaji evades British spies to forge international military alliances.',
      territorialExtentSqKm: 'International Geopolitical Reach'
    },
    {
      id: `${mapId}_frame_3`,
      frameNumber: 3,
      yearDisplay: '1943–1944 CE',
      title: 'Provisional Government of Azad Hind & The INA',
      subtitle: '"Give Me Blood, and I Shall Give You Freedom" — Singapore & Rangoon',
      ruler: {
        name: 'Netaji Subhas Chandra Bose',
        odiaName: 'ନେତାଜୀ ସୁଭାଷ ଚନ୍ଦ୍ର ବୋଷ',
        reignPeriod: '1943–1944 CE',
        title: 'Head of State, Provisional Government of Azad Hind',
        achievements: [
          'Took command of the Indian National Army (INA) in Singapore on 4 July 1943',
          'Proclaimed the Provisional Government of Azad Hind on 21 October 1943',
          'Created the revolutionary all-women "Rani of Jhansi Regiment" led by Captain Lakshmi Sahgal',
          'Liberated Andaman & Nicobar Islands, renaming them "Shaheed" and "Swaraj" Dweep'
        ],
        importantBattles: ['Formation of Azad Hind Government', 'Liberation of Andaman & Nicobar (Dec 1943)'],
        capitals: ['Singapore', 'Rangoon (Burma)'],
        historicalSignificance: 'Established the first sovereign Indian government recognized by nine countries, issuing its own currency, passports, and civil administration.',
        interestingFacts: ['Delivered the immortal speech: "Tum mujhe khoon do, main tumhe aazadi doonga" in Burma on 4 July 1944.']
      },
      controlledRegionIds: ['netaji_bengal_odisha', 'netaji_ina_southeast_asia'],
      newlyAcquiredRegionIds: ['netaji_ina_southeast_asia'],
      campaignVectors: [],
      cities: [
        { name: 'Singapore', x: 810, y: 520, type: 'capital' },
        { name: 'Rangoon', x: 830, y: 460, type: 'capital' },
        { name: 'Port Blair', x: 770, y: 640, type: 'port' }
      ],
      summaryText: 'Netaji establishes the Provisional Government of Azad Hind in Singapore, mobilizing tens of thousands of Indian expatriates and soldiers.',
      territorialExtentSqKm: 'Free Sovereign Azad Hind Territory'
    },
    {
      id: `${mapId}_frame_4`,
      frameNumber: 4,
      yearDisplay: '1944–1945 CE',
      title: '"Chalo Delhi": Battle of Kohima-Imphal & The Final Dawn',
      subtitle: 'INA Flag Hoisted on Indian Soil at Moirang & Red Fort Trials Awakening',
      ruler: {
        name: 'Netaji Subhas Chandra Bose',
        odiaName: 'ନେତାଜୀ ସୁଭାଷ ଚନ୍ଦ୍ର ବୋଷ',
        reignPeriod: '1944–1945 CE',
        title: 'Supreme Commander of Azad Hind Fauj',
        achievements: [
          'Advanced across the Burmese jungle into Indian soil at Manipur and Nagaland',
          'Col. Shaukat Malik hoisted the Tricolour at Moirang, Manipur on 14 April 1944',
          'Heroic INA defense during the Battle of Kohima and Siege of Imphal',
          'The subsequent Red Fort INA trials of Sehgal, Dhillon, and Khan sparked the 1946 Royal Indian Navy Mutiny that forced Britain to quit India'
        ],
        importantBattles: ['Battle of Kohima', 'Siege of Imphal', 'Moirang Tricolour Flag Hoisting (1944)'],
        capitals: ['Rangoon', 'Moirang Base'],
        historicalSignificance: 'The armed bravery of the INA shattered the loyalty of the British Indian Army and Navy, making British imperial rule unviable.',
        interestingFacts: ['British Prime Minister Clement Attlee later acknowledged that the military uprising inspired by Netaji was the principal reason for the British exit in 1947.']
      },
      controlledRegionIds: ['netaji_bengal_odisha', 'netaji_ina_southeast_asia', 'netaji_imphal_kohima'],
      newlyAcquiredRegionIds: ['netaji_imphal_kohima'],
      campaignVectors: [
        {
          id: 'vector_chalo_delhi',
          name: 'The "Chalo Delhi" Military Advance',
          from: { x: 830, y: 460 },
          to: { x: 855, y: 350 },
          path: 'M 830,460 Q 840,400 855,350',
          year: '1944',
          description: 'INA columns fought through mountain jungles to liberate Indian soil at Kohima and Imphal.',
          commander: 'Netaji Subhas Chandra Bose'
        }
      ],
      cities: [
        { name: 'Moirang (Manipur)', odiaName: 'ମୋଇରାଙ୍ଗ', x: 855, y: 350, type: 'battlefield' },
        { name: 'Kohima', odiaName: 'କୋହିମା', x: 865, y: 330, type: 'battlefield' },
        { name: 'Kolkata', x: 740, y: 390, type: 'city' }
      ],
      summaryText: 'The Azad Hind Fauj raises the Tricolour on Indian soil. Though militarily outnumbered, Netaji’s crusade sparks the final wave that collapses British colonial rule.',
      territorialExtentSqKm: 'Free & United India'
    }
  ];

  const events: ChronologicalEvent[] = [
    {
      year: '1938 CE',
      frameIndex: 0,
      eventTitle: 'Congress President at Haripura',
      ruler: 'Netaji Subhas Chandra Bose',
      location: 'Haripura, Gujarat',
      description: 'Presides over the 51st Congress session; advocates national planning and economic self-sufficiency.',
      impact: 'Sets the agenda for rapid socialist industrialization.'
    },
    {
      year: '1939 CE',
      frameIndex: 0,
      eventTitle: 'Re-election & Forward Bloc Formation',
      ruler: 'Netaji Subhas Chandra Bose',
      location: 'Tripuri & Kolkata',
      description: 'Re-elected defeating Gandhi’s nominee; resigns to form the radical Forward Bloc.',
      impact: 'Unification of militant anti-imperialist forces.'
    },
    {
      year: '1941 CE',
      frameIndex: 1,
      eventTitle: 'The Great Escape from Kolkata',
      ruler: 'Netaji Subhas Chandra Bose',
      location: 'Kolkata to Kabul and Berlin',
      description: 'Daring escape in disguise through Afghanistan to Germany to organize an armed liberation army.',
      impact: 'Internationalization of the Indian freedom struggle.'
    },
    {
      year: '1943 CE',
      frameIndex: 2,
      eventTitle: 'Proclamation of Azad Hind Government',
      ruler: 'Netaji Subhas Chandra Bose',
      location: 'Singapore',
      description: 'Establishes Provisional Government and assumes supreme command of the Indian National Army.',
      impact: 'Formation of the Rani of Jhansi Regiment and mobilization of expatriate resources.'
    },
    {
      year: '1944 CE',
      frameIndex: 3,
      eventTitle: 'INA Flag Hoisted at Moirang',
      ruler: 'Netaji Subhas Chandra Bose',
      location: 'Moirang, Manipur',
      description: 'INA forces enter Indian territory, hoisting the Tricolour on liberated soil.',
      impact: 'Direct military challenge to the British Indian Empire.'
    },
    {
      year: '1945–46 CE',
      frameIndex: 3,
      eventTitle: 'Red Fort Trials & RIN Mutiny',
      ruler: 'Azad Hind Fauj Officers',
      location: 'Red Fort, Delhi & Bombay',
      description: 'Trials of INA commanders trigger widespread uprisings across the British Indian Navy and Army.',
      impact: 'Decisive blow forcing the British Cabinet to schedule immediate withdrawal from India.'
    }
  ];

  return {
    id: mapId,
    title: `Netaji Subhas Chandra Bose: Azad Hind Movement (${eraText})`,
    odiaTitle: `ନେତାଜୀ ସୁଭାଷ ଚନ୍ଦ୍ର ବୋଷ: ଆଜାଦ୍ ହିନ୍ଦ୍ ସଂଗ୍ରାମ (${eraText})`,
    topic,
    era: eraText,
    category: 'figure',
    description: `Chronological flipbook animated atlas documenting Netaji Subhas Chandra Bose’s leadership, the Great Escape, the Indian National Army (INA), and the "Chalo Delhi" march. ${notes ? `Teacher guidance: ${notes}` : ''}`,
    baseMapType: 'subcontinent',
    viewBox: '0 0 1000 850',
    regions,
    frames,
    events,
    geographicFeatures: {
      rivers: SUBCONTINENT_RIVERS,
      seas: SUBCONTINENT_SEAS
    },
    isBuiltin: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

/**
 * Intelligent Generic Historical Figure Atlas Builder
 * Cleanly structures leadership phases without ANY nonsensical monarch titles.
 */
function buildGenericFigureHistoricalMap(
  topic: string,
  yearRange?: string,
  notes?: string
): HistoricalMap {
  const mapId = `custom_figure_${Date.now()}`;
  const eraText = yearRange || 'Historical Era';
  const cleanTitle = topic.trim();

  const regions: HistoricalRegion[] = [
    {
      id: 'figure_core_base',
      name: `${cleanTitle} — Core Centre of Leadership`,
      modernLocation: 'Central & Regional Hub',
      previousRulerOrDynasty: 'Preceding Colonial / Regional Administration',
      conqueringRuler: cleanTitle,
      conquestYear: eraText.split('–')[0] || 'Early Period',
      battlesInvolved: 'Foundational Public Movement & Conventions',
      historicalBackground: `Initial organizational hub where ${cleanTitle} formulated strategy, mobilized public support, and established foundational institutions.`,
      conquestReasons: 'Civic reform, social justice, and national self-determination.',
      historicalSignificance: 'Nerve centre of mass rallies, educational initiatives, and public petitions.',
      aftermathAndRebellions: 'Inspired widespread grassroots branches across adjoining districts.',
      politicalStatus: 'direct_annexation',
      svgPath: 'M 315,215 C 375,205 445,215 480,240 C 495,285 485,340 460,370 C 410,385 350,380 320,350 C 305,310 300,260 315,215 Z',
      labelCoordinates: { x: 395, y: 290 },
      fillColor: '#10b981'
    },
    {
      id: 'figure_western_corridor',
      name: 'Western Public Outreach & Assembly',
      modernLocation: 'Western Regions & Urban Centres',
      previousRulerOrDynasty: 'Regional Administration',
      conqueringRuler: `${cleanTitle} & Associated Leaders`,
      conquestYear: 'Consolidation Period',
      battlesInvolved: 'Mass Civic Demonstrations & Boycotts',
      historicalBackground: 'Extension of the reform and national awakening movement to industrial and commercial hubs.',
      conquestReasons: 'Labor mobilization, civic participation, and financial backing for the national cause.',
      historicalSignificance: 'Built strong alliances among working classes, professionals, and youth cadres.',
      aftermathAndRebellions: 'Established lasting civic societies and reform leagues.',
      politicalStatus: 'direct_annexation',
      svgPath: 'M 215,360 C 265,345 320,340 355,360 C 365,405 355,445 335,475 C 290,490 250,515 215,515 C 180,485 180,425 215,360 Z',
      labelCoordinates: { x: 260, y: 400 },
      fillColor: '#38bdf8'
    },
    {
      id: 'figure_eastern_network',
      name: 'Eastern Solidarity & Agrarian Base',
      modernLocation: 'Eastern River Basins & Coastal Districts',
      previousRulerOrDynasty: 'Provincial Authorities',
      conqueringRuler: cleanTitle,
      conquestYear: 'Peak Movement Period',
      battlesInvolved: 'Peasant Conventions & Salt / Revenue Protests',
      historicalBackground: 'Mobilization of rural agricultural communities and cultural renaissance leaders.',
      conquestReasons: 'Uniting agrarian rights with national liberation.',
      historicalSignificance: 'Demonstrated widespread inter-community solidarity and popular defiance.',
      aftermathAndRebellions: 'Sustained underground literature and peaceful civil resistance.',
      politicalStatus: 'direct_annexation',
      svgPath: 'M 485,275 C 555,260 635,265 715,290 C 765,310 805,360 800,420 C 775,455 715,460 660,445 C 600,430 550,380 500,340 C 485,310 480,290 485,275 Z',
      labelCoordinates: { x: 620, y: 360 },
      fillColor: '#f59e0b'
    },
    {
      id: 'figure_peninsular_alliances',
      name: 'Peninsular Solidarity & National Spread',
      modernLocation: 'Peninsular & Southern Districts',
      previousRulerOrDynasty: 'Colonial Presidencies',
      conqueringRuler: `Delegates of ${cleanTitle}`,
      conquestYear: 'Climax Period',
      battlesInvolved: 'All-India National Conferences',
      historicalBackground: 'Integration of regional socio-political movements into a coherent national front.',
      conquestReasons: 'Complete subcontinental unity and universal democratic rights.',
      historicalSignificance: 'Solidified the pan-Indian character of the movement.',
      aftermathAndRebellions: 'Paved the way for constitutional progress and democratic self-governance.',
      politicalStatus: 'tributary_vassal',
      svgPath: 'M 315,530 C 385,520 470,525 550,545 C 605,570 635,620 605,670 C 565,710 485,735 420,740 C 360,715 325,640 305,570 C 300,545 305,535 315,530 Z',
      labelCoordinates: { x: 450, y: 560 },
      fillColor: '#ec4899'
    }
  ];

  const frames: HistoricalFrame[] = [
    {
      id: `${mapId}_frame_1`,
      frameNumber: 1,
      yearDisplay: 'Stage 1: Inception',
      title: `${cleanTitle}: Emergence & Foundational Awakening`,
      subtitle: 'Early Awakening, Philosophical Formulations & Initial Assemblies',
      ruler: {
        name: cleanTitle,
        reignPeriod: 'Foundational Period',
        title: 'Eminent Historical Figure & Visionary Leader',
        achievements: [
          `Formulated core ideological principles and public demands`,
          `Mobilized civic assemblies and educational circles`,
          `Established organizational headquarters and publication organs`
        ],
        importantBattles: ['Inaugural Civic Assembly & Petitions'],
        capitals: ['Primary Organizational Headquarters'],
        historicalSignificance: `Initiated a transformative phase of social and political awakening.`,
        interestingFacts: [`Known for steadfast personal integrity and inspiring public eloquence.`]
      },
      controlledRegionIds: ['figure_core_base'],
      newlyAcquiredRegionIds: ['figure_core_base'],
      campaignVectors: [],
      cities: [{ name: 'Headquarters Hub', x: 395, y: 290, type: 'capital' }],
      summaryText: `${cleanTitle} initiates the struggle, establishing a dedicated public following and organizational network.`,
      territorialExtentSqKm: 'Regional Sphere of Influence'
    },
    {
      id: `${mapId}_frame_2`,
      frameNumber: 2,
      yearDisplay: 'Stage 2: Mobilization',
      title: `${cleanTitle}: Broadening the Base of Struggle`,
      subtitle: 'Western & Urban Outreach, Civic Defiance and Grassroots Alliances',
      ruler: {
        name: cleanTitle,
        reignPeriod: 'Expansion Era',
        title: 'National Reformer & Mass Organizer',
        achievements: [
          `Organized mass conventions across provincial districts`,
          `Spearheaded civic resistance against unjust laws and monopolies`,
          `Unified youth, peasants, and intellectual vanguard`
        ],
        importantBattles: ['Mass Provincial Assemblies & Boycotts'],
        capitals: ['Primary Organizational Headquarters'],
        historicalSignificance: `Transformed a localized initiative into a powerful provincial movement.`,
        interestingFacts: [`Authored influential manifestos that circulated widely across Indian languages.`]
      },
      controlledRegionIds: ['figure_core_base', 'figure_western_corridor'],
      newlyAcquiredRegionIds: ['figure_western_corridor'],
      campaignVectors: [
        {
          id: 'vector_w',
          name: 'Public Outreach Campaign',
          from: { x: 395, y: 290 },
          to: { x: 260, y: 400 },
          path: 'M 395,290 Q 330,340 260,400',
          year: 'Expansion Period',
          description: `${cleanTitle} toured western districts addressing enthusiastic public gatherings.`,
          commander: cleanTitle
        }
      ],
      cities: [
        { name: 'Headquarters Hub', x: 395, y: 290, type: 'capital' },
        { name: 'Western Assembly City', x: 240, y: 410, type: 'city' }
      ],
      summaryText: `The movement expands into commercial corridors and industrial centers, drawing diverse sections of society into active participation.`,
      territorialExtentSqKm: 'Multi-Provincial Reach'
    },
    {
      id: `${mapId}_frame_3`,
      frameNumber: 3,
      yearDisplay: 'Stage 3: National Peak',
      title: `${cleanTitle}: Direct Action & National Agitation`,
      subtitle: 'Coordinated Defiance Across Eastern and Gangetic Hubs',
      ruler: {
        name: cleanTitle,
        reignPeriod: 'Peak Era',
        title: 'Supreme National Leader',
        achievements: [
          `Led nationwide demonstrations and peaceful civic strikes`,
          `Engaged in high-level negotiations representing public aspirations`,
          `Maintained unshakeable discipline in the face of colonial crackdowns`
        ],
        importantBattles: ['Direct Action Satyagraha & General Strike'],
        capitals: ['Primary Organizational Headquarters'],
        historicalSignificance: `Challenged the moral authority of the colonial state through disciplined civic defiance.`,
        interestingFacts: [`Demonstrated exceptional personal resilience through imprisonments and public trials.`]
      },
      controlledRegionIds: ['figure_core_base', 'figure_western_corridor', 'figure_eastern_network'],
      newlyAcquiredRegionIds: ['figure_eastern_network'],
      campaignVectors: [
        {
          id: 'vector_e',
          name: 'Eastern Agitation Vector',
          from: { x: 395, y: 290 },
          to: { x: 620, y: 360 },
          path: 'M 395,290 Q 500,310 620,360',
          year: 'Peak Era',
          description: `Spreading the message of liberty and self-reliance to eastern river valleys.`,
          commander: cleanTitle
        }
      ],
      cities: [
        { name: 'Headquarters Hub', x: 395, y: 290, type: 'capital' },
        { name: 'Eastern Convention Center', x: 630, y: 360, type: 'city' }
      ],
      summaryText: `Peak civic agitation reaches across eastern agricultural plains, demonstrating widespread national cohesion.`,
      territorialExtentSqKm: 'Subcontinental Mass Agitation'
    },
    {
      id: `${mapId}_frame_4`,
      frameNumber: 4,
      yearDisplay: 'Stage 4: National Legacy',
      title: `${cleanTitle}: Triumph & Enduring Historical Legacy`,
      subtitle: 'Consolidation of Democratic Values, Freedom and Enduring Impact',
      ruler: {
        name: cleanTitle,
        reignPeriod: 'Culmination Period',
        title: 'Architect of Freedom & National Hero',
        achievements: [
          `Achieved key constitutional concessions and democratic rights`,
          `Laid ideological foundations for a free and sovereign republic`,
          `Left an indelible imprint on human rights and ethical leadership worldwide`
        ],
        importantBattles: ['National Freedom Convention & Proclamation'],
        capitals: ['Primary Organizational Headquarters'],
        historicalSignificance: `Permanent national icon whose contributions shaped modern Indian history.`,
        interestingFacts: [`Statues, institutions, and commemorative days honor this visionary across India.`]
      },
      controlledRegionIds: [
        'figure_core_base',
        'figure_western_corridor',
        'figure_eastern_network',
        'figure_peninsular_alliances'
      ],
      newlyAcquiredRegionIds: ['figure_peninsular_alliances'],
      campaignVectors: [],
      cities: [
        { name: 'Headquarters Hub', x: 395, y: 290, type: 'capital' },
        { name: 'Peninsular Assembly Center', x: 440, y: 570, type: 'city' }
      ],
      summaryText: `The tireless dedication of ${cleanTitle} culminates in a lasting victory for liberty, leaving an enduring inspiration for future generations.`,
      territorialExtentSqKm: 'National Sovereign Legacy'
    }
  ];

  const events: ChronologicalEvent[] = [
    {
      year: eraText.split('–')[0] || 'Early Phase',
      frameIndex: 0,
      eventTitle: `Awakening & Early Leadership of ${cleanTitle}`,
      ruler: cleanTitle,
      location: 'Core Headquarters',
      description: `Inauguration of public reforms and civic organization under ${cleanTitle}.`,
      impact: 'Birth of a disciplined national movement.'
    },
    {
      year: 'Mobilization Phase',
      frameIndex: 1,
      eventTitle: 'Provincial Expansion & Civic Boycotts',
      ruler: cleanTitle,
      location: 'Western & Regional Centers',
      description: `Expansion of civic assemblies across trade routes and towns.`,
      impact: 'Substantial growth in grassroots participation.'
    },
    {
      year: 'Direct Action Phase',
      frameIndex: 2,
      eventTitle: 'National Agitation & Direct Civil Resistance',
      ruler: cleanTitle,
      location: 'Eastern Plains & National Centers',
      description: `Large-scale peaceful defiance of colonial authorities.`,
      impact: 'Decisive shift in public morale and political authority.'
    },
    {
      year: eraText.split('–')[1] || 'Culmination Phase',
      frameIndex: 3,
      eventTitle: 'National Triumph & Historic Legacy',
      ruler: cleanTitle,
      location: 'National Capital',
      description: `Fulfillment of core demands and establishment of an enduring national heritage.`,
      impact: 'Immortal inspiration for democracy, justice, and human freedom.'
    }
  ];

  return {
    id: mapId,
    title: `${cleanTitle}: Historical Journey & Legacy (${eraText})`,
    odiaTitle: `ମାନଚିତ୍ର: ${cleanTitle} (${eraText})`,
    topic,
    era: eraText,
    category: 'figure',
    description: `Chronological flipbook animated atlas depicting the life, mass movements, and historic legacy of ${cleanTitle}. ${notes ? `Teacher notes: ${notes}` : ''}`,
    baseMapType: 'subcontinent',
    viewBox: '0 0 1000 850',
    regions,
    frames,
    events,
    geographicFeatures: {
      rivers: SUBCONTINENT_RIVERS,
      seas: SUBCONTINENT_SEAS
    },
    isBuiltin: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

/**
 * Intelligent Generic Historical Movement Atlas Builder
 */
function buildGenericMovementHistoricalMap(
  topic: string,
  yearRange?: string,
  notes?: string
): HistoricalMap {
  const mapId = `custom_movement_${Date.now()}`;
  const eraText = yearRange || 'Historical Era';
  const cleanTitle = topic.trim();

  const regions: HistoricalRegion[] = [
    {
      id: 'mov_spark_epicentre',
      name: `${cleanTitle} — Primary Outbreak Epicentre`,
      modernLocation: 'Northern / Central Plains',
      previousRulerOrDynasty: 'Colonial / Feudal Authority',
      conqueringRuler: `Leaders of ${cleanTitle}`,
      conquestYear: eraText.split('–')[0] || 'Inception',
      battlesInvolved: 'First Outbreak & Mass Proclamation',
      historicalBackground: `Where the initial sparks of ${cleanTitle} ignited, rallying citizens against grievances and foreign domination.`,
      conquestReasons: 'Defiance of unjust taxation, military oppression, and cultural subjugation.',
      historicalSignificance: 'Ignited a chain reaction of popular revolts across the subcontinent.',
      aftermathAndRebellions: 'Authorities declared martial law but failed to stem public defiance.',
      politicalStatus: 'direct_annexation',
      svgPath: 'M 315,215 C 375,205 445,215 480,240 C 495,285 485,340 460,370 C 410,385 350,380 320,350 C 305,310 300,260 315,215 Z',
      labelCoordinates: { x: 395, y: 290 },
      fillColor: '#f43f5e'
    },
    {
      id: 'mov_western_front',
      name: 'Western Front & Urban Solidarities',
      modernLocation: 'Western Towns & Trade Passages',
      previousRulerOrDynasty: 'Colonial Presidencies',
      conqueringRuler: 'Local Revolutionary Committees',
      conquestYear: 'Spread Period',
      battlesInvolved: 'General Strikes & Civilian Boycotts',
      historicalBackground: 'Commercial guilds, port workers, and student unions joined the general agitation.',
      conquestReasons: 'Economic paralysis of the colonial state machinery.',
      historicalSignificance: 'Demonstrated inter-regional solidarity between agrarian and urban workers.',
      aftermathAndRebellions: 'Paralyzed government rail, telegraph, and revenue channels.',
      politicalStatus: 'direct_annexation',
      svgPath: 'M 215,360 C 265,345 320,340 355,360 C 365,405 355,445 335,475 C 290,490 250,515 215,515 C 180,485 180,425 215,360 Z',
      labelCoordinates: { x: 260, y: 400 },
      fillColor: '#8b5cf6'
    },
    {
      id: 'mov_eastern_basin',
      name: 'Eastern Agrarian Revolt Zone',
      modernLocation: 'Eastern Riverine Districts',
      previousRulerOrDynasty: 'Land Revenue Commissioners',
      conqueringRuler: 'Peasant & Tribal Assemblies',
      conquestYear: 'Peak Agitation',
      battlesInvolved: 'Armed Resistance & Burning of Revenue Records',
      historicalBackground: 'Peasants and forest-dwelling communities refused rent and defied colonial forest acts.',
      conquestReasons: 'Agrarian autonomy and freedom from ruthless moneylenders and colonial agents.',
      historicalSignificance: 'Turned the movement into a deep grassroots revolution.',
      aftermathAndRebellions: 'Parallel peoples’ courts established in liberated villages.',
      politicalStatus: 'direct_annexation',
      svgPath: 'M 485,275 C 555,260 635,265 715,290 C 765,310 805,360 800,420 C 775,455 715,460 660,445 C 600,430 550,380 500,340 C 485,310 480,290 485,275 Z',
      labelCoordinates: { x: 620, y: 360 },
      fillColor: '#f59e0b'
    },
    {
      id: 'mov_peninsular_wave',
      name: 'Peninsular Solidarity & Mass Marches',
      modernLocation: 'Southern & Deccan Districts',
      previousRulerOrDynasty: 'Provincial Governorships',
      conqueringRuler: 'Regional Movement Coordinators',
      conquestYear: 'Culmination',
      battlesInvolved: 'Provincial Demonstrations & Memorial Rallies',
      historicalBackground: 'Peninsular communities organized extensive marches in solidarity with northern and eastern freedom fighters.',
      conquestReasons: 'Total subcontinental solidarity against colonial misrule.',
      historicalSignificance: 'Ensured that the British Raj faced unrest in every corner of India.',
      aftermathAndRebellions: 'Forced authorities to grant major political reforms and repeal oppressive laws.',
      politicalStatus: 'tributary_vassal',
      svgPath: 'M 315,530 C 385,520 470,525 550,545 C 605,570 635,620 605,670 C 565,710 485,735 420,740 C 360,715 325,640 305,570 C 300,545 305,535 315,530 Z',
      labelCoordinates: { x: 450, y: 560 },
      fillColor: '#10b981'
    }
  ];

  const frames: HistoricalFrame[] = [
    {
      id: `${mapId}_frame_1`,
      frameNumber: 1,
      yearDisplay: 'Stage 1: Outbreak',
      title: `${cleanTitle}: Sparks & Inception`,
      subtitle: 'Popular Grievances, Initial Spark & Defiance of Authority',
      ruler: {
        name: `Leadership of ${cleanTitle}`,
        reignPeriod: 'Initial Outbreak',
        title: 'Peoples’ Collective Front',
        achievements: [
          'Unified discontented sections under a common revolutionary banner',
          'Issued proclamations defying colonial laws and taxation',
          'Established central coordination council'
        ],
        importantBattles: ['Initial Outbreak & Storming of Headquarters'],
        capitals: ['Primary Epicentre'],
        historicalSignificance: 'Shattered the calm of colonial hegemony, igniting widespread popular courage.',
        interestingFacts: ['Underground messages and symbols circulated covertly among village councils.']
      },
      controlledRegionIds: ['mov_spark_epicentre'],
      newlyAcquiredRegionIds: ['mov_spark_epicentre'],
      campaignVectors: [],
      cities: [{ name: 'Outbreak Epicentre', x: 395, y: 290, type: 'battlefield' }],
      summaryText: `The movement erupts with spontaneous public defiance, shattering colonial complacence.`,
      territorialExtentSqKm: 'Initial Outbreak Epicentre'
    },
    {
      id: `${mapId}_frame_2`,
      frameNumber: 2,
      yearDisplay: 'Stage 2: Provincial Spread',
      title: `${cleanTitle}: Rapid Spread Across Provinces`,
      subtitle: 'Strikes, Boycotts & Collapse of Colonial Rural Administration',
      ruler: {
        name: `Leadership of ${cleanTitle}`,
        reignPeriod: 'Expansion Phase',
        title: 'United Front Coordinators',
        achievements: [
          'Spread agitation to western trade hubs and urban centres',
          'Organized strikes paralyzing colonial rail and telegraph lines',
          'Formed parallel governing panchayats in liberated towns'
        ],
        importantBattles: ['Defiance of Martial Law & Public Demonstrations'],
        capitals: ['Primary Epicentre'],
        historicalSignificance: 'Turned a localized protest into a multi-provincial political storm.',
        interestingFacts: ['Women took frontline leadership roles leading protest marches.']
      },
      controlledRegionIds: ['mov_spark_epicentre', 'mov_western_front'],
      newlyAcquiredRegionIds: ['mov_western_front'],
      campaignVectors: [
        {
          id: 'vector_spread_w',
          name: 'Movement Expansion to the West',
          from: { x: 395, y: 290 },
          to: { x: 260, y: 400 },
          path: 'M 395,290 Q 330,340 260,400',
          year: 'Spread Phase',
          description: 'Revolutionary declarations disseminated across western towns.',
          commander: 'Revolutionary Committees'
        }
      ],
      cities: [
        { name: 'Outbreak Epicentre', x: 395, y: 290, type: 'battlefield' },
        { name: 'Western Strike Centre', x: 240, y: 410, type: 'city' }
      ],
      summaryText: `The uprising sweeps into commercial cities and districts, demonstrating irresistible mass momentum.`,
      territorialExtentSqKm: 'Multi-Provincial Resistance'
    },
    {
      id: `${mapId}_frame_3`,
      frameNumber: 3,
      yearDisplay: 'Stage 3: Peak Resistance',
      title: `${cleanTitle}: Peak Agitation & Parallel Governments`,
      subtitle: 'Agrarian Defiance Across Eastern Deltas & National Disruption',
      ruler: {
        name: `Leadership of ${cleanTitle}`,
        reignPeriod: 'Peak Resistance Phase',
        title: 'National Action Council',
        achievements: [
          'Peasants seized control of local administrative treasuries',
          'Burned debt records and colonial revenue registers',
          'Withstood severe military crackdowns with extraordinary courage'
        ],
        importantBattles: ['General Strike & Parallel Assembly Proclamations'],
        capitals: ['Primary Epicentre'],
        historicalSignificance: 'Represented the apex of popular defiance against colonial rule.',
        interestingFacts: ['Secret patriotic radio stations broadcast daily news and instructions to freedom fighters.']
      },
      controlledRegionIds: ['mov_spark_epicentre', 'mov_western_front', 'mov_eastern_basin'],
      newlyAcquiredRegionIds: ['mov_eastern_basin'],
      campaignVectors: [
        {
          id: 'vector_spread_e',
          name: 'Eastern Agitation Sweep',
          from: { x: 395, y: 290 },
          to: { x: 620, y: 360 },
          path: 'M 395,290 Q 500,310 620,360',
          year: 'Peak Phase',
          description: 'Mass uprising across eastern agricultural communities.',
          commander: 'Peasant Vanguard'
        }
      ],
      cities: [
        { name: 'Outbreak Epicentre', x: 395, y: 290, type: 'battlefield' },
        { name: 'Eastern Assembly Centre', x: 630, y: 360, type: 'city' }
      ],
      summaryText: `Peak agitation establishes parallel governments in liberated districts, defying the Raj completely.`,
      territorialExtentSqKm: 'Nationwide Revolutionary Sphere'
    },
    {
      id: `${mapId}_frame_4`,
      frameNumber: 4,
      yearDisplay: 'Stage 4: National Impact',
      title: `${cleanTitle}: Reforms, Impact & Historical Legacy`,
      subtitle: 'Irreversible Awakening, Collapse of Colonial Pretense & Enduring Victory',
      ruler: {
        name: `Leadership of ${cleanTitle}`,
        reignPeriod: 'Historic Culmination',
        title: 'National Liberators',
        achievements: [
          'Forced the colonial administration to repeal draconian ordinances',
          'Proved conclusively that India could no longer be governed without consent',
          'Accelerated the timeline for complete national independence'
        ],
        importantBattles: ['Final National Demonstration & Memorials'],
        capitals: ['National Capital'],
        historicalSignificance: 'A watershed moment in Indian historiography that irreversibly advanced the cause of freedom.',
        interestingFacts: ['The slogans and songs born during this struggle became national anthems of liberty.']
      },
      controlledRegionIds: [
        'mov_spark_epicentre',
        'mov_western_front',
        'mov_eastern_basin',
        'mov_peninsular_wave'
      ],
      newlyAcquiredRegionIds: ['mov_peninsular_wave'],
      campaignVectors: [],
      cities: [
        { name: 'Outbreak Epicentre', x: 395, y: 290, type: 'battlefield' },
        { name: 'Peninsular Solidarity Hub', x: 440, y: 570, type: 'city' }
      ],
      summaryText: `The profound impact of ${cleanTitle} makes British continuation impossible, setting the stage for national freedom.`,
      territorialExtentSqKm: 'Sovereign National Legacy'
    }
  ];

  const events: ChronologicalEvent[] = [
    {
      year: eraText.split('–')[0] || 'Inception Era',
      frameIndex: 0,
      eventTitle: `Outbreak of ${cleanTitle}`,
      ruler: `Pioneers of ${cleanTitle}`,
      location: 'Outbreak Epicentre',
      description: `First organized defiance against colonial authorities.`,
      impact: 'Ignited mass courage across adjoining provinces.'
    },
    {
      year: 'Expansion Period',
      frameIndex: 1,
      eventTitle: 'Provincial Expansion & General Strikes',
      ruler: 'Coordinating Committees',
      location: 'Western Towns & Trade Hubs',
      description: `Civilian boycotts and strikes paralyze colonial administration.`,
      impact: 'Broadened the struggle into a multi-class mass movement.'
    },
    {
      year: 'Peak Period',
      frameIndex: 2,
      eventTitle: 'Peak Agrarian Resistance & Parallel Governments',
      ruler: 'Peasant Vanguard',
      location: 'Eastern Plains & Forest Corridors',
      description: `Establishment of free peoples’ councils and burning of colonial registers.`,
      impact: 'Colonial government temporarily loses control over rural districts.'
    },
    {
      year: eraText.split('–')[1] || 'Resolution Era',
      frameIndex: 3,
      eventTitle: 'National Impact & Irreversible Awakening',
      ruler: 'National Liberators',
      location: 'All-India National Sphere',
      description: `The movement permanently alters the balance of power, paving the way for independence.`,
      impact: 'Eternal inspiration in the annals of Indian anti-colonial resistance.'
    }
  ];

  return {
    id: mapId,
    title: `${cleanTitle}: Historical Movement & Impact (${eraText})`,
    odiaTitle: `ମାନଚିତ୍ର: ${cleanTitle} (${eraText})`,
    topic,
    era: eraText,
    category: 'movement',
    description: `Chronological flipbook animated atlas detailing the outbreak, provincial spread, mass defiance, and historic impact of ${cleanTitle}. ${notes ? `Teacher notes: ${notes}` : ''}`,
    baseMapType: 'subcontinent',
    viewBox: '0 0 1000 850',
    regions,
    frames,
    events,
    geographicFeatures: {
      rivers: SUBCONTINENT_RIVERS,
      seas: SUBCONTINENT_SEAS
    },
    isBuiltin: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

/**
 * Intelligent Generic Historical Empire / Dynasty Atlas Builder
 * Cleanly structures monarchies and dynasties with authentic historical framing.
 */
function buildGenericEmpireHistoricalMap(
  topic: string,
  yearRange?: string,
  notes?: string
): HistoricalMap {
  const mapId = `custom_empire_${Date.now()}`;
  const eraText = yearRange || 'Historical Era';
  const cleanTitle = topic.trim();

  const regions: HistoricalRegion[] = [
    {
      id: 'custom_core_province',
      name: `${cleanTitle} — Imperial Heartland`,
      modernLocation: 'Northern / Central Subcontinent',
      previousRulerOrDynasty: 'Preceding Regional Feudatories',
      conqueringRuler: `Founding Monarch of the ${cleanTitle}`,
      conquestYear: eraText.split('–')[0] || 'Early Period',
      battlesInvolved: 'Foundational Campaign & Capital Fortification',
      historicalBackground: `Establishment of imperial administration and defensive fortifications under the founding monarchs of ${cleanTitle}.`,
      conquestReasons: 'Strategic central location, fertile agricultural plains, and key trade junction.',
      historicalSignificance: 'Formed the central hub of imperial power and dynastic legitimacy.',
      aftermathAndRebellions: 'Instituted administrative centralization, minting imperial coinage.',
      politicalStatus: 'direct_annexation',
      svgPath: 'M 315,215 C 375,205 445,215 480,240 C 495,285 485,340 460,370 C 410,385 350,380 320,350 C 305,310 300,260 315,215 Z',
      labelCoordinates: { x: 395, y: 290 },
      fillColor: '#6366f1'
    },
    {
      id: 'custom_western_march',
      name: 'Western Maritime Marches & Coast',
      modernLocation: 'Gujarat, Malwa & Western Corridors',
      previousRulerOrDynasty: 'Western Provincial Chieftains',
      conqueringRuler: 'Imperial Generals & Crown Prince',
      conquestYear: 'Middle Period',
      battlesInvolved: 'Western Plains Offensive',
      historicalBackground: 'Extension of control over maritime outlets and caravan routes connecting the hinterland to Arabian Sea ports.',
      conquestReasons: 'Vibrant maritime trade, customs tariffs, and securing natural western borders.',
      historicalSignificance: 'Infused wealth into the imperial treasury and brought access to overseas luxury imports.',
      aftermathAndRebellions: 'Established naval garrisons and commercial merchant guilds.',
      politicalStatus: 'direct_annexation',
      svgPath: 'M 215,360 C 265,345 320,340 355,360 C 365,405 355,445 335,475 C 290,490 250,515 215,515 C 180,485 180,425 215,360 Z',
      labelCoordinates: { x: 260, y: 400 },
      fillColor: '#8b5cf6'
    },
    {
      id: 'custom_eastern_basin',
      name: 'Eastern Delta & Riverine Subah',
      modernLocation: 'Eastern Plains, Bengal & Odisha Margins',
      previousRulerOrDynasty: 'Eastern Deltaic Rulers',
      conqueringRuler: 'Paramount Emperor',
      conquestYear: 'Peak Expansion Era',
      battlesInvolved: 'Riverine Fleet Campaigns',
      historicalBackground: 'Large-scale military mobilization across river valleys resulting in rich agrarian tribute.',
      conquestReasons: 'Abundant agricultural harvest, elephant recruitment, and Bay of Bengal maritime trade.',
      historicalSignificance: 'Extended imperial sovereignty across northern India from coast to coast.',
      aftermathAndRebellions: 'Local dynasties maintained as tributary feudatories paying annual tribute.',
      politicalStatus: 'tributary_vassal',
      svgPath: 'M 485,275 C 555,260 635,265 715,290 C 765,310 805,360 800,420 C 775,455 715,460 660,445 C 600,430 550,380 500,340 C 485,310 480,290 485,275 Z',
      labelCoordinates: { x: 620, y: 360 },
      fillColor: '#ec4899'
    },
    {
      id: 'custom_southern_reach',
      name: 'Southern Peninsular Plateau',
      modernLocation: 'Deccan Plateau & River Valleys',
      previousRulerOrDynasty: 'Southern Chieftaincies & Hill Rajas',
      conqueringRuler: 'Paramount Sovereign',
      conquestYear: 'Zenith Period',
      battlesInvolved: 'Plateau Fortress Sieges',
      historicalBackground: 'Subjugation of hill forts across the Deccan plateau, enforcing annual tributary treaties.',
      conquestReasons: 'Mineral wealth, diamond and gold mines, and total subcontinental supremacy.',
      historicalSignificance: 'Represented the maximum territorial zenith of the empire.',
      aftermathAndRebellions: 'Guerrilla warfare and extended communication lines tested imperial endurance.',
      politicalStatus: 'tributary_vassal',
      svgPath: 'M 315,530 C 385,520 470,525 550,545 C 605,570 635,620 605,670 C 565,710 485,735 420,740 C 360,715 325,640 305,570 C 300,545 305,535 315,530 Z',
      labelCoordinates: { x: 450, y: 560 },
      fillColor: '#f43f5e'
    }
  ];

  const frames: HistoricalFrame[] = [
    {
      id: `${mapId}_frame_1`,
      frameNumber: 1,
      yearDisplay: 'Stage 1: Foundation',
      title: `${cleanTitle}: Dynastic Foundation & Rise`,
      subtitle: 'Securing the Imperial Capital and Agricultural Plains',
      ruler: {
        name: `Founding Monarch of ${cleanTitle}`,
        reignPeriod: 'Early Period',
        title: 'Founding Sovereign',
        achievements: [
          'Unified regional feudal principalities under a centralized throne',
          'Constructed defensive citadel and imperial palace complex',
          'Instituted judicial, coinage, and tax collection frameworks'
        ],
        importantBattles: ['Battle of the Capital Heartland'],
        capitals: ['Imperial Capital Citadel'],
        historicalSignificance: `Laid the dynastic foundation for the rise and glory of ${cleanTitle}.`,
        interestingFacts: ['Known for formidable personal courage and reform of royal guard regiments.']
      },
      controlledRegionIds: ['custom_core_province'],
      newlyAcquiredRegionIds: ['custom_core_province'],
      campaignVectors: [],
      cities: [{ name: 'Imperial Capital Citadel', x: 395, y: 290, type: 'capital' }],
      summaryText: `The dynasty establishes its core foundations, creating a fortified capital and stable tax base.`,
      territorialExtentSqKm: '~850,000 Sq Km'
    },
    {
      id: `${mapId}_frame_2`,
      frameNumber: 2,
      yearDisplay: 'Stage 2: Western Expansion',
      title: `${cleanTitle}: Annexation of Western Trade Corridors`,
      subtitle: 'Securing Maritime Ports, Hill Fortresses, and Caravan Routes',
      ruler: {
        name: `The Great Monarch of ${cleanTitle}`,
        reignPeriod: 'Middle Period',
        title: 'The Great Conqueror',
        achievements: [
          'Annexed western maritime ports and vital trade passages',
          'Formed diplomatic alliances with prominent merchant guilds',
          'Expanded imperial army with cavalry and archer battalions'
        ],
        importantBattles: ['Western Plains Campaign'],
        capitals: ['Imperial Capital Citadel'],
        historicalSignificance: 'Transformed a regional kingdom into a maritime and overland commercial powerhouse.',
        interestingFacts: ['Patronized monumental rock architecture, temple building, and classical scholarship.']
      },
      controlledRegionIds: ['custom_core_province', 'custom_western_march'],
      newlyAcquiredRegionIds: ['custom_western_march'],
      campaignVectors: [
        {
          id: 'vector_west',
          name: 'Western Offensive',
          from: { x: 395, y: 290 },
          to: { x: 260, y: 400 },
          path: 'M 395,290 Q 330,340 260,400',
          year: 'Middle Period',
          description: 'Imperial legions swept west to incorporate rich maritime trading cities.'
        }
      ],
      cities: [
        { name: 'Imperial Capital Citadel', x: 395, y: 290, type: 'capital' },
        { name: 'Western Maritime Port', x: 240, y: 410, type: 'port' }
      ],
      summaryText: `Military campaigns into the west annex vital maritime ports, substantially expanding state revenues.`,
      territorialExtentSqKm: '~1.8 Million Sq Km'
    },
    {
      id: `${mapId}_frame_3`,
      frameNumber: 3,
      yearDisplay: 'Stage 3: Eastern Campaign',
      title: `${cleanTitle}: Integration of the Eastern River Basins`,
      subtitle: 'Dominance over Riverine Plains and Bay of Bengal Coast',
      ruler: {
        name: `Supreme Sovereign of ${cleanTitle}`,
        reignPeriod: 'Peak Expansion Era',
        title: 'Paramount Emperor',
        achievements: [
          'Subjugated eastern river kingdoms and deltaic principalities',
          'Constructed grand irrigation canals and public temples',
          'Achieved coast-to-coast subcontinental dominance'
        ],
        importantBattles: ['Riverine Delta Fleet Conquest'],
        capitals: ['Imperial Capital Citadel'],
        historicalSignificance: 'Consolidated agrarian abundance and maritime hegemony across both seas.',
        interestingFacts: ['Enforced strict penal codes and distributed food reserves during seasonal famines.']
      },
      controlledRegionIds: ['custom_core_province', 'custom_western_march', 'custom_eastern_basin'],
      newlyAcquiredRegionIds: ['custom_eastern_basin'],
      campaignVectors: [
        {
          id: 'vector_east',
          name: 'Eastern Delta Push',
          from: { x: 395, y: 290 },
          to: { x: 620, y: 360 },
          path: 'M 395,290 Q 500,310 620,360',
          year: 'Peak Era',
          description: 'Expeditionary force advanced down the river valley to secure deltaic trade routes.'
        }
      ],
      cities: [
        { name: 'Imperial Capital Citadel', x: 395, y: 290, type: 'capital' },
        { name: 'Western Maritime Port', x: 240, y: 410, type: 'port' },
        { name: 'Eastern River Garrison', x: 630, y: 360, type: 'fort' }
      ],
      summaryText: `Eastern campaigns bring fertile agricultural deltas and ports into the imperial sphere.`,
      territorialExtentSqKm: '~2.9 Million Sq Km'
    },
    {
      id: `${mapId}_frame_4`,
      frameNumber: 4,
      yearDisplay: 'Stage 4: Peninsular Zenith',
      title: `${cleanTitle}: Territorial Zenith & Imperial Pax`,
      subtitle: 'Subjugation of the Deccan & Peninsular Plateau Kingdoms',
      ruler: {
        name: `Emperor at Zenith`,
        reignPeriod: 'Final Classical Era',
        title: 'Chakravartin',
        achievements: [
          'Conquered peninsular plateau fortresses',
          'Imposed tributary treaties on southern kingdoms',
          'Administered the widest territorial expanse in the dynasty’s history'
        ],
        importantBattles: ['Peninsular Siege of Hill Forts'],
        capitals: ['Imperial Capital Citadel'],
        historicalSignificance: 'Attained undisputed paramountcy across the Indian subcontinent.',
        interestingFacts: ['The imperial library, arts, and treasury reached their peak recorded inventory.']
      },
      controlledRegionIds: [
        'custom_core_province',
        'custom_western_march',
        'custom_eastern_basin',
        'custom_southern_reach'
      ],
      newlyAcquiredRegionIds: ['custom_southern_reach'],
      campaignVectors: [
        {
          id: 'vector_south',
          name: 'Peninsular March',
          from: { x: 395, y: 290 },
          to: { x: 450, y: 560 },
          path: 'M 395,290 Q 420,430 450,560',
          year: 'Zenith',
          description: 'Grand imperial army crossed the central plateau to enforce tributary allegiance.'
        }
      ],
      cities: [
        { name: 'Imperial Capital Citadel', x: 395, y: 290, type: 'capital' },
        { name: 'Western Maritime Port', x: 240, y: 410, type: 'port' },
        { name: 'Eastern River Garrison', x: 630, y: 360, type: 'fort' },
        { name: 'Plateau Fortress', x: 440, y: 570, type: 'fort' }
      ],
      summaryText: `The empire reaches its maximum geographical extent, dominating northern plains and peninsular plateaus alike.`,
      territorialExtentSqKm: '~3.8 Million Sq Km'
    }
  ];

  const events: ChronologicalEvent[] = [
    {
      year: eraText.split('–')[0] || 'Founding Era',
      frameIndex: 0,
      eventTitle: `Foundation of the ${cleanTitle}`,
      ruler: `Founding Monarch of ${cleanTitle}`,
      location: 'Imperial Capital Citadel',
      description: 'Founding ruler unites local factions and establishes dynastic seat.',
      impact: 'Birth of unified imperial rule.'
    },
    {
      year: 'Consolidation Era',
      frameIndex: 1,
      eventTitle: 'Conquest of Western Commercial Zones',
      ruler: `The Great Monarch of ${cleanTitle}`,
      location: 'Western Plains & Ports',
      description: 'Subjugation of western trade passes and maritime trading ports.',
      impact: 'Treasury revenues increase substantially.'
    },
    {
      year: 'Imperial Expansion',
      frameIndex: 2,
      eventTitle: 'Eastern Delta Campaigns',
      ruler: `Supreme Sovereign of ${cleanTitle}`,
      location: 'Eastern Plains',
      description: 'Annexation of riverine agrarian deltas and Bay of Bengal ports.',
      impact: 'Agricultural and trade primacy across northern India.'
    },
    {
      year: eraText.split('–')[1] || 'Zenith Era',
      frameIndex: 3,
      eventTitle: 'Peninsular Submission & Imperial Zenith',
      ruler: 'Emperor at Zenith',
      location: 'Deccan Plateau',
      description: 'Defeat of peninsular rivals; empire reaches maximum territorial extent.',
      impact: 'Imperial hegemony established from north to south.'
    }
  ];

  return {
    id: mapId,
    title: `${cleanTitle}: Territorial Expansion (${eraText})`,
    odiaTitle: `ମାନଚିତ୍ର: ${cleanTitle} (${eraText})`,
    topic,
    era: eraText,
    category: 'empire',
    description: `Chronological flipbook animated atlas showing the rise, expansion, and zenith of the ${cleanTitle}. ${notes ? `Teacher notes: ${notes}` : ''}`,
    baseMapType: 'subcontinent',
    viewBox: '0 0 1000 850',
    regions,
    frames,
    events,
    geographicFeatures: {
      rivers: SUBCONTINENT_RIVERS,
      seas: SUBCONTINENT_SEAS
    },
    isBuiltin: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}
