import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import "./Login.css";

interface LoginProps {
  onDemoAccess?: () => void;
}

export default function Login({ onDemoAccess }: LoginProps) {
  const { signIn } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSignIn() {
    setError(null);
    setLoading(true);
    try {
      await signIn();
      // Page will redirect to IdP — loading state stays until redirect
    } catch {
      setError("Sign-in failed. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <h1 className="login-title">Sign in to continue</h1>
        <p className="login-subtitle">Use your organisation account to access the payment portal.</p>
        {error && <p className="login-error">{error}</p>}
        <button
          className="login-sso-button"
          onClick={handleSignIn}
          disabled={loading}
        >
          {loading ? "Redirecting…" : "Sign in with SSO"}
        </button>
        {onDemoAccess && (
          <button className="login-demo-link" onClick={onDemoAccess}>
            Skip to Payments Demo
          </button>
        )}
      </div>
    </div>
  );
}
