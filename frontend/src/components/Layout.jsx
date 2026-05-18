import { NavLink, Outlet } from "react-router-dom";
import { pageStyles } from "../styles/shared";

export default function Layout() {
  return (
    <div style={pageStyles.page}>
      <div style={pageStyles.wideContainer}>
        <nav style={pageStyles.nav}>
          <NavLink
            to="/"
            end
            style={({ isActive }) => ({
              ...pageStyles.navLink,
              ...(isActive ? pageStyles.navLinkActive : pageStyles.navLinkInactive),
            })}
          >
            Dashboard
          </NavLink>
          <NavLink
            to="/pre-assessment"
            style={({ isActive }) => ({
              ...pageStyles.navLink,
              ...(isActive ? pageStyles.navLinkActive : pageStyles.navLinkInactive),
            })}
          >
            Pre-Assessment
          </NavLink>
          <NavLink
            to="/post-assessment"
            style={({ isActive }) => ({
              ...pageStyles.navLink,
              ...(isActive ? pageStyles.navLinkActive : pageStyles.navLinkInactive),
            })}
          >
            Post-Assessment
          </NavLink>
        </nav>
        <Outlet />
      </div>
    </div>
  );
}
