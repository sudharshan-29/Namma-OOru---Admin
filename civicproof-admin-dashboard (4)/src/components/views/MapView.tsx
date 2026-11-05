import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { FeatureCollection, LineString } from 'geojson';
import {
  Search,
  Plus,
  Minus,
  LocateFixed,
  Calendar,
  ChevronDown,
  AlertTriangle,
  X,
  MapPin,
  CheckCircle2,
} from 'lucide-react';
import type { StatsResponse } from '../../api/client';
import type { Complaint } from '../../types/civic';

// Ensure MapLibre Web Worker resolves correctly
if (typeof window !== 'undefined') {
  maplibregl.setWorkerUrl('/maplibre-gl-worker.mjs');
}

interface MapViewProps {
  stats: StatsResponse | null;
  isLoading: boolean;
  complaints?: Complaint[];
  onNavigateToVerification?: () => void;
  onNavigateToInProgress?: () => void;
  onNavigateToAllComplaints?: () => void;
  onSelectComplaint?: (complaint: Complaint) => void;
  onOpenReportIssue?: () => void;
}

// Exact Chennai Metropolitan center and framing matching reference screenshot
const CHENNAI_CENTER: [number, number] = [80.20, 13.045];
const DEFAULT_ZOOM = 11.4;
const OPENFREEMAP_STYLE = 'https://tiles.openfreemap.org/styles/liberty';

// Key Chennai Localities for Instant Geo-Search
interface ChennaiLocality {
  name: string;
  category: string;
  coordinates: [number, number];
  zoom: number;
}

const CHENNAI_LOCALITIES: ChennaiLocality[] = [
  { name: 'Anna Nagar', category: 'Residential / Commercial', coordinates: [80.209, 13.085], zoom: 14.5 },
  { name: 'T. Nagar (Thyagaraya Nagar)', category: 'Commercial Hub', coordinates: [80.233, 13.041], zoom: 14.5 },
  { name: 'Marina Beach', category: 'Coastal Landmark', coordinates: [80.282, 13.050], zoom: 14.5 },
  { name: 'Guindy National Park', category: 'Park & Sanctuary', coordinates: [80.220, 13.009], zoom: 14.5 },
  { name: 'Adyar', category: 'South Chennai Hub', coordinates: [80.257, 13.006], zoom: 14.5 },
  { name: 'Besant Nagar (Elliot’s Beach)', category: 'Coastal Promenade', coordinates: [80.269, 13.000], zoom: 14.5 },
  { name: 'Mylapore', category: 'Cultural Heritage Zone', coordinates: [80.267, 13.036], zoom: 14.5 },
  { name: 'Egmore', category: 'Transit Hub', coordinates: [80.260, 13.078], zoom: 14.5 },
  { name: 'Chennai Central', category: 'Railway Terminus', coordinates: [80.275, 13.082], zoom: 14.5 },
  { name: 'Chennai International Airport', category: 'Airport & Transit', coordinates: [80.170, 12.990], zoom: 14.5 },
  { name: 'Velachery', category: 'South Suburban Zone', coordinates: [80.217, 12.978], zoom: 14.5 },
  { name: 'Koyambedu (CMBT)', category: 'Bus Terminus / Market', coordinates: [80.194, 13.069], zoom: 14.5 },
  { name: 'Nungambakkam', category: 'Central Chennai Hub', coordinates: [80.241, 13.059], zoom: 14.5 },
  { name: 'Kodambakkam', category: 'Cinema & Central Hub', coordinates: [80.223, 13.052], zoom: 14.5 },
  { name: 'Vadapalani', category: 'Commercial & Temple', coordinates: [80.213, 13.050], zoom: 14.5 },
  { name: 'Porur', category: 'West Chennai Corridor', coordinates: [80.158, 13.038], zoom: 14 },
  { name: 'Alandur', category: 'Metro Junction', coordinates: [80.203, 13.003], zoom: 14.5 },
  { name: 'Chromepet', category: 'GST Road Hub', coordinates: [80.141, 12.951], zoom: 14 },
  { name: 'Tambaram', category: 'South Railway Junction', coordinates: [80.127, 12.924], zoom: 14 },
  { name: 'Poonamallee', category: 'West Suburban Arterial', coordinates: [80.093, 13.048], zoom: 13.5 },
  { name: 'Ambattur', category: 'Industrial Estate', coordinates: [80.161, 13.114], zoom: 14 },
  { name: 'Kolathur', category: 'North Chennai Residential', coordinates: [80.218, 13.123], zoom: 14 },
  { name: 'Perambur', category: 'Locomotive Hub', coordinates: [80.243, 13.111], zoom: 14 },
  { name: 'Puzhal Lake / Red Hills', category: 'Water Reservoir', coordinates: [80.195, 13.185], zoom: 13.5 },
  { name: 'Sholinganallur', category: 'OMR IT Corridor', coordinates: [80.227, 12.901], zoom: 14 },
  { name: 'Pallikaranai Marsh', category: 'Wetland Reserve', coordinates: [80.214, 12.934], zoom: 14 },
  { name: 'Medavakkam', category: 'South Residential Corridor', coordinates: [80.190, 12.919], zoom: 14 },
];

// Key Landmarks, Highway Shields & Geographic Badges matching reference screenshot
interface MapLandmark {
  id: string;
  type: 'city' | 'shield' | 'transit' | 'park' | 'water';
  coordinates: [number, number];
  title: string;
  subtitle?: string;
  icon?: string;
}

const CHENNAI_MAP_LANDMARKS: MapLandmark[] = [
  // Central Bold City Title
  {
    id: 'chennai-city',
    type: 'city',
    coordinates: [80.245, 13.065],
    title: 'Chennai',
  },
  // Highway Shields (Golden Amber)
  {
    id: 'shield-nh48',
    type: 'shield',
    coordinates: [80.198, 13.058],
    title: 'NH 48',
  },
  {
    id: 'shield-nh16-north',
    type: 'shield',
    coordinates: [80.220, 13.162],
    title: 'NH 16',
  },
  {
    id: 'shield-nh16-west',
    type: 'shield',
    coordinates: [80.088, 13.045],
    title: 'NH 16',
  },
  {
    id: 'shield-nh32',
    type: 'shield',
    coordinates: [80.262, 13.125],
    title: 'NH 32',
  },
  // Transit Hubs
  {
    id: 'chennai-central',
    type: 'transit',
    coordinates: [80.2755, 13.0827],
    title: 'Chennai Central',
    icon: 'train',
  },
  {
    id: 'chennai-egmore',
    type: 'transit',
    coordinates: [80.2610, 13.0780],
    title: 'Chennai Egmore',
    icon: 'train-dark',
  },
  {
    id: 'koyambedu-bus',
    type: 'transit',
    coordinates: [80.1940, 13.0685],
    title: 'Koyambedu',
    subtitle: 'Bus Terminus',
    icon: 'bus',
  },
  {
    id: 'chennai-airport',
    type: 'transit',
    coordinates: [80.1700, 12.9900],
    title: 'Chennai International',
    subtitle: 'Airport',
    icon: 'plane',
  },
  // Coastal Landmarks & Parks
  {
    id: 'marina-beach',
    type: 'park',
    coordinates: [80.2830, 13.0500],
    title: 'Marina Beach',
  },
  {
    id: 'besant-nagar',
    type: 'park',
    coordinates: [80.2690, 13.0000],
    title: 'Besant Nagar',
  },
  {
    id: 'elliots-beach',
    type: 'park',
    coordinates: [80.2700, 12.9720],
    title: "Elliot's Beach",
  },
  {
    id: 'guindy-park',
    type: 'park',
    coordinates: [80.2210, 13.0090],
    title: 'Guindy National',
    subtitle: 'Park',
  },
  // Water Bodies
  {
    id: 'puzhal-lake',
    type: 'water',
    coordinates: [80.1950, 13.1850],
    title: 'Puzhal Lake',
  },
  {
    id: 'chembarambakkam-lake',
    type: 'water',
    coordinates: [80.0550, 13.0100],
    title: 'Chembarambakkam Lake',
  },
  {
    id: 'pallikaranai-marsh',
    type: 'water',
    coordinates: [80.2140, 12.9340],
    title: 'Pallikaranai Marsh',
  },
];

export const MapView: React.FC<MapViewProps> = ({
  stats,
  isLoading,
  complaints = [],
  onSelectComplaint,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const popupRef = useRef<maplibregl.Popup | null>(null);
  const isInitializedRef = useRef<boolean>(false);

  // Stable reference to onSelectComplaint
  const onSelectComplaintRef = useRef(onSelectComplaint);
  useEffect(() => {
    onSelectComplaintRef.current = onSelectComplaint;
  }, [onSelectComplaint]);

  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Date Filter State
  const [dateFilter, setDateFilter] = useState<'Last 7 Days' | 'Last 30 Days' | 'Last 90 Days' | 'All Time'>('Last 30 Days');
  const [dateDropdownOpen, setDateDropdownOpen] = useState(false);
  const dateDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dateDropdownRef.current && !dateDropdownRef.current.contains(event.target as Node)) {
        setDateDropdownOpen(false);
      }
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setSearchFocused(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter complaints according to date filter
  const filteredComplaints = useMemo(() => {
    if (dateFilter === 'All Time') return complaints;
    const now = new Date();
    const days = dateFilter === 'Last 7 Days' ? 7 : dateFilter === 'Last 30 Days' ? 30 : 90;
    const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

    return complaints.filter((c) => {
      if (!c.submissionTimestamp) return true;
      const t = new Date(c.submissionTimestamp);
      return !isNaN(t.getTime()) ? t >= cutoff : true;
    });
  }, [complaints, dateFilter]);

  // Autocomplete search suggestions
  const searchSuggestions = useMemo<{
    matchedLocations: ChennaiLocality[];
    matchedComplaints: Complaint[];
  }>(() => {
    if (!searchQuery.trim()) return { matchedLocations: [], matchedComplaints: [] };
    const q = searchQuery.toLowerCase().trim();

    const matchedLocations = CHENNAI_LOCALITIES.filter((loc) =>
      loc.name.toLowerCase().includes(q)
    ).slice(0, 5);

    const matchedComplaints = complaints
      .filter(
        (c) =>
          c.id.toLowerCase().includes(q) ||
          c.category.toLowerCase().includes(q) ||
          c.location?.address?.toLowerCase().includes(q)
      )
      .slice(0, 4);

    return { matchedLocations, matchedComplaints };
  }, [searchQuery, complaints]);

  // Open rich popup for a complaint
  const openComplaintPopup = useCallback((complaint: Complaint) => {
    if (!mapRef.current) return;
    const { lng, lat } = complaint.location.coordinates;

    if (popupRef.current) {
      popupRef.current.remove();
    }

    const isResolved = complaint.status === 'Resolved';
    const isInProgress = complaint.status === 'In Progress' || complaint.status === 'Assigned';

    const statusBadge = isResolved
      ? 'bg-sky-950 text-sky-300 border-sky-500/40'
      : isInProgress
      ? 'bg-amber-950 text-amber-300 border-amber-500/40'
      : 'bg-rose-950 text-rose-300 border-rose-500/40';

    const priorityBadge =
      complaint.priority === 'Critical'
        ? 'bg-rose-950 text-rose-300 border-rose-500/50'
        : complaint.priority === 'High'
        ? 'bg-amber-950 text-amber-300 border-amber-500/50'
        : 'bg-slate-800 text-slate-300 border-slate-700';

    const displayId = complaint.id.match(/(\d{4})$/)?.[1] || complaint.id;

    const popupNode = document.createElement('div');
    popupNode.className =
      'namma-map-popup p-3 text-xs space-y-2 max-w-[290px] rounded-2xl shadow-2xl border border-cyan-500/30 text-white';
    popupNode.style.backgroundColor = 'rgba(5, 36, 51, 0.95)';
    popupNode.style.backdropFilter = 'blur(16px)';
    popupNode.innerHTML = `
      <div class="flex items-center justify-between gap-2 border-b border-cyan-500/20 pb-2">
        <span class="font-mono font-bold text-cyan-300 text-xs">#${displayId}</span>
        <span class="text-[10px] font-bold px-2 py-0.5 rounded-full border ${priorityBadge}">
          ${complaint.priority}
        </span>
      </div>

      <div class="space-y-1 pt-1">
        <div class="font-bold text-white text-sm">${complaint.category}</div>
        <div class="text-white/80 line-clamp-2 text-[11.5px] leading-relaxed">${complaint.description || 'Civic infrastructure report filed'}</div>
        <div class="text-white/60 font-mono text-[10.5px] pt-1 flex items-center gap-1.5">
          <span class="w-2 h-2 rounded-full ${isResolved ? 'bg-sky-400' : isInProgress ? 'bg-amber-400' : 'bg-[#FF173B]'}"></span>
          ${complaint.location?.address || 'Chennai Metro'}
        </div>
      </div>

      <div class="flex items-center justify-between text-[10.5px] pt-2 border-t border-cyan-500/20">
        <span class="px-2 py-0.5 rounded-full font-bold border ${statusBadge}">
          ${complaint.status}
        </span>
        <span class="text-white/70 truncate max-w-[130px]" title="${complaint.assignedDepartment || ''}">
          ${complaint.assignedDepartment ? complaint.assignedDepartment.replace('Department', 'Dept.') : 'Pending Dept'}
        </span>
      </div>

      <div class="pt-2">
        <button id="btn-inspect-${complaint.id}" class="w-full py-2 px-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition shadow cursor-pointer">
          <span>Inspect Complaint Detail</span>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
        </button>
      </div>
    `;

    const inspectBtn = popupNode.querySelector(`#btn-inspect-${complaint.id}`);
    if (inspectBtn) {
      inspectBtn.addEventListener('click', () => {
        if (onSelectComplaintRef.current) {
          onSelectComplaintRef.current(complaint);
        }
        if (popupRef.current) popupRef.current.remove();
      });
    }

    popupRef.current = new maplibregl.Popup({
      closeButton: true,
      closeOnClick: false,
      maxWidth: '310px',
      offset: [0, -10],
    })
      .setLngLat([lng, lat])
      .setDOMContent(popupNode)
      .addTo(mapRef.current);
  }, []);

  const landmarksRef = useRef<maplibregl.Marker[]>([]);

  // Render Landmark HTML element
  const renderLandmarkElement = useCallback((landmark: MapLandmark): HTMLElement => {
    const el = document.createElement('div');
    el.className = 'namma-map-landmark select-none pointer-events-none';

    if (landmark.type === 'city') {
      el.innerHTML = `
        <div style="
          font-family: system-ui, -apple-system, sans-serif;
          font-size: 22px;
          font-weight: 800;
          color: #0f172a;
          letter-spacing: -0.02em;
          text-shadow: 0 1px 4px rgba(255,255,255,0.95), 0 0 12px rgba(255,255,255,0.95);
          user-select: none;
        ">
          ${landmark.title}
        </div>
      `;
    } else if (landmark.type === 'shield') {
      el.innerHTML = `
        <div style="
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: #f59e0b;
          color: #0f172a;
          font-family: ui-monospace, SFMono-Regular, monospace;
          font-size: 9.5px;
          font-weight: 800;
          letter-spacing: 0.04em;
          padding: 1.5px 5.5px;
          border-radius: 6px;
          border: 1.5px solid #d97706;
          box-shadow: 0 1px 3px rgba(0,0,0,0.25);
          user-select: none;
        ">
          ${landmark.title}
        </div>
      `;
    } else if (landmark.type === 'transit') {
      el.innerHTML = `
        <div style="
          display: inline-flex;
          align-items: center;
          gap: 3.5px;
          background: rgba(255, 255, 255, 0.94);
          border: 1px solid rgba(15, 23, 42, 0.18);
          border-radius: 6px;
          padding: 2px 5px;
          font-family: system-ui, sans-serif;
          font-size: 10px;
          font-weight: 600;
          color: #1e293b;
          box-shadow: 0 1px 3px rgba(0,0,0,0.12);
          white-space: nowrap;
          user-select: none;
        ">
          <span style="color: #0284c7; font-size: 10px;">●</span>
          <span>${landmark.title}${landmark.subtitle ? ' ' + landmark.subtitle : ''}</span>
        </div>
      `;
    } else if (landmark.type === 'park') {
      el.innerHTML = `
        <div style="
          display: inline-flex;
          align-items: center;
          gap: 3.5px;
          background: rgba(255, 255, 255, 0.92);
          border: 1px solid #10b981;
          border-radius: 6px;
          padding: 2px 5px;
          font-family: system-ui, sans-serif;
          font-size: 9.5px;
          font-weight: 600;
          color: #047857;
          box-shadow: 0 1px 3px rgba(0,0,0,0.12);
          white-space: nowrap;
          user-select: none;
        ">
          <span style="width: 5px; height: 5px; border-radius: 50%; background: #10b981;"></span>
          <span>${landmark.title}</span>
        </div>
      `;
    } else {
      el.innerHTML = `
        <div style="
          display: inline-flex;
          align-items: center;
          gap: 3.5px;
          background: rgba(255, 255, 255, 0.90);
          border: 1px solid #0284c7;
          border-radius: 6px;
          padding: 2px 5px;
          font-family: system-ui, sans-serif;
          font-size: 9.5px;
          font-weight: 600;
          color: #0369a1;
          box-shadow: 0 1px 3px rgba(0,0,0,0.12);
          white-space: nowrap;
          user-select: none;
        ">
          <span>${landmark.title}</span>
        </div>
      `;
    }

    return el;
  }, []);

  // Map theme styling to match reference satellite/cartographic screenshot
  const applyMapTheme = useCallback((map: maplibregl.Map) => {
    // 1. Land & Background (warm soft cream/beige)
    if (map.getLayer('background')) {
      map.setPaintProperty('background', 'background-color', '#f4f1e8');
    }
    if (map.getLayer('landuse_residential')) {
      map.setPaintProperty('landuse_residential', 'fill-color', '#ebe7dc');
    }

    // 2. Ocean Water (deep azure/cerulean #1386c5)
    if (map.getLayer('water')) {
      map.setPaintProperty('water', 'fill-color', '#1386c5');
      map.setPaintProperty('water', 'fill-opacity', 0.95);
    }

    // 3. Rivers & Waterways (Cooum & Adyar rivers in bright cyan)
    if (map.getLayer('waterway_river')) {
      map.setPaintProperty('waterway_river', 'line-color', '#0ea5e9');
      map.setPaintProperty('waterway_river', 'line-width', ['interpolate', ['linear'], ['zoom'], 10, 2.5, 14, 5]);
    }
    if (map.getLayer('waterway_other')) {
      map.setPaintProperty('waterway_other', 'line-color', '#0ea5e9');
      map.setPaintProperty('waterway_other', 'line-width', 2);
    }
    if (map.getLayer('waterway_tunnel')) {
      map.setPaintProperty('waterway_tunnel', 'line-color', '#0284c7');
    }

    // 4. Sand & Coastal Beaches (Marina Beach, Besant Nagar golden sand strip)
    if (map.getLayer('landcover_sand')) {
      map.setPaintProperty('landcover_sand', 'fill-color', '#fde047');
      map.setPaintProperty('landcover_sand', 'fill-opacity', 0.85);
    }

    // 5. Parks and Green Reserves (vibrant emerald green)
    if (map.getLayer('park')) {
      map.setPaintProperty('park', 'fill-color', '#48bb78');
      map.setPaintProperty('park', 'fill-opacity', 0.65);
    }
    if (map.getLayer('landcover_wood')) {
      map.setPaintProperty('landcover_wood', 'fill-color', '#38a169');
      map.setPaintProperty('landcover_wood', 'fill-opacity', 0.55);
    }
    if (map.getLayer('landcover_grass')) {
      map.setPaintProperty('landcover_grass', 'fill-color', '#68d391');
      map.setPaintProperty('landcover_grass', 'fill-opacity', 0.5);
    }
    if (map.getLayer('landcover_wetland')) {
      map.setPaintProperty('landcover_wetland', 'fill-color', '#2dd4bf');
      map.setPaintProperty('landcover_wetland', 'fill-opacity', 0.6);
    }

    // 6. Major Arterials / Highways (Golden Amber matching reference screenshot)
    if (map.getLayer('road_motorway_casing')) {
      map.setPaintProperty('road_motorway_casing', 'line-color', '#d97706');
      map.setPaintProperty('road_motorway_casing', 'line-width', ['interpolate', ['linear'], ['zoom'], 10, 3, 14, 7]);
    }
    if (map.getLayer('road_motorway')) {
      map.setPaintProperty('road_motorway', 'line-color', '#f59e0b');
      map.setPaintProperty('road_motorway', 'line-width', ['interpolate', ['linear'], ['zoom'], 10, 2, 14, 5]);
    }
    if (map.getLayer('road_trunk_primary_casing')) {
      map.setPaintProperty('road_trunk_primary_casing', 'line-color', '#d97706');
      map.setPaintProperty('road_trunk_primary_casing', 'line-width', ['interpolate', ['linear'], ['zoom'], 10, 2.5, 14, 6]);
    }
    if (map.getLayer('road_trunk_primary')) {
      map.setPaintProperty('road_trunk_primary', 'line-color', '#fbbf24');
      map.setPaintProperty('road_trunk_primary', 'line-width', ['interpolate', ['linear'], ['zoom'], 10, 1.8, 14, 4.5]);
    }
    if (map.getLayer('road_motorway_link_casing')) {
      map.setPaintProperty('road_motorway_link_casing', 'line-color', '#d97706');
    }
    if (map.getLayer('road_motorway_link')) {
      map.setPaintProperty('road_motorway_link', 'line-color', '#fbbf24');
    }

    // 7. Secondary / Minor Streets (Crisp white with soft borders)
    if (map.getLayer('road_secondary_tertiary_casing')) {
      map.setPaintProperty('road_secondary_tertiary_casing', 'line-color', '#cbd5e1');
    }
    if (map.getLayer('road_secondary_tertiary')) {
      map.setPaintProperty('road_secondary_tertiary', 'line-color', '#ffffff');
    }
    if (map.getLayer('road_minor_casing')) {
      map.setPaintProperty('road_minor_casing', 'line-color', '#e2e8f0');
    }
    if (map.getLayer('road_minor')) {
      map.setPaintProperty('road_minor', 'line-color', '#ffffff');
    }
  }, []);

  // Initialize MapLibre GL instance
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapRef.current || isInitializedRef.current) return;

    isInitializedRef.current = true;

    try {
      const map = new maplibregl.Map({
        container: mapContainerRef.current,
        style: OPENFREEMAP_STYLE,
        center: CHENNAI_CENTER,
        zoom: DEFAULT_ZOOM,
        pitch: 0,
        bearing: 0,
        attributionControl: false,
      });

      // Compact attribution at bottom-right
      map.addControl(
        new maplibregl.AttributionControl({
          compact: true,
          customAttribution: '© OpenFreeMap © OpenStreetMap',
        }),
        'bottom-right'
      );

      map.on('load', () => {
        // Apply Map Theme colors to match reference satellite/cartographic screenshot
        applyMapTheme(map);

        // Mount landmarks, highway shields and badges
        CHENNAI_MAP_LANDMARKS.forEach((landmark) => {
          const el = renderLandmarkElement(landmark);
          const marker = new maplibregl.Marker({ element: el })
            .setLngLat(landmark.coordinates)
            .addTo(map);
          landmarksRef.current.push(marker);
        });
      });

      mapRef.current = map;
    } catch (err) {
      console.error('Failed to initialize MapLibre GL:', err);
    }

    return () => {
      landmarksRef.current.forEach((m) => m.remove());
      landmarksRef.current = [];
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        isInitializedRef.current = false;
      }
    };
  }, [applyMapTheme, renderLandmarkElement]);

  // Update Markers when complaints or date filter change
  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;

    // Clear existing markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    filteredComplaints.forEach((c) => {
      const { lng, lat } = c.location.coordinates;
      const isResolved = c.status === 'Resolved';
      const isInProgress = c.status === 'In Progress' || c.status === 'Assigned';

      const el = document.createElement('div');
      el.className = 'namma-complaint-marker cursor-pointer group';
      el.title = `${c.category} - ${c.status} (${c.id})`;

      if (isResolved) {
        // Resolved: Sky Blue dot
        el.innerHTML = `
          <div class="relative flex items-center justify-center transition-transform hover:scale-125">
            <span class="w-3.5 h-3.5 rounded-full bg-[#0284c7] border-2 border-white shadow-md flex items-center justify-center"></span>
          </div>
        `;
      } else if (isInProgress) {
        // In Progress: Yellow warning triangle (#FFC400)
        el.innerHTML = `
          <div class="relative flex items-center justify-center transition-transform hover:scale-125 drop-shadow-[0_0_6px_rgba(255,196,0,0.7)]">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="#FFC400" stroke="#FFC400" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
              <line x1="12" y1="9" x2="12" y2="13" stroke="#000" stroke-width="2.2"/>
              <line x1="12" y1="17" x2="12.01" y2="17" stroke="#000" stroke-width="2.5"/>
            </svg>
          </div>
        `;
      } else {
        // Unresolved: Bright red circular indicator (#FF173B, approx 23px)
        el.innerHTML = `
          <div class="relative flex items-center justify-center transition-transform hover:scale-125">
            <span class="absolute w-[23px] h-[23px] rounded-full bg-[#FF173B]/40 animate-ping"></span>
            <span class="w-[22px] h-[22px] rounded-full bg-[#FF173B] border-2 border-white shadow-[0_0_12px_rgba(255,23,59,0.8)] flex items-center justify-center"></span>
          </div>
        `;
      }

      el.addEventListener('click', (e) => {
        e.stopPropagation();
        openComplaintPopup(c);
      });

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([lng, lat])
        .addTo(map);

      markersRef.current.push(marker);
    });
  }, [filteredComplaints, openComplaintPopup]);

  // Search handler: Fly to location or complaint
  const handleSelectLocation = (loc: ChennaiLocality) => {
    if (!mapRef.current) return;
    mapRef.current.flyTo({
      center: loc.coordinates,
      zoom: loc.zoom,
      essential: true,
      duration: 1600,
    });
    setSearchQuery(loc.name);
    setSearchFocused(false);
  };

  const handleSelectComplaintFromSearch = (complaint: Complaint) => {
    if (!mapRef.current) return;
    const { lng, lat } = complaint.location.coordinates;
    mapRef.current.flyTo({
      center: [lng, lat],
      zoom: 15,
      essential: true,
      duration: 1600,
    });
    openComplaintPopup(complaint);
    setSearchQuery(complaint.id);
    setSearchFocused(false);
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      if (searchSuggestions && typeof searchSuggestions === 'object') {
        const { matchedLocations, matchedComplaints } = searchSuggestions;
        if (matchedLocations && matchedLocations.length > 0) {
          handleSelectLocation(matchedLocations[0]);
        } else if (matchedComplaints && matchedComplaints.length > 0) {
          handleSelectComplaintFromSearch(matchedComplaints[0]);
        }
      }
    }
  };

  // Reset to default Chennai center
  const handleResetToCenter = () => {
    if (!mapRef.current) return;
    mapRef.current.flyTo({
      center: CHENNAI_CENTER,
      zoom: DEFAULT_ZOOM,
      pitch: 0,
      bearing: 0,
      duration: 1200,
    });
  };

  return (
    <div className="relative w-full h-full overflow-hidden select-none bg-[#e8ecef]">
      {/* 1. MAPLIBRE GL CANVAS (Extends 100% full screen under translucent UI) */}
      <div ref={mapContainerRef} className="map-container absolute inset-0 w-full h-full z-0" />

      {/* 2. MAP TOOLBAR: Unified horizontal flex container housing Search Bar (left) and Date Filter (right) */}
      <div className="map-toolbar absolute top-[68px] sm:top-[72px] xl:top-[74px] left-[20px] right-[20px] sm:left-[28px] sm:right-[28px] xl:left-[36px] xl:right-[36px] flex items-center justify-between gap-4 pointer-events-none z-[900] box-border">
        {/* Upper-Left: Search Bar */}
        <div
          ref={searchContainerRef}
          className="pointer-events-auto relative w-[290px] sm:w-[340px] md:w-[370px] max-w-[calc(100vw-200px)] h-[38px] sm:h-[40px]"
        >
          <div
            className="relative w-full h-full rounded-full flex items-center px-3.5 transition-all duration-200"
            style={{
              background:
                'linear-gradient(135deg, rgba(255, 255, 255, 0.38) 0%, rgba(230, 245, 255, 0.22) 50%, rgba(245, 250, 255, 0.32) 100%)',
              backdropFilter: 'blur(20px) saturate(160%)',
              WebkitBackdropFilter: 'blur(20px) saturate(160%)',
              border: '1px solid rgba(255, 255, 255, 0.80)',
              borderRadius: '9999px',
              boxShadow: searchFocused
                ? '0 10px 26px rgba(10, 35, 65, 0.16), inset 0 1.5px 2px rgba(255, 255, 255, 0.95), inset 0 -1px 2px rgba(255, 255, 255, 0.50), 0 0 0 2px rgba(255, 255, 255, 0.90)'
                : '0 8px 22px rgba(10, 35, 65, 0.12), inset 0 1.5px 2px rgba(255, 255, 255, 0.90), inset 0 -1px 2px rgba(255, 255, 255, 0.40)',
            }}
          >
            {/* Subtle caustic / prismatic refraction sheen */}
            <div
              className="pointer-events-none absolute inset-0 rounded-full z-0 opacity-45"
              style={{
                background:
                  'linear-gradient(105deg, rgba(255,255,255,0.4) 0%, rgba(180,230,255,0.22) 25%, rgba(255,225,245,0.18) 50%, rgba(200,250,240,0.22) 75%, rgba(255,255,255,0.35) 100%)',
              }}
              aria-hidden="true"
            />

            {/* Top reflection highlight */}
            <div
              className="pointer-events-none absolute inset-x-0 top-0 h-[48%] rounded-t-full z-0"
              style={{
                background:
                  'linear-gradient(180deg, rgba(255, 255, 255, 0.50) 0%, rgba(255, 255, 255, 0.10) 50%, rgba(255, 255, 255, 0) 100%)',
              }}
              aria-hidden="true"
            />

            <Search className="relative z-10 w-[15px] h-[15px] text-[#0a2540] mr-2 shrink-0 stroke-[2.3]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onKeyDown={handleSearchKeyDown}
              placeholder="Search location or area in Chennai..."
              className="relative z-10 w-full bg-transparent text-[12px] sm:text-[12.5px] text-[#0a2540] font-medium placeholder:text-[#486581] focus:outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="relative z-10 text-[#486581] hover:text-[#0a2540] p-0.5 transition cursor-pointer"
                title="Clear Search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Autocomplete Dropdown */}
          {searchFocused && searchQuery.trim() && searchSuggestions && (
            <div
              className="absolute top-[44px] sm:top-[46px] left-0 w-full rounded-[20px] p-2 z-40 max-h-64 overflow-y-auto text-xs shadow-2xl border border-white/80 animate-in fade-in zoom-in-95 duration-150"
              style={{
                background:
                  'linear-gradient(180deg, rgba(255, 255, 255, 0.95) 0%, rgba(240, 248, 254, 0.92) 100%)',
                backdropFilter: 'blur(24px) saturate(180%)',
                WebkitBackdropFilter: 'blur(24px) saturate(180%)',
                boxShadow: '0 16px 40px rgba(10, 35, 60, 0.16), inset 0 1px 0 rgba(255, 255, 255, 0.90)',
              }}
            >
              {searchSuggestions.matchedLocations.length > 0 && (
                <div>
                  <div className="px-4 py-1.5 font-semibold text-[10px] text-[#486581] uppercase tracking-wider bg-slate-50/80 rounded-lg">
                    Chennai Localities
                  </div>
                  {searchSuggestions.matchedLocations.map((loc) => (
                    <button
                      key={loc.name}
                      onClick={() => handleSelectLocation(loc)}
                      className="w-full px-3.5 py-2.5 rounded-xl text-left hover:bg-[#0a4870]/10 flex items-center justify-between text-[#0a2540] cursor-pointer transition"
                    >
                      <span className="flex items-center gap-2.5">
                        <MapPin className="w-4 h-4 text-[#0a4870]" />
                        <span className="font-semibold text-sm">{loc.name}</span>
                      </span>
                      <span className="text-[11px] text-[#486581]">{loc.category}</span>
                    </button>
                  ))}
                </div>
              )}

              {searchSuggestions.matchedComplaints.length > 0 && (
                <div>
                  <div className="px-4 py-1.5 font-semibold text-[10px] text-[#486581] uppercase tracking-wider bg-slate-50/80 rounded-lg mt-1">
                    Complaints & Reports
                  </div>
                  {searchSuggestions.matchedComplaints.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => handleSelectComplaintFromSearch(c)}
                      className="w-full px-3.5 py-2.5 rounded-xl text-left hover:bg-[#0a4870]/10 flex items-center justify-between text-slate-700 cursor-pointer transition"
                    >
                      <div>
                        <div className="font-semibold text-[#0a2540]">{c.category} · #{c.id.match(/(\d{4})$/)?.[1] || c.id}</div>
                        <div className="text-[11px] text-[#486581] truncate">{c.location?.address}</div>
                      </div>
                      <span
                        className={`text-[9.5px] font-bold px-2 py-0.5 rounded-full ${
                          c.status === 'Resolved'
                            ? 'bg-sky-100 text-sky-800'
                            : c.status === 'In Progress'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {c.status}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {searchSuggestions.matchedLocations.length === 0 && searchSuggestions.matchedComplaints.length === 0 && (
                <div className="px-4 py-3 text-slate-400 text-center">
                  No matching locations or complaints in Chennai
                </div>
              )}
            </div>
          )}
        </div>

        {/* Upper-Right: Last 30 Days Filter */}
        <div
          ref={dateDropdownRef}
          className="pointer-events-auto relative w-[138px] sm:w-[150px] h-[38px] sm:h-[40px] shrink-0"
        >
          <button
            onClick={() => setDateDropdownOpen(!dateDropdownOpen)}
            className="relative w-full h-full rounded-full px-3 sm:px-3.5 flex items-center justify-between cursor-pointer transition select-none group"
            style={{
              background:
                'linear-gradient(135deg, rgba(255, 255, 255, 0.38) 0%, rgba(230, 245, 255, 0.22) 50%, rgba(245, 250, 255, 0.32) 100%)',
              backdropFilter: 'blur(20px) saturate(160%)',
              WebkitBackdropFilter: 'blur(20px) saturate(160%)',
              border: '1px solid rgba(255, 255, 255, 0.80)',
              borderRadius: '9999px',
              boxShadow:
                '0 12px 30px rgba(10, 35, 65, 0.14), inset 0 1.5px 2px rgba(255, 255, 255, 0.90), inset 0 -1px 2px rgba(255, 255, 255, 0.40)',
            }}
          >
            {/* Subtle caustic / prismatic refraction sheen */}
            <div
              className="pointer-events-none absolute inset-0 rounded-full z-0 opacity-45"
              style={{
                background:
                  'linear-gradient(105deg, rgba(255,255,255,0.4) 0%, rgba(180,230,255,0.22) 25%, rgba(255,225,245,0.18) 50%, rgba(200,250,240,0.22) 75%, rgba(255,255,255,0.35) 100%)',
              }}
              aria-hidden="true"
            />

            {/* Top reflection highlight */}
            <div
              className="pointer-events-none absolute inset-x-0 top-0 h-[48%] rounded-t-full z-0"
              style={{
                background:
                  'linear-gradient(180deg, rgba(255, 255, 255, 0.50) 0%, rgba(255, 255, 255, 0.10) 50%, rgba(255, 255, 255, 0) 100%)',
              }}
              aria-hidden="true"
            />

            <div className="relative z-10 flex items-center gap-1.5">
              <Calendar className="w-[14px] h-[14px] text-[#0a2540] stroke-[2]" />
              <span className="text-[12px] sm:text-[12.5px] font-semibold text-[#0a2540]">{dateFilter}</span>
            </div>
            <ChevronDown
              className={`relative z-10 w-3 h-3 text-[#0a2540] stroke-[2.2] transition-transform duration-200 ${
                dateDropdownOpen ? 'rotate-180' : ''
              }`}
            />
          </button>

          {dateDropdownOpen && (
            <div
              className="absolute right-0 top-[44px] sm:top-[46px] w-full rounded-[20px] p-1.5 z-40 text-xs shadow-2xl border border-white/80 animate-in fade-in zoom-in-95 duration-150"
              style={{
                background:
                  'linear-gradient(180deg, rgba(255, 255, 255, 0.95) 0%, rgba(240, 248, 254, 0.92) 100%)',
                backdropFilter: 'blur(24px) saturate(180%)',
                WebkitBackdropFilter: 'blur(24px) saturate(180%)',
                boxShadow: '0 16px 40px rgba(10, 35, 60, 0.16), inset 0 1px 0 rgba(255, 255, 255, 0.90)',
              }}
            >
              {(['Last 7 Days', 'Last 30 Days', 'Last 90 Days', 'All Time'] as const).map((opt) => (
                <button
                  key={opt}
                  onClick={() => {
                    setDateFilter(opt);
                    setDateDropdownOpen(false);
                  }}
                  className={`w-full px-3 py-2 rounded-[12px] text-left transition cursor-pointer flex items-center justify-between text-[11.5px] ${
                    dateFilter === opt
                      ? 'bg-[#0a4870]/10 text-[#0a2540] font-bold'
                      : 'text-[#1b3d5c] hover:bg-black/[0.04]'
                  }`}
                >
                  <span>{opt}</span>
                  {dateFilter === opt && <CheckCircle2 className="w-3.5 h-3.5 text-[#0a4870]" />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 3. MAP CONTROLS: Connected Vertical Glass Rail placed on the left, below search field */}
      <div className="absolute top-[118px] sm:top-[122px] xl:top-[124px] left-[20px] sm:left-[28px] xl:left-[36px] z-[900] select-none">
        <div
          className="relative w-[38px] sm:w-[40px] h-[116px] sm:h-[122px] rounded-full overflow-hidden flex flex-col items-center justify-between select-none"
          style={{
            background:
              'linear-gradient(180deg, rgba(255, 255, 255, 0.40) 0%, rgba(230, 245, 255, 0.22) 50%, rgba(245, 250, 255, 0.35) 100%)',
            backdropFilter: 'blur(20px) saturate(160%)',
            WebkitBackdropFilter: 'blur(20px) saturate(160%)',
            border: '1px solid rgba(255, 255, 255, 0.82)',
            borderRadius: '9999px',
            boxShadow:
              '0 12px 30px rgba(10, 35, 65, 0.16), inset 0 2px 3px rgba(255, 255, 255, 0.95), inset 0 -1.5px 2px rgba(255, 255, 255, 0.45)',
          }}
        >
          {/* Subtle caustic / prismatic refraction sheen */}
          <div
            className="pointer-events-none absolute inset-0 rounded-full z-0 opacity-45"
            style={{
              background:
                'linear-gradient(160deg, rgba(255,255,255,0.4) 0%, rgba(180,230,255,0.25) 30%, rgba(255,225,245,0.18) 60%, rgba(200,250,240,0.22) 80%, rgba(255,255,255,0.35) 100%)',
            }}
            aria-hidden="true"
          />

          {/* Top reflection highlight */}
          <div
            className="pointer-events-none absolute inset-x-0 top-0 h-[40%] rounded-t-full z-0"
            style={{
              background:
                'linear-gradient(180deg, rgba(255, 255, 255, 0.55) 0%, rgba(255, 255, 255, 0.12) 50%, rgba(255, 255, 255, 0) 100%)',
            }}
            aria-hidden="true"
          />

          {/* Zoom In (+) */}
          <button
            onClick={() => mapRef.current?.zoomIn({ duration: 200 })}
            className="relative z-10 w-full h-[38px] sm:h-[40px] flex items-center justify-center text-[#0a2540] hover:bg-white/35 active:bg-white/50 transition cursor-pointer active:scale-95"
            title="Zoom In"
            aria-label="Zoom In"
          >
            <Plus className="w-[15px] h-[15px] stroke-[2.2]" />
          </button>

          {/* Translucent Divider 1 */}
          <div className="relative z-10 w-[20px] h-[1px] bg-white/45 shrink-0" />

          {/* Zoom Out (−) */}
          <button
            onClick={() => mapRef.current?.zoomOut({ duration: 200 })}
            className="relative z-10 w-full h-[38px] sm:h-[40px] flex items-center justify-center text-[#0a2540] hover:bg-white/35 active:bg-white/50 transition cursor-pointer active:scale-95"
            title="Zoom Out"
            aria-label="Zoom Out"
          >
            <Minus className="w-[15px] h-[15px] stroke-[2.2]" />
          </button>

          {/* Translucent Divider 2 */}
          <div className="relative z-10 w-[20px] h-[1px] bg-white/45 shrink-0" />

          {/* Center on Chennai / Locate */}
          <button
            onClick={handleResetToCenter}
            className="relative z-10 w-full h-[38px] sm:h-[40px] flex items-center justify-center text-[#0a2540] hover:bg-white/35 active:bg-white/50 transition cursor-pointer active:scale-95"
            title="Center on Chennai"
            aria-label="Current Location"
          >
            <LocateFixed className="w-[15px] h-[15px] stroke-[2.2]" />
          </button>
        </div>
      </div>

      {/* 4. BOTTOM-LEFT STATUS LEGEND: compact dark teal translucent floating bar */}
      <div
        className="absolute bottom-[24px] left-[20px] sm:left-[28px] xl:left-[36px] z-[900] w-[225px] sm:w-[235px] h-[38px] rounded-[13px] border border-[rgba(0,240,255,0.18)] px-3.5 flex items-center justify-between whitespace-nowrap"
        style={{
          backgroundColor: 'rgba(6, 32, 44, 0.88)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.35)',
        }}
      >
        {/* Unresolved Item: solid red dot + white text */}
        <div className="flex items-center gap-2">
          <span className="w-[12px] h-[12px] rounded-full bg-[#ff173b] shrink-0" />
          <span className="font-medium text-[12px] text-white">Unresolved</span>
        </div>

        {/* Thin vertical divider */}
        <div className="w-[1px] h-[14px] bg-white/20" />

        {/* In Progress Item: yellow warning triangle + white text */}
        <div className="flex items-center gap-2">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="#FFC400"
            stroke="#FFC400"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="shrink-0"
          >
            <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
            <line x1="12" y1="9" x2="12" y2="13" stroke="#06202c" strokeWidth="2.4" />
            <line x1="12" y1="17" x2="12.01" y2="17" stroke="#06202c" strokeWidth="2.8" />
          </svg>
          <span className="font-medium text-[12px] text-white">In Progress</span>
        </div>
      </div>
    </div>
  );
};
