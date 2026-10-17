export type SlotStatus = 'available' | 'occupied' | 'maintenance' | 'reserved';

export interface ParkingSlot {
  id: string;
  status: SlotStatus;
  lastUpdated: string;
}

export interface FacilityZone {
  prefix: string;
  count: number;
}

export interface Facility {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  totalSlots: number;
  rate: string;
  zones: FacilityZone[];
}

export interface FacilityData {
  slots: ParkingSlot[];
  lastUpdated: string;
}

export type FacilitiesDataMap = Record<string, FacilityData>;

export type BookingStatus = 'Upcoming' | 'Active' | 'Completed' | 'Cancelled';

export interface Booking {
  id: string;
  userId: string;
  userName: string;
  bookedBy: string;
  facilityId: string;
  facilityName: string;
  slotId: string;
  date: string;
  startTime: string;
  endTime: string;
  time?: string;
  status: BookingStatus;
  createdAt: string;
  updatedAt: string;
}

export type IssuePriority = 'High' | 'Medium' | 'Low';
export type IssueStatus = 'Open' | 'In Progress' | 'Resolved';

export interface Issue {
  id: string;
  location: string;
  type: string;
  priority: IssuePriority;
  status: IssueStatus;
  desc: string;
  date: string;
}

export interface UsageRecord {
  date: string;
  time: string;
  occupied: number;
  available: number;
  percent: number;
}

export interface Activity {
  id: number;
  description: string;
  timestamp: string;
}

export interface AppNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}

export type UserType = 'user1' | 'user2' | 'user3';

export interface FacilityStats {
  total: number;
  available: number;
  occupied: number;
  maintenance: number;
  usable: number;
  occupancyPercent: number;
  status: 'Available' | 'Busy' | 'High Occupancy' | 'Unavailable';
  latestTime?: Date | null;
}
