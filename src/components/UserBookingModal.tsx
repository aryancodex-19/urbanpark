import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import type { ParkingSlot } from '../types';
import { useParking } from '../context/ParkingContext';

interface UserBookingModalProps {
  slot: ParkingSlot | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const UserBookingModal: React.FC<UserBookingModalProps> = ({ slot, isOpen, onClose, onSuccess }) => {
  const { createBooking } = useParking();

  const [step, setStep] = useState<'form' | 'summary'>('form');
  const [date, setDate] = useState<string>('');
  const [startTime, setStartTime] = useState<string>('');
  const [endTime, setEndTime] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      setStep('form');
      setDate(new Date().toISOString().split('T')[0]);
      setStartTime('');
      setEndTime('');
      setErrorMsg('');
    }
  }, [isOpen]);

  if (!isOpen || !slot) return null;

  const handleReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!startTime || !endTime) {
      setErrorMsg('Please select both start and end times.');
      return;
    }
    if (startTime >= endTime) {
      setErrorMsg('End time must be after start time.');
      return;
    }
    setErrorMsg('');
    setStep('summary');
  };

  const handleConfirm = () => {
    const ok = createBooking(slot.id, date, startTime, endTime);
    if (ok) {
      onClose();
      onSuccess();
    } else {
      setErrorMsg('This slot is no longer available. Please select another slot.');
      setStep('form');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Book Parking Slot</h2>
          <button type="button" className="close-modal" onClick={onClose}>
            <X style={{ width: 18, height: 18 }} />
          </button>
        </div>

        <div className="modal-body">
          {step === 'form' ? (
            <div>
              <form onSubmit={handleReview}>
                <div className="form-group">
                  <label>Selected Slot</label>
                  <input type="text" value={slot.id} readOnly disabled />
                </div>
                <div className="form-row">
                  <div className="form-group half">
                    <label htmlFor="book-date">Date</label>
                    <input
                      type="date"
                      id="book-date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group half">
                    <label htmlFor="book-start-time">Start Time</label>
                    <input
                      type="time"
                      id="book-start-time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group half">
                    <label htmlFor="book-end-time">End Time</label>
                    <input
                      type="time"
                      id="book-end-time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {errorMsg && (
                  <p className="form-help text-danger" style={{ color: 'red', marginBottom: 10 }}>
                    {errorMsg}
                  </p>
                )}

                <div className="form-actions">
                  <button type="button" className="btn close-modal" onClick={onClose}>
                    Cancel
                  </button>
                  <button type="submit" className="btn primary-btn">
                    Review Booking
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div>
              <div style={{ background: 'var(--bg-color)', padding: '1rem', borderRadius: 'var(--radius)', marginBottom: '1rem' }}>
                <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>Booking Summary</h3>
                <p style={{ marginBottom: '0.5rem' }}>
                  <strong>Slot:</strong> {slot.id}
                </p>
                <p style={{ marginBottom: '0.5rem' }}>
                  <strong>Date:</strong> {date}
                </p>
                <p style={{ marginBottom: '0.5rem' }}>
                  <strong>Start Time:</strong> {startTime}
                </p>
                <p style={{ marginBottom: '0.5rem' }}>
                  <strong>End Time:</strong> {endTime}
                </p>
              </div>

              {errorMsg && (
                <p className="form-help text-danger" style={{ color: 'red', marginBottom: 10 }}>
                  {errorMsg}
                </p>
              )}

              <div className="form-actions">
                <button type="button" className="btn" onClick={() => setStep('form')}>
                  Back
                </button>
                <button type="button" className="btn primary-btn" onClick={handleConfirm}>
                  Confirm Booking
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
