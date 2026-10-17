import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useParking } from '../context/ParkingContext';

interface OperatorUsageModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OperatorUsageModal: React.FC<OperatorUsageModalProps> = ({ isOpen, onClose }) => {
  const { stats, createUsageRecord } = useParking();

  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [occupied, setOccupied] = useState<number>(0);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (isOpen) {
      const now = new Date();
      setDate(now.toISOString().split('T')[0]);
      setTime(now.toTimeString().slice(0, 5));
      setOccupied(stats.occupied || 0);
      setErrorMsg('');
    }
  }, [isOpen, stats.occupied]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const res = createUsageRecord(date, time, Number(occupied));
    if (res.success) {
      onClose();
    } else {
      setErrorMsg(res.error || 'Failed to save record.');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Record Usage</h2>
          <button type="button" className="close-modal" onClick={onClose}>
            <X style={{ width: 18, height: 18 }} />
          </button>
        </div>

        <div className="modal-body">
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group half">
                <label htmlFor="usage-date">Date</label>
                <input
                  type="date"
                  id="usage-date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </div>
              <div className="form-group half">
                <label htmlFor="usage-time">Time</label>
                <input
                  type="time"
                  id="usage-time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="usage-occupied">Occupied Slots</label>
              <input
                type="number"
                id="usage-occupied"
                min="0"
                value={occupied}
                onChange={(e) => setOccupied(parseInt(e.target.value) || 0)}
                required
              />
              <small className="form-help">Max usable slots based on maintenance: {stats.usable}</small>
            </div>

            {errorMsg && (
              <p className="form-help text-danger" style={{ color: 'red', marginBottom: '10px' }}>
                {errorMsg}
              </p>
            )}

            <div className="form-actions">
              <button type="button" className="btn close-modal" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="btn primary-btn">
                Save Record
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
