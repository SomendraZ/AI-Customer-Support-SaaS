import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import AgentCard from "../components/AgentCard";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import type { Agent } from "../types/agent";

const Agents = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const canManage = user?.role === "owner" || user?.role === "admin";

  const fetchAgents = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/agents");

      setAgents(response.data.agents);
    } catch (error: any) {
      setError(error.response?.data?.message || "Failed to load agents");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgents();
  }, []);

  const handleDelete = async (agent: Agent) => {
    const confirmed = window.confirm(`Delete "${agent.name}"?`);

    if (!confirmed) {
      return;
    }

    try {
      await api.delete(`/agents/${agent._id}`);

      setAgents((currentAgents) =>
        currentAgents.filter((item) => item._id !== agent._id),
      );
    } catch (error: any) {
      alert(error.response?.data?.message || "Failed to delete agent");
    }
  };

  const handleToggleStatus = async (agent: Agent) => {
    const newStatus = agent.status === "active" ? "inactive" : "active";

    try {
      const response = await api.patch(`/agents/${agent._id}`, {
        status: newStatus,
      });

      setAgents((currentAgents) =>
        currentAgents.map((item) =>
          item._id === agent._id ? response.data.agent : item,
        ),
      );
    } catch (error: any) {
      alert(error.response?.data?.message || "Failed to update agent");
    }
  };

  const handleEdit = (agent: Agent) => {
    navigate(`/agents/${agent._id}/edit`);
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>AI Agents</h1>

          <p>Create and manage your company's AI support agents.</p>
        </div>

        {canManage && (
          <button
            className="primary-button"
            onClick={() => navigate("/agents/new")}
          >
            + Create Agent
          </button>
        )}
      </div>

      {error && <div className="error-message">{error}</div>}

      {loading ? (
        <div className="loading">Loading agents...</div>
      ) : agents.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🤖</div>

          <h2>No AI agents yet</h2>

          <p>Create your first AI support agent to get started.</p>

          {canManage && (
            <button
              className="primary-button"
              onClick={() => navigate("/agents/new")}
            >
              Create Your First Agent
            </button>
          )}
        </div>
      ) : (
        <div className="agents-grid">
          {agents.map((agent) => (
            <AgentCard
              key={agent._id}
              agent={agent}
              canManage={canManage}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onToggleStatus={handleToggleStatus}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Agents;
