import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import type { Organization } from "../types/auth";

const Dashboard = () => {
  const { user } = useAuth();

  const [organization, setOrganization] = useState<Organization | null>(null);

  const [agentCount, setAgentCount] = useState(0);
  const [documentCount, setDocumentCount] = useState(0);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);

        const [organizationResponse, agentsResponse, documentsResponse] =
          await Promise.all([
            api.get("/organization"),
            api.get("/agents"),
            api.get("/knowledge"),
          ]);

        setOrganization(organizationResponse.data.organization);

        setAgentCount(agentsResponse.data.count);

        setDocumentCount(documentsResponse.data.count);
      } catch (error) {
        console.error("Failed to load dashboard:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
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

          <strong>{loading ? "—" : agentCount}</strong>
        </div>

        <div className="stat-card">
          <span>Knowledge Documents</span>
          <strong>{loading ? "—" : documentCount}</strong>
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
