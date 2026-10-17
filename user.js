const KEYS = {
    PARKING_DATA: 'urbanserve_parkingData',
    SLOTS: 'parkingSlots',
    BOOKINGS: 'urbanserveBookings',
    ACTIVITIES: 'activities',
    NOTIFICATIONS: 'userNotifications',
    OPERATOR_NOTIFICATIONS: 'operatorNotifications',
    FACILITIES_DATA: 'urbanserve_facilities_data',
    CURRENT_FACILITY: 'urbanserve_current_facility'
};

let currentUser = localStorage.getItem('urbanserve_current_user') || 'user1';

const FACILITIES = [
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
            { prefix: 'B', count: 25 }
        ]
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
            { prefix: 'B', count: 20 }
        ]
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
            { prefix: 'B', count: 15 }
        ]
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
            { prefix: 'B', count: 12 }
        ]
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
            { prefix: 'B', count: 13 }
        ]
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
            { prefix: 'B', count: 10 }
        ]
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
            { prefix: 'B', count: 15 }
        ]
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
            { prefix: 'B', count: 18 }
        ]
    }
];

let currentFacilityId = localStorage.getItem(KEYS.CURRENT_FACILITY) || 'kanakia-road';
let currentFacility = FACILITIES.find(f => f.id === currentFacilityId) || FACILITIES[0];
let facilitiesData = {};

let slots = [];
let bookings = [];
let userNotifications = [];
let currentBookingSlot = null;
let map = null;
let mapMarkers = [];
let userSlotFilter = 'all';
let userSlotSearchQuery = '';

document.addEventListener('DOMContentLoaded', () => {
    loadData();
    setupNavigation();
    setupUserSwitcher();
    setupFacilitySelector();
    setupSlotFilters();
    initMap();
    renderAll();

    // Listen for storage changes from Operator side in other tabs
    window.addEventListener('storage', function(event) {
        if (!event.key ||
            event.key === 'urbanserve_current_user' ||
            event.key === KEYS.CURRENT_FACILITY ||
            event.key === KEYS.FACILITIES_DATA ||
            event.key === KEYS.PARKING_DATA ||
            event.key === 'parkingData' ||
            event.key === KEYS.SLOTS ||
            event.key === KEYS.BOOKINGS ||
            event.key === KEYS.NOTIFICATIONS ||
            event.key.includes('parking') ||
            event.key.includes('booking') ||
            event.key.includes('urbanserve')) {
            if (event.key === 'urbanserve_current_user') {
                currentUser = localStorage.getItem('urbanserve_current_user') || 'user1';
                const userSel = document.getElementById('current-user-select');
                if (userSel) userSel.value = currentUser;
            }
            loadData();
            renderAll();
        }
    });

    // Support BroadcastChannel for immediate cross-tab sync
    if (typeof BroadcastChannel !== 'undefined') {
        try {
            const syncChannel = new BroadcastChannel('urbanserve_sync');
            syncChannel.onmessage = function(event) {
                if (event.data && event.data.type === 'SYNC') {
                    loadData();
                    renderAll();
                }
            };
        } catch (e) {}
    }

    // Re-render when tab gains focus or visibility
    window.addEventListener('focus', function() {
        loadData();
        renderAll();
    });
    document.addEventListener('visibilitychange', function() {
        if (document.visibilityState === 'visible') {
            loadData();
            renderAll();
        }
    });
    
    setupBookingModals();
    setupNotifications();
});

function generateSlotsForFacility(fac) {
    const res = [];
    fac.zones.forEach(zone => {
        for (let i = 1; i <= zone.count; i++) {
            const id = `${zone.prefix}${i.toString().padStart(2, '0')}`;
            let status = 'available';
            const rand = Math.random();
            if (rand > 0.8) status = 'maintenance';
            else if (rand > 0.35) status = 'occupied';
            res.push({ id, status, lastUpdated: new Date().toISOString() });
        }
    });
    return res;
}

function loadFacilitiesData() {
    let facData = null;
    try {
        const raw = localStorage.getItem(KEYS.FACILITIES_DATA);
        if (raw) facData = JSON.parse(raw);
    } catch (e) {
        console.error("Data error", e);
    }
    if (!facData || typeof facData !== 'object') {
        facData = {};
    }

    // Keep existing Kanakia slots if already saved
    if (!facData['kanakia-road'] || !Array.isArray(facData['kanakia-road'].slots) || facData['kanakia-road'].slots.length === 0) {
        let existingKanakia = null;
        try {
            const stored = JSON.parse(localStorage.getItem(KEYS.SLOTS)) || [];
            if (stored.length > 0) existingKanakia = stored;
        } catch(e) {}
        if (!existingKanakia) {
            try {
                const pData = JSON.parse(localStorage.getItem(KEYS.PARKING_DATA) || '{}');
                if (Array.isArray(pData.slots) && pData.slots.length > 0) existingKanakia = pData.slots;
            } catch(e) {}
        }
        facData['kanakia-road'] = {
            slots: existingKanakia || generateSlotsForFacility(FACILITIES[0]),
            lastUpdated: new Date().toISOString()
        };
    }

    FACILITIES.forEach(fac => {
        if (!facData[fac.id] || !Array.isArray(facData[fac.id].slots) || facData[fac.id].slots.length === 0) {
            facData[fac.id] = {
                slots: generateSlotsForFacility(fac),
                lastUpdated: new Date().toISOString()
            };
        }
    });

    facilitiesData = facData;
    localStorage.setItem(KEYS.FACILITIES_DATA, JSON.stringify(facData));
    return facData;
}

function loadData() {
    currentFacilityId = localStorage.getItem(KEYS.CURRENT_FACILITY) || 'kanakia-road';
    currentFacility = FACILITIES.find(f => f.id === currentFacilityId) || FACILITIES[0];

    loadFacilitiesData();
    slots = facilitiesData[currentFacility.id].slots;

    bookings = JSON.parse(localStorage.getItem(KEYS.BOOKINGS)) || [];
    userNotifications = JSON.parse(localStorage.getItem(KEYS.NOTIFICATIONS)) || [];

    // If no bookings exist yet, populate an initial mock booking
    if (bookings.length === 0) {
        bookings = [
            {
                id: 'BK-1024',
                userId: currentUser,
                userName: currentUser,
                bookedBy: currentUser,
                facilityId: 'kanakia-road',
                facilityName: 'Kanakia Road Public Parking',
                slotId: 'A02',
                date: new Date().toISOString().split('T')[0],
                startTime: '10:00',
                endTime: '12:00',
                time: '10:00 - 12:00',
                status: 'Upcoming',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            }
        ];
        if (facilitiesData['kanakia-road']) {
            const sA02 = facilitiesData['kanakia-road'].slots.find(s => s.id === 'A02');
            if (sA02) sA02.status = 'occupied';
        }
        saveParkingData();
    }
}

function saveParkingData() {
    facilitiesData[currentFacility.id] = {
        slots: slots,
        lastUpdated: new Date().toISOString()
    };
    localStorage.setItem(KEYS.FACILITIES_DATA, JSON.stringify(facilitiesData));
    localStorage.setItem(KEYS.CURRENT_FACILITY, currentFacilityId);

    let opNotifs = [];
    try {
        const rawOp = localStorage.getItem(KEYS.OPERATOR_NOTIFICATIONS);
        if (rawOp) opNotifs = JSON.parse(rawOp);
    } catch (e) {}

    const data = {
        facilityId: currentFacility.id,
        facilityName: currentFacility.name,
        slots,
        bookings,
        notifications: opNotifs,
        totalSlots: slots.length,
        lastUpdated: new Date().toISOString()
    };
    localStorage.setItem(KEYS.PARKING_DATA, JSON.stringify(data));
    localStorage.setItem('parkingData', JSON.stringify(data));
    localStorage.setItem(KEYS.SLOTS, JSON.stringify(slots));
    localStorage.setItem(KEYS.BOOKINGS, JSON.stringify(bookings));
    localStorage.setItem(KEYS.NOTIFICATIONS, JSON.stringify(userNotifications));

    if (typeof BroadcastChannel !== 'undefined') {
        try {
            const syncChannel = new BroadcastChannel('urbanserve_sync');
            syncChannel.postMessage({ type: 'SYNC', facilityId: currentFacilityId, timestamp: Date.now() });
        } catch (e) {}
    }
}

function saveSlots() { saveParkingData(); }
function saveBookings() { saveParkingData(); }
function saveNotifications() { saveParkingData(); }

function setupFacilitySelector() {
    const select = document.getElementById('user-facility-select');
    if (!select) return;

    select.innerHTML = '';
    FACILITIES.forEach(fac => {
        const opt = document.createElement('option');
        opt.value = fac.id;
        opt.textContent = `${fac.name} (${fac.totalSlots} Slots)`;
        if (fac.id === currentFacilityId) opt.selected = true;
        select.appendChild(opt);
    });

    select.addEventListener('change', (e) => {
        window.switchFacility(e.target.value);
    });
}

window.switchFacility = function(facId) {
    const target = FACILITIES.find(f => f.id === facId);
    if (!target) return;
    currentFacilityId = target.id;
    currentFacility = target;
    localStorage.setItem(KEYS.CURRENT_FACILITY, currentFacilityId);

    loadFacilitiesData();
    slots = facilitiesData[currentFacility.id].slots;
    saveParkingData();
    renderAll();

    const select = document.getElementById('user-facility-select');
    if (select) select.value = currentFacilityId;

    if (map) {
        map.flyTo([target.lat, target.lng], 16, { duration: 0.8 });
    }
    showToast(`Switched to ${target.name}`);
};

function logActivity(description) {
    let activities = JSON.parse(localStorage.getItem(KEYS.ACTIVITIES)) || [];
    const activity = {
        id: Date.now(),
        description,
        timestamp: new Date().toISOString()
    };
    activities.unshift(activity);
    if (activities.length > 50) activities.pop();
    localStorage.setItem(KEYS.ACTIVITIES, JSON.stringify(activities));
}

function setupUserSwitcher() {
    const userSelect = document.getElementById('current-user-select');
    if (!userSelect) return;

    userSelect.value = currentUser;

    userSelect.addEventListener('change', (e) => {
        currentUser = e.target.value;
        localStorage.setItem('urbanserve_current_user', currentUser);
        renderBookings();
        renderNotifications();
        showToast(`Logged in as ${currentUser}`);
    });
}

function addUserNotification(type, title, message) {
    const notif = { id: Date.now().toString(), type, title, message, timestamp: new Date().toISOString(), read: false };
    userNotifications.unshift(notif);
    if (userNotifications.length > 50) userNotifications.pop();
    saveNotifications();
    renderNotifications();
}

function addOperatorNotification(type, title, message) {
    let opNotifs = JSON.parse(localStorage.getItem(KEYS.OPERATOR_NOTIFICATIONS)) || [];
    const notif = { id: Date.now().toString(), type, title, message, timestamp: new Date().toISOString(), read: false };
    opNotifs.unshift(notif);
    if (opNotifs.length > 50) opNotifs.pop();
    localStorage.setItem(KEYS.OPERATOR_NOTIFICATIONS, JSON.stringify(opNotifs));
}


function setupNavigation() {
    const navBtns = document.querySelectorAll('.user-nav-btn');
    const views = document.querySelectorAll('.view');

    navBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const target = e.currentTarget;
            navBtns.forEach(b => b.classList.remove('active'));
            target.classList.add('active');

            const targetId = target.getAttribute('data-target');
            views.forEach(v => {
                if (v.id === targetId) v.classList.remove('hidden');
                else v.classList.add('hidden');
            });

            window.scrollTo({ top: 0, behavior: 'smooth' });

            if (targetId === 'bookings-view') {
                renderBookings();
            }

            if (targetId === 'home-view' && map) {
                setTimeout(() => map.invalidateSize(), 150);
            }
        });
    });

    document.querySelectorAll('.btn-get-started').forEach(btn => {
        btn.addEventListener('click', () => {
            const slotsBtn = document.querySelector('.user-nav-btn[data-target="slots-view"]');
            if (slotsBtn) slotsBtn.click();
        });
    });

    document.querySelectorAll('.btn-explore-map').forEach(btn => {
        btn.addEventListener('click', () => {
            const homeBtn = document.querySelector('.user-nav-btn[data-target="home-view"]');
            if (homeBtn) homeBtn.click();
        });
    });

    const logoHomeLink = document.getElementById('logo-home-link');
    if (logoHomeLink) {
        logoHomeLink.addEventListener('click', () => {
            const heroBtn = document.querySelector('.user-nav-btn[data-target="hero-view"]');
            if (heroBtn) heroBtn.click();
        });
    }

    const btnViewSlots = document.getElementById('btn-view-slots');
    if (btnViewSlots) {
        btnViewSlots.addEventListener('click', () => {
            document.querySelector('.user-nav-btn[data-target="slots-view"]').click();
            const availPill = document.querySelector('#user-slot-filter-pills .filter-pill[data-filter="available"]');
            if (availPill) availPill.click();
        });
    }

    const userCloseModal = document.getElementById('user-close-modal');
    if (userCloseModal) {
        userCloseModal.addEventListener('click', () => {
            document.getElementById('user-modal-slot').classList.add('hidden');
        });
    }

    const userModalSlot = document.getElementById('user-modal-slot');
    if (userModalSlot) {
        userModalSlot.addEventListener('click', (e) => {
            if (e.target === userModalSlot) {
                userModalSlot.classList.add('hidden');
            }
        });
    }
}

function calculateStats() {
    const total = slots.length || 50;
    const maintenance = slots.filter(s => s.status === 'maintenance').length;
    const occupied = slots.filter(s => s.status === 'occupied').length;
    const available = slots.filter(s => s.status === 'available').length;

    const usable = total - maintenance;
    let occupancyPercent = 0;
    if (usable > 0) {
        occupancyPercent = Math.round((occupied / usable) * 100);
    }
    
    let status = 'Available';
    if (occupancyPercent >= 90) status = 'High Occupancy';
    else if (occupancyPercent >= 70) status = 'Busy';
    if (usable === 0) status = 'Unavailable';

    let latestTime = null;
    slots.forEach(s => {
        if (!latestTime || new Date(s.lastUpdated) > latestTime) {
            latestTime = new Date(s.lastUpdated);
        }
    });

    return { total, maintenance, occupied, available, usable, occupancyPercent, status, latestTime };
}

function renderAll() {
    const stats = calculateStats();
    
    // Update Facility Name & Address in Hero
    const heroName = document.getElementById('user-facility-name');
    if (heroName) heroName.textContent = currentFacility.name;
    const heroAddr = document.getElementById('user-facility-address');
    if (heroAddr) heroAddr.textContent = currentFacility.address;

    // Update Dropdown Selection
    const select = document.getElementById('user-facility-select');
    if (select && select.value !== currentFacilityId) select.value = currentFacilityId;

    // Update Home KPIs
    document.getElementById('user-total').textContent = stats.total;
    document.getElementById('user-available').textContent = stats.available;
    document.getElementById('user-occupied').textContent = stats.occupied;
    document.getElementById('user-maintenance').textContent = stats.maintenance;
    document.getElementById('user-occupancy-percent').textContent = stats.occupancyPercent + '%';
    
    if (stats.latestTime) {
        document.getElementById('user-last-updated').textContent = stats.latestTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    // Update Hero Stats if element exists
    const heroStatAvailable = document.getElementById('hero-stat-available');
    if (heroStatAvailable) {
        heroStatAvailable.textContent = `${stats.available} Slots`;
    }

    // Update Info Panel
    const infoName = document.getElementById('info-facility-name');
    if (infoName) infoName.textContent = currentFacility.name;
    const infoAddr = document.getElementById('info-facility-address');
    if (infoAddr) infoAddr.textContent = currentFacility.address;
    const infoRate = document.getElementById('info-rate');
    if (infoRate) infoRate.textContent = currentFacility.rate;

    document.getElementById('info-capacity').textContent = stats.total;
    document.getElementById('info-available').textContent = stats.available;
    document.getElementById('info-occupied').textContent = stats.occupied;
    document.getElementById('info-maintenance').textContent = stats.maintenance;
    document.getElementById('info-occupancy').textContent = stats.occupancyPercent + '%';
    document.getElementById('info-status').textContent = stats.status;

    // Update slots header facility
    const slotFacName = document.getElementById('user-slot-facility-name');
    if (slotFacName) slotFacName.textContent = currentFacility.name;

    // Render Slots with Filter
    renderUserSlots();
    
    // Render Bookings
    renderBookings();
    
    renderNotifications();

    renderMap();

    if (window.lucide) {
        window.lucide.createIcons();
    }
}

function renderUserSlots() {
    const grid = document.getElementById('user-slot-grid');
    const emptyState = document.getElementById('user-slots-empty-state');
    if (!grid) return;
    grid.innerHTML = '';

    const query = userSlotSearchQuery.trim().toLowerCase();

    const filteredSlots = slots.filter(slot => {
        if (query && !slot.id.toLowerCase().includes(query)) {
            return false;
        }
        if (userSlotFilter === 'available') {
            return slot.status === 'available';
        }
        if (userSlotFilter === 'zone-a') {
            return slot.id.startsWith('A');
        }
        if (userSlotFilter === 'zone-b') {
            return slot.id.startsWith('B');
        }
        return true;
    });

    if (filteredSlots.length === 0) {
        if (emptyState) emptyState.classList.remove('hidden');
    } else {
        if (emptyState) emptyState.classList.add('hidden');
        filteredSlots.forEach(slot => {
            const slotEl = document.createElement('div');
            slotEl.className = `slot-item slot-${slot.status}`;

            slotEl.innerHTML = `
                <div class="slot-id">${slot.id}</div>
                <div class="slot-status-text">${slot.status}</div>
            `;
            
            slotEl.addEventListener('click', () => {
                showSlotModal(slot);
            });

            grid.appendChild(slotEl);
        });
    }
}

function setupSlotFilters() {
    const searchInput = document.getElementById('user-slot-search');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            userSlotSearchQuery = e.target.value;
            renderUserSlots();
            if (window.lucide) window.lucide.createIcons();
        });
    }

    const pills = document.querySelectorAll('#user-slot-filter-pills .filter-pill');
    pills.forEach(pill => {
        pill.addEventListener('click', (e) => {
            pills.forEach(p => p.classList.remove('active'));
            const clicked = e.currentTarget;
            clicked.classList.add('active');
            userSlotFilter = clicked.getAttribute('data-filter') || 'all';
            renderUserSlots();
            if (window.lucide) window.lucide.createIcons();
        });
    });
}


function showToast(message) {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `<i data-lucide="check-circle-2"></i> ${message}`;
    container.appendChild(toast);

    if (window.lucide) window.lucide.createIcons({ root: toast });

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        toast.style.transition = 'all 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function renderBookings() {
    const tbody = document.getElementById('user-bookings-table');
    const emptyState = document.getElementById('user-bookings-empty');
    if (!tbody) return;
    tbody.innerHTML = '';
    
    // Filter bookings for the currently logged-in user
    const userBookings = bookings.filter(b => {
        return b.userId === currentUser ||
               b.bookedBy === currentUser ||
               b.userName === currentUser;
    });
    
    if (userBookings.length === 0) {
        if (emptyState) emptyState.classList.remove('hidden');
    } else {
        if (emptyState) emptyState.classList.add('hidden');
        
        // Sort by newest first
        const sortedBookings = [...userBookings].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        
        sortedBookings.forEach(booking => {
            let statusClass = 'badge-low';
            if (booking.status === 'Active') statusClass = 'badge-progress';
            else if (booking.status === 'Completed') statusClass = 'badge-resolved';
            else if (booking.status === 'Upcoming') statusClass = 'badge-open';
            
            let actionHtml = '';
            if (booking.status === 'Upcoming' || booking.status === 'Active') {
                actionHtml = `<button class="btn danger-btn action-btn" onclick="window.cancelBooking('${booking.id}')">Cancel Booking</button>`;
            } else if (booking.status === 'Cancelled') {
                actionHtml = `<span style="font-size:0.85rem; color:var(--text-muted); font-weight:500;">Cancelled</span>`;
            } else {
                actionHtml = `<span style="font-size:0.85rem; color:var(--text-muted); font-weight:500;">${booking.status}</span>`;
            }

            const displayTime = booking.time || (booking.startTime ? (booking.endTime ? `${booking.startTime} - ${booking.endTime}` : booking.startTime) : '--');
            const facilityName = booking.facilityName || 'Kanakia Road Public Parking';
            
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${booking.id}</strong></td>
                <td><span style="font-weight:500; font-size:0.85rem; color:var(--primary-color);">${facilityName}</span></td>
                <td><span style="font-weight:600; color:var(--accent-color);">${booking.slotId}</span></td>
                <td>${booking.date || '--'}</td>
                <td>${displayTime}</td>
                <td><span class="badge ${statusClass}">${booking.status}</span></td>
                <td>${actionHtml}</td>
            `;
            tbody.appendChild(tr);
        });
    }
}

window.cancelBooking = function(bookingId) {
    loadData();

    const booking = bookings.find(b => b.id === bookingId);
    if (!booking) return;
    if (booking.status === 'Cancelled') return;
    
    booking.status = 'Cancelled';
    booking.updatedAt = new Date().toISOString();
    
    // Free slot in facilitiesData
    const facData = loadFacilitiesData();
    const targetFacId = booking.facilityId || currentFacilityId;
    if (facData[targetFacId] && Array.isArray(facData[targetFacId].slots)) {
        const targetSlot = facData[targetFacId].slots.find(s => s.id === booking.slotId);
        if (targetSlot) {
            targetSlot.status = 'available';
            targetSlot.lastUpdated = new Date().toISOString();
        }
        localStorage.setItem(KEYS.FACILITIES_DATA, JSON.stringify(facData));
    }

    // If currently active facility is target facility, update active slots too
    if (targetFacId === currentFacilityId) {
        const slot = slots.find(s => s.id === booking.slotId);
        if (slot) {
            slot.status = 'available';
            slot.lastUpdated = new Date().toISOString();
        }
    }
    
    saveParkingData();
    logActivity(`Booking ${bookingId} for Slot ${booking.slotId} cancelled by ${currentUser}`);
    addUserNotification('booking_cancelled', 'Booking Cancelled', `Your booking for Slot ${booking.slotId} has been cancelled.`);
    addOperatorNotification('booking_cancelled', 'Booking Cancelled', `Booking ${bookingId} for Slot ${booking.slotId} was cancelled by ${currentUser}.`);
    showToast(`Booking ${bookingId} cancelled successfully!`);
    renderAll();
};

function showSlotModal(slot) {
    document.getElementById('user-modal-slot-id').textContent = slot.id;
    
    const badge = document.getElementById('user-modal-slot-badge');
    badge.textContent = slot.status.charAt(0).toUpperCase() + slot.status.slice(1);
    badge.className = `status-badge status-${slot.status}`;
    
    const time = new Date(slot.lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    document.getElementById('user-modal-slot-time').textContent = time;
    
    const entryPoint = document.getElementById('booking-entry-point');
    if (slot.status === 'available') {
        currentBookingSlot = slot;
        entryPoint.classList.remove('hidden');
    } else {
        currentBookingSlot = null;
        entryPoint.classList.add('hidden');
    }
    
    document.getElementById('user-modal-slot').classList.remove('hidden');
}

function setupBookingModals() {
    // Start booking
    document.getElementById('btn-start-booking').addEventListener('click', () => {
        if (!currentBookingSlot) return;
        document.getElementById('user-modal-slot').classList.add('hidden');
        
        document.getElementById('book-slot-id').value = currentBookingSlot.id;
        document.getElementById('book-date').value = new Date().toISOString().split('T')[0];
        document.getElementById('book-start-time').value = '';
        document.getElementById('book-end-time').value = '';
        document.getElementById('booking-error-msg').classList.add('hidden');
        
        document.getElementById('booking-form-step').classList.remove('hidden');
        document.getElementById('booking-summary-step').classList.add('hidden');
        
        document.getElementById('user-modal-book').classList.remove('hidden');
    });
    
    // Close booking modal
    document.getElementById('user-close-book-modal').addEventListener('click', () => {
        document.getElementById('user-modal-book').classList.add('hidden');
    });
    document.getElementById('btn-cancel-booking-form').addEventListener('click', () => {
        document.getElementById('user-modal-book').classList.add('hidden');
    });
    
    // Review booking
    document.getElementById('form-booking').addEventListener('submit', (e) => {
        e.preventDefault();
        
        // Re-check slot availability
        const slot = slots.find(s => s.id === currentBookingSlot.id);
        if (slot.status !== 'available') {
            const err = document.getElementById('booking-error-msg');
            err.textContent = 'This slot is no longer available.';
            err.classList.remove('hidden');
            return;
        }
        
        const date = document.getElementById('book-date').value;
        const start = document.getElementById('book-start-time').value;
        const end = document.getElementById('book-end-time').value;
        
        if (start >= end) {
            const err = document.getElementById('booking-error-msg');
            err.textContent = 'End time must be after start time.';
            err.classList.remove('hidden');
            return;
        }
        
        document.getElementById('summary-slot').textContent = currentBookingSlot.id;
        document.getElementById('summary-date').textContent = date;
        document.getElementById('summary-start').textContent = start;
        document.getElementById('summary-end').textContent = end;
        
        document.getElementById('booking-form-step').classList.add('hidden');
        document.getElementById('booking-summary-step').classList.remove('hidden');
    });
    
    document.getElementById('btn-back-to-booking').addEventListener('click', () => {
        document.getElementById('booking-form-step').classList.remove('hidden');
        document.getElementById('booking-summary-step').classList.add('hidden');
    });
    
    document.getElementById('btn-confirm-booking').addEventListener('click', () => {
        // Final check
        const slot = slots.find(s => s.id === currentBookingSlot.id);
        if (slot.status !== 'available') {
            document.getElementById('booking-form-step').classList.remove('hidden');
            document.getElementById('booking-summary-step').classList.add('hidden');
            const err = document.getElementById('booking-error-msg');
            err.textContent = 'Slot became unavailable. Please choose another.';
            err.classList.remove('hidden');
            return;
        }
        
        const bookingId = `BK-${Math.floor(1000 + Math.random() * 9000)}`;
        const dateVal = document.getElementById('book-date').value;
        const startVal = document.getElementById('book-start-time').value;
        const endVal = document.getElementById('book-end-time').value;
        const timeVal = (startVal && endVal) ? `${startVal} - ${endVal}` : (startVal || 'Flexible');

        const newBooking = {
            id: bookingId,
            userId: currentUser,
            userName: currentUser,
            bookedBy: currentUser,
            facilityId: currentFacility.id,
            facilityName: currentFacility.name,
            slotId: currentBookingSlot.id,
            date: dateVal,
            startTime: startVal,
            endTime: endVal,
            time: timeVal,
            status: 'Upcoming',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        bookings.unshift(newBooking);
        
        // Update slot to 'occupied'
        slot.status = 'occupied';
        slot.lastUpdated = new Date().toISOString();
        
        // Add unread notification for the Bell Icon
        addUserNotification('booking_confirmed', 'Booking Confirmed', `Slot ${currentBookingSlot.id} booked at ${currentFacility.name}!`);
        addOperatorNotification('new_booking', 'New Booking', `New booking received for Slot ${currentBookingSlot.id} at ${currentFacility.name}.`);
        
        saveParkingData();
        logActivity(`Booking ${bookingId} created for Slot ${currentBookingSlot.id} at ${currentFacility.name}`);
        
        // Refresh UI immediately
        document.getElementById('user-modal-book').classList.add('hidden');
        renderAll();
        
        // Temporary toast message for 3 seconds
        showToast('Slot booked successfully!');
        
        // Go to bookings view
        document.querySelector('.user-nav-btn[data-target="bookings-view"]').click();
    });
}

// Notifications Logic
function setupNotifications() {
    const bellBtn = document.getElementById('user-notification-bell');
    const panel = document.getElementById('user-notification-panel');
    const markReadBtn = document.getElementById('user-mark-all-read');
    
    bellBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        panel.classList.toggle('open');
    });
    
    document.addEventListener('click', (e) => {
        if (!panel.contains(e.target) && !bellBtn.contains(e.target)) {
            panel.classList.remove('open');
        }
    });
    
    markReadBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        userNotifications.forEach(n => n.read = true);
        saveNotifications();
        renderNotifications();
    });
}

function renderNotifications() {
    const list = document.getElementById('user-notification-list');
    const badge = document.getElementById('user-notification-badge');
    if (!list || !badge) return;
    
    const unreadCount = userNotifications.filter(n => !n.read).length;
    if (unreadCount > 0) {
        badge.textContent = unreadCount;
        badge.classList.remove('hidden');
    } else {
        badge.classList.add('hidden');
    }
    
    list.innerHTML = '';
    
    if (userNotifications.length === 0) {
        list.innerHTML = `
            <div class="notification-empty">
                <i data-lucide="bell-off"></i>
                <p>No notifications yet</p>
            </div>
        `;
    } else {
        userNotifications.forEach(notif => {
            const el = document.createElement('div');
            el.className = `notification-item ${notif.read ? '' : 'unread'}`;
            
            let icon = 'bell';
            if (notif.type.includes('confirmed')) icon = 'check-circle-2';
            else if (notif.type.includes('cancelled')) icon = 'x-circle';
            else if (notif.type.includes('completed')) icon = 'flag';
            else if (notif.type.includes('updated')) icon = 'refresh-cw';
            
            const timeAgo = getTimeAgo(new Date(notif.timestamp));
            
            el.innerHTML = `
                <div class="notification-icon"><i data-lucide="${icon}"></i></div>
                <div class="notification-content">
                    <div class="notification-title">${notif.title}</div>
                    <div class="notification-message">${notif.message}</div>
                    <div class="notification-time">${timeAgo}</div>
                </div>
            `;
            
            el.addEventListener('click', () => {
                if (!notif.read) {
                    notif.read = true;
                    saveNotifications();
                    renderNotifications();
                }
            });
            
            list.appendChild(el);
        });
    }
    
    if (window.lucide) window.lucide.createIcons();
}

function getTimeAgo(date) {
    const seconds = Math.floor((new Date() - date) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " years ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " months ago";
    interval = seconds / 86400;
    if (interval >= 1) {
        if (Math.floor(interval) === 1) return "Yesterday";
        return Math.floor(interval) + " days ago";
    }
    interval = seconds / 3600;
    if (interval >= 1) return Math.floor(interval) + " hours ago";
    interval = seconds / 60;
    if (interval >= 1) return Math.floor(interval) + " min ago";
    return "Just now";
}

// --- Leaflet Map & Parking Facilities ---
function createFacilityMarkerIcon(status, isCurrent) {
    const isAvailable = (status || '').toLowerCase() === 'available';
    const colorClass = isAvailable ? 'marker-available' : 'marker-occupied';
    const currentStyle = isCurrent ? 'box-shadow: 0 0 0 4px #2563eb, 0 4px 10px rgba(0,0,0,0.3); transform: scale(1.15);' : '';

    return L.divIcon({
        className: 'custom-map-marker',
        html: `<div class="custom-marker-pin ${colorClass}" style="${currentStyle}">
                 <span>P</span>
               </div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 28],
        popupAnchor: [0, -26]
    });
}

function renderMap() {
    if (!map || typeof L === 'undefined') return;

    mapMarkers.forEach(m => map.removeLayer(m));
    mapMarkers = [];

    const facData = loadFacilitiesData();

    FACILITIES.forEach(fac => {
        const facSlots = (facData[fac.id] && facData[fac.id].slots) || [];
        const total = facSlots.length || fac.totalSlots;
        const available = facSlots.filter(s => s.status === 'available').length;
        const isFull = available === 0;
        const isCurrent = fac.id === currentFacilityId;
        const statusText = isFull ? 'Occupied' : 'Available';

        const marker = L.marker([fac.lat, fac.lng], {
            icon: createFacilityMarkerIcon(statusText, isCurrent)
        }).addTo(map);

        const popupHtml = `
            <div class="map-popup-card">
                <h4>${fac.name} ${isCurrent ? '<span class="map-active-badge">Active Area</span>' : ''}</h4>
                <div style="display:flex; align-items:center; justify-content:space-between; margin: 5px 0;">
                    <span class="map-status-badge ${isFull ? 'occupied' : 'available'}">
                        ${available} / ${total} Available
                    </span>
                    <span style="font-size:0.8rem; font-weight:600; color:var(--text-muted);">${fac.rate}</span>
                </div>
                <div class="map-popup-loc">${fac.address}</div>
                <button class="map-select-btn" onclick="window.switchFacility('${fac.id}')">
                    ${isCurrent ? 'Viewing This Facility' : 'Select This Area'}
                </button>
            </div>
        `;

        marker.bindPopup(popupHtml);
        mapMarkers.push(marker);
    });
}

function initMap() {
    const mapContainer = document.getElementById('map');
    if (!mapContainer || typeof L === 'undefined') return;

    // Center on current facility
    const lat = currentFacility ? currentFacility.lat : 19.3005;
    const lng = currentFacility ? currentFacility.lng : 72.8762;
    const zoomLevel = 15;

    map = L.map('map').setView([lat, lng], zoomLevel);

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors'
    }).addTo(map);

    renderMap();

    window.addEventListener('resize', () => {
        if (map) map.invalidateSize();
    });
}


