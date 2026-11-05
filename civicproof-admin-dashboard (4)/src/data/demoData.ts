import type { Complaint, NotificationRecord } from '../types/civic';

export interface SampleComplaintRow {
  id: string;
  fullId: string;
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

export const DEMO_COMPLAINTS: Complaint[] = [
  {
    "id": "CP-CHN-2026-1001",
    "category": "Road Damage",
    "description": "Deep 2-foot pothole on central lane outside Thousand Lights metro station, causing traffic slowdown and two-wheeler skids.",
    "location": {
      "address": "Anna Salai, Near Thousand Lights, Chennai",
      "zone": "Zone 9 (Teynampet)",
      "ward": "Ward 114",
      "coordinates": {
        "lat": 13.0604,
        "lng": 80.2496
      },
      "geoJsonCoordinates": [
        80.2496,
        13.0604
      ],
      "landmark": "Near Thousand Lights Mosque & Metro Gate 2"
    },
    "originalPhotoUrl": "/images/thumb_pothole_1.jpg",
    "originalPhotoPath": "complaints/CP-CHN-2026-1001/pothole_annasalai.jpg",
    "submissionTimestamp": "2026-11-02T08:23:50.439Z",
    "createdAt": "2026-11-02T08:23:50.448Z",
    "updatedAt": "2026-11-02T14:23:50.448Z",
    "priority": "Critical",
    "priorityReason": "Arterial road with heavy bus and two-wheeler transit; high casualty potential during evening peak hours.",
    "priorityScore": 95,
    "assignedDepartmentId": "roads_and_infrastructure",
    "assignedDepartment": "Roads and Infrastructure Department",
    "assignmentTimestamp": "2026-11-02T09:23:50.448Z",
    "currentStatus": "Assigned",
    "status": "Assigned",
    "reporterType": "Registered Citizen",
    "reporterId": "user_cit_sundar_9102",
    "reporterInfo": {
      "citizenId": "CIT-TN-9102",
      "name": "Sundar Rajan",
      "maskedContact": "+91 98401 *****",
      "isVerifiedUser": true
    },
    "slaDeadline": "2026-11-03T20:23:50.448Z",
    "isOverdue": false,
    "isDemo": true,
    "history": [
      {
        "id": "LOG-1001-1",
        "timestamp": "2026-11-02T08:23:50.448Z",
        "action": "Complaint Registered",
        "actor": "Citizen Portal",
        "newValue": "Received"
      },
      {
        "id": "LOG-1001-2",
        "timestamp": "2026-11-02T09:23:50.448Z",
        "action": "Auto-Assigned Department",
        "actor": "Namma Ooru Routing Engine",
        "newValue": "Roads and Infrastructure Department"
      }
    ]
  },
  {
    "id": "CP-CHN-2026-1002",
    "category": "Improper Waste Disposal",
    "description": "1100L green compactor bin overflowing with vegetable and domestic waste, spilling 15 meters onto pedestrian walkway.",
    "location": {
      "address": "100 Feet Bypass Road, Velachery, Chennai",
      "zone": "Zone 13 (Adyar)",
      "ward": "Ward 178",
      "coordinates": {
        "lat": 12.9759,
        "lng": 80.2212
      },
      "geoJsonCoordinates": [
        80.2212,
        12.9759
      ],
      "landmark": "Near Vijayanagar Bus Stop Junction"
    },
    "originalPhotoUrl": "/images/thumb_garbage.jpg",
    "originalPhotoPath": "complaints/CP-CHN-2026-1002/garbage_velachery.jpg",
    "submissionTimestamp": "2026-11-01T20:23:50.448Z",
    "createdAt": "2026-11-01T20:23:50.448Z",
    "updatedAt": "2026-11-03T00:23:50.448Z",
    "priority": "High",
    "priorityReason": "Sanitation biohazard in high-density residential ward with odor and vector infestation.",
    "priorityScore": 82,
    "assignedDepartmentId": "solid_waste_management",
    "assignedDepartment": "Solid Waste Management Department",
    "assignmentTimestamp": "2026-11-01T21:23:50.448Z",
    "currentStatus": "In Progress",
    "status": "In Progress",
    "reporterType": "Registered Citizen",
    "reporterId": "user_cit_kavitha_7321",
    "reporterInfo": {
      "citizenId": "CIT-TN-7321",
      "name": "Kavitha Balan",
      "maskedContact": "+91 94440 *****",
      "isVerifiedUser": true
    },
    "slaDeadline": "2026-11-02T20:23:50.448Z",
    "isOverdue": true,
    "isDemo": true,
    "history": [
      {
        "id": "LOG-1002-1",
        "timestamp": "2026-11-01T20:23:50.448Z",
        "action": "Complaint Registered",
        "actor": "Citizen Portal",
        "newValue": "Received"
      },
      {
        "id": "LOG-1002-2",
        "timestamp": "2026-11-02T12:23:50.448Z",
        "action": "Status Updated",
        "actor": "Zonal Sanitary Officer",
        "previousValue": "Assigned",
        "newValue": "In Progress"
      }
    ]
  },
  {
    "id": "CP-CHN-2026-1003",
    "category": "Water Leakage",
    "description": "Underground potable water distribution line crack leaking clean drinking water and inundating street corner.",
    "location": {
      "address": "Gandhi Nagar 2nd Crescent, Adyar, Chennai",
      "zone": "Zone 13 (Adyar)",
      "ward": "Ward 173",
      "coordinates": {
        "lat": 13.0067,
        "lng": 80.2575
      },
      "geoJsonCoordinates": [
        80.2575,
        13.0067
      ],
      "landmark": "Near Adyar Club Gate"
    },
    "originalPhotoUrl": "/images/thumb_water.jpg",
    "originalPhotoPath": "complaints/CP-CHN-2026-1003/water_leak_adyar.jpg",
    "submissionTimestamp": "2026-11-02T14:23:50.448Z",
    "createdAt": "2026-11-02T14:23:50.448Z",
    "updatedAt": "2026-11-02T22:23:50.448Z",
    "priority": "Medium",
    "priorityReason": "Drinking water loss and minor pavement erosion.",
    "priorityScore": 68,
    "assignedDepartmentId": "water_supply_and_sewerage",
    "assignedDepartment": "Water Supply and Sewerage Department",
    "assignmentTimestamp": "2026-11-02T15:23:50.448Z",
    "currentStatus": "In Progress",
    "status": "In Progress",
    "reporterType": "Registered Citizen",
    "reporterId": "user_cit_vijay_5541",
    "reporterInfo": {
      "citizenId": "CIT-TN-5541",
      "name": "Vijay Anand",
      "maskedContact": "+91 98410 *****",
      "isVerifiedUser": true
    },
    "slaDeadline": "2026-11-04T02:23:50.448Z",
    "isOverdue": false,
    "isDemo": true,
    "history": [
      {
        "id": "LOG-1003-1",
        "timestamp": "2026-11-02T14:23:50.448Z",
        "action": "Complaint Registered",
        "actor": "Citizen Portal",
        "newValue": "Received"
      }
    ]
  },
  {
    "id": "CP-CHN-2026-1004",
    "category": "Road Damage",
    "description": "Damaged median kerb blocks and missing manhole slab creating pedestrian hazard near Elliot Beach walkway.",
    "location": {
      "address": "Beach Road, Besant Nagar, Chennai",
      "zone": "Zone 13 (Adyar)",
      "ward": "Ward 176",
      "coordinates": {
        "lat": 12.9982,
        "lng": 80.2707
      },
      "geoJsonCoordinates": [
        80.2707,
        12.9982
      ],
      "landmark": "Opposite Cozee Restaurant"
    },
    "originalPhotoUrl": "/images/thumb_pothole_2.jpg",
    "originalPhotoPath": "complaints/CP-CHN-2026-1004/besant_road.jpg",
    "submissionTimestamp": "2026-11-01T08:23:50.448Z",
    "createdAt": "2026-11-01T08:23:50.448Z",
    "updatedAt": "2026-11-02T12:23:50.448Z",
    "priority": "Low",
    "priorityReason": "Non-arterial residential avenue defect.",
    "priorityScore": 45,
    "assignedDepartmentId": "roads_and_infrastructure",
    "assignedDepartment": "Roads and Infrastructure Department",
    "assignmentTimestamp": "2026-11-01T09:23:50.448Z",
    "currentStatus": "Resolved",
    "status": "Resolved",
    "reporterType": "Registered Citizen",
    "reporterId": "user_cit_lakshmi_2039",
    "reporterInfo": {
      "citizenId": "CIT-TN-2039",
      "name": "Lakshmi Narayanan",
      "maskedContact": "+91 97890 *****",
      "isVerifiedUser": true
    },
    "slaDeadline": "2026-11-02T08:23:50.448Z",
    "isOverdue": false,
    "isDemo": true,
    "verification": {
      "submittedAt": "2026-11-02T10:23:50.448Z",
      "submittedByDepartment": "Roads and Infrastructure Department",
      "afterRepairPhotoUrl": "/images/thumb_pothole_2.jpg",
      "repairNotes": "Kerb stones reset and cement concrete collar poured around manhole frame.",
      "verifiedAt": "2026-11-02T12:23:50.448Z",
      "verifiedBy": "Er. K. Sivakumar (Admin)",
      "decision": "Approved",
      "resubmissionCount": 0
    },
    "history": [
      {
        "id": "LOG-1004-1",
        "timestamp": "2026-11-01T08:23:50.448Z",
        "action": "Complaint Registered",
        "actor": "Citizen Portal",
        "newValue": "Received"
      },
      {
        "id": "LOG-1004-2",
        "timestamp": "2026-11-02T12:23:50.448Z",
        "action": "Resolution Approved",
        "actor": "Er. K. Sivakumar (Admin)",
        "newValue": "Resolved"
      }
    ]
  },
  {
    "id": "CP-CHN-2026-1005",
    "category": "Road Damage",
    "description": "Cluster of 3 potholes on OMR service lane outside RMZ Millenia tech park causing bumper-to-bumper morning jams.",
    "location": {
      "address": "OMR Road, Perungudi, Chennai",
      "zone": "Zone 14 (Perungudi)",
      "ward": "Ward 184",
      "coordinates": {
        "lat": 12.9654,
        "lng": 80.2461
      },
      "geoJsonCoordinates": [
        80.2461,
        12.9654
      ],
      "landmark": "Near RMZ Millenia Campus 1A"
    },
    "originalPhotoUrl": "/images/thumb_pothole_1.jpg",
    "originalPhotoPath": "complaints/CP-CHN-2026-1005/perungudi_pothole.jpg",
    "submissionTimestamp": "2026-11-02T04:23:50.448Z",
    "createdAt": "2026-11-02T04:23:50.448Z",
    "updatedAt": "2026-11-03T04:23:50.448Z",
    "priority": "High",
    "priorityReason": "High-density tech corridor transit route with high commercial traffic impact.",
    "priorityScore": 84,
    "assignedDepartmentId": "roads_and_infrastructure",
    "assignedDepartment": "Roads and Infrastructure Department",
    "assignmentTimestamp": "2026-11-02T05:23:50.448Z",
    "currentStatus": "Awaiting Admin Verification",
    "status": "Awaiting Admin Verification",
    "reporterType": "Registered Citizen",
    "reporterId": "user_cit_praveen_6612",
    "reporterInfo": {
      "citizenId": "CIT-TN-6612",
      "name": "Praveen Kumar",
      "maskedContact": "+91 99620 *****",
      "isVerifiedUser": true
    },
    "slaDeadline": "2026-11-04T04:23:50.448Z",
    "isOverdue": false,
    "isDemo": true,
    "verification": {
      "submittedAt": "2026-11-03T04:23:50.448Z",
      "submittedByDepartment": "Roads and Infrastructure Department",
      "afterRepairPhotoUrl": "/images/thumb_pothole_1.jpg",
      "repairNotes": "Cold mix asphalt leveling and roller compaction completed on service road.",
      "resubmissionCount": 0
    },
    "history": [
      {
        "id": "LOG-1005-1",
        "timestamp": "2026-11-02T04:23:50.448Z",
        "action": "Complaint Registered",
        "actor": "Citizen Portal",
        "newValue": "Received"
      },
      {
        "id": "LOG-1005-2",
        "timestamp": "2026-11-03T04:23:50.448Z",
        "action": "Repair Evidence Submitted",
        "actor": "Junior Engineer, Zone 14 Roads",
        "newValue": "Awaiting Admin Verification"
      }
    ]
  },
  {
    "id": "CP-CHN-2026-1006",
    "category": "Water Leakage",
    "description": "Underground main pipeline valve breach with continuous fountain spilling thousands of liters of potable water.",
    "location": {
      "address": "Usman Road, T. Nagar, Chennai",
      "zone": "Zone 10 (Kodambakkam)",
      "ward": "Ward 136",
      "coordinates": {
        "lat": 13.0418,
        "lng": 80.2337
      },
      "geoJsonCoordinates": [
        80.2337,
        13.0418
      ],
      "landmark": "Near Panagal Park Bus Stop"
    },
    "originalPhotoUrl": "/images/thumb_water.jpg",
    "originalPhotoPath": "complaints/CP-CHN-2026-1006/tnagar_water.jpg",
    "submissionTimestamp": "2026-11-02T12:23:50.448Z",
    "createdAt": "2026-11-02T12:23:50.448Z",
    "updatedAt": "2026-11-03T00:23:50.448Z",
    "priority": "Critical",
    "priorityReason": "Heavy drinking water wastage in central commercial hub; flood hazard to ground floor shops.",
    "priorityScore": 92,
    "assignedDepartmentId": "water_supply_and_sewerage",
    "assignedDepartment": "Water Supply and Sewerage Department",
    "assignmentTimestamp": "2026-11-02T13:23:50.448Z",
    "currentStatus": "In Progress",
    "status": "In Progress",
    "reporterType": "Registered Citizen",
    "reporterId": "user_cit_anitha_1192",
    "reporterInfo": {
      "citizenId": "CIT-TN-1192",
      "name": "Anitha Ramesh",
      "maskedContact": "+91 98402 *****",
      "isVerifiedUser": true
    },
    "slaDeadline": "2026-11-03T12:23:50.448Z",
    "isOverdue": false,
    "isDemo": true,
    "history": [
      {
        "id": "LOG-1006-1",
        "timestamp": "2026-11-02T12:23:50.448Z",
        "action": "Complaint Registered",
        "actor": "Citizen Portal",
        "newValue": "Received"
      }
    ]
  },
  {
    "id": "CP-CHN-2026-1007",
    "category": "Improper Waste Disposal",
    "description": "Commercial packaging cartons, thermocol waste, and plastic crates dumped near Luz Corner junction.",
    "location": {
      "address": "Luz Church Road, Mylapore, Chennai",
      "zone": "Zone 9 (Teynampet)",
      "ward": "Ward 124",
      "coordinates": {
        "lat": 13.0368,
        "lng": 80.2676
      },
      "geoJsonCoordinates": [
        80.2676,
        13.0368
      ],
      "landmark": "Opposite Luz Anjaneyar Temple"
    },
    "originalPhotoUrl": "/images/thumb_garbage.jpg",
    "originalPhotoPath": "complaints/CP-CHN-2026-1007/mylapore_waste.jpg",
    "submissionTimestamp": "2026-11-02T18:23:50.448Z",
    "createdAt": "2026-11-02T18:23:50.448Z",
    "updatedAt": "2026-11-02T18:23:50.448Z",
    "priority": "Medium",
    "priorityReason": "Commercial corridor encroachment and fire hazard near electrical transformers.",
    "priorityScore": 66,
    "assignedDepartmentId": "solid_waste_management",
    "assignedDepartment": "Solid Waste Management Department",
    "assignmentTimestamp": "2026-11-02T19:23:50.448Z",
    "currentStatus": "Received",
    "status": "Received",
    "reporterType": "Anonymous Reporter",
    "slaDeadline": "2026-11-04T18:23:50.448Z",
    "isOverdue": false,
    "isDemo": true,
    "history": [
      {
        "id": "LOG-1007-1",
        "timestamp": "2026-11-02T18:23:50.448Z",
        "action": "Complaint Registered",
        "actor": "Anonymous Citizen",
        "newValue": "Received"
      }
    ]
  },
  {
    "id": "CP-CHN-2026-1008",
    "category": "Road Damage",
    "description": "Sunken road slab and storm water drain displacement opposite Marina Beach promenade.",
    "location": {
      "address": "Kamarajar Salai, Marina Beach, Chennai",
      "zone": "Zone 9 (Teynampet)",
      "ward": "Ward 120",
      "coordinates": {
        "lat": 13.0498,
        "lng": 80.2824
      },
      "geoJsonCoordinates": [
        80.2824,
        13.0498
      ],
      "landmark": "Opposite Chennai Lighthouse Promenade"
    },
    "originalPhotoUrl": "/images/thumb_pothole_2.jpg",
    "originalPhotoPath": "complaints/CP-CHN-2026-1008/marina_slab.jpg",
    "submissionTimestamp": "2026-11-02T00:23:50.448Z",
    "createdAt": "2026-11-02T00:23:50.448Z",
    "updatedAt": "2026-11-03T02:23:50.448Z",
    "priority": "Critical",
    "priorityReason": "Major tourist corridor with heavy pedestrian and weekend vehicular movement.",
    "priorityScore": 90,
    "assignedDepartmentId": "roads_and_infrastructure",
    "assignedDepartment": "Roads and Infrastructure Department",
    "assignmentTimestamp": "2026-11-02T01:23:50.448Z",
    "currentStatus": "In Progress",
    "status": "In Progress",
    "reporterType": "Registered Citizen",
    "reporterId": "user_cit_suresh_8819",
    "reporterInfo": {
      "citizenId": "CIT-TN-8819",
      "name": "Suresh Varma",
      "maskedContact": "+91 98403 *****",
      "isVerifiedUser": true
    },
    "slaDeadline": "2026-11-03T00:23:50.448Z",
    "isOverdue": true,
    "isDemo": true,
    "history": [
      {
        "id": "LOG-1008-1",
        "timestamp": "2026-11-02T00:23:50.448Z",
        "action": "Complaint Registered",
        "actor": "Citizen Portal",
        "newValue": "Received"
      }
    ]
  },
  {
    "id": "CP-CHN-2026-1009",
    "category": "Improper Waste Disposal",
    "description": "Demolition concrete debris and cement plaster bags dumped on walkway blocking pedestrian movement.",
    "location": {
      "address": "Royapettah High Road, Near Express Avenue, Chennai",
      "zone": "Zone 9 (Teynampet)",
      "ward": "Ward 119",
      "coordinates": {
        "lat": 13.0544,
        "lng": 80.2612
      },
      "geoJsonCoordinates": [
        80.2612,
        13.0544
      ],
      "landmark": "Near Peter Road Junction"
    },
    "originalPhotoUrl": "/images/thumb_garbage.jpg",
    "originalPhotoPath": "complaints/CP-CHN-2026-1009/royapettah_waste.jpg",
    "submissionTimestamp": "2026-11-02T06:23:50.448Z",
    "createdAt": "2026-11-02T06:23:50.448Z",
    "updatedAt": "2026-11-03T05:23:50.448Z",
    "priority": "High",
    "priorityReason": "Pedestrian displacement onto busy vehicle carriage-way; danger to senior citizens.",
    "priorityScore": 78,
    "assignedDepartmentId": "solid_waste_management",
    "assignedDepartment": "Solid Waste Management Department",
    "assignmentTimestamp": "2026-11-02T07:23:50.448Z",
    "currentStatus": "Awaiting Admin Verification",
    "status": "Awaiting Admin Verification",
    "reporterType": "Registered Citizen",
    "reporterId": "user_cit_deepa_3341",
    "reporterInfo": {
      "citizenId": "CIT-TN-3341",
      "name": "Deepa Natarajan",
      "maskedContact": "+91 94441 *****",
      "isVerifiedUser": true
    },
    "slaDeadline": "2026-11-03T18:23:50.448Z",
    "isOverdue": false,
    "isDemo": true,
    "verification": {
      "submittedAt": "2026-11-03T05:23:50.448Z",
      "submittedByDepartment": "Solid Waste Management Department",
      "afterRepairPhotoUrl": "/images/thumb_garbage.jpg",
      "repairNotes": "Mechanical loader dispatched; 3 MT debris cleared and footpath washed.",
      "resubmissionCount": 0
    },
    "history": [
      {
        "id": "LOG-1009-1",
        "timestamp": "2026-11-02T06:23:50.448Z",
        "action": "Complaint Registered",
        "actor": "Citizen Portal",
        "newValue": "Received"
      }
    ]
  },
  {
    "id": "CP-CHN-2026-1010",
    "category": "Water Leakage",
    "description": "Underground drinking water main feeder breach outside Government Hospital campus creating water stagnation.",
    "location": {
      "address": "Poonamallee High Road, Kilpauk, Chennai",
      "zone": "Zone 8 (Anna Nagar)",
      "ward": "Ward 102",
      "coordinates": {
        "lat": 13.0784,
        "lng": 80.2412
      },
      "geoJsonCoordinates": [
        80.2412,
        13.0784
      ],
      "landmark": "Near Kilpauk Medical College & Hospital Gate 3"
    },
    "originalPhotoUrl": "/images/thumb_water.jpg",
    "originalPhotoPath": "complaints/CP-CHN-2026-1010/kilpauk_water.jpg",
    "submissionTimestamp": "2026-11-02T16:23:50.448Z",
    "createdAt": "2026-11-02T16:23:50.448Z",
    "updatedAt": "2026-11-02T17:23:50.448Z",
    "priority": "Critical",
    "priorityReason": "Hospital zone emergency corridor with ambulance delay risk and drinking water disruption.",
    "priorityScore": 96,
    "assignedDepartmentId": "water_supply_and_sewerage",
    "assignedDepartment": "Water Supply and Sewerage Department",
    "assignmentTimestamp": "2026-11-02T17:23:50.448Z",
    "currentStatus": "Assigned",
    "status": "Assigned",
    "reporterType": "Registered Citizen",
    "reporterId": "user_cit_dr_sankaran_102",
    "reporterInfo": {
      "citizenId": "CIT-TN-102",
      "name": "Dr. G. Sankaran",
      "maskedContact": "+91 98404 *****",
      "isVerifiedUser": true
    },
    "slaDeadline": "2026-11-03T16:23:50.448Z",
    "isOverdue": false,
    "isDemo": true,
    "history": [
      {
        "id": "LOG-1010-1",
        "timestamp": "2026-11-02T16:23:50.448Z",
        "action": "Complaint Registered",
        "actor": "Citizen Portal",
        "newValue": "Received"
      }
    ]
  },
  {
    "id": "CP-CHN-2026-1011",
    "category": "Road Damage",
    "description": "Flyover descent asphalt surface peeling with exposed coarse aggregate causing braking skids.",
    "location": {
      "address": "GST Road, Kathipara Junction, Guindy, Chennai",
      "zone": "Zone 10 (Kodambakkam)",
      "ward": "Ward 168",
      "coordinates": {
        "lat": 13.0067,
        "lng": 80.2026
      },
      "geoJsonCoordinates": [
        80.2026,
        13.0067
      ],
      "landmark": "Kathipara Cloverleaf towards Airport Ramp"
    },
    "originalPhotoUrl": "/images/thumb_pothole_1.jpg",
    "originalPhotoPath": "complaints/CP-CHN-2026-1011/kathipara_road.jpg",
    "submissionTimestamp": "2026-10-31T20:23:50.448Z",
    "createdAt": "2026-10-31T20:23:50.448Z",
    "updatedAt": "2026-11-02T02:23:50.448Z",
    "priority": "Medium",
    "priorityReason": "High vehicular speed flyover approach ramp.",
    "priorityScore": 70,
    "assignedDepartmentId": "roads_and_infrastructure",
    "assignedDepartment": "Roads and Infrastructure Department",
    "assignmentTimestamp": "2026-10-31T21:23:50.448Z",
    "currentStatus": "Resolved",
    "status": "Resolved",
    "reporterType": "Registered Citizen",
    "reporterId": "user_cit_manikandan_7718",
    "reporterInfo": {
      "citizenId": "CIT-TN-7718",
      "name": "Manikandan E.",
      "maskedContact": "+91 98840 *****",
      "isVerifiedUser": true
    },
    "slaDeadline": "2026-11-01T20:23:50.448Z",
    "isOverdue": false,
    "isDemo": true,
    "verification": {
      "submittedAt": "2026-11-02T00:23:50.448Z",
      "submittedByDepartment": "Roads and Infrastructure Department",
      "afterRepairPhotoUrl": "/images/thumb_pothole_1.jpg",
      "repairNotes": "Bituminous carpet milling and hot-mix relaying completed overnight.",
      "verifiedAt": "2026-11-02T02:23:50.448Z",
      "verifiedBy": "Er. K. Sivakumar (Admin)",
      "decision": "Approved",
      "resubmissionCount": 0
    },
    "history": [
      {
        "id": "LOG-1011-1",
        "timestamp": "2026-10-31T20:23:50.448Z",
        "action": "Complaint Registered",
        "actor": "Citizen Portal",
        "newValue": "Received"
      }
    ]
  },
  {
    "id": "CP-CHN-2026-1012",
    "category": "Improper Waste Disposal",
    "description": "Pruned tree branches and dense garden horticulture refuse blocking stormwater gutter.",
    "location": {
      "address": "College Road, Nungambakkam, Chennai",
      "zone": "Zone 9 (Teynampet)",
      "ward": "Ward 110",
      "coordinates": {
        "lat": 13.0569,
        "lng": 80.2425
      },
      "geoJsonCoordinates": [
        80.2425,
        13.0569
      ],
      "landmark": "Opposite Women Christian College Gate"
    },
    "originalPhotoUrl": "/images/thumb_garbage.jpg",
    "originalPhotoPath": "complaints/CP-CHN-2026-1012/nungambakkam_waste.jpg",
    "submissionTimestamp": "2026-11-02T20:23:50.448Z",
    "createdAt": "2026-11-02T20:23:50.448Z",
    "updatedAt": "2026-11-03T02:23:50.448Z",
    "priority": "Low",
    "priorityReason": "Non-toxic organic waste in residential sector.",
    "priorityScore": 40,
    "assignedDepartmentId": "solid_waste_management",
    "assignedDepartment": "Solid Waste Management Department",
    "assignmentTimestamp": "2026-11-02T21:23:50.448Z",
    "currentStatus": "In Progress",
    "status": "In Progress",
    "reporterType": "Registered Citizen",
    "reporterId": "user_cit_revathi_9921",
    "reporterInfo": {
      "citizenId": "CIT-TN-9921",
      "name": "Revathi S.",
      "maskedContact": "+91 98405 *****",
      "isVerifiedUser": true
    },
    "slaDeadline": "2026-11-05T08:23:50.448Z",
    "isOverdue": false,
    "isDemo": true,
    "history": [
      {
        "id": "LOG-1012-1",
        "timestamp": "2026-11-02T20:23:50.448Z",
        "action": "Complaint Registered",
        "actor": "Citizen Portal",
        "newValue": "Received"
      }
    ]
  },
  {
    "id": "CP-CHN-2026-1013",
    "category": "Water Leakage",
    "description": "Damaged CMWSSB air relief valve leaking and creating localized water depression on Arcot Road.",
    "location": {
      "address": "Arcot Road, Kodambakkam, Chennai",
      "zone": "Zone 10 (Kodambakkam)",
      "ward": "Ward 130",
      "coordinates": {
        "lat": 13.0514,
        "lng": 80.2223
      },
      "geoJsonCoordinates": [
        80.2223,
        13.0514
      ],
      "landmark": "Near Meenakshi College & Power House"
    },
    "originalPhotoUrl": "/images/thumb_water.jpg",
    "originalPhotoPath": "complaints/CP-CHN-2026-1013/arcot_water.jpg",
    "submissionTimestamp": "2026-11-02T10:23:50.448Z",
    "createdAt": "2026-11-02T10:23:50.448Z",
    "updatedAt": "2026-11-03T06:23:50.448Z",
    "priority": "High",
    "priorityReason": "Water pipe pressure disruption affecting over 800 residential pipeline connections.",
    "priorityScore": 76,
    "assignedDepartmentId": "water_supply_and_sewerage",
    "assignedDepartment": "Water Supply and Sewerage Department",
    "assignmentTimestamp": "2026-11-02T11:23:50.448Z",
    "currentStatus": "Awaiting Admin Verification",
    "status": "Awaiting Admin Verification",
    "reporterType": "Registered Citizen",
    "reporterId": "user_cit_karthik_4102",
    "reporterInfo": {
      "citizenId": "CIT-TN-4102",
      "name": "Karthik Subramanian",
      "maskedContact": "+91 97910 *****",
      "isVerifiedUser": true
    },
    "slaDeadline": "2026-11-03T22:23:50.449Z",
    "isOverdue": false,
    "isDemo": true,
    "verification": {
      "submittedAt": "2026-11-03T06:23:50.449Z",
      "submittedByDepartment": "Water Supply and Sewerage Department",
      "afterRepairPhotoUrl": "/images/thumb_water.jpg",
      "repairNotes": "Brass valve assembly replaced; pressure checked at 2.1 bar with zero leakage.",
      "resubmissionCount": 0
    },
    "history": [
      {
        "id": "LOG-1013-1",
        "timestamp": "2026-11-02T10:23:50.449Z",
        "action": "Complaint Registered",
        "actor": "Citizen Portal",
        "newValue": "Received"
      }
    ]
  },
  {
    "id": "CP-CHN-2026-1014",
    "category": "Road Damage",
    "description": "Deep unpaved utility trench across 4th Avenue residential street causing two-wheeler axle damage.",
    "location": {
      "address": "Shanthi Colony 4th Avenue, Anna Nagar, Chennai",
      "zone": "Zone 8 (Anna Nagar)",
      "ward": "Ward 98",
      "coordinates": {
        "lat": 13.085,
        "lng": 80.2101
      },
      "geoJsonCoordinates": [
        80.2101,
        13.085
      ],
      "landmark": "Near Anna Nagar Tower Park Gate"
    },
    "originalPhotoUrl": "/images/thumb_pothole_2.jpg",
    "originalPhotoPath": "complaints/CP-CHN-2026-1014/annanagar_road.jpg",
    "submissionTimestamp": "2026-11-02T22:23:50.449Z",
    "createdAt": "2026-11-02T22:23:50.449Z",
    "updatedAt": "2026-11-02T23:23:50.449Z",
    "priority": "High",
    "priorityReason": "Hazardous uncovered trench across dense residential commuter route.",
    "priorityScore": 80,
    "assignedDepartmentId": "roads_and_infrastructure",
    "assignedDepartment": "Roads and Infrastructure Department",
    "assignmentTimestamp": "2026-11-02T23:23:50.449Z",
    "currentStatus": "Assigned",
    "status": "Assigned",
    "reporterType": "Registered Citizen",
    "reporterId": "user_cit_shankar_5510",
    "reporterInfo": {
      "citizenId": "CIT-TN-5510",
      "name": "Shankar Raman",
      "maskedContact": "+91 94442 *****",
      "isVerifiedUser": true
    },
    "slaDeadline": "2026-11-04T10:23:50.449Z",
    "isOverdue": false,
    "isDemo": true,
    "history": [
      {
        "id": "LOG-1014-1",
        "timestamp": "2026-11-02T22:23:50.449Z",
        "action": "Complaint Registered",
        "actor": "Citizen Portal",
        "newValue": "Received"
      }
    ]
  },
  {
    "id": "CP-CHN-2026-1015",
    "category": "Improper Waste Disposal",
    "description": "Food stall single-use packaging and tender coconut shells accumulating along East Coast Road junction.",
    "location": {
      "address": "East Coast Road (ECR), Thiruvanmiyur, Chennai",
      "zone": "Zone 13 (Adyar)",
      "ward": "Ward 179",
      "coordinates": {
        "lat": 12.983,
        "lng": 80.2594
      },
      "geoJsonCoordinates": [
        80.2594,
        12.983
      ],
      "landmark": "Near Thiruvanmiyur Bus Terminus & ECR Junction"
    },
    "originalPhotoUrl": "/images/thumb_garbage.jpg",
    "originalPhotoPath": "complaints/CP-CHN-2026-1015/ecr_garbage.jpg",
    "submissionTimestamp": "2026-11-01T06:23:50.449Z",
    "createdAt": "2026-11-01T06:23:50.449Z",
    "updatedAt": "2026-11-02T08:23:50.449Z",
    "priority": "Medium",
    "priorityReason": "Coastal highway entry visual and environmental degradation.",
    "priorityScore": 62,
    "assignedDepartmentId": "solid_waste_management",
    "assignedDepartment": "Solid Waste Management Department",
    "assignmentTimestamp": "2026-11-01T07:23:50.449Z",
    "currentStatus": "Resolved",
    "status": "Resolved",
    "reporterType": "Registered Citizen",
    "reporterId": "user_cit_swaminathan_8820",
    "reporterInfo": {
      "citizenId": "CIT-TN-8820",
      "name": "Swaminathan V.",
      "maskedContact": "+91 98406 *****",
      "isVerifiedUser": true
    },
    "slaDeadline": "2026-11-02T06:23:50.449Z",
    "isOverdue": false,
    "isDemo": true,
    "verification": {
      "submittedAt": "2026-11-02T07:23:50.449Z",
      "submittedByDepartment": "Solid Waste Management Department",
      "afterRepairPhotoUrl": "/images/thumb_garbage.jpg",
      "repairNotes": "Area cleared by municipal compactor team; warning sign board installed.",
      "verifiedAt": "2026-11-02T08:23:50.449Z",
      "verifiedBy": "Er. K. Sivakumar (Admin)",
      "decision": "Approved",
      "resubmissionCount": 0
    },
    "history": [
      {
        "id": "LOG-1015-1",
        "timestamp": "2026-11-01T06:23:50.449Z",
        "action": "Complaint Registered",
        "actor": "Citizen Portal",
        "newValue": "Received"
      }
    ]
  },
  {
    "id": "CP-CHN-2026-1016",
    "category": "Water Leakage",
    "description": "Drinking water distribution line punctured during cable trenching on Pycrofts Road, flooding road edge.",
    "location": {
      "address": "Pycrofts Road, Triplicane, Chennai",
      "zone": "Zone 9 (Teynampet)",
      "ward": "Ward 115",
      "coordinates": {
        "lat": 13.0583,
        "lng": 80.275
      },
      "geoJsonCoordinates": [
        80.275,
        13.0583
      ],
      "landmark": "Near Triplicane Post Office & Parthasarathy Temple Area"
    },
    "originalPhotoUrl": "/images/thumb_water.jpg",
    "originalPhotoPath": "complaints/CP-CHN-2026-1016/triplicane_water.jpg",
    "submissionTimestamp": "2026-11-01T14:23:50.449Z",
    "createdAt": "2026-11-01T14:23:50.449Z",
    "updatedAt": "2026-11-02T20:23:50.449Z",
    "priority": "Critical",
    "priorityReason": "Contamination risk to municipal water supply in high-density heritage ward.",
    "priorityScore": 94,
    "assignedDepartmentId": "water_supply_and_sewerage",
    "assignedDepartment": "Water Supply and Sewerage Department",
    "assignmentTimestamp": "2026-11-01T15:23:50.449Z",
    "currentStatus": "In Progress",
    "status": "In Progress",
    "reporterType": "Registered Citizen",
    "reporterId": "user_cit_sadiq_9011",
    "reporterInfo": {
      "citizenId": "CIT-TN-9011",
      "name": "Mohamed Sadiq",
      "maskedContact": "+91 98407 *****",
      "isVerifiedUser": true
    },
    "slaDeadline": "2026-11-02T14:23:50.449Z",
    "isOverdue": true,
    "isDemo": true,
    "history": [
      {
        "id": "LOG-1016-1",
        "timestamp": "2026-11-01T14:23:50.449Z",
        "action": "Complaint Registered",
        "actor": "Citizen Portal",
        "newValue": "Received"
      }
    ]
  },
  {
    "id": "CP-CHN-2026-1017",
    "category": "Road Damage",
    "description": "Sunken manhole frame 4 inches below bitumen grade causing severe vehicle undercarriage scraping on Jones Road.",
    "location": {
      "address": "Jones Road, Saidapet, Chennai",
      "zone": "Zone 10 (Kodambakkam)",
      "ward": "Ward 142",
      "coordinates": {
        "lat": 13.0213,
        "lng": 80.2231
      },
      "geoJsonCoordinates": [
        80.2231,
        13.0213
      ],
      "landmark": "Near Saidapet Railway Station Entrance"
    },
    "originalPhotoUrl": "/images/thumb_pothole_1.jpg",
    "originalPhotoPath": "complaints/CP-CHN-2026-1017/saidapet_manhole.jpg",
    "submissionTimestamp": "2026-11-03T00:23:50.449Z",
    "createdAt": "2026-11-03T00:23:50.449Z",
    "updatedAt": "2026-11-03T00:23:50.449Z",
    "priority": "Medium",
    "priorityReason": "Station approach road congestion and bike accident hazard.",
    "priorityScore": 68,
    "assignedDepartmentId": "roads_and_infrastructure",
    "assignedDepartment": "Roads and Infrastructure Department",
    "assignmentTimestamp": "2026-11-03T01:23:50.449Z",
    "currentStatus": "Received",
    "status": "Received",
    "reporterType": "Registered Citizen",
    "reporterId": "user_cit_ramkumar_3120",
    "reporterInfo": {
      "citizenId": "CIT-TN-3120",
      "name": "Ramkumar K.",
      "maskedContact": "+91 98841 *****",
      "isVerifiedUser": true
    },
    "slaDeadline": "2026-11-04T14:23:50.449Z",
    "isOverdue": false,
    "isDemo": true,
    "history": [
      {
        "id": "LOG-1017-1",
        "timestamp": "2026-11-03T00:23:50.449Z",
        "action": "Complaint Registered",
        "actor": "Citizen Portal",
        "newValue": "Received"
      }
    ]
  },
  {
    "id": "CP-CHN-2026-1018",
    "category": "Improper Waste Disposal",
    "description": "Commercial restaurant wet waste bins leaking foul leachate onto avenue pedestrian walkway.",
    "location": {
      "address": "CP Ramaswamy Road, Alwarpet, Chennai",
      "zone": "Zone 9 (Teynampet)",
      "ward": "Ward 123",
      "coordinates": {
        "lat": 13.0336,
        "lng": 80.2509
      },
      "geoJsonCoordinates": [
        80.2509,
        13.0336
      ],
      "landmark": "Near Alwarpet Signal Junction"
    },
    "originalPhotoUrl": "/images/thumb_garbage.jpg",
    "originalPhotoPath": "complaints/CP-CHN-2026-1018/alwarpet_leachate.jpg",
    "submissionTimestamp": "2026-11-02T17:23:50.449Z",
    "createdAt": "2026-11-02T17:23:50.449Z",
    "updatedAt": "2026-11-02T18:23:50.449Z",
    "priority": "High",
    "priorityReason": "Public hygiene risk with pedestrian complaints of foul odor and slippery pathway.",
    "priorityScore": 80,
    "assignedDepartmentId": "solid_waste_management",
    "assignedDepartment": "Solid Waste Management Department",
    "assignmentTimestamp": "2026-11-02T18:23:50.449Z",
    "currentStatus": "Assigned",
    "status": "Assigned",
    "reporterType": "Registered Citizen",
    "reporterId": "user_cit_meera_7410",
    "reporterInfo": {
      "citizenId": "CIT-TN-7410",
      "name": "Meera Venkataraman",
      "maskedContact": "+91 98408 *****",
      "isVerifiedUser": true
    },
    "slaDeadline": "2026-11-04T00:23:50.449Z",
    "isOverdue": false,
    "isDemo": true,
    "history": [
      {
        "id": "LOG-1018-1",
        "timestamp": "2026-11-02T17:23:50.449Z",
        "action": "Complaint Registered",
        "actor": "Citizen Portal",
        "newValue": "Received"
      }
    ]
  },
  {
    "id": "CP-CHN-2026-1019",
    "category": "Road Damage",
    "description": "Extensive bitumen peeling and loose aggregate on left turn lane at Sholinganallur junction causing bike skidding.",
    "location": {
      "address": "Sholinganallur Junction, OMR, Chennai",
      "zone": "Zone 15 (Sholinganallur)",
      "ward": "Ward 197",
      "coordinates": {
        "lat": 12.901,
        "lng": 80.2279
      },
      "geoJsonCoordinates": [
        80.2279,
        12.901
      ],
      "landmark": "Near Medavakkam Link Road Junction"
    },
    "originalPhotoUrl": "/images/thumb_pothole_2.jpg",
    "originalPhotoPath": "complaints/CP-CHN-2026-1019/sholinganallur_road.jpg",
    "submissionTimestamp": "2026-11-02T02:23:50.449Z",
    "createdAt": "2026-11-02T02:23:50.449Z",
    "updatedAt": "2026-11-03T03:23:50.449Z",
    "priority": "Medium",
    "priorityReason": "Major southern IT intersection with high vehicle volumes.",
    "priorityScore": 72,
    "assignedDepartmentId": "roads_and_infrastructure",
    "assignedDepartment": "Roads and Infrastructure Department",
    "assignmentTimestamp": "2026-11-02T03:23:50.449Z",
    "currentStatus": "Awaiting Admin Verification",
    "status": "Awaiting Admin Verification",
    "reporterType": "Registered Citizen",
    "reporterId": "user_cit_vinod_8812",
    "reporterInfo": {
      "citizenId": "CIT-TN-8812",
      "name": "Vinod Chandran",
      "maskedContact": "+91 99621 *****",
      "isVerifiedUser": true
    },
    "slaDeadline": "2026-11-04T02:23:50.449Z",
    "isOverdue": false,
    "isDemo": true,
    "verification": {
      "submittedAt": "2026-11-03T03:23:50.449Z",
      "submittedByDepartment": "Roads and Infrastructure Department",
      "afterRepairPhotoUrl": "/images/thumb_pothole_2.jpg",
      "repairNotes": "Bituminous surface milled and cold asphalt mix laid with roller finishing.",
      "resubmissionCount": 0
    },
    "history": [
      {
        "id": "LOG-1019-1",
        "timestamp": "2026-11-02T02:23:50.449Z",
        "action": "Complaint Registered",
        "actor": "Citizen Portal",
        "newValue": "Received"
      }
    ]
  },
  {
    "id": "CP-CHN-2026-1020",
    "category": "Water Leakage",
    "description": "Underground 200mm distribution pipe fractured near lake bund road, causing road side erosion.",
    "location": {
      "address": "Medavakkam Main Road, Madipakkam, Chennai",
      "zone": "Zone 14 (Perungudi)",
      "ward": "Ward 188",
      "coordinates": {
        "lat": 12.962,
        "lng": 80.198
      },
      "geoJsonCoordinates": [
        80.198,
        12.962
      ],
      "landmark": "Near Madipakkam Lake Bund"
    },
    "originalPhotoUrl": "/images/thumb_water.jpg",
    "originalPhotoPath": "complaints/CP-CHN-2026-1020/madipakkam_leak.jpg",
    "submissionTimestamp": "2026-11-01T01:23:50.449Z",
    "createdAt": "2026-11-01T01:23:50.449Z",
    "updatedAt": "2026-11-02T07:23:50.449Z",
    "priority": "High",
    "priorityReason": "Erosion risk adjacent to lake embankment and water supply loss.",
    "priorityScore": 78,
    "assignedDepartmentId": "water_supply_and_sewerage",
    "assignedDepartment": "Water Supply and Sewerage Department",
    "assignmentTimestamp": "2026-11-01T02:23:50.449Z",
    "currentStatus": "Resolved",
    "status": "Resolved",
    "reporterType": "Registered Citizen",
    "reporterId": "user_cit_ganesh_5419",
    "reporterInfo": {
      "citizenId": "CIT-TN-5419",
      "name": "Ganesh Moorthy",
      "maskedContact": "+91 98409 *****",
      "isVerifiedUser": true
    },
    "slaDeadline": "2026-11-02T01:23:50.449Z",
    "isOverdue": false,
    "isDemo": true,
    "verification": {
      "submittedAt": "2026-11-02T05:23:50.449Z",
      "submittedByDepartment": "Water Supply and Sewerage Department",
      "afterRepairPhotoUrl": "/images/thumb_water.jpg",
      "repairNotes": "Full-circle repair clamp mounted, line pressurized, backfilled with gravel.",
      "verifiedAt": "2026-11-02T07:23:50.449Z",
      "verifiedBy": "Er. K. Sivakumar (Admin)",
      "decision": "Approved",
      "resubmissionCount": 0
    },
    "history": [
      {
        "id": "LOG-1020-1",
        "timestamp": "2026-11-01T01:23:50.449Z",
        "action": "Complaint Registered",
        "actor": "Citizen Portal",
        "newValue": "Received"
      }
    ]
  },
  {
    "id": "CP-CHN-2026-1021",
    "category": "Road Damage",
    "description": "Expansion joint displacement on road flyover creating hazardous 3-inch gap across carriage-way.",
    "location": {
      "address": "GST Road, Near MIT Bridge, Chromepet, Chennai",
      "zone": "Zone 15",
      "ward": "Ward 195",
      "coordinates": {
        "lat": 12.9516,
        "lng": 80.1462
      },
      "geoJsonCoordinates": [
        80.1462,
        12.9516
      ],
      "landmark": "Opposite MIT Main Gate Flyover Ramp"
    },
    "originalPhotoUrl": "/images/thumb_pothole_1.jpg",
    "originalPhotoPath": "complaints/CP-CHN-2026-1021/chromepet_joint.jpg",
    "submissionTimestamp": "2026-11-02T14:23:50.449Z",
    "createdAt": "2026-11-02T14:23:50.449Z",
    "updatedAt": "2026-11-03T02:23:50.449Z",
    "priority": "Critical",
    "priorityReason": "Structural flyover hazard on national highway transit artery.",
    "priorityScore": 98,
    "assignedDepartmentId": "roads_and_infrastructure",
    "assignedDepartment": "Roads and Infrastructure Department",
    "assignmentTimestamp": "2026-11-02T15:23:50.449Z",
    "currentStatus": "In Progress",
    "status": "In Progress",
    "reporterType": "Registered Citizen",
    "reporterId": "user_cit_senthil_2209",
    "reporterInfo": {
      "citizenId": "CIT-TN-2209",
      "name": "Senthil Nathan",
      "maskedContact": "+91 97901 *****",
      "isVerifiedUser": true
    },
    "slaDeadline": "2026-11-03T14:23:50.449Z",
    "isOverdue": false,
    "isDemo": true,
    "history": [
      {
        "id": "LOG-1021-1",
        "timestamp": "2026-11-02T14:23:50.449Z",
        "action": "Complaint Registered",
        "actor": "Citizen Portal",
        "newValue": "Received"
      }
    ]
  },
  {
    "id": "CP-CHN-2026-1022",
    "category": "Improper Waste Disposal",
    "description": "Uncollected organic vegetable market waste accumulating near school boundary wall creating severe odor.",
    "location": {
      "address": "Dr. Radhakrishnan Salai, Mylapore, Chennai",
      "zone": "Zone 9 (Teynampet)",
      "ward": "Ward 121",
      "coordinates": {
        "lat": 13.044,
        "lng": 80.264
      },
      "geoJsonCoordinates": [
        80.264,
        13.044
      ],
      "landmark": "Near CSI Kalyani Hospital Area"
    },
    "originalPhotoUrl": "/images/thumb_garbage.jpg",
    "originalPhotoPath": "complaints/CP-CHN-2026-1022/mylapore_school_waste.jpg",
    "submissionTimestamp": "2026-11-01T04:23:50.449Z",
    "createdAt": "2026-11-01T04:23:50.449Z",
    "updatedAt": "2026-11-02T04:23:50.449Z",
    "priority": "Medium",
    "priorityReason": "School boundary zone sanitation standard enforcement.",
    "priorityScore": 65,
    "assignedDepartmentId": "solid_waste_management",
    "assignedDepartment": "Solid Waste Management Department",
    "assignmentTimestamp": "2026-11-01T05:23:50.449Z",
    "currentStatus": "Resolved",
    "status": "Resolved",
    "reporterType": "Registered Citizen",
    "reporterId": "user_cit_anand_7740",
    "reporterInfo": {
      "citizenId": "CIT-TN-7740",
      "name": "Anand Kumar",
      "maskedContact": "+91 98411 *****",
      "isVerifiedUser": true
    },
    "slaDeadline": "2026-11-02T04:23:50.449Z",
    "isOverdue": false,
    "isDemo": true,
    "verification": {
      "submittedAt": "2026-11-02T03:23:50.449Z",
      "submittedByDepartment": "Solid Waste Management Department",
      "afterRepairPhotoUrl": "/images/thumb_garbage.jpg",
      "repairNotes": "Battery-operated conservancy vehicle cleared waste; lime powder disinfected perimeter.",
      "verifiedAt": "2026-11-02T04:23:50.449Z",
      "verifiedBy": "Er. K. Sivakumar (Admin)",
      "decision": "Approved",
      "resubmissionCount": 0
    },
    "history": [
      {
        "id": "LOG-1022-1",
        "timestamp": "2026-11-01T04:23:50.449Z",
        "action": "Complaint Registered",
        "actor": "Citizen Portal",
        "newValue": "Received"
      }
    ]
  },
  {
    "id": "CP-CHN-2026-1023",
    "category": "Water Leakage",
    "description": "Drinking water gushing out of broken valve pit outside bus shelter on Sterling Road.",
    "location": {
      "address": "Sterling Road, Nungambakkam, Chennai",
      "zone": "Zone 9 (Teynampet)",
      "ward": "Ward 111",
      "coordinates": {
        "lat": 13.0645,
        "lng": 80.237
      },
      "geoJsonCoordinates": [
        80.237,
        13.0645
      ],
      "landmark": "Near Loyola College Bus Shelter"
    },
    "originalPhotoUrl": "/images/thumb_water.jpg",
    "originalPhotoPath": "complaints/CP-CHN-2026-1023/sterling_water.jpg",
    "submissionTimestamp": "2026-11-03T02:23:50.449Z",
    "createdAt": "2026-11-03T02:23:50.449Z",
    "updatedAt": "2026-11-03T02:23:50.449Z",
    "priority": "Medium",
    "priorityReason": "Clean water wastage and commuter inconvenience at major student bus stop.",
    "priorityScore": 64,
    "assignedDepartmentId": "water_supply_and_sewerage",
    "assignedDepartment": "Water Supply and Sewerage Department",
    "assignmentTimestamp": "2026-11-03T03:23:50.449Z",
    "currentStatus": "Assigned",
    "status": "Assigned",
    "reporterType": "Registered Citizen",
    "reporterId": "user_cit_prema_4129",
    "reporterInfo": {
      "citizenId": "CIT-TN-4129",
      "name": "Prema Latha",
      "maskedContact": "+91 98412 *****",
      "isVerifiedUser": true
    },
    "slaDeadline": "2026-11-04T14:23:50.449Z",
    "isOverdue": false,
    "isDemo": true,
    "history": [
      {
        "id": "LOG-1023-1",
        "timestamp": "2026-11-03T02:23:50.449Z",
        "action": "Complaint Registered",
        "actor": "Citizen Portal",
        "newValue": "Received"
      }
    ]
  },
  {
    "id": "CP-CHN-2026-1024",
    "category": "Road Damage",
    "description": "Caved-in asphalt surface around stormwater culvert entry near Vijayanagar bus terminus.",
    "location": {
      "address": "Velachery Main Road, Near Vijayanagar Bus Terminus, Chennai",
      "zone": "Zone 13 (Adyar)",
      "ward": "Ward 177",
      "coordinates": {
        "lat": 12.978,
        "lng": 80.218
      },
      "geoJsonCoordinates": [
        80.218,
        12.978
      ],
      "landmark": "Near Vijayanagar Junction Traffic Signal"
    },
    "originalPhotoUrl": "/images/thumb_pothole_1.jpg",
    "originalPhotoPath": "complaints/CP-CHN-2026-1024/velachery_culvert.jpg",
    "submissionTimestamp": "2026-11-02T12:23:50.449Z",
    "createdAt": "2026-11-02T12:23:50.449Z",
    "updatedAt": "2026-11-03T06:23:50.449Z",
    "priority": "High",
    "priorityReason": "Major southern commuter hub with continuous bus and auto-rickshaw traffic.",
    "priorityScore": 86,
    "assignedDepartmentId": "roads_and_infrastructure",
    "assignedDepartment": "Roads and Infrastructure Department",
    "assignmentTimestamp": "2026-11-02T13:23:50.449Z",
    "currentStatus": "Awaiting Admin Verification",
    "status": "Awaiting Admin Verification",
    "reporterType": "Registered Citizen",
    "reporterId": "user_cit_hari_6621",
    "reporterInfo": {
      "citizenId": "CIT-TN-6621",
      "name": "Hariharan S.",
      "maskedContact": "+91 98413 *****",
      "isVerifiedUser": true
    },
    "slaDeadline": "2026-11-04T00:23:50.449Z",
    "isOverdue": false,
    "isDemo": true,
    "verification": {
      "submittedAt": "2026-11-03T06:23:50.449Z",
      "submittedByDepartment": "Roads and Infrastructure Department",
      "afterRepairPhotoUrl": "/images/thumb_pothole_1.jpg",
      "repairNotes": "Culvert slab reinforced and cold mix asphalt leveling rolled.",
      "resubmissionCount": 0
    },
    "history": [
      {
        "id": "LOG-1024-1",
        "timestamp": "2026-11-02T12:23:50.449Z",
        "action": "Complaint Registered",
        "actor": "Citizen Portal",
        "newValue": "Received"
      }
    ]
  },
  {
    "id": "CP-CHN-2026-1025",
    "category": "Improper Waste Disposal",
    "description": "Discarded commercial packing crates and plastic wraps on green verge near Guindy Industrial Estate.",
    "location": {
      "address": "Sardar Patel Road, Guindy, Chennai",
      "zone": "Zone 10 (Kodambakkam)",
      "ward": "Ward 169",
      "coordinates": {
        "lat": 13.008,
        "lng": 80.215
      },
      "geoJsonCoordinates": [
        80.215,
        13.008
      ],
      "landmark": "Near Guindy National Park & IIT Madras Gate"
    },
    "originalPhotoUrl": "/images/thumb_garbage.jpg",
    "originalPhotoPath": "complaints/CP-CHN-2026-1025/guindy_crates.jpg",
    "submissionTimestamp": "2026-11-03T04:23:50.449Z",
    "createdAt": "2026-11-03T04:23:50.449Z",
    "updatedAt": "2026-11-03T04:23:50.449Z",
    "priority": "Low",
    "priorityReason": "Non-hazardous commercial solid waste requiring bulk clearance vehicle.",
    "priorityScore": 42,
    "assignedDepartmentId": "solid_waste_management",
    "assignedDepartment": "Solid Waste Management Department",
    "assignmentTimestamp": "2026-11-03T05:23:50.449Z",
    "currentStatus": "Received",
    "status": "Received",
    "reporterType": "Registered Citizen",
    "reporterId": "user_cit_bala_1904",
    "reporterInfo": {
      "citizenId": "CIT-TN-1904",
      "name": "Balamurugan P.",
      "maskedContact": "+91 98414 *****",
      "isVerifiedUser": true
    },
    "slaDeadline": "2026-11-05T04:23:50.449Z",
    "isOverdue": false,
    "isDemo": true,
    "history": [
      {
        "id": "LOG-1025-1",
        "timestamp": "2026-11-03T04:23:50.449Z",
        "action": "Complaint Registered",
        "actor": "Citizen Portal",
        "newValue": "Received"
      }
    ]
  }
];

export const DEMO_NOTIFICATIONS: NotificationRecord[] = [
  {
    "id": "NOTIF-2026-001",
    "complaintId": "CP-CHN-2026-1004",
    "category": "Road Damage",
    "recipientEligibility": "Eligible (Registered)",
    "recipientName": "Lakshmi Narayanan",
    "recipientContact": "+91 97890 ***** (lakshmi.n***@gmail.com)",
    "notificationType": "Evidence Approved & Resolved",
    "creationTimestamp": "2026-11-02T13:09:53.766Z",
    "deliveryStatus": "Delivered",
    "hasSignedPhotoUrl": true,
    "signedUrlExpiry": "2026-11-09T13:09:53.768Z",
    "deliveredChannel": "In-App Portal"
  },
  {
    "id": "NOTIF-2026-002",
    "complaintId": "CP-CHN-2026-1011",
    "category": "Road Damage",
    "recipientEligibility": "Eligible (Registered)",
    "recipientName": "Manikandan E.",
    "recipientContact": "+91 98840 *****",
    "notificationType": "Evidence Approved & Resolved",
    "creationTimestamp": "2026-11-02T03:09:53.768Z",
    "deliveryStatus": "Delivered",
    "hasSignedPhotoUrl": true,
    "signedUrlExpiry": "2026-11-09T03:09:53.768Z",
    "deliveredChannel": "SMS"
  },
  {
    "id": "NOTIF-2026-003",
    "complaintId": "CP-CHN-2026-1015",
    "category": "Improper Waste Disposal",
    "recipientEligibility": "Eligible (Registered)",
    "recipientName": "Swaminathan V.",
    "recipientContact": "+91 98406 ***** (swaminathan.v***@yahoo.in)",
    "notificationType": "Evidence Approved & Resolved",
    "creationTimestamp": "2026-11-02T09:09:53.768Z",
    "deliveryStatus": "Delivered",
    "hasSignedPhotoUrl": true,
    "signedUrlExpiry": "2026-11-09T09:09:53.768Z",
    "deliveredChannel": "Email"
  },
  {
    "id": "NOTIF-2026-004",
    "complaintId": "CP-CHN-2026-1020",
    "category": "Water Leakage",
    "recipientEligibility": "Eligible (Registered)",
    "recipientName": "Ganesh Moorthy",
    "recipientContact": "+91 98409 ***** (g.moorthy***@gmail.com)",
    "notificationType": "Evidence Approved & Resolved",
    "creationTimestamp": "2026-11-02T08:09:53.768Z",
    "deliveryStatus": "Delivered",
    "hasSignedPhotoUrl": true,
    "signedUrlExpiry": "2026-11-09T08:09:53.768Z",
    "deliveredChannel": "In-App Portal"
  },
  {
    "id": "NOTIF-2026-005",
    "complaintId": "CP-CHN-2026-1022",
    "category": "Improper Waste Disposal",
    "recipientEligibility": "Eligible (Registered)",
    "recipientName": "Anand Kumar",
    "recipientContact": "+91 98411 *****",
    "notificationType": "Evidence Approved & Resolved",
    "creationTimestamp": "2026-11-02T05:09:53.768Z",
    "deliveryStatus": "Delivered",
    "hasSignedPhotoUrl": true,
    "signedUrlExpiry": "2026-11-09T05:09:53.768Z",
    "deliveredChannel": "SMS"
  },
  {
    "id": "NOTIF-2026-006",
    "complaintId": "CP-CHN-2026-1007",
    "category": "Improper Waste Disposal",
    "recipientEligibility": "Ineligible (Anonymous - Restricted)",
    "recipientName": "Anonymous Reporter",
    "recipientContact": "None (Unauthenticated)",
    "notificationType": "Status Update",
    "creationTimestamp": "2026-11-02T19:09:53.768Z",
    "deliveryStatus": "Blocked (Anonymous Safety Policy)",
    "failureReason": "Namma Ooru policy strictly prohibits dispatching personal notifications or signed repair media to unauthenticated/anonymous reporters.",
    "hasSignedPhotoUrl": false,
    "deliveredChannel": "None"
  },
  {
    "id": "NOTIF-2026-007",
    "complaintId": "CP-CHN-2026-1001",
    "category": "Road Damage",
    "recipientEligibility": "Eligible (Registered)",
    "recipientName": "Sundar Rajan",
    "recipientContact": "+91 98401 ***** (sundar.r***@gmail.com)",
    "notificationType": "Status Update",
    "creationTimestamp": "2026-11-02T10:09:53.768Z",
    "deliveryStatus": "Delivered",
    "hasSignedPhotoUrl": false,
    "deliveredChannel": "In-App Portal"
  },
  {
    "id": "NOTIF-2026-008",
    "complaintId": "CP-CHN-2026-1002",
    "category": "Improper Waste Disposal",
    "recipientEligibility": "Eligible (Registered)",
    "recipientName": "Kavitha Balan",
    "recipientContact": "+91 94440 *****",
    "notificationType": "Status Update",
    "creationTimestamp": "2026-11-02T13:09:53.768Z",
    "deliveryStatus": "Delivered",
    "hasSignedPhotoUrl": false,
    "deliveredChannel": "SMS"
  },
  {
    "id": "NOTIF-2026-009",
    "complaintId": "CP-CHN-2026-1005",
    "category": "Road Damage",
    "recipientEligibility": "Eligible (Registered)",
    "recipientName": "Praveen Kumar",
    "recipientContact": "+91 99620 ***** (praveen.k***@tcs.com)",
    "notificationType": "Status Update",
    "creationTimestamp": "2026-11-03T05:09:53.768Z",
    "deliveryStatus": "Delivered",
    "hasSignedPhotoUrl": false,
    "deliveredChannel": "Email"
  },
  {
    "id": "NOTIF-2026-010",
    "complaintId": "CP-CHN-2026-1006",
    "category": "Water Leakage",
    "recipientEligibility": "Eligible (Registered)",
    "recipientName": "Anitha Ramesh",
    "recipientContact": "+91 98402 *****",
    "notificationType": "Status Update",
    "creationTimestamp": "2026-11-03T01:09:53.768Z",
    "deliveryStatus": "Delivered",
    "hasSignedPhotoUrl": false,
    "deliveredChannel": "SMS"
  },
  {
    "id": "NOTIF-2026-011",
    "complaintId": "CP-CHN-2026-1013",
    "category": "Water Leakage",
    "recipientEligibility": "Eligible (Registered)",
    "recipientName": "Karthik Subramanian",
    "recipientContact": "+91 97910 ***** (karthik.sub***@outlook.com)",
    "notificationType": "Status Update",
    "creationTimestamp": "2026-11-03T07:09:53.768Z",
    "deliveryStatus": "Delivered",
    "hasSignedPhotoUrl": false,
    "deliveredChannel": "In-App Portal"
  },
  {
    "id": "NOTIF-2026-012",
    "complaintId": "CP-CHN-2026-1024",
    "category": "Road Damage",
    "recipientEligibility": "Eligible (Registered)",
    "recipientName": "Hariharan S.",
    "recipientContact": "+91 98413 *****",
    "notificationType": "Status Update",
    "creationTimestamp": "2026-11-03T07:09:53.768Z",
    "deliveryStatus": "Delivered",
    "hasSignedPhotoUrl": false,
    "deliveredChannel": "SMS"
  }
];

export const DEMO_SAMPLE_ROWS: SampleComplaintRow[] = [
  {
    "id": "1001",
    "fullId": "CP-CHN-2026-1001",
    "photo": "/images/thumb_pothole_1.jpg",
    "detail": "Deep 2-foot pothole on central lane outside Thousand Lig...",
    "location": "Anna Salai",
    "status": "Unresolved",
    "priority": "High",
    "department": "Roads",
    "date": "02 Nov 2026",
    "time": "01:53 PM",
    "category": "Road Damage"
  },
  {
    "id": "1002",
    "fullId": "CP-CHN-2026-1002",
    "photo": "/images/thumb_garbage.jpg",
    "detail": "1100L green compactor bin overflowing with vegetable and...",
    "location": "Velachery",
    "status": "In Progress",
    "priority": "High",
    "department": "Sanitation",
    "date": "02 Nov 2026",
    "time": "01:53 AM",
    "category": "Waste Disposal"
  },
  {
    "id": "1003",
    "fullId": "CP-CHN-2026-1003",
    "photo": "/images/thumb_water.jpg",
    "detail": "Underground potable water distribution line crack leakin...",
    "location": "Adyar",
    "status": "In Progress",
    "priority": "Medium",
    "department": "Water Supply",
    "date": "02 Nov 2026",
    "time": "07:53 PM",
    "category": "Water Leakage"
  },
  {
    "id": "1004",
    "fullId": "CP-CHN-2026-1004",
    "photo": "/images/thumb_pothole_2.jpg",
    "detail": "Damaged median kerb blocks and missing manhole slab crea...",
    "location": "Besant Nagar",
    "status": "Resolved",
    "priority": "—",
    "department": "Roads",
    "date": "01 Nov 2026",
    "time": "01:53 PM",
    "category": "Road Damage"
  },
  {
    "id": "1005",
    "fullId": "CP-CHN-2026-1005",
    "photo": "/images/thumb_pothole_1.jpg",
    "detail": "Cluster of 3 potholes on OMR service lane outside RMZ Mi...",
    "location": "Perungudi",
    "status": "In Progress",
    "priority": "High",
    "department": "Roads",
    "date": "02 Nov 2026",
    "time": "09:53 AM",
    "category": "Road Damage"
  },
  {
    "id": "1006",
    "fullId": "CP-CHN-2026-1006",
    "photo": "/images/thumb_water.jpg",
    "detail": "Underground main pipeline valve breach with continuous f...",
    "location": "T. Nagar",
    "status": "In Progress",
    "priority": "High",
    "department": "Water Supply",
    "date": "02 Nov 2026",
    "time": "05:53 PM",
    "category": "Water Leakage"
  },
  {
    "id": "1007",
    "fullId": "CP-CHN-2026-1007",
    "photo": "/images/thumb_garbage.jpg",
    "detail": "Commercial packaging cartons, thermocol waste, and plast...",
    "location": "Mylapore",
    "status": "Unresolved",
    "priority": "Medium",
    "department": "Sanitation",
    "date": "02 Nov 2026",
    "time": "11:53 PM",
    "category": "Waste Disposal"
  },
  {
    "id": "1008",
    "fullId": "CP-CHN-2026-1008",
    "photo": "/images/thumb_pothole_2.jpg",
    "detail": "Sunken road slab and storm water drain displacement oppo...",
    "location": "Marina Beach",
    "status": "In Progress",
    "priority": "High",
    "department": "Roads",
    "date": "02 Nov 2026",
    "time": "05:53 AM",
    "category": "Road Damage"
  },
  {
    "id": "1009",
    "fullId": "CP-CHN-2026-1009",
    "photo": "/images/thumb_garbage.jpg",
    "detail": "Demolition concrete debris and cement plaster bags dumpe...",
    "location": "Royapettah",
    "status": "In Progress",
    "priority": "High",
    "department": "Sanitation",
    "date": "02 Nov 2026",
    "time": "11:53 AM",
    "category": "Waste Disposal"
  },
  {
    "id": "1010",
    "fullId": "CP-CHN-2026-1010",
    "photo": "/images/thumb_water.jpg",
    "detail": "Underground drinking water main feeder breach outside Go...",
    "location": "Kilpauk",
    "status": "Unresolved",
    "priority": "High",
    "department": "Water Supply",
    "date": "02 Nov 2026",
    "time": "09:53 PM",
    "category": "Water Leakage"
  },
  {
    "id": "1011",
    "fullId": "CP-CHN-2026-1011",
    "photo": "/images/thumb_pothole_1.jpg",
    "detail": "Flyover descent asphalt surface peeling with exposed coa...",
    "location": "Guindy",
    "status": "Resolved",
    "priority": "—",
    "department": "Roads",
    "date": "01 Nov 2026",
    "time": "01:53 AM",
    "category": "Road Damage"
  },
  {
    "id": "1012",
    "fullId": "CP-CHN-2026-1012",
    "photo": "/images/thumb_garbage.jpg",
    "detail": "Pruned tree branches and dense garden horticulture refus...",
    "location": "Chennai",
    "status": "In Progress",
    "priority": "Low",
    "department": "Sanitation",
    "date": "03 Nov 2026",
    "time": "01:53 AM",
    "category": "Waste Disposal"
  },
  {
    "id": "1013",
    "fullId": "CP-CHN-2026-1013",
    "photo": "/images/thumb_water.jpg",
    "detail": "Damaged CMWSSB air relief valve leaking and creating loc...",
    "location": "Chennai",
    "status": "In Progress",
    "priority": "High",
    "department": "Water Supply",
    "date": "02 Nov 2026",
    "time": "03:53 PM",
    "category": "Water Leakage"
  },
  {
    "id": "1014",
    "fullId": "CP-CHN-2026-1014",
    "photo": "/images/thumb_pothole_2.jpg",
    "detail": "Deep unpaved utility trench across 4th Avenue residentia...",
    "location": "Chennai",
    "status": "Unresolved",
    "priority": "High",
    "department": "Roads",
    "date": "03 Nov 2026",
    "time": "03:53 AM",
    "category": "Road Damage"
  },
  {
    "id": "1015",
    "fullId": "CP-CHN-2026-1015",
    "photo": "/images/thumb_garbage.jpg",
    "detail": "Food stall single-use packaging and tender coconut shell...",
    "location": "Chennai",
    "status": "Resolved",
    "priority": "—",
    "department": "Sanitation",
    "date": "01 Nov 2026",
    "time": "11:53 AM",
    "category": "Waste Disposal"
  },
  {
    "id": "1016",
    "fullId": "CP-CHN-2026-1016",
    "photo": "/images/thumb_water.jpg",
    "detail": "Drinking water distribution line punctured during cable ...",
    "location": "Chennai",
    "status": "In Progress",
    "priority": "High",
    "department": "Water Supply",
    "date": "01 Nov 2026",
    "time": "07:53 PM",
    "category": "Water Leakage"
  },
  {
    "id": "1017",
    "fullId": "CP-CHN-2026-1017",
    "photo": "/images/thumb_pothole_1.jpg",
    "detail": "Sunken manhole frame 4 inches below bitumen grade causin...",
    "location": "Chennai",
    "status": "Unresolved",
    "priority": "Medium",
    "department": "Roads",
    "date": "03 Nov 2026",
    "time": "05:53 AM",
    "category": "Road Damage"
  },
  {
    "id": "1018",
    "fullId": "CP-CHN-2026-1018",
    "photo": "/images/thumb_garbage.jpg",
    "detail": "Commercial restaurant wet waste bins leaking foul leacha...",
    "location": "Alwarpet",
    "status": "Unresolved",
    "priority": "High",
    "department": "Sanitation",
    "date": "02 Nov 2026",
    "time": "10:53 PM",
    "category": "Waste Disposal"
  },
  {
    "id": "1019",
    "fullId": "CP-CHN-2026-1019",
    "photo": "/images/thumb_pothole_2.jpg",
    "detail": "Extensive bitumen peeling and loose aggregate on left tu...",
    "location": "Chennai",
    "status": "In Progress",
    "priority": "Medium",
    "department": "Roads",
    "date": "02 Nov 2026",
    "time": "07:53 AM",
    "category": "Road Damage"
  },
  {
    "id": "1020",
    "fullId": "CP-CHN-2026-1020",
    "photo": "/images/thumb_water.jpg",
    "detail": "Underground 200mm distribution pipe fractured near lake ...",
    "location": "Chennai",
    "status": "Resolved",
    "priority": "—",
    "department": "Water Supply",
    "date": "01 Nov 2026",
    "time": "06:53 AM",
    "category": "Water Leakage"
  },
  {
    "id": "1021",
    "fullId": "CP-CHN-2026-1021",
    "photo": "/images/thumb_pothole_1.jpg",
    "detail": "Expansion joint displacement on road flyover creating ha...",
    "location": "Guindy",
    "status": "In Progress",
    "priority": "High",
    "department": "Roads",
    "date": "02 Nov 2026",
    "time": "07:53 PM",
    "category": "Road Damage"
  },
  {
    "id": "1022",
    "fullId": "CP-CHN-2026-1022",
    "photo": "/images/thumb_garbage.jpg",
    "detail": "Uncollected organic vegetable market waste accumulating ...",
    "location": "Mylapore",
    "status": "Resolved",
    "priority": "—",
    "department": "Sanitation",
    "date": "01 Nov 2026",
    "time": "09:53 AM",
    "category": "Waste Disposal"
  },
  {
    "id": "1023",
    "fullId": "CP-CHN-2026-1023",
    "photo": "/images/thumb_water.jpg",
    "detail": "Drinking water gushing out of broken valve pit outside b...",
    "location": "Chennai",
    "status": "Unresolved",
    "priority": "Medium",
    "department": "Water Supply",
    "date": "03 Nov 2026",
    "time": "07:53 AM",
    "category": "Water Leakage"
  },
  {
    "id": "1024",
    "fullId": "CP-CHN-2026-1024",
    "photo": "/images/thumb_pothole_1.jpg",
    "detail": "Caved-in asphalt surface around stormwater culvert entry...",
    "location": "Velachery",
    "status": "In Progress",
    "priority": "High",
    "department": "Roads",
    "date": "02 Nov 2026",
    "time": "05:53 PM",
    "category": "Road Damage"
  },
  {
    "id": "1025",
    "fullId": "CP-CHN-2026-1025",
    "photo": "/images/thumb_garbage.jpg",
    "detail": "Discarded commercial packing crates and plastic wraps on...",
    "location": "Guindy",
    "status": "Unresolved",
    "priority": "Low",
    "department": "Sanitation",
    "date": "03 Nov 2026",
    "time": "09:53 AM",
    "category": "Waste Disposal"
  }
];
