import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  SquareParking,
  User,
  Sparkles,
  ArrowRight,
  ArrowRightCircle,
  MapPin,
  ShieldCheck,
  CheckCircle2,
  Banknote,
  Map,
  Grid3x3,
  Car,
  Navigation,
  CalendarCheck,
  XCircle,
  Wrench,
  Search,
  Slash,
  CalendarX,
} from 'lucide-react';
import { useParking } from '../context/ParkingContext';
import { LeafletMap } from '../components/LeafletMap';
import { NotificationBell } from '../components/NotificationBell';
import { UserSlotModal } from '../components/UserSlotModal';
import { UserBookingModal } from '../components/UserBookingModal';
import { Toast } from '../components/Toast';
import type { ParkingSlot, UserType } from '../types';

type UserTab = 'hero-view' | 'home-view' | 'slots-view' | 'bookings-view' | 'info-view';

export const UserPage: React.FC = () => {
  const {
    facilities,
    currentFacility,
    currentFacilityId,
    switchFacility,
    slots,
    stats,
    currentUser,
    setCurrentUser,
    bookings,
    cancelBooking,
  } = useParking();

  const [activeTab, setActiveTab] = useState<UserTab>('hero-view');
  const [slotFilter, setSlotFilter] = useState<'all' | 'available' | 'zone-a' | 'zone-b'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [selectedSlot, setSelectedSlot] = useState<ParkingSlot | null>(null);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);

  // Filter slots
  const filteredSlots = slots.filter((slot) => {
    const q = searchQuery.trim().toLowerCase();
    if (q && !slot.id.toLowerCase().includes(q)) return false;

    if (slotFilter === 'available') return slot.status === 'available';
    if (slotFilter === 'zone-a') return slot.id.startsWith('A');
    if (slotFilter === 'zone-b') return slot.id.startsWith('B');
    return true;
  });

  // User bookings
  const userBookings = bookings
    .filter(
      (b) =>
        b.userId === currentUser ||
        b.bookedBy === currentUser ||
        b.userName === currentUser
    )
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const handleStartBooking = (slot: ParkingSlot) => {
    setSelectedSlot(slot);
    setIsBookingModalOpen(true);
  };

  const handleBookingSuccess = () => {
    setActiveTab('bookings-view');
  };

  return (
    <div className="user-portal">
      {/* Header */}
      <header className="user-header">
        <div
          className="user-logo"
          id="logo-home-link"
          title="UrbanServe - Return to Welcome"
          onClick={() => setActiveTab('hero-view')}
        >
          <SquareParking style={{ width: 28, height: 28 }} />
          <h2>UrbanServe</h2>
        </div>

        <div className="user-nav-container">
          <nav className="user-nav">
            <button
              type="button"
              className={`user-nav-btn ${activeTab === 'hero-view' ? 'active' : ''}`}
              onClick={() => setActiveTab('hero-view')}
            >
              Home
            </button>
            <button
              type="button"
              className={`user-nav-btn ${activeTab === 'home-view' ? 'active' : ''}`}
              onClick={() => setActiveTab('home-view')}
            >
              Live Facility
            </button>
            <button
              type="button"
              className={`user-nav-btn ${activeTab === 'slots-view' ? 'active' : ''}`}
              onClick={() => setActiveTab('slots-view')}
            >
              Parking Slots
            </button>
            <button
              type="button"
              className={`user-nav-btn ${activeTab === 'bookings-view' ? 'active' : ''}`}
              onClick={() => setActiveTab('bookings-view')}
            >
              My Bookings
            </button>
            <button
              type="button"
              className={`user-nav-btn ${activeTab === 'info-view' ? 'active' : ''}`}
              onClick={() => setActiveTab('info-view')}
            >
              Parking Information
            </button>
          </nav>
        </div>

        <div className="header-actions" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div className="user-switcher-container">
            <User style={{ width: 15, height: 15, color: 'var(--accent-color)' }} />
            <select
              id="current-user-select"
              className="user-select"
              title="Switch Demo User"
              value={currentUser}
              onChange={(e) => setCurrentUser(e.target.value as UserType)}
            >
              <option value="user1">user1</option>
              <option value="user2">user2</option>
              <option value="user3">user3</option>
            </select>
          </div>

          <NotificationBell type="user" />
        </div>
      </header>

      {/* Main Container */}
      <main className="user-main">
        {/* --- Hero Welcome View --- */}
        {activeTab === 'hero-view' && (
          <section key="hero-view" id="hero-view" className="view active">
            <div className="hero-landing-wrapper">
              <div className="hero-banner">
                <div className="hero-pill-badge">
                  <span className="hero-pill-dot"></span>
                  <span>Official Municipal Smart Parking • Mira Road East</span>
                </div>
                <h1 className="hero-title">
                  Effortless Urban Parking.
                  <br />
                  <span className="hero-gradient-text">Real-Time. Guaranteed.</span>
                </h1>
                <p className="hero-description">
                  Skip circling the block. Check live vacancy across 7+ verified municipal parking hubs, reserve your spot in advance, and park with zero friction.
                </p>
                <div className="hero-cta-group">
                  <button
                    type="button"
                    className="btn-hero-primary btn-get-started"
                    onClick={() => setActiveTab('slots-view')}
                  >
                    <Sparkles style={{ width: 18, height: 18 }} /> Get Started <ArrowRight style={{ width: 18, height: 18 }} />
                  </button>
                  <button
                    type="button"
                    className="btn-hero-secondary btn-explore-map"
                    onClick={() => setActiveTab('home-view')}
                  >
                    <MapPin style={{ width: 18, height: 18 }} /> Live Availability Map
                  </button>
                  <Link to="/operator" className="btn-hero-secondary" style={{ textDecoration: 'none' }}>
                    <ShieldCheck style={{ width: 18, height: 18 }} /> Operator Portal
                  </Link>
                </div>
              </div>

              {/* Quick Live Metrics */}
              <div className="hero-metrics-grid">
                <div className="hero-metric-card">
                  <div className="hero-metric-icon" style={{ background: 'rgba(37, 99, 235, 0.1)', color: '#2563eb' }}>
                    <MapPin style={{ width: 22, height: 22 }} />
                  </div>
                  <div>
                    <div className="hero-metric-val">{facilities.length} Hubs</div>
                    <div className="hero-metric-lbl">Active Facilities</div>
                  </div>
                </div>
                <div className="hero-metric-card">
                  <div className="hero-metric-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
                    <CheckCircle2 style={{ width: 22, height: 22 }} />
                  </div>
                  <div>
                    <div className="hero-metric-val">{stats.available} Slots</div>
                    <div className="hero-metric-lbl">Available In Area</div>
                  </div>
                </div>
                <div className="hero-metric-card">
                  <div className="hero-metric-icon" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>
                    <Banknote style={{ width: 22, height: 22 }} />
                  </div>
                  <div>
                    <div className="hero-metric-val">₹20 / hr</div>
                    <div className="hero-metric-lbl">Standard Civic Rate</div>
                  </div>
                </div>
                <div className="hero-metric-card">
                  <div className="hero-metric-icon" style={{ background: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6' }}>
                    <ShieldCheck style={{ width: 22, height: 22 }} />
                  </div>
                  <div>
                    <div className="hero-metric-val">100%</div>
                    <div className="hero-metric-lbl">Civic Monitored</div>
                  </div>
                </div>
              </div>

              {/* How It Works */}
              <div>
                <div className="section-headline">
                  <h2>How UrbanServe Works</h2>
                  <p>3 simple steps to eliminate parking hassles forever</p>
                </div>
                <div className="hero-steps-grid">
                  <div className="hero-step-card">
                    <span className="hero-step-number">01</span>
                    <div className="hero-step-icon">
                      <Map style={{ width: 24, height: 24 }} />
                    </div>
                    <h3>1. Select Your Location</h3>
                    <p>Browse 7+ parking facilities across Kanakia Road, Station Hub, Cinemax Arcade, and GCC Club with live occupancy status.</p>
                  </div>
                  <div className="hero-step-card">
                    <span className="hero-step-number">02</span>
                    <div className="hero-step-icon">
                      <Grid3x3 style={{ width: 24, height: 24 }} />
                    </div>
                    <h3>2. Pick a Vacant Slot</h3>
                    <p>Live visual green/red slot grid. View zone allocations, slot numbers, and reserve your spot with real-time reassurance.</p>
                  </div>
                  <div className="hero-step-card">
                    <span className="hero-step-number">03</span>
                    <div className="hero-step-icon">
                      <Car style={{ width: 24, height: 24 }} />
                    </div>
                    <h3>3. Park & Enjoy Peace of Mind</h3>
                    <p>Get instant digital booking receipt, drive directly to your reserved slot without wasting fuel or time in traffic.</p>
                  </div>
                </div>
              </div>

              {/* Features / Why UrbanServe */}
              <div>
                <div className="section-headline">
                  <h2>Engineered for Smart Cities</h2>
                  <p>Modern civic technology built for daily commuters and municipal efficiency</p>
                </div>
                <div className="hero-features-grid">
                  <div className="hero-feature-item">
                    <div className="hero-feature-icon" style={{ background: '#ede9fe', color: '#7c3aed' }}>
                      <ShieldCheck style={{ width: 20, height: 20 }} />
                    </div>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 600 }}>Municipal Supervised</h3>
                    <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                      Supervised by dedicated municipal operators with real-time audit logs and transparent civic management.
                    </p>
                  </div>
                  <div className="hero-feature-item">
                    <div className="hero-feature-icon" style={{ background: '#fef3c7', color: '#d97706' }}>
                      <Navigation style={{ width: 20, height: 20 }} />
                    </div>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 600 }}>Interactive GPS Mapping</h3>
                    <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                      Interactive OpenStreetMap with color-coded pins, occupancy badges, and one-tap area navigation.
                    </p>
                  </div>
                  <div className="hero-feature-item">
                    <div className="hero-feature-icon" style={{ background: '#dcfce7', color: '#16a34a' }}>
                      <CalendarCheck style={{ width: 20, height: 20 }} />
                    </div>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 600 }}>Advance Slot Booking</h3>
                    <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                      Book slots for your commute or weekend shopping ahead of time to guarantee your spot upon arrival.
                    </p>
                  </div>
                </div>
              </div>

              {/* Bottom Call to Action */}
              <div className="hero-bottom-cta">
                <div>
                  <h3>Ready to Park Without the Stress?</h3>
                  <p>Check current real-time slot availability at your nearest Mira Road parking hub.</p>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    className="btn-hero-primary btn-explore-map"
                    id="hero-bottom-find-slots"
                    onClick={() => {
                      setActiveTab('home-view');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                  >
                    <ArrowRightCircle style={{ width: 18, height: 18 }} /> Find Parking Slots
                  </button>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* --- Live Facility View --- */}
        {activeTab === 'home-view' && (
          <section key="home-view" id="home-view" className="view active">
            <div className="hero-section">
              <h1 id="user-facility-name">{currentFacility.name}</h1>
              <p id="user-facility-address">{currentFacility.address}</p>
              <div className="facility-selector-wrapper" style={{ marginTop: '1rem' }}>
                <label
                  htmlFor="user-facility-select"
                  style={{
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    color: 'var(--text-muted)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                  }}
                >
                  <MapPin style={{ width: 16, height: 16 }} /> Select Area:
                </label>
                <select
                  id="user-facility-select"
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
              <p style={{ marginTop: '1rem', fontSize: '0.9rem' }}>
                Last Updated:{' '}
                <span id="user-last-updated">
                  {stats.latestTime
                    ? stats.latestTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    : '--'}
                </span>
              </p>
            </div>

            <div className="kpi-grid">
              <div className="kpi-card">
                <div className="kpi-icon icon-blue">
                  <Car style={{ width: 22, height: 22 }} />
                </div>
                <div className="kpi-data">
                  <h3 className="kpi-label">TOTAL SLOTS</h3>
                  <p className="kpi-value">{stats.total}</p>
                </div>
              </div>
              <div className="kpi-card">
                <div className="kpi-icon icon-green">
                  <CheckCircle2 style={{ width: 22, height: 22 }} />
                </div>
                <div className="kpi-data">
                  <h3 className="kpi-label">AVAILABLE</h3>
                  <p className="kpi-value text-available">{stats.available}</p>
                </div>
              </div>
              <div className="kpi-card">
                <div className="kpi-icon icon-red">
                  <XCircle style={{ width: 22, height: 22 }} />
                </div>
                <div className="kpi-data">
                  <h3 className="kpi-label">OCCUPIED</h3>
                  <p className="kpi-value text-occupied">{stats.occupied}</p>
                </div>
              </div>
              <div className="kpi-card">
                <div className="kpi-icon icon-amber">
                  <Wrench style={{ width: 22, height: 22 }} />
                </div>
                <div className="kpi-data">
                  <h3 className="kpi-label">MAINTENANCE</h3>
                  <p className="kpi-value text-maintenance">{stats.maintenance}</p>
                </div>
              </div>
            </div>

            <div className="hero-section" style={{ marginTop: '2rem' }}>
              <div style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>
                Current Occupancy: <span id="user-occupancy-percent">{stats.occupancyPercent}%</span>
              </div>
              <button
                type="button"
                className="btn primary-btn primary-action"
                onClick={() => {
                  setActiveTab('slots-view');
                  setSlotFilter('available');
                }}
              >
                View Available Slots
              </button>
            </div>

            <div className="panel mt-lg" style={{ marginTop: '2rem' }}>
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
                  <MapPin style={{ width: 18, height: 18 }} /> Parking Location
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
              <LeafletMap mode="user" />
            </div>
          </section>
        )}

        {/* --- Parking Slots View --- */}
        {activeTab === 'slots-view' && (
          <section key="slots-view" id="slots-view" className="view active">
            <header className="page-header">
              <div className="header-content">
                <h1>Parking Slots</h1>
                <p>
                  Current real-time availability for <strong>{currentFacility.name}</strong>.
                </p>
              </div>
            </header>

            <div className="user-slots-filter-bar">
              <div className="search-wrapper" style={{ maxWidth: 280 }}>
                <Search style={{ width: 16, height: 16 }} />
                <input
                  type="text"
                  placeholder="Search slot (e.g. A01)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="filter-pills" id="user-slot-filter-pills">
                <button
                  type="button"
                  className={`filter-pill ${slotFilter === 'all' ? 'active' : ''}`}
                  onClick={() => setSlotFilter('all')}
                >
                  All Slots
                </button>
                <button
                  type="button"
                  className={`filter-pill ${slotFilter === 'available' ? 'active' : ''}`}
                  onClick={() => setSlotFilter('available')}
                >
                  <span className="pill-dot dot-available"></span> Available Only
                </button>
                <button
                  type="button"
                  className={`filter-pill ${slotFilter === 'zone-a' ? 'active' : ''}`}
                  onClick={() => setSlotFilter('zone-a')}
                >
                  Zone A
                </button>
                <button
                  type="button"
                  className={`filter-pill ${slotFilter === 'zone-b' ? 'active' : ''}`}
                  onClick={() => setSlotFilter('zone-b')}
                >
                  Zone B
                </button>
              </div>
            </div>

            <div className="legend-bar">
              <span className="legend-title">STATUS LEGEND</span>
              <div className="legend-items">
                <span className="legend-item">
                  <span className="dot dot-available"></span> Available
                </span>
                <span className="legend-item">
                  <span className="dot dot-reserved"></span> Reserved
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
              <div className="empty-state" style={{ marginTop: '2rem' }}>
                <Slash style={{ width: 36, height: 36, margin: '0 auto 0.5rem', opacity: 0.5 }} />
                <p>No matching parking slots found for this filter.</p>
              </div>
            )}
          </section>
        )}

        {/* --- Information View --- */}
        {activeTab === 'info-view' && (
          <section key="info-view" id="info-view" className="view active">
            <header className="page-header">
              <div className="header-content">
                <h1>Parking Information</h1>
                <p>Details and capacity overview.</p>
              </div>
            </header>

            <div className="info-panel">
              <h2>{currentFacility.name}</h2>
              <p>
                <strong>Location:</strong> {currentFacility.address}
              </p>
              <div style={{ marginTop: '1rem', lineHeight: 1.8 }}>
                <p>
                  <strong>Capacity:</strong> {stats.total}
                </p>
                <p>
                  <strong>Hourly Rate:</strong> {currentFacility.rate}
                </p>
                <p>
                  <strong>Available:</strong> {stats.available}
                </p>
                <p>
                  <strong>Occupied:</strong> {stats.occupied}
                </p>
                <p>
                  <strong>Maintenance:</strong> {stats.maintenance}
                </p>
                <p>
                  <strong>Current Occupancy:</strong> {stats.occupancyPercent}%
                </p>
                <p>
                  <strong>Parking Status:</strong> {stats.status}
                </p>
              </div>
            </div>
          </section>
        )}

        {/* --- My Bookings View --- */}
        {activeTab === 'bookings-view' && (
          <section key="bookings-view" id="bookings-view" className="view active">
            <header className="page-header">
              <div className="header-content">
                <h1>My Bookings</h1>
                <p>View and manage your parking reservations.</p>
              </div>
            </header>

            <div className="panel">
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Booking ID</th>
                      <th>Location</th>
                      <th>Slot</th>
                      <th>Date</th>
                      <th>Time</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {userBookings.map((b) => {
                      let statusClass = 'badge-low';
                      if (b.status === 'Active') statusClass = 'badge-progress';
                      else if (b.status === 'Completed') statusClass = 'badge-resolved';
                      else if (b.status === 'Upcoming') statusClass = 'badge-open';

                      const displayTime =
                        b.time ||
                        (b.startTime ? (b.endTime ? `${b.startTime} - ${b.endTime}` : b.startTime) : '--');

                      return (
                        <tr key={b.id}>
                          <td>
                            <strong>{b.id}</strong>
                          </td>
                          <td>
                            <span style={{ fontWeight: 500, fontSize: '0.85rem', color: 'var(--primary-color)' }}>
                              {b.facilityName || currentFacility.name}
                            </span>
                          </td>
                          <td>
                            <span style={{ fontWeight: 600, color: 'var(--accent-color)' }}>{b.slotId}</span>
                          </td>
                          <td>{b.date || '--'}</td>
                          <td>{displayTime}</td>
                          <td>
                            <span className={`badge ${statusClass}`}>{b.status}</span>
                          </td>
                          <td>
                            {b.status === 'Upcoming' || b.status === 'Active' ? (
                              <button
                                type="button"
                                className="btn danger-btn action-btn"
                                onClick={() => cancelBooking(b.id)}
                              >
                                Cancel Booking
                              </button>
                            ) : b.status === 'Cancelled' ? (
                              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                                Cancelled
                              </span>
                            ) : (
                              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                                {b.status}
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {userBookings.length === 0 && (
                  <div className="empty-state">
                    <CalendarX style={{ width: 36, height: 36, margin: '0 auto 0.5rem', opacity: 0.5 }} />
                    <p>You have no bookings.</p>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}
      </main>

      {/* Modals */}
      <UserSlotModal
        slot={selectedSlot}
        onClose={() => setSelectedSlot(null)}
        onStartBooking={handleStartBooking}
      />

      <UserBookingModal
        slot={selectedSlot}
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        onSuccess={handleBookingSuccess}
      />

      {/* Global Toast */}
      <Toast />
    </div>
  );
};
