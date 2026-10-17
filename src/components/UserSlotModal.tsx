import React from 'react';
import { X, Clock } from 'lucide-react';
import type { ParkingSlot } from '../types';

interface UserSlotModalProps {
  slot: ParkingSlot | null;
  onClose: () => void;
  onStartBooking: (slot: ParkingSlot) => void;
}

export const UserSlotModal: React.FC<UserSlotModalProps> = ({ slot, onClose, onStartBooking }) => {
  if (!slot) return null;

  const isAvailable = slot.status === 'available';
  const updatedTime = new Date(slot.lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Slot Details</h2>
          <button type="button" className="close-modal" onClick={onClose}>
            <X style={{ width: 18, height: 18 }} />
          </button>
        </div>

        <div className="modal-body">
          <div className="slot-detail-header">
            <div className="slot-detail-id">{slot.id}</div>
            <div className="slot-detail-status">
              <span className={`status-badge status-${slot.status}`}>
                {slot.status.charAt(0).toUpperCase() + slot.status.slice(1)}
              </span>
            </div>
          </div>

          <div className="slot-detail-info" style={{ marginTop: '1rem', marginBottom: '1.5rem' }}>
            <p>
              <strong>Location:</strong> Mira Road East
            </p>
            <p style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Clock style={{ width: 15, height: 15 }} /> Last Updated: {updatedTime}
            </p>
          </div>

          {isAvailable && (
            <div>
              <button
                type="button"
                className="btn primary-btn"
                style={{ width: '100%', justifyContent: 'center' }}
                onClick={() => onStartBooking(slot)}
              >
                Book this Slot
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
