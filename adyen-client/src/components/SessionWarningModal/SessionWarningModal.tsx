import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { WARNING_COUNTDOWN_S } from "../../constants/sessionConfig";
import "./SessionWarningModal.css";

export default function SessionWarningModal() {
  const { showWarning, dismissWarning, signOut } = useAuth();
  const [seconds, setSeconds] = useState(WARNING_COUNTDOWN_S);

  useEffect(() => {
    if (!showWarning) return;

    const interval = setInterval(() => {
      setSeconds((s) => {
        if (s <= 1) { clearInterval(interval); signOut(); return 0; }
        return s - 1;
      });
    }, 1000);

    return () => {
      clearInterval(interval);
      setSeconds(WARNING_COUNTDOWN_S); // reset after modal closes
    };
  }, [showWarning, signOut]);

  if (!showWarning) return null;

  return (
    <div className="swm-overlay">
      <div className="swm-card">
        <h2 className="swm-title">Session Expiring Soon</h2>
        <p className="swm-body">
          You've been inactive. You'll be logged out in{" "}
          <span className="swm-countdown">{seconds}s</span>
        </p>
        <div className="swm-actions">
          <button className="swm-btn swm-btn--primary" onClick={dismissWarning}>
            Stay Logged In
          </button>
          <button className="swm-btn swm-btn--secondary" onClick={() => signOut()}>
            Log Out
          </button>
        </div>
      </div>
    </div>
  );
}
