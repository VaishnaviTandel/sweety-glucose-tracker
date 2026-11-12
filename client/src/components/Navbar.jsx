import { NavLink } from 'react-router-dom';
import { useAuth } from '../AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  return (
    <nav className="nav">
      <strong>🩸 Sweety</strong>
      <div className="nav-links">
        <NavLink to="/" end>Readings</NavLink>
        <NavLink to="/reports">Reports</NavLink>
      </div>
      <div className="nav-user">
        <span className="muted">{user.name}</span>
        <button className="secondary" onClick={logout}>Log out</button>
      </div>
    </nav>
  );
}