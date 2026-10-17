import type { Facility, ParkingSlot, FacilityStats } from '../types';

export const KEYS = {
  PARKING_DATA: 'urbanserve_parkingData',
  SLOTS: 'parkingSlots',
  USAGE: 'usageRecords',
  ISSUES: 'issues',
  ACTIVITIES: 'activities',
  BOOKINGS: 'urbanserveBookings',
  OPERATOR_NOTIFICATIONS: 'operatorNotifications',
  USER_NOTIFICATIONS: 'userNotifications',
  FACILITIES_DATA: 'urbanserve_facilities_data',
  CURRENT_FACILITY: 'urbanserve_current_facility',
  CURRENT_USER: 'urbanserve_current_user',
  OPERATOR_AUTH: 'urbanserve_operator_auth',
} as const;

export const FACILITIES: Facility[] = [
  {
    id: 'kanakia-road',
    name: 'Kanakia Road Public Parking',
    address: 'Kanakia Road, Mira Road East',
    lat: 19.3005,
    lng: 72.8762,
    totalSlots: 50,
    rate: '₹20/hr',
    zones: [
      { prefix: 'A', count: 25 },
      { prefix: 'B', count: 25 },
    ],
  },
  {
    id: 'station-hub',
    name: 'Mira Road Station Hub',
    address: 'Station Road, Mira Road East',
    lat: 19.2982,
    lng: 72.8761,
    totalSlots: 40,
    rate: '₹25/hr',
    zones: [
      { prefix: 'A', count: 20 },
      { prefix: 'B', count: 20 },
    ],
  },
  {
    id: 'cinemax-arcade',
    name: 'Cinemax Arcade Parking Hub',
    address: 'Near Cinemax, Mira Road East',
    lat: 19.3014,
    lng: 72.8756,
    totalSlots: 30,
    rate: '₹30/hr',
    zones: [
      { prefix: 'A', count: 15 },
      { prefix: 'B', count: 15 },
    ],
  },
  {
    id: 'beverly-park',
    name: 'Beverly Park Lane Parking',
    address: 'Beverly Park Road, Mira Road East',
    lat: 19.2993,
    lng: 72.8774,
    totalSlots: 24,
    rate: '₹20/hr',
    zones: [
      { prefix: 'A', count: 12 },
      { prefix: 'B', count: 12 },
    ],
  },
  {
    id: 'shanti-park',
    name: 'Shanti Park Stand Parking',
    address: 'Shanti Park, Mira Road East',
    lat: 19.3021,
    lng: 72.8779,
    totalSlots: 26,
    rate: '₹20/hr',
    zones: [
      { prefix: 'A', count: 13 },
      { prefix: 'B', count: 13 },
    ],
  },
  {
    id: 'jangid-complex',
    name: 'Jangid Complex Parking',
    address: 'Jangid Estate, Mira Road East',
    lat: 19.3009,
    lng: 72.8786,
    totalSlots: 20,
    rate: '₹20/hr',
    zones: [
      { prefix: 'A', count: 10 },
      { prefix: 'B', count: 10 },
    ],
  },
  {
    id: 'kanakia-zillion',
    name: 'Kanakia Zillion Lot',
    address: 'Behind Cinemax, Mira Road East',
    lat: 19.2990,
    lng: 72.8751,
    totalSlots: 30,
    rate: '₹25/hr',
    zones: [
      { prefix: 'A', count: 15 },
      { prefix: 'B', count: 15 },
    ],
  },
  {
    id: 'gcc-club',
    name: 'GCC Club Road Parking',
    address: 'Off Mira Bhayandar Road, Mira Road East',
    lat: 19.3026,
    lng: 72.8745,
    totalSlots: 36,
    rate: '₹30/hr',
    zones: [
      { prefix: 'A', count: 18 },
      { prefix: 'B', count: 18 },
    ],
  },
];

export function generateSlotsForFacility(fac: Facility): ParkingSlot[] {
  const res: ParkingSlot[] = [];
  fac.zones.forEach((zone) => {
    for (let i = 1; i <= zone.count; i++) {
      const id = `${zone.prefix}${i.toString().padStart(2, '0')}`;
      let status: ParkingSlot['status'] = 'available';
      const rand = Math.random();
      if (rand > 0.8) status = 'maintenance';
      else if (rand > 0.35) status = 'occupied';
      res.push({ id, status, lastUpdated: new Date().toISOString() });
    }
  });
  return res;
}

export function calculateStats(slots: ParkingSlot[]): FacilityStats {
  const total = slots.length;
  let available = 0;
  let occupied = 0;
  let maintenance = 0;

  slots.forEach((s) => {
    const st = (s.status || '').toLowerCase();
    if (st === 'available') available++;
    else if (st === 'occupied' || st === 'reserved') occupied++;
    else if (st === 'maintenance') maintenance++;
    else available++;
  });

  const usable = total - maintenance;
  let occupancyPercent = 0;
  if (usable > 0) {
    occupancyPercent = Math.round((occupied / usable) * 100);
  }

  let status: FacilityStats['status'] = 'Available';
  if (occupancyPercent >= 90) status = 'High Occupancy';
  else if (occupancyPercent >= 70) status = 'Busy';
  if (usable === 0) status = 'Unavailable';

  let latestTime: Date | null = null;
  slots.forEach((s) => {
    if (!latestTime || new Date(s.lastUpdated) > latestTime) {
      latestTime = new Date(s.lastUpdated);
    }
  });

  return { total, maintenance, occupied, available, usable, occupancyPercent, status, latestTime };
}

export function getTimeAgo(date: Date): string {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + ' years ago';
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + ' months ago';
  interval = seconds / 86400;
  if (interval >= 1) {
    if (Math.floor(interval) === 1) return 'Yesterday';
    return Math.floor(interval) + ' days ago';
  }
  interval = seconds / 3600;
  if (interval >= 1) return Math.floor(interval) + ' hours ago';
  interval = seconds / 60;
  if (interval >= 1) return Math.floor(interval) + ' min ago';
  return 'Just now';
}
