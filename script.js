const KEYS = {
    PARKING_DATA: 'urbanserve_parkingData',
    SLOTS: 'parkingSlots',
    USAGE: 'usageRecords',
    ISSUES: 'issues',
    ACTIVITIES: 'activities',
    BOOKINGS: 'urbanserveBookings',
    NOTIFICATIONS: 'operatorNotifications',
    USER_NOTIFICATIONS: 'userNotifications',
    FACILITIES_DATA: 'urbanserve_facilities_data',
    CURRENT_FACILITY: 'urbanserve_current_facility'
};

const currentUser = 'user1';

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
let usageRecords = [];
let issues = [];
let activities = [];
let bookings = [];
let operatorNotifications = [];
let currentSelectedSlot = null;
let map = null;
let mapMarkers = [];

// Initialization
document.addEventListener('DOMContentLoaded', () => {
    loadAllData();
    setupNavigation();
    setupOperatorAuth();
    setupFacilitySelector();
    setupModals();
    setupForms();
    initMap();
    renderAll();

    // Update current datetime in header
    const dtEl = document.getElementById('current-datetime');
    if (dtEl) {
        dtEl.textContent = new Date().toLocaleString([], { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    }
    
    // Listen for storage changes from User side in other tabs
    window.addEventListener('storage', function(event) {
        if (!event.key ||
            event.key === KEYS.CURRENT_FACILITY ||
            event.key === KEYS.FACILITIES_DATA ||
            event.key === KEYS.PARKING_DATA ||
            event.key === 'parkingData' ||
            event.key === KEYS.SLOTS ||
            event.key === KEYS.BOOKINGS ||
            event.key === KEYS.NOTIFICATIONS ||
            event.key === KEYS.ACTIVITIES ||
            event.key.includes('parking') ||
            event.key.includes('booking') ||
            event.key.includes('urbanserve')) {
            loadAllData();
            renderAll();
        }
    });

    // Support BroadcastChannel for immediate cross-tab sync
    if (typeof BroadcastChannel !== 'undefined') {
        try {
            const syncChannel = new BroadcastChannel('urbanserve_sync');
            syncChannel.onmessage = function(event) {
                if (event.data && event.data.type === 'SYNC') {
                    loadAllData();
                    renderAll();
                }
            };
        } catch (e) {}
    }

    // Also re-render whenever operator tab gains focus or visibility
    window.addEventListener('focus', function() {
        loadAllData();
        renderAll();
    });
    document.addEventListener('visibilitychange', function() {
        if (document.visibilityState === 'visible') {
            loadAllData();
            renderAll();
        }
    });
    
    setupNotifications();
});

// --- UI Utilities ---
function refreshIcons() {
    if (window.lucide) {
        window.lucide.createIcons();
    }
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

function setupFacilitySelector() {
    const select = document.getElementById('operator-facility-select');
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

function setupOperatorAuth() {
    const pinModal = document.getElementById('operator-pin-modal');
    const pinForm = document.getElementById('form-operator-pin');
    const pinInput = document.getElementById('operator-pin-input');
    const pinError = document.getElementById('operator-pin-error');
    const lockBtn = document.getElementById('btn-operator-lock');

    if (!pinModal || !pinForm) return;

    // Check existing session auth
    const isAuth = sessionStorage.getItem('urbanserve_operator_auth') === 'true';
    if (!isAuth) {
        pinModal.classList.remove('hidden');
        setTimeout(() => { if (pinInput) pinInput.focus(); }, 150);
    } else {
        pinModal.classList.add('hidden');
    }

    pinForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const enteredPin = (pinInput ? pinInput.value : '').trim();
        if (enteredPin === '1234') {
            sessionStorage.setItem('urbanserve_operator_auth', 'true');
            pinModal.classList.add('hidden');
            if (pinError) pinError.classList.add('hidden');
            if (pinInput) pinInput.value = '';
            showToast('Authenticated as Operator Rajesh K. (ID: OP-104)');
        } else {
            if (pinError) pinError.classList.remove('hidden');
            if (pinInput) {
                pinInput.value = '';
                pinInput.focus();
            }
        }
    });

    if (lockBtn) {
        lockBtn.addEventListener('click', () => {
            sessionStorage.removeItem('urbanserve_operator_auth');
            pinModal.classList.remove('hidden');
            if (pinError) pinError.classList.add('hidden');
            if (pinInput) {
                pinInput.value = '';
                pinInput.focus();
            }
            showToast('Dashboard locked');
        });
    }
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

    const select = document.getElementById('operator-facility-select');
    if (select) select.value = currentFacilityId;

    if (map) {
        map.flyTo([target.lat, target.lng], 16, { duration: 0.8 });
    }
    showToast(`Managing ${target.name}`);
};

// --- Data Management ---
function loadAllData() {
    currentFacilityId = localStorage.getItem(KEYS.CURRENT_FACILITY) || 'kanakia-road';
    currentFacility = FACILITIES.find(f => f.id === currentFacilityId) || FACILITIES[0];

    loadFacilitiesData();
    slots = facilitiesData[currentFacility.id].slots;

    bookings = JSON.parse(localStorage.getItem(KEYS.BOOKINGS)) || [];
    operatorNotifications = JSON.parse(localStorage.getItem(KEYS.NOTIFICATIONS)) || [];

    if (bookings.length === 0) {
        bookings.push({
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
        });
        if (facilitiesData['kanakia-road']) {
            const sA02 = facilitiesData['kanakia-road'].slots.find(s => s.id === 'A02');
            if (sA02) sA02.status = 'occupied';
        }
        saveParkingData();
    }

    usageRecords = JSON.parse(localStorage.getItem(KEYS.USAGE)) || [];
    issues = JSON.parse(localStorage.getItem(KEYS.ISSUES)) || [];
    activities = JSON.parse(localStorage.getItem(KEYS.ACTIVITIES)) || [];
}

function saveParkingData() {
    facilitiesData[currentFacility.id] = {
        slots: slots,
        lastUpdated: new Date().toISOString()
    };
    localStorage.setItem(KEYS.FACILITIES_DATA, JSON.stringify(facilitiesData));
    localStorage.setItem(KEYS.CURRENT_FACILITY, currentFacilityId);

    const data = {
        facilityId: currentFacility.id,
        facilityName: currentFacility.name,
        slots,
        bookings,
        notifications: operatorNotifications,
        totalSlots: slots.length,
        lastUpdated: new Date().toISOString()
    };
    localStorage.setItem(KEYS.PARKING_DATA, JSON.stringify(data));
    localStorage.setItem('parkingData', JSON.stringify(data));
    localStorage.setItem(KEYS.SLOTS, JSON.stringify(slots));
    localStorage.setItem(KEYS.BOOKINGS, JSON.stringify(bookings));
    localStorage.setItem(KEYS.NOTIFICATIONS, JSON.stringify(operatorNotifications));

    if (typeof BroadcastChannel !== 'undefined') {
        try {
            const syncChannel = new BroadcastChannel('urbanserve_sync');
            syncChannel.postMessage({ type: 'SYNC', facilityId: currentFacilityId, timestamp: Date.now() });
        } catch (e) {}
    }
}


function saveSlots() { saveParkingData(); }
function saveUsageRecords() { localStorage.setItem(KEYS.USAGE, JSON.stringify(usageRecords)); }
function saveIssues() { localStorage.setItem(KEYS.ISSUES, JSON.stringify(issues)); }
function saveActivities() { localStorage.setItem(KEYS.ACTIVITIES, JSON.stringify(activities)); }
function saveBookings() { saveParkingData(); }
function saveNotifications() { saveParkingData(); }

function logActivity(description) {
    const activity = {
        id: Date.now(),
        description,
        timestamp: new Date().toISOString()
    };
    activities.unshift(activity);
    if (activities.length > 50) activities.pop(); // Keep last 50
    saveActivities();
    renderDashboard();
    renderActivityLog();
    refreshIcons();
}

function addOperatorNotification(type, title, message) {
    const notif = { id: Date.now().toString(), type, title, message, timestamp: new Date().toISOString(), read: false };
    operatorNotifications.unshift(notif);
    if (operatorNotifications.length > 50) operatorNotifications.pop();
    saveNotifications();
    renderNotifications();
}

function addUserNotification(type, title, message) {
    let userNotifs = JSON.parse(localStorage.getItem(KEYS.USER_NOTIFICATIONS)) || [];
    const notif = { id: Date.now().toString(), type, title, message, timestamp: new Date().toISOString(), read: false };
    userNotifs.unshift(notif);
    if (userNotifs.length > 50) userNotifs.pop();
    localStorage.setItem(KEYS.USER_NOTIFICATIONS, JSON.stringify(userNotifs));
}

// --- Demo Data ---
function initializeDemoData() {
    slots = [];
    const areas = ['A', 'B'];
    areas.forEach(area => {
        for (let i = 1; i <= 25; i++) {
            const id = `${area}${i.toString().padStart(2, '0')}`;
            let status = 'available';
            const rand = Math.random();
            if (rand > 0.8) status = 'maintenance';
            else if (rand > 0.35) status = 'occupied';

            slots.push({ id, status, lastUpdated: new Date().toISOString() });
        }
    });

    usageRecords = [
        { date: new Date().toISOString().split('T')[0], time: '10:00', occupied: 22, available: 23, percent: 49 },
        { date: new Date().toISOString().split('T')[0], time: '13:00', occupied: 32, available: 13, percent: 71 },
        { date: new Date().toISOString().split('T')[0], time: '17:00', occupied: 41, available: 4, percent: 91 }
    ];

    issues = [
        { id: 'ISS-001', location: 'Slot A04', type: 'Slot Damage', priority: 'High', status: 'Open', desc: 'Concrete surface broken.', date: new Date().toISOString() },
        { id: 'ISS-002', location: 'Entry Gate', type: 'Entry Gate', priority: 'Medium', status: 'In Progress', desc: 'Barrier arm responding slowly.', date: new Date().toISOString() },
        { id: 'ISS-003', location: 'Lighting A', type: 'Lighting', priority: 'Low', status: 'Resolved', desc: 'Bulb replacement.', date: new Date().toISOString() }
    ];
    activities = [];
    bookings = [
        {
            id: 'BK-1024',
            userId: currentUser,
            userName: currentUser,
            bookedBy: currentUser,
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
    const sA02 = slots.find(s => s.id === 'A02');
    if (sA02) sA02.status = 'occupied';
    operatorNotifications = [];

    saveParkingData();
    localStorage.setItem(KEYS.USAGE, JSON.stringify(usageRecords));
    localStorage.setItem(KEYS.ISSUES, JSON.stringify(issues));
    localStorage.setItem(KEYS.ACTIVITIES, JSON.stringify(activities));

    logActivity('System initialized with demo data');
}

// --- Calculations ---
function calculateStats() {
    const total = slots.length;
    let available = 0;
    let occupied = 0;
    let maintenance = 0;

    slots.forEach(s => {
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

    let status = 'Available';
    if (occupancyPercent >= 90) status = 'High Occupancy';
    else if (occupancyPercent >= 70) status = 'Busy';

    return { total, maintenance, occupied, available, usable, occupancyPercent, status };
}

// --- Navigation ---
function setupNavigation() {
    const navBtns = document.querySelectorAll('.nav-btn');
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

            // Close mobile menu
            document.getElementById('sidebar').classList.remove('open');

            renderAll();

            if (targetId === 'dashboard-view' && map) {
                setTimeout(() => map.invalidateSize(), 150);
            }
        });
    });

    // Also support user navigation if script.js is loaded on index.html
    const userNavBtns = document.querySelectorAll('.user-nav-btn');
    if (userNavBtns.length > 0) {
        userNavBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const target = e.currentTarget;
                userNavBtns.forEach(b => b.classList.remove('active'));
                target.classList.add('active');

                const targetId = target.getAttribute('data-target');
                views.forEach(v => {
                    if (v.id === targetId) v.classList.remove('hidden');
                    else v.classList.add('hidden');
                });

                if (targetId === 'bookings-view') {
                    renderUserBookings();
                }

                if (targetId === 'home-view' && map) {
                    setTimeout(() => map.invalidateSize(), 150);
                }
            });
        });
    }

    const menuToggle = document.getElementById('menu-toggle');
    if (menuToggle) {
        menuToggle.addEventListener('click', () => {
            const sb = document.getElementById('sidebar');
            if (sb) sb.classList.toggle('open');
            setTimeout(() => { if (map) map.invalidateSize(); }, 300);
        });
    }

    const desktopToggle = document.getElementById('desktop-menu-toggle');
    if (desktopToggle) {
        desktopToggle.addEventListener('click', () => {
            const sb = document.getElementById('sidebar');
            if (sb) sb.classList.toggle('collapsed');
            setTimeout(() => { if (map) map.invalidateSize(); }, 300);
        });
    }

    const btnViewAll = document.getElementById('btn-view-all-activity');
    if (btnViewAll) {
        btnViewAll.addEventListener('click', () => {
            // Find and click the Activity Log nav button to ensure active state updates
            const navBtn = document.querySelector('.nav-btn[data-target="activity-log-view"]');
            if (navBtn) navBtn.click();
        });
    }
}

// --- Rendering ---
function renderAll() {
    renderDashboard();
    renderSlots();
    renderUsage();
    renderIssues();
    renderActivityLog();
    renderBookings();
    renderUserBookings();
    renderNotifications();
    renderMap();
    refreshIcons();
}

function renderDashboard() {
    const stats = calculateStats();

    // Update Facility Name & Address in Header
    const facName = document.getElementById('operator-facility-name');
    if (facName) facName.textContent = currentFacility.name;
    const facAddr = document.getElementById('operator-facility-address');
    if (facAddr) facAddr.textContent = currentFacility.address;
    const slotFac = document.getElementById('operator-slot-view-facility');
    if (slotFac) slotFac.textContent = currentFacility.name;

    const select = document.getElementById('operator-facility-select');
    if (select && select.value !== currentFacilityId) select.value = currentFacilityId;

    const dTotal = document.getElementById('dash-total');
    if (dTotal) dTotal.textContent = stats.total;
    const dAvail = document.getElementById('dash-available');
    if (dAvail) dAvail.textContent = stats.available;
    const dOcc = document.getElementById('dash-occupied');
    if (dOcc) dOcc.textContent = stats.occupied;
    const dMaint = document.getElementById('dash-maintenance');
    if (dMaint) dMaint.textContent = stats.maintenance;

    const dOccPct = document.getElementById('dash-occupancy-percent');
    if (dOccPct) dOccPct.textContent = `${stats.occupancyPercent}%`;
    const pb = document.getElementById('dash-progress-bar');
    if (pb) {
        pb.style.width = `${stats.occupancyPercent}%`;
        if (stats.occupancyPercent >= 90) pb.style.backgroundColor = 'var(--status-occupied)';
        else if (stats.occupancyPercent >= 70) pb.style.backgroundColor = 'var(--status-maintenance)';
        else pb.style.backgroundColor = 'var(--accent-color)';
    }

    const badge = document.getElementById('dash-status-badge');
    if (badge) {
        badge.textContent = stats.status;
        badge.className = 'status-badge';
        if (stats.status === 'Available') badge.classList.add('badge-normal');
        else if (stats.status === 'Busy') badge.classList.add('badge-busy');
        else badge.classList.add('badge-high');
    }

    const msg = document.getElementById('dash-status-message');
    if (msg) {
        msg.textContent =
            stats.status === 'High Occupancy' ? 'Parking capacity is currently high.' :
                stats.status === 'Busy' ? 'Moderate occupancy.' : 'Normal low occupancy.';
    }

    // Insights
    const insightsList = document.getElementById('dash-insights');
    insightsList.innerHTML = '';

    const peak = usageRecords.length > 0 ? [...usageRecords].sort((a, b) => b.percent - a.percent)[0] : null;

    const activeBookings = bookings.filter(b => b.status === 'Active').length;
    const upcomingBookings = bookings.filter(b => b.status === 'Upcoming').length;

    const insightsHtml = `
        <div class="insight-row">
            <span class="insight-label"><i data-lucide="bar-chart-2"></i> Current occupancy</span>
            <span class="insight-value">${stats.occupancyPercent}%</span>
        </div>
        <div class="insight-row">
            <span class="insight-label"><i data-lucide="check-square"></i> Usable spaces</span>
            <span class="insight-value">${stats.available}</span>
        </div>
        <div class="insight-row">
            <span class="insight-label"><i data-lucide="wrench"></i> Maintenance slots</span>
            <span class="insight-value">${stats.maintenance}</span>
        </div>
        <div class="insight-row">
            <span class="insight-label"><i data-lucide="calendar"></i> Upcoming Bookings</span>
            <span class="insight-value">${upcomingBookings}</span>
        </div>
        <div class="insight-row">
            <span class="insight-label"><i data-lucide="activity"></i> Active Bookings</span>
            <span class="insight-value">${activeBookings}</span>
        </div>
    `;
    insightsList.innerHTML = insightsHtml;

    // Activity
    const actList = document.getElementById('dash-activity-list');
    actList.innerHTML = '';
    activities.slice(0, 5).forEach(act => {
        const d = new Date(act.timestamp);
        const timeStr = `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;

        actList.innerHTML += `
            <div class="activity-item">
                <div class="activity-icon"><i data-lucide="activity"></i></div>
                <div class="activity-details">
                    <p class="activity-desc">${act.description}</p>
                    <p class="activity-time">${timeStr}</p>
                </div>
            </div>
        `;
    });
}

function renderActivityLog() {
    const list = document.getElementById('full-activity-list');
    const emptyState = document.getElementById('activity-empty-state');
    if (!list) return;

    list.innerHTML = '';

    let search = '';
    const searchEl = document.getElementById('activity-search');
    if (searchEl) search = searchEl.value.toLowerCase();

    let filter = 'all';
    const filterEl = document.getElementById('activity-filter');
    if (filterEl) filter = filterEl.value;

    const filteredActivities = activities.filter(act => {
        const descLower = act.description.toLowerCase();
        const matchSearch = descLower.includes(search);
        let matchFilter = true;

        if (filter !== 'all') {
            if (filter === 'parking' && !descLower.includes('slot')) matchFilter = false;
            if (filter === 'usage' && !descLower.includes('usage')) matchFilter = false;
            if (filter === 'issues' && !descLower.includes('issue')) matchFilter = false;
            if (filter === 'maintenance' && !descLower.includes('maintenance')) matchFilter = false;
        }

        return matchSearch && matchFilter;
    });

    if (filteredActivities.length === 0) {
        emptyState.classList.remove('hidden');
    } else {
        emptyState.classList.add('hidden');
        filteredActivities.forEach(act => {
            const d = new Date(act.timestamp);
            const timeStr = `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;

            let icon = 'activity';
            const descLower = act.description.toLowerCase();
            if (descLower.includes('slot')) icon = 'grid-3x3';
            if (descLower.includes('usage')) icon = 'bar-chart-2';
            if (descLower.includes('issue')) icon = 'alert-triangle';
            if (descLower.includes('maintenance')) icon = 'wrench';

            list.innerHTML += `
                <div class="activity-item">
                    <div class="activity-icon"><i data-lucide="${icon}"></i></div>
                    <div class="activity-details">
                        <p class="activity-desc">${act.description}</p>
                        <p class="activity-time">${d.toLocaleDateString()} ${timeStr}</p>
                    </div>
                </div>
            `;
        });
    }
}

function renderSlots() {
    const grid = document.getElementById('slot-grid');
    grid.innerHTML = '';

    const search = document.getElementById('slot-search').value.toLowerCase();
    const filter = document.getElementById('slot-filter').value;

    const filteredSlots = slots.filter(s => {
        const matchSearch = s.id.toLowerCase().includes(search);
        const matchFilter = filter === 'all' || s.status === filter;
        return matchSearch && matchFilter;
    });

    if (filteredSlots.length === 0) {
        document.getElementById('slots-empty-state').classList.remove('hidden');
    } else {
        document.getElementById('slots-empty-state').classList.add('hidden');
        filteredSlots.forEach(slot => {
            const el = document.createElement('div');
            el.className = `slot-item slot-${slot.status}`;
            el.innerHTML = `
                <div class="slot-id">${slot.id}</div>
                <div class="slot-status-text">${slot.status}</div>
            `;
            el.addEventListener('click', () => openSlotModal(slot.id));
            grid.appendChild(el);
        });
    }
}

// Setup search & filter events
const slotSearchEl = document.getElementById('slot-search');
if (slotSearchEl) slotSearchEl.addEventListener('input', () => { renderSlots(); refreshIcons(); });
const slotFilterEl = document.getElementById('slot-filter');
if (slotFilterEl) slotFilterEl.addEventListener('change', () => { renderSlots(); refreshIcons(); });
const issueSearchEl = document.getElementById('issue-search');
if (issueSearchEl) issueSearchEl.addEventListener('input', () => { renderIssues(); refreshIcons(); });
const issueStatusFilterEl = document.getElementById('issue-status-filter');
if (issueStatusFilterEl) issueStatusFilterEl.addEventListener('change', () => { renderIssues(); refreshIcons(); });
const issuePriorityFilterEl = document.getElementById('issue-priority-filter');
if (issuePriorityFilterEl) issuePriorityFilterEl.addEventListener('change', () => { renderIssues(); refreshIcons(); });
const bookingFilter = document.getElementById('booking-filter');
if (bookingFilter) bookingFilter.addEventListener('change', () => { renderBookings(); refreshIcons(); });
const activitySearch = document.getElementById('activity-search');
if (activitySearch) activitySearch.addEventListener('input', () => { renderActivityLog(); refreshIcons(); });
const activityFilter = document.getElementById('activity-filter');
if (activityFilter) activityFilter.addEventListener('change', () => { renderActivityLog(); refreshIcons(); });


function renderUsage() {
    const tbody = document.getElementById('usage-table-body');
    tbody.innerHTML = '';

    document.getElementById('usage-total-records').textContent = usageRecords.length;

    if (usageRecords.length === 0) {
        document.getElementById('usage-empty-state').classList.remove('hidden');
        document.getElementById('usage-peak-value').textContent = "--%";
        document.getElementById('usage-peak-desc').textContent = "No data recorded";
    } else {
        document.getElementById('usage-empty-state').classList.add('hidden');

        const peak = [...usageRecords].sort((a, b) => b.percent - a.percent)[0];
        document.getElementById('usage-peak-value').textContent = `${peak.percent}%`;
        document.getElementById('usage-peak-desc').textContent = `Recorded at ${peak.time} on ${peak.date}`;

        usageRecords.forEach(rec => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${rec.date}</td>
                <td>${rec.time}</td>
                <td>${rec.occupied}</td>
                <td>${rec.available}</td>
                <td><span class="badge ${rec.percent >= 90 ? 'badge-high' : rec.percent >= 70 ? 'badge-medium' : 'badge-low'}">${rec.percent}%</span></td>
            `;
            tbody.appendChild(tr);
        });
    }
}

function renderLiveStatistics() {
    const todayEl = document.getElementById('stats-today-bookings');
    if (!todayEl) return;

    // Calculate Total Bookings Today
    const todayStr = new Date().toISOString().split('T')[0];
    const todayBookings = bookings.filter(b => b.date === todayStr && b.status !== 'Cancelled');
    todayEl.textContent = todayBookings.length;
}

function renderIssues() {
    const tbody = document.getElementById('issues-table-body');
    tbody.innerHTML = '';

    const openCount = issues.filter(i => i.status === 'Open').length;
    const progCount = issues.filter(i => i.status === 'In Progress').length;
    const resCount = issues.filter(i => i.status === 'Resolved').length;

    document.getElementById('issues-open-count').textContent = openCount;
    document.getElementById('issues-progress-count').textContent = progCount;
    document.getElementById('issues-resolved-count').textContent = resCount;

    const search = document.getElementById('issue-search').value.toLowerCase();
    const statusFilter = document.getElementById('issue-status-filter').value;
    const priorityFilter = document.getElementById('issue-priority-filter').value;

    const filtered = issues.filter(iss => {
        const matchSearch = iss.id.toLowerCase().includes(search) || iss.location.toLowerCase().includes(search) || iss.desc.toLowerCase().includes(search);
        const matchStatus = statusFilter === 'all' || iss.status === statusFilter;
        const matchPriority = priorityFilter === 'all' || iss.priority === priorityFilter;
        return matchSearch && matchStatus && matchPriority;
    });

    if (filtered.length === 0) {
        document.getElementById('issues-empty-state').classList.remove('hidden');
    } else {
        document.getElementById('issues-empty-state').classList.add('hidden');
        filtered.forEach(iss => {
            const dateStr = iss.date ? new Date(iss.date).toLocaleDateString() : '';

            let actionHtml = '';
            if (iss.status === 'Open') {
                actionHtml = `<button class="btn secondary-btn action-btn" onclick="window.updateIssueStatus('${iss.id}', 'In Progress')">Start Progress</button>`;
            } else if (iss.status === 'In Progress') {
                actionHtml = `<button class="btn secondary-btn action-btn" onclick="window.updateIssueStatus('${iss.id}', 'Resolved')">Mark Resolved</button>`;
            } else if (iss.status === 'Resolved') {
                actionHtml = `<span class="badge badge-resolved"><i data-lucide="check" style="width:12px; height:12px; margin-right:4px; vertical-align:middle;"></i>Completed</span>`;
            }

            const priorityLower = iss.priority.toLowerCase();
            const badgeClass = priorityLower === 'high' ? 'badge-high' : priorityLower === 'medium' ? 'badge-medium' : 'badge-low';

            let statusClass = 'badge-open';
            if (iss.status === 'In Progress') statusClass = 'badge-progress';
            if (iss.status === 'Resolved') statusClass = 'badge-resolved';

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${iss.id}</strong></td>
                <td>${iss.location}</td>
                <td>${iss.type}</td>
                <td><span class="badge ${badgeClass}">${iss.priority}</span></td>
                <td>${dateStr}</td>
                <td><span class="badge ${statusClass}">${iss.status}</span></td>
                <td>${actionHtml}</td>
            `;
            tbody.appendChild(tr);
        });
    }
}

// Global scope to allow inline onclick handlers for the table
window.updateIssueStatus = function (id, newStatus) {
    const issue = issues.find(i => i.id === id);
    if (!issue) return;

    const current = issue.status;

    // STRICT ONE-WAY STATE MACHINE
    if (current === 'Open' && newStatus === 'In Progress') {
        issue.status = newStatus;
    } else if (current === 'In Progress' && newStatus === 'Resolved') {
        issue.status = newStatus;
    } else {
        console.error(`BUSINESS LOGIC ERROR: Invalid state transition from ${current} to ${newStatus}`);
        return;
    }

    saveIssues();
    logActivity(`Issue ${id} moved to ${newStatus}`);
    showToast(`Issue ${id} marked ${newStatus}`);
    renderAll();
};

function renderBookings() {
    const tbody = document.getElementById('bookings-table-body');
    if (!tbody) return;
    tbody.innerHTML = '';
    
    const filter = document.getElementById('booking-filter') ? document.getElementById('booking-filter').value : 'all';
    
    const filtered = bookings.filter(b => filter === 'all' || b.status === filter);
    
    if (filtered.length === 0) {
        document.getElementById('bookings-empty-state').classList.remove('hidden');
    } else {
        document.getElementById('bookings-empty-state').classList.add('hidden');
        
        filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).forEach(booking => {
            let statusClass = 'badge-low';
            if (booking.status === 'Active') statusClass = 'badge-progress';
            else if (booking.status === 'Completed') statusClass = 'badge-resolved';
            else if (booking.status === 'Upcoming') statusClass = 'badge-open';
            
            let actionHtml = '';
            if (booking.status === 'Upcoming') {
                actionHtml += `<button class="btn secondary-btn action-btn" style="margin-right:4px;" onclick="window.updateBookingStatus('${booking.id}', 'Active')">Mark Active</button>`;
                actionHtml += `<button class="btn danger-btn action-btn" onclick="window.updateBookingStatus('${booking.id}', 'Cancelled')">Cancel</button>`;
            } else if (booking.status === 'Active') {
                actionHtml += `<button class="btn secondary-btn action-btn" onclick="window.updateBookingStatus('${booking.id}', 'Completed')">Mark Completed</button>`;
            }

            const bookedByUser = booking.bookedBy || booking.userName || booking.user || 'User';
            const displayTime = booking.time || (booking.startTime ? (booking.endTime ? `${booking.startTime} - ${booking.endTime}` : booking.startTime) : '--');
            
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${booking.id}</strong></td>
                <td>${bookedByUser}</td>
                <td>${booking.slotId}</td>
                <td>${booking.date || '--'}</td>
                <td>${displayTime}</td>
                <td><span class="badge ${statusClass}">${booking.status}</span></td>
                <td>${actionHtml}</td>
            `;
            tbody.appendChild(tr);
        });
    }
}

window.updateBookingStatus = function(bookingId, newStatus) {
    const booking = bookings.find(b => b.id === bookingId);
    if (!booking) return;
    
    const oldStatus = booking.status;
    booking.status = newStatus;
    booking.updatedAt = new Date().toISOString();
    
    const slot = slots.find(s => s.id === booking.slotId);
    if (slot) {
        if (newStatus === 'Active') {
            slot.status = 'occupied';
        } else if (newStatus === 'Completed' || newStatus === 'Cancelled') {
            if (slot.status === 'reserved' || (slot.status === 'occupied' && oldStatus === 'Active')) {
                slot.status = 'available';
            }
        }
        slot.lastUpdated = new Date().toISOString();
        saveSlots();
    }
    
    saveBookings();
    logActivity(`Booking ${bookingId} marked as ${newStatus}`);
    
    if (newStatus === 'Active') {
        addUserNotification('booking_updated', 'Booking Active', `Your booking for Slot ${booking.slotId} is now active.`);
    } else if (newStatus === 'Completed') {
        addUserNotification('booking_completed', 'Session Completed', `Your parking session for Slot ${booking.slotId} has been completed.`);
    } else if (newStatus === 'Cancelled') {
        addUserNotification('booking_cancelled', 'Booking Cancelled', `Your booking for Slot ${booking.slotId} has been cancelled by the operator.`);
    }
    
    showToast(`Booking ${bookingId} updated`);
    renderAll();
};

function renderUserBookings() {
    const tbody = document.getElementById('user-bookings-table');
    const emptyState = document.getElementById('user-bookings-empty');
    if (!tbody) return;
    tbody.innerHTML = '';

    const userBookings = bookings.filter(b => {
        return b.userId === currentUser ||
               b.bookedBy === currentUser ||
               b.userName === currentUser ||
               b.userId === 'user_123';
    });

    if (userBookings.length === 0) {
        if (emptyState) emptyState.classList.remove('hidden');
    } else {
        if (emptyState) emptyState.classList.add('hidden');

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

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${booking.id}</strong></td>
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
    loadAllData();

    const booking = bookings.find(b => b.id === bookingId);
    if (!booking) return;
    if (booking.status === 'Cancelled') return;

    booking.status = 'Cancelled';
    booking.updatedAt = new Date().toISOString();

    const slot = slots.find(s => s.id === booking.slotId);
    if (slot) {
        slot.status = 'available';
        slot.lastUpdated = new Date().toISOString();
        saveSlots();
    }

    saveBookings();
    logActivity(`Booking ${bookingId} for Slot ${booking.slotId} cancelled by ${currentUser}`);
    addUserNotification('booking_cancelled', 'Booking Cancelled', `Your booking for Slot ${booking.slotId} has been cancelled.`);
    addOperatorNotification('booking_cancelled', 'Booking Cancelled', `Booking ${bookingId} for Slot ${booking.slotId} was cancelled by ${currentUser}.`);
    showToast(`Booking ${bookingId} cancelled successfully!`);
    renderAll();
};

// --- Modals & Forms ---
function setupModals() {
    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.target.closest('.modal-overlay').classList.add('hidden');
        });
    });

    document.getElementById('btn-record-usage').addEventListener('click', () => {
        const stats = calculateStats();
        document.getElementById('usage-max-help').textContent = `Max usable slots based on maintenance: ${stats.usable}`;

        const now = new Date();
        document.getElementById('usage-date').value = now.toISOString().split('T')[0];
        document.getElementById('usage-time').value = now.toTimeString().slice(0, 5);

        document.getElementById('modal-usage').classList.remove('hidden');
    });

    document.getElementById('btn-report-issue').addEventListener('click', () => {
        document.getElementById('form-issue').reset();
        document.getElementById('modal-issue').classList.remove('hidden');
    });
}

function openSlotModal(id) {
    currentSelectedSlot = slots.find(s => s.id === id);
    if (!currentSelectedSlot) return;

    document.getElementById('modal-slot-id').textContent = currentSelectedSlot.id;

    const badge = document.getElementById('modal-slot-badge');
    badge.textContent = currentSelectedSlot.status.toUpperCase();
    badge.className = 'status-badge';
    if (currentSelectedSlot.status === 'available') badge.classList.add('badge-normal');
    else if (currentSelectedSlot.status === 'occupied') badge.classList.add('badge-high');
    else badge.classList.add('badge-busy');

    const lastD = new Date(currentSelectedSlot.lastUpdated);
    document.getElementById('modal-slot-time').textContent = lastD.toLocaleString();

    // Context-aware actions
    const actionsContainer = document.getElementById('modal-slot-actions');
    actionsContainer.innerHTML = '';

    if (currentSelectedSlot.status !== 'available') {
        const btn = document.createElement('button');
        btn.className = 'btn secondary-btn';
        btn.innerHTML = '<i data-lucide="check-circle-2"></i> Mark Available';
        btn.onclick = () => updateSlotStatus('available');
        actionsContainer.appendChild(btn);
    }

    if (currentSelectedSlot.status !== 'occupied' && currentSelectedSlot.status !== 'maintenance') {
        const btn = document.createElement('button');
        btn.className = 'btn secondary-btn';
        btn.innerHTML = '<i data-lucide="car"></i> Mark Occupied';
        btn.onclick = () => updateSlotStatus('occupied');
        actionsContainer.appendChild(btn);
    }

    if (currentSelectedSlot.status !== 'maintenance') {
        const btn = document.createElement('button');
        btn.className = 'btn secondary-btn';
        btn.innerHTML = '<i data-lucide="wrench"></i> Mark Maintenance';
        btn.onclick = () => updateSlotStatus('maintenance');
        actionsContainer.appendChild(btn);
    }

    refreshIcons();
    document.getElementById('modal-slot').classList.remove('hidden');
}

function bookSlot(slotId, details = {}) {
    const slot = slots.find(s => s.id === slotId);
    if (!slot) return false;

    // Set slot status to 'occupied'
    slot.status = 'occupied';
    slot.lastUpdated = new Date().toISOString();

    const bookingId = `BK-${Math.floor(1000 + Math.random() * 9000)}`;
    const startTimeVal = details.startTime || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const endTimeVal = details.endTime || 'Flexible';
    const newBooking = {
        id: bookingId,
        userId: 'operator_admin',
        userName: details.userName || details.bookedBy || 'Operator (Walk-in)',
        bookedBy: details.bookedBy || details.userName || 'Operator (Walk-in)',
        slotId: slot.id,
        date: details.date || new Date().toISOString().split('T')[0],
        startTime: startTimeVal,
        endTime: endTimeVal,
        time: details.time || (details.startTime ? `${startTimeVal} - ${endTimeVal}` : startTimeVal),
        status: 'Active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    bookings.unshift(newBooking);

    // Create unread notification for the Bell Icon
    const notif = {
        id: Date.now().toString(),
        type: 'new_booking',
        title: 'Booking Confirmed',
        message: `Slot ${slot.id} booked successfully!`,
        timestamp: new Date().toISOString(),
        read: false
    };
    operatorNotifications.unshift(notif);

    // Save to localStorage parkingData
    saveParkingData();
    logActivity(`Slot ${slot.id} booked (Booking ${bookingId})`);

    // UI refresh immediately
    renderAll();

    // Show temporary toast message for 3 seconds
    showToast('Slot booked successfully!');

    return true;
}
window.bookSlot = bookSlot;

function updateSlotStatus(status) {
    if (!currentSelectedSlot) return;

    const oldStatus = currentSelectedSlot.status;
    if (oldStatus === status) return;

    currentSelectedSlot.status = status;
    currentSelectedSlot.lastUpdated = new Date().toISOString();

    // Also update in facilitiesData
    const facData = loadFacilitiesData();
    if (facData[currentFacilityId] && Array.isArray(facData[currentFacilityId].slots)) {
        const fs = facData[currentFacilityId].slots.find(s => s.id === currentSelectedSlot.id);
        if (fs) {
            fs.status = status;
            fs.lastUpdated = new Date().toISOString();
        }
        localStorage.setItem(KEYS.FACILITIES_DATA, JSON.stringify(facData));
    }

    saveSlots();
    logActivity(`Slot ${currentSelectedSlot.id} at ${currentFacility.name} marked ${status}`);
    
    if (status === 'occupied') {
        showToast('Slot booked successfully!');
        const notif = {
            id: Date.now().toString(),
            type: 'new_booking',
            title: 'Slot Occupied',
            message: `Slot ${currentSelectedSlot.id} booked successfully!`,
            timestamp: new Date().toISOString(),
            read: false
        };
        operatorNotifications.unshift(notif);
        saveNotifications();
        renderNotifications();
    } else {
        showToast(`Slot ${currentSelectedSlot.id} updated`);
    }
    
    if (status === 'available') {
        addUserNotification('parking_update', 'Parking Available', `Slot ${currentSelectedSlot.id} is now available.`);
        addOperatorNotification('parking_update', 'Slot Available', `Slot ${currentSelectedSlot.id} marked as available.`);
    } else if (status === 'maintenance') {
        addOperatorNotification('maintenance_update', 'Maintenance Required', `Slot ${currentSelectedSlot.id} marked for maintenance.`);
    }

    renderAll();

    document.getElementById('modal-slot').classList.add('hidden');
}

function setupForms() {
    document.getElementById('form-usage').addEventListener('submit', (e) => {
        e.preventDefault();
        const date = document.getElementById('usage-date').value;
        const time = document.getElementById('usage-time').value;
        const occupied = parseInt(document.getElementById('usage-occupied').value);

        const stats = calculateStats();
        if (occupied > stats.usable) {
            alert(`Error: Occupied slots cannot exceed current usable capacity (${stats.usable}).`);
            return;
        }

        const available = stats.usable - occupied;
        const percent = stats.usable > 0 ? Math.round((occupied / stats.usable) * 100) : 0;

        usageRecords.unshift({ date, time, occupied, available, percent });
        saveUsageRecords();
        logActivity(`Usage recorded: ${percent}% occupancy`);
        showToast("Usage record saved");

        document.getElementById('modal-usage').classList.add('hidden');
        renderAll();
    });

    document.getElementById('form-issue').addEventListener('submit', (e) => {
        e.preventDefault();
        const location = document.getElementById('issue-location').value;
        const type = document.getElementById('issue-type').value;
        const priority = document.getElementById('issue-priority').value;
        const desc = document.getElementById('issue-desc').value;

        const id = `ISS-${String(issues.length + 1).padStart(3, '0')}`;

        issues.unshift({ id, location, type, priority, status: 'Open', desc, date: new Date().toISOString() });
        saveIssues();
        logActivity(`${type} issue reported at ${location}`);
        addOperatorNotification('maintenance_update', 'New Issue Reported', `A ${priority.toLowerCase()} priority issue reported at ${location}.`);
        showToast("Issue reported successfully");

        document.getElementById('modal-issue').classList.add('hidden');
        renderAll();
    });

    // Settings actions
    document.getElementById('btn-reset-demo').addEventListener('click', () => {
        if (confirm("Are you sure you want to reset to demo data? All current data will be lost.")) {
            initializeDemoData();
            renderAll();
            showToast("Demo data reset successful");
        }
    });

    document.getElementById('btn-clear-data').addEventListener('click', () => {
        if (confirm("WARNING: Are you sure you want to completely clear all data?")) {
            slots = [];
            usageRecords = [];
            issues = [];
            activities = [];
            bookings = [];
            operatorNotifications = [];
            localStorage.clear();
            renderAll();
            showToast("All data cleared");
        }
    });
}

// Notifications Logic
function setupNotifications() {
    const bellBtn = document.getElementById('operator-notification-bell');
    const panel = document.getElementById('operator-notification-panel');
    const markReadBtn = document.getElementById('operator-mark-all-read');
    
    if(!bellBtn) return;
    
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
        operatorNotifications.forEach(n => n.read = true);
        saveNotifications();
        renderNotifications();
    });
}

function renderNotifications() {
    const list = document.getElementById('operator-notification-list');
    const badge = document.getElementById('operator-notification-badge');
    if (!list || !badge) return;
    
    const unreadCount = operatorNotifications.filter(n => !n.read).length;
    if (unreadCount > 0) {
        badge.textContent = unreadCount;
        badge.classList.remove('hidden');
    } else {
        badge.classList.add('hidden');
    }
    
    list.innerHTML = '';
    
    if (operatorNotifications.length === 0) {
        list.innerHTML = `
            <div class="notification-empty">
                <i data-lucide="bell-off"></i>
                <p>No notifications yet</p>
            </div>
        `;
    } else {
        operatorNotifications.forEach(notif => {
            const el = document.createElement('div');
            el.className = `notification-item ${notif.read ? '' : 'unread'}`;
            
            let icon = 'bell';
            if (notif.type.includes('new_booking')) icon = 'calendar-plus';
            else if (notif.type.includes('cancelled')) icon = 'x-circle';
            else if (notif.type.includes('completed')) icon = 'flag';
            else if (notif.type.includes('issue')) icon = 'alert-triangle';
            
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
                    ${isCurrent ? 'Managing This Area' : 'Manage This Area'}
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