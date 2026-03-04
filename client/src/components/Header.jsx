import { useEffect, useMemo, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import brandLogo from "../assets/logo.png";
import { AUTH_EVENT_NAME, getAuthSession } from "../utils/authSession";
import { useCart } from "../context/CartContext";

const navItems = [
  { label: "Home", path: "/" },
  { label: "Men", path: "/men" },
  { label: "Women", path: "/women" },
  { label: "Kids", path: "/kids" },
  { label: "Unisex", path: "/unisex" }
];

export default function Header() {
  const navigate = useNavigate();
  const { itemCount } = useCart();
  const [authState, setAuthState] = useState(getAuthSession());

  useEffect(() => {
    const syncAuth = () => setAuthState(getAuthSession());
    window.addEventListener(AUTH_EVENT_NAME, syncAuth);
    window.addEventListener("storage", syncAuth);
    return () => {
      window.removeEventListener(AUTH_EVENT_NAME, syncAuth);
      window.removeEventListener("storage", syncAuth);
    };
  }, []);

  const authLabel = useMemo(() => {
    if (authState.role === "admin") return "Admin";
    if (authState.role === "user" && authState.name) return authState.name;
    return "Sign In/Up";
  }, [authState]);

  const handleAuthClick = () => {
    if (authState.role === "admin") {
      navigate("/admin");
      return;
    }

    if (authState.role === "user" && authState.name) {
      navigate("/account");
      return;
    }

    navigate("/login");
  };

  return (
    <header className="topbar">
      <div className="topbar-shell topbar-inner">
        <div className="top-left">
          <NavLink className="brand-block" to="/">
            <img src={brandLogo} alt="Lakminda Fashion logo" className="brand-logo" />
            <span className="brand-title">Lakminda Fashion</span>
          </NavLink>

          <nav className="nav nav-left">
            {navItems.map((item) => (
              <NavLink
                className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
                to={item.path}
                key={item.label}
                end={item.path === "/"}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
        <div className="top-actions">
          <button className="top-btn custom-btn" onClick={() => navigate("/custom-designs")}>
            Need Custom Designs?
          </button>
          <button className="top-btn cart-btn" onClick={() => navigate("/cart")}>
            Cart ({itemCount})
          </button>
          <button className="top-btn auth-btn" onClick={handleAuthClick}>
            {authLabel}
          </button>
        </div>
      </div>
    </header>
  );
}
