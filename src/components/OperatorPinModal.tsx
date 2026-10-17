import React, { useState, useEffect, useRef } from 'react';
import { ShieldAlert, KeyRound, Unlock } from 'lucide-react';
import { useParking } from '../context/ParkingContext';

export const OperatorPinModal: React.FC = () => {
  const { isOperatorAuth, unlockOperator } = useParking();
  const [pin, setPin] = useState('');
  const [hasError, setHasError] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOperatorAuth) {
      setPin('');
      setHasError(false);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 150);
    }
  }, [isOperatorAuth]);

  if (isOperatorAuth) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const success = unlockOperator(pin.trim());
    if (!success) {
      setHasError(true);
      setPin('');
      inputRef.current?.focus();
    } else {
      setHasError(false);
    }
  };

  return (
    <div className="operator-auth-overlay" id="operator-pin-modal">
      <div className="operator-pin-card">
        <div className="pin-shield-icon">
          <ShieldAlert style={{ width: 28, height: 28 }} />
        </div>
        <h2>Operator Access Gate</h2>
        <p className="pin-subtext">Restricted: Municipal Parking Operations & Bay Controls</p>

        <form onSubmit={handleSubmit} className="pin-form">
          <label htmlFor="operator-pin-input">Enter 4-Digit Staff Security PIN</label>
          <div className="pin-input-wrap">
            <input
              ref={inputRef}
              type="password"
              id="operator-pin-input"
              maxLength={4}
              placeholder="••••"
              autoComplete="off"
              value={pin}
              onChange={(e) => {
                setPin(e.target.value);
                if (hasError) setHasError(false);
              }}
              required
            />
          </div>

          <div className="pin-hint">
            <KeyRound style={{ width: 14, height: 14 }} /> Demo Staff PIN: <strong>1234</strong>
          </div>

          {hasError && <p className="pin-error-msg">Incorrect PIN. Please enter 1234.</p>}

          <button type="submit" className="btn primary-btn pin-submit-btn">
            <Unlock style={{ width: 16, height: 16 }} /> Unlock Dashboard
          </button>
        </form>
      </div>
    </div>
  );
};
