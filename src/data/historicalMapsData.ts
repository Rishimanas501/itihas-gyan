import type { HistoricalMap, HistoricalFrame, HistoricalRegion, ChronologicalEvent } from '../types';

// =========================================================================
// GEOGRAPHICAL BASELINE (Coastlines, Rivers, Topographical Features)
// High-Fidelity Natural Cartographic Contours (viewBox: 0 0 1000 850)
// =========================================================================

export const SUBCONTINENT_RIVERS = [
  {
    name: 'Indus (ସିନ୍ଧୁ)',
    path: 'M 350,90 C 310,110 260,130 235,160 C 215,190 205,240 195,300 C 185,360 178,410 168,445'
  },
  {
    name: 'Jhelum & Chenab (ଝେଲମ ଓ ଚେନାବ)',
    path: 'M 315,115 C 290,140 265,180 235,225 C 215,260 205,310 195,345'
  },
  {
    name: 'Ganga (ଗଙ୍ଗା)',
    path: 'M 410,210 C 435,245 470,270 515,295 C 570,320 635,335 690,360 C 725,385 745,420 755,455'
  },
  {
    name: 'Yamuna (ଯମୁନା)',
    path: 'M 385,200 C 400,235 415,265 440,290 C 475,310 515,315 545,325'
  },
  {
    name: 'Chambal (ଚମ୍ବଲ)',
    path: 'M 345,370 C 375,340 410,330 455,305'
  },
  {
    name: 'Brahmaputra (ବ୍ରହ୍ମପୁତ୍ର)',
    path: 'M 880,265 C 840,285 790,300 760,335 C 740,365 748,415 758,455'
  },
  {
    name: 'Narmada (ନର୍ମଦା)',
    path: 'M 540,430 C 475,432 410,436 345,442 C 300,446 270,455 252,472'
  },
  {
    name: 'Tapti (ତାପ୍ତୀ)',
    path: 'M 505,465 C 445,468 385,472 325,478 C 285,482 262,492 250,505'
  },
  {
    name: 'Mahanadi (ମହାନଦୀ)',
    path: 'M 550,445 C 595,455 635,468 670,478 C 695,485 710,488 715,492'
  },
  {
    name: 'Godavari (ଗୋଦାବରୀ)',
    path: 'M 305,530 C 365,540 445,550 515,565 C 575,580 625,600 645,618'
  },
  {
    name: 'Krishna & Tungabhadra (କୃଷ୍ଣା ଓ ତୁଙ୍ଗଭଦ୍ରା)',
    path: 'M 320,595 C 380,610 445,618 510,628 C 565,635 605,650 625,662'
  },
  {
    name: 'Kaveri (କାବେରୀ)',
    path: 'M 370,695 C 415,708 460,715 500,722 C 530,726 545,732 555,738'
  }
];

export const SUBCONTINENT_SEAS = [
  { name: 'ARABIAN SEA (ଆରବ ସାଗର)', x: 155, y: 640 },
  { name: 'BAY OF BENGAL (ବଙ୍ଗୋପସାଗର)', x: 745, y: 620 },
  { name: 'INDIAN OCEAN (ଭାରତ ମହାସାଗର)', x: 440, y: 835 },
  { name: 'HIMALAYA RANGE (ହିମାଳୟ ପର୍ବତମାଳା)', x: 550, y: 195 },
  { name: 'HINDU KUSH (ହିନ୍ଦୁ କୁଶ)', x: 195, y: 95 }
];

// Natural, Organic Subcontinent Coastline & Landmass Contour
export const SUBCONTINENT_COASTLINE_PATH = 
  'M 105,250 ' +
  'C 120,280 135,320 148,365 ' + // Makran & Sindh coast
  'C 155,395 162,425 168,445 ' + // Indus Delta
  'C 178,440 205,432 235,435 ' + // Rann of Kutch northern shore
  'C 248,442 245,455 220,460 ' + // Kutch southern edge
  'C 190,462 172,468 178,485 ' + // Kathiawar peninsula west coast (Dwarka)
  'C 185,508 215,525 242,518 ' + // Kathiawar south cape (Somnath / Diu)
  'C 258,512 265,498 258,482 ' + // Gulf of Khambhat western shore
  'C 255,468 275,475 272,500 ' + // Cambay head & Narmada/Tapti estuary
  'C 270,530 282,570 295,615 ' + // Konkan Coast (Mumbai, Ratnagiri)
  'C 305,640 318,675 332,710 ' + // Kanara Coast (Goa, Karwar, Mangalore)
  'C 345,740 365,770 398,798 ' + // Malabar Coast (Calicut, Kochi) down to Kanyakumari
  'C 410,805 418,802 425,790 ' + // Cape Comorin tip
  'C 438,765 460,745 480,735 ' + // Gulf of Mannar & Kaveri delta
  'C 505,715 520,680 535,640 ' + // Coromandel Coast (Pondicherry, Chennai)
  'C 555,610 595,595 635,585 ' + // Andhra Coast & Krishna/Godavari deltas
  'C 660,560 675,530 690,495 ' + // Kalinga / Odisha coast (Ganjam, Chilika, Puri)
  'C 705,475 725,455 745,445 ' + // Mahanadi Delta & Balasore shore
  'C 765,435 795,430 815,440 ' + // Sundarbans delta & Meghna estuary
  'C 830,460 840,490 848,530 ' + // Chittagong & Arakan coast
  'C 860,500 875,450 870,400 ' + // Eastern hills & Burma border
  'C 868,360 885,320 895,285 ' + // Patkai & Naga hills
  'C 880,265 830,270 780,275 ' + // Assam & Bhutan border
  'C 740,270 690,260 635,248 ' + // Nepal Himalaya contour
  'C 570,230 515,205 450,175 ' + // Uttarakhand & Himachal mountains
  'C 400,140 360,95 325,60 ' +   // Karakoram & Kashmir mountains
  'C 285,45 240,55 210,80 ' +     // Pamir & Hindu Kush
  'C 175,105 140,150 120,195 ' +  // Safed Koh & Sulaiman Range
  'Z';

// Sri Lanka Island Contour Path
export const SRI_LANKA_PATH = 
  'M 478,775 ' +
  'C 488,765 505,768 515,782 ' +
  'C 525,800 528,825 518,840 ' +
  'C 505,852 490,845 480,828 ' +
  'C 472,810 470,790 478,775 Z';


// =========================================================================
// 1. MUGHAL EMPIRE (1526–1707) - PRIMARY DETAILED ATLAST DATASET
// =========================================================================

export const MUGHAL_REGIONS = [
  {
    id: 'kabul_qandahar',
    name: 'Kabul & Qandahar (କାବୁଲ ଓ କାନ୍ଦାହାର)',
    modernLocation: 'Eastern Afghanistan & Pakistan Frontier',
    previousRulerOrDynasty: 'Timurid Principality & Arghun Dynasty',
    conqueringRuler: 'Zahir-ud-din Muhammad Babur',
    conquestYear: '1504–1522 CE',
    battlesInvolved: 'Siege of Kabul (1504), Capture of Qandahar (1522)',
    historicalBackground: 'Babur was ousted from his ancestral Fergana valley by the Uzbeks. He seized Kabul in 1504 as a strategic mountain stronghold from which he could control trans-Asian trade passes and launch military expeditions into Hindustan.',
    conquestReasons: 'Strategic gateway between Central Asia, Persia, and Northern India; defense against Safavids and Uzbeks; recruitment of elite Central Asian cavalry.',
    historicalSignificance: 'Remained the military lifeline and horse-trading gateway of the Mughal Empire for two centuries, repeatedly contested between the Mughals and Safavid Persia.',
    aftermathAndRebellions: 'Continual Safavid attempts to recapture Qandahar; finally lost permanently to Shah Abbas II of Persia in 1649 despite Shah Jahan’s multiple sieges.',
    politicalStatus: 'direct_annexation' as const,
    svgPath: 'M 115,100 C 150,75 200,70 235,90 C 255,115 250,150 240,175 C 220,200 185,215 150,210 C 120,205 105,160 115,100 Z',
    labelCoordinates: { x: 175, y: 145 },
    fillColor: '#84cc16'
  },
  {
    id: 'punjab_lahore',
    name: 'Punjab & Lahore (ପଞ୍ଜାବ ଓ ଲାହୋର)',
    modernLocation: 'Punjab (Pakistan & India), Rawalpindi, Lahore, Amritsar',
    previousRulerOrDynasty: 'Daulat Khan Lodi (Governor under Delhi Sultanate)',
    conqueringRuler: 'Babur (secured), Humayun, Akbar',
    conquestYear: '1524–1526 CE',
    battlesInvolved: 'Battle of Lahore (1524), First Battle of Panipat (1526)',
    historicalBackground: 'Daulat Khan Lodi invited Babur to dethrone Ibrahim Lodi. Babur subdued Punjab first, establishing Lahore as a secondary royal capital before descending onto the plains of Delhi.',
    conquestReasons: 'Vast agricultural fertility, control of the Grand Trunk Road route, securing the supply lines between Kabul and Delhi.',
    historicalSignificance: 'Formed the agricultural and recruiting backbone of the early Mughal armies. Lahore served as Akbar’s imperial capital from 1585 to 1598.',
    aftermathAndRebellions: 'Rebellions under Kamran Mirza against Humayun, later uprisings by Afghan chieftains subdued by Bairam Khan.',
    politicalStatus: 'direct_annexation' as const,
    svgPath: 'M 235,160 C 265,145 305,140 335,165 C 348,190 355,225 345,250 C 320,265 275,270 240,260 C 210,248 200,215 215,185 C 225,170 230,165 235,160 Z',
    labelCoordinates: { x: 280, y: 205 },
    fillColor: '#a3e635'
  },
  {
    id: 'delhi_agra',
    name: 'Delhi-Agra Heartland (ଦିଲ୍ଲୀ-ଆଗ୍ରା କେନ୍ଦ୍ରାଞ୍ଚଳ)',
    modernLocation: 'Delhi NCR, Haryana, Western Uttar Pradesh, Agra',
    previousRulerOrDynasty: 'Lodi Dynasty (Ibrahim Lodi)',
    conqueringRuler: 'Babur',
    conquestYear: '1526 CE',
    battlesInvolved: 'First Battle of Panipat (21 April 1526), Battle of Khanwa (1527)',
    historicalBackground: 'Babur deployed Ottoman matchlocks, field cannons (topkhana), and tulughma flanking maneuvers to shatter Ibrahim Lodi’s 100,000-man army at Panipat in hours, inaugurating the Mughal Empire.',
    conquestReasons: 'The historic imperial seat of Hindustan; whoever controlled Delhi and Agra held legitimate supremacy over the northern plains.',
    historicalSignificance: 'Permanent imperial core. Agra housed the Red Fort and Taj Mahal; Delhi saw the construction of Shahjahanabad and the Jama Masjid.',
    aftermathAndRebellions: 'Temporarily seized by Sher Shah Suri (1540–1555) and Hemu Vikramaditya (1556) before Akbar decisively reclaimed it at Second Panipat.',
    politicalStatus: 'direct_annexation' as const,
    svgPath: 'M 335,200 C 370,195 405,210 425,230 C 445,260 440,290 415,315 C 385,325 350,315 330,295 C 320,265 325,230 335,200 Z',
    labelCoordinates: { x: 380, y: 260 },
    fillColor: '#4ade80'
  },
  {
    id: 'rajasthan_rajputana',
    name: 'Mewar & Rajputana (ମେବାର ଓ ରାଜପୁତାନା)',
    modernLocation: 'Rajasthan (Chittorgarh, Udaipur, Jaipur, Jodhpur, Bikaner)',
    previousRulerOrDynasty: 'Sisodia Rajputs (Rana Sanga, Maharana Pratap) & Rathores',
    conqueringRuler: 'Akbar the Great (Jahangir finalized treaty)',
    conquestYear: '1567–1615 CE',
    battlesInvolved: 'Siege of Chittorgarh (1567–68), Siege of Ranthambore (1569), Battle of Haldighati (1576)',
    historicalBackground: 'Rana Sanga led the Rajput confederacy at Khanwa (1527). Later, Akbar initiated matrimonial alliances, Mansabdari appointments, and sieges of Chittor and Ranthambore to bring Rajput chieftains into the imperial structure.',
    conquestReasons: 'Rajputs were elite military commanders; pacifying Rajasthan was essential to secure trade routes to Gujarat ports and prevent hostile flanking attacks.',
    historicalSignificance: 'Rajput princes (such as Raja Man Singh) became the greatest generals and governors of the Mughal Empire, leading campaigns from Kabul to Odisha.',
    aftermathAndRebellions: 'Maharana Pratap waged heroic guerilla warfare from the Aravalli hills until his death in 1597. In 1615, Prince Khurram (Shah Jahan) negotiated an honorable peace with Rana Amar Singh allowing Mewar internal autonomy.',
    politicalStatus: 'tributary_vassal' as const,
    svgPath: 'M 240,260 C 275,265 320,260 335,280 C 345,305 342,345 330,375 C 300,385 260,388 230,375 C 205,350 200,310 215,280 C 225,265 235,260 240,260 Z',
    labelCoordinates: { x: 275, y: 325 },
    fillColor: '#facc15'
  },
  {
    id: 'gujarat',
    name: 'Gujarat & Ports (ଗୁଜରାଟ ଓ ବନ୍ଦର)',
    modernLocation: 'Gujarat (Surat, Ahmedabad, Cambay, Bharuch)',
    previousRulerOrDynasty: 'Gujarat Sultanate (Muzaffar Shah III)',
    conqueringRuler: 'Akbar the Great',
    conquestYear: '1572–1573 CE',
    battlesInvolved: 'Battle of Sarnal (1572), Lightning March to Ahmedabad (1573)',
    historicalBackground: 'Gujarat was torn by factional civil war among nobles. Akbar personally conducted a rapid 9-day march covering 450 miles from Fatehpur Sikri to Ahmedabad to defeat the rebels, celebrating the victory by building the Buland Darwaza.',
    conquestReasons: 'Wealthiest maritime province of India; collected vast customs duties on Arabian Sea trade with Persia, Arabia, and Europe; embarkation point for Hajj pilgrims.',
    historicalSignificance: 'Provided the Mughal treasury with enormous silver revenue and gave direct contact with Portuguese, Dutch, and English merchant fleets.',
    aftermathAndRebellions: 'Repeated rebellions by former sultan Muzaffar III were decisively suppressed by Abdur Rahim Khan-i-Khanan.',
    politicalStatus: 'direct_annexation' as const,
    svgPath: 'M 215,380 C 245,385 280,395 290,420 C 295,445 285,475 272,495 C 260,505 240,518 215,520 C 185,510 175,485 180,465 C 190,445 205,432 215,380 Z',
    labelCoordinates: { x: 235, y: 445 },
    fillColor: '#38bdf8'
  },
  {
    id: 'malwa_bundelkhand',
    name: 'Malwa & Central India (ମାଲବା ଓ ବୁନ୍ଦେଲଖଣ୍ଡ)',
    modernLocation: 'Madhya Pradesh, Ujjain, Mandu, Gwalior',
    previousRulerOrDynasty: 'Baz Bahadur (Sultan of Malwa) & Bundela Rajputs',
    conqueringRuler: 'Akbar (Pir Muhammad & Adham Khan)',
    conquestYear: '1561–1562 CE',
    battlesInvolved: 'Battle of Sarangpur (1561)',
    historicalBackground: 'Baz Bahadur was a patron of music and lover of Rani Roopmati. Mughal forces captured Mandu and annexed the fertile central plateau.',
    conquestReasons: 'Vital transit plateau linking Northern India with the Deccan and Western ports.',
    historicalSignificance: 'Mandu and Ujjain became crucial military transit garrisons; Bundela chiefs like Bir Singh Deo were integrated under Jahangir.',
    aftermathAndRebellions: 'Champat Rai and Chhatrasal Bundela waged recurring guerrilla wars during Aurangzeb’s reign.',
    politicalStatus: 'direct_annexation' as const,
    svgPath: 'M 330,315 C 370,305 415,310 455,325 C 475,350 480,390 465,420 C 430,435 380,438 340,430 C 320,400 318,350 330,315 Z',
    labelCoordinates: { x: 395, y: 365 },
    fillColor: '#60a5fa'
  },
  {
    id: 'bihar_bengal',
    name: 'Bihar & Bengal Subah (ବିହାର ଓ ବଙ୍ଗଳା ସୁବା)',
    modernLocation: 'Bihar, West Bengal, Bangladesh (Patna, Murshidabad, Dhaka)',
    previousRulerOrDynasty: 'Karrani Afghan Sultanate (Sulaiman & Daud Khan Karrani)',
    conqueringRuler: 'Akbar the Great (Munim Khan & Raja Todar Mal)',
    conquestYear: '1574–1576 CE',
    battlesInvolved: 'Siege of Patna (1574), Battle of Tukaroi (1575), Battle of Rajmahal (1576)',
    historicalBackground: 'Daud Khan Karrani declared independence, struck coins, and had the Khutba read in his own name. Akbar personally captured Hajipur and Patna, driving Afghan forces into Bengal and defeating Daud Khan at Rajmahal in 1576.',
    conquestReasons: 'Richest agricultural paradise (textiles, rice, silk); immense saltpeter reserves for gunpowder; access to the Bay of Bengal and maritime commerce.',
    historicalSignificance: 'Bengal became known as the "Paradise of Nations" (Jannat-ul-Bilad), contributing the largest share of imperial agrarian tribute.',
    aftermathAndRebellions: 'Resistance of the "Baro Bhuiyans" (Twelve Zamindars) led by Isa Khan; finally pacified under Jahangir by Subahdar Islam Khan Chishti who shifted the capital to Dhaka (Jahangirnagar).',
    politicalStatus: 'direct_annexation' as const,
    svgPath: 'M 455,275 C 515,265 590,268 660,285 C 730,295 785,325 805,370 C 815,415 790,445 745,455 C 685,450 635,420 575,385 C 520,355 470,320 455,275 Z',
    labelCoordinates: { x: 645, y: 355 },
    fillColor: '#2dd4bf'
  },
  {
    id: 'odisha_utkala',
    name: 'Odisha / Utkala Subah (ଓଡ଼ିଶା / ଉତ୍କଳ ସୁବା)',
    modernLocation: 'Odisha (Cuttack, Puri, Balasore, Ganjam)',
    previousRulerOrDynasty: 'Afghan Chieftains of Qutlu Khan & Local Gajapati feudatories',
    conqueringRuler: 'Akbar the Great (Raja Man Singh)',
    conquestYear: '1590–1592 CE',
    battlesInvolved: 'Battle of Subarnarekha (1592), Capture of Sarangagarh fort & Cuttack',
    historicalBackground: 'Following the fall of Mukunda Deva in 1568, Afghan chiefs ruled Odisha. In 1590–1592, Akbar appointed Rajput general Raja Man Singh, who decisively defeated the Afghans and placed Ramachandra Deva I of Khurda as guardian of Lord Jagannath temple.',
    conquestReasons: 'Coastal defense, securing trade routes between Bengal and the Coromandel coast, strategic containment of Afghan remnants.',
    historicalSignificance: 'Integrated as a distinct Subah under Cuttack governorship. Lord Jagannath’s temple rituals were protected under imperial Farman.',
    aftermathAndRebellions: 'Frequent administrative conflicts with Khurda rajas; remained firmly a Mughal province until Maratha takeover in 1751.',
    politicalStatus: 'direct_annexation' as const,
    svgPath: 'M 565,435 C 615,430 670,445 715,455 C 725,485 705,515 675,540 C 645,565 615,550 585,520 C 565,490 555,460 565,435 Z',
    labelCoordinates: { x: 635, y: 495 },
    fillColor: '#f97316'
  },
  {
    id: 'khandesh_ahmadnagar',
    name: 'Khandesh & Berar (ଖାନ୍ଦେଶ ଓ ବେରାର)',
    modernLocation: 'Northern Maharashtra, Asirgarh, Burhanpur, Daulatabad',
    previousRulerOrDynasty: 'Faruqi Dynasty (Khandesh) & Nizam Shahi (Chand Bibi)',
    conqueringRuler: 'Akbar the Great',
    conquestYear: '1599–1601 CE',
    battlesInvolved: 'Siege of Ahmadnagar (1596–1600), Siege of Asirgarh (1600–1601)',
    historicalBackground: 'Khandesh held the seemingly impregnable citadel of Asirgarh, the "Key to the Deccan." Akbar personally oversaw the siege in 1600, taking it by negotiation and gold after Chand Bibi was assassinated in Ahmadnagar.',
    conquestReasons: 'Gateway to the southern peninsular Deccan; securing Burhanpur as military headquarters for Deccan campaigns.',
    historicalSignificance: 'Established the initial Mughal administrative presence south of the Narmada and Tapti rivers.',
    aftermathAndRebellions: 'Malik Ambar, the brilliant Abyssinian military genius, reorganized Ahmadnagar troops and used guerrilla tactics (bargir-giri) to hold off Mughal advances for over two decades.',
    politicalStatus: 'direct_annexation' as const,
    svgPath: 'M 285,475 C 335,465 390,460 450,465 C 465,485 455,515 425,535 C 380,545 330,540 295,525 C 275,505 278,485 285,475 Z',
    labelCoordinates: { x: 370, y: 500 },
    fillColor: '#fb923c'
  },
  {
    id: 'kashmir_frontier',
    name: 'Kashmir, Sindh & Balochistan (କାଶ୍ମୀର ଓ ସିନ୍ଧୁ)',
    modernLocation: 'Kashmir Valley, Gilgit, Sindh (Thatta), Makran',
    previousRulerOrDynasty: 'Chak Dynasty (Kashmir), Tarkhan Dynasty (Sindh)',
    conqueringRuler: 'Akbar the Great (Qasim Khan & Abdur Rahim Khan-i-Khanan)',
    conquestYear: '1586–1591 CE',
    battlesInvolved: 'Passage of Pir Panjal (1586), Capture of Thatta (1591)',
    historicalBackground: 'Akbar dispatched imperial armies to bring Kashmir into the empire, turning Srinagar into the summer pleasure retreat of the emperors.',
    conquestReasons: 'Securing the northern frontier against Central Asian powers; opening Himalayan and Indus valley riverine commerce.',
    historicalSignificance: 'Kashmir became famous for royal Mughal gardens (Shalimar, Nishat) built by Jahangir; Sindh opened river transport to the Arabian Sea.',
    aftermathAndRebellions: 'Yusufzai tribal uprisings in the frontier hills (where Raja Birbal was ambushed and killed in 1586).',
    politicalStatus: 'direct_annexation' as const,
    svgPath: 'M 255,60 C 295,50 345,65 375,95 C 385,130 365,160 335,170 C 295,165 260,150 240,125 C 235,95 245,75 255,60 Z',
    labelCoordinates: { x: 305, y: 110 },
    fillColor: '#eab308'
  },
  {
    id: 'bijapur_golconda',
    name: 'Deccan Sultanates: Bijapur & Golconda (ବିଜାପୁର ଓ ଗୋଲକୋଣ୍ଡା)',
    modernLocation: 'Karnataka, Telangana, Andhra Pradesh (Bijapur, Hyderabad, Machilipatnam)',
    previousRulerOrDynasty: 'Adil Shahi Dynasty (Bijapur) & Qutb Shahi Dynasty (Golconda)',
    conqueringRuler: 'Aurangzeb Alamgir',
    conquestYear: '1685–1687 CE',
    battlesInvolved: 'Siege of Bijapur (1685–86), Siege of Golconda (1687)',
    historicalBackground: 'Aurangzeb spent the last 25 years of his life in the Deccan. After brutal months-long sieges, Bijapur fell in September 1686 and Golconda citadel was captured in September 1687 through bribery of an Afghan gatekeeper.',
    conquestReasons: 'Vast diamond wealth (Kollur mines), rich agricultural tax base, religious zeal to replace Shia sultanates with Sunni orthodoxy, and eliminating bases supporting Maratha fighters.',
    historicalSignificance: 'Marked the zenith of Mughal territorial expansion, expanding the empire to over 4 million square kilometers and 150 million subjects.',
    aftermathAndRebellions: 'The destruction of the two Sultanates removed the buffer against the Maratha confederacy, sucking the imperial army into an unwinnable quagmire that drained Mughal finances and morale.',
    politicalStatus: 'direct_annexation' as const,
    svgPath: 'M 295,535 C 355,530 435,538 515,555 C 585,570 635,595 625,645 C 585,670 515,665 440,655 C 375,645 320,635 305,590 C 290,560 290,545 295,535 Z',
    labelCoordinates: { x: 465, y: 605 },
    fillColor: '#ef4444'
  },
  {
    id: 'deep_south_carnatic',
    name: 'Carnatic & Thanjavur Frontier (ଦକ୍ଷିଣ ସୀମାନ୍ତ ଓ କର୍ଣ୍ଣାଟକ)',
    modernLocation: 'Tamil Nadu, Bangalore, Jinji, Thanjavur, Arcot',
    previousRulerOrDynasty: 'Nayakas of Madurai & Thanjavur, Maratha forts (Rajaram)',
    conqueringRuler: 'Aurangzeb Alamgir (General Zulfiqar Khan)',
    conquestYear: '1690–1698 CE',
    battlesInvolved: 'Siege of Jinji (1690–1698)',
    historicalBackground: 'Following Chhatrapati Sambhaji’s execution in 1689, his brother Rajaram escaped to the formidable fortress of Jinji in Tamil country. Zulfiqar Khan laid siege for eight years before capturing the fort in 1698.',
    conquestReasons: 'Eradicating Maratha royal resistance and demanding tribute from the wealthy southern Nayaka kingdoms.',
    historicalSignificance: 'Extended nominal Mughal suzerainty all the way down to the Coromandel coast and Kaveri delta, creating the Nawab of Arcot dynasty.',
    aftermathAndRebellions: 'Imperial communications lines were stretched beyond breaking point; local Poligars and Maratha roving bands continually raided supply trains.',
    politicalStatus: 'tributary_vassal' as const,
    svgPath: 'M 330,655 C 390,650 460,655 525,660 C 535,700 505,745 475,765 C 440,785 410,795 385,770 C 355,735 335,695 330,655 Z',
    labelCoordinates: { x: 435, y: 725 },
    fillColor: '#ec4899'
  }
];

export const MUGHAL_FRAMES: HistoricalFrame[] = [
  // Frame 1: 1526 – Babur
  {
    id: 'frame_1526_babur',
    frameNumber: 1,
    yearDisplay: '1526 CE',
    title: 'First Battle of Panipat & Foundation of the Empire',
    subtitle: 'Babur Establishes Mughal Rule in Hindustan',
    ruler: {
      name: 'Zahir-ud-din Muhammad Babur',
      odiaName: 'ଜାହିର-ଉଦ୍-ଦିନ୍ ମହମ୍ମଦ ବାବର',
      reignPeriod: '1526–1530 CE',
      title: 'Founder & Padshah of the Mughal Empire',
      achievements: [
        'Introduced field artillery and matchlocks (muskets) into Indian warfare',
        'Defeated Ibrahim Lodi at First Panipat (1526) and Rana Sanga at Khanwa (1527)',
        'Authored Baburnama (Tuzuk-i-Baburi), one of the greatest autobiographies in world literature',
        'Laid symmetrical Persian Charbagh gardens at Agra (Aram Bagh)'
      ],
      importantBattles: [
        'Battle of Panipat (April 1526)',
        'Battle of Khanwa against Rana Sanga (March 1527)',
        'Battle of Chanderi (1528)',
        'Battle of Ghaghra (1529)'
      ],
      capitals: ['Kabul', 'Agra'],
      historicalSignificance: 'Broke the three-century reign of the Delhi Sultanate and planted the roots of Timurid-Mughal dynastic rule in India.',
      interestingFacts: [
        'Descended from Timur on his father’s side and Genghis Khan on his mother’s side.',
        'Famously renounced wine and broke golden wine goblets before the Battle of Khanwa to inspire his troops.',
        'Died in Agra in 1530; his remains were later transferred to the Bagh-e Babur in Kabul according to his wish.'
      ]
    },
    controlledRegionIds: ['kabul_qandahar', 'punjab_lahore', 'delhi_agra'],
    newlyAcquiredRegionIds: ['punjab_lahore', 'delhi_agra'],
    campaignVectors: [
      {
        id: 'panipat_campaign',
        name: 'Babur’s Descent from Kabul to Panipat',
        from: { x: 175, y: 145 },
        to: { x: 360, y: 245 },
        path: 'M 175,145 Q 260,180 360,245',
        year: '1525–1526',
        description: 'Babur crossed the Indus with 12,000 veteran cavalry, 24 cannons, and master gunner Ustad Ali Quli.',
        commander: 'Babur & Prince Humayun'
      }
    ],
    cities: [
      { name: 'Kabul', odiaName: 'କାବୁଲ', x: 180, y: 135, type: 'capital', yearFoundedOrConquered: '1504' },
      { name: 'Lahore', odiaName: 'ଲାହୋର', x: 270, y: 205, type: 'fort', yearFoundedOrConquered: '1524' },
      { name: 'Panipat', odiaName: 'ପାନିପତ୍', x: 350, y: 240, type: 'battlefield', yearFoundedOrConquered: '1526' },
      { name: 'Delhi', odiaName: 'ଦିଲ୍ଲୀ', x: 360, y: 260, type: 'capital', yearFoundedOrConquered: '1526' },
      { name: 'Agra', odiaName: 'ଆଗ୍ରା', x: 380, y: 285, type: 'capital', yearFoundedOrConquered: '1526' }
    ],
    summaryText: 'Babur enters northern India through the Khyber Pass, shatters the vast Lodi army at Panipat using superior tactics and field artillery, and takes control of the Delhi-Agra corridor.',
    territorialExtentSqKm: '~1.1 Million Sq Km'
  },

  // Frame 2: 1530–1540 – Humayun's First Reign
  {
    id: 'frame_1530_humayun',
    frameNumber: 2,
    yearDisplay: '1530–1540 CE',
    title: 'Humayun’s First Reign & Rise of Sher Shah Suri',
    subtitle: 'Internal Division and the Afghan Resurgence',
    ruler: {
      name: 'Nasir-ud-din Muhammad Humayun',
      odiaName: 'ହୁମାୟୁନ୍',
      reignPeriod: '1530–1540 CE (First Reign)',
      title: 'Second Mughal Padshah',
      achievements: [
        'Built the citadel of Dinpanah (Old Fort / Purana Qila) at Delhi',
        'Captured Champaner and Mandu during the campaign in Gujarat',
        'Maintained astronomical and astrological observatories'
      ],
      importantBattles: [
        'Battle of Mandasor (1535)',
        'Battle of Chausa (June 1539)',
        'Battle of Bilgram / Kannauj (May 1540)'
      ],
      capitals: ['Agra', 'Dinpanah (Delhi)'],
      historicalSignificance: 'Struggled with fraternal rivalry from Kamran, Askari, and Hindal, leading to the temporary collapse of Mughal power under the brilliant Afghan military genius Sher Shah Suri.',
      interestingFacts: [
        'Name "Humayun" means "The Fortunate", yet historians remarked he tumbled through life and tumbled out of it.',
        'At Chausa, Humayun was saved from drowning in the Ganga by a water-carrier (Nizam), whom he allowed to sit on the imperial throne for half a day.'
      ]
    },
    controlledRegionIds: ['kabul_qandahar', 'punjab_lahore', 'delhi_agra', 'malwa_bundelkhand'],
    newlyAcquiredRegionIds: ['malwa_bundelkhand'],
    campaignVectors: [
      {
        id: 'chausa_retreat',
        name: 'Battle of Chausa & Retreat to Agra',
        from: { x: 540, y: 320 },
        to: { x: 380, y: 285 },
        path: 'M 540,320 Q 460,300 380,285',
        year: '1539–1540',
        description: 'Sher Shah Suri ambushed Humayun’s encampment on the banks of the Ganga at Chausa, routing the Mughal army.',
        commander: 'Sher Shah Suri'
      }
    ],
    cities: [
      { name: 'Kabul', odiaName: 'କାବୁଲ', x: 180, y: 135, type: 'capital' },
      { name: 'Lahore', odiaName: 'ଲାହୋର', x: 270, y: 205, type: 'fort' },
      { name: 'Delhi', odiaName: 'ଦିଲ୍ଲୀ', x: 360, y: 260, type: 'capital' },
      { name: 'Agra', odiaName: 'ଆଗ୍ରା', x: 380, y: 285, type: 'capital' },
      { name: 'Mandu', odiaName: 'ମାଣ୍ଡୁ', x: 340, y: 400, type: 'fort' },
      { name: 'Chausa', odiaName: 'ଚୌସା', x: 535, y: 330, type: 'battlefield', yearFoundedOrConquered: '1539' }
    ],
    summaryText: 'Humayun expands into Malwa and Gujarat but faces fatal insurrections by his brothers. Sher Shah Suri crushes the Mughal forces at Chausa (1539) and Kannauj (1540), forcing Humayun into a 15-year exile across Persia.',
    territorialExtentSqKm: '~1.3 Million Sq Km (Lost by 1540)'
  },

  // Frame 3: 1555–1556 – Humayun's Restoration
  {
    id: 'frame_1555_restoration',
    frameNumber: 3,
    yearDisplay: '1555–1556 CE',
    title: 'The Restoration of Humayun',
    subtitle: 'Reclaiming the Throne of Delhi with Safavid Aid',
    ruler: {
      name: 'Humayun (Restoration)',
      odiaName: 'ହୁମାୟୁନ୍ (ପୁନରୁଦ୍ଧାର)',
      reignPeriod: '1555–1556 CE',
      title: 'Restored Padshah of Hindustan',
      achievements: [
        'Secured military backing from Shah Tahmasp I of Safavid Persia',
        'Brought master Persian miniaturists Mir Sayyid Ali and Abd al-Samad to India, founding the Mughal School of Painting',
        'Reclaimed Lahore, Sirhind, and Delhi from the fragmented Suri successors'
      ],
      importantBattles: [
        'Battle of Machhiwara (May 1555)',
        'Battle of Sirhind (June 1555)'
      ],
      capitals: ['Delhi (Purana Qila)'],
      historicalSignificance: 'Resurrected the empire from utter extinction just six months before his sudden death from falling down the stairs of his library (Sher Mandal).',
      interestingFacts: [
        'His 13-year-old son Akbar was crowned on a brick platform at Kalanaur (Punjab) upon Humayun’s untimely demise in January 1556.',
        'His tomb in Delhi, built by his widow Bega Begum, became the architectural forerunner to the Taj Mahal.'
      ]
    },
    controlledRegionIds: ['kabul_qandahar', 'punjab_lahore', 'delhi_agra'],
    newlyAcquiredRegionIds: ['punjab_lahore', 'delhi_agra'],
    campaignVectors: [
      {
        id: 'sirhind_restoration',
        name: 'Bairam Khan & Humayun’s March from Lahore to Delhi',
        from: { x: 270, y: 205 },
        to: { x: 360, y: 260 },
        path: 'M 270,205 Q 310,230 360,260',
        year: '1555',
        description: 'Mughal general Bairam Khan crushed Sikandar Shah Suri at Sirhind, opening the gates of Delhi.',
        commander: 'Bairam Khan'
      }
    ],
    cities: [
      { name: 'Kabul', odiaName: 'କାବୁଲ', x: 180, y: 135, type: 'capital' },
      { name: 'Sirhind', odiaName: 'ସିରହିନ୍ଦ', x: 325, y: 220, type: 'battlefield', yearFoundedOrConquered: '1555' },
      { name: 'Lahore', odiaName: 'ଲାହୋର', x: 270, y: 205, type: 'fort' },
      { name: 'Delhi', odiaName: 'ଦିଲ୍ଲୀ', x: 360, y: 260, type: 'capital', yearFoundedOrConquered: '1555' }
    ],
    summaryText: 'With Persian cavalry and artillery assistance from Shah Tahmasp, Humayun reconquers Kabul, marches across Punjab, and reoccupies Delhi in July 1555.',
    territorialExtentSqKm: '~1.2 Million Sq Km'
  },

  // Frame 4: 1556–1605 – Akbar the Great
  {
    id: 'frame_1556_akbar',
    frameNumber: 4,
    yearDisplay: '1556–1605 CE',
    title: 'Akbar the Great: The Golden Age of Expansion',
    subtitle: 'Consolidation, Mansabdari System, and Imperial Subahs',
    ruler: {
      name: 'Jalal-ud-din Muhammad Akbar',
      odiaName: 'ଜାଲାଲ-ଉଦ୍-ଦିନ୍ ମହମ୍ମଦ ଆକବର',
      reignPeriod: '1556–1605 CE',
      title: 'Akbar the Great (ଆକବର ମହାନ୍)',
      achievements: [
        'Created the centralized Mansabdari military-administrative framework',
        'Formulated Dahsala revenue system with Raja Todar Mal',
        'Abolished Jizya tax and pilgrim tax on non-Muslims; promoted Sulh-i-Kul (universal peace)',
        'Built the planned imperial capital city of Fatehpur Sikri and the grand Buland Darwaza',
        'Annexed 15 imperial Subahs covering North, West, East, and Central India'
      ],
      importantBattles: [
        'Second Battle of Panipat against Hemu (November 1556)',
        'Siege of Chittorgarh (1567–68)',
        'Siege of Ranthambore (1569)',
        'Conquest of Gujarat (1572–73)',
        'Battle of Rajmahal in Bengal (1576)',
        'Battle of Haldighati (1576)',
        'Annexation of Odisha by Raja Man Singh (1592)'
      ],
      capitals: ['Agra', 'Fatehpur Sikri (1571–85)', 'Lahore (1585–98)'],
      historicalSignificance: 'Transformed a fragile warlord kingdom into a deeply entrenched, multi-ethnic, multi-religious empire that dominated world GDP.',
      interestingFacts: [
        'Illiterate himself due to dyslexia, Akbar collected an imperial library of over 24,000 volumes and had them read to him daily.',
        'Established the Ibadat Khana (House of Worship) where scholars of Hinduism, Islam, Jainism, Christianity, and Zoroastrianism debated philosophy.'
      ]
    },
    controlledRegionIds: [
      'kabul_qandahar',
      'punjab_lahore',
      'delhi_agra',
      'kashmir_frontier',
      'rajasthan_rajputana',
      'malwa_bundelkhand',
      'gujarat',
      'bihar_bengal',
      'odisha_utkala',
      'khandesh_ahmadnagar'
    ],
    newlyAcquiredRegionIds: [
      'kashmir_frontier',
      'rajasthan_rajputana',
      'gujarat',
      'bihar_bengal',
      'odisha_utkala',
      'khandesh_ahmadnagar'
    ],
    campaignVectors: [
      {
        id: 'akbar_gujarat_dash',
        name: 'Akbar’s Nine-Day Lightning March to Gujarat',
        from: { x: 375, y: 280 },
        to: { x: 240, y: 415 },
        path: 'M 375,280 Q 300,340 240,415',
        year: '1573',
        description: 'Covered 450 miles in 9 days with 3,000 hand-picked troops, surprising and routing the Gujarat insurgents.',
        commander: 'Emperor Akbar'
      },
      {
        id: 'man_singh_odisha',
        name: 'Raja Man Singh’s Campaign to Annex Odisha',
        from: { x: 630, y: 350 },
        to: { x: 640, y: 485 },
        path: 'M 630,350 Q 640,410 640,485',
        year: '1590–1592',
        description: 'Rajput general Raja Man Singh subdued the Afghan commanders and integrated Odisha as a prosperous imperial Subah.',
        commander: 'Raja Man Singh'
      }
    ],
    cities: [
      { name: 'Kabul', odiaName: 'କାବୁଲ', x: 180, y: 135, type: 'capital' },
      { name: 'Srinagar', odiaName: 'ଶ୍ରୀନଗର', x: 290, y: 110, type: 'city', yearFoundedOrConquered: '1586' },
      { name: 'Lahore', odiaName: 'ଲାହୋର', x: 270, y: 205, type: 'capital' },
      { name: 'Delhi', odiaName: 'ଦିଲ୍ଲୀ', x: 360, y: 260, type: 'capital' },
      { name: 'Fatehpur Sikri', odiaName: 'ଫତେହପୁର ସିକ୍ରି', x: 375, y: 280, type: 'capital', yearFoundedOrConquered: '1571' },
      { name: 'Agra', odiaName: 'ଆଗ୍ରା', x: 380, y: 285, type: 'capital' },
      { name: 'Ahmedabad', odiaName: 'ଅହମ୍ମଦାବାଦ୍', x: 235, y: 400, type: 'port', yearFoundedOrConquered: '1573' },
      { name: 'Surat', odiaName: 'ସୁରଟ୍', x: 245, y: 460, type: 'port', yearFoundedOrConquered: '1573' },
      { name: 'Patna', odiaName: 'ପାଟଣା', x: 570, y: 320, type: 'city', yearFoundedOrConquered: '1574' },
      { name: 'Dhaka', odiaName: 'ଢାକା', x: 740, y: 380, type: 'city', yearFoundedOrConquered: '1576' },
      { name: 'Cuttack', odiaName: 'କଟକ', x: 645, y: 490, type: 'fort', yearFoundedOrConquered: '1592' },
      { name: 'Puri', odiaName: 'ପୁରୀ', x: 650, y: 520, type: 'city', yearFoundedOrConquered: '1592' },
      { name: 'Asirgarh', odiaName: 'ଆସିରଗଡ଼', x: 370, y: 450, type: 'fort', yearFoundedOrConquered: '1601' }
    ],
    summaryText: 'Akbar dramatically expands the empire across Rajasthan, Gujarat, Bengal, Odisha, Kashmir, and northern Deccan. He institutes religious tolerance, efficient provincial governance, and an unbeatable military machine.',
    territorialExtentSqKm: '~3.2 Million Sq Km'
  },

  // Frame 5: 1605–1627 – Jahangir
  {
    id: 'frame_1605_jahangir',
    frameNumber: 5,
    yearDisplay: '1605–1627 CE',
    title: 'Reign of Jahangir: Cultural Flourishing & Consolidation',
    subtitle: 'Settlement with Mewar and the Rise of Nur Jahan',
    ruler: {
      name: 'Nur-ud-din Muhammad Jahangir',
      odiaName: 'ଜାହାଙ୍ଗୀର',
      reignPeriod: '1605–1627 CE',
      title: 'World Seizer (ଜାହାଙ୍ଗୀର)',
      achievements: [
        'Negotiated the peaceful historic treaty with Rana Amar Singh of Mewar (1615)',
        'Installed the famous "Chain of Justice" (Zanjir-i-Adl) at Agra Fort for direct public redress',
        'Elevated Mughal miniature painting and botanical illustration to world-renowned heights',
        'Empowered Empress Nur Jahan, who ran the administration and struck coins in her name'
      ],
      importantBattles: [
        'Siege of Kangra Fort (1620)',
        'Deccan campaigns against Malik Ambar (1616–1621)'
      ],
      capitals: ['Agra', 'Lahore'],
      historicalSignificance: 'Consolidated his father’s immense empire, integrated eastern Bengal, and maintained internal stability while the arts, horticulture, and architecture flourished.',
      interestingFacts: [
        'Received Sir Thomas Roe, ambassador of King James I of England, granting the English East India Company permission to set up a factory at Surat in 1615.',
        'Commissioned the Shalimar Gardens in Srinagar out of deep love for Kashmir.'
      ]
    },
    controlledRegionIds: [
      'kabul_qandahar',
      'punjab_lahore',
      'delhi_agra',
      'kashmir_frontier',
      'rajasthan_rajputana',
      'malwa_bundelkhand',
      'gujarat',
      'bihar_bengal',
      'odisha_utkala',
      'khandesh_ahmadnagar'
    ],
    newlyAcquiredRegionIds: [],
    campaignVectors: [
      {
        id: 'kangra_siege',
        name: 'Conquest of Kangra Fort',
        from: { x: 310, y: 210 },
        to: { x: 320, y: 165 },
        path: 'M 310,210 Q 315,190 320,165',
        year: '1620',
        description: 'Prince Khurram captured the hitherto impregnable Himalayan fortress of Kangra.',
        commander: 'Prince Khurram (Shah Jahan)'
      }
    ],
    cities: [
      { name: 'Kabul', odiaName: 'କାବୁଲ', x: 180, y: 135, type: 'capital' },
      { name: 'Lahore', odiaName: 'ଲାହୋର', x: 270, y: 205, type: 'capital' },
      { name: 'Agra', odiaName: 'ଆଗ୍ରା', x: 380, y: 285, type: 'capital' },
      { name: 'Surat', odiaName: 'ସୁରଟ୍', x: 245, y: 460, type: 'port' },
      { name: 'Udaipur', odiaName: 'ଉଦୟପୁର', x: 270, y: 350, type: 'city', yearFoundedOrConquered: '1615' },
      { name: 'Cuttack', odiaName: 'କଟକ', x: 645, y: 490, type: 'fort' }
    ],
    summaryText: 'Jahangir consolidates Mughal borders, pacifies Mewar on honorable terms, secures Kangra, and fends off Safavid aggression while fostering unmatched miniature art and European maritime treaties.',
    territorialExtentSqKm: '~3.3 Million Sq Km'
  },

  // Frame 6: 1628–1658 – Shah Jahan
  {
    id: 'frame_1628_shahjahan',
    frameNumber: 6,
    yearDisplay: '1628–1658 CE',
    title: 'Shah Jahan: Zenith of Splendour & Deccan Subjugation',
    subtitle: 'The Architectural Apex and Subjugation of Ahmadnagar',
    ruler: {
      name: 'Shahab-ud-din Muhammad Shah Jahan',
      odiaName: 'ଶାହଜାହାନ',
      reignPeriod: '1628–1658 CE',
      title: 'Architect Emperor & King of the World',
      achievements: [
        'Erected the Taj Mahal at Agra in memory of Mumtaz Mahal',
        'Built the Red Fort (Lal Qila) and Jama Masjid in his new capital Shahjahanabad (Delhi)',
        'Commissioned the dazzling gem-encrusted Peacock Throne (Takht-i-Taus) containing the Koh-i-Noor diamond',
        'Completely extinguished the Nizam Shahi kingdom of Ahmadnagar (1636)',
        'Forced Bijapur and Golconda to accept Mughal suzerainty and pay vast annual tribute'
      ],
      importantBattles: [
        'Suppression of Khan Jahan Lodi rebellion (1631)',
        'Treaties of Deference with Bijapur and Golconda (1636)',
        'Central Asian campaigns to Balkh and Badakhshan (1646–47)',
        'Sieges of Qandahar (1649–1653)'
      ],
      capitals: ['Agra', 'Shahjahanabad (Old Delhi)'],
      historicalSignificance: 'Regarded as the golden age of Mughal prosperity, architecture, and revenue abundance, despite disastrous sieges to reclaim Qandahar.',
      interestingFacts: [
        'Estimated to be the wealthiest monarch in world history at the time, with imperial revenues exceeding 30 million pounds sterling.',
        'Deposed and imprisoned inside the Musamman Burj of Agra Fort by his son Aurangzeb in 1658, gazing at the Taj Mahal until his death in 1666.'
      ]
    },
    controlledRegionIds: [
      'punjab_lahore',
      'delhi_agra',
      'kashmir_frontier',
      'rajasthan_rajputana',
      'malwa_bundelkhand',
      'gujarat',
      'bihar_bengal',
      'odisha_utkala',
      'khandesh_ahmadnagar'
    ],
    newlyAcquiredRegionIds: ['khandesh_ahmadnagar'],
    campaignVectors: [
      {
        id: 'deccan_subjugation',
        name: 'Deccan Settlement & Treaties of 1636',
        from: { x: 380, y: 440 },
        to: { x: 420, y: 550 },
        path: 'M 380,440 Q 400,500 420,550',
        year: '1636',
        description: 'Prince Aurangzeb served as Viceroy of the Deccan, annexing Ahmadnagar and extracting tribute treaties from Bijapur and Golconda.',
        commander: 'Shah Jahan & Prince Aurangzeb'
      }
    ],
    cities: [
      { name: 'Shahjahanabad', odiaName: 'ଦିଲ୍ଲୀ (ଶାହଜାହାନାବାଦ୍)', x: 360, y: 260, type: 'capital', yearFoundedOrConquered: '1648' },
      { name: 'Agra', odiaName: 'ଆଗ୍ରା (ତାଜମହଲ)', x: 380, y: 285, type: 'capital' },
      { name: 'Aurangabad', odiaName: 'ଔରଙ୍ଗାବାଦ୍', x: 340, y: 490, type: 'city', yearFoundedOrConquered: '1636' },
      { name: 'Daulatabad', odiaName: 'ଦୌଲତାବାଦ୍', x: 345, y: 480, type: 'fort' },
      { name: 'Burhanpur', odiaName: 'ବୁରହାନପୁର', x: 380, y: 460, type: 'fort' }
    ],
    summaryText: 'Shah Jahan formalizes the annexation of Ahmadnagar, compels Bijapur and Golconda into tributary status, and builds the architectural wonders of the world, though losing Qandahar permanently to Persia.',
    territorialExtentSqKm: '~3.5 Million Sq Km'
  },

  // Frame 7: 1658–1707 – Aurangzeb
  {
    id: 'frame_1658_aurangzeb',
    frameNumber: 7,
    yearDisplay: '1658–1707 CE',
    title: 'Aurangzeb Alamgir: Maximum Territorial Expanse',
    subtitle: 'Annexation of Bijapur & Golconda and the 25-Year Deccan Wars',
    ruler: {
      name: 'Muhi-ud-din Muhammad Aurangzeb Alamgir',
      odiaName: 'ଔରଙ୍ଗଜେବ ଆଲାମଗୀର',
      reignPeriod: '1658–1707 CE',
      title: 'Alamgir (Conqueror of the World)',
      achievements: [
        'Conquered the Sultanate of Bijapur (1686) and Sultanate of Golconda (1687)',
        'Compiled the comprehensive Islamic legal compendium Fatawa-e-Alamgiri',
        'Captured and executed Maratha ruler Sambhaji at Tuljapur (1689)',
        'Pushed imperial boundaries south past the Krishna river to Jinji and Thanjavur'
      ],
      importantBattles: [
        'Battle of Samugarh (1658 - War of Succession)',
        'Siege of Bijapur (1685–1686)',
        'Siege of Golconda (1687)',
        'Siege of Jinji Fortress (1690–1698)'
      ],
      capitals: ['Delhi', 'Travelling Imperial Military Camp (Deccan)'],
      historicalSignificance: 'Achieved the widest geographic expansion in Indian history after the Mauryas, ruling over 4 million square kilometers and 158 million people, but overextended military resources sparked imperial exhaustion.',
      interestingFacts: [
        'Refused to use public treasury money for personal expenses, earning his personal livelihood by hand-copying the Quran and sewing prayer caps.',
        'Reimposed Jizya tax in 1679; banned court music, astrology, and excessive displays of courtly ostentation.'
      ]
    },
    controlledRegionIds: [
      'punjab_lahore',
      'delhi_agra',
      'kashmir_frontier',
      'rajasthan_rajputana',
      'malwa_bundelkhand',
      'gujarat',
      'bihar_bengal',
      'odisha_utkala',
      'khandesh_ahmadnagar',
      'bijapur_golconda',
      'deep_south_carnatic'
    ],
    newlyAcquiredRegionIds: [
      'bijapur_golconda',
      'deep_south_carnatic'
    ],
    campaignVectors: [
      {
        id: 'golconda_bijapur_conquest',
        name: 'Aurangzeb’s Deccan Sieges (Bijapur & Golconda)',
        from: { x: 380, y: 460 },
        to: { x: 490, y: 580 },
        path: 'M 380,460 Q 420,520 490,580',
        year: '1685–1687',
        description: 'Aurangzeb personally encamped in the Deccan with an army of 500,000, reducing both ancient capitals.',
        commander: 'Emperor Aurangzeb'
      },
      {
        id: 'jinji_campaign',
        name: 'Siege of Jinji Fortress in the Deep South',
        from: { x: 490, y: 580 },
        to: { x: 480, y: 730 },
        path: 'M 490,580 Q 480,660 480,730',
        year: '1690–1698',
        description: 'Zulfiqar Khan pressed the siege of Jinji against Maratha resistance for 8 exhausting years.',
        commander: 'General Zulfiqar Khan'
      }
    ],
    cities: [
      { name: 'Delhi', odiaName: 'ଦିଲ୍ଲୀ', x: 360, y: 260, type: 'capital' },
      { name: 'Agra', odiaName: 'ଆଗ୍ରା', x: 380, y: 285, type: 'city' },
      { name: 'Bijapur', odiaName: 'ବିଜାପୁର', x: 390, y: 560, type: 'fort', yearFoundedOrConquered: '1686' },
      { name: 'Golconda / Hyderabad', odiaName: 'ଗୋଲକୋଣ୍ଡା / ହାଇଦ୍ରାବାଦ', x: 510, y: 575, type: 'fort', yearFoundedOrConquered: '1687' },
      { name: 'Cuttack', odiaName: 'କଟକ', x: 645, y: 490, type: 'fort' },
      { name: 'Jinji', odiaName: 'ଜିଞ୍ଜି ଦୁର୍ଗ', x: 480, y: 730, type: 'battlefield', yearFoundedOrConquered: '1698' },
      { name: 'Khuldabad', odiaName: 'ଖୁଲଦାବାଦ୍ (ସମାଧି)', x: 345, y: 495, type: 'city', yearFoundedOrConquered: '1707' }
    ],
    summaryText: 'The Mughal Empire reaches its absolute territorial maximum under Aurangzeb, encompassing almost the entire Indian subcontinent down to Thanjavur. However, prolonged warfare with Maratha swarms drains imperial reserves, setting the stage for 18th-century fragmentation.',
    territorialExtentSqKm: '~4.0 Million Sq Km'
  }
];

export const MUGHAL_CHRONOLOGICAL_EVENTS = [
  {
    year: '1526 CE',
    frameIndex: 0,
    eventTitle: 'First Battle of Panipat',
    ruler: 'Babur',
    location: 'Panipat, Haryana',
    description: 'Babur uses matchlocks and artillery to smash Ibrahim Lodi’s massive army, taking Delhi and Agra.',
    impact: 'End of Delhi Sultanate; birth of Mughal Empire.'
  },
  {
    year: '1527 CE',
    frameIndex: 0,
    eventTitle: 'Battle of Khanwa',
    ruler: 'Babur',
    location: 'Khanwa, near Bharatpur',
    description: 'Babur defeats the formidable Rajput confederacy led by Rana Sanga of Mewar.',
    impact: 'Secured Mughal foothold in North India.'
  },
  {
    year: '1539 CE',
    frameIndex: 1,
    eventTitle: 'Battle of Chausa',
    ruler: 'Humayun vs Sher Shah Suri',
    location: 'Chausa, Bihar border',
    description: 'Sher Shah Suri surprises Humayun’s camp on the banks of Ganga, routing the imperial army.',
    impact: 'Sher Shah assumes the title of Sultan; Mughals on defensive.'
  },
  {
    year: '1540 CE',
    frameIndex: 1,
    eventTitle: 'Battle of Kannauj (Bilgram)',
    ruler: 'Humayun vs Sher Shah Suri',
    location: 'Kannauj, Uttar Pradesh',
    description: 'Decisive Afghan victory expels Humayun from India for fifteen years.',
    impact: 'Establishment of the Sur Empire (1540–1555).'
  },
  {
    year: '1555 CE',
    frameIndex: 2,
    eventTitle: 'Battle of Sirhind',
    ruler: 'Humayun & Bairam Khan',
    location: 'Sirhind, Punjab',
    description: 'Mughals defeat Sikandar Shah Suri, recapturing Delhi and Lahore.',
    impact: 'Mughal dynasty restored to the throne of Delhi.'
  },
  {
    year: '1556 CE',
    frameIndex: 3,
    eventTitle: 'Second Battle of Panipat',
    ruler: 'Akbar (Regent Bairam Khan) vs Hemu',
    location: 'Panipat, Haryana',
    description: 'Hemu’s eye is struck by a stray arrow while winning, turning victory into total rout.',
    impact: '13-year-old Akbar firmly secures the throne of Hindustan.'
  },
  {
    year: '1568 CE',
    frameIndex: 3,
    eventTitle: 'Siege of Chittorgarh',
    ruler: 'Akbar the Great',
    location: 'Chittor, Rajasthan',
    description: 'Akbar breaches the mighty fortress after Jaimal and Patta’s legendary defense.',
    impact: 'Broken Rajput resistance; prestige of Sisodias checked.'
  },
  {
    year: '1573 CE',
    frameIndex: 3,
    eventTitle: 'Annexation of Gujarat',
    ruler: 'Akbar the Great',
    location: 'Ahmedabad & Surat',
    description: 'Akbar executes a 9-day blitzkrieg march from Fatehpur Sikri to crush Gujarat rebels.',
    impact: 'Mughals gain lucrative Arabian Sea trading ports and European commerce.'
  },
  {
    year: '1576 CE',
    frameIndex: 3,
    eventTitle: 'Battle of Haldighati & Conquest of Bengal',
    ruler: 'Akbar (Man Singh) vs Maharana Pratap / Daud Karrani',
    location: 'Haldighati & Rajmahal',
    description: 'Maharana Pratap resists in the hills; Bengal Subah is permanently annexed from the Afghans.',
    impact: 'Consolidation of eastern and western frontiers.'
  },
  {
    year: '1592 CE',
    frameIndex: 3,
    eventTitle: 'Raja Man Singh Annexes Odisha',
    ruler: 'Akbar the Great (Raja Man Singh)',
    location: 'Cuttack & Sarangagarh, Odisha',
    description: 'Rajput general Man Singh subdues the Afghan chieftains and establishes Odisha as an imperial Subah.',
    impact: 'Odisha integrated into Mughal administrative revenue structure; Puri temple safeguarded.'
  },
  {
    year: '1615 CE',
    frameIndex: 4,
    eventTitle: 'Treaty of Peace with Mewar',
    ruler: 'Jahangir (Prince Khurram) & Rana Amar Singh',
    location: 'Udaipur, Rajasthan',
    description: 'Mewar accepts Mughal suzerainty on honorable terms without requiring matrimonial surrender.',
    impact: 'Century-long Mughal-Rajput warfare brought to an honorable end.'
  },
  {
    year: '1636 CE',
    frameIndex: 5,
    eventTitle: 'Annexation of Ahmadnagar & Deccan Treaties',
    ruler: 'Shah Jahan',
    location: 'Deccan',
    description: 'Shah Jahan extinguishes Nizam Shahi rule and imposes heavy tributes on Bijapur and Golconda.',
    impact: 'Mughal borders pushed definitively south of the Godavari.'
  },
  {
    year: '1686 CE',
    frameIndex: 6,
    eventTitle: 'Conquest of Bijapur',
    ruler: 'Aurangzeb Alamgir',
    location: 'Bijapur, Karnataka',
    description: 'Aurangzeb besieges Adil Shahi capital for 15 months until Sikandar Adil Shah surrenders.',
    impact: 'Bijapur annexed as imperial Subah.'
  },
  {
    year: '1687 CE',
    frameIndex: 6,
    eventTitle: 'Fall of Golconda Citadel',
    ruler: 'Aurangzeb Alamgir',
    location: 'Golconda Fortress, Hyderabad',
    description: 'After an 8-month siege, Mughal troops breach the fortress through treachery of a gatekeeper.',
    impact: 'Qutb Shahi diamond kingdom absorbed; Mughal empire reaches peak territorial expanse.'
  },
  {
    year: '1698 CE',
    frameIndex: 6,
    eventTitle: 'Capture of Jinji Fortress',
    ruler: 'Aurangzeb (General Zulfiqar Khan)',
    location: 'Jinji, Tamil Nadu',
    description: 'Longest siege in Indian history (8 years) captures the southern Maratha redoubt.',
    impact: 'Nominal Mughal authority established across Tamilakam down to Kaveri.'
  }
];

export const MUGHAL_MAP_DATA: HistoricalMap = {
  id: 'mughal_empire_1526_1707',
  title: 'Mughal Empire Territorial Expansion (1526–1707)',
  odiaTitle: 'ମୋଗଲ ସାମ୍ରାଜ୍ୟର ଭୌଗୋଳିକ ବିସ୍ତାର (୧୫୨୬–୧୭୦୭)',
  topic: 'Mughal Empire (1526–1707)',
  era: '1526–1707 CE',
  category: 'empire',
  description: 'Chronological frame-by-frame flipbook animation illustrating the rise, expansion, consolidation, and territorial zenith of the Mughal Empire from Babur’s victory at Panipat to Aurangzeb’s Deccan conquests.',
  baseMapType: 'subcontinent',
  viewBox: '0 0 1000 850',
  regions: MUGHAL_REGIONS,
  frames: MUGHAL_FRAMES,
  events: MUGHAL_CHRONOLOGICAL_EVENTS,
  geographicFeatures: {
    rivers: SUBCONTINENT_RIVERS,
    seas: SUBCONTINENT_SEAS
  },
  isBuiltin: true,
  createdAt: '2026-11-23T10:00:00.000Z',
  updatedAt: '2026-11-23T10:00:00.000Z'
};

// =========================================================================
// 2. MAURYAN EMPIRE (c. 322–185 BCE)
// =========================================================================

export const MAURYAN_REGIONS = [
  {
    id: 'magadha_core',
    name: 'Magadha Imperial Heartland (ମଗଧ କେନ୍ଦ୍ର)',
    modernLocation: 'Bihar, Jharkhand, Eastern UP (Pataliputra / Patna)',
    previousRulerOrDynasty: 'Nanda Dynasty (Dhana Nanda)',
    conqueringRuler: 'Chandragupta Maurya (Guided by Chanakya)',
    conquestYear: '322 BCE',
    battlesInvolved: 'Fall of Pataliputra (322 BCE)',
    historicalBackground: 'Chanakya (Kautilya) vowed to overthrow the corrupt Nanda King Dhana Nanda. He trained the young Chandragupta Maurya, raised a mercenary army, allied with King Parvataka, and captured Pataliputra.',
    conquestReasons: 'Vast iron deposits in southern Bihar, elephant reserves, fertile Gangetic alluvial agriculture, and control of river trade routes.',
    historicalSignificance: 'Pataliputra became the cosmopolitan capital of the largest empire yet seen in ancient Asia.',
    aftermathAndRebellions: 'Establishment of the Saptanga administrative model codified in Kautilya’s Arthashastra.',
    politicalStatus: 'direct_annexation' as const,
    svgPath: 'M 445,260 C 510,248 580,255 640,270 C 690,285 710,330 690,375 C 650,410 590,415 530,395 C 475,375 440,320 445,260 Z',
    labelCoordinates: { x: 565, y: 325 },
    fillColor: '#8b5cf6'
  },
  {
    id: 'northwest_seleucid',
    name: 'Northwest & Seleucid Territories (ଉତ୍ତର-ପଶ୍ଚିମ ସୀମାନ୍ତ)',
    modernLocation: 'Punjab, Gandhara (Taxila), Arachosia (Kandahar), Gedrosia (Balochistan)',
    previousRulerOrDynasty: 'Seleucid Empire (Seleucus I Nicator) & Greek Satraps',
    conqueringRuler: 'Chandragupta Maurya',
    conquestYear: '305–303 BCE',
    battlesInvolved: 'Mauryan–Seleucid War (305 BCE)',
    historicalBackground: 'Following Alexander’s death, Seleucus I sought to recover Macedonian provinces. Chandragupta checked his invasion, resulting in a peace treaty where Seleucus ceded Arachosia, Gedrosia, and Paropamisadae in exchange for 500 war elephants and a matrimonial alliance.',
    conquestReasons: 'Securing the trans-Indus mountain passes against Hellenistic and steppe incursions; access to Silk Road commerce.',
    historicalSignificance: 'Greek ambassador Megasthenes visited Pataliputra and authored Indica; Ashokan rock edicts were inscribed here in Greek and Aramaic.',
    aftermathAndRebellions: 'Deep cultural synthesis between Greek, Persian, and Mauryan civilizations in Taxila.',
    politicalStatus: 'direct_annexation' as const,
    svgPath: 'M 115,100 C 175,70 255,80 325,110 C 350,145 345,210 325,255 C 285,275 220,285 165,265 C 125,230 100,165 115,100 Z',
    labelCoordinates: { x: 235, y: 180 },
    fillColor: '#a78bfa'
  },
  {
    id: 'western_avanti',
    name: 'Avanti & Saurashtra (ଅବନ୍ତୀ ଓ ସୌରାଷ୍ଟ୍ର)',
    modernLocation: 'Malwa (Ujjain), Gujarat (Junagadh), Kathiawar',
    previousRulerOrDynasty: 'Local Kshatriya republics and oligarchies',
    conqueringRuler: 'Chandragupta Maurya & Ashoka (as Viceroy)',
    conquestYear: 'c. 310 BCE',
    battlesInvolved: 'Annexation of Ujjayini',
    historicalBackground: 'Pusyagupta, Chandragupta’s provincial governor (Rashtriya) in Saurashtra, dammed the Palasini river to construct the renowned Sudarshana Lake reservoir at Junagadh for irrigation.',
    conquestReasons: 'Ujjain was the prime intersection of North-South and East-West caravan routes; ports of Bharuch provided trade with Mesopotamia and Egypt.',
    historicalSignificance: 'Ashoka served as Viceroy at Ujjain in his youth, where he married Devi, mother of Mahinda and Sanghamitta.',
    aftermathAndRebellions: 'Maintained continuous irrigation prosperity through Saka and Gupta periods.',
    politicalStatus: 'direct_annexation' as const,
    svgPath: 'M 215,360 C 270,340 335,335 385,355 C 405,395 395,440 370,470 C 320,485 265,510 220,505 C 185,480 180,420 215,360 Z',
    labelCoordinates: { x: 295, y: 415 },
    fillColor: '#c084fc'
  },
  {
    id: 'deccan_suvarnagiri',
    name: 'Deccan & Suvarnagiri (ଦକ୍ଷିଣାପଥ ଓ ସୁବର୍ଣ୍ଣଗିରି)',
    modernLocation: 'Maharashtra, Northern Karnataka, Andhra Pradesh',
    previousRulerOrDynasty: 'Local Deccan chieftaincies',
    conqueringRuler: 'Bindusara Amitraghata',
    conquestYear: 'c. 297–273 BCE',
    battlesInvolved: 'Southern Campaigns of Bindusara',
    historicalBackground: 'Known to the Greeks as "Amitrochates" (Slayer of Foes), Bindusara expanded Mauryan sovereignty deep into the Deccan plateau up to the borders of the Tamil kingdoms (Chola, Pandya, Chera).',
    conquestReasons: 'Gold mines of Suvarnagiri and Hutti; trade in pearls, diamonds, and spices.',
    historicalSignificance: 'Site of numerous Minor Rock Edicts of Ashoka (Maski, Brahmagiri, Yerragudi, Gavimath).',
    aftermathAndRebellions: 'Regional prince-viceroys (Aryaputras) were stationed at Suvarnagiri to oversee the south.',
    politicalStatus: 'direct_annexation' as const,
    svgPath: 'M 295,515 C 365,505 450,510 535,530 C 595,555 635,610 595,665 C 555,710 475,735 410,740 C 350,715 315,640 295,570 C 285,540 288,525 295,515 Z',
    labelCoordinates: { x: 450, y: 610 },
    fillColor: '#e879f9'
  },
  {
    id: 'kalinga_war_region',
    name: 'Kalinga (କଳିଙ୍ଗ: ଦୟା ନଦୀ ତଟ)',
    modernLocation: 'Odisha, Northern Andhra (Dhauli, Jaugada, Sisupalgarh)',
    previousRulerOrDynasty: 'Independent Republic / Federation of Kalinga',
    conqueringRuler: 'Ashoka the Great (ଦେବାନାଂପ୍ରିୟ ପ୍ରିୟଦର୍ଶୀ ଅଶୋକ)',
    conquestYear: '261 BCE',
    battlesInvolved: 'Kalinga War (Battle of Daya River, 261 BCE)',
    historicalBackground: 'Kalinga stood fiercely independent between the Mauryan Magadha heartland and maritime trade lanes. In the 8th year of his consecration (261 BCE), Ashoka launched a colossal invasion. The river Daya turned red with blood.',
    conquestReasons: 'Control of maritime trade with Suvarnabhumi (Southeast Asia), ports of Tamralipti, Manikapatna, and Palur; ending the strategic encirclement of Magadha.',
    historicalSignificance: 'Turning point in world history. Rock Edict XIII records that 100,000 were slain, 150,000 carried away captive, and countless perished. Overcome by intense remorse, Ashoka renounced Bherighosha (war drums) for Dhammaghosha (call of Dharma) and embraced Buddhism.',
    aftermathAndRebellions: 'Ashoka established separate Rock Edicts at Dhauli (Tosali) and Jaugada (Samapa), proclaiming "All men are my children" (ସବେ ମୁନିସେ ପଜା ମମ).',
    politicalStatus: 'direct_annexation' as const,
    svgPath: 'M 565,435 C 615,430 670,445 715,455 C 725,485 705,515 675,540 C 645,565 615,550 585,520 C 565,490 555,460 565,435 Z',
    labelCoordinates: { x: 635, y: 495 },
    fillColor: '#f43f5e'
  }
];

export const MAURYAN_FRAMES: HistoricalFrame[] = [
  {
    id: 'frame_maurya_chandragupta',
    frameNumber: 1,
    yearDisplay: '322–297 BCE',
    title: 'Chandragupta Maurya: Overthrow of Nandas & Seleucid Defeat',
    subtitle: 'From Magadha to the Hindu Kush with Chanakya',
    ruler: {
      name: 'Chandragupta Maurya',
      odiaName: 'ଚନ୍ଦ୍ରଗୁପ୍ତ ମୌର୍ଯ୍ୟ',
      reignPeriod: '322–297 BCE',
      title: 'First Emperor of Unified India',
      achievements: [
        'Overthrew Dhana Nanda with mentor Chanakya and established Mauryan dynasty',
        'Defeated Seleucus I Nicator and annexed Gandhara, Arachosia, and Gedrosia',
        'Instituted an empire-wide spy network and administrative council described in Arthashastra',
        'Constructed imperial Royal Road linking Pataliputra to Taxila'
      ],
      importantBattles: [
        'Siege of Pataliputra (322 BCE)',
        'Seleucid–Mauryan War (305–303 BCE)'
      ],
      capitals: ['Pataliputra (ପାଟଳିପୁତ୍ର)'],
      historicalSignificance: 'Unified North India and Afghanistan into the first pan-Indian empire.',
      interestingFacts: [
        'Abdicated his throne in 297 BCE to become a Jain monk alongside Acharya Bhadrabahu.',
        'Performed Sallekhana (voluntary fasting unto death) at Shravanabelagola in Karnataka.'
      ]
    },
    controlledRegionIds: ['magadha_core', 'northwest_seleucid', 'western_avanti'],
    newlyAcquiredRegionIds: ['magadha_core', 'northwest_seleucid', 'western_avanti'],
    campaignVectors: [
      {
        id: 'seleucid_treaty',
        name: 'Northwestern Campaign against Seleucus',
        from: { x: 380, y: 260 },
        to: { x: 200, y: 170 },
        path: 'M 380,260 Q 280,210 200,170',
        year: '305 BCE',
        description: 'Chandragupta moved west to check Seleucus, securing the trans-Indus provinces.',
        commander: 'Chandragupta Maurya'
      }
    ],
    cities: [
      { name: 'Pataliputra', odiaName: 'ପାଟଳିପୁତ୍ର', x: 580, y: 320, type: 'capital', yearFoundedOrConquered: '322 BCE' },
      { name: 'Taxila', odiaName: 'ତକ୍ଷଶିଳା', x: 240, y: 150, type: 'city', yearFoundedOrConquered: '305 BCE' },
      { name: 'Ujjayini', odiaName: 'ଉଜ୍ଜୟିନୀ', x: 330, y: 380, type: 'city', yearFoundedOrConquered: '315 BCE' }
    ],
    summaryText: 'Guided by Chanakya, Chandragupta unifies northern and northwestern India, checking the successor empire of Alexander the Great and laying the institutional bedrock of imperial India.',
    territorialExtentSqKm: '~3.4 Million Sq Km'
  },
  {
    id: 'frame_maurya_bindusara',
    frameNumber: 2,
    yearDisplay: '297–273 BCE',
    title: 'Bindusara Amitraghata: Penetration of the Deccan',
    subtitle: 'Expanding Southwards while Preserving Kalinga’s Independence',
    ruler: {
      name: 'Bindusara Amitraghata',
      odiaName: 'ବିନ୍ଦୁସାର ଅମିତ୍ରଘାତ',
      reignPeriod: '297–273 BCE',
      title: 'Slayer of Enemies (ଅମିତ୍ରଘାତ)',
      achievements: [
        'Conquered 16 states between the two seas (Arabian Sea and Bay of Bengal)',
        'Annexed the Deccan plateau up to Mysore',
        'Maintained diplomatic relations with Antiochus I of Syria and Ptolemy II of Egypt'
      ],
      importantBattles: ['Deccan subjugation campaigns'],
      capitals: ['Pataliputra'],
      historicalSignificance: 'Extended imperial sway across the peninsular subcontinent, leaving only Kalinga and Tamil kingdoms independent.',
      interestingFacts: [
        'Famously requested Syrian king Antiochus I to send sweet wine, dried figs, and a Greek philosopher.',
        'Patron of the Ajivika philosophical sect.'
      ]
    },
    controlledRegionIds: ['magadha_core', 'northwest_seleucid', 'western_avanti', 'deccan_suvarnagiri'],
    newlyAcquiredRegionIds: ['deccan_suvarnagiri'],
    campaignVectors: [
      {
        id: 'deccan_push',
        name: 'Bindusara’s Peninsular Conquests',
        from: { x: 330, y: 380 },
        to: { x: 440, y: 580 },
        path: 'M 330,380 Q 380,480 440,580',
        year: 'c. 285 BCE',
        description: 'Bindusara penetrated south through the Deccan plateau, stationing viceroys at Suvarnagiri.',
        commander: 'Bindusara'
      }
    ],
    cities: [
      { name: 'Pataliputra', odiaName: 'ପାଟଳିପୁତ୍ର', x: 580, y: 320, type: 'capital' },
      { name: 'Taxila', odiaName: 'ତକ୍ଷଶିଳା', x: 240, y: 150, type: 'city' },
      { name: 'Suvarnagiri', odiaName: 'ସୁବର୍ଣ୍ଣଗିରି', x: 440, y: 620, type: 'city', yearFoundedOrConquered: 'c. 280 BCE' }
    ],
    summaryText: 'Bindusara brings the Deccan into the imperial fold. Kalinga remains an unconquered sovereign maritime kingdom right on Magadha’s eastern border.',
    territorialExtentSqKm: '~4.2 Million Sq Km'
  },
  {
    id: 'frame_maurya_ashoka_kalinga',
    frameNumber: 3,
    yearDisplay: '261 BCE',
    title: 'Ashoka & the Kalinga War: The Great Transformation',
    subtitle: 'Carnage at River Daya and the Dawn of Dhamma-Vijaya',
    ruler: {
      name: 'Ashoka the Great (Devanampriya Priyadarsi)',
      odiaName: 'ଦେବାନାଂପ୍ରିୟ ପ୍ରିୟଦର୍ଶୀ ଅଶୋକ',
      reignPeriod: '268–232 BCE',
      title: 'Chakravartin & Apostle of Ahimsa',
      achievements: [
        'Annexed Kalinga after the monumental 261 BCE war',
        'Abandoned aggressive military expansion (Digvijaya) in favour of moral conquest (Dhammavijaya)',
        'Inscribed Major Rock Edicts, Pillar Edicts, and Cave Edicts throughout South Asia in Brahmi, Kharoshthi, Greek, and Aramaic',
        'Convened the Third Buddhist Council at Pataliputra (c. 250 BCE)',
        'Sent his children Mahinda and Sanghamitta to Sri Lanka and emissaries to Hellenistic kings'
      ],
      importantBattles: ['Kalinga War (Battle of Daya River, 261 BCE)'],
      capitals: ['Pataliputra'],
      historicalSignificance: 'The tragedy of Kalinga transformed imperial statecraft from violence to moral righteousness, spreading Buddhism across Asia.',
      interestingFacts: [
        'His Lion Capital at Sarnath is the National Emblem of India, and the Ashoka Chakra is centered on the Indian National Flag.',
        'Rock Edict XIII contains the most candid imperial admission of remorse and guilt in all of human history.'
      ]
    },
    controlledRegionIds: [
      'magadha_core',
      'northwest_seleucid',
      'western_avanti',
      'deccan_suvarnagiri',
      'kalinga_war_region'
    ],
    newlyAcquiredRegionIds: ['kalinga_war_region'],
    campaignVectors: [
      {
        id: 'ashoka_kalinga_march',
        name: 'Ashoka’s Invasion of Kalinga',
        from: { x: 580, y: 320 },
        to: { x: 645, y: 485 },
        path: 'M 580,320 Q 610,400 645,485',
        year: '261 BCE',
        description: 'Imperial legions marched south into Kalinga, clashing at the plains of Dhauli along the Daya river.',
        commander: 'Emperor Ashoka'
      }
    ],
    cities: [
      { name: 'Pataliputra', odiaName: 'ପାଟଳିପୁତ୍ର', x: 580, y: 320, type: 'capital' },
      { name: 'Tosali (Dhauli)', odiaName: 'ତୋଷାଳୀ (ଧଉଳି)', x: 645, y: 495, type: 'city', yearFoundedOrConquered: '261 BCE' },
      { name: 'Samapa (Jaugada)', odiaName: 'ସମାପା (ଜଉଗଡ଼)', x: 630, y: 535, type: 'fort', yearFoundedOrConquered: '261 BCE' },
      { name: 'Taxila', odiaName: 'ତକ୍ଷଶିଳା', x: 240, y: 150, type: 'city' },
      { name: 'Sarnath', odiaName: 'ସାରନାଥ', x: 515, y: 330, type: 'city' }
    ],
    summaryText: 'Ashoka conquers Kalinga at catastrophic human cost. Deeply moved by the devastation, he embraces the Buddhist Dharma of compassion and replaces territorial conquest with moral victory throughout Asia.',
    territorialExtentSqKm: '~5.0 Million Sq Km'
  }
];

export const MAURYAN_MAP_DATA: HistoricalMap = {
  id: 'mauryan_empire_322_185_bce',
  title: 'Mauryan Empire & Ashokan Pax (322–185 BCE)',
  odiaTitle: 'ମୌର୍ଯ୍ୟ ସାମ୍ରାଜ୍ୟ ଓ ଅଶୋକଙ୍କ ଧର୍ମ ବିଜୟ (ଖ୍ରୀ.ପୂ. ୩୨୨–୧୮୫)',
  topic: 'Mauryan Empire',
  era: 'c. 322–185 BCE',
  category: 'empire',
  description: 'Chronological progression of the Mauryan Empire from Chandragupta’s liberation of the northwest to Bindusara’s Deccan campaigns and Ashoka’s fateful Kalinga War and moral conversion.',
  baseMapType: 'subcontinent',
  viewBox: '0 0 1000 850',
  regions: MAURYAN_REGIONS,
  frames: MAURYAN_FRAMES,
  events: [
    {
      year: '322 BCE',
      frameIndex: 0,
      eventTitle: 'Overthrow of Nanda Dynasty',
      ruler: 'Chandragupta Maurya',
      location: 'Pataliputra',
      description: 'Chandragupta and Chanakya overthrow Dhana Nanda, establishing the Mauryan Empire.',
      impact: 'Birth of unified Magadhan empire.'
    },
    {
      year: '305 BCE',
      frameIndex: 0,
      eventTitle: 'Seleucid-Mauryan War & Treaty',
      ruler: 'Chandragupta Maurya & Seleucus I',
      location: 'Indus Valley',
      description: 'Seleucus cedes Arachosia, Gedrosia, and Gandhara; Megasthenes sent as Greek ambassador.',
      impact: 'Indian subcontinent borders push beyond Hindu Kush.'
    },
    {
      year: 'c. 285 BCE',
      frameIndex: 1,
      eventTitle: 'Bindusara’s Southern Conquests',
      ruler: 'Bindusara',
      location: 'Deccan & Karnataka',
      description: 'Bindusara conquers peninsular lands up to Mysore.',
      impact: 'Mauryan dominance covers northern and peninsular India.'
    },
    {
      year: '261 BCE',
      frameIndex: 2,
      eventTitle: 'The Fateful Kalinga War',
      ruler: 'Ashoka the Great',
      location: 'Dhauli, River Daya, Odisha',
      description: 'Ashoka conquers Kalinga after massive bloodshed; over 100,000 killed.',
      impact: 'Ashoka renounces war, adopts Buddhism, and proclaims moral governance (Dhamma).'
    },
    {
      year: 'c. 250 BCE',
      frameIndex: 2,
      eventTitle: 'Third Buddhist Council & Edicts',
      ruler: 'Ashoka the Great',
      location: 'Pataliputra & Pan-Asia',
      description: 'Edicts carved on rocks and pillars; Buddhist missions dispatched across the ancient world.',
      impact: 'Buddhism becomes a pan-Asian world religion.'
    }
  ],
  geographicFeatures: {
    rivers: SUBCONTINENT_RIVERS,
    seas: SUBCONTINENT_SEAS
  },
  isBuiltin: true,
  createdAt: '2026-11-23T10:00:00.000Z',
  updatedAt: '2026-11-23T10:00:00.000Z'
};

// =========================================================================
// 3. GUPTA EMPIRE (c. 319–550 CE)
// =========================================================================

export const GUPTA_REGIONS = [
  {
    id: 'gupta_core_prayaga',
    name: 'Magadha, Prayaga & Saketa (ମଗଧ ଓ ପ୍ରୟାଗ କେନ୍ଦ୍ର)',
    modernLocation: 'Eastern UP & Bihar (Pataliputra, Prayag, Ayodhya)',
    previousRulerOrDynasty: 'Lichchhavi Clan & local Kushan successor states',
    conqueringRuler: 'Chandragupta I',
    conquestYear: '319–320 CE',
    battlesInvolved: 'Alliance with Lichchhavi Princess Kumaradevi',
    historicalBackground: 'Chandragupta I married Lichchhavi princess Kumaradevi, which conferred immense political prestige and sparked the foundation of the Gupta Era (Gupta Samvat 319–320 CE).',
    conquestReasons: 'Control of the sacred Ganga-Yamuna Doab and ancient Magadha agricultural resources.',
    historicalSignificance: 'Adoption of the imperial title Maharajadhiraja (King of Kings).',
    aftermathAndRebellions: 'Joint gold coins struck bearing names of Chandragupta and Kumaradevi.',
    politicalStatus: 'direct_annexation' as const,
    svgPath: 'M 425,255 C 485,245 555,250 620,265 C 665,280 675,325 655,365 C 625,395 565,405 505,390 C 455,370 420,320 425,255 Z',
    labelCoordinates: { x: 535, y: 320 },
    fillColor: '#f59e0b'
  },
  {
    id: 'samudragupta_aryavarta',
    name: 'Aryavarta Extirpations & Forest Kingdoms (ଆର୍ଯ୍ୟାବର୍ତ୍ତ ବିଜୟ)',
    modernLocation: 'Punjab, Haryana, Western UP, Madhya Pradesh, Atavika forest',
    previousRulerOrDynasty: 'Nagas of Mathura, Achyuta of Ahichchhatra, Kotas',
    conqueringRuler: 'Samudragupta (The Indian Napoleon)',
    conquestYear: 'c. 335–375 CE',
    battlesInvolved: 'Eradication of 9 Kings of Aryavarta (Prasabhoddharana)',
    historicalBackground: 'The Allahabad Pillar Inscription (Prayag Prashasti) composed by court poet Harishena details Samudragupta’s policy of ruthlessly uprooting (Prasabhoddharana) northern kings and annexing their realms directly.',
    conquestReasons: 'Unifying the northern plains under one imperial umbrella.',
    historicalSignificance: 'Samudragupta performed the Ashvamedha (Horse Sacrifice) yajna and struck commemorative gold coins.',
    aftermathAndRebellions: 'Forest kings (Atavika Rajas) reduced to eternal imperial servitude.',
    politicalStatus: 'direct_annexation' as const,
    svgPath: 'M 265,185 C 325,170 395,180 445,210 C 465,245 455,300 440,350 C 415,380 355,390 315,370 C 275,340 250,280 255,230 C 258,205 260,195 265,185 Z',
    labelCoordinates: { x: 360, y: 280 },
    fillColor: '#d97706'
  },
  {
    id: 'dakshinapatha_tributaries',
    name: 'Dakshinapatha Tributaries (ଦକ୍ଷିଣାପଥ କରଦ ରାଜ୍ୟ)',
    modernLocation: 'Odisha, Andhra, Tamil Nadu (Kanchi, Vengi, Mahakantara)',
    previousRulerOrDynasty: 'Mahendra of Kosala, Vyaghraraja of Mahakantara, Vishnugopa of Kanchi',
    conqueringRuler: 'Samudragupta',
    conquestYear: 'c. 350 CE',
    battlesInvolved: 'Southern Campaign of Samudragupta',
    historicalBackground: 'Samudragupta practiced Grahana-Moksha-Anugraha (capture, liberation, and re-instatement as tributary vassals), extracting lavish annual tribute without the burden of distant direct military occupation.',
    conquestReasons: 'Enormous wealth tribute and acknowledging Gupta suzerainty while allowing local dynasties to govern.',
    historicalSignificance: 'Demonstrated tactical brilliance in marching over 3,000 miles down the eastern coast and returning victorious.',
    aftermathAndRebellions: 'Southern kings remained loyal tributary allies throughout the 4th century.',
    politicalStatus: 'tributary_vassal' as const,
    svgPath: 'M 525,430 C 585,420 660,435 705,455 C 715,505 685,580 645,630 C 605,680 550,725 480,720 C 455,690 480,630 515,570 C 535,530 515,480 525,430 Z',
    labelCoordinates: { x: 575, y: 560 },
    fillColor: '#b45309'
  },
  {
    id: 'western_saka_malwa',
    name: 'Malwa, Gujarat & Saka Conquest (ମାଲବା ଓ ଶକ ବିଜୟ)',
    modernLocation: 'Gujarat, Saurashtra, Malwa (Ujjain, Bharuch)',
    previousRulerOrDynasty: 'Western Kshatrapas / Sakas (Rudrasimha III)',
    conqueringRuler: 'Chandragupta II Vikramaditya',
    conquestYear: 'c. 388–409 CE',
    battlesInvolved: 'Overthrow of Rudrasimha III and Sakas of Saurashtra',
    historicalBackground: 'Chandragupta II eliminated the last vestige of Saka-Scythian rule in India, adopting the title "Sakari" (Destroyer of Sakas) and "Vikramaditya".',
    conquestReasons: 'Direct access to Western sea trade with Roman and Byzantine empires via ports of Bharuch, Cambay, and Sopara.',
    historicalSignificance: 'Golden age of Sanskrit literature and science; Kalidasa flourished in Vikramaditya’s court; iron pillar at Mehrauli inscribed in his glory.',
    aftermathAndRebellions: 'Issued silver coins modeled on the Kshatrapas; Chinese pilgrim Fa-Hien travelled peacefully across the empire.',
    politicalStatus: 'direct_annexation' as const,
    svgPath: 'M 215,360 C 265,345 320,340 365,360 C 375,400 365,445 345,475 C 295,490 255,515 215,515 C 180,485 178,425 215,360 Z',
    labelCoordinates: { x: 265, y: 415 },
    fillColor: '#fbbf24'
  }
];

export const GUPTA_FRAMES: HistoricalFrame[] = [
  {
    id: 'frame_gupta_c1',
    frameNumber: 1,
    yearDisplay: '319–335 CE',
    title: 'Chandragupta I & Foundation of the Gupta Era',
    subtitle: 'Lichchhavi Alliance and Imperial Title Maharajadhiraja',
    ruler: {
      name: 'Chandragupta I',
      odiaName: 'ପ୍ରଥମ ଚନ୍ଦ୍ରଗୁପ୍ତ',
      reignPeriod: '319–335 CE',
      title: 'Maharajadhiraja (ମହାରାଜାଧିରାଜ)',
      achievements: [
        'Founded the imperial Gupta dynasty and initiated the Gupta Era (319 CE)',
        'Formed matrimonial alliance with the powerful Lichchhavi clan by marrying Kumaradevi',
        'Consolidated Prayaga, Saketa, and Magadha along the fertile Ganga river'
      ],
      importantBattles: ['Expansion across middle Gangetic valley'],
      capitals: ['Pataliputra'],
      historicalSignificance: 'Elevated a local chieftainship into an imperial power.',
      interestingFacts: ['Issued the famous "King and Queen" gold coin type showing him with Kumaradevi.']
    },
    controlledRegionIds: ['gupta_core_prayaga'],
    newlyAcquiredRegionIds: ['gupta_core_prayaga'],
    campaignVectors: [],
    cities: [
      { name: 'Pataliputra', odiaName: 'ପାଟଳିପୁତ୍ର', x: 580, y: 320, type: 'capital', yearFoundedOrConquered: '319 CE' },
      { name: 'Prayaga', odiaName: 'ପ୍ରୟାଗ', x: 490, y: 325, type: 'city', yearFoundedOrConquered: '320 CE' },
      { name: 'Saketa (Ayodhya)', odiaName: 'ସାକେତ', x: 505, y: 300, type: 'city' }
    ],
    summaryText: 'Chandragupta I unites the fertile heartland of Magadha, Prayaga, and Ayodhya, establishing the Gupta Era in 319 CE.',
    territorialExtentSqKm: '~900,000 Sq Km'
  },
  {
    id: 'frame_gupta_samudragupta',
    frameNumber: 2,
    yearDisplay: '335–375 CE',
    title: 'Samudragupta: The Indian Napoleon',
    subtitle: 'Prayag Prashasti: Subjugation of Aryavarta & Dakshinapatha',
    ruler: {
      name: 'Samudragupta',
      odiaName: 'ସମୁଦ୍ରଗୁପ୍ତ',
      reignPeriod: '335–375 CE',
      title: 'Kaviraja & Parakramanka (The Indian Napoleon)',
      achievements: [
        'Uprooted 9 kings of Aryavarta and annexed their territories into the empire',
        'Conquered 12 kings of Dakshinapatha and restored them as tribute-paying vassals',
        'Revived the ancient Ashvamedha horse sacrifice',
        'Expert veena player and patron of classical Sanskrit poetry (composed by Harishena)'
      ],
      importantBattles: ['Aryavarta Conquests', 'Dakshinapatha Expedition to Kanchi'],
      capitals: ['Pataliputra'],
      historicalSignificance: 'Extended Gupta hegemony over nearly the entire subcontinent, described by historian V.A. Smith as the "Indian Napoleon".',
      interestingFacts: ['Depicted on gold coins seated on a couch playing the musical instrument veena.']
    },
    controlledRegionIds: ['gupta_core_prayaga', 'samudragupta_aryavarta', 'dakshinapatha_tributaries'],
    newlyAcquiredRegionIds: ['samudragupta_aryavarta', 'dakshinapatha_tributaries'],
    campaignVectors: [
      {
        id: 'samudragupta_south_march',
        name: 'Dakshinapatha Coastal Expedition',
        from: { x: 490, y: 325 },
        to: { x: 520, y: 700 },
        path: 'M 490,325 Q 630,450 520,700',
        year: 'c. 350 CE',
        description: 'Marched through the dense forests of Kosala and Kalinga down to Kanchipuram, liberating kings upon receipt of tribute.',
        commander: 'Samudragupta'
      }
    ],
    cities: [
      { name: 'Pataliputra', odiaName: 'ପାଟଳିପୁତ୍ର', x: 580, y: 320, type: 'capital' },
      { name: 'Prayaga', odiaName: 'ପ୍ରୟାଗ (ପ୍ରଶସ୍ତି)', x: 490, y: 325, type: 'city' },
      { name: 'Mathura', odiaName: 'ମଥୁରା', x: 375, y: 270, type: 'city' },
      { name: 'Kanchipuram', odiaName: 'କାଞ୍ଚିପୁରମ୍', x: 515, y: 710, type: 'city' }
    ],
    summaryText: 'Samudragupta’s brilliant generalship annexes northern plains directly while securing tribute from distant peninsular rulers and frontier tribes.',
    territorialExtentSqKm: '~3.2 Million Sq Km'
  },
  {
    id: 'frame_gupta_vikramaditya',
    frameNumber: 3,
    yearDisplay: '375–415 CE',
    title: 'Chandragupta II Vikramaditya: Classical Golden Age',
    subtitle: 'Annihilation of Sakas, Arabian Sea Ports & the Navaratnas',
    ruler: {
      name: 'Chandragupta II Vikramaditya',
      odiaName: 'ଦ୍ୱିତୀୟ ଚନ୍ଦ୍ରଗୁପ୍ତ ବିକ୍ରମାଦିତ୍ୟ',
      reignPeriod: '375–415 CE',
      title: 'Sakari & Vikramaditya (ବିକ୍ରମାଦିତ୍ୟ)',
      achievements: [
        'Destroyed the Western Kshatrapas (Sakas) of Gujarat and Malwa',
        'Acquired western sea ports of Bharuch and Cambay for booming maritime commerce',
        'Court adorned by the Navaratnas (Nine Gems), including Kalidasa, Varahamihira, and Amarasimha',
        'Maintained high level of social security recorded by Chinese pilgrim Fa-Hien'
      ],
      importantBattles: ['Conquest of Western Kshatrapas (c. 395 CE)'],
      capitals: ['Pataliputra', 'Ujjayini (ଉଜ୍ଜୟିନୀ - Cultural Capital)'],
      historicalSignificance: 'Regarded as the pinnacle of ancient India’s Classical Golden Age in literature, metallurgy, astronomy, and mathematics.',
      interestingFacts: ['The rustless Iron Pillar of Delhi at Qutb Minar complex was erected in his honour.']
    },
    controlledRegionIds: [
      'gupta_core_prayaga',
      'samudragupta_aryavarta',
      'dakshinapatha_tributaries',
      'western_saka_malwa'
    ],
    newlyAcquiredRegionIds: ['western_saka_malwa'],
    campaignVectors: [
      {
        id: 'saka_overthrow',
        name: 'Campaign against Sakas of Gujarat',
        from: { x: 375, y: 270 },
        to: { x: 235, y: 400 },
        path: 'M 375,270 Q 300,340 235,400',
        year: 'c. 395 CE',
        description: 'Chandragupta II marched into Gujarat, exterminated Rudrasimha III, and annexed Kathiawar.',
        commander: 'Chandragupta II Vikramaditya'
      }
    ],
    cities: [
      { name: 'Pataliputra', odiaName: 'ପାଟଳିପୁତ୍ର', x: 580, y: 320, type: 'capital' },
      { name: 'Ujjayini', odiaName: 'ଉଜ୍ଜୟିନୀ', x: 330, y: 380, type: 'capital', yearFoundedOrConquered: '395 CE' },
      { name: 'Bharuch', odiaName: 'ଭରୁଚ (ବନ୍ଦର)', x: 260, y: 440, type: 'port', yearFoundedOrConquered: '395 CE' },
      { name: 'Mathura', odiaName: 'ମଥୁରା', x: 375, y: 270, type: 'city' }
    ],
    summaryText: 'Vikramaditya annexes Gujarat and Malwa, securing western maritime trade. The empire attains its cultural and economic peak with Kalidasa and the Navaratnas.',
    territorialExtentSqKm: '~3.6 Million Sq Km'
  }
];

export const GUPTA_MAP_DATA: HistoricalMap = {
  id: 'gupta_empire_319_550_ce',
  title: 'Gupta Empire: The Classical Golden Age (c. 319–550 CE)',
  odiaTitle: 'ଗୁପ୍ତ ସାମ୍ରାଜ୍ୟ: ଭାରତର ସୁବର୍ଣ୍ଣ ଯୁଗ (ଖ୍ରୀ. ୩୧୯–୫୫୦)',
  topic: 'Gupta Empire',
  era: 'c. 319–550 CE',
  category: 'empire',
  description: 'Flipbook animated atlas of the Gupta Dynasty: Chandragupta I’s foundation, Samudragupta’s conquest of Aryavarta and Dakshinapatha, and Chandragupta II Vikramaditya’s Saka defeat and cultural renaissance.',
  baseMapType: 'subcontinent',
  viewBox: '0 0 1000 850',
  regions: GUPTA_REGIONS,
  frames: GUPTA_FRAMES,
  events: [
    {
      year: '319 CE',
      frameIndex: 0,
      eventTitle: 'Accession of Chandragupta I & Gupta Era',
      ruler: 'Chandragupta I',
      location: 'Pataliputra',
      description: 'Lichchhavi alliance; coronation as Maharajadhiraja initiates Gupta Samvat.',
      impact: 'Foundation of Gupta imperial dynasty.'
    },
    {
      year: 'c. 350 CE',
      frameIndex: 1,
      eventTitle: 'Samudragupta’s Dakshinapatha Campaign',
      ruler: 'Samudragupta',
      location: 'Eastern Coast & Kanchi',
      description: 'Defeats 12 southern kings, liberates them as tributaries, and performs Ashvamedha.',
      impact: 'Heuristics of pan-Indian hegemony established.'
    },
    {
      year: 'c. 395 CE',
      frameIndex: 2,
      eventTitle: 'Chandragupta II Destroys the Sakas',
      ruler: 'Chandragupta II Vikramaditya',
      location: 'Gujarat & Ujjain',
      description: 'Annihilates Western Kshatrapas; establishes second capital at Ujjain.',
      impact: 'Access to western ports; peak of Sanskrit golden age.'
    },
    {
      year: '455 CE',
      frameIndex: 2,
      eventTitle: 'Skandagupta Repels the Huna Invasion',
      ruler: 'Skandagupta',
      location: 'Northwest Frontier',
      description: 'Heroically turns back the initial brutal wave of White Huns (Hunas).',
      impact: 'Preserved Indian civilization for another half century.'
    }
  ],
  geographicFeatures: {
    rivers: SUBCONTINENT_RIVERS,
    seas: SUBCONTINENT_SEAS
  },
  isBuiltin: true,
  createdAt: '2026-11-23T10:00:00.000Z',
  updatedAt: '2026-11-23T10:00:00.000Z'
};

// =========================================================================
// 4. BRITISH TERRITORIAL EXPANSION IN INDIA (1757–1857)
// =========================================================================

export const BRITISH_REGIONS = [
  {
    id: 'bengal_diwani',
    name: 'Bengal, Bihar & Orissa Diwani (ବଙ୍ଗଳା, ବିହାର ଓ ଓଡ଼ିଶା ଦିୱାନୀ)',
    modernLocation: 'West Bengal, Bangladesh, Bihar, Northern Odisha',
    previousRulerOrDynasty: 'Nawabs of Bengal (Siraj-ud-Daulah, Mir Qasim) & Mughal Emperor Shah Alam II',
    conqueringRuler: 'Robert Clive & British East India Company',
    conquestYear: '1757–1765 CE',
    battlesInvolved: 'Battle of Plassey (1757), Battle of Buxar (1764), Treaty of Allahabad (1765)',
    historicalBackground: 'After Clive bribed Mir Jafar to betray Nawab Siraj-ud-Daulah at Plassey (1757), and Hector Munro crushed the combined armies of Awadh, Bengal, and Shah Alam II at Buxar (1764), the East India Company obtained the Diwani (revenue collecting rights) over Bengal, Bihar, and Orissa.',
    conquestReasons: 'Vast agrarian land tax, monopoly over salt, opium, and textiles; established the territorial springboard to conquer the rest of India.',
    historicalSignificance: 'Transformed a commercial trading corporation into a sovereign territorial ruler in Asia.',
    aftermathAndRebellions: 'Devastating Great Bengal Famine of 1770 which killed an estimated one-third of the population due to ruthless tax extraction.',
    politicalStatus: 'direct_annexation' as const,
    svgPath: 'M 475,275 C 545,260 625,270 705,290 C 765,310 810,360 805,420 C 785,455 725,460 670,445 C 610,430 550,380 495,340 C 475,310 470,290 475,275 Z',
    labelCoordinates: { x: 650, y: 360 },
    fillColor: '#dc2626'
  },
  {
    id: 'mysore_annexation',
    name: 'Mysore & Carnatic (ମହୀଶୂର ଓ କର୍ଣ୍ଣାଟକ)',
    modernLocation: 'Karnataka, Tamil Nadu (Srirangapatna, Bangalore, Madras)',
    previousRulerOrDynasty: 'Hyder Ali & Tipu Sultan (Tiger of Mysore)',
    conqueringRuler: 'Lord Mornington (Marquess Wellesley)',
    conquestYear: '1799 CE',
    battlesInvolved: 'Fourth Anglo-Mysore War (Siege of Srirangapatna, May 1799)',
    historicalBackground: 'Tipu Sultan modernized his army with French help and pioneered iron-cased Mysorean war rockets. Wellesley surrounded Srirangapatna with massive forces; Tipu died fighting heroically at the water gate with sword in hand.',
    conquestReasons: 'Eliminating the French alliance and securing absolute control over South India and the Malabar spice trade.',
    historicalSignificance: 'Mysore was partitioned; Wodeyar child-monarch placed on throne under strict Subsidiary Alliance; Madras Presidency expanded.',
    aftermathAndRebellions: 'Tipu’s rocket technology was analyzed and copied into the British Congreve rocket used in the Napoleonic Wars.',
    politicalStatus: 'direct_annexation' as const,
    svgPath: 'M 330,640 C 390,635 465,640 535,650 C 540,695 510,745 475,765 C 440,785 405,790 380,765 C 345,730 330,685 330,640 Z',
    labelCoordinates: { x: 440, y: 705 },
    fillColor: '#ea580c'
  },
  {
    id: 'maratha_peshwa_lands',
    name: 'Maratha Territories & Bombay Presidency (ମରାଠା ଅଞ୍ଚଳ)',
    modernLocation: 'Maharashtra, Gujarat, Central India (Pune, Nagpur, Gwalior)',
    previousRulerOrDynasty: 'Maratha Confederacy (Peshwa Baji Rao II, Holkar, Scindia, Bhonsle)',
    conqueringRuler: 'Lord Hastings (Marquess of Hastings)',
    conquestYear: '1817–1818 CE',
    battlesInvolved: 'Third Anglo-Maratha War (Battle of Khadki, Koregaon, Mahidpur)',
    historicalBackground: 'The British defeated Peshwa Baji Rao II, abolished the Peshwaship, and exiled him to Bithoor near Kanpur. The Maratha confederacy was dissolved.',
    conquestReasons: 'Crushing the only pan-Indian indigenous power capable of opposing British imperial hegemony.',
    historicalSignificance: 'Vast lands annexed to create the expanded Bombay Presidency; Rajputana princely states accepted British paramountcy.',
    aftermathAndRebellions: 'Scindias, Holkars, and Gaekwads reduced to subordinate princely states; Nana Sahib (adopted son of Baji Rao II) later led the 1857 Revolt.',
    politicalStatus: 'direct_annexation' as const,
    svgPath: 'M 255,385 C 315,370 390,380 460,405 C 475,445 465,510 435,550 C 390,570 335,565 290,545 C 265,510 245,440 255,385 Z',
    labelCoordinates: { x: 360, y: 470 },
    fillColor: '#b91c1c'
  },
  {
    id: 'punjab_sikh_empire',
    name: 'Punjab & Sindh (ପଞ୍ଜାବ ଓ ଶିଖ୍ ସାମ୍ରାଜ୍ୟ)',
    modernLocation: 'Punjab, Khyber Pakhtunkhwa, Sindh (Lahore, Karachi, Peshawar)',
    previousRulerOrDynasty: 'Sikh Empire (Maharaja Ranjit Singh successors: Duleep Singh) & Talpur Amirs of Sindh',
    conqueringRuler: 'Lord Dalhousie & Sir Charles Napier',
    conquestYear: '1843–1849 CE',
    battlesInvolved: 'Conquest of Sindh (Battle of Miani 1843), Second Anglo-Sikh War (Battle of Chillianwala & Gujarat 1849)',
    historicalBackground: 'After Maharaja Ranjit Singh’s death in 1839, the Lahore Durbar fell into internal turmoil. Following bitter fighting in the Anglo-Sikh Wars, Lord Dalhousie annexed Punjab in 1849, confiscating the Koh-i-Noor diamond for Queen Victoria.',
    conquestReasons: 'Securing the North-West Frontier against the Russian Empire (The Great Game) and absorbing the fertile irrigated lands of the five rivers.',
    historicalSignificance: 'Marked the completion of the British conquest of mainland India from Cape Comorin to the Khyber Pass.',
    aftermathAndRebellions: '11-year-old Maharaja Duleep Singh was stripped of his realm, separated from his mother, and exiled to England.',
    politicalStatus: 'direct_annexation' as const,
    svgPath: 'M 145,145 C 205,120 280,135 340,165 C 350,215 340,285 315,340 C 265,360 205,365 160,345 C 135,300 125,210 145,145 Z',
    labelCoordinates: { x: 235, y: 240 },
    fillColor: '#991b1b'
  },
  {
    id: 'doctrine_of_lapse_awadh',
    name: 'Awadh & Doctrine of Lapse Annexations (ଅଯୋଧ୍ୟା ଓ ବ୍ୟପଗତ ସିଦ୍ଧାନ୍ତ)',
    modernLocation: 'Uttar Pradesh (Lucknow), Jhansi, Nagpur, Satara, Sambalpur',
    previousRulerOrDynasty: 'Nawab Wajid Ali Shah (Awadh), Rani Lakshmibai (Jhansi), Bhonsle of Nagpur',
    conqueringRuler: 'Lord Dalhousie',
    conquestYear: '1848–1856 CE',
    battlesInvolved: 'Annexation of Awadh (1856), Seizure of Jhansi, Satara, Sambalpur (1849–1854)',
    historicalBackground: 'Lord Dalhousie applied the "Doctrine of Lapse", annexing any Indian princely state whose ruler died without a natural male heir (disallowing adopted sons). Awadh was annexed in 1856 on the trumped-up pretext of "misgovernance".',
    conquestReasons: 'Direct incorporation of lucrative cotton fields and rich revenue territories without treaty negotiations.',
    historicalSignificance: 'Widespread outrage among Indian sepoys, dispossessed nobility, and peasants directly ignited the Great Revolt of 1857.',
    aftermathAndRebellions: 'Rani Lakshmibai of Jhansi, Begum Hazrat Mahal of Awadh, and Veer Surendra Sai of Sambalpur rose in armed rebellion in 1857.',
    politicalStatus: 'direct_annexation' as const,
    svgPath: 'M 395,235 C 455,225 515,240 560,265 C 570,305 555,350 525,380 C 475,395 430,380 400,350 C 385,310 380,270 395,235 Z',
    labelCoordinates: { x: 475, y: 300 },
    fillColor: '#7f1d1d'
  }
];

export const BRITISH_FRAMES: HistoricalFrame[] = [
  {
    id: 'frame_british_plassey',
    frameNumber: 1,
    yearDisplay: '1757–1765 CE',
    title: 'Plassey to Buxar: The Diwani of Bengal',
    subtitle: 'From Merchant Company to Imperial Tax Collector',
    ruler: {
      name: 'Robert Clive & EIC Council',
      odiaName: 'ରବର୍ଟ କ୍ଲାଇଭ୍ ଓ ଇଷ୍ଟ ଇଣ୍ଡିଆ କମ୍ପାନୀ',
      reignPeriod: '1757–1765 CE',
      title: 'Governor of the Presidency of Fort William',
      achievements: [
        'Overthrew Siraj-ud-Daulah at Battle of Plassey (1757)',
        'Crushed allied Indian forces at Battle of Buxar (1764)',
        'Acquired Diwani rights from Mughal Emperor Shah Alam II via Treaty of Allahabad (1765)'
      ],
      importantBattles: ['Battle of Plassey (1757)', 'Battle of Buxar (1764)'],
      capitals: ['Calcutta (Fort William)'],
      historicalSignificance: 'Gave the British company steady access to Bengal’s multimillion-pound agrarian revenues, financing further conquests.',
      interestingFacts: ['Clive returned to England with immense illicit wealth, becoming one of the richest men in Britain.']
    },
    controlledRegionIds: ['bengal_diwani'],
    newlyAcquiredRegionIds: ['bengal_diwani'],
    campaignVectors: [],
    cities: [
      { name: 'Calcutta', odiaName: 'କଲିକତା', x: 720, y: 400, type: 'capital', yearFoundedOrConquered: '1757' },
      { name: 'Plassey', odiaName: 'ପଳାଶୀ', x: 700, y: 370, type: 'battlefield', yearFoundedOrConquered: '1757' },
      { name: 'Buxar', odiaName: 'ବକ୍ସାର୍', x: 540, y: 320, type: 'battlefield', yearFoundedOrConquered: '1764' }
    ],
    summaryText: 'The East India Company triumphs at Plassey and Buxar, obtaining sovereign tax collection rights over Bengal, Bihar, and Orissa.',
    territorialExtentSqKm: '~400,000 Sq Km'
  },
  {
    id: 'frame_british_wellesley_mysore',
    frameNumber: 2,
    yearDisplay: '1799–1805 CE',
    title: 'Wellesley: Defeat of Tipu Sultan & Subsidiary Alliance',
    subtitle: 'Fall of Srirangapatna and Subjugation of the South',
    ruler: {
      name: 'Lord Wellesley (Marquess Wellesley)',
      odiaName: 'ଲର୍ଡ ୱେଲେସଲି',
      reignPeriod: '1798–1805 CE',
      title: 'Governor-General of India',
      achievements: [
        'Instituted the Subsidiary Alliance system, placing British resident troops at princely cost',
        'Stormed Srirangapatna in 1799, ending the heroic resistance of Tipu Sultan',
        'Partitioned Mysore and brought Hyderabad Nizam under Subsidiary treaty'
      ],
      importantBattles: ['Fourth Anglo-Mysore War (1799)'],
      capitals: ['Calcutta'],
      historicalSignificance: 'Eliminated the formidable threat of Tipu Sultan and extended direct British hegemony across South India.',
      interestingFacts: ['Tipu Sultan famously declared: "It is better to live one day as a tiger than a hundred years as a sheep."']
    },
    controlledRegionIds: ['bengal_diwani', 'mysore_annexation'],
    newlyAcquiredRegionIds: ['mysore_annexation'],
    campaignVectors: [
      {
        id: 'srirangapatna_assault',
        name: 'Storming of Srirangapatna',
        from: { x: 520, y: 690 },
        to: { x: 440, y: 720 },
        path: 'M 520,690 Q 480,705 440,720',
        year: '1799',
        description: 'British and Nizam troops besieged Srirangapatna; Tipu died defending the breached fortress walls.',
        commander: 'General George Harris & Arthur Wellesley'
      }
    ],
    cities: [
      { name: 'Calcutta', odiaName: 'କଲିକତା', x: 720, y: 400, type: 'capital' },
      { name: 'Madras', odiaName: 'ମାନ୍ଦ୍ରାଜ (ଚେନ୍ନାଇ)', x: 535, y: 685, type: 'port' },
      { name: 'Srirangapatna', odiaName: 'ଶ୍ରୀରଙ୍ଗପାଟଣା', x: 440, y: 720, type: 'fort', yearFoundedOrConquered: '1799' }
    ],
    summaryText: 'Lord Wellesley uses the Subsidiary Alliance to ensnare princely rulers and storms Srirangapatna in 1799, destroying Tipu Sultan.',
    territorialExtentSqKm: '~1.1 Million Sq Km'
  },
  {
    id: 'frame_british_maratha_defeat',
    frameNumber: 3,
    yearDisplay: '1818 CE',
    title: 'Third Anglo-Maratha War: End of the Peshwas',
    subtitle: 'Dissolution of the Maratha Confederacy & Expansion of Bombay',
    ruler: {
      name: 'Lord Hastings (Marquess of Hastings)',
      odiaName: 'ଲର୍ଡ ହେଷ୍ଟିଙ୍ଗସ୍',
      reignPeriod: '1813–1823 CE',
      title: 'Governor-General of India',
      achievements: [
        'Defeated the Peshwa Baji Rao II, ending the Maratha Empire',
        'Annexed Maratha domains to form Bombay Presidency',
        'Subdued the Pindaris and concluded treaties with Rajput states'
      ],
      importantBattles: ['Battle of Khadki (1817)', 'Battle of Koregaon (1818)', 'Battle of Mahidpur (1817)'],
      capitals: ['Calcutta'],
      historicalSignificance: 'Abolished the office of the Peshwa and left the British Company as the undisputed master of Central India.',
      interestingFacts: ['Peshwa Baji Rao II was stripped of all territory and sent to exile at Bithoor on a pension of 80,000 pounds.']
    },
    controlledRegionIds: ['bengal_diwani', 'mysore_annexation', 'maratha_peshwa_lands'],
    newlyAcquiredRegionIds: ['maratha_peshwa_lands'],
    campaignVectors: [
      {
        id: 'pune_khadki',
        name: 'Battle of Khadki and Capture of Pune',
        from: { x: 300, y: 550 },
        to: { x: 330, y: 510 },
        path: 'M 300,550 Q 315,530 330,510',
        year: '1817',
        description: 'British forces routed the Peshwa’s army at Khadki, occupying the historic capital of Pune.',
        commander: 'Mountstuart Elphinstone'
      }
    ],
    cities: [
      { name: 'Calcutta', odiaName: 'କଲିକତା', x: 720, y: 400, type: 'capital' },
      { name: 'Bombay', odiaName: 'ବମ୍ବେ (ମୁମ୍ବାଇ)', x: 275, y: 505, type: 'port', yearFoundedOrConquered: '1818' },
      { name: 'Pune', odiaName: 'ପୁନେ', x: 330, y: 510, type: 'city', yearFoundedOrConquered: '1818' }
    ],
    summaryText: 'The Third Anglo-Maratha War shatters the Peshwa and Maratha confederacy, absorbing Maharashtra and Central India into British rule.',
    territorialExtentSqKm: '~1.8 Million Sq Km'
  },
  {
    id: 'frame_british_dalhousie_1856',
    frameNumber: 4,
    yearDisplay: '1849–1856 CE',
    title: 'Punjab, Doctrine of Lapse & Eve of 1857 Revolt',
    subtitle: 'Annexation of Sikh Empire, Awadh, Jhansi & Sambalpur',
    ruler: {
      name: 'Lord Dalhousie',
      odiaName: 'ଲର୍ଡ ଡାଲହୌସି',
      reignPeriod: '1848–1856 CE',
      title: 'Governor-General of India',
      achievements: [
        'Annexed Punjab in 1849 following the Second Anglo-Sikh War',
        'Implemented the aggressive Doctrine of Lapse to annex Jhansi, Satara, Nagpur, and Sambalpur',
        'Annexed the kingdom of Awadh in 1856 for alleged misgovernance',
        'Introduced passenger railways (1853), electric telegraph, and uniform postage'
      ],
      importantBattles: ['Battle of Chillianwala (1849)', 'Battle of Gujrat (1849)'],
      capitals: ['Calcutta'],
      historicalSignificance: 'Brought nearly the entire Indian subcontinent under direct British administrative rule, but triggered the explosive 1857 War of Independence.',
      interestingFacts: ['The first railway train in India ran between Bombay (Bori Bunder) and Thane on 16 April 1853 under Dalhousie.']
    },
    controlledRegionIds: [
      'bengal_diwani',
      'mysore_annexation',
      'maratha_peshwa_lands',
      'punjab_sikh_empire',
      'doctrine_of_lapse_awadh'
    ],
    newlyAcquiredRegionIds: [
      'punjab_sikh_empire',
      'doctrine_of_lapse_awadh'
    ],
    campaignVectors: [
      {
        id: 'punjab_annexation_vector',
        name: 'Second Anglo-Sikh War and Annexation of Lahore',
        from: { x: 340, y: 240 },
        to: { x: 260, y: 190 },
        path: 'M 340,240 Q 300,215 260,190',
        year: '1849',
        description: 'British forces defeated the Sikh army at Gujrat; Punjab was annexed and Koh-i-Noor seized.',
        commander: 'Lord Gough & Lord Dalhousie'
      }
    ],
    cities: [
      { name: 'Calcutta', odiaName: 'କଲିକତା', x: 720, y: 400, type: 'capital' },
      { name: 'Delhi', odiaName: 'ଦିଲ୍ଲୀ', x: 360, y: 260, type: 'city' },
      { name: 'Lahore', odiaName: 'ଲାହୋର', x: 270, y: 205, type: 'city', yearFoundedOrConquered: '1849' },
      { name: 'Lucknow', odiaName: 'ଲକ୍ଷ୍ନୌ', x: 470, y: 290, type: 'city', yearFoundedOrConquered: '1856' },
      { name: 'Jhansi', odiaName: 'ଝାଁସୀ', x: 410, y: 330, type: 'fort', yearFoundedOrConquered: '1854' },
      { name: 'Sambalpur', odiaName: 'ସମ୍ବଲପୁର', x: 590, y: 450, type: 'city', yearFoundedOrConquered: '1849' }
    ],
    summaryText: 'Lord Dalhousie annexes the Sikh Empire in 1849, uses the Doctrine of Lapse to swallow Jhansi, Satara, and Sambalpur, and annexes Awadh in 1856, igniting the flames of the 1857 Revolt.',
    territorialExtentSqKm: '~3.1 Million Sq Km'
  }
];

export const BRITISH_MAP_DATA: HistoricalMap = {
  id: 'british_expansion_1757_1857',
  title: 'British Territorial Expansion in India (1757–1857)',
  odiaTitle: 'ଭାରତରେ ବ୍ରିଟିଶ୍ ଔପନିବେଶିକ ବିସ୍ତାର (୧୭୫୭–୧୮୫୭)',
  topic: 'British Territorial Expansion (1757–1857)',
  era: '1757–1857 CE',
  category: 'empire',
  description: 'Chronological frame-by-frame transformation from the East India Company’s revenue capture in Bengal to the subjugation of Mysore, Marathas, Sikhs, and the Doctrine of Lapse on the eve of the 1857 Revolt.',
  baseMapType: 'subcontinent',
  viewBox: '0 0 1000 850',
  regions: BRITISH_REGIONS,
  frames: BRITISH_FRAMES,
  events: [
    {
      year: '1757 CE',
      frameIndex: 0,
      eventTitle: 'Battle of Plassey',
      ruler: 'Robert Clive vs Siraj-ud-Daulah',
      location: 'Plassey, Bengal',
      description: 'Clive defeats the Nawab through Mir Jafar’s treachery.',
      impact: 'British Company secures political control in Bengal.'
    },
    {
      year: '1765 CE',
      frameIndex: 0,
      eventTitle: 'Treaty of Allahabad & Diwani Rights',
      ruler: 'Shah Alam II & Clive',
      location: 'Allahabad',
      description: 'Mughal Emperor grants Diwani of Bengal, Bihar, and Orissa to the EIC.',
      impact: 'Company becomes a sovereign revenue administrator.'
    },
    {
      year: '1799 CE',
      frameIndex: 1,
      eventTitle: 'Fall of Srirangapatna & Death of Tipu Sultan',
      ruler: 'Lord Wellesley vs Tipu Sultan',
      location: 'Srirangapatna, Karnataka',
      description: 'Tipu Sultan is killed defending his capital; Mysore partitioned.',
      impact: 'British supremacy established across peninsular South India.'
    },
    {
      year: '1818 CE',
      frameIndex: 2,
      eventTitle: 'Third Anglo-Maratha War Concludes',
      ruler: 'Lord Hastings vs Peshwa Baji Rao II',
      location: 'Pune & Central India',
      description: 'Peshwaship abolished; Bombay Presidency created.',
      impact: 'End of the Maratha Empire; British become supreme in India.'
    },
    {
      year: '1849 CE',
      frameIndex: 3,
      eventTitle: 'Annexation of the Sikh Empire',
      ruler: 'Lord Dalhousie vs Lahore Durbar',
      location: 'Punjab & Lahore',
      description: 'Punjab annexed; Koh-i-Noor diamond confiscated.',
      impact: 'British reach the Khyber Pass and the frontier of Afghanistan.'
    },
    {
      year: '1856 CE',
      frameIndex: 3,
      eventTitle: 'Annexation of Awadh & Doctrine of Lapse',
      ruler: 'Lord Dalhousie',
      location: 'Lucknow, Jhansi, Sambalpur',
      description: 'Awadh annexed for misgovernance; states without natural heirs seized.',
      impact: 'Catalyst for the First War of Indian Independence (1857 Revolt).'
    }
  ],
  geographicFeatures: {
    rivers: SUBCONTINENT_RIVERS,
    seas: SUBCONTINENT_SEAS
  },
  isBuiltin: true,
  createdAt: '2026-11-23T10:00:00.000Z',
  updatedAt: '2026-11-23T10:00:00.000Z'
};

// =========================================================================
// 5. KALINGA & ODISHA HISTORICAL DYNASTIES
// =========================================================================

export const KALINGA_REGIONS = [
  {
    id: 'kharavela_kalinga_core',
    name: 'Kalinganagara Heartland (କଳିଙ୍ଗନଗର କେନ୍ଦ୍ର)',
    modernLocation: 'Bhubaneswar, Sisupalgarh, Puri, Cuttack, Udayagiri-Khandagiri',
    previousRulerOrDynasty: 'Mahameghavahana Dynasty (Chedi lineage)',
    conqueringRuler: 'Emperor Kharavela (ମହାମେଘବାହନ ଐର ଖାରବେଳ)',
    conquestYear: '1st Century BCE',
    battlesInvolved: 'Hathigumpha Inscription recorded conquests (Bahuvalam)',
    historicalBackground: 'After the decline of the Mauryas, Mahameghavahana Kharavela revived the glorious sovereign identity of Kalinga. His Hathigumpha inscription on Udayagiri hill records his annual military expeditions, irrigation canal repairs (Ti-vasa-sata canal), and patronage of Jainism.',
    conquestReasons: 'Restoring the glory and imperial sovereignty of Kalinga after the tragedy of the Mauryan invasion.',
    historicalSignificance: 'Kharavela conducted lightning campaigns from Gorathagiri (Rajgir) to the Pandya kingdom in the south, recovering the sacred Kalinga Jina image taken by the Nandas 300 years earlier.',
    aftermathAndRebellions: 'Caved residential monasteries (lenas) for Jain monks at Udayagiri and Khandagiri (Rani Gumpha, Hati Gumpha).',
    politicalStatus: 'direct_annexation' as const,
    svgPath: 'M 575,445 C 625,435 680,445 725,460 C 730,490 710,520 680,545 C 645,565 615,550 580,520 C 565,490 560,465 575,445 Z',
    labelCoordinates: { x: 645, y: 495 },
    fillColor: '#059669'
  },
  {
    id: 'kharavela_magadha_campaign',
    name: 'Northern Expedition: Magadha & Anga (ମଗଧ ଓ ଅଙ୍ଗ ଅଭିଯାନ)',
    modernLocation: 'Bihar, Patna, Rajgir (Magadha)',
    previousRulerOrDynasty: 'Sunga King Bahasatimita (Brihaspatimitra)',
    conqueringRuler: 'Mahameghavahana Kharavela',
    conquestYear: '8th–12th Regnal Year (c. 1st Century BCE)',
    battlesInvolved: 'Storming of Gorathagiri fortress & humiliation of King of Magadha',
    historicalBackground: 'In his 12th regnal year, Kharavela crossed the Ganga with a massive army of cavalry, war elephants, and chariots, terrifying the King of Magadha Bahasatimita into bowing at his feet.',
    conquestReasons: 'Avenging the ancient invasion of Kalinga and bringing back the revered Kalinga Jinasana image carried away by the Nandas.',
    historicalSignificance: 'Demonstrated Kalinga’s supreme military ascendancy over the historic imperial capital of Pataliputra.',
    aftermathAndRebellions: 'Erected the great Mahavijaya Prasada palace at Kalinganagara with the colossal wealth brought from Magadha and Anga.',
    politicalStatus: 'frontier_sphere' as const,
    svgPath: 'M 475,265 C 535,255 605,260 670,275 C 695,305 685,355 660,385 C 605,405 545,395 495,370 C 475,335 465,295 475,265 Z',
    labelCoordinates: { x: 575, y: 325 },
    fillColor: '#10b981'
  },
  {
    id: 'somavamshi_unification',
    name: 'Utkala & Dakshina Kosala Unification (ଉତ୍କଳ ଓ କୋଶଳ ଏକତ୍ରିକରଣ)',
    modernLocation: 'Coastal Odisha and Western Odisha (Yayatinagara / Jajpur, Sambalpur)',
    previousRulerOrDynasty: 'Bhauma-Kara Dynasty & Somavamshi of Kosala',
    conqueringRuler: 'Yayati I & Yayati II Chandrahara',
    conquestYear: '10th–11th Century CE',
    battlesInvolved: 'Unification wars of Utkala, Kongoda, and Kosala',
    historicalBackground: 'The Somavamshis bridged the geographical divide between coastal Utkala and western Kosala. Yayati I performed ten horse sacrifices (Dasasvamedha) on the Vaitarani river at Jajpur.',
    conquestReasons: 'Creating an integrated, sovereign linguistic and cultural Odia heartland.',
    historicalSignificance: 'Golden age of Kalingan temple architecture: construction of the jewel of Odishan art Mukteshvara Temple and commencement of the towering Lingaraj Temple at Ekamra Kshetra (Bhubaneswar).',
    aftermathAndRebellions: 'Synthesized Tantric, Saivite, and early Jagannath worship.',
    politicalStatus: 'direct_annexation' as const,
    svgPath: 'M 550,425 C 610,415 685,425 735,445 C 740,480 710,525 675,550 C 625,565 575,545 545,510 C 535,475 538,445 550,425 Z',
    labelCoordinates: { x: 635, y: 475 },
    fillColor: '#34d399'
  },
  {
    id: 'ganga_empire_expanse',
    name: 'Imperial Eastern Ganga Empire (ଗାଙ୍ଗ ସାମ୍ରାଜ୍ୟ: ଗଙ୍ଗାଠାରୁ ଗୋଦାବରୀ)',
    modernLocation: 'Odisha, West Bengal, Coastal Andhra (Ganges to Godavari)',
    previousRulerOrDynasty: 'Eastern Chalukyas of Vengi & Pala remnants',
    conqueringRuler: 'Anantavarman Chodaganga Deva & Langula Narasimhadeva I',
    conquestYear: '1112–1264 CE',
    battlesInvolved: 'Wars against Sultanate of Bengal (Battle of Katasin 1243 CE)',
    historicalBackground: 'Anantavarman Chodaganga Deva unified Kalinga from the Bhagirathi (Hooghly/Ganga) down to the Godavari river and commenced construction of the world-famous Jagannath Temple at Puri. Later, Langula Narasimhadeva I built the Sun Temple at Konark and repulsed Delhi Sultanate incursions under Tughral Tughan Khan.',
    conquestReasons: 'Defending Sanatana and Jagannath culture against Islamic invasions from the north, and dominating maritime trade across the Bay of Bengal.',
    historicalSignificance: 'Odisha remained an unvanquished sovereign Hindu imperial redoubt while northern India fell to Sultanate conquests.',
    aftermathAndRebellions: 'The Sun Temple at Konark stands as an immortal UNESCO World Heritage testament to Narasimhadeva’s victories.',
    politicalStatus: 'direct_annexation' as const,
    svgPath: 'M 535,365 C 615,355 705,365 770,385 C 775,435 735,530 685,590 C 640,630 585,625 545,585 C 520,530 515,440 535,365 Z',
    labelCoordinates: { x: 650, y: 485 },
    fillColor: '#047857'
  },
  {
    id: 'gajapati_empire_kaveri',
    name: 'Gajapati Empire to Kaveri (ଗଜପତି ସାମ୍ରାଜ୍ୟ: ଗଙ୍ଗାରୁ କାବେରୀ)',
    modernLocation: 'Odisha, Bengal, Andhra Pradesh, Tamil Nadu down to Kaveri',
    previousRulerOrDynasty: 'Reddis of Kondavidu, Bahmani Sultanate & Sangama Vijayanagara',
    conqueringRuler: 'Kapilendra Deva (କପିଳେନ୍ଦ୍ର ଦେବ)',
    conquestYear: '1435–1466 CE',
    battlesInvolved: 'Conquest of Udayagiri, Kondavidu, Kanchi, and Thanjavur (1460 CE)',
    historicalBackground: 'Kapilendra Deva founded the Suryavamshi Gajapati dynasty in 1435. Taking the supreme title "Gajapati Gaudesvara Navakoti Karnata Kalavargesvara" (Lord of Elephants, Gauda, Nine Crores of Karnata, and Gulbarga), he swept southward all the way to the Kaveri delta, inscribing his triumphs on the walls of the Srirangam temple in 1464.',
    conquestReasons: 'Securing the southern frontiers against Bahmani aggression and asserting Kalingan military primacy over peninsular India.',
    historicalSignificance: 'Largest indigenous empire founded by an Odia monarch, commanding an unbeatable force of hundreds of thousands of infantry and war elephants.',
    aftermathAndRebellions: 'Sarla Das composed the immortal Odia Mahabharata during his reign, sparking the classical Odia literary renaissance.',
    politicalStatus: 'direct_annexation' as const,
    svgPath: 'M 525,365 C 615,355 715,365 780,385 C 785,450 725,565 675,640 C 625,715 545,745 475,735 C 445,700 480,640 525,570 C 555,510 515,430 525,365 Z',
    labelCoordinates: { x: 595, y: 555 },
    fillColor: '#064e3b'
  }
];

export const KALINGA_FRAMES: HistoricalFrame[] = [
  {
    id: 'frame_kalinga_kharavela',
    frameNumber: 1,
    yearDisplay: '1st Century BCE',
    title: 'Mahameghavahana Kharavela: Revival of Sovereign Kalinga',
    subtitle: 'Hathigumpha Inscription & Recovery of the Kalinga Jina',
    ruler: {
      name: 'Mahameghavahana Kharavela',
      odiaName: 'ମହାମେଘବାହନ ଐର ଖାରବେଳ',
      reignPeriod: 'c. 1st Century BCE',
      title: 'Emperor of Kalinga (କଳିଙ୍ଗାଧିପତି)',
      achievements: [
        'Engraved the 17-line epigraphic masterpiece Hathigumpha Inscription at Udayagiri',
        'Repaired cyclone damage and renovated Kalinganagara city walls',
        'Defeated Bahasatimita of Magadha and recovered the sacred Kalinga Jinasana image',
        'Constructed residential cave monasteries (lenas) for Jain ascetics at Udayagiri and Khandagiri'
      ],
      importantBattles: ['Campaign to Gorathagiri & Pataliputra', 'Expedition to Pandya Kingdom'],
      capitals: ['Kalinganagara (କଳିଙ୍ଗନଗର - Sisupalgarh)'],
      historicalSignificance: 'Restored Kalinga as a paramount military empire capable of projecting force from Magadha to Tamilakam.',
      interestingFacts: ['The Hathigumpha inscription is in Brahmi script and Prakrit language, providing an exact year-by-year chronicle of his 13-year reign.']
    },
    controlledRegionIds: ['kharavela_kalinga_core', 'kharavela_magadha_campaign'],
    newlyAcquiredRegionIds: ['kharavela_kalinga_core', 'kharavela_magadha_campaign'],
    campaignVectors: [
      {
        id: 'kharavela_magadha_vector',
        name: 'Kharavela’s Northern Campaign to Pataliputra',
        from: { x: 645, y: 490 },
        to: { x: 570, y: 325 },
        path: 'M 645,490 Q 620,400 570,325',
        year: 'c. 1st Cent BCE',
        description: 'Kharavela crossed the Ganga and humbled the King of Magadha, triumphantly reclaiming the Kalinga Jina.',
        commander: 'Emperor Kharavela'
      }
    ],
    cities: [
      { name: 'Kalinganagara (Sisupalgarh)', odiaName: 'କଳିଙ୍ଗନଗର (ଶିଶୁପାଳଗଡ଼)', x: 645, y: 490, type: 'capital', yearFoundedOrConquered: '1st Cent BCE' },
      { name: 'Udayagiri Caves', odiaName: 'ଉଦୟଗିରି ଗୁମ୍ଫା', x: 640, y: 485, type: 'fort' },
      { name: 'Pataliputra', odiaName: 'ପାଟଳିପୁତ୍ର', x: 570, y: 325, type: 'city' }
    ],
    summaryText: 'Kharavela revives Kalinga’s imperial grandeur, defeats the rulers of Magadha, recovers the sacred Jinasana, and immortalizes his reign on the Hathigumpha inscription.',
    territorialExtentSqKm: '~1.5 Million Sq Km'
  },
  {
    id: 'frame_kalinga_somavamshi',
    frameNumber: 2,
    yearDisplay: '10th–11th Century CE',
    title: 'Somavamshi Dynasty: Unification of Utkala & Kosala',
    subtitle: 'Golden Era of Kalingan Art: Mukteshvara & Lingaraj Temples',
    ruler: {
      name: 'Yayati II Chandrahara',
      odiaName: 'ଦ୍ୱିତୀୟ ଯଯାତି ଚନ୍ଦ୍ରହାର',
      reignPeriod: 'c. 1025–1040 CE',
      title: 'Paramamahesvara & King of Utkala and Kosala',
      achievements: [
        'Unite western Kosala and coastal Utkala into a single political empire',
        'Commenced the grand Lingaraj Temple at Ekamra Kshetra (Bhubaneswar)',
        'Built Mukteshvara Temple, the "Gem of Odishan Architecture"',
        'Revived Sanskritic and Vedic scholarship by settling Vedic scholars at Jajpur'
      ],
      importantBattles: ['Unification of Utkala, Kongoda, and Kosala'],
      capitals: ['Yayatinagara (Jajpur)', 'Choudwar / Bhubaneswar'],
      historicalSignificance: 'Created the geo-cultural foundation of modern Odisha and developed the pinnacle of classical Kalingan temple architecture.',
      interestingFacts: ['The Mukteshvara temple features the world-renowned arched torana doorway influenced by Buddhist and indigenous Odishan motifs.']
    },
    controlledRegionIds: ['somavamshi_unification'],
    newlyAcquiredRegionIds: ['somavamshi_unification'],
    campaignVectors: [],
    cities: [
      { name: 'Yayatinagara (Jajpur)', odiaName: 'ଯଯାତିନଗର (ଯାଜପୁର)', x: 660, y: 460, type: 'capital', yearFoundedOrConquered: '10th Cent CE' },
      { name: 'Bhubaneswar (Ekamra)', odiaName: 'ଭୁବନେଶ୍ୱର (ଏକାମ୍ର କ୍ଷେତ୍ର)', x: 645, y: 495, type: 'city' },
      { name: 'Varanasi Cuttack', odiaName: 'ବାବାଣାସୀ କଟକ', x: 645, y: 485, type: 'fort' }
    ],
    summaryText: 'The Somavamshis unite western and coastal Odisha, establishing monumental temple architecture at Jajpur and Ekamra Kshetra.',
    territorialExtentSqKm: '~800,000 Sq Km'
  },
  {
    id: 'frame_kalinga_eastern_ganga',
    frameNumber: 3,
    yearDisplay: '1112–1264 CE',
    title: 'Imperial Eastern Ganga Dynasty: Ganges to Godavari',
    subtitle: 'Jagannath Temple at Puri & Sun Temple at Konark',
    ruler: {
      name: 'Anantavarman Chodaganga Deva & Langula Narasimhadeva I',
      odiaName: 'ଅନନ୍ତବର୍ମା ଚୋଡ଼ଗଙ୍ଗ ଦେବ ଓ ଲାଙ୍ଗୁଳା ନରସିଂହଦେବ ପ୍ରଥମ',
      reignPeriod: '1077–1264 CE',
      title: 'Trikalingadhipati & Builder of Konark',
      achievements: [
        'Constructed the magnificent 214-foot Jagannath Temple at Puri',
        'Erected the architectural marvel Sun Temple at Konark (Arka Kshetra)',
        'Defeated the Sultanate of Bengal invaders led by Tughral Tughan Khan at Katasin (1243 CE)',
        'Extended boundaries from the river Ganga (Hooghly) to the river Godavari'
      ],
      importantBattles: ['Battle of Katasin against Sultanate of Bengal (1243 CE)', 'Godavari campaigns'],
      capitals: ['Abhinava Varanasi Kataka (Modern Cuttack)', 'Puri'],
      historicalSignificance: 'Maintained Odisha as an unyielding fortress of Indian art and temple culture while most of northern India was conquered.',
      interestingFacts: ['The Konark wheel design is featured on the Indian 10-rupee currency note and represents the 24 hours of cosmic time.']
    },
    controlledRegionIds: ['somavamshi_unification', 'ganga_empire_expanse'],
    newlyAcquiredRegionIds: ['ganga_empire_expanse'],
    campaignVectors: [
      {
        id: 'narasimha_bengal_victory',
        name: 'Narasimhadeva’s Offensive Victory in Bengal',
        from: { x: 645, y: 485 },
        to: { x: 710, y: 400 },
        path: 'M 645,485 Q 680,440 710,400',
        year: '1243 CE',
        description: 'Narasimhadeva marched north into Bengal, completely routing the Turko-Afghan army of Tughan Khan.',
        commander: 'Langula Narasimhadeva I'
      }
    ],
    cities: [
      { name: 'Cuttack (Kataka)', odiaName: 'କଟକ', x: 645, y: 485, type: 'capital', yearFoundedOrConquered: '1211 CE' },
      { name: 'Puri (Jagannath Temple)', odiaName: 'ପୁରୀ (ଶ୍ରୀମନ୍ଦିର)', x: 650, y: 520, type: 'city', yearFoundedOrConquered: '1135 CE' },
      { name: 'Konark (Sun Temple)', odiaName: 'କୋଣାର୍କ (ସୂର୍ଯ୍ୟ ମନ୍ଦିର)', x: 660, y: 515, type: 'city', yearFoundedOrConquered: '1250 CE' }
    ],
    summaryText: 'The Eastern Gangas build the colossal Jagannath Temple at Puri and Sun Temple at Konark, defeating Bengal Sultanate forces and extending imperial borders from Ganga to Godavari.',
    territorialExtentSqKm: '~1.2 Million Sq Km'
  },
  {
    id: 'frame_kalinga_gajapati',
    frameNumber: 4,
    yearDisplay: '1435–1466 CE',
    title: 'Gajapati Empire of Kapilendra Deva: Ganges to Kaveri',
    subtitle: 'Navakoti Karnata Kalavargesvara & the Golden Age of Odia Identity',
    ruler: {
      name: 'Gajapati Kapilendra Deva',
      odiaName: 'ଗଜପତି କପିଳେନ୍ଦ୍ର ଦେବ',
      reignPeriod: '1435–1466 CE',
      title: 'Gaudesvara Navakoti Karnata Kalavargesvara',
      achievements: [
        'Founded the legendary Suryavamshi Gajapati Empire in 1435',
        'Marched south to the Kaveri delta, conquering Kondavidu, Udayagiri, Kanchi, and Thanjavur',
        'Defeated the Bahmani Sultans and captured Bidar and Gulbarga',
        'Declared himself "Rauta" (servant) of Lord Jagannath, making Jagannath the supreme state deity of Odisha',
        'Patronized poet Sarala Das who wrote the celebrated Odia Mahabharata'
      ],
      importantBattles: ['Conquest of Vijayanagara frontier forts (1450–1460)', 'Expedition to Srirangam (1464)'],
      capitals: ['Kataka (Cuttack)'],
      historicalSignificance: 'Achieved the widest geographic expansion of an Odia-speaking empire, stretching across the entire eastern half of India from Bengal to Tamil Nadu.',
      interestingFacts: ['Inscribed his victorious proclamations on the temple walls of Srirangam, Tiruchirappalli, and Jambukeswaram in Tamil country.']
    },
    controlledRegionIds: ['somavamshi_unification', 'ganga_empire_expanse', 'gajapati_empire_kaveri'],
    newlyAcquiredRegionIds: ['gajapati_empire_kaveri'],
    campaignVectors: [
      {
        id: 'kapilendra_kaveri_vector',
        name: 'Kapilendra Deva’s Grand Southern Conquest to Kaveri',
        from: { x: 645, y: 485 },
        to: { x: 500, y: 730 },
        path: 'M 645,485 Q 580,620 500,730',
        year: '1458–1464 CE',
        description: 'Prince Hamvira Deva and Kapilendra Deva swept through Andhra and Tamil country down to Srirangam on the Kaveri river.',
        commander: 'Kapilendra Deva & Hamvira Deva'
      }
    ],
    cities: [
      { name: 'Kataka', odiaName: 'କଟକ (ରାଜଧାନୀ)', x: 645, y: 485, type: 'capital' },
      { name: 'Puri', odiaName: 'ପୁରୀ', x: 650, y: 520, type: 'city' },
      { name: 'Kondavidu', odiaName: 'କୋଣ୍ଡାବିଡୁ', x: 580, y: 610, type: 'fort', yearFoundedOrConquered: '1454 CE' },
      { name: 'Udayagiri (Nellore)', odiaName: 'ଉଦୟଗିରି', x: 550, y: 660, type: 'fort', yearFoundedOrConquered: '1460 CE' },
      { name: 'Srirangam (Kaveri)', odiaName: 'ଶ୍ରୀରଙ୍ଗମ୍ (କାବେରୀ)', x: 500, y: 735, type: 'city', yearFoundedOrConquered: '1464 CE' }
    ],
    summaryText: 'Kapilendra Deva expands the Gajapati Empire all the way from the Ganges in Bengal down to the Kaveri in Tamil Nadu, inaugurating the golden age of classical Odia language and literature.',
    territorialExtentSqKm: '~1.9 Million Sq Km'
  }
];

export const KALINGA_MAP_DATA: HistoricalMap = {
  id: 'kalinga_odisha_dynasties',
  title: 'Kalinga & Odisha Historical Empires (1st BCE – 15th CE)',
  odiaTitle: 'କଳିଙ୍ଗ ଓ ଓଡ଼ିଶାର ଐତିହାସିକ ସାମ୍ରାଜ୍ୟ (ଖ୍ରୀ.ପୂ. ୧ମ – ୧୫ଶ ଶତାବ୍ଦୀ)',
  topic: 'Kalinga & Odisha Dynasties',
  era: 'c. 1st Cent BCE – 1568 CE',
  category: 'empire',
  description: 'Chronological progression of the great Kalinga and Odisha empires: Mahameghavahana Kharavela, Somavamshi unification, Eastern Ganga monumental builders of Jagannath & Konark, and Kapilendra Deva’s Gajapati Empire from Ganges to Kaveri.',
  baseMapType: 'subcontinent',
  viewBox: '0 0 1000 850',
  regions: KALINGA_REGIONS,
  frames: KALINGA_FRAMES,
  events: [
    {
      year: '1st Cent BCE',
      frameIndex: 0,
      eventTitle: 'Kharavela’s Hathigumpha Inscription',
      ruler: 'Emperor Kharavela',
      location: 'Udayagiri, Bhubaneswar',
      description: 'Records defeats of Magadha, revival of canal, and recovery of Kalinga Jina.',
      impact: 'Restoration of sovereign Kalingan primacy.'
    },
    {
      year: 'c. 1000 CE',
      frameIndex: 1,
      eventTitle: 'Somavamshi Temple Renaissance',
      ruler: 'Yayati I & II',
      location: 'Jajpur & Bhubaneswar',
      description: 'Unification of Utkala and Kosala; erection of Mukteshvara and Lingaraj temples.',
      impact: 'Foundations of Kalingan cultural identity.'
    },
    {
      year: '1135 CE',
      frameIndex: 2,
      eventTitle: 'Construction of Jagannath Temple, Puri',
      ruler: 'Anantavarman Chodaganga Deva',
      location: 'Puri, Odisha',
      description: 'Grand 214-foot temple erected on the shores of the Bay of Bengal.',
      impact: 'Puri becomes the supreme spiritual center of the Jagannath cult.'
    },
    {
      year: '1250 CE',
      frameIndex: 2,
      eventTitle: 'Sun Temple of Konark Built',
      ruler: 'Langula Narasimhadeva I',
      location: 'Konark, Odisha',
      description: 'Colossal stone chariot temple erected following victory over Bengal Sultanate.',
      impact: 'Immortal UNESCO world heritage masterpiece.'
    },
    {
      year: '1464 CE',
      frameIndex: 3,
      eventTitle: 'Gajapati Kapilendra Deva Reaches Kaveri',
      ruler: 'Kapilendra Deva',
      location: 'Srirangam & Kaveri Delta, Tamil Nadu',
      description: 'Odia army conquers down to Kaveri delta; inscriptions carved at Srirangam.',
      impact: 'Peak territorial expanse of the Gajapati Empire.'
    }
  ],
  geographicFeatures: {
    rivers: SUBCONTINENT_RIVERS,
    seas: SUBCONTINENT_SEAS
  },
  isBuiltin: true,
  createdAt: '2026-11-23T10:00:00.000Z',
  updatedAt: '2026-11-23T10:00:00.000Z'
};

// =========================================================================
// MAHATMA GANDHI: NATIONAL FOOTSTEPS & FREEDOM STRUGGLE (1915–1948)
// =========================================================================

export const GANDHI_REGIONS: HistoricalRegion[] = [
  {
    id: 'gandhi_gujarat',
    name: 'Gujarat & Kathiawar (Sabarmati, Kheda & Dandi)',
    modernLocation: 'Gujarat (Ahmedabad, Dandi, Porbandar, Rajkot, Kheda, Surat)',
    previousRulerOrDynasty: 'British Bombay Presidency',
    conqueringRuler: 'Mahatma Gandhi & Sardar Vallabhbhai Patel',
    conquestYear: '1915–1930 CE',
    battlesInvolved: 'Ahmedabad Textile Strike (1918), Kheda Peasant Satyagraha (1918), Dandi Salt March (1930), Bardoli Satyagraha (1928)',
    historicalBackground: 'Gandhi returned to India from South Africa in January 1915 and established Sabarmati Ashram on the banks of Sabarmati River. It served as the spiritual and strategic headquarters for truth, non-violence, and self-reliance (Khadi) for over a decade.',
    conquestReasons: 'National laboratory for Satyagraha; launchpad of the 241-mile Dandi Salt March.',
    historicalSignificance: 'Transformed ordinary villagers, farmers, and women into fearless freedom fighters through the moral force of Ahimsa.',
    aftermathAndRebellions: 'Gandhi pledged upon leaving Sabarmati on 12 March 1930 never to return until India achieved complete independence (Purna Swaraj).',
    politicalStatus: 'direct_annexation',
    svgPath: 'M 140,410 C 145,385 185,370 215,360 C 265,345 320,340 355,360 C 365,405 355,445 335,475 C 290,490 250,515 220,510 C 180,485 140,445 140,410 Z',
    labelCoordinates: { x: 230, y: 415 },
    fillColor: '#059669'
  },
  {
    id: 'gandhi_bihar',
    name: 'Champaran & Bihar Peasantry (ଚମ୍ପାରଣ ଓ ବିହାର)',
    modernLocation: 'Bihar (Champaran, Motihari, Bettiah, Patna)',
    previousRulerOrDynasty: 'British Indigo Planters (Tinkathia System)',
    conqueringRuler: 'Mahatma Gandhi, Dr. Rajendra Prasad & J.B. Kripalani',
    conquestYear: '1917–1918 CE',
    battlesInvolved: 'Champaran Indigo Satyagraha (1917 - First Civil Disobedience in India)',
    historicalBackground: 'Persuaded by local farmer Raj Kumar Shukla, Gandhi arrived in Champaran in April 1917 to investigate the oppressive Tinkathia system forcing tenant farmers to cultivate indigo on 3/20th of their land.',
    conquestReasons: 'Abolition of forced indigo cultivation; demonstration of Satyagraha on Indian soil.',
    historicalSignificance: 'India’s first successful non-violent civil disobedience movement, compelling the British government to appoint an inquiry commission and abolish Tinkathia.',
    aftermathAndRebellions: 'Gandhi set up rural schools and health sanitation camps in Champaran villages, forging lifelong bonds with future President Dr. Rajendra Prasad.',
    politicalStatus: 'direct_annexation',
    svgPath: 'M 495,260 C 565,250 635,255 675,275 C 695,300 685,335 655,355 C 600,365 545,350 510,325 C 490,295 485,275 495,260 Z',
    labelCoordinates: { x: 575, y: 305 },
    fillColor: '#0d9488'
  },
  {
    id: 'gandhi_maharashtra',
    name: 'Maharashtra & Central HQ (Sevagram, Bombay & Pune)',
    modernLocation: 'Maharashtra & Central Provinces (Wardha, Sevagram, Mumbai, Pune, Nagpur)',
    previousRulerOrDynasty: 'British Central Administration & Bombay Presidency',
    conqueringRuler: 'Mahatma Gandhi, Kasturba Gandhi & Acharya Vinoba Bhave',
    conquestYear: '1920–1944 CE',
    battlesInvolved: 'Nagpur Congress (1920), Poona Pact at Yerwada (1932), Wardha Education Scheme (1937), Quit India at Gowalia Tank (1942), Aga Khan Palace Detention (1942–1944)',
    historicalBackground: 'From 1936 onwards, Gandhi established Sevagram Ashram near Wardha in the geographic heart of India as his national headquarters. Bombay was the launchpad for the Quit India Movement in 1942.',
    conquestReasons: 'Central coordination of national constructive work, village swaraj, Dalit upliftment, and the final Quit India call.',
    historicalSignificance: 'Site of the historic "Do or Die" (Karo ya Maro) proclamation on 8 August 1942 at Gowalia Tank Maidan.',
    aftermathAndRebellions: 'Detained at Aga Khan Palace, Pune from August 1942 to May 1944; Kasturba Gandhi and Mahadev Desai sacrificed their lives during imprisonment here.',
    politicalStatus: 'direct_annexation',
    svgPath: 'M 240,490 C 290,475 350,475 410,480 C 455,505 450,555 420,590 C 370,610 310,600 265,565 C 240,535 235,510 240,490 Z',
    labelCoordinates: { x: 340, y: 535 },
    fillColor: '#0284c7'
  },
  {
    id: 'gandhi_odisha',
    name: 'Odisha & Salt Satyagraha Coast (Cuttack, Inchudi & Puri)',
    modernLocation: 'Odisha (Cuttack, Balasore/Inchudi, Puri, Bhadrak)',
    previousRulerOrDynasty: 'British Bihar & Orissa Province',
    conqueringRuler: 'Mahatma Gandhi, Utkalmani Gopabandhu Das & Rama Devi',
    conquestYear: '1921–1934 CE',
    battlesInvolved: 'Kathajodi Riverbed Rally (March 1921), Inchudi Salt Satyagraha (April 1930), Barefoot Harijan Padayatra (May 1934)',
    historicalBackground: 'Gandhi visited Odisha 8 times between 1921 and 1946. In 1921, he addressed a massive crowd on the Kathajodi riverbed in Cuttack. In 1930, Inchudi in Balasore became the second largest salt satyagraha centre in India. In 1934, he undertook an epic barefoot Harijan Padayatra across Odisha from Puri to Cuttack.',
    conquestReasons: 'Salt defiance along the Bay of Bengal coastline and eradication of untouchability.',
    historicalSignificance: 'Inchudi became celebrated as the "Dandi of Odisha", and Gandhi’s walking tour across rural Odisha forged unbreakable unity between national freedom and social reform.',
    aftermathAndRebellions: 'Kadua Ashram and Bari Ashram became flourishing centres of Khadi weaving, basic education, and women’s leadership.',
    politicalStatus: 'direct_annexation',
    svgPath: 'M 570,410 C 625,395 670,405 685,435 C 680,470 650,510 610,535 C 570,540 550,500 555,460 C 555,435 560,420 570,410 Z',
    labelCoordinates: { x: 615, y: 460 },
    fillColor: '#d97706'
  },
  {
    id: 'gandhi_delhi_up',
    name: 'Delhi & Northern Corridors (Heart of the Nation)',
    modernLocation: 'New Delhi, Uttar Pradesh (New Delhi, Lucknow, Varanasi, Chauri Chaura)',
    previousRulerOrDynasty: 'British Imperial Capital & United Provinces',
    conqueringRuler: 'Mahatma Gandhi, Jawaharlal Nehru & Maulana Abul Kalam Azad',
    conquestYear: '1916–1948 CE',
    battlesInvolved: 'BHU Opening Address (1916), Lucknow Congress (1916), Anti-Rowlatt Satyagraha (1919), Gandhi-Irwin Pact (1931), Birla House Final Days (1948)',
    historicalBackground: 'Nerve centre of negotiations with British Viceroys, Viceroy Irwin, Cabinet Mission, and Mountbatten. Also the site of Gandhi’s final fast for Hindu-Muslim unity and his supreme martyrdom at Birla House.',
    conquestReasons: 'Direct confrontation with colonial state authority and central political direction of the freedom movement.',
    historicalSignificance: 'Symbol of moral victory over the British Empire; site of Gandhi’s evening prayer meetings and the immortal flame at Rajghat.',
    aftermathAndRebellions: 'India became independent on 15 August 1947; Gandhi was martyred on 30 January 1948 while walking to prayer.',
    politicalStatus: 'direct_annexation',
    svgPath: 'M 320,225 C 380,215 450,220 500,240 C 520,270 510,305 470,325 C 420,335 360,325 330,295 C 315,265 315,240 320,225 Z',
    labelCoordinates: { x: 410, y: 265 },
    fillColor: '#7c3aed'
  },
  {
    id: 'gandhi_bengal',
    name: 'Bengal & Peace Mission (Calcutta & Noakhali)',
    modernLocation: 'West Bengal & Bangladesh (Kolkata, Noakhali)',
    previousRulerOrDynasty: 'British Bengal Presidency',
    conqueringRuler: 'Mahatma Gandhi (One-Man Boundary Force)',
    conquestYear: '1920–1947 CE',
    battlesInvolved: 'Calcutta Special Congress (1920), Noakhali Barefoot Peace Pilgrimage (1946–1947), Miracle Fast of Calcutta (August–Sept 1947)',
    historicalBackground: 'In late 1946, amidst tragic communal riots, Gandhi walked barefoot from village to village across Noakhali for four months restoring brotherhood. On 15 August 1947, he stayed at Beliaghata in Calcutta, fasting and praying for peace.',
    conquestReasons: 'Communal harmony, healing riot-torn victims, and moral containment of partition violence.',
    historicalSignificance: 'Lord Mountbatten hailed Gandhi as the "One-Man Boundary Force", noting that while 50,000 armed soldiers in Punjab could not stop rioting, Gandhi brought peace to Bengal unarmed.',
    aftermathAndRebellions: 'Rioters laid down their weapons at Gandhi’s feet in Calcutta, leading to a miraculous return of fraternal harmony.',
    politicalStatus: 'direct_annexation',
    svgPath: 'M 645,320 C 700,310 760,320 800,350 C 810,390 780,430 735,445 C 680,450 640,420 635,380 C 635,350 640,330 645,320 Z',
    labelCoordinates: { x: 715, y: 375 },
    fillColor: '#ea580c'
  },
  {
    id: 'gandhi_south_belgaum',
    name: 'Karnataka & Southern Outreach (Belgaum & Vaikom)',
    modernLocation: 'Karnataka (Belgaum), Kerala (Vaikom), Tamil Nadu (Madras)',
    previousRulerOrDynasty: 'Madras Presidency & Princely States',
    conqueringRuler: 'Mahatma Gandhi (INC President 1924)',
    conquestYear: '1924–1937 CE',
    battlesInvolved: '39th Belgaum Congress Session (Dec 1924), Vaikom Temple Entry Satyagraha (1925), South India Khadi Tours',
    historicalBackground: 'At the 39th Session of the Indian National Congress held in Belgaum in December 1924, Mahatma Gandhi presided as Congress President. He unified the Swarajists and No-Changers, emphasizing the spinning wheel and social equality.',
    conquestReasons: 'National integration, anti-untouchability temple entry movements, and popularisation of Khadi.',
    historicalSignificance: 'The Belgaum session was the ONLY time Mahatma Gandhi served as Congress President in his entire life.',
    aftermathAndRebellions: 'Strengthened Congress organisation across southern India and laid the groundwork for temple entry proclamations.',
    politicalStatus: 'tributary_vassal',
    svgPath: 'M 250,580 C 300,570 345,580 375,615 C 370,665 335,720 290,735 C 260,725 240,670 240,625 C 240,600 245,585 250,580 Z',
    labelCoordinates: { x: 300, y: 645 },
    fillColor: '#4f46e5'
  }
];

export const GANDHI_FRAMES: HistoricalFrame[] = [
  {
    id: 'gandhi_frame_1',
    frameNumber: 1,
    yearDisplay: '1915–1919 CE',
    title: 'Return to India & The Early Satyagrahas',
    subtitle: 'Apollo Bunder Arrival, Sabarmati Ashram, Champaran Indigo & Kheda',
    ruler: {
      name: 'Mahatma Gandhi (Mohandas Karamchand Gandhi)',
      odiaName: 'ମହାତ୍ମା ଗାନ୍ଧୀ',
      reignPeriod: '1915–1919 CE',
      title: 'Pioneer of Satyagraha & Ahimsa',
      achievements: [
        'Returned to India from South Africa on 9 January 1915 (Pravasi Bharatiya Divas) at Apollo Bunder, Bombay',
        'Founded Satyagraha Ashram at Kochrab (1915) and Sabarmati (1917) on the Sabarmati riverbank in Ahmedabad',
        'Delivered the fearless opening speech at Banaras Hindu University (BHU) in 1916 demanding justice for the poor',
        'Attended Lucknow Congress (1916) where Bihar peasant Raj Kumar Shukla urged him to investigate indigo exploitation',
        'Led the historic Champaran Satyagraha (1917) in Bihar, successfully abolishing the forced Tinkathia system',
        'Undertook fast unto death for Ahmedabad textile mill workers, securing a 35% wage increase (1918)',
        'Organised Kheda Peasant Satyagraha (1918) alongside Sardar Vallabhbhai Patel for land revenue suspension'
      ],
      importantBattles: [
        'Champaran Indigo Satyagraha (1917)',
        'Ahmedabad Mill Workers Strike (1918)',
        'Kheda Peasant Satyagraha (1918)',
        'Anti-Rowlatt Act Nationwide Hartal (1919)'
      ],
      capitals: ['Sabarmati Ashram (Ahmedabad)'],
      historicalSignificance: 'Introduced the revolutionary technique of Satyagraha to Indian soil, establishing moral leadership by championing peasants and labourers.',
      interestingFacts: [
        'Gopal Krishna Gokhale advised Gandhi to spend his entire first year travelling across India by third-class train to understand the common people before speaking on politics.',
        'Rabindranath Tagore conferred the revered title "Mahatma" (Great Soul) upon him in 1915.'
      ]
    },
    controlledRegionIds: ['gandhi_gujarat', 'gandhi_bihar'],
    newlyAcquiredRegionIds: ['gandhi_gujarat', 'gandhi_bihar'],
    campaignVectors: [
      {
        id: 'vector_apollo_to_sabarmati',
        name: 'Return from South Africa to Sabarmati Ashram',
        from: { x: 220, y: 505 },
        to: { x: 215, y: 395 },
        path: 'M 220,505 Q 210,450 215,395',
        year: 'January 1915',
        description: 'Arrived at Apollo Bunder, Bombay and established the Satyagraha Ashram at Sabarmati, Ahmedabad.',
        commander: 'Mahatma Gandhi'
      },
      {
        id: 'vector_sabarmati_to_champaran',
        name: 'Journey to Champaran Indigo Peasantry',
        from: { x: 215, y: 395 },
        to: { x: 505, y: 275 },
        path: 'M 215,395 Q 360,300 505,275',
        year: 'April 1917',
        description: 'Travelled from Sabarmati via Lucknow to Champaran, Bihar to lead India’s first civil disobedience movement.',
        commander: 'Mahatma Gandhi & Raj Kumar Shukla'
      }
    ],
    cities: [
      { name: 'Sabarmati Ashram', odiaName: 'ସବରମତୀ ଆଶ୍ରମ', x: 215, y: 395, type: 'capital', yearFoundedOrConquered: '1917' },
      { name: 'Champaran (Motihari)', odiaName: 'ଚମ୍ପାରଣ (ବିହାର)', x: 505, y: 275, type: 'city', yearFoundedOrConquered: '1917' },
      { name: 'Kheda', odiaName: 'ଖେଡ଼ା', x: 225, y: 410, type: 'city', yearFoundedOrConquered: '1918' },
      { name: 'Bombay (Apollo Bunder)', odiaName: 'ବମ୍ବେ (ପ୍ରତ୍ୟାବର୍ତ୍ତନ)', x: 220, y: 505, type: 'port', yearFoundedOrConquered: '1915' },
      { name: 'Lucknow (Congress 1916)', odiaName: 'ଲକ୍ଷ୍ନୌ (୧୯୧୬)', x: 420, y: 285, type: 'city' },
      { name: 'Varanasi (BHU 1916)', odiaName: 'ବାରାଣସୀ (କାଶୀ)', x: 480, y: 310, type: 'city' }
    ],
    summaryText: 'Gandhiji returns to India, founds Sabarmati Ashram, and conducts his landmark early experiments with Satyagraha in Champaran, Ahmedabad, and Kheda, proving the invincible power of non-violence.',
    territorialExtentSqKm: 'Western & Eastern Grassroots Epicentres'
  },
  {
    id: 'gandhi_frame_2',
    frameNumber: 2,
    yearDisplay: '1920–1924 CE',
    title: 'Pan-Indian Non-Cooperation & Belgaum Congress',
    subtitle: 'Calcutta & Nagpur Sessions, Kathajodi Rally in Cuttack & 39th INC Presidency',
    ruler: {
      name: 'Mahatma Gandhi (INC President 1924)',
      odiaName: 'ମହାତ୍ମା ଗାନ୍ଧୀ (କଂଗ୍ରେସ ସଭାପତି)',
      reignPeriod: '1920–1924 CE',
      title: 'Father of the Nation & Mass Mobiliser',
      achievements: [
        'Moved the historic Non-Cooperation Resolution at Calcutta Special Session (Sept 1920) and ratified it at Nagpur (Dec 1920)',
        'Reorganised Congress into a mass grassroots organisation based on provincial linguistic committees',
        'Undertook historic First Visit to Odisha (23–29 March 1921), addressing a massive rally on the Kathajodi riverbed in Cuttack, visiting Puri and Bhadrak',
        'Adopted the simple khadi dhoti at Madurai (Sept 1921) to identify permanently with India’s poorest peasants',
        'Suspended the movement in Feb 1922 following violence at Chauri Chaura, proving moral integrity surpassed political opportunism',
        'Presided over the 39th Session of the Indian National Congress at Belgaum (Karnataka) in December 1924 — the ONLY Congress session ever presided by Gandhi'
      ],
      importantBattles: [
        'Calcutta Special Congress Session (Sept 1920)',
        'Nagpur Annual Congress Session (Dec 1920)',
        'Kathajodi Riverbed Rally (Cuttack, March 1921)',
        'Chauri Chaura Moral Suspension (Feb 1922)',
        '39th Belgaum Congress Presidential Session (Dec 1924)'
      ],
      capitals: ['Sabarmati Ashram', 'Belgaum (Congress HQ 1924)'],
      historicalSignificance: 'Converted the independence struggle from an elite debate into a mass revolutionary movement spanning peasants, women, and students across India.',
      interestingFacts: [
        'During his 1921 visit to Cuttack, thousands of Odia women voluntarily donated their gold ornaments to the Tilak Swaraj Fund on the Kathajodi riverbed.',
        'At the 1924 Belgaum Congress, Gandhi united the Swarajists and No-Changers, prioritizing spinning Khadi and untouchability eradication.'
      ]
    },
    controlledRegionIds: ['gandhi_gujarat', 'gandhi_bihar', 'gandhi_delhi_up', 'gandhi_odisha', 'gandhi_south_belgaum'],
    newlyAcquiredRegionIds: ['gandhi_delhi_up', 'gandhi_odisha', 'gandhi_south_belgaum'],
    campaignVectors: [
      {
        id: 'vector_calcutta_to_nagpur',
        name: 'Non-Cooperation Movement Congress Tour',
        from: { x: 625, y: 365 },
        to: { x: 390, y: 440 },
        path: 'M 625,365 Q 510,400 390,440',
        year: '1920',
        description: 'Calcutta Special Session to Nagpur Congress, adopting the Non-Cooperation programme.',
        commander: 'Mahatma Gandhi'
      },
      {
        id: 'vector_nagpur_to_cuttack',
        name: 'First Historic Tour to Odisha',
        from: { x: 390, y: 440 },
        to: { x: 575, y: 450 },
        path: 'M 390,440 Q 480,455 575,450',
        year: 'March 1921',
        description: 'Addressed gigantic public gatherings at Kathajodi riverbed in Cuttack and Puri with Utkalmani Gopabandhu Das.',
        commander: 'Mahatma Gandhi & Gopabandhu Das'
      },
      {
        id: 'vector_cuttack_to_belgaum',
        name: '39th Congress Presidential Journey to Belgaum',
        from: { x: 215, y: 395 },
        to: { x: 265, y: 600 },
        path: 'M 215,395 Q 230,500 265,600',
        year: 'December 1924',
        description: 'Presided over the 39th Session of the Indian National Congress at Belgaum, Karnataka.',
        commander: 'Mahatma Gandhi (INC President)'
      }
    ],
    cities: [
      { name: 'Calcutta (Congress 1920)', odiaName: 'କଲିକତା (୧୯୨୦)', x: 625, y: 365, type: 'city' },
      { name: 'Nagpur (Congress 1920)', odiaName: 'ନାଗପୁର (୧୯୨୦)', x: 390, y: 440, type: 'city' },
      { name: 'Cuttack (Kathajodi 1921)', odiaName: 'କଟକ (କାଠଯୋଡ଼ି ୧୯୨୧)', x: 575, y: 450, type: 'capital' },
      { name: 'Puri', odiaName: 'ପୁରୀ', x: 585, y: 475, type: 'city' },
      { name: 'Belgaum (Presidential Session 1924)', odiaName: 'ବେଲଗାଓଁ (କଂଗ୍ରେସ ସଭାପତି ୧୯୨୪)', x: 265, y: 600, type: 'capital' },
      { name: 'Chauri Chaura', odiaName: 'ଚୌରି ଚୌରା (୧୯୨୨)', x: 475, y: 280, type: 'battlefield' },
      { name: 'Sabarmati Ashram', odiaName: 'ସବରମତୀ ଆଶ୍ରମ', x: 215, y: 395, type: 'city' }
    ],
    summaryText: 'Non-Cooperation mobilises millions across India. Boycott of foreign cloth and titles transforms politics, and Gandhi presides over the historic 39th Congress at Belgaum.',
    territorialExtentSqKm: 'Pan-Indian Mass Mobilization Corridor'
  },
  {
    id: 'gandhi_frame_3',
    frameNumber: 3,
    yearDisplay: '1930–1934 CE',
    title: 'Civil Disobedience, Dandi Salt March & Odisha Harijan Tour',
    subtitle: '241-Mile March to Sea, Karachi Session, Round Table & Barefoot Foot March in Odisha',
    ruler: {
      name: 'Mahatma Gandhi',
      odiaName: 'ମହାତ୍ମା ଗାନ୍ଧୀ',
      reignPeriod: '1930–1934 CE',
      title: 'The Salt Satyagrahi & Moral Force',
      achievements: [
        'Marched 241 miles from Sabarmati to Dandi (12 March – 6 April 1930) with 78 volunteers, breaking the Salt Law',
        'Triggered nationwide salt defiance; Inchudi in Balasore, Odisha emerged as the second largest salt satyagraha hub in India',
        'Signed the historic Gandhi-Irwin Pact (March 1931) in New Delhi as an equal sovereign negotiator',
        'Attended Karachi Congress (March 1931) which adopted landmark resolutions on Fundamental Rights and the National Economy',
        'Represented the Indian National Congress as sole delegate at the Second Round Table Conference in London (Autumn 1931)',
        'Fast unto death at Yerwada Jail, Pune culminating in the Poona Pact (Sept 1932) with Dr. B.R. Ambedkar',
        'Undertook the historic barefoot Harijan Padayatra on foot across Odisha (May 1934), walking from Puri to Cuttack and Balasore'
      ],
      importantBattles: [
        'Dandi Salt March (12 March – 6 April 1930)',
        'Inchudi Salt Satyagraha (Odisha, April 1930)',
        'Gandhi-Irwin Pact (Delhi, March 1931)',
        'Karachi Congress Session (March 1931)',
        'Second Round Table Conference (London, Autumn 1931)',
        'Poona Pact at Yerwada Jail (Sept 1932)',
        'Odisha Barefoot Harijan Padayatra (May 1934)'
      ],
      capitals: ['Sabarmati Ashram (until March 1930)', 'Yerwada (Pune)'],
      historicalSignificance: 'The salt defiance captured global attention, demystified British imperial power, and mobilized millions of women into the vanguard of freedom.',
      interestingFacts: [
        'Gandhi vowed on leaving Sabarmati on 12 March 1930 that he would never return to the ashram until India won Purna Swaraj.',
        'During his 1934 Harijan Tour in Odisha, Gandhi declined cars and walked on foot through rural villages, preaching social equality and opening temples to Dalits.'
      ]
    },
    controlledRegionIds: ['gandhi_gujarat', 'gandhi_bihar', 'gandhi_maharashtra', 'gandhi_odisha', 'gandhi_delhi_up', 'gandhi_south_belgaum'],
    newlyAcquiredRegionIds: ['gandhi_maharashtra'],
    campaignVectors: [
      {
        id: 'vector_dandi_march',
        name: 'The 241-Mile Dandi Salt March',
        from: { x: 215, y: 395 },
        to: { x: 225, y: 440 },
        path: 'M 215,395 Q 218,420 225,440',
        year: '12 March – 6 April 1930',
        description: 'Walked 241 miles from Sabarmati to Dandi beach, picking up a lump of natural salt to defy the British salt monopoly.',
        commander: 'Mahatma Gandhi'
      },
      {
        id: 'vector_inchudi_salt',
        name: 'Inchudi Salt Satyagraha Expedition',
        from: { x: 575, y: 450 },
        to: { x: 605, y: 415 },
        path: 'M 575,450 Q 590,430 605,415',
        year: 'April 1930',
        description: 'Satyagrahis marched from Cuttack to Inchudi (Balasore) along the Odisha coast, establishing the 2nd greatest salt satyagraha centre in India.',
        commander: 'Gopabandhu Choudhury & Rama Devi'
      },
      {
        id: 'vector_odisha_harijan_walk',
        name: 'Barefoot Harijan Padayatra across Odisha',
        from: { x: 585, y: 475 },
        to: { x: 575, y: 450 },
        path: 'M 585,475 Q 580,460 575,450',
        year: 'May 1934',
        description: 'Walked barefoot on foot from Puri through Sakhigopal, Kadua Ashram, and Cuttack to Balasore, championing Dalit rights.',
        commander: 'Mahatma Gandhi'
      }
    ],
    cities: [
      { name: 'Sabarmati Ashram', odiaName: 'ସବରମତୀ ଆଶ୍ରମ', x: 215, y: 395, type: 'capital' },
      { name: 'Dandi Beach (Salt March)', odiaName: 'ଦଣ୍ଡି କୂଳ (ଲବଣ ସତ୍ୟାଗ୍ରହ)', x: 225, y: 440, type: 'port', yearFoundedOrConquered: '1930' },
      { name: 'Inchudi (Balasore)', odiaName: 'ଇଞ୍ଚୁଡ଼ି (ବାଲେଶ୍ୱର - ଓଡ଼ିଶା ଦଣ୍ଡି)', x: 605, y: 415, type: 'port', yearFoundedOrConquered: '1930' },
      { name: 'Delhi (Gandhi-Irwin Pact 1931)', odiaName: 'ଦିଲ୍ଲୀ (ଗାନ୍ଧୀ-ଇରୱିନ୍ ଚୁକ୍ତି)', x: 305, y: 255, type: 'city' },
      { name: 'Karachi (Congress 1931)', odiaName: 'କରାଚି (୧୯୩୧)', x: 135, y: 335, type: 'city' },
      { name: 'Yerwada Jail (Poona Pact 1932)', odiaName: 'ୟରୱାଡା (ପୁନା ଚୁକ୍ତି ୧୯୩୨)', x: 245, y: 535, type: 'fort' },
      { name: 'Puri (Harijan Padayatra 1934)', odiaName: 'ପୁରୀ (ହରିଜନ ପଦଯାତ୍ରା ୧୯୩୪)', x: 585, y: 475, type: 'city' },
      { name: 'Cuttack', odiaName: 'କଟକ', x: 575, y: 450, type: 'city' }
    ],
    summaryText: 'The Dandi Salt March shatters the British salt monopoly, sparking mass civil disobedience across India and leading to the Gandhi-Irwin Pact, Round Table Conference, and the epic Odisha Harijan Padayatra.',
    territorialExtentSqKm: 'Subcontinental Civil Disobedience'
  },
  {
    id: 'gandhi_frame_4',
    frameNumber: 4,
    yearDisplay: '1935–1942 CE',
    title: 'Sevagram Headquarters & The Quit India Movement',
    subtitle: 'Nai Talim (Basic Education), Individual Satyagraha & "Do or Die" at Gowalia Tank',
    ruler: {
      name: 'Mahatma Gandhi',
      odiaName: 'ମହାତ୍ମା ଗାନ୍ଧୀ',
      reignPeriod: '1935–1942 CE',
      title: 'Supreme Leader of the Freedom Struggle',
      achievements: [
        'Established Sevagram Ashram near Wardha (Maharashtra) in 1936 as his new national headquarters for rural regeneration',
        'Convened Wardha Educational Conference (1937) establishing Nai Talim (Basic Education through handicrafts)',
        'Guided the Congress through the Haripura (1938) and Tripuri (1939) sessions during the eve of World War II',
        'Launched Individual Satyagraha (1940), selecting Acharya Vinoba Bhave as 1st Satyagrahi and Jawaharlal Nehru as 2nd',
        'Delivered the immortal "Do or Die" (Karo ya Maro / କର ବା ମର) address at Gowalia Tank Maidan (August Kranti Maidan), Bombay on 8 August 1942',
        'Passed the historic Quit India Resolution demanding immediate British withdrawal from India',
        'Imprisoned at Aga Khan Palace in Pune from August 1942 to May 1944 alongside Kasturba Gandhi and Mahadev Desai'
      ],
      importantBattles: [
        'Wardha Education Conference (1937)',
        'Haripura & Tripuri Sessions (1938–39)',
        'Individual Satyagraha Launch (1940)',
        'Quit India Resolution (Bombay, 8 Aug 1942)',
        '21-Day Fast at Aga Khan Palace (Feb–March 1943)'
      ],
      capitals: ['Sevagram Ashram (Wardha)', 'Aga Khan Palace (Pune)'],
      historicalSignificance: 'The climactic mass uprising that paralyzed British governance and proved that colonial rule could no longer be sustained in India.',
      interestingFacts: [
        'Both Mahadev Desai (Gandhi’s closest secretary) and Kasturba Gandhi passed away during detention inside the Aga Khan Palace in Pune.',
        'Gandhi observed a 21-day fast in 1943 while imprisoned at Aga Khan Palace to protest British viceregal violence against non-violent protesters.'
      ]
    },
    controlledRegionIds: ['gandhi_gujarat', 'gandhi_bihar', 'gandhi_maharashtra', 'gandhi_odisha', 'gandhi_delhi_up', 'gandhi_bengal', 'gandhi_south_belgaum'],
    newlyAcquiredRegionIds: ['gandhi_bengal'],
    campaignVectors: [
      {
        id: 'vector_quit_india_call',
        name: 'The "Do or Die" Quit India Proclamation',
        from: { x: 380, y: 450 },
        to: { x: 220, y: 505 },
        path: 'M 380,450 Q 300,470 220,505',
        year: '8 August 1942',
        description: 'Addressed the All India Congress Committee at Gowalia Tank Maidan, Bombay with the clarion call "Do or Die".',
        commander: 'Mahatma Gandhi'
      },
      {
        id: 'vector_bombay_to_aga_khan',
        name: 'Imprisonment at Aga Khan Palace',
        from: { x: 220, y: 505 },
        to: { x: 245, y: 535 },
        path: 'M 220,505 Q 230,520 245,535',
        year: '9 August 1942',
        description: 'Arrested by British authorities and detained at the Aga Khan Palace in Pune until May 1944.',
        commander: 'Mahatma Gandhi & Kasturba Gandhi'
      }
    ],
    cities: [
      { name: 'Sevagram Ashram (Wardha)', odiaName: 'ସେବାଗ୍ରାମ ଆଶ୍ରମ (ୱାର୍ଦ୍ଧା)', x: 380, y: 450, type: 'capital', yearFoundedOrConquered: '1936' },
      { name: 'Bombay (Quit India 1942)', odiaName: 'ବମ୍ବେ (ଅଗଷ୍ଟ କ୍ରାନ୍ତି ମଇଦାନ ୧୯୪୨)', x: 220, y: 505, type: 'city' },
      { name: 'Aga Khan Palace (Pune)', odiaName: 'ଆଗା ଖାନ୍ ପ୍ୟାଲେସ୍ (କାରାବାସ)', x: 245, y: 535, type: 'fort' },
      { name: 'Haripura (1938)', odiaName: 'ହରିପୁରା (୧୯୩୮)', x: 235, y: 430, type: 'city' },
      { name: 'Tripuri (1939)', odiaName: 'ତ୍ରିପୁରୀ (୧୯୩୯)', x: 395, y: 375, type: 'city' },
      { name: 'Delhi', odiaName: 'ଦିଲ୍ଲୀ', x: 305, y: 255, type: 'city' }
    ],
    summaryText: 'From Sevagram headquarters, Gandhi guides the nation. In August 1942, he issues the "Do or Die" call at Gowalia Tank Bombay, launching the decisive Quit India Movement.',
    territorialExtentSqKm: 'Subcontinental Mass Revolt'
  },
  {
    id: 'gandhi_frame_5',
    frameNumber: 5,
    yearDisplay: '1945–1948 CE',
    title: 'Simla Talks, Noakhali Peace Pilgrimage & Supreme Martyrdom',
    subtitle: 'Cabinet Mission, "One-Man Boundary Force" in Calcutta & Birla House',
    ruler: {
      name: 'Mahatma Gandhi (Father of the Nation)',
      odiaName: 'ମହାତ୍ମା ଗାନ୍ଧୀ (ଜାତିର ଜନକ)',
      reignPeriod: '1945–1948 CE',
      title: 'Apostle of Peace & Non-Violence',
      achievements: [
        'Participated in the Simla Conference (1945) and Cabinet Mission discussions (1946) advocating a united, free India',
        'Embarked on a heroic barefoot 4-month peace pilgrimage across 47 riot-hit villages of Noakhali (East Bengal) in late 1946 – early 1947',
        'Visited communal flashpoints in Bihar (March 1947) to comfort victims and restore inter-community harmony',
        'On 15 August 1947, shunned celebrations in Delhi to observe a 24-hour fast and prayer for communal peace at Beliaghata, Calcutta',
        'Lord Mountbatten hailed Gandhi as the "One-Man Boundary Force" who preserved peace where 50,000 armed troops failed',
        'Undertook his final fast in New Delhi (January 1948) to safeguard minorities and enforce moral integrity',
        'Martyred on 30 January 1948 at Birla House, New Delhi during his evening prayer assembly, uttering "He Ram"'
      ],
      importantBattles: [
        'Simla Conference (1945)',
        'Cabinet Mission Negotiations (Delhi, 1946)',
        'Noakhali Peace Pilgrimage (Nov 1946 – Feb 1947)',
        'Calcutta Beliaghata Miracle Fast (August–Sept 1947)',
        'Final Fast for Communal Harmony (Delhi, Jan 1948)'
      ],
      capitals: ['Birla House (New Delhi)', 'Sevagram Ashram (Wardha)'],
      historicalSignificance: 'The moral giant whose non-violence broke imperial chains and whose supreme sacrifice defended India’s secular and democratic ideals.',
      interestingFacts: [
        'Albert Einstein famously wrote: "Generations to come will scarce believe that such a one as this ever in flesh and blood walked upon this earth."',
        'Over 1.5 million mourners joined his funeral procession to Rajghat on the banks of the Yamuna, and the United Nations lowered its flag to half-mast.'
      ]
    },
    controlledRegionIds: ['gandhi_gujarat', 'gandhi_bihar', 'gandhi_maharashtra', 'gandhi_odisha', 'gandhi_delhi_up', 'gandhi_bengal', 'gandhi_south_belgaum'],
    newlyAcquiredRegionIds: [],
    campaignVectors: [
      {
        id: 'vector_delhi_to_noakhali',
        name: 'Barefoot Peace Pilgrimage to Noakhali',
        from: { x: 305, y: 255 },
        to: { x: 710, y: 365 },
        path: 'M 305,255 Q 510,310 710,365',
        year: 'November 1946 – February 1947',
        description: 'Walked barefoot across 47 riot-ravaged villages of East Bengal restoring inter-community harmony through Ahimsa.',
        commander: 'Mahatma Gandhi'
      },
      {
        id: 'vector_noakhali_to_calcutta',
        name: 'Calcutta Beliaghata Miracle Fast',
        from: { x: 710, y: 365 },
        to: { x: 625, y: 365 },
        path: 'M 710,365 Q 670,360 625,365',
        year: 'August 1947',
        description: 'Fasted at Hydari Mansion, Beliaghata during Independence Day; acclaimed as the "One-Man Boundary Force".',
        commander: 'Mahatma Gandhi'
      },
      {
        id: 'vector_calcutta_to_birla_house',
        name: 'Final Journey to Birla House, New Delhi',
        from: { x: 625, y: 365 },
        to: { x: 305, y: 255 },
        path: 'M 625,365 Q 460,310 305,255',
        year: 'September 1947 – January 1948',
        description: 'Conducted daily multi-faith prayer meetings and fasts for communal harmony until his martyrdom on 30 January 1948.',
        commander: 'Mahatma Gandhi'
      }
    ],
    cities: [
      { name: 'Birla House (Gandhi Smriti)', odiaName: 'ବିର୍ଲା ହାଉସ୍ (ଗାନ୍ଧୀ ସ୍ମୃତି, ନୂଆଦିଲ୍ଲୀ)', x: 305, y: 255, type: 'capital', yearFoundedOrConquered: '1948' },
      { name: 'Noakhali (Peace March 1946)', odiaName: 'ନୋଆଖାଲି (ଶାନ୍ତି ପଦଯାତ୍ରା)', x: 710, y: 365, type: 'city' },
      { name: 'Beliaghata (Calcutta Fast 1947)', odiaName: 'ବେଲିଆଘାଟା (କଲିକତା ଅନଶନ ୧୯୪୭)', x: 625, y: 365, type: 'city' },
      { name: 'Shimla (Conference 1945)', odiaName: 'ଶିମଲା (୧୯୪୫)', x: 295, y: 190, type: 'city' },
      { name: 'Sevagram Ashram (Wardha)', odiaName: 'ସେବାଗ୍ରାମ ଆଶ୍ରମ (ୱାର୍ଦ୍ଧା)', x: 380, y: 450, type: 'city' },
      { name: 'Rajghat (Samadhi)', odiaName: 'ରାଜଘାଟ (ନୂଆଦିଲ୍ଲୀ)', x: 310, y: 250, type: 'city' }
    ],
    summaryText: 'In the twilight of his life, Gandhi walks barefoot through riot-torn Noakhali, calms Calcutta as the "One-Man Boundary Force", and offers his supreme life for communal peace at Birla House, New Delhi.',
    territorialExtentSqKm: 'Sovereign Free India & Global Legacy'
  }
];

export const GANDHI_CHRONOLOGICAL_EVENTS: ChronologicalEvent[] = [
  {
    year: '9 Jan 1915',
    frameIndex: 0,
    eventTitle: 'Return to India from South Africa',
    ruler: 'Mahatma Gandhi',
    location: 'Apollo Bunder, Bombay',
    description: 'Arrived after 21 years in South Africa; welcomed enthusiastically by national leaders; commemorated as Pravasi Bharatiya Divas.',
    impact: 'Beginning of the Gandhian Era in Indian national history.'
  },
  {
    year: '1916 CE',
    frameIndex: 0,
    eventTitle: 'Historic Speech at Banaras Hindu University',
    ruler: 'Mahatma Gandhi',
    location: 'Varanasi, Uttar Pradesh',
    description: 'Delivered a startling speech at BHU opening, boldly reminding the assembled royalty and elites of the misery of Indian peasants.',
    impact: 'Established Gandhi as an uncompromising voice for the downtrodden.'
  },
  {
    year: 'Dec 1916',
    frameIndex: 0,
    eventTitle: 'Lucknow Congress & Meeting with Raj Kumar Shukla',
    ruler: 'Mahatma Gandhi & Raj Kumar Shukla',
    location: 'Lucknow, Uttar Pradesh',
    description: 'Bihari farmer Raj Kumar Shukla persuaded Gandhi to visit Champaran to witness the plight of indigo cultivators.',
    impact: 'Laid the catalyst for India’s first civil disobedience satyagraha.'
  },
  {
    year: 'Apr 1917',
    frameIndex: 0,
    eventTitle: 'Champaran Indigo Satyagraha',
    ruler: 'Mahatma Gandhi & Rajendra Prasad',
    location: 'Motihari & Bettiah, Bihar',
    description: 'Refused colonial magistrate orders to leave; forced British government to appoint an inquiry commission and abolish Tinkathia.',
    impact: 'First triumphant demonstration of Satyagraha on Indian soil.'
  },
  {
    year: '1918 CE',
    frameIndex: 0,
    eventTitle: 'Ahmedabad Mill Strike & Kheda Satyagraha',
    ruler: 'Mahatma Gandhi & Sardar Patel',
    location: 'Ahmedabad & Kheda, Gujarat',
    description: 'Undertook hunger strike for mill workers winning 35% wage rise; led peasant tax refusal during drought in Kheda.',
    impact: 'Consolidated peasants and factory workers behind non-violent methods.'
  },
  {
    year: '1920 CE',
    frameIndex: 1,
    eventTitle: 'Calcutta & Nagpur Congress Sessions',
    ruler: 'Mahatma Gandhi',
    location: 'Calcutta & Nagpur',
    description: 'Passed and ratified the Non-Cooperation Resolution, forging alliance with Khilafat and restructuring Congress committees.',
    impact: 'Converted Congress into a revolutionary mass organisation.'
  },
  {
    year: '23–29 Mar 1921',
    frameIndex: 1,
    eventTitle: 'Historic First Visit to Odisha',
    ruler: 'Mahatma Gandhi & Utkalmani Gopabandhu Das',
    location: 'Kathajodi Riverbed, Cuttack & Puri',
    description: 'Addressed massive public rally on the dry Kathajodi riverbed; thousands of Odia women donated ornaments to Tilak Swaraj Fund.',
    impact: 'Electrified the nationalist movement and Khadi spinning across Odisha.'
  },
  {
    year: 'Feb 1922',
    frameIndex: 1,
    eventTitle: 'Moral Suspension after Chauri Chaura',
    ruler: 'Mahatma Gandhi',
    location: 'Bardoli, Gujarat',
    description: 'Suspended the pan-Indian Non-Cooperation Movement after an enraged mob burned a police station at Chauri Chaura.',
    impact: 'Affirmed that Satyagraha demands absolute adherence to non-violence (Ahimsa).'
  },
  {
    year: 'Dec 1924',
    frameIndex: 1,
    eventTitle: '39th Session of INC at Belgaum (Presided by Gandhi)',
    ruler: 'Mahatma Gandhi (INC President)',
    location: 'Belgaum, Karnataka',
    description: 'Mahatma Gandhi served as Congress President for the only time in his life, uniting Swarajists and focusing on constructive rural upliftment.',
    impact: 'Unified Congress factions and institutionalised the spinning wheel (Charkha).'
  },
  {
    year: '12 Mar – 6 Apr 1930',
    frameIndex: 2,
    eventTitle: 'The Epic 241-Mile Dandi Salt March',
    ruler: 'Mahatma Gandhi & 78 Volunteers',
    location: 'Sabarmati to Dandi Beach, Gujarat',
    description: 'Marched on foot for 24 days to Dandi coast; picked up natural salt on 6 April 1930 to defy the British salt tax monopoly.',
    impact: 'Ignited the nationwide Civil Disobedience Movement and captured worldwide headlines.'
  },
  {
    year: 'Apr 1930',
    frameIndex: 2,
    eventTitle: 'Inchudi Salt Satyagraha (Odisha’s Dandi)',
    ruler: 'Gopabandhu Choudhury, Rama Devi & Malati Devi',
    location: 'Inchudi, Balasore, Odisha',
    description: 'Second largest salt satyagraha centre in India; thousands defied colonial police to manufacture contraband salt along the Odisha coast.',
    impact: 'Odisha emerged as a premier stronghold of non-violent civil disobedience.'
  },
  {
    year: '5 Mar 1931',
    frameIndex: 2,
    eventTitle: 'Signing of the Gandhi-Irwin Pact',
    ruler: 'Mahatma Gandhi & Viceroy Lord Irwin',
    location: 'Viceroy’s House, New Delhi',
    description: 'Agreement releasing civil disobedience prisoners and allowing coastal people to manufacture salt; ratified at Karachi Congress.',
    impact: 'British imperial government forced to treat Congress as an equal sovereign power.'
  },
  {
    year: 'Autumn 1931',
    frameIndex: 2,
    eventTitle: 'Second Round Table Conference in London',
    ruler: 'Mahatma Gandhi',
    location: 'St. James’s Palace, London',
    description: 'Attended as the sole representative of the Indian National Congress; pleaded passionately for immediate dominion self-rule.',
    impact: 'Showcased India’s moral demand directly to the British parliament and public.'
  },
  {
    year: '24 Sep 1932',
    frameIndex: 2,
    eventTitle: 'The Poona Pact with Dr. B. R. Ambedkar',
    ruler: 'Mahatma Gandhi & Dr. B. R. Ambedkar',
    location: 'Yerwada Central Jail, Pune',
    description: 'Fast unto death resulted in the Poona Pact, providing reserved legislative seats for Depressed Classes within a joint electorate.',
    impact: 'Prevented political fragmentation of Hindu society and doubled reserved seats for Dalits.'
  },
  {
    year: 'May 1934',
    frameIndex: 2,
    eventTitle: 'Monumental Barefoot Harijan Padayatra across Odisha',
    ruler: 'Mahatma Gandhi',
    location: 'Puri to Cuttack and Balasore, Odisha',
    description: 'Walked barefoot on foot for weeks across coastal Odisha, living in Kadua Ashram, visiting Dalit hamlets, and advocating temple entry.',
    impact: 'Permanent catalyst for social equality and anti-untouchability reform in Odisha.'
  },
  {
    year: '1936 CE',
    frameIndex: 3,
    eventTitle: 'Establishment of Sevagram Ashram at Wardha',
    ruler: 'Mahatma Gandhi & Kasturba Gandhi',
    location: 'Wardha, Maharashtra',
    description: 'Built Sevagram in rural central India as his permanent headquarters for village industries, sanitation, and Nai Talim basic education.',
    impact: 'Shifted the focus of the freedom movement directly to rural village reconstruction.'
  },
  {
    year: '8 Aug 1942',
    frameIndex: 3,
    eventTitle: 'Quit India "Do or Die" Call at Gowalia Tank',
    ruler: 'Mahatma Gandhi',
    location: 'Gowalia Tank Maidan, Bombay',
    description: 'Proclaimed the historic resolution "Do or Die" (Karo ya Maro / କର ବା ମର); arrested next morning and detained at Aga Khan Palace.',
    impact: 'Final, decisive mass rebellion that made continuing British rule untenable.'
  },
  {
    year: '1946–1947 CE',
    frameIndex: 4,
    eventTitle: 'Noakhali Peace Pilgrimage & Calcutta Beliaghata Fast',
    ruler: 'Mahatma Gandhi',
    location: 'Noakhali (Bengal) & Beliaghata (Calcutta)',
    description: 'Walked barefoot through 47 riot-ravaged villages of Noakhali; fasted at Beliaghata on Independence Day, bringing peace as a "One-Man Boundary Force".',
    impact: 'Saved Bengal from civil war through unmatched spiritual and moral courage.'
  },
  {
    year: '30 Jan 1948',
    frameIndex: 4,
    eventTitle: 'Supreme Martyrdom at Birla House',
    ruler: 'Mahatma Gandhi',
    location: 'Birla House, New Delhi',
    description: 'Assassinated on his way to evening prayer; uttered "He Ram"; funeral attended by 1.5 million people at Rajghat on the Yamuna.',
    impact: 'Sealed the secular, democratic soul of independent India and created an eternal legacy of non-violence for all humanity.'
  }
];

export const MAHATMA_GANDHI_MAP_DATA: HistoricalMap = {
  id: 'mahatma_gandhi_journey',
  title: 'Mahatma Gandhi: National Footsteps & Freedom Struggle (1915–1948)',
  odiaTitle: 'ମହାତ୍ମା ଗାନ୍ଧୀ: ସ୍ୱାଧୀନତା ସଂଗ୍ରାମ ଓ ଭାରତ ଭ୍ରମଣ (୧୯୧୫–୧୯୪୮)',
  topic: 'Mahatma Gandhi',
  era: '1915–1948 CE',
  category: 'figure',
  description: 'Chronological journey of Mahatma Gandhi across India: from his return at Apollo Bunder (1915), Champaran & Kheda Satyagrahas, Non-Cooperation, 39th Belgaum Congress, Dandi Salt March, Barefoot Harijan Padayatra in Odisha, to the Quit India Movement (1942) and Birla House (1948).',
  baseMapType: 'subcontinent',
  viewBox: '0 0 1000 850',
  regions: GANDHI_REGIONS,
  frames: GANDHI_FRAMES,
  events: GANDHI_CHRONOLOGICAL_EVENTS,
  geographicFeatures: {
    rivers: SUBCONTINENT_RIVERS,
    seas: SUBCONTINENT_SEAS
  },
  isBuiltin: true,
  createdAt: '2026-11-23T14:00:00.000Z',
  updatedAt: '2026-11-23T14:00:00.000Z'
};

// =========================================================================
// ALL BUILT-IN HISTORICAL MAPS PRESET COLLECTION
// =========================================================================

export const BUILTIN_HISTORICAL_MAPS: HistoricalMap[] = [
  MUGHAL_MAP_DATA,
  MAHATMA_GANDHI_MAP_DATA,
  MAURYAN_MAP_DATA,
  GUPTA_MAP_DATA,
  BRITISH_MAP_DATA,
  KALINGA_MAP_DATA
];
