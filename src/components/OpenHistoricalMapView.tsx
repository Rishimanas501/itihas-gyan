import React, { useState, useEffect, useRef, useMemo } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  RotateCcw,
  Maximize2,
  Minimize2,
  Download,
  FileText,
  MapPin,
  Calendar,
  Award,
  X,
  Compass,
  Check,
  Flag,
  HelpCircle,
  Search,
  Layers,
  WifiOff,
  Globe,
  Info,
  ChevronDown
} from 'lucide-react';
import type { 
  HistoricalMap, 
  HistoricalFrame, 
  HistoricalRegion, 
  HistoricalCity,
  PoliticalStatus 
} from '../types';
import { 
  getHistoricalRegionGeoCoords, 
  getCityGeoCoord, 
  getCampaignGeoPath,
  calculateMapCenterAndBounds,
  convertHistoricalFrameToGeoJSON,
  HISTORICAL_GEO_CITIES 
} from '../services/googleMapsGeoService';
import { exportMapToPDF } from '../services/historicalMapService';

interface OpenHistoricalMapViewProps {
  currentMap: HistoricalMap;
  activeFrameIndex: number;
  setActiveFrameIndex: React.Dispatch<React.SetStateAction<number>>;
  isPlaying: boolean;
  setIsPlaying: React.Dispatch<React.SetStateAction<boolean>>;
  playbackSpeed: 1 | 2 | 3;
  setPlaybackSpeed: React.Dispatch<React.SetStateAction<1 | 2 | 3>>;
  onRestart: () => void;
  onPrev: () => void;
  onNext: () => void;
  isOdia?: boolean;
  onSwitchToCanvasMap: () => void;
  initialTileProvider?: TileProviderKey;
  bannerNotice?: string;
}

// Tile Layer Configuration (OpenStreetMap Compatible, respecting attribution and terms)
export type TileProviderKey = 'satellite' | 'positron' | 'voyager' | 'osm' | 'opentopo';

interface TileProviderConfig {
  name: string;
  url: string;
  attribution: string;
  maxZoom: number;
  subdomains?: string[];
}

const TILE_PROVIDERS: Record<TileProviderKey, TileProviderConfig> = {
  satellite: {
    name: 'Satellite View (ସାଟେଲାଇଟ୍ ଉପଗ୍ରହ ଚିତ୍ର)',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri, Maxar, Earthstar Geographics, USDA, USGS, AeroGRID, IGN',
    maxZoom: 19
  },
  positron: {
    name: 'CartoDB Positron (Parchment Light)',
    url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    maxZoom: 19,
    subdomains: ['a', 'b', 'c', 'd']
  },
  voyager: {
    name: 'CartoDB Voyager (Antique Atlas)',
    url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    maxZoom: 19,
    subdomains: ['a', 'b', 'c', 'd']
  },
  osm: {
    name: 'OpenStreetMap Standard (ମାନଚିତ୍ର)',
    url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19
  },
  opentopo: {
    name: 'OpenTopoMap (ପର୍ବତ ଓ ଭୂପ୍ରକୃତି - Relief)',
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    attribution: 'Kartendaten: &copy; <a href="https://openstreetmap.org/copyright">OpenStreetMap</a>-Mitwirkende, SRTM | Kartendarstellung: &copy; <a href="http://opentopomap.org">OpenTopoMap</a>',
    maxZoom: 17,
    subdomains: ['a', 'b', 'c']
  }
};

export const OpenHistoricalMapView: React.FC<OpenHistoricalMapViewProps> = ({
  currentMap,
  activeFrameIndex,
  setActiveFrameIndex,
  isPlaying,
  setIsPlaying,
  playbackSpeed,
  setPlaybackSpeed,
  onRestart,
  onPrev,
  onNext,
  isOdia = true,
  onSwitchToCanvasMap,
  initialTileProvider = 'satellite',
  bannerNotice
}) => {
  // Tile layer state
  const [activeTileKey, setActiveTileKey] = useState<TileProviderKey>(initialTileProvider);
  const [isLayerMenuOpen, setIsLayerMenuOpen] = useState(false);
  
  // Layer visibility toggles
  const [showBoundaries, setShowBoundaries] = useState(true);
  const [showMarkers, setShowMarkers] = useState(true);
  const [showRoutes, setShowRoutes] = useState(true);

  // Map state & UI
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [selectedRegion, setSelectedRegion] = useState<HistoricalRegion | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // References
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapDivRef = useRef<HTMLDivElement | null>(null);
  const leafletMapRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const geoJsonLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const markersLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const routesLayerGroupRef = useRef<L.LayerGroup | null>(null);

  // Online / Offline Detection
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const currentFrame: HistoricalFrame | undefined = useMemo(() => {
    if (!currentMap || !currentMap.frames || currentMap.frames.length === 0) return undefined;
    return currentMap.frames[activeFrameIndex] || currentMap.frames[0];
  }, [currentMap, activeFrameIndex]);

  // Topic classification detection
  const isFigureOrMovement = useMemo(() => {
    return currentMap.category === 'figure' || currentMap.category === 'movement' || currentMap.category === 'civilisation' || currentMap.category === 'event';
  }, [currentMap.category]);

  // 1. Initialize Leaflet Map Instance
  useEffect(() => {
    if (!mapDivRef.current || leafletMapRef.current) return;

    const initial = calculateMapCenterAndBounds(currentMap.regions, currentMap.frames[0]?.cities || []);

    const map = L.map(mapDivRef.current, {
      center: [initial.center.lat, initial.center.lng],
      zoom: initial.zoom,
      minZoom: 3,
      maxZoom: 18,
      zoomControl: false // We render custom zoom controls
    });

    // Custom Zoom Control at top right
    L.control.zoom({ position: 'topright' }).addTo(map);

    // Initial Base Tile Layer
    const provider = TILE_PROVIDERS[activeTileKey];
    const tileLayer = L.tileLayer(provider.url, {
      attribution: provider.attribution,
      maxZoom: provider.maxZoom,
      subdomains: provider.subdomains || 'abc'
    }).addTo(map);

    tileLayerRef.current = tileLayer;

    // Layer groups for dynamic historical elements
    geoJsonLayerGroupRef.current = L.layerGroup().addTo(map);
    markersLayerGroupRef.current = L.layerGroup().addTo(map);
    routesLayerGroupRef.current = L.layerGroup().addTo(map);

    leafletMapRef.current = map;

    // Fit initial bounds if available
    if (initial.bounds) {
      map.fitBounds([
        [initial.bounds.south, initial.bounds.west],
        [initial.bounds.north, initial.bounds.east]
      ], { padding: [30, 30] });
    }

    return () => {
      map.remove();
      leafletMapRef.current = null;
    };
  }, []);

  // 2. Switch Tile Provider when activeTileKey changes
  useEffect(() => {
    if (!leafletMapRef.current) return;
    const map = leafletMapRef.current;

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }

    const provider = TILE_PROVIDERS[activeTileKey];
    const newTileLayer = L.tileLayer(provider.url, {
      attribution: provider.attribution,
      maxZoom: provider.maxZoom,
      subdomains: provider.subdomains || 'abc'
    }).addTo(map);

    tileLayerRef.current = newTileLayer;
  }, [activeTileKey]);

  // 3. Render Historical GeoJSON Overlays, Markers & Routes for Active Stage
  useEffect(() => {
    if (!leafletMapRef.current || !currentFrame || !currentMap) return;

    const map = leafletMapRef.current;
    const geoGroup = geoJsonLayerGroupRef.current;
    const markersGroup = markersLayerGroupRef.current;
    const routesGroup = routesLayerGroupRef.current;

    if (!geoGroup || !markersGroup || !routesGroup) return;

    // Clear previous stage layers
    geoGroup.clearLayers();
    markersGroup.clearLayers();
    routesGroup.clearLayers();

    const bounds = L.latLngBounds([]);
    let hasCoords = false;

    // A. Render Historical Territorial Boundaries (GeoJSON Polygons)
    if (showBoundaries) {
      const geoJsonData = convertHistoricalFrameToGeoJSON(currentFrame, currentMap);

      L.geoJSON(geoJsonData as any, {
        filter: (feature) => feature.properties.featureType === 'region',
        style: (feature: any) => {
          const props = feature.properties;
          return {
            fillColor: props.fillColor || '#10b981',
            weight: props.isNewlyAcquired ? 3 : 2,
            opacity: 0.9,
            color: props.strokeColor || '#047857',
            dashArray: props.isNewlyAcquired ? '4, 4' : undefined,
            fillOpacity: props.fillOpacity || 0.38
          };
        },
        onEachFeature: (feature, layer) => {
          const props = feature.properties;
          
          // Tooltip on Hover
          layer.bindTooltip(
            `<div class="font-sans font-bold text-xs text-amber-950">${props.name}</div>
             <div class="font-sans text-[10px] text-stone-600">${props.modernLocation || ''}</div>
             ${props.isNewlyAcquired ? '<div class="text-[9px] font-bold text-rose-600">⚡ Newly Conquered Stage</div>' : ''}`,
            { sticky: true, className: 'historical-leaflet-tooltip' }
          );

          // Click handler opens detailed modal
          layer.on('click', () => {
            const foundRegion = currentMap.regions.find(r => r.id === props.id);
            if (foundRegion) {
              setSelectedRegion(foundRegion);
            }
          });

          // Collect bounds
          if ((layer as any).getBounds) {
            bounds.extend((layer as any).getBounds());
            hasCoords = true;
          }
        }
      }).addTo(geoGroup);
    }

    // B. Render Campaign Routes (LineStrings / Polylines with directional arrows)
    if (showRoutes && currentFrame.campaignVectors) {
      currentFrame.campaignVectors.forEach((vector) => {
        const pathPts = getCampaignGeoPath(vector);
        if (pathPts && pathPts.length >= 2) {
          const latLngs: L.LatLngExpression[] = pathPts.map(pt => [pt.lat, pt.lng]);
          
          const polyline = L.polyline(latLngs, {
            color: '#b91c1c',
            weight: 3,
            dashArray: '6, 6',
            opacity: 0.85
          });

          polyline.bindTooltip(
            `<div class="font-sans font-bold text-xs text-rose-900">⚔️ ${vector.name}</div>
             <div class="text-[10px] text-stone-700">${vector.commander} (${vector.year})</div>
             <div class="text-[10px] italic text-stone-600">${vector.description}</div>`,
            { sticky: true }
          );

          polyline.addTo(routesGroup);
          latLngs.forEach(ll => bounds.extend(ll));
          hasCoords = true;
        }
      });
    }

    // C. Render Historical Cities, Capitals, Forts, Battlefields (Markers)
    if (showMarkers && currentFrame.cities) {
      currentFrame.cities.forEach((city) => {
        const pt = getCityGeoCoord(city);
        bounds.extend([pt.lat, pt.lng]);
        hasCoords = true;

        // Custom Icon design based on city type
        let emoji = '🏛️';
        let bgClass = 'bg-stone-800 text-amber-300 border-amber-400';
        if (city.type === 'capital') {
          emoji = '👑';
          bgClass = 'bg-amber-600 text-amber-50 border-amber-300 ring-2 ring-amber-400/50';
        } else if (city.type === 'fort') {
          emoji = '🏰';
          bgClass = 'bg-indigo-700 text-indigo-50 border-indigo-300';
        } else if (city.type === 'battlefield') {
          emoji = '⚔️';
          bgClass = 'bg-rose-700 text-rose-50 border-rose-300 animate-pulse';
        } else if (city.type === 'port') {
          emoji = '⚓';
          bgClass = 'bg-cyan-700 text-cyan-50 border-cyan-300';
        }

        const customIcon = L.divIcon({
          className: 'custom-historical-pin',
          html: `
            <div class="flex items-center space-x-1 cursor-pointer transform -translate-x-1/2 -translate-y-1/2 group">
              <div class="w-6 h-6 rounded-full flex items-center justify-center text-xs shadow-md border ${bgClass} transition group-hover:scale-125">
                ${emoji}
              </div>
              <span class="bg-[#fcf8ed]/95 backdrop-blur-xs text-[#451a03] font-sans font-bold text-[10px] px-1.5 py-0.5 rounded border border-amber-800/40 shadow-xs whitespace-nowrap">
                ${isOdia && city.odiaName ? city.odiaName : city.name}
              </span>
            </div>
          `,
          iconSize: [24, 24],
          iconAnchor: [12, 12]
        });

        const marker = L.marker([pt.lat, pt.lng], { icon: customIcon });

        marker.bindPopup(`
          <div class="font-sans text-xs p-1">
            <div class="font-bold text-amber-950 text-sm flex items-center gap-1">
              <span>${emoji}</span>
              <span>${city.name}</span>
              ${city.odiaName ? `<span class="text-stone-600 font-normal">(${city.odiaName})</span>` : ''}
            </div>
            <div class="text-[11px] text-amber-900 font-semibold mt-0.5 capitalize">
              Type: ${city.type || 'Historical Site'} ${city.yearFoundedOrConquered ? `• ${city.yearFoundedOrConquered}` : ''}
            </div>
            <div class="text-[10px] text-stone-600 mt-1">
              Lat: ${pt.lat.toFixed(3)}°N, Lng: ${pt.lng.toFixed(3)}°E
            </div>
          </div>
        `);

        marker.addTo(markersGroup);
      });
    }

    // Smoothly pan and fit historical bounds
    if (hasCoords && bounds.isValid()) {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 8, animate: true });
    }
  }, [currentFrame, currentMap, showBoundaries, showMarkers, showRoutes, isOdia]);

  // Fullscreen Handler
  const toggleFullscreen = () => {
    if (!mapContainerRef.current) return;
    if (!document.fullscreenElement) {
      mapContainerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  // Search Location Handler
  const handleSearchLocation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim() || !leafletMapRef.current) return;

    const query = searchQuery.toLowerCase().trim();
    
    // 1. Search in historical cities dictionary
    for (const [name, pt] of Object.entries(HISTORICAL_GEO_CITIES)) {
      if (name.includes(query) || query.includes(name)) {
        leafletMapRef.current.flyTo([pt.lat, pt.lng], 8, { duration: 1.2 });
        return;
      }
    }

    // 2. Search in active frame cities
    const match = currentFrame?.cities?.find(c => 
      c.name.toLowerCase().includes(query) || (c.odiaName && c.odiaName.includes(query))
    );
    if (match) {
      const pt = getCityGeoCoord(match);
      leafletMapRef.current.flyTo([pt.lat, pt.lng], 8, { duration: 1.2 });
    } else {
      showToast(isOdia ? 'ସ୍ଥାନ ମିଳିଲା ନାହିଁ' : 'Location not found in active stage.');
    }
  };

  // Export Stage to GeoJSON File
  const handleExportGeoJSON = () => {
    if (!currentFrame || !currentMap) return;
    const geoJsonData = convertHistoricalFrameToGeoJSON(currentFrame, currentMap);
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(geoJsonData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `${currentMap.id}_frame_${currentFrame.frameNumber}_${currentFrame.yearDisplay.replace(/\s+/g, '_')}.geojson`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast(isOdia ? 'GeoJSON ଫାଇଲ୍ ସଫଳତାର ସହ ଡାଉନଲୋଡ୍ ହେଲା!' : 'GeoJSON exported successfully!');
  };

  // Export Stage to PDF
  const handleExportPDF = async () => {
    if (!currentMap) return;
    try {
      await exportMapToPDF(currentMap, activeFrameIndex);
      showToast(isOdia ? 'PDF ଆଟଲାସ୍ ରିପୋର୍ଟ ସଫଳତାର ସହ ତିଆରି ହେଲା!' : 'Atlas PDF report exported successfully!');
    } catch (e) {
      console.error(e);
      alert('Failed to export PDF.');
    }
  };

  const getPoliticalStatusBadge = (status: PoliticalStatus) => {
    if (isFigureOrMovement) {
      switch (status) {
        case 'direct_annexation':
          return { bg: 'bg-emerald-100 text-emerald-800 border-emerald-300', label: isOdia ? 'ପ୍ରମୁଖ ସକ୍ରିୟ କେନ୍ଦ୍ର (Epicentre)' : 'Primary Active Epicentre' };
        case 'tributary_vassal':
          return { bg: 'bg-amber-100 text-amber-800 border-amber-300', label: isOdia ? 'ସହଯୋଗୀ ଅଞ୍ଚଳ (Affiliated Zone)' : 'Affiliated Solidarity Region' };
        case 'protectorate':
          return { bg: 'bg-blue-100 text-blue-800 border-blue-300', label: isOdia ? 'ସମର୍ଥନକାରୀ କ୍ଷେତ୍ର (Support Zone)' : 'Support Zone' };
        case 'frontier_sphere':
        default:
          return { bg: 'bg-purple-100 text-purple-800 border-purple-300', label: isOdia ? 'ପ୍ରଚାର ଓ ବିସ୍ତାର କ୍ଷେତ୍ର (Outreach)' : 'Outreach & Mobilization Sphere' };
      }
    }
    switch (status) {
      case 'direct_annexation':
        return { bg: 'bg-emerald-100 text-emerald-800 border-emerald-300', label: isOdia ? 'ପ୍ରତ୍ୟକ୍ଷ ସାମ୍ରାଜ୍ୟ ଭୁକ୍ତ (Direct Subah)' : 'Direct Imperial Annexation' };
      case 'tributary_vassal':
        return { bg: 'bg-amber-100 text-amber-800 border-amber-300', label: isOdia ? 'କରଦ / ସାମନ୍ତ ରାଜ୍ୟ (Tributary Vassal)' : 'Tributary Vassal Kingdom' };
      case 'protectorate':
        return { bg: 'bg-blue-100 text-blue-800 border-blue-300', label: isOdia ? 'ସୁରକ୍ଷିତ ରାଜ୍ୟ (Protectorate)' : 'Protectorate Territory' };
      case 'frontier_sphere':
      default:
        return { bg: 'bg-purple-100 text-purple-800 border-purple-300', label: isOdia ? 'ସୀମାନ୍ତ ପ୍ରଭାବ କ୍ଷେତ୍ର (Frontier)' : 'Frontier Influence Sphere' };
    }
  };

  if (!currentMap || !currentFrame) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-700"></div>
      </div>
    );
  }

  return (
    <div 
      ref={mapContainerRef}
      className={`flex-1 flex flex-col min-h-0 bg-[#f8fafc] text-slate-900 overflow-hidden select-none ${
        isFullscreen ? 'p-1.5' : 'p-0.5'
      }`}
      style={{ fontFamily: '"Georgia", "Cambria", "Times New Roman", serif' }}
    >
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 bg-stone-900 text-emerald-200 px-4 py-2 rounded-xl shadow-2xl border border-emerald-600/40 flex items-center space-x-2 text-xs animate-fade-in font-sans">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ========================================================= */}
      {/* 1. TOP SUBHEADER & OPENSTREETMAP CONTROLS BAR (SHRINK-0)  */}
      {/* ========================================================= */}
      <div className="shrink-0 bg-white border border-emerald-800/20 rounded-xl px-3 py-1.5 shadow-xs mb-2">
        <div className="flex items-center justify-between gap-2">
          
          {/* Title and Badge */}
          <div className="flex items-center space-x-2.5 min-w-0">
            <div className="p-1.5 bg-gradient-to-br from-emerald-600 to-teal-800 text-white rounded-lg shadow-xs shrink-0">
              <Globe className="w-4 h-4 animate-spin-slow" />
            </div>
            <div className="min-w-0 truncate">
              <div className="flex items-center space-x-1.5">
                <span className="text-[10px] uppercase tracking-wider font-sans font-bold px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                  {isOdia ? 'ସାଟେଲାଇଟ୍ ଓ ଓପନ୍ ମ୍ୟାପ୍ (ବିନା API KEY)' : 'SATELLITE & OPEN MAP (NO KEY REQUIRED)'}
                </span>
                <span className="text-[10px] font-sans px-1.5 py-0.2 rounded bg-amber-50 text-amber-800 border border-amber-200 font-semibold truncate">
                  {currentMap.era}
                </span>
              </div>
              <h1 className="text-sm sm:text-base font-bold text-slate-900 truncate leading-tight">
                {isOdia && currentMap.odiaTitle ? currentMap.odiaTitle : currentMap.title}
              </h1>
            </div>
          </div>

          {/* Action & Control Buttons */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            
            {/* Historical Places Search Field */}
            <form onSubmit={handleSearchLocation} className="hidden md:flex items-center relative">
              <input
                type="text"
                placeholder={isOdia ? 'ସ୍ଥାନ ଖୋଜନ୍ତୁ (Search)...' : 'Search Historical Location...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-40 lg:w-48 bg-slate-100 text-slate-800 font-sans text-xs rounded-lg pl-2.5 pr-7 py-1.5 border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-600 transition"
              />
              <button type="submit" className="absolute right-2 top-2 text-slate-500 hover:text-slate-800">
                <Search className="w-3.5 h-3.5" />
              </button>
            </form>

            {/* Tile Layer Selector (Positron, Voyager, OSM Standard, OpenTopo) */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsLayerMenuOpen(!isLayerMenuOpen)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-800 px-2 py-1.5 rounded-lg border border-slate-300 text-xs font-sans font-semibold flex items-center space-x-1 transition shadow-xs"
                title="Select Base Map Style & Overlays"
              >
                <Layers className="w-3.5 h-3.5 text-emerald-700" />
                <span className="hidden sm:inline">{TILE_PROVIDERS[activeTileKey].name.split(' ')[0]}</span>
                <ChevronDown className="w-3 h-3 text-slate-500" />
              </button>

              {isLayerMenuOpen && (
                <div className="absolute right-0 top-full mt-1.5 w-60 bg-white border border-slate-200 rounded-xl shadow-xl p-2.5 z-50 font-sans text-xs animate-fade-in">
                  <div className="font-bold text-slate-800 uppercase tracking-wider text-[10px] pb-1 border-b border-slate-100 mb-1.5">
                    {isOdia ? 'ମ୍ୟାପ୍ ଷ୍ଟାଇଲ୍ (Base Tiles)' : 'Base Map Provider'}
                  </div>
                  <div className="space-y-1 mb-2.5">
                    {(Object.keys(TILE_PROVIDERS) as TileProviderKey[]).map((key) => (
                      <button
                        key={key}
                        onClick={() => {
                          setActiveTileKey(key);
                          setIsLayerMenuOpen(false);
                        }}
                        className={`w-full text-left px-2 py-1.5 rounded-lg flex items-center justify-between text-xs transition ${
                          activeTileKey === key 
                            ? 'bg-emerald-50 text-emerald-800 font-bold border border-emerald-200' 
                            : 'text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <span>{TILE_PROVIDERS[key].name}</span>
                        {activeTileKey === key && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                      </button>
                    ))}
                  </div>

                  <div className="font-bold text-slate-800 uppercase tracking-wider text-[10px] pb-1 border-b border-slate-100 mb-1.5">
                    {isOdia ? 'ଐତିହାସିକ ଲେୟାର୍ (Overlays)' : 'Historical Layers'}
                  </div>
                  <div className="space-y-1.5 text-xs text-slate-700">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={showBoundaries}
                        onChange={(e) => setShowBoundaries(e.target.checked)}
                        className="rounded text-emerald-600 focus:ring-emerald-500"
                      />
                      <span>{isOdia ? 'ସାମ୍ରାଜ୍ୟ ସୀମାରେଖା (Boundaries)' : 'Territorial Boundaries'}</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={showMarkers}
                        onChange={(e) => setShowMarkers(e.target.checked)}
                        className="rounded text-emerald-600 focus:ring-emerald-500"
                      />
                      <span>{isOdia ? 'ରାଜଧାନୀ ଓ ଦୁର୍ଗ (Capitals & Forts)' : 'Capitals, Forts & Sites'}</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={showRoutes}
                        onChange={(e) => setShowRoutes(e.target.checked)}
                        className="rounded text-emerald-600 focus:ring-emerald-500"
                      />
                      <span>{isOdia ? 'ସେନା ଅଭିଯାନ ମାର୍ଗ (Campaign Routes)' : 'Campaign Routes'}</span>
                    </label>
                  </div>
                </div>
              )}
            </div>

            {/* GeoJSON Export Button */}
            <button
              onClick={handleExportGeoJSON}
              className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 p-1.5 rounded-lg border border-emerald-300 shadow-xs transition"
              title={isOdia ? 'GeoJSON ଡାଉନଲୋଡ୍ କରନ୍ତୁ' : 'Download GeoJSON Dataset'}
            >
              <Download className="w-3.5 h-3.5 text-emerald-700" />
            </button>

            {/* PDF Report Export Button */}
            <button
              onClick={handleExportPDF}
              className="bg-slate-100 hover:bg-slate-200 text-slate-800 p-1.5 rounded-lg border border-slate-300 shadow-xs transition"
              title={isOdia ? 'PDF ଆଟଲାସ୍ ରିପୋର୍ଟ' : 'Export PDF Report'}
            >
              <FileText className="w-3.5 h-3.5 text-slate-700" />
            </button>

            {/* Fullscreen Toggle Button */}
            <button
              onClick={toggleFullscreen}
              className="bg-slate-100 hover:bg-slate-200 text-slate-800 p-1.5 rounded-lg border border-slate-300 shadow-xs transition"
              title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen Map Mode'}
            >
              {isFullscreen ? (
                <Minimize2 className="w-3.5 h-3.5 text-slate-700" />
              ) : (
                <Maximize2 className="w-3.5 h-3.5 text-slate-700" />
              )}
            </button>

          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 2. MAIN 2-COLUMN VIEWPORT WORKSPACE                       */}
      {/* ========================================================= */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-2 sm:gap-3 overflow-hidden">
        
        {/* ========================================================= */}
        {/* LEFT COLUMN: 8 COLS (~68% WIDTH) — LEAFLET MAP + FLIPBOOK  */}
        {/* ========================================================= */}
        <div className="lg:col-span-8 flex flex-col h-full min-h-0 overflow-hidden">
          
          {/* The Leaflet Map Container Stage */}
          <div className="flex-1 min-h-0 relative bg-slate-100 border-2 border-emerald-900/20 rounded-xl shadow-md overflow-hidden flex items-center justify-center">
            
            {/* Live Leaflet DIV */}
            <div ref={mapDivRef} className="w-full h-full z-0" />

            {/* Stage Banner Overlay on Map (Top Left) */}
            <div className="absolute top-2.5 left-3 z-10 bg-white/95 backdrop-blur-xs border border-emerald-800/30 rounded-lg px-2.5 py-1 shadow-md max-w-[280px] pointer-events-auto">
              <div className="flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
                <span className="font-sans text-[10px] uppercase font-bold text-emerald-900 tracking-wider">
                  {isOdia ? `ପର୍ଯ୍ୟାୟ ${currentFrame.frameNumber}` : `Frame ${currentFrame.frameNumber}`}
                </span>
                <span className="font-sans text-[10px] bg-emerald-100 text-emerald-900 px-1.5 py-0.2 rounded font-extrabold border border-emerald-300">
                  {currentFrame.yearDisplay}
                </span>
              </div>
              <h2 className="font-bold text-xs sm:text-sm text-slate-900 leading-tight mt-0.5 truncate">
                {currentFrame.title}
              </h2>
              <p className="text-[10px] text-stone-600 truncate mt-0.2">
                {currentFrame.subtitle}
              </p>
            </div>

            {/* Informational Banner Notice (e.g. Free Satellite active without API key) */}
            {bannerNotice && (
              <div className="absolute top-2.5 right-12 z-20 bg-blue-50/95 border border-blue-400 text-blue-900 rounded-lg px-2.5 py-1 text-xs shadow-md flex items-center space-x-1.5 animate-fade-in pointer-events-auto">
                <Info className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span className="font-sans font-semibold text-[11px]">{bannerNotice}</span>
              </div>
            )}

            {/* Offline Detection Banner */}
            {!isOnline && (
              <div className="absolute top-14 left-3 right-3 z-20 bg-amber-50/95 border-2 border-amber-500 rounded-xl p-2.5 shadow-lg flex items-center justify-between text-xs text-amber-900">
                <div className="flex items-center space-x-2">
                  <WifiOff className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>
                    {isOdia
                      ? 'ଇଣ୍ଟରନେଟ୍ ସଂଯୋଗ ନାହିଁ। ଓପନ୍ ହିଷ୍ଟୋରିକାଲ୍ ମ୍ୟାପ୍ ଟାଇଲ୍ସ ଲୋଡ୍ କରିବା ପାଇଁ ଇଣ୍ଟରନେଟ୍ ଆବଶ୍ୟକ।'
                      : 'Internet connection is unavailable. Open Historical Map requires network to stream tiles.'}
                  </span>
                </div>
                <button
                  onClick={onSwitchToCanvasMap}
                  className="bg-amber-800 hover:bg-amber-900 text-amber-50 px-2.5 py-1 rounded-lg font-bold text-[11px] shrink-0 ml-2"
                >
                  {isOdia ? 'ଅଫଲାଇନ୍ ଆଟଲାସ୍‌କୁ ଫେରନ୍ତୁ' : 'Use Offline Canvas'}
                </button>
              </div>
            )}

            {/* Map Legend (Bottom Right) */}
            <div className="absolute bottom-2 right-2 z-10 bg-white/90 backdrop-blur-xs border border-slate-300 rounded-lg p-1.5 shadow-xs font-sans text-[10px] max-w-[210px] pointer-events-auto">
              <div className="text-[9px] font-bold text-slate-900 uppercase tracking-wider mb-1 border-b border-slate-200 pb-0.5 flex items-center justify-between">
                <span>{isFigureOrMovement ? 'ସୂଚୀ (Legend)' : 'ସାମ୍ରାଜ୍ୟ ସୂଚୀ'}</span>
                <span className="text-[8px] text-slate-400 font-normal">GeoJSON</span>
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center space-x-1.5">
                  <span className="w-2.5 h-2.5 rounded bg-emerald-500 border border-emerald-700 flex-shrink-0" />
                  <span className="text-slate-700 text-[9px] truncate">
                    {isFigureOrMovement ? 'ପ୍ରମୁଖ ସକ୍ରିୟ କେନ୍ଦ୍ର' : 'ଅଧୀକୃତ ପ୍ରଦେଶ (Imperial Subahs)'}
                  </span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <span className="w-2.5 h-2.5 rounded bg-amber-400 border border-amber-600 flex-shrink-0" />
                  <span className="text-slate-700 text-[9px] truncate">
                    {isFigureOrMovement ? 'ସହଯୋଗୀ ଅଞ୍ଚଳ' : 'କରଦ / ସାମନ୍ତ ରାଜ୍ୟ (Tributary)'}
                  </span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <span className="w-2.5 h-2.5 rounded bg-rose-500 border border-rose-700 flex-shrink-0 animate-pulse" />
                  <span className="text-slate-700 text-[9px] font-semibold truncate">
                    {isFigureOrMovement ? 'ନୂତନ ସକ୍ରିୟ କେନ୍ଦ୍ର' : 'ନୂତନ ବିଜୟ (Newly Conquered)'}
                  </span>
                </div>
              </div>
            </div>

          </div>

          {/* ========================================================= */}
          {/* BOTTOM CONTROLS & TIMELINE FILMSTRIP (SHRINK-0: ~92px)    */}
          {/* ========================================================= */}
          <div className="shrink-0 h-[92px] mt-2 bg-[#f4eedb] border border-amber-800/30 rounded-xl px-2.5 py-1.5 shadow-xs flex flex-col justify-between overflow-hidden">
            
            {/* Playback Button Bar */}
            <div className="flex items-center justify-between gap-1 shrink-0">
              
              {/* Playback Navigation Buttons */}
              <div className="flex items-center space-x-1">
                <button
                  onClick={onRestart}
                  className="p-1 rounded-md bg-[#ede4cb] hover:bg-amber-800 hover:text-amber-50 text-stone-800 transition shadow-2xs"
                  title="Restart from Beginning"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={onPrev}
                  disabled={activeFrameIndex === 0}
                  className="p-1 rounded-md bg-[#ede4cb] hover:bg-amber-800 hover:text-amber-50 text-stone-800 transition shadow-2xs disabled:opacity-40"
                  title="Previous Historical Stage"
                >
                  <SkipBack className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="px-2.5 py-1 rounded-md bg-gradient-to-r from-emerald-700 to-teal-800 hover:from-emerald-800 hover:to-teal-900 text-white font-sans text-xs font-bold flex items-center space-x-1 transition shadow-xs"
                >
                  {isPlaying ? (
                    <>
                      <Pause className="w-3.5 h-3.5 fill-current" />
                      <span>{isOdia ? 'ରୁହନ୍ତୁ' : 'Pause'}</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>{isOdia ? 'ଆନିମେସନ୍' : 'Play'}</span>
                    </>
                  )}
                </button>
                <button
                  onClick={onNext}
                  disabled={activeFrameIndex === currentMap.frames.length - 1}
                  className="p-1 rounded-md bg-[#ede4cb] hover:bg-amber-800 hover:text-amber-50 text-stone-800 transition shadow-2xs disabled:opacity-40"
                  title="Next Historical Stage"
                >
                  <SkipForward className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Stage Progress & Speed Selector */}
              <div className="flex items-center space-x-2">
                <div className="hidden sm:flex items-center space-x-1 font-sans text-[10px] text-amber-950 font-bold bg-[#ede4cb] px-2 py-0.5 rounded border border-amber-800/20">
                  <span>{isOdia ? 'ପର୍ଯ୍ୟାୟ' : 'Stage'}:</span>
                  <span className="text-emerald-700 font-extrabold">{activeFrameIndex + 1}</span>
                  <span>/</span>
                  <span>{currentMap.frames.length}</span>
                </div>

                <div className="flex items-center space-x-0.5 bg-[#ede4cb] p-0.5 rounded-lg border border-amber-800/20 font-sans text-[10px] font-bold">
                  {[1, 2, 3].map((spd) => (
                    <button
                      key={spd}
                      onClick={() => setPlaybackSpeed(spd as 1 | 2 | 3)}
                      className={`px-1.5 py-0.5 rounded transition ${
                        playbackSpeed === spd
                          ? 'bg-emerald-700 text-emerald-50 shadow-2xs font-black'
                          : 'text-stone-700 hover:text-stone-900'
                      }`}
                    >
                      {spd}x
                    </button>
                  ))}
                </div>
              </div>

            </div>

            {/* Horizontal Chronological Stage Filmstrip */}
            <div className="flex-1 min-h-0 flex items-center space-x-1.5 overflow-x-auto scrollbar-thin pt-1">
              {currentMap.frames.map((frame, idx) => {
                const isActive = idx === activeFrameIndex;
                const isPassed = idx < activeFrameIndex;
                return (
                  <button
                    key={frame.id}
                    onClick={() => {
                      setIsPlaying(false);
                      setActiveFrameIndex(idx);
                    }}
                    className={`h-[42px] min-w-[105px] max-w-[125px] px-1.5 py-0.5 rounded-lg border text-left transition flex flex-col justify-center shrink-0 ${
                      isActive
                        ? 'bg-emerald-50 border-emerald-600 ring-2 ring-emerald-500/40 shadow-xs'
                        : isPassed
                        ? 'bg-[#ede4cb] border-amber-800/30 opacity-90 hover:opacity-100'
                        : 'bg-[#faf6eb] border-amber-800/20 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className={`text-[9px] font-sans font-bold uppercase tracking-wider ${
                        isActive ? 'text-emerald-800' : 'text-stone-600'
                      }`}>
                        {isOdia ? `ପର୍ଯ୍ୟାୟ ${frame.frameNumber}` : `Frame ${frame.frameNumber}`}
                      </span>
                      <span className="text-[9px] font-mono font-bold text-stone-700">
                        {frame.yearDisplay.split(' ')[0]}
                      </span>
                    </div>
                    <div className="text-[10px] font-bold truncate leading-tight text-stone-900">
                      {frame.ruler?.name?.split(' ')[0] || frame.title}
                    </div>
                  </button>
                );
              })}
            </div>

          </div>

        </div>

        {/* ========================================================= */}
        {/* RIGHT COLUMN: 4 COLS (~32% WIDTH) — HISTORICAL INFO PANEL  */}
        {/* ========================================================= */}
        <div className="lg:col-span-4 flex flex-col h-full min-h-0 bg-[#fbf7ee] border-2 border-emerald-900/20 rounded-xl shadow-md p-2.5 sm:p-3 overflow-hidden font-sans">
          
          <div className="flex-1 min-h-0 overflow-y-auto space-y-2.5 pr-0.5 scrollbar-thin">
            
            {/* Ruler / Historical Figure Card */}
            <div className="bg-[#f4eedb] border border-amber-800/30 rounded-xl p-2.5 shadow-2xs">
              <div className="flex items-start space-x-2">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-700 to-teal-900 text-white flex items-center justify-center shrink-0 shadow-xs text-base">
                  {isFigureOrMovement ? '🚩' : '👑'}
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-[9px] font-bold tracking-wider text-emerald-800 uppercase block">
                    {currentFrame.ruler.title || (isFigureOrMovement ? 'Leader / Event' : 'Supreme Monarch')}
                  </span>
                  <h3 className="font-serif text-sm font-bold text-[#451a03] truncate leading-tight">
                    {isOdia && currentFrame.ruler.odiaName ? currentFrame.ruler.odiaName : currentFrame.ruler.name}
                  </h3>
                  <div className="flex items-center space-x-1.5 text-[10px] text-stone-600 mt-0.5 font-medium">
                    <Calendar className="w-3 h-3 text-emerald-700 shrink-0" />
                    <span>{currentFrame.ruler.reignPeriod}</span>
                  </div>
                </div>
              </div>

              {/* Extent & Regions Stats */}
              <div className="grid grid-cols-2 gap-1.5 mt-2 pt-2 border-t border-amber-800/20 text-center">
                <div className="bg-[#ede4cb] p-1 rounded-lg">
                  <span className="text-[9px] text-stone-600 block uppercase font-bold">
                    {isOdia ? 'ଭୌଗୋଳିକ ବିସ୍ତାର' : 'Territorial Extent'}
                  </span>
                  <span className="font-bold text-xs text-emerald-950">
                    {currentFrame.territorialExtentSqKm}
                  </span>
                </div>
                <div className="bg-[#ede4cb] p-1 rounded-lg">
                  <span className="text-[9px] text-stone-600 block uppercase font-bold">
                    {isFigureOrMovement 
                      ? (isOdia ? 'ସକ୍ରିୟ କେନ୍ଦ୍ର' : 'Active Centres')
                      : (isOdia ? 'ଅଧୀକୃତ ପ୍ରଦେଶ' : 'Subahs / Regions')}
                  </span>
                  <span className="font-bold text-xs text-emerald-950">
                    {currentFrame.controlledRegionIds.length} {isOdia ? 'ଅଞ୍ଚଳ' : 'Regions'}
                  </span>
                </div>
              </div>
            </div>

            {/* Stage Summary Description */}
            <div className="bg-white/80 p-2.5 rounded-xl border border-emerald-800/15">
              <h4 className="font-bold text-[#451a03] uppercase tracking-wide text-[10px] mb-1 flex items-center space-x-1">
                <Info className="w-3 h-3 text-emerald-700" />
                <span>{isOdia ? 'ପର୍ଯ୍ୟାୟ ସଂକ୍ଷିପ୍ତ ବିବରଣୀ' : 'Stage Overview'}</span>
              </h4>
              <p className="text-stone-800 text-[11px] leading-relaxed">
                {currentFrame.summaryText}
              </p>
            </div>

            {/* Key Conquests & Milestones */}
            {currentFrame.ruler.achievements && currentFrame.ruler.achievements.length > 0 && (
              <div className="bg-white/80 p-2.5 rounded-xl border border-emerald-800/15">
                <h4 className="font-bold text-emerald-950 uppercase tracking-wide text-[10px] flex items-center space-x-1 mb-1">
                  <Award className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                  <span>
                    {isFigureOrMovement 
                      ? (isOdia ? 'ପ୍ରମୁଖ ପଦକ୍ଷେପ ଓ ଘଟଣା' : 'Key Milestones & Movements')
                      : (isOdia ? 'ମୁଖ୍ୟ ବିଜୟ ଓ କୃତିତ୍ୱ' : 'Key Conquests & Milestones')}
                  </span>
                </h4>
                <ul className="space-y-1 text-[11px] text-stone-800">
                  {currentFrame.ruler.achievements.map((item, idx) => (
                    <li key={idx} className="flex items-start space-x-1.5 leading-snug">
                      <span className="text-emerald-700 font-bold shrink-0">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Historic Battles & Campaigns */}
            {currentFrame.ruler.importantBattles && currentFrame.ruler.importantBattles.length > 0 && (
              <div className="bg-rose-50/80 p-2 rounded-xl border border-rose-200">
                <h4 className="font-bold text-rose-900 uppercase tracking-wide text-[10px] flex items-center space-x-1 mb-1">
                  <Flag className="w-3 h-3 text-rose-700 shrink-0" />
                  <span>
                    {isFigureOrMovement 
                      ? (isOdia ? 'ଐତିହାସିକ ଆନ୍ଦୋଳନ ଓ କାର୍ଯ୍ୟକ୍ରମ' : 'Key Events & Campaigns')
                      : (isOdia ? 'ସଂଘଟିତ ଐତିହାସିକ ଯୁଦ୍ଧ' : 'Historic Battles & Campaigns')}
                  </span>
                </h4>
                <div className="flex flex-wrap gap-1">
                  {currentFrame.ruler.importantBattles.map((b, idx) => (
                    <span
                      key={idx}
                      className="bg-white px-2 py-0.5 rounded text-[10px] font-semibold text-rose-950 border border-rose-300"
                    >
                      {b}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Historical Significance */}
            {currentFrame.ruler.historicalSignificance && (
              <div className="bg-[#f5edd6] p-2.5 rounded-xl border border-amber-800/20">
                <h4 className="font-bold text-[#451a03] uppercase tracking-wide text-[10px] mb-0.5">
                  {isOdia ? 'ଐତିହାସିକ ଗୁରୁତ୍ୱ' : 'Historical Significance'}
                </h4>
                <p className="text-stone-800 leading-relaxed text-[11px]">
                  {currentFrame.ruler.historicalSignificance}
                </p>
              </div>
            )}

            {/* Did You Know? Fact */}
            {currentFrame.ruler.interestingFacts && currentFrame.ruler.interestingFacts.length > 0 && (
              <div className="bg-emerald-50 p-2.5 rounded-xl border border-emerald-300/50">
                <h4 className="font-bold text-emerald-900 uppercase tracking-wide text-[10px] flex items-center space-x-1 mb-0.5">
                  <HelpCircle className="w-3 h-3 text-emerald-700" />
                  <span>{isOdia ? 'ଆପଣ ଜାଣନ୍ତି କି?' : 'Did You Know?'}</span>
                </h4>
                <p className="text-stone-800 text-[11px] italic leading-relaxed">
                  "{currentFrame.ruler.interestingFacts[0]}"
                </p>
              </div>
            )}

          </div>

        </div>

      </div>

      {/* ========================================================= */}
      {/* CLICKED HISTORICAL REGION DETAIL MODAL                     */}
      {/* ========================================================= */}
      {selectedRegion && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in font-sans">
          <div className="bg-[#fcf8ed] border-4 border-emerald-800 rounded-3xl max-w-2xl w-full max-h-[88vh] overflow-y-auto shadow-2xl p-5 sm:p-6 relative text-stone-900 scrollbar-thin">
            
            <button
              onClick={() => setSelectedRegion(null)}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-[#f4eedb] hover:bg-emerald-800 hover:text-white text-stone-700 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="border-b border-amber-800/20 pb-3 mb-3">
              <div className="flex items-center space-x-2">
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${getPoliticalStatusBadge(selectedRegion.politicalStatus).bg}`}>
                  {getPoliticalStatusBadge(selectedRegion.politicalStatus).label}
                </span>
                <span className="text-xs font-bold text-emerald-900 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300">
                  {selectedRegion.conquestYear}
                </span>
              </div>
              <h2 className="text-xl font-bold text-[#451a03] mt-1.5">
                {selectedRegion.name}
              </h2>
              <div className="flex items-center space-x-1.5 text-xs text-stone-600 mt-0.5">
                <MapPin className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                <span>
                  {isOdia ? 'ଆଧୁନିକ ଅବସ୍ଥିତି:' : 'Modern Location:'} {selectedRegion.modernLocation}
                </span>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="bg-[#f4eedb] p-2.5 rounded-xl border border-amber-800/20">
                  <span className="text-[10px] text-stone-600 block uppercase font-bold">
                    {isFigureOrMovement ? 'ପୂର୍ବ ପରିସ୍ଥିତି / ଶାସନ' : 'ପୂର୍ବ ଶାସକ / ରାଜବଂଶ'}
                  </span>
                  <span className="font-bold text-stone-900 text-xs mt-0.5 block">
                    {selectedRegion.previousRulerOrDynasty}
                  </span>
                </div>
                <div className="bg-[#f4eedb] p-2.5 rounded-xl border border-amber-800/20">
                  <span className="text-[10px] text-stone-600 block uppercase font-bold">
                    {isFigureOrMovement ? 'ନେତୃତ୍ୱ / ସଂଗଠକ' : 'ବିଜୟୀ ସମ୍ରାଟ / ସେନାପତି'}
                  </span>
                  <span className="font-bold text-emerald-900 text-xs mt-0.5 block">
                    {selectedRegion.conqueringRuler}
                  </span>
                </div>
              </div>

              {selectedRegion.battlesInvolved && (
                <div className="bg-rose-50 p-2.5 rounded-xl border border-rose-300">
                  <span className="text-[10px] text-rose-800 block uppercase font-bold mb-0.5">
                    {isFigureOrMovement ? 'ପ୍ରମୁଖ ଆନ୍ଦୋଳନ ଓ ଘଟଣା' : 'ସଂଘଟିତ ଯୁଦ୍ଧ (Major Battles)'}
                  </span>
                  <span className="font-semibold text-rose-950 text-xs">
                    {selectedRegion.battlesInvolved}
                  </span>
                </div>
              )}

              <div>
                <h4 className="font-bold text-stone-900 uppercase tracking-wide text-xs mb-0.5">
                  1. ଐତିହାସିକ ପୃଷ୍ଠଭୂମି (Historical Background)
                </h4>
                <p className="text-stone-800 leading-relaxed bg-[#fbf7ee] p-2.5 rounded-xl border border-amber-800/15">
                  {selectedRegion.historicalBackground}
                </p>
              </div>

              <div>
                <h4 className="font-bold text-stone-900 uppercase tracking-wide text-xs mb-0.5">
                  2. ବିଜୟର ଉଦ୍ଦେଶ୍ୟ ଓ ମହତ୍ତ୍ୱ (Strategic Significance)
                </h4>
                <p className="text-stone-800 leading-relaxed bg-[#fbf7ee] p-2.5 rounded-xl border border-amber-800/15">
                  {selectedRegion.conquestReasons}
                </p>
              </div>

              <div>
                <h4 className="font-bold text-stone-900 uppercase tracking-wide text-xs mb-0.5">
                  3. ଐତିହାସିକ ପ୍ରଭାବ ଓ ଫଳାଫଳ (Aftermath)
                </h4>
                <p className="text-stone-800 leading-relaxed bg-[#fbf7ee] p-2.5 rounded-xl border border-amber-800/15">
                  {selectedRegion.aftermathAndRebellions}
                </p>
              </div>
            </div>

            <div className="mt-4 pt-2.5 border-t border-amber-800/20 flex justify-end">
              <button
                onClick={() => setSelectedRegion(null)}
                className="bg-emerald-800 hover:bg-emerald-900 text-white px-4 py-1.5 rounded-xl font-bold text-xs transition"
              >
                {isOdia ? 'ବନ୍ଦ କରନ୍ତୁ' : 'Close'}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
