import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const DashboardLayout = () => {
  const { user, logout } = useAuth();

  return (
    <div className="dashboard">
      <aside className="sidebar">
        <div className="logo">SupportAI</div>

        <nav>
          <NavLink to="/dashboard">Dashboard</NavLink>

          <NavLink to="/agents">AI Agents</NavLink>

          <NavLink to="/knowledge">Knowledge</NavLink>

          <NavLink to="/conversations">Conversations</NavLink>

          <NavLink to="/analytics">Analytics</NavLink>
        </nav>

        <div className="sidebar-bottom">
          <span>{user?.name}</span>

          <button onClick={logout}>Logout</button>
        </div>
      </aside>

      <main className="dashboard-content">
        <Outlet />
      </main>
    </div>
  );
};

export default DashboardLayout;
