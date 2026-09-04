import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import type { Organization } from "../types/auth";

interface DashboardStats {
  conversationCount: number;
  resolvedConversationCount: number;
  aiResolvedCount: number;
  humanResolvedCount: number;
  aiResolutionRate: number;
}

const Dashboard = () => {
  const { user } = useAuth();

  const [organization, setOrganization] = useState<Organization | null>(null);

  const [agentCount, setAgentCount] = useState(0);
  const [documentCount, setDocumentCount] = useState(0);

  const [dashboardStats, setDashboardStats] = useState<DashboardStats>({
    conversationCount: 0,
    resolvedConversationCount: 0,
    aiResolvedCount: 0,
    humanResolvedCount: 0,
    aiResolutionRate: 0,
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);

        const [
          organizationResponse,
          agentsResponse,
          documentsResponse,
          dashboardResponse,
        ] = await Promise.all([
          api.get("/organization"),
          api.get("/agents"),
          api.get("/knowledge"),
          api.get("/dashboard/stats"),
        ]);

        setOrganization(organizationResponse.data.organization);

        setAgentCount(agentsResponse.data.count);

        setDocumentCount(documentsResponse.data.count);

        setDashboardStats(dashboardResponse.data.stats);
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
        {/* Conversations */}
        <div className="stat-card">
          <span>Conversations</span>

          <strong>{loading ? "—" : dashboardStats.conversationCount}</strong>
        </div>

        {/* AI Resolution */}
        <div className="stat-card">
          <span>AI Resolution</span>

          <strong>
            {loading ? "—" : `${dashboardStats.aiResolutionRate}%`}
          </strong>
        </div>

        {/* AI Agents */}
        <div className="stat-card">
          <span>AI Agents</span>

          <strong>{loading ? "—" : agentCount}</strong>
        </div>

        {/* Knowledge Documents */}
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
