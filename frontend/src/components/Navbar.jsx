import { useState } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Button from './Button';

const NAV_LINKS = [
  { to: '/',           label: 'Home',        end: true },
  { to: '/plan-trip',  label: 'Plan Trip'              },
  { to: '/dashboard',  label: 'Dashboard'              },
  { to: '/saved-trips',label: 'Saved Trips'            },
];

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  const closeMenu = () => setMenuOpen(false);

  const handleLogout = () => {
    logout();
    closeMenu();
    navigate('/');
  };

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  return (
    <>
      <nav className="navbar" role="navigation" aria-label="Main navigation">
        <div className="navbar-inner">
          {/* Logo */}
          <Link to="/" className="navbar-logo" onClick={closeMenu}>
            <span className="navbar-logo-icon" aria-hidden="true">✈</span>
            TripWise
          </Link>

          {/* Desktop nav */}
          <ul className="navbar-nav" role="list">
            {NAV_LINKS.map(({ to, label, end }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  end={end}
                  className={({ isActive }) =>
                    `navbar-link${isActive ? ' active' : ''}`
                  }
                >
                  {label}
                </NavLink>
              </li>
            ))}
          </ul>

          {/* Desktop actions */}
          <div className="navbar-actions">
            {isAuthenticated ? (
              <div className="navbar-user-menu">
                <span className="navbar-link" style={{ fontSize: '0.85rem', fontWeight: 500 }}>
                  Hi, {user?.name?.split(' ')[0]}
                </span>
                <div className="navbar-avatar" title="Your account" aria-label="User avatar">
                  {initials}
                </div>
                <Button variant="ghost" size="sm" onClick={handleLogout}>
                  Logout
                </Button>
              </div>
            ) : (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  as={Link}
                  to="/login"
                >
                  Login
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  as={Link}
                  to="/register"
                >
                  Sign Up
                </Button>
              </>
            )}
          </div>

          {/* Hamburger */}
          <button
            className="navbar-hamburger"
            onClick={() => setMenuOpen((o) => !o)}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          >
            <span className={`hamburger-line${menuOpen ? ' open' : ''}`} />
            <span className={`hamburger-line${menuOpen ? ' open' : ''}`} />
            <span className={`hamburger-line${menuOpen ? ' open' : ''}`} />
          </button>
        </div>
      </nav>

      {/* Mobile nav */}
      <div
        id="mobile-menu"
        className={`navbar-mobile${menuOpen ? ' open' : ''}`}
        aria-hidden={!menuOpen}
      >
        <ul className="navbar-mobile-nav" role="list">
          {NAV_LINKS.map(({ to, label, end }) => (
            <li key={to}>
              <NavLink
                to={to}
                end={end}
                className={({ isActive }) =>
                  `navbar-mobile-link${isActive ? ' active' : ''}`
                }
                onClick={closeMenu}
              >
                {label}
              </NavLink>
            </li>
          ))}
        </ul>

        <div className="navbar-mobile-actions">
          {isAuthenticated ? (
            <>
              <NavLink
                to="/profile"
                className="navbar-mobile-link"
                onClick={closeMenu}
              >
                👤 My Profile
              </NavLink>
              <Button variant="ghost" fullWidth onClick={handleLogout}>
                Logout
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="secondary"
                fullWidth
                as={Link}
                to="/login"
                onClick={closeMenu}
              >
                Login
              </Button>
              <Button
                variant="primary"
                fullWidth
                as={Link}
                to="/register"
                onClick={closeMenu}
              >
                Sign Up Free
              </Button>
            </>
          )}
        </div>
      </div>
    </>
  );
}

export default Navbar;
