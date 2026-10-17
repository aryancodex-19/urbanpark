import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useParking } from '../context/ParkingContext';

interface LeafletMapProps {
  mode?: 'user' | 'operator';
  height?: string;
}

export const LeafletMap: React.FC<LeafletMapProps> = ({ mode = 'user', height = '450px' }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);

  const { facilities, currentFacility, currentFacilityId, facilitiesData, switchFacility } = useParking();

  // Create or destroy map instance
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const lat = currentFacility ? currentFacility.lat : 19.3005;
      const lng = currentFacility ? currentFacility.lng : 72.8762;
      const zoomLevel = 15;

      const map = L.map(mapContainerRef.current, {
        zoomControl: true,
        scrollWheelZoom: true,
      }).setView([lat, lng], zoomLevel);

      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors',
      }).addTo(map);

      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;

    // Handle resize
    const handleResize = () => {
      if (map) map.invalidateSize();
    };
    window.addEventListener('resize', handleResize);
    setTimeout(() => {
      if (map) map.invalidateSize();
    }, 200);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [currentFacility]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update map markers when facilitiesData, currentFacilityId, or switchFacility changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Remove existing markers
    markersRef.current.forEach((m) => map.removeLayer(m));
    markersRef.current = [];

    facilities.forEach((fac) => {
      const facSlots = facilitiesData[fac.id]?.slots || [];
      const total = facSlots.length || fac.totalSlots;
      const available = facSlots.filter((s) => s.status === 'available').length;
      const isFull = available === 0;
      const isCurrent = fac.id === currentFacilityId;

      const colorClass = !isFull ? 'marker-available' : 'marker-occupied';
      const currentStyle = isCurrent
        ? 'box-shadow: 0 0 0 4px #2563eb, 0 4px 10px rgba(0,0,0,0.3); transform: scale(1.15);'
        : '';

      const icon = L.divIcon({
        className: 'custom-map-marker',
        html: `<div class="custom-marker-pin ${colorClass}" style="${currentStyle}">
                 <span>P</span>
               </div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 28],
        popupAnchor: [0, -26],
      });

      const marker = L.marker([fac.lat, fac.lng], { icon }).addTo(map);

      const btnLabel =
        mode === 'operator'
          ? isCurrent
            ? 'Managing This Area'
            : 'Manage This Area'
          : isCurrent
          ? 'Viewing This Facility'
          : 'Select This Area';

      // Attach popup container DOM element
      const popupDiv = document.createElement('div');
      popupDiv.className = 'map-popup-card';
      popupDiv.innerHTML = `
        <h4>${fac.name} ${isCurrent ? '<span class="map-active-badge">Active Area</span>' : ''}</h4>
        <div style="display:flex; align-items:center; justify-content:space-between; margin: 5px 0;">
            <span class="map-status-badge ${isFull ? 'occupied' : 'available'}">
                ${available} / ${total} Available
            </span>
            <span style="font-size:0.8rem; font-weight:600; color:var(--text-muted);">${fac.rate}</span>
        </div>
        <div class="map-popup-loc">${fac.address}</div>
      `;

      const selectBtn = document.createElement('button');
      selectBtn.className = 'map-select-btn';
      selectBtn.textContent = btnLabel;
      selectBtn.onclick = () => {
        switchFacility(fac.id);
        marker.closePopup();
      };
      popupDiv.appendChild(selectBtn);

      marker.bindPopup(popupDiv);
      markersRef.current.push(marker);
    });
  }, [facilities, facilitiesData, currentFacilityId, switchFacility, mode]);

  // Pan to current facility when facility changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (map && currentFacility) {
      map.flyTo([currentFacility.lat, currentFacility.lng], 16, { duration: 0.8 });
    }
  }, [currentFacility]);

  return (
    <div
      ref={mapContainerRef}
      id="map"
      style={{
        width: '100%',
        height: height,
        borderRadius: 'var(--radius)',
        zIndex: 1,
      }}
    />
  );
};
