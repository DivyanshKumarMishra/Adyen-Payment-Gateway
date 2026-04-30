import { useAuth } from "../../context/AuthContext";
import "./NavBar.css";

export default function NavBar() {
  const { user, signOut } = useAuth();

  return (
    <nav className="navbar">
      <span className="navbar-brand">Payment portal (Firebase + Adyen)</span>
      <div className="navbar-right">
        {user && (
          <span className="navbar-user" title={user.email ?? undefined}>
            {user.displayName ?? user.email}
          </span>
        )}
        <button className="navbar-signout" onClick={signOut}>
          Sign out
        </button>
      </div>
    </nav>
  );
}
