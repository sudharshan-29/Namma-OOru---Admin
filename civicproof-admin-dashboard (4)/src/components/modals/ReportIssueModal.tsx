import React, { useState, useRef, useEffect } from 'react';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import {
  X,
  MapPin,
  AlertTriangle,
  Camera,
  Upload,
  CheckCircle2,
  Navigation,
  RefreshCw,
  Info,
  Trash2,
  Droplets,
  Lightbulb,
  MoreHorizontal,
  Car,
  AlertCircle,
  Map,
  Check,
  ChevronLeft,
} from 'lucide-react';
import { api } from '../../api/client';
import type { Complaint, ComplaintCategory, ReporterType } from '../../types/civic';

interface ReportIssueModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplaintSubmitted?: (newComplaint: Complaint) => void;
}

const OPENFREEMAP_STYLE = 'https://tiles.openfreemap.org/styles/liberty';
const DEFAULT_CHENNAI_CENTER: [number, number] = [80.245, 13.045];

export type DisplayCategory =
  | 'Road Damage'
  | 'Waste Disposal'
  | 'Water Leakage'
  | 'Street Light'
  | 'Other';

const CATEGORIES: { id: DisplayCategory; label: string; icon: React.FC<{ className?: string }> }[] = [
  { id: 'Road Damage', label: 'Road Damage', icon: AlertTriangle },
  { id: 'Waste Disposal', label: 'Waste Disposal', icon: Trash2 },
  { id: 'Water Leakage', label: 'Water Leakage', icon: Droplets },
  { id: 'Street Light', label: 'Street Light', icon: Lightbulb },
  { id: 'Other', label: 'Other', icon: MoreHorizontal },
];

const CHENNAI_ZONES = [
  'Zone 1 (Thiruvottiyur)',
  'Zone 2 (Manali)',
  'Zone 3 (Madhavaram)',
  'Zone 4 (Tondiarpet)',
  'Zone 5 (Royapuram)',
  'Zone 6 (Thiru Vi Ka Nagar)',
  'Zone 7 (Ambattur)',
  'Zone 8 (Annanagar)',
  'Zone 9 (Teynampet)',
  'Zone 10 (Kodambakkam)',
  'Zone 11 (Valasaravakkam)',
  'Zone 12 (Alandur)',
  'Zone 13 (Adyar)',
  'Zone 14 (Perungudi)',
  'Zone 15 (Sholinganallur)',
];

const PRESET_LOCATIONS = [
  { name: 'T. Nagar (Panagal Park)', lat: 13.0418, lng: 80.2337, zone: 'Zone 10 (Kodambakkam)', ward: 'Ward 136' },
  { name: 'Mylapore (Luz Church Rd)', lat: 13.0368, lng: 80.2676, zone: 'Zone 9 (Teynampet)', ward: 'Ward 122' },
  { name: 'Adyar (Gandhi Nagar)', lat: 13.0067, lng: 80.2575, zone: 'Zone 13 (Adyar)', ward: 'Ward 173' },
  { name: 'Anna Nagar (Roundtana)', lat: 13.085, lng: 80.215, zone: 'Zone 8 (Annanagar)', ward: 'Ward 104' },
  { name: 'Central / George Town', lat: 13.0827, lng: 80.2707, zone: 'Zone 5 (Royapuram)', ward: 'Ward 58' },
];

export const ReportIssueModal: React.FC<ReportIssueModalProps> = ({
  isOpen,
  onClose,
  onComplaintSubmitted,
}) => {
  // 1. Issue Category
  const [selectedCategory, setSelectedCategory] = useState<DisplayCategory>('Road Damage');

  // 2. Complaint Description (500 chars limit)
  const [description, setDescription] = useState<string>('');

  // 3. Complaint Photo & GPS Geotag
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  // 4. Complaint Location
  const [hasLocationSelected, setHasLocationSelected] = useState<boolean>(false);
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number }>({
    lat: 13.0418,
    lng: 80.2337,
  });
  const [address, setAddress] = useState<string>('');
  const [zone, setZone] = useState<string>('Zone 10 (Kodambakkam)');
  const [ward, setWard] = useState<string>('Ward 136');
  const [isDetectingGps, setIsDetectingGps] = useState<boolean>(false);
  const [gpsError, setGpsError] = useState<string | null>(null);

  // 5. Privacy: Anonymous Reporting
  const [isAnonymous, setIsAnonymous] = useState<boolean>(false);
  const [citizenName, setCitizenName] = useState<string>('Kavitha Selvam');
  const [citizenContact, setCitizenContact] = useState<string>('+91 98401 22334');

  // 6. Mode & Status States
  const [isPickingLocation, setIsPickingLocation] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successResult, setSuccessResult] = useState<{
    complaintId: string;
    coordinates: { lat: number; lng: number };
    category: string;
    department: string;
  } | null>(null);

  // Map Picker specific state
  const [pickedCoords, setPickedCoords] = useState<{ lat: number; lng: number }>(coordinates);
  const pickerMapContainerRef = useRef<HTMLDivElement>(null);
  const pickerMapRef = useRef<maplibregl.Map | null>(null);
  const pickerMarkerRef = useRef<maplibregl.Marker | null>(null);

  // Reset errors on modal open
  useEffect(() => {
    if (isOpen) {
      setErrorMessage(null);
      setGpsError(null);
      setPhotoError(null);
      setSuccessResult(null);
      setIsPickingLocation(false);
    }
  }, [isOpen]);

  // Sync picked coordinates when entering map picking mode
  useEffect(() => {
    if (isPickingLocation) {
      setPickedCoords(coordinates);
    }
  }, [isPickingLocation, coordinates]);

  // Initialize MapLibre GL for Map Picker mode
  useEffect(() => {
    if (!isPickingLocation || !pickerMapContainerRef.current) return;

    let mapInstance: maplibregl.Map | null = null;

    try {
      mapInstance = new maplibregl.Map({
        container: pickerMapContainerRef.current,
        style: OPENFREEMAP_STYLE,
        center: [pickedCoords.lng, pickedCoords.lat],
        zoom: 14,
        pitch: 0,
        attributionControl: false,
      });

      mapInstance.addControl(
        new maplibregl.AttributionControl({ compact: true }),
        'bottom-right'
      );

      // Add navigation controls (zoom in/out) inside picker
      mapInstance.addControl(
        new maplibregl.NavigationControl({ showCompass: false }),
        'bottom-right'
      );

      // Set crosshair cursor on the map canvas
      mapInstance.on('load', () => {
        if (mapInstance) {
          mapInstance.getCanvas().style.cursor = 'crosshair';
        }
      });

      // Draggable pulsing location pin
      const markerEl = document.createElement('div');
      markerEl.className = 'w-8 h-8 rounded-full bg-emerald-600 border-2 border-white shadow-xl flex items-center justify-center cursor-move text-white filter drop-shadow-md';
      markerEl.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>`;

      const marker = new maplibregl.Marker({
        element: markerEl,
        draggable: true,
      })
        .setLngLat([pickedCoords.lng, pickedCoords.lat])
        .addTo(mapInstance);

      marker.on('dragend', () => {
        const lngLat = marker.getLngLat();
        setPickedCoords({
          lat: parseFloat(lngLat.lat.toFixed(5)),
          lng: parseFloat(lngLat.lng.toFixed(5)),
        });
      });

      pickerMarkerRef.current = marker;

      // Click anywhere to reposition marker
      mapInstance.on('click', (e) => {
        const newLat = parseFloat(e.lngLat.lat.toFixed(5));
        const newLng = parseFloat(e.lngLat.lng.toFixed(5));
        marker.setLngLat([newLng, newLat]);
        setPickedCoords({ lat: newLat, lng: newLng });
      });

      pickerMapRef.current = mapInstance;
    } catch (err) {
      console.error('Error initializing map picker:', err);
    }

    return () => {
      if (pickerMarkerRef.current) {
        pickerMarkerRef.current.remove();
        pickerMarkerRef.current = null;
      }
      if (mapInstance) {
        mapInstance.remove();
        pickerMapRef.current = null;
      }
    };
  }, [isPickingLocation]);

  // Handle Preset Selection in Map Picker
  const handleSelectPreset = (preset: (typeof PRESET_LOCATIONS)[0]) => {
    setPickedCoords({ lat: preset.lat, lng: preset.lng });
    setZone(preset.zone);
    setWard(preset.ward);
    if (!address) {
      setAddress(preset.name);
    }
    if (pickerMapRef.current && pickerMarkerRef.current) {
      pickerMapRef.current.flyTo({ center: [preset.lng, preset.lat], zoom: 14.5 });
      pickerMarkerRef.current.setLngLat([preset.lng, preset.lat]);
    }
  };

  // Confirm coordinates from map picker
  const handleConfirmLocation = () => {
    setCoordinates(pickedCoords);
    setHasLocationSelected(true);
    setIsPickingLocation(false);
  };

  // Device GPS detection
  const handleUseDeviceGps = () => {
    setGpsError(null);
    if (!navigator.geolocation) {
      setGpsError('Geolocation is not supported by your browser.');
      return;
    }
    setIsDetectingGps(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = parseFloat(position.coords.latitude.toFixed(5));
        const lng = parseFloat(position.coords.longitude.toFixed(5));
        setCoordinates({ lat, lng });
        setHasLocationSelected(true);
        setIsDetectingGps(false);
        if (!address) {
          setAddress(`GPS Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`);
        }
      },
      (error) => {
        setIsDetectingGps(false);
        if (error.code === error.PERMISSION_DENIED) {
          setGpsError('Location permission denied. Please allow GPS access or choose on map.');
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          setGpsError('GPS position unavailable. Please choose on the map.');
        } else if (error.code === error.TIMEOUT) {
          setGpsError('GPS location request timed out. Please try again or choose on map.');
        } else {
          setGpsError('Unable to detect GPS coordinates. Please choose on map.');
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // Handle Photo selection & validation (Max 5 MB, JPEG/PNG/WebP)
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhotoError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setPhotoError('Invalid image format. Only JPEG, PNG, and WebP images are permitted.');
      return;
    }

    const maxSizeBytes = 5 * 1024 * 1024; // 5 MB
    if (file.size > maxSizeBytes) {
      setPhotoError(`Selected photo is too large (${(file.size / (1024 * 1024)).toFixed(1)} MB). Maximum allowed size is 5 MB.`);
      return;
    }

    setPhotoFile(file);
    const previewUrl = URL.createObjectURL(file);
    setPhotoPreviewUrl(previewUrl);
  };

  const handleRemovePhoto = () => {
    if (photoPreviewUrl) {
      URL.revokeObjectURL(photoPreviewUrl);
    }
    setPhotoFile(null);
    setPhotoPreviewUrl(null);
    setPhotoError(null);
    if (cameraInputRef.current) cameraInputRef.current.value = '';
    if (galleryInputRef.current) galleryInputRef.current.value = '';
  };

  // Form Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Form validations
    if (!description.trim()) {
      setErrorMessage('Please provide a description of the complaint.');
      return;
    }

    if (!hasLocationSelected) {
      setErrorMessage('Please choose a complaint location on the map or use Device GPS.');
      return;
    }

    if (!address.trim()) {
      setErrorMessage('Please enter the street name or nearby landmark.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Map display categories to backend complaint categories
      let backendCategory: ComplaintCategory = 'Road Damage';
      if (selectedCategory === 'Waste Disposal') {
        backendCategory = 'Improper Waste Disposal';
      } else if (selectedCategory === 'Water Leakage') {
        backendCategory = 'Water Leakage';
      } else {
        backendCategory = 'Road Damage';
      }

      const payload = {
        category: backendCategory,
        description: description.trim(),
        address: address.trim(),
        zone,
        ward: ward || 'Ward 136',
        coordinates,
        geoJsonCoordinates: [coordinates.lng, coordinates.lat] as [number, number],
        photoUrl: photoPreviewUrl || 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=800&auto=format&fit=crop&q=80',
        reporterType: (isAnonymous ? 'Anonymous Reporter' : 'Registered Citizen') as ReporterType,
        reporterInfo: isAnonymous
          ? undefined
          : {
              name: citizenName,
              maskedContact: citizenContact,
              isVerifiedUser: true,
            },
      };

      const res = await api.createComplaint(payload);

      if (!res.complaint || !res.complaint.id) {
        throw new Error('Backend failed to confirm complaint creation.');
      }

      setSuccessResult({
        complaintId: res.complaint.id,
        coordinates: res.complaint.location.coordinates,
        category: res.complaint.category,
        department: res.complaint.assignedDepartment || 'Municipal Triage',
      });

      if (onComplaintSubmitted) {
        onComplaintSubmitted(res.complaint);
      }
    } catch (err: any) {
      console.error('Failed to submit complaint:', err);
      // Fail closed: never display false success
      setErrorMessage(
        err instanceof Error ? err.message : 'Server error: Failed to process complaint.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-[620px] max-h-[85vh] bg-white text-gray-900 rounded-2xl shadow-2xl overflow-hidden flex flex-col border border-gray-100">
        {/* FIXED MODAL HEADER */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 shrink-0">
              <MapPin className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 leading-tight">
                {isPickingLocation ? 'Choose Location on Map' : 'Report an Issue'}
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                {isPickingLocation
                  ? 'Click map or drag the pin to set the exact coordinates'
                  : 'Help make Chennai roads cleaner and safer'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 flex items-center justify-center transition cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* SCROLLABLE CONTENT BODY */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          {/* 1. SUCCESS VIEW */}
          {successResult ? (
            <div className="py-6 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-200 shadow-sm">
                <CheckCircle2 className="w-9 h-9 text-emerald-600" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-gray-900">Complaint Registered Successfully</h3>
                <p className="text-xs text-gray-500 max-w-sm mx-auto">
                  Your civic issue has been logged into the Namma Ooru system and routed to the assigned municipal department.
                </p>
              </div>

              {/* Summary Card */}
              <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 max-w-md mx-auto text-left space-y-2 text-xs">
                <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                  <span className="text-gray-500 font-mono">Complaint ID:</span>
                  <span className="font-mono font-bold text-emerald-700 text-sm">{successResult.complaintId}</span>
                </div>
                <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                  <span className="text-gray-500">Category:</span>
                  <span className="font-bold text-gray-800">{successResult.category}</span>
                </div>
                <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                  <span className="text-gray-500">Coordinates:</span>
                  <span className="font-mono text-gray-700">
                    {successResult.coordinates.lat.toFixed(5)}° N, {successResult.coordinates.lng.toFixed(5)}° E
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Department:</span>
                  <span className="text-gray-800 font-medium truncate max-w-[200px]">{successResult.department}</span>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition shadow-sm cursor-pointer"
                >
                  Return to Dashboard
                </button>
              </div>
            </div>
          ) : isPickingLocation ? (
            /* 2. INTERACTIVE MAP PICKER VIEW */
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-emerald-600" />
                  <span className="text-gray-600 font-medium">Selected Coordinates:</span>
                  <span className="font-mono text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    {pickedCoords.lat.toFixed(5)}, {pickedCoords.lng.toFixed(5)}
                  </span>
                </div>
                <span className="text-[10px] text-gray-400 font-mono">OpenFreeMap Liberty Light</span>
              </div>

              {/* Map Canvas with crosshair cursor */}
              <div className="relative w-full h-[320px] rounded-xl overflow-hidden border border-gray-300 shadow-inner">
                <div ref={pickerMapContainerRef} className="w-full h-full cursor-crosshair" />
                <div className="absolute top-2.5 left-2.5 z-10 bg-white/95 backdrop-blur-xs border border-gray-200 px-2.5 py-1 rounded-lg text-[11px] font-medium text-gray-700 shadow-sm flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Click on map or drag pin to position</span>
                </div>
              </div>

              {/* Quick Preset Landmarks */}
              <div className="space-y-1.5">
                <span className="text-[10px] uppercase font-bold text-gray-400 font-mono tracking-wider">
                  Quick Chennai Landmarks:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {PRESET_LOCATIONS.map((preset) => (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() => handleSelectPreset(preset)}
                      className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-gray-100 hover:bg-emerald-50 hover:text-emerald-700 text-gray-700 border border-gray-200 transition cursor-pointer"
                    >
                      {preset.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsPickingLocation(false)}
                  className="px-4 py-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 font-semibold text-xs transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmLocation}
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition shadow-sm cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Confirm Coordinates ({pickedCoords.lat.toFixed(4)}, {pickedCoords.lng.toFixed(4)})</span>
                </button>
              </div>
            </div>
          ) : (
            /* 3. MAIN ISSUE REPORTING FORM */
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Error Message */}
              {errorMessage && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* SECTION 1: ISSUE CATEGORY CARDS */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-2">
                  Select Category <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                  {CATEGORIES.map((cat) => {
                    const isSelected = selectedCategory === cat.id;
                    const IconComponent = cat.icon;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setSelectedCategory(cat.id)}
                        className={`flex flex-col items-center justify-center p-2.5 rounded-xl transition cursor-pointer text-center min-h-[76px] ${
                          isSelected
                            ? 'border-2 border-emerald-600 bg-emerald-50 text-emerald-800 font-bold shadow-xs'
                            : 'border border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50 text-gray-600'
                        }`}
                      >
                        <IconComponent
                          className={`w-5 h-5 mb-1.5 ${
                            isSelected ? 'text-emerald-600' : 'text-gray-500'
                          }`}
                        />
                        <span className="text-[11px] leading-tight font-medium">
                          {cat.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* SECTION 2: COMPLAINT DESCRIPTION */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-gray-700">
                    What is the complaint? <span className="text-red-500">*</span>
                  </label>
                  <span className="text-[11px] font-mono text-gray-400">
                    {description.length} / 500
                  </span>
                </div>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  maxLength={500}
                  rows={3}
                  placeholder="Describe the issue in detail, including landmarks or specific hazards (e.g., Deep pothole causing two-wheeler accidents near junction)..."
                  className="w-full px-3.5 py-2.5 text-xs text-gray-900 placeholder-gray-400 bg-white border border-gray-200 rounded-xl focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-hidden transition resize-y min-h-[90px]"
                  required
                />
              </div>

              {/* SECTION 3: COMPLAINT PHOTO & GPS GEOTAG */}
              <div>
                <div className="flex items-baseline gap-1.5 mb-2">
                  <span className="text-xs font-semibold text-gray-700">Complaint Photo & GPS Geotag</span>
                  <span className="text-[11px] text-gray-400 font-normal">(optional, max 5 MB)</span>
                </div>

                {/* Hidden File Inputs */}
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  capture="environment"
                  className="hidden"
                  onChange={handlePhotoSelect}
                />
                <input
                  ref={galleryInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={handlePhotoSelect}
                />

                {/* Two Equal-Width Buttons */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => cameraInputRef.current?.click()}
                    className="flex-1 py-2.5 px-3 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-xs font-medium flex items-center justify-center gap-2 transition cursor-pointer"
                  >
                    <Camera className="w-4 h-4 text-gray-500" />
                    <span>Take Photo</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => galleryInputRef.current?.click()}
                    className="flex-1 py-2.5 px-3 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-xs font-medium flex items-center justify-center gap-2 transition cursor-pointer"
                  >
                    <Upload className="w-4 h-4 text-gray-500" />
                    <span>Upload from Gallery</span>
                  </button>
                </div>

                {/* Photo Error */}
                {photoError && (
                  <p className="text-[11px] text-red-600 mt-1.5 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{photoError}</span>
                  </p>
                )}

                {/* Selected Photo Preview */}
                {photoFile && photoPreviewUrl && (
                  <div className="mt-2.5 p-2.5 rounded-xl border border-gray-200 bg-gray-50 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img
                        src={photoPreviewUrl}
                        alt="Complaint Preview"
                        className="w-12 h-12 rounded-lg object-cover border border-gray-200 shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="text-xs font-medium text-gray-800 truncate">{photoFile.name}</div>
                        <div className="text-[10px] text-gray-500 font-mono">
                          {(photoFile.size / (1024 * 1024)).toFixed(2)} MB · {photoFile.type.replace('image/', '').toUpperCase()}
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemovePhoto}
                      className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-white rounded-lg border border-transparent hover:border-gray-200 transition cursor-pointer"
                      title="Remove Photo"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* SECTION 4: COMPLAINT LOCATION ON MAP */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Complaint Location on Map <span className="text-red-500">*</span>
                </label>

                {/* Pale-gray Location Panel */}
                <div className="p-3.5 rounded-xl border border-gray-200 bg-gray-50 space-y-3">
                  {/* Status Indicator */}
                  {!hasLocationSelected ? (
                    <div className="flex items-center gap-2 text-xs text-gray-500 font-medium py-0.5">
                      <MapPin className="w-4 h-4 text-gray-400 shrink-0" />
                      <span>No location selected yet</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between text-xs py-0.5">
                      <div className="flex items-center gap-2 font-medium text-emerald-800">
                        <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span className="font-mono font-bold">
                          {coordinates.lat.toFixed(5)}° N, {coordinates.lng.toFixed(5)}° E
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsPickingLocation(true)}
                        className="text-[11px] text-emerald-600 hover:text-emerald-700 font-semibold underline cursor-pointer"
                      >
                        Reselect
                      </button>
                    </div>
                  )}

                  {/* Two Buttons: "Choose on map" & "Use Device GPS" */}
                  <div className="flex items-center gap-2 pt-1 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={() => setIsPickingLocation(true)}
                      className="flex-1 py-2 px-3 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer shadow-2xs"
                    >
                      <Map className="w-3.5 h-3.5 text-gray-500" />
                      <span>Choose on map</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleUseDeviceGps}
                      disabled={isDetectingGps}
                      className="flex-1 py-2 px-3 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer shadow-2xs disabled:opacity-60"
                    >
                      <Navigation className={`w-3.5 h-3.5 text-gray-500 ${isDetectingGps ? 'animate-spin text-emerald-600' : ''}`} />
                      <span>{isDetectingGps ? 'Detecting GPS...' : 'Use Device GPS'}</span>
                    </button>
                  </div>

                  {/* GPS Detection Error */}
                  {gpsError && (
                    <div className="text-[11px] text-amber-800 bg-amber-50 border border-amber-200 p-2 rounded-lg flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span>{gpsError}</span>
                    </div>
                  )}

                  {/* Street Address / Landmark input */}
                  <div className="pt-2 border-t border-gray-200 space-y-2">
                    <div>
                      <label className="text-[11px] text-gray-500 font-medium">Street Name / Landmark</label>
                      <input
                        type="text"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="e.g., Anna Salai near Thousand Lights Mosque"
                        className="w-full px-3 py-2 text-xs rounded-lg border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-hidden transition mt-0.5"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <label className="text-[10px] text-gray-400 font-medium">Zone</label>
                        <select
                          value={zone}
                          onChange={(e) => setZone(e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-gray-200 bg-white text-gray-800 text-xs focus:border-emerald-500 mt-0.5"
                        >
                          {CHENNAI_ZONES.map((z) => (
                            <option key={z} value={z}>
                              {z}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] text-gray-400 font-medium">Ward</label>
                        <input
                          type="text"
                          value={ward}
                          onChange={(e) => setWard(e.target.value)}
                          placeholder="Ward 136"
                          className="w-full px-2.5 py-1.5 rounded-lg border border-gray-200 bg-white text-gray-800 text-xs focus:border-emerald-500 mt-0.5"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION 5: REPORT ANONYMOUSLY CHECKBOX */}
              <div className="pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isAnonymous}
                    onChange={(e) => setIsAnonymous(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                  />
                  <span className="text-xs font-semibold text-gray-800">Report Anonymously</span>
                </label>
                <p className="text-[11px] text-gray-500 mt-0.5 ml-6">
                  Your identity will not be attached to this complaint record.
                </p>

                {/* Optional Citizen Information when not anonymous */}
                {!isAnonymous && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 ml-6 mt-2 pt-2 border-t border-gray-100">
                    <div>
                      <label className="text-[10px] text-gray-500">Citizen Name</label>
                      <input
                        type="text"
                        value={citizenName}
                        onChange={(e) => setCitizenName(e.target.value)}
                        placeholder="Citizen Name"
                        className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-gray-200 bg-white text-gray-800 mt-0.5"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-gray-500">Phone Number (SMS updates)</label>
                      <input
                        type="text"
                        value={citizenContact}
                        onChange={(e) => setCitizenContact(e.target.value)}
                        placeholder="+91 98401 XXXXX"
                        className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-gray-200 bg-white text-gray-800 mt-0.5"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* SECTION 6: SUBMIT BUTTON */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm transition shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Submitting Complaint...</span>
                    </>
                  ) : (
                    <span>Submit Complaint</span>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
