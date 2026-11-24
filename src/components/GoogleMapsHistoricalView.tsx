import React, { useState, useEffect, useRef, useMemo } from 'react';
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
  Sparkles,
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
  Key,
  ExternalLink,
  ChevronDown
} from 'lucide-react';
import type { 
  HistoricalMap, 
  HistoricalFrame, 
  HistoricalRegion, 
  HistoricalCity,
  PoliticalStatus 
} from '../types';
import { loadGoogleMapsScript, isGoogleMapsLoaded } from '../services/googleMapsLoader';
import { 
  getHistoricalRegionGeoCoords, 
  getCityGeoCoord, 
  getCampaignGeoPath,
  calculateMapCenterAndBounds,
  HISTORICAL_GEO_CITIES 
} from '../services/googleMapsGeoService';
import { exportMapToPDF } from '../services/historicalMapService';
import { db } from '../db';

interface GoogleMapsHistoricalViewProps {
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
  googleMapsApiKey?: string;
  onSaveApiKey?: (key: string) => Promise<void>;
  onSwitchToCanvasMap: () => void;
  onSwitchToOpenMap?: () => void;
  onOpenAiGenerator?: () => void;
}

export const GoogleMapsHistoricalView: React.FC<GoogleMapsHistoricalViewProps> = ({
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
  isOdia = false,
  googleMapsApiKey,
  onSaveApiKey,
  onSwitchToCanvasMap,
  onSwitchToOpenMap,
  onOpenAiGenerator
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapDivRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);

  // Overlays refs for clean lifecycle management
  const polygonsRef = useRef<google.maps.Polygon[]>([]);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const polylinesRef = useRef<google.maps.Polyline[]>([]);
  const activeInfoWindowRef = useRef<google.maps.InfoWindow | null>(null);

  // States
  const [mapTypeId, setMapTypeId] = useState<string>('terrain');
  const [isScriptLoaded, setIsScriptLoaded] = useState<boolean>(false);
  const [isLoadingScript, setIsLoadingScript] = useState<boolean>(false);
  const [loadError, setLoadError] = useState<'MISSING_KEY' | 'OFFLINE' | 'FAILED' | null>(null);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedRegion, setSelectedRegion] = useState<HistoricalRegion | null>(null);
  const [selectedCity, setSelectedCity] = useState<HistoricalCity | null>(null);
  const [apiKeyInput, setApiKeyInput] = useState<string>('');
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState<boolean>(false);
  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);

  const currentFrame = currentMap.frames[activeFrameIndex] || currentMap.frames[0];
  const isFigureOrMovement = currentMap.category === 'figure' || currentMap.category === 'movement';

  // Effective API Key priority: Props -> Environment variable -> Stored Settings
  const effectiveApiKey = useMemo(() => {
    return googleMapsApiKey || (import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY || '';
  }, [googleMapsApiKey]);

  // Monitor online / offline network state
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => {
      setIsOnline(false);
      setLoadError('OFFLINE');
    };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Initialize or Load Google Maps Platform JavaScript API
  useEffect(() => {
    if (!isOnline) {
      setLoadError('OFFLINE');
      return;
    }

    if (!effectiveApiKey || effectiveApiKey.trim().length < 8) {
      setLoadError('MISSING_KEY');
      return;
    }

    setIsLoadingScript(true);
    setLoadError(null);

    loadGoogleMapsScript(effectiveApiKey)
      .then(() => {
        setIsScriptLoaded(true);
        setIsLoadingScript(false);
      })
      .catch((err: Error) => {
        setIsLoadingScript(false);
        if (err.message === 'OFFLINE') {
          setLoadError('OFFLINE');
        } else if (err.message === 'MISSING_API_KEY') {
          setLoadError('MISSING_KEY');
        } else {
          setLoadError('FAILED');
        }
      });
  }, [effectiveApiKey, isOnline]);

  // Initialize Google Maps instance inside container
  useEffect(() => {
    if (!isScriptLoaded || !mapDivRef.current || !window.google?.maps) return;

    if (!mapInstanceRef.current) {
      const { center, zoom } = calculateMapCenterAndBounds(currentMap.regions, currentFrame.cities || []);

      const map = new google.maps.Map(mapDivRef.current, {
        center,
        zoom,
        mapTypeId: mapTypeId as google.maps.MapTypeId,
        disableDefaultUI: true,
        zoomControl: false,
        mapTypeControl: false,
        scaleControl: true,
        streetViewControl: false,
        fullscreenControl: false,
        gestureHandling: 'greedy',
        styles: [
          {
            featureType: 'administrative',
            elementType: 'geometry',
            stylers: [{ visibility: 'on' }]
          },
          {
            featureType: 'poi',
            stylers: [{ visibility: 'off' }]
          }
        ]
      });

      mapInstanceRef.current = map;
    }
  }, [isScriptLoaded]);

  // Update map type when user toggles (roadmap, satellite, hybrid, terrain)
  useEffect(() => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setMapTypeId(mapTypeId);
    }
  }, [mapTypeId]);

  // Synchronize Google Maps Overlays (Polygons, Markers, Campaign Routes) with Active Frame
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !window.google?.maps || !currentFrame) return;

    // 1. Clear previous historical overlays cleanly
    polygonsRef.current.forEach(p => p.setMap(null));
    polygonsRef.current = [];

    markersRef.current.forEach(m => m.setMap(null));
    markersRef.current = [];

    polylinesRef.current.forEach(pl => pl.setMap(null));
    polylinesRef.current = [];

    if (activeInfoWindowRef.current) {
      activeInfoWindowRef.current.close();
      activeInfoWindowRef.current = null;
    }

    const bounds = new google.maps.LatLngBounds();
    let hasCoords = false;

    // 2. Render Historical Controlled Territory Polygons
    currentMap.regions.forEach((region) => {
      const isControlled = currentFrame.controlledRegionIds.includes(region.id);
      const isNewlyAcquired = currentFrame.newlyAcquiredRegionIds.includes(region.id);

      if (!isControlled) return;

      const geoCoords = getHistoricalRegionGeoCoords(region);
      if (!geoCoords || geoCoords.length < 3) return;

      geoCoords.forEach(pt => {
        bounds.extend(pt);
        hasCoords = true;
      });

      let fillColor = '#10b981';
      let strokeColor = '#047857';
      let fillOpacity = 0.35;
      let strokeWeight = 2;

      if (isNewlyAcquired) {
        fillColor = '#f43f5e'; // Highlighted crimson rose for newly conquered
        strokeColor = '#e11d48';
        fillOpacity = 0.48;
        strokeWeight = 3;
      } else if (region.politicalStatus === 'tributary_vassal') {
        fillColor = '#facc15'; // Amber for tributary vassals
        strokeColor = '#d97706';
        fillOpacity = 0.32;
        strokeWeight = 2;
      }

      const polygon = new google.maps.Polygon({
        paths: geoCoords,
        strokeColor,
        strokeOpacity: 0.9,
        strokeWeight,
        fillColor,
        fillOpacity,
        zIndex: isNewlyAcquired ? 10 : 5,
        clickable: true
      });

      polygon.setMap(map);

      // Click listener opens Region Detail modal
      polygon.addListener('click', () => {
        setSelectedRegion(region);
      });

      polygonsRef.current.push(polygon);
    });

    // 3. Render Historical Campaign Vectors (March Routes)
    if (currentFrame.campaignVectors && currentFrame.campaignVectors.length > 0) {
      currentFrame.campaignVectors.forEach((vector) => {
        const geoPath = getCampaignGeoPath(vector);
        if (!geoPath || geoPath.length < 2) return;

        geoPath.forEach(pt => {
          bounds.extend(pt);
          hasCoords = true;
        });

        const lineSymbol = {
          path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
          scale: 3,
          strokeColor: '#b91c1c',
          fillColor: '#b91c1c',
          fillOpacity: 1
        };

        const polyline = new google.maps.Polyline({
          path: geoPath,
          geodesic: true,
          strokeColor: '#dc2626',
          strokeOpacity: 0.85,
          strokeWeight: 3.5,
          icons: [
            {
              icon: lineSymbol,
              offset: '100%'
            }
          ],
          zIndex: 20
        });

        polyline.setMap(map);
        polylinesRef.current.push(polyline);
      });
    }

    // 4. Render Historical Markers (Capitals, Forts, Battlefields, Ports, Cities)
    if (currentFrame.cities && currentFrame.cities.length > 0) {
      currentFrame.cities.forEach((city) => {
        const pt = getCityGeoCoord(city);
        bounds.extend(pt);
        hasCoords = true;

        // Custom historical marker icons
        let iconSvg = '';
        if (city.type === 'capital') {
          iconSvg = `data:image/svg+xml;utf-8,<svg xmlns="http://www.w3.org/2000/svg" width="34" height="34" viewBox="0 0 24 24" fill="%23b91c1c" stroke="%23fef08a" stroke-width="2"><circle cx="12" cy="12" r="10"/><polygon points="12 4 14.5 9 20 9.5 16 13.5 17.5 19 12 16 6.5 19 8 13.5 4 9.5 9.5 9" fill="%23fef08a" stroke="%23b91c1c" stroke-width="1"/></svg>`;
        } else if (city.type === 'battlefield') {
          iconSvg = `data:image/svg+xml;utf-8,<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="%23e11d48" stroke="%23ffffff" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M7 7l10 10M17 7L7 17" stroke="%23ffffff" stroke-width="2.5"/></svg>`;
        } else if (city.type === 'fort') {
          iconSvg = `data:image/svg+xml;utf-8,<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="%2378350f" stroke="%23ffffff" stroke-width="1.8"><rect x="3" y="6" width="18" height="14" rx="2"/><path d="M7 6V3M12 6V3M17 6V3M9 20v-5h6v5"/></svg>`;
        } else if (city.type === 'port') {
          iconSvg = `data:image/svg+xml;utf-8,<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="%230284c7" stroke="%23ffffff" stroke-width="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="8" r="2.5"/><path d="M12 10.5v7.5M8 14c1.5 2 6.5 2 8 0"/></svg>`;
        } else {
          iconSvg = `data:image/svg+xml;utf-8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="%23451a03" stroke="%23fef3c7" stroke-width="2"><circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="2.5" fill="%23ffffff"/></svg>`;
        }

        const marker = new google.maps.Marker({
          position: pt,
          map,
          title: `${city.name} (${city.type.toUpperCase()})`,
          icon: {
            url: iconSvg,
            scaledSize: new google.maps.Size(city.type === 'capital' ? 32 : 26, city.type === 'capital' ? 32 : 26),
            anchor: new google.maps.Point(city.type === 'capital' ? 16 : 13, city.type === 'capital' ? 16 : 13)
          },
          zIndex: city.type === 'capital' ? 25 : 15
        });

        // Click listener displays historical place details
        marker.addListener('click', () => {
          setSelectedCity(city);
          if (activeInfoWindowRef.current) activeInfoWindowRef.current.close();

          const infoWindow = new google.maps.InfoWindow({
            content: `
              <div style="font-family: Georgia, serif; padding: 6px; max-width: 240px; color: #1c1917;">
                <div style="font-size: 10px; font-weight: bold; text-transform: uppercase; color: #92400e; margin-bottom: 2px;">
                  ${city.type.toUpperCase()} ${city.yearFoundedOrConquered ? `• ${city.yearFoundedOrConquered}` : ''}
                </div>
                <h4 style="margin: 0 0 4px 0; font-size: 14px; font-weight: bold; color: #451a03;">
                  ${isOdia && city.odiaName ? city.odiaName : city.name}
                </h4>
                <div style="font-size: 11px; color: #44403c;">
                  Coordinates: ${pt.lat.toFixed(4)}° N, ${pt.lng.toFixed(4)}° E
                </div>
              </div>
            `
          });
          infoWindow.open({ map, anchor: marker });
          activeInfoWindowRef.current = infoWindow;
        });

        markersRef.current.push(marker);
      });
    }

    // 5. Smoothly pan / fit map bounds to the active historical stage extent
    if (hasCoords && !map.getBounds()?.isEmpty()) {
      map.fitBounds(bounds, 40);
    }
  }, [isScriptLoaded, currentFrame, currentMap]);

  // Fullscreen toggle handler
  const toggleFullscreen = () => {
    if (!mapContainerRef.current) return;
    if (!document.fullscreenElement) {
      mapContainerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  // Search historical places on Google Maps
  const handleSearchLocation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim() || !mapInstanceRef.current) return;

    const query = searchQuery.toLowerCase().trim();
    // 1. Search in historical cities dictionary
    for (const [name, pt] of Object.entries(HISTORICAL_GEO_CITIES)) {
      if (name.includes(query) || query.includes(name)) {
        mapInstanceRef.current.panTo(pt);
        mapInstanceRef.current.setZoom(8);
        return;
      }
    }

    // 2. Search in active frame cities
    const match = currentFrame.cities?.find(c => 
      c.name.toLowerCase().includes(query) || (c.odiaName && c.odiaName.includes(query))
    );
    if (match) {
      const pt = getCityGeoCoord(match);
      mapInstanceRef.current.panTo(pt);
      mapInstanceRef.current.setZoom(8);
    }
  };

  // Save API Key to Database
  const handleSaveKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKeyInput.trim()) return;
    if (onSaveApiKey) {
      await onSaveApiKey(apiKeyInput.trim());
    } else {
      // Save directly to Dexie
      const settings = await db.settings.toCollection().first();
      if (settings) {
        await db.settings.put({ ...settings, googleMapsApiKey: apiKeyInput.trim() });
      }
    }
    setIsApiKeyModalOpen(false);
    setLoadError(null);
    window.location.reload();
  };

  // Helper for Political Status Badge
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

  return (
    <div 
      ref={mapContainerRef}
      className={`flex-1 flex flex-col min-h-0 bg-[#f8fafc] text-slate-900 overflow-hidden select-none ${
        isFullscreen ? 'p-1.5' : 'p-0.5'
      }`}
      style={{ fontFamily: '"Georgia", "Cambria", "Times New Roman", serif' }}
    >
      {/* ========================================================= */}
      {/* 1. TOP HEADER & MAP CONTROLS BAR (SHRINK-0)               */}
      {/* ========================================================= */}
      <div className="shrink-0 bg-white border border-slate-200 rounded-xl px-3 py-1.5 shadow-xs mb-2">
        <div className="flex items-center justify-between gap-2">
          
          {/* Title and View Selector */}
          <div className="flex items-center space-x-2.5 min-w-0">
            <div className="p-1.5 bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-lg shadow-xs shrink-0">
              <Compass className="w-4 h-4 animate-spin-slow" />
            </div>
            <div className="min-w-0 truncate">
              <div className="flex items-center space-x-1.5">
                <span className="text-[10px] uppercase tracking-wider font-sans font-bold px-1.5 py-0.2 rounded bg-blue-50 text-blue-800 border border-blue-200">
                  {isOdia ? 'ଗୁଗୁଲ୍ ମ୍ୟାପ୍ସ ଭ୍ୟୁ' : 'GOOGLE MAPS HISTORICAL VIEW'}
                </span>
                <span className="text-[10px] font-sans px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold truncate">
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
                placeholder={isOdia ? 'ସ୍ଥାନ ଖୋଜନ୍ତୁ (Search Location)...' : 'Search Historical Location...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-44 lg:w-56 bg-slate-100 text-slate-800 font-sans text-xs rounded-lg pl-2.5 pr-7 py-1.5 border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-600 transition"
              />
              <button type="submit" className="absolute right-2 top-2 text-slate-500 hover:text-slate-800">
                <Search className="w-3.5 h-3.5" />
              </button>
            </form>

            {/* Map Type Selector (Roadmap, Satellite, Hybrid, Terrain) */}
            <div className="hidden sm:inline-flex rounded-lg p-0.5 bg-slate-100 border border-slate-200 font-sans text-[11px] font-semibold text-slate-700">
              {(['terrain', 'roadmap', 'satellite', 'hybrid'] as const).map(type => (
                <button
                  key={type}
                  onClick={() => setMapTypeId(type)}
                  className={`px-2 py-0.5 rounded capitalize transition ${
                    mapTypeId === type
                      ? 'bg-blue-600 text-white font-bold shadow-xs'
                      : 'hover:text-slate-900 hover:bg-slate-200'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>

            {/* Configure API Key Button */}
            <button
              onClick={() => setIsApiKeyModalOpen(true)}
              className="bg-slate-100 hover:bg-slate-200 text-slate-800 p-1.5 rounded-lg border border-slate-300 shadow-xs transition"
              title="Configure Google Maps API Key"
            >
              <Key className="w-3.5 h-3.5 text-blue-700" />
            </button>

            {/* Toggle Fullscreen Presentation */}
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
        {/* LEFT COLUMN: 8 COLS (~68% WIDTH) — GOOGLE MAP + CONTROLS  */}
        {/* ========================================================= */}
        <div className="lg:col-span-8 flex flex-col h-full min-h-0 overflow-hidden">
          
          {/* The Google Maps Container Stage */}
          <div className="flex-1 min-h-0 relative bg-slate-200 border-2 border-slate-300 rounded-xl shadow-md overflow-hidden flex items-center justify-center">
            
            {/* Live Google Maps Canvas DIV */}
            <div ref={mapDivRef} className="w-full h-full" />

            {/* Stage Banner Overlay on Map (Top Left) */}
            <div className="absolute top-2.5 left-3 z-10 bg-white/95 backdrop-blur-xs border border-slate-300 rounded-lg px-2.5 py-1 shadow-md max-w-[280px] pointer-events-auto">
              <div className="flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
                <span className="font-sans text-[10px] uppercase font-bold text-blue-900 tracking-wider">
                  {isOdia ? `ପର୍ଯ୍ୟାୟ ${currentFrame.frameNumber}` : `Frame ${currentFrame.frameNumber}`}
                </span>
                <span className="font-sans font-bold text-[10px] bg-blue-700 text-white px-1.5 py-0.2 rounded-full">
                  {currentFrame.yearDisplay}
                </span>
              </div>
              <h3 className="text-xs sm:text-sm font-bold text-slate-900 truncate leading-tight mt-0.5">
                {currentFrame.title}
              </h3>
              <p className="font-sans text-[10px] text-slate-600 italic truncate">
                {currentFrame.subtitle}
              </p>
            </div>

            {/* Empire Legend & Status Indicator (Bottom Right) */}
            <div className="absolute bottom-12 right-3 z-10 bg-white/95 backdrop-blur-xs border border-slate-300 rounded-lg p-1.5 shadow-md font-sans text-[10px] max-w-[210px] pointer-events-auto">
              <div className="text-[9px] font-bold text-slate-900 uppercase tracking-wider mb-1 border-b border-slate-200 pb-0.2">
                {isFigureOrMovement 
                  ? (isOdia ? 'ମାନଚିତ୍ର ସୂଚୀ (Legend)' : 'Map Legend') 
                  : (isOdia ? 'ସାମ୍ରାଜ୍ୟ ସୂଚୀ (Legend)' : 'Empire Legend')}
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center space-x-1.5">
                  <span className="w-2.5 h-2.5 rounded bg-emerald-500 border border-emerald-700 flex-shrink-0" />
                  <span className="text-slate-800 text-[9.5px] truncate">
                    {isFigureOrMovement 
                      ? (isOdia ? 'ପ୍ରମୁଖ ସକ୍ରିୟ କେନ୍ଦ୍ର' : 'Active Epicentres') 
                      : (isOdia ? 'ଅଧୀକୃତ ପ୍ରଦେଶ' : 'Imperial Subahs')}
                  </span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <span className="w-2.5 h-2.5 rounded bg-amber-400 border border-amber-600 flex-shrink-0" />
                  <span className="text-slate-800 text-[9.5px] truncate">
                    {isFigureOrMovement 
                      ? (isOdia ? 'ସହଯୋଗୀ ଅଞ୍ଚଳ' : 'Affiliated Zones') 
                      : (isOdia ? 'ସାମନ୍ତ / କରଦ ରାଜ୍ୟ' : 'Tributary Vassals')}
                  </span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <span className="w-2.5 h-2.5 rounded bg-rose-500 border border-rose-700 animate-pulse flex-shrink-0" />
                  <span className="text-slate-800 text-[9.5px] font-semibold truncate">
                    {isFigureOrMovement 
                      ? (isOdia ? 'ନୂତନ ସକ୍ରିୟ କେନ୍ଦ୍ର' : 'Newly Active') 
                      : (isOdia ? 'ନୂତନ ବିଜୟ' : 'Newly Conquered')}
                  </span>
                </div>
              </div>
            </div>

            {/* Zoom In / Zoom Out Floating Controls (Bottom Left) */}
            <div className="absolute bottom-12 left-3 z-10 flex flex-col space-y-1 bg-white/95 border border-slate-300 rounded-lg p-0.5 shadow-md font-sans">
              <button
                onClick={() => {
                  if (mapInstanceRef.current) {
                    mapInstanceRef.current.setZoom((mapInstanceRef.current.getZoom() || 5) + 1);
                  }
                }}
                className="p-1 hover:bg-slate-100 rounded text-slate-800 font-bold transition"
                title="Zoom In"
              >
                +
              </button>
              <button
                onClick={() => {
                  if (mapInstanceRef.current) {
                    mapInstanceRef.current.setZoom((mapInstanceRef.current.getZoom() || 5) - 1);
                  }
                }}
                className="p-1 hover:bg-slate-100 rounded text-slate-800 font-bold transition"
                title="Zoom Out"
              >
                −
              </button>
            </div>

            {/* Offline Alert Banner Overlay */}
            {loadError === 'OFFLINE' && (
              <div className="absolute inset-0 z-30 bg-slate-900/80 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center text-white">
                <div className="w-12 h-12 rounded-full bg-rose-600/30 border border-rose-500 flex items-center justify-center text-rose-400 mb-3">
                  <WifiOff className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold font-sans">
                  {isOdia ? 'ଇଣ୍ଟରନେଟ୍ ସଂଯୋଗ ଆବଶ୍ୟକ' : 'Internet Connection Required'}
                </h3>
                <p className="text-xs text-slate-300 max-w-md mt-1 font-sans">
                  {isOdia
                    ? 'ଗୁଗୁଲ୍ ମ୍ୟାପ୍ସ ଲାଇଭ୍ ଟାଇଲ୍ସ ଲୋଡ୍ କରିବା ପାଇଁ ଇଣ୍ଟରନେଟ୍ ଆବଶ୍ୟକ। ଦୟାକରି ଆପଣଙ୍କ ନେଟୱର୍କ ଯାଞ୍ଚ କରନ୍ତୁ କିମ୍ବା ଅଫ୍‌ଲାଇନ୍ ମାନଚିତ୍ର ବ୍ୟବହାର କରନ୍ତୁ।'
                    : 'Google Maps requires an active internet connection to load tiles and satellite imagery. You can continue offline using the Existing Historical Map.'}
                </p>
                <button
                  onClick={onSwitchToCanvasMap}
                  className="mt-4 px-4 py-2 bg-amber-700 hover:bg-amber-800 text-white rounded-xl text-xs font-bold font-sans shadow-md transition"
                >
                  {isOdia ? 'ଅଫ୍‌ଲାଇନ୍ ଐତିହାସିକ ଆଟଲାସ୍ ଖୋଲନ୍ତୁ' : 'Switch to Existing Historical Map (Offline Ready)'}
                </button>
              </div>
            )}

            {/* Missing or Invalid API Key Modal Overlay */}
            {(loadError === 'MISSING_KEY' || loadError === 'FAILED') && (
              <div className="absolute inset-0 z-30 bg-slate-900/90 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center text-white font-sans">
                <div className="w-12 h-12 rounded-full bg-blue-600/30 border border-blue-400 flex items-center justify-center text-blue-300 mb-3">
                  <Key className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-white">
                  {isOdia ? 'ଗୁଗଲ୍ ମ୍ୟାପ୍ସ API କୀ (API Key) ଆବଶ୍ୟକ' : 'Google Maps requires a Google Maps Platform API Key'}
                </h3>
                <p className="text-xs text-slate-300 max-w-lg mt-2 leading-relaxed">
                  {isOdia
                    ? 'ଗୁଗଲ୍ ମ୍ୟାପ୍ସ ପାଇଁ Google Maps Platform API Key ଆବଶ୍ୟକ। ଆପଣ ଗୁଗଲ୍ ମ୍ୟାପ୍ସ କନ୍‌ଫିଗର୍ ନକରି ମଧ୍ୟ ସମ୍ପୂର୍ଣ୍ଣ ମାଗଣାରେ ପ୍ରଚଳିତ ଐତିହାସିକ ଆଟଲାସ୍ (Existing Historical Map) କିମ୍ବା ଓପନ୍ ହିଷ୍ଟୋରିକାଲ୍ ମ୍ୟାପ୍ (Open Historical Map) ନିରବଚ୍ଛିନ୍ନ ଭାବେ ବ୍ୟବହାର କରିପାରିବେ।'
                    : 'Google Maps requires a Google Maps Platform API Key. You can continue using Existing Historical Map or Open Historical Map without configuring Google Maps.'}
                </p>
                <p className="text-[11px] text-amber-300/90 mt-1 max-w-md italic">
                  {isOdia
                    ? 'ସୂଚନା: ଗୁଗଲ୍ ମ୍ୟାପ୍ସ ପାଇଁ Google Cloud ବିଲିଂ ଆକାଉଣ୍ଟ୍ ଆବଶ୍ୟକ ହୋଇପାରେ ଏବଂ ଚାର୍ଜ୍ ଲାଗିପାରେ।'
                    : 'Note: Google Maps may require Google Cloud billing configuration and can incur service charges.'}
                </p>

                <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                  <button
                    onClick={() => setIsApiKeyModalOpen(true)}
                    className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md transition flex items-center space-x-1.5"
                  >
                    <Key className="w-3.5 h-3.5" />
                    <span>{isOdia ? 'API କୀ କନ୍‌ଫିଗର୍ କରନ୍ତୁ' : 'Configure API Key'}</span>
                  </button>
                  <button
                    onClick={onSwitchToCanvasMap}
                    className="px-3.5 py-2 bg-amber-800 hover:bg-amber-900 text-amber-50 rounded-xl text-xs font-bold shadow-md transition"
                  >
                    {isOdia ? 'ପ୍ରଚଳିତ ଆଟଲାସ୍ (Existing Map)' : 'Use Existing Historical Map'}
                  </button>
                  {onSwitchToOpenMap && (
                    <button
                      onClick={onSwitchToOpenMap}
                      className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-md transition"
                    >
                      {isOdia ? 'ଓପନ୍ ହିଷ୍ଟୋରିକାଲ୍ ମ୍ୟାପ୍ (Open Map)' : 'Use Open Historical Map'}
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Loading Indicator */}
            {isLoadingScript && (
              <div className="absolute inset-0 z-20 bg-slate-100/70 backdrop-blur-xs flex items-center justify-center">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
              </div>
            )}

            {/* Compact Playback Control Bar (Embedded at Bottom of Map) */}
            <div className="absolute bottom-2 inset-x-3 z-20 bg-white/95 backdrop-blur-xs border border-slate-300 rounded-xl px-3 py-1.5 shadow-md flex items-center justify-between gap-2 font-sans text-xs pointer-events-auto">
              
              {/* Playback Buttons */}
              <div className="flex items-center space-x-1.5 shrink-0">
                <button
                  onClick={onRestart}
                  className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 shadow-xs transition"
                  title="Restart"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={onPrev}
                  disabled={activeFrameIndex === 0}
                  className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-30 text-slate-800 border border-slate-300 shadow-xs transition"
                  title="Previous"
                >
                  <SkipBack className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className={`px-3 py-1 rounded-lg font-bold text-xs flex items-center space-x-1 shadow-xs transition ${
                    isPlaying
                      ? 'bg-rose-600 hover:bg-rose-700 text-white'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  }`}
                >
                  {isPlaying ? (
                    <>
                      <Pause className="w-3.5 h-3.5" />
                      <span>{isOdia ? 'ବିରତି' : 'PAUSE'}</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>{isOdia ? 'ଚଲାନ୍ତୁ' : 'PLAY'}</span>
                    </>
                  )}
                </button>
                <button
                  onClick={onNext}
                  disabled={activeFrameIndex >= currentMap.frames.length - 1}
                  className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-30 text-slate-800 border border-slate-300 shadow-xs transition"
                  title="Next"
                >
                  <SkipForward className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Progress Bar & Frame Count */}
              <div className="flex-1 max-w-xs mx-2 flex items-center space-x-2">
                <div className="flex-1 bg-slate-200 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-blue-600 h-full transition-all duration-300 rounded-full"
                    style={{
                      width: `${((activeFrameIndex + 1) / currentMap.frames.length) * 100}%`
                    }}
                  />
                </div>
                <span className="text-[11px] font-bold text-slate-800 whitespace-nowrap">
                  {activeFrameIndex + 1} / {currentMap.frames.length}
                </span>
              </div>

              {/* Playback Speed Toggles */}
              <div className="flex items-center space-x-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-[10px] font-bold shrink-0">
                <span className="text-slate-600 px-1 font-semibold hidden sm:inline">
                  {isOdia ? 'ଗତି:' : 'Speed:'}
                </span>
                {([1, 2, 3] as const).map(speed => (
                  <button
                    key={speed}
                    onClick={() => setPlaybackSpeed(speed)}
                    className={`px-1.5 py-0.5 rounded transition ${
                      playbackSpeed === speed
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {speed}x
                  </button>
                ))}
              </div>

            </div>

          </div>

          {/* =================================================== */}
          {/* BOTTOM FLIPBOOK STRIP (H-[92PX] SHRINK-0)           */}
          {/* =================================================== */}
          <div className="h-[92px] shrink-0 mt-2 bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 flex items-center overflow-x-auto space-x-2 scrollbar-thin font-sans">
            {currentMap.frames.map((frame, fIdx) => {
              const isActive = activeFrameIndex === fIdx;
              return (
                <div
                  key={frame.id}
                  onClick={() => {
                    setIsPlaying(false);
                    setActiveFrameIndex(fIdx);
                  }}
                  className={`h-full w-40 shrink-0 cursor-pointer rounded-lg p-2 border flex flex-col justify-between transition-all duration-200 select-none ${
                    isActive
                      ? 'bg-blue-50/70 border-blue-600 shadow-sm ring-2 ring-blue-500 scale-[1.02]'
                      : 'bg-slate-50 border-slate-200 hover:border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] font-bold">
                    <span className={`px-1.5 py-0.2 rounded ${
                      isActive ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-800'
                    }`}>
                      {isOdia ? `ପୃଷ୍ଠା ${frame.frameNumber}` : `Page ${frame.frameNumber}`}
                    </span>
                    <span className="font-semibold text-slate-700">{frame.yearDisplay}</span>
                  </div>

                  <h4 className="font-bold text-[11px] text-slate-900 truncate leading-tight">
                    {frame.ruler.name.split('(')[0].trim()}
                  </h4>

                  <div className="flex items-center justify-between text-[9px] text-slate-500 pt-0.5 border-t border-slate-200">
                    <span>{frame.controlledRegionIds.length} {isFigureOrMovement ? (isOdia ? 'କେନ୍ଦ୍ର' : 'centres') : (isOdia ? 'ପ୍ରଦେଶ' : 'subahs')}</span>
                    {frame.newlyAcquiredRegionIds.length > 0 && (
                      <span className="text-rose-600 font-bold">
                        +{frame.newlyAcquiredRegionIds.length} {isOdia ? 'ନୂତନ' : 'new'}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

        </div>

        {/* ========================================================= */}
        {/* RIGHT COLUMN: 4 COLS (~32% WIDTH) — INFORMATION PANEL     */}
        {/* ========================================================= */}
        <div className="lg:col-span-4 h-full min-h-0 flex flex-col bg-white border border-slate-200 rounded-xl shadow-md overflow-hidden">
          
          {/* Sticky Card Header (Ruler Name & Reign) */}
          <div className="shrink-0 p-3 bg-slate-50 border-b border-slate-200 flex items-center space-x-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-800 border border-blue-400 shadow-xs flex items-center justify-center text-white shrink-0">
              <Award className="w-5 h-5 text-amber-300" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-sans font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200 truncate inline-block">
                {currentFrame.ruler.title || (isFigureOrMovement ? (isOdia ? 'ପ୍ରମୁଖ ନେତା / ବ୍ୟକ୍ତିତ୍ୱ' : 'Historical Figure / Leader') : (isOdia ? 'ସମ୍ରାଟ / ଶାସକ' : 'Historical Ruler'))}
              </span>
              <h2 className="text-base font-bold text-slate-900 truncate leading-tight mt-0.5">
                {isOdia && currentFrame.ruler.odiaName
                  ? currentFrame.ruler.odiaName
                  : currentFrame.ruler.name}
              </h2>
              <div className="flex items-center space-x-1.5 font-sans text-[11px] text-slate-600">
                <Calendar className="w-3 h-3 text-blue-600" />
                <span className="font-semibold">{currentFrame.ruler.reignPeriod}</span>
              </div>
            </div>
          </div>

          {/* Scrollable Content Body */}
          <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-2.5 font-sans text-xs scrollbar-thin">
            
            {/* Territory & Subahs Stat Pills */}
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-slate-50 p-2 rounded-lg border border-slate-200">
                <span className="text-[9px] text-slate-500 block uppercase font-bold">
                  {isFigureOrMovement 
                    ? (isOdia ? 'ଭୌଗୋଳିକ ପ୍ରଭାବ କ୍ଷେତ୍ର' : 'Geographic Reach') 
                    : (isOdia ? 'ସାମ୍ରାଜ୍ୟ ଆୟତନ' : 'Territorial Extent')}
                </span>
                <span className="text-xs font-bold text-blue-900">
                  {currentFrame.territorialExtentSqKm || 'N/A'}
                </span>
              </div>
              <div className="bg-slate-50 p-2 rounded-lg border border-slate-200">
                <span className="text-[9px] text-slate-500 block uppercase font-bold">
                  {isFigureOrMovement 
                    ? (isOdia ? 'ପ୍ରମୁଖ କେନ୍ଦ୍ର ଓ ଅଞ୍ଚଳ' : 'Active Centres') 
                    : (isOdia ? 'ଅଧୀକୃତ ପ୍ରଦେଶ' : 'Subahs / Regions')}
                </span>
                <span className="text-xs font-bold text-blue-900">
                  {currentFrame.controlledRegionIds.length} {isFigureOrMovement ? (isOdia ? 'ଗୋଟି କେନ୍ଦ୍ର' : 'Centres') : (isOdia ? 'ଗୋଟି ଅଞ୍ଚଳ' : 'Territories')}
                </span>
              </div>
            </div>

            {/* Key Achievements */}
            <div>
              <h4 className="font-bold text-slate-900 uppercase tracking-wide flex items-center space-x-1 mb-1 text-[11px]">
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span>
                  {isFigureOrMovement 
                    ? (isOdia ? 'ପ୍ରମୁଖ ପଦକ୍ଷେପ ଓ ମାଇଲଖୁଣ୍ଟ' : 'Key Milestones & Initiatives') 
                    : (isOdia ? 'ପ୍ରମୁଖ ବିଜୟ ଓ କାର୍ଯ୍ୟାବଳୀ' : 'Key Conquests & Milestones')}
                </span>
              </h4>
              <ul className="space-y-1 pl-1 text-[11px]">
                {currentFrame.ruler.achievements.map((ach, idx) => (
                  <li key={idx} className="flex items-start space-x-1.5 text-slate-700 leading-snug">
                    <span className="text-blue-600 font-bold mt-0.2">•</span>
                    <span>{ach}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Battles & Campaigns */}
            {currentFrame.ruler.importantBattles && currentFrame.ruler.importantBattles.length > 0 && (
              <div>
                <h4 className="font-bold text-slate-900 uppercase tracking-wide flex items-center space-x-1 mb-1 text-[11px]">
                  <Flag className="w-3.5 h-3.5 text-rose-600" />
                  <span>
                    {isFigureOrMovement 
                      ? (isOdia ? 'ପ୍ରମୁଖ ଆନ୍ଦୋଳନ ଓ ଅଭିଯାନ' : 'Historic Movements & Campaigns') 
                      : (isOdia ? 'ଐତିହାସିକ ଯୁଦ୍ଧ ଓ ଅଭିଯାନ' : 'Historic Battles')}
                  </span>
                </h4>
                <div className="flex flex-wrap gap-1">
                  {currentFrame.ruler.importantBattles.map((b, bIdx) => (
                    <span
                      key={bIdx}
                      className="bg-rose-50 text-rose-800 px-1.5 py-0.5 rounded border border-rose-200 font-medium text-[10px]"
                    >
                      {b}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Historical Significance */}
            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
              <h4 className="font-bold text-slate-800 uppercase tracking-wide text-[10px] mb-0.5">
                {isOdia ? 'ଐତିହାସିକ ଗୁରୁତ୍ୱ (Significance)' : 'Historical Significance'}
              </h4>
              <p className="text-slate-700 leading-relaxed text-[11px]">
                {currentFrame.ruler.historicalSignificance}
              </p>
            </div>

            {/* Did You Know? */}
            {currentFrame.ruler.interestingFacts && currentFrame.ruler.interestingFacts.length > 0 && (
              <div className="bg-amber-50/70 p-2.5 rounded-lg border border-amber-300">
                <h4 className="font-bold text-amber-900 uppercase tracking-wide text-[10px] flex items-center space-x-1 mb-0.5">
                  <HelpCircle className="w-3 h-3 text-amber-700" />
                  <span>{isOdia ? 'ଆପଣ ଜାଣନ୍ତି କି?' : 'Did You Know?'}</span>
                </h4>
                <p className="text-slate-800 text-[11px] italic leading-relaxed">
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
          <div className="bg-white border-2 border-slate-300 rounded-3xl max-w-xl w-full max-h-[85vh] overflow-y-auto shadow-2xl p-5 text-slate-900 relative">
            <button
              onClick={() => setSelectedRegion(null)}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="border-b border-slate-200 pb-3 mb-3">
              <div className="flex items-center space-x-2">
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${getPoliticalStatusBadge(selectedRegion.politicalStatus).bg}`}>
                  {getPoliticalStatusBadge(selectedRegion.politicalStatus).label}
                </span>
                <span className="text-xs font-bold text-blue-800 bg-blue-50 px-2 py-0.5 rounded-full">
                  {selectedRegion.conquestYear}
                </span>
              </div>
              <h2 className="text-lg font-bold text-slate-900 mt-1.5">
                {selectedRegion.name}
              </h2>
              <div className="flex items-center space-x-1.5 text-xs text-slate-600 mt-0.5">
                <MapPin className="w-3.5 h-3.5 text-blue-600" />
                <span className="font-semibold">{selectedRegion.modernLocation}</span>
              </div>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="bg-slate-50 p-2 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-500 block uppercase font-bold">
                    {isFigureOrMovement 
                      ? (isOdia ? 'ପୃଷ୍ଠଭୂମି / ଐତିହାସିକ ଅଞ୍ଚଳ' : 'Historical Context / Region') 
                      : (isOdia ? 'ପୂର୍ବ ଶାସକ / ରାଜବଂଶ' : 'Previous Ruler / Dynasty')}
                  </span>
                  <span className="font-bold text-slate-900 text-xs mt-0.5 block">
                    {selectedRegion.previousRulerOrDynasty}
                  </span>
                </div>
                <div className="bg-slate-50 p-2 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-500 block uppercase font-bold">
                    {isFigureOrMovement 
                      ? (isOdia ? 'ପ୍ରମୁଖ ନେତା / ସଂଗଠକ' : 'Key Leader / Organizer') 
                      : (isOdia ? 'ବିଜୟୀ ସମ୍ରାଟ / ସେନାପତି' : 'Conquering Ruler')}
                  </span>
                  <span className="font-bold text-blue-800 text-xs mt-0.5 block">
                    {selectedRegion.conqueringRuler}
                  </span>
                </div>
              </div>

              {selectedRegion.battlesInvolved && (
                <div className="bg-rose-50 p-2 rounded-xl border border-rose-200">
                  <span className="text-[10px] text-rose-800 block uppercase font-bold mb-0.5">
                    {isFigureOrMovement 
                      ? (isOdia ? 'ପ୍ରମୁଖ ଘଟଣା ଓ ଆନ୍ଦୋଳନ' : 'Major Events & Campaigns') 
                      : (isOdia ? 'ସଂଘଟିତ ଐତିହାସିକ ଯୁଦ୍ଧ' : 'Major Battles')}
                  </span>
                  <span className="font-semibold text-rose-950 text-xs">
                    {selectedRegion.battlesInvolved}
                  </span>
                </div>
              )}

              <div>
                <h4 className="font-bold text-slate-800 uppercase tracking-wide text-xs mb-0.5">
                  {isOdia ? '୧. ଐତିହାସିକ ପୃଷ୍ଠଭୂମି' : '1. Historical Background'}
                </h4>
                <p className="text-slate-700 leading-relaxed bg-slate-50 p-2 rounded-xl border border-slate-200">
                  {selectedRegion.historicalBackground}
                </p>
              </div>

              <div>
                <h4 className="font-bold text-slate-800 uppercase tracking-wide text-xs mb-0.5">
                  {isFigureOrMovement 
                    ? (isOdia ? '୨. ଆନ୍ଦୋଳନର ଲକ୍ଷ୍ୟ ଓ ଉଦ୍ଦେଶ୍ୟ' : '2. Significance & Objectives') 
                    : (isOdia ? '୨. ବିଜୟର ଉଦ୍ଦେଶ୍ୟ ଓ କାରଣ' : '2. Strategic Reasons')}
                </h4>
                <p className="text-slate-700 leading-relaxed bg-slate-50 p-2 rounded-xl border border-slate-200">
                  {selectedRegion.conquestReasons}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* GOOGLE MAPS API KEY CONFIGURATION MODAL                   */}
      {/* ========================================================= */}
      {isApiKeyModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in font-sans">
          <div className="bg-white border-2 border-slate-300 rounded-3xl max-w-lg w-full shadow-2xl p-5 text-slate-900 relative">
            <button
              onClick={() => setIsApiKeyModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-2.5 mb-3">
              <div className="p-2 rounded-xl bg-blue-600 text-white">
                <Key className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  {isOdia ? 'ଗୁଗୁଲ୍ ମ୍ୟାପ୍ସ API କୀ କନ୍‌ଫିଗରେସନ୍' : 'Google Maps API Key Configuration'}
                </h2>
                <p className="text-[11px] text-slate-500">
                  Official Google Maps Platform JavaScript API Key
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveKey} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-0.5">
                  Google Maps API Key *
                </label>
                <input
                  type="password"
                  required
                  placeholder="AIzaSy..."
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  className="w-full bg-slate-50 text-slate-900 border border-slate-300 rounded-xl p-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-600 font-mono"
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-2.5 text-xs text-blue-900 space-y-1">
                <div className="font-bold flex items-center space-x-1">
                  <span>How to obtain an official API Key:</span>
                  <a
                    href="https://console.cloud.google.com/google/maps-apis/credentials"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-700 underline inline-flex items-center ml-1"
                  >
                    <span>Google Cloud Console</span>
                    <ExternalLink className="w-3 h-3 ml-0.5" />
                  </a>
                </div>
                <p className="text-[11px] text-blue-800 leading-relaxed">
                  1. Go to Google Cloud Console and enable the <strong>Maps JavaScript API</strong>.<br />
                  2. Create credentials (API Key) and restrict to your application domain/origin.<br />
                  3. Google Maps provides monthly free usage credit ($200 monthly credit covers thousands of classroom loads).
                </p>
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsApiKeyModalOpen(false)}
                  className="px-3 py-1.5 rounded-xl border border-slate-300 font-semibold text-xs text-slate-700 hover:bg-slate-100 transition"
                >
                  {isOdia ? 'ବାତିଲ' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={!apiKeyInput.trim()}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-xl font-bold text-xs flex items-center space-x-1.5 shadow-xs transition disabled:opacity-50"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{isOdia ? 'ସଂରକ୍ଷଣ କରନ୍ତୁ' : 'Save & Reload Map'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
