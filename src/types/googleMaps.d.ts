// Type declarations for Google Maps Platform JavaScript API

declare namespace google.maps {
  export class Map {
    constructor(mapDiv: HTMLElement, opts?: MapOptions);
    setCenter(latLng: LatLng | LatLngLiteral): void;
    setZoom(zoom: number): void;
    setMapTypeId(mapTypeId: string | MapTypeId): void;
    fitBounds(bounds: LatLngBounds | LatLngBoundsLiteral, padding?: number | Padding): void;
    panTo(latLng: LatLng | LatLngLiteral): void;
    getBounds(): LatLngBounds | undefined;
    getZoom(): number | undefined;
    getCenter(): LatLng | undefined;
    addListener(eventName: string, handler: (...args: any[]) => void): MapsEventListener;
  }

  export interface MapOptions {
    center?: LatLng | LatLngLiteral;
    zoom?: number;
    mapTypeId?: string | MapTypeId;
    disableDefaultUI?: boolean;
    zoomControl?: boolean;
    mapTypeControl?: boolean;
    scaleControl?: boolean;
    streetViewControl?: boolean;
    rotateControl?: boolean;
    fullscreenControl?: boolean;
    styles?: MapTypeStyle[];
    gestureHandling?: string;
  }

  export enum MapTypeId {
    ROADMAP = 'roadmap',
    SATELLITE = 'satellite',
    HYBRID = 'hybrid',
    TERRAIN = 'terrain'
  }

  export interface MapTypeStyle {
    elementType?: string;
    featureType?: string;
    stylers?: any[];
  }

  export interface Padding {
    bottom?: number;
    left?: number;
    right?: number;
    top?: number;
  }

  export class LatLng {
    constructor(lat: number, lng: number, noWrap?: boolean);
    lat(): number;
    lng(): number;
  }

  export interface LatLngLiteral {
    lat: number;
    lng: number;
  }

  export class LatLngBounds {
    constructor(sw?: LatLng | LatLngLiteral, ne?: LatLng | LatLngLiteral);
    extend(point: LatLng | LatLngLiteral): LatLngBounds;
    getCenter(): LatLng;
    isEmpty(): boolean;
  }

  export interface LatLngBoundsLiteral {
    east: number;
    north: number;
    south: number;
    west: number;
  }

  export class Marker {
    constructor(opts?: MarkerOptions);
    setMap(map: Map | null): void;
    setPosition(latLng: LatLng | LatLngLiteral): void;
    setTitle(title: string): void;
    setIcon(icon: string | Icon | Symbol): void;
    addListener(eventName: string, handler: (...args: any[]) => void): MapsEventListener;
    setAnimation(animation: any): void;
  }

  export interface MarkerOptions {
    position?: LatLng | LatLngLiteral;
    map?: Map;
    title?: string;
    icon?: string | Icon | Symbol;
    label?: string | MarkerLabel;
    animation?: any;
    zIndex?: number;
  }

  export interface MarkerLabel {
    text: string;
    color?: string;
    fontFamily?: string;
    fontSize?: string;
    fontWeight?: string;
  }

  export interface Icon {
    url: string;
    scaledSize?: Size;
    size?: Size;
    origin?: Point;
    anchor?: Point;
  }

  export interface Symbol {
    path: SymbolPath | string;
    fillColor?: string;
    fillOpacity?: number;
    scale?: number;
    strokeColor?: string;
    strokeOpacity?: number;
    strokeWeight?: number;
    anchor?: Point;
  }

  export enum SymbolPath {
    BACKWARD_CLOSED_ARROW = 3,
    BACKWARD_OPEN_ARROW = 4,
    CIRCLE = 0,
    FORWARD_CLOSED_ARROW = 1,
    FORWARD_OPEN_ARROW = 2
  }

  export class Point {
    constructor(x: number, y: number);
    x: number;
    y: number;
  }

  export class Size {
    constructor(width: number, height: number, widthUnit?: string, heightUnit?: string);
    width: number;
    height: number;
  }

  export class Polygon {
    constructor(opts?: PolygonOptions);
    setMap(map: Map | null): void;
    setPaths(paths: (LatLng | LatLngLiteral)[] | (LatLng | LatLngLiteral)[][]): void;
    setOptions(options: PolygonOptions): void;
    addListener(eventName: string, handler: (...args: any[]) => void): MapsEventListener;
  }

  export interface PolygonOptions {
    paths?: (LatLng | LatLngLiteral)[] | (LatLng | LatLngLiteral)[][];
    strokeColor?: string;
    strokeOpacity?: number;
    strokeWeight?: number;
    fillColor?: string;
    fillOpacity?: number;
    zIndex?: number;
    clickable?: boolean;
  }

  export class Polyline {
    constructor(opts?: PolylineOptions);
    setMap(map: Map | null): void;
    setPath(path: (LatLng | LatLngLiteral)[]): void;
    setOptions(options: PolylineOptions): void;
    addListener(eventName: string, handler: (...args: any[]) => void): MapsEventListener;
  }

  export interface PolylineOptions {
    path?: (LatLng | LatLngLiteral)[];
    strokeColor?: string;
    strokeOpacity?: number;
    strokeWeight?: number;
    geodesic?: boolean;
    icons?: IconSequence[];
    zIndex?: number;
  }

  export interface IconSequence {
    icon?: Symbol;
    offset?: string;
    repeat?: string;
  }

  export class InfoWindow {
    constructor(opts?: InfoWindowOptions);
    open(options?: InfoWindowOpenOptions | Map, anchor?: any): void;
    close(): void;
    setContent(content: string | HTMLElement): void;
    setPosition(position: LatLng | LatLngLiteral): void;
  }

  export interface InfoWindowOptions {
    content?: string | HTMLElement;
    position?: LatLng | LatLngLiteral;
    maxWidth?: number;
  }

  export interface InfoWindowOpenOptions {
    map?: Map;
    anchor?: Marker;
    shouldFocus?: boolean;
  }

  export interface MapsEventListener {
    remove(): void;
  }

  export namespace event {
    export function clearInstanceListeners(instance: any): void;
    export function trigger(instance: any, eventName: string, ...args: any[]): void;
  }
}

interface Window {
  google?: {
    maps: typeof google.maps;
  };
  initGoogleMapsCallback?: () => void;
}
