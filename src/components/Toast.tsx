import React, { useEffect, useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { useParking } from '../context/ParkingContext';

export const Toast: React.FC = () => {
  const { toastMessage } = useParking();
  const [visible, setVisible] = useState(false);
  const [currentMessage, setCurrentMessage] = useState<string | null>(null);

  useEffect(() => {
    if (toastMessage) {
      setCurrentMessage(toastMessage);
      setVisible(true);

      const timer = setTimeout(() => {
        setVisible(false);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  if (!currentMessage || !visible) return null;

  return (
    <div id="toast-container" className="toast-container">
      <div
        className="toast"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateX(0)' : 'translateX(100%)',
          transition: 'all 0.3s ease',
        }}
      >
        <CheckCircle2 style={{ width: 18, height: 18, flexShrink: 0 }} />
        <span>{currentMessage}</span>
      </div>
    </div>
  );
};
