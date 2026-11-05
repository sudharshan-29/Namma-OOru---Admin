import type { Complaint } from '../types/civic';

export interface SampleComplaintRow {
  id: string; // "1001", "1002", etc.
  fullId: string; // "CP-CHN-2026-1001", etc.
  photo: string;
  detail: string;
  location: string;
  status: 'Unresolved' | 'In Progress' | 'Resolved';
  priority: 'High' | 'Medium' | 'Low' | '—';
  department: 'Roads' | 'Sanitation' | 'Water Supply' | 'Electricity';
  date: string;
  time: string;
  category: string;
}

// 25 Canonical Complaints adhering strictly to the user's reference complaint page
export const REFERENCE_SAMPLE_ROWS: SampleComplaintRow[] = [
  {
    id: "1001",
    fullId: "CP-CHN-2026-1001",
    photo: "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=800&auto=format&fit=crop&q=80",
    detail: "Deep 2-foot pothole on central lane outside metro",
    location: "Anna Salai",
    status: "Unresolved",
    priority: "High",
    department: "Roads",
    date: "17 Oct 2026",
    time: "10:25 AM",
    category: "Road Damage"
  },
  {
    id: "1002",
    fullId: "CP-CHN-2026-1002",
    photo: "https://images.unsplash.com/photo-1605600659908-0ef719419d41?w=800&auto=format&fit=crop&q=80",
    detail: "1100L green compactor bin overflowing with waste",
    location: "Velachery",
    status: "In Progress",
    priority: "High",
    department: "Sanitation",
    date: "16 Oct 2026",
    time: "05:40 PM",
    category: "Waste Disposal"
  },
  {
    id: "1003",
    fullId: "CP-CHN-2026-1003",
    photo: "https://images.unsplash.com/photo-1541888946425-d0fbb186c5f9?w=800&auto=format&fit=crop&q=80",
    detail: "Water leakage from underground pipeline",
    location: "Adyar",
    status: "In Progress",
    priority: "Medium",
    department: "Water Supply",
    date: "16 Oct 2026",
    time: "01:15 PM",
    category: "Water Leakage"
  },
  {
    id: "1004",
    fullId: "CP-CHN-2026-1004",
    photo: "https://images.unsplash.com/photo-1578885136359-16c8bd4d3a8e?w=800&auto=format&fit=crop&q=80",
    detail: "Damaged median kerb blocks and missing manhole slab",
    location: "Besant Nagar",
    status: "Resolved",
    priority: "—",
    department: "Roads",
    date: "15 Oct 2026",
    time: "04:20 PM",
    category: "Road Damage"
  },
  {
    id: "1005",
    fullId: "CP-CHN-2026-1005",
    photo: "https://images.unsplash.com/photo-1584463699042-451f28b7e750?w=800&auto=format&fit=crop&q=80",
    detail: "Multiple cluster potholes on service lane",
    location: "Perungudi",
    status: "Unresolved",
    priority: "High",
    department: "Roads",
    date: "15 Oct 2026",
    time: "11:05 AM",
    category: "Road Damage"
  },
  {
    id: "1006",
    fullId: "CP-CHN-2026-1006",
    photo: "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=800&auto=format&fit=crop&q=80",
    detail: "Underground main pipeline valve breach",
    location: "T. Nagar",
    status: "In Progress",
    priority: "High",
    department: "Water Supply",
    date: "15 Oct 2026",
    time: "09:30 AM",
    category: "Water Leakage"
  },
  {
    id: "1007",
    fullId: "CP-CHN-2026-1007",
    photo: "https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=800&auto=format&fit=crop&q=80",
    detail: "Commercial packaging debris dumped across storm drain",
    location: "Mylapore",
    status: "Unresolved",
    priority: "Medium",
    department: "Sanitation",
    date: "14 Oct 2026",
    time: "02:15 PM",
    category: "Waste Disposal"
  },
  {
    id: "1008",
    fullId: "CP-CHN-2026-1008",
    photo: "https://images.unsplash.com/photo-1545459720-aac8509eb02c?w=800&auto=format&fit=crop&q=80",
    detail: "Sunken road slab and storm water grating displacement",
    location: "Marina Beach",
    status: "In Progress",
    priority: "High",
    department: "Roads",
    date: "14 Oct 2026",
    time: "11:50 AM",
    category: "Road Damage"
  },
  {
    id: "1009",
    fullId: "CP-CHN-2026-1009",
    photo: "https://images.unsplash.com/photo-1563245372-f21724e3856d?w=800&auto=format&fit=crop&q=80",
    detail: "Demolition concrete debris and cement plaster bags on walkway",
    location: "Royapettah",
    status: "Unresolved",
    priority: "High",
    department: "Sanitation",
    date: "13 Oct 2026",
    time: "06:10 PM",
    category: "Waste Disposal"
  },
  {
    id: "1010",
    fullId: "CP-CHN-2026-1010",
    photo: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&auto=format&fit=crop&q=80",
    detail: "Main distribution collar crack creating road waterlogging",
    location: "Kilpauk",
    status: "Unresolved",
    priority: "High",
    department: "Water Supply",
    date: "13 Oct 2026",
    time: "08:45 AM",
    category: "Water Leakage"
  },
  {
    id: "1011",
    fullId: "CP-CHN-2026-1011",
    photo: "https://images.unsplash.com/photo-1506521781263-d8422e82f27a?w=800&auto=format&fit=crop&q=80",
    detail: "Flyover descent asphalt surface peeling",
    location: "Guindy",
    status: "Resolved",
    priority: "—",
    department: "Roads",
    date: "12 Oct 2026",
    time: "03:20 PM",
    category: "Road Damage"
  },
  {
    id: "1012",
    fullId: "CP-CHN-2026-1012",
    photo: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=800&auto=format&fit=crop&q=80",
    detail: "Street light not working near junction",
    location: "Besant Nagar",
    status: "Resolved",
    priority: "—",
    department: "Electricity",
    date: "12 Oct 2026",
    time: "08:15 PM",
    category: "Street Light Issue"
  },
  {
    id: "1013",
    fullId: "CP-CHN-2026-1013",
    photo: "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=800&auto=format&fit=crop&q=80",
    detail: "Damaged municipal air valve discharging water",
    location: "T. Nagar",
    status: "Unresolved",
    priority: "High",
    department: "Water Supply",
    date: "12 Oct 2026",
    time: "10:05 AM",
    category: "Water Leakage"
  },
  {
    id: "1014",
    fullId: "CP-CHN-2026-1014",
    photo: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=800&auto=format&fit=crop&q=80",
    detail: "Deep utility trench across residential street unpaved",
    location: "Anna Salai",
    status: "In Progress",
    priority: "High",
    department: "Roads",
    date: "11 Oct 2026",
    time: "04:30 PM",
    category: "Road Damage"
  },
  {
    id: "1015",
    fullId: "CP-CHN-2026-1015",
    photo: "https://images.unsplash.com/photo-1618477461853-cf6ed80faba5?w=800&auto=format&fit=crop&q=80",
    detail: "Food packaging and coconut shells dumped on plot",
    location: "Adyar",
    status: "Resolved",
    priority: "—",
    department: "Sanitation",
    date: "11 Oct 2026",
    time: "01:10 PM",
    category: "Waste Disposal"
  },
  {
    id: "1016",
    fullId: "CP-CHN-2026-1016",
    photo: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&auto=format&fit=crop&q=80",
    detail: "Drinking water pipeline breached during drain work",
    location: "Mylapore",
    status: "In Progress",
    priority: "High",
    department: "Water Supply",
    date: "10 Oct 2026",
    time: "09:15 AM",
    category: "Water Leakage"
  },
  {
    id: "1017",
    fullId: "CP-CHN-2026-1017",
    photo: "https://images.unsplash.com/photo-1596707328904-8b656799049d?w=800&auto=format&fit=crop&q=80",
    detail: "Sunken manhole frame 4 inches below road grade",
    location: "Velachery",
    status: "Unresolved",
    priority: "Medium",
    department: "Roads",
    date: "10 Oct 2026",
    time: "11:40 AM",
    category: "Road Damage"
  },
  {
    id: "1018",
    fullId: "CP-CHN-2026-1018",
    photo: "https://images.unsplash.com/photo-1528183429752-a97d0bf99b5a?w=800&auto=format&fit=crop&q=80",
    detail: "Commercial wet waste bins leaking onto avenue pavement",
    location: "Alwarpet",
    status: "In Progress",
    priority: "High",
    department: "Sanitation",
    date: "09 Oct 2026",
    time: "07:20 PM",
    category: "Waste Disposal"
  },
  {
    id: "1019",
    fullId: "CP-CHN-2026-1019",
    photo: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&auto=format&fit=crop&q=80",
    detail: "Extensive bitumen peeling on turn lane",
    location: "Perungudi",
    status: "Unresolved",
    priority: "Medium",
    department: "Roads",
    date: "09 Oct 2026",
    time: "02:50 PM",
    category: "Road Damage"
  },
  {
    id: "1020",
    fullId: "CP-CHN-2026-1020",
    photo: "https://images.unsplash.com/photo-1541888946425-d0fbb186c5f9?w=800&auto=format&fit=crop&q=80",
    detail: "Distribution feeder pipe joint fractured near lake bund",
    location: "Velachery",
    status: "Resolved",
    priority: "—",
    department: "Water Supply",
    date: "08 Oct 2026",
    time: "12:05 PM",
    category: "Water Leakage"
  },
  {
    id: "1021",
    fullId: "CP-CHN-2026-1021",
    photo: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=800&auto=format&fit=crop&q=80",
    detail: "Cluster of 4 street lamps unlit near pedestrian underpass",
    location: "Guindy",
    status: "Unresolved",
    priority: "High",
    department: "Electricity",
    date: "08 Oct 2026",
    time: "07:45 PM",
    category: "Street Light Issue"
  },
  {
    id: "1022",
    fullId: "CP-CHN-2026-1022",
    photo: "https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=800&auto=format&fit=crop&q=80",
    detail: "Uncollected market waste accumulating near school wall",
    location: "Mylapore",
    status: "Resolved",
    priority: "—",
    department: "Sanitation",
    date: "07 Oct 2026",
    time: "08:30 AM",
    category: "Waste Disposal"
  },
  {
    id: "1023",
    fullId: "CP-CHN-2026-1023",
    photo: "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=800&auto=format&fit=crop&q=80",
    detail: "Drinking water gushing out of valve pit near bus shelter",
    location: "Anna Salai",
    status: "In Progress",
    priority: "Medium",
    department: "Water Supply",
    date: "07 Oct 2026",
    time: "11:15 AM",
    category: "Water Leakage"
  },
  {
    id: "1024",
    fullId: "CP-CHN-2026-1024",
    photo: "https://images.unsplash.com/photo-1584463699042-451f28b7e750?w=800&auto=format&fit=crop&q=80",
    detail: "Caved-in asphalt surface around stormwater culvert entry",
    location: "Velachery",
    status: "Unresolved",
    priority: "High",
    department: "Roads",
    date: "06 Oct 2026",
    time: "03:40 PM",
    category: "Road Damage"
  },
  {
    id: "1025",
    fullId: "CP-CHN-2026-1025",
    photo: "https://images.unsplash.com/photo-1605600659908-0ef719419d41?w=800&auto=format&fit=crop&q=80",
    detail: "Discarded commercial crates and plastic wraps on green verge",
    location: "Guindy",
    status: "Unresolved",
    priority: "Low",
    department: "Sanitation",
    date: "06 Oct 2026",
    time: "09:20 AM",
    category: "Waste Disposal"
  }
];

// Helper to map department string to full DepartmentName
export const getFullDepartmentName = (dept: string): 'Roads and Infrastructure Department' | 'Solid Waste Management Department' | 'Water Supply and Sewerage Department' => {
  if (dept === 'Roads') return 'Roads and Infrastructure Department';
  if (dept === 'Sanitation') return 'Solid Waste Management Department';
  return 'Water Supply and Sewerage Department';
};

// Helper to map category string to ComplaintCategory
export const getStandardCategory = (cat: string): 'Road Damage' | 'Improper Waste Disposal' | 'Water Leakage' => {
  if (cat === 'Waste Disposal' || cat === 'Improper Waste Disposal') return 'Improper Waste Disposal';
  if (cat === 'Water Leakage') return 'Water Leakage';
  return 'Road Damage';
};

// Chennai coordinates lookup
const LOCATION_COORDS: Record<string, { lat: number; lng: number; zone: string; ward: string }> = {
  'Anna Salai': { lat: 13.0604, lng: 80.2496, zone: 'Zone 9 (Teynampet)', ward: 'Ward 114' },
  'Velachery': { lat: 12.9759, lng: 80.2212, zone: 'Zone 13 (Adyar)', ward: 'Ward 178' },
  'Adyar': { lat: 13.0012, lng: 80.2565, zone: 'Zone 13 (Adyar)', ward: 'Ward 173' },
  'Besant Nagar': { lat: 12.9995, lng: 80.2707, zone: 'Zone 13 (Adyar)', ward: 'Ward 175' },
  'Perungudi': { lat: 12.9654, lng: 80.2461, zone: 'Zone 14 (Perungudi)', ward: 'Ward 184' },
  'T. Nagar': { lat: 13.0418, lng: 80.2341, zone: 'Zone 10 (Kodambakkam)', ward: 'Ward 136' },
  'Mylapore': { lat: 13.0368, lng: 80.2676, zone: 'Zone 9 (Teynampet)', ward: 'Ward 121' },
  'Marina Beach': { lat: 13.0500, lng: 80.2824, zone: 'Zone 9 (Teynampet)', ward: 'Ward 118' },
  'Royapettah': { lat: 13.0583, lng: 80.2642, zone: 'Zone 9 (Teynampet)', ward: 'Ward 116' },
  'Kilpauk': { lat: 13.0784, lng: 80.2415, zone: 'Zone 8 (Anna Nagar)', ward: 'Ward 102' },
  'Guindy': { lat: 13.0067, lng: 80.2025, zone: 'Zone 10 (Kodambakkam)', ward: 'Ward 139' },
  'Alwarpet': { lat: 13.0340, lng: 80.2500, zone: 'Zone 9 (Teynampet)', ward: 'Ward 122' },
};

export const CANONICAL_BEFORE_PHOTOS: Record<string, string> = {
  '1001': 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=800&auto=format&fit=crop&q=80',
  'CP-CHN-2026-1001': 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=800&auto=format&fit=crop&q=80',
  '1002': 'https://images.unsplash.com/photo-1605600659908-0ef719419d41?w=800&auto=format&fit=crop&q=80',
  'CP-CHN-2026-1002': 'https://images.unsplash.com/photo-1605600659908-0ef719419d41?w=800&auto=format&fit=crop&q=80',
  '1003': 'https://images.unsplash.com/photo-1541888946425-d0fbb186c5f9?w=800&auto=format&fit=crop&q=80',
  'CP-CHN-2026-1003': 'https://images.unsplash.com/photo-1541888946425-d0fbb186c5f9?w=800&auto=format&fit=crop&q=80',
  '1004': 'https://images.unsplash.com/photo-1578885136359-16c8bd4d3a8e?w=800&auto=format&fit=crop&q=80',
  'CP-CHN-2026-1004': 'https://images.unsplash.com/photo-1578885136359-16c8bd4d3a8e?w=800&auto=format&fit=crop&q=80',
  '1005': 'https://images.unsplash.com/photo-1584463699042-451f28b7e750?w=800&auto=format&fit=crop&q=80',
  'CP-CHN-2026-1005': 'https://images.unsplash.com/photo-1584463699042-451f28b7e750?w=800&auto=format&fit=crop&q=80',
  '1006': 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=800&auto=format&fit=crop&q=80',
  'CP-CHN-2026-1006': 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=800&auto=format&fit=crop&q=80',
  '1007': 'https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=800&auto=format&fit=crop&q=80',
  'CP-CHN-2026-1007': 'https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=800&auto=format&fit=crop&q=80',
  '1008': 'https://images.unsplash.com/photo-1545459720-aac8509eb02c?w=800&auto=format&fit=crop&q=80',
  'CP-CHN-2026-1008': 'https://images.unsplash.com/photo-1545459720-aac8509eb02c?w=800&auto=format&fit=crop&q=80',
  '1009': 'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=800&auto=format&fit=crop&q=80',
  'CP-CHN-2026-1009': 'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=800&auto=format&fit=crop&q=80',
  '1010': 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&auto=format&fit=crop&q=80',
  'CP-CHN-2026-1010': 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&auto=format&fit=crop&q=80',
  '1011': 'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?w=800&auto=format&fit=crop&q=80',
  'CP-CHN-2026-1011': 'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?w=800&auto=format&fit=crop&q=80',
  '1012': 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=800&auto=format&fit=crop&q=80',
  'CP-CHN-2026-1012': 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=800&auto=format&fit=crop&q=80',
  '1013': 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=800&auto=format&fit=crop&q=80',
  'CP-CHN-2026-1013': 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=800&auto=format&fit=crop&q=80',
  '1014': 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=800&auto=format&fit=crop&q=80',
  'CP-CHN-2026-1014': 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=800&auto=format&fit=crop&q=80',
  '1015': 'https://images.unsplash.com/photo-1618477461853-cf6ed80faba5?w=800&auto=format&fit=crop&q=80',
  'CP-CHN-2026-1015': 'https://images.unsplash.com/photo-1618477461853-cf6ed80faba5?w=800&auto=format&fit=crop&q=80',
  '1016': 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&auto=format&fit=crop&q=80',
  'CP-CHN-2026-1016': 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&auto=format&fit=crop&q=80',
  '1017': 'https://images.unsplash.com/photo-1596707328904-8b656799049d?w=800&auto=format&fit=crop&q=80',
  'CP-CHN-2026-1017': 'https://images.unsplash.com/photo-1596707328904-8b656799049d?w=800&auto=format&fit=crop&q=80',
  '1018': 'https://images.unsplash.com/photo-1528183429752-a97d0bf99b5a?w=800&auto=format&fit=crop&q=80',
  'CP-CHN-2026-1018': 'https://images.unsplash.com/photo-1528183429752-a97d0bf99b5a?w=800&auto=format&fit=crop&q=80',
  '1019': 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&auto=format&fit=crop&q=80',
  'CP-CHN-2026-1019': 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&auto=format&fit=crop&q=80',
  '1020': 'https://images.unsplash.com/photo-1541888946425-d0fbb186c5f9?w=800&auto=format&fit=crop&q=80',
  'CP-CHN-2026-1020': 'https://images.unsplash.com/photo-1541888946425-d0fbb186c5f9?w=800&auto=format&fit=crop&q=80',
  '1021': 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=800&auto=format&fit=crop&q=80',
  'CP-CHN-2026-1021': 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=800&auto=format&fit=crop&q=80',
  '1022': 'https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=800&auto=format&fit=crop&q=80',
  'CP-CHN-2026-1022': 'https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=800&auto=format&fit=crop&q=80',
  '1023': 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=800&auto=format&fit=crop&q=80',
  'CP-CHN-2026-1023': 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=800&auto=format&fit=crop&q=80',
  '1024': 'https://images.unsplash.com/photo-1584463699042-451f28b7e750?w=800&auto=format&fit=crop&q=80',
  'CP-CHN-2026-1024': 'https://images.unsplash.com/photo-1584463699042-451f28b7e750?w=800&auto=format&fit=crop&q=80',
  '1025': 'https://images.unsplash.com/photo-1605600659908-0ef719419d41?w=800&auto=format&fit=crop&q=80',
  'CP-CHN-2026-1025': 'https://images.unsplash.com/photo-1605600659908-0ef719419d41?w=800&auto=format&fit=crop&q=80',
};

export const getCategoryFallbackPhoto = (category?: string, isAfter: boolean = false): string => {
  const cat = (category || '').toLowerCase();
  if (cat.includes('waste')) {
    return isAfter
      ? 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=800&auto=format&fit=crop&q=80'
      : '/images/thumb_garbage.jpg';
  }
  if (cat.includes('water')) {
    return isAfter
      ? 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=800&auto=format&fit=crop&q=80'
      : '/images/thumb_water.jpg';
  }
  if (cat.includes('light') || cat.includes('elect')) {
    return isAfter
      ? 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=800&auto=format&fit=crop&q=80'
      : '/images/thumb_streetlight.jpg';
  }
  return isAfter
    ? 'https://images.unsplash.com/photo-1590486803833-1c5dc8ddd4c8?w=800&auto=format&fit=crop&q=80'
    : '/images/thumb_pothole_1.jpg';
};

export const getBeforePhotoForComplaint = (idOrFullId: string, category?: string): string => {
  const shortId = idOrFullId.match(/(\d{4})$/)?.[1] || idOrFullId;
  if (CANONICAL_BEFORE_PHOTOS[shortId]) return CANONICAL_BEFORE_PHOTOS[shortId];
  if (CANONICAL_BEFORE_PHOTOS[idOrFullId]) return CANONICAL_BEFORE_PHOTOS[idOrFullId];
  return getCategoryFallbackPhoto(category, false);
};

// Distinct, relevant after-repair proof photos matched directly to each complaint and its specific resolution
export const CANONICAL_AFTER_PHOTOS: Record<string, string> = {
  // 1001: Anna Salai - Pothole on central lane outside metro -> Clean asphalt road patch
  '1001': 'https://images.unsplash.com/photo-1590486803833-1c5dc8ddd4c8?w=800&auto=format&fit=crop&q=80',
  'CP-CHN-2026-1001': 'https://images.unsplash.com/photo-1590486803833-1c5dc8ddd4c8?w=800&auto=format&fit=crop&q=80',

  // 1002: Velachery - 1100L green compactor bin overflowing -> Cleared and disinfected green bin
  '1002': 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=800&auto=format&fit=crop&q=80',
  'CP-CHN-2026-1002': 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=800&auto=format&fit=crop&q=80',

  // 1003: Adyar - Water leakage from underground pipeline -> Repaired pipeline valve and dry street
  '1003': 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&auto=format&fit=crop&q=80',
  'CP-CHN-2026-1003': 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&auto=format&fit=crop&q=80',

  // 1004: Besant Nagar - Damaged median kerb blocks -> Newly aligned concrete kerbs and slab
  '1004': 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800&auto=format&fit=crop&q=80',
  'CP-CHN-2026-1004': 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800&auto=format&fit=crop&q=80',

  // 1005: Perungudi - Cluster potholes on service lane -> Leveled bitumen asphalt on service road
  '1005': 'https://images.unsplash.com/photo-1584463699042-451f28b7e750?w=800&auto=format&fit=crop&q=80',
  'CP-CHN-2026-1005': 'https://images.unsplash.com/photo-1584463699042-451f28b7e750?w=800&auto=format&fit=crop&q=80',

  // 1006: T. Nagar - Underground main pipeline breach -> Cast-iron valve replaced and dry pavement
  '1006': 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop&q=80',
  'CP-CHN-2026-1006': 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop&q=80',

  // 1007: Mylapore - Packaging debris on storm drain -> Storm drain grates cleared and swept
  '1007': 'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=800&auto=format&fit=crop&q=80',
  'CP-CHN-2026-1007': 'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=800&auto=format&fit=crop&q=80',

  // 1008: Marina Beach - Sunken road slab & displaced grating -> Recast grating flush with asphalt
  '1008': 'https://images.unsplash.com/photo-1545459720-aac8509eb02c?w=800&auto=format&fit=crop&q=80',
  'CP-CHN-2026-1008': 'https://images.unsplash.com/photo-1545459720-aac8509eb02c?w=800&auto=format&fit=crop&q=80',

  // 1009: Royapettah - Concrete debris and plaster bags -> Walkway cleared and power-washed
  '1009': 'https://images.unsplash.com/photo-1595278069441-2cf29f8005a4?w=800&auto=format&fit=crop&q=80',
  'CP-CHN-2026-1009': 'https://images.unsplash.com/photo-1595278069441-2cf29f8005a4?w=800&auto=format&fit=crop&q=80',

  // 1010: Kilpauk - Main distribution collar crack -> Replaced collar, road dewatered and dry
  '1010': 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=800&auto=format&fit=crop&q=80',
  'CP-CHN-2026-1010': 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=800&auto=format&fit=crop&q=80',

  // 1011: Guindy - Flyover descent asphalt surface peeling -> Resurfaced hot-mix tarmac ramp
  '1011': 'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?w=800&auto=format&fit=crop&q=80',
  'CP-CHN-2026-1011': 'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?w=800&auto=format&fit=crop&q=80',

  // 1012: Besant Nagar - Street light not working -> Replaced LED luminaire brightly lit
  '1012': 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=800&auto=format&fit=crop&q=80',
  'CP-CHN-2026-1012': 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=800&auto=format&fit=crop&q=80',

  // 1013: T. Nagar - Damaged municipal air valve -> Air valve renewed, cast iron cover secured
  '1013': 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=800&auto=format&fit=crop&q=80',
  'CP-CHN-2026-1013': 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=800&auto=format&fit=crop&q=80',

  // 1014: Anna Salai - Deep utility trench across street -> Trench compacted and paved with asphalt
  '1014': 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=800&auto=format&fit=crop&q=80',
  'CP-CHN-2026-1014': 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=800&auto=format&fit=crop&q=80',

  // 1015: Adyar - Food packaging & coconut shells on plot -> Plot cleared and disinfected by GCC
  '1015': 'https://images.unsplash.com/photo-1584820927498-cfe5211fd8bf?w=800&auto=format&fit=crop&q=80',
  'CP-CHN-2026-1015': 'https://images.unsplash.com/photo-1584820927498-cfe5211fd8bf?w=800&auto=format&fit=crop&q=80',

  // 1016: Mylapore - Drinking water pipeline breached -> Pipeline clamped and paved over
  '1016': 'https://images.unsplash.com/photo-1541888946425-d0fbb186c5f9?w=800&auto=format&fit=crop&q=80',
  'CP-CHN-2026-1016': 'https://images.unsplash.com/photo-1541888946425-d0fbb186c5f9?w=800&auto=format&fit=crop&q=80',

  // 1017: Velachery - Sunken manhole frame -> Frame raised to grade and asphalt leveled
  '1017': 'https://images.unsplash.com/photo-1578885136359-16c8bd4d3a8e?w=800&auto=format&fit=crop&q=80',
  'CP-CHN-2026-1017': 'https://images.unsplash.com/photo-1578885136359-16c8bd4d3a8e?w=800&auto=format&fit=crop&q=80',

  // 1018: Alwarpet - Commercial wet waste leaking -> Clean washed pavement and sanitized bins
  '1018': 'https://images.unsplash.com/photo-1618477461853-cf6ed80faba5?w=800&auto=format&fit=crop&q=80',
  'CP-CHN-2026-1018': 'https://images.unsplash.com/photo-1618477461853-cf6ed80faba5?w=800&auto=format&fit=crop&q=80',

  // 1019: Perungudi - Bitumen peeling on turn lane -> Dense asphalt macadam laid on turn
  '1019': 'https://images.unsplash.com/photo-1494783367193-149034c05e8f?w=800&auto=format&fit=crop&q=80',
  'CP-CHN-2026-1019': 'https://images.unsplash.com/photo-1494783367193-149034c05e8f?w=800&auto=format&fit=crop&q=80',

  // 1020: Velachery - Feeder pipe joint fractured -> Sleeve installed, dry bund embankment
  '1020': 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&auto=format&fit=crop&q=80',
  'CP-CHN-2026-1020': 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&auto=format&fit=crop&q=80',

  // 1021: Guindy - 4 street lamps unlit -> All 4 high-mast lamps illuminated at night
  '1021': 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=800&auto=format&fit=crop&q=80',
  'CP-CHN-2026-1021': 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=800&auto=format&fit=crop&q=80',

  // 1022: Mylapore - Market waste near school wall -> Cleared, bleached and clean school boundary
  '1022': 'https://images.unsplash.com/photo-1528183429752-a97d0bf99b5a?w=800&auto=format&fit=crop&q=80',
  'CP-CHN-2026-1022': 'https://images.unsplash.com/photo-1528183429752-a97d0bf99b5a?w=800&auto=format&fit=crop&q=80',

  // 1023: Anna Salai - Drinking water gushing out of valve pit -> Valve packed, dry road
  '1023': 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop&q=80',
  'CP-CHN-2026-1023': 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop&q=80',

  // 1024: Velachery - Caved-in asphalt surface around culvert -> Culvert headwall built and road paved
  '1024': 'https://images.unsplash.com/photo-1596707328904-8b656799049d?w=800&auto=format&fit=crop&q=80',
  'CP-CHN-2026-1024': 'https://images.unsplash.com/photo-1596707328904-8b656799049d?w=800&auto=format&fit=crop&q=80',

  // 1025: Guindy - Discarded crates and plastic on green verge -> Green verge cleared and landscaped
  '1025': 'https://images.unsplash.com/photo-1517649763962-0c623266ddc0?w=800&auto=format&fit=crop&q=80',
  'CP-CHN-2026-1025': 'https://images.unsplash.com/photo-1517649763962-0c623266ddc0?w=800&auto=format&fit=crop&q=80',
};

export const getAfterPhotoForComplaint = (idOrFullId: string, category?: string): string => {
  const shortId = idOrFullId.match(/(\d{4})$/)?.[1] || idOrFullId;
  if (CANONICAL_AFTER_PHOTOS[shortId]) return CANONICAL_AFTER_PHOTOS[shortId];
  if (CANONICAL_AFTER_PHOTOS[idOrFullId]) return CANONICAL_AFTER_PHOTOS[idOrFullId];
  return getCategoryFallbackPhoto(category, true);
};

// Convert all 25 rows to canonical full Complaint models
export const CANONICAL_25_COMPLAINTS: Complaint[] = REFERENCE_SAMPLE_ROWS.map((row, index) => {
  const coords = LOCATION_COORDS[row.location] || {
    lat: 13.0418 + (index * 0.003),
    lng: 80.2341 + (index * 0.002),
    zone: 'Zone 10 (Kodambakkam)',
    ward: 'Ward 136',
  };

  const stdCategory = getStandardCategory(row.category);
  const deptName = getFullDepartmentName(row.department);

  const statusMap: Record<string, 'Received' | 'In Progress' | 'Resolved' | 'Awaiting Admin Verification'> = {
    'Unresolved': 'Received',
    'In Progress': 'In Progress',
    'Resolved': 'Resolved',
  };

  const currentStatus = statusMap[row.status] || 'Received';
  const priorityMap: Record<string, 'Critical' | 'High' | 'Medium' | 'Low'> = {
    'High': 'High',
    'Medium': 'Medium',
    'Low': 'Low',
    '—': 'Low',
  };

  const afterPhoto = getAfterPhotoForComplaint(row.id, row.category);

  return {
    id: row.fullId,
    category: stdCategory,
    description: row.detail,
    location: {
      address: `${row.location}, Chennai`,
      zone: coords.zone,
      ward: coords.ward,
      coordinates: {
        lat: coords.lat,
        lng: coords.lng,
      },
      geoJsonCoordinates: [coords.lng, coords.lat],
      landmark: `Near ${row.location} Junction`,
    },
    originalPhotoUrl: row.photo,
    submissionTimestamp: new Date(`2026-10-${row.date.split(' ')[0]}T${row.time.includes('PM') ? '14:30:00' : '09:30:00'}Z`).toISOString(),
    createdAt: new Date(`2026-10-${row.date.split(' ')[0]}T${row.time.includes('PM') ? '14:30:00' : '09:30:00'}Z`).toISOString(),
    priority: priorityMap[row.priority] || 'Medium',
    priorityReason: `${row.category} in active civic sector ${row.location}.`,
    assignedDepartment: deptName,
    assignmentTimestamp: new Date().toISOString(),
    currentStatus: currentStatus,
    status: currentStatus,
    reporterType: 'Registered Citizen',
    reporterInfo: {
      citizenId: `CIT-CHN-${row.id}`,
      name: `Citizen ${row.id}`,
      isVerifiedUser: true,
    },
    slaDeadline: new Date(Date.now() + 48 * 3600 * 1000).toISOString(),
    isOverdue: false,
    isDemo: true,
    verification: {
      submittedAt: new Date(`2026-10-${row.date.split(' ')[0]}T16:00:00Z`).toISOString(),
      submittedByDepartment: deptName,
      afterRepairPhotoUrl: afterPhoto,
      repairNotes: `Field team resolved issue at ${row.location}. Completed rectification and uploaded photographic proof.`,
      verifiedAt: row.status === 'Resolved' ? new Date().toISOString() : undefined,
      verifiedBy: row.status === 'Resolved' ? 'Er. K. Sivakumar (Admin)' : undefined,
      decision: row.status === 'Resolved' ? 'Approved' : undefined,
      resubmissionCount: 0,
    },
    history: [
      {
        id: `LOG-${row.id}-1`,
        timestamp: new Date().toISOString(),
        action: 'Complaint Registered',
        actor: 'Citizen Portal',
        newValue: 'Received',
      },
    ],
  };
});

