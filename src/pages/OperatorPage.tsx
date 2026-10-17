import React, { useState, useEffect } from 'react';
import {
  SquareParking,
  LayoutDashboard,
  Grid3x3,
  Calendar,
  BarChart2,
  AlertTriangle,
  List,
  Settings,
  Menu,
  ShieldCheck,
  Lock,
  Car,
  CheckCircle2,
  XCircle,
  Wrench,
  MapPin,
  Search,
  Filter,
  Plus,
  TrendingUp,
  Clock,
  CalendarCheck,
  AlertCircle,
  Loader,
  RefreshCw,
  Trash2,
  Check,
  CalendarX,
  Slash,
  Activity as ActivityIcon,
} from 'lucide-react';
import { useParking } from '../context/ParkingContext';
import { LeafletMap } from '../components/LeafletMap';
import { NotificationBell } from '../components/NotificationBell';
import { OperatorSlotModal } from '../components/OperatorSlotModal';
import { OperatorUsageModal } from '../components/OperatorUsageModal';
import { OperatorIssueModal } from '../components/OperatorIssueModal';
import { OperatorPinModal } from '../components/OperatorPinModal';
import { Toast } from '../components/Toast';
import type { ParkingSlot, BookingStatus, IssueStatus } from '../types';

type OperatorTab =
  | 'dashboard-view'
  | 'slots-view'
  | 'bookings-view'
  | 'usage-view'
  | 'issues-view'
  | 'activity-log-view'
  | 'settings-view';

export const OperatorPage: React.FC = () => {
  const {
    facilities,
    currentFacility,
    currentFacilityId,
    switchFacility,
    slots,
    stats,
    bookings,
    updateBookingStatus,
    issues,
    updateIssueStatus,
    usageRecords,
    activities,
    updateSlotStatus,
    resetDemoData,
    clearAllData,
    lockOperator,
  } = useParking();

  const [activeTab, setActiveTab] = useState<OperatorTab>('dashboard-view');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sidebarMobileOpen, setSidebarMobileOpen] = useState(false);

  // Time display
  const [currentTimeStr, setCurrentTimeStr] = useState('');
  useEffect(() => {
    const updateTime = () => {
      setCurrentTimeStr(
        new Date().toLocaleString([], {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, []);

  // Slots view state
  const [slotSearch, setSlotSearch] = useState('');
  const [slotFilter, setSlotFilter] = useState('all');
  const [selectedSlot, setSelectedSlot] = useState<ParkingSlot | null>(null);

  // Activity log state
  const [activitySearch, setActivitySearch] = useState('');
  const [activityFilter, setActivityFilter] = useState('all');

  // Bookings view state
  const [bookingFilter, setBookingFilter] = useState('all');

  // Issues view state
  const [issueSearch, setIssueSearch] = useState('');
  const [issueStatusFilter, setIssueStatusFilter] = useState('all');
  const [issuePriorityFilter, setIssuePriorityFilter] = useState('all');

  // Modals
  const [isUsageModalOpen, setIsUsageModalOpen] = useState(false);
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);

  // Calculations
  const peakUsage =
    usageRecords.length > 0 ? [...usageRecords].sort((a, b) => b.percent - a.percent)[0] : null;

  const todayStr = new Date().toISOString().split('T')[0];
  const todayBookingsCount = bookings.filter((b) => b.date === todayStr && b.status !== 'Cancelled').length;

  const activeBookingsCount = bookings.filter((b) => b.status === 'Active').length;
  const upcomingBookingsCount = bookings.filter((b) => b.status === 'Upcoming').length;

  const openIssuesCount = issues.filter((i) => i.status === 'Open').length;
  const inProgressIssuesCount = issues.filter((i) => i.status === 'In Progress').length;
  const resolvedIssuesCount = issues.filter((i) => i.status === 'Resolved').length;

  // Filtered Slots
  const filteredSlots = slots.filter((s) => {
    const matchSearch = s.id.toLowerCase().includes(slotSearch.toLowerCase());
    const matchFilter = slotFilter === 'all' || s.status === slotFilter;
    return matchSearch && matchFilter;
  });

  // Filtered Activities
  const filteredActivities = activities.filter((act) => {
    const descLower = act.description.toLowerCase();
    const matchSearch = descLower.includes(activitySearch.toLowerCase());
    let matchFilter = true;
    if (activityFilter !== 'all') {
      if (activityFilter === 'parking' && !descLower.includes('slot')) matchFilter = false;
      if (activityFilter === 'usage' && !descLower.includes('usage')) matchFilter = false;
      if (activityFilter === 'issues' && !descLower.includes('issue')) matchFilter = false;
      if (activityFilter === 'maintenance' && !descLower.includes('maintenance')) matchFilter = false;
    }
    return matchSearch && matchFilter;
  });

  // Filtered Bookings
  const filteredBookings = bookings
    .filter((b) => bookingFilter === 'all' || b.status === bookingFilter)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // Filtered Issues
  const filteredIssues = issues.filter((iss) => {
    const q = issueSearch.toLowerCase();
    const matchSearch =
      iss.id.toLowerCase().includes(q) ||
      iss.location.toLowerCase().includes(q) ||
      iss.desc.toLowerCase().includes(q);
    const matchStatus = issueStatusFilter === 'all' || iss.status === issueStatusFilter;
    const matchPriority = issuePriorityFilter === 'all' || iss.priority === issuePriorityFilter;
    return matchSearch && matchStatus && matchPriority;
  });

  const getStatusBadgeClass = (status: string) => {
    if (status === 'Available') return 'badge-normal';
    if (status === 'Busy') return 'badge-busy';
    return 'badge-high';
  };

  const getProgressBarColor = (percent: number) => {
    if (percent >= 90) return 'var(--status-occupied)';
    if (percent >= 70) return 'var(--status-maintenance)';
    return 'var(--accent-color)';
  };

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <nav
        className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''} ${sidebarMobileOpen ? 'open' : ''}`}
        id="sidebar"
      >
        <div className="sidebar-header">
          <button
            type="button"
            className="desktop-menu-toggle"
            id="desktop-menu-toggle"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            title="Toggle Sidebar"
          >
            <Menu style={{ width: 18, height: 18 }} />
          </button>
          <div className="logo-mark">
            <SquareParking style={{ width: 22, height: 22 }} />
          </div>
          <div className="logo-text">
            <h2>UrbanServe</h2>
            <p>
              Public Parking
              <br />
              Operations
            </p>
          </div>
        </div>

        <ul className="nav-links">
          <li>
            <button
              type="button"
              className={`nav-btn ${activeTab === 'dashboard-view' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('dashboard-view');
                setSidebarMobileOpen(false);
              }}
              data-tooltip="Dashboard"
            >
              <LayoutDashboard style={{ width: 18, height: 18 }} />{' '}
              <span className="nav-text">Dashboard</span>
            </button>
          </li>
          <li>
            <button
              type="button"
              className={`nav-btn ${activeTab === 'slots-view' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('slots-view');
                setSidebarMobileOpen(false);
              }}
              data-tooltip="Parking Slots"
            >
              <Grid3x3 style={{ width: 18, height: 18 }} />{' '}
              <span className="nav-text">Parking Slots</span>
            </button>
          </li>
          <li>
            <button
              type="button"
              className={`nav-btn ${activeTab === 'bookings-view' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('bookings-view');
                setSidebarMobileOpen(false);
              }}
              data-tooltip="Bookings"
            >
              <Calendar style={{ width: 18, height: 18 }} />{' '}
              <span className="nav-text">Bookings</span>
            </button>
          </li>
          <li>
            <button
              type="button"
              className={`nav-btn ${activeTab === 'usage-view' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('usage-view');
                setSidebarMobileOpen(false);
              }}
              data-tooltip="Usage"
            >
              <BarChart2 style={{ width: 18, height: 18 }} /> <span className="nav-text">Usage</span>
            </button>
          </li>
          <li>
            <button
              type="button"
              className={`nav-btn ${activeTab === 'issues-view' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('issues-view');
                setSidebarMobileOpen(false);
              }}
              data-tooltip="Issues & Maintenance"
            >
              <AlertTriangle style={{ width: 18, height: 18 }} />{' '}
              <span className="nav-text">Issues & Maintenance</span>
            </button>
          </li>
          <li>
            <button
              type="button"
              className={`nav-btn ${activeTab === 'activity-log-view' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('activity-log-view');
                setSidebarMobileOpen(false);
              }}
              data-tooltip="Activity Log"
            >
              <List style={{ width: 18, height: 18 }} />{' '}
              <span className="nav-text">Activity Log</span>
            </button>
          </li>
          <li>
            <button
              type="button"
              className={`nav-btn ${activeTab === 'settings-view' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('settings-view');
                setSidebarMobileOpen(false);
              }}
              data-tooltip="Settings"
            >
              <Settings style={{ width: 18, height: 18 }} />{' '}
              <span className="nav-text">Settings</span>
            </button>
          </li>
        </ul>
      </nav>

      {/* Mobile Header */}
      <header className="mobile-header">
        <div className="mobile-logo">
          <SquareParking style={{ width: 22, height: 22 }} />
          <h2>UrbanServe</h2>
        </div>
        <button
          type="button"
          className="menu-toggle"
          id="menu-toggle"
          onClick={() => setSidebarMobileOpen(!sidebarMobileOpen)}
        >
          <Menu style={{ width: 20, height: 20 }} />
        </button>
      </header>

      {/* Main Content */}
      <main className="main-content">
        {/* Sticky Operator Staff Header Bar */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr auto 1fr',
            alignItems: 'center',
            marginBottom: '0.75rem',
            position: 'sticky',
            top: 0,
            zIndex: 50,
            background: 'var(--bg-color)',
            padding: '0.4rem 0',
          }}
        >
          <div></div>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <div className="operator-staff-badge">
              <div className="staff-badge-icon">
                <ShieldCheck style={{ width: 18, height: 18 }} />
              </div>
              <div className="staff-badge-text">
                <span className="staff-role">Municipal Operator</span>
                <span className="staff-name">
                  Rajesh K. <span className="staff-id">(ID: OP-104)</span>
                </span>
              </div>
              <button
                type="button"
                className="btn-staff-lock"
                id="btn-operator-lock"
                title="Lock Dashboard"
                onClick={lockOperator}
              >
                <Lock style={{ width: 12, height: 12 }} /> Lock
              </button>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <NotificationBell type="operator" />
          </div>
        </div>

        {/* --- 1. Dashboard View --- */}
        {activeTab === 'dashboard-view' && (
          <section key="dashboard-view" id="dashboard-view" className="view active">
            <header
              className="page-header"
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                flexWrap: 'wrap',
                gap: '1rem',
              }}
            >
              <div className="header-content">
                <h1 id="operator-facility-name">{currentFacility.name}</h1>
                <p id="operator-facility-address">{currentFacility.address}</p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                <div className="facility-selector-wrapper" style={{ marginTop: 0 }}>
                  <label
                    htmlFor="operator-facility-select"
                    style={{
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      color: 'var(--text-muted)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                    }}
                  >
                    <MapPin style={{ width: 15, height: 15 }} /> Area:
                  </label>
                  <select
                    id="operator-facility-select"
                    className="facility-select"
                    value={currentFacilityId}
                    onChange={(e) => switchFacility(e.target.value)}
                  >
                    {facilities.map((fac) => (
                      <option key={fac.id} value={fac.id}>
                        {fac.name} ({fac.totalSlots} Slots)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="header-meta">
                  <span>{currentTimeStr}</span>
                </div>
              </div>
            </header>

            <div className="kpi-grid">
              <div className="kpi-card">
                <div className="kpi-icon icon-blue">
                  <Car style={{ width: 22, height: 22 }} />
                </div>
                <div className="kpi-data">
                  <h3 className="kpi-label">TOTAL SLOTS</h3>
                  <p className="kpi-value">{stats.total}</p>
                  <p className="kpi-desc">Parking capacity</p>
                </div>
              </div>
              <div className="kpi-card">
                <div className="kpi-icon icon-green">
                  <CheckCircle2 style={{ width: 22, height: 22 }} />
                </div>
                <div className="kpi-data">
                  <h3 className="kpi-label">AVAILABLE</h3>
                  <p className="kpi-value text-available">{stats.available}</p>
                  <p className="kpi-desc">Usable spaces</p>
                </div>
              </div>
              <div className="kpi-card">
                <div className="kpi-icon icon-red">
                  <XCircle style={{ width: 22, height: 22 }} />
                </div>
                <div className="kpi-data">
                  <h3 className="kpi-label">OCCUPIED</h3>
                  <p className="kpi-value text-occupied">{stats.occupied}</p>
                  <p className="kpi-desc">Currently in use</p>
                </div>
              </div>
              <div className="kpi-card">
                <div className="kpi-icon icon-amber">
                  <Wrench style={{ width: 22, height: 22 }} />
                </div>
                <div className="kpi-data">
                  <h3 className="kpi-label">MAINTENANCE</h3>
                  <p className="kpi-value text-maintenance">{stats.maintenance}</p>
                  <p className="kpi-desc">Temporarily unavailable</p>
                </div>
              </div>
            </div>

            <div className="dashboard-panels">
              <div className="panel">
                <div className="panel-header">
                  <h3>Current Occupancy</h3>
                </div>
                <div className="occupancy-display">
                  <span className="occupancy-value">{stats.occupancyPercent}%</span>
                  <span className={`status-badge ${getStatusBadgeClass(stats.status)}`}>
                    {stats.status}
                  </span>
                </div>
                <div className="progress-container">
                  <div className="progress-markers">
                    <span>0%</span>
                    <span>50%</span>
                    <span>100%</span>
                  </div>
                  <div className="progress-bar-bg">
                    <div
                      className="progress-bar-fill"
                      style={{
                        width: `${stats.occupancyPercent}%`,
                        backgroundColor: getProgressBarColor(stats.occupancyPercent),
                      }}
                    />
                  </div>
                </div>
                <p className="status-message">
                  {stats.status === 'High Occupancy'
                    ? 'Parking capacity is currently high.'
                    : stats.status === 'Busy'
                    ? 'Moderate occupancy.'
                    : 'Normal low occupancy.'}
                </p>
              </div>

              <div className="panel">
                <div className="panel-header">
                  <h3>Operational Summary</h3>
                </div>
                <div className="insight-rows">
                  <div className="insight-row">
                    <span className="insight-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <BarChart2 style={{ width: 16, height: 16 }} /> Current occupancy
                    </span>
                    <span className="insight-value">{stats.occupancyPercent}%</span>
                  </div>
                  <div className="insight-row">
                    <span className="insight-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <CheckCircle2 style={{ width: 16, height: 16 }} /> Usable spaces
                    </span>
                    <span className="insight-value">{stats.available}</span>
                  </div>
                  <div className="insight-row">
                    <span className="insight-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Wrench style={{ width: 16, height: 16 }} /> Maintenance slots
                    </span>
                    <span className="insight-value">{stats.maintenance}</span>
                  </div>
                  <div className="insight-row">
                    <span className="insight-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Calendar style={{ width: 16, height: 16 }} /> Upcoming Bookings
                    </span>
                    <span className="insight-value">{upcomingBookingsCount}</span>
                  </div>
                  <div className="insight-row">
                    <span className="insight-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <ActivityIcon style={{ width: 16, height: 16 }} /> Active Bookings
                    </span>
                    <span className="insight-value">{activeBookingsCount}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="panel mt-lg">
              <div
                className="panel-header flex-header"
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '0.5rem',
                }}
              >
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                  <MapPin style={{ width: 18, height: 18 }} /> Parking Facility Map
                </h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.85rem' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: '#065f46', fontWeight: 500 }}>
                    <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#10b981', display: 'inline-block' }} /> Available
                  </span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: '#991b1b', fontWeight: 500 }}>
                    <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#ef4444', display: 'inline-block' }} /> Occupied
                  </span>
                </div>
              </div>
              <LeafletMap mode="operator" />
            </div>

            <div className="panel mt-lg">
              <div className="panel-header flex-header">
                <h3>Recent Activity</h3>
                <button
                  type="button"
                  className="btn secondary-btn action-btn"
                  onClick={() => setActiveTab('activity-log-view')}
                >
                  View All Activity
                </button>
              </div>
              <div className="activity-feed">
                {activities.slice(0, 5).map((act) => {
                  const d = new Date(act.timestamp);
                  const timeStr = `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
                  return (
                    <div key={act.id} className="activity-item">
                      <div className="activity-icon">
                        <ActivityIcon style={{ width: 16, height: 16 }} />
                      </div>
                      <div className="activity-details">
                        <p className="activity-desc">{act.description}</p>
                        <p className="activity-time">{timeStr}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* --- 2. Parking Slots View --- */}
        {activeTab === 'slots-view' && (
          <section key="slots-view" id="slots-view" className="view active">
            <header className="page-header">
              <div className="header-content">
                <h1>Parking Slots</h1>
                <p>
                  Manage individual bay statuses for <strong>{currentFacility.name}</strong>.
                </p>
              </div>
            </header>

            <div className="controls-bar">
              <div className="search-wrapper">
                <Search style={{ width: 16, height: 16 }} />
                <input
                  type="text"
                  placeholder="Search slot (e.g. A01)"
                  value={slotSearch}
                  onChange={(e) => setSlotSearch(e.target.value)}
                />
              </div>
              <div className="filter-wrapper">
                <Filter style={{ width: 16, height: 16 }} />
                <select value={slotFilter} onChange={(e) => setSlotFilter(e.target.value)}>
                  <option value="all">All Statuses</option>
                  <option value="available">Available</option>
                  <option value="occupied">Occupied</option>
                  <option value="maintenance">Maintenance</option>
                </select>
              </div>
            </div>

            <div className="legend-bar">
              <span className="legend-title">STATUS LEGEND</span>
              <div className="legend-items">
                <span className="legend-item">
                  <span className="dot dot-available"></span> Available
                </span>
                <span className="legend-item">
                  <span className="dot dot-occupied"></span> Occupied
                </span>
                <span className="legend-item">
                  <span className="dot dot-maintenance"></span> Maintenance
                </span>
              </div>
            </div>

            <div className="slot-grid">
              {filteredSlots.map((slot) => (
                <div
                  key={slot.id}
                  className={`slot-item slot-${slot.status}`}
                  onClick={() => setSelectedSlot(slot)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="slot-id">{slot.id}</div>
                  <div className="slot-status-text">{slot.status}</div>
                </div>
              ))}
            </div>

            {filteredSlots.length === 0 && (
              <div className="empty-state">
                <Slash style={{ width: 36, height: 36, margin: '0 auto 0.5rem', opacity: 0.5 }} />
                <p>No parking slots match your search.</p>
              </div>
            )}
          </section>
        )}

        {/* --- 3. Bookings View --- */}
        {activeTab === 'bookings-view' && (
          <section key="bookings-view" id="bookings-view" className="view active">
            <header className="page-header">
              <div className="header-content">
                <h1>Bookings Management</h1>
                <p>View and manage parking reservations.</p>
              </div>
            </header>

            <div className="controls-bar">
              <div className="filter-wrapper">
                <Filter style={{ width: 16, height: 16 }} />
                <select value={bookingFilter} onChange={(e) => setBookingFilter(e.target.value)}>
                  <option value="all">All Bookings</option>
                  <option value="Upcoming">Upcoming</option>
                  <option value="Active">Active</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            <div className="panel">
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Booking ID</th>
                      <th>User</th>
                      <th>Slot</th>
                      <th>Date</th>
                      <th>Time</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBookings.map((b) => {
                      let statusClass = 'badge-low';
                      if (b.status === 'Active') statusClass = 'badge-progress';
                      else if (b.status === 'Completed') statusClass = 'badge-resolved';
                      else if (b.status === 'Upcoming') statusClass = 'badge-open';

                      const bookedByUser = b.bookedBy || b.userName || b.userId || 'User';
                      const displayTime =
                        b.time ||
                        (b.startTime ? (b.endTime ? `${b.startTime} - ${b.endTime}` : b.startTime) : '--');

                      return (
                        <tr key={b.id}>
                          <td>
                            <strong>{b.id}</strong>
                          </td>
                          <td>{bookedByUser}</td>
                          <td>{b.slotId}</td>
                          <td>{b.date || '--'}</td>
                          <td>{displayTime}</td>
                          <td>
                            <span className={`badge ${statusClass}`}>{b.status}</span>
                          </td>
                          <td>
                            {b.status === 'Upcoming' && (
                              <div style={{ display: 'flex', gap: '4px' }}>
                                <button
                                  type="button"
                                  className="btn secondary-btn action-btn"
                                  onClick={() => updateBookingStatus(b.id, 'Active' as BookingStatus)}
                                >
                                  Mark Active
                                </button>
                                <button
                                  type="button"
                                  className="btn danger-btn action-btn"
                                  onClick={() => updateBookingStatus(b.id, 'Cancelled' as BookingStatus)}
                                >
                                  Cancel
                                </button>
                              </div>
                            )}
                            {b.status === 'Active' && (
                              <button
                                type="button"
                                className="btn secondary-btn action-btn"
                                onClick={() => updateBookingStatus(b.id, 'Completed' as BookingStatus)}
                              >
                                Mark Completed
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {filteredBookings.length === 0 && (
                  <div className="empty-state">
                    <CalendarX style={{ width: 36, height: 36, margin: '0 auto 0.5rem', opacity: 0.5 }} />
                    <p>No bookings found.</p>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* --- 4. Usage View --- */}
        {activeTab === 'usage-view' && (
          <section key="usage-view" id="usage-view" className="view active">
            <header className="page-header flex-header">
              <div className="header-content">
                <h1>Usage History</h1>
                <p>Track parking utilization over time.</p>
              </div>
              <button
                type="button"
                className="btn primary-btn"
                onClick={() => setIsUsageModalOpen(true)}
              >
                <Plus style={{ width: 16, height: 16 }} /> Record Usage
              </button>
            </header>

            <div className="kpi-grid grid-2">
              <div className="kpi-card">
                <div className="kpi-icon icon-blue">
                  <TrendingUp style={{ width: 22, height: 22 }} />
                </div>
                <div className="kpi-data">
                  <h3 className="kpi-label">PEAK USAGE</h3>
                  <p className="kpi-value">{peakUsage ? `${peakUsage.percent}%` : '--%'}</p>
                  <p className="kpi-desc">
                    {peakUsage ? `Recorded at ${peakUsage.time} on ${peakUsage.date}` : 'No data recorded'}
                  </p>
                </div>
              </div>
              <div className="kpi-card">
                <div className="kpi-icon icon-gray">
                  <Clock style={{ width: 22, height: 22 }} />
                </div>
                <div className="kpi-data">
                  <h3 className="kpi-label">TOTAL RECORDS</h3>
                  <p className="kpi-value">{usageRecords.length}</p>
                  <p className="kpi-desc">Historical data points</p>
                </div>
              </div>
            </div>

            {/* Live Statistics */}
            <div className="panel mt-lg">
              <div
                className="panel-header flex-header"
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
              >
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                  <BarChart2 style={{ width: 18, height: 18 }} /> Live Statistics
                </h3>
                <span className="badge badge-normal" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', display: 'inline-block' }} /> Real-Time Analytics
                </span>
              </div>

              <div className="panel-body" style={{ padding: 'var(--spacing-lg)' }}>
                <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 360px))', marginBottom: 0 }}>
                  <div className="kpi-card" style={{ border: '1px solid var(--border-color)', background: 'var(--bg-color)' }}>
                    <div className="kpi-icon icon-blue">
                      <CalendarCheck style={{ width: 22, height: 22 }} />
                    </div>
                    <div className="kpi-data">
                      <h3 className="kpi-label">TOTAL BOOKINGS TODAY</h3>
                      <p className="kpi-value">{todayBookingsCount}</p>
                      <p className="kpi-desc">Confirmed for today</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="panel mt-lg">
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Time</th>
                      <th>Occupied</th>
                      <th>Available</th>
                      <th>Occupancy %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usageRecords.map((rec, idx) => (
                      <tr key={idx}>
                        <td>{rec.date}</td>
                        <td>{rec.time}</td>
                        <td>{rec.occupied}</td>
                        <td>{rec.available}</td>
                        <td>
                          <span
                            className={`badge ${
                              rec.percent >= 90
                                ? 'badge-high'
                                : rec.percent >= 70
                                ? 'badge-medium'
                                : 'badge-low'
                            }`}
                          >
                            {rec.percent}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {usageRecords.length === 0 && (
                  <div className="empty-state">
                    <BarChart2 style={{ width: 36, height: 36, margin: '0 auto 0.5rem', opacity: 0.5 }} />
                    <p>No usage records available.</p>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* --- 5. Issues & Maintenance View --- */}
        {activeTab === 'issues-view' && (
          <section key="issues-view" id="issues-view" className="view active">
            <header className="page-header flex-header">
              <div className="header-content">
                <h1>Issues & Maintenance</h1>
                <p>Track and resolve operational problems.</p>
              </div>
              <button
                type="button"
                className="btn primary-btn"
                onClick={() => setIsIssueModalOpen(true)}
              >
                <Plus style={{ width: 16, height: 16 }} /> Report Issue
              </button>
            </header>

            <div className="kpi-grid grid-3 mb-lg">
              <div className="kpi-card">
                <div className="kpi-icon icon-amber">
                  <AlertCircle style={{ width: 22, height: 22 }} />
                </div>
                <div className="kpi-data">
                  <h3 className="kpi-label">OPEN</h3>
                  <p className="kpi-value">{openIssuesCount}</p>
                </div>
              </div>
              <div className="kpi-card">
                <div className="kpi-icon icon-blue">
                  <Loader style={{ width: 22, height: 22 }} />
                </div>
                <div className="kpi-data">
                  <h3 className="kpi-label">IN PROGRESS</h3>
                  <p className="kpi-value">{inProgressIssuesCount}</p>
                </div>
              </div>
              <div className="kpi-card">
                <div className="kpi-icon icon-green">
                  <CheckCircle2 style={{ width: 22, height: 22 }} />
                </div>
                <div className="kpi-data">
                  <h3 className="kpi-label">RESOLVED</h3>
                  <p className="kpi-value">{resolvedIssuesCount}</p>
                </div>
              </div>
            </div>

            <div className="controls-bar">
              <div className="search-wrapper">
                <Search style={{ width: 16, height: 16 }} />
                <input
                  type="text"
                  placeholder="Search issues..."
                  value={issueSearch}
                  onChange={(e) => setIssueSearch(e.target.value)}
                />
              </div>
              <div className="filter-wrapper">
                <Filter style={{ width: 16, height: 16 }} />
                <select
                  value={issueStatusFilter}
                  onChange={(e) => setIssueStatusFilter(e.target.value)}
                >
                  <option value="all">All Statuses</option>
                  <option value="Open">Open</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Resolved">Resolved</option>
                </select>
              </div>
              <div className="filter-wrapper">
                <AlertTriangle style={{ width: 16, height: 16 }} />
                <select
                  value={issuePriorityFilter}
                  onChange={(e) => setIssuePriorityFilter(e.target.value)}
                >
                  <option value="all">All Priorities</option>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>
            </div>

            <div className="panel">
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Location</th>
                      <th>Type</th>
                      <th>Priority</th>
                      <th>Reported</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredIssues.map((iss) => {
                      const dateStr = iss.date ? new Date(iss.date).toLocaleDateString() : '';
                      const priorityLower = iss.priority.toLowerCase();
                      const badgeClass =
                        priorityLower === 'high'
                          ? 'badge-high'
                          : priorityLower === 'medium'
                          ? 'badge-medium'
                          : 'badge-low';

                      let statusClass = 'badge-open';
                      if (iss.status === 'In Progress') statusClass = 'badge-progress';
                      if (iss.status === 'Resolved') statusClass = 'badge-resolved';

                      return (
                        <tr key={iss.id}>
                          <td>
                            <strong>{iss.id}</strong>
                          </td>
                          <td>{iss.location}</td>
                          <td>{iss.type}</td>
                          <td>
                            <span className={`badge ${badgeClass}`}>{iss.priority}</span>
                          </td>
                          <td>{dateStr}</td>
                          <td>
                            <span className={`badge ${statusClass}`}>{iss.status}</span>
                          </td>
                          <td>
                            {iss.status === 'Open' && (
                              <button
                                type="button"
                                className="btn secondary-btn action-btn"
                                onClick={() => updateIssueStatus(iss.id, 'In Progress' as IssueStatus)}
                              >
                                Start Progress
                              </button>
                            )}
                            {iss.status === 'In Progress' && (
                              <button
                                type="button"
                                className="btn secondary-btn action-btn"
                                onClick={() => updateIssueStatus(iss.id, 'Resolved' as IssueStatus)}
                              >
                                Mark Resolved
                              </button>
                            )}
                            {iss.status === 'Resolved' && (
                              <span className="badge badge-resolved">
                                <Check style={{ width: 12, height: 12, marginRight: 4, verticalAlign: 'middle' }} />
                                Completed
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {filteredIssues.length === 0 && (
                  <div className="empty-state">
                    <CheckCircle2 style={{ width: 36, height: 36, margin: '0 auto 0.5rem', opacity: 0.5 }} />
                    <p>No operational issues found.</p>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* --- 6. Activity Log View --- */}
        {activeTab === 'activity-log-view' && (
          <section key="activity-log-view" id="activity-log-view" className="view active">
            <header className="page-header">
              <div className="header-content">
                <h1>Activity Log</h1>
                <p>Review recent parking operation activities.</p>
              </div>
            </header>

            <div className="controls-bar">
              <div className="search-wrapper">
                <Search style={{ width: 16, height: 16 }} />
                <input
                  type="text"
                  placeholder="Search activities..."
                  value={activitySearch}
                  onChange={(e) => setActivitySearch(e.target.value)}
                />
              </div>
              <div className="filter-wrapper">
                <Filter style={{ width: 16, height: 16 }} />
                <select
                  value={activityFilter}
                  onChange={(e) => setActivityFilter(e.target.value)}
                >
                  <option value="all">All Activities</option>
                  <option value="parking">Parking (Slots)</option>
                  <option value="usage">Usage</option>
                  <option value="issues">Issues</option>
                  <option value="maintenance">Maintenance</option>
                </select>
              </div>
            </div>

            <div className="panel">
              <div className="activity-feed">
                {filteredActivities.map((act) => {
                  const d = new Date(act.timestamp);
                  const timeStr = `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
                  const descLower = act.description.toLowerCase();

                  let IconComponent = ActivityIcon;
                  if (descLower.includes('slot')) IconComponent = Grid3x3;
                  if (descLower.includes('usage')) IconComponent = BarChart2;
                  if (descLower.includes('issue')) IconComponent = AlertTriangle;
                  if (descLower.includes('maintenance')) IconComponent = Wrench;

                  return (
                    <div key={act.id} className="activity-item">
                      <div className="activity-icon">
                        <IconComponent style={{ width: 16, height: 16 }} />
                      </div>
                      <div className="activity-details">
                        <p className="activity-desc">{act.description}</p>
                        <p className="activity-time">
                          {d.toLocaleDateString()} {timeStr}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {filteredActivities.length === 0 && (
                <div className="empty-state">
                  <ActivityIcon style={{ width: 36, height: 36, margin: '0 auto 0.5rem', opacity: 0.5 }} />
                  <p>No activity records found.</p>
                </div>
              )}
            </div>
          </section>
        )}

        {/* --- 7. Settings View --- */}
        {activeTab === 'settings-view' && (
          <section key="settings-view" id="settings-view" className="view active">
            <header className="page-header">
              <div className="header-content">
                <h1>Settings</h1>
                <p>Application configuration and data management.</p>
              </div>
            </header>

            <div className="panel mb-lg">
              <div className="panel-header">
                <h3>Data Management</h3>
              </div>
              <div className="panel-body">
                <p className="settings-desc">
                  Manage the local demonstration data used by the application. Resetting restores original demo values.
                </p>
                <div className="settings-actions" style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
                  <button
                    type="button"
                    className="btn secondary-btn"
                    onClick={() => {
                      if (window.confirm('Are you sure you want to reset to demo data? All current data will be lost.')) {
                        resetDemoData();
                      }
                    }}
                  >
                    <RefreshCw style={{ width: 16, height: 16 }} /> Reset Demo Data
                  </button>
                  <button
                    type="button"
                    className="btn danger-btn"
                    onClick={() => {
                      if (window.confirm('WARNING: Are you sure you want to completely clear all data?')) {
                        clearAllData();
                      }
                    }}
                  >
                    <Trash2 style={{ width: 16, height: 16 }} /> Clear All Data
                  </button>
                </div>
              </div>
            </div>

            <div className="panel">
              <div className="panel-header">
                <h3>About UrbanServe</h3>
              </div>
              <div className="panel-body">
                <div className="about-info" style={{ lineHeight: 1.8 }}>
                  <p>
                    <strong>System:</strong> Public Parking Operations Monitoring
                  </p>
                  <p>
                    <strong>Version:</strong> 2.0 (React + TypeScript)
                  </p>
                  <p>
                    <strong>Architecture:</strong> Modern React + Vite + TypeScript SPA with local storage persistence.
                  </p>
                </div>
              </div>
            </div>
          </section>
        )}
      </main>

      {/* Modals */}
      <OperatorSlotModal
        slot={selectedSlot}
        onClose={() => setSelectedSlot(null)}
        onUpdateStatus={updateSlotStatus}
      />

      <OperatorUsageModal
        isOpen={isUsageModalOpen}
        onClose={() => setIsUsageModalOpen(false)}
      />

      <OperatorIssueModal
        isOpen={isIssueModalOpen}
        onClose={() => setIsIssueModalOpen(false)}
      />

      {/* Staff Access PIN Gate */}
      <OperatorPinModal />

      {/* Global Toast */}
      <Toast />
    </div>
  );
};
