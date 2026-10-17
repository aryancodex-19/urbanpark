import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import type {
  Facility,
  ParkingSlot,
  FacilitiesDataMap,
  Booking,
  BookingStatus,
  Issue,
  IssueStatus,
  IssuePriority,
  UsageRecord,
  Activity,
  AppNotification,
  UserType,
  FacilityStats,
  SlotStatus,
} from '../types';
import {
  KEYS,
  FACILITIES,
  generateSlotsForFacility,
  calculateStats,
} from '../data/constants';

interface ParkingContextType {
  facilities: Facility[];
  currentFacilityId: string;
  currentFacility: Facility;
  switchFacility: (facId: string) => void;
  facilitiesData: FacilitiesDataMap;
  slots: ParkingSlot[];
  stats: FacilityStats;
  currentUser: UserType;
  setCurrentUser: (user: UserType) => void;
  bookings: Booking[];
  createBooking: (slotId: string, date: string, startTime: string, endTime: string) => boolean;
  cancelBooking: (bookingId: string) => void;
  updateBookingStatus: (bookingId: string, status: BookingStatus) => void;
  issues: Issue[];
  createIssue: (location: string, type: string, priority: IssuePriority, desc: string) => void;
  updateIssueStatus: (id: string, status: IssueStatus) => void;
  usageRecords: UsageRecord[];
  createUsageRecord: (date: string, time: string, occupied: number) => { success: boolean; error?: string };
  activities: Activity[];
  logActivity: (desc: string) => void;
  userNotifications: AppNotification[];
  operatorNotifications: AppNotification[];
  markAllUserNotificationsRead: () => void;
  markUserNotificationRead: (id: string) => void;
  markAllOperatorNotificationsRead: () => void;
  markOperatorNotificationRead: (id: string) => void;
  updateSlotStatus: (slotId: string, status: SlotStatus) => void;
  operatorBookSlot: (slotId: string, details?: { userName?: string; bookedBy?: string; date?: string; startTime?: string; endTime?: string }) => boolean;
  resetDemoData: () => void;
  clearAllData: () => void;
  toastMessage: string | null;
  showToast: (msg: string) => void;
  isOperatorAuth: boolean;
  unlockOperator: (pin: string) => boolean;
  lockOperator: () => void;
}

const ParkingContext = createContext<ParkingContextType | undefined>(undefined);

// Initializer helpers
function getInitialFacilitiesData(): FacilitiesDataMap {
  try {
    const raw = localStorage.getItem(KEYS.FACILITIES_DATA);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        let hasAll = true;
        FACILITIES.forEach((f) => {
          if (!parsed[f.id] || !Array.isArray(parsed[f.id].slots) || parsed[f.id].slots.length === 0) {
            hasAll = false;
          }
        });
        if (hasAll) return parsed;
      }
    }
  } catch (e) {
    console.error('Error loading facilities data', e);
  }

  // Generate for all facilities
  const facMap: FacilitiesDataMap = {};
  FACILITIES.forEach((fac) => {
    facMap[fac.id] = {
      slots: generateSlotsForFacility(fac),
      lastUpdated: new Date().toISOString(),
    };
  });
  localStorage.setItem(KEYS.FACILITIES_DATA, JSON.stringify(facMap));
  return facMap;
}

function getInitialBookings(): Booking[] {
  try {
    const raw = localStorage.getItem(KEYS.BOOKINGS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error('Error loading bookings', e);
  }

  const initialBooking: Booking = {
    id: 'BK-1024',
    userId: 'user1',
    userName: 'user1',
    bookedBy: 'user1',
    facilityId: 'kanakia-road',
    facilityName: 'Kanakia Road Public Parking',
    slotId: 'A02',
    date: new Date().toISOString().split('T')[0],
    startTime: '10:00',
    endTime: '12:00',
    time: '10:00 - 12:00',
    status: 'Upcoming',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  localStorage.setItem(KEYS.BOOKINGS, JSON.stringify([initialBooking]));
  return [initialBooking];
}

function getInitialIssues(): Issue[] {
  try {
    const raw = localStorage.getItem(KEYS.ISSUES);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Error loading issues', e);
  }
  const defaultIssues: Issue[] = [
    {
      id: 'ISS-001',
      location: 'Slot A04',
      type: 'Slot Damage',
      priority: 'High',
      status: 'Open',
      desc: 'Concrete surface broken.',
      date: new Date().toISOString(),
    },
    {
      id: 'ISS-002',
      location: 'Entry Gate',
      type: 'Entry Gate',
      priority: 'Medium',
      status: 'In Progress',
      desc: 'Barrier arm responding slowly.',
      date: new Date().toISOString(),
    },
    {
      id: 'ISS-003',
      location: 'Lighting A',
      type: 'Lighting',
      priority: 'Low',
      status: 'Resolved',
      desc: 'Bulb replacement.',
      date: new Date().toISOString(),
    },
  ];
  localStorage.setItem(KEYS.ISSUES, JSON.stringify(defaultIssues));
  return defaultIssues;
}

function getInitialUsage(): UsageRecord[] {
  try {
    const raw = localStorage.getItem(KEYS.USAGE);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Error loading usage', e);
  }
  const today = new Date().toISOString().split('T')[0];
  const defaultUsage: UsageRecord[] = [
    { date: today, time: '10:00', occupied: 22, available: 23, percent: 49 },
    { date: today, time: '13:00', occupied: 32, available: 13, percent: 71 },
    { date: today, time: '17:00', occupied: 41, available: 4, percent: 91 },
  ];
  localStorage.setItem(KEYS.USAGE, JSON.stringify(defaultUsage));
  return defaultUsage;
}

export const ParkingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentFacilityId, setCurrentFacilityId] = useState<string>(() => {
    return localStorage.getItem(KEYS.CURRENT_FACILITY) || 'kanakia-road';
  });

  const [facilitiesData, setFacilitiesData] = useState<FacilitiesDataMap>(getInitialFacilitiesData);

  const [currentUser, setCurrentUserState] = useState<UserType>(() => {
    return (localStorage.getItem(KEYS.CURRENT_USER) as UserType) || 'user1';
  });

  const [bookings, setBookings] = useState<Booking[]>(getInitialBookings);
  const [issues, setIssues] = useState<Issue[]>(getInitialIssues);
  const [usageRecords, setUsageRecords] = useState<UsageRecord[]>(getInitialUsage);
  const [activities, setActivities] = useState<Activity[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(KEYS.ACTIVITIES) || '[]');
    } catch {
      return [];
    }
  });

  const [userNotifications, setUserNotifications] = useState<AppNotification[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(KEYS.USER_NOTIFICATIONS) || '[]');
    } catch {
      return [];
    }
  });

  const [operatorNotifications, setOperatorNotifications] = useState<AppNotification[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(KEYS.OPERATOR_NOTIFICATIONS) || '[]');
    } catch {
      return [];
    }
  });

  const [isOperatorAuth, setIsOperatorAuth] = useState<boolean>(() => {
    return sessionStorage.getItem(KEYS.OPERATOR_AUTH) === 'true';
  });

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
  }, []);

  const currentFacility = useMemo(() => {
    return FACILITIES.find((f) => f.id === currentFacilityId) || FACILITIES[0];
  }, [currentFacilityId]);

  const slots = useMemo(() => {
    return facilitiesData[currentFacility.id]?.slots || [];
  }, [facilitiesData, currentFacility.id]);

  const stats = useMemo(() => {
    return calculateStats(slots);
  }, [slots]);

  // Sync to localStorage
  const saveAll = useCallback(
    (newFacData: FacilitiesDataMap, newFacId: string, newBookings: Booking[], newOpNotifs: AppNotification[]) => {
      localStorage.setItem(KEYS.FACILITIES_DATA, JSON.stringify(newFacData));
      localStorage.setItem(KEYS.CURRENT_FACILITY, newFacId);
      localStorage.setItem(KEYS.BOOKINGS, JSON.stringify(newBookings));
      localStorage.setItem(KEYS.OPERATOR_NOTIFICATIONS, JSON.stringify(newOpNotifs));

      const curFac = FACILITIES.find((f) => f.id === newFacId) || FACILITIES[0];
      const curSlots = newFacData[curFac.id]?.slots || [];
      localStorage.setItem(KEYS.SLOTS, JSON.stringify(curSlots));

      const legacyData = {
        facilityId: curFac.id,
        facilityName: curFac.name,
        slots: curSlots,
        bookings: newBookings,
        notifications: newOpNotifs,
        totalSlots: curSlots.length,
        lastUpdated: new Date().toISOString(),
      };
      localStorage.setItem(KEYS.PARKING_DATA, JSON.stringify(legacyData));
      localStorage.setItem('parkingData', JSON.stringify(legacyData));

      // Broadcast channel
      if (typeof BroadcastChannel !== 'undefined') {
        try {
          const syncChannel = new BroadcastChannel('urbanserve_sync');
          syncChannel.postMessage({ type: 'SYNC', facilityId: newFacId, timestamp: Date.now() });
        } catch {
          // ignore
        }
      }
    },
    []
  );

  const logActivity = useCallback((description: string) => {
    const act: Activity = {
      id: Date.now(),
      description,
      timestamp: new Date().toISOString(),
    };
    setActivities((prev) => {
      const updated = [act, ...prev.slice(0, 49)];
      localStorage.setItem(KEYS.ACTIVITIES, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const addUserNotification = useCallback((type: string, title: string, message: string) => {
    const notif: AppNotification = {
      id: Date.now().toString(),
      type,
      title,
      message,
      timestamp: new Date().toISOString(),
      read: false,
    };
    setUserNotifications((prev) => {
      const updated = [notif, ...prev.slice(0, 49)];
      localStorage.setItem(KEYS.USER_NOTIFICATIONS, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const addOperatorNotification = useCallback((type: string, title: string, message: string) => {
    const notif: AppNotification = {
      id: Date.now().toString(),
      type,
      title,
      message,
      timestamp: new Date().toISOString(),
      read: false,
    };
    setOperatorNotifications((prev) => {
      const updated = [notif, ...prev.slice(0, 49)];
      localStorage.setItem(KEYS.OPERATOR_NOTIFICATIONS, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const switchFacility = useCallback(
    (facId: string) => {
      const target = FACILITIES.find((f) => f.id === facId);
      if (!target) return;
      setCurrentFacilityId(target.id);
      localStorage.setItem(KEYS.CURRENT_FACILITY, target.id);
      showToast(`Switched to ${target.name}`);
    },
    [showToast]
  );

  const setCurrentUser = useCallback(
    (user: UserType) => {
      setCurrentUserState(user);
      localStorage.setItem(KEYS.CURRENT_USER, user);
      showToast(`Logged in as ${user}`);
    },
    [showToast]
  );

  const updateSlotStatus = useCallback(
    (slotId: string, newStatus: SlotStatus) => {
      setFacilitiesData((prevFacData) => {
        const facSlots = prevFacData[currentFacility.id]?.slots || [];
        const targetSlot = facSlots.find((s) => s.id === slotId);
        if (!targetSlot || targetSlot.status === newStatus) return prevFacData;

        const updatedSlots = facSlots.map((s) =>
          s.id === slotId ? { ...s, status: newStatus, lastUpdated: new Date().toISOString() } : s
        );

        const newFacData = {
          ...prevFacData,
          [currentFacility.id]: {
            slots: updatedSlots,
            lastUpdated: new Date().toISOString(),
          },
        };

        saveAll(newFacData, currentFacility.id, bookings, operatorNotifications);
        return newFacData;
      });

      logActivity(`Slot ${slotId} at ${currentFacility.name} marked ${newStatus}`);

      if (newStatus === 'occupied') {
        showToast('Slot booked successfully!');
        addOperatorNotification('new_booking', 'Slot Occupied', `Slot ${slotId} booked successfully!`);
      } else {
        showToast(`Slot ${slotId} updated`);
      }

      if (newStatus === 'available') {
        addUserNotification('parking_update', 'Parking Available', `Slot ${slotId} is now available.`);
        addOperatorNotification('parking_update', 'Slot Available', `Slot ${slotId} marked as available.`);
      } else if (newStatus === 'maintenance') {
        addOperatorNotification('maintenance_update', 'Maintenance Required', `Slot ${slotId} marked for maintenance.`);
      }
    },
    [currentFacility, bookings, operatorNotifications, saveAll, logActivity, showToast, addOperatorNotification, addUserNotification]
  );

  const createBooking = useCallback(
    (slotId: string, date: string, startTime: string, endTime: string): boolean => {
      const curSlots = facilitiesData[currentFacility.id]?.slots || [];
      const slot = curSlots.find((s) => s.id === slotId);
      if (!slot || slot.status !== 'available') {
        return false;
      }

      const bookingId = `BK-${Math.floor(1000 + Math.random() * 9000)}`;
      const timeVal = startTime && endTime ? `${startTime} - ${endTime}` : startTime || 'Flexible';

      const newBooking: Booking = {
        id: bookingId,
        userId: currentUser,
        userName: currentUser,
        bookedBy: currentUser,
        facilityId: currentFacility.id,
        facilityName: currentFacility.name,
        slotId,
        date,
        startTime,
        endTime,
        time: timeVal,
        status: 'Upcoming',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const updatedBookings = [newBooking, ...bookings];
      setBookings(updatedBookings);

      // Set slot to occupied
      setFacilitiesData((prevFacData) => {
        const facSlots = prevFacData[currentFacility.id]?.slots || [];
        const updatedSlots = facSlots.map((s) =>
          s.id === slotId ? { ...s, status: 'occupied' as SlotStatus, lastUpdated: new Date().toISOString() } : s
        );
        const newFacData = {
          ...prevFacData,
          [currentFacility.id]: {
            slots: updatedSlots,
            lastUpdated: new Date().toISOString(),
          },
        };
        saveAll(newFacData, currentFacility.id, updatedBookings, operatorNotifications);
        return newFacData;
      });

      addUserNotification('booking_confirmed', 'Booking Confirmed', `Slot ${slotId} booked at ${currentFacility.name}!`);
      addOperatorNotification('new_booking', 'New Booking', `New booking received for Slot ${slotId} at ${currentFacility.name}.`);
      logActivity(`Booking ${bookingId} created for Slot ${slotId} at ${currentFacility.name}`);
      showToast('Slot booked successfully!');

      return true;
    },
    [facilitiesData, currentFacility, currentUser, bookings, operatorNotifications, saveAll, addUserNotification, addOperatorNotification, logActivity, showToast]
  );

  const cancelBooking = useCallback(
    (bookingId: string) => {
      const booking = bookings.find((b) => b.id === bookingId);
      if (!booking || booking.status === 'Cancelled') return;

      const updatedBookings = bookings.map((b) =>
        b.id === bookingId ? { ...b, status: 'Cancelled' as BookingStatus, updatedAt: new Date().toISOString() } : b
      );
      setBookings(updatedBookings);

      const targetFacId = booking.facilityId || currentFacility.id;

      setFacilitiesData((prevFacData) => {
        const facSlots = prevFacData[targetFacId]?.slots || [];
        const updatedSlots = facSlots.map((s) =>
          s.id === booking.slotId ? { ...s, status: 'available' as SlotStatus, lastUpdated: new Date().toISOString() } : s
        );
        const newFacData = {
          ...prevFacData,
          [targetFacId]: {
            slots: updatedSlots,
            lastUpdated: new Date().toISOString(),
          },
        };
        saveAll(newFacData, currentFacility.id, updatedBookings, operatorNotifications);
        return newFacData;
      });

      logActivity(`Booking ${bookingId} for Slot ${booking.slotId} cancelled by ${currentUser}`);
      addUserNotification('booking_cancelled', 'Booking Cancelled', `Your booking for Slot ${booking.slotId} has been cancelled.`);
      addOperatorNotification('booking_cancelled', 'Booking Cancelled', `Booking ${bookingId} for Slot ${booking.slotId} was cancelled by ${currentUser}.`);
      showToast(`Booking ${bookingId} cancelled successfully!`);
    },
    [bookings, currentFacility, currentUser, operatorNotifications, saveAll, logActivity, addUserNotification, addOperatorNotification, showToast]
  );

  const updateBookingStatus = useCallback(
    (bookingId: string, newStatus: BookingStatus) => {
      const booking = bookings.find((b) => b.id === bookingId);
      if (!booking) return;

      const oldStatus = booking.status;
      const updatedBookings = bookings.map((b) =>
        b.id === bookingId ? { ...b, status: newStatus, updatedAt: new Date().toISOString() } : b
      );
      setBookings(updatedBookings);

      // Adjust slot status if active / completed / cancelled
      setFacilitiesData((prevFacData) => {
        const facId = booking.facilityId || currentFacility.id;
        const facSlots = prevFacData[facId]?.slots || [];
        const updatedSlots = facSlots.map((slot) => {
          if (slot.id !== booking.slotId) return slot;
          if (newStatus === 'Active') {
            return { ...slot, status: 'occupied' as SlotStatus, lastUpdated: new Date().toISOString() };
          } else if (newStatus === 'Completed' || newStatus === 'Cancelled') {
            if (slot.status === 'reserved' || (slot.status === 'occupied' && oldStatus === 'Active')) {
              return { ...slot, status: 'available' as SlotStatus, lastUpdated: new Date().toISOString() };
            }
          }
          return slot;
        });

        const newFacData = {
          ...prevFacData,
          [facId]: {
            slots: updatedSlots,
            lastUpdated: new Date().toISOString(),
          },
        };
        saveAll(newFacData, currentFacility.id, updatedBookings, operatorNotifications);
        return newFacData;
      });

      logActivity(`Booking ${bookingId} marked as ${newStatus}`);

      if (newStatus === 'Active') {
        addUserNotification('booking_updated', 'Booking Active', `Your booking for Slot ${booking.slotId} is now active.`);
      } else if (newStatus === 'Completed') {
        addUserNotification('booking_completed', 'Session Completed', `Your parking session for Slot ${booking.slotId} has been completed.`);
      } else if (newStatus === 'Cancelled') {
        addUserNotification('booking_cancelled', 'Booking Cancelled', `Your booking for Slot ${booking.slotId} has been cancelled by the operator.`);
      }

      showToast(`Booking ${bookingId} updated`);
    },
    [bookings, currentFacility, operatorNotifications, saveAll, logActivity, addUserNotification, showToast]
  );

  const operatorBookSlot = useCallback(
    (slotId: string, details?: { userName?: string; bookedBy?: string; date?: string; startTime?: string; endTime?: string }) => {
      const curSlots = facilitiesData[currentFacility.id]?.slots || [];
      const slot = curSlots.find((s) => s.id === slotId);
      if (!slot) return false;

      const bookingId = `BK-${Math.floor(1000 + Math.random() * 9000)}`;
      const startTimeVal = details?.startTime || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const endTimeVal = details?.endTime || 'Flexible';
      const newBooking: Booking = {
        id: bookingId,
        userId: 'operator_admin',
        userName: details?.userName || details?.bookedBy || 'Operator (Walk-in)',
        bookedBy: details?.bookedBy || details?.userName || 'Operator (Walk-in)',
        facilityId: currentFacility.id,
        facilityName: currentFacility.name,
        slotId,
        date: details?.date || new Date().toISOString().split('T')[0],
        startTime: startTimeVal,
        endTime: endTimeVal,
        time: details?.startTime ? `${startTimeVal} - ${endTimeVal}` : startTimeVal,
        status: 'Active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const updatedBookings = [newBooking, ...bookings];
      setBookings(updatedBookings);

      setFacilitiesData((prevFacData) => {
        const facSlots = prevFacData[currentFacility.id]?.slots || [];
        const updatedSlots = facSlots.map((s) =>
          s.id === slotId ? { ...s, status: 'occupied' as SlotStatus, lastUpdated: new Date().toISOString() } : s
        );
        const newFacData = {
          ...prevFacData,
          [currentFacility.id]: {
            slots: updatedSlots,
            lastUpdated: new Date().toISOString(),
          },
        };
        saveAll(newFacData, currentFacility.id, updatedBookings, operatorNotifications);
        return newFacData;
      });

      addOperatorNotification('new_booking', 'Booking Confirmed', `Slot ${slotId} booked successfully!`);
      logActivity(`Slot ${slotId} booked (Booking ${bookingId})`);
      showToast('Slot booked successfully!');

      return true;
    },
    [facilitiesData, currentFacility, bookings, operatorNotifications, saveAll, addOperatorNotification, logActivity, showToast]
  );

  const createIssue = useCallback(
    (location: string, type: string, priority: IssuePriority, desc: string) => {
      const id = `ISS-${String(issues.length + 1).padStart(3, '0')}`;
      const newIssue: Issue = {
        id,
        location,
        type,
        priority,
        status: 'Open',
        desc,
        date: new Date().toISOString(),
      };
      setIssues((prev) => {
        const updated = [newIssue, ...prev];
        localStorage.setItem(KEYS.ISSUES, JSON.stringify(updated));
        return updated;
      });
      logActivity(`${type} issue reported at ${location}`);
      addOperatorNotification('maintenance_update', 'New Issue Reported', `A ${priority.toLowerCase()} priority issue reported at ${location}.`);
      showToast('Issue reported successfully');
    },
    [issues.length, logActivity, addOperatorNotification, showToast]
  );

  const updateIssueStatus = useCallback(
    (id: string, newStatus: IssueStatus) => {
      setIssues((prev) => {
        const target = prev.find((i) => i.id === id);
        if (!target) return prev;
        if (target.status === 'Open' && newStatus === 'In Progress') {
          // valid
        } else if (target.status === 'In Progress' && newStatus === 'Resolved') {
          // valid
        } else {
          console.error(`Invalid state transition from ${target.status} to ${newStatus}`);
          return prev;
        }

        const updated = prev.map((i) => (i.id === id ? { ...i, status: newStatus } : i));
        localStorage.setItem(KEYS.ISSUES, JSON.stringify(updated));
        return updated;
      });
      logActivity(`Issue ${id} moved to ${newStatus}`);
      showToast(`Issue ${id} marked ${newStatus}`);
    },
    [logActivity, showToast]
  );

  const createUsageRecord = useCallback(
    (date: string, time: string, occupied: number): { success: boolean; error?: string } => {
      if (occupied > stats.usable) {
        return { success: false, error: `Occupied slots cannot exceed current usable capacity (${stats.usable}).` };
      }
      const available = stats.usable - occupied;
      const percent = stats.usable > 0 ? Math.round((occupied / stats.usable) * 100) : 0;
      const newRecord: UsageRecord = { date, time, occupied, available, percent };

      setUsageRecords((prev) => {
        const updated = [newRecord, ...prev];
        localStorage.setItem(KEYS.USAGE, JSON.stringify(updated));
        return updated;
      });
      logActivity(`Usage recorded: ${percent}% occupancy`);
      showToast('Usage record saved');
      return { success: true };
    },
    [stats.usable, logActivity, showToast]
  );

  const markAllUserNotificationsRead = useCallback(() => {
    setUserNotifications((prev) => {
      const updated = prev.map((n) => ({ ...n, read: true }));
      localStorage.setItem(KEYS.USER_NOTIFICATIONS, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const markUserNotificationRead = useCallback((id: string) => {
    setUserNotifications((prev) => {
      const updated = prev.map((n) => (n.id === id ? { ...n, read: true } : n));
      localStorage.setItem(KEYS.USER_NOTIFICATIONS, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const markAllOperatorNotificationsRead = useCallback(() => {
    setOperatorNotifications((prev) => {
      const updated = prev.map((n) => ({ ...n, read: true }));
      localStorage.setItem(KEYS.OPERATOR_NOTIFICATIONS, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const markOperatorNotificationRead = useCallback((id: string) => {
    setOperatorNotifications((prev) => {
      const updated = prev.map((n) => (n.id === id ? { ...n, read: true } : n));
      localStorage.setItem(KEYS.OPERATOR_NOTIFICATIONS, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const resetDemoData = useCallback(() => {
    const facMap: FacilitiesDataMap = {};
    FACILITIES.forEach((fac) => {
      facMap[fac.id] = {
        slots: generateSlotsForFacility(fac),
        lastUpdated: new Date().toISOString(),
      };
    });

    const defaultBookings: Booking[] = [
      {
        id: 'BK-1024',
        userId: 'user1',
        userName: 'user1',
        bookedBy: 'user1',
        facilityId: 'kanakia-road',
        facilityName: 'Kanakia Road Public Parking',
        slotId: 'A02',
        date: new Date().toISOString().split('T')[0],
        startTime: '10:00',
        endTime: '12:00',
        time: '10:00 - 12:00',
        status: 'Upcoming',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    if (facMap['kanakia-road']) {
      const sA02 = facMap['kanakia-road'].slots.find((s) => s.id === 'A02');
      if (sA02) sA02.status = 'occupied';
    }

    const defaultUsage: UsageRecord[] = [
      { date: new Date().toISOString().split('T')[0], time: '10:00', occupied: 22, available: 23, percent: 49 },
      { date: new Date().toISOString().split('T')[0], time: '13:00', occupied: 32, available: 13, percent: 71 },
      { date: new Date().toISOString().split('T')[0], time: '17:00', occupied: 41, available: 4, percent: 91 },
    ];

    const defaultIssues: Issue[] = [
      { id: 'ISS-001', location: 'Slot A04', type: 'Slot Damage', priority: 'High', status: 'Open', desc: 'Concrete surface broken.', date: new Date().toISOString() },
      { id: 'ISS-002', location: 'Entry Gate', type: 'Entry Gate', priority: 'Medium', status: 'In Progress', desc: 'Barrier arm responding slowly.', date: new Date().toISOString() },
      { id: 'ISS-003', location: 'Lighting A', type: 'Lighting', priority: 'Low', status: 'Resolved', desc: 'Bulb replacement.', date: new Date().toISOString() },
    ];

    const defaultActs: Activity[] = [
      { id: Date.now(), description: 'System initialized with demo data', timestamp: new Date().toISOString() },
    ];

    setFacilitiesData(facMap);
    setBookings(defaultBookings);
    setUsageRecords(defaultUsage);
    setIssues(defaultIssues);
    setActivities(defaultActs);
    setOperatorNotifications([]);

    saveAll(facMap, 'kanakia-road', defaultBookings, []);
    localStorage.setItem(KEYS.USAGE, JSON.stringify(defaultUsage));
    localStorage.setItem(KEYS.ISSUES, JSON.stringify(defaultIssues));
    localStorage.setItem(KEYS.ACTIVITIES, JSON.stringify(defaultActs));

    showToast('Demo data reset successful');
  }, [saveAll, showToast]);

  const clearAllData = useCallback(() => {
    localStorage.clear();
    setFacilitiesData({});
    setBookings([]);
    setUsageRecords([]);
    setIssues([]);
    setActivities([]);
    setUserNotifications([]);
    setOperatorNotifications([]);
    showToast('All data cleared');
  }, [showToast]);

  const unlockOperator = useCallback(
    (pin: string): boolean => {
      if (pin === '1234') {
        sessionStorage.setItem(KEYS.OPERATOR_AUTH, 'true');
        setIsOperatorAuth(true);
        showToast('Authenticated as Operator Rajesh K. (ID: OP-104)');
        return true;
      }
      return false;
    },
    [showToast]
  );

  const lockOperator = useCallback(() => {
    sessionStorage.removeItem(KEYS.OPERATOR_AUTH);
    setIsOperatorAuth(false);
    showToast('Dashboard locked');
  }, [showToast]);

  // Sync across tabs via window 'storage' and BroadcastChannel
  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (!event.key || event.key.includes('urbanserve') || event.key.includes('parking') || event.key.includes('booking')) {
        const facRaw = localStorage.getItem(KEYS.FACILITIES_DATA);
        if (facRaw) {
          try {
            setFacilitiesData(JSON.parse(facRaw));
          } catch {}
        }
        const bRaw = localStorage.getItem(KEYS.BOOKINGS);
        if (bRaw) {
          try {
            setBookings(JSON.parse(bRaw));
          } catch {}
        }
        const facId = localStorage.getItem(KEYS.CURRENT_FACILITY);
        if (facId) setCurrentFacilityId(facId);
        const usr = localStorage.getItem(KEYS.CURRENT_USER) as UserType;
        if (usr) setCurrentUserState(usr);
      }
    };

    window.addEventListener('storage', handleStorage);

    let syncChannel: BroadcastChannel | null = null;
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        syncChannel = new BroadcastChannel('urbanserve_sync');
        syncChannel.onmessage = (event) => {
          if (event.data?.type === 'SYNC') {
            const facRaw = localStorage.getItem(KEYS.FACILITIES_DATA);
            if (facRaw) {
              try {
                setFacilitiesData(JSON.parse(facRaw));
              } catch {}
            }
            const bRaw = localStorage.getItem(KEYS.BOOKINGS);
            if (bRaw) {
              try {
                setBookings(JSON.parse(bRaw));
              } catch {}
            }
            const facId = localStorage.getItem(KEYS.CURRENT_FACILITY);
            if (facId) setCurrentFacilityId(facId);
          }
        };
      } catch {}
    }

    return () => {
      window.removeEventListener('storage', handleStorage);
      if (syncChannel) syncChannel.close();
    };
  }, []);

  return (
    <ParkingContext.Provider
      value={{
        facilities: FACILITIES,
        currentFacilityId,
        currentFacility,
        switchFacility,
        facilitiesData,
        slots,
        stats,
        currentUser,
        setCurrentUser,
        bookings,
        createBooking,
        cancelBooking,
        updateBookingStatus,
        issues,
        createIssue,
        updateIssueStatus,
        usageRecords,
        createUsageRecord,
        activities,
        logActivity,
        userNotifications,
        operatorNotifications,
        markAllUserNotificationsRead,
        markUserNotificationRead,
        markAllOperatorNotificationsRead,
        markOperatorNotificationRead,
        updateSlotStatus,
        operatorBookSlot,
        resetDemoData,
        clearAllData,
        toastMessage,
        showToast,
        isOperatorAuth,
        unlockOperator,
        lockOperator,
      }}
    >
      {children}
    </ParkingContext.Provider>
  );
};

export const useParking = (): ParkingContextType => {
  const context = useContext(ParkingContext);
  if (!context) {
    throw new Error('useParking must be used within a ParkingProvider');
  }
  return context;
};
