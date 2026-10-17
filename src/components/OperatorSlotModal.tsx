import React from 'react';
import { X, Clock, CheckCircle2, Car, Wrench } from 'lucide-react';
import type { ParkingSlot, SlotStatus } from '../types';

interface OperatorSlotModalProps {
  slot: ParkingSlot | null;
  onClose: () => void;
  onUpdateStatus: (slotId: string, status: SlotStatus) => void;
}

export const OperatorSlotModal: React.FC<OperatorSlotModalProps> = ({ slot, onClose, onUpdateStatus }) => {
  if (!slot) return null;

  let badgeClass = 'badge-normal';
  if (slot.status === 'occupied') badgeClass = 'badge-high';
  else if (slot.status === 'maintenance') badgeClass = 'badge-busy';

  const lastUpdatedStr = new Date(slot.lastUpdated).toLocaleString();

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
              <span className={`status-badge ${badgeClass}`}>{slot.status.toUpperCase()}</span>
            </div>
          </div>

          <div className="slot-detail-info">
            <p style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Clock style={{ width: 15, height: 15 }} /> Last Updated: {lastUpdatedStr}
            </p>
          </div>

          <div className="form-group mt-lg">
            <label>Update Status</label>
            <div className="modal-actions" style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {slot.status !== 'available' && (
                <button
                  type="button"
                  className="btn secondary-btn"
                  onClick={() => {
                    onUpdateStatus(slot.id, 'available');
                    onClose();
                  }}
                >
                  <CheckCircle2 style={{ width: 16, height: 16 }} /> Mark Available
                </button>
              )}

              {slot.status !== 'occupied' && slot.status !== 'maintenance' && (
                <button
                  type="button"
                  className="btn secondary-btn"
                  onClick={() => {
                    onUpdateStatus(slot.id, 'occupied');
                    onClose();
                  }}
                >
                  <Car style={{ width: 16, height: 16 }} /> Mark Occupied
                </button>
              )}

              {slot.status !== 'maintenance' && (
                <button
                  type="button"
                  className="btn secondary-btn"
                  onClick={() => {
                    onUpdateStatus(slot.id, 'maintenance');
                    onClose();
                  }}
                >
                  <Wrench style={{ width: 16, height: 16 }} /> Mark Maintenance
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
