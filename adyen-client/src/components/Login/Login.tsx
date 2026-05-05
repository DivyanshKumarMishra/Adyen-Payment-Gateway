import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import "./Login.css";

type Mode = "signin" | "register";

interface LoginProps {
  sessionExpired?: boolean;
}

export default function Login({ sessionExpired }: LoginProps) {
  const { signInWithSSO, signInWithPassword, register } = useAuth();

  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  function switchMode(next: Mode) {
    setMode(next);
    setError(null);
    setSuccess(null);
    setEmail("");
    setPassword("");
  }

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      if (mode === "register") {
        await register(email, password);
        setSuccess("Account created. Please sign in.");
        switchMode("signin");
      } else {
        await signInWithPassword(email, password);
      }
    } catch {
      setError(mode === "register" ? "Registration failed. Email may already be in use." : "Invalid email or password.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSSO() {
    setError(null);
    try {
      await signInWithSSO();
    } catch {
      setError("SSO sign-in failed. Please try again.");
    }
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <h1 className="login-title">{mode === "signin" ? "Sign in to continue" : "Create an account"}</h1>
        <p className="login-subtitle">Access the payment portal.</p>

        {sessionExpired && <p className="login-error">Your session has expired. Please sign in again.</p>}
        {error && <p className="login-error">{error}</p>}
        {success && <p className="login-success">{success}</p>}

        <form onSubmit={handleSubmit} className="login-form">
          <input
            className="login-input"
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
          <input
            className="login-input"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete={mode === "register" ? "new-password" : "current-password"}
          />
          <button className="login-sso-button" type="submit" disabled={loading}>
            {loading ? "Please wait…" : mode === "signin" ? "Sign in" : "Register"}
          </button>
        </form>

        {mode === "signin" && (
          <>
            <div className="login-divider">or</div>
            <button className="login-sso-button login-sso-button--outline" onClick={handleSSO}>
              Sign in with SSO
            </button>
          </>
        )}

        <button className="login-demo-link" onClick={() => switchMode(mode === "signin" ? "register" : "signin")}>
          {mode === "signin" ? "Don't have an account? Register" : "Already have an account? Sign in"}
        </button>
      </div>
    </div>
  );
}
