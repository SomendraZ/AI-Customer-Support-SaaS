import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import type { Organization } from "../types/auth";

const Dashboard = () => {
  const { user } = useAuth();

  const [organization, setOrganization] = useState<Organization | null>(null);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrganization = async () => {
      try {
        const response = await api.get("/organization");

        setOrganization(response.data.organization);
      } catch (error) {
        console.error("Failed to load organization:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrganization();
  }, []);

  return (
    <div>
      <header className="dashboard-header">
        <div>
          <h1>Dashboard</h1>

          <p>Welcome back, {user?.name}.</p>
        </div>
      </header>

      <section className="stats-grid">
        <div className="stat-card">
          <span>Conversations</span>
          <strong>0</strong>
        </div>

        <div className="stat-card">
          <span>AI Resolution</span>
          <strong>0%</strong>
        </div>

        <div className="stat-card">
          <span>AI Agents</span>
          <strong>0</strong>
        </div>

        <div className="stat-card">
          <span>Knowledge Documents</span>
          <strong>0</strong>
        </div>
      </section>

      <section className="organization-card">
        <h2>Organization</h2>

        {loading ? (
          <p>Loading...</p>
        ) : (
          <>
            <p>
              <strong>Name:</strong> {organization?.name}
            </p>

            <p>
              <strong>Plan:</strong> {organization?.plan}
            </p>

            <p>
              <strong>Your Role:</strong> {user?.role}
            </p>
          </>
        )}
      </section>
    </div>
  );
};

export default Dashboard;
