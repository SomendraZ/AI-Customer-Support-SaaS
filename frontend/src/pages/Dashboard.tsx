import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
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

interface Conversation {
  _id: string;
  title?: string;
  status: "open" | "closed";
  resolution: "unresolved" | "ai_resolved" | "human_resolved";
  agentId?: {
    _id: string;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
}

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

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

  const [recentConversations, setRecentConversations] = useState<
    Conversation[]
  >([]);

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
          conversationsResponse,
        ] = await Promise.all([
          api.get("/organization"),
          api.get("/agents"),
          api.get("/knowledge"),
          api.get("/dashboard/stats"),
          api.get("/conversations"),
        ]);

        setOrganization(organizationResponse.data.organization);

        setAgentCount(agentsResponse.data.count);

        setDocumentCount(documentsResponse.data.count);

        setDashboardStats(dashboardResponse.data.stats);

        const conversations = conversationsResponse.data.conversations || [];

        setRecentConversations(
          [...conversations]
            .sort(
              (a, b) =>
                new Date(b.updatedAt).getTime() -
                new Date(a.updatedAt).getTime(),
            )
            .slice(0, 5),
        );
      } catch (error) {
        console.error("Failed to load dashboard:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const getResolutionLabel = (resolution: Conversation["resolution"]) => {
    if (resolution === "ai_resolved") {
      return "AI Resolved";
    }

    if (resolution === "human_resolved") {
      return "Human Resolved";
    }

    return "Unresolved";
  };

  const getResolutionClass = (resolution: Conversation["resolution"]) => {
    if (resolution === "ai_resolved") {
      return "ai_resolved";
    }

    if (resolution === "human_resolved") {
      return "human_resolved";
    }

    return "unresolved";
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="dashboard-page">
      <header className="dashboard-header">
        <div>
          <h1>Dashboard</h1>
          <p>Welcome back, {user?.name}.</p>
        </div>

        <button className="primary-button" onClick={() => navigate("/support")}>
          Open AI Support
        </button>
      </header>

      <section className="stats-grid">
        <div className="stat-card">
          <div className="stat-card-top">
            <span>Conversations</span>
            <span className="stat-icon">💬</span>
          </div>

          <strong>{loading ? "—" : dashboardStats.conversationCount}</strong>

          <small>Total customer conversations</small>
        </div>

        <div className="stat-card">
          <div className="stat-card-top">
            <span>AI Resolution</span>
            <span className="stat-icon">✦</span>
          </div>

          <strong>
            {loading ? "—" : `${dashboardStats.aiResolutionRate}%`}
          </strong>

          <small>Of resolved conversations</small>
        </div>

        <div className="stat-card">
          <div className="stat-card-top">
            <span>AI Agents</span>
            <span className="stat-icon">🤖</span>
          </div>

          <strong>{loading ? "—" : agentCount}</strong>

          <small>Configured support agents</small>
        </div>

        <div className="stat-card">
          <div className="stat-card-top">
            <span>Knowledge Documents</span>
            <span className="stat-icon">📚</span>
          </div>

          <strong>{loading ? "—" : documentCount}</strong>

          <small>Available to your AI agents</small>
        </div>
      </section>

      <div className="dashboard-main-grid">
        <section className="dashboard-card resolution-card">
          <div className="dashboard-card-header">
            <div>
              <h2>Conversation Resolution</h2>
              <p>How conversations are being resolved</p>
            </div>

            <button
              className="text-button"
              onClick={() => navigate("/analytics")}
            >
              View Analytics
            </button>
          </div>

          <div className="resolution-stats">
            <div className="resolution-stat">
              <div className="resolution-stat-value">
                {loading ? "—" : dashboardStats.aiResolvedCount}
              </div>

              <span className="resolution-stat-label">AI Resolved</span>
            </div>

            <div className="resolution-stat">
              <div className="resolution-stat-value">
                {loading ? "—" : dashboardStats.humanResolvedCount}
              </div>

              <span className="resolution-stat-label">Human Resolved</span>
            </div>

            <div className="resolution-stat">
              <div className="resolution-stat-value">
                {loading
                  ? "—"
                  : dashboardStats.conversationCount -
                    dashboardStats.resolvedConversationCount}
              </div>

              <span className="resolution-stat-label">Unresolved</span>
            </div>
          </div>

          {!loading && (
            <div className="resolution-bar">
              <div
                className="resolution-bar-ai"
                style={{
                  width: `${
                    dashboardStats.conversationCount
                      ? (dashboardStats.aiResolvedCount /
                          dashboardStats.conversationCount) *
                        100
                      : 0
                  }%`,
                }}
              />

              <div
                className="resolution-bar-human"
                style={{
                  width: `${
                    dashboardStats.conversationCount
                      ? (dashboardStats.humanResolvedCount /
                          dashboardStats.conversationCount) *
                        100
                      : 0
                  }%`,
                }}
              />
            </div>
          )}

          <div className="resolution-legend">
            <span>
              <i className="legend-ai" />
              AI Resolved
            </span>

            <span>
              <i className="legend-human" />
              Human Resolved
            </span>

            <span>
              <i className="legend-unresolved" />
              Unresolved
            </span>
          </div>
        </section>

        <section className="dashboard-card quick-actions-card">
          <div className="dashboard-card-header">
            <div>
              <h2>Quick Actions</h2>
              <p>Manage your support system</p>
            </div>
          </div>

          <div className="quick-actions">
            <button onClick={() => navigate("/support")}>
              <span>💬</span>
              <div>
                <strong>Start Support Chat</strong>
                <small>Test your AI agent</small>
              </div>
            </button>

            <button onClick={() => navigate("/agents")}>
              <span>🤖</span>
              <div>
                <strong>Manage AI Agents</strong>
                <small>Configure your agents</small>
              </div>
            </button>

            <button onClick={() => navigate("/knowledge")}>
              <span>📚</span>
              <div>
                <strong>Knowledge Base</strong>
                <small>Manage support documents</small>
              </div>
            </button>

            <button onClick={() => navigate("/conversations")}>
              <span>🗂️</span>
              <div>
                <strong>View Conversations</strong>
                <small>Review customer conversations</small>
              </div>
            </button>
          </div>
        </section>
      </div>

      <section className="dashboard-card recent-conversations-card">
        <div className="dashboard-card-header">
          <div>
            <h2>Recent Conversations</h2>
            <p>Your latest customer conversations</p>
          </div>

          <button
            className="text-button"
            onClick={() => navigate("/conversations")}
          >
            View All
          </button>
        </div>

        {loading ? (
          <div className="dashboard-empty">Loading conversations...</div>
        ) : recentConversations.length === 0 ? (
          <div className="dashboard-empty">No conversations yet.</div>
        ) : (
          <div className="recent-conversations">
            {recentConversations.map((conversation) => (
              <button
                key={conversation._id}
                className="recent-conversation"
                onClick={() =>
                  navigate(`/support?conversation=${conversation._id}`)
                }
              >
                <div className="recent-conversation-info">
                  <strong>
                    {conversation.title || "Untitled Conversation"}
                  </strong>

                  <span>{conversation.agentId?.name || "AI Agent"}</span>
                </div>

                <div className="recent-conversation-meta">
                  <span
                    className={`conversation-resolution-badge ${getResolutionClass(
                      conversation.resolution,
                    )}`}
                  >
                    {getResolutionLabel(conversation.resolution)}
                  </span>

                  <time>{formatDate(conversation.updatedAt)}</time>
                </div>
              </button>
            ))}
          </div>
        )}
      </section>

      <section className="organization-card">
        <div>
          <h2>{organization?.name}</h2>
          <p>Your organization information</p>
        </div>

        <div className="organization-details">
          <div>
            <span>Plan</span>
            <strong>{loading ? "—" : organization?.plan}</strong>
          </div>

          <div>
            <span>Your Role</span>
            <strong>{loading ? "—" : user?.role}</strong>
          </div>

          <div>
            <span>AI Agents</span>
            <strong>{loading ? "—" : agentCount}</strong>
          </div>

          <div>
            <span>Documents</span>
            <strong>{loading ? "—" : documentCount}</strong>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Dashboard;
