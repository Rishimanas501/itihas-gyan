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
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Check,
  ChevronDown,
  Table,
  Map as MapIcon,
  HelpCircle,
  Flag,
  Globe
} from 'lucide-react';
import type { 
  HistoricalMap, 
  HistoricalFrame, 
  HistoricalRegion, 
  PoliticalStatus
} from '../types';
import {
  getAllHistoricalMaps,
  exportMapToPNG,
  exportMapToPDF,
  generateHistoricalMapAI,
  saveHistoricalMap,
  classifyHistoricalTopic
} from '../services/historicalMapService';
import { 
  SUBCONTINENT_COASTLINE_PATH, 
  SRI_LANKA_PATH 
} from '../data/historicalMapsData';
import { db } from '../db';
import { OpenHistoricalMapView } from './OpenHistoricalMapView';

interface HistoricalMapScreenProps {
  geminiApiKey?: string;
  isOdia?: boolean;
}

export const HistoricalMapScreen: React.FC<HistoricalMapScreenProps> = ({
  geminiApiKey = '',
  isOdia = true
}) => {
  // Map Engine View Mode: 2 Independent, 100% Free Options
  // 1. 'canvas' = Existing Historical Map (100% Offline, Default)
  // 2. 'open_map' = Satellite & Open Geographical Map (Leaflet / OSM / Satellite - No API Key Required)
  const [mapEngineView, setMapEngineView] = useState<'canvas' | 'open_map'>('canvas');
  // State: Maps list and active selection
  const [maps, setMaps] = useState<HistoricalMap[]>([]);
  const [selectedMapId, setSelectedMapId] = useState<string>('mughal_empire_1526_1707');
  const [activeFrameIndex, setActiveFrameIndex] = useState<number>(0);
  const [selectedRegion, setSelectedRegion] = useState<HistoricalRegion | null>(null);
  const [viewMode, setViewMode] = useState<'map' | 'timeline_table'>('map');

  // Animation & Playback State
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<1 | 2 | 3>(1); // 1x = 4s, 2x = 2.5s, 3x = 1.5s
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [hoveredRegionId, setHoveredRegionId] = useState<string | null>(null);

  // AI Generator Modal State
  const [isGeneratorOpen, setIsGeneratorOpen] = useState<boolean>(false);
  const [aiTopic, setAiTopic] = useState<string>('');
  const [aiYearRange, setAiYearRange] = useState<string>('');
  const [aiNotes, setAiNotes] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // References
  const svgRef = useRef<SVGSVGElement | null>(null);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Load maps on initial mount
  useEffect(() => {
    loadMaps();
  }, []);

  const loadMaps = async () => {
    try {
      const allMaps = await getAllHistoricalMaps();
      setMaps(allMaps);
      if (allMaps.length > 0) {
        if (selectedMapId && selectedMapId.toLowerCase().includes('gandhi')) {
          setSelectedMapId('mahatma_gandhi_journey');
        } else if (!allMaps.some(m => m.id === selectedMapId)) {
          setSelectedMapId(allMaps[0].id);
        }
      }
    } catch (e) {
      console.error('Failed to load historical maps:', e);
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Current active map and active frame
  const currentMap = useMemo(() => {
    if (selectedMapId && selectedMapId.toLowerCase().includes('gandhi')) {
      const gMap = maps.find(m => m.id === 'mahatma_gandhi_journey');
      if (gMap) return gMap;
    }
    return maps.find(m => m.id === selectedMapId) || maps[0];
  }, [maps, selectedMapId]);

  const currentFrame: HistoricalFrame | undefined = useMemo(() => {
    if (!currentMap || !currentMap.frames || currentMap.frames.length === 0) return undefined;
    return currentMap.frames[activeFrameIndex] || currentMap.frames[0];
  }, [currentMap, activeFrameIndex]);

  // Reset active frame when map changes
  useEffect(() => {
    setActiveFrameIndex(0);
    setIsPlaying(false);
  }, [selectedMapId]);

  // Real Flipbook Animation Timer Loop
  useEffect(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (isPlaying && currentMap && currentMap.frames) {
      const intervalMs = playbackSpeed === 1 ? 4000 : playbackSpeed === 2 ? 2500 : 1500;
      timerRef.current = setInterval(() => {
        setActiveFrameIndex((prevIndex) => {
          if (prevIndex + 1 < currentMap.frames.length) {
            return prevIndex + 1;
          } else {
            // Reached final historical stage; pause animation
            setIsPlaying(false);
            return prevIndex;
          }
        });
      }, intervalMs);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isPlaying, playbackSpeed, currentMap]);

  // Fullscreen toggle handler
  const toggleFullscreen = () => {
    if (!mapContainerRef.current) return;
    if (!document.fullscreenElement) {
      mapContainerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  // Playback Control Handlers
  const handlePlayPause = () => {
    if (!isPlaying && currentMap && activeFrameIndex >= currentMap.frames.length - 1) {
      // If at the end, restart from beginning
      setActiveFrameIndex(0);
    }
    setIsPlaying(!isPlaying);
  };

  const handlePrev = () => {
    setIsPlaying(false);
    setActiveFrameIndex(prev => Math.max(0, prev - 1));
  };

  const handleNext = () => {
    setIsPlaying(false);
    if (currentMap && currentMap.frames) {
      setActiveFrameIndex(prev => Math.min(currentMap.frames.length - 1, prev + 1));
    }
  };

  const handleRestart = () => {
    setIsPlaying(false);
    setActiveFrameIndex(0);
  };

  // Export to PNG
  const handleExportPNG = async () => {
    if (!svgRef.current || !currentMap || !currentFrame) return;
    try {
      await exportMapToPNG(
        svgRef.current,
        currentMap.title,
        `Frame ${currentFrame.frameNumber} - ${currentFrame.yearDisplay} (${currentFrame.ruler.name})`
      );
      showToast(isOdia ? 'ମାନଚିତ୍ର PNG ସଫଳତାର ସହ ଡାଉନଲୋଡ୍ ହେଲା!' : 'Map PNG downloaded successfully!');
    } catch (e) {
      console.error(e);
      alert('Failed to export map as PNG.');
    }
  };

  // Export to PDF
  const handleExportPDF = async () => {
    if (!currentMap) return;
    try {
      await exportMapToPDF(currentMap, activeFrameIndex, svgRef.current || undefined);
      showToast(isOdia ? 'ଐତିହାସିକ ଆଟଲାସ୍ PDF ସଫଳତାର ସହ ତିଆରି ହେଲା!' : 'Historical Atlas PDF exported successfully!');
    } catch (e) {
      console.error(e);
      alert('Failed to export PDF.');
    }
  };

  // Handle AI Custom Map Generation
  const handleGenerateMap = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiTopic.trim()) return;

    setIsGenerating(true);
    setGenerationError(null);
    try {
      const generated = await generateHistoricalMapAI(
        aiTopic,
        aiYearRange,
        aiNotes,
        geminiApiKey
      );
      await saveHistoricalMap(generated);
      await loadMaps();
      setSelectedMapId(generated.id);
      setIsGeneratorOpen(false);
      setAiTopic('');
      setAiYearRange('');
      setAiNotes('');
      showToast(isOdia ? `ନୂତନ ମାନଚିତ୍ର ସଫଳତାର ସହ ପ୍ରସ୍ତୁତ ହେଲା: ${generated.title}` : `Map generated: ${generated.title}`);
    } catch (err: any) {
      console.error(err);
      setGenerationError(err?.message || 'Failed to generate map.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Detect if current topic represents a historical figure or movement rather than an empire
  const isFigureOrMovement = useMemo(() => {
    if (!currentMap) return false;
    if (currentMap.category === 'figure' || currentMap.category === 'movement') return true;
    if (currentMap.category === 'empire') return false;
    return classifyHistoricalTopic(currentMap.topic) !== 'empire';
  }, [currentMap]);

  // Helper for Political Status Badge
  const getPoliticalStatusBadge = (status: PoliticalStatus) => {
    if (isFigureOrMovement) {
      switch (status) {
        case 'direct_annexation':
          return {
            bg: 'bg-emerald-100 text-emerald-800 border-emerald-300',
            label: isOdia ? 'ପ୍ରମୁଖ ସକ୍ରିୟ କେନ୍ଦ୍ର (Epicentre)' : 'Primary Active Epicentre'
          };
        case 'tributary_vassal':
          return {
            bg: 'bg-amber-100 text-amber-800 border-amber-300',
            label: isOdia ? 'ସହଯୋଗୀ ଅଞ୍ଚଳ (Affiliated Zone)' : 'Affiliated Solidarity Region'
          };
        case 'protectorate':
          return {
            bg: 'bg-blue-100 text-blue-800 border-blue-300',
            label: isOdia ? 'ସମର୍ଥନକାରୀ କ୍ଷେତ୍ର (Support Zone)' : 'Support Zone'
          };
        case 'frontier_sphere':
        default:
          return {
            bg: 'bg-purple-100 text-purple-800 border-purple-300',
            label: isOdia ? 'ପ୍ରଚାର ଓ ବିସ୍ତାର କ୍ଷେତ୍ର (Outreach)' : 'Outreach & Mobilization Sphere'
          };
      }
    }

    switch (status) {
      case 'direct_annexation':
        return {
          bg: 'bg-emerald-100 text-emerald-800 border-emerald-300',
          label: isOdia ? 'ପ୍ରତ୍ୟକ୍ଷ ସାମ୍ରାଜ୍ୟ ଭୁକ୍ତ (Direct Subah)' : 'Direct Imperial Annexation'
        };
      case 'tributary_vassal':
        return {
          bg: 'bg-amber-100 text-amber-800 border-amber-300',
          label: isOdia ? 'କରଦ / ସାମନ୍ତ ରାଜ୍ୟ (Tributary Vassal)' : 'Tributary Vassal Kingdom'
        };
      case 'protectorate':
        return {
          bg: 'bg-blue-100 text-blue-800 border-blue-300',
          label: isOdia ? 'ସୁରକ୍ଷିତ ରାଜ୍ୟ (Protectorate)' : 'Protectorate Territory'
        };
      case 'frontier_sphere':
      default:
        return {
          bg: 'bg-purple-100 text-purple-800 border-purple-300',
          label: isOdia ? 'ସୀମାନ୍ତ ପ୍ରଭାବ କ୍ଷେତ୍ର (Frontier)' : 'Frontier Influence Sphere'
        };
    }
  };

  if (!currentMap || !currentFrame) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-800"></div>
      </div>
    );
  }

  return (
    <div 
      ref={mapContainerRef} 
      className={`h-[calc(100vh-64px)] flex flex-col min-h-0 bg-[#fcf9f2] text-stone-900 overflow-hidden select-none ${
        isFullscreen ? 'p-1.5' : 'p-2 sm:p-2.5'
      }`}
      style={{ fontFamily: '"Georgia", "Cambria", "Times New Roman", serif' }}
    >
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 bg-stone-900 text-amber-100 px-4 py-2.5 rounded-xl shadow-2xl border border-amber-600/40 flex items-center space-x-2.5 text-xs animate-fade-in font-sans">
          <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ========================================================= */}
      {/* 1. COMPACT TOP HEADER & CONTROLS BAR (SHRINK-0)           */}
      {/* ========================================================= */}
      <div className="shrink-0 bg-[#f4eedb] border border-[#854d0e]/30 rounded-xl px-3 py-1.5 shadow-xs mb-2">
        <div className="flex items-center justify-between gap-2">
          
          {/* Title and Topic Selection */}
          <div className="flex items-center space-x-2.5 min-w-0">
            <div className="p-1.5 bg-gradient-to-br from-amber-700 to-amber-900 text-amber-100 rounded-lg shadow-xs border border-amber-600 shrink-0">
              <Compass className="w-4 h-4 animate-spin-slow" />
            </div>
            <div className="min-w-0 truncate">
              <div className="flex items-center space-x-1.5">
                <span className="text-[10px] uppercase tracking-wider font-sans font-bold px-1.5 py-0.2 rounded bg-amber-800/10 text-amber-900 border border-amber-700/20">
                  {isOdia ? 'ଐତିହାସିକ ଆଟଲାସ୍' : 'HISTORICAL ATLAS'}
                </span>
                <span className="text-[10px] font-sans px-1.5 py-0.2 rounded bg-emerald-700/10 text-emerald-800 border border-emerald-600/20 font-semibold truncate">
                  {currentMap.era}
                </span>
              </div>
              <h1 className="text-sm sm:text-base font-bold text-[#451a03] truncate leading-tight">
                {isOdia && currentMap.odiaTitle ? currentMap.odiaTitle : currentMap.title}
              </h1>
            </div>
          </div>

          {/* Map Selector & Action Buttons */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* View Selector Toggle (Requirement: Two Clean, 100% Free Independent Options) */}
            <div className="inline-flex rounded-xl p-0.5 bg-[#e7dec3] border border-amber-800/30 font-sans text-xs font-bold shadow-xs">
              <button
                type="button"
                onClick={() => setMapEngineView('canvas')}
                className={`px-3 py-1.5 rounded-lg flex items-center space-x-1.5 transition ${
                  mapEngineView === 'canvas'
                    ? 'bg-amber-800 text-amber-50 shadow-xs'
                    : 'text-stone-700 hover:text-stone-900 hover:bg-[#dfd5b8]'
                }`}
                title={isOdia ? '୧. ପ୍ରଚଳିତ ଐତିହାସିକ ଆଟଲାସ୍ (୧୦୦% ଅଫଲାଇନ୍, ଡିଫଲ୍ଟ)' : 'Option 1: Existing Historical Map (100% Offline, Default)'}
              >
                <MapIcon className="w-3.5 h-3.5" />
                <span>{isOdia ? '୧. ଐତିହାସିକ ଆଟଲାସ୍ (Offline)' : '1. Historical Atlas'}</span>
              </button>

              <button
                type="button"
                onClick={() => setMapEngineView('open_map')}
                className={`px-3 py-1.5 rounded-lg flex items-center space-x-1.5 transition ${
                  mapEngineView === 'open_map'
                    ? 'bg-emerald-800 text-white shadow-xs'
                    : 'text-stone-700 hover:text-stone-900 hover:bg-[#dfd5b8]'
                }`}
                title={isOdia ? '୨. ସାଟେଲାଇଟ୍ ଓ ଓପନ୍ ମ୍ୟାପ୍ (କୌଣସି API Key ବିନା ୧୦୦% ମାଗଣା)' : 'Option 2: Satellite & Open Map (100% Free, No API Key Required)'}
              >
                <Globe className="w-3.5 h-3.5 text-emerald-400" />
                <span>{isOdia ? '୨. ସାଟେଲାଇଟ୍ ଓ ଓପନ୍ ମ୍ୟାପ୍' : '2. Satellite & Open Map'}</span>
              </button>
            </div>

            {/* Topic Switcher Dropdown */}
            <div className="relative">
              <select
                value={selectedMapId}
                onChange={(e) => setSelectedMapId(e.target.value)}
                className="appearance-none bg-[#fbf7ee] text-stone-900 font-sans text-xs font-semibold pl-2.5 pr-7 py-1.5 rounded-lg border border-amber-700/30 shadow-xs focus:outline-none focus:ring-1 focus:ring-amber-700 transition"
              >
                {maps.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.topic} ({m.era})
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-amber-800 absolute right-2 top-2 pointer-events-none" />
            </div>

            {/* View Mode Toggle (Canvas Only) */}
            {mapEngineView === 'canvas' && (
              <div className="hidden sm:inline-flex rounded-lg p-0.5 bg-[#e7dec3] border border-amber-800/20 font-sans text-[11px] font-bold">
                <button
                  onClick={() => setViewMode('map')}
                  className={`px-2 py-1 rounded-md flex items-center space-x-1 transition ${
                    viewMode === 'map'
                      ? 'bg-amber-800 text-amber-50 shadow-xs'
                      : 'text-stone-700 hover:text-stone-900'
                  }`}
                >
                  <MapIcon className="w-3 h-3" />
                  <span>{isOdia ? 'ମାନଚିତ୍ର' : 'Map'}</span>
                </button>
                <button
                  onClick={() => setViewMode('timeline_table')}
                  className={`px-2 py-1 rounded-md flex items-center space-x-1 transition ${
                    viewMode === 'timeline_table'
                      ? 'bg-amber-800 text-amber-50 shadow-xs'
                      : 'text-stone-700 hover:text-stone-900'
                  }`}
                >
                  <Table className="w-3 h-3" />
                  <span>{isOdia ? 'ସାରଣୀ' : 'Timeline'}</span>
                </button>
              </div>
            )}

            {/* AI Generator Button */}
            <button
              onClick={() => setIsGeneratorOpen(true)}
              className="bg-gradient-to-r from-amber-700 to-amber-800 hover:from-amber-800 hover:to-amber-900 text-amber-50 px-2.5 py-1.5 rounded-lg text-xs font-sans font-bold flex items-center space-x-1 shadow-xs transition border border-amber-600"
              title="Generate Custom Historical Map with AI"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span className="hidden md:inline">{isOdia ? 'AI ମାନଚିତ୍ର' : 'Create with AI'}</span>
            </button>

            {/* Export Menu Buttons (Canvas Only) */}
            {mapEngineView === 'canvas' && (
              <div className="flex items-center space-x-1">
                <button
                  onClick={handleExportPNG}
                  className="bg-[#fbf7ee] hover:bg-[#ede4cb] text-stone-800 p-1.5 rounded-lg border border-amber-700/30 shadow-xs transition"
                  title={isOdia ? 'PNG ଡାଉନଲୋଡ୍ କରନ୍ତୁ' : 'Download PNG'}
                >
                  <Download className="w-3.5 h-3.5 text-amber-800" />
                </button>
                <button
                  onClick={handleExportPDF}
                  className="bg-[#fbf7ee] hover:bg-[#ede4cb] text-stone-800 p-1.5 rounded-lg border border-amber-700/30 shadow-xs transition"
                  title={isOdia ? 'PDF ଆଟଲାସ୍ ରିପୋର୍ଟ ଡାଉନଲୋଡ୍ କରନ୍ତୁ' : 'Export PDF'}
                >
                  <FileText className="w-3.5 h-3.5 text-amber-800" />
                </button>
                <button
                  onClick={toggleFullscreen}
                  className="bg-[#fbf7ee] hover:bg-[#ede4cb] text-stone-800 p-1.5 rounded-lg border border-amber-700/30 shadow-xs transition"
                  title={isFullscreen ? 'Exit Fullscreen' : 'Classroom Presentation Mode'}
                >
                  {isFullscreen ? (
                    <Minimize2 className="w-3.5 h-3.5 text-amber-800" />
                  ) : (
                    <Maximize2 className="w-3.5 h-3.5 text-amber-800" />
                  )}
                </button>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 2. MAIN 2-COLUMN VIEWPORT WORKSPACE (TWO MAP OPTIONS)     */}
      {/* ========================================================= */}
      {mapEngineView === 'open_map' ? (
        <OpenHistoricalMapView
          currentMap={currentMap}
          activeFrameIndex={activeFrameIndex}
          setActiveFrameIndex={setActiveFrameIndex}
          isPlaying={isPlaying}
          setIsPlaying={setIsPlaying}
          playbackSpeed={playbackSpeed}
          setPlaybackSpeed={setPlaybackSpeed}
          onRestart={handleRestart}
          onPrev={handlePrev}
          onNext={handleNext}
          isOdia={isOdia}
          onSwitchToCanvasMap={() => setMapEngineView('canvas')}
        />
      ) : viewMode === 'map' ? (
        <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-2 sm:gap-3 overflow-hidden">
          
          {/* ========================================================= */}
          {/* LEFT COLUMN: 8 COLS (~68% WIDTH) — MAP + FLIPBOOK STRIP   */}
          {/* ========================================================= */}
          <div className="lg:col-span-8 flex flex-col h-full min-h-0 overflow-hidden">
            
            {/* The Parchment Atlas Map Canvas */}
            <div className="flex-1 min-h-0 relative bg-[#fcf8ed] border-2 border-[#854d0e] rounded-xl shadow-md overflow-hidden flex items-center justify-center p-1 sm:p-2">
              
              {/* Subtle Parchment Texture Pattern */}
              <div 
                className="absolute inset-0 pointer-events-none opacity-30 mix-blend-multiply"
                style={{
                  backgroundImage: `radial-gradient(#854d0e 0.5px, transparent 0.5px), radial-gradient(#d97706 0.5px, #fcf8ed 0.5px)`,
                  backgroundSize: '16px 16px',
                  backgroundPosition: '0 0, 8px 8px'
                }}
              />

              {/* Antique Corner Filigree Accents */}
              <div className="absolute top-1.5 left-1.5 w-8 h-8 border-t-2 border-l-2 border-amber-800/60 pointer-events-none rounded-tl-md" />
              <div className="absolute top-1.5 right-1.5 w-8 h-8 border-t-2 border-r-2 border-amber-800/60 pointer-events-none rounded-tr-md" />
              <div className="absolute bottom-1.5 left-1.5 w-8 h-8 border-b-2 border-l-2 border-amber-800/60 pointer-events-none rounded-bl-md" />
              <div className="absolute bottom-1.5 right-1.5 w-8 h-8 border-b-2 border-r-2 border-amber-800/60 pointer-events-none rounded-br-md" />

              {/* Stage Banner Overlay on Map (Top Left) */}
              <div className="absolute top-2.5 left-3 z-10 bg-[#f4eedb]/95 backdrop-blur-xs border border-amber-800/40 rounded-lg px-2.5 py-1 shadow-sm max-w-[260px] sm:max-w-xs">
                <div className="flex items-center space-x-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-600 animate-pulse"></span>
                  <span className="font-sans text-[10px] uppercase font-bold text-amber-900 tracking-wider">
                    {isOdia ? `ପର୍ଯ୍ୟାୟ ${currentFrame.frameNumber}` : `Frame ${currentFrame.frameNumber}`}
                  </span>
                  <span className="font-sans font-bold text-[10px] bg-amber-800 text-amber-50 px-1.5 py-0.2 rounded-full">
                    {currentFrame.yearDisplay}
                  </span>
                </div>
                <h3 className="text-xs sm:text-sm font-bold text-[#451a03] truncate leading-tight mt-0.5">
                  {currentFrame.title}
                </h3>
                <p className="font-sans text-[10px] text-stone-600 italic truncate">
                  {currentFrame.subtitle}
                </p>
              </div>

              {/* Compass Rose Indicator (Top Right) */}
              <div className="absolute top-2 right-3 z-10 pointer-events-none flex flex-col items-center opacity-80">
                <div className="relative w-9 h-9">
                  <svg viewBox="0 0 100 100" className="w-full h-full text-amber-900 drop-shadow-xs">
                    <circle cx="50" cy="50" r="46" fill="none" stroke="#78350f" strokeWidth="2" strokeDasharray="3,3" />
                    <circle cx="50" cy="50" r="40" fill="none" stroke="#92400e" strokeWidth="1" />
                    <polygon points="50,6 56,46 50,42 44,46" fill="#991b1b" />
                    <polygon points="50,94 56,54 50,58 44,54" fill="#78350f" />
                    <polygon points="94,50 54,56 58,50 54,44" fill="#92400e" />
                    <polygon points="6,50 46,56 42,50 46,44" fill="#92400e" />
                    <circle cx="50" cy="50" r="3.5" fill="#fef3c7" stroke="#78350f" strokeWidth="2" />
                    <text x="50" y="24" textAnchor="middle" fill="#991b1b" fontSize="13" fontWeight="bold" fontFamily="sans-serif">N</text>
                  </svg>
                </div>
                <span className="text-[8px] font-sans font-bold uppercase tracking-widest text-amber-900">
                  {isOdia ? 'ଉତ୍ତର' : 'N'}
                </span>
              </div>

              {/* Interactive Zoom Controls (Bottom Left) */}
              <div className="absolute bottom-12 left-3 z-10 flex items-center space-x-1 bg-[#f4eedb]/90 border border-amber-800/30 rounded-lg p-0.5 shadow-xs font-sans">
                <button
                  onClick={() => setZoomLevel(prev => Math.min(prev + 0.2, 2.2))}
                  className="p-1 hover:bg-[#e8dec1] rounded text-amber-950 transition"
                  title="Zoom In"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
                <span className="text-[10px] font-bold px-1 text-amber-950">
                  {Math.round(zoomLevel * 100)}%
                </span>
                <button
                  onClick={() => setZoomLevel(prev => Math.max(prev - 0.2, 0.8))}
                  className="p-1 hover:bg-[#e8dec1] rounded text-amber-950 transition"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                {zoomLevel !== 1 && (
                  <button
                    onClick={() => setZoomLevel(1)}
                    className="text-[9px] px-1 py-0.2 bg-amber-800/10 hover:bg-amber-800/20 text-amber-900 rounded font-semibold transition"
                  >
                    100%
                  </button>
                )}
              </div>

              {/* Legend & Territory Status Note (Bottom Right) */}
              <div className="absolute bottom-12 right-3 z-10 bg-[#f4eedb]/90 backdrop-blur-xs border border-amber-800/35 rounded-lg p-1.5 shadow-xs font-sans text-[10px] max-w-[200px]">
                <div className="text-[9px] font-bold text-amber-950 uppercase tracking-wider mb-1 border-b border-amber-800/20 pb-0.2">
                  {isFigureOrMovement 
                    ? (isOdia ? 'ମାନଚିତ୍ର ସୂଚୀ (Legend)' : 'Map Legend') 
                    : (isOdia ? 'ସାମ୍ରାଜ୍ୟ ସୂଚୀ (Legend)' : 'Empire Legend')}
                </div>
                <div className="space-y-0.5">
                  <div className="flex items-center space-x-1.5">
                    <span className="w-2.5 h-2.5 rounded bg-emerald-600 border border-emerald-800 flex-shrink-0" />
                    <span className="text-stone-800 text-[9.5px] truncate">
                      {isFigureOrMovement 
                        ? (isOdia ? 'ପ୍ରମୁଖ ସକ୍ରିୟ କେନ୍ଦ୍ର' : 'Active Epicentres') 
                        : (isOdia ? 'ଅଧୀକୃତ ପ୍ରଦେଶ' : 'Imperial Subahs')}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <span className="w-2.5 h-2.5 rounded bg-amber-400 border border-amber-600 flex-shrink-0" />
                    <span className="text-stone-800 text-[9.5px] truncate">
                      {isFigureOrMovement 
                        ? (isOdia ? 'ସହଯୋଗୀ ଅଞ୍ଚଳ' : 'Affiliated Zones') 
                        : (isOdia ? 'ସାମନ୍ତ / କରଦ ରାଜ୍ୟ' : 'Tributary Vassals')}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <span className="w-2.5 h-2.5 rounded bg-rose-500 border border-rose-700 animate-pulse flex-shrink-0" />
                    <span className="text-stone-800 text-[9.5px] font-semibold truncate">
                      {isFigureOrMovement 
                        ? (isOdia ? 'ନୂତନ ସକ୍ରିୟ କେନ୍ଦ୍ର' : 'Newly Active') 
                        : (isOdia ? 'ନୂତନ ବିଜୟ' : 'Newly Conquered')}
                    </span>
                  </div>
                </div>
              </div>

              {/* =================================================== */}
              {/* THE REAL SVG VECTOR GEOGRAPHICAL MAP */}
              {/* =================================================== */}
              <div 
                className="w-full h-full flex items-center justify-center transition-transform duration-300 ease-out"
                style={{ transform: `scale(${zoomLevel})` }}
              >
                <svg
                  ref={svgRef}
                  viewBox={currentMap.viewBox || '0 0 1000 850'}
                  preserveAspectRatio="xMidYMid meet"
                  className="w-full h-full max-h-full select-none"
                  style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.06))' }}
                >
                  <defs>
                    {/* Antique Map Background Gradients */}
                    <linearGradient id="parchmentFill" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#fffcf2" />
                      <stop offset="50%" stopColor="#f7f1df" />
                      <stop offset="100%" stopColor="#ebe1c8" />
                    </linearGradient>

                    <linearGradient id="oceanFill" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#e0f2fe" />
                      <stop offset="100%" stopColor="#bae6fd" />
                    </linearGradient>

                    {/* Animated Pulsing Filter for Newly Conquered Regions */}
                    <filter id="glow-conquest" x="-20%" y="-20%" width="140%" height="140%">
                      <feGaussianBlur stdDeviation="3.5" result="blur" />
                      <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>

                    {/* Campaign Vector Arrow Marker */}
                    <marker
                      id="campaignArrow"
                      viewBox="0 0 10 10"
                      refX="6"
                      refY="5"
                      markerWidth="5"
                      markerHeight="5"
                      orient="auto-start-reverse"
                    >
                      <path d="M 0 1 L 10 5 L 0 9 z" fill="#b91c1c" />
                    </marker>
                  </defs>

                  {/* 1. Ocean & Water Bodies Background */}
                  <rect x="0" y="0" width="1000" height="850" fill="url(#oceanFill)" opacity="0.4" />

                  {/* 2. Subcontinent Natural Landmass Outline */}
                  <path
                    d={SUBCONTINENT_COASTLINE_PATH}
                    fill="url(#parchmentFill)"
                    stroke="#854d0e"
                    strokeWidth="3"
                    strokeLinejoin="round"
                    strokeLinecap="round"
                  />

                  {/* Sri Lanka Island Outline */}
                  <path
                    d={SRI_LANKA_PATH}
                    fill="url(#parchmentFill)"
                    stroke="#854d0e"
                    strokeWidth="2.5"
                    strokeLinejoin="round"
                  />

                  {/* 3. Major Historic Meandering Rivers */}
                  {currentMap.geographicFeatures?.rivers?.map((river, idx) => (
                    <g key={`river_${idx}`}>
                      <path
                        d={river.path}
                        fill="none"
                        stroke="#0284c7"
                        strokeWidth="2.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        opacity="0.85"
                      />
                    </g>
                  ))}

                  {/* 4. HISTORICAL REGIONS (Clickable & Organic Bezier Contours) */}
                  {currentMap.regions.map((region) => {
                    const isControlled = currentFrame.controlledRegionIds.includes(region.id);
                    const isNewlyAcquired = currentFrame.newlyAcquiredRegionIds.includes(region.id);
                    const isHovered = hoveredRegionId === region.id;
                    const isSelected = selectedRegion?.id === region.id;

                    // Compute dynamic frame color
                    let fillColor = 'transparent';
                    let fillOpacity = 0;
                    let strokeColor = '#854d0e';
                    let strokeWidth = 1.2;

                    if (isControlled) {
                      if (isNewlyAcquired) {
                        fillColor = '#f43f5e'; // Highlighted crimson rose for newly conquered
                        fillOpacity = 0.65;
                        strokeColor = '#9f1239';
                        strokeWidth = 2.4;
                      } else {
                        // Standard territorial color based on political status
                        fillColor = region.politicalStatus === 'tributary_vassal' 
                          ? '#facc15' 
                          : region.fillColor || '#10b981';
                        fillOpacity = 0.52;
                        strokeColor = '#047857';
                        strokeWidth = 1.8;
                      }
                    } else {
                      // Uncontrolled territory in this historical stage
                      fillColor = '#f3f4f6';
                      fillOpacity = 0.12;
                      strokeColor = '#cbd5e1';
                      strokeWidth = 0.7;
                    }

                    if (isHovered || isSelected) {
                      fillOpacity = Math.min(fillOpacity + 0.25, 0.88);
                      strokeWidth = 2.8;
                      strokeColor = '#b91c1c';
                    }

                    return (
                      <g
                        key={region.id}
                        className="cursor-pointer transition-all duration-300"
                        onMouseEnter={() => setHoveredRegionId(region.id)}
                        onMouseLeave={() => setHoveredRegionId(null)}
                        onClick={() => setSelectedRegion(region)}
                      >
                        <path
                          d={region.svgPath}
                          fill={fillColor}
                          fillOpacity={fillOpacity}
                          stroke={strokeColor}
                          strokeWidth={strokeWidth}
                          strokeDasharray={
                            region.politicalStatus === 'tributary_vassal' ? '4,3' : 'none'
                          }
                          filter={isNewlyAcquired ? 'url(#glow-conquest)' : undefined}
                          className="transition-colors duration-500 ease-in-out"
                        />

                        {/* Region Label (Visible if controlled or hovered) */}
                        {isControlled && (
                          <text
                            x={region.labelCoordinates.x}
                            y={region.labelCoordinates.y}
                            textAnchor="middle"
                            fill="#1c1917"
                            fontSize="11"
                            fontWeight="bold"
                            fontFamily="Georgia, serif"
                            className="pointer-events-none drop-shadow-xs"
                          >
                            {region.name.split('(')[0].trim()}
                          </text>
                        )}
                      </g>
                    );
                  })}

                  {/* 5. Animated Campaign Vectors for this Historical Stage */}
                  {currentFrame.campaignVectors?.map((vector) => (
                    <g key={vector.id} className="pointer-events-none">
                      <path
                        d={vector.path || `M ${vector.from.x},${vector.from.y} L ${vector.to.x},${vector.to.y}`}
                        fill="none"
                        stroke="#b91c1c"
                        strokeWidth="2.8"
                        strokeDasharray="5,3"
                        markerEnd="url(#campaignArrow)"
                        className="animate-pulse"
                      />
                    </g>
                  ))}

                  {/* 6. Historical Cities, Capitals, and Battlefields */}
                  {currentFrame.cities?.map((city, cIdx) => (
                    <g key={`city_${cIdx}`} className="pointer-events-none">
                      {city.type === 'capital' ? (
                        <>
                          <circle cx={city.x} cy={city.y} r="6.5" fill="#b91c1c" stroke="#fef08a" strokeWidth="1.8" />
                          <circle cx={city.x} cy={city.y} r="2.5" fill="#ffffff" />
                        </>
                      ) : city.type === 'battlefield' ? (
                        <>
                          <circle cx={city.x} cy={city.y} r="5.5" fill="#e11d48" stroke="#ffffff" strokeWidth="1.2" />
                          <path
                            d={`M ${city.x - 2.5},${city.y - 2.5} L ${city.x + 2.5},${city.y + 2.5} M ${city.x + 2.5},${city.y - 2.5} L ${city.x - 2.5},${city.y + 2.5}`}
                            stroke="#ffffff"
                            strokeWidth="1.2"
                          />
                        </>
                      ) : (
                        <circle cx={city.x} cy={city.y} r="4" fill="#451a03" stroke="#fef3c7" strokeWidth="1.2" />
                      )}

                      {/* City Text Label */}
                      <text
                        x={city.x + 7}
                        y={city.y + 3.5}
                        fill="#292524"
                        fontSize="9.5"
                        fontWeight={city.type === 'capital' ? 'bold' : 'normal'}
                        fontFamily="sans-serif"
                        className="drop-shadow-xs"
                      >
                        {isOdia && city.odiaName ? city.odiaName : city.name}
                      </text>
                    </g>
                  ))}

                  {/* 7. Ocean & Regional Geographical Labels */}
                  {currentMap.geographicFeatures?.seas?.map((sea, sIdx) => (
                    <text
                      key={`sea_${sIdx}`}
                      x={sea.x}
                      y={sea.y}
                      textAnchor="middle"
                      fill="#78716c"
                      fontSize="10"
                      fontWeight="bold"
                      fontStyle="italic"
                      letterSpacing="2.5"
                      fontFamily="Georgia, serif"
                      className="pointer-events-none opacity-60"
                    >
                      {sea.name}
                    </text>
                  ))}
                </svg>
              </div>

              {/* =================================================== */}
              {/* COMPACT PLAYBACK CONTROL BAR (EMBEDDED AT BOTTOM)   */}
              {/* =================================================== */}
              <div className="absolute bottom-2 inset-x-3 z-20 bg-[#f4eedb]/95 backdrop-blur-xs border border-amber-800/35 rounded-xl px-3 py-1.5 shadow-md flex items-center justify-between gap-2 font-sans text-xs">
                
                {/* Playback Buttons */}
                <div className="flex items-center space-x-1.5 shrink-0">
                  <button
                    onClick={handleRestart}
                    className="p-1.5 rounded-lg bg-[#fbf7ee] hover:bg-[#eae0c5] text-amber-950 border border-amber-800/20 shadow-xs transition"
                    title="Restart"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={handlePrev}
                    disabled={activeFrameIndex === 0}
                    className="p-1.5 rounded-lg bg-[#fbf7ee] hover:bg-[#eae0c5] disabled:opacity-30 text-amber-950 border border-amber-800/20 shadow-xs transition"
                    title="Previous"
                  >
                    <SkipBack className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={handlePlayPause}
                    className={`px-3 py-1 rounded-lg font-bold text-xs flex items-center space-x-1 shadow-xs transition ${
                      isPlaying
                        ? 'bg-rose-700 hover:bg-rose-800 text-rose-50'
                        : 'bg-emerald-700 hover:bg-emerald-800 text-emerald-50'
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
                    onClick={handleNext}
                    disabled={activeFrameIndex >= currentMap.frames.length - 1}
                    className="p-1.5 rounded-lg bg-[#fbf7ee] hover:bg-[#eae0c5] disabled:opacity-30 text-amber-950 border border-amber-800/20 shadow-xs transition"
                    title="Next"
                  >
                    <SkipForward className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Progress Bar & Frame Count */}
                <div className="flex-1 max-w-xs mx-2 flex items-center space-x-2">
                  <div className="flex-1 bg-[#dccfac] h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-amber-800 h-full transition-all duration-300 rounded-full"
                      style={{
                        width: `${((activeFrameIndex + 1) / currentMap.frames.length) * 100}%`
                      }}
                    />
                  </div>
                  <span className="text-[11px] font-bold text-amber-950 whitespace-nowrap">
                    {activeFrameIndex + 1} / {currentMap.frames.length}
                  </span>
                </div>

                {/* Speed Toggle Buttons */}
                <div className="flex items-center space-x-1 bg-[#e7dec3] p-0.5 rounded-lg border border-amber-800/20 text-[10px] font-bold shrink-0">
                  <span className="text-amber-950 px-1 font-semibold hidden sm:inline">
                    {isOdia ? 'ଗତି:' : 'Speed:'}
                  </span>
                  {([1, 2, 3] as const).map(speed => (
                    <button
                      key={speed}
                      onClick={() => setPlaybackSpeed(speed)}
                      className={`px-1.5 py-0.5 rounded transition ${
                        playbackSpeed === speed
                          ? 'bg-amber-800 text-amber-50 shadow-xs'
                          : 'text-amber-950 hover:bg-[#ded2b3]'
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
            <div className="h-[92px] shrink-0 mt-2 bg-[#f4eedb] border border-amber-800/30 rounded-xl px-2.5 py-1.5 flex items-center overflow-x-auto space-x-2 scrollbar-thin font-sans">
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
                        ? 'bg-[#fef9e7] border-amber-800 shadow-sm ring-2 ring-amber-500 scale-[1.02]'
                        : 'bg-[#fbf7ee] border-amber-800/20 hover:border-amber-800/40 hover:bg-[#f6f0dd]'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] font-bold">
                      <span className={`px-1.5 py-0.2 rounded ${
                        isActive ? 'bg-amber-800 text-amber-50' : 'bg-amber-800/10 text-amber-900'
                      }`}>
                        {isOdia ? `ପୃଷ୍ଠା ${frame.frameNumber}` : `Page ${frame.frameNumber}`}
                      </span>
                      <span className="font-semibold text-stone-700">{frame.yearDisplay}</span>
                    </div>

                    <h4 className="font-bold text-[11px] text-[#451a03] truncate leading-tight">
                      {frame.ruler.name.split('(')[0].trim()}
                    </h4>

                    <div className="flex items-center justify-between text-[9px] text-stone-500 pt-0.5 border-t border-amber-800/10">
                      <span>{frame.controlledRegionIds.length} {isFigureOrMovement ? (isOdia ? 'କେନ୍ଦ୍ର' : 'centres') : (isOdia ? 'ପ୍ରଦେଶ' : 'subahs')}</span>
                      {frame.newlyAcquiredRegionIds.length > 0 && (
                        <span className="text-rose-700 font-bold">
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
          <div className="lg:col-span-4 h-full min-h-0 flex flex-col bg-[#fcf8ed] border-2 border-amber-800/30 rounded-xl shadow-md overflow-hidden">
            
            {/* Sticky Card Header (Ruler Name & Reign) */}
            <div className="shrink-0 p-3 bg-[#f8f1de] border-b border-amber-800/20 flex items-center space-x-3">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-700 to-amber-900 border border-amber-500 shadow-xs flex items-center justify-center text-amber-100 shrink-0">
                <Award className="w-5 h-5 text-amber-300" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-sans font-bold uppercase tracking-wider text-amber-800 bg-amber-100 px-1.5 py-0.2 rounded border border-amber-300 truncate inline-block">
                  {currentFrame.ruler.title || (isFigureOrMovement ? (isOdia ? 'ପ୍ରମୁଖ ନେତା / ବ୍ୟକ୍ତିତ୍ୱ' : 'Historical Figure / Leader') : (isOdia ? 'ସମ୍ରାଟ / ଶାସକ' : 'Historical Ruler'))}
                </span>
                <h2 className="text-base font-bold text-[#451a03] truncate leading-tight mt-0.5">
                  {isOdia && currentFrame.ruler.odiaName
                    ? currentFrame.ruler.odiaName
                    : currentFrame.ruler.name}
                </h2>
                <div className="flex items-center space-x-1.5 font-sans text-[11px] text-stone-600">
                  <Calendar className="w-3 h-3 text-amber-800" />
                  <span className="font-semibold">{currentFrame.ruler.reignPeriod}</span>
                </div>
              </div>
            </div>

            {/* Scrollable Content Body (With its own internal scroll) */}
            <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-2.5 font-sans text-xs scrollbar-thin">
              
              {/* Territory & Subahs Stat Pills */}
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-[#f4eedb] p-2 rounded-lg border border-amber-800/15">
                  <span className="text-[9px] text-stone-600 block uppercase font-bold">
                    {isFigureOrMovement 
                      ? (isOdia ? 'ଭୌଗୋଳିକ ପ୍ରଭାବ କ୍ଷେତ୍ର' : 'Geographic Reach') 
                      : (isOdia ? 'ସାମ୍ରାଜ୍ୟ ଆୟତନ' : 'Territorial Extent')}
                  </span>
                  <span className="text-xs font-bold text-amber-900">
                    {currentFrame.territorialExtentSqKm || 'N/A'}
                  </span>
                </div>
                <div className="bg-[#f4eedb] p-2 rounded-lg border border-amber-800/15">
                  <span className="text-[9px] text-stone-600 block uppercase font-bold">
                    {isFigureOrMovement 
                      ? (isOdia ? 'ପ୍ରମୁଖ କେନ୍ଦ୍ର ଓ ଅଞ୍ଚଳ' : 'Active Centres') 
                      : (isOdia ? 'ଅଧୀକୃତ ପ୍ରଦେଶ' : 'Subahs / Regions')}
                  </span>
                  <span className="text-xs font-bold text-amber-900">
                    {currentFrame.controlledRegionIds.length} {isFigureOrMovement ? (isOdia ? 'ଗୋଟି କେନ୍ଦ୍ର' : 'Centres') : (isOdia ? 'ଗୋଟି ଅଞ୍ଚଳ' : 'Territories')}
                  </span>
                </div>
              </div>

              {/* Key Achievements */}
              <div>
                <h4 className="font-bold text-amber-950 uppercase tracking-wide flex items-center space-x-1 mb-1 text-[11px]">
                  <Check className="w-3.5 h-3.5 text-emerald-700" />
                  <span>
                    {isFigureOrMovement 
                      ? (isOdia ? 'ପ୍ରମୁଖ ପଦକ୍ଷେପ ଓ ମାଇଲଖୁଣ୍ଟ' : 'Key Milestones & Initiatives') 
                      : (isOdia ? 'ପ୍ରମୁଖ ବିଜୟ ଓ କାର୍ଯ୍ୟାବଳୀ' : 'Key Conquests & Milestones')}
                  </span>
                </h4>
                <ul className="space-y-1 pl-1 text-[11px]">
                  {currentFrame.ruler.achievements.map((ach, idx) => (
                    <li key={idx} className="flex items-start space-x-1.5 text-stone-800 leading-snug">
                      <span className="text-amber-800 font-bold mt-0.2">•</span>
                      <span>{ach}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Battles & Campaigns */}
              {currentFrame.ruler.importantBattles && currentFrame.ruler.importantBattles.length > 0 && (
                <div>
                  <h4 className="font-bold text-amber-950 uppercase tracking-wide flex items-center space-x-1 mb-1 text-[11px]">
                    <Flag className="w-3.5 h-3.5 text-rose-700" />
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
                        className="bg-rose-100/80 text-rose-900 px-1.5 py-0.5 rounded border border-rose-300 font-medium text-[10px]"
                      >
                        {b}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Historical Significance */}
              <div className="bg-[#f5edd6] p-2.5 rounded-lg border border-amber-800/20">
                <h4 className="font-bold text-[#451a03] uppercase tracking-wide text-[10px] mb-0.5">
                  {isOdia ? 'ଐତିହାସିକ ଗୁରୁତ୍ୱ (Significance)' : 'Historical Significance'}
                </h4>
                <p className="text-stone-800 leading-relaxed text-[11px]">
                  {currentFrame.ruler.historicalSignificance}
                </p>
              </div>

              {/* Did You Know? / Interesting Facts */}
              {currentFrame.ruler.interestingFacts && currentFrame.ruler.interestingFacts.length > 0 && (
                <div className="bg-amber-50 p-2.5 rounded-lg border border-amber-400/40">
                  <h4 className="font-bold text-amber-900 uppercase tracking-wide text-[10px] flex items-center space-x-1 mb-0.5">
                    <HelpCircle className="w-3 h-3 text-amber-700" />
                    <span>{isOdia ? 'ଆପଣ ଜାଣନ୍ତି କି?' : 'Did You Know?'}</span>
                  </h4>
                  <p className="text-stone-800 text-[11px] italic leading-relaxed">
                    "{currentFrame.ruler.interestingFacts[0]}"
                  </p>
                </div>
              )}

              {/* Teacher Tip Card */}
              <div className="bg-[#f4eedb] border border-amber-800/20 rounded-lg p-2 text-center text-[10px] text-stone-600">
                <span>
                  {isOdia
                    ? '💡 ମାନଚିତ୍ରରେ କ୍ଲିକ୍ କରି ପ୍ରତ୍ୟେକ ପ୍ରଦେଶର ବିସ୍ତୃତ ତଥ୍ୟ ଦେଖନ୍ତୁ।'
                    : '💡 Click any region on the map for in-depth historical analysis.'}
                </span>
              </div>

            </div>

          </div>

        </div>
      ) : (
        /* ========================================================= */
        /* CHRONOLOGICAL EVENT TIMELINE TABLE VIEW                   */
        /* ========================================================= */
        <div className="flex-1 min-h-0 bg-[#fcf8ed] border-2 border-amber-800/30 rounded-xl p-3 sm:p-4 shadow-md flex flex-col overflow-hidden">
          <div className="flex items-center justify-between pb-2 border-b border-amber-800/20 mb-2 shrink-0">
            <div>
              <h2 className="text-base font-bold text-[#451a03]">
                {isOdia ? 'ସମ୍ପୂର୍ଣ୍ଣ ସମୟକ୍ରମ ସାରଣୀ ଓ ଘଟଣାବଳୀ' : 'Chronological Timeline Table'}
              </h2>
              <p className="font-sans text-[11px] text-stone-600">
                {isOdia
                  ? 'ଯେକୌଣସି ଘଟଣାରେ କ୍ଲିକ୍ କଲେ ସିଧାସଳଖ ସେହି ଐତିହାସିକ ପର୍ଯ୍ୟାୟର ମାନଚିତ୍ର ପ୍ରଦର୍ଶିତ ହେବ।'
                  : 'Click on any event to jump directly to its map stage.'}
              </p>
            </div>
            <button
              onClick={() => setViewMode('map')}
              className="bg-amber-800 hover:bg-amber-900 text-amber-50 px-3 py-1.5 rounded-lg text-xs font-sans font-bold flex items-center space-x-1 shadow-xs transition"
            >
              <MapIcon className="w-3.5 h-3.5" />
              <span>{isOdia ? 'ମାନଚିତ୍ରକୁ ଫେରନ୍ତୁ' : 'Back to Map'}</span>
            </button>
          </div>

          <div className="flex-1 min-h-0 overflow-auto scrollbar-thin">
            <table className="w-full text-left font-sans text-xs border-collapse">
              <thead className="sticky top-0 bg-[#f4eedb] text-amber-950 uppercase font-bold border-b border-amber-800/30 shadow-xs">
                <tr>
                  <th className="p-2.5">{isOdia ? 'ବର୍ଷ / ସମୟ' : 'Year'}</th>
                  <th className="p-2.5">{isOdia ? 'ଐତିହାସିକ ଘଟଣା' : 'Event'}</th>
                  <th className="p-2.5">{isOdia ? 'ଶାସକ' : 'Ruler'}</th>
                  <th className="p-2.5">{isOdia ? 'ସ୍ଥାନ' : 'Location'}</th>
                  <th className="p-2.5">{isOdia ? 'ବିବରଣୀ' : 'Description'}</th>
                  <th className="p-2.5">{isOdia ? 'ପ୍ରଭାବ' : 'Impact'}</th>
                  <th className="p-2.5 text-center">{isOdia ? 'ପଦକ୍ଷେପ' : 'Action'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-amber-800/15">
                {currentMap.events.map((ev, eIdx) => (
                  <tr key={eIdx} className="hover:bg-[#f5edd6] transition">
                    <td className="p-2.5 font-bold text-amber-900 whitespace-nowrap">{ev.year}</td>
                    <td className="p-2.5 font-bold text-stone-900">{ev.eventTitle}</td>
                    <td className="p-2.5 text-stone-800">{ev.ruler}</td>
                    <td className="p-2.5 text-stone-700">{ev.location}</td>
                    <td className="p-2.5 text-stone-800 leading-relaxed max-w-xs">{ev.description}</td>
                    <td className="p-2.5 text-stone-700 leading-relaxed max-w-xs">{ev.impact}</td>
                    <td className="p-2.5 text-center">
                      <button
                        onClick={() => {
                          setActiveFrameIndex(ev.frameIndex);
                          setViewMode('map');
                        }}
                        className="bg-amber-800/10 hover:bg-amber-800 text-amber-950 hover:text-amber-50 px-2 py-0.5 rounded font-bold text-[10px] transition"
                      >
                        {isOdia ? 'ଦେଖନ୍ତୁ' : 'View'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* CLICKED HISTORICAL REGION DETAIL MODAL                     */}
      {/* ========================================================= */}
      {selectedRegion && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in font-sans">
          <div className="bg-[#fcf8ed] border-4 border-amber-800 rounded-3xl max-w-2xl w-full max-h-[88vh] overflow-y-auto shadow-2xl p-5 sm:p-6 relative text-stone-900 scrollbar-thin">
            
            <button
              onClick={() => setSelectedRegion(null)}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-[#f4eedb] hover:bg-amber-800 hover:text-amber-50 text-stone-700 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="border-b border-amber-800/20 pb-3 mb-3">
              <div className="flex items-center space-x-2">
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${getPoliticalStatusBadge(selectedRegion.politicalStatus).bg}`}>
                  {getPoliticalStatusBadge(selectedRegion.politicalStatus).label}
                </span>
                <span className="text-xs font-bold text-amber-900 bg-amber-100 px-2 py-0.5 rounded-full">
                  {selectedRegion.conquestYear}
                </span>
              </div>
              <h2 className="text-xl font-bold text-[#451a03] mt-1.5">
                {selectedRegion.name}
              </h2>
              <div className="flex items-center space-x-1.5 text-xs text-stone-600 mt-0.5">
                <MapPin className="w-3.5 h-3.5 text-amber-800" />
                <span className="font-semibold">{selectedRegion.modernLocation}</span>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="bg-[#f4eedb] p-2.5 rounded-xl border border-amber-800/20">
                  <span className="text-[10px] text-stone-600 block uppercase font-bold">
                    {isFigureOrMovement 
                      ? (isOdia ? 'ପୃଷ୍ଠଭୂମି / ଐତିହାସିକ ଅଞ୍ଚଳ' : 'Historical Context / Region') 
                      : (isOdia ? 'ପୂର୍ବ ଶାସକ / ରାଜବଂଶ' : 'Previous Ruler / Dynasty')}
                  </span>
                  <span className="font-bold text-stone-900 text-xs mt-0.5 block">
                    {selectedRegion.previousRulerOrDynasty}
                  </span>
                </div>
                <div className="bg-[#f4eedb] p-2.5 rounded-xl border border-amber-800/20">
                  <span className="text-[10px] text-stone-600 block uppercase font-bold">
                    {isFigureOrMovement 
                      ? (isOdia ? 'ପ୍ରମୁଖ ନେତା / ସଂଗଠକ' : 'Key Leader / Organizer') 
                      : (isOdia ? 'ବିଜୟୀ ସମ୍ରାଟ / ସେନାପତି' : 'Conquering Ruler')}
                  </span>
                  <span className="font-bold text-amber-900 text-xs mt-0.5 block">
                    {selectedRegion.conqueringRuler}
                  </span>
                </div>
              </div>

              {selectedRegion.battlesInvolved && (
                <div className="bg-rose-50 p-2.5 rounded-xl border border-rose-300">
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
                <h4 className="font-bold text-amber-950 uppercase tracking-wide text-xs mb-0.5">
                  {isOdia ? '୧. ଐତିହାସିକ ପୃଷ୍ଠଭୂମି' : '1. Historical Background'}
                </h4>
                <p className="text-stone-800 leading-relaxed bg-[#fbf7ee] p-2.5 rounded-xl border border-amber-800/15">
                  {selectedRegion.historicalBackground}
                </p>
              </div>

              <div>
                <h4 className="font-bold text-amber-950 uppercase tracking-wide text-xs mb-0.5">
                  {isFigureOrMovement 
                    ? (isOdia ? '୨. ଆନ୍ଦୋଳନର ଲକ୍ଷ୍ୟ ଓ ଉଦ୍ଦେଶ୍ୟ' : '2. Significance & Objectives') 
                    : (isOdia ? '୨. ବିଜୟର ଉଦ୍ଦେଶ୍ୟ ଓ କାରଣ' : '2. Strategic Reasons')}
                </h4>
                <p className="text-stone-800 leading-relaxed bg-[#fbf7ee] p-2.5 rounded-xl border border-amber-800/15">
                  {selectedRegion.conquestReasons}
                </p>
              </div>

              <div>
                <h4 className="font-bold text-amber-950 uppercase tracking-wide text-xs mb-0.5">
                  {isOdia ? '୩. ଐତିହାସିକ ମହତ୍ତ୍ୱ' : '3. Significance'}
                </h4>
                <p className="text-stone-800 leading-relaxed bg-[#fbf7ee] p-2.5 rounded-xl border border-amber-800/15">
                  {selectedRegion.historicalSignificance}
                </p>
              </div>

              <div>
                <h4 className="font-bold text-amber-950 uppercase tracking-wide text-xs mb-0.5">
                  {isOdia ? '୪. ବିଜୟ ପରବର୍ତ୍ତୀ ପରିସ୍ଥିତି' : '4. Aftermath'}
                </h4>
                <p className="text-stone-800 leading-relaxed bg-[#fbf7ee] p-2.5 rounded-xl border border-amber-800/15">
                  {selectedRegion.aftermathAndRebellions}
                </p>
              </div>
            </div>

            <div className="mt-4 pt-2.5 border-t border-amber-800/20 flex justify-end">
              <button
                onClick={() => setSelectedRegion(null)}
                className="bg-amber-800 hover:bg-amber-900 text-amber-50 px-4 py-1.5 rounded-xl font-bold text-xs transition"
              >
                {isOdia ? 'ବନ୍ଦ କରନ୍ତୁ' : 'Close'}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* AI HISTORICAL MAP GENERATOR DIALOG                        */}
      {/* ========================================================= */}
      {isGeneratorOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in font-sans">
          <div className="bg-[#fcf8ed] border-4 border-amber-800 rounded-3xl max-w-lg w-full shadow-2xl p-5 text-stone-900 relative">
            
            <button
              onClick={() => setIsGeneratorOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-[#f4eedb] hover:bg-amber-800 hover:text-amber-50 text-stone-700 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-2.5 mb-3">
              <div className="p-2 rounded-xl bg-amber-800 text-amber-100">
                <Sparkles className="w-5 h-5 text-amber-300" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-[#451a03]">
                  {isOdia ? 'AI ଐତିହାସିକ ମାନଚିତ୍ର ପ୍ରସ୍ତୁତି' : 'Generate Map with AI'}
                </h2>
                <p className="text-[11px] text-stone-600">
                  {isOdia
                    ? 'ଯେକୌଣସି ସାମ୍ରାଜ୍ୟ ବା ଐତିହାସିକ ବିଷୟ ଦେଇ ଆନିମେଟେଡ୍ ମାନଚିତ୍ର ସୃଷ୍ଟି କରନ୍ତୁ।'
                    : 'Enter any empire or dynasty to generate a flipbook animated map.'}
                </p>
              </div>
            </div>

            {generationError && (
              <div className="mb-3 p-2.5 bg-rose-100 border border-rose-400 text-rose-800 rounded-xl text-xs">
                {generationError}
              </div>
            )}

            <form onSubmit={handleGenerateMap} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-amber-950 uppercase mb-0.5">
                  {isOdia ? 'ଐତିହାସିକ ସାମ୍ରାଜ୍ୟ / ବିଷୟ *' : 'Empire / Topic *'}
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Delhi Sultanate, Chola Empire, Maratha Confederacy..."
                  value={aiTopic}
                  onChange={(e) => setAiTopic(e.target.value)}
                  className="w-full bg-[#fbf7ee] text-stone-900 border border-amber-800/30 rounded-xl p-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-amber-700"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-amber-950 uppercase mb-0.5">
                  {isOdia ? 'ସମୟସୀମା' : 'Era / Year Range (Optional)'}
                </label>
                <input
                  type="text"
                  placeholder="e.g., 1206–1526 CE"
                  value={aiYearRange}
                  onChange={(e) => setAiYearRange(e.target.value)}
                  className="w-full bg-[#fbf7ee] text-stone-900 border border-amber-800/30 rounded-xl p-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-amber-700"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-amber-950 uppercase mb-0.5">
                  {isOdia ? 'ଶିକ୍ଷକଙ୍କ ନିର୍ଦ୍ଦେଶ / ଯୁଦ୍ଧ' : 'Teacher Notes (Optional)'}
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g., Highlight Khalji southern conquests..."
                  value={aiNotes}
                  onChange={(e) => setAiNotes(e.target.value)}
                  className="w-full bg-[#fbf7ee] text-stone-900 border border-amber-800/30 rounded-xl p-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-amber-700 resize-none"
                />
              </div>

              <div className="pt-1 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsGeneratorOpen(false)}
                  className="px-3 py-1.5 rounded-xl border border-stone-300 font-semibold text-xs text-stone-700 hover:bg-stone-100 transition"
                >
                  {isOdia ? 'ବାତିଲ' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={isGenerating || !aiTopic.trim()}
                  className="bg-gradient-to-r from-amber-700 to-amber-900 hover:from-amber-800 hover:to-amber-950 text-amber-50 px-4 py-1.5 rounded-xl font-bold text-xs flex items-center space-x-1.5 shadow-xs transition disabled:opacity-50"
                >
                  {isGenerating ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-amber-200 border-t-transparent rounded-full animate-spin"></div>
                      <span>{isOdia ? 'ପ୍ରସ୍ତୁତ ହେଉଛି...' : 'Generating...'}</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                      <span>{isOdia ? 'ମାନଚିତ୍ର ତିଆରି କରନ୍ତୁ' : 'Generate Map'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
};
