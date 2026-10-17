import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useParking } from '../context/ParkingContext';
import type { IssuePriority } from '../types';

interface OperatorIssueModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OperatorIssueModal: React.FC<OperatorIssueModalProps> = ({ isOpen, onClose }) => {
  const { createIssue } = useParking();

  const [location, setLocation] = useState('');
  const [type, setType] = useState('Slot Damage');
  const [priority, setPriority] = useState<IssuePriority>('Medium');
  const [desc, setDesc] = useState('');

  useEffect(() => {
    if (isOpen) {
      setLocation('');
      setType('Slot Damage');
      setPriority('Medium');
      setDesc('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!location.trim() || !desc.trim()) return;
    createIssue(location.trim(), type, priority, desc.trim());
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Report Issue</h2>
          <button type="button" className="close-modal" onClick={onClose}>
            <X style={{ width: 18, height: 18 }} />
          </button>
        </div>

        <div className="modal-body">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="issue-location">Parking Area / Slot</label>
              <input
                type="text"
                id="issue-location"
                placeholder="e.g. Area A, Slot A05, Main Gate"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group half">
                <label htmlFor="issue-type">Issue Type</label>
                <select id="issue-type" value={type} onChange={(e) => setType(e.target.value)} required>
                  <option value="Slot Damage">Slot Damage</option>
                  <option value="Entry Gate">Entry Gate</option>
                  <option value="Exit Gate">Exit Gate</option>
                  <option value="Lighting">Lighting</option>
                  <option value="Signage">Signage</option>
                  <option value="Surface Damage">Surface Damage</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="form-group half">
                <label htmlFor="issue-priority">Priority</label>
                <select
                  id="issue-priority"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as IssuePriority)}
                  required
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="issue-desc">Description</label>
              <textarea
                id="issue-desc"
                rows={3}
                placeholder="Describe the operational issue..."
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                required
              />
            </div>

            <div className="form-actions">
              <button type="button" className="btn close-modal" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="btn primary-btn">
                Report Issue
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
